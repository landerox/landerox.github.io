---
reviewed: 2026-09-23
description: "Qdrant, Milvus, Weaviate, pgvector, Chroma, LanceDB, Vespa and Redis compared: open-source licenses, filtered retrieval, deployment and recovery."
hide:
  - toc
icon: material/vector-polyline
---

<!-- markdownlint-disable MD013 -->

# :material-vector-polyline: Open-Source Vector Databases

> Choose with your filters, permissions and recovery path in the test.

A successful nearest-neighbor query is a starting point. A retrieval service
also has to exclude unauthorized documents, reflect updates and preserve
search quality under load. I would make those requirements visible before
choosing a dedicated vector server or extending an existing database.

## Comparison at a glance

**Sources reviewed: September 2026**, from official repositories, releases and
documentation. Each rating (1–5) is an editorial readiness score for the fit
in its row; the breakdown sits under the table and the
[method](index.md#how-i-rate-tools) on the Blog index.

| Project | Rating | Core license | I would shortlist it for | Main constraint |
| :--- | :--- | :--- | :--- | :--- |
| [Qdrant 1.19.1](https://github.com/qdrant/qdrant/tree/v1.19.1) | <span class="tool-rating" data-rating="5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">5/5</span></span> | Apache-2.0 | Dedicated vector retrieval with metadata filters | Payload indexes, shard placement and recovery need explicit design. |
| [Redis 8.10.2](https://github.com/redis/redis/tree/8.10.2) | <span class="tool-rating" data-rating="5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">5/5</span></span> | AGPLv3 option; RSALv2/SSPLv1 alternatives | Vector search where Redis is already part of the platform | Verify the selected license, memory budget and exact query/deployment feature set. |
| [Weaviate 1.39.6](https://github.com/weaviate/weaviate/tree/v1.39.6) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | BSD-3-Clause | Object collections, hybrid retrieval and tenant-oriented workloads | Modules, tenant lifecycle and backup coverage must match the deployment. |
| [pgvector 0.8.6](https://github.com/pgvector/pgvector/tree/v0.8.6) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | PostgreSQL license | Vectors beside transactional data already in PostgreSQL | ANN indexes compete for database resources; selective filters need tuning. |
| [Milvus 3.0.2](https://github.com/milvus-io/milvus/tree/v3.0.2) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | A vector platform with separate ingestion and query capacity | Standalone and distributed deployments have different operational scope. |
| [Chroma 1.5.9](https://github.com/chroma-core/chroma/tree/1.5.9) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Local retrieval development and a collection-oriented API | Local, single-node and distributed architectures are different deployments. |
| [LanceDB 0.39.0](https://github.com/lancedb/lancedb/tree/v0.39.0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Embedded multimodal retrieval over local or object storage | OSS embedding does not include the managed serving layer of Enterprise. |
| [Vespa 8.753.16](https://github.com/vespa-engine/vespa/tree/v8.753.16) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Search applications combining retrieval and custom ranking | Schemas, ranking profiles and serving infrastructure need dedicated ownership. |

??? info faq-item "How each rating was computed"
    Five criteria worth 0, 0.5 or 1 point each. Caps: archived upstream 1,
    no stable release in 18 months 2, no general-availability release 2.5.
    "Open edition" scores what the open-source edition includes without a
    paid tier. Scored in September 2026 from the official repository, releases
    and documentation; the method is on the
    [Blog index](index.md#how-i-rate-tools).

    | Project | Maintenance | Open edition | Maturity | Operations | Interoperability | Rating |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Qdrant | 1 | 1 | 1 | 1 | 1 | 5 |
    | Redis | 1 | 1 | 1 | 1 | 1 | 5 |
    | Weaviate | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | pgvector | 1 | 1 | 0.5 | 1 | 1 | 4.5 |
    | Milvus | 1 | 1 | 1 | 0 | 1 | 4 |
    | Chroma | 1 | 0.5 | 0.5 | 1 | 0.5 | 3.5 |
    | LanceDB | 1 | 0.5 | 0.5 | 1 | 0.5 | 3.5 |
    | Vespa | 1 | 1 | 1 | 0 | 0.5 | 3.5 |

The [pgvector license](https://github.com/pgvector/pgvector/blob/v0.8.6/LICENSE)
is the permissive PostgreSQL license. Redis 8's
[license file](https://github.com/redis/redis/blob/8.10.1/LICENSE.txt)
offers AGPLv3, RSALv2 or SSPLv1 as alternatives. The
[AGPLv3 option is open source](https://spdx.org/licenses/AGPL-3.0-only.html);
do not carry a Redis 7.x licensing assumption into a Redis 8 decision.

## Start with the workload

- **Existing PostgreSQL application:** start with pgvector when joins,
  transactions and one recovery boundary are valuable. Compare a dedicated
  service when representative load demonstrates a reason to separate it.
- **Dedicated retrieval with restrictive metadata filters:** start with
  Qdrant and include those filters from the first trial. Compare Milvus for
  a distributed platform with independently sized ingestion and query work.
- **Collections, hybrid retrieval and many tenants:** include Weaviate.
  Treat tenant isolation and lifecycle as acceptance criteria, not an
  assumption inferred from a collection name.
- **Local development or retrieval embedded in a service:** compare Chroma
  and LanceDB. Decide early whether production needs an embedded library,
  a single server or a distributed service.
- **Ranking is a core application capability:** include Vespa. If Redis
  already holds relevant application data, test its vector query path before
  introducing another service solely for similarity search.

For [RAG](../glossary.md#rag), the database is one part of retrieval.
Chunking, embedding choice, lexical matching, reranking and access rules can
change answer quality even when the storage engine stays the same.

## Version and operational notes

??? info faq-item "Qdrant — index the filters as well as the vectors"
    Qdrant documents [payload filtering](https://qdrant.tech/documentation/search/filtering/)
    and [hybrid, multi-stage queries](https://qdrant.tech/documentation/search/hybrid-queries/).
    Payload indexes should reflect the fields used to restrict searches.

    I would benchmark tenant, document-state and date filters together, with
    the expected selectivity. Test updates and deletion visibility under
    concurrent reads. Record the selected replication and consistency
    settings, then verify recovery on that topology.

??? info faq-item "Milvus — choose the deployment before estimating its cost"
    The [component reference](https://milvus.io/docs/main_components.md)
    separates serving and coordination roles from storage dependencies. It
    also warns that standalone-to-cluster migration is not an online upgrade.

    I would size and test the exact release architecture rather than copy a
    diagram from an older major version. Rehearse recovery of metadata,
    stored data and the write-ahead path together. A local server trial does
    not measure a distributed deployment's operating cost.

??? info faq-item "Weaviate — tenant state affects recovery"
    The [management guides](https://docs.weaviate.io/weaviate/guides)
    cover hybrid queries, collection configuration and replication.
    [Current backup guidance](https://docs.weaviate.io/deploy/configuration/backups)
    includes active and inactive tenants, but excludes offloaded tenants.

    I would verify every tenant state during a restore, with the production
    backup provider. Pin client and server versions together. If a configured
    vectorizer calls an external model service, include its credentials,
    data flow and failure behavior in the architecture.

??? info faq-item "pgvector — filtered ANN needs a real query plan"
    The [reviewed README](https://github.com/pgvector/pgvector/tree/v0.8.6)
    documents exact search, HNSW, IVFFlat and iterative index scans.
    Approximate scans can return too few results when filtering removes
    candidates; tuning and iterative scanning matter.

    I would inspect the actual query plan with tenant filters, concurrent
    writes and index maintenance. Keep PostgreSQL backups and recovery in
    the trial. An extension avoids a second service but does not provide
    unlimited database capacity.

??? info faq-item "Chroma — preserve the API, re-evaluate the deployment"
    Chroma's [architecture overview](https://docs.trychroma.com/reference/architecture/overview)
    distinguishes local, single-node and distributed modes. An easy local
    start is useful; each deployment still has its own durability boundary.

    I would test persistence after process loss, collection deletion and
    updates, then document the production authentication and recovery path.
    Compare the exact server version and client API used by the application.

??? info faq-item "LanceDB — separate embedded storage from managed serving"
    OSS can use [local or cloud object storage](https://docs.lancedb.com/storage/configuration).
    The [Enterprise comparison](https://docs.lancedb.com/enterprise)
    distinguishes embedding OSS in your service from managed distributed
    serving and operations.

    I would measure object-store reads, cold-query latency and index
    maintenance in the intended environment. Using S3 does not itself supply
    application authentication, a query service or a recovery policy for
    the service embedding the library.

??? info faq-item "Vespa — retrieval and ranking form an application"
    The [nearest-neighbor reference](https://github.com/vespa-engine/documentation/blob/master/en/querying/nearest-neighbor-search.md)
    combines vector retrieval with query filters and ranking profiles.
    This is useful when the application needs to own how candidates are
    selected and scored.

    I would test the entire ranking pipeline, including model inference
    where used, under the real query mix. Budget for schema evolution,
    document feeding and operating the serving cluster.

??? info faq-item "Redis — specify the vector query path"
    The [vector search reference](https://redis.io/docs/latest/develop/ai/search-and-query/vectors/)
    documents index and distance choices. Redis offers several related
    capabilities; name the commands and indexes your application requires.

    I would verify memory use, persistence, eviction behavior and query
    routing in the chosen deployment. Check OSS support for each required
    feature instead of assuming parity with a commercial service. Pin the
    Redis version and chosen license together.

## A trial that can change the decision

Keep documents, embedding model, dimensions, distance metric and queries
constant. Compare configurations at a stated quality target.

1. **Two quality measurements:** measure ANN recall against exact nearest
   neighbors from the same filtered dataset. Separately score retrieval
   relevance using judged documents; exact vector neighbors are not
   automatically useful answers.
2. **Permissions:** test restrictive tenant and document filters before
   results leave the service. A client-supplied tenant value is not an
   authorization boundary by itself.
3. **Change visibility:** insert, update and delete while querying. Measure
   when the expected change becomes visible, including after replica failure.
4. **Recovery and model migration:** restore into a clean environment.
   Preserve source documents, chunk IDs and embedding versions; rehearse
   rebuilding an index with a new model without mixing incompatible vectors.
5. **Cost at the same quality:** compare p95 latency and throughput while
   ingesting, with indexes, replicas, payloads and cold storage included.

For scale intuition, one million 768-dimensional float32 vectors occupy
about **2.86 GiB of raw values**. That excludes indexes, metadata, replicas,
logs and runtime overhead; it is not a RAM sizing recommendation.

## Complete the data path

Use [object storage](object-storage.md) for the source material and recovery
artifacts, an [orchestrator](workflow-orchestrators.md) for versioned ingestion,
and an [OLAP database](olap-databases.md) when the question is analytical
aggregation. Choose each layer for a measured requirement.

The [technical glossary](../glossary.md#rag) explains RAG and related
concepts with examples and primary sources.

[Graph databases](graph-databases.md) complement similarity search with
explicit relationships and traversals. That comparison also covers Graph RAG
and why combining both models still requires provenance and access checks.
