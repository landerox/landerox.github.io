<!-- markdownlint-disable MD041 MD033 MD013 -->

<p align="center">
  <img src="./content/en/assets/images/banner.svg" width="380" alt="landerox.com Banner" />
</p>

<p align="center">
  <a href="https://landerox.com"><img src="https://img.shields.io/website?url=https%3A%2F%2Flanderox.com&label=landerox.com" alt="Website" /></a>
  <a href="https://github.com/landerox/landerox.github.io/actions/workflows/deploy.yml"><img src="https://github.com/landerox/landerox.github.io/actions/workflows/deploy.yml/badge.svg" alt="Deploy" /></a>
  <a href="https://github.com/landerox/landerox.github.io/actions/workflows/lint.yml"><img src="https://github.com/landerox/landerox.github.io/actions/workflows/lint.yml/badge.svg" alt="Lint" /></a>
  <a href="pyproject.toml"><img src="https://img.shields.io/badge/python-3.14%2B-blue?logo=python&logoColor=white" alt="Python" /></a>
  <a href="https://github.com/astral-sh/uv"><img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/uv/main/assets/badge/v0.json" alt="uv" /></a>
  <a href="https://github.com/zensical/zensical"><img src="https://img.shields.io/badge/Zensical-0.0.71-FF9100" alt="Zensical" /></a>
  <br />
  <a href="https://scorecard.dev/viewer/?uri=github.com/landerox/landerox.github.io"><img src="https://api.securityscorecards.dev/projects/github.com/landerox/landerox.github.io/badge" alt="OpenSSF Scorecard" /></a>
  <a href="https://www.bestpractices.dev/projects/12835"><img src="https://www.bestpractices.dev/projects/12835/badge" alt="OpenSSF Best Practices" /></a>
  <a href="https://www.bestpractices.dev/projects/12835"><img src="https://www.bestpractices.dev/projects/12835/baseline" alt="OpenSSF Baseline" /></a>
  <a href="LICENSE-CONTENT"><img src="https://img.shields.io/badge/content%20license-CC%20BY%204.0-lightgrey" alt="Content License: CC BY 4.0" /></a>
</p>

<!-- markdownlint-enable MD033 MD013 -->

