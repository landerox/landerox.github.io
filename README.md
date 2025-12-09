# landerox.github.io

[![CI/CD](https://github.com/landerox/landerox.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/landerox/landerox.github.io/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Zensical](https://img.shields.io/badge/Built%20with-Zensical-orange)](https://github.com/zensical/zensical)

Source code for my **Personal Portfolio**, **Technology Radar**, and **Engineering Resources**.

Focused on high-performance data engineering, MLOps architecture, and cloud patterns.

## 🚀 Live Site

- [landerox.com](https://landerox.com)

## 🛠️ Tech Stack

This project follows strict engineering standards using modern tooling:

- **SSG:** [Zensical](https://github.com/zensical/zensical) (Rust-based)
- **Dependency Management:** [uv](https://github.com/astral-sh/uv) (The Python package manager written in Rust)
- **Linting & Formatting:** [Pre-commit](https://pre-commit.com/) hooks ensuring code quality.
- **CI/CD:** GitHub Actions for automated building and deployment.

## ⚡ Quick Start

### Dev Container (recommended)

Requires [Docker](https://www.docker.com/) and [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

```bash
git clone https://github.com/landerox/landerox.github.io.git
code landerox.github.io
```

Click **"Reopen in Container"** when prompted.

### Local Setup

Requires [uv](https://docs.astral.sh/uv/getting-started/installation/).

```bash
git clone https://github.com/landerox/landerox.github.io.git
cd landerox.github.io
uv sync --all-groups
uv run pre-commit install
```

### Run Locally

```bash
uv run zensical serve
```

Open [http://localhost:8000](http://localhost:8000).

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## 📜 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and releases.

## 📄 License

MIT License. See [LICENSE](LICENSE).
