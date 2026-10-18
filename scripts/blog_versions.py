#!/usr/bin/env python3
"""Check and report the versions pinned by the Blog comparison articles.

Each reviewed tool links to `github.com/<owner>/<repo>/tree/<tag>` or
`/releases/tag/<tag>`, and its license evidence to `/blob/<tag>/<path>`.

    --check          offline consistency; the pre-commit hook
    --report         newest tag per repository through `git ls-remote`,
                     without credentials, so the scheduled workflow can run it
    --report --api   local only: confirms each newer tag against published
                     releases and adds dates and activity, through `gh`
    --apply          local only: rewrite stale pins in both locales, to
                     confirmed releases only

A tag is not always a published release, so the scheduled report names
candidates. Read the upstream release notes before changing what an article
recommends: `--apply` rewrites URLs and labels, never dates or prose.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ("en", "es")

LINK = re.compile(
    r"\[(?P<text>[^\]]*)\]\(\s*https://github\.com/(?P<repo>[\w.-]+/[\w.-]+)/"
    r"(?P<kind>tree|releases/tag|blob)/(?P<rest>[^)\s]+)\)"
)
# Refs an article links on purpose without reviewing that version: a
# maintained branch and a release announcement. Every other ref with a digit
# is a pin.
UNPINNED = {("dbt-labs/dbt", "1.latest"), ("kestra-io/kestra", "v2.0.0")}

STAMP = re.compile(r"^(?P<prefix>.*?)(?P<stamp>\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)$")
DOTTED = re.compile(r"^(?P<prefix>.*?)(?P<version>\d+(?:\.\d+)+)(?P<suffix>(?:[^\d.].*)?)$")
PLAIN = re.compile(r"^(?P<prefix>\D*)(?P<version>\d+)(?P<suffix>\D*)$")
TEXT_VERSION = re.compile(r"(?<![\w.])v?(\d+(?:\.\d+)+)")

# Stable-tag conventions that a pin's own shape cannot express.
STABLE = {
    # x.2.z is a stable release; x.1.z is a release candidate.
    "ceph/ceph": lambda version: len(version) == 3 and version[1] == 2,
    # v1.* tags are the paid edition and four-part tags are internal builds.
    "metabase/metabase": lambda version: len(version) == 3 and version[0] == 0,
    # v1.* tags version the stable Go modules, not the Collector release.
    "open-telemetry/opentelemetry-collector": lambda version: version[0] == 0,
}

# Projects whose GitHub release page trails their documented releases, so
# their tags are taken as published. StarRocks' release notes listed 4.1.4 to
# 4.1.6 on 2026-10-13 while its newest GitHub release was 4.1.3.
RELEASES_BY_TAG = {"StarRocks/starrocks"}

# Tags carry no date here. A first component this far above the pin's is an
# old tag from another numbering scheme (Superset's 2020.51.1, Dagster's
# 20190509), not a newer release.
MAX_MAJOR_JUMP = 2
# Newer tags kept per pin, to find the newest one published as a release.
CONFIRMED = 6

MONTHS = {
    "en": ("January", "February", "March", "April", "May", "June", "July",
           "August", "September", "October", "November", "December"),
    "es": ("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
           "agosto", "septiembre", "octubre", "noviembre", "diciembre"),
}
REVIEW_MONTH = {
    "en": re.compile(r"(?:Sources reviewed:|Scored in)\s+(\w+) (\d{4})"),
    "es": re.compile(r"(?:Fuentes revisadas:|Puntuado en)\s+(\w+) de (\d{4})"),
}
REVIEWED = re.compile(r"^reviewed:\s*(\d{4})-(\d{2})-\d{2}\s*$", re.M)


@dataclass(frozen=True)
class Link:
    article: str
    line: int
    repo: str
    kind: str  # "tree", "tag" or "blob"
    ref: str  # decoded
    raw_ref: str  # as written in the URL
    text: str


@dataclass(frozen=True)
class Shape:
    """A tag split into what stays fixed and what orders it."""

    prefix: str
    version: tuple[int, ...] | str
    suffix: str
    token: str  # the version as written, for rewriting


def parse_tag(tag: str) -> Shape | None:
    """Return the shape of a version tag, or None when it carries no version."""

    match = STAMP.match(tag)
    if match:
        return Shape(match["prefix"], match["stamp"], "", match["stamp"])
    match = DOTTED.match(tag) or PLAIN.match(tag)
    if not match:
        return None
    version = tuple(int(part) for part in match["version"].split("."))
    return Shape(match["prefix"], version, match["suffix"], match["version"])


def newer_tags(repo: str, pin: str, tags: list[str], same_major: bool = False) -> list[str]:
    """Tags newer than the pin with its prefix and suffix, newest first."""

    shape = parse_tag(pin)
    if shape is None:
        return []
    stable = STABLE.get(repo)
    newer: dict[str, tuple[int, ...] | str] = {}
    for tag in tags:
        other = parse_tag(tag)
        if other is None or (other.prefix, other.suffix) != (shape.prefix, shape.suffix):
            continue
        if isinstance(other.version, str) != isinstance(shape.version, str):
            continue
        if isinstance(other.version, tuple):
            if stable and not stable(other.version):
                continue
            if same_major and other.version[0] != shape.version[0]:
                continue
            if other.version[0] - shape.version[0] > MAX_MAJOR_JUMP:
                continue
        if other.version > shape.version:
            newer[tag] = other.version
    return sorted(newer, key=newer.__getitem__, reverse=True)


def newest_tag(repo: str, pin: str, tags: list[str], same_major: bool = False) -> str | None:
    """Newest tag with the pin's shape; None when the pin carries no version."""

    if parse_tag(pin) is None:
        return None
    return (newer_tags(repo, pin, tags, same_major) or [pin])[0]


