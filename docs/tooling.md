# Tooling — landerox.github.io

Current development stack. For the **why** of each choice,
evaluated alternatives and re-evaluation triggers, see
[`decisions.md`](./decisions.md). For the front-end layer specifically
— design tokens, palettes, typography, accessibility and performance
budget — see [`design.md`](./design.md).

The `#` column in the table below matches the section numbers in
`decisions.md`; keep them in step when adding a category.

## Stack by category

| #  | Category                   | Tool                  | One-line rationale                                            |
| :- | :------------------------- | :-------------------- | :------------------------------------------------------------ |
| 0  | Site generator (SSG)       | `zensical`            | Modern successor of Material for MkDocs (personal affinity).  |
| 1  | Python package manager     | `uv`                  | State of the art; reproducible lockfile.                      |
| 2  | Task runner                | `just`                | Readable syntax, without `make`'s pitfalls.                   |
| 3  | Hook runner                | `pre-commit`          | Huge catalog; Python is already there for Zensical.           |
| 4  | Conventional Commits       | `commitizen`          | Validation + bump + interactive prompt in one tool.           |
| 5  | Spell checker              | `cspell`              | EN + ES dictionaries (`@cspell/dict-es-es`); better prose coverage than `typos`. |
| 6  | Markdown linter            | `markdownlint-cli`    | Rules (MD013…), not just formatting.                          |
| 7  | Secrets detection          | `gitleaks`            | 160+ provider rules; active maintenance; single Go binary.    |
| 8  | Link validator             | `lychee`              | Weekly read-only summary; policy guard rejects issue creation. |
| 9  | Python deps audit          | `pip-audit`           | Scoped to declared deps via `uv export`.                      |
| 10 | Workflows linter           | `actionlint`          | Syntax + embedded shellcheck inside `run:`.                   |
| 11 | Workflows security         | `zizmor`              | Strict `hash-pin` policy; `pinact` applies the fix.           |
| 12 | Pin Actions to SHA         | `pinact`              | Manual (`just pin-actions`); `zizmor` rejects unpinned refs.  |
| 13 | Dependency monitoring      | Graph + Dependabot alerts | Read-only reports; policy guard rejects update branches.   |
| 14 | Development environment    | `uv` + `just` locally | Native toolchain; deps from `uv.lock`, hooks from `pre-commit`. |
| 15 | Supply-chain posture       | OpenSSF Scorecard     | Weekly + push; SARIF to code-scanning; public badge in README.|
| 16 | Content licensing          | MIT + CC-BY-4.0       | Code under MIT (`LICENSE`); content under CC-BY-4.0 (`LICENSE-CONTENT`). |
| 17 | Quality gates              | Lighthouse CI + Python Playwright | Blocking a11y/SEO/best-practices, layout shift and interaction tests; the performance score remains warn-only (≥ 0.9). |
| 18 | Lockfile maintenance       | Weekly `uv` report    | Tuesdays 06:00 UTC; tests candidates without persisting them. |
| 19 | JavaScript linter          | `eslint`              | Flat config (ESLint 10); custom globals; integrated in pre-commit. |
| 20 | CSS linter                 | `stylelint`           | Config-standard ruleset inlined (ESM `extends` is unresolvable under pre-commit). |
| 21 | DRY Asset deduplication    | Pre-build Sync Task   | Generates Spanish assets on-the-fly; keeps git repo 100% DRY. |
| 22 | Bilingual symmetry checker | Custom Python hook    | Runs in pre-commit to ensure English & Spanish page parity.  |
| 23 | Project governance         | Single Developer Flow | Formalizes sole maintainer roles and exit/continuity policy. |
| 24 | Secure design principles   | Static threat modeling| Small static surface; GitHub-managed TLS; HTTPS settings require owner verification. |
| 25 | Branch protection          | Classic protection    | Scorecard reads it reliably; admin bypass kept for solo flow. |
| 26 | SAST                       | `codeql`              | Covers all JS assets, `scripts/*.py` and workflows (`actions`); reports into code scanning. |
| 27 | Typography delivery        | Self-hosted `woff2`   | Zero third-party requests; no render-blocking cross-origin CSS. |
| 28 | Design system              | Shared CSS tokens + two feature stylesheets | Two manual palettes; topic-first references, native disclosures and open reading lists; no preprocessor, `@layer` or table library. |
| 29 | Browser workbench          | Native ES modules + built-in tests | 59-term glossary with acronym tooltips, 19 CLI commands, Failure Lab, memory comparison, guided SQL, SLO budgets, schema diff and a table-file planner, all with scenario links; no third-party browser runtime. |
| 30 | Blog comparison articles   | Editorial Markdown + primary sources | Nine bilingual comparisons by architectural role, with workload recommendations, reviewed editions, editorial 1–5 ratings and native source disclosures. |