Source code of [landerox.com](https://landerox.com) and its [Spanish
edition](https://landerox.com/es/) — the bilingual site of a Senior Consultant
& Engineer in **Cloud, Data & AI Platforms**.

It is public for one reason: the pipeline *is* the portfolio. The repository
exposes the site's implementation, quality gates and engineering decisions.
Research pages distinguish upstream references, internal studies and planned
work; they do not imply that every experiment has a public implementation.
The reasoning behind each tool is written down in [`docs/`](docs/).

---

## 🔍 What's Inside

1. **Personal home and background** — a first-person home page with proof,
   expertise and a short contact section, plus the professional background
   and how the practice collaborates with engineering teams.
2. **Engineering projects** — [ZDX](https://github.com/landerox/zdx-suite),
   an open-source developer suite for Zsh, reference architectures, and the
   applied-research labs.
3. **Tech Radar** — dated upstream research, adoption
   conditions and proposed tests, presented as readable references with optional
   details. Topic buttons narrow the radar; five Blueprints remain visible
   without filters, with their fit and trade-offs in view.
4. **Local engineering tools** — a technical glossary, an example-led CLI
   and four worksheets, one question each: Failure Lab (a queue during an
   outage and two retry policies), Table Files (files kept before and after
   compaction), Agent Replay (what a crash repeats under four recovery
   strategies) and Eval Statistics (intervals, sample size and judge
   agreement). Each opens on a worked example with preset scenarios, and
   results follow every edit. Visitor inputs stay in the browser; there is
   no chatbot, model or remote execution.
5. **Blog** — nine bilingual comparisons covering storage and lakehouse,
   orchestration, transformation, OLAP/vector/graph databases, BI and
   observability. Workload recommendations identify version, license and
   edition boundaries; every compared tool carries a dated editorial 1–5
   rating with its breakdown, tables list the best rated first, and native
   disclosures retain sources and recovery checks.

## 🛠️ Architecture & Tech Stack

Built for speed, strict dependency management, and long-term maintainability:

- **Static generation** — [Zensical](https://zensical.org), a minimalist
  Python static site generator, in its `modern` theme variant.
- **Environment management** — [`uv`](https://github.com/astral-sh/uv) with a
  committed lockfile, for deterministic and fast resolution.
- **Task automation** — [`just`](https://github.com/casey/just) as the single
  entry point for every local workflow.
- **Infrastructure** — continuous deployment to **GitHub Pages** via **GitHub
  Actions**, with no server, database, or runtime backend of any kind.

> **On architecture:** every choice here has a written rationale, including
> the alternatives that were rejected and what would trigger a re-evaluation.
> Start at [`docs/decisions.md`](docs/decisions.md) and
> [`docs/tooling.md`](docs/tooling.md). The front end has its own document —
> [`docs/design.md`](docs/design.md) — covering design tokens, both palettes
> with computed contrast ratios, typography and font provenance, and the
> accessibility and performance budget.

## ✅ Quality Gates

The repository defines hooks across the `pre-commit` and `commit-msg` stages;
the file-oriented checks run again across the whole tracked tree in CI:

| Area | Enforced by |
| :--- | :--- |
| Prose & spelling | `cspell` (English + Spanish dictionaries), `markdownlint-cli` |
| Front-end sources | `eslint` (recommended rules), `stylelint`, and `tsc` type checks on the DOM-free modules |
| Build scripts | `ruff check` on `scripts/` |
| Interactive logic | Node's built-in tests for the CLI utilities (including `rate` and `jwt`), glossary data, reference topic filters, the four worksheets, scenario links and the availability hours |
| Workflows | `actionlint` (syntax), `zizmor` (security, hash-pin policy) |
| Secrets | `gitleaks` on every staged file |
| Dependencies | `pip-audit`, scoped to production dependencies |
| Bilingual parity | `scripts/check_i18n.py` — content, shared configuration and navigation symmetry |
| Published glossary | `just check-glossary` — static definitions and acronym tooltips match the bilingual JSON catalog |
| Blog ratings | `just check-ratings` — every rating table lists tools from highest to lowest |
| Blog version pins | `just check-blog-pins` — each license link, label and review month matches the reviewed version, identically in both locales |
| Site contracts | Python `unittest` for shared configuration, navigation, sitemaps and rating order |
| Automation scope | `scripts/check_report_only_automation.py` — maintenance workflows stay report-only |
| Browser interactions | Locked Python Playwright in Quality CI: keyboard, locales, contrast, mobile tables and tools, with axe-core on the dialog, the CLI, the intro video, every tool, Home and the card grids |
| Internal links | Zensical strict mode during every build |

Nine GitHub Actions workflows carry it further: **build and deploy**,
**lint**, **DCO sign-off**, **CodeQL** (JavaScript, Python and the Actions
workflows themselves), **OpenSSF Scorecard**, **Lighthouse CI**
(accessibility, SEO, best-practices, layout-shift and zero third-party request
budgets across all forty-two pages of both locales except the 404,
including Open Source, the Tech Radar, Blueprints, the glossary and all Blog
comparisons), read-only **link validation** with `lychee` reporting to the job
summary, a weekly read-only lockfile report that tests candidate updates
against the full lint and build gates, and a weekly report of Blog pins that
trail their upstream tags. None of them creates a commit, branch, pull
request or issue.

Supply chain: every Action pinned to a full commit SHA, Conventional Commits
validated by `commitizen`, and DCO sign-off required on every commit.
Classic branch protection requires `lint`, `build` and `Verify DCO Sign-off`;
the sole administrator retains an explicit bypass. Remote controls must be
restored and checked after repository recreation; files alone cannot enforce
them. See the recreation
[checklist](docs/runbook.md#repository-recreation-and-the-v010-baseline).

## 🚀 Local Development

Requires **Python 3.14+**, [`uv`](https://github.com/astral-sh/uv),
[`just`](https://github.com/casey/just), and **Node.js LTS** (match the pin
in `.pre-commit-config.yaml`) for the glossary check that `just build` runs,
the built-in JavaScript tests and `just lighthouse`.
Two optional binaries back single recipes:
[`lychee`](https://github.com/lycheeverse/lychee) for `just links`
and [`pinact`](https://github.com/suzuki-shunsuke/pinact) for
`just pin-actions`. Node-based linters are bootstrapped by `pre-commit`
itself the first time they run.

```bash
# 1. Clone the repository
git clone https://github.com/landerox/landerox.github.io.git
cd landerox.github.io

# 2. Install dependencies, then the git hooks
just sync
just hooks-install

# 3. Start a development server
just serve               # English  — http://127.0.0.1:8000
just serve-es            # Spanish  — http://127.0.0.1:8001
```

Everyday commands:

```bash
just build        # static build of both locales into site/
just lint         # the full pre-commit suite, exactly as CI runs it
just test         # offline suites: workbench, site contracts, hook preparation
just links        # validate outbound links with lychee
just blog-versions # report Blog pins that trail upstream tags
just check-i18n   # EN/ES content and shared configuration
just glossary     # regenerate both public glossary pages after catalog edits
just install-browser # install Chromium for the pinned Playwright package
just test-browser # browser regressions against the current build
just test-workbench # CLI, glossary, filters, the four tools and availability
just lighthouse   # Lighthouse CI locally, same config as the Quality workflow
just commit       # commitizen-guided Conventional Commit, signed off
```

Running `just` with no arguments lists every available task.

## 📂 Repository Structure

| Path | Contents |
| :--- | :--- |
| `content/en/`, `content/es/` | Bilingual Markdown sources. Shared styles, scripts, fonts, images and the glossary catalog under `content/es/assets/` are **generated** from the English tree and are not tracked; root-wide assets (the manifest, `robots.txt` and the intro video under `assets/media/`) remain in the English tree by design. |
| `zensical.toml`, `zensical.es.toml` | Site generator configuration, one per locale, kept in sync by hand. |
| `includes/{en,es}/` | Generated acronym tooltips, appended to every page of the locale. |
| `overrides/` | Theme template overrides. `main.html` provides page metadata, social tags, app icons, font preloads, a baseline CSP and the palette-storage bridge; five partials provide the named progressbar, a repository link that never calls api.github.com, the equivalent-page language selector with the Glossary/CLI control, the copy-as-Markdown button shown on reading pages only, and the footer's profile links with the intro's clapperboard. |
| `docs/` | Why the stack looks like this: tooling, decisions, repo structure, design system, threat model, and the incident runbook. |
| `scripts/` | Build-time helpers, bilingual symmetry checker, build-output verifier, post-build sanitizer, interactive-logic tests and the guard that keeps dependency automation report-only. |
| `.github/workflows/` | CI/CD, security scanning and scheduled maintenance. |
| `CHANGELOG.md` | A hand-written description of the platform's **current state**, not a running history. Git history records how it got here. |

## 🤝 Contributing

This is a personal site, but technical corrections, bug reports and
suggestions are welcome. Please read the [Contributing
Guidelines](.github/CONTRIBUTING.md) before opening an issue or a pull
request — commits must follow Conventional Commits and carry a DCO sign-off
(`git commit -s`).

## 📄 License

Three surfaces, split by what a file *is* rather than which directory it sits
in:

- **Source code** — [MIT](LICENSE). `pyproject.toml`, `.github/`, `scripts/`,
  `overrides/`, tooling configuration, and the front-end sources under
  `content/**/assets/stylesheets/` and `content/**/assets/javascripts/`.
  Those last two live under `content/` because that is where the generator
  looks for assets, but they are software and are licensed as such.
- **Site content** — [CC-BY-4.0](LICENSE-CONTENT). Markdown under `content/`,
  images and the intro video (generated media included), and authored prose.
- **Third-party assets** — upstream terms, covered by neither of the above:
  the self-hosted fonts under `content/**/assets/fonts/` (Inter and Outfit
  under OFL-1.1, MesloLGM Nerd Font under Apache-2.0), with notices vendored
  beside them in [`NOTICE.txt`](content/en/assets/fonts/NOTICE.txt).

The full boundary rule and its rationale are in [Content licensing
(dual-license model)](docs/decisions.md#16-content-licensing-dual-license-model).
