# landerox.github.io

Source code for my personal portfolio and engineering blog. Built with **Zensical** (Rust-based SSG) and managed via **uv** for Python dependencies.

## Live Site

- [landerox.github.io](https://landerox.github.io)

## Quick Start

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

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and releases.

## License

MIT License. See [LICENSE](LICENSE).
