---
description: "Open-source software by Fernando Landero: ZDX, an fzf-powered developer suite for Zsh, and the audited build pipeline behind this site."
hide:
  - toc
icon: material/source-branch
---

# :material-source-branch: Open Source

> Two public projects: a terminal toolkit I use every day and the pipeline
> that builds this site.

## ZDX — Zsh Developer Experience Suite

**What it is.** A set of interactive menus for the Zsh terminal. Instead of
remembering long commands, you pick a task from a filterable list (`fzf`),
see what it will do and confirm. It installs alongside Oh My Zsh.

### Three commands to start

| Command | What it does |
| :--- | :--- |
| `zdx` | Browse every suite, filter and preview its commands |
| `dev-menu` | Open one suite directly: checks, audits, cleanups |
| `zdx doctor` | Report missing dependencies before you need them |

### What is inside

Release 0.1.0 has 251 commands in 15 suites, and each suite loads only the
first time you use it.

| Area | Examples |
| :--- | :--- |
| Projects | Git repositories and identities, quality checks and security audits, tasks from `Justfile`, `package.json` or `Makefile`, GitHub Actions runs |
| Files and environments | Archives, bulk file operations, `.env` profiles read without `source` or `eval`, Python virtual environments with uv |
| System and network | Diagnostics, Docker resources, network checks, WireGuard tunnels |
| AI and hardware | Local AI assistants and MCP declarations, the Hugging Face Hub, NVIDIA GPU telemetry |
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

<!-- markdownlint-disable MD013 -->
[:material-github: View ZDX on GitHub](https://github.com/landerox/zdx-suite){ .md-button .md-button--primary target="_blank" }
[:material-tag-outline: Release notes 0.1.0](https://github.com/landerox/zdx-suite/releases/tag/v0.1.0){ .md-button target="_blank" }
<!-- markdownlint-enable MD013 -->

## This Site — landerox.github.io

The [repository behind this site](https://github.com/landerox/landerox.github.io)
is public: the Markdown content, the bilingual Zensical build and the checks
every change has to pass, such as SHA-pinned Actions, CodeQL, Lighthouse CI and
browser tests.
[`docs/decisions.md`](https://github.com/landerox/landerox.github.io/blob/main/docs/decisions.md)
explains each tool choice and the alternatives it rejected.

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
  "version": "0.1.0",
  "author": { "@type": "Person", "@id": "https://landerox.com/#person", "name": "Fernando Landero" }
}
</script>
<!-- markdownlint-enable MD013 -->
