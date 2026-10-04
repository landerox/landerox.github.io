---
description: "Selecciones tecnológicas en producción e investigación aplicada, con alcance de evaluación y condiciones de adopción."
hide:
  - toc
icon: material/layers-triple
---

# :material-layers-triple: Stack Tecnológico

> Herramientas que uso en producción y en investigación aplicada, agrupadas
> por rol arquitectónico.

## IA en Producción, Agentes y MLOps Aplicado

Los flujos de agentes necesitan permisos explícitos, observabilidad y evaluación.
El estado está en los [Laboratorios de investigación](projects/labs.md) y las
condiciones de adopción en el [Radar tecnológico](projects/explorations.md).

<!-- markdownlint-disable MD013 -->

| Rol | Herramientas | Alcance de uso / evaluación |
| :--- | :--- | :--- |
| Frameworks agénticos y runtimes | LangGraph, Pydantic AI, Google ADK (modelo de flujos 2.0), OpenAI Agents SDK, Claude Agent SDK, LlamaIndex, FastAPI | Supervisión multi-agente con estado en [Flujos agénticos durables](projects/labs.md#agent-fabric-agent-fabric) |
| Protocolos de agentes y acceso a modelos | Model Context Protocol (MCP, especificación 2026-07-28), A2A v1.0, Vertex AI Agent Engine, Amazon Bedrock AgentCore, Gemini, Anthropic Claude, Hugging Face, LiteLLM | Herramientas remotas, delegación entre runtimes y enrutamiento de inferencia consciente de costos en [Flujos agénticos durables](projects/labs.md#agent-fabric-agent-fabric) y [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric) |
| Serving y enrutamiento de inferencia | SGLang, vLLM, TensorRT-LLM, NVIDIA Dynamo (prefill/decode desagregado sobre NIXL), LMCache, llama.cpp, Ollama | Serving *local-first*, decodificación especulativa EAGLE-3 y caché KV por niveles en [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric) |
| Modelos *open-weight* y salvaguardas | gpt-oss, Qwen, Gemma, DeepSeek, Llama, Hermes; Llama Guard, gpt-oss-safeguard, Qwen3Guard | Enrutamiento de tareas utilitarias en [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric); clasificación de seguridad guiada por políticas en [Flujos agénticos durables](projects/labs.md#agent-fabric-agent-fabric) |
| Almacenamiento vectorial, de grafos y memoria | Qdrant, pgvector, LanceDB (Lance), Milvus, LadybugDB, Graphiti, Mem0 | Caché semántica, recuperación híbrida Graph RAG y memoria de agentes en [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric), [Interoperabilidad de tablas abiertas](projects/labs.md#data-fabric-data-fabric) y [Recuperación y memoria](projects/labs.md#knowledge-fabric-knowledge-fabric) |
| Evaluación y benchmarking | DeepEval, Promptfoo, Braintrust, Arize Phoenix, LangSmith, RAGAS; τ²-bench, Terminal-Bench y SWE-bench Verified como referencias externas | Pruebas de regresión y pipelines multi-juez en [Arnés de evaluación de IA](projects/labs.md#eval-fabric-eval-fabric) |
| Observabilidad LLM y FinOps | OpenTelemetry (convenciones semánticas GenAI), Langfuse, Helicone, Arize Phoenix | Telemetría de tokens, latencia y costos en [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric) |

## Ingeniería de Datos y Lakehouses

*Local-first* para desarrollo: prototipar sobre motores embebidos y comprobar
semántica SQL, soporte de catálogo y contratos de datos en cada motor cloud.
Los criterios están en el [Radar tecnológico](projects/explorations.md).

| Rol | Herramientas | Alcance de uso / evaluación |
| :--- | :--- | :--- |
| Motores de procesamiento | Polars, DuckDB, Apache Arrow, Apache DataFusion, Apache Spark (PySpark), Databricks, Pandas | Ejecución vectorizada en [Interoperabilidad de tablas abiertas](projects/labs.md#data-fabric-data-fabric); veredicto *local-first* en [Radar tecnológico](projects/explorations.md) |
| Analítica de baja latencia | ClickHouse 26.8 LTS | Candidato para consultas de eventos en [Frescura del streaming](projects/labs.md#streaming-fabric-streaming-fabric); validar ingesta, duplicados y coste antes de adoptarlo |
| Streaming y CDC | Apache Kafka 4.3 (KRaft) / Redpanda, Apache Flink 2, Apache Fluss, Debezium 3, Google Pub/Sub, Dataflow | Ingesta en streaming en [Interoperabilidad de tablas abiertas](projects/labs.md#data-fabric-data-fabric) y los proyectos con clientes en [Sobre mí](about.md) |
| Orquestación | Dagster, Apache Airflow 3.3; Cloud Composer / MWAA (soporte por versión), Prefect 3 | Pipelines batch/streaming basados en assets descritos en [Colaboración](collaboration.md) |
| Almacenamiento, formatos de tabla y catálogos | Apache Iceberg v3, DuckLake, Delta Lake, Lance, Apache Parquet, Apache Polaris, Unity Catalog, Lakekeeper, Cloud Storage, Amazon S3 | Integración de formatos de tabla abiertos en [Interoperabilidad de tablas abiertas](projects/labs.md#data-fabric-data-fabric) |
| Transformación y modelado | dbt Core 1.12, dbt v2.0 (en evaluación), SQLMesh, SQL, modelado dimensional Kimball, Data Vault 2.0, contratos de datos (ODCS) | Pruebas reproducibles de diagnóstico y parches dbt en [Reparación de código guiada por logs](projects/labs.md#engineering-fabric-engineering-fabric) |

## Infraestructura Cloud y de Plataformas

Infraestructura descrita como código, con controles de políticas antes de
cambiarla. La portabilidad exige diseño y validación específicos por proveedor.

| Rol | Herramientas | Alcance de uso / evaluación |
| :--- | :--- | :--- |
| Nube pública y privada | Google Cloud Platform (GCP), Amazon Web Services (AWS); OpenShift / OpenStack como referencias privadas | Arquitecturas de referencia en [Blueprints de Producción](projects/blueprints.md) |
| Infraestructura como Código | Terraform / OpenTofu (zonas de aterrizaje modulares), Terragrunt, Crossplane, OPA Rego, Conftest, Kyverno | Fundaciones multi-cloud en [Blueprints de Producción](projects/blueprints.md); spike de política como código en [Radar tecnológico](projects/explorations.md) |
| Contenedores y orquestación | Docker, Kubernetes (GKE / EKS; DRA, Gateway API Inference Extension), Google Cloud Run (GPU), Amazon ECS / Fargate | Runtimes contenerizados en el [Laboratorios de investigación](projects/labs.md) |
| GitOps y gestión de secretos | ArgoCD, HashiCorp Vault / OpenBao | Reconciliación GitOps y credenciales de confianza cero en [Plataformas reproducibles](projects/labs.md#platform-fabric-platform-fabric) |
| Observabilidad de plataforma | Prometheus, Grafana, Mimir, Loki, Tempo, Pyroscope, Grafana Alloy | Telemetría SRE centralizada en [Costo por tarea exitosa](projects/labs.md#fabric-ops-fabric-ops) |
| CI/CD y toolchain local | GitHub Actions, just, uv, pre-commit | El [toolchain con el que corre este sitio](https://github.com/landerox/landerox.github.io){ target="_blank" } |

## Lenguajes, Bases de Datos y Estándares

| Rol | Herramientas | Alcance de uso / evaluación |
| :--- | :--- | :--- |
| Lenguajes de programación | Python (*free-threading* cuando las mediciones lo justifican), SQL, Rust, Scala, Bash | Experimentos de router Rust/Python en [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric); el lenguaje depende de la carga |
| Bases de datos | PostgreSQL, AlloyDB, DuckDB, ClickHouse, MySQL, Redis, BigQuery, Snowflake, Redshift | Compatibilidad de destinos evaluada en [Radar tecnológico](projects/explorations.md) |
| Estándares de ingeniería | Contratos de datos (ODCS), evolución de esquemas, idempotencia, convenciones semánticas de OpenTelemetry, pre-commit quality gates, Conventional Commits, SemVer | Aplicados en cada proyecto, incluido [este repositorio](https://github.com/landerox/landerox.github.io){ target="_blank" } |
| UX/UI de herramientas | Zensical, HTML semántico, CSS con tokens, JavaScript nativo, Playwright, axe-core | Este sitio como caso de diseño progresivo y accesibilidad; [premisas UX/UI](projects/blueprints.md#ux-ui) |

<!-- markdownlint-enable MD013 -->
