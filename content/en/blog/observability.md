---
reviewed: 2026-09-23
description: "Compare open-source observability by role: Prometheus, Grafana, Mimir, VictoriaMetrics, Thanos, Loki, OpenSearch, Tempo, Jaeger, Pyroscope and collectors."
hide:
  - toc
icon: material/pulse
---

<!-- markdownlint-disable MD013 -->

# :material-pulse: Observability tools and their roles

> Choose the signals needed to investigate a real failure.

Grafana and Prometheus belong in the same observability category, but solve
different parts of the problem. Prometheus collects and stores metrics and
evaluates rules. Grafana queries data sources and provides dashboards,
exploration and alerting. They commonly work together; a single score
comparing one against the other would hide that relationship.

## At a glance

**Sources reviewed: September 2026**, from official repositories, releases and
documentation. Each rating (1–5) is an editorial readiness score for the fit
in its row; the breakdown sits under the table and the
[method](index.md#how-i-rate-tools) on the Blog index.

| Role | Reviewed components | Rating | Core license | What changes the decision |
| :--- | :--- | :--- | :--- | :--- |
| Metrics collection and local queries | [Prometheus 3.14.0](https://github.com/prometheus/prometheus/tree/v3.14.0) | <span class="tool-rating" data-rating="5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">5/5</span></span> | Apache-2.0 | Scrape coverage, active series, local retention and alert rules. |
| Dashboards and exploration | [Grafana 13.2.2](https://github.com/grafana/grafana/tree/v13.2.2) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | AGPLv3 | Data-source permissions, plugins and the selected OSS or commercial edition. |
| Global Prometheus queries and retention | [Thanos 0.42.4](https://github.com/thanos-io/thanos/tree/v0.42.4) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0 | Existing Prometheus topology, deduplication and storage/query components. |
| Logs | [Loki 3.7.8](https://github.com/grafana/loki/tree/v3.7.8) / [OpenSearch 3.8.0](https://github.com/opensearch-project/OpenSearch/tree/3.8.0) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span><br><span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | AGPLv3 / Apache-2.0 | Label-based log exploration versus indexed search and its storage cost. |
| Collection and routing | [OpenTelemetry Collector 0.161.0](https://github.com/open-telemetry/opentelemetry-collector/tree/v0.161.0) / [Alloy 1.19.2](https://github.com/grafana/alloy/tree/v1.19.2) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span><br><span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0 / Apache-2.0 | Receivers, processors, exporters and supported signals in the chosen distribution. |
| Alert notification routing | [Alertmanager 0.34.1](https://github.com/prometheus/alertmanager/tree/v0.34.1) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | Apache-2.0 | Grouping, deduplication, silences and delivery to the responsible team. |
| Long-term metrics | [Mimir 3.2.1](https://github.com/grafana/mimir/tree/mimir-3.2.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | AGPLv3 | Multi-tenant metrics, object storage and distributed operation. |
| Alternative metrics backend | [VictoriaMetrics 1.152.0](https://github.com/VictoriaMetrics/VictoriaMetrics/tree/v1.152.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 core | Single-node versus cluster deployment, query compatibility and enterprise boundaries. |
| Distributed traces | [Tempo 3.0.3](https://github.com/grafana/tempo/tree/v3.0.3) / [Jaeger 2.21.0](https://github.com/jaegertracing/jaeger/tree/v2.21.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span><br><span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | AGPLv3 / Apache-2.0 | Trace investigation, sampling, storage and integration with the existing interface. |
| Continuous profiling | [Pyroscope 2.3.1](https://github.com/grafana/pyroscope/tree/v2.3.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | AGPLv3 server | Language support, collection overhead and investigation of CPU or memory consumption. |
| Integrated observability application | [SigNoz 0.143.0](https://github.com/SigNoz/signoz/tree/v0.143.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | MIT core; enterprise exceptions | A shared investigation workflow, backend operation and the exact edition's controls. |

??? info faq-item "How each rating was computed"
    Five criteria worth 0, 0.5 or 1 point each. Caps: archived upstream 1,
    no stable release in 18 months 2, no general-availability release 2.5.
    "Open edition" scores what the open-source edition includes without a
    paid tier. Scored in September 2026 from the official repository, releases
    and documentation; the method is on the
    [Blog index](index.md#how-i-rate-tools).

    | Project | Maintenance | Open edition | Maturity | Operations | Interoperability | Rating |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Prometheus | 1 | 1 | 1 | 1 | 1 | 5 |
    | Grafana | 1 | 0.5 | 1 | 1 | 1 | 4.5 |
    | Thanos | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | Loki | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | OpenSearch | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | Jaeger | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
    | OpenTelemetry Collector | 1 | 1 | 0.5 | 1 | 1 | 4.5 |
    | Alloy | 1 | 1 | 0.5 | 1 | 1 | 4.5 |
    | Alertmanager | 1 | 1 | 1 | 1 | 0.5 | 4.5 |
    | Mimir | 1 | 1 | 0.5 | 0.5 | 1 | 4 |
    | VictoriaMetrics | 1 | 0.5 | 1 | 1 | 0.5 | 4 |
    | Tempo | 1 | 1 | 0.5 | 0.5 | 1 | 4 |
    | Pyroscope | 1 | 1 | 1 | 0.5 | 0.5 | 4 |
    | SigNoz | 1 | 0.5 | 1 | 0.5 | 1 | 4 |

AGPL is an open-source license. Grafana's commercial distributions,
enterprise directories and plugins can have different terms; a vendor name
does not determine the license of every component. The
[Grafana licensing overview](https://grafana.com/licensing/) and each
reviewed repository establish those boundaries.

## Start with the incident

- **A small service needs actionable metrics:** start with Prometheus,
  Grafana and an explicit alert delivery path. Add retention infrastructure
  when the actual history, availability or scale requirement needs it.
- **Several Prometheus installations need shared history:** compare Thanos,
  Mimir and VictoriaMetrics using the current topology and representative
  queries. Include missing data, deduplication and tenant boundaries.
- **Investigations begin with service labels and time ranges:** shortlist
  Loki for logs. Include OpenSearch when indexed search across log content
  and fields is central to the workflow.
- **A request crosses several services:** compare Tempo and Jaeger with
  instrumented requests and a sampling policy. A storage backend cannot
  reconstruct spans that were never collected.
- **The delay is inside a process:** evaluate Pyroscope for profiling and
  connect the evidence to metrics and traces. Profiling and distributed
  tracing answer different questions.
- **The team wants one investigation application:** trial SigNoz alongside
  a composed Grafana stack. Compare the complete deployment and permission
  model, including the data backend and any commercial feature dependency.

## Version and operating notes

??? info faq-item "Metrics — Prometheus, Mimir, VictoriaMetrics and Thanos"
    The [Prometheus overview](https://prometheus.io/docs/introduction/overview/)
    separates the server, exporters and Alertmanager. Its local time-series
    database and rules are useful without a distributed metrics service.
    It is monitoring data, not a complete per-request billing ledger.

    [Mimir](https://grafana.com/docs/mimir/latest/introduction/) adds
    long-term, multi-tenant metrics storage and querying.
    [VictoriaMetrics](https://docs.victoriametrics.com/victoriametrics/)
    offers single-node and cluster paths; verify the query and replication
    behavior of the selected deployment.
    [Thanos](https://thanos.io/tip/thanos/getting-started.md/)
    can extend existing Prometheus installations with global queries and
    historical storage. Include its chosen components in recovery tests.

??? info faq-item "Logs — Loki and OpenSearch"
    [Loki](https://github.com/grafana/loki/tree/v3.7.8) organizes log streams
    around labels; [OpenSearch](https://github.com/opensearch-project/OpenSearch/tree/3.8.0)
    supplies a search and analytics engine with indexed fields.

    Replay real investigations: known service and trace ID, unknown error
    text and a long time window. Measure ingestion, index or chunk storage,
    query latency and retention deletion. Keep user IDs and request IDs out
    of unbounded label sets; choose indexed fields intentionally.

??? info faq-item "Traces and profiles — Tempo, Jaeger and Pyroscope"
    [Tempo](https://github.com/grafana/tempo/tree/v3.0.3) and
    [Jaeger](https://github.com/jaegertracing/jaeger/tree/v2.21.0)
    support distributed tracing. Pyroscope's
    [license boundary](https://github.com/grafana/pyroscope/blob/v2.3.0/LICENSE)
    separates its AGPL server from client integrations under their own terms.

    Trace a slow request through retries and asynchronous work. Confirm
    context propagation and which spans sampling discards. For profiles,
    measure collection overhead in the actual runtime and verify that the
    captured period includes the problem being investigated.

??? info faq-item "Collectors — OpenTelemetry Collector and Grafana Alloy"
    [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
    receives, processes and exports telemetry. It is not the durable query
    backend. Component availability and stability depend on the selected
    distribution and signal.

    [Alloy](https://grafana.com/docs/alloy/latest/introduction/) is an
    OpenTelemetry Collector distribution with Prometheus pipelines and
    integrations for logs, traces and profiles. Choose by the components
    needed and the configuration the team can operate. Test buffering,
    retries, overload and attribute redaction before a backend receives data.

??? info faq-item "Dashboards and alerts — assign ownership explicitly"
    [Grafana](https://github.com/grafana/grafana/tree/v13.2.2) is the shared
    query and visualization interface in this site's
    [platform stack](../stack.md). A dashboard does not replace the metric,
    log, trace or profile storage it queries.

    Prometheus evaluates its alert rules; Alertmanager routes notifications.
    Grafana alerting can also evaluate rules across supported data sources.
    Choose which system owns each rule, silence and contact route. Rehearse
    a backend outage and verify notification delivery without relying on
    the dashboard being available.

??? info faq-item "Integrated platforms — compare the complete deployment"
    [SigNoz](https://github.com/SigNoz/signoz/tree/v0.143.0) brings telemetry
    investigation into one application. Its
    [license](https://github.com/SigNoz/signoz/blob/v0.143.0/LICENSE)
    uses MIT for the core with enterprise exceptions. Verify permissions,
    identities and retention in the edition actually being evaluated.

    Version 0.143.0 adds AI observability and makes opaque tokens the
    default session provider, so every user signs in again once. Per the
    [upgrade guide](https://signoz.io/docs/operate/migration/upgrade-0-143/),
    a self-hosted collector needs `signoz-otel-collector` 0.144.11 with two new
    trace processors, and LLM message attributes move to the OpenTelemetry
    `gen_ai.*` keys by default. Check saved queries and alerts that use the
    old keys.

    [OpenObserve](olap-databases.md) is another observability-oriented option,
    covered there alongside analytical storage. Compare the collection,
    storage and user workflow together; fewer visible services do not by
    themselves prove lower operating cost.

## Candidates to watch

These projects can change the decision, but they are not rated yet: each
needs the same open-edition and operations review as the table above.

- [ClickStack](https://clickhouse.com/docs/clickstack/overview) packages
  ClickHouse, the [HyperDX](https://github.com/hyperdxio/hyperdx) interface
  (MIT; 2.39.1, released 2026-09-19) and an OpenTelemetry collector for logs,
  traces, metrics and session replay on one store.
- [Coroot](https://github.com/coroot/coroot/tree/v1.26.7) (Apache-2.0; 1.26.7,
  released 2026-09-18) gathers metrics, logs, traces and profiles through eBPF
  without code changes, with SLO-based alerting; a separate Enterprise
  edition exists.
- [GreptimeDB](https://github.com/GreptimeTeam/greptimedb/tree/v1.2.1)
  (Apache-2.0; 1.2.1, released 2026-09-16) keeps metrics, logs and traces in
  one columnar engine on object storage.

## A trial that can change the decision

Use a service with one dependency, a failed deployment and a noisy tenant.

1. **Coverage:** detect errors, latency and missing telemetry. A collector
   dropping data must not produce a misleadingly healthy dashboard.
2. **Investigation:** follow an alert into a trace, relevant logs and a
   profile where available. Record evidence gaps and investigation time.
3. **Alert delivery:** fail a backend and a notification receiver; check
   retries, grouping, silences and the independent failure signal.
4. **Recovery and access:** restore configuration and retained data; test
   tenant separation, redacted attributes and expired credentials.
5. **Cost:** measure active series, label cardinality, log volume, sampled
   spans, profile overhead, retention and operator effort under the same load.

## Follow the data

The [stack](../stack.md) already separates platform observability from LLM
observability with Langfuse, Helicone and Arize Phoenix. Model evaluation,
token accounting and prompt traces add another application-specific layer;
they do not establish infrastructure health by themselves.

[Workflow orchestration](workflow-orchestrators.md) and
[transformation](data-transformation.md) also need freshness and correctness
checks. [BI](business-intelligence.md) serves business questions, while
[SLO budgets](../projects/tools.md) help turn service objectives into an
operating decision. Choose the signals that answer those questions first.
