#!/usr/bin/env python3
"""Order every Blog table that shows a rating from highest to lowest.

A table qualifies when its header has a Rating/Calificación column. Rows are
sorted by that column (the `data-rating` attribute when present, otherwise
the cell's leading number); equal ratings keep their authored order. Run with
`--check` to fail instead of rewriting when a table is out of order.
"""
import re
import sys
from pathlib import Path

HEADERS = {"rating", "calificación"}
ROW = re.compile(r"^(\s*)\|")


def cells(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def score(cell):
    match = re.search(r'data-rating="([\d.]+)"', cell) or re.match(r"\s*([\d]+(?:[.,]\d+)?)", cell)
    if not match:
        raise ValueError(f"No rating in cell: {cell[:60]}")
    return float(match.group(1).replace(",", "."))


def sort_tables(text):
    lines = text.split("\n")
    out, i = [], 0
    while i < len(lines):
        if ROW.match(lines[i]) and i + 1 < len(lines) and re.match(r"^\s*\|\s*:?-", lines[i + 1]):
            start = i
            while i < len(lines) and ROW.match(lines[i]):
                i += 1
            block = lines[start:i]
            header = [c.lower() for c in cells(block[0])]
            column = next((n for n, c in enumerate(header) if c in HEADERS), None)
            if column is None:
                out.extend(block)
                continue
            rows = block[2:]
            rows = sorted(rows, key=lambda row: -score(cells(row)[column]))
            out.extend(block[:2] + rows)
        else:
            out.append(lines[i])
            i += 1
    return "\n".join(out)


def main(check):
    stale = []
    for path in sorted(Path("content").glob("*/blog/*.md")):
        text = path.read_text(encoding="utf-8")
        ordered = sort_tables(text)
        if ordered != text:
            stale.append(path)
            if not check:
                path.write_text(ordered, encoding="utf-8")
    verb = "Out of order" if check else "Sorted"
    for path in stale:
        print(f"{verb}: {path}")
    return 1 if check and stale else 0


if __name__ == "__main__":
    sys.exit(main("--check" in sys.argv[1:]))
