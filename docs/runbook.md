# Runbook — landerox.github.io

What to do when something breaks.

## Repository recreation and the v0.1.0 baseline

This checklist is for the owner, after an explicit decision to recreate the
repository. It does not authorize an assistant to delete a repository, rewrite
history, create branches or tags, publish, or change remote settings.
Documented configuration is not evidence that the remote controls were audited.

1. Preserve the current working tree and any history, releases, issues or
   settings the owner wants to retain before replacing anything. Inspect local
   and remote tags: an existing `v0.1.0` is not permission to move or overwrite
   it. The replacement repository and its initial release are a separate,
   owner-controlled publication.
2. Keep both version fields in `pyproject.toml` and the project entry in
   `uv.lock` at `0.1.0` for this baseline. Edit the single `CHANGELOG.md`
   description in place so it reflects the completed repository, not its
   editing history. Do not run `just bump` merely to create the initial tag:
   that recipe performs a version bump and a commit.
3. Run the real gates before publication: `just lint`, `just test-workbench`,
   `just check-i18n`, `just build`, `just install-browser` and
   `just test-browser`, `just links` and `just lighthouse`.
   Review the compiled site in both locales, palettes, keyboard and mobile
   layouts. Record actual outcomes and unresolved limitations; passing a
   local gate does not establish the state of GitHub-hosted controls.
4. The owner makes, or explicitly delegates, the initial signed,
   DCO-signed-off commit (`just commit` adds the sign-off) and publishing. A
   local clone keeps the previous root commit and any old local `v0.1.0` tag;
   they describe the deleted repository, so decide explicitly before replacing
   them. Before the first push, enable Pages (step 5) so the push-triggered
   deploy succeeds. Then restore and verify the repository controls in
   [`AGENTS.md`](../AGENTS.md): read-only workflow defaults, no workflow PR
   creation, SHA pinning, report-only dependency settings, private vulnerability
   reporting, secret scanning with push protection, merge policy, classic branch
   protection (once `main` exists remotely) and the separate signed-commit
   requirement. Require signatures only after `gh api
   /repos/landerox/landerox.github.io/commits/main --jq
   .commit.verification.verified` returns `true`; otherwise register the SSH
   signing key first.
5. Pages has no file in the repository; it has to be recreated from the
   settings or the API:

   ```bash
   gh api -X POST /repos/landerox/landerox.github.io/pages -f build_type=workflow
   gh api -X PUT /repos/landerox/landerox.github.io/pages -f cname=landerox.com
   # Only main may deploy, independent of branch protection.
   gh api -X PUT /repos/landerox/landerox.github.io/environments/github-pages \
     --input - <<'JSON'
   {"deployment_branch_policy": {"protected_branches": false, "custom_branch_policies": true}}
   JSON
   gh api -X POST \
     /repos/landerox/landerox.github.io/environments/github-pages/deployment-branch-policies \
     -f name=main -f type=branch
   # Once the certificate state is "approved":
   gh api /repos/landerox/landerox.github.io/pages --jq .https_certificate.state
   gh api -X PUT /repos/landerox/landerox.github.io/pages -F https_enforced=true
   ```

   Confirm DNS/domain ownership and check the deployed English and Spanish
   pages. Restore any other environment protections deliberately; do not
   assume they survive recreation.
6. Review repository links, Actions badges, OpenSSF project registrations and
   external integrations. These may refer to the previous repository state
   even when the new repository has the same name.
7. After reviewing the final baseline commit and the new repository's checks,
   the owner creates and publishes the signed `v0.1.0` tag and release notes.
   If that tag already exists in the target repository, stop and resolve the
   release plan with the owner; do not force-update it. The changelog's tag
   link is a publication target, not proof that a new release already exists.

## GitHub Pages deploy fails

**Symptom**: `deploy.yml` workflow red in the Actions tab.

**Diagnosis**:

