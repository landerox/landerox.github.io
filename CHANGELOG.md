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
  Each Home expertise card states client work and links to its evidence
  (two About experience entries, Production Blueprints and the lakehouse
  comparison); an indicator under the portrait is green inside the working
  hours (Monday to Friday, 08:00–20:00 Caracas time) and grey outside them;
  four tool cards lead to the interactive tools. Tech Stack says, row by
  row, where each tool group was used for clients and where it is still
  being studied. Shared positioning, contact labels and metadata keep the
  site consistent.
- **Projects**: Open Source, Production Blueprints, Research Labs, Tech
  Radar and Interactive Tools. The Open Source page presents ZDX, the
  maintainer's MIT-licensed developer suite for Zsh, with its source and
  reproducible walkthrough. ZDX leads the Projects index.
- **Production Blueprints**: five references covering cloud foundations,
  private/hybrid cloud, analytical platforms, AI serving and agent workflows.
  Each describes its scope, operational trade-offs and acceptance gates.
- **Research Labs**: eleven studies organized into three active, two
  completed and six planned entries. Their purpose, evidence and lifecycle
  remain visible; private client implementations are not published. A study
  links its public companion tool, or the related client work, where one
  exists.
- **Tech Radar**: ten dated references with four topic filters, visible
  recommendations and adoption conditions, and native disclosures for
  supporting sources. The original content remains readable without
  JavaScript; direct links and printing reveal the relevant evidence.
- **Blog**: nine bilingual comparisons covering object storage, workflow
  orchestrators, OLAP, vector databases, transformation, BI, lakehouse
  formats, graph databases and observability, indexed by category cards and
  a four-column rating rubric. Articles retain reviewed editions, licenses,
  official sources, workload recommendations and dated editorial ratings.
  Ratings follow five documented criteria and tables are checked for
  descending order; they are not benchmarks. Pinned versions are a dated
  snapshot: a weekly report lists the pins that trail upstream, and a
  refresh confirms the releases, compares license files and moves the
  review date.
- **Architecture overviews**: Blueprints, Research Labs, the Blog index and
  every Blog article carry a bilingual four-stage HTML diagram: the stages
  are stations on one rail, four columns on wide screens and one on narrow
  ones, and their text reflows and remains readable without JavaScript.
- **Public glossary**: 59 bilingual terms rendered as a responsive two-column
  card grid with domain badges, definitions, examples, caveats, related terms,
  practice links and primary sources. The same catalog generates both public
  glossary pages and acronym tooltips.
- **Discovery and navigation**: equivalent-page language switching,
  reciprocal sitemap language alternates, robots.txt, canonical URLs,
  Open Graph and Twitter metadata with a social card per page (drawn at
  build time; the home pages keep the hand-made card) and a manifest with
  PNG and maskable icons, plus an Apple touch icon. Blog articles carry
  their own title and `og:type` `article`.
  Each locale publishes a Blog Atom feed, and article `TechArticle` JSON-LD
  from the reviewed front matter that names the article's own card. The
  About pages carry `ProfilePage` data.
- **Markdown for agents**: each locale publishes an `llms.txt` summary and a
  Markdown twin (`index.md`) of every listed page, linked from the page head
  (`rel="describedby"`, `rel="alternate" type="text/markdown"`). On reading
  pages (Blog, glossary, Labs, Radar and Blueprints) a button beside the
  title copies the page as Markdown. Both are generated at build time by the
  site generator's `llmstxt` plugin; nothing calls an AI service.
- **404 handling**: one Pages entry point routes missing Spanish paths to
  the Spanish 404 page and other paths to English. Both pages use
  `noindex`, and post-processing keeps them out of the sitemaps. Each shows
  the failed request as a small retry and dead-letter rail with a text
  alternative, then four destinations and the search box.

### Front end and browser tools

- **Zensical Modern theme**: shared semantic CSS tokens define light and
  dark surfaces, typography, contrast, spacing, motion and controls.
  Inter, Outfit and MesloLGM Nerd Font are self-hosted as `woff2`. Reading
  text takes the full column with no character measure, page leads are
  standfirsts closed by a hairline, and mono eyebrows label two home
  sections and the 404.
