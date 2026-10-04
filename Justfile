# Justfile - Task runner for landerox.github.io

default:
    @just --list

# =============================================================================
# Development
# =============================================================================

# Start EN dev server (alias for serve-en)
serve: serve-en

# Synchronize Spanish assets from English assets (maintains DRY in Git, copies for Zensical)
sync-assets:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Synchronizing bilingual assets..."
    # Prune before copying, images included: the three trees below are
    # wholesale replacements, but images used to be copied one by one with
    # no prune, so an image deleted or renamed in the English tree survived
    # in the Spanish one forever.
    rm -rf content/es/assets/stylesheets
    rm -rf content/es/assets/javascripts
    rm -rf content/es/assets/fonts
    rm -rf content/es/assets/images
    mkdir -p content/es/assets/images
    cp -r content/en/assets/stylesheets content/es/assets/stylesheets
    cp -r content/en/assets/javascripts content/es/assets/javascripts
    cp -r content/en/assets/fonts content/es/assets/fonts
    cp content/en/assets/images/logo.svg content/es/assets/images/logo.svg
    cp content/en/assets/images/favicon.svg content/es/assets/images/favicon.svg
    cp content/en/assets/images/profile.webp content/es/assets/images/profile.webp
    cp content/en/assets/images/banner.svg content/es/assets/images/banner.svg
    cp content/en/assets/glossary.json content/es/assets/glossary.json

# EN dev server at http://127.0.0.1:8000
serve-en: sync-assets
    uv run zensical serve -f zensical.toml

# ES dev server at http://127.0.0.1:8001
serve-es: sync-assets
    uv run zensical serve -f zensical.es.toml -a localhost:8001

# Build EN + ES into site/
build: check-i18n check-glossary build-en build-es
    # Recheck both trees together. This catches a later locale build that
    # accidentally removes pages produced by the earlier dependency.
    uv run python3 scripts/verify_build_output.py content/en site
    uv run python3 scripts/verify_build_output.py content/es site/es
    # GitHub Pages serves /404.html for any unresolved path and is
    # locale-agnostic, so a copy of the EN 404 would show in English
    # even under /es/*. Replace Zensical's generic 404.html with a
    # tiny router that forwards /es/* errors to /es/404/ and everything
    # else to /404/. See .config/404-router.html.
    @cp .config/404-router.html site/404.html
    uv run python3 scripts/post_build.py


# The retry loop this recipe once needed ended with zensical/zensical#641,
# fixed in 0.0.58; the verifier stays as the guard.

# Build EN site (clears site/ first) and fail fast on incomplete output
build-en: sync-assets
    uv run zensical build -f zensical.toml --clean
    uv run python3 scripts/verify_build_output.py content/en site

# Build ES site into site/es/ with the same output verification.
build-es: sync-assets
    uv run zensical build -f zensical.es.toml --clean
    uv run python3 scripts/verify_build_output.py content/es site/es


# Remove site/, Python caches and stray Chrome profiles
clean:
    #!/usr/bin/env bash
    set -euo pipefail
    rm -rf .cache site .ruff_cache .pytest_cache
    # Safety net for `lhci` runs started by hand from the repo root on WSL:
    # chrome-launcher creates one literal `C:\Users\...\lighthouse.N`
    # profile per run relative to the working directory. `just lighthouse`
    # avoids them; .gitignore hides them; only this sweeps them.
    find . -maxdepth 1 -type d -name 'C:\\Users\\*\\lighthouse.*' -exec rm -rf {} +

# Clean caches and rebuild EN + ES
rebuild: clean build

# =============================================================================
# Quality Assurance
# =============================================================================

# Run all pre-commit hooks across the repo
lint:
    uv run pre-commit run --all-files

# Run ESLint on JavaScript files
lint-js:
    uv run pre-commit run eslint --all-files

# Run Stylelint on CSS files
lint-css:
    uv run pre-commit run stylelint --all-files

# Audit Python deps for known vulnerabilities (pip-audit)
audit:
    #!/usr/bin/env bash
    set -euo pipefail
    req=$(mktemp -t pip-audit-XXXXXX.txt)
    trap 'rm -f "$req"' EXIT
    uv export --frozen --format requirements-txt --no-dev --output-file "$req"
    # No --ignore-vuln entries. The PYSEC-2026-89 suppression carried here
    # since 2026-08 stopped matching anything once the lockfile moved past
    # the affected release, and a stale ignore silences the finding if it
    # ever returns. Add one back only with the rationale written beside it.
    uv run pip-audit --requirement "$req"

# Run cspell on all files
spell:
    uv run pre-commit run cspell --all-files

