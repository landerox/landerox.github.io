---
hide:
  - toc
---

# :material-radar: Technology Radar & Resources

> *A curated collection of high-leverage resources, architecture patterns, and the specific tool stack I advocate for building scalable data systems.*

## :material-google-cloud: Google Cloud & Enterprise Architecture

The foundation. Official resources for mastering the GCP stack and cloud design patterns.

* **[Designing Data-Intensive Applications](https://dataintensive.net/){ target="_blank" }**: *The Big Data Bible.* Essential reading for understanding the internal architecture of data systems, scalability, and maintainability.
* **[Google Cloud Architecture Center](https://cloud.google.com/architecture){ target="_blank" }**: The definitive source for official GCP design patterns. Contains reference architectures for Data Mesh, RAG pipelines, and enterprise security setups.
* **[Google Cloud Engineering Blog](https://cloud.google.com/blog/products/engineering){ target="_blank" }**: Deep dives written by Google engineers. The best place to see how features are built under the hood.
* **[Google Cloud Skills Boost](https://www.cloudskillsboost.google/){ target="_blank" }**: The official learning platform for Google Cloud. Essential for hands-on labs and preparing for Professional Data Engineer & Architect certifications.
* **[Google SRE Books](https://sre.google/books/){ target="_blank" }**: *Essential Reading.* The methodology behind how Google runs production systems. Defines the modern standards for DevOps, SLIs, and SLOs.

## :material-database-cog: Data Engineering & High-Performance Stack

The "Modern Data Stack" I advocate for: separating storage from compute and prioritizing developer experience (DX).

* **[Apache Hudi](https://hudi.apache.org/){ target="_blank" }**: Another open table format option. I prefer Hudi for its upsert capabilities and integration with streaming data sources.
* **[Apache Iceberg](https://iceberg.apache.org/){ target="_blank" }**: High-performance open table format. Brings SQL reliability and time travel to the Data Lakehouse architecture.
* **[Apache Parquet](https://parquet.apache.org/){ target="_blank" }** & **[Apache Avro](https://avro.apache.org/){ target="_blank" }**: The de facto columnar and row-based storage formats for big data processing. Essential for efficient storage and retrieval.
* **[Dagster](https://github.com/dagster-io/dagster){ target="_blank" }**: My orchestration platform of choice. It treats data assets as software products, offering a superior lifecycle management compared to Airflow.
* **[dbt (Data Build Tool)](https://www.getdbt.com/){ target="_blank" }**: The standard for transformation. Enabling software engineering best practices (testing, versioning, documentation) within SQL pipelines.
* **[Great Expectations](https://greatexpectations.io/){ target="_blank" }**: The data quality framework I use to define, monitor, and validate data expectations across pipelines.
* **[MinIO](https://min.io/){ target="_blank" }**: High-performance, S3-compatible object storage. Ideal for on-premise or hybrid cloud setups.
* **[Polars](https://pola.rs/){ target="_blank" }** & **[DuckDB](https://duckdb.org/){ target="_blank" }**: The new standard for local high-performance computing. I use these to replace Pandas for processing large datasets efficiently on a single node.
* **[Presto/Trino](https://trino.io/){ target="_blank" }**: Distributed SQL query engine. I use Trino for interactive analytics across heterogeneous data sources.

## :material-speedometer: The Rust-Powered Python Ecosystem

Tools rewriting the Python ecosystem for order-of-magnitude performance gains. "Python syntax, Rust speed."

* **[Granian](https://github.com/emmett-framework/granian){ target="_blank" }**: A Hyper-modern RSGI/ASGI HTTP server for Python applications, written in Rust. Often significantly faster than Uvicorn or Gunicorn.
* **[Orjson](https://github.com/ijl/orjson){ target="_blank" }**: The fastest JSON library for Python. Essential for data engineering pipelines that serialize massive amounts of JSON data.
* **[Robyn](https://github.com/sparckles/robyn){ target="_blank" }**: *The emerging challenger.* An async Python web framework with a Rust runtime. It aims to outperform FastAPI by leveraging multi-threading at the core level.
* **[Ruff](https://github.com/astral-sh/ruff){ target="_blank" }**: An extremely fast Python linter and code formatter. It replaces Flake8, Black, and isort in a single tool.
* **[UV](https://github.com/astral-sh/uv){ target="_blank" }**: A blazing fast Python package installer and resolver. It replaces pip, poetry, and virtualenv with instant performance.

## :material-brain: AI Strategy, MLOps & RAG Systems

Moving beyond notebooks into production-grade AI systems and governance.

* **[Chip Huyen's ML Engineering](https://huyenchip.com/blog/){ target="_blank" }**: World-class resources on Real-time ML and designing machine learning systems for production.
* **[Hugging Face](https://huggingface.co/){ target="_blank" }**: The hub of modern AI. Critical for finding open-source models, datasets, and understanding the state-of-the-art outside of proprietary APIs.
* **[LlamaIndex](https://www.llamaindex.ai/){ target="_blank" }**: My preference for complex RAG (Retrieval-Augmented Generation) data ingestion strategies.
* **[LMSYS Chatbot Arena](https://lmarena.ai/leaderboard){ target="_blank" }**: The open platform for evaluating LLMs by human preference. The definitive leaderboard I check to assess model performance (Elo ratings) before selection.
* **[Martin Fowler’s MLOps Guide](https://martinfowler.com/articles/cd4ml.html){ target="_blank" }**: Foundational reading on "Continuous Delivery for Machine Learning" (CD4ML). A strict engineering approach to ML lifecycles.
* **[Ollama](https://ollama.com/){ target="_blank" }**: Essential for running and benchmarking open-source LLMs (Llama 3, Mistral) locally without cloud latency.
* **[OWASP Top 10 for LLM](https://genai.owasp.org/){ target="_blank" }**: The standard for securing Large Language Model applications. Critical for preventing Prompt Injection and data leakage in RAG systems.
* **[Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs){ target="_blank" }**: The enterprise backbone for training, deploying, and governing models on GCP. Focus on "Model Garden" and "Generative AI".

## :material-terraform: DevOps, IaC & Automation

Resources for defining infrastructure as code and automating release cycles.

* **[Chaos Engineering (Gremlin)](https://www.gremlin.com/){ target="_blank" }**: A platform for practicing chaos engineering. Helps teams build resilient systems by simulating failures in production.
* **[Flux CD](https://fluxcd.io/){ target="_blank" }**: A GitOps tool for Kubernetes. Enables declarative configuration and automated deployment from Git repositories.
* **[GitHub Actions Docs](https://docs.github.com/en/actions){ target="_blank" }**: Comprehensive guide for CI/CD. Focus on "Reusable workflows" to build scalable pipelines.
* **[HashiCorp Vault](https://www.vaultproject.io/){ target="_blank" }**: A tool for securely managing secrets and sensitive data. Essential for maintaining security in dynamic cloud environments.
* **[Infracost](https://www.infracost.io/){ target="_blank" }**: Cloud cost estimates for Terraform in Pull Requests. Enables FinOps practices by making engineering teams aware of infrastructure costs before deployment.
* **[K9s (Kubernetes CLI)](https://k9scli.io/){ target="_blank" }**: A terminal-based UI to interact with your Kubernetes clusters. Essential for debugging pods and logs efficiently.
* **[Prometheus](https://prometheus.io/){ target="_blank" }** & **[Grafana](https://grafana.com/){ target="_blank" }**: The industry-standard monitoring and alerting stack. Critical for observability in cloud-native environments.
* **[Terraform Registry](https://registry.terraform.io/){ target="_blank" }**: The primary source for official providers and modules. Senior engineers look here first to avoid reinventing the wheel.
* **[The DORA Research (DevOps)](https://dora.dev/){ target="_blank" }**: Research program by Google. Essential for understanding the metrics that drive high-performing teams (Deployment Frequency, Lead Time).
* **[The Twelve-Factor App](https://12factor.net/){ target="_blank" }**: The methodology for building software-as-a-service apps that are portable, scalable, and maintainable.

## :material-shield-check: Code Quality & Security

Tools and frameworks to ensure robust, maintainable, and secure codebases.

* **[ByteByteGo (System Design)](https://blog.bytebytego.com/){ target="_blank" }**: Breaks down complex system architectures (like how YouTube or Uber works) into understandable diagrams.
* **[CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/){ target="_blank" }**: Best practices for securing IT systems and data. Provides configuration guidelines for various platforms.
* **[Dependabot](https://dependabot.com/){ target="_blank" }**: Automated dependency updates. Keeps your projects secure and up-to-date with minimal effort.
* **[Exercism](https://exercism.org/){ target="_blank" }**: Practice fluency in Python, Go, or Rust through mentor-reviewed coding exercises.
* **[Have I Been Pwned](https://haveibeenpwned.com/){ target="_blank" }**: A resource to check if your email or password has been compromised in data breaches.
* **[OWASP Top Ten](https://owasp.org/www-project-top-ten/){ target="_blank" }**: The standard awareness document for web application security. A must-read for developers and security professionals.
* **[Pre-commit](https://pre-commit.com/){ target="_blank" }**: A framework for managing multi-language pre-commit hooks. Ensures code quality before changes reach the repository.
* **[Refactoring.guru](https://refactoring.guru/){ target="_blank" }**: The best visual guide for Design Patterns and Refactoring techniques.
* **[Security Headers](https://securityheaders.com/){ target="_blank" }**: A quick tool to analyze HTTP response headers for security best practices.
* **[Snyk](https://snyk.io/){ target="_blank" }**: Security scanning for code, dependencies, containers, and IaC. Essential for maintaining a secure software supply chain.
* **[SonarQube](https://www.sonarqube.org/){ target="_blank" }**: A leading platform for continuous inspection of code quality. Identifies bugs, vulnerabilities, and code smells.

## :material-console-line: Developer Productivity & Environment

Tools optimized for deep work and minimal friction.

* **[Cursor](https://www.cursor.com/){ target="_blank" }**: The AI-first code editor. A fork of VS Code that integrates LLMs deeply into the editing workflow.
* **[Starship](https://starship.rs/){ target="_blank" }**: The minimal, blazing-fast cross-shell prompt. Provides instant context (git branch, python version, cloud project) in the terminal.
* **[Zen Browser](https://zen-browser.app/){ target="_blank" }**: A modern, privacy-focused browser built on Firefox. Designed for vertical tabs and distraction-free browsing.
