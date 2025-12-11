---
hide:
  - toc
---

# :material-speedometer: The Rust-Powered Python Ecosystem

> Tools rewriting the Python ecosystem for order-of-magnitude performance gains. "Python syntax, Rust speed."

* **[Granian](https://github.com/emmett-framework/granian){ target="_blank" }**: A Hyper-modern RSGI/ASGI HTTP server for Python applications, written in Rust. Often significantly faster than Uvicorn or Gunicorn.
* **[Orjson](https://github.com/ijl/orjson){ target="_blank" }**: The fastest JSON library for Python. Essential for data engineering pipelines that serialize massive amounts of JSON data.
* **[Robyn](https://github.com/sparckles/robyn){ target="_blank" }**: *The emerging challenger.* An async Python web framework with a Rust runtime. It aims to outperform FastAPI by leveraging multi-threading at the core level.
* **[Ruff](https://github.com/astral-sh/ruff){ target="_blank" }**: An extremely fast Python linter and code formatter. It replaces Flake8, Black, and isort in a single tool.
* **[UV](https://github.com/astral-sh/uv){ target="_blank" }**: A blazing fast Python package installer and resolver. It replaces pip, poetry, and virtualenv with instant performance.
