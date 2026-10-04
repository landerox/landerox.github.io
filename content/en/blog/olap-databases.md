---
reviewed: 2026-09-23
description: "Compare ClickHouse, Doris, StarRocks, Trino, Druid, Pinot and DuckDB, plus AGPL alternatives: SQL workloads, deployment, licensing and recovery."
hide:
  - toc
icon: material/database-search-outline
---

<!-- markdownlint-disable MD013 -->

# :material-database-search-outline: Open-Source OLAP Databases

> Start with the queries and the freshness target.

Scanning Parquet on a laptop and serving concurrent customer dashboards are
both analytical workloads. They justify different architectures. I would
compare query shape, updates, ingestion lag and recovery before comparing
headline throughput.

## Comparison at a glance

**Sources reviewed: September 2026**, from official repositories, releases and
documentation. The table mixes distributed servers, an embedded engine and a
PostgreSQL extension. Each rating (1–5) is an editorial readiness score for
the fit in its row; the breakdown sits under the table and the
[method](index.md#how-i-rate-tools) on the Blog index.

| Project | Rating | Core license | I would shortlist it for | Main constraint |
| :--- | :--- | :--- | :--- | :--- |
| [DuckDB 1.5.5](https://github.com/duckdb/duckdb/tree/v1.5.5) | <span class="tool-rating" data-rating="5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">5/5</span></span> | MIT | Embedded analytics, Parquet exploration and bounded batch jobs | The native in-process database has a single writer process; shared service designs need a separate plan. |
| [ClickHouse 26.8.11.7 LTS](https://github.com/ClickHouse/ClickHouse/tree/v26.8.11.7-lts) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0 | Columnar SQL over events and analytical datasets | Table layout, ingestion batches, merges and replication need deliberate design. |
| [Apache Doris 4.1.4](https://github.com/apache/doris/tree/4.1.4) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0; dependency exceptions | Shared SQL analytics, reporting and lake queries | Own frontend metadata and backend data; deployment mode changes the components. |
| [StarRocks 4.1.3](https://github.com/StarRocks/starrocks/tree/4.1.3) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0 | BI, joins, materialized views and lake analytics | Storage/compute topology and refresh behavior are part of the design. |
| [Trino 483](https://github.com/trinodb/trino/tree/483) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0 | Federated SQL over lakehouse tables and existing databases, without loading the data first | It stores no data: file layout, the catalog and each connector set its performance. |
| [ParadeDB 0.25.10](https://github.com/paradedb/paradedb/tree/v0.25.10) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | AGPLv3 | Search and analytical aggregations inside PostgreSQL | An extension sharing PostgreSQL resources, not a standalone distributed warehouse. |
| [Apache Druid 37.0.0](https://github.com/apache/druid/tree/druid-37.0.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Time-oriented event analytics with continuous ingestion | Segments, deep storage and metadata add distinct recovery responsibilities. |
| [Apache Pinot 1.5.1](https://github.com/apache/pinot/tree/release-1.5.1) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Analytics exposed inside an application | Index selection and real-time/offline table design shape the result. |

??? info faq-item "How each rating was computed"
    Five criteria worth 0, 0.5 or 1 point each. Caps: archived upstream 1,
    no stable release in 18 months 2, no general-availability release 2.5.
    "Open edition" scores what the open-source edition includes without a
    paid tier. Scored in September 2026 from the official repository, releases
    and documentation; the method is on the
    [Blog index](index.md#how-i-rate-tools).

    | Project | Maintenance | Open edition | Maturity | Operations | Interoperability | Rating |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | DuckDB | 1 | 1 | 1 | 1 | 1 | 5 |
    | ClickHouse | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | Apache Doris | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | StarRocks | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | Trino | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | ParadeDB | 1 | 1 | 0.5 | 1 | 1 | 4.5 |
    | Apache Druid | 1 | 1 | 1 | 0 | 1 | 4 |
    | OpenObserve | 1 | 0.5 | 0.5 | 1 | 1 | 4 |
    | Apache Pinot | 1 | 1 | 1 | 0 | 0.5 | 3.5 |

[AGPLv3 is open source](https://spdx.org/licenses/AGPL-3.0-only.html); Apache, MIT
and AGPL make different licensing choices. Identify the exact build and
extensions being adopted. Doris explicitly documents
[third-party licensing exceptions](https://github.com/apache/doris/blob/4.1.3/thirdparty/LICENSE.txt).
Commercial cloud editions are outside these core-license labels.

## Start with the workload

- **Local files or an analytical step inside an application:** start with
  DuckDB. Measure memory and temporary-disk use before introducing a cluster.
  A daily report does not automatically require a permanent database service.
- **A shared BI platform with joins and changing dimensions:** compare
  Doris and StarRocks with representative SQL and the actual BI client.
  Include ClickHouse when its ingestion and table model fit. Protocol
  compatibility alone does not establish identical SQL semantics.
- **Event-heavy dashboards and operational analytics:** compare ClickHouse,
  Druid and Pinot. Reproduce time ranges, filter selectivity, concurrent users
  and ingestion while queries run.
- **SQL over lakehouse tables that stay in object storage:** start with Trino
  when Iceberg, Delta or Hudi tables remain the source of truth and several
  engines must read them. Choose ClickHouse, Doris or StarRocks when
  low-latency serving justifies loading the data into their own storage.
- **Application search and aggregates over existing PostgreSQL data:**
  evaluate ParadeDB before creating another ingestion pipeline. The decision
  must include transactional workload contention and extension upgrades.

I would not rank these by a single published latency number. A pre-aggregated
dataset, a warm cache and an exact join over raw data are different tests.

## Version and operational notes

??? info faq-item "Trino — a query engine, not a store"
    **Reviewed: [483, released 2026-07-18](https://github.com/trinodb/trino/tree/483).** A coordinator plans each
    query and workers read the data in place through
    [connectors](https://trino.io/docs/current/connector.html) for Iceberg,
    Delta Lake, Hudi and relational databases. Nothing is loaded or stored,
    so the catalog, file sizes and partitioning decide most of the result.
    Commercial distributions add features that are not scored here.

    Query a partitioned Iceberg table while its snapshots change, measure
    planning time on a large metadata tree, and stop a worker mid-query with
    [fault-tolerant execution](https://trino.io/docs/current/admin/fault-tolerant-execution.html)
    enabled. Verify access control through the plugin you will actually run.

??? info faq-item "ClickHouse — table design is an operating decision"
    The [introduction](https://clickhouse.com/docs/get-started/about/intro)
    describes columnar SQL, joins and asynchronous replication. Its
    [MergeTree family](https://clickhouse.com/docs/reference/engines/table-engines/mergetree-family/mergetree)
    makes ordering, partitions and background merges relevant to ingestion
    and query behavior. 26.8 is the August LTS line; 26.3 LTS still receives
    patches, so choose the line by support window rather than newest feature.

    I would test the real insert batch size, late corrections and deletes
    alongside queries. Measure merge pressure and replica lag. Replication
    provides additional copies; an independently restorable backup still
    needs its own rehearsal.

??? info faq-item "Doris — include metadata and the deployment mode"
    The [reviewed architecture](https://github.com/apache/doris/tree/4.1.4#overall-architecture)
    describes frontend and backend responsibilities and distinguishes
    integrated from separated storage/compute deployments.

    I would replay representative joins and updates with the production
    client's SQL, then recover frontend metadata and data together.
    A shorter component list is useful only if the team understands its
    failure domains. Validate dependency licenses in the chosen binary.

??? info faq-item "StarRocks — test views and lake access with changing data"
    The [project overview](https://docs.starrocks.io/docs/introduction/StarRocks_intro/)
    describes MPP execution, a columnar engine, materialized views, streaming
    and batch ingestion, and access to data lakes.

    I would compare direct queries with materialized views after a late
    dimension update. Record refresh lag and extra storage, not only query
    speed. For lake access, include catalog availability, object-store
    requests and the cost of cold reads. The reviewed 4.1.3 dates from
    2026-07-14; 4.0.14 (2026-08-27) is the maintained previous line, so pin
    the exact release you deploy.

??? info faq-item "Druid — protect the segments and their catalog"
    Druid's [deep storage](https://druid.apache.org/docs/latest/design/deep-storage/)
    holds durable segments outside the query processes. Its
    [architecture](https://druid.apache.org/docs/latest/design/architecture/)
    separates ingestion and serving responsibilities.

    I would verify ingestion lag, late-event handling and recovery after
    losing serving nodes. Protect metadata as well as deep storage. If rollup
    is used, document the detail discarded at ingestion and whether the raw
    source can reconstruct it.

??? info faq-item "Pinot — application traffic should drive the trial"
    The [project](https://github.com/apache/pinot/tree/release-1.5.1)
    targets analytical queries in applications and supports batch and
    streaming ingestion with multiple index types.

    I would reproduce skewed tenants, selective filters and concurrent
    requests while ingestion continues. Test the transition between offline
    and real-time data for gaps or double counting. Include segment
    management and cluster recovery in the trial, not just one SQL endpoint.

??? info faq-item "DuckDB — be precise about concurrency"
    The [concurrency reference](https://duckdb.org/docs/current/connect/concurrency)
    distinguishes the native in-process model from other architectures:
    one process can read and write, or multiple processes can open read-only.
    Multiple writer threads within that process are supported.

    The same reference describes Quack as a beta remote protocol and
    DuckLake with a PostgreSQL catalog as another route to concurrent
    writers. Those add different components and storage contracts. I would
    not generalize the native-file restriction to every DuckDB-based system.

??? info faq-item "ParadeDB — an AGPL option within PostgreSQL"
    The [reviewed source](https://github.com/paradedb/paradedb/tree/v0.25.10)
    adds full-text search and aggregations through the `pg_search` extension,
    using Tantivy and DataFusion. Its deployment boundary remains PostgreSQL.

    I would test the supported PostgreSQL/extension combination, index
    maintenance and mixed transaction/search traffic. Keep a recovery plan
    for both the database and extension. Treat this as a search-and-analytics
    alternative for existing data, not evidence of distributed warehouse parity.

## A specialized AGPL candidate

[OpenObserve](https://github.com/openobserve/openobserve) <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> is an AGPLv3
observability platform for [logs, metrics and traces](https://openobserve.ai/docs/)
with analytical querying. I would evaluate it when the requirement is
telemetry search, retention and dashboards.

Its scope differs from a general BI warehouse. Verify the chosen release and
the OSS/enterprise boundary; the reviewed
[1.0.3](https://github.com/openobserve/openobserve/releases/tag/v1.0.3)
belongs to its first general-availability 1.x line, released on 2026-09-11,
which also moved SLOs and synthetic monitoring into the open edition. An AGPL
requirement should narrow a technically suitable
shortlist, not turn different products into equivalent databases.

## A trial that can change the decision

Use the same event dataset and customer dimension for every candidate.
Document partitioning, indexes, replication, hardware and all preprocessing.

1. **Correctness:** reconcile counts and sums after duplicate ingestion,
   a late event, an updated dimension and a deletion. Distinguish exact from
   approximate aggregates.
2. **Freshness:** measure source-event-to-query visibility as well as query
   p50/p95/p99. A quick query over stale data may miss the business objective.
3. **Concurrency:** run the real query mix during ingestion and maintenance;
   report cold and warm caches separately.
4. **Recovery:** restore data, catalog, permissions and ingestion offsets
   into a clean environment. Compare recovered results with the source.
5. **Cost:** include replicas, indexes, temporary disk, object-store traffic,
   compaction and operator time. Fix acceptable thresholds before testing.

## Complete the data path

An [object store](object-storage.md) can hold raw inputs and backups.
An [orchestrator](workflow-orchestrators.md) coordinates loads and rebuilds.
[Vector databases](vector-databases.md) address another retrieval workload.
Keep those responsibilities visible when deciding whether another service
is justified.

The local [SQL explorer](../projects/tools.md#interactive-sql-sandbox)
shows logical query stages on fictional data. Use it to inspect the concepts,
not to estimate any engine's performance.

[Transformation](data-transformation.md) defines the models that feed these
engines; [BI](business-intelligence.md) presents their results. Compare
[lakehouse formats](lakehouse-table-formats.md) when table state spans engines,
and [graph databases](graph-databases.md) when traversing relationships is central.