def change_kind(old: str, new: str) -> str:
    before, after = parse_tag(old), parse_tag(new)
    if not before or not after or isinstance(before.version, str) or isinstance(after.version, str):
        return "newer"
    for index, name in enumerate(("major", "minor")):
        if before.version[index:index + 1] != after.version[index:index + 1]:
            return name
    return "patch"


def link_ref(match: re.Match[str]) -> tuple[str, str]:
    """Kind and raw ref of a matched link, without its path or fragment."""

    kind = {"releases/tag": "tag"}.get(match["kind"], match["kind"])
    rest = re.split(r"[#?]", match["rest"], maxsplit=1)[0]
    # A release tag may contain slashes; a tree or blob URL continues with a
    # path after its ref.
    return kind, rest if kind == "tag" else rest.split("/", 1)[0]


def article_links(path: Path) -> list[Link]:
    """Every pinned GitHub link of one article, in document order."""

    text = path.read_text(encoding="utf-8")
    found = []
    for match in LINK.finditer(text):
        kind, raw_ref = link_ref(match)
        ref = unquote(raw_ref)
        if not re.search(r"\d", ref) or (match["repo"], ref) in UNPINNED:
            continue
        line = text.count("\n", 0, match.start()) + 1
        label = " ".join(match["text"].split())
        found.append(Link(path.name, line, match["repo"], kind, ref, raw_ref, label))
    return found


def blog_articles(root: Path, locale: str) -> list[Path]:
    return sorted(p for p in (root / "content" / locale / "blog").glob("*.md") if p.name != "index.md")


def version_pins(links: list[Link]) -> dict[str, set[str]]:
    """Refs that state the reviewed version of each repository in one article."""

    pins: dict[str, set[str]] = {}
    for link in links:
        if link.kind != "blob":
            pins.setdefault(link.repo, set()).add(link.ref)
    return pins


def check(root: Path = ROOT) -> list[str]:
    """Offline consistency errors across both locales."""

    errors: list[str] = []
    by_locale: dict[str, dict[str, list[Link]]] = {}
    for locale in LOCALES:
        by_locale[locale] = {}
        for path in blog_articles(root, locale):
            links = article_links(path)
            by_locale[locale][path.name] = links
            where = f"content/{locale}/blog/{path.name}"
            pins = version_pins(links)
            for repo, refs in sorted(pins.items()):
                majors = [s.version[0] for s in map(parse_tag, sorted(refs)) if s and isinstance(s.version, tuple)]
                if len(majors) != len(set(majors)):
                    errors.append(
                        f"{where}: {repo} is pinned to {', '.join(sorted(refs))}; one "
                        "reviewed version per release line"
                    )
            for link in links:
                if link.kind == "blob" and link.repo in pins and link.ref not in pins[link.repo]:
                    expected = ", ".join(sorted(pins[link.repo]))
                    errors.append(
                        f"{where}:{link.line}: {link.repo} file link is pinned to "
                        f"{link.ref}, but the article reviews {expected}"
                    )
                shape = parse_tag(link.ref)
                written = TEXT_VERSION.findall(link.text)
                if (link.kind != "blob" and shape and written and not isinstance(shape.version, str)
                        and not any(shape.token == v or shape.token.startswith(v + ".") for v in written)):
                        errors.append(
                            f"{where}:{link.line}: link text \"{link.text}\" does not "
                            f"name the pinned version {shape.token}"
                        )
            errors.extend(review_month_errors(path, locale, where))
    for name in sorted(set(by_locale["en"]) | set(by_locale["es"])):
        pins_en = Counter((link.repo, link.kind, link.ref) for link in by_locale["en"].get(name, []))
        pins_es = Counter((link.repo, link.kind, link.ref) for link in by_locale["es"].get(name, []))
        for repo, kind, ref in sorted((pins_en - pins_es) + (pins_es - pins_en)):
            errors.append(f"blog/{name}: {repo} {kind} {ref} is not pinned identically in EN and ES")
    return errors


