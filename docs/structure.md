# Structure — landerox.github.io

## Repository layout

```text
.
├── content/
│   ├── en/                       # English content (published at /)
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   ├── fonts/
│   │   │   ├── javascripts/
│   │   │   │   ├── extra.js      # ES module entry: boot() on every navigation
│   │   │   │   ├── features/     # One module per site feature (env, theme, canvas, HUD…)
│   │   │   │   ├── workbench.js  # Native console and local worksheet UI
│   │   │   │   ├── workbench-core.js # Utilities, suggestions and memory logic
│   │   │   │   ├── workbench-dom.js # Shared text-only DOM helpers
│   │   │   │   ├── glossary.js / glossary-core.js # Glossary UI and filtering
│   │   │   │   ├── glossary-page.js # Progressive public glossary enhancement
│   │   │   │   ├── glossary-controls.js / glossary-data.js # Shared controls/cache
│   │   │   │   ├── text-core.js  # Dependency-free search normalization
│   │   │   │   ├── failure.js / failure-core.js # Local simulation UI and model
│   │   │   │   ├── decision-tools.js / decision-tools-core.js # SLO, schema diff, table files
│   │   │   │   ├── share.js / share-core.js # Scenario links in the URL fragment
│   │   │   │   ├── comparison.js / comparison-core.js # Topic-first reference reading
│   │   │   │   └── sql.js / sql-core.js # Guided query UI, parser and CSV export
│   │   │   ├── stylesheets/
│   │   │   │   ├── extra.css     # Shared tokens, theme and global components
│   │   │   │   ├── tools-simulations.css # Failure comparison and SQL stages
│   │   │   │   └── decision-tools.css # SLO and schema worksheet components
│   │   │   └── glossary.json     # Bilingual editorial data (CC-BY-4.0)
│   │   ├── blog/
│   │   │   ├── index.md          # Concise editorial index of published articles
│   │   │   ├── object-storage.md # Stores, gateways and recovery
│   │   │   ├── workflow-orchestrators.md # Execution models and safe retries
│   │   │   ├── olap-databases.md # Analytical queries and deployment models
│   │   │   ├── vector-databases.md # Filtered retrieval, licenses and quality
│   │   │   ├── graph-databases.md # Traversal, editions and deployment
│   │   │   ├── data-transformation.md # Model changes and deployment
│   │   │   ├── business-intelligence.md # Reader workflows and permissions
│   │   │   ├── lakehouse-table-formats.md # Tables, catalogs and interoperability
│   │   │   └── observability.md # Metrics, logs, traces, profiles and collection
│   │   ├── projects/
│   │   │   ├── index.md          # Overview: five destination cards
│   │   │   ├── open-source.md    # ZDX and this site's pipeline
│   │   │   ├── blueprints.md     # Production Blueprints
│   │   │   ├── labs.md           # Research Labs (three lifecycle tabs)
│   │   │   ├── explorations.md   # Tech Radar
│   │   │   └── tools.md          # Interactive Tools
│   │   ├── glossary.md           # Generated public definitions and JSON-LD
│   │   ├── llms.txt              # Summary for AI agents (served at root)
│   │   ├── manifest.json         # Web app manifest (served at root)
│   │   ├── robots.txt            # Robots configuration (served at root)
│   │   └── *.md
│   └── es/                       # Same structure, in Spanish (published at /es/)
├── includes/{en,es}/abbreviations.md # Generated acronym tooltips (auto-appended)
├── overrides/                    # Theme template overrides (theme.custom_dir)
│   ├── main.html                 # Page-aware metadata/social/CSP/preloads
│   └── partials/                 # Copies of theme partials, patched
│       ├── progress.html         # Names the ARIA progressbar (a11y)
│       ├── alternate.html        # Language selector preserves page destinations
│       └── source.html           # Drops the GitHub-facts fetch mount
├── docs/                         # Internal repo documentation (not published)
│   ├── tooling.md                # Current stack (what)
│   ├── decisions.md              # Rationale (why)
│   ├── structure.md              # This file
│   ├── design.md                 # Design system (tokens, palettes, a11y, perf)
│   ├── security-assessment.md    # Threat model, controls, branch protection
│   ├── style-guide.md            # EN/ES content conventions (local-only, gitignored)
│   └── runbook.md                # Incident response
├── .config/                      # Auxiliary tooling config
│   ├── .cspell.json              # Spell-check dictionary (EN + ES + tool terms)
│   ├── .markdownlint.yaml        # Markdownlint rules (MD013 line length, etc.)
│   ├── .markdownlintignore       # Paths excluded from markdownlint
│   ├── .stylelintrc.yaml         # Stylelint rules (inlined, see file header)
│   ├── 404-router.html           # Bilingual 404 router copied to site/404.html
│   ├── lighthouserc.json         # Lighthouse CI config (Quality workflow)
│   └── lychee.toml               # Lychee link validator config
├── .github/
│   ├── workflows/                # CI workflows (see tooling.md)
│   ├── ISSUE_TEMPLATE/           # Bug + feature forms + config.yml
│   ├── branch-protection.json    # Reproducible classic-protection payload
│   ├── CODEOWNERS                # Default reviewer per path
│   ├── CODE_OF_CONDUCT.md        # Contributor Covenant
│   ├── SECURITY.md               # Vulnerability disclosure policy
│   ├── CONTRIBUTING.md           # For external contributors
│   └── PULL_REQUEST_TEMPLATE.md  # Checklist shown on every PR
├── scripts/
│   ├── check_i18n.py             # EN/ES content and shared-config symmetry
│   ├── build-glossary.mjs        # Deterministic public glossary generator/check
│   ├── test_site_contracts.py    # Locale settings, Markdown and sitemap tests
│   ├── test_browser.py           # Locked Playwright against a build snapshot
│   ├── check_report_only_automation.py # Blocks dependency write automation
│   ├── install_precommit_hooks.py # Hook preparation and bounded npm retries
│   ├── test_install_precommit_hooks.py # Recovery, failure and age-policy tests
│   ├── post_build.py             # Sanitizes HTML, sitemaps, Blog Atom feeds + article JSON-LD
│   ├── sort_ratings.py           # Orders Blog rating tables highest first
│   ├── workbench.test.mjs        # Node built-in logic tests
│   ├── comparison.test.mjs       # Reference topic selection and counts
│   ├── memory-planner.test.mjs   # Sourced presets and baseline comparison
│   ├── tools-simulations.test.mjs # Retry-policy accounting and SQL stages
│   ├── decision-tools.test.mjs   # SLO arithmetic and bounded schema contracts
│   ├── features.test.mjs         # HUD availability schedule (status-core)
│   └── verify_build_output.py    # Rejects missing/empty generated pages
├── .editorconfig                 # Cross-editor coding style (indent, EOL, charset)
├── .gitattributes                # Line-ending and diff attributes
├── .gitignore                    # Paths Git should not track
├── .gitleaksignore               # gitleaks false-positive fingerprints (on demand)
├── .pre-commit-config.yaml       # Hooks: pre-commit + commit-msg
├── .python-version               # Python version pin used by uv
├── AGENTS.md                     # Operating instructions (the only agent file)
├── CHANGELOG.md                  # Current-state description (manual)
├── eslint.config.js              # ESLint flat config (pre-commit hook)
├── Justfile                      # Task runner (entry point)
├── LICENSE                       # MIT — covers code, configs, workflows
├── LICENSE-CONTENT               # CC-BY-4.0 — prose and authored images, not code/fonts
├── pyproject.toml                # Deps + commitizen
├── README.md                     # For GitHub visitors
├── uv.lock                       # Reproducible lockfile
├── zensical.toml                 # EN site config
└── zensical.es.toml              # ES site config
```

