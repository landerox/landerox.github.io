# Stack Decisions — landerox.github.io

> Living document. Per category: comparison of considered
> alternatives, chosen tool, and rationale.
>
> For a **quick reference** of the current stack without the
> deliberations, see [`tooling.md`](./tooling.md).
>
> **Last reviewed:** 2026-09-25

## Repository context

Bilingual (EN/ES) personal static site built with **Zensical (Python)**.

- Volume: a few dozen Markdown files.
- Maintainer: one (solo).
- Commit cadence: low (≈ 1–3 / week).
- Deployment: GitHub Pages via GitHub Actions.

This profile matters: **many "modern" optimizations are designed
for large monorepos with sizable teams**. Here the migration cost
almost always exceeds the speed benefit.

## Evaluation criteria

Every decision is evaluated against these five criteria, in this
order:

1. **Functional fit** — does it do exactly the job I need?
2. **Migration cost** — how much config / habit must be redone?
3. **Maturity and maintenance** — releases, community, bus factor.
4. **Fit with the existing stack** (`uv`, `just`, `pre-commit`, GH Actions).
5. **Speed** — only matters when there is measured friction (>5 s).

> **Anti-vanity policy:** a working tool is not migrated just
> because a "more modern Rust one" exists. Migration happens when
> there is a tangible benefit (security, new capability, real
> friction removed).
>
> **Exception: personal affinity.** When no alternative clearly
> wins on the five criteria above, "wanting to try the tool" or
> "affinity with its ecosystem" is a legitimate criterion, provided
> the switching cost is low and there is an exit plan. It must be
> declared explicitly in the affected category's decision.

---

## 0. Static site generator (SSG)

| Tool                | Language    | Maturity      | Type                | Notes                                              |
| :------------------ | :---------- | :------------ | :------------------ | :------------------------------------------------- |
| **Zensical**        | Python      | Young (0.0.x) | Docs-style SSG      | "Modern" successor of Material for MkDocs (Squidfunk). |
| MkDocs Material     | Python      | Very mature   | Docs-style SSG      | De facto standard for technical docs.              |
| Hugo                | Go          | Very mature   | Generalist SSG      | The fastest on the market.                         |
| Astro               | TypeScript  | Mature        | Content-first SSG   | MDX, islands, JS ecosystem.                        |
| Zola                | Rust        | Mature        | Generalist SSG      | Single binary, fast.                               |
| Eleventy (11ty)     | JavaScript  | Very mature   | Flexible SSG        | Highly configurable.                               |

**Decision:** ✅ **`zensical`**.
**Status:** In use.
Both locale configurations enable `strict = true`, so Zensical's
internal-link validation warnings fail the build instead of reaching
production unnoticed.
**Rationale (frankly):** If this were a purely objective choice,
**Hugo**, **Astro**, or **MkDocs Material** would win on maturity
and ecosystem. Zensical is at `0.0.x`: new, young, with fewer
plugins and less community. The choice falls under the **personal
affinity exception**:

- Interest in trying the successor of Material for MkDocs (Squidfunk
  lineage, whose philosophy resonates with the rest of the stack).
- Cultural fit with an already-Python stack (`uv`, `pre-commit`,
  `commitizen`).
- Low switching cost: content is standard Markdown; migrating to
  Hugo / Astro / MkDocs Material is doable in a few days if
  Zensical stalls.

**Exit plan (if migration becomes necessary):**

- Markdown is already in standard format.
- `content/en` and `content/es` are portable to any SSG with i18n
  support.
- What would be lost: specific `zensical.toml` configuration (menu,
  theme), but these usually have trivial equivalents.

**Re-evaluate if:**

- Zensical does not advance to `0.1.x+` within 12 months (dead
  project risk). Upstream has announced 0.1.0, the first dependable
  release line, for 2026-11-05; re-read this section when it ships.
- A blocking capability appears that the ecosystem does not cover.
- Maintenance starts generating real friction (unfixed bugs,
  releases that break things).

**Release review, 0.0.65 (2026-09-26).** Adopted as the pinned release. Its
templates, compiled theme CSS and bundle are byte-identical to 0.0.64
(`diff -r` of the installed `templates/`), so no override needs
recalibration. Not adopted: the native `rss` plugin replacement (RSS 2.0 and
JSON Feed). The Blog's Atom feed already takes each entry's `updated` from the
same `reviewed` field as the `TechArticle` JSON-LD, and the browser gate
checks that they agree; revisit if the native feed can read that field.

