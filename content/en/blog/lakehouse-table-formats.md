---
title: "Lakehouse table formats and catalogs"
reviewed: 2026-10-15
description: "Compare Apache Iceberg, Delta Lake, Apache Hudi, DuckLake and Apache Paimon, distinguishing table formats, SQL catalogs, query engines and recovery responsibilities."
hide:
  - toc
icon: material/table-multiple
---

<!-- markdownlint-disable MD013 -->

# :material-table-multiple: Lakehouse table formats and catalogs

> Compare how table state is committed, read and recovered.

Parquet describes files. A table format adds the metadata and rules needed
to decide which files represent a table at a particular point in time.
The query engine executes work, and a catalog helps locate and manage the
table. Those responsibilities explain why Iceberg and DuckLake belong here.

<figure class="architecture-diagram architecture-overview">
  <ol class="architecture-flow" role="list">
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">01</span>
      <strong class="architecture-stage__title">File storage</strong>
      <p>Data files such as Parquet live in local or object storage. Retention determines which files remain available for recovery.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">02</span>
      <strong class="architecture-stage__title">Table state</strong>
      <p>Metadata and commit rules identify the files in each table version and define how readers and writers coordinate changes.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">03</span>
      <strong class="architecture-stage__title">Catalog</strong>
      <p>Locates tables and manages their metadata references. Authorization, concurrency and recovery depend on the catalog and format integration.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">04</span>
      <strong class="architecture-stage__title">Query engines</strong>
      <p>Read and transform table data. Each engine must support the table features and catalog integration used by the workload.</p>
    </li>
  </ol>
  <figcaption>Four lakehouse responsibilities. Catalog and table metadata integration varies by format; DuckLake stores table metadata in a SQL database.</figcaption>
</figure>

## At a glance