- **Cards**: a link card holds one link, stretched over the whole card,
  and lifts on hover or keyboard focus. Reading cards (glossary entries and
  Collaboration's four areas) only change their border color, an
  architecture stage only lights its station, and disclosure summaries
  change their text color.
- **Native JavaScript modules**: one entry point loads feature modules;
  pure logic stays in DOM-free core modules. Tools load on demand and share
  DOM and table helpers. Custom tools use native browser APIs and have no
  npm application build.
- **Accessible interaction**: keyboard controls and focus restoration,
  visible focus rings, native theme search dialog and ARIA state with a
  small Spanish localization bridge for its labels and status messages,
  scrollable mobile tables, forced-colors support and print rules.
  Static reading and formulas remain available without JavaScript.
- **Palette and motion**: two explicit color schemes with persistence
  across locales, a palette transition and a motion toggle. The ambient
  network pauses in hidden tabs and becomes one still frame under reduced
  motion. Shared preferences use the root storage scope.
- **Toolbox**: a native dialog with a Glossary tab and a CLI tab, titled
  Toolbox / Caja de herramientas and subtitled to say that everything runs in
  the browser, launched from one header icon between the language selector
  and search. The initial HTML links to the glossary without JavaScript. The
  dialog reopens on the tab used last, and a shortcut opens the CLI directly.
  The CLI has 20 commands, examples, help, completion, bounded
  history and local calculations; shell habits such as `ls` get an
  explanation instead of a bare error. JWT decoding never claims signature
  verification; the same-origin HTTP ping does not claim to perform ICMP.
  Clicking the CLI tab focuses the command line, and the theme's single-key
  page shortcuts do not fire inside the dialog. The `intro` command, named
  in the CLI's hint line, plays the site's 21-second intro video.
- **Intro video**: a native dialog with one cut per locale, opened by a
  clapperboard after the footer's profile links or by the CLI command. It
  is rendered from code, with generated sound effects, an original
  generated riff and no speech. Sources attach on first opening (AV1 WebM,
  H.264 MP4 as the fallback); it plays with sound, waits on its poster
  under reduced or paused motion, rewinds when closed, returns focus to the
  control that opened it and carries a transcript for screen readers.
- **Four tools, one question each**: Failure Lab (a queue during an outage,
  guided incident drills that run until the queue drains, an event
  conservation check and two retry policies on the same incident), Table
  Files (workload presets, a small-file and partitioning diagnosis, and the
  files kept before and after compaction), Agent Replay (incident presets,
  what a crash repeats under four recovery strategies and unrecorded-write
  diagnosis) and Eval Statistics (mode-aware presets, Wilson interval,
  sample size and Cohen's kappa). A question index opens the page; every
  tool starts from a worked example, its result follows each edit, and a
  preset stays pressed only while the inputs match it. Table Files, Agent
  Replay and Eval Statistics end with a diagnosis box: labelled proportion
  bars whose values are also stated in words, and one takeaway sentence;
  the tools draw no charts. Scenario links restore validated inputs from the
  URL fragment. Simulations and estimates state their assumptions and limits
  under one disclosure name; they run no model and do not claim remote
  execution or measured hardware results.
- **Visitor data**: inputs stay in the browser. Assets are served from the
  site's own origin, and the platform has no application server, database,
  account system, analytics or third-party browser requests.

### Stack and repository organization

The site runs on Python 3.14 and Zensical 0.0.71; Pillow draws the social
cards during the build and the generator's `llmstxt` plugin writes the
Markdown for agents. `uv` installs Python dependencies from `uv.lock`;
`just` groups the development, build, content, quality, test, dependency,
Git, release and security commands. Node.js 24 LTS runs the glossary
generator, built-in Node tests and isolated Node hooks.

| Path | Responsibility |
| :--- | :------------- |
| `content/en/`, `content/es/` | Authored Markdown with parallel locale paths |
| `content/en/assets/` | Shared CSS, JavaScript, fonts, images, the intro video and glossary source |
| `zensical.toml`, `zensical.es.toml` | Locale builds, shared theme and navigation configuration |
| `overrides/` | Shared theme template and metadata overrides |
| `includes/` | Generated locale acronym tooltips |
| `scripts/` | Build contracts, generators, policy checks, hook preparation and tests |
| `.github/` | Workflows, contribution policies and branch-protection payload |
| `.config/` | Linter, link-validator, 404 router and Lighthouse settings |
| `docs/` | Stack, decisions, structure, design, security assessment and runbook |
| `pyproject.toml`, `uv.lock`, `Justfile` | Dependencies, version configuration and task entry points |

Spanish shared assets are generated from the English tree on every serve
and build. They are not edited or committed independently; the intro video
is not copied, and both locales request it from the root. Build output,
dependencies, local settings, reports and `.tmp/` are ignored. The intro
video is committed as rendered files; its render sources are not part of
the repository.

Python dependencies are locked and hook repositories use pinned revisions.
Some Node hooks resolve npm version ranges, so their transitive dependency
trees are not fully locked by those Git revisions.

### Build and quality gates

`just build` checks bilingual symmetry and generated glossary output,
synchronizes shared assets including nested images, builds both locales in
strict mode and verifies every rendered page and its local image references.
Before post-processing, a combined check of both locale trees rejects a
partial bilingual build. Post-processing sanitizes HTML, cleans the Markdown
for agents and produces reciprocal sitemap alternates for the indexable
pages, Blog feeds and article metadata.

- **Pre-commit**: file hygiene, syntax, bilingual spelling, Markdown,
  Python, JavaScript and CSS linting, type checks on the DOM-free JavaScript
  modules, Action syntax and security analysis, secret scanning,
  report-only automation policy, Python dependency audit, glossary
  consistency, rating order, Blog version pins, locale contracts, site
  contracts, hook preparation and six Node test files. `just test` runs the
  offline test suites together.
- **Hook preparation**: Lint and the weekly lockfile report test and use a
  shared Python helper before validation. Installed environments are cached
  by platform, runtime versions, pins and preparation policy. npm range
  resolution uses a one-day minimum release age. Recognized download
  failures receive at most two retries after 60 and 120 seconds; persistent
  failures remain blocking, and lint and audits run once.
- **Commit policy**: Conventional Commits, signed commits and DCO
  `Signed-off-by:` trailers. The initial commit uses a lowercase English
  Conventional Commit subject. Commitizen validates commit messages and
  manages the version files; release commands create signed tags.
- **Browser contracts**: Playwright and its matching Chromium are pinned
  through the Python lockfile. Tests copy the current bilingual build into a
  disposable directory and cover keyboard/focus/history, locale metadata,
  lazy loading, glossary retry and printing, mobile tables, scenario links,
  contrast and motion, the header control at every width and the keyboard
  boundary of its dialog, the intro's command and footer clapperboard,
  with its on-demand video and focus return, one link per link card, the home
  tool cards, tool presets, drills and results that follow each edit, and
  bilingual rail diagrams with readable text.
  axe-core checks WCAG 2.2 A/AA and its best practices on the states
  Lighthouse never opens: the dialog, the CLI, the intro video and every
  tool, plus Home in both palettes and the Projects and Blog card grids.
- **Lighthouse CI**: 42 URLs, every page of both locales except the 404,
  three runs each. Accessibility requires 1.0; SEO, best practices, layout
  shift and zero third-party requests are blocking. Performance below 0.9
  and resource-size budgets warn. These checks run after the browser
  interaction gate.
- **External links**: `just links` and the weekly report use the same Lychee
  configuration and inputs.

### CI/CD and maintenance

Nine workflows use `<Category> · <Title>` names and explicit event labels
in `run-name`.

| Workflow | Purpose |
| :------- | :------ |
| `CD · Deploy to Pages` | Build EN/ES; deploy `main` to GitHub Pages |
| `CI · Lint` | Full hooks, including the Python audit, on push, PR, manual dispatch and daily schedule |
| `CI · DCO Check` | Verify sign-off trailers on pull request commits |
| `Security · CodeQL` | Analyze Actions, JavaScript and Python; publish code-scanning results |
| `Security · OpenSSF Scorecard` | Report repository posture through SARIF and the public badge |
| `Quality · Lighthouse` | Run browser contracts and Lighthouse assertions |
| `Maintenance · Link Report` | Validate outbound links and write the Actions summary |
| `Maintenance · uv Lock Report` | Resolve candidate updates, test/audit/build them and report the result |
| `Maintenance · Blog Version Report` | Compare the versions pinned by the Blog with upstream tags and report the ones that trail |

Schedules use UTC: Lint daily at 08:00; Link Report Mondays at 07:00;
Scorecard Mondays at 09:30; uv Lock Report Tuesdays at 06:00; Blog Version
Report Wednesdays at 06:30; CodeQL Thursdays at 10:00.

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
  remain a documented limitation, and the theme bootstrap and the
  template's palette-storage bridge require inline scripts.

### Licensing and documentation

Software, including front-end CSS and JavaScript, is MIT-licensed
(`LICENSE`). Authored Markdown, prose, images and video, generated media
included (the intro video and poster, social cards and app icons), use
CC-BY-4.0 (`LICENSE-CONTENT`). Third-party fonts retain their upstream
licenses and vendored notices in `content/en/assets/fonts/NOTICE.txt`.

Internal documentation records the stack, decisions and alternatives,
repository layout, design contracts, threat model and recovery procedures.
`AGENTS.md` is the repository's agent-instructions file. The style guide
(`docs/style-guide.md`) and scratch files are gitignored and never
published.

[v0.1.0]: https://github.com/landerox/landerox.github.io/releases/tag/v0.1.0
