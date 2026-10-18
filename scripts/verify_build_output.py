#!/usr/bin/env python3
"""Verify rendered Markdown pages and the local images they reference."""

from __future__ import annotations

import argparse
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class ImageSources(HTMLParser):
    """Collect image sources without checking metadata generated post-build."""

    def __init__(self) -> None:
        super().__init__()
        self.sources: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        if tag == "img":
            source = dict(attrs).get("src")
            if source and source.strip():
                self.sources.append(source.strip())


def expected_output(source: Path, docs_dir: Path, site_dir: Path) -> Path:
    """Map a Markdown source to Zensical's directory-style HTML output."""
    relative = source.relative_to(docs_dir)
    if relative.name == "index.md":
        return site_dir / relative.parent / "index.html"
    return site_dir / relative.with_suffix("") / "index.html"


def verify_build_output(
    docs_dir: Path, site_dir: Path, site_root: Path | None = None
) -> bool:
    """Check locale pages and resolve local image URLs against the public root."""
    sources = sorted(docs_dir.rglob("*.md"))
    if not sources:
        print(f"No Markdown sources found under {docs_dir}.", file=sys.stderr)
        return False

    expected = [expected_output(source, docs_dir, site_dir) for source in sources]
    missing = [
        output
        for output in expected
        if not output.is_file() or output.stat().st_size == 0
    ]

    if missing:
        print(
            f"Build output is incomplete: {len(missing)} of {len(sources)} "
            "expected pages are missing or empty:",
            file=sys.stderr,
        )
        for output in missing:
            print(f"- {output}", file=sys.stderr)
        return False

    root = (site_root if site_root is not None else site_dir).resolve()
    missing_images: list[tuple[Path, str, Path]] = []
    for output in expected:
        parser = ImageSources()
        parser.feed(output.read_text(encoding="utf-8"))
        for source in dict.fromkeys(parser.sources):
            url = urlsplit(source)
            if url.scheme or url.netloc or not url.path:
                continue
            path = unquote(url.path)
            target = (
                root / path.lstrip("/")
                if path.startswith("/")
                else output.parent / path
            ).resolve()
            if (
                not target.is_relative_to(root)
                or not target.is_file()
                or target.stat().st_size == 0
            ):
                missing_images.append((output, source, target))

    if missing_images:
        print(
            f"Build output has {len(missing_images)} unresolved local image "
            "references (missing, empty or outside the public root):",
            file=sys.stderr,
        )
        for output, source, target in missing_images:
            print(f"- {output}: {source!r} -> {target}", file=sys.stderr)
        return False

    print(
        f"Verified {len(sources)} rendered pages and their local images "
        f"in {site_dir}."
    )
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("docs_dir", type=Path, help="Locale Markdown source tree")
    parser.add_argument("site_dir", type=Path, help="Locale HTML output tree")
    parser.add_argument(
        "--site-root",
        type=Path,
        help="Public output root for /image URLs (defaults to site_dir)",
    )
    args = parser.parse_args()
    return (
        0
        if verify_build_output(args.docs_dir, args.site_dir, args.site_root)
        else 1
    )


if __name__ == "__main__":
    raise SystemExit(main())