1. Open the failed run under `Actions → CD · Deploy to Pages`.
2. Identify the step that broke:
   - `Build site` → Zensical error (malformed markdown, broken
     internal link, plugin issue).
   - `Upload artifact` → Pages quota or permissions.
   - `Deploy to GitHub Pages` → check
     `Settings → Pages` (source must be "GitHub Actions").

**Actions**:

- **Build error**: reproduce locally with `just build`. The error
  is usually identical to CI.
- **Permissions**: verify the `deploy` job has `pages: write` and
  `id-token: write` (not at workflow level).
- **Urgency**: if the last merge to `main` broke the site,
  `git revert <bad-commit>` and pushing the revert restores the
  previous version after the next deploy.

## Lychee detects broken links

**Symptom**: `Maintenance · Link Report` is red, or its Actions job summary
lists unreachable destinations (scheduled Mondays 07:00 UTC).

**Diagnosis**:

1. Open the failed workflow run and read the Lychee report in the job summary.
2. If no detailed report exists, use the pipeline-outcome table and failed
   step log; checkout, setup or asset synchronization failed before Lychee ran.

**Actions**:

- **404 / moved content**: update the link to the new destination
  or remove the reference.
- **403 / 429**: the target is rate-limiting us or requires auth.
  If it is predictable and acceptable, add the domain to `exclude`
  in `.config/lychee.toml`.
- **Timeout**: sometimes flaky. Re-run the workflow manually
  (`Actions → Maintenance · Link Report → Run workflow`); if it
  persists after the second run, treat it as broken.

The workflow is intentionally read-only. It reports through the check result
and job summary and must never create an issue or modify the repository.

## Site renders wrong after a Zensical bump

**Symptom**: the build is green but something looks broken — a bar in
the wrong color, an invisible button, a control that lost its border,
the progress bar gone.

**Why this happens**: every override in
`content/en/assets/stylesheets/extra.css` is calibrated against the
theme's *compiled* CSS, and a Zensical release can rename a class,
change which variable a component reads, or start styling something the
overrides assumed it did not. The build cannot detect this — nothing is
broken, the styling just no longer lands where it was aimed.

**Diagnosis**:

1. `just build`, then check whether the theme CSS filename changed:

   ```bash
   ls site/assets/stylesheets/modern/
   ```

   The hash in `main.<hash>.min.css` moves whenever the theme CSS
   changes. Same hash across the bump means no recalibration is needed.

