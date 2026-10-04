# AGENTS.md

Operating instructions for AI assistants and maintainers. This file is
deliberately short: the detail lives in `docs/`.

## Repo summary

Bilingual (EN/ES) personal static site built with
[Zensical](https://zensical.org) (Python). Single maintainer.
Deployed to GitHub Pages via GitHub Actions.

## Key commands

```bash
just sync         # install deps
just hooks-install # install the pre-commit and commit-msg hooks
just serve        # EN dev server (http://127.0.0.1:8000)
just serve-es     # ES dev server (http://127.0.0.1:8001)
just build        # static build into site/
just rebuild      # clean caches, then build (just clean removes site/ and caches)
just lint         # pre-commit on all files
just audit        # Python deps audit
just links        # validate outbound links (same config and inputs as CI)
just check-i18n   # EN/ES content and shared-configuration symmetry
just glossary     # regenerate public glossary pages from the bilingual JSON
just check-glossary # reject stale pages or invalid term relationships
just sort-ratings # order Blog rating tables highest first
just check-ratings # fail when a rating table is out of order (also a hook)
just test-workbench # utilities, SQL, models, filters, SLO/schema and schedule
just install-browser # install the Chromium version pinned by Playwright
just test-browser # interactions against the current bilingual build
just lighthouse   # Lighthouse CI locally (same config and lhci release as CI)
just outdated     # list outdated Python dependencies
just update       # apply available Python dependency upgrades locally + sync
just hooks-update # bump pre-commit hook revs
just commit       # commitizen-guided commit with DCO sign-off (-s)
just release-preview  # dry-run the next SemVer bump
just bump         # version bump, signed-off commit + signed tag (push is manual)
just pin-actions  # pin Actions to SHA via pinact
```

## Internal documentation (`docs/`)

| File                                           | Purpose                                                     |
| :--------------------------------------------- | :---------------------------------------------------------- |
| [`docs/tooling.md`](docs/tooling.md)           | Current stack: which tool we use in each category.          |
| [`docs/decisions.md`](docs/decisions.md)       | Why each choice, discarded alternatives, re-evaluation triggers. |
| [`docs/structure.md`](docs/structure.md)       | Repo layout, how to add a page.                             |
| [`docs/design.md`](docs/design.md)             | Design system: tokens, light/dark palettes, typography, a11y and perf contract. |
| `docs/style-guide.md` (local-only)             | Voice, tone, EN/ES conventions, bilingual glossary.         |
| [`docs/security-assessment.md`](docs/security-assessment.md) | Threat model, branch protection rules, and security controls. |
| [`docs/runbook.md`](docs/runbook.md)           | What to do when something breaks.                           |

## Hard rules (non-negotiable)

- **Conventional Commits** mandatory. Validated by commitizen.
  Use `just commit` whenever possible.
- **DCO Sign-off mandatory**: Every commit must be signed off using the
  `-s` flag (e.g., `git commit -s -m "..."`) to comply with the Developer
  Certificate of Origin (DCO) check.
- **Do not commit secrets** — `gitleaks` runs in pre-commit. Add
  fingerprints to `.gitleaksignore` only for confirmed false
  positives.
- **No `git add`, `git commit`, `git push`, or branch operations without
  explicit owner permission**. AI assistants must **never** stage files or
  create commits automatically. Instead, they should only suggest the
  commit message and let the owner handle staging and committing.
  Publishing is manual. **Force pushes (`git push --force` or
  `--force-with-lease`) are strictly prohibited.**
- **Proposing changes**: When proposing changes, the AI assistant must
  always suggest a branch name (following `chore/...` or `feat/...`)
  and write the completed PR template to `.tmp/pr_template_completed.txt`
  before finishing.
- **No `--no-verify`** to skip hooks. If a hook fails, fix the cause.
- **Keep `uv.lock`** in sync with `pyproject.toml` whenever
  dependencies change.
- **Never edit `content/es/assets/`.** It is generated from
  `content/en/assets/` by `just sync-assets` on every `serve` and
  `build`, and it is gitignored. Edits there are silently overwritten —
  no error, no diff. Edit the English tree only; the Spanish copy
  follows automatically.
- **Keep `zensical.toml` and `zensical.es.toml` in sync** for every
  setting that is not the language itself (`theme.*`, `features`,
  `palette`, `markdown_extensions`, `extra_css`, `extra_javascript`).
  `check-i18n` validates common settings and navigation destinations as
  well as Markdown; translated labels and explicit locale roots may differ.
- **Glossary source of truth**: edit `content/en/assets/glossary.json`,
  then run `just glossary`. The tracked `content/{en,es}/glossary.md`
  pages and the acronym tooltips in `includes/{en,es}/abbreviations.md`
  are generated. `just build` and pre-commit reject stale output.
- **Front-end overrides must be checked against the *compiled* theme**
  in `site/assets/stylesheets/modern/`, not against Material for
  MkDocs documentation. `theme.variant = "modern"` renders different
  markup and reads different variables; assuming otherwise is the root
  cause of most defects logged in
  [Defects found and fixed](docs/design.md#9-defects-found-and-fixed). This
  applies to the template
  override too: `overrides/main.html` extends the theme's `base.html`
  via `theme.custom_dir` and must be re-checked against the installed
  template after a bump. After bumping `zensical`, re-verify the
  assumptions listed in
  [`docs/runbook.md`](docs/runbook.md) → "Site renders wrong after a
  Zensical bump" — the build stays green when they break.
- **When bumping `zensical`** in `pyproject.toml` / `uv.lock`, also
  edit the version in the Zensical badge URL in `README.md`
  (display-only consumer; see [Development
  environment](docs/decisions.md#14-development-environment) SoT table).
- **`CHANGELOG.md` describes the current state, not a change history.**
  It is a single baseline section saying what the platform *is*. When a
  change lands, **edit the affected description in place** so it stays
  true. Do **not** add `[Unreleased]`, and do **not** add
  `Added` / `Changed` / `Fixed` / `Removed` entries — git history is the
  record of how things got here. Written by hand;
  **auto-generation from commits is not used** — see
  [Conventional Commits and
  release](docs/decisions.md#4-conventional-commits-and-release). `just bump`
  handles the version bump, its signed-off commit and the tag
  only, and never touches the changelog body.
- **Merge policy**: `main` accepts **squash merge** and **rebase
  merge** only. Plain merge commits are disabled. PR branches are
  **auto-deleted** after merge. Required status checks (`lint`, `build`,
  `Verify DCO Sign-off`) must pass; admins bypass via classic branch protection
  rules (single-maintainer flow). `main` also requires signed commits, and
  GitHub cannot sign the commits a rebase merge recreates, so squash is the
  method that works through the web UI. A squash commit takes the PR title,
  which must be a Conventional Commit, and keeps the commits' `Signed-off-by`
  trailers.
- **Remote repository controls that no file in this repo can enforce.**
  They revert to GitHub defaults whenever the repo is recreated. Report-only
  automation may not expose that drift, so after any recreation explicitly
  re-apply and verify. Repository recreation, publishing and tag changes are
  owner-run operations, not implied authority for an assistant. Follow the
  [checklist](docs/runbook.md#repository-recreation-and-the-v010-baseline)
  for Pages settings and the `v0.1.0` baseline as well as these controls:

  ```bash
  # No workflow may create or approve pull requests. Keep the default token
  # read-only and the repository-level PR capability disabled.
  gh api -X PUT /repos/landerox/landerox.github.io/actions/permissions/workflow \
    -F default_workflow_permissions=read -F can_approve_pull_request_reviews=false

  # Files pin every Action to a full commit SHA; enforce the same rule at
  # repository level so an unpinned ref cannot run even before lint catches it.
  gh api -X PUT /repos/landerox/landerox.github.io/actions/permissions \
    -F enabled=true -f allowed_actions=all -F sha_pinning_required=true

  # Dependabot is report-only: this PUT enables both vulnerability alerts and
  # the dependency graph, while version updates have no dependabot.yml and
  # security-update PRs stay off.
  gh api -X PUT /repos/landerox/landerox.github.io/vulnerability-alerts
  gh api -X DELETE /repos/landerox/landerox.github.io/automated-security-fixes

  # Verify after GitHub has processed the new repository. Alerts return 204;
  # the initial dependency-graph/SBOM population can take several minutes.
  gh api --silent /repos/landerox/landerox.github.io/vulnerability-alerts
  gh api /repos/landerox/landerox.github.io/dependency-graph/sbom \
    --jq '.sbom.packages | length'

  # GitHub exposes no public API to audit custom Dependabot auto-triage rules.
  # In Settings → Advanced Security → Dependabot rules, verify that no custom
  # rule has the “Open a pull request” action.

  # Enforces the merge policy stated above. Web edits need a sign-off too.
  gh api -X PATCH /repos/landerox/landerox.github.io \
    -F allow_merge_commit=false -F allow_squash_merge=true \
    -F allow_rebase_merge=true -F delete_branch_on_merge=true \
    -F allow_update_branch=true -f squash_merge_commit_title=PR_TITLE \
    -f squash_merge_commit_message=COMMIT_MESSAGES \
    -F web_commit_signoff_required=true

  # .github/SECURITY.md sends reports to private vulnerability reporting,
  # which is off in a new repository.
  gh api -X PUT \
    /repos/landerox/landerox.github.io/private-vulnerability-reporting

  # Secret scanning and push protection back the local gitleaks hook. New
  # public repositories usually have them on; set and verify them anyway.
  gh api -X PATCH /repos/landerox/landerox.github.io --input - <<'JSON'
  {"security_and_analysis": {"secret_scanning": {"status": "enabled"},
    "secret_scanning_push_protection": {"status": "enabled"}}}
  JSON
  gh api /repos/landerox/landerox.github.io --jq .security_and_analysis

  # Classic branch protection — only works once `main` exists remotely.
  gh api -X PUT /repos/landerox/landerox.github.io/branches/main/protection \
    -H "Accept: application/vnd.github+json" \
    --input .github/branch-protection.json

  # Signed-commit protection is a separate endpoint; it is not a valid field
  # in the branch-protection payload above. Apply it only once
  #   gh api /repos/landerox/landerox.github.io/commits/main \
  #     --jq .commit.verification.verified
  # returns true; otherwise register the SSH signing key first.
  gh api -X POST \
    /repos/landerox/landerox.github.io/branches/main/protection/required_signatures
  ```

- **Workflow naming**: every `.github/workflows/*.yml` uses
  `<Category> · <Title>` for `name:` and an explicit trigger
  mapping in `run-name:` (no `event_name` literal fall-through).
  Full convention in
  [`docs/structure.md`](docs/structure.md) → "Workflow naming
  conventions".

## Licensing

Three surfaces, not two. The split follows **what a file is**, not
which directory it happens to sit in:

- **Code** — MIT, see [`LICENSE`](LICENSE).
  `pyproject.toml`, `Justfile`, `.github/`, `.config/`, `scripts/`,
  `overrides/`, workflows, **and the front-end sources
  under `content/**/assets/stylesheets/` and
  `content/**/assets/javascripts/`**. These live under `content/` for
  Zensical's benefit, but they are software and are licensed as such.
- **Content** — CC-BY-4.0, see [`LICENSE-CONTENT`](LICENSE-CONTENT).
  `content/**/*.md`, prose, and images authored by the maintainer.
- **Third-party assets** — upstream terms, neither of the above.
  `content/**/assets/fonts/` (Inter and Outfit under OFL-1.1, MesloLGM
  Nerd Font under Apache-2.0). Notices are vendored beside the files in
  [`content/en/assets/fonts/NOTICE.txt`](content/en/assets/fonts/NOTICE.txt);
  provenance is tabulated in [Typography](docs/design.md#5-typography).

When adding a file under `content/`, ask which of the three it is
before assuming CC-BY-4.0. Rationale and the full boundary rule in
[Content licensing (dual-license
model)](docs/decisions.md#16-content-licensing-dual-license-model).

## For AI assistants specifically

This is the only agent-instructions file in the repository. Before
proposing stack or tooling changes, read
[`docs/decisions.md`](docs/decisions.md) — many alternatives are
already evaluated and discarded with their rationale documented.

- **Linting — two modes, and the difference is not optional**:
  - *While developing*: do not run `just lint`. Recommend when the owner
    should run it, and let them share any errors.
  - *When asked to verify, or when something has already failed*: run
    the real thing, always. That means `just lint` (or
    `uv run pre-commit run --all-files`, the same command CI runs) plus
    whatever gate is in question — `just build`, `just links`,
    Lighthouse CI, CodeQL. Reproducing a gate with tools installed
    elsewhere is approximating, not verifying: hooks resolve their own
    dependency versions, and a near-enough environment has already let
    two failures reach CI. Never report "verified" on the strength of a
    substitute, and never answer "that cannot be checked locally" —
    every gate in this repo is installable (`lychee` and the CodeQL
    bundle both ship as downloadable releases).
