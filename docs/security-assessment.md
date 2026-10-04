# Security Assessment — landerox.github.io

A consolidated threat model and assurance case for the personal static
portfolio platform. This document satisfies OpenSSF Best Practices Baseline-2
criterion `osps_sa_03_01` and supports the security commitments documented in
the repository.

## Scope

`landerox.github.io` is a static website generated via
[Zensical](https://zensical.org)
(Python) and hosted on GitHub Pages. The repository contains markdown content,
site configurations, GitHub Actions CI/CD workflows, and development task
runners. It does not run a daemon, does not expose dynamic backend application
endpoints, and does not process user credentials.

## Attack surface

| Surface | What it exposes | Where it lives |
| --- | --- | --- |
| GitHub Pages hosting | The published site rendered in user browsers over HTTPS | `site/` (built output hosted by GitHub) |
| CI / CD deployment | GitHub Actions workflows running with repository secrets / tokens | `.github/workflows/*.yml` |
| Supply chain | Third-party GitHub Actions, pre-commit hooks, and Python packages (Jinja2, Click, Markdown, etc.) | `.github/workflows/*.yml`, `.pre-commit-config.yaml`, `pyproject.toml`, `uv.lock` |
| Developer environment | Local shell and task-runner configuration used to build and validate the site | `Justfile`, `.config/` |
| Visitor's browser | First-party CSS, JavaScript and fonts only — **no third-party origin is contacted from any page** (see T7) | `content/**/assets/`, `zensical*.toml` |

## Threats considered

Each threat is mapped to the active controls in place to mitigate it.

### T1. Leaked credentials in version control

* **Risk**: A maintainer accidentally commits a secret API key, token, or
  private configuration.
* **Mitigations**:
  * `gitleaks` runs as a pre-commit hook on every local commit and in CI via
    `pre-commit` on every pull request.
  * `.gitignore` explicitly excludes local configuration and scratch
    space (`.env`, `.envrc`, `.tmp/`, `.cache/`, build output).
  * GitHub secret scanning and push protection are enabled on the public
    repository, so a detected provider secret is blocked at push time as
    well as by the local hook. Both are remote settings: after a repository
    recreation they are set and verified with the AGENTS.md controls.

### T2. Malicious or accidental push to `main`

* **Risk**: Unauthorized code or compromised configuration is pushed directly
  to the production branch.
* **Mitigations**:
  * **Branch Protection**: Classic Branch Protection enforces the following
    policies on `main` (with admin enforcement disabled for bypass). The
    reproducible API payload lives in `.github/branch-protection.json` and
    must be applied after the initial `main` push when a repository is
    recreated:
    * **Requires a Pull Request**: Direct pushes to `main` are blocked for
      actors subject to protection. The normal workflow uses a PR; the sole
      administrator retains the explicitly configured bypass.
    * **Requires Signed Commits**: applied through the separate
      `required_signatures` endpoint, not the JSON payload; the admin bypass
      applies to it as well.
    * **Blocks force pushes and branch deletion** (`allow_force_pushes` and
      `allow_deletions` are `false` in the payload).
    * **Requires Linear History**: Only Squash or Rebase merge methods are
      allowed (preventing merge commits). GitHub cannot sign rebased
      commits, so on this signed branch squash is the web merge method.
      Web-based commits require a sign-off.
    * **Required Status Checks**: The status checks `lint`, `build` and
      `Verify DCO Sign-off` must pass before merging.
  * **DCO Check**: The `CI · DCO Check` workflow verifies that every commit
    carries a Developer Certificate of Origin (`Signed-off-by:`) sign-off,
    establishing legal accountability for contributions.

### T3. Workflow privilege escalation

* **Risk**: A compromised workflow step or action exfiltrates secret tokens or
  overrides repository settings.
* **Mitigations**:
  * **Minimal Permissions**: Every workflow specifies a default
    `permissions: contents: read` block. Elevated permissions (like
    `pages: write` and `id-token: write` in `deploy.yml`) are restricted
    strictly to the individual jobs that require them.
  * **Commit-SHA pinning**: All third-party GitHub Actions are pinned to a
    full 40-character commit SHA followed by a human-readable tag comment,
    in the form `owner/action@<40-hex-commit-sha> # vX.Y.Z`. A tag is mutable
    and can be repointed at new code; a commit SHA cannot, which is what
    defeats tag-spoofing supply chain attacks. The required repository-level
    `sha_pinning_required` policy rejects unpinned refs before execution;
    because that setting cannot live in Git, `AGENTS.md` carries its restore
    command. `zizmor` also enforces the convention in source, and `pinact`
    applies it to new references.

    The live pins live in `.github/workflows/*.yml` and are deliberately
    **not** restated here. They are reviewed and updated manually with
    `just pin-actions`; read the current values from the workflows instead
    of duplicating them in prose.
  * **Workflow Linting**: `zizmor` runs in pre-commit and CI, scanning for
    dangerous workflow patterns (like unsafe `github.context` injections or
    unpinned uses). `actionlint` validates YAML structure.
  * **Workflow SAST**: `Security · CodeQL` also runs the `actions` language
    over `.github/workflows/`, so expression injection, untrusted checkouts
    and over-broad permissions are reported into code scanning by a second,
    independent rule set.
  * **No credentials persistence**: The checkout step uses
    `persist-credentials: false` to ensure workflow tokens are not persisted to
    the working directory.

### T4. Compromised package or Actions dependency (Supply Chain)

* **Risk**: An upstream dependency (Python package or Action feature) is
  hijacked or has a known vulnerability.
* **Mitigations**:
  * **Dependabot alerts only**: GitHub vulnerability alerts report known
    issues in the dependency graph. Version updates and automated security
    updates are disabled. Custom auto-triage rules must also remain free of the
    **Open a pull request** action; with that external condition verified,
    Dependabot cannot create branches or pull requests. These repository
    settings must be restored and verified after recreation using the commands
    in `AGENTS.md`.
  * **Weekly Lockfile Report**: `Maintenance · uv Lock Report` resolves an
    upgraded lockfile in an ephemeral runner, verifies it with sync,
    pre-commit, dependency audit and the bilingual build, then writes the
    result to the Actions summary without persisting repository changes.
  * **Vulnerability Audits**: `pip-audit` runs daily via `CI · Lint`
    (`lint.yml`) to scan python dependencies for CVEs against the PyPI
    vulnerability database.
  * **OpenSSF Scorecard**: The `Security · OpenSSF Scorecard` workflow audits
    the repository weekly and uploads the posture score to GitHub Security
    scanning, maintaining a public scorecard badge.

### T5. Tampered site deployment

* **Risk**: An attacker intercepts or modifies the build artifacts before they
  are published to Pages.
* **Mitigations**:
  * **Direct GitHub Pages Deployment**: The site is built and uploaded as a
    zipped artifact using `actions/upload-pages-artifact` and deployed using
    `actions/deploy-pages`. No external hosting provider or third-party
    artifact
    repository is involved.
  * **HTTPS Enforcement**: GitHub manages TLS termination for Pages; HTTPS
    enforcement protects transport when the domain and certificate are
    correctly configured. Verify the custom domain, certificate and
    enforcement after recreation. The [Pages HTTPS documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
    describes these controls; no exclusive TLS version or current external
    audit grade is asserted here.

### T6. Abandoned maintenance / unpatched vulnerabilities

* **Risk**: Security issues emerge while the repository is idle, leaving the
  production site vulnerable.
* **Mitigations**:
  * **Daily Cron Jobs**: `CI · Lint` runs daily at 08:00 UTC, triggering
    `pip-audit` and `pre-commit` to catch new CVEs.
  * **Weekly Link Checks**: `Maintenance · Link Report` runs weekly to identify
    broken links and writes its report to the Actions job summary without
    opening an issue.
  * **Private vulnerability reporting**: `.github/SECURITY.md` directs reports
    to GitHub's private channel. It is a repository setting, off by default,
    and must be re-enabled with the command in `AGENTS.md` after recreation.

### T7. Third-party asset delivery in the visitor's browser

* **Risk**: A page pulls CSS, JavaScript or fonts from an external
  origin. That origin can serve modified bytes, and it observes every
  visitor's IP address, `User-Agent` and `Referer` without consent —
  a supply-chain surface and a privacy exposure in one.
* **Current status**: fonts and other page assets are self-hosted. External
  font delivery is not part of the published implementation.
* **Mitigations**:
  * **Fully self-hosted assets**: `theme.font = false` in both Zensical
    configs, and every family (Inter, Outfit, MesloLGM) ships as
    `woff2` under `content/en/assets/fonts/`, versioned in this
    repository. No page contacts any external origin — verifiable by
    grepping the build output for `<link>` and `<script>` hosts.
    Rationale in [Typography delivery (self-hosted
    fonts)](decisions.md#27-typography-delivery-self-hosted-fonts).
  * **Subresource integrity is moot** once there is nothing remote to
    verify; the font bytes are reviewed at the point they enter Git.
* **Residual risk**: font files are third-party binaries, refreshed by
  hand. Nothing tracks upstream releases, so a security fix in a font
  library would not surface automatically — accepted, since a font is
  parsed by the browser's own hardened font stack and the files do not
  change unless a maintainer replaces them.

### T8. Absent browser-side security headers

* **Risk**: Without a Content Security Policy, a script injected into
  the published output executes unrestricted; without
  `frame-ancestors`, the site can be framed for clickjacking.
* **Status**: **Partially mitigated (2026-08).** GitHub Pages cannot
  send custom response headers, but a baseline
  `<meta http-equiv="Content-Security-Policy">` now ships from
  `overrides/main.html`, restricting scripts, styles, images, fonts
  and connections to this origin. `'unsafe-inline'` remains allowed
  because Zensical inlines its bootstrap scripts, and
  `frame-ancestors` cannot be expressed in a `<meta>` policy, so
  clickjacking protection stays unavailable on this hosting.
* **Compensating controls**: there is no server-side dynamic surface to
  inject into — no application server, request handling, authenticated
  session or cookies. Visitor input remains client-side, but an injected
  script could still read questions or replace trusted page content; the
  absence of a backend does not eliminate that risk. Content reaches the
  site through a protected branch (T2), and the published JavaScript is
  scanned by CodeQL. Input-specific controls are covered in T9.
* **Residual work**: per-build script hashes to drop
  `'unsafe-inline'` (needs a pipeline hook Zensical does not expose),
  and header-based `frame-ancestors` (needs different hosting).
  Tracked in [Secure design
  principles](decisions.md#24-secure-design-principles).

### T9. DOM injection and misleading interactive output

* **Risk**: visitor text or editorial data could become executable markup;
  an unqualified estimate or simulation could be mistaken for measured output.
* **Controls**: text-only DOM construction, no HTML interpolation. Glossary
  data is validated for bilingual fields, unique IDs and HTTPS source links.
  Its fixed same-origin catalog request never includes visitor search text.
  The finite SQL grammar never calls a database, shell or code evaluator.
  Its two tables are immutable fictional data. Full token consumption,
  allowlisted identifiers and character/token/nesting limits bound parsing;
  LIKE uses wildcard matching, not an evaluated visitor regex. CSV quotes
  values and neutralizes spreadsheet-formula prefixes. No upload is accepted.
  Schema Diff parses at most 32,768 characters and 200 uniquely named columns
  per input, rejecting unknown fields and types. It is an explicit flat-table
  contract, not a general JSON Schema validator. Maps keep prototype-like names
  inert; reports use JSON and text nodes, never executable HTML. Editing either
  schema invalidates its report and disables export until it is recomputed.
  Inputs, formatted output and CLI history are bounded and not persisted.
  Scenario links carry tool inputs in the URL fragment, which browsers never
  send to the server; keys are allowlisted per tool, the fragment is capped
  at 6,000 characters and every value passes the same validation as typed
  input before it reaches a model, never the DOM as markup. The query is
  percent-encoded twice, so the theme's single decode of the fragment, which
  it places in a selector, never yields a quote, backslash or newline. A link exists
  only when the visitor copies one. `jwt` decodes Base64URL with strict UTF-8
  and JSON parsing, bounds the token to 8,192 characters, flags `alg: none`
  and says it never verifies a signature; its note warns against pasting
  live production tokens. `rate` uses exact BigInt arithmetic and rejects bit
  units instead of guessing. Acronym tooltips are generated at build time from
  the validated catalog into `<abbr title>` text; no visitor data is
  involved.
  `ping` uses HEAD against one fixed same-origin asset, omits credentials,
  rejects redirects and limits requests, timeouts and cancellation.
  UUID and SHA-256 use Web Crypto; Base64 is not described as encryption.
  CLI examples and history suggestions only insert text; accepting one
  cannot execute it. Suggestions remain in session memory, never storage.
  Reference lists enhance reviewed Markdown already present in the page.
  Radar topic selection uses fixed allowlisted buttons, not free-text search;
  selection and counts stay local. No third-party runtime or data endpoint is
  used. Invalid topic values leave entries visible rather than hiding content.
* **Output contract**: the glossary displays authored definitions and sources,
  not generated answers or biographical extracts. Memory scenarios compare
  unrounded estimates against an explicit baseline; architecture presets cite
  the publisher and do not rank models or guarantee hardware capacity.
  SQL uses synthetic data; logical stage counts are not a physical query plan.
  SLO budgets distinguish measured requests from window minutes, unknown
  exposure from success, and undefined burn ratios from zero. They do not
  predict future traffic or certify an SLA. Schema change notes explain both
  reader directions without certifying a migration's compatibility.
  Failure Lab is deterministic and conserves events
  between written, queued, rejected and dead-letter states. Queue size, retries,
  playback duration and event logs are bounded. No failure reaches a network
  or real infrastructure; restoring service does not replay rejected work.
  The A/B comparison uses the same fixed incident and workload for both bounded
  retry policies. Seeded additive jitter is reproducible; simulated outcomes
  are not benchmark measurements or proof that a policy always wins.
  Byte and integer-base conversions are bounded local calculations. The
  table-file planner is a stated planning estimate for evenly spread data,
  not a benchmark, and names what it does not model. Color
  contrast reports apply to the supplied opaque colors, not to a whole-page
  accessibility certification. Research references retain full source text,
  visible adoption conditions and Blueprint trade-offs rather than presenting
  a ranking as measured evidence. Optional disclosures do not hide the fit or
  limitation summary. Print temporarily exposes all entries and sources, then
  restores the prior filter and disclosure state.
* **Lifecycle**: timers stop offscreen, in hidden tabs, behind the console and
  on navigation. Page disposal removes listeners and observers. No autoplay.
* **Assurance and limits**: Node tests cover schemas, filtering, parsing,
  arithmetic and simulation invariants. Browser checks cover unsafe input,
  focus, locales, recovery and contrast. This is not a security
  certification; compromised editorial data can still mislead as content.
  Any model, persistence or remote fault injection needs a fresh assessment.

## Assurance case summary

The platform's integrity and security posture relies on protected changes
(with the documented administrator bypass), signature requirements, minimum
tokens, SHA-pinned dependencies, daily CVE scans and self-hosted browser assets.
Some controls are automated; others depend on the owner's configuration and
review.
The repository versions its workflows, policies, and commands for restoring
remote controls. GitHub-hosted settings remain external state and require
explicit verification after repository recreation.

One gap is stated rather than papered over: browser-side response headers are
not available on GitHub Pages (T8). A baseline `<meta>` CSP covers resource
loading, but header-only controls (`frame-ancestors`) remain absent, and the
static architecture is what keeps the residual risk acceptable.

## Maintenance

This document MUST be updated when:

1. The branch protection rules are modified.
2. A new runtime, external integration, or deployment channel is added
   **or removed** — T7 was added because an external font origin was
   removed, and its absence is itself a control worth recording.
3. Upstream controls are replaced or retired.
4. A control recorded here turns out not to exist (T8).

Last reviewed: 2026-09-25
