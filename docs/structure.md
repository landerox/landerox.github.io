# Structure — landerox.github.io

## Repository layout

```text
.
├── content/
│   ├── en/                       # English content (published at /)
│   │   ├── assets/
│   │   │   ├── images/           # Logo, favicon, PWA icons and the home social card
│   │   │   ├── fonts/
│   │   │   ├── javascripts/
│   │   │   │   ├── extra.js      # ES module entry: boot() on every navigation
│   │   │   │   ├── features/     # One module per site feature (env, theme, canvas, HUD, intro…)
│   │   │   │   ├── workbench.js  # Native console, CLI and the Tools loader
│   │   │   │   ├── workbench-core.js # CLI utilities and suggestions
│   │   │   │   ├── workbench-dom.js # Shared text-only DOM: forms, presets and bars
│   │   │   │   ├── glossary.js / glossary-core.js # Glossary UI and filtering
│   │   │   │   ├── glossary-page.js # Progressive public glossary enhancement
│   │   │   │   ├── glossary-controls.js / glossary-data.js # Shared controls/cache
│   │   │   │   ├── text-core.js  # Dependency-free search normalization
│   │   │   │   ├── failure.js / failure-core.js # Local simulation UI and model
│   │   │   │   ├── decision-tools.js / decision-tools-core.js # Table Files
│   │   │   │   ├── ai-tools.js / ai-tools-core.js # Agent Replay and Eval Statistics
│   │   │   │   ├── share.js / share-core.js # Scenario links in the URL fragment
│   │   │   │   └── comparison.js / comparison-core.js # Topic-first reference reading
│   │   │   ├── stylesheets/
│   │   │   │   ├── extra.css     # Shared tokens, theme and global components
│   │   │   │   ├── tools-simulations.css # Failure Lab comparison and conservation line
│   │   │   │   └── decision-tools.css # Worksheets, and the presets of all four tools
│   │   │   ├── media/            # Intro video cuts and poster (root URLs, not synced to ES)
│   │   │   └── glossary.json     # Bilingual editorial data (CC-BY-4.0)
│   │   ├── blog/
│   │   │   ├── index.md          # Card index by role, rating rubric and overview
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
│   │   │   ├── index.md          # ZDX lead and four destination cards
│   │   │   ├── open-source.md    # ZDX and this site's pipeline
│   │   │   ├── blueprints.md     # Production Blueprints
│   │   │   ├── labs.md           # Research Labs (three lifecycle tabs)
│   │   │   ├── explorations.md   # Tech Radar
│   │   │   └── tools.md          # Interactive Tools
│   │   ├── glossary.md           # Generated public definitions and JSON-LD
│   │   ├── manifest.json         # Web app manifest (served at root)
│   │   ├── robots.txt            # Robots configuration (served at root)
│   │   └── *.md
│   └── es/                       # Same structure, in Spanish (published at /es/)
├── includes/{en,es}/abbreviations.md # Generated acronym tooltips (auto-appended)
├── overrides/                    # Theme template overrides (theme.custom_dir)
│   ├── main.html                 # Metadata, social tags, icons, CSP and font preloads
│   └── partials/                 # Copies of theme partials, patched
│       ├── progress.html         # Localized progressbar name (upstream ES fallback is English)
│       ├── alternate.html        # Language selector keeps the page; Toolbox control
│       ├── actions.html          # Copy-as-Markdown button: Spanish name, reading pages only
│       ├── social.html           # Profile links plus the intro's clapperboard (hidden until JS)
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
│   ├── post_build.py             # Sanitizes HTML, defers the theme bundle, sitemaps, Blog feeds + JSON-LD
│   ├── social_cards.py           # Per-page Open Graph cards (Pillow), called by post_build
│   ├── limit_font_weights.py     # One-off: limits Inter's weight axis to 400–700
│   ├── sort_ratings.py           # Orders Blog rating tables highest first
│   ├── blog_versions.py          # Checks Blog version pins; reports and bumps stale ones
│   ├── workbench.test.mjs        # Node built-in logic tests
│   ├── comparison.test.mjs       # Reference topic selection and counts
│   ├── tools-simulations.test.mjs # Retry-policy accounting
│   ├── decision-tools.test.mjs   # Table Files planning
│   ├── ai-tools.test.mjs         # Agent recovery and eval statistics
│   ├── features.test.mjs         # Working-hours indicator and scenario links
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
├── jsconfig.json                 # tsc settings for the // @ts-check core modules
├── Justfile                      # Task runner (entry point)
├── LICENSE                       # MIT — covers code, configs, workflows
├── LICENSE-CONTENT               # CC-BY-4.0 — prose and authored images, not code/fonts
├── pyproject.toml                # Deps, commitizen and Ruff rules
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
4. List it in `[project.plugins.llmstxt.sections]` of both files, in the same
   position, with a translated description; `check-i18n` fails otherwise.
5. If the page has shared assets (images, etc.), add them only under
   `content/en/assets/`; `just sync-assets` copies the whole stylesheets,
   javascripts, fonts and images trees. Never edit generated
   `content/es/assets/` directly. Keep genuinely locale-specific authored
   assets outside the generated paths and document the exception. The one
   shared tree it does not copy is `assets/media/` (the intro video): both
   locales request it at root URLs (`/assets/media/…`), like the manifest.
6. If you introduce new technical terms in EN or ES, add them to the
   bilingual glossary in the local-only `docs/style-guide.md` (not in the
   repository); a term that needs a public definition goes in
   `content/en/assets/glossary.json`, then `just glossary`.
7. Validate with `just build`. Verify that the nav shows the page
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
  included; `workbench.js` owns the console and loads the Tools worksheets,
  and `workbench-core.js` holds the CLI's utility logic. Glossary and
  simulation each separate their UI from DOM-free logic. Native ES modules
  need no bundler, package manifest or third-party browser dependency.
  The `decision-tools.js` / `decision-tools-core.js` pair owns Table Files;
  `ai-tools.js` / `ai-tools-core.js` owns Agent Replay and Eval Statistics.
  Both reuse the form helpers in `workbench-dom.js`. `workbench.mount()`
  imports each pair only when one of its Tools hosts is visible, not on a
  CLI-only visit.
  No tool uploads input or persists visitor data.
  `comparison.js` progressively enhances annotated Markdown into reference
  lists with native disclosures. `comparison-core.js` owns the DOM-free topic
  selection and counting logic. These filenames are retained; the UI is not
  a data table and has no search or sorting.
  `features/search-a11y.js` only translates Spanish search labels, placeholder
  and status messages; native Zensical search owns its dialog, focus and ARIA
  state. `features/lazy-features.js` turns the header's Toolbox link
  into the button for the dialog, once, since the header survives navigation.
  The intro video opens from a clapperboard after the footer's profile
  links (`overrides/partials/social.html`, revealed by `features/intro.js`)
  and from the CLI's `intro` command, which the CLI's hint line names; both
  call `features/intro.js`, which `extra.js` and `workbench.js` import.
- **Architecture overviews**: four-stage HTML figures are authored directly
  in each locale's Blueprints, Research Labs, Blog index and all nine Blog
  articles. Shared styles in `extra.css` draw the stages as stations on one
  rail: four columns from `60em`, one column below; translated titles,
  explanations and captions remain live text without JS.
- **Root site assets**: `content/en/manifest.json` and
  `content/en/robots.txt` are placed in the English root so they are served
  at the site root (`/manifest.json`, `/robots.txt`), which covers both
  English and Spanish locales. There is no service worker; the manifest is
  linked from the head override in `overrides/main.html`. It lists
  `icon-192.png`, `icon-512.png`, a maskable `icon-maskable-512.png` and the
  SVG favicon from `assets/images/`; the head also links
  `apple-touch-icon.png` (180×180), because iOS takes its home-screen and
  share-sheet icons from that PNG, not from SVG icons or the manifest. The
  intro video in `content/en/assets/media/` follows the
  same rule: one copy, requested at `/assets/media/` from both locales.
- **Markdown for agents**: the `llmstxt` plugin, configured in both TOML
  files, writes one `llms.txt` per locale (`/llms.txt`, `/es/llms.txt`) and an
  `index.md` beside every page its sections list. The summary prose and the
  per-page descriptions live in the configuration, translated; there is no
  authored `llms.txt` file. `check_i18n.py` requires both locales to list
  the same pages in the same order and every navigation page to be listed.
  `overrides/main.html` links each page to its locale's summary
  (`rel="describedby"`) and to its Markdown twin (`rel="alternate"
  type="text/markdown"`), and `content.action.copy` adds a copy button
  beside the title. `post_build.py` decodes the `&amp;` the exporter leaves
  in Markdown and drops the decorative rating glyphs.
- **Template overrides**: `overrides/main.html` extends the theme's
  `base.html` and overrides the `site_meta` and `extrahead` blocks (robots
  and review-date metadata, social tags, manifest, touch-icon and summary
  links, font preloads, the baseline CSP and an inline palette-storage
  bridge).
  Zensical owns the palette-aware `theme-color`. Both TOML configs point at
  the override via
  `theme.custom_dir = "overrides"` — keep them in sync.
  `overrides/partials/` shadows individual theme partials by path:
  `progress.html` supplies localized progressbar names; the upstream partial
  now names the role but its Spanish locale still falls back to English.
  `alternate.html` keeps the language selector on the equivalent page and
  adds the Toolbox control after it, as a link to the glossary that
  works without JavaScript, and
  `source.html` drops `data-md-component="source"` so the repository-facts
  widget never fetches `api.github.com` (the CSP blocked it anyway), and
  `actions.html` names the copy-as-Markdown button in Spanish, a string the
  theme's Spanish locale lacks, and shows it only on reading pages (Blog,
  glossary, Labs, Radar, Blueprints), and `social.html` adds the intro's
  clapperboard after the profile links, `hidden` until the script reveals
  it. These five partials follow files upstream marks
  "automatically generated — do not edit", so a Zensical bump can make them
  stale without any build error;
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
`Maintenance · Blog Version Report`, `Maintenance · Link Report`,
`Maintenance · uv Lock Report`,
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
bilingual artifact.

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
The header button is the main entry point, so the navigation does not repeat
a glossary section. Post-build keeps the public reference in both sitemaps,
drops the `noindex` 404 pages from them and adds reciprocal hreflang to every
listed page.

`projects/tools.md` owns the four tools in one tab set in both locales,
under a question index: Failure Lab, Table Files, Agent Replay and Eval
Statistics. Each opens on a worked example with preset scenarios (Failure
Lab: guided incident drills), and every result follows its inputs. Old Labs
worksheet hash links forward to Tools; links to retired worksheets land at the
top of the page. Authored prose keeps each tool's formula or input contract
when JavaScript is unavailable.

`blog/index.md` presents the nine comparison articles as card grids by role
(storage and lakehouse, data pipelines, databases, business intelligence,
observability), then the rating rubric and a four-stage overview of how the
layers connect. Each article opens with a short explanation and a four-stage
overview, then its rating table, workload recommendations and native source
disclosures. These ordinary Markdown pages do not use the `data-comparison`
module.

The Tech Radar and Blueprints author their references in EN/ES Markdown with
`data-comparison` annotations, which `comparison.js` turns into a reading list
with native disclosures; only the radar has topic buttons. Blueprints keeps the
explicit IDs `recommended-cloud-baselines` (EN) and
`baselines-de-nube-recomendados` (ES) on its catalog heading, so old links hold.

The home page is a landing (`hide: [navigation, toc, footer]`). The top tabs
are Home · About · Projects · Blog; About holds About, Tech Stack and
Collaboration & Contact. Page-level layouts (home blocks, cards, reading
panels, Labs entries, the About experience list and the Collaboration areas)
are described in [design.md § 6](design.md#6-component-rules).

To clean caches and artifacts: `just clean` (removes `.cache/`,
`site/`, `.ruff_cache/`, `.pytest_cache/` and stray WSL Lighthouse Chrome
profiles).

## Audit policy for content changes

This repository ships both **content and client-side application code**.
Page audits cover rendering and publishing; logic tests also cover glossary
filtering, commands, failure accounting, table-file planning, agent recovery
and evaluation statistics. Neither replaces the other.

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
  then Lighthouse CI audits all forty-two pages of EN and ES except the
  404 on relevant PRs and pushes, including Open Source, the Tech Radar,
  Blueprints, the glossary and the nine Blog comparisons, with three runs
  per URL (126 total). Accessibility must score 1.0.
  New page types should be added to `.config/lighthouserc.json` so they
  receive the same audit.
- **Static analysis** — `lint.yml` runs the full pre-commit suite
  (file hygiene checks, `cspell`, `markdownlint-cli`, `ruff check`,
  `eslint`, `stylelint`, `tsc` type checks, `actionlint`, `zizmor`,
  `gitleaks`, `pip-audit`, the bilingual, glossary, rating-order, Blog-pin
  and report-only guards, `test-workbench` and the site-contract tests) on
  every push and on a daily 08:00 UTC cron; `codeql.yml`
  scans the workflows, all JavaScript assets and `scripts/` into code scanning.
- **Behavioral tests** — `just test-workbench` runs Node's built-in test
  runner through six files: `workbench.test.mjs`, `comparison.test.mjs`,
  `tools-simulations.test.mjs`, `decision-tools.test.mjs`,
  `ai-tools.test.mjs` and `features.test.mjs`, all under `scripts/`. A scoped
  pre-commit hook includes these utility, glossary, reference-topic, tool
  and availability checks in CI.
  `just test-browser` uses the development-only Python Playwright pin after
  `just build`. Install its matching Chromium with `just install-browser`.
  The suite copies the current build into a temporary directory and serves it
  locally, covering EN/ES, keyboard focus,
  unsafe input, light/dark, mobile overflow and instant navigation. Lighthouse
  does not open the modal and cannot substitute for that interaction review.
  Reference changes also need browser checks for pressed topic buttons, native
  details, visible caveats, repeated deep links, no-JavaScript reading and print
  output with restoration of the prior reading state.
  Tools changes additionally need invalid-input checks, results that follow
  each edit and repeatable policy comparisons. A logic test is not a browser
  interaction audit or validation of a real deployment.

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

Branch prefixes, the DCO sign-off, the force-push ban and the completed PR
template in `.tmp/pr_template_completed.txt` are hard rules in
[`AGENTS.md`](../AGENTS.md). Contributor steps are in
[`.github/CONTRIBUTING.md`](../.github/CONTRIBUTING.md); every PR uses
`.github/PULL_REQUEST_TEMPLATE.md`, and `CI · DCO Check` blocks a commit
without its `Signed-off-by:` line.
