---
description: "Selecciones tecnológicas por rol arquitectónico: dónde usé cada una con clientes y dónde sigo estudiándola, con alcance de evaluación y condiciones de adopción."
hide:
  - toc
icon: material/layers-triple
---

# :material-layers-triple: Stack tecnológico

> Herramientas agrupadas por rol arquitectónico. Cada fila indica dónde las
> usé con clientes y dónde sigo estudiándolas.

## IA en producción, agentes y MLOps aplicado

Los flujos de agentes necesitan permisos explícitos, observabilidad y evaluación.
El estado está en los [Laboratorios de investigación](projects/labs.md) y las
condiciones de adopción en el [Radar tecnológico](projects/explorations.md).

<!-- markdownlint-disable MD013 -->

| Rol | Herramientas | Dónde aparece |
| :--- | :--- | :--- |
| Frameworks agénticos y runtimes | LangGraph, Pydantic AI, Google ADK (modelo de flujos 2.0), OpenAI Agents SDK, Claude Agent SDK, LlamaIndex, FastAPI | **Con clientes:** evaluación de créditos multiagente con LangGraph en GCP ([2026](about.md#2026presente-landerox-independiente)). **Investigación:** supervisión con estado en [Flujos agénticos durables](projects/labs.md#agent-fabric-agent-fabric) |
| Protocolos de agentes y acceso a modelos | Model Context Protocol (MCP, especificación 2026-07-28), A2A v1.0, Vertex AI Agent Engine, Amazon Bedrock AgentCore, Gemini, Anthropic Claude, Hugging Face, LiteLLM | **Con clientes:** agentes Gemini en Cloud Run ([2024–2025](about.md#20242025-axity)) y despliegues de ML desde Vertex AI Workbench ([2025](about.md#2025-tcs)). **Investigación:** herramientas remotas, delegación entre runtimes y enrutamiento consciente de costos en [Flujos agénticos durables](projects/labs.md#agent-fabric-agent-fabric) y [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric) |
| Serving y enrutamiento de inferencia | SGLang, vLLM, TensorRT-LLM, NVIDIA Dynamo (prefill/decode desagregado sobre NIXL), LMCache, llama.cpp, Ollama | **Con clientes:** LLMs locales detrás de un agente que diagnostica pipelines ([2026](about.md#2026presente-landerox-independiente)). **Investigación:** serving *local-first*, decodificación especulativa EAGLE-3 y caché KV por niveles en [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric) |
| Modelos *open-weight* y salvaguardas | gpt-oss, Qwen, Gemma, DeepSeek, Llama, Hermes; Llama Guard, gpt-oss-safeguard, Qwen3Guard | **Con clientes:** Hermes-3 en ese agente de diagnóstico ([2026](about.md#2026presente-landerox-independiente)). **Investigación:** enrutamiento de tareas utilitarias en [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric); clasificación de seguridad guiada por políticas en [Flujos agénticos durables](projects/labs.md#agent-fabric-agent-fabric) |
| Almacenamiento vectorial, de grafos y memoria | Qdrant, pgvector, LanceDB (Lance), Milvus, LadybugDB, Graphiti, Mem0 | **Investigación:** caché semántica, recuperación híbrida Graph RAG y memoria de agentes en [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric), [Interoperabilidad de tablas abiertas](projects/labs.md#data-fabric-data-fabric) y [Recuperación y memoria](projects/labs.md#knowledge-fabric-knowledge-fabric) |
| Evaluación y benchmarking | DeepEval, Promptfoo, Braintrust, Arize Phoenix, LangSmith, RAGAS; τ²-bench, Terminal-Bench y SWE-bench Verified como referencias externas | **Investigación:** pruebas de regresión y pipelines multi-juez en [Arnés de evaluación de IA](projects/labs.md#eval-fabric-eval-fabric). **Público:** [Estadística de evaluación](projects/tools.md#interactive-eval-stats) dimensiona las comparaciones |
| Observabilidad LLM y FinOps | OpenTelemetry (convenciones semánticas GenAI), Langfuse, Helicone, Arize Phoenix | **Con clientes:** telemetría del costo de tokens de los agentes de evaluación de créditos ([2026](about.md#2026presente-landerox-independiente)). **Investigación:** telemetría de tokens, latencia y costos en [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric) |

## Ingeniería de datos y lakehouses

*Local-first* para desarrollo: prototipar sobre motores embebidos y comprobar
semántica SQL, soporte de catálogo y contratos de datos en cada motor cloud.
Los criterios están en el [Radar tecnológico](projects/explorations.md).

| Rol | Herramientas | Dónde aparece |
| :--- | :--- | :--- |
| Motores de procesamiento | Polars, DuckDB, Apache Arrow, Apache DataFusion, Apache Spark (PySpark), Databricks, Pandas | **Con clientes:** PySpark sobre Cloudera y Scala en Dataproc ([2019–2021](about.md#20192021-ntt-data)); despliegues de ML sobre Spark y Databricks ([2025](about.md#2025-tcs)). **Investigación:** ejecución vectorizada en [Interoperabilidad de tablas abiertas](projects/labs.md#data-fabric-data-fabric); veredicto *local-first* en [Radar tecnológico](projects/explorations.md) |
| Analítica de baja latencia | ClickHouse 26.8 LTS | **Investigación:** candidato para consultas de eventos en [Frescura del streaming](projects/labs.md#streaming-fabric-streaming-fabric); validar ingesta, duplicados y costo antes de adoptarlo |
| Streaming y CDC | Apache Kafka 4.3 (KRaft) / Redpanda, Apache Flink 2, Apache Fluss, Debezium 3, Google Pub/Sub, Dataflow | **Con clientes:** ingesta en streaming con Pub/Sub y Dataflow ([2022–2023](about.md#20222023-sodimac), [2024–2025](about.md#20242025-axity)). **Investigación:** ingesta en streaming en [Interoperabilidad de tablas abiertas](projects/labs.md#data-fabric-data-fabric) |
| Orquestación | Dagster, Apache Airflow 3.3; Cloud Composer / MWAA (soporte por versión), Prefect 3 | **Con clientes:** pipelines en Airflow y Cloud Composer ([2019–2021](about.md#20192021-ntt-data), [2022–2023](about.md#20222023-sodimac)). **Investigación:** la [comparativa de orquestadores](blog/workflow-orchestrators.md) |
| Almacenamiento, formatos de tabla y catálogos | Apache Iceberg v3, DuckLake, Delta Lake, Lance, Apache Parquet, Apache Polaris, Unity Catalog, Lakekeeper, Cloud Storage, Amazon S3 | **Con clientes:** capas Silver/Gold en BigQuery y respaldos automáticos en Parquet ([2023–2024](about.md#20232024-acid-labs)); ELT de S3 a BigQuery ([2022–2023](about.md#20222023-sodimac)). **Investigación:** integración de formatos de tabla abiertos en [Interoperabilidad de tablas abiertas](projects/labs.md#data-fabric-data-fabric) |
| Transformación y modelado | dbt Core 1.12, dbt v2.0 (en evaluación), SQLMesh, SQL, modelado dimensional Kimball, Data Vault 2.0, contratos de datos (ODCS) | **Con clientes:** más de 1.100 modelos dbt ([2023–2024](about.md#20232024-acid-labs)); modelos de dominio en Data Vault 2.0 ([2019–2021](about.md#20192021-ntt-data)). **Investigación:** pruebas reproducibles de diagnóstico y parches dbt en [Reparación de código guiada por logs](projects/labs.md#engineering-fabric-engineering-fabric) |

## Infraestructura cloud y de plataformas

Infraestructura descrita como código, con controles de políticas antes de
cambiarla. La portabilidad exige diseño y validación específicos por proveedor.

| Rol | Herramientas | Dónde aparece |
| :--- | :--- | :--- |
| Nube pública y privada | Google Cloud Platform (GCP), Amazon Web Services (AWS); OpenShift / OpenStack como referencias privadas | **Con clientes:** GCP en cada rol desde 2019 y un lakehouse en AWS ([Sobre mí](about.md)). **Referencias:** [Blueprints de Producción](projects/blueprints.md) |
| Infraestructura como Código | Terraform / OpenTofu (zonas de aterrizaje modulares), Terragrunt, Crossplane, OPA Rego, Conftest, Kyverno | **Con clientes:** zonas de aterrizaje de varios proyectos en GCP con Terraform ([2024–2025](about.md#20242025-axity)). **Investigación:** spike de política como código en [Radar tecnológico](projects/explorations.md); fundaciones en [Blueprints de Producción](projects/blueprints.md) |
| Contenedores y orquestación | Docker, Kubernetes (GKE / EKS; DRA, Gateway API Inference Extension), Google Cloud Run (GPU), Amazon ECS / Fargate | **Con clientes:** una plataforma de datos sobre Kubernetes en GKE ([2023–2024](about.md#20232024-acid-labs)); agentes en Cloud Run ([2024–2025](about.md#20242025-axity)). **Investigación:** runtimes contenerizados en los [Laboratorios de investigación](projects/labs.md) |
| GitOps y gestión de secretos | ArgoCD, HashiCorp Vault / OpenBao | **Investigación:** reconciliación GitOps y credenciales de confianza cero en [Plataformas reproducibles](projects/labs.md#platform-fabric-platform-fabric) |
| Observabilidad de plataforma | Prometheus, Grafana, Mimir, Loki, Tempo, Pyroscope, Grafana Alloy | **Investigación:** telemetría SRE centralizada en [Costo por tarea exitosa](projects/labs.md#fabric-ops-fabric-ops) |
| CI/CD y toolchain local | GitHub Actions, just, uv, pre-commit | **Con clientes:** pipelines de CI/CD de confianza cero ([2025](about.md#2025-tcs)). **Público:** el [toolchain con el que corre este sitio](https://github.com/landerox/landerox.github.io){ target="_blank" } |

## Lenguajes, bases de datos y estándares

| Rol | Herramientas | Dónde aparece |
| :--- | :--- | :--- |
| Lenguajes de programación | Python (*free-threading* cuando las mediciones lo justifican), SQL, Rust, Scala, Bash | **Con clientes:** Python y SQL en cada rol; Scala en Dataproc y Hadoop ([2019–2021](about.md#20192021-ntt-data)). **Investigación:** experimentos de router Rust/Python en [Servicio de inferencia](projects/labs.md#inference-fabric-inference-fabric) |
| Bases de datos | PostgreSQL, AlloyDB, DuckDB, ClickHouse, MySQL, Redis, BigQuery, Snowflake, Redshift | **Con clientes:** BigQuery en cada rol en GCP; estado de sesión en Redis ([2024–2025](about.md#20242025-axity)). **Investigación:** compatibilidad de destinos en [Radar tecnológico](projects/explorations.md) |
| Estándares de ingeniería | Contratos de datos (ODCS), evolución de esquemas, idempotencia, convenciones semánticas de OpenTelemetry, pre-commit quality gates, Conventional Commits, SemVer | Aplicados en cada proyecto, incluido [este repositorio](https://github.com/landerox/landerox.github.io){ target="_blank" } |
| UX/UI de herramientas | Zensical, HTML semántico, CSS con tokens, JavaScript nativo, Playwright, axe-core | Este sitio como caso de diseño progresivo y accesibilidad; [premisas UX/UI](projects/open-source.md#ux-ui) |

<!-- markdownlint-enable MD013 -->
