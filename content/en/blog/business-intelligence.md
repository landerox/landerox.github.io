---
title: "BI and data visualization"
reviewed: 2026-10-15
description: "Compare Apache Superset, Metabase, Lightdash, Evidence and Redash: BI workflows, open-source editions, permissions, embedding and operating costs."
hide:
  - toc
icon: material/chart-box-outline
---

<!-- markdownlint-disable MD013 -->

# :material-chart-box-outline: BI and data visualization

> Choose for the people asking questions and the data they may access.

A SQL analyst exploring a warehouse, a business team building dashboards
and a customer viewing an embedded report need different interfaces and
permission models. I would evaluate those workflows before counting charts.
The database still executes the analytical workload; BI adds its own
metadata, identities, cached results and publishing responsibilities.

<figure class="architecture-diagram architecture-overview">
  <ol class="architecture-flow" role="list">
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">01</span>
      <strong class="architecture-stage__title">Datasets and metrics</strong>
      <p>Curated tables, semantic models or versioned SQL queries define dimensions, measures and joins so teams share consistent definitions.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">02</span>
      <strong class="architecture-stage__title">Identity and permissions</strong>
      <p>SSO, role-based access, row-level filters and database credentials determine whether queries run as a shared service role or the viewer.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">03</span>
      <strong class="architecture-stage__title">Query pushdown and cache</strong>
      <p>The BI layer compiles visual explorations or SQL into warehouse queries, manages async workers and caches results without leaking tenant data.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">04</span>
      <strong class="architecture-stage__title">Dashboards, reports and embeds</strong>
      <p>Interactive charts, scheduled deliveries, Markdown-as-code reports and signed embeds reach internal readers or external customers.</p>
    </li>
  </ol>
  <figcaption>Four responsibilities between an analytical database and a reader. Metric governance, identity propagation and cache boundaries separate BI tools.</figcaption>
</figure>

## At a glance

