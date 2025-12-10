# landerox.github.io

> Repository hosting my **Personal Portfolio**, **Technology Radar**, and **Engineering Resources**.

## About This Project

This repository hosts the source code for **landerox.com**. It serves as a live demonstration of my engineering standards applied to a real-world project, showcasing a modern, high-performance architecture built with Rust-based tooling and strict CI/CD practices.

## Core Philosophy

- **Simplicity:** Straightforward solutions over unnecessary complexity.
- **Consistency:** Predictable patterns across all services and jobs.
- **Automation:** If it can be scripted, it is automated (CI/CD, Linting).
- **Reproducibility:** Deterministic environments using modern tooling.
- **Performance:** Fast builds and deployments using efficient tools.

## Live Site

- [landerox.com](https://landerox.com)

## Tech Stack

This project follows strict engineering standards using modern tooling:

- **SSG:** [Zensical](https://github.com/zensical/zensical) (Rust-based)
- **Dependency Management:** [uv](https://github.com/astral-sh/uv) (High-performance Python package manager written in Rust)
- **Code Quality:** [Ruff](https://github.com/astral-sh/ruff) & [Pre-commit](https://pre-commit.com/) (Linting, formatting, and spell-checking)
- **CI/CD:** GitHub Actions for automated building and deployment.

## Prerequisites

- **Python 3.12+**
- **uv** package manager: [Installation Guide](https://docs.astral.sh/uv/getting-started/installation/)

For **Dev Container setup**, you'll also need:

- [Docker](https://www.docker.com/)
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

---

## Quick Start

### Option 1: Dev Container (Recommended)

This approach gives you a fully isolated, pre-configured development environment.

```bash
git clone https://github.com/landerox/landerox.github.io.git
cd engineering-standards
code .
```

**In VS Code:**

- When prompted, click **"Reopen in Container"**
- Wait for the container to build (~2 minutes on first run)
- The environment is ready:
  - Python 3.12 installed
  - All dependencies synced
  - VS Code extensions configured
  - Pre-commit hooks installed
  - No conflicts with your system Python

**Verify it's working:**

Open the integrated terminal (`Ctrl` + `~` or `Terminal` > `New Terminal`) and verify:

```bash
python --version    # Should be 3.12.x
ruff --version
pyright --version
zensical --version
```

---

### Option 2: Local Setup

If you prefer to work without Docker, set up the environment locally.

```bash
git clone https://github.com/landerox/landerox.github.io.git
cd engineering-standards
uv sync --all-groups
uv run pre-commit install
```

**Verify installation:**

```bash
uv run python --version    # Should be 3.12.x
uv run ruff --version
uv run pyright --version
uv run zensical --version
```

> Note: Without Dev Container, you won't have VS Code extensions (spell-checking, linting, type-checking UI) automatically configured. Pre-commit hooks will still validate everything before commits.

---

## Documentation

### Run Documentation Locally

```bash
uv run zensical serve
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and releases.

## Security

To report vulnerabilities, see [SECURITY.md](SECURITY.md).

## License

MIT License. See [LICENSE](LICENSE).
