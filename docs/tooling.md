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
| 9  | Python deps audit          | `pip-audit`           | Locked production tree via `uv export --no-dev`.              |
| 10 | Workflows linter           | `actionlint`          | Syntax + embedded shellcheck inside `run:`.                   |
| 11 | Workflows security         | `zizmor`              | Default blanket `hash-pin` policy; `pinact` applies the fix.  |
| 12 | Pin Actions to SHA         | `pinact`              | Manual (`just pin-actions`); `zizmor` rejects unpinned refs.  |
| 13 | Dependency monitoring      | Graph + Dependabot alerts | Read-only reports; policy guard rejects update branches.   |
| 14 | Development environment    | `uv` + `just` locally | Native toolchain; deps from `uv.lock`, hooks from `pre-commit`. |
| 15 | Supply-chain posture       | OpenSSF Scorecard     | Weekly + push; SARIF to code-scanning; public badge in README.|
| 16 | Content licensing          | MIT + CC-BY-4.0       | Code under MIT (`LICENSE`); content under CC-BY-4.0 (`LICENSE-CONTENT`). |
| 17 | Quality gates              | Lighthouse CI + Python Playwright + axe-core | Blocking a11y/SEO/best-practices, layout shift and interaction tests; axe runs on the dialog, the CLI and every tool; the performance score remains warn-only (≥ 0.9). |
| 18 | Lockfile maintenance       | Weekly `uv` report    | Tuesdays 06:00 UTC; tests candidates without persisting them. |
| 19 | JavaScript linter          | `eslint` + `tsc`      | Flat config (ESLint 10) with the recommended rules inlined; `// @ts-check` on the DOM-free modules, checked by a pinned TypeScript hook. |
| 20 | CSS linter                 | `stylelint`           | Config-standard ruleset inlined (ESM `extends` is unresolvable under pre-commit). |
| 21 | DRY Asset deduplication    | Pre-build Sync Task   | Generates Spanish assets on-the-fly; keeps git repo 100% DRY. |
| 22 | Bilingual symmetry checker | Custom Python hook    | Runs in pre-commit to ensure English & Spanish page parity.  |
| 23 | Project governance         | Single Developer Flow | Formalizes sole maintainer roles and exit/continuity policy. |
| 24 | Secure design principles   | Static threat modeling| Small static surface; GitHub-managed TLS; HTTPS settings require owner verification. |
| 25 | Branch protection          | Classic protection    | Scorecard reads it reliably; admin bypass kept for solo flow. |
| 26 | SAST                       | `codeql`              | Covers all JS assets, `scripts/*.py` and workflows (`actions`); reports into code scanning. |
| 27 | Typography delivery        | Self-hosted `woff2`   | Zero third-party requests; no render-blocking cross-origin CSS. |
| 28 | Design system              | Shared CSS tokens + two feature stylesheets | Two manual palettes; topic-first references, native disclosures and open reading lists; no preprocessor, `@layer` or table library. |
| 29 | Browser workbench          | Native ES modules + built-in tests | 59-term glossary with acronym tooltips, 20 CLI commands and four tools (Failure Lab, Table Files, Agent Replay, Eval Statistics) whose results follow each edit, all with scenario links; no third-party browser runtime. |
| 30 | Blog comparison articles   | Editorial Markdown + primary sources | Nine bilingual comparisons by architectural role, with workload recommendations, reviewed editions, editorial 1–5 ratings and native source disclosures. |
| 31 | Per-page social cards      | Pillow at build time  | `scripts/social_cards.py` draws one card per indexable page with the site's own fonts; the native `social` plugin was tried and not adopted. |
| 32 | Python linter              | `ruff check`          | Pinned pre-commit hook over `scripts/`; rules in `pyproject.toml`; formatter not enabled yet. |

## Key commands

`just` with no arguments lists every recipe, grouped as below.

