# Contributing

Thank you for your interest in contributing!

## How to Contribute

### Small Changes (typos, broken links)

- Fork the repository
- Make your changes
- Submit a PR

### New Content or Major Changes

- Open an issue first to discuss
- Wait for feedback before investing significant time
- Submit a PR referencing the issue

## Local Development

```bash
git clone https://github.com/landerox/landerox.github.io.git
cd landerox.github.io
uv sync --group dev
uv run pre-commit install
uv run zensical serve
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Guidelines

- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
- One focused change per PR
- Ensure pre-commit hooks pass before submitting

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
See [LICENSE](LICENSE) for details.
