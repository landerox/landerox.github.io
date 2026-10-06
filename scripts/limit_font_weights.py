#!/usr/bin/env python3
"""Limit Inter's weight axis to the 400–700 the site uses.

Run once per upstream Inter update, on the Google Fonts latin and latin-ext
files, from the repository root:

    uv run --no-project --with fonttools==4.66.1 --with brotli==1.2.0 \
        python scripts/limit_font_weights.py

Coverage (the cmap) and family names are unchanged; only the 100–399 and
701–900 masters go, which cut the latin file from 47.1 KB to 35.3 KB. Outfit
is left alone: instancing it grew the file. Rationale: docs/design.md § 5.
"""
import pathlib
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTS = pathlib.Path("content/en/assets/fonts")
FILES = ("Inter-Variable-latin.woff2", "Inter-Variable-latin-ext.woff2")
WEIGHTS = (400, 700)


def main():
    for name in FILES:
        path = FONTS / name
        before = path.stat().st_size
        font = TTFont(path)
        cmap = font.getBestCmap()
        limited = instancer.instantiateVariableFont(font, {"wght": WEIGHTS}, updateFontNames=False)
        if limited.getBestCmap() != cmap:
            sys.exit(f"{name}: coverage changed; refusing to write.")
        limited.flavor = "woff2"
        limited.save(path)
        print(f"{name}: {before / 1024:.1f} KB -> {path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