## How to add a new page

1. Create `content/en/<slug>.md` with the English content.
2. Create `content/es/<slug>.md` with the same `slug` and the
   translation.
3. Register the page in the navigation section of **both**
   `zensical.toml` and `zensical.es.toml`.
4. If the page has shared assets (images, etc.), add them only under
   `content/en/assets/` and extend `just sync-assets` when the new path
   is not already copied. Never edit generated `content/es/assets/`
   directly. Keep genuinely locale-specific authored assets outside the
   generated paths and document the exception.
5. If you introduce new technical terms in EN or ES, add them to
   the bilingual glossary in [`style-guide.md`](./style-guide.md).
6. Validate with `just build`. Verify that the nav shows the page
   at `http://127.0.0.1:8000` (`just serve`) and `:8001`
   (`just serve-es`).

## File and naming conventions

- **Markdown filenames**: lowercase, hyphenated. E.g. `blueprints.md`,
  `open-source.md`. Not `Blueprints.md` or `openSourcePage.md`.
- **Parallel EN/ES slugs**: the file slug is the **same** in both
  languages. Only the content changes. This keeps URLs consistent
  (`landerox.com/projects/blueprints/` ↔
  `landerox.com/es/projects/blueprints/`).
- **Reusable CSS**: edit `content/en/assets/stylesheets/`; `extra.css` owns
  shared tokens and global components. `tools-simulations.css` and
  `decision-tools.css` load after it in both configs and consume the same
  tokens. `just sync-assets` generates the Spanish copies. Do not scatter
  overrides across pages or create independent feature palettes.
