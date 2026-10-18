#!/usr/bin/env python3
"""Enforce that maintenance automation reports without mutating the repo."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UV_REPORT_WORKFLOW = ROOT / ".github" / "workflows" / "uv-report.yml"
LINK_REPORT_WORKFLOW = ROOT / ".github" / "workflows" / "link-report.yml"
BLOG_VERSION_WORKFLOW = ROOT / ".github" / "workflows" / "blog-version-report.yml"
FORBIDDEN_PATHS = (
    ROOT / ".github" / "dependabot.yml",
    ROOT / ".github" / "dependabot.yaml",
    ROOT / ".github" / "workflows" / "uv-upgrade.yml",
    ROOT / ".github" / "workflows" / "uv-upgrade.yaml",
    ROOT / ".github" / "workflows" / "links.yml",
    ROOT / ".github" / "workflows" / "links.yaml",
)

COMMON_FORBIDDEN_PATTERNS = (
    (
        re.compile(r"(?mi)^\s*(?:permissions:\s*write-all|[\w-]+:\s*write)\s*(?:#.*)?$"),
        "a write permission",
    ),
    (
        re.compile(r"(?mi)^\s*(?:persist-credentials:\s*true|(?:github-)?token:|ssh-key:)"),
        "persisted or explicit credentials",
    ),
    (
        re.compile(r"(?i)\$\{\{\s*(?:secrets(?:\.|\[)|github\.token)|\b(?:GH|GITHUB)_TOKEN\b"),
        "a secret or GitHub token",
    ),
    (
        re.compile(r"(?i)\bcreate-pull-request\b"),
        "a pull-request creation action",
    ),
    (
        re.compile(
            r"(?i)\bgit\s+(?:push|commit|branch|checkout\s+-b|switch\s+-c)\b"
        ),
        "a git mutation command",
    ),
    (re.compile(r"(?i)\bgh\s+pr\b"), "a GitHub CLI pull-request command"),
    (
        re.compile(r"(?i)\b(?:gh\s+api|curl)\b"),
        "a direct API command",
    ),
)

LINK_FORBIDDEN_PATTERNS = (
    (re.compile(r"(?i)\bcreate-issue-from-file\b"), "an issue creation action"),
    (re.compile(r"(?i)\bgh\s+issue\b"), "a GitHub CLI issue command"),
)


def top_level_permissions(source: str) -> list[str] | None:
    """Return the single top-level permissions block, excluding comments."""

    lines = source.splitlines()
    indexes = [index for index, line in enumerate(lines) if line == "permissions:"]
    if len(indexes) != 1:
        return None

    entries: list[str] = []
    for line in lines[indexes[0] + 1 :]:
        if line and not line[0].isspace():
            break
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            entries.append(stripped)
    return entries


def read_only_errors(name: str, source: str) -> list[str]:
    """Rules every report workflow shares: one read permission, no credentials."""

    errors: list[str] = []
    if top_level_permissions(source) != ["contents: read"]:
        errors.append(f"{name} must have exactly: permissions / contents: read")

    if re.search(r"(?m)^[ \t]+permissions\s*:", source):
        errors.append(f"{name} must not override permissions at job level")

    checkouts = source.count("uses: actions/checkout@")
    if not checkouts or source.count("persist-credentials: false") != checkouts:
        errors.append(f"{name}: every checkout must set persist-credentials: false")
    return errors


def forbidden_errors(name: str, source: str, patterns) -> list[str]:
    return [
        f"{name} contains {description}"
        for pattern, description in patterns
        if pattern.search(source)
    ]


def main() -> int:
    """Validate the repository's report-only maintenance automation policy."""

    errors: list[str] = []

    for path in FORBIDDEN_PATHS:
        if path.exists():
            errors.append(f"forbidden automation file exists: {path.relative_to(ROOT)}")

    if not UV_REPORT_WORKFLOW.is_file():
        errors.append(
            f"required report workflow is missing: {UV_REPORT_WORKFLOW.relative_to(ROOT)}"
        )
    else:
        source = UV_REPORT_WORKFLOW.read_text(encoding="utf-8")
        errors.extend(read_only_errors("uv-report.yml", source))
        errors.extend(forbidden_errors("uv-report.yml", source, COMMON_FORBIDDEN_PATTERNS))

    if not LINK_REPORT_WORKFLOW.is_file():
        errors.append(
            f"required report workflow is missing: {LINK_REPORT_WORKFLOW.relative_to(ROOT)}"
        )
    else:
        source = LINK_REPORT_WORKFLOW.read_text(encoding="utf-8")
        errors.extend(read_only_errors("link-report.yml", source))

        if source.count("format: markdown") != 1:
            errors.append("link-report.yml must produce one Markdown report")

        if source.count("jobSummary: true") != 1:
            errors.append("link-report.yml must publish one job summary")

        if source.count("if: always()") != 1 or source.count(
            '>> "$GITHUB_STEP_SUMMARY"'
        ) != 1:
            errors.append("link-report.yml must retain its always-run summary fallback")

        if source.count("fail: true") != 1:
            errors.append(
                "link-report.yml must fail its check when Lychee reports an error"
            )

        errors.extend(
            forbidden_errors(
                "link-report.yml",
                source,
                (*COMMON_FORBIDDEN_PATTERNS, *LINK_FORBIDDEN_PATTERNS),
            )
        )

    if not BLOG_VERSION_WORKFLOW.is_file():
        errors.append(
            f"required report workflow is missing: {BLOG_VERSION_WORKFLOW.relative_to(ROOT)}"
        )
    else:
        source = BLOG_VERSION_WORKFLOW.read_text(encoding="utf-8")
        errors.extend(read_only_errors("blog-version-report.yml", source))

        # Tags are read through plain Git transport, so the report needs no
        # credentials, and stale pins never open an issue or change a file.
        if "scripts/blog_versions.py --report" not in source or "--apply" in source:
            errors.append("blog-version-report.yml must only run the read-only report")

        if source.count("if: always()") != 1 or source.count(
            '>> "$GITHUB_STEP_SUMMARY"'
        ) != 1:
            errors.append(
                "blog-version-report.yml must retain its always-run summary fallback"
            )

        errors.extend(
            forbidden_errors(
                "blog-version-report.yml",
                source,
                (*COMMON_FORBIDDEN_PATTERNS, *LINK_FORBIDDEN_PATTERNS),
            )
        )

    if errors:
        print("Maintenance automation must remain report-only:")
        for error in errors:
            print(f"- {error}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