2. Re-verify the specific assumptions the overrides depend on. They are
   listed with their expected values in
   [Component rules](design.md#6-component-rules) and [Defects found and
   fixed](design.md#9-defects-found-and-fixed). The load-bearing ones:

   ```bash
   cd site/assets/stylesheets/modern
   grep -o '\.md-header{[^}]*}'        main.*.min.css   # reads --md-default-bg-color--light
   grep -o '\.md-tabs{[^}]*}'          main.*.min.css   # must have no background-color
   grep -o '\.md-typeset \.md-button{[^}]*}' main.*.min.css  # borderless pill, no border-style
   grep -o '\.md-progress{[^}]*}'      main.*.min.css   # reads --md-primary-bg-color
   grep -o '\.md-typeset a{[^}]*}'     main.*.min.css   # underline + --md-typeset-a-color
   grep -c '\.md-search__form'         main.*.min.css   # expected: 0 (classic-only class)
   ```

   Zensical owns the `theme-color` element; `features/theme.js` corrects its value
   for the translucent custom header. The built HTML must not add a static
   duplicate, while the bundle must still create its single runtime owner:

   ```bash
   grep -c 'name="theme-color"' site/index.html  # expected: 0
   grep -o 'name:"theme-color"' site/assets/javascripts/bundle.*.min.js
   # expected: one match
   ```

   Scenario links assume the theme decodes the fragment once and uses it in
   an attribute selector (`[id="…"]`), and that its anchor tracking rewrites
   the hash with `replaceState`. `share-core.js` double-encodes the query and
   `deep-links.js` captures the scenario at boot for exactly these reasons.
   Open a schema-diff scenario link and check the console for selector
   errors; `just test-browser` covers the restore path.

   In a browser, alternate light and dark; there is no system-preference
   option. The transition is 950ms, unless reduced motion disables it.
   Check persistence across reloads and migration from an older stored palette.
   Each state must keep
   exactly one meta whose content equals the computed `<body>` background
   (`--surface-page`, as an `rgb()` value) of the active scheme. If a later
   release emits a valid six- or eight-digit color for translucent headers,
   remove the compatibility bridge in `features/theme.js`.

3. Confirm the palette attribute is still on `<body>` and not `<html>`
   — `features/env.js` reads the color scheme and its tokens from there:

   ```bash
   grep -o '<body[^>]*>' site/index.html
   ```

4. Check a wide table on a narrow viewport in both locales.
   `setupTableA11y()` in `features/tables.js` observes Modern's
   `.md-typeset__scrollwrap` wrappers and their tables. Only an overflowing
   wrapper should have `tabindex="0"`, `role="region"` and a localized name.
   Tab to it and verify ArrowRight scrolls its columns. Resize until the table
   fits: the extra attributes must disappear. Resize narrow again, then use
   instant navigation to another table page and repeat. The old observer must
   disconnect and the new wrappers must be observed, including tables revealed
   by content tabs. Re-check these assumptions after each Zensical bump.

5. Check the Glossary/CLI dock at the end of short and long pages in both
   locales and narrow/desktop viewports. `.landerox-dock-host` belongs directly
   before `.md-footer`, with its natural height reserved in document flow.
   The footer meta band must remain at the page end, without a bottom spacer;
   the dock must not cover the final article links or footer links. Repeat
   after instant navigation and confirm exactly one host and launcher, with
   working controls and focus returning to the opener when the dialog closes.
   `setupWorkbench()` reuses its stored nodes and handlers during boot. Do not
   restore `padding-bottom: 4rem` on the footer or collapse the host to zero
   height. Verify safe-area spacing, a hidden host in print and no reserved
   dock slot with JavaScript disabled.
   At viewport heights up to `24em`, tools use normal flow, not sticky
   positioning. Scroll to their slot and verify both full buttons, keyboard
   focus and the CLI shortcut; do not accept buttons obscured by the header.
   With text enlarged to 200%, the controls may wrap; the host must grow with
   them, without clipping the CLI button or introducing horizontal overflow.

6. Tab to the mobile menu and search buttons. `setupHeaderButtons()` in
   `features/header.js` keeps
   Modern's checkbox labels but moves each icon and accessible name into a
   native button. The search error handler must still find
   `label[for=__search]`; verify Enter/Space, Escape and returning focus to
   the opener. The search shadow root stays open. Its controls row precedes
   results inside the content wrapper, whose parent is the animated panel.
   Closed panels use `pointer-events: none`; the accessibility bridge observes
   class changes and makes that panel inert. Re-check this ancestry and state
   signal, including closing through the search button, with
   `just test-browser`.

7. On the home page, confirm the motion toggle sits immediately before the
   palette toggle (`.motion-option--header`), keeps a 44px target and
   `aria-pressed`, and that below `22.5em` only the footer copy shows. Pause,
   switch palette and language, and reload: the canvas must hold one still
   frame in the new scheme, and both choices must survive the locale switch
   (`extra.scope = "/"`). `just test-browser` covers the persistence path.

**Actions**:

- **A variable changed owner**: update the bridge block in `extra.css`
  (the light- and dark-scheme blocks) rather than adding a selector
  override. Setting the theme's
  own `--md-*` variable keeps components the site does not style
  explicitly on-palette.
- **A class disappeared**: the override is now dead. Delete it, or
  retarget it — do not leave it in place. `.md-search__form` is the
  worked example in [Defects found and
  fixed](design.md#9-defects-found-and-fixed), defect 13.
- **The palette host moved**: fix `paletteHost()` in `features/env.js`. Every
  scheme-aware read goes through that one function for this reason.
- **Nothing obvious**: `git stash` the bump, compare screenshots of
  both themes at desktop and mobile widths, and bisect the theme CSS
  diff.

## Glossary, CLI or a Tools widget fails

1. Run `just test-workbench`, `just lint` and `just build`, then
   `just test-browser` (first install Chromium with `just install-browser`).
   Verify both
   Tools pages exist and both locale asset trees include `glossary.json`.
2. The console and widgets load native modules on demand. Only the first
   glossary opening or public glossary enhancement fetches its catalog;
   search terms never go in the URL.
   A failed catalog request must be retryable with the search preserved.
   SQL, Failure Lab and decision modules load when their widget is visible;
   opening CLI or the glossary alone must not request them. Check the two feature
   stylesheets after `extra.css` in both locale configs and generated trees.
3. Validate glossary data in its English source tree. The single JSON file
   contains both translations and source links; never edit the generated
   Spanish copy. Run `just glossary` after editing the catalog, then
   `just check-glossary`. Never hand-edit generated public glossary pages.
   The catalog and generated prose are editorial content under CC-BY-4.0.
4. Check EN/ES, light/dark, mobile, keyboard focus, glossary filters, empty
   results, retry and native disclosures. The glossary has no email link;
   the site's existing contact links remain available outside the dialog.
   Visitor text must never become HTML. CLI has no heading and one
   pipe-separated hint.
   All 19 commands need examples. `cron` must list five UTC runs with the
   visitor's clock beside them, explain the day-of-month or weekday rule
   and reject Quartz syntax; `nines` must match the SLO worksheet's
   arithmetic for the same target, and its link must open that worksheet
   with the target filled in. `rate` must reject bit units and unknown
   periods; `jwt` must flag unsigned tokens and never claim verification. Test
   ghost acceptance at the end, in the middle, with selected text and during IME
   composition; suggestions must never execute a command. Check the compact help
   directory on narrow screens and detailed `help command` output. Ctrl plus the
   backtick key opens the CLI; plain tilde does not. Public term links must
   reveal filtered-out entries, including a repeated link to the current hash;
   print restores every term temporarily.
5. Check all six Tools tabs, direct hashes and old Labs worksheet links.
   In each tool, "Copy link to this scenario" must reproduce the inputs in a
   fresh tab, fall back to a selected field when the clipboard is blocked,
   and ignore unknown keys; an invalid value must surface as a form error.
   The table-file planner example must show small files and partitions below
   one target file.
   Verify Failure Lab reset, pause, step, restore and bounded playback.
   Navigation, background tabs, offscreen tools and opening the console must
   stop playback without automatic resumption. The separate 30-second policy
   comparison must reproduce the same result for a scenario/seed, preserve
   event accounting and pause manual playback without changing its state.
   Changing scenario or seed must clear stale output. Manual simulation has
   no jitter; the comparison's jitter is seeded and discrete. Verify A/B
   summary columns fit mobile and the longer timeline remains labelled and
   keyboard-scrollable.
   SQL must switch datasets, explain each field, combine filters and export
   only the current successful result. Check stale/empty/error states,
   CSV quoting, numeric precision and keyboard-scrolling reference tables.
   The logical walkthrough must match actual row/group counts, including an
   empty global aggregate (one group/result) versus empty GROUP BY (none).
   Editing or errors hide stale stages; they are not a physical query plan.
6. Check the memory formula and the three sourced Qwen3.8 presets (27B dense,
   Flash-Next and 2.4T-A95B MoE). The explanation list must state the KV
   cache per token, the fixed linear-attention state, the all-layers cache a
   plain transformer would need and, for MoE, resident versus active weights.
   FP8 and INT4 must keep the checkpoint's BF16 share. Save baseline A, edit
   context, concurrency or precision, and confirm A stays fixed while
   component deltas update. Architecture controls remain optional; baseline
   settings must be inspectable. Invalid input must not retain a misleading
   current estimate. Do not interpret the result as per-GPU fit or model quality.
7. Check SLO request and time modes separately: whole measured request windows,
   partial time observations, no observations, 100% targets and exhausted or
   exceeded budgets. Undefined ratios must not render as healthy or Infinity.
   Reject bad observations above the observed total and out-of-range inputs;
   no request-to-minute conversion or future-traffic forecast is supported.
8. Test Schema diff with examples, malformed JSON, unknown keys, duplicate
   names, invalid types/nullability, 201 columns and inputs over 32,768
   characters. Changes must distinguish both compatibility directions; a
   rename is removal plus addition, not inferred equivalence. Editing must
   invalidate the report, copy and JSON download. Clipboard/download errors
   need explicit feedback; no schema may be uploaded or persisted. This is
   a flat column contract, not full JSON Schema or a registry check.
9. Check CIDR /31 and /32, Unicode, SHA-256, malformed JSON, decimal/binary
   byte units, integer-base conversion and color-contrast inputs. Only `ping`
   makes network requests from CLI commands; it uses a fixed same-origin
   asset and must stop when the console closes.
10. Inspect reciprocal hreflang in both XML sitemaps and the equivalent-page
   language selector. Modern's head alternates are intentionally absent:
   its root-prefetch handler constructs invalid sitemap URLs from page links.
   Run the production-origin browser regression to catch missing requests
   and stale locale state; never relax CSP to conceal a failure.

## Reference lists lose content or interaction

1. The source is annotated Markdown (`data-comparison` entries) in the two
   locales, not a second JSON catalog. Without JavaScript, the original
   headings and complete text must remain readable.
2. Check `comparison.js` and its DOM-free `comparison-core.js` module. Run
   `just test-workbench` (which includes `scripts/comparison.test.mjs`) and
   the real lint/build gates.
3. The radar has four topic buttons: All (10), Data (4), AI & agents (4),
   Platforms & operations (2). Check counts and `aria-pressed` with keyboard
   and touch. These are filters, not tabs. Blueprints shows all five references
   without filters. Neither surface has search, sorting or bulk controls.
4. Titles, recommendations and conditions must remain visible before opening
   native details; Blueprint trade-offs must also stay visible. The optional
   details hold the full prose and sources. Verify the original reading
   content is available when JavaScript is disabled.
5. Follow direct heading hashes, repeat the current fragment and use instant
   navigation in both directions. The relevant detail must become visible and
   controls must not duplicate. Recheck Modern's accepted-navigation
   `window.location$` contract after a theme bump.
6. Print with a topic selected and some details closed. Every reference and
   its evidence must print; after printing, the previous topic and disclosure
   states must return. Check native print events and print-media changes.

## A Blog comparison becomes stale or hard to read

1. Check `blog/index.md` and all nine comparison articles in both locales. The
   navigation label is Blog, with a brief editorial index linking to actual
   articles. Do not leave links to the removed Comparisons category or promise
   unpublished work. Each article starts with a short explanation and results.
2. Recheck official repository state, release tags, licenses and documented
   features independently. A recent commit, download count or compatible API
   claim is not proof of production readiness. Update the review month shown
   on the page and the exact `reviewed` date in the front matter, keep the
   documentary scope explicit, and do not invent local benchmark results.
3. Keep each main table compact: project, editorial rating, core license,
   fit and main constraint (Observability uses role, reviewed components and
   what changes the decision). Ratings follow the five criteria stated on the
   Blog index; recompute them when the reviewed version, license or
   maintenance state changes, and keep the breakdown disclosure in step.
   Then run `just sort-ratings`: rating tables list rows from highest to
   lowest, and the `check-ratings` hook fails on an unsorted table.
   Small-installation recommendations and important
   limitations remain visible. Gateways, dev tools and prereleases must not
   be presented as equivalent durable storage clusters. Likewise, distinguish
   embedded engines, PostgreSQL extensions and distributed database services.
   Verify AGPL and mixed source/binary licenses against the reviewed version.
4. Verify native version/source disclosures, source links, table
   overflow and keyboard scrolling in both locales and palettes, including
   JavaScript-disabled reading. These pages do not use `data-comparison` or
   the radar's topic filter. Check print output deliberately; ordinary native
   disclosures are not covered by the radar's print controller.
5. Preserve the production checklist: real-client compatibility, authority,
   backup/restore, upgrade/exit and cost under failure. The published shortlist
   is not an instruction to migrate production without those checks.

## Long-form pages become hard to scan

1. Labs retains three lifecycle tabs with 3 active, 2 completed and 6 planned
   entries. Each `.lab-entry` is open prose, without badges, slug lines, card
   hover or nested disclosures. Keep purpose, baseline and next evidence easy
   to find; active entries use roughly 125–145 words, not a second tool catalog.
   On mobile, all three tabs must remain in one row, with up to two lines
   inside each label rather than wrapping a tab onto another row.
   At 320px, check complete words and text bounds after fonts load, not only
   strip overflow. Modern's linked-anchor padding and trailing spacer must
   not consume the label's reading space or force tiny word fragments.
   The H2 `.reading-panel-heading` and its adjacent native tab set form one
   visual surface, without a surrounding HTML wrapper. Keep compiled
   `data-tabs="1:3"`, all eleven `.lab-entry` elements and their 3/2/6
   distribution. Nesting the tabs in `md_in_html` can split Active and render
   literal Markdown or escaped HTML as code; inspect the built output, not
   only the source, after changing this structure.
2. About uses seven `.experience-entry` sections inside `.experience-list`,
   preserving period, organization, role, industry and full experience text.
   Its four-row focus table (the home's four areas) remains a compact
   comparison.
3. Stack rows must remain inside their intended Markdown tables, including
   Tool UX/UI. Collaboration uses a four-item `.service-list` with the home's
   areas; engagement terms and the UTC-4 overlap window stay visible.
4. Projects keeps five navigation cards with actual destinations. Do not
   apply cards to every paragraph or introduce filtering for small collections.
   Check the compiled mobile and desktop layouts without changing the homepage.
5. In each locale, verify five grouped reading surfaces: Research Laboratories,
   Blueprints' Choose the Smallest Suitable Foundation, Decision Radar, and
   Collaboration's service list and Working arrangements. There should be
   four `.reading-panel` wrappers plus the joined Labs heading/tab surface.
   Release Channels retains its table; contact stays outside the panels.
   The shared background belongs to the group, not every entry: no hover lift
   or nested cards. Check adaptive padding at narrow widths, `Canvas` /
   `CanvasText` in forced colors, and print output without panel backgrounds,
   borders or shadows. Entries and essential terms must remain visible.

## The weekly `uv` lock report fails or finds updates

**Symptom**: `Maintenance · uv Lock Report` is red, or its Actions summary
lists candidate lockfile updates.

**Diagnosis**: open the run summary and resolver output.

- **Resolution failed** → reproduce without changing the repository:

  ```bash
  uv lock --upgrade --dry-run --color never
  ```

- **A verification step failed** (`uv sync`, pre-commit, audit or build) →
  reproduce the candidate locally with `just update`, then run `just lint`
  and `just build`. Pin or adapt the offending dependency before proposing
  an update.
- **Candidates passed every verification** → create a normal maintenance
  branch, run `just update`, review `uv.lock`, and propose it through the
  standard human PR flow.
- **Summary says the lockfile is current** → nothing to do. This is the
  expected outcome on a quiet week.

The workflow is intentionally read-only. It must never leave a commit,
branch or pull request; any such side effect is a workflow regression.

## Dependabot creates a branch or pull request

**Symptom**: a new branch under `dependabot/` or a Dependabot pull request
appears. The intended state is vulnerability alerts only.

**Diagnosis**:

```bash
test ! -e .github/dependabot.yml
gh api -i /repos/landerox/landerox.github.io/vulnerability-alerts
# expected: HTTP 204
gh api /repos/landerox/landerox.github.io/dependency-graph/sbom \
  --jq '.sbom.packages | length'
# expected: a package count; initial population can take several minutes
gh api /repos/landerox/landerox.github.io/automated-security-fixes
# expected: enabled: false
```

- A committed `.github/dependabot.yml` enables version-update pull requests;
  remove it.
- Enabled Dependabot security updates create remediation branches independently
  of `dependabot.yml`; disable them with the command in `AGENTS.md`.
- A custom Dependabot auto-triage rule with the **Open a pull request** action
  can also create remediation branches. GitHub exposes no public API for this
  audit; verify the rule list manually under **Settings → Advanced Security →
  Dependabot rules**.
- Keep the dependency graph and vulnerability alerts enabled: they provide the
  inventory and security report without changing the repository. The alerts
  enable command in `AGENTS.md` restores both after recreation.

After reviewing that a generated PR contains no owner work, close it and delete
its bot branch. Restoring the report-only settings prevents recurrence.

## Hook download fails in CI

**Symptom**: "Prepare pre-commit environments" fails while installing a
hook, before the lint or audit steps execute. For example, npm returns
`E404` for a registry package tarball that was just published.

`lint.yml` and `uv-report.yml` use the same preparation helper. Each restores
`~/.cache/pre-commit` with a key covering the platform, Python/Node/npm
versions, lockfile, hook configuration and preparation code. A cache miss
installs the hooks; a cache hit still checks for missing environments.
Only successful jobs save the cache. A new runtime, hook or policy gets a
new key, and an urgent release-age exception uses a distinct key too.

**Actions**:

- Inspect the preparation log. Recognized npm network/registry errors and
  tarball 404s get up to two retries, after 60 and 120 seconds. Persistent
  failures still fail the job. Missing metadata, invalid versions,
  authentication and configuration errors require fixing their cause.
- Reproduce preparation locally with
  `uv run python scripts/install_precommit_hooks.py`, then run `just lint`
  and `just audit`. The helper installs environments only; it does not
  execute or retry validation.
- npm resolves packages with a minimum release age of one day. If a
  manually selected urgent update is too recent, inspect that release and
  prepare locally with the scoped exception:

  ```bash
  PRE_COMMIT_NPM_MIN_RELEASE_AGE_DAYS=0 uv run python scripts/install_precommit_hooks.py
  ```

  For CI, set `PRE_COMMIT_NPM_MIN_RELEASE_AGE_DAYS: "0"` in `env` on the
  affected job so cache identification and installation receive the same
  value. Remove the exception after reviewing the update. The value is
  included in the cache identity.
- npm's built-in `fetch-retries` handles network and server failures, but
  does not recover tarball 404s by itself. Re-run the failed job later if
  the bounded preparation retries did not outlast the registry incident.

Existing environments are reused; changing the release-age setting does
not reinstall local cached hooks. The cache reduces network dependence,
while the age rule reduces exposure to newly published versions. Neither
is a complete npm dependency lock or an offline installation guarantee.

## Local pre-commit fails

**Symptom**: `git commit` blocked by a failing hook.

**Actions**:

- `just lint` to see full output of all hooks.
- **`cspell` with new valid words** → add to
  `.config/.cspell.json > words`. Ordinary
  Spanish prose should *not* need entries: `@cspell/dict-es-es` is
  installed via the hook's `additional_dependencies` and imported from
  the config. A common Spanish word being flagged means that import
  stopped resolving — check the hook, not the word list.
- **`zizmor` with `unpinned-uses`** → run `just pin-actions`
  (requires `pinact` on `PATH`).
- **`markdownlint`** → fix manually or pass `--fix` if the rule
  is auto-fixable.
- **`end-of-file-fixer`, `trailing-whitespace`, `mixed-line-ending`**
  → these rewrite the file in place and report failure once; re-stage
  the file and commit again.
- **`gitleaks`** → if it is a false positive, get the fingerprint
  from the hook output (`Fingerprint: <hash>`) and append it on its
  own line to `.gitleaksignore` (create the file if absent). Never
  silence a finding without confirming it is not a real secret.
- **Never** use `git commit --no-verify`. If a hook fails, there
  is a reason.

## Quick rollback of the site in production

If the last deploy introduced a critical issue:

```bash
git log --oneline main -5         # locate the problematic commit
git revert <commit-sha>            # creates a commit that undoes it
# Push after your confirmation; the next push triggers deploy.yml
```

GitHub Pages rebuilds in 1-2 minutes.

## `just`, `lychee` or `pinact` not found

**Symptom**: a recipe fails with `command not found`.

**Actions**:

- These three are developer prerequisites, not project dependencies.
  Install them once from their upstream releases and keep them on
  `PATH`; nothing in the repository provisions them.
- Node.js LTS is also required for the built-in JavaScript tests. Match the
  Node pin in `.pre-commit-config.yaml`; pre-commit's isolated Node linters do
  not install the system runtime used by the local test hook.
- Install the Python dependencies and hooks from the repository:

  ```bash
  just sync           # uv sync --all-groups, resolved from uv.lock
  just hooks-install  # pre-commit install
  ```

- `lychee` backs `just links` only — CI runs its own pinned
  `lychee-action`, so keep the local binary on the release that action
  resolves to, or local and CI results will diverge. `just` is pinned in
  CI too (`just-version` in the workflows); a local upgrade should move
  that pin in the same change. `pinact` backs `just pin-actions` only and
  has no CI consumer.

## `C:\Users\...\lighthouse.*` directories pile up in the repo root

**Symptom**: directories literally named
`C:\Users\<user>\AppData\Local\lighthouse.<digits>` in the repository root,
each a full Chrome profile of about 3 MB, one per Lighthouse run — 114 for a
single `lhci autorun` over the repository config. `git status` never shows
them because `.gitignore` hides the pattern.

**Cause**: chrome-launcher, which Lighthouse uses to start Chrome, detects
WSL and takes its Windows branch to pick a profile directory: it derives a
Windows `AppData\Local` path from the `/mnt/c/Users/<user>/AppData/...`
entries in `PATH`, joins it with POSIX `path.join` and creates the result
with `mkdirSync`. On Linux a backslash is an ordinary filename character, so
the whole Windows path becomes **one relative directory name**, created in
whatever the working directory is. Unsetting `TEMP` and `TMP` changes
nothing — the path comes from `PATH`, not from those variables. CI is not
affected: GitHub's Ubuntu runners are not WSL, so chrome-launcher uses
`mktemp -d` under `/tmp` there.

**Actions**:

- Run Lighthouse through the recipe, never by hand from the repo root:

  ```bash
  CHROME_PATH=/path/to/chrome just lighthouse
  ```

  It builds both locales and copies the completed `site/` into a scratch
  directory before running `@lhci/cli` there. The audited snapshot is isolated
  from an active development server rebuilding or replacing `site/`, which
  can otherwise remove Spanish pages mid-run. The repository config,
  snapshot and `lhci-reports/` use absolute paths. The snapshot and stray
  Chrome profiles are deleted with the scratch directory on exit; reports
  are the only audit output left behind. Content edits during an audit are
  not included in that snapshot and need a subsequent build/audit.
- Sweep an existing pile with `just clean` (it removes `site/` and the
  caches too, so rebuild afterwards).
- `lhci-reports/` is the intended output of a run (thirty-eight pages times three
  runs, 114 reports; total size varies). It is gitignored and `just clean`
  does not touch it; delete it by hand when the reports are no longer needed.

## Security audit fails in CI

**Symptom**: "Audit Python dependencies" step red in `lint.yml`.

**Actions**:

- Reproduce locally: `just audit`.
- If the vuln has a fix → `uv lock --upgrade-package <pkg>` (most
  affected packages are transitive; `pyproject.toml` declares only
  `zensical`), or raise a direct pin, then commit.
- If no fix is available → assess real exposure. If it does not
  apply to the project, add `--ignore-vuln <ID>` to the `audit`
  recipe in the `Justfile` — CI and the hook both call it — with the
  rationale in a comment beside it.
