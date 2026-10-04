#!/usr/bin/env python3
import os
import re
import sys
import copy
import tomllib
from pathlib import Path

# Paths relative to the repository root
CONTENT_EN = "content/en"
CONTENT_ES = "content/es"


def configuration_errors(en_config, es_config):
    """Compare all shared settings, allowing only explicit locale differences."""
    errors = []
    configs = []

    def navigation(value):
        if isinstance(value, dict):
            return [navigation(item) for item in value.values()]
        if isinstance(value, list):
            return [navigation(item) for item in value]
        return value

    for locale, source in (("en", en_config), ("es", es_config)):
        config = copy.deepcopy(source)
        project = config["project"]
        if project.get("theme", {}).get("language") != locale:
            errors.append(f"Wrong theme language in {locale} configuration")
        if project.get("docs_dir") != f"content/{locale}":
            errors.append(f"Wrong docs_dir in {locale} configuration")
        if project.get("site_dir") != ("site" if locale == "en" else "site/es"):
            errors.append(f"Wrong site_dir in {locale} configuration")
        for key in ("copyright", "site_description", "docs_dir", "site_dir", "site_url"):
            project.pop(key, None)
        project["theme"].pop("language", None)
        # Acronym tooltips are the one locale-specific extension setting.
        snippets = project.get("markdown_extensions", {}).get("pymdownx", {}).get("snippets", {})
        if snippets.pop("auto_append", None) != [f"includes/{locale}/abbreviations.md"]:
            errors.append(f"Snippets auto_append must be the {locale} abbreviations file")
        for palette in project["theme"].get("palette", []):
            palette.get("toggle", {}).pop("name", None)
        project["nav"] = navigation(project.get("nav", []))
        configs.append(config)
    en_url = en_config["project"]["site_url"].rstrip("/")
    if es_config["project"]["site_url"].rstrip("/") != en_url + "/es":
        errors.append("Spanish site_url must be the English root plus /es/")

    def compare(left, right, prefix="config"):
        if isinstance(left, dict) and isinstance(right, dict):
            for key in sorted(left.keys() | right.keys()):
                compare(left.get(key), right.get(key), f"{prefix}.{key}")
        elif left != right:
            errors.append(f"Shared EN/ES setting differs: {prefix}")
    compare(*configs)
    return errors

def parse_markdown_file(filepath):
    """
    Parses a markdown file and extracts:
    1. Set of front-matter keys (top-level YAML keys).
    2. List of heading levels (e.g. [1, 2, 2, 3]).
    3. List of Zensical tab names (e.g. ["ADOPT", "TRIAL"]).
    """
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()

    # 1. Parse Front-matter
    front_matter_keys = set()
    front_matter_lines = []

    if lines and lines[0] == "---":
        for line in lines[1:]:
            if line == "---":
                break
            front_matter_lines.append(line)

    # Simple regex for top-level keys in YAML: e.g. "key:" or "  key:" (but let's focus on top-level keys)
    # Usually top-level keys are in the format: ^[a-zA-Z0-9_-]+:
    for line in front_matter_lines:
        match = re.match(r"^([a-zA-Z0-9_-]+):", line)
        if match:
            front_matter_keys.add(match.group(1))

    # 2 & 3. Parse Headings and Zensical Tabs
    heading_levels = []
    tabs = []

    fence = None
    for line in lines:
        marker = re.match(r"^\s*(`{3,}|~{3,})", line)
        if marker:
            run = marker.group(1)
            if fence is None:
                fence = run
            elif run[0] == fence[0] and len(run) >= len(fence):
                fence = None
            continue
        if fence:
            continue
        # Check for headings
        heading_match = re.match(r"^(#{1,6})\s", line)
        if heading_match:
            heading_levels.append(len(heading_match.group(1)))

        # Check for tabs: === "TAB_NAME" or === 'TAB_NAME'
        tab_match = re.match(r"^===\s*[\"']([^\"']+)[\"']", line)
        if tab_match:
            tabs.append(tab_match.group(1))

    return front_matter_keys, heading_levels, tabs

def check_i18n():
    en_files = []
    es_files = []

    # Gather all markdown files in content/en
    for root, _, files in os.walk(CONTENT_EN):
        for file in files:
            if file.endswith(".md"):
                rel_path = os.path.relpath(os.path.join(root, file), CONTENT_EN)
                en_files.append(rel_path)

    # Gather all markdown files in content/es
    for root, _, files in os.walk(CONTENT_ES):
        for file in files:
            if file.endswith(".md"):
                rel_path = os.path.relpath(os.path.join(root, file), CONTENT_ES)
                es_files.append(rel_path)

    with Path("zensical.toml").open("rb") as source:
        en_config = tomllib.load(source)
    with Path("zensical.es.toml").open("rb") as source:
        es_config = tomllib.load(source)
    errors = configuration_errors(en_config, es_config)

    # Check for missing ES counterparts
    for rel_path in en_files:
        es_path = os.path.join(CONTENT_ES, rel_path)
        if not os.path.exists(es_path):
            errors.append(f"Missing Spanish counterpart for: {os.path.join(CONTENT_EN, rel_path)}")
            continue

        en_path = os.path.join(CONTENT_EN, rel_path)

        # Parse files
        try:
            en_fm, en_headings, en_tabs = parse_markdown_file(en_path)
            es_fm, es_headings, es_tabs = parse_markdown_file(es_path)
        except Exception as e:
            errors.append(f"Error parsing files for {rel_path}: {e}")
            continue

        # Check front-matter symmetry
        if en_fm != es_fm:
            missing_in_es = en_fm - es_fm
            missing_in_en = es_fm - en_fm
            err_msg = f"Front-matter asymmetry in {rel_path}:"
            if missing_in_es:
                err_msg += f" keys missing in ES: {missing_in_es}"
            if missing_in_en:
                err_msg += f" keys missing in EN: {missing_in_en}"
            errors.append(err_msg)

        # Check headings sequence symmetry
        if en_headings != es_headings:
            errors.append(
                f"Heading level sequence mismatch in {rel_path}:\n"
                f"  EN headings: {en_headings}\n"
                f"  ES headings: {es_headings}"
            )

        # Check tab structure symmetry. Labels are compared by count, not
        # text, so Spanish pages can translate tab names ("Completed" →
        # "Completados") while the tab layout itself must stay identical.
        if len(en_tabs) != len(es_tabs):
            errors.append(
                f"Zensical tab count mismatch in {rel_path}:\n"
                f"  EN tabs ({len(en_tabs)}): {en_tabs}\n"
                f"  ES tabs ({len(es_tabs)}): {es_tabs}"
            )

    # Check for orphaned ES files
    for rel_path in es_files:
        en_path = os.path.join(CONTENT_EN, rel_path)
        if not os.path.exists(en_path):
            errors.append(f"Orphaned Spanish page: {os.path.join(CONTENT_ES, rel_path)}")

    if errors:
        print("=== i18n Symmetry Verification Failed ===", file=sys.stderr)
        for err in errors:
            print(f"- {err}", file=sys.stderr)
        return False

    print("=== i18n Symmetry Verification Succeeded ===")
    return True

if __name__ == "__main__":
    success = check_i18n()
    sys.exit(0 if success else 1)
