---
description: "Open-source software by Fernando Landero: ZDX terminal workflows with reviewable changes, and the build pipeline behind this site."
hide:
  - toc
icon: material/source-branch
---

# :material-source-branch: Open Source

> Two public projects: a terminal toolkit I use every day and the pipeline
> that builds this site.

## ZDX — Zsh Developer Experience Suite

I use ZDX to inspect and run recurring terminal tasks from one searchable
menu. Built for Zsh and Oh My Zsh, it uses `fzf` to find a workflow and show
its details. Changes expose their targets and ask for confirmation.

The public walkthrough follows a Git task from the menu to its plan and
confirmation. Its transcript and reproduction guide explain what happens
at each step.

<!-- markdownlint-disable MD013 -->
[:material-github: View ZDX on GitHub](https://github.com/landerox/zdx-suite){ .md-button .md-button--primary target="_blank" }
[:material-console: See the walkthrough](https://github.com/landerox/zdx-suite/blob/main/docs/demo.md){ .md-button target="_blank" }
<!-- markdownlint-enable MD013 -->

### Three commands to start

| Command | What it does |
| :--- | :--- |
| `zdx` | Browse every suite, filter and preview its commands |
| `dev-menu` | Open one suite directly: checks, audits, cleanups |
| `zdx doctor` | Report missing dependencies before you need them |

### What is inside

Each suite loads only when first used. The
[project README](https://github.com/landerox/zdx-suite) documents the current
catalog, platform requirements and limits.

| Area | Examples |
| :--- | :--- |
| Projects | Git repositories and identities, stashes, quality checks and security audits |
| Files and environments | Archives, reviewed file cleanup, masked environment variables, Python virtual environments with uv |
| System and network | Host diagnostics, system maintenance and WireGuard tunnels |
| Extending ZDX | `zdx doctor` and a plugin manager for your own menus in `~/.config/zdx` |

### Safe by default

* Anything that changes state lists its exact targets and offers a dry run
  and a confirmation first.
* The installer only links a checkout you have reviewed: it downloads
  nothing and leaves your shell startup file alone.
* Your own plugins are Zsh code that runs in your shell, so review them
  before loading them.

**Quality.** BATS tests; `shellcheck`, `gitleaks`, `actionlint`, `zizmor` and
`zsh -n` in pre-commit and CI; releases with a SHA-256 checksum and signed
build provenance; OpenSSF Best Practices Silver. It runs on Linux and WSL2,
and macOS covers the core workflows. MIT license.

## This site — landerox.github.io

The [repository behind this site](https://github.com/landerox/landerox.github.io)
is public: the Markdown content, the bilingual Zensical build and the checks
every change has to pass, such as SHA-pinned Actions, CodeQL, Lighthouse CI and
browser tests.
[`docs/decisions.md`](https://github.com/landerox/landerox.github.io/blob/main/docs/decisions.md)
explains each tool choice and the alternatives it rejected.

### UX/UI principles {#ux-ui}

The site is also a small case study in making technical ideas usable without
asking visitors to know the vocabulary first.

1. **Explain progressively.** Each tool opens on a worked example and keeps
   its formulas and limits in one disclosure.
2. **Show state and recovery.** Failure Lab separates waiting, saved,
   retried and rejected work, so a stopped service is not mistaken for lost
   work.
3. **Suggest without acting.** In the CLI, faint suggestions and examples
   fill the input; only Enter runs a command.
4. **Keep one visual language.** Shared color tokens, quiet surfaces and
   restrained motion, checked for contrast, focus, zoom and narrow screens in
   both palettes.
5. **Preserve control and privacy.** Tools run locally, motion can be
   reduced and content stays readable without JavaScript.

The format follows the content: brief, scannable table cells
([USWDS tables](https://designsystem.digital.gov/components/table/)), cards
that carry an action rather than a border
([USWDS cards](https://designsystem.digital.gov/components/card/)) and
disclosures only for context some visitors need
([GOV.UK details](https://design-system.service.gov.uk/components/details/)).
[WCAG 2.2](https://github.com/w3c/wcag/tree/WCAG22-20241212) is the
accessibility reference. Automated and browser checks catch defects; they do
not replace sessions with real visitors, which the
[Tool Usability](labs.md#experience-lab-experience-lab) study plans and has
not run. The implementation and its constraints live in the
[design system](https://github.com/landerox/landerox.github.io/blob/main/docs/design.md).

<!-- markdownlint-disable MD013 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "ZDX (Zsh Developer Experience Suite)",
  "description": "Interactive, fzf-powered developer workflows and a custom plugin loader for Zsh, built as a drop-in for Oh My Zsh.",
  "codeRepository": "https://github.com/landerox/zdx-suite",
  "programmingLanguage": "Shell",
  "runtimePlatform": "Zsh",
  "license": "https://opensource.org/licenses/MIT",
  "author": { "@type": "Person", "@id": "https://landerox.com/#person", "name": "Fernando Landero" }
}
</script>
<!-- markdownlint-enable MD013 -->
