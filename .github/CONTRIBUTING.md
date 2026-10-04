# Contributing Guide

Welcome! This document outlines the process for contributing to this project.

## Quick Start

**Prerequisites:**

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) (package manager)
- [just](https://github.com/casey/just#installation) (command runner)
- Node.js LTS, matching the pin in `.pre-commit-config.yaml` (the glossary
  check in `just build`, `just test-workbench` and `just lighthouse`)
- [lychee](https://github.com/lycheeverse/lychee) (optional, for link checks)

**Setup:**

```bash
# 1. Install dependencies
just sync

# 2. Install pre-commit hooks
just hooks-install

# 3. Start dev server
just serve
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## Development Workflow

1. **Branching:** Create a descriptive branch: `git checkout -b
   feat/my-feature`.
2. **Development:** Make your changes and run `just serve` to preview locally.
3. **Quality:** Run `just lint` before committing (or let pre-commit hooks run
   automatically).
4. **Commits:** Use `just commit` for interactive conventional commits
   (e.g., `feat:`, `fix:`, `docs:`, `chore:`); it adds the DCO sign-off.

---

## How to Contribute

### Small Changes (typos, broken links)

- Fork the repository
- Make your changes
- Submit a PR

### New Content or Major Changes

- Open an issue first to discuss
- Wait for feedback before investing significant time
- Submit a PR referencing the issue
- One focused change per PR

---

## Adding a New Page

The site is bilingual and symmetry is **enforced by a pre-commit hook**
(`scripts/check_i18n.py`), so a page has to exist in both languages, with the
same slug and the same heading structure. Adding only one side fails the hook.

1. Create `content/en/<slug>.md` **and** `content/es/<slug>.md`, using the
   same filename in both trees (only the prose differs — this keeps
   `landerox.com/<slug>/` and `landerox.com/es/<slug>/` in step).
2. Register the page in the `nav` array of **both** `zensical.toml` and
   `zensical.es.toml`. `nav` is a key inside the `[project]` table, not a
   section of its own.
3. Run `just serve` (English, port 8000) and `just serve-es` (Spanish, port
   8001) to preview both.
4. Run `just build` to confirm the page renders in both locales.

Two things worth knowing before you edit assets:

- **`content/es/assets/` is generated**, not authored. `just sync-assets`
  regenerates it from `content/en/assets/` on every `serve` and `build`, and
  it is gitignored. Edit the English tree only — changes to the Spanish one
  are overwritten with no warning.
- Shared tokens and global CSS live in
  `content/en/assets/stylesheets/extra.css`, in numbered sections that follow
  the cascade; `tools-simulations.css` and `decision-tools.css` consume the
  same tokens. Site JavaScript is the `content/en/assets/javascripts/extra.js`
  module entry plus one module per feature under `features/`;
  `features/lazy-features.js` imports the workbench, comparison and glossary
  modules only on pages that need them. Both are documented; read
  [`docs/design.md`](../docs/design.md) before adding styles, rather than
  appending one-off overrides.

---

## Developer Certificate of Origin (DCO)

To ensure a clean legal pedigree for all contributions, this project requires
contributions to comply with the Developer Certificate of Origin (DCO). By
contributing, you certify that you have the right to submit your contribution
under the project's dual-license model (MIT for code/configs, and CC-BY-4.0
for content).

To comply with the DCO, you must sign off your git commits by adding a
`Signed-off-by:` line at the end of each commit message. You can automate
this by running:

```bash
git commit -s -m "feat: your commit message"
```

---

## Roles and Responsibilities

This is a personal static site and portfolio. The project is maintained
exclusively by its owner, `@landerox`, who retains sole write, merge, and
administrative access. Contributors may submit bug reports, suggestions, and
Pull Requests. All Pull Requests are reviewed and merged solely by the owner.

---

## License

By contributing, you agree that your contributions will be licensed under the
project's license model. Three surfaces, split by what a file *is* rather than
which directory it sits in:

- **Code, workflows, and configurations**: MIT License (see
  [LICENSE](../LICENSE)). This includes the front-end sources under
  `content/**/assets/stylesheets/` and `content/**/assets/javascripts/`,
  which live under `content/` only because that is where the site generator
  looks for assets.
- **Prose, articles, and site content**: Creative Commons Attribution 4.0
  International (see [LICENSE-CONTENT](../LICENSE-CONTENT)). This is
  `content/**/*.md`, prose, and authored images.
- **Third-party assets**: retain their own upstream terms and are covered by
  neither of the above — currently the fonts under
  `content/**/assets/fonts/`. Do not submit new third-party assets without
  their license and a notice entry in
  `content/en/assets/fonts/NOTICE.txt` or an equivalent.

The full boundary rule is in [Content licensing (dual-license
model)](../docs/decisions.md#16-content-licensing-dual-license-model).
