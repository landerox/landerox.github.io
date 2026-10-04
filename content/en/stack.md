---
description: "Technology choices across production work and applied research, with links to evaluation scope and adoption conditions."
hide:
  - toc
icon: material/layers-triple
---

# :material-layers-triple: Tech Stack

> Tools I use in production and in applied research, grouped by
> architectural role.

## Production AI, Agents & Applied MLOps

Agent workflows need explicit permissions, observability and evaluation.
Project status lives in [Research Labs](projects/labs.md), and current adoption
conditions in the [Tech Radar](projects/explorations.md).

<!-- markdownlint-disable MD013 -->

| Role | Tools | Use / evaluation scope |
| :--- | :--- | :--- |
| Agentic frameworks & runtimes | LangGraph, Pydantic AI, Google ADK (2.0 workflow model), OpenAI Agents SDK, Claude Agent SDK, LlamaIndex, FastAPI | Stateful multi-agent supervision in [Durable Agent Workflows](projects/labs.md#agent-fabric-agent-fabric) |
| Agent protocols & model access | Model Context Protocol (MCP, 2026-07-28 specification), A2A v1.0, Vertex AI Agent Engine, Amazon Bedrock AgentCore, Gemini, Anthropic Claude, Hugging Face, LiteLLM | Remote tools, cross-runtime delegation, and cost-aware inference routing in [Durable Agent Workflows](projects/labs.md#agent-fabric-agent-fabric) and [Inference Serving](projects/labs.md#inference-fabric-inference-fabric) |
| Inference serving & routing | SGLang, vLLM, TensorRT-LLM, NVIDIA Dynamo (disaggregated prefill/decode over NIXL), LMCache, llama.cpp, Ollama | Local-first serving, EAGLE-3 speculative decoding, and tiered KV cache in [Inference Serving](projects/labs.md#inference-fabric-inference-fabric) |
| Open-weight models & guardrails | gpt-oss, Qwen, Gemma, DeepSeek, Llama, Hermes; Llama Guard, gpt-oss-safeguard, Qwen3Guard | Utility-tier routing in [Inference Serving](projects/labs.md#inference-fabric-inference-fabric); policy-following safety classification in [Durable Agent Workflows](projects/labs.md#agent-fabric-agent-fabric) |
| Vector, graph & memory storage | Qdrant, pgvector, LanceDB (Lance), Milvus, LadybugDB, Graphiti, Mem0 | Semantic caching, hybrid Graph RAG retrieval, and agent memory in [Inference Serving](projects/labs.md#inference-fabric-inference-fabric), [Open Table Interoperability](projects/labs.md#data-fabric-data-fabric) and [Retrieval & Memory](projects/labs.md#knowledge-fabric-knowledge-fabric) |
| Evaluation & benchmarking | DeepEval, Promptfoo, Braintrust, Arize Phoenix, LangSmith, RAGAS; τ²-bench, Terminal-Bench, and SWE-bench Verified as external baselines | Regression testing and multi-judge pipelines in [AI Evaluation Harness](projects/labs.md#eval-fabric-eval-fabric) |
| LLM observability & FinOps | OpenTelemetry (GenAI semantic conventions), Langfuse, Helicone, Arize Phoenix | Token, latency, and cost telemetry in [Inference Serving](projects/labs.md#inference-fabric-inference-fabric) |

## Data Engineering & Lakehouses

Local-first for development: prototype on embedded engines, then verify
SQL semantics, catalog support and data contracts on each target cloud
engine. The compatibility criteria are in the [Tech Radar](projects/explorations.md).

| Role | Tools | Use / evaluation scope |
| :--- | :--- | :--- |
| Processing engines | Polars, DuckDB, Apache Arrow, Apache DataFusion, Apache Spark (PySpark), Databricks, Pandas | Vectorized execution in [Open Table Interoperability](projects/labs.md#data-fabric-data-fabric); local-first verdict in [Tech Radar](projects/explorations.md) |
| Low-latency analytics | ClickHouse 26.8 LTS | Event-query candidate in [Streaming Freshness](projects/labs.md#streaming-fabric-streaming-fabric); validate ingestion, duplicates and cost before adoption |
| Streaming & CDC | Apache Kafka 4.3 (KRaft) / Redpanda, Apache Flink 2, Apache Fluss, Debezium 3, Google Pub/Sub, Dataflow | Streaming ingestion in [Open Table Interoperability](projects/labs.md#data-fabric-data-fabric) and the client engagements in [About](about.md) |
| Orchestration | Dagster, Apache Airflow 3.3; Cloud Composer / MWAA (version-specific support), Prefect 3 | Asset-aware batch/streaming pipelines described in [Collaboration](collaboration.md) |
| Storage, table formats & catalogs | Apache Iceberg v3, DuckLake, Delta Lake, Lance, Apache Parquet, Apache Polaris, Unity Catalog, Lakekeeper, Cloud Storage, Amazon S3 | Open-table-format integration in [Open Table Interoperability](projects/labs.md#data-fabric-data-fabric) |
| Transformation & modeling | dbt Core 1.12, dbt v2.0 (under evaluation), SQLMesh, SQL, Kimball dimensional modeling, Data Vault 2.0, data contracts (ODCS) | Reproducible dbt diagnosis and patch trials in [Log-Driven Code Repair](projects/labs.md#engineering-fabric-engineering-fabric) |

## Cloud & Platform Infrastructure

Infrastructure described as code, with policy checks before changes.
Cross-cloud portability requires provider-specific designs and validation.

| Role | Tools | Use / evaluation scope |
| :--- | :--- | :--- |
| Public & private cloud | Google Cloud Platform (GCP), Amazon Web Services (AWS); OpenShift / OpenStack as private references | Reference architectures in [Production Blueprints](projects/blueprints.md) |
| Infrastructure as Code | Terraform / OpenTofu (modular landing zones), Terragrunt, Crossplane, OPA Rego, Conftest, Kyverno | Multi-cloud foundations in [Production Blueprints](projects/blueprints.md); policy-as-code spike in [Tech Radar](projects/explorations.md) |
| Containers & orchestration | Docker, Kubernetes (GKE / EKS; DRA, Gateway API Inference Extension), Google Cloud Run (GPU), Amazon ECS / Fargate | Containerized runtimes across [Research Labs](projects/labs.md) |
| GitOps & secrets management | ArgoCD, HashiCorp Vault / OpenBao | GitOps reconciliation and zero-trust credentials in [Reproducible Platforms](projects/labs.md#platform-fabric-platform-fabric) |
| Platform observability | Prometheus, Grafana, Mimir, Loki, Tempo, Pyroscope, Grafana Alloy | Centralized SRE telemetry in [Cost per Successful Task](projects/labs.md#fabric-ops-fabric-ops) |
| CI/CD & local toolchain | GitHub Actions, just, uv, pre-commit | The [toolchain this site runs on](https://github.com/landerox/landerox.github.io){ target="_blank" } |

## Languages, Databases & Standards

| Role | Tools | Use / evaluation scope |
| :--- | :--- | :--- |
| Programming languages | Python (free-threading only where profiled), SQL, Rust, Scala, Bash | Rust/Python router experiments in [Inference Serving](projects/labs.md#inference-fabric-inference-fabric); language choice follows the workload |
| Databases | PostgreSQL, AlloyDB, DuckDB, ClickHouse, MySQL, Redis, BigQuery, Snowflake, Redshift | Target compatibility evaluated in [Tech Radar](projects/explorations.md) |
| Engineering standards | Data contracts (ODCS), schema evolution, idempotency, OpenTelemetry semantic conventions, pre-commit quality gates, Conventional Commits, SemVer | Applied across every project, including [this repository](https://github.com/landerox/landerox.github.io){ target="_blank" } |
| Tool UX/UI | Zensical, semantic HTML, token-based CSS, native JavaScript, Playwright, axe-core | This site as a progressive-disclosure and accessibility case; [UX/UI principles](projects/blueprints.md#ux-ui) |

<!-- markdownlint-enable MD013 -->