- **Reusable JS**: edit only `content/en/assets/javascripts/`;
  `just sync-assets` generates the Spanish copy. `extra.js` is the module
  entry and `features/` holds one module per global feature, the lazy loader
  included; `workbench.js` owns console/widgets,
  and `workbench-core.js` holds utility/calculation logic. SQL, glossary and
  simulation each separate their UI from DOM-free logic. Native ES modules
  need no bundler, package manifest or third-party browser dependency.
  The `decision-tools.js` / `decision-tools-core.js` pair owns SLO and schema
  worksheets. `workbench.mount()` imports it only when those Tools hosts exist,
  not on a CLI-only visit. No tool uploads input or persists visitor data.
  `comparison.js` progressively enhances annotated Markdown into reference
  lists with native disclosures. `comparison-core.js` owns the DOM-free topic
  selection and counting logic. These filenames are retained; the UI is not
  a data table and has no search or sorting.
- **Root site assets**: `content/en/manifest.json`, `content/en/robots.txt`
  and `content/en/llms.txt` are placed in the English root so they are served
  at the site root (`/manifest.json`, `/robots.txt`, `/llms.txt`), which
  covers both English and Spanish locales. There is no service worker; the
  manifest is linked from the head override in `overrides/main.html`.
- **Template overrides**: `overrides/main.html` extends the theme's
  `base.html` and overrides the `site_meta` and `extrahead` blocks (robots
  and review-date metadata, social tags, manifest link, font preloads,
  baseline CSP). Zensical owns the palette-aware
  `theme-color`. Both TOML configs point at the override via
  `theme.custom_dir = "overrides"` — keep them in sync.
  `overrides/partials/` shadows individual theme partials by path:
  `progress.html` gives the ARIA progressbar an accessible name,
  `alternate.html` keeps the language selector on the equivalent page, and
  `source.html` drops `data-md-component="source"` so the repository-facts
  widget never fetches `api.github.com` (the CSP blocked it anyway). All
  three follow files upstream marks "automatically generated — do not
  edit", so a Zensical bump can make them stale without any build error;
  see [Defects found and fixed](design.md#9-defects-found-and-fixed) and
  [Re-evaluation triggers](design.md#11-re-evaluation-triggers).
- **Private working documents** (CV drafts, personal notes): outside
  `content/`, gitignored if personal (`.tmp/`, `*.log`
  are already in `.gitignore`).

## Workflow naming conventions

Each `.github/workflows/*.yml` file follows two conventions so the
GitHub Actions UI stays scannable as workflows are added.

### `name:` — `<Category> · <Title>`

Use the middle dot `·` (U+00B7) with a space on each side. The
`<Category>` describes the role of the workflow:

| Category      | Use for                                                      |
| :------------ | :----------------------------------------------------------- |
| `CI`          | Quality gates on PR (lint, type, test, security audit)       |
| `CD`          | Release / deploy pipelines                                   |
| `Security`    | SAST, SCA, IaC scan, secret scanning, supply-chain           |
| `Maintenance` | Schedules (link checks, read-only reports, nightly checks)   |
| `Quality`     | Performance / accessibility audits (Lighthouse and similar)  |

Title in Title Case, 1–3 words. Product branding kept as-is
(`OpenSSF Scorecard`, `CodeQL`, `uv Lock Report` — note `uv`
lowercase because that is the product spelling).

Current set: `CD · Deploy to Pages`, `CI · DCO Check`, `CI · Lint`,
`Maintenance · Link Report`, `Maintenance · uv Lock Report`,
`Quality · Lighthouse`, `Security · CodeQL`,
`Security · OpenSSF Scorecard`.

### `run-name:` — explicit trigger mapping

Every event listed in the workflow's `on:` block must have an
explicit branch in the `run-name` ternary chain. No trigger is
allowed to fall through to the literal `github.event_name` string,
because the Actions UI then shows raw values like
`workflow_dispatch` or `push`, which look unfinished.

The same shape is used across all workflows (`link-report.yml` labels a pull
request by number instead of title):

```yaml
run-name: >-
  <Title prefix> · ${{
  github.event_name == 'pull_request' && github.event.pull_request.title
  || github.event_name == 'push' && github.event.head_commit.message
  || github.event_name == 'schedule' && '<weekly|daily ...>'
  || github.event_name == 'workflow_dispatch' && 'manual dispatch'
  || github.ref_name
  }}
```

A descriptive phrase is used for `schedule` (`weekly`,
`daily audit`) matching what the workflow does; `manual dispatch`
for `workflow_dispatch`; the commit message or PR title for
push / PR events. The fallback (`github.ref_name`) is intentionally
a sane default for any unmapped event, not a stand-in for the
actual mapping.

## Tooling configs

| File                             | Purpose                                                     |
| :------------------------------- | :---------------------------------------------------------- |
| `.config/.cspell.json`           | Valid words for spell check (EN + ES + tools)               |
| `.config/.markdownlint.yaml`     | Markdownlint rules                                          |
| `.config/.markdownlintignore`    | Paths excluded from markdownlint                            |
| `.config/.stylelintrc.yaml`      | Stylelint rules (inlined `stylelint-config-standard`)       |
| `.gitleaksignore` (repo root)    | Confirmed false positives for gitleaks (created on demand)  |
| `.config/lychee.toml`            | Lychee config (URLs to exclude, retries, etc.)              |
| `.config/404-router.html`        | Locale-detecting 404 wrapper (copied to `site/404.html`)    |
| `.config/lighthouserc.json`      | Lighthouse CI config (URLs, budgets, output target)         |
| `.pre-commit-config.yaml`        | Hooks that run on commit and commit-msg                     |
| `.github/branch-protection.json` | Classic protection payload applied after the first push     |

## Build output

`just build` generates the static site in `site/` (gitignored).
GitHub Pages publishes the content via the `deploy.yml` workflow.
Each locale build accepts success only when every Markdown source has a
non-empty generated `index.html`, then both locale trees are verified
together, and the build fails explicitly instead of publishing a partial
bilingual artifact. The three-attempt retry that once contained Zensical's
[incomplete-output race](https://github.com/zensical/zensical/issues/641)
was removed after upstream fixed it in 0.0.58; the verifier is the guard.

The build copies `.config/404-router.html` → `site/404.html`. GitHub
Pages serves `/404.html` for every unresolved path and is
locale-agnostic, so the router detects the request path client-side
and forwards `/es/*` errors to `/es/404/` (Spanish) and everything
else to `/404/` (English). Without the router, all 404s would render
the English page — including those under `/es/`.

The authored `content/en/assets/glossary.json` is copied to the generated
Spanish assets by `just sync-assets`. It contains both translations, examples,
caveats and primary sources. This is editorial data (CC-BY-4.0), distinct from
the MIT JavaScript that validates and filters it. Both build and live serving
use the same catalog. `just glossary` generates the tracked EN/ES glossary
pages, stable term anchors and DefinedTermSet JSON-LD, plus the per-locale
acronym tooltips in `includes/{en,es}/abbreviations.md`, which
`pymdownx.snippets` appends to every page. Build and pre-commit run
`just check-glossary` to reject stale output. Page and modal share bounded
fuzzy filtering and related-term links; no generated article-search index
is required. Definitions remain readable without JavaScript.
The dock is the main entry point, so the navigation does not repeat a glossary
section. Post-build explicitly includes the public reference in both sitemaps
and adds reciprocal hreflang to every indexed page.

`projects/tools.md` owns five native tabs in both locales: Failure Lab, memory
planning, SQL, SLO & error budget, and Schema diff.
The navigation and Projects overview link to Tools; Labs retains research.
Old Labs worksheet hash links forward to their equivalent Tools anchors.
Manual failure playback and a separate seeded policy comparison have explicit
local models. Memory compares saved settings A with B; SQL explains actual
logical-stage counts over fictional data. SLO modes and schema compatibility
directions remain separate and bounded. Authored prose retains each tool's
formula or input contract when JavaScript is unavailable.

`blog/index.md` introduces nine comparison articles grouped by role:
storage/lakehouse, data pipelines, databases, business intelligence and
observability. Both locales share navigation structure, destinations and
source scope. The index links only to published articles; there is no
separate Comparisons top-level category. Object storage leads with a short
explanation and one five-column table of eight main candidates (with an
editorial 1–5 rating per tool), then workload
recommendations, secondary layers, eight native source/version disclosures and
production checks. The review date and documentary scope are explicit. These
ordinary Markdown pages do not use the `data-comparison` module described below.

The Tech Radar and Blueprints author their references directly in EN/ES Markdown
using `data-comparison` annotations. The module presents a single-column reading
list with visible headings, recommendations and conditions; Blueprint trade-offs
also remain visible. Native details hold full prose and sources. Only the radar
has topic buttons (All, Data, AI & agents, Platforms & operations); Blueprints
shows all five references. No duplicate catalog or external data request exists.
Without JavaScript, original headings and full prose remain readable. Hash links
and instant navigation reveal their target; print temporarily opens all evidence
and then restores the previous topic and disclosure states.

On Blueprints, the five foundation choices are followed by the existing
five-tab Reference Catalog, then production gates, Ops and UX/UI principles.
The catalog heading keeps `recommended-cloud-baselines` in EN and
`baselines-de-nube-recomendados` in ES as explicit IDs, preserving old links.
No extra page, topic taxonomy or navigation widget is needed for this order.

The home page is a landing (`hide: [navigation, toc, footer]`): a hero grid
with a first-person introduction, "See my work" and "Send an email", and the
profile HUD, then a proof strip, the four expertise cards and a short contact
section. "See my work" leads to the Projects overview. Front-matter `title:` gives
Home, Projects and Blog distinct `<title>` values. The top tabs are Home ·
About · Projects · Blog; About holds About, Tech Stack and Collaboration &
Contact.

Labs uses `.lab-entry` prose inside three native lifecycle tabs (3 active,
2 completed, 6 planned), without card chrome or nested disclosures. About uses
seven `.experience-entry` sections inside `.experience-list`. Collaboration
uses `.service-list` for the home's four areas and keeps engagement terms
visible. Projects opens directly on five destination cards, followed by its
publication-scope note. Each content page carries at most one scope note.
Stack and the compact readiness/Ops matrices remain tables because their rows
have directly comparable fields.

To clean caches and artifacts: `just clean` (removes `.cache/`,
`site/`, `.ruff_cache/`, `.pytest_cache/` and stray WSL Lighthouse Chrome
profiles).

## Audit policy for content changes

This repository ships both **content and client-side application code**.
Page audits cover rendering and publishing; logic tests also cover glossary
filtering, commands, SQL semantics, memory arithmetic, failure accounting,
SLO budgets and schema contracts. Neither replaces the other.

**Policy:** a change does not land on `main` until the audit suite
passes against the affected output. Each new page or content
modification is audited by:

- **Build verification** — `just build` (locally) or `deploy.yml`
  (in CI) renders the affected page. A render error is a blocker.
- **Link validation** — `lychee` audits every Markdown file under
  `content/` and the glossary source links. Local entry point: `just links`.
  CI: `link-report.yml`
  (pull requests that touch `content/**`, cron Mondays 07:00 UTC; read-only
  report in the job summary).
- **Quality audit** — `quality.yml` runs the Playwright interaction gate,
  then Lighthouse CI audits thirty-eight
  representative pages across EN and ES on relevant PRs and pushes,
  including Open Source, the Tech Radar, Blueprints, the glossary and nine
  Blog comparisons,
  with three runs per URL (114 total). Accessibility must score 1.0.
  New page types should be added to `.config/lighthouserc.json` so they
  receive the same audit.
- **Static analysis** — `lint.yml` runs the full pre-commit suite
  (file hygiene checks, `cspell`, `markdownlint-cli`, `eslint`,
  `stylelint`, `actionlint`, `zizmor`, `gitleaks`, `pip-audit`, the
  bilingual, glossary, rating-order and report-only guards, `test-workbench`
  and the site-contract tests) on every push and on a daily 08:00 UTC cron; `codeql.yml`
  scans the workflows, all JavaScript assets and `scripts/` into code scanning.
- **Behavioral tests** — `just test-workbench` runs Node's built-in test
  runner through six files: `workbench.test.mjs`, `comparison.test.mjs`,
  `memory-planner.test.mjs`, `tools-simulations.test.mjs`,
  `decision-tools.test.mjs` and `features.test.mjs`, all under `scripts/`.
  A scoped pre-commit hook includes these utility, glossary, SQL,
  reference-topic, memory, failure, SLO, schema and availability checks in
  CI.
  `just test-browser` uses the development-only Python Playwright pin after
  `just build`. Install its matching Chromium with `just install-browser`.
  The suite copies the current build into a temporary directory and serves it
  locally, covering EN/ES, keyboard focus,
  unsafe input, light/dark, mobile overflow and instant navigation. Lighthouse
  does not open the modal and cannot substitute for that interaction review.
  Reference changes also need browser checks for pressed topic buttons, native
  details, visible caveats, repeated deep links, no-JavaScript reading and print
  output with restoration of the prior reading state.
  Tools changes additionally need invalid-input and stale-result checks,
  memory baseline preservation, repeatable policy comparisons, separate SLO
  modes and schema-report copy/download behavior. A logic test is not a
  browser interaction audit or validation of a real deployment.

### Enforcement

- **Locally:** pre-commit hooks block commits that fail any check.
  `--no-verify` is forbidden (see `AGENTS.md` hard rules).
- **In CI:** `lint`, `build` and `Verify DCO Sign-off` are the configured
  required status checks. Other workflows supply additional scoped or
  scheduled evidence; they are not all branch-protection requirements.
  The sole administrator retains an explicit bypass, without changing the
  policy that the owner reviews applicable gates before publishing.
- **Continuously:** OpenSSF Scorecard (`scorecard.yml`) runs weekly
  and on every push, producing a public posture score.

### Evidence of adherence

After the initial baseline is published, CI runs are visible in the
[Actions tab](https://github.com/landerox/landerox.github.io/actions),
and each subsequent PR shows the per-check status before merge.

## Git and Contribution Workflow

To maintain a clean repository history and ensure all compliance and security
standards are met, the following workflow is enforced:

### Branching Strategy

- Direct commits to `main` are blocked for actors subject to protection;
  the sole administrator has the documented bypass. The normal workflow
  still uses a reviewed feature or chore branch.
- All contributions and updates must be developed on feature or chore branches
  (prefixed with `feat/` or `chore/`).
- The branch names must be descriptive
  (e.g., `chore/migrate-branch-protection`).

### Developer Certificate of Origin (DCO) Sign-off

- Every commit must include a `Signed-off-by:` line.
- This is automated by using the `-s` or `--signoff` flag:

  ```bash
  git commit -s -m "type(scope): commit description"
  ```

- Any commit missing this signature will fail the `CI · DCO Check` workflow
  and will be blocked from merging.

### Force Pushes

- Force pushing (`git push --force` or `--force-with-lease`) is strictly
  prohibited. Any required history rewrites on shared branches should be
  handled via standard git workflows or coordination with the maintainer.

### Pull Requests & Templates

- Every PR must use the template defined in `.github/PULL_REQUEST_TEMPLATE.md`.
- When AI assistants propose changes, they must write the completed PR template
  with pre-filled details to `.tmp/pr_template_completed.txt`. The repository
  owner can then copy this template to open the PR.