def review_month_errors(path: Path, locale: str, where: str) -> list[str]:
    text = path.read_text(encoding="utf-8")
    reviewed = REVIEWED.search(text)
    if not reviewed:
        return [f"{where}: no `reviewed: YYYY-MM-DD` front matter"]
    expected = (MONTHS[locale][int(reviewed[2]) - 1], reviewed[1])
    errors = []
    for match in REVIEW_MONTH[locale].finditer(text):
        if (match[1], match[2]) != expected:
            line = text.count("\n", 0, match.start()) + 1
            errors.append(
                f"{where}:{line}: shows {match[1]} {match[2]}, but `reviewed` is "
                f"{expected[0]} {expected[1]}"
            )
    return errors


def remote_tags(repo: str, attempts: int = 2) -> list[str] | None:
    """Tag names of a public repository, read without credentials."""

    command = [
        "git", "-c", "credential.helper=", "ls-remote", "--tags", "--refs",
        f"https://github.com/{repo}.git",
    ]
    environment = {**os.environ, "GIT_TERMINAL_PROMPT": "0"}
    for _ in range(attempts):
        try:
            result = subprocess.run(
                command, capture_output=True, text=True, timeout=30, env=environment, check=False
            )
        except subprocess.TimeoutExpired:
            continue
        if result.returncode == 0:
            return [line.split("refs/tags/", 1)[1] for line in result.stdout.splitlines() if "refs/tags/" in line]
    return None


@dataclass(frozen=True)
class Finding:
    article: str
    repo: str
    pinned: str
    newest: str | None  # None when the repository could not be read
    candidates: tuple[str, ...] = ()  # newer tags, newest first
    unreleased: str = ""  # a newer tag that upstream has not published


def findings(root: Path = ROOT, fetch=remote_tags) -> list[Finding]:
    """Compare every pin of the English articles with the newest upstream tag."""

    wanted: list[tuple[str, str, str, bool]] = []
    for path in blog_articles(root, "en"):
        links = article_links(path)
        pins = version_pins(links)
        # A file link without a version pin of its own still names a version.
        for link in links:
            if link.kind == "blob" and link.repo not in pins:
                pins.setdefault(link.repo, set()).add(link.ref)
        for repo, refs in sorted(pins.items()):
            majors = {s.version[0] for s in map(parse_tag, refs) if s and isinstance(s.version, tuple)}
            for ref in sorted(refs):
                # Two reviewed lines of one project each follow their own major.
                wanted.append((path.name, repo, ref, len(majors) > 1))
    repos = sorted({repo for _, repo, _, _ in wanted})
    with ThreadPoolExecutor(max_workers=6) as pool:
        tags = dict(zip(repos, pool.map(fetch, repos), strict=True))
    result = []
    for article, repo, ref, same_major in wanted:
        known = tags[repo]
        if known is None:
            result.append(Finding(article, repo, ref, None))
            continue
        newer = tuple(newer_tags(repo, ref, known, same_major)[:CONFIRMED])
        result.append(Finding(article, repo, ref, newer[0] if newer else ref, newer))
    return result


def confirm(results: list[Finding], details: dict[str, dict]) -> list[Finding]:
    """Keep only versions upstream has published as a release.

    A project that publishes its pinned version as a GitHub release is held
    to that: a newer tag without a release is not out yet. A project that
    releases by tag alone (Ceph, Swift, pgvector) is taken at its tags.
    """

    confirmed = []
    for item in results:
        released = details.get(item.repo, {}).get("released")
        by_tag = released is None or item.pinned not in released or item.repo in RELEASES_BY_TAG
        if by_tag or not item.candidates:
            confirmed.append(item)
            continue
        newest = next((tag for tag in item.candidates if tag in released), item.pinned)
        pending = item.candidates[0] if item.candidates[0] != newest else ""
        confirmed.append(Finding(item.article, item.repo, item.pinned, newest, item.candidates, pending))
    return confirmed


