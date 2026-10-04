---
reviewed: 2026-09-23
description: "Compare Neo4j Community, Apache AGE, JanusGraph, LadybugDB, NebulaGraph, OrientDB and ArcadeDB: graph workloads, open-source licenses, deployment and recovery."
hide:
  - toc
icon: material/graph-outline
---

<!-- markdownlint-disable MD013 -->

# :material-graph-outline: Open-source graph databases

> Choose for the relationships you need to traverse.

Tracing account ownership, exploring service dependencies and retrieving
connected evidence are graph-shaped problems. A graph database makes nodes,
relationships and traversal central to the data model. That warrants its
own comparison alongside [OLAP](olap-databases.md) and
[vector databases](vector-databases.md).

## At a glance

**Sources reviewed: September 2026**, from official repositories, releases and
documentation. Each rating (1–5) is an editorial readiness score for the fit
in its row; the breakdown sits under the table and the
[method](index.md#how-i-rate-tools) on the Blog index.

| Project | Rating | Reviewed core license | I would shortlist it for | Main constraint |
| :--- | :--- | :--- | :--- | :--- |
| [Neo4j Community 2026.09.0](https://github.com/neo4j/neo4j/tree/2026.09.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | GPLv3 | A dedicated property-graph server and Cypher application | Community is for a single instance; clustering and online backup belong to Enterprise. |
| [LadybugDB 0.20.4](https://github.com/LadybugDB/ladybug/tree/v0.20.4) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | MIT | Embedded graph analytics inside an application or local data workflow | Application ownership of concurrency, files and recovery differs from a managed graph server. |
| [OrientDB 3.2.56](https://github.com/orientechnologies/orientdb/tree/3.2.56) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Applications combining graph and document modeling | Its model, query language and deployment need a trial beyond a graph-only example. |
| [ArcadeDB 26.9.1](https://github.com/ArcadeData/arcadedb/tree/26.9.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | One engine for graph, document and vector queries in Cypher, Gremlin or SQL | Smaller community; test your exact Cypher or Gremlin queries, not the protocol list. |
| [Apache AGE 1.8.0 for PostgreSQL 18](https://github.com/apache/age/releases/tag/PG18%2Fv1.8.0-rc0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Graph queries alongside existing PostgreSQL data | PostgreSQL/extension compatibility and query semantics need an explicit matrix. |
| [JanusGraph 1.1.0](https://github.com/JanusGraph/janusgraph/tree/v1.1.0) | <span class="tool-rating" data-rating="2"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">2/5</span></span> | Apache-2.0 code | Distributed property graphs with TinkerPop/Gremlin | Storage and optional mixed-index backends add independent operating responsibilities. |
| [NebulaGraph 3.8.0](https://github.com/vesoft-inc/nebula/tree/v3.8.0) | <span class="tool-rating" data-rating="2"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">2/5</span></span> | Apache-2.0 | A distributed graph service with separate query, metadata and storage roles | The reviewed release dates to 2024; assess maintenance, dependencies and operational support. |

??? info faq-item "How each rating was computed"
    Five criteria worth 0, 0.5 or 1 point each. Caps: archived upstream 1,
    no stable release in 18 months 2, no general-availability release 2.5.
    "Open edition" scores what the open-source edition includes without a
    paid tier. Scored in September 2026 from the official repository, releases
    and documentation; the method is on the
    [Blog index](index.md#how-i-rate-tools).

    | Project | Maintenance | Open edition | Maturity | Operations | Interoperability | Rating |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Neo4j Community | 1 | 0.5 | 1 | 0.5 | 1 | 4 |
    | LadybugDB | 1 | 1 | 0.5 | 1 | 0.5 | 4 |
    | OrientDB | 1 | 1 | 0.5 | 1 | 0.5 | 4 |
    | ArcadeDB | 1 | 1 | 0.5 | 0.5 | 1 | 4 |
    | Apache AGE | 0.5 | 1 | 0.5 | 1 | 0.5 | 3.5 |
    | JanusGraph | 0 | 1 | 1 | 0.5 | 1 | 2 (capped from 3.5) |
    | NebulaGraph | 0 | 0.5 | 1 | 0.5 | 0.5 | 2 (capped from 2.5) |

**Neo4j Community uses GPLv3, not AGPLv3.** Its commercial editions and
separately distributed tools have their own boundaries. A permissive or
copyleft license does not itself establish scalability or availability.

## Start with the workload

- **An application built around Cypher traversals:** start with Neo4j
  Community for a single-instance trial. If availability requirements need
  clustering, compare the appropriate licensed edition and distributed alternatives.
- **A PostgreSQL application with graph-shaped queries:** evaluate AGE
  before adding another persistent service. Include contention with the
  existing transactional workload and the extension upgrade path.
- **Embedded analytical exploration:** try LadybugDB, already present in
  this site's [technology stack](../stack.md). Compare application integration
  and representative graph queries rather than server feature counts.
- **A graph that requires distributed storage:** compare JanusGraph and
  NebulaGraph with the intended topology. Budget their dependencies and
  establish an acceptable maintenance and recovery plan.
- **Documents and relationships belong in one application model:** include
  OrientDB. Verify that combining models simplifies the actual application.

For a small fixed hierarchy, first test a relational model and recursive
queries on the database already operated. Adding a graph service should
solve a demonstrated query or modeling problem.

## Version and operating notes

??? info faq-item "Neo4j — the edition changes the availability design"
    The [operations manual](https://neo4j.com/docs/operations-manual/current/introduction/)
    distinguishes single-instance Community from Enterprise clustering,
    failover and online backups. The [code license](https://github.com/neo4j/neo4j/blob/2026.07.1/LICENSE.txt)
    covers the reviewed Community source.

    Trial import, transactions, constraints and restoration with the actual
    edition. Check the Cypher version and driver combination. Including a
    capability from an Enterprise demonstration in a Community operating
    plan would leave a gap precisely when recovery is needed.

??? info faq-item "AGE — pin the extension to PostgreSQL"
    The [project overview](https://age.apache.org/overview/) describes graph
    querying integrated with PostgreSQL. The [download matrix](https://age.apache.org/download/)
    identifies different AGE releases for different PostgreSQL majors.
    This review uses the [1.8.0 release for PostgreSQL 18](https://github.com/apache/age/releases/tag/PG18%2Fv1.8.0-rc0),
    published on GitHub on 2026-07-09 under a tag that keeps an rc0 suffix;
    the download page still listed 1.7.0 at review time.

    Test SQL/Cypher composition, data types, permissions and query plans on
    that pairing. Recover both relational and graph data, then rehearse the
    extension and PostgreSQL upgrade. Cypher syntax support is not automatic
    compatibility with every Neo4j procedure or query.

??? info faq-item "JanusGraph — the backend is part of the choice"
    [JanusGraph](https://docs.janusgraph.org/) uses the property-graph model
    through TinkerPop and Gremlin, with configurable storage and indexing
    backends. Its [license file](https://github.com/JanusGraph/janusgraph/blob/v1.1.0/LICENSE.txt)
    distinguishes Apache-licensed code from documentation licensing.

    Choose the backend before evaluating consistency and failure behavior.
    Recover graph data and indexes together; test traversal results during
    reindexing. The reviewed 1.1.0 release is from 2024, so maintenance and
    supported dependency versions need explicit acceptance criteria.

??? info faq-item "LadybugDB — embedded deployment changes responsibility"
    The [manual](https://docs.ladybugdb.com/) describes an embedded,
    columnar property-graph engine with Cypher and transactional support.
    Its process and data-file lifecycle belong to the application.

    Test concurrent application requests, memory pressure and a process
    interruption during a write. Restore the files and reconcile edges as
    well as nodes. Evaluate the documented Cypher differences before
    treating an existing Neo4j application as portable.

??? info faq-item "NebulaGraph — query, metadata and storage fail differently"
    The [3.8 manual](https://docs.nebula-graph.io/3.8.0/1.introduction/1.what-is-nebula-graph/)
    describes a distributed graph with nGQL and separate service roles.
    Its openCypher-related syntax needs feature-level migration checks.

    Rehearse loss of a storage node and metadata service, and measure the
    effect of high-degree vertices. Verify the backup tooling for the
    exact deployment. Review release age and the dependency support path;
    an unarchived repository alone does not settle those questions.

??? info faq-item "OrientDB — validate the combined data model"
    The [project](https://github.com/orientechnologies/orientdb/tree/3.2.56)
    combines document and graph models. Its
    [3.2 documentation](https://orientdb.dev/docs/3.2.x/) covers the server
    and database operating model.

    Trial a document update that changes relationships and a traversal that
    crosses document classes. Confirm transaction boundaries and restore
    behavior. Compare the final application model, not an isolated traversal
    against a product configured for a different workload.

??? info faq-item "ArcadeDB — many query languages, one set of tests"
    **Reviewed: [26.9.1, released 2026-09-03](https://github.com/ArcadeData/arcadedb/tree/26.9.1).** A conceptual fork of
    OrientDB, ArcadeDB is a multi-model engine with graph, document,
    key/value, time-series and vector models, queried through SQL, OpenCypher,
    Gremlin and HTTP/JSON, with PostgreSQL, MongoDB and Redis wire protocols as
    optional modules ([documentation](https://docs.arcadedb.com/)). The
    repository is Apache-2.0 with monthly releases and no enterprise edition.

    Run the traversals you actually need through the language you will use,
    then restore a backup and repeat them. Protocol compatibility is a
    starting point, not proof that a Neo4j or MongoDB workload behaves the
    same.

## Other names need a license check

The reviewed [Memgraph license](https://github.com/memgraph/memgraph/blob/v3.12.0/LICENSE)
uses BSL and enterprise terms. [FalkorDB](https://github.com/FalkorDB/FalkorDB/blob/v4.20.4/LICENSE.txt)
uses SSPL, and the current [ArangoDB license](https://github.com/arangodb/arangodb/blob/devel/LICENSE)
uses BSL. They should be evaluated under those exact terms, separately from
the open-source shortlist above. Public source code and free downloads do
not establish the same license rights.

## Graphs, vectors and Graph RAG

A graph traversal answers questions about explicit relationships. Vector
retrieval finds candidates by similarity. Some products offer both, but
the query semantics and evaluation targets remain different.

For Graph RAG, test whether relationships improve retrieval on judged
questions. Preserve the provenance of extracted facts, handle conflicting
claims, and enforce permissions while expanding paths. A plausible generated
relationship is not an authoritative fact. Compare against the same
[vector-retrieval baseline](vector-databases.md).

## A trial that can change the decision

Use accounts, transactions and ownership relationships with skewed degrees.

1. **Correctness:** include cycles, duplicate edges, deleted nodes and
   multi-step updates; check the expected paths and transaction outcomes.
2. **Queries:** test bounded traversals, high-degree vertices and the actual
   filters. Record tail latency with concurrent writes and representative indexes.
3. **Authorization:** prevent cross-tenant path expansion and inspect exports,
   procedures and direct query access.
4. **Recovery:** restore nodes, relationships, indexes, schema and access
   settings, then reconcile against the source data.
5. **Exit:** export identities and relationships, port representative queries
   and measure the effort required to preserve their meaning.

## Follow the data

[Orchestration](workflow-orchestrators.md) coordinates ingestion;
[transformation](data-transformation.md) normalizes entities and identifiers.
Use [observability](observability.md) to detect stale graph projections, and
keep [object storage](object-storage.md) for source and recovery artifacts.
