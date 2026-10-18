---
title: Blog
description: "Practical technology comparisons: a short explanation, results and sources behind each recommendation."
hide:
  - toc
icon: material/post-outline
---

<!-- markdownlint-disable MD003 MD013 MD033 -->

# :material-post-outline: Blog

> Technical choices, explained briefly: what I compared, where each option fits
> and what I would verify before using it. Results come first; sources and
> operational detail are there when you need them.

## Storage and lakehouse

<div class="grid cards" markdown>

* :material-database-outline: **Open-source object storage**

    Garage, SeaweedFS, Silo, MinIO and other options for small installations,
    private cloud and data platforms. A comparison table, workload-led choices
    and the recovery questions that matter.

    [:octicons-arrow-right-24: Compare object storage](object-storage.md)

* :material-table-multiple: **Lakehouse table formats and catalogs**

    Iceberg, Delta Lake, Hudi, DuckLake and Paimon. Distinguish table state,
    catalogs, Parquet files and query engines; compare interoperability and
    recovery.

    [:octicons-arrow-right-24: Compare table formats and catalogs](lakehouse-table-formats.md)

</div>

## Data pipelines

<div class="grid cards" markdown>

* :material-source-branch: **Workflow orchestrators**

    Airflow, Dagster, Prefect, Kestra, Argo Workflows and Windmill, with
    Temporal in context. Compare the execution model, licensing and safe
    recovery of work.

    [:octicons-arrow-right-24: Compare workflow orchestrators](workflow-orchestrators.md)

* :material-table-arrow-right: **Data transformation and modeling**

    dbt Core 1.12 and dbt 2.0, SQLMesh, Dataform Core and Bruin. Compare model
    changes, environments, backfills and deployment responsibility.

    [:octicons-arrow-right-24: Compare data transformation tools](data-transformation.md)

</div>

## Databases

<div class="grid cards blog-databases-grid" markdown>

* :material-database-search-outline: **Open-source OLAP databases**

    ClickHouse, Doris, StarRocks, Trino, Druid, Pinot and DuckDB, plus AGPL
    alternatives. Choose by queries, data freshness, deployment and the cost
    of recovery.

    [:octicons-arrow-right-24: Compare OLAP databases](olap-databases.md)

* :material-vector-polyline: **Open-source vector databases**

    Qdrant, Milvus, Weaviate, pgvector, Chroma, LanceDB, Vespa and Redis.
    Compare filtered retrieval, licensing, deployment and quality under load.

    [:octicons-arrow-right-24: Compare vector databases](vector-databases.md)

* :material-graph-outline: **Open-source graph databases**

    Neo4j Community, Apache AGE, JanusGraph, LadybugDB, NebulaGraph, OrientDB
    and ArcadeDB. Choose by traversal, query language, deployment, edition and
    recovery.

    [:octicons-arrow-right-24: Compare graph databases](graph-databases.md)

</div>

## Business intelligence

<div class="grid cards" markdown>

* :material-chart-box-outline: **BI and data visualization**

    Superset, Metabase, Lightdash, Evidence and Redash, with Cube in context.
    Compare the reader's workflow, governed metrics, permissions and
    publishing.

    [:octicons-arrow-right-24: Compare BI and visualization tools](business-intelligence.md)

</div>

## Observability

<div class="grid cards" markdown>

* :material-pulse: **Observability tools and their roles**

    Prometheus, Grafana and alternatives for metrics, logs, traces, profiles
    and collection. Compare tools that serve the same role and identify
    components that work together.

    [:octicons-arrow-right-24: Compare observability tools](observability.md)

</div>

## How I rate tools

Each comparison table carries an editorial rating from 1 to 5 for the fit
named in the same row, dated with the article. It is the sum of five criteria
worth 0, 0.5 or 1 point, scored from the official repository, releases and
documentation on the review date. The license itself is shown in its own
column and is not scored: the site treats every OSI license, copyleft
included, as open source. What is scored is what the open-source edition
actually includes.

| Criterion | 1 point | 0.5 points | 0 points |
| :--- | :--- | :--- | :--- |
| **1. Maintenance** | Stable release in the last 6 months and ~100 commits in 90 days. | Stable release in the last 18 months, or fewer commits than that. | Nothing stable in 18 months, or an archived upstream. |
| **2. Open edition** | Covers the fit end to end, including day-two operations (healing, replication/HA, identity and access control, backup/restore, administration) with no paid gate. | Core works, but operational or governance features (SSO, RBAC, audit, replication, tiering, scrubbing/repair, admin console, distributed mode) sit in a paid edition or managed service. | No open-source license, or the open edition cannot serve the fit. |
| **3. Maturity and community** | Broad multi-organization community with a long production record (~10k stars and 5 years, or foundation governance with 5+ years of public releases). | Established but young, small, single-maintainer, in maintenance mode, or a foundation project with under 5 years of public releases. | No production record. |
| **4. Operating scope** | One process, library or extension with documented backup and restore. | Several roles or an external dependency (metadata DB, queue or object store), or backups that require taking the service offline. | A full platform with its own operating discipline. |
| **5. Interoperability** | Complete standard interfaces for the fit (S3, Iceberg REST, OTLP, SQL and drivers, Cypher or Gremlin). | Partial coverage or an ecosystem centered on one engine. | A proprietary interface only. |

**Caps and scope:** An archived upstream scores at most 1; no stable release in
18 months, at most 2; no general-availability release yet, at most 2.5. General
availability means a stable release that upstream presents as ready for
production; a 0.x version number alone does not trigger the cap. Stars fill in
proportion to the number, so a half star is half a point. Betas, development
tools and products outside the open-source shortlist are not rated. A rating
summarizes readiness to shortlist the open edition, not measured performance;
the workload sections still decide. Every rating table lists tools from the
highest to the lowest rating. Candidates to watch are named without a rating
until they receive the same review.

## Read across the platform

Storage preserves the inputs. Orchestration coordinates transformations.
Models feed analytical engines and BI; vector and graph retrieval answer
different questions. Observability helps investigate how the system behaves.
Follow the links between articles to choose the layers your application needs.

<figure class="architecture-diagram architecture-overview">
  <ol class="architecture-flow" role="list">
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">01</span>
      <strong class="architecture-stage__title">Storage and open tables</strong>
      <p>Object storage preserves immutable raw payloads while table formats and catalogs track snapshots, schema evolution and compaction.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">02</span>
      <strong class="architecture-stage__title">Orchestration and models</strong>
      <p>Schedulers coordinate retries and backfills while transformation frameworks test contracts and publish reproducible datasets.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">03</span>
      <strong class="architecture-stage__title">Serving and decision</strong>
      <p>OLAP engines and BI serve governed metrics; vector indexes and graph databases answer filtered similarity and multi-hop queries.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">04</span>
      <strong class="architecture-stage__title">Cross-cutting telemetry</strong>
      <p>Collectors, metrics, logs, traces and profiles expose saturation, errors and latency across every storage, pipeline and serving layer.</p>
    </li>
  </ol>
  <figcaption>How the nine comparisons connect across a platform. Each layer hands durable state or telemetry to the next so failures can be isolated and replayed.</figcaption>
</figure>