# Validate outbound links in content/ with lychee (same config and inputs as CI)
links: sync-assets
    lychee --config .config/lychee.toml --root-dir . 'content/**/*.md' content/en/assets/glossary.json

# Verify EN/ES content and shared configuration (same as the pre-commit hook)
check-i18n:
    uv run python scripts/check_i18n.py

# Regenerate the public glossary from its single bilingual catalog
glossary:
    node scripts/build-glossary.mjs

# Detect stale generated pages and invalid editorial relationships
check-glossary:
    node scripts/build-glossary.mjs --check

# Order every Blog rating table from highest to lowest (ties keep their order)
sort-ratings:
    uv run python3 scripts/sort_ratings.py

# Fail when a Blog rating table is out of descending order
check-ratings:
    uv run python3 scripts/sort_ratings.py --check

# Install the browser matching the Playwright version in uv.lock
install-browser:
    uv run playwright install chromium

# Audit interactions against a disposable snapshot of the current build
test-browser:
    uv run python scripts/test_browser.py

# Check utilities, glossary, SQL, topics, memory, failure, SLO/schema and schedule
test-workbench:
    node --test scripts/workbench.test.mjs scripts/comparison.test.mjs scripts/memory-planner.test.mjs scripts/tools-simulations.test.mjs scripts/decision-tools.test.mjs scripts/features.test.mjs

# The recipe below runs from a scratch directory on purpose: on WSL,
# chrome-launcher joins a Windows `AppData\Local` path (derived from PATH)
# with POSIX path.join and creates one `C:\Users\…\lighthouse.<n>` Chrome
# profile per run relative to the working directory — 114 of them per
# invocation when started from the repo root. Unsetting TEMP/TMP does not
# help. The @lhci/cli pin matches the release the CI action bundles; set
# CHROME_PATH to a Linux Chrome/Chromium binary. See docs/runbook.md.

# Lighthouse CI locally, same config and @lhci/cli release as CI (reports in lhci-reports/)
lighthouse: build
    #!/usr/bin/env bash
    set -euo pipefail
    repo="$PWD"
    scratch="$(mktemp -d -t lhci-XXXXXXXX)"
    trap 'rm -rf "$scratch"' EXIT
    # Audit a stable bilingual snapshot, even if a dev server rebuilds site/.
    cp -R "$repo/site" "$scratch/site"
    cd "$scratch"
    env -u TEMP -u TMP TMPDIR=/tmp npx --yes @lhci/cli@0.15.1 autorun \
        --config="$repo/.config/lighthouserc.json" \
        --collect.staticDistDir="$scratch/site" \
        --upload.outputDir="$repo/lhci-reports"

# =============================================================================
# Dependencies
# =============================================================================

# Install / refresh dependencies from uv.lock
sync:
    uv sync --all-groups

# Upgrade lockfile and sync
update:
    uv lock --upgrade
    uv sync --all-groups

# List outdated dependencies
outdated:
    uv tree --outdated

# =============================================================================
# Git Hooks
# =============================================================================

# Install git hooks (pre-commit + commit-msg)
hooks-install:
    uv run pre-commit install

# Update hook revs to latest tags
hooks-update:
    uv run pre-commit autoupdate

# Uninstall git hooks
hooks-uninstall:
    uv run pre-commit uninstall

# =============================================================================
# Release
# =============================================================================
# CHANGELOG.md is a hand-written current-state baseline; `just bump` only
# moves the version and the tag, and never touches it. See
# docs/decisions.md § 4.

# Preview the next SemVer bump without writing anything
release-preview:
    uv run cz bump --dry-run

# `cz bump` cannot sign off its own commit, so only the version files move first.
# Bump the version, commit with DCO sign-off and create the signed tag (push is manual)
bump:
    #!/usr/bin/env bash
    set -euo pipefail
    old="$(uv run cz version --project)"
    uv run cz bump --version-files-only --yes
    new="$(uv run cz version --project)"
    git add pyproject.toml uv.lock
    git commit -s -m "bump: version ${old} → ${new}"
    git tag -s "v${new}" -m "v${new}"

# =============================================================================
# Security
# =============================================================================

# Pin all GitHub Actions references to SHAs (rerun after editing workflows)
pin-actions:
    pinact run

# =============================================================================
# Utilities
# =============================================================================

# Show dependency tree
tree:
    uv tree

# Open EN dev server in browser
open:
    xdg-open http://127.0.0.1:8000 2>/dev/null || open http://127.0.0.1:8000

# Conventional commit (commitizen guided), with the mandatory DCO sign-off
commit:
    uv run cz commit -- -s
