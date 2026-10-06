# Changelog

This document describes the current repository under `v0.1.0`: the site,
its implementation, tooling and operating policies. It is maintained by
hand; Git records subsequent changes.

## [v0.1.0] — Repository baseline

Source for [landerox.com](https://landerox.com), the bilingual personal and
professional site of Fernando Landero, Senior Consultant & Engineer in
Cloud, Data & AI Platforms. The platform is a static site with one
maintainer and a GitHub Actions pipeline for GitHub Pages.

The project and Commitizen version are `0.1.0`. The initial signed commit,
tag and release establish this baseline after review.

### Site and content

- **Two locales**: English at `/` and Spanish at `/es/`, with 22 Markdown
  pages per locale. Both use identical slugs and shared configuration.
  The navigation groups Home, About, Projects and Blog; Tech Stack and
  Collaboration & Contact sit inside About.
- **Professional profile**: Home, About and Collaboration describe the
  maintainer's focus, experience, working arrangements and contact options.
  Shared positioning, contact labels and metadata keep the site consistent.
- **Projects**: Open Source, Production Blueprints, Research Labs, Tech
  Radar and Interactive Tools. The Open Source page presents ZDX, the
  maintainer's MIT-licensed developer suite for Zsh.
- **Production Blueprints**: five references covering cloud foundations,
  private/hybrid cloud, analytical platforms, AI serving and agent workflows.
  Each describes its scope, operational trade-offs and acceptance gates.
- **Research Labs**: eleven studies organized into three active, two
  completed and six planned entries. Their purpose, evidence and lifecycle
  remain visible; private client implementations are not published.
- **Tech Radar**: ten dated references with four topic filters, visible
  recommendations and adoption conditions, and native disclosures for
  supporting sources. The original content remains readable without
  JavaScript; direct links and printing reveal the relevant evidence.
- **Blog**: nine bilingual comparisons covering object storage, workflow
  orchestrators, OLAP, vector databases, transformation, BI, lakehouse
  formats, graph databases and observability. Articles retain reviewed
  editions, licenses, official sources, workload recommendations and dated
  editorial ratings. Ratings follow five documented criteria and tables
  are checked for descending order; they are not benchmarks.
- **Public glossary**: 59 bilingual terms with definitions, examples,
  caveats, related terms, practice links and primary sources. The same
  catalog generates both public glossary pages and acronym tooltips.
- **Discovery and navigation**: equivalent-page language switching,
  reciprocal sitemap language alternates, robots.txt, canonical URLs,
  Open Graph and Twitter metadata with a social card per page (drawn at
  build time; the home pages keep the hand-made card), manifest and
  `llms.txt`.
  Each locale publishes a Blog Atom feed and article `TechArticle` JSON-LD
  from the reviewed front matter.
- **404 handling**: one Pages entry point routes missing Spanish paths to
  the Spanish 404 page and other paths to English. Both pages use
  `noindex` and stay outside the sitemaps.

### Front end and browser tools

- **Zensical Modern theme**: shared semantic CSS tokens define light and
  dark surfaces, typography, contrast, spacing, motion and controls.
  Inter, Outfit and MesloLGM Nerd Font are self-hosted as `woff2`.
- **Native JavaScript modules**: one entry point loads feature modules;
  pure logic stays in DOM-free core modules. Tools load on demand and
  share DOM, table and download helpers. Custom tools use native browser APIs
  and have no npm application build.
- **Accessible interaction**: keyboard controls and focus restoration,
  visible focus rings, named search controls in the theme's shadow root,
  scrollable mobile tables, forced-colors support and print rules.
  Static reading and formulas remain available without JavaScript.
- **Palette and motion**: two explicit color schemes with persistence
  across locales, a palette transition and a motion toggle. The ambient
  network pauses in hidden tabs and becomes one still frame under reduced
  motion. Shared preferences use the root storage scope.
- **Technical desk and CLI**: a native dialog launched from a dock before
  the footer. The CLI has 19 commands, examples, help, completion, bounded
  history and local calculations. JWT decoding never claims signature
  verification; the same-origin HTTP ping does not claim to perform ICMP.
- **Six Tools tabs**: Failure Lab, memory planner, SQL explorer, SLO &
  error budget, Schema diff and Table files. Scenario links restore
  validated inputs from the URL fragment. Simulations and estimates state
  their assumptions and limits; they do not claim remote execution or
  measured hardware results.
- **Visitor data**: inputs stay in the browser. Assets are served from the
  site's own origin, and the platform has no application server, database,
  account system, analytics or third-party browser requests.

### Stack and repository organization

The site runs on Python 3.13 and Zensical 0.0.68; Pillow draws the social
cards during the build. `uv` installs Python dependencies from `uv.lock`;
`just` exposes development, validation, maintenance and release commands.
Node.js 24.21.0 LTS runs the glossary generator, built-in Node tests and
isolated Node hooks.

| Path | Responsibility |
| :--- | :------------- |
| `content/en/`, `content/es/` | Authored Markdown with parallel locale paths |
| `content/en/assets/` | Shared CSS, JavaScript, fonts, images and glossary source |
| `zensical.toml`, `zensical.es.toml` | Locale builds, shared theme and navigation configuration |
| `overrides/` | Shared theme template and metadata overrides |
| `includes/` | Generated locale acronym tooltips |
| `scripts/` | Build contracts, generators, policy checks, hook preparation and tests |
| `.github/` | Workflows, contribution policies and branch-protection payload |
| `.config/` | Linter, link-validator, 404 router and Lighthouse settings |
| `docs/` | Stack, decisions, structure, design, security assessment and runbook |
| `pyproject.toml`, `uv.lock`, `Justfile` | Dependencies, version configuration and task entry points |

Spanish shared assets are generated from the English tree on every serve
and build. They are not edited or committed independently. Build output,
dependencies, local settings, reports and `.tmp/` are ignored; videos and
other production artifacts remain local.

Python dependencies are locked and hook repositories use pinned revisions.
Some Node hooks resolve npm version ranges, so their transitive dependency
trees are not fully locked by those Git revisions.

### Build and quality gates

`just build` checks bilingual symmetry and generated glossary output,
synchronizes shared assets, builds both locales in strict mode and verifies
every rendered page. Post-processing sanitizes HTML and produces reciprocal
sitemap alternates, Blog feeds and article metadata. The final combined
check rejects a partial bilingual build.

- **Pre-commit**: file hygiene, syntax, bilingual spelling, Markdown,
  JavaScript and CSS linting, Action syntax and security analysis, secret
  scanning, report-only automation policy, Python dependency audit, glossary
  consistency, rating order, locale contracts and six Node test files.
- **Hook preparation**: Lint and the weekly lockfile report test and use a
  shared Python helper before validation. Installed environments are cached
  by platform, runtime versions, pins and preparation policy. npm range
  resolution uses a one-day minimum release age. Recognized download
  failures receive at most two retries after 60 and 120 seconds; persistent
  failures remain blocking, and lint and audits run once.
- **Commit policy**: Conventional Commits, signed commits and DCO
  `Signed-off-by:` trailers. The initial commit uses a lowercase English
  subject with a scope. Commitizen validates commit messages and manages
  the version files; release commands create signed tags.
- **Browser contracts**: Playwright and its matching Chromium are pinned
  through the Python lockfile. Tests use a disposable bilingual build to
  cover keyboard/focus/history, locale metadata, lazy loading, glossary
  retry and printing, mobile tables, scenario links, contrast and motion.
- **Lighthouse CI**: 38 URLs in both locales, three runs each. Accessibility
  requires 1.0; SEO, best practices, layout shift and zero third-party
  requests are blocking. Performance below 0.9 and resource-size budgets
  warn. These checks run after the browser interaction gate.
- **External links**: `just links` and the weekly report use the same Lychee
  configuration and inputs.

### CI/CD and maintenance

Eight workflows use `<Category> · <Title>` names and explicit event labels
in `run-name`.

| Workflow | Purpose |
| :------- | :------ |
| `CD · Deploy to Pages` | Build EN/ES; deploy `main` to GitHub Pages |
| `CI · Lint` | Full hooks and Python audit on push, PR, manual dispatch and daily schedule |
| `CI · DCO Check` | Verify sign-off trailers on pull request commits |
| `Security · CodeQL` | Analyze Actions, JavaScript and Python; publish code-scanning results |
| `Security · OpenSSF Scorecard` | Report repository posture through SARIF and the public badge |
| `Quality · Lighthouse` | Run browser contracts and Lighthouse assertions |
| `Maintenance · Link Report` | Validate outbound links and write the Actions summary |
| `Maintenance · uv Lock Report` | Resolve candidate updates, test/audit/build them and report the result |

Schedules use UTC: Lint daily at 08:00; Link Report Mondays at 07:00;
Scorecard Mondays at 09:30; uv Lock Report Tuesdays at 06:00; CodeQL
Thursdays at 10:00.

Dependency maintenance is report-only. The dependency graph and Dependabot
vulnerability alerts are enabled; automated version and security-update
PRs stay disabled. Updates are reviewed and applied manually. Maintenance
workflows do not create issues, branches, commits or pull requests.

### Repository security and merge policy

- **Merge methods**: merge commits disabled; squash and rebase enabled.
  Squash uses the Conventional Commit PR title and preserves commit
  messages and their DCO trailers. Merged PR branches are auto-deleted.
- **`main` protection policy**: PRs, signed commits, linear history and
  successful `lint`, `build` and `Verify DCO Sign-off` checks, with the
  documented single-maintainer administrator bypass. Force pushes and
  branch deletion are disabled. GitHub cannot sign commits recreated by a
  web rebase, so squash is the supported web merge path on the signed branch.
- **Bootstrap**: the classic protection payload is versioned in
  `.github/branch-protection.json`. It is applied after the initial
  `main` push; signature enforcement uses a separate endpoint after GitHub
  verifies that first commit. Remote controls are restored and audited
  after repository recreation, as documented in the runbook.
- **Actions**: read-only default token, no workflow PR creation/approval,
  full-SHA Action pins enforced in source and repository settings.
  Write permissions are scoped to jobs that need them.
- **Security reporting**: private vulnerability reporting, secret scanning
  and push protection. Dependency audits run daily.
- **Pages**: Actions deployment, custom domain `landerox.com`, HTTPS
  enforcement and a deployment environment restricted to `main`.
- **Browser boundary**: a baseline meta CSP restricts resource origins.
  Pages cannot supply custom response headers; header-only CSP controls
  remain a documented limitation, and theme bootstrap requires inline scripts.

### Licensing and documentation

Software, including front-end CSS and JavaScript, is MIT-licensed
(`LICENSE`). Authored Markdown, prose and images use CC-BY-4.0
(`LICENSE-CONTENT`). Third-party fonts retain their upstream licenses and
vendored notices in `content/en/assets/fonts/NOTICE.txt`.

Internal documentation records the stack, decisions and alternatives,
repository layout, design contracts, threat model and recovery procedures.
`AGENTS.md` is the repository's agent-instructions file. The style guide and
scratch artifacts remain local.

[v0.1.0]: https://github.com/landerox/landerox.github.io/releases/tag/v0.1.0