## Key commands

| Command                 | What it does                                               |
| :---------------------- | :--------------------------------------------------------- |
| `just sync`             | Install / refresh dependencies                             |
| `just serve`            | EN dev server at `http://127.0.0.1:8000`                   |
| `just serve-es`         | ES dev server at `http://127.0.0.1:8001`                   |
| `just build`            | Static build into `site/` (EN + ES)                        |
| `just lint`             | pre-commit hooks across the entire repo                    |
| `just lint-js`          | Run ESLint on JavaScript files (via pre-commit)            |
| `just lint-css`         | Run Stylelint on CSS files (via pre-commit)                |
| `just audit`            | Vulnerability audit on Python deps (also the CI step and the pre-commit hook) |
| `just spell`            | Run `cspell` across the repo (via pre-commit)               |
| `just links`            | Local Lychee over Markdown and glossary sources, after syncing assets (same config and inputs as CI, which adds a 7-day cache) |
| `just check-i18n`       | EN/ES content, shared configuration and navigation symmetry |
| `just glossary` / `just check-glossary` | Generate/check static glossary pages from the single bilingual catalog |
| `just sort-ratings` / `just check-ratings` | Order/check Blog rating tables from highest to lowest (also a pre-commit hook) |
| `just install-browser` | Install Chromium matching the Playwright development pin in uv.lock |
| `just test-browser` | Keyboard, locale, mobile and contrast regressions against the current bilingual build |
| `just test-workbench`   | Six Node test files: utilities/glossary/SQL, reference topics, memory comparisons, failure policies/SQL stages, SLO/schema contracts and the availability schedule (also a pre-commit hook) |
| `just lighthouse`       | Lighthouse CI locally with the repository config (builds first; reports in `lhci-reports/`) |
| `just update`           | Apply available Python dependency upgrades locally + sync  |
| `just outdated`         | List dependencies with newer releases available            |
| `just hooks-install` / `just hooks-update` | Install the pre-commit and commit-msg hooks / bump hook revs |
| `just clean` / `just rebuild` | Remove `site/`, caches and stray Chrome profiles / clean, then build |
| `just clean` / `rebuild`| Drop `site/` and caches / clean then rebuild both locales  |
| `just commit`           | commitizen-guided commit with DCO sign-off (`cz commit -- -s`) |
| `just release-preview`  | Dry-run of next SemVer bump (`cz bump --dry-run`)          |
| `just bump`             | Version files (commitizen), signed-off commit, signed tag  |
| `just pin-actions`      | Pin Actions references to SHA via `pinact`                 |
| `just hooks-install`    | Install git hooks (`pre-commit install`)                   |
| `just hooks-update`     | Update hook revs (`pre-commit autoupdate`)                 |

## CI workflows

