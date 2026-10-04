---
reviewed: 2026-09-23
description: "Airflow, Dagster, Prefect, Kestra and Argo Workflows compared: execution model, open-source licenses, recovery and operational cost."
hide:
  - toc
icon: material/source-branch
---

<!-- markdownlint-disable MD013 -->

# :material-source-branch: Workflow Orchestrators

> Choose around the work you must repeat safely.

A nightly warehouse load, a partitioned data product and a container training
job need different kinds of coordination. I would select the execution model
first, then compare scheduling, recovery and the edition the team can operate.

## Comparison at a glance

**Sources reviewed: September 2026**, from official repositories, releases and
documentation. Each rating (1–5) is an editorial readiness score for the fit
in its row; the breakdown sits under the table and the
[method](index.md#how-i-rate-tools) on the Blog index.

| Project | Rating | Core license | I would shortlist it for | Main constraint |
| :--- | :--- | :--- | :--- | :--- |
| [Airflow 3.3.2](https://github.com/apache/airflow/tree/3.3.2) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0 | Scheduled data workflows with explicit task dependencies | Scheduler, metadata database and execution infrastructure need coordinated upgrades. |
| [Argo Workflows 4.1.4](https://github.com/argoproj/argo-workflows/tree/v4.1.4) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0 | Container steps on an existing Kubernetes platform | Kubernetes operations and artifact storage come with the choice. |
| [Dagster 1.13.24](https://github.com/dagster-io/dagster/tree/1.13.24) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Data assets whose dependencies and materializations matter | Adopting an asset model is an engineering change, not just a scheduler swap. |
| [Prefect 3.8.6](https://github.com/PrefectHQ/prefect/tree/3.8.6) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Python workflows with ordinary control flow | Production deployments still need a server and an execution/recovery plan. |
| [Kestra 2.0.3](https://github.com/kestra-io/kestra/tree/v2.0.3) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Declarative workflows connecting scripts, services and events | Plugins, metadata and internal storage are part of the operating boundary. |
| [Windmill 1.817.0](https://github.com/windmill-labs/windmill/tree/v1.817.0) | <span class="tool-rating" data-rating="3"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3/5</span></span> | AGPLv3 source build; exceptions | Scripts, internal automation and operator interfaces | Distributed Community Edition binaries include proprietary code and extra terms. |

??? info faq-item "How each rating was computed"
    Five criteria worth 0, 0.5 or 1 point each. Caps: archived upstream 1,
    no stable release in 18 months 2, no general-availability release 2.5.
    "Open edition" scores what the open-source edition includes without a
    paid tier. Scored in September 2026 from the official repository, releases
    and documentation; the method is on the
    [Blog index](index.md#how-i-rate-tools).

    | Project | Maintenance | Open edition | Maturity | Operations | Interoperability | Rating |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Airflow | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | Argo Workflows | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | Dagster | 1 | 0.5 | 1 | 0.5 | 1 | 4 |
    | Temporal | 1 | 1 | 1 | 0.5 | 0.5 | 4 |
    | Prefect | 1 | 0.5 | 1 | 0.5 | 0.5 | 3.5 |
    | Kestra | 1 | 0.5 | 1 | 0.5 | 0.5 | 3.5 |
    | Windmill | 1 | 0.5 | 0.5 | 0.5 | 0.5 | 3 |

[AGPLv3 is an open-source license](https://spdx.org/licenses/AGPL-3.0-only.html).
It belongs in the comparison alongside permissive licenses. A free download
alone does not establish an open-source distribution; Windmill's boundary is
explained below.

## Start with the workload

- **An existing Airflow estate:** keep Airflow on the shortlist when its
  integrations and operating knowledge already solve the problem. Require a
  concrete improvement in recovery or development effort before migrating
  every DAG.
- **A warehouse organized around tables and models:** start with Dagster
  when operators need to reason about which data exists, its dependencies
  and which partitions to rebuild. Compare Airflow when task scheduling is
  the clearer ownership model.
- **A Python application becoming a managed pipeline:** start with Prefect.
  Preserve ordinary Python composition, but make deployments, task state,
  result persistence and cancellation explicit.
- **Mixed languages and event-driven automation:** compare Kestra's
  declarative flows with Windmill's script-oriented approach. Verify the
  exact edition for identity, audit and deployment requirements.
- **A platform already built on Kubernetes:** compare Argo Workflows when
  steps naturally map to containers. Include pod startup, quotas, service
  accounts and artifact retention in the evaluation.

These are shortlists, not mutually exclusive feature boundaries. Airflow
also supports assets, and Dagster also supports jobs and ops. The distinction
is the model I would make central to the team's operating practice.

## Version and operational notes

??? info faq-item "Airflow — own the control plane and the tasks separately"
    The [Airflow architecture](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html)
    separates scheduling, DAG processing, the API server, metadata and task
    execution. Executor selection changes where work runs; it does not remove
    responsibility for the other components.

    I would rehearse a failed task after its external write has succeeded.
    Check the result in the destination, not only the green DAG state.
    Bound concurrent backfills so rebuilding yesterday's data cannot starve
    today's runs. Pin provider packages alongside the Airflow version.

??? info faq-item "Dagster — model the data that must exist"
    [Assets](https://docs.dagster.io/guides/build/assets) describe persisted
    objects and the code that produces them. That makes dependencies and
    materialization meaningful units for a data platform.

    I would test a partial rebuild after changing upstream logic: which
    partitions run, which outputs are replaced and which checks block
    downstream work. Budget for adopting this model. Check the OSS boundary
    separately from features labeled Dagster+ in the documentation.

??? info faq-item "Prefect — Python control flow still needs operational contracts"
    [Flows](https://docs.prefect.io/v3/concepts/flows) wrap Python functions
    with tracked state, parameters, retries and deployment capabilities.
    This is useful when branching and composition already live in Python.

    I would test worker disappearance, cancellation and a deployment that
    references the wrong code version. Decide where results and logs survive
    process loss. A local successful function call does not exercise the
    server and infrastructure used by scheduled production runs.

??? info faq-item "Kestra — account for plugins and storage"
    The [architecture reference](https://kestra.io/docs/architecture)
    distinguishes JDBC and Kafka backends, execution components and internal
    storage. Match those components to the chosen OSS or enterprise edition.
    [Kestra 2.0](https://github.com/kestra-io/kestra/releases/tag/v2.0.0)
    shipped on 2026-09-07 (2.0.3 reviewed here) while 1.3.x still receives
    patches. It breaks API clients: errors now use RFC 9457 problem details
    (`application/problem+json`), and flow-level `pluginDefaults` lose the
    `forced` flag. Test integrations and flow defaults before upgrading.

    I would version the flow definition and plugin set together, then restore
    both metadata and referenced artifacts. Exercise an event arriving twice,
    a missing secret and a plugin upgrade that changes output shape.

??? info faq-item "Argo Workflows — the cluster is part of the product"
    [Argo Workflows](https://argo-workflows.readthedocs.io/en/latest/)
    represents container workflows as Kubernetes resources, using steps or
    DAG dependencies. It is separate from Argo CD's deployment reconciliation.

    I would test pod eviction, a full namespace quota and an unavailable
    artifact bucket. Keep large datasets outside workflow object metadata.
    A controller restart, retained artifacts and an application retry are
    distinct recovery concerns.

??? info faq-item "Windmill — inspect the artifact's license"
    The [reviewed LICENSE](https://github.com/windmill-labs/windmill/blob/v1.804.0/LICENSE)
    makes a non-enterprise source build AGPLv3, with Apache-licensed client
    areas. Its published Community Edition images and binaries also contain
    proprietary code with additional restrictions. Treat those artifacts as
    a different licensing boundary.

    The [product introduction](https://www.windmill.dev/docs/intro)
    describes scripts, flows and applications. I would evaluate it for
    operator-facing automation, with worker isolation and secret handling
    included in the trial.

## Where Temporal fits

[Temporal Server 1.32.0](https://github.com/temporalio/temporal/tree/v1.32.0) <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span>
uses the MIT license. Its
[durable workflow execution and replay model](https://docs.temporal.io/workflow-execution)
addresses application processes that must resume across failures. I would
evaluate it for a long-lived order or provisioning process with timers and
external interactions.

That changes the comparison: workflow code must respect replay constraints,
and activities still need safe retry behavior. A resumable business process
and a data-asset catalog solve different operating problems. Define which
one you need before treating Temporal as an Airflow replacement.

## Candidates to watch

[Flyte](https://github.com/flyteorg/flyte/tree/v2.0.49) (Apache-2.0; 2.0.49,
released 2026-09-18) is a graduated LF AI & Data project for data and AI
workflows. Its README states that the open-source backend for Flyte 2 is
still coming and points to Union.ai for a production backend today, so I do
not rate Flyte 2 against the self-hosted orchestrators above yet. I would
revisit it when that backend ships.

## A trial that can change the decision

Use one representative pipeline: ingest files, validate a partition, load an
analytical table and refresh a search index. Fix the code version and input
snapshot, then record these outcomes for every candidate:

1. **Repeatability:** rerun the same partition twice and count external
   effects. Give writes an [idempotency contract](../glossary.md#idempotency).
2. **Recovery:** terminate a worker after a write but before completion is
   recorded. Restore the control database and locate the surviving output.
3. **Backfill isolation:** rebuild an older window while current runs
   continue. Measure queue time and resource contention separately.
4. **Change safety:** deploy a new workflow version with old runs in flight,
   then rehearse rollback, credential rotation and cancellation.
5. **Operating cost:** record idle services, storage, worker startup,
   maintenance effort and time to diagnose one failed run.

Set acceptable thresholds before the trial. A scheduler can launch work that
misses every data-freshness objective; define the
[SLO](../glossary.md#slo) around usable output.

## Complete the data path

Pair the orchestrator with the relevant
[object store](object-storage.md),
[OLAP engine](olap-databases.md) and
[vector search system](vector-databases.md).
The [Failure Lab](../projects/tools.md#failure-lab) illustrates bounded retries
and backoff locally; it is a learning model, not a benchmark of these projects.

Compare [transformation tools](data-transformation.md) for model changes and
backfills, and [observability](observability.md) for detecting failures and
stale outputs across the pipeline.