**Release review, 0.0.60–0.0.64 (2026-09-22).** Adopted: `extra.scope = "/"`
so stored preferences span both locales; removal of `search.suggest`, which
nothing in the 0.0.64 bundle reads; removal of the three-attempt build
retry, whose cause (#641) was fixed in 0.0.58, keeping the output verifier as
a hard failure. Not adopted, with reasons:

- **Native blog plugin (0.0.64)** — dated posts, categories and archives
  would change every Blog URL and the nav, and its RSS is still unreleased.
  The comparisons are reviewed documents with explicit review dates, not a
  post stream. `scripts/post_build.py` publishes an Atom feed per locale and
  `TechArticle` JSON-LD from each article's `reviewed` front matter instead.
  The feed shipped in 0.0.65; see the review above.
- **Anchor redirects (0.0.61)** — enabling the plugin makes every page
  fetch `redirect.json`; the four legacy Labs anchors cost fifteen lines of
  `features/deep-links.js`.
- **Native reveal of tabs/details on anchor links (0.0.62)** — overlaps
  `revealHashTarget()`, which stays: it is a no-op when the theme already
  opened the target and still owns the legacy-anchor forwarding.
- **`meta`, `minify`, `tags` (0.0.58)** — no current need: front matter is
  per page and short, GitHub Pages already compresses, and the site has no
  cross-page taxonomy yet.

---

## 1. Python package manager

| Tool       | Language | Lockfile  | Speed         | Maturity       |
| :--------- | :------- | :-------- | :------------ | :------------- |
| **uv**     | Rust     | Yes       | Ultra fast    | 2025 standard  |
| pip        | Python   | Not nat.  | Slow          | Universal      |
| poetry     | Python   | Yes       | Medium        | Mature         |
| pdm        | Python   | Yes       | Medium        | Mature         |
| hatch      | Python   | Partial   | Medium        | Mature         |

**Decision:** ✅ **`uv`**
**Status:** In use.
**Rationale:** State of the art. Reproducible lockfile, native
integration with `pyproject.toml`, GitHub Actions cache support
via `astral-sh/setup-uv`.

---

## 2. Task runner

| Tool   | Language | Syntax      | Cross-platform | Notes                        |
| :----- | :------- | :---------- | :------------- | :--------------------------- |
| **just** | Rust   | Justfile    | Yes            | Simple, no fragile tabs       |
| make   | C        | Makefile    | POSIX          | Tabs, arcane syntax           |
| task   | Go       | YAML        | Yes            | More verbose                  |
| mise   | Rust     | TOML        | Yes            | Mixes tasks + version mgr     |

**Decision:** ✅ **`just`**
**Status:** In use.
**Rationale:** Readable syntax, without `make`'s pitfalls. `mise`
would be over-engineering for this repo: Node is the only runtime besides
Python, and its one LTS pin is kept by convention in
`.pre-commit-config.yaml` and the workflows (SoT table in § 14).

---

## 3. Hook runner (pre-commit family)

This is the category with most nuance. `lefthook` and `prek` are
legitimate modern alternatives and deserve detailed evaluation
before deciding.

| Tool           | Language | Config                    | Drop-in `.pre-commit-config.yaml` | Parallelism  | Hook catalog          | Distribution          |
| :------------- | :------- | :------------------------ | :-------------------------------- | :----------- | :--------------------- | :-------------------- |
| **pre-commit** | Python   | `.pre-commit-config.yaml` | —                                 | Limited      | Huge (standard)        | PyPI                  |
| prek           | Rust     | `.pre-commit-config.yaml` | **Yes**                           | Yes          | Reuses pre-commit's    | Cargo, binstall       |
| lefthook       | Go       | `lefthook.yml`            | No (rewrite)                      | Yes (native) | Manual / binaries      | Binary, npm, brew     |
| husky          | Shell    | `.husky/`                 | No                                | Manual       | Empty                  | npm                   |

### Arguments in favor of `lefthook`

- **Native parallel execution**, declaratively defined per stage —
  more explicit than `pre-commit`'s serial model.
- **No venv management or hook repo clones**: invokes system
  binaries. Fits very well if tools are replaced with their
  precompiled Rust/Go equivalents (`typos`, `dprint`, `actionlint`,
  `zizmor`, `pinact`).
- **More expressive config**: `glob:`, `exclude:`, `tags:`, `skip:`
  by branch or command — useful for advanced flows or monorepos.
- **Growing industry adoption**: created by Evil Martians, used at
  GitLab and other tech companies. Legitimately "modern standard"
  for 2025+.
- **Simple deployment**: a single Go binary, no Python.

### Arguments in favor of keeping `pre-commit`

- **Zensical is Python**: the venv already exists; "removing
  Python" is not a net win — it is a dependency you are already
  paying for via the dev server.
- **`pre-commit-hooks` catalog** in current use: `check-yaml`,
  `check-toml`, `check-json`, `check-merge-conflict`,
  `mixed-line-ending`, `trailing-whitespace`,
  `check-added-large-files`, `check-case-conflict`, `check-symlinks`,
  `end-of-file-fixer` — **10 hooks** that under `lefthook` must be
  replaced manually with scripts or alternative binaries. Not trivial.
- **`pre-commit autoupdate`**: automatic rev updates; `lefthook`
  has no native equivalent (requires Dependabot or similar).
- **Declarative hook versioning**: in `pre-commit`, each hook ships
  with a fixed `rev:`. In `lefthook` you invoke the installed
  binary, which shifts versioning to another tool (system package,
  Dependabot, etc.).
- **Repo volume**: the 10 catalog checks above plus a small set of tool
  hooks across a few dozen files. Review the actual entries in
  `.pre-commit-config.yaml`; observed latency, not the count alone,
  determines whether a runner migration is worthwhile.

### When to choose each (general rule, not specific to this repo)

| Scenario                                                        | Choose         |
| :-------------------------------------------------------------- | :------------- |
| Python repo with a `pre-commit-hooks` catalog already configured | `pre-commit`   |
| You want speed without migrating existing config                 | `prek`         |
| 100 % Rust/Go binary stack, monorepo, or several runtimes        | `lefthook`     |
| Node-only repo with no hooks beyond formatting                   | `husky`        |

### Decision for this repo

**Decision:** ✅ **`pre-commit`** (keep), with **`prek` as drop-in
substitute** if local latency becomes annoying.
**Status:** In use. `prek` is a no-cost optional upgrade.

**Concrete rationale** — `lefthook` *is* more modern and *would
be* the right choice if at least one of the following held:

1. the repo were not already Python (does not apply: Zensical is), or
2. orchestrating binaries across multiple runtimes were needed
   (does not apply: only the current hooks are needed), or
3. the cost of parallelism were measurable (does not apply: the
   suite runs in seconds), or
4. the project would grow heavily in hook surface (does not apply:
   stable personal site).

Migrating to `lefthook` here means paying a migration cost (rewrite of the
current tool hooks, substitutes for the 10 `pre-commit-hooks` catalog
entries, rewriting `hooks-install` / `hooks-update` in `Justfile`,
mental retraining) without tangible gain. The "Anti-vanity policy"
section applies directly.

**Re-evaluated 2026-09-01.** The suite then had 21 entries, which tripped
the previous size trigger. Decision kept: 10 were catalog checks
`lefthook` has no substitute for, the whole suite still runs in
seconds, and every tool hook is a Node, Go or Python binary that
`pre-commit` already versions through `rev:`. The size trigger moves to
~25 entries; the other three conditions are unchanged.

**Re-evaluate `lefthook` in the future if:**

- a second runtime (Node, Rust, Go) is added to the repo, or
- the hook suite grows beyond ~25 entries, or
- local latency >5 s is regularly measured, or
- ≥3 current hooks get replaced by direct Rust/Go binaries (the
  `pre-commit-hooks` catalog argument no longer applies).

*Re-evaluated 2026-09:* Node is now a system runtime for two local hooks
(`check-glossary` and `test-workbench`) and for `just build`. `lefthook`
would need the same Node, so the switch would not remove the dependency.
The suite sits at 25 entries, the threshold, not beyond it. The decision
stands.

---

## 4. Conventional Commits and release

| Tool           | Language | CC validation | Version bump | Changelog | Interactive prompt |
| :------------- | :------- | :------------ | :----------- | :-------- | :----------------- |
| **commitizen** | Python   | Yes           | Yes          | Yes       | `cz commit`        |
| cocogitto (cog)| Rust     | Yes           | Yes          | Yes       | `cog commit`       |
| convco         | Rust     | Yes           | Partial      | Yes       | No                 |
| commitlint     | Node     | Yes           | No           | No        | Via Commitizen     |

**Decision:** ✅ **`commitizen`** (keep) — used for **validation +
SemVer bump + tag creation only**. The **changelog is written by hand**
as a current-state baseline (see below).
**Status:** In use.
**Rationale:** `commitizen` covers two of the three jobs without extra
dependencies (Python is already in the stack). Migrating to `cog`
means rewriting `tool.commitizen`, redefining `version_files`, losing
the interactive `cz commit`. For 1–3 commits/week, gaining
milliseconds does not compensate.

### Changelog format (manual, current-state baseline)

| Approach                        | What a reader gets                            | Maintenance |
| :------------------------------ | :-------------------------------------------- | :---------- |
| **Current-state baseline**      | What the platform *is*, in one place          | Edit the affected description in place |
| Keep a Changelog (per-release)  | What changed in each cut                      | Append entries, then curate at release |
| `cz changelog` (auto-generated) | Commit subjects grouped by type               | None, but exposes commit boundaries |

**Decision:** ✅ **Single current-state baseline**, written by hand.
**Status:** In use.

`CHANGELOG.md` describes the repository as it stands today — content,
front end, toolchain, automation, security posture, licensing. There is
no `[Unreleased]` section and no `Added` / `Changed` / `Fixed` /
`Removed` groupings. When something lands, the affected description is
**edited in place** so the document stays true.

**Rationale:** this is a personal site with one maintainer, not a
library with downstream consumers pinning versions. Nobody needs to
diff v0.3.1 against v0.3.0 to decide whether to upgrade. What a visitor
actually wants is an accurate answer to "what is this and how does it
work", and a per-release history buries that under accumulated deltas
that are individually meaningless a month later. Git history already
records how the state was reached, in more detail and without manual
transcription.

**Auto-generation from commits is deliberately not used**, for the same
reason it would not help a per-release changelog:

- A single user-visible change often spans several commits (refactor +
  docs + lockfile); generated output exposes the internal commit
  boundary instead of the narrative the reader needs.
- At 1–3 commits/week, writing by hand costs almost nothing and reads
  far better.

**Workflow for a release:**

1. Confirm `CHANGELOG.md` still describes reality; correct any
   description the release invalidated.
2. (Optional) `just release-preview` (`cz bump --dry-run`) to audit the
   SemVer increment commitizen would infer before touching any file.
3. `just bump` — `cz bump --version-files-only` infers the SemVer increment
   and updates `pyproject.toml` and `uv.lock`; the recipe then commits them
   with `git commit -s` and creates the signed tag
   (`tag_format = "v$version"`). `cz bump` alone cannot add the DCO sign-off
   that every commit needs. It does not touch the changelog body.
4. Push tag + commit. GitHub Release notes are written per release from
   the git log, which is where per-release detail belongs.

These are owner-run operations. For a repository recreation and an initial
`v0.1.0` baseline, use the recreation
[checklist](runbook.md#repository-recreation-and-the-v010-baseline)
instead of automatically bumping the version. Never move an existing tag to
make it appear to describe a different commit.

**Re-evaluate if:** the repository ever ships something consumed by
third parties on a version pin — a published package — at which point
per-release entries start earning their keep.

---

## 5. Spell checker / prose linter

> **Important:** `cspell` and `typos` solve different problems.
> They are not interchangeable.

| Tool       | Language | Type                          | ES support | Fit                            |
| :--------- | :------- | :---------------------------- | :--------- | :----------------------------- |
| **cspell** | Node     | Spell checker (dictionary)    | Yes        | Good for bilingual prose       |
| typos      | Rust     | Known-typos detector          | Poor       | Designed for identifiers/code  |
| vale       | Go       | Prose linter (style)          | Yes        | State of the art for content sites |
| hunspell   | C++      | Traditional spell checker     | Yes        | No comfortable pre-commit integration |

**Decision:** ✅ **`cspell`** (keep) — **evaluate adding `vale`**
as a complementary style linter.
**Status:** In use. `vale` pending evaluation.
**Rationale:** The site is EN/ES content; `typos` is designed for
code and its Spanish coverage is weak. `vale` brings new
capabilities (style, passive voice, ableism) that `cspell` does
not cover — it is **additive**, not a substitute.

---

## 6. Markdown lint and format

> Lint and formatting are different jobs. The original proposal
> suggested replacing them with a single formatting tool, which
> drops the lint rules.

| Tool                 | Language | Type       | Rules (MD013…) | `--fix` |
| :------------------- | :------- | :--------- | :------------- | :------ |
| **markdownlint-cli** | Node     | Linter     | Yes            | Yes     |
| dprint               | Rust     | Formatter  | No             | Format  |
| prettier             | Node     | Formatter  | No             | Format  |
| mado                 | Rust     | Linter     | Partial        | Limited |

**Decision:** ✅ **`markdownlint-cli`** (keep).
**Status:** In use.
**Rationale:** The rules (headings, line length, fences, etc.) are
exactly what brings value to a content site. `dprint` formats but
does not enforce rules. Switching is **a functional loss**
disguised as modernization.

---

## 7. Secrets detection

| Tool           | Language | Release cadence (as of 2026-09)               | Out-of-the-box rules                                                          | False-positive handling             | `git history` scan |
| :------------- | :------- | :-------------------------------------------- | :---------------------------------------------------------------------------- | :---------------------------------- | :----------------- |
| **gitleaks**   | Go       | Active (latest v8.30.1, 2026-03; checked 2026-09) | 160+ providers (AWS, GCP, Stripe, OpenAI, Anthropic, GH fine-grained PATs…)   | `.gitleaksignore` (fingerprint list) | Yes, native, fast  |
| detect-secrets | Python   | v1.5.0 (2024-05) — 28+ months without release | ~20 plugins, classic token formats                                            | Rich JSON baseline                  | Yes (slower)       |
| trufflehog     | Go       | Active                                        | Regex + **real-credential verification** (HTTP probes against suspected tokens) | Partial                             | Yes                |

**Decision:** ✅ **`gitleaks`**.
**Status:** In use, pinned in `.pre-commit-config.yaml` (the `rev:`
there is the source of truth for the exact version).
**Rationale:** `gitleaks` covers the modern provider surface
(160+ rules including Anthropic, OpenAI, Stripe new prefixes,
GitHub fine-grained PATs) out of the box, ships as a single Go
binary, and is actively maintained (latest release 2026-03, checked
2026-09). False
positives are tracked in `.gitleaksignore` at repo root, created
on demand — see `docs/runbook.md`.

`detect-secrets` was considered and discarded: the rule surface
lags modern cloud / SaaS providers and upstream has not shipped
a release since 2024-05 (a gap of more than two years). For **real-credential
verification** (HTTP probes against suspected tokens) the right
tool is **`trufflehog`**, not `gitleaks`. Not adopted here: this
repo has no real credentials to verify.

**Re-evaluate if:**

- A new credential format relevant to the site appears and
  `gitleaks` does not detect it before the next minor release.
- Real-credential verification becomes a requirement
  (consider `trufflehog` as a complementary scan, not a replacement).
- Upstream maintenance cadence drops below quarterly for 12+ months.

---

## 8. Link validation

| Tool                 | Language | Speed         | Official GH Action | Notes                |
| :------------------- | :------- | :------------ | :----------------- | :------------------- |
| **lychee**           | Rust     | Very fast     | Yes                | State of the art     |
| markdown-link-check  | Node     | Slow          | Community          | Requires Node        |
| linkchecker          | Python   | Medium        | Not official       | Older                |

**Decision:** ✅ **`lychee`** (keep) — **add** scheduled workflow
(`schedule: weekly`).
**Status:** In use via `just links`. Scheduled CI writes the Markdown result
to the Actions job summary and never creates an issue.
**Rationale:** `lychee` is already best-in-class. The improvement
is **operational**: detect broken outbound links without waiting
to open a PR. A red scheduled run plus its durable job summary is sufficient
for a single maintainer and keeps maintenance automation read-only.

The workflow holds only `contents: read`, persists no checkout credentials,
and contains no `issues: write`, issue labels or issue-creation action. The
report-only pre-commit guard rejects regressions in those invariants.

---

## 9. Python dependency audit

| Tool         | Language | Data source           | pre-commit fit |
| :----------- | :------- | :-------------------- | :------------- |
| **pip-audit**| Python   | OSV + PyPI advisories | Native         |
| safety       | Python   | Safety DB (partial)   | Plugin         |
| osv-scanner  | Go       | OSV                   | External       |

**Decision:** ✅ **`pip-audit`** (keep) — **promote from
`just audit`** to hook + CI.
**Status:** In use. Wired as a pre-commit hook in
`.pre-commit-config.yaml` (scoped to `pyproject.toml` / `uv.lock`
changes, delegates to `just audit` so local and CI share one
command) and as a step in `lint.yml`. The CI runner installs
`just` via `extractions/setup-just` so the hook works there too.
**Rationale:** Already a dev dep; running it only manually was
waste.

---

## 10. GitHub Actions syntax lint

| Tool       | Language | Detects                                  | Maturity          |
| :--------- | :------- | :--------------------------------------- | :---------------- |
| **actionlint** | Go   | Syntax, expressions, embedded shellcheck | De facto standard |
| (none currently) | — | —                                       | —                 |

**Decision:** ➕ **Add `actionlint`** as a hook.
**Status:** Installed.
**Rationale:** Detects YAML/expression errors and embedded shell
issues inside `run:` before they break CI. Adoption cost: one
entry in `.pre-commit-config.yaml`.

---

## 11. GitHub Actions security

| Tool       | Language | Detects                                       | Maturity          |
| :--------- | :------- | :-------------------------------------------- | :---------------- |
| **zizmor** | Rust     | Script injection, mutable refs, broad permissions, risky `pull_request_target` | Active, high interest |
| poutine    | Go       | Similar (more focused on supply chain)        | Young             |

**Decision:** ➕ **Add `zizmor`** as a hook and/or CI step.
**Status:** Installed. Recommended after the
`tj-actions/changed-files` 2025 incident.
**Rationale:** Complements `actionlint` (which checks syntax) by
reviewing the **security** of workflows. In 2026 this is standard
practice.

---

## 12. Pin Actions to SHA

| Tool        | Language | Mode                       | Auto-update      |
| :---------- | :------- | :------------------------- | :--------------- |
| **pinact**  | Go       | Rewrites tags → SHA        | Yes (with flag)  |
| ratchet     | Go       | Rewrites tags → SHA        | Yes              |
| zizmor      | Rust     | Only **detects**, no pin   | —                |

**Decision:** ✅ **`pinact`** installed locally +
**`just pin-actions`** as the manual entrypoint. Action releases are
reviewed and applied manually; automated dependency branches are not used.
**Status:** In use. All refs in `.github/workflows/` are pinned
by SHA.
**Rationale:** The use of mutable tags (e.g. `@v4`) was the vector
of the `tj-actions/changed-files` incident. Full SHA pins remove that
mutability; `zizmor` prevents an unpinned reference from landing, while
the owner controls when a reviewed pin changes.

### Decision: `pinact` manual, not as a hook

Adding `pinact` as a pre-commit hook was evaluated but discarded:

- `pinact` does not publish a `.pre-commit-hooks.yaml`, so it would
  require a `local` hook depending on the binary in `PATH`.
- In CI (`lint.yml`) an install step would have to be added.
- `zizmor` already acts as a safety net: if anyone introduces a
  ref without a pin, the hook (local + CI) fails with the
  `hash-pin` policy (default).

So: `zizmor` flags and `pinact` fixes on demand
(`just pin-actions`). Update discovery and application stay manual.

---

## 13. Dependency monitoring (report-only)

| Capability                         | Reports                         | Creates branches / PRs | State |
| :--------------------------------- | :------------------------------ | :--------------------- | :---- |
| **Dependency graph**               | Current dependency inventory    | No                     | Enabled |
| **Dependabot alerts**              | Known dependency vulnerabilities | No                   | Enabled |
| Dependabot version updates         | Available package versions      | Yes                    | Disabled |
| Dependabot security updates        | Remediation for known vulnerabilities | Yes              | Disabled |
| Renovate                           | Version and lockfile updates     | Yes                    | Not installed |

**Decision:** ✅ **Dependabot alerts only**, with every automated
dependency-update branch disabled.

- `.github/dependabot.yml` is intentionally absent, which disables
  Dependabot version-update pull requests.
- The dependency graph remains enabled as the read-only inventory that feeds
  security analysis.
- Repository vulnerability alerts remain enabled so known CVEs are reported
  in the Security tab; enabling them also restores the dependency graph after
  repository recreation.
- Dependabot security updates remain disabled because that feature creates
  remediation branches and pull requests independently of `dependabot.yml`.
- `Maintenance · uv Lock Report` evaluates Python lockfile updates weekly in
  an ephemeral runner and publishes the result to the Actions summary.
- GitHub Actions and pre-commit hooks are reviewed and updated manually
  with their documented commands.

**Status:** In use. The repository-setting commands that recreate this split
live in `AGENTS.md`, because neither alerts nor automated security updates can
be enforced from a committed file.

**Rationale:** Dependabot does not provide a general “available versions”
report without opening a pull request. For a low-cadence, single-maintainer
site, removing bot branches is more valuable than maintaining an automated PR
queue. Security visibility remains through Dependabot alerts and daily
`pip-audit`; Python version freshness also has the weekly read-only `uv`
report. The trade-off is explicit: non-Python version freshness is manual.

**Accepted Scorecard consequence:** its `Dependency-Update-Tool` probe looks
for a supported bot configuration and may score this report-only policy as
absent. The [check documentation](https://github.com/ossf/scorecard/blob/main/docs/checks.md#dependency-update-tool)
acknowledges that custom maintenance mechanisms can receive a low score. An
inert `dependabot.yml` is not kept merely to game that metric.

**Re-evaluate if:** GitHub adds a native report-only version mode, or manual
review lets an important update age past its planned maintenance window.

---

## 14. Development environment

| Approach                  | Type             | Setup cost                   | Scope of reproducibility          | IDE    |
| :------------------------ | :--------------- | :--------------------------- | :-------------------------------- | :----- |
| **`uv` + `just` locally** | Native toolchain | One `just sync`              | Python deps, hooks, Node linters  | Any    |
| Nix flake (`devShell`)    | Nix              | Nix install + learning curve | Whole toolchain                   | Manual |
| Vagrant                   | Ruby             | VM image download            | Whole machine                     | Manual |

**Decision:** ✅ **Local `uv` + `just` toolchain** (in use).
**Status:** In use.
**Rationale:** Python is locked by `uv.lock`, and `pre-commit` pins each
hook repository through `rev:`. Node linters can still declare npm
dependencies using version ranges: pinning a wrapper's Git revision does
not freeze its entire npm dependency tree. `just sync` plus
`just hooks-install` prepares the native toolchain on any machine with
Python 3.13, `uv`, `just` and Node.js LTS (the glossary check and Node tests
run on the system Node). An image or Nix flake would add a build surface,
another set of version pins and a rebuild step. The current CI preparation
policy addresses transient installation failures within the existing stack;
CI is what actually gates `main`.

**Re-evaluate if:** the project gains a system-level dependency that
cannot be expressed in `uv.lock` or `.pre-commit-config.yaml`, or a
second contributor joins and onboarding stops being a two-command story.
*Evaluated 2026-09:* system Node is such a dependency, but a single LTS pin
mirrored in the pre-commit config and the workflows covers it; an image or
flake would still add more surface than it removes.

### Maintenance notes

- `lint.yml` and the candidate verification in `uv-report.yml` share the
  preparation helper. They cache installed hook
  environments by platform, runtime versions, lockfile, hook configuration
  and preparation policy, without a fallback to unrelated cache keys.
- `scripts/install_precommit_hooks.py` installs environments before
  validation. It retries recognized npm download failures at most twice,
  after 60 and 120 seconds. A tarball HTTP 404 can be transient during
  publication; missing package metadata, invalid versions, authentication
  and configuration failures are not retried. Persistent failures retain
  their exit status, and lint/audits are executed once afterwards.
- npm range resolution during preparation has a one-day release age.
  This reduces exposure to packages published just before a cold install,
  but does not lock transitive dependencies or guarantee registry uptime.
  The [runbook](runbook.md#hook-download-fails-in-ci) documents the same local
  preparation command and a scoped exception for urgent updates.
- Cache steps stay directly in the two workflows: the pinned actionlint
  v1.7.12 does not accept GitHub's `$/...` self-repository references, while
  zizmor v1.30.1 requires them for internal actions. Sharing the Python
  helper keeps the installation policy consistent and both gates enabled.

- Three binaries live outside the repository and have no lockfile:
  `just` (every recipe), `lychee` (`just links`) and `pinact`
  (`just pin-actions`). Review `just` and `pinact` every ~6 months, or when
  a needed release ships; `lychee` moves with the quarterly review of its
  action pin (table below). Node.js LTS is the fourth system prerequisite,
  pinned by convention. Since 2026-09 `just` is also version-pinned in CI through
  `setup-just`'s `just-version` input — zizmor 1.30's `unpinned-tools`
  audit rejects the implicit latest — so the local install tracks that
  value.
- Dependabot **does not** track them (not a supported ecosystem), and
  version updates are deliberately disabled repository-wide because this
  repository does not allow dependency bots to create branches.
- `lychee` also runs in CI through `lychee-action`, which bundles its own
  binary. The local install and that action pin are separate surfaces;
  keep them on the same release so `just links` and the weekly report
  agree.

### Version source-of-truth (SoT) policy

Every tool has **one** authoritative pin. Other places that consume
the tool must reference the same version, never a divergent one.

| Tool                  | SoT                                  | Consumers (must match)                          | How to bump                                  |
| :-------------------- | :----------------------------------- | :---------------------------------------------- | :------------------------------------------- |
| Python deps (runtime) | `pyproject.toml` + `uv.lock`         | Local (`uv sync`), CI (`uv sync --frozen`)      | `uv lock --upgrade` then `uv sync`           |
| Python interpreter    | `.python-version`                    | Local `uv` and CI                               | Move to the latest supported 3.13 patch and verify every gate |
| Zensical (display)    | `pyproject.toml` + `uv.lock`         | `README.md` Zensical badge (display-only, manual)     | When bumping `zensical` in `pyproject.toml`, edit the version in the badge URL in `README.md` |
| Pre-commit hooks      | `.pre-commit-config.yaml` (`rev:`)   | Local + CI (both via `pre-commit`)              | `just hooks-update` (or manual rev bump)     |
| npm hook release age | `scripts/install_precommit_hooks.py` (one day) | CI preparation steps and the same local preparation command | Review the default; use the documented environment override for an urgent exception |
| `uv` itself           | `setup-uv` `version:` in `deploy.yml`, `lint.yml`, `quality.yml`, `uv-report.yml` | Those four workflows, plus the local install | Edit all four in the same PR |
| Node.js LTS           | `.pre-commit-config.yaml` `default_language_version.node` | `deploy.yml`, `lint.yml`, `quality.yml`, `uv-report.yml` `node-version` | Edit all five together; stay on the newest LTS patch |
| `eslint` / `stylelint` | `.pre-commit-config.yaml` `additional_dependencies` | Pre-commit only (no CI step of their own) | Manual — **Dependabot does not read `additional_dependencies`**, and `pre-commit autoupdate` only moves `rev:` |
| `lychee` binary       | `lychee-action` pin in `link-report.yml` | Local install (`just links`)                | Review the action version quarterly; move the local binary with it |
| `@lhci/cli`           | `lighthouse-ci-action` pin in `quality.yml` (bundled release) | `Justfile` `lighthouse` recipe (`npx @lhci/cli@<version>`) | When the action pin moves, read its lockfile and move the recipe with it |
| `pinact`              | Local install (no CI consumer)       | `just pin-actions`                              | Review releases manually                     |
| `just`                | `setup-just` `just-version:` in `deploy.yml`, `lint.yml`, `quality.yml`, `link-report.yml`, `uv-report.yml` | Those five workflows, plus the local install | Edit all five in the same PR and move the local binary with them |
| Action SHAs           | `.github/workflows/*.yml`            | Workflow files                                  | Review manually; apply new pins with `just pin-actions` |
| `zizmor`              | `.pre-commit-config.yaml` (`rev:`)   | Pre-commit only (no separate CI step)           | Manual rev bump (`pre-commit autoupdate` or release-driven) |

**Rule:** a tool that appears in two places with **different** version
strings is a bug. Adding a tool to a new surface (e.g. promoting
`pinact` to CI) means picking the SoT first and pointing every other
consumer at it — never duplicating the literal version string.

**Why this matters:** the historical drift that motivated this policy
was `uv` pinned to a specific version on one surface but installed as
`"latest"` in CI workflows (fixed 2026-04-25). Lockfile-based tools
(`uv.lock`, pre-commit `rev:`) prevent drift mechanically; system
tools without a lockfile must be aligned by convention.

**Drift resolved (2026-08):** `mirrors-eslint` used to advertise a
`rev` (v10.x) while `additional_dependencies` installed `eslint@9.16.0`
— a version the hook did not run. Both now sit on the same latest
version (`rev` and the pin move together; a comment in
`.pre-commit-config.yaml` enforces the pairing). The bump to ESLint 10
landed at the owner's explicit request for latest CI/CD tooling; the
first `just lint` run after it is the inspection gate for any
flat-config default changes.

---

## 15. Supply-chain posture (OpenSSF Scorecard)

| Tool                  | Maintainer | Mechanism                                            | Output                              |
| :-------------------- | :--------- | :--------------------------------------------------- | :---------------------------------- |
| **OpenSSF Scorecard** | OpenSSF    | GitHub Action that audits the repo on push + weekly  | Score 0–10 + per-check JSON         |
| Snyk Open Source      | Commercial | SaaS scan                                            | Vulnerabilities (commercial tiers)  |
| Sigstore policy-controller | Sigstore | Runtime verifier                                  | N/A for static sites                |

**Decision:** ➕ **Add `ossf/scorecard-action`** as a scheduled workflow
plus README badge.
**Status:** ✅ In use as of 2026-05-14. Workflow:
`.github/workflows/scorecard.yml` (weekly Mondays 09:30 UTC + push + dispatch).
Badge live in README. SARIF uploaded to GitHub code-scanning.
**Rationale:** This repo has already invested in supply-chain hygiene
(SHA-pinned Actions via `pinact`, Dependabot vulnerability alerts, a
weekly read-only `uv` report, `zizmor`, and `pip-audit` in CI).
Scorecard is the **public, comparable
summary** of that posture — it audits Branch-Protection, Pinned-Dependencies,
Token-Permissions, Dangerous-Workflow, Maintained, etc. The badge gives
visitors a single number instead of asking them to read three workflows.

**Concretely it requires:**

- `.github/workflows/scorecard.yml` (official template).
- `actions/dependency-review` does **not** apply (no PRs from forks here).
- `security-events: write` permission on the workflow job for SARIF upload.
- README badge:
  `https://api.securityscorecards.dev/projects/github.com/landerox/landerox.github.io/badge`.

**Re-evaluate scope if:**

- Score drops below 7 — investigate which check failed before publishing
  the badge.
- A check requires a substantial change (e.g. Branch-Protection rules on
  `main` — enforced via Classic Branch Protection to satisfy OpenSSF
  Scorecard).

---

## 16. Content licensing (dual-license model)

| Approach                                | Code license | Content license  | Convention                                |
| :-------------------------------------- | :----------- | :--------------- | :---------------------------------------- |
| Single license (MIT for everything)     | MIT          | MIT              | Default GitHub, but MIT was written for code |
| **Dual: MIT + CC-BY-4.0**               | MIT          | CC-BY-4.0        | Standard for technical blogs (Datadog, MDN) |
| Dual: MIT + CC-BY-SA-4.0                | MIT          | CC-BY-SA-4.0     | Copyleft on derivatives (Wikipedia model) |
| Dual: MIT + CC-BY-NC-4.0                | MIT          | CC-BY-NC-4.0     | Blocks commercial reuse                   |
| All-rights-reserved content             | MIT          | None (©)         | Maximum control, minimum reach            |

**Decision:** ✅ **Dual: MIT (code) + CC-BY-4.0 (content)**.
**Status:** In use as of 2026-05-14. `LICENSE-CONTENT` added at repo root.
**Rationale:** MIT was drafted for software and does not cleanly cover
prose / images / Markdown content. Separating the two surfaces:

- Lets readers **reuse posts with attribution** (translations, citations,
  excerpts) without grey-area legal ambiguity.
- Aligns with how technical content sites (Datadog blog, MDN, the
  Astronomer Guides, etc.) license their material in 2026.
- `CC-BY-4.0` chosen over `CC-BY-SA-4.0` to maximize reach without
  forcing downstream to adopt copyleft. Over `CC-BY-NC-4.0` to keep the
  content reusable in commercial-adjacent contexts (newsletters,
  paid courses citing the work) — atypical here but cheap to allow.

**Boundary rule** (revised 2026-07-25 — see below):

The test is **what a file is**, not which directory it sits in.

| Surface | Paths | License |
| :------ | :---- | :------ |
| Code | `pyproject.toml`, `Justfile`, `.config/`, `.github/`, `scripts/`, workflows, `content/**/assets/stylesheets/**`, `content/**/assets/javascripts/**` | **MIT** |
| Content | `content/**/*.md`, prose, maintainer-authored images | **CC-BY-4.0** |
| Third-party assets | `content/**/assets/fonts/**` | **Upstream terms** — neither of the above |

**Why the revision:** the original rule was "anything under `content/`
→ CC-BY-4.0", which swept in `extra.css` and `extra.js` — ~1,700 lines
of unambiguous software that live under `content/` only because that is
where Zensical looks for assets. Two problems followed:

- Creative Commons explicitly recommends against CC licenses for
  software; CC-BY-4.0 has no patent grant, no warranty disclaimer
  tailored to code, and no source-form provisions.
- When this was written, the plan was to upstream these UI enhancements
  to a separate MIT theme template (that template was retired in
  2026-08 and is no longer maintained). The reasoning outlives the
  plan: moving CC-BY-4.0 code into **any** MIT project needs a separate
  relicensing grant from the author, so licensing the front-end sources
  MIT from the start keeps every future extraction or reuse
  frictionless.

**Third-party assets** were previously unaddressed, which meant the old
rule asserted CC-BY-4.0 over font binaries the maintainer does not own
and cannot license. The fonts keep their upstream terms, and the
notices travel with the files in
`content/en/assets/fonts/NOTICE.txt` — OFL-1.1 § 5 requires the license
to accompany each copy, and the build publishes that directory verbatim.

**Re-evaluate if:**

- Drafting needs to incorporate third-party content under an incompatible
  license — review per-file before publishing.
- Demand emerges to monetize content directly (paid posts) — switch to
  `CC-BY-NC-4.0` or all-rights-reserved.
- A new asset type lands under `content/**/assets/` (icon set, video,
  data file). Classify it into one of the three rows before shipping;
  the default is *not* CC-BY-4.0.

---

## 17. Quality gates (Lighthouse CI)

| Tool                  | Type        | Output                                | CI Integration                |
| :-------------------- | :---------- | :------------------------------------ | :---------------------------- |
| **Lighthouse CI**     | Auditor     | Scores 0–1 per category + budgets     | `treosh/lighthouse-ci-action` |
| WebPageTest API       | SaaS        | Detailed waterfalls                   | Less GitHub-native            |
| Pa11y                 | Auditor     | A11y only                             | Specialized                   |
| Sitespeed.io          | Auditor     | Multi-metric                          | Heavier                       |

**Decision:** ➕ **Add `treosh/lighthouse-ci-action`** in a dedicated
`quality.yml` workflow. Accessibility, SEO, best-practices, layout
shift and the third-party request budget are blocking; the performance
score and byte-size budgets remain warn-only because they are more
sensitive to CI noise.
**Status:** ✅ In use as of 2026-05-14. Config in `.config/lighthouserc.json`.
**Rationale:** A bilingual content site benefits from continuous
auditing of **accessibility, SEO, performance, best-practices** — but
Performance scores are known to be noisy across CI runs, while the
other categories are stable enough to prevent regressions.

**Concrete setup:**

- **Trigger**: `push` to `main` + `pull_request`, both paths-filtered, +
  `workflow_dispatch`. Unlike the required `lint` and `build` checks, it is
  not a required status check, so filtering its PR trigger is safe.
- **Coverage**: thirty-eight representative URLs spanning both locales: both
  home pages plus About, Stack, Collaboration, Open Source, Research Labs,
  Interactive Tools, Tech Radar, Blueprints, the public glossary and all nine
  Blog comparisons.
  References and
  Blog comparisons receive the same
  rendering and resource budgets as the other interactive surfaces.
- **Mode**: `staticDistDir: ./site` — Lighthouse CI starts its own
  static server over the build output; GitHub Pages is not required.
- **Runs per URL**: 3 (LHCI default; reduces noise via median), 114 runs total.
- **Budgets**: performance ≥ 0.9 (`warn`); cumulative layout shift ≤ 0.1
  (`error`); accessibility = 1.0, best-practices and SEO ≥ 0.9 (`error`);
  CSS, JavaScript and font byte budgets (`warn`); third-party requests = 0
  (`error`). Assertions use LHCI's default optimistic aggregation, the best
  of the three runs. Page-level language
  alternates live in XML sitemaps, avoiding Modern's head-link root prefetch.
  [Google documents sitemap hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
  as an equivalent alternative to HTML annotations. The build checks
  reciprocal page coverage before writing, and the native language selector
  preserves the current page with a full locale load.
- **Storage**: `filesystem` + artifact upload. **No**
  `temporaryPublicStorage` (privacy: reports stay private).
- **Local runs**: `just lighthouse`, the same config and `@lhci/cli` release,
  executed from a scratch directory because chrome-launcher on WSL creates
  its Chrome profiles relative to the working directory. The completed
  bilingual build is copied into that directory before auditing, so a live
  development server cannot remove or replace audited pages mid-run. Later
  source edits are not part of the snapshot (`docs/runbook.md`).

**Re-evaluate (tighten) if:**

- Performance stabilizes above budget for 8+ consecutive weeks → flip
  its assertion from `warn` to `error`.
- A specific category (e.g. perf) consistently drops below budget
  due to upstream changes — investigate before relaxing the budget.

*Re-evaluated 2026-09-25* against the first CI run of the recreated
repository (38 URLs, 114 runs): median performance 0.91–0.97 on every URL,
one single-run outlier at 0.74. The two glossaries were lowest, with a
layout shift of 0.12 from controls mounted after load; reserving their
height fixed it (0.000 locally, performance 0.89 → 0.94). Layout shift
does not depend on CPU throttling, so it became a blocking assertion now.
The performance warning moved from 0.85 to 0.9, the level every page
already clears; one run is not a trend, so the 8-week condition still
governs the flip to `error`.

---

## 18. Lockfile maintenance (transitive deps report)

| Approach                                   | Sees transitives | Mutates repository | Cadence |
| :----------------------------------------- | :--------------- | :----------------- | :------ |
| **`uv lock --upgrade` in an ephemeral runner** | ✅ Yes       | No                 | Weekly  |
| Dependabot version updates                 | Partial          | Opens PRs           | Disabled |
| Renovate `lockFileMaintenance`             | ✅ Yes           | Opens PRs           | Not installed |
| Manual `just update`                       | ✅ Yes           | Local working tree  | On demand |

**Decision:** ✅ Keep `.github/workflows/uv-report.yml` as a weekly,
read-only dependency report.
**Status:** In use.

The workflow resolves an upgraded `uv.lock` inside the disposable Actions
workspace. When candidates exist, it runs `uv sync --frozen`, the complete
pre-commit and dependency-audit suite, and the bilingual site build against
that candidate. The Actions job summary records the resolver output and each
verification outcome.

The workflow deliberately does not pass `--dry-run`. That mode resolves and
reports changes but does not write the candidate lockfile, so the subsequent
`uv sync --frozen` and gates would test the old committed lock instead. Writing
the candidate inside the disposable runner is what makes end-to-end validation
possible without changing the repository.

**Concrete setup:**

- **Cron:** Tuesdays 06:00 UTC, away from Monday's Lychee and Scorecard runs.
- **Permissions:** `contents: read` only.
- **Persistence:** none. The workflow has no commit, push, branch or pull
  request step, and the candidate lockfile disappears with the runner.
- **Application:** when the report is actionable, the owner creates a normal
  maintenance branch, runs `just update`, reviews the lockfile and executes
  `just lint` plus `just build` before proposing the change.

**Rationale:** the report preserves visibility into transitive upgrades and
tests whether they are viable, while the owner retains control over every
repository branch. This complements [Dependency monitoring
(report-only)](#13-dependency-monitoring-report-only): Dependabot alerts cover
known vulnerabilities, while this workflow covers available Python lockfile
movement.

**Re-evaluate if:** reports are routinely ignored, resolution becomes too
expensive for a weekly runner, or GitHub/Dependabot adds a native report-only
version mode with equivalent transitive coverage.

---

## 19. JavaScript linter (ESLint)

| Tool | Language | Type | Configuration | Ecosystem fit |
| :--- | :------- | :--- | :------------ | :------------ |
| **eslint** | JS / TS | Linter | `eslint.config.js` (Flat config, ESLint 10) | Native Node mirrors via pre-commit |
| jshint | JS | Linter | `.jshintrc` | Legacy, unmaintained |
| biome | Rust | Formatter/Linter | `biome.json` | Young, doesn't reuse ecosystem rules |

**Decision:** ✅ **`eslint`** (v10) flat configuration.
**Status:** In use.
**Rationale:** ESLint is the industry-standard linter for JavaScript. Flat
configuration (v9+) provides high-performance and declarative control.
Integrated into `pre-commit` using Node mirrors to keep the repository's root
environment clean of `node_modules` and runtime package files.

---

## 20. CSS linter (Stylelint)

| Tool | Language | Type | Configuration | Ecosystem fit |
| :--- | :------- | :--- | :------------ | :------------ |
| **stylelint** | CSS | Linter | `.config/.stylelintrc.yaml` | Native Node mirrors via pre-commit |
| csslint | CSS | Linter | `.csslintrc` | Legacy, unmaintained |

**Decision:** ✅ **`stylelint`** (v17) with the `stylelint-config-standard`
ruleset **inlined** rather than referenced through `extends`.
**Status:** In use.
**Rationale:** Ensures CSS files adhere to standard design system guidelines
and prevent rule regressions. Runs inside isolated pre-commit virtual
environments via mirrors, maintaining zero local package footprints.

The ruleset is inlined because that last property and `extends` became
mutually exclusive in stylelint 17: it resolves `extends` with ESM
semantics, which does not consult `NODE_PATH` — the only channel through
which pre-commit exposes `additional_dependencies`. A shareable config
referenced by name therefore fails with
`Could not find "stylelint-config-standard"` no matter how it is pinned.
The alternatives were pinning stylelint back to v16 (where CommonJS
resolution still honoured `NODE_PATH`) or adopting a real
`package.json` + `node_modules`; both were rejected in favour of keeping
the latest linter and zero Node package footprint. `.config/.stylelintrc.yaml`
carries the provenance, the opt-out list and the re-evaluation trigger.

---

## 21. Bilingual asset deduplication (DRY Assets)

| Approach | Maintenance | Disk / Git Footprint | Build compatibility |
| :--- | :---------- | :------------------- | :------------------ |
| Relative Symlinks | Zero manual overhead | Zero-copy, absolute DRY | ❌ Broken (Zensical Rust compiler ignores symlinks) |
| Physical Duplication | High (manual replication) | Multiplied copies | Native |
| **Pre-build Sync Task** | **Zero manual overhead** | **Zero committed duplicates** | **Native (physical files generated on compile)** |

**Decision:** ✅ **Pre-build Sync Task (via `Justfile` + `.gitignore`)**.
**Status:** In use.
**Rationale:** Standard static site generators require extra asset files to
reside under each distinct locale's `docs_dir` (e.g., `content/en/assets/`
and `content/es/assets/`). While symbolic links initially seemed like the
ideal solution, Zensical's compiler is compiled in Rust (`zensical.abi3.so`)
and ignores symbolic links in its asset copier, resulting in missing styles,
JS, and images in the Spanish built output.

To resolve this, we implemented an automated Pre-build Sync Task in the
`Justfile` (`just sync-assets` linked to all serve and build recipes) that
physically copies shared stylesheets, javascripts, fonts, core images and
the glossary catalog from the English assets directory into the Spanish assets
directory before compilation. By adding the copied folders and files to
`.gitignore`, they are never tracked or committed, keeping the repository 100%
DRY in Git. At the same time, because the synchronization copies a few small
text and image files, execution takes less than 5ms.

---

## 22. Bilingual content symmetry checker (check-i18n)

| Tool | Mechanisms | Ecosystem fit | Maintenance |
| :--- | :--------- | :------------ | :---------- |
| **Custom Python hook** | Frontmatter + file path comparison | Native `uv` / Python pre-commit | Low |
| Manual validation | Visual checks only | Error-prone | High |

**Decision:** ✅ **Custom Python script (`check-i18n`)** run as a pre-commit
hook.
**Status:** In use.
**Rationale:** In a personal bilingual site, the risk of translating a page
but forgetting to create its counterpart in the other language, or mismatching
key frontmatter metadata (e.g., `hide`, `icon`, `search`), is extremely high.
Developing a lightweight, customized Python script under `scripts/` is the
ideal SOTA solution because it integrates natively with our existing Python
environment (`uv`) and executes in milliseconds inside our pre-commit suite.

The checker also compares shared TOML settings and navigation destinations.
Only explicit locale roots, language identifiers and translated labels may
differ. Small Python regression tests guard these exceptions and ignore
Markdown headings inside fenced code blocks.

---

## 23. Project governance (OpenSSF Silver)

| Model | Maintenance | Suitability | Contributor path |
| :--- | :--------- | :---------- | :--------------- |
| **Single Developer Flow (SDF)** | None (natural state) | ✅ High (personal site) | Documented via DCO + contributor guides |
| Steering Committee | High overhead | ❌ Extremely low | Unnecessary complexity |

**Decision:** ✅ **Single Developer Flow (SDF)**.
**Status:** In use.
**Rationale:** As a personal portfolio and static site, the project is owned
and
maintained by a single individual (`@landerox`). Complex governance bodies or
committees would add unnecessary overhead. Governance is kept transparent by:

- Formally documenting the maintainer's sole merge authority and role in
  `.github/CONTRIBUTING.md`.
- Requiring contributor sign-off (DCO) to ensure clean intellectual property.
- Documenting an exit strategy/continuity model (open-source MIT/CC-BY-4.0
  dual-licensing and self-contained Markdown files allow anyone to clone,
  build, and host a replacement site immediately if needed).

---

## 24. Secure design principles

| Principle | Implementation | Threat model reduction | Status |
| :--- | :------------- | :--------------------- | :----- |
| **Static-first design** | Pure static files, zero application servers | Removes application-server/database attack surfaces; DOM injection still requires controls | ✅ Implemented |
| **Secure hosting & TLS** | GitHub-managed TLS with HTTPS enforcement | Protects transport when domain and certificate settings are valid | ✅ Implemented; hosting settings require verification after recreation |
| **No third-party browser requests** | All fonts self-hosted; no CDN, analytics or remote asset in any page | Removes an external origin from every visitor's browser and the privacy exposure with it | ✅ Implemented ([Typography delivery (self-hosted fonts)](#27-typography-delivery-self-hosted-fonts)) |
| **Strict security headers** | Baseline `<meta>` CSP from `overrides/main.html` | Restricts every resource class to this origin; clickjacking protection still unavailable | ⚠️ **Partially implemented** — see below |

**Decision:** ✅ **Static-first Secure Design & Threat Modeling**.
**Status:** In use.
**Rationale:** The site is designed with absolute minimization of the attack
surface in mind. By relying entirely on static Markdown compiled via Zensical
and avoiding server-side logic:

- There is no application server or database. Visitor input in the glossary, the
  CLI and worksheets stays client-side; static hosting does not eliminate
  DOM injection. Inputs use text nodes, a finite query grammar, bounded
  histories and validated glossary source links, with regression tests.
- The baseline CSP restricts resource origins but still permits inline
  scripts. `pip-audit` checks dependency vulnerabilities; ESLint and Stylelint
  check source rules. CodeQL adds security-oriented static analysis.
- TLS termination is managed by GitHub Pages. Verify the domain, certificate
  and HTTPS-enforcement setting after recreation; this document does not
  claim an exclusive TLS version or a current external audit grade. See
  [GitHub's HTTPS guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

### CSP status (corrected 2026-07-25; baseline added 2026-08)

This table previously recorded Content Security Policy as implemented
when nothing existed; that entry was corrected on 2026-07-25. Since
2026-08 a **baseline `<meta http-equiv="Content-Security-Policy">`**
ships from `overrides/main.html` (a `theme.custom_dir` override of
Zensical's `extrahead` block), restricting every resource class —
scripts, styles, images, fonts, connections — to this origin, which
[Typography delivery (self-hosted
fonts)](#27-typography-delivery-self-hosted-fonts)'s removal of third-party
origins made possible.

What the `<meta>` variant cannot do, and therefore remains open:

- `<meta>`-delivered CSP cannot express `frame-ancestors`,
  `report-uri` or `sandbox`; clickjacking protection specifically
  needs a header and therefore stays unavailable on GitHub Pages.
- Zensical inlines bootstrap `<script>` and `<style>` blocks, so the
  policy carries `'unsafe-inline'` for both. Per-build hashes would
  need a pipeline hook that does not exist today.

The honest summary is: transport and repository-side controls are
strong, the browser-side baseline now exists, and the residual gaps
(`frame-ancestors`, inline allowances) are inherent to GitHub Pages —
moving off Pages purely to close them is not justified for a static
portfolio with no authenticated surface.

---

## 25. Branch protection model

| Option                        | Signed commits | Linear history | Required checks | Admin bypass |
| :---------------------------- | :------------- | :------------- | :-------------- | :----------- |
| **Classic branch protection** | Yes            | Yes            | Yes             | Configurable (kept **on**) |
| Rulesets                      | Yes            | Yes            | Yes             | Bypass actor list |
| No protection                 | —              | —              | —               | n/a          |

**Decision:** ✅ **Classic branch protection on `main`**, with admin
enforcement disabled.
**Status:** In use.
**Rationale:** OpenSSF Scorecard's `Branch-Protection` check reads
classic protection reliably; ruleset coverage in the Scorecard probe was
still partial when this was set up. Admin bypass stays enabled because
this is a single-maintainer repository — without it, routine
maintenance would require a second account to approve every PR.

Enforced policies, the merge-strategy restriction and the DCO
requirement are documented as threat mitigations in
[`security-assessment.md`](./security-assessment.md) under threat T2
(unauthorized changes to the production branch), which is the
authoritative list; this section records only *why* classic protection
was chosen over rulesets.

The API payload is tracked in `.github/branch-protection.json` so repo
recreation does not depend on an ignored local file. Requiring signed
commits uses GitHub's separate `required_signatures` endpoint. The
commands live in `AGENTS.md`; the order and preconditions are in the
[recreation checklist](runbook.md#repository-recreation-and-the-v010-baseline).

**Re-evaluate when:** Scorecard's ruleset support reaches parity, or a
second maintainer joins (at which point admin bypass should be removed
rather than kept for convenience).

---

## 26. SAST (CodeQL)

| Tool         | Languages here    | Cost              | Integration                |
| :----------- | :---------------- | :---------------- | :------------------------- |
| **CodeQL**   | GitHub Actions, JavaScript, Python | Free for public repos | Native code-scanning alerts |
| Semgrep OSS  | All three         | Free              | Third-party action + SARIF upload |
| Nothing      | —                 | —                 | —                          |

**Decision:** ✅ **CodeQL** (`codeql.yml`).
**Status:** In use — push/PR on watched paths, plus Thursdays 10:00 UTC.
**Rationale:** The repository ships small first-party code surfaces
worth scanning: `content/en/assets/javascripts/**/*.js`, `scripts/*.mjs`,
`scripts/*.py` and `.github/workflows/`. CodeQL covers all of them, needs no
third-party action, and reports into the same code-scanning UI as the Scorecard
SARIF, so there is one place to look. Semgrep would add a dependency to gain
nothing at this size.

**Workflows too (2026-09):** the matrix also runs the `actions`
language over `.github/workflows/`. It overlaps `zizmor` deliberately —
the two analyzers carry different rule sets (CodeQL's covers expression
injection, untrusted checkouts and over-broad permissions), run in
different places (pre-commit versus code scanning) and cost nothing
extra, so a workflow pattern one of them misses still has a second
reader.

**Honest limitation:** static analysis is not a proof of safety. The
workbench accepts visitor text and renders authored definitions and local
results, so DOM sinks,
source URL validation and query parsing are concrete review targets.
Regression tests and browser checks supplement CodeQL; none claims to
establish that every possible injection path is absent.

**Re-evaluate when:** a backend, authenticated surface, remote tool execution
or third-party model service is proposed, or scan minutes start to matter.

---

## 27. Typography delivery (self-hosted fonts)

| Option                        | Requests to third parties | Critical path                     | Control |
| :---------------------------- | :------------------------ | :-------------------------------- | :------ |
| **Self-hosted `woff2`**       | 0                         | Same-origin, warm connection      | Full — versioned in-repo |
| Theme default (Google Fonts)  | 2 origins                 | Render-blocking `<link>` on a cold origin | None |
| Google Fonts via CSS `@import` | 2 origins                | 3-hop chain before first paint    | None |
| System fonts only             | 0                         | None                              | Full, but loses the identity |

**Decision:** ✅ **Self-host every family** — `theme.font = false` in
both Zensical configs, `@font-face` in `extra.css`, `woff2` under
`content/en/assets/fonts/`.
**Status:** In use (2026-07-25).

**Rationale:** the site was previously paying for the two worst rows at
once — Zensical requested Inter and JetBrains Mono through a
render-blocking `<link>`, and `extra.css` added Outfit through an
`@import`, which cannot even begin until `extra.css` has downloaded and
parsed. Self-hosting removes both, and three secondary problems with
them:

- **The caching argument is obsolete.** Every major browser partitions
  the HTTP cache per site (2020+), so "the visitor already has Inter
  cached from another site" is no longer true. Those bytes were fetched
  fresh per visitor regardless of who served them.
- **JetBrains Mono was downloaded and never used** — `--font-mono`
  resolves to MesloLGM first.
- **It makes a real CSP reachable** ([Secure design
  principles](#24-secure-design-principles)): with no third-party origin
  left, a strict policy has nothing to allow-list.

**Costs accepted:** ~209 KB of `woff2` in the repository, and the
families must be refreshed by hand — nothing tracks upstream font
releases. `unicode-range` keeps `latin-ext` out of the critical path, so
a typical EN or ES page still fetches only ~109 KB.

Provenance, licenses (Inter/Outfit under OFL-1.1, MesloLGM under Apache-2.0)
and the subset split are tabulated
in [Typography](design.md#5-typography). Fonts are third-party assets and keep
their upstream terms — they fall under neither of this repo's licenses
([Content licensing (dual-license
model)](#16-content-licensing-dual-license-model)).

**Re-evaluate when:** a family gains a needed glyph outside the shipped
subsets, or if the repo ever adopts a build step that could subset
fonts against the real glyph inventory.

---

## 28. Design system (tokenized stylesheet)

| Option                          | Rebrand cost | Override safety | Tooling |
| :------------------------------ | :----------- | :-------------- | :------ |
| **Tokens in plain CSS**         | Two lines per scheme | Specificity + source order | None |
| Raw literals per rule (previous) | Every occurrence | Same | None |
| CSS `@layer`                    | Two lines    | **Breaks here** — Zensical ships unlayered CSS, which always wins over layered | None |
| Sass / PostCSS pipeline         | Two lines    | Same as plain CSS | New build step + watch loop |

**Decision:** ✅ **Semantic tokens in plain CSS**, no preprocessor and
no cascade layers.
**Status:** In use (2026-07-25).

**Rationale:** the accent color had been written as
`hsl(245, 62%, 49%)`, `#3d39cb` and `rgba(61, 57, 203, α)` across ~20
declarations — and the first two resolve to *different* colors, so the
palette had silently drifted. Each scheme now declares `--brand-rgb`
once and derives every tint from it.

A preprocessor was rejected because `extra.css` is copied verbatim to
`site/` today; adding Sass would mean a compile step, a watch loop
inside `just serve`, and a generated artifact to keep out of Git — for
variables that native custom properties already provide, with the
advantage that they stay live at runtime (which is what lets the
ambient canvas read its color from CSS rather than duplicating it).
`tools-simulations.css` and `decision-tools.css` follow the same authored-CSS
delivery path and consume `extra.css` tokens. Splitting feature rules does not
introduce another palette or a build-time dependency.

`@layer` was rejected for a hard technical reason, not preference:
unlayered styles beat layered ones in the cascade, and Zensical's theme
CSS is unlayered. Wrapping the overrides in a layer would invert every
one of them.

Full system — token naming, both palettes with computed contrast
ratios, component rules, and the accessibility and performance contract
— is in [`design.md`](./design.md). Anything added to `extra.css` must
be checked against the *compiled* theme in
`site/assets/stylesheets/modern/` rather than against Material for
MkDocs documentation: `theme.variant = "modern"` renders different
markup and reads different variables, which was the root cause of the
defects listed in [Defects found and
fixed](design.md#9-defects-found-and-fixed).

The palette control has exactly two manual choices, light and dark, with a
950ms transition and reduced-motion handling. There is no system-preference
choice. The template normalizes the existing `__palette` preference before
theme bootstrap; safe storage wrappers preserve operation when storage is
unavailable or contains an invalid value.

Long research and blueprint entries use single-column reference reading,
progressively enhanced from annotated Markdown. Titles, recommendations and
adoption conditions remain visible; Blueprint trade-offs do too. Full prose
and sources sit in optional native details. The radar has only four topic
buttons: All (10), Data (4), AI & agents (4), Platforms & operations (2).
They expose `aria-pressed`, not tab semantics. Blueprints keeps all five
references visible with no filters. Search, sorting, reset and bulk controls
are not part of this reading surface.

`comparison.js` retains its filename but implements a reference list rather
than a table. `comparison-core.js` isolates topic selection and counts.
`scripts/comparison.test.mjs` runs through the existing `just test-workbench`
recipe and its pre-commit hook. Original headings, text and references remain
readable without JavaScript. Direct and repeated hashes reveal their entry,
including through Modern's accepted-navigation stream. Printing opens all
evidence temporarily, then restores the previous filter and disclosure states.

**Content determines the component.** The interpretation applied here follows
[USWDS table guidance](https://designsystem.digital.gov/components/table/):
brief comparable fields can remain tables, while multi-paragraph content is
better under headings. Labs therefore uses open reading entries inside its
three lifecycle tabs; About uses a seven-entry chronology. Collaboration uses
an unboxed service list and keeps engagement terms visible. The five Projects
cards retain actual destinations, consistent with [USWDS card guidance](https://designsystem.digital.gov/components/card/).
Optional evidence follows [GOV.UK details guidance](https://design-system.service.gov.uk/components/details/),
while the decision and limitations remain visible. These are design choices
informed by guidance and the owner's feedback, not proof of usability testing
or accessibility certification. The homepage follows its own landing layout
(`design.md` → Home landing): a first-person hero, a proof strip, the
expertise cards and a short contact section, with a pause control for the
always-running motion (WCAG 2.2.2). It reads as a personal site that shows
work; engagement terms stay on Collaboration.

**Re-evaluate when:** a third color scheme is added (the two-block
split assumes exactly two), or when the site first ships charts, which
would need a categorical ramp this system does not define.

---

## 29. Technical glossary and local Tools

**Decision:** native ES modules, a native modal dialog, an authored bilingual
glossary and Node's built-in test runner. No browser framework, bundler, model
runtime, database runtime or hosted chatbot service.

**Rationale:** the glossary explains technical terms with examples, caveats
and primary sources instead of repeating the site's pages. Its JSON catalog
is editorial content under CC-BY-4.0; the UI, validation and search logic are
MIT code. Data loads once from the same origin; filtering and all visitor
input stay local. No generated article index or conversational UI is needed.

The CLI is a local technical toolbox, separate from navigation and biography.
It calculates IPv4 subnets, UUID v4, SHA-256, UTF-8 Base64, URI components,
JSON formatting, zoned/Unix timestamps, byte-unit and integer-base conversions,
contrast between supplied opaque colors, cron schedules, availability
budgets, throughput rates and JWT contents. `cron` and `nines` exist because
orchestrators, GitHub Actions schedules and SLOs are recurring topics here:
both are pure arithmetic with exact tests. `rate` (2026-09, owner-approved)
sizes pipelines from a daily volume or event count with exact rational
arithmetic and refuses bit units rather than guessing. `jwt` decodes a JWS
header and payload locally and states that it never verifies a signature;
verification would need the key, and pasting keys into a page is the habit
the note warns against. Its example token carries a short fake signature so
it stays below the gitleaks JWT pattern. A `define` command was rejected: the
Glossary tab sits beside the CLI and article search is deliberately not a
command. A bounded `ping` measures same-origin HTTP response headers, never ICMP
or arbitrary hosts.

The shared dialog is Technical desk / Espacio técnico, not a bot identity.
All 19 commands have insertable examples. Faint, local history/example
suggestions mimic a familiar shell interaction without shell execution or
a completion library. Right Arrow accepts; Enter runs the command.
Tab completes commands and Up/Down restore history or the current draft.
`help` is a compact directory; `help command` retains detailed examples.
The global CLI shortcut requires Ctrl plus the backtick key; plain printable
characters do not
open the dialog.

`just glossary` renders both public glossary pages from the authored JSON.
Stable term anchors, related concepts, practice links and DefinedTermSet
JSON-LD expose definitions without opening a modal or running JavaScript.
Build and pre-commit reject stale output. Shared filtering uses bounded
typo correction after lexical matches; short acronyms are not guessed.
The modal and page share one catalog cache. Failed loads remain retryable,
and queries stay local. The static page restores full content for printing.

Tools owns five bounded worksheets: Failure Lab, memory planner, SQL explorer,
SLO & error budget, and Schema diff. They explain engineering trade-offs with
visible assumptions, examples and useful no-JavaScript prose. Research
lifecycle and evidence criteria remain in Labs.

The manual failure simulation has an explicit workload, bounded queue and
retry policy, preserves event accounting and stops on visibility/navigation
changes. A separate 30-second comparison applies two retry policies to the
same incident, one with seeded discrete jitter; its results are reproducible,
not a production benchmark. Manual playback remains jitter-free. Neither
mode represents real infrastructure or durable-delivery guarantees.

The memory planner compares a saved baseline A with current settings B,
separating resident weights, uncompressed KV cache, fixed linear-attention
state and explicit reserve in GiB. Its presets are the three Qwen3.8 weights
(27B dense, Flash-Next and 2.4T-A95B mixture of experts) because one family
teaches the three effects a plain GQA formula hides: hybrid attention keeps
a KV cache in one layer of four, linear layers hold a state that does not
grow with context, and every expert stays resident while each token reads
only the active share. A narrated explanation derives each figure from the
current inputs. Optional architecture controls keep the formula inspectable
without implying a model ranking, quality evaluation or per-GPU capacity
guarantee. Re-evaluate when a preset's `config.json` changes or a newer
family makes a different memory trade-off visible.

The SQL worksheet has two fictional tables (16 rows), question-led recipes,
column explanations, compound filters, multi-column grouping/ordering and
CSV export. A bounded tokenizer/parser consumes the entire input; no dynamic
evaluation or user-defined tables are allowed. CSV neutralizes spreadsheet
formula prefixes. Separate UI and pure-engine modules keep grammar tests
independent of browser behavior. Its walkthrough shows row/group counts from
the actual logical stages, not a physical plan or query-performance profile.
A full database remains out of scope.

The SLO worksheet separates request and time budgets, measured windows and
partial observation, with no forecast or conversion between requests and
minutes. Undefined ratios are shown as unavailable, not silently healthy.
Schema diff compares a strict flat column contract in both compatibility
directions. Its 200-column/32,768-character bounds and explicit types keep
scope understandable; it is not a full JSON Schema validator, schema registry
or universal compatibility certification. Editing invalidates stale reports.

`sql.js`, `failure.js` and `decision-tools.js` load when their host becomes
visible. CLI and glossary visits do not import those modules. Shared text
normalization has no dependency on the SQL engine.
All six tools use same-origin ES modules,
with no input upload or persistent visitor storage.

Scenario links (2026-09, owner-approved) put a tool's inputs in the URL
fragment rather than the query string: browsers never send the fragment, so
a shared link reveals nothing to the host and GitHub Pages still serves the
same static page. Keys are validated per tool, values go through the normal
input checks and the fragment is capped at 6,000 characters. The query is
percent-encoded twice because the theme decodes the whole fragment once and
builds a selector from it; the scenario is captured at boot, before the
theme's anchor tracking can replace the hash, and a scenario opened on the
same page reaches a tool that is already mounted. Rejected:
`localStorage` persistence (state the visitor did not ask to keep) and
short-link services (a third-party origin and an input upload).

The table-file planner (2026-09, owner-approved) is the sixth tool because
small files and over-partitioning are the lakehouse failure a table format
does not prevent by itself. It reuses the decision worksheet shell, states
Iceberg's 512 MiB default with its source and names what it does not model.

Acronym tooltips (2026-09, owner-approved) come from the glossary catalog
through the standard `abbr` extension and `pymdownx.snippets` auto-append,
rendered by the theme's existing `content.tooltips`. The alternatives were
linking the first mention of every term (content churn and link noise) and a
JavaScript hover-card (a new runtime for what the theme already renders). The
per-locale `auto_append` path is the one extension setting allowed to differ
between the configurations; `check_i18n.py` requires each locale to point at
its own generated file. Feature-specific CSS
consumes the shared palette tokens rather than defining another design system.

DOM-free logic and schema tests use `node --test`, exposed through
`just test-workbench` and the scoped pre-commit hook. Browser checks cover
the compiled Modern theme, keyboard interaction, locales, palette contrast,
tab changes, scenario links and failure recovery. The six test files cover
utilities (with `rate`, `jwt` and scenario links), glossary, SQL, memory
comparisons, failure policies, reference topic selection, SLO arithmetic,
schema contracts, the table-file planner and the availability schedule. Both Tools
pages are in Lighthouse.

The maintained browser gate uses Python Playwright as a development-only
dependency in `uv.lock`, reusing the existing Python toolchain. Chromium is
installed from that pinned package. `just test-browser` tests a disposable
copy of the bilingual build, keeps requests local and covers real Modern
markup, focus/history, lazy loading, retries, filters, print restoration,
locale metadata, primary-button contrast and mobile tables. The Quality
workflow runs it before Lighthouse. This is not a WCAG certification or a
replacement for manual assistive-technology review.

**Not adopted:** a generative chatbot still needs an approved use case,
backend, credentials, abuse controls, cost limits and answer evaluations.
Hosting on Google Cloud does not itself create a useful assistant. A general
SQL engine or production fault injector would be a separate product scope.

**Re-evaluate when:** the glossary needs a publishing workflow, a real dataset
justifies full SQL, or an approved assistant use case needs a backend.

---

## 30. Blog comparison articles

**Decision:** the section is Blog in both locales, with a concise editorial
index and articles that explain the comparison briefly before showing results.
Nine articles cover object storage, lakehouse table formats and catalogs,
workflow orchestrators, transformation, OLAP, vector and graph databases,
BI and observability. Cross-links connect the data path; no separate
Comparisons category or empty future article list is needed.

**Rationale:** the owner's preferred format is a short explanation followed
by useful comparison results. A compact five-column table compares eight
primary candidates; recommendations and main constraints stay visible, and
an editorial 1–5 rating per tool sits beside the project name. The rating
adds five documented criteria (maintenance, open edition, maturity and
community, operating scope, interoperability) scored 0, 0.5 or 1, with
caps for archived, stale and prerelease projects; each article discloses
its breakdown and the Blog index states the method. Stars fill in
proportion to the number through a CSS-only component (`design.md`).
Optional native disclosures hold version and source detail. Every article
uses the same five-column rated table (Observability swaps project and fit
for role, components and what changes the decision), each with its own
candidate count.
They distinguish embedded engines, extensions and distributed services, and
check AGPL, permissive and mixed-distribution licenses at the reviewed version.
Gateways, development tools and beta projects are identified as different
layers rather than ranked as interchangeable storage clusters. Small
deployments are considered explicitly, including the operating cost of an
existing protected filesystem versus a newly operated replicated store.

Rating tables list rows from highest to lowest rating (owner decision,
2026-09-23; ties keep their authored order), enforced by
`scripts/sort_ratings.py` and the `check-ratings` hook. A project is rated
only after its open edition has been reviewed against the five criteria;
until then it appears under "Candidates to watch" with its version, license
and the reason it is not yet rated (for example, Flyte 2's open-source
backend is not released).

This is documentary evaluation from official repositories, licenses and
documentation, with an explicit review date. The page shows it as month and
year (owner decision, 2026-09-24): an exact day ages visibly while the
versions stay current. The exact day stays in the `reviewed` front matter
for the feed and structured data. It does not claim first-hand
benchmarks, vendor certification or a universal winner. Stable releases,
prereleases and archived repositories remain distinct; repository activity
alone is not a durability or security guarantee. Production gates cover
client compatibility, authority, restore, upgrade/exit and cost under failure.

Ordinary Markdown tables and native details are sufficient here. This is
separate from `comparison.js`, which enhances the Tech Radar and
Blueprints reading lists. The same
[USWDS table guidance](https://designsystem.digital.gov/components/table/)
supports comparable fields, while
[GOV.UK details guidance](https://design-system.service.gov.uk/components/details/)
keeps optional depth separate from essential decisions. These are design
judgments, not evidence of completed usability testing.

**Re-evaluate when:** upstream licensing, maintenance or a relevant feature
changes; the target workload changes; or another subject has enough evidence
to justify an article. Keep the review date accurate and lead with the
decision; do not pre-populate the index with unpublished work.

---

## Summary table

| #  | Category                      | Chosen               | Status                              |
| :- | :---------------------------- | :------------------- | :---------------------------------- |
| 0  | Site generator (SSG)          | `zensical`           | ✅ In use (personal affinity)       |
| 1  | Python package manager        | `uv`                 | ✅ In use                           |
| 2  | Task runner                   | `just`               | ✅ In use                           |
| 3  | Hook runner                   | `pre-commit`         | ✅ In use                           |
| 4  | Conventional commits          | `commitizen`         | ✅ In use                           |
| 5  | Spell checker                 | `cspell` (+ `vale`?) | ✅ In use (evaluate `vale`)         |
| 6  | Markdown linter               | `markdownlint-cli`   | ✅ In use                           |
| 7  | Secrets detection             | `gitleaks`           | ✅ In use                           |
| 8  | Link validator                | `lychee`             | ✅ In use (local + weekly CI)       |
| 9  | Python deps audit             | `pip-audit`          | ✅ In use (pre-commit hook + CI)    |
| 10 | Workflow lint                 | `actionlint`         | ✅ In use                           |
| 11 | Workflow security             | `zizmor`             | ✅ In use (strict policy)           |
| 12 | Pin Actions to SHA            | `pinact`             | ✅ In use (manual)                  |
| 13 | Dependency monitoring         | Dependabot alerts    | ✅ In use (report-only)             |
| 14 | Development environment       | `uv` + `just` locally | ✅ In use                          |
| 15 | Supply-chain posture          | OpenSSF Scorecard    | ✅ In use (weekly + push)           |
| 16 | Content licensing             | MIT + CC-BY-4.0      | ✅ In use (2026-05-14)              |
| 17 | Quality gates                 | Lighthouse CI        | ✅ In use (blocking a11y/SEO/best-practices; performance/size warnings) |
| 18 | Lockfile maintenance          | Weekly `uv` report   | ✅ In use (read-only)               |
| 19 | JavaScript linter             | `eslint`             | ✅ In use (Flat config, ESLint 10)  |
| 20 | CSS linter                    | `stylelint`          | ✅ In use (Config-standard rules)   |
| 21 | DRY Asset deduplication       | Pre-build Sync Task  | ✅ In use                           |
| 22 | Bilingual symmetry checker    | Custom Python hook   | ✅ In use                           |
| 23 | Project governance            | Single Developer Flow| ✅ In use                           |
| 24 | Secure design principles      | Static threat model  | ✅ In use (CSP gap recorded)        |
| 25 | Branch protection             | Classic Branch Protection   | ✅ In use                     |
| 26 | CodeQL / SAST                 | CodeQL               | ✅ In use (Actions, JS, Python)     |
| 27 | Typography delivery           | Self-hosted `woff2`  | ✅ In use (2026-07-25)              |
| 28 | Design system                 | Tokenized `extra.css` | ✅ In use (see `design.md`)        |
| 29 | Technical glossary and local Tools | Native ES modules + built-in tests | ✅ In use (glossary, local simulation, no remote execution) |
| 30 | Blog comparison articles        | Concise explanation + results + sources | ✅ In use (nine articles, rated) |

---

## Appendix: notable rejections

Tools evaluated and discarded, with the reason, to avoid reopening
the discussion later:

- **`cocogitto` (replace `commitizen`)** — Overlapping function,
  no tangible benefit for a repo of this size. High migration cost.
- **`typos` (replace `cspell`)** — Different category. Poor Spanish
  support. Not a substitute.
- **`dprint` (replace `markdownlint-cli`)** — Different category
  (format vs. lint). Switching drops the rules.
- **`mise` (replace `just`)** — Over-engineering; one Node LTS pin
  beside Python does not need a runtime manager.
- **`detect-secrets` (replace `gitleaks`)** — Considered as the
  Python-native option. Discarded: upstream has not shipped a
  release since 2024-05 (a gap of more than two years) and the rule surface lags
  modern cloud / SaaS providers. See [Secrets detection](#7-secrets-detection)
  for the full comparison.
- **Renovate (automated dependency updates)** — More powerful but also
  more complex, and its branch/PR model conflicts with report-only policy.
- **Browser test dependency (historical deferral)** — Re-evaluated after
  interaction regressions in glossary navigation and locale transitions.
  Python Playwright is now pinned as a development dependency and runs in
  the Quality workflow. No npm application manifest or browser runtime
  dependency was added; pure logic tests still use Node's built-in runner.
- **Branch protection and CodeQL (historical rejection)** — Re-evaluated and
  adopted to satisfy OpenSSF Scorecard requirements and establish a robust,
  verifiable repository posture for public visitors.
- **REUSE / SPDX per-file headers** — Dual-license already declared
  cleanly at repo level (`LICENSE` for code, `LICENSE-CONTENT` for
  `content/**`). Per-file overhead unjustified for one maintainer.
  *Re-evaluate if content moves to a multi-maintainer open-content
  repo.*
- **WebPageTest API for quality gates** — Less GitHub-native than
  Lighthouse CI, requires API keys. No clear benefit here.

---

## How to update this document

- When a tool is adopted, move its row to "✅ In use".
- When a new alternative is discarded, add it to the appendix with
  the reason in one line.
- Review at least once a year the pending "➕ Add" entries.