| Command                 | What it does                                               |
| :---------------------- | :--------------------------------------------------------- |
| `just sync`             | Install the locked Python environment, all dependency groups |
| `just serve` / `just serve-es` | EN dev server at `http://127.0.0.1:8000` / ES at `http://127.0.0.1:8001` |
| `just build`            | Check symmetry and the glossary, build EN + ES into `site/`, verify and post-process it |
| `just clean` / `just rebuild` | Remove `site/`, caches and stray Chrome profiles / clean, then build |
| `just check-i18n`       | EN/ES content, shared configuration and navigation symmetry (also a pre-commit hook) |
| `just glossary` / `just check-glossary` | Generate/check static glossary pages from the single bilingual catalog |
| `just sort-ratings` / `just check-ratings` | Order/check Blog rating tables from highest to lowest (also a pre-commit hook) |
| `just blog-versions` / `just check-blog-pins` | Report Blog pins that trail upstream tags (`--api` adds release dates and rubric thresholds through `gh`) / check pins, license links and review months offline (also a pre-commit hook) |
| `just lint`             | Every pre-commit hook on all tracked files, as CI runs it  |
| `just lint-js` / `just lint-css` / `just spell` | ESLint / Stylelint / `cspell` only, through pre-commit |
| `just audit`            | `pip-audit` over the locked production tree (also a pre-commit hook, so CI runs it inside `lint.yml`) |
| `just links`            | Local Lychee over Markdown and glossary sources, after syncing assets (same config and inputs as CI, which adds a 7-day cache) |
| `just test`             | Every offline suite: `test-workbench`, `test-contracts` and `test-hooks` |
| `just test-workbench`   | Six Node test files: CLI utilities and glossary, reference topics, Failure Lab, Table Files, the AI worksheets, and the working-hours indicator with scenario links (also a pre-commit hook) |
| `just test-contracts`   | Bilingual configuration and Markdown contracts (also a pre-commit hook) |
| `just test-hooks`       | The pre-commit preparation helper that `lint.yml` and `uv-report.yml` use |
| `just install-browser`  | Install the Chromium release that the locked Playwright expects |
| `just test-browser`     | Keyboard, locale, mobile, contrast and tool regressions against the current bilingual build (run `just build` first) |
| `just lighthouse`       | Lighthouse CI locally with the repository config (builds first; reports in `lhci-reports/`) |
| `just update` / `just outdated` / `just tree` | Upgrade the lockfile and sync / list newer Python releases / show the dependency tree |
| `just hooks-install` / `just hooks-update` / `just hooks-uninstall` | Install the pre-commit and commit-msg hooks / move hook revisions to their newest tags as frozen SHAs (gitleaks moves by hand) / remove the hooks |
| `just commit`           | commitizen-guided commit with DCO sign-off (`cz commit -- -s`) |
| `just release-preview` / `just bump` | Dry-run of the next SemVer bump / version files, signed-off commit and signed tag |
| `just pin-actions`      | Pin Actions references to full SHAs with `pinact`          |

## CI workflows

| Workflow            | Trigger                                                                   | What it does                                                          |
| :------------------ | :------------------------------------------------------------------------ | :-------------------------------------------------------------------- |
| `lint.yml`          | Every `push` / `pull_request` to `main`, `workflow_dispatch`, daily cron 08:00 UTC | Tests and runs the cached hook preparation with npm download recovery, `pre-commit run --all-files`, whose `pip-audit` hook runs `just audit` over the locked production tree |
| `deploy.yml`        | `push` to `main` (paths watched), every `pull_request` to `main`, `workflow_dispatch` | Build EN + ES; deploy to GitHub Pages on direct push to `main` or manual dispatch |
| `link-report.yml`   | `pull_request` to `main` (content paths), cron Mondays 07:00 UTC, `workflow_dispatch` | Lychee with cache; writes a job summary and never opens issues |
| `scorecard.yml`     | Cron Mondays 09:30 UTC + push to `main` + `workflow_dispatch`             | OpenSSF Scorecard analysis; uploads SARIF to GitHub code-scanning      |
| `quality.yml`       | `pull_request` / `push` to `main` (paths watched) + `workflow_dispatch`   | Playwright interactions, then Lighthouse over 42 EN/ES pages; 126 runs with a11y 1.0, blocking SEO/best-practices, layout shift ≤ 0.1, zero third-party requests and warn-only performance (≥ 0.9)/resource sizes |
| `uv-report.yml`     | Cron Tuesdays 06:00 UTC + `workflow_dispatch`                             | Resolves and verifies candidate lockfile updates in an ephemeral runner, then writes an Actions summary; no repository writes |
| `blog-version-report.yml` | Cron Wednesdays 06:30 UTC + `workflow_dispatch`                     | Reads upstream tags over plain Git transport, without credentials, and writes the Blog pins that trail them to the job summary; stale pins never fail the run |
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

### Developer prerequisites (not provisioned by this repository)

Node.js runs the glossary check inside `just build`, `just glossary`,
`just test-workbench` and `just lighthouse`. Every workflow that builds
(`deploy.yml`, `quality.yml`, `uv-report.yml`) and `lint.yml` install the same
pinned LTS used by the Node hooks. There is no npm application dependency or
build step.

`just`, `lychee` and `pinact` are installed on the developer machine from
their upstream releases; nothing in the repository installs them locally.
Two of them have a CI counterpart: `link-report.yml` runs `lychee-action`,
which bundles its own binary, and every build workflow installs `just`
through `setup-just` at the version pinned in the workflows. Keep the local
`lychee` and `just` on those releases, or a local `just links` and the
weekly report will disagree. `pinact` has no CI consumer at all.