**Sources reviewed: October 2026**, from official repositories, releases and
documentation. Each rating (1–5) is an editorial readiness score for the fit
in its row; the breakdown sits under the table and the
[method](index.md#how-i-rate-tools) on the Blog index.

| Project | Rating | Code license | I would shortlist it for | Main constraint |
| :--- | :--- | :--- | :--- | :--- |
| [Apache Iceberg 1.12.0](https://github.com/apache/iceberg/tree/apache-iceberg-1.12.0) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0 | Tables shared by independently chosen analytical engines | Each reader, writer, catalog and format-version combination needs a compatibility check. |
| [Delta Lake 4.4.1](https://github.com/delta-io/delta/tree/v4.4.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | A platform whose engines and operating practices already support Delta | Enabled table features and reader/writer protocols can narrow compatibility. |
| [Apache Hudi 1.2.1](https://github.com/apache/hudi/tree/release-1.2.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | CDC, updates and incremental processing over a data lake | Table type, indexing, compaction and cleaning affect freshness and maintenance. |
| [DuckLake specification 1.0](https://ducklake.select/docs/stable/specification/introduction) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | MIT reference implementation | A lakehouse with table metadata coordinated through a SQL database | Catalog concurrency, recovery and the exact engine integration are central design choices. |
| [Apache Paimon 2.1.0](https://github.com/apache/paimon/tree/release-2.1.0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Streaming and batch writes into lake tables with Flink or Spark | Engine support centers on Flink and Spark; confirm every reader outside them. |

??? info faq-item "How each rating was computed"
    Five criteria worth 0, 0.5 or 1 point each. Caps: archived upstream 1,
    no stable release in 18 months 2, no general-availability release 2.5.
    "Open edition" scores what the open-source edition includes without a
    paid tier. Scored in October 2026 from the official repository, releases
    and documentation; the method is on the
    [Blog index](index.md#how-i-rate-tools).

    | Project | Maintenance | Open edition | Maturity | Operations | Interoperability | Rating |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Apache Iceberg | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | Apache Polaris | 1 | 1 | 0.5 | 0.5 | 1 | 4 |
    | Delta Lake | 1 | 1 | 1 | 0.5 | 0.5 | 4 |
    | Apache Hudi | 1 | 1 | 1 | 0.5 | 0.5 | 4 |
    | Lakekeeper | 1 | 1 | 0.5 | 0.5 | 1 | 4 |
    | DuckLake | 1 | 1 | 0.5 | 0.5 | 0.5 | 3.5 |
    | Apache Paimon | 1 | 1 | 0.5 | 0.5 | 0.5 | 3.5 |
    | Nessie | 1 | 1 | 0.5 | 0.5 | 0.5 | 3.5 |
    | Unity Catalog OSS | 1 | 0.5 | 0.5 | 0.5 | 0.5 | 3 |

## Where DuckLake fits

DuckLake is an **integrated lakehouse table and catalog format**. Its
[specification](https://ducklake.select/docs/stable/specification/introduction)
places table metadata in SQL tables and data in Parquet files. It belongs
beside Iceberg, Delta Lake and Hudi, with that architectural difference
visible in the comparison.

DuckDB is a query engine; DuckLake is not another name for its native
database file. The [DuckLake documentation](https://ducklake.select/docs/stable/)
separates the specification from the DuckDB extension. The
[reference implementation](https://github.com/duckdb/ducklake) is MIT-licensed.
Its version and supported DuckDB build must be checked separately from
specification 1.0.

For remote concurrent clients, the
[catalog guide](https://ducklake.select/docs/stable/duckdb/usage/choosing_a_catalog_database)
points to PostgreSQL. DuckDB and SQLite catalogs suit different local
deployment patterns. Choosing a SQL catalog does not remove the need to
operate and restore that database.

## Start with the workload

- **Several engines must read and write the same tables:** start by testing
  Iceberg across the exact engine versions. Confirm deletes, schema changes
  and timestamp semantics, not merely that every product lists an Iceberg connector.
- **A Delta-based Spark platform already exists:** keep Delta on the
  shortlist. Test the second engine before enabling table features that
  its reader or writer cannot handle.
- **An update-heavy CDC pipeline:** compare Hudi's table and query types
  against Iceberg or Delta with the same change stream. Include compaction
  and read freshness in the result.
- **A compact lakehouse centered on DuckDB and a shared SQL catalog:**
  trial DuckLake. Check concurrent transactions, metadata recovery and the
  required integrations before promising cross-engine portability.

## Version and operating notes

??? info faq-item "Iceberg — keep implementation and format versions separate"
    The [specification](https://iceberg.apache.org/spec/) identifies completed
    format versions 1, 2 and 3, with version 4 under development at review.
    That numbering is distinct from the 1.12.0 library release in the table.

    Build a reader/writer compatibility matrix for the features actually
    enabled. Test partition evolution, row deletion and snapshot expiration
    across engines. A catalog connection succeeding does not establish that
    every table feature can be read or written correctly.

??? info faq-item "Delta Lake — table features are a compatibility decision"
    The [table properties reference](https://docs.delta.io/table-properties/)
    describes settings including retention and protocol requirements.
    The [transaction protocol](https://github.com/delta-io/delta/blob/v4.4.1/PROTOCOL.md)
    defines the requirements readers and writers must follow.

    Trial feature upgrades with every consuming engine. Restore transaction
    history and data files together. Treat retention and vacuum settings as
    recovery decisions; time travel cannot recover files already removed
    from all retained copies.

??? info faq-item "Hudi — compare table type and query semantics"
    Hudi's [table types](https://hudi.apache.org/docs/table_types/) distinguish
    Copy on Write and Merge on Read. On Merge on Read, snapshot and
    read-optimized queries can observe different freshness between compactions.

    Replay updates, late events and deletes with the actual record key and
    ordering rules. Measure ingestion, compaction backlog and queries together.
    Verify that the consumer's query type satisfies the freshness requirement.

??? info faq-item "DuckLake — recover the catalog and files as one dataset"
    The [backup guidance](https://ducklake.select/docs/stable/duckdb/guides/backups_and_recovery)
    covers the catalog database and file storage. Metadata is part of the
    durable dataset, not a cache that can always be rebuilt by listing Parquet.

    Restore into a clean environment, test references to every retained file
    and reproduce a writer failure around commit. Check the catalog's
    transaction behavior with the intended number of clients. Include
    small-write handling and maintenance in the operating trial.

??? info faq-item "Apache Paimon — streaming writes make compaction your job"
    **Reviewed: [2.1.0, released 2026-10-12](https://github.com/apache/paimon/tree/release-2.1.0).** An Apache
    top-level project, Paimon describes itself as a lake format for real-time
    lakehouses with Flink and Spark, for both streaming and batch operations
    ([documentation](https://paimon.apache.org/docs/master/)). The whole
    project is Apache-2.0; there is no separate paid edition to score.

    Test a streaming writer that fails mid-checkpoint, changelog reads after
    compaction and the exact engines that must read the tables. A smaller
    community than Iceberg or Delta means more of that evidence is yours to
    produce.

## Catalogs are another choice

These projects help manage table discovery or governance. Their license
does not automatically describe a vendor's hosted product. Ratings use the
same method as the table above.

| Catalog | Rating | Reviewed code license | Role | What I would verify |
| :--- | :--- | :--- | :--- | :--- |
| [Apache Polaris 1.8.0](https://github.com/apache/polaris/tree/apache-polaris-1.8.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Catalog services for Iceberg | Engine authentication, credential handling and restore of catalog state. |
| [Lakekeeper 0.14.0](https://github.com/lakekeeper/lakekeeper/tree/v0.14.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Iceberg REST catalog | Authorization integration, object-store access and metadata recovery. |
| [Nessie 0.109.0](https://github.com/projectnessie/nessie/tree/nessie-0.109.0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Versioned catalog with branches and tags | Engine support and the relationship between catalog references and table snapshots. |
| [Unity Catalog OSS 0.7.0](https://github.com/unitycatalog/unitycatalog/tree/v0.7.0) | <span class="tool-rating" data-rating="3"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3/5</span></span> | Apache-2.0 | Open catalog and governance interfaces | From 0.7.0, files of dropped managed tables, volumes and models are deleted after 7 days by default; check APIs, authorization and OSS scope against the managed service. |

DuckLake's SQL catalog follows its own metadata specification; it is not
an interchangeable Iceberg REST catalog. Likewise, **Lance** is a data
format used by LanceDB, **Parquet** is a file format, and **S3** is an object
storage API. Keep those layers visible in the
[technology inventory](../stack.md).

## A trial that can change the decision

Use the same mutable event table and two independent clients.

1. **Commit correctness:** interrupt a writer and verify that readers see
   a coherent committed snapshot, including multi-table requirements if needed.
2. **Interoperability:** read and write with the exact engine combinations;
   include nulls, timestamps, deletes and schema/partition evolution.
3. **Freshness and maintenance:** measure query visibility alongside
   compaction, small files, snapshot expiration and metadata growth.
4. **Authorization and recovery:** test catalog access and direct object
   access, then restore catalog state, credentials and referenced files.
5. **Exit:** export a representative dataset and preserve semantics in the
   destination. Shared Parquet files do not prove metadata-only migration.

## Follow the data

Choose [object storage](object-storage.md) for the files,
[transformation](data-transformation.md) for their models and an
[orchestrator](workflow-orchestrators.md) for scheduled work. Compare
[OLAP engines](olap-databases.md) and [BI](business-intelligence.md) for
consumption. A table format does not supply all of those services.
