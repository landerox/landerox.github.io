# Task runner for landerox.github.io. `just` lists every recipe by group.
#
# Python tools run through uv (locked in uv.lock); the glossary build and the
# Node tests use the system Node.js LTS. Pinned versions and where each one is
# declared: docs/decisions.md § 14.

# Recipe-body comments document the recipe; they are not echoed when it runs.
set ignore-comments
set shell := ["bash", "-euo", "pipefail", "-c"]

# @lhci/cli release bundled by treosh/lighthouse-ci-action in quality.yml.
lhci := "@lhci/cli@0.15.1"

# List every recipe by group
default:
    @just --list --unsorted

# =============================================================================
# Development
# =============================================================================

alias serve := serve-en

# English dev server at http://127.0.0.1:8000
[group('develop')]
serve-en: sync-assets
    uv run zensical serve -f zensical.toml

# Spanish dev server at http://127.0.0.1:8001
[group('develop')]
serve-es: sync-assets
    uv run zensical serve -f zensical.es.toml -a 127.0.0.1:8001

# Open the English dev server in the default browser
[group('develop')]
open:
    xdg-open http://127.0.0.1:8000 2>/dev/null || open http://127.0.0.1:8000

# =============================================================================
# Build
# =============================================================================

# Copy the shared English assets into content/es/assets (generated, gitignored)
[group('build')]
sync-assets:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Synchronizing bilingual assets..."
    # Replace whole trees: a filename allowlist would silently drop new files.
    # Nothing under content/es/assets is tracked, so a fresh checkout has no parent.
    rm -rf content/es/assets/{stylesheets,javascripts,fonts,images}
    mkdir -p content/es/assets
    cp -r content/en/assets/{stylesheets,javascripts,fonts,images} content/es/assets/
    cp content/en/assets/glossary.json content/es/assets/glossary.json

# Build both locales into site/, verify the output and post-process it
[group('build')]
build: check-i18n check-glossary build-en build-es
    # Verify both trees together: a later locale build must not remove pages.
    uv run python scripts/verify_build_output.py content/en site
    uv run python scripts/verify_build_output.py content/es site/es --site-root site
    # GitHub Pages serves /404.html for every unknown path; the router sends
    # /es/* to /es/404/ and everything else to /404/.
    cp .config/404-router.html site/404.html
    uv run python scripts/post_build.py

# Build the English site into site/ (cleans it first) and verify the output
[group('build')]
build-en: sync-assets
    uv run zensical build -f zensical.toml --clean
    uv run python scripts/verify_build_output.py content/en site

# Build the Spanish site into site/es/ and verify the output
[group('build')]
build-es: sync-assets
    uv run zensical build -f zensical.es.toml --clean
    uv run python scripts/verify_build_output.py content/es site/es --site-root site

# Remove site/, build and lint caches, and stray Lighthouse Chrome profiles
[group('build')]
clean:
    #!/usr/bin/env bash
    set -euo pipefail
    rm -rf .cache site .ruff_cache .pytest_cache
    # `lhci` started by hand from the repository root on WSL leaves one
    # `C:\Users\…\lighthouse.<n>` profile per run here; `just lighthouse` does not.
    find . -maxdepth 1 -type d -name 'C:\\Users\\*\\lighthouse.*' -exec rm -rf {} +

# Clean, then build both locales
[group('build')]
rebuild: clean build

# =============================================================================
# Content
# =============================================================================

# Check EN/ES content and shared configuration symmetry (also a hook)
[group('content')]
check-i18n:
    uv run python scripts/check_i18n.py

# Regenerate the public glossary pages and acronym tooltips from glossary.json
[group('content')]
glossary:
    node scripts/build-glossary.mjs

# Fail on stale glossary output or invalid term relationships (also a hook)
[group('content')]
check-glossary:
    node scripts/build-glossary.mjs --check

# Order every Blog rating table from highest to lowest (ties keep their order)
[group('content')]
sort-ratings:
    uv run python scripts/sort_ratings.py

# Fail when a Blog rating table is out of descending order (also a hook)
[group('content')]
check-ratings:
    uv run python scripts/sort_ratings.py --check

# Report Blog pins that trail upstream tags, without credentials (--api adds release dates via gh)
[group('content')]
blog-versions *args:
    uv run python scripts/blog_versions.py --report {{ args }}

# Fail when Blog pins, license links or review months disagree (also a hook)
[group('content')]
check-blog-pins:
    uv run python scripts/blog_versions.py --check

# =============================================================================
# Quality
# =============================================================================

# Run every pre-commit hook on all tracked files (the command CI runs)
[group('quality')]
lint:
    uv run pre-commit run --all-files

# Run ESLint only
[group('quality')]
lint-js:
    uv run pre-commit run eslint --all-files

# Run Stylelint only
[group('quality')]
lint-css:
    uv run pre-commit run stylelint --all-files

# Run cspell only
[group('quality')]
spell:
    uv run pre-commit run cspell --all-files

# Audit the locked runtime Python dependencies for known vulnerabilities
[group('quality')]
audit:
    #!/usr/bin/env bash
    set -euo pipefail
    req=$(mktemp -t pip-audit-XXXXXX.txt)
    trap 'rm -f "$req"' EXIT
    uv export --frozen --format requirements-txt --no-dev --output-file "$req"
    # The export is hashed, so pip-audit checks the pins as written instead of
    # resolving them in a throwaway virtualenv. No --ignore-vuln entries: add
    # one only with its rationale beside it.
    uv run pip-audit --disable-pip --requirement "$req"