**Sources reviewed: October 2026**, from official repositories, releases and
documentation. Each rating (1–5) is an editorial readiness score for the fit
in its row; the breakdown sits under the table and the
[method](index.md#how-i-rate-tools) on the Blog index.

| Project | Rating | Core license | I would shortlist it for | Main constraint |
| :--- | :--- | :--- | :--- | :--- |
| [Apache Superset 6.1.0](https://github.com/apache/superset/tree/6.1.0) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0 | SQL exploration and shared dashboards over several analytical engines | Metadata, workers, caches and database permissions need an operating plan. |
| [Metabase 0.64.1](https://github.com/metabase/metabase/tree/v0.64.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | AGPLv3 for Open Source Edition | Business users combining a visual query builder with SQL questions | Advanced governance and embedding capabilities depend on the edition and terms. |
| [Redash 26.9.0](https://github.com/getredash/redash/tree/v26.9.0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | BSD-2-Clause | SQL-led teams sharing queries, charts and dashboards | Scheduling, workers, query results and source credentials need maintenance. |
| [Lightdash 2.586.0](https://github.com/lightdash/lightdash/tree/2.586.0) | <span class="tool-rating" data-rating="3"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3/5</span></span> | MIT core; enterprise exceptions | Exploration built around modeled dimensions and metrics, especially with dbt | Model ownership and the exact open-core feature set must fit the deployment. |
| [Evidence 40.1.8](https://github.com/evidence-dev/evidence/releases/tag/%40evidence-dev/evidence%4040.1.8) | <span class="tool-rating" data-rating="3"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3/5</span></span> | MIT framework | Authored data reports using SQL and Markdown | Publishing and access control must protect the data shipped with the report. |

??? info faq-item "How each rating was computed"
    Five criteria worth 0, 0.5 or 1 point each. Caps: archived upstream 1,
    no stable release in 18 months 2, no general-availability release 2.5.
    "Open edition" scores what the open-source edition includes without a
    paid tier. Scored in October 2026 from the official repository, releases
    and documentation; the method is on the
    [Blog index](index.md#how-i-rate-tools).

    | Project | Maintenance | Open edition | Maturity | Operations | Interoperability | Rating |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Apache Superset | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | Cube | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | Metabase | 1 | 0.5 | 1 | 0.5 | 1 | 4 |
    | Redash | 0.5 | 1 | 0.5 | 0.5 | 1 | 3.5 |
    | Lightdash | 1 | 0.5 | 0.5 | 0.5 | 0.5 | 3 |
    | Evidence | 0.5 | 0.5 | 0.5 | 1 | 0.5 | 3 |

## Start with the reader

- **SQL analysts exploring multiple sources:** shortlist Superset and
  Redash. Test the real database drivers, query limits and dashboard workload.
- **Business users who need guided exploration:** start with Metabase and
  trial a real question with the intended users. Verify the controls in the
  Open Source Edition before including paid features in the design.
- **A team already governing metrics with dbt:** compare Lightdash against
  the existing semantic definitions and ownership process. Reconcile joins,
  filters and metric names before choosing the presentation layer.
- **A report with a curated explanation and reproducible publication:**
  consider Evidence. Treat the generated data assets as part of the published
  artifact, with an explicit audience and access boundary.
- **Analytics embedded in a customer application:** evaluate tenant isolation,
  identity propagation and licensing first. An iframe alone does not establish
  an authorization boundary.

## Version and operating notes

??? info faq-item "Superset — protect both the application and the database"
    The [reviewed repository](https://github.com/apache/superset/tree/6.1.0)
    describes visual exploration, SQL Lab and database connectivity. Its
    [security guidance](https://superset.apache.org/docs/security/)
    explains permissions and row-level restrictions.

    Use a database identity with only the required privileges. Test cached
    results, SQL access and exports with two users who should see different
    data. Back up the application metadata as well as the analytical source;
    dashboards and permissions are not reconstructed from warehouse tables.

??? info faq-item "Metabase — identify the edition and embedding terms"
    The [license file](https://github.com/metabase/metabase/blob/v0.64.1/LICENSE.txt)
    distinguishes AGPL code and binaries from enterprise artifacts.
    The [licensing page](https://www.metabase.com/license) documents separate
    embedding options and commercial terms.

    Trial the question builder, SQL editor and sharing workflow with the
    intended audience. Check the exact edition for tenant isolation, audit
    information and identity integration. Recover the application database
    and verify saved questions, permissions and scheduled deliveries.

??? info faq-item "Lightdash — keep metrics and application changes coordinated"
    The [project](https://github.com/lightdash/lightdash/tree/2.586.0)
    connects governed metrics and dimensions to interactive exploration.
    Its [license](https://github.com/lightdash/lightdash/blob/2.586.0/LICENSE)
    makes the core MIT, with an enterprise directory under separate terms.

    Change a metric definition and a join while existing dashboards still
    reference them. Check review, preview and rollback in the actual
    deployment. Validate the dbt integration and supported adapters without
    assuming every feature in the hosted product ships in the core.

??? info faq-item "Evidence — review the published data artifact"
    [Evidence Core](https://docs.evidence.dev/) builds data applications from
    SQL and Markdown. Its MIT framework and hosted Studio have distinct
    feature scopes; Studio-specific capabilities are identified in the docs.

    Inspect the built artifact and browser requests with a reader account.
    Hiding a chart or navigation item does not remove its underlying data.
    Trial updates, failure during publication and recovery of the previous
    report. Verify the documentation matches the chosen framework generation.

??? info faq-item "Redash — operate the query execution path"
    The [self-hosted project](https://github.com/getredash/redash/tree/v26.9.0)
    supports saved queries, visualizations and dashboards. The
    [documentation](https://redash.io/help/) separates user workflows from
    operating a self-hosted instance.

    Test a long-running query, unavailable data source and expired credential.
    Check which results survive in caches and who can export them. Budget
    the application database, queue and workers, not only the web process.

## Where Cube and Grafana fit

[Cube 1.8.6](https://github.com/cube-js/cube/tree/v1.8.6) <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> is a semantic
layer for exposing modeled data through APIs and SQL. Its
[code licensing](https://github.com/cube-js/cube/blob/v1.8.6/LICENSE) combines
Apache-2.0 and MIT by package. It can support an analytics application;
it is not the same deliverable as a complete self-service BI interface.

[Grafana](observability.md) belongs primarily in the observability comparison
here. It can query SQL sources, but incident investigation, time-series
dashboards and business metric governance are different evaluation scenarios.

## Candidates to watch

[Rill](https://github.com/rilldata/rill/tree/v0.90.5) (Apache-2.0; 0.90.5,
released 2026-10-09) defines dashboards, a semantic layer and security
policies as YAML and SQL, querying OLAP engines such as ClickHouse and
DuckDB. It is not rated yet: I have not reviewed what the open-source edition
includes against Rill Cloud under the criteria above.

## A trial that can change the decision

Use one revenue model, two tenants and a representative business question.

1. **Correctness:** reconcile totals, time zones, nulls, filters and join
   fan-out with a reference query.
2. **Authorization:** verify dashboards, direct query access, exports,
   cached results and embedded views after revoking a user's permission.
3. **Usability:** observe intended users completing the question; record
   errors and assistance required, not only elapsed time.
4. **Recovery:** restore metadata, identities, connections and reports,
   then confirm scheduled delivery reaches the correct audience.
5. **Cost:** measure source-database work, refresh frequency, cache storage
   and operating effort with representative concurrency.

## Follow the data

[Transformation](data-transformation.md) defines trusted models;
[OLAP engines](olap-databases.md) execute analytical queries. The
[table format](lakehouse-table-formats.md) governs lakehouse state, while
[observability](observability.md) helps detect stale reports and failures.
Start with the smallest combination that meets the reader's requirements.
