#!/usr/bin/env python3
"""Verify that Zensical rendered every Markdown source page."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def expected_output(source: Path, docs_dir: Path, site_dir: Path) -> Path:
    """Map a Markdown source to Zensical's directory-style HTML output."""
    relative = source.relative_to(docs_dir)
    if relative.name == "index.md":
        return site_dir / relative.parent / "index.html"
    return site_dir / relative.with_suffix("") / "index.html"


def verify_build_output(docs_dir: Path, site_dir: Path) -> bool:
    """Return whether every Markdown source has a non-empty HTML page."""
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

    print(f"Verified {len(sources)} rendered pages in {site_dir}.")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("docs_dir", type=Path, help="Locale Markdown source tree")
    parser.add_argument("site_dir", type=Path, help="Locale HTML output tree")
    args = parser.parse_args()
    return 0 if verify_build_output(args.docs_dir, args.site_dir) else 1


if __name__ == "__main__":
    raise SystemExit(main())