def report(results: list[Finding], details: dict[str, dict] | None = None) -> str:
    stale = [f for f in results if f.newest and f.newest != f.pinned]
    unreachable = [f for f in results if f.newest is None]
    lines = [
        "## Blog version report",
        "",
        f"{len(results)} pins checked on {date.today().isoformat()}: {len(stale)} behind, "
        f"{len(results) - len(stale) - len(unreachable)} current, {len(unreachable)} unreadable.",
        "",
        "> Read-only report: no file, branch, issue or pull request was changed.",
        ("> Newer tags were confirmed against published releases." if details else
         "> Tags are read without credentials; a tag is not always a published release."),
    ]
    if stale:
        released = " Released |" if details else ""
        lines += ["", f"| Article | Repository | Pinned | Newest tag | Change |{released}",
                  f"| :--- | :--- | :--- | :--- | :--- |{' :--- |' if details else ''}"]
        for item in stale:
            when = ""
            if details:
                when = f" {details.get(item.repo, {}).get('dates', {}).get(item.newest, '—')} |"
            lines.append(
                f"| {item.article.removesuffix('.md')} | {item.repo} | `{item.pinned}` | "
                f"`{item.newest}` | {change_kind(item.pinned, item.newest)} |{when}"
            )
    pending = sorted({(f.repo, f.unreleased) for f in results if f.unreleased})
    if pending:
        lines += ["", "Tagged upstream, not published as a release yet: "
                  + ", ".join(f"{repo} `{tag}`" for repo, tag in pending) + "."]
    if unreachable:
        lines += ["", "Unreadable repositories: " + ", ".join(sorted({f.repo for f in unreachable})) + "."]
    if details:
        lines += rubric_notes(results, details)
    return "\n".join(lines) + "\n"


def rubric_notes(results: list[Finding], details: dict[str, dict]) -> list[str]:
    """Maintenance facts the rating rubric depends on."""

    today = date.today()
    notes = []
    for repo in sorted({f.repo for f in results}):
        info = details.get(repo)
        if not info:
            continue
        newest = max((f.newest or f.pinned for f in results if f.repo == repo), key=lambda t: info["dates"].get(t, ""))
        released = info["dates"].get(newest)
        facts = []
        if info["archived"]:
            facts.append("archived upstream (rating cap 1)")
        if released:
            age = today - date.fromisoformat(released)
            if age > timedelta(days=548):
                facts.append(f"no newer tag since {released}: over 18 months (cap 2)")
            elif age > timedelta(days=183):
                facts.append(f"newest tag {released}: over 6 months (maintenance 0.5)")
            elif age > timedelta(days=153):
                facts.append(f"newest tag {released}: crosses 6 months within 30 days")
        if info["commits"] is not None and info["commits"] < 100:
            facts.append(f"{info['commits']} commits in 90 days")
        if facts:
            notes.append(f"- {repo}: " + "; ".join(facts) + ".")
    return ["", "### Rubric thresholds", "", *notes] if notes else []