# Check outbound links in content/ with lychee (same config and inputs as CI)
[group('quality')]
links: sync-assets
    #!/usr/bin/env bash
    set -euo pipefail
    command -v lychee >/dev/null || { echo "lychee is not installed; see docs/runbook.md" >&2; exit 1; }
    lychee --config .config/lychee.toml --root-dir . 'content/**/*.md' content/en/assets/glossary.json

# =============================================================================
# Tests
# =============================================================================

# Run every offline test suite: workbench, site contracts and hook preparation
[group('test')]
test: test-workbench test-contracts test-hooks

# Unit-test the CLI, glossary, topic filters, the four tools and availability (Node)
[group('test')]
test-workbench:
    node --test scripts/*.test.mjs

# Test the bilingual configuration and Markdown contracts (also a hook)
[group('test')]
test-contracts:
    uv run python -m unittest discover -s scripts -p test_site_contracts.py

# Test the pre-commit environment preparation helper that CI uses
[group('test')]
test-hooks:
    uv run python -m unittest discover -s scripts -p test_install_precommit_hooks.py

# Install the Chromium release that the locked Playwright expects
[group('test')]
install-browser:
    uv run playwright install chromium

# Test browser interactions on a snapshot of the current build (run `just build` first)
[group('test')]
test-browser:
    uv run python scripts/test_browser.py

# Run Lighthouse CI with the CI configuration; reports in lhci-reports/ (set CHROME_PATH)
[group('test')]
lighthouse: build
    #!/usr/bin/env bash
    set -euo pipefail
    repo="$PWD"
    scratch="$(mktemp -d -t lhci-XXXXXXXX)"
    trap 'rm -rf "$scratch"' EXIT
    # Audit a snapshot, so a running dev server cannot rewrite site/ mid-run.
    cp -R "$repo/site" "$scratch/site"
    # Run from the scratch directory: on WSL, chrome-launcher creates one
    # `C:\Users\…\lighthouse.<n>` profile per run in the working directory.
    cd "$scratch"
    env -u TEMP -u TMP TMPDIR=/tmp npx --yes {{ lhci }} autorun \
        --config="$repo/.config/lighthouserc.json" \
        --collect.staticDistDir="$scratch/site" \
        --upload.outputDir="$repo/lhci-reports"

# =============================================================================
# Dependencies
# =============================================================================

# Install the locked Python environment, all dependency groups included
[group('dependencies')]
sync:
    uv sync --all-groups

# Upgrade every locked Python dependency, then sync (review uv.lock before committing)
[group('dependencies')]
update:
    uv lock --upgrade
    uv sync --all-groups

# List Python dependencies that have newer releases
[group('dependencies')]
outdated:
    uv tree --outdated

# Show the Python dependency tree
[group('dependencies')]
tree:
    uv tree

# =============================================================================
# Git hooks and commits
# =============================================================================

# Install the pre-commit and commit-msg hooks
[group('git')]
hooks-install:
    uv run pre-commit install

# Move hook revisions to their newest tags, kept as frozen commit SHAs
[group('git')]
hooks-update:
    #!/usr/bin/env bash
    set -euo pipefail
    # The newest gitleaks tag is not on its default branch, so autoupdate would
    # propose an older release: that pin moves by hand.
    args=()
    for repo in $(awk '$1 == "-" && $2 == "repo:" && $3 ~ /^https:/ && $3 !~ /gitleaks/ { print $3 }' .pre-commit-config.yaml); do
        args+=(--repo "$repo")
    done
    uv run pre-commit autoupdate --freeze "${args[@]}"

# Uninstall the git hooks
[group('git')]
hooks-uninstall:
    uv run pre-commit uninstall

# Guided Conventional Commit with the mandatory DCO sign-off
[group('git')]
commit:
    uv run cz commit -- -s

# =============================================================================
# Release
# =============================================================================
# CHANGELOG.md is a hand-written description of the current state; `bump`
# moves the version and creates the tag, never the changelog. See
# docs/decisions.md § 4.

# Preview the next SemVer bump without writing anything
[group('release')]
release-preview:
    uv run cz bump --dry-run

# Bump the version, commit it with a DCO sign-off and create the signed tag (push is manual)
[group('release')]
bump:
    #!/usr/bin/env bash
    set -euo pipefail
    old="$(uv run cz version --project)"
    # `cz bump` cannot sign off its own commit, so it only moves the version files.
    uv run cz bump --version-files-only --yes
    new="$(uv run cz version --project)"
    git add pyproject.toml uv.lock
    git commit -S -s -m "bump: version ${old} → ${new}"
    git tag -s "v${new}" -m "v${new}"

# =============================================================================
# Security
# =============================================================================

# Pin every GitHub Actions reference to a full commit SHA (rerun after editing workflows)
[group('security')]
pin-actions:
    #!/usr/bin/env bash
    set -euo pipefail
    command -v pinact >/dev/null || { echo "pinact is not installed; see docs/runbook.md" >&2; exit 1; }
    pinact run
