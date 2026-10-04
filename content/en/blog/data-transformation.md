---
reviewed: 2026-09-23
description: "Compare dbt 1.12 and 2.0, SQLMesh, Dataform Core and Bruin: SQL modeling, incremental changes, deployment, open-source licenses and recovery."
hide:
  - toc
icon: material/table-arrow-right
---

<!-- markdownlint-disable MD013 -->

# :material-table-arrow-right: Data transformation and modeling

> Choose by how safely a change becomes trusted data.

A scheduler can start a job successfully while the resulting table contains
duplicate revenue. Transformation tools describe models, dependencies and
checks; their deployment model determines how changes reach consumers.
I would compare that lifecycle before comparing command syntax.

## At a glance

**Sources reviewed: September 2026**, from official repositories, releases and
documentation. Each rating (1–5) is an editorial readiness score for the fit
in its row; the breakdown sits under the table and the
[method](index.md#how-i-rate-tools) on the Blog index.

| Project | Rating | Core license | I would shortlist it for | Main constraint |
| :--- | :--- | :--- | :--- | :--- |
| [dbt Core 1.12.5](https://github.com/dbt-labs/dbt/tree/v1.12.5) | <span class="tool-rating" data-rating="5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">5/5</span></span> | Apache-2.0 | SQL modeling with an existing dbt project and any v1 adapter | Adapter, packages, incremental strategy and job execution need their own compatibility checks. |
| [dbt 2.0.5 · dbt-oss](https://github.com/dbt-labs/dbt/tree/v2.0.5) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | A new or proven-to-migrate project on Snowflake, BigQuery, Databricks, Redshift or DuckDB that wants one binary and parse-time validation | Five GA adapters, with Spark and ClickHouse still in beta; static analysis, full LSP and `dbt lint` ship in the product-licensed `dbt` build, not `dbt-oss`. |
| [SQLMesh 0.236.2](https://github.com/SQLMesh/sqlmesh/tree/v0.236.2) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Planning model changes, interval backfills and environment promotion | Model state and virtual environments become part of the operating contract. |
| [Dataform Core 3.0.70](https://github.com/dataform-co/dataform/tree/3.0.70) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | SQLX transformations in a BigQuery-centered platform | The open-source framework and Google Cloud's managed service have different deployment scopes. |
| [Bruin 0.11.762](https://github.com/bruin-data/bruin/tree/v0.11.762) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | One project combining SQL, Python, ingestion and quality checks | Its broader pipeline scope needs explicit boundaries with an existing orchestrator. |

??? info faq-item "How each rating was computed"
    Five criteria worth 0, 0.5 or 1 point each. Caps: archived upstream 1,
    no stable release in 18 months 2, no general-availability release 2.5.
    "Open edition" scores what the open-source edition includes without a
    paid tier. Scored in September 2026 from the official repository, releases
    and documentation; the method is on the
    [Blog index](index.md#how-i-rate-tools).

    | Project | Maintenance | Open edition | Maturity | Operations | Interoperability | Rating |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | dbt Core 1.12 | 1 | 1 | 1 | 1 | 1 | 5 |
    | dbt 2.0 (dbt-oss) | 1 | 1 | 0.5 | 1 | 0.5 | 4 |
    | SQLMesh | 1 | 1 | 0.5 | 0.5 | 1 | 4 |
    | Dataform Core | 1 | 1 | 0.5 | 1 | 0.5 | 4 |
    | Bruin | 1 | 1 | 0.5 | 1 | 0.5 | 4 |

All five reviewed cores use a permissive license. Check the terms of
commercial services and adjacent runtimes separately.

## Start with the workload

- **A working dbt estate:** keep dbt Core 1.12 on the shortlist; v1 remains
  fully supported. Require evidence that a migration improves change safety,
  recovery or operating effort. Port packages, macros, tests and adapter
  behavior in the trial, whether the target is dbt 2.0 or another tool.
- **A new project on a v2 adapter:** start on dbt 2.0 when the warehouse is
  Snowflake, BigQuery, Databricks, Redshift or DuckDB. Decide up front whether
  jobs run `dbt-oss` or the product-licensed `dbt` build, and pin it.
- **Frequent changes to partitioned models:** compare SQLMesh's plans and
  environments against the actual dbt deployment process. Include state
  recovery and the cost of historical restatements.
- **BigQuery and an existing Google Cloud operating model:** compare
  Dataform Core and the managed Dataform service separately. Decide which
  execution, identity and repository responsibilities the service owns.
- **A compact mixed SQL/Python pipeline:** try Bruin when ingestion and
  transformation belong in the same repository. Decide whether Bruin or
  an external orchestrator owns retries and scheduling for each step.

## Version and operating notes

??? info faq-item "dbt — pin the line, the build and the adapter"
    dbt v2.0, a ground-up Rust rewrite, reached general availability on
    2026-09-14; [2.0.5](https://github.com/dbt-labs/dbt/releases/tag/v2.0.5)
    was current at review. v1 lives on the
    [`1.latest` branch](https://github.com/dbt-labs/dbt/tree/1.latest) and
    remains fully supported; the reviewed v1 release is
    [1.12.5](https://github.com/dbt-labs/dbt/tree/v1.12.5). Pin the dbt line,
    the build, the database adapter and project packages together. Test
    incremental writes with duplicate and late data, including a schema
    change during a backfill.

    v2 ships as one self-contained binary with compiled drivers. Its
    [adapter lifecycle](https://docs.getdbt.com/docs/supported-data-platforms)
    lists Snowflake, BigQuery, Databricks, Redshift and DuckDB (CLI only) as
    generally available, Apache Spark in beta and ClickHouse in private beta;
    other v1 adapters have no v2 driver yet. The
    [upgrade guide](https://docs.getdbt.com/docs/dbt-versions/dbt-upgrade/upgrading-to-v2)
    removes deprecated functionality and turns unknown configs into parse
    errors. dbt 1.12 can trial the new parser with `--use-v2-parser`, and both
    lines write a compatible manifest, so `state:modified` and `--defer` keep
    working across mixed environments. A new major is still not evidence that
    existing packages or macros work unchanged.

    The v2 row scores maturity at 0.5: the project has a long record, but this
    runtime reached general availability nine days before review and shipped
    five patch releases in its first four days. Interoperability stays at 0.5
    until its adapters cover what v1 does.

??? info faq-item "SQLMesh — protect plans, state and intervals"
    SQLMesh's [model lifecycle](https://sqlmesh.readthedocs.io/en/stable/concepts/overview/)
    includes change plans, backfill intervals, tests and audits. Its virtual
    environments can reuse physical results when appropriate.

    The [state guidance](https://sqlmesh.readthedocs.io/en/stable/faq/faq/)
    identifies persisted model and execution metadata. Restore that state
    with the warehouse objects it references. Test a partial backfill and
    a rollback after a model changes meaning; reverting a view alone does
    not prove that historical data has been corrected.

??? info faq-item "Dataform — distinguish framework and managed service"
    [Dataform Core](https://github.com/dataform-co/dataform/tree/3.0.70)
    provides SQLX and dependency-based compilation. Google's
    [managed Dataform service](https://docs.cloud.google.com/dataform/docs/overview)
    manages workflows that execute SQL in BigQuery.

    Trial compilation with the actual service account and dataset locations.
    Check assertions, release configuration and execution configuration.
    Reproduce an unavailable upstream table and a permission change; a
    successful compilation does not establish runtime access to the data.

??? info faq-item "Bruin — decide who owns each pipeline step"
    The [reviewed Bruin project](https://github.com/bruin-data/bruin/tree/v0.11.762)
    combines ingestion, SQL/Python transformation and data quality in a CLI.
    This overlaps part of an orchestrator's responsibility.

    Run a mixed-language pipeline locally and in its intended execution
    environment. Trace credentials and intermediate outputs, then retry
    after a completed external write. Avoid independent retry policies
    multiplying the same side effect across nested schedulers.

## Where dbt v2 and processing libraries fit

**dbt v2 separates source from distribution.** The former Fusion engine's
code lives in the main [dbt repository](https://github.com/dbt-labs/dbt), where
the v2 source is Apache-2.0; the
[`dbt-fusion` repository](https://github.com/dbt-labs/dbt-fusion) is an archive.
`pip install dbt-oss` installs that
[Apache-2.0 runtime](https://docs.getdbt.com/docs/local/install-dbt-v2): the
dbt language, DAG semantics and the standard commands. The default
`pip install dbt` installs dbt Labs' build under the
[dbt product license](https://www.getdbt.com/dbt-product-license-agreement),
which adds SQL comprehension and static analysis, LSP features, `dbt lint`
and the VS Code extension. Column-level lineage, type checking and impact
analysis also need a dbt platform account, free or paid
([feature availability](https://docs.getdbt.com/docs/dbt/dbt-availability)).
Check which binary a job actually runs before inheriting the Apache label;
this comparison rates `dbt-oss`.

[Ibis 12.0.0](https://github.com/ibis-project/ibis/tree/12.0.0), Polars and
Spark help express or execute transformations. Their role differs from
owning model promotion, backfills and production state. In this site's
[data stack](../stack.md), DuckDB and other engines supply execution while
the modeling layer supplies reproducible change management.

Likewise, [Airflow or Dagster](workflow-orchestrators.md) can coordinate a
transformation job. An orchestrator and a modeling framework can be useful
together; running both requires one clear owner for each responsibility.

## A trial that can change the decision

Use the same orders, customers and daily revenue model for each candidate.
Keep the execution engine and input snapshot fixed.

1. **Correctness:** reconcile revenue after duplicate orders, late arrivals,
   a corrected exchange rate and a deleted customer.
2. **Change impact:** alter a shared model and inspect which dependent
   models rebuild. Compare the resulting data, not only the generated plan.
3. **Recovery:** interrupt a run between writes, restore its metadata and
   resume without duplicating externally visible effects.
4. **Release isolation:** verify that development cannot replace production
   tables or expose unapproved results to dashboards.
5. **Cost:** record warehouse work, temporary storage, backfill duration and
   operator time. Separate compilation speed from query execution time.

## Follow the data

Model the [lakehouse tables](lakehouse-table-formats.md), schedule their
updates with an [orchestrator](workflow-orchestrators.md), and expose useful
results through [OLAP](olap-databases.md) and [BI](business-intelligence.md).
Use [observability](observability.md) to detect stale or failed outputs;
technical success and business correctness need different checks.
