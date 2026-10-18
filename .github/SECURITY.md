# Security Policy

## Reporting a Vulnerability

I take the security of this project seriously. If you believe you have found a
security vulnerability, please use the **GitHub Private Vulnerability
Reporting** feature.

1. Navigate to the
   [Security](https://github.com/landerox/landerox.github.io/security)
   tab of this repository.
2. Select **Advisories** from the left sidebar.
3. Click **Report a vulnerability** to open a private advisory.

Alternatively, you can reach out via the contact methods listed on
[landerox.com](https://landerox.com). Please do not use public issues for
security vulnerabilities.

### Disclosure Policy

- I will acknowledge receipt of your report within **48 hours**.
- I will provide an estimated timeframe for a fix within **7 days**.
- I will notify you once the vulnerability is resolved.
- **Reporter Credit:** If you are the first to report a verified security
  vulnerability and you comply with this policy, I will gladly credit you
  publicly in the GitHub Security Advisory and the release notes (if you
  wish to be attributed).

## Posture transparency

For visibility into the security posture of this repository:

- **Supply-chain audit (public):** [OpenSSF
  Scorecard](https://scorecard.dev/viewer/?uri=github.com/landerox/landerox.github.io)
  runs weekly and on every push to `main`. SARIF results upload to
  GitHub code-scanning.
- **Vulnerability advisories:** GitHub Dependabot alerts cover the
  full dependency graph (including transitive deps from `uv.lock`) in
  report-only mode; automated remediation branches and PRs are disabled.
- **Python dependency audit:** `pip-audit` runs in CI on push **and**
  daily at 08:00 UTC, over the locked production dependency tree
  (`uv export --no-dev`, transitive packages included).
- **Secrets detection:** `gitleaks` runs on pre-commit with 160+
  provider rules (cloud keys, SaaS tokens, fine-grained PATs).
  A confirmed false positive is recorded in `.gitleaksignore` at the
  repository root (none today).
- **Workflow security:** `zizmor` enforces its default blanket
  hash-pin policy on pre-commit, and the repository setting
  `sha_pinning_required` rejects any unpinned Action. Every Action is
  pinned to a full commit SHA.
- **Static analysis:** CodeQL scans the JavaScript, Python and GitHub
  Actions workflow sources on push, pull request and a weekly schedule,
  reporting into code scanning.

See [`docs/decisions.md`](../docs/decisions.md) for the full rationale —
the sections on secrets detection, dependency audit, Actions security,
pinning Actions to SHA, and supply-chain posture.