def api_details(results: list[Finding]) -> dict[str, dict]:
    """Tag dates, archive state and recent activity through the `gh` CLI."""

    since = (date.today() - timedelta(days=90)).isoformat() + "T00:00:00Z"
    tags: dict[str, set[str]] = {}
    for item in results:
        tags.setdefault(item.repo, set()).update((item.pinned, *item.candidates))
    details: dict[str, dict] = {}
    repos = sorted(tags)
    for start in range(0, len(repos), 10):
        chunk = repos[start:start + 10]
        fields = []
        for index, repo in enumerate(chunk):
            owner, name = repo.split("/")
            refs = " ".join(
                f"t{n}: ref(qualifiedName: {json.dumps('refs/tags/' + tag)}) {{ target {{ ... on Commit "
                f"{{ committedDate }} ... on Tag {{ target {{ ... on Commit {{ committedDate }} }} }} }} }} "
                f"p{n}: release(tagName: {json.dumps(tag)}) {{ isDraft isPrerelease }}"
                for n, tag in enumerate(sorted(tags[repo]))
            )
            fields.append(
                f"r{index}: repository(owner: {json.dumps(owner)}, name: {json.dumps(name)}) {{ isArchived "
                f"defaultBranchRef {{ target {{ ... on Commit {{ history(since: {json.dumps(since)}) "
                f"{{ totalCount }} }} }} }} {refs} }}"
            )
        query = "query { " + " ".join(fields) + " }"
        result = subprocess.run(
            ["gh", "api", "graphql", "-f", f"query={query}"], capture_output=True, text=True, check=False
        )
        payload = json.loads(result.stdout or "{}")
        # Without confirmed releases, --apply would take unpublished tags.
        if result.returncode or payload.get("errors"):
            raise SystemExit(f"gh api graphql failed: {result.stderr.strip() or payload.get('errors')}")
        data = payload.get("data") or {}
        for index, repo in enumerate(chunk):
            node = data.get(f"r{index}")
            if not node:
                continue
            dates, released = {}, set()
            for n, tag in enumerate(sorted(tags[repo])):
                target = (node.get(f"t{n}") or {}).get("target") or {}
                stamp = target.get("committedDate") or (target.get("target") or {}).get("committedDate")
                if stamp:
                    dates[tag] = stamp[:10]
                release = node.get(f"p{n}")
                if release and not release["isDraft"] and not release["isPrerelease"]:
                    released.add(tag)
            history = ((node.get("defaultBranchRef") or {}).get("target") or {}).get("history") or {}
            details[repo] = {
                "archived": node["isArchived"], "commits": history.get("totalCount"),
                "dates": dates, "released": released,
            }
    return details


def apply(results: list[Finding], root: Path = ROOT) -> list[str]:
    """Rewrite stale pins in both locales; return the lines left to review."""

    review: list[str] = []
    for item in (f for f in results if f.newest and f.newest != f.pinned):
        old, new = parse_tag(item.pinned), parse_tag(item.newest)
        if not old or not new:
            continue
        for locale in LOCALES:
            path = root / "content" / locale / "blog" / item.article
            text = path.read_text(encoding="utf-8")

            def rewrite(match: re.Match[str], item=item, old=old, new=new) -> str:
                _, raw_ref = link_ref(match)
                if match["repo"] != item.repo or unquote(raw_ref) != item.pinned:
                    return match[0]
                head, _, tail = raw_ref.rpartition(old.token)
                label = re.sub(rf"(?<![\d.]){re.escape(old.token)}(?![\d.])", new.token, match["text"])
                url = match[0][match.start("repo") - match.start():]
                url = url.replace(f"/{raw_ref}", f"/{head}{new.token}{tail}", 1)
                return f"[{label}](https://github.com/{url}"

            updated = LINK.sub(rewrite, text)
            if updated == text:
                continue
            path.write_text(updated, encoding="utf-8")
            where = f"content/{locale}/blog/{item.article}"
            lines = updated.split("\n")
            for number, line in enumerate(lines, 1):
                names_old = re.search(rf"(?<![\d.]){re.escape(old.token)}(?![\d.])", line)
                near_link = item.repo in line or (number > 1 and item.repo in lines[number - 2])
                dated = re.search(r"\d{4}-\d{2}-\d{2}", line)
                if names_old or (near_link and dated):
                    review.append(f"{where}:{number}: {line.strip()[:110]}")
    return review


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true", help="offline consistency of the pins")
    mode.add_argument("--report", action="store_true", help="compare pins with upstream tags")
    mode.add_argument("--apply", action="store_true", help="rewrite stale pins in both locales")
    parser.add_argument("--api", action="store_true", help="add dates and activity through `gh` (local only)")
    parser.add_argument("--only", default="", help="comma-separated repositories to apply")
    options = parser.parse_args(argv)

    if options.check:
        errors = check()
        for error in errors:
            print(error, file=sys.stderr)
        if errors:
            print(f"\n{len(errors)} Blog version pin error(s).", file=sys.stderr)
        return 1 if errors else 0

    results = findings()
    details = None
    if options.api or options.apply:
        if shutil.which("gh") is None:
            print("--api and --apply need the GitHub CLI (`gh`) with a login.", file=sys.stderr)
            return 2
        details = api_details(results)
        results = confirm(results, details)
    if options.apply:
        only = {name for name in options.only.split(",") if name}
        chosen = [f for f in results if not only or f.repo in only]
        for line in apply(chosen):
            print(line)
        print("\nReview the lines above: dates and prose are not rewritten.", file=sys.stderr)
        return 0
    print(report(results, details), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
