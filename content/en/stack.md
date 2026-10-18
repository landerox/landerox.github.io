---
description: "Technology choices by architectural role: where I used each one for clients and where I am still studying it, with evaluation scope and adoption conditions."
hide:
  - toc
icon: material/layers-triple
---

# :material-layers-triple: Tech Stack

> Tools grouped by architectural role. Each row says where I used them for
> clients and where I am still studying them.

## Production AI, agents and applied MLOps

Agent workflows need explicit permissions, observability and evaluation.
Project status lives in [Research Labs](projects/labs.md), and current adoption
conditions in the [Tech Radar](projects/explorations.md).

<!-- markdownlint-disable MD013 -->

| Role | Tools | Where it shows up |
| :--- | :--- | :--- |
| Agentic frameworks & runtimes | LangGraph, Pydantic AI, Google ADK (2.0 workflow model), OpenAI Agents SDK, Claude Agent SDK, LlamaIndex, FastAPI | **Client work:** multi-agent loan evaluation with LangGraph on GCP ([2026](about.md#2026present-landerox-independent)). **Research:** stateful supervision in [Durable Agent Workflows](projects/labs.md#agent-fabric-agent-fabric) |
| Agent protocols & model access | Model Context Protocol (MCP, 2026-07-28 specification), A2A v1.0, Vertex AI Agent Engine, Amazon Bedrock AgentCore, Gemini, Anthropic Claude, Hugging Face, LiteLLM | **Client work:** Gemini agents on Cloud Run ([2024–2025](about.md#20242025-axity)) and ML deployments from Vertex AI Workbench ([2025](about.md#2025-tcs)). **Research:** remote tools, cross-runtime delegation and cost-aware routing in [Durable Agent Workflows](projects/labs.md#agent-fabric-agent-fabric) and [Inference Serving](projects/labs.md#inference-fabric-inference-fabric) |
| Inference serving & routing | SGLang, vLLM, TensorRT-LLM, NVIDIA Dynamo (disaggregated prefill/decode over NIXL), LMCache, llama.cpp, Ollama | **Client work:** local LLMs behind a pipeline-diagnosis agent ([2026](about.md#2026present-landerox-independent)). **Research:** local-first serving, EAGLE-3 speculative decoding and tiered KV cache in [Inference Serving](projects/labs.md#inference-fabric-inference-fabric) |
| Open-weight models & guardrails | gpt-oss, Qwen, Gemma, DeepSeek, Llama, Hermes; Llama Guard, gpt-oss-safeguard, Qwen3Guard | **Client work:** Hermes-3 in that diagnosis agent ([2026](about.md#2026present-landerox-independent)). **Research:** utility-tier routing in [Inference Serving](projects/labs.md#inference-fabric-inference-fabric); policy-following safety classification in [Durable Agent Workflows](projects/labs.md#agent-fabric-agent-fabric) |
| Vector, graph & memory storage | Qdrant, pgvector, LanceDB (Lance), Milvus, LadybugDB, Graphiti, Mem0 | **Research:** semantic caching, hybrid Graph RAG retrieval and agent memory in [Inference Serving](projects/labs.md#inference-fabric-inference-fabric), [Open Table Interoperability](projects/labs.md#data-fabric-data-fabric) and [Retrieval & Memory](projects/labs.md#knowledge-fabric-knowledge-fabric) |
| Evaluation & benchmarking | DeepEval, Promptfoo, Braintrust, Arize Phoenix, LangSmith, RAGAS; τ²-bench, Terminal-Bench, and SWE-bench Verified as external baselines | **Research:** regression testing and multi-judge pipelines in [AI Evaluation Harness](projects/labs.md#eval-fabric-eval-fabric). **Public:** [Eval Statistics](projects/tools.md#interactive-eval-stats) sizes the comparisons |
| LLM observability & FinOps | OpenTelemetry (GenAI semantic conventions), Langfuse, Helicone, Arize Phoenix | **Client work:** token cost telemetry for the loan-evaluation agents ([2026](about.md#2026present-landerox-independent)). **Research:** token, latency and cost telemetry in [Inference Serving](projects/labs.md#inference-fabric-inference-fabric) |

## Data engineering and lakehouses

Local-first for development: prototype on embedded engines, then verify
SQL semantics, catalog support and data contracts on each target cloud
engine. The compatibility criteria are in the [Tech Radar](projects/explorations.md).

| Role | Tools | Where it shows up |
| :--- | :--- | :--- |
| Processing engines | Polars, DuckDB, Apache Arrow, Apache DataFusion, Apache Spark (PySpark), Databricks, Pandas | **Client work:** PySpark on Cloudera and Scala on Dataproc ([2019–2021](about.md#20192021-ntt-data)); ML deployments across Spark and Databricks ([2025](about.md#2025-tcs)). **Research:** vectorized execution in [Open Table Interoperability](projects/labs.md#data-fabric-data-fabric); local-first verdict in [Tech Radar](projects/explorations.md) |
| Low-latency analytics | ClickHouse 26.8 LTS | **Research:** event-query candidate in [Streaming Freshness](projects/labs.md#streaming-fabric-streaming-fabric); validate ingestion, duplicates and cost before adoption |
| Streaming & CDC | Apache Kafka 4.3 (KRaft) / Redpanda, Apache Flink 2, Apache Fluss, Debezium 3, Google Pub/Sub, Dataflow | **Client work:** Pub/Sub and Dataflow streaming ingestion ([2022–2023](about.md#20222023-sodimac), [2024–2025](about.md#20242025-axity)). **Research:** streaming ingestion in [Open Table Interoperability](projects/labs.md#data-fabric-data-fabric) |
| Orchestration | Dagster, Apache Airflow 3.3; Cloud Composer / MWAA (version-specific support), Prefect 3 | **Client work:** Airflow and Cloud Composer pipelines ([2019–2021](about.md#20192021-ntt-data), [2022–2023](about.md#20222023-sodimac)). **Research:** the [orchestrator comparison](blog/workflow-orchestrators.md) |
| Storage, table formats & catalogs | Apache Iceberg v3, DuckLake, Delta Lake, Lance, Apache Parquet, Apache Polaris, Unity Catalog, Lakekeeper, Cloud Storage, Amazon S3 | **Client work:** BigQuery Silver/Gold layers and automated Parquet backups ([2023–2024](about.md#20232024-acid-labs)); S3-to-BigQuery ELT ([2022–2023](about.md#20222023-sodimac)). **Research:** open-table-format integration in [Open Table Interoperability](projects/labs.md#data-fabric-data-fabric) |
| Transformation & modeling | dbt Core 1.12, dbt v2.0 (under evaluation), SQLMesh, SQL, Kimball dimensional modeling, Data Vault 2.0, data contracts (ODCS) | **Client work:** 1,100+ dbt models ([2023–2024](about.md#20232024-acid-labs)); Data Vault 2.0 domain models ([2019–2021](about.md#20192021-ntt-data)). **Research:** reproducible dbt diagnosis and patch trials in [Log-Driven Code Repair](projects/labs.md#engineering-fabric-engineering-fabric) |

## Cloud and platform infrastructure

Infrastructure described as code, with policy checks before changes.
Cross-cloud portability requires provider-specific designs and validation.

| Role | Tools | Where it shows up |
| :--- | :--- | :--- |
| Public & private cloud | Google Cloud Platform (GCP), Amazon Web Services (AWS); OpenShift / OpenStack as private references | **Client work:** GCP in every role since 2019 and an AWS lakehouse ([About](about.md)). **References:** [Production Blueprints](projects/blueprints.md) |
| Infrastructure as Code | Terraform / OpenTofu (modular landing zones), Terragrunt, Crossplane, OPA Rego, Conftest, Kyverno | **Client work:** multi-project GCP landing zones in Terraform ([2024–2025](about.md#20242025-axity)). **Research:** policy-as-code spike in [Tech Radar](projects/explorations.md); foundations in [Production Blueprints](projects/blueprints.md) |
| Containers & orchestration | Docker, Kubernetes (GKE / EKS; DRA, Gateway API Inference Extension), Google Cloud Run (GPU), Amazon ECS / Fargate | **Client work:** a Kubernetes data platform on GKE ([2023–2024](about.md#20232024-acid-labs)); agents on Cloud Run ([2024–2025](about.md#20242025-axity)). **Research:** containerized runtimes across [Research Labs](projects/labs.md) |
| GitOps & secrets management | ArgoCD, HashiCorp Vault / OpenBao | **Research:** GitOps reconciliation and zero-trust credentials in [Reproducible Platforms](projects/labs.md#platform-fabric-platform-fabric) |
| Platform observability | Prometheus, Grafana, Mimir, Loki, Tempo, Pyroscope, Grafana Alloy | **Research:** centralized SRE telemetry in [Cost per Successful Task](projects/labs.md#fabric-ops-fabric-ops) |
| CI/CD & local toolchain | GitHub Actions, just, uv, pre-commit | **Client work:** zero-trust CI/CD pipelines ([2025](about.md#2025-tcs)). **Public:** the [toolchain this site runs on](https://github.com/landerox/landerox.github.io){ target="_blank" } |

## Languages, databases and standards

| Role | Tools | Where it shows up |
| :--- | :--- | :--- |
| Programming languages | Python (free-threading only where profiled), SQL, Rust, Scala, Bash | **Client work:** Python and SQL in every role; Scala on Dataproc and Hadoop ([2019–2021](about.md#20192021-ntt-data)). **Research:** Rust/Python router experiments in [Inference Serving](projects/labs.md#inference-fabric-inference-fabric) |
| Databases | PostgreSQL, AlloyDB, DuckDB, ClickHouse, MySQL, Redis, BigQuery, Snowflake, Redshift | **Client work:** BigQuery in every GCP role; Redis session state ([2024–2025](about.md#20242025-axity)). **Research:** target compatibility in [Tech Radar](projects/explorations.md) |
| Engineering standards | Data contracts (ODCS), schema evolution, idempotency, OpenTelemetry semantic conventions, pre-commit quality gates, Conventional Commits, SemVer | Applied across every project, including [this repository](https://github.com/landerox/landerox.github.io){ target="_blank" } |
| Tool UX/UI | Zensical, semantic HTML, token-based CSS, native JavaScript, Playwright, axe-core | This site as a progressive-disclosure and accessibility case; [UX/UI principles](projects/open-source.md#ux-ui) |

<!-- markdownlint-enable MD013 -->
