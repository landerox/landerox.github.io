---
title: Blog
description: "Practical technology comparisons: a short explanation, results and sources behind each recommendation."
hide:
  - toc
icon: material/post-outline
---

# :material-post-outline: Blog

Technical choices, explained briefly: what I compared, where each option fits
and what I would verify before using it. Results come first; sources and
operational detail are there when you need them.

## Storage and lakehouse

**[Open-source object storage](object-storage.md)**

Garage, SeaweedFS, Silo, MinIO and other options for small installations,
private cloud and data platforms. A comparison table, workload-led choices
and the recovery questions that matter.

**[Lakehouse table formats and catalogs](lakehouse-table-formats.md)**

Iceberg, Delta Lake, Hudi, DuckLake and Paimon. Distinguish table state, catalogs,
Parquet files and query engines; compare interoperability and recovery.

## Data pipelines

**[Workflow orchestrators](workflow-orchestrators.md)**

Airflow, Dagster, Prefect, Kestra, Argo Workflows and Windmill, with Temporal
in context. Compare the execution model, licensing and safe recovery of work.

**[Data transformation and modeling](data-transformation.md)**

dbt Core 1.12 and dbt 2.0, SQLMesh, Dataform Core and Bruin.
Compare model changes, environments, backfills and deployment responsibility.

## Databases

**[Open-source OLAP databases](olap-databases.md)**

ClickHouse, Doris, StarRocks, Trino, Druid, Pinot and DuckDB, plus AGPL
alternatives.
Choose by queries, data freshness, deployment and the cost of recovery.

**[Open-source vector databases](vector-databases.md)**

Qdrant, Milvus, Weaviate, pgvector, Chroma, LanceDB, Vespa and Redis.
Compare filtered retrieval, licensing, deployment and quality under load.

**[Open-source graph databases](graph-databases.md)**

Neo4j Community, Apache AGE, JanusGraph, LadybugDB, NebulaGraph, OrientDB and
ArcadeDB.
Choose by traversal, query language, deployment, edition and recovery.

## Business intelligence

**[BI and data visualization](business-intelligence.md)**

Superset, Metabase, Lightdash, Evidence and Redash, with Cube in context.
Compare the reader's workflow, governed metrics, permissions and publishing.

## Observability

**[Observability tools and their roles](observability.md)**

Prometheus, Grafana and alternatives for metrics, logs, traces, profiles
and collection. Compare tools that serve the same role and identify
components that work together.

## How I rate tools

Each comparison table carries an editorial rating from 1 to 5 for the fit
named in the same row, dated with the article. It is the sum of five criteria
worth 0, 0.5 or 1 point, scored from the official repository, releases and
documentation on the review date. The license itself is shown in its own
column and is not scored: the site treats every OSI license, copyleft
included, as open source. What is scored is what the open-source edition
actually includes.

1. **Maintenance.** 1: a stable release in the last six months and active
   development (about 100 commits in 90 days, or a regular cadence). 0.5: a
   stable release in the last 18 months, or low activity. 0: nothing stable
   in 18 months, or an archived upstream.
2. **Open edition.** 1: the open-source edition covers the fit end to end,
   including day-two operations such as healing, replication or high
   availability where the fit needs them, identity and access control,
   backup and restore, and administration, with no paid gate. 0.5: the core
   works, but operational or governance features (single sign-on, role-based
   access, audit, replication, tiering, scrubbing and repair, admin console,
   distributed mode) sit in a paid edition or a managed service. 0: no
   open-source license, or the open edition cannot serve the fit.
3. **Maturity and community.** 1: a broad multi-organization community with a
   long production record (roughly ten thousand stars and five years, or
   foundation governance with wide adoption). 0.5: established but young,
   small, single-maintainer or in maintenance mode. 0: no production record.
4. **Operating scope.** 1: one process, library or extension with documented
   backup and restore. 0.5: several roles or an external dependency such as a
   metadata database, queue or object store, or backups that require taking
   the service offline. 0: a full platform with its own operating discipline.
5. **Interoperability.** 1: complete standard interfaces for the fit (S3,
   Iceberg REST, OTLP, SQL and drivers, Cypher or Gremlin). 0.5: partial
   coverage or an ecosystem centered on one engine. 0: a proprietary
   interface only.

Caps: an archived upstream scores at most 1; no stable release in 18 months,
at most 2; no general-availability release yet, at most 2.5. Stars fill in
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