| Workflow            | Trigger                                                                   | What it does                                                          |
| :------------------ | :------------------------------------------------------------------------ | :-------------------------------------------------------------------- |
| `lint.yml`          | Every `push` / `pull_request` to `main`, `workflow_dispatch`, daily cron 08:00 UTC | Cached hook preparation with npm download recovery, `pre-commit run --all-files`, then `just audit` over declared deps |
| `deploy.yml`        | `push` to `main` (paths watched), every `pull_request` to `main`, `workflow_dispatch` | Build EN + ES; deploy to GitHub Pages on direct push to `main` or manual dispatch |
| `link-report.yml`   | `pull_request` to `main` (content paths), cron Mondays 07:00 UTC, `workflow_dispatch` | Lychee with cache; writes a job summary and never opens issues |
| `scorecard.yml`     | Cron Mondays 09:30 UTC + push to `main` + `workflow_dispatch`             | OpenSSF Scorecard analysis; uploads SARIF to GitHub code-scanning      |
| `quality.yml`       | `pull_request` / `push` to `main` (paths watched) + `workflow_dispatch`   | Playwright interactions, then Lighthouse over 38 EN/ES pages; 114 runs with a11y 1.0, blocking SEO/best-practices, layout shift ≤ 0.1, zero third-party requests and warn-only performance (≥ 0.9)/resource sizes |
| `uv-report.yml`     | Cron Tuesdays 06:00 UTC + `workflow_dispatch`                             | Resolves and verifies candidate lockfile updates in an ephemeral runner, then writes an Actions summary; no repository writes |
| `dco.yml`           | `pull_request` to `main`, `workflow_dispatch`                             | Verifies that all incoming pull request commits comply with DCO       |
| `codeql.yml`        | `push` / `pull_request` to `main` (paths watched), `schedule` (Thursdays 10:00 UTC), `workflow_dispatch` | CodeQL security-and-quality analysis for the Actions workflows, JS/TS and Python, `build-mode: none` |

## Pinned versions

`lint.yml` and `uv-report.yml` share `scripts/install_precommit_hooks.py`.
Hook environments are cached by OS, architecture, Python/Node/npm versions,
`uv.lock`, hook configuration
and preparation policy. Missing environments are installed separately from
validation, with at most two retries after 60 and 120 seconds for recognized
npm network/registry failures or a missing package tarball. Configuration,
authentication and missing-version errors fail immediately; validation runs
once. npm versions selected during preparation must be at least one day old.
See [the runbook](runbook.md#hook-download-fails-in-ci) for recovery and urgent
exceptions.

Every tool has a single authoritative pin. The full source-of-truth
table, with the bump procedure for each entry, lives in
[`decisions.md`](./decisions.md#14-development-environment).

| Surface                | Pinned in                                                   |
| :--------------------- | :---------------------------------------------------------- |
| Python dependencies    | `pyproject.toml` + `uv.lock`                                 |
| Python interpreter     | `.python-version`                                            |
| Browser tests          | Python Playwright dev dependency in `pyproject.toml` / `uv.lock`; Chromium revision follows the locked package |
| `uv`                   | `setup-uv` `version:` in `deploy.yml`, `lint.yml`, `quality.yml`, `uv-report.yml` |
| Node.js                | `.pre-commit-config.yaml` `default_language_version.node`    |
| Pre-commit hooks       | `.pre-commit-config.yaml` `rev:`                             |
| npm release age for hook preparation | `scripts/install_precommit_hooks.py` (one day; scoped override documented in the runbook) |
| GitHub Actions         | Full commit SHAs in `.github/workflows/*.yml`                |
| `lychee` (CI)          | `lychee-action` pin in `link-report.yml`                     |
| `just` (CI)            | `setup-just` `just-version:` in `deploy.yml`, `lint.yml`, `quality.yml`, `link-report.yml`, `uv-report.yml` |
| `@lhci/cli` (local)    | `lighthouse` recipe in `Justfile`, kept on the release bundled by the `lighthouse-ci-action` pin in `quality.yml` |

Dependency version updates are intentionally manual: Dependabot is used only
for vulnerability alerts and never creates update branches. Every pin above
therefore needs deliberate review. Use `just pin-actions` for Actions and
review the rest every ~6 months or when a needed release ships.

### Developer prerequisites (not pinned by this repository)

Node.js runs the glossary check inside `just build`, `just glossary`,
`just test-workbench` and `just lighthouse`. Every workflow that builds
(`deploy.yml`, `quality.yml`, `uv-report.yml`) and `lint.yml` install the same
pinned LTS used by the Node hooks. There is no npm application dependency or
build step.

`just`, `lychee` and `pinact` are installed on the developer machine from
their upstream releases; nothing in the repository provisions or pins them.
Two of them have a CI counterpart: `link-report.yml` runs `lychee-action`,
which bundles its own binary, and every build workflow installs `just`
through `setup-just` at the version pinned in the workflows. Keep the local
`lychee` and `just` on those releases, or a local `just links` and the
weekly report will disagree. `pinact` has no CI consumer at all.
