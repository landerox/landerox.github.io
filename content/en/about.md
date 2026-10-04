---
description: "About Fernando Landero — Senior Consultant & Engineer in Cloud, Data & AI Platforms: profile, focus areas and selected experience."
hide:
  - toc
icon: material/account
---

# :material-account: About me

**Fernando Landero** · Senior Consultant & Engineer · Cloud, Data & AI
Platforms

I have built and operated software systems for over 15 years — the last
**7 focused on cloud and data platforms**. Today I work as an independent
consultant: teams bring me in to modernize a data architecture, harden their
infrastructure, or take an AI system from prototype to production, primarily
on **Google Cloud** and **AWS**.

I default to portable, open-source building blocks (dbt, Spark, Airflow,
Iceberg), so the systems I leave behind are never chained to a single vendor.

## Focus areas

<!-- markdownlint-disable MD013 -->

| Area | What I bring | Typical stack |
| :--- | :--- | :--- |
| Applied AI & MLOps | AI systems that hold up in production — evaluated retrieval, stateful agents, controlled tool use — and automated ML deployment | LangGraph, Pydantic AI, Gemini / Vertex AI, Databricks, RAG evaluation, Langfuse, OpenTelemetry |
| Cloud & Platform Engineering | Secure architectures defined as code, checked by policy before they apply, with cloud cost under control (FinOps) | Terraform / OpenTofu, Terragrunt, OPA Rego, GitHub Actions, Kubernetes (GKE/EKS), Cloud Run |
| Data Engineering & Pipelines | Batch and streaming pipelines that hold under load, from ingestion to tested transformations | Spark, dbt, Airflow / Cloud Composer, Dagster, Dataflow, Pub/Sub |
| Data & Storage Architecture | Dimensional models, data contracts and storage choices across data warehouses and open-table lakehouses | BigQuery, Iceberg, Delta Lake, Parquet, Kimball, Data Vault 2.0 |

## Selected experience

<div class="experience-list" markdown="block">

<section class="experience-entry" markdown="block">

### 2026–present · Landerox (independent)

**Role:** Senior Consultant · AI Engineer · **Industry:** Finance, Energy

Multi-agent reasoning on GCP using LangGraph for financial loan evaluation,
prompt caching, and token cost telemetry. Built an automated monitoring agent
that diagnoses pipeline failures with local LLMs (Hermes-3) and generates
corrective PRs under human review. On AWS, deployed a Medallion lakehouse
unifying decentralized sources for multi-agent assistants.

</section>

<section class="experience-entry" markdown="block">

### 2025 · TCS

**Role:** Senior Consultant · MLOps & Data Engineer · **Industry:** Credit
Data & Security

Built an internal Python core library with CLI tooling in Vertex AI Workbench
to automate ML deployments across Spark, Databricks, and Dataproc. Hardened
zero-trust CI/CD pipelines, orchestrated cross-domain PII scanning, and
governed BigQuery ingestion under strict compliance.

</section>

<section class="experience-entry" markdown="block">

### 2024–2025 · Axity

**Role:** Senior Consultant · MLOps & Data Engineer · **Industry:** Retail
Real Estate

Orchestrated multi-agent Gemini workflows on Cloud Run with Redis session
state, replacing OpenDataQnA with a custom orchestrator to eliminate latency
bottlenecks. Deployed multi-project GCP landing zones in Terraform,
batch/streaming Dataflow pipelines, and automated PII obfuscation routines.

</section>

<section class="experience-entry" markdown="block">

### 2023–2024 · Acid Labs

**Role:** Senior Data Engineer · **Industry:** Retail

Managed a Kubernetes data platform: 200+ custom Python extractors ingesting
into BigQuery raw layers, and 1,100+ dbt models building Silver/Gold lakehouse
layers for 8 business units. Implemented GKE/BigQuery cost optimization
(FinOps), PII isolation in dbt views, and automated Parquet backup routines.

</section>

<section class="experience-entry" markdown="block">

### 2022–2023 · Sodimac

**Role:** Senior Data Engineer · **Industry:** Retail

Built batch and streaming ingestion pipelines (Dataflow, Pub/Sub, Airflow),
cross-cloud ELT from Amazon S3 into BigQuery, and containerized weekly ML
recommendation model training on Kubernetes while optimizing BigQuery query
compute costs.

</section>

<section class="experience-entry" markdown="block">

### 2019–2021 · NTT DATA

**Role:** Data Engineer · **Industry:** Energy, Aviation, Telecom

In the energy sector, implemented distributed ingestion of Salesforce CRM data
into a Cloudera/Hadoop data lake using PySpark, HiveQL and Bash to feed
Tableau dashboards. For an airline, joined an on-premises to Google Cloud
Platform (GCP) migration and built the data layer: Data Vault 2.0 domain
modeling under a *data mesh* approach, Python ETL/ELT pipelines orchestrated
with Cloud Composer (Airflow) and Cloud Functions into BigQuery, Scala jobs on
Dataproc, and containerized workloads on Kubernetes. Also refactored
Scala/Hadoop processing jobs for a telecom operator.

</section>

<section class="experience-entry" markdown="block">

### 2008–2017 · Banking & Payments

**Role:** Systems & Data Engineer · **Industry:** Core Banking

Engineered core banking, billing, and transactional financial systems —
establishing strict standards for data consistency, idempotency, and
operational reliability.

</section>

</div>

<!-- markdownlint-enable MD013 -->

## Get in touch

How I work with teams, and when I am reachable, is on
[Collaboration](collaboration.md).

<!-- markdownlint-disable MD013 -->
[:material-calendar-clock: Book a call](https://calendly.com/landerox/30min){ .md-button .md-button--primary target="_blank" }
[:material-email: Send an email](mailto:contacto@landerox.com){ .md-button }
<!-- markdownlint-enable MD013 -->
