---
description: "Sobre Fernando Landero — Consultor Senior e Ingeniero en Plataformas de Cloud, Datos e IA: perfil, áreas de enfoque y experiencia seleccionada."
hide:
  - toc
icon: material/account
---

# :material-account: Sobre mí

**Fernando Landero** · Consultor Senior e Ingeniero · Plataformas de Cloud,
Datos e IA

Llevo más de 15 años construyendo y operando sistemas de software — los
últimos **7 enfocados en cloud y plataformas de datos**. Hoy trabajo como
consultor independiente: los equipos me traen para modernizar una
arquitectura de datos, endurecer su infraestructura o llevar un sistema de
IA del prototipo a producción, principalmente en **Google Cloud** y **AWS**.

Por defecto construyo con piezas portables y open-source (dbt, Spark,
Airflow, Iceberg), para que los sistemas que dejo atrás nunca queden atados a
un solo proveedor.

## Áreas de enfoque

<!-- markdownlint-disable MD013 -->

| Área | Qué aporto | Stack habitual |
| :--- | :--- | :--- |
| IA Aplicada y MLOps | Sistemas de IA que funcionan en producción — recuperación evaluada, agentes con estado, uso controlado de herramientas — y despliegue automatizado de ML | LangGraph, Pydantic AI, Gemini / Vertex AI, Databricks, evaluación RAG, Langfuse, OpenTelemetry |
| Cloud e Ingeniería de Plataformas | Arquitecturas seguras definidas como código, verificadas por política antes de aplicarse y con el costo de nube bajo control (FinOps) | Terraform / OpenTofu, Terragrunt, OPA Rego, GitHub Actions, Kubernetes (GKE/EKS), Cloud Run |
| Ingeniería de Datos y Pipelines | Pipelines batch y streaming que aguantan carga, desde la ingesta hasta transformaciones probadas | Spark, dbt, Airflow / Cloud Composer, Dagster, Dataflow, Pub/Sub |
| Arquitectura de Datos y Almacenamiento | Modelos dimensionales, contratos de datos y elección de almacenamiento entre data warehouses y lakehouses de tablas abiertas | BigQuery, Iceberg, Delta Lake, Parquet, Kimball, Data Vault 2.0 |

## Experiencia seleccionada

<div class="experience-list" markdown="block">

<section class="experience-entry" markdown="block">

### 2026–presente · Landerox (independiente)

**Rol:** Senior Consultant · AI Engineer · **Industria:** Finanzas, Energía

Razonamiento multi-agente en GCP con LangGraph para evaluación de créditos,
con caché de prompts y telemetría de costos por token. Construí un agente de
monitoreo automatizado que diagnostica fallas de pipeline con LLMs locales
(Hermes-3) y genera PRs correctivos bajo revisión humana. En AWS, desplegué un
lakehouse Medallion que unifica fuentes descentralizadas para asistentes
multi-agente.

</section>

<section class="experience-entry" markdown="block">

### 2025 · TCS

**Rol:** Senior Consultant · MLOps & Data Engineer · **Industria:** Datos
Crediticios y Seguridad

Construí una librería core interna en Python con tooling CLI en Vertex AI
Workbench para automatizar despliegues de ML sobre Spark, Databricks y
Dataproc. Endurecí pipelines CI/CD zero-trust, orquesté escaneo de PII entre
dominios y goberné la ingesta en BigQuery bajo cumplimiento estricto.

</section>

<section class="experience-entry" markdown="block">

### 2024–2025 · Axity

**Rol:** Senior Consultant · MLOps & Data Engineer · **Industria:** Retail
Inmobiliario

Orquesté flujos Gemini multi-agente en Cloud Run con estado de sesión en
Redis, reemplazando OpenDataQnA por un orquestador propio para eliminar
cuellos de botella de latencia. Desplegué landing zones GCP multi-proyecto en
Terraform, pipelines Dataflow batch/streaming y rutinas automatizadas de
ofuscación de PII.

</section>

<section class="experience-entry" markdown="block">

### 2023–2024 · Acid Labs

**Rol:** Senior Data Engineer · **Industria:** Retail

Gestioné una plataforma de datos en Kubernetes: más de 200 extractores propios
en Python ingiriendo a capas raw de BigQuery, y más de 1.100 modelos dbt
construyendo las capas Silver/Gold del lakehouse para 8 unidades de negocio.
Implementé optimización de costos GKE/BigQuery (FinOps), aislamiento de PII en
vistas dbt y rutinas automatizadas de respaldo en Parquet.

</section>

<section class="experience-entry" markdown="block">

### 2022–2023 · Sodimac

**Rol:** Senior Data Engineer · **Industria:** Retail

Construí pipelines de ingesta batch y streaming (Dataflow, Pub/Sub, Airflow),
ELT entre nubes desde Amazon S3 hacia BigQuery, y entrenamiento semanal
contenerizado de modelos ML de recomendación en Kubernetes, optimizando a la
vez los costos de cómputo de consultas en BigQuery.

</section>

<section class="experience-entry" markdown="block">

### 2019–2021 · NTT DATA

**Rol:** Data Engineer · **Industria:** Energía, Aviación, Telecomunicaciones

En el sector energético, implementé la ingesta distribuida de datos de
Salesforce CRM hacia un data lake Cloudera/Hadoop utilizando PySpark, HiveQL y
Bash para alimentar tableros en Tableau. Para una aerolínea, formé parte de la
migración de sistemas on-premises a Google Cloud Platform (GCP), donde
construí la capa de datos implementando modelado de dominio Data Vault 2.0
bajo un enfoque *data mesh*, pipelines ETL/ELT en Python orquestados con Cloud
Composer (Airflow) y Cloud Functions hacia BigQuery, jobs en Scala sobre
Dataproc y cargas contenerizadas en Kubernetes. Asimismo, refactoricé jobs de
procesamiento en Scala/Hadoop para una operadora de telecomunicaciones.

</section>

<section class="experience-entry" markdown="block">

### 2008–2017 · Banca y Medios de Pago

**Rol:** Systems & Data Engineer · **Industria:** Core Bancario

Desarrollé sistemas de core bancario, facturación y sistemas financieros
transaccionales — estableciendo estándares estrictos de consistencia de datos,
idempotencia y confiabilidad operativa.

</section>

</div>

<!-- markdownlint-enable MD013 -->

## Contacto

Cómo trabajo con equipos y cuándo estoy disponible está en
[Colaboración](collaboration.md).

<!-- markdownlint-disable MD013 -->
[:material-calendar-clock: Agendar una llamada](https://calendly.com/landerox/30min){ .md-button .md-button--primary target="_blank" }
[:material-email: Escribir un email](mailto:contacto@landerox.com){ .md-button }
<!-- markdownlint-enable MD013 -->
