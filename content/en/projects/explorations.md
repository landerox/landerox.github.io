---
description: "A dated technology radar for data, inference, agents and platforms: upstream changes, adoption conditions, trade-offs and the next evidence to collect."
hide:
  - toc
icon: material/microscope
---

<!-- markdownlint-disable MD013 -->

# :material-microscope: Tech Radar

> A technology radar with adoption conditions and a testable next step.

I track changes that can alter a platform decision: interoperability,
operational cost, recovery, security and developer effort. The recommendations
below are my architectural assessment of the linked upstream material.

<p class="research-meta">Sources reviewed · September 2026 · Revisit when a dependency, workload or protocol changes</p>

<div class="reading-panel" markdown="block">

## Decision Radar

**Use** means a foundation for the stated scope. **Trial** means an isolated
pilot against a baseline. **Evaluate** means evidence is still needed before
it becomes a platform dependency.

A short recommendation first; the full reasoning and sources follow.

<div class="comparison-source" data-comparison="radar" markdown="block">

<div class="comparison-entry" data-group="data" data-category="Data" data-position="use" data-label="Use selectively" data-summary="Start with local files; share table formats only when every chosen tool preserves the data correctly." markdown="block">

<span id="data-portability-has-to-be-tested"></span>

### Local analytics, Iceberg v3 and DuckLake

Iceberg v3 introduces format capabilities including deletion vectors, row
lineage and additional types. A format revision is not a promise that every
engine can read and write every feature. DuckLake reached v1.0 in April 2026
with SQL-backed metadata and support for shared access through a PostgreSQL
catalog; calling it only a single-node catalog misses that distinction.
[Iceberg specification](https://iceberg.apache.org/spec/),
[DuckLake v1.0 announcement](https://duckdb.org/2026/04/13/ducklake-10).
DuckLabs announced on 2026-08-26 that it will become an AWS subsidiary; DuckDB
and DuckLake stay MIT-licensed under the DuckDB Foundation, and a DuckDB 2.0
alpha followed on 2026-09-02 with a stable release planned for late October.
[DuckLabs and AWS](https://duckdb.org/2026/08/26/ducklabs-to-join-aws),
[DuckDB 2.0 alpha](https://duckdb.org/2026/09/02/try-duckdb-20-alpha).

**My position:** Start local development with DuckDB/Polars and Parquet.
Choose Iceberg when its engine ecosystem is the requirement; trial DuckLake
when its catalog model simplifies the intended deployment.

**Next test:** Run the same insert/delete/schema-change workload through
every intended engine, then restore from backup. Record decimal and timestamp
semantics, snapshot behavior, concurrent commits and permissions. Reject a
migration that requires silent data coercion or an unsupported writer.

</div>

<div class="comparison-entry" data-group="data" data-category="Data" data-position="trial" data-label="Trial migration" data-summary="Test an existing project first; check release maturity, integrations and a safe return to the previous version." markdown="block">

### dbt v2 and Fusion {#dbt-core-v2-and-fusion}

The June 2026 licensing update describes two distributions sharing a Rust
engine: the Apache-2.0 `dbt-oss` runtime and dbt Labs' `dbt` build, which adds
static analysis, LSP features and `dbt lint` under a product license. The old
equation “Fusion engine equals a proprietary core” is no longer accurate.
dbt v2.0 reached general availability on 2026-09-14 (2.0.5 by 2026-09-18)
with five GA adapters; Spark and ClickHouse are still in beta, and v1 remains
fully supported as 1.12.x. Sharing an engine does not guarantee compatibility
between distributions.
[dbt licensing FAQ](https://www.getdbt.com/licenses-faq).

**My position:** Trial against an existing project before changing its
production runner. Compare adapter support, custom materializations, Python
models, macros, artifact consumers and CI behavior. Keep the previous runtime
available until output equivalence and rollback are demonstrated.

</div>

<div class="comparison-entry" data-group="data" data-category="Data" data-position="evaluate" data-label="Evaluate" data-summary="Prove that fresher data and reliable recovery justify another service to operate." markdown="block">

### Streaming lakehouses

Fluss documents tiering into lake storage and a Flink-based service connecting
fresh data with historical Iceberg snapshots. Supported integrations and
constraints differ between the released and development documentation.
[Fluss lakehouse storage](https://fluss.apache.org/docs/maintenance/tiered-storage/lakehouse-storage/),
[Iceberg integration](https://fluss.apache.org/docs/streaming-lakehouse/datalake-formats/iceberg/).

**My position:** Evaluate against the simpler CDC → durable log → lakehouse
path. Require event-time correctness, backpressure, duplicate handling,
schema-change recovery and a measured freshness target. A new stateful tier
must earn its storage and operational cost.

</div>

<div class="comparison-entry" data-group="data" data-category="Data" data-position="trial" data-label="Trial" data-summary="Add a query engine for fresh data only when scheduled, file-based processing is not enough." markdown="block">

### Analytical serving and orchestration

ClickHouse 26.8 introduces [pipelined SQL](https://clickhouse.com/blog/pipelined-sql-26.8),
a way to express transformations in stages. This is a dialect extension,
not a guarantee of faster queries. Kafka/Flink process events; Airflow
coordinates tasks: they do not solve the same workload.

**My position:** Trial Kafka → Flink → ClickHouse when fresh queries justify
a serving engine. Keep batch over Parquet/DuckDB as the baseline. Measure late
events, duplicates, lag, replay and rebuilding the destination, including
on-call effort. The [medallion pattern](https://docs.databricks.com/aws/en/lakehouse/medallion)
separates received, validated and business-ready data; it does not require
three physical copies when they add no value.

</div>

<div class="comparison-entry" data-group="ai" data-category="Inference" data-position="trial" data-label="Trial" data-summary="Accept a speed-up only if answer quality, response times and total cost still meet the same goals." markdown="block">

### Inference: Optimize Useful Work

Disaggregated prefill/decode, KV-aware routing, prefix reuse and speculative
decoding address different bottlenecks. Separating workers can isolate long
prefill from decode, but adds transfer and capacity coordination; speculative
decoding depends on draft acceptance and compatible execution.
[Dynamo performance tuning](https://docs.dynamo.nvidia.com/dynamo/kubernetes/operations/performance-tuning).

**My position:** Start with one well-instrumented server or an API baseline.
Evaluate one change at a time. Model selection comes from a versioned task set,
license requirements and hardware constraints, rather than a permanently
“best” model list.

**Next test:** Sweep arrival rate and concurrency using cold and warm caches.
Report quality, TTFT, inter-token latency, p95/p99, rejected requests, queueing
and cost per successful task. Check per-tenant cache isolation. A faster median
with worse tail latency or quality does not pass the same acceptance gate.

</div>

<div class="comparison-entry" data-group="ai" data-category="Agents" data-position="trial" data-label="Trial upgrades" data-summary="Upgrade only after testing permissions, compatibility and retries that might repeat an action." markdown="block">

<span id="agents-protocols-state-and-authority"></span>

### MCP 2026-07-28 and A2A 1.0

MCP’s July release moves to a stateless protocol core, changes discovery and
request handling, adds routing headers and hardens authorization. Application
state still needs an explicit home. A2A 1.0 defines cross-agent communication;
it serves a different boundary from tool access.
[MCP release notes](https://blog.modelcontextprotocol.io/posts/2026-07-28/),
[A2A 1.0 announcement](https://a2a-protocol.org/dev/blog/2026/03/12/a2a-protocol-ships-v10-production-ready-standard-for-agent-to-agent-communication/).

**My position:** Pin a tested client/server pair and migrate deliberately.
Do not carry an old transport-session design into a new protocol unchanged.
Add A2A when ownership spans runtimes, and keep permissions explicit per tool.

**Next test:** Expired or wrong-audience credentials, identity mix-ups,
tenant crossing, cancellation, duplicate requests and a restart around an
approved side effect. A protocol or output schema alone cannot make model
reasoning deterministic or prevent an execution loop.

</div>

<div class="comparison-entry" data-group="ai" data-category="Agents" data-position="evaluate" data-label="Evaluate" data-summary="Keep memory only if it finds useful information, respects deletion and stays within explicit permissions." markdown="block">

### Memory and assisted remediation

Persistent memory is useful only if it improves retrieval and remains
governable. A retained wrong fact can repeatedly contaminate later tasks.
For remediation, the first useful output is a bounded, reproducible diagnosis
and a reviewable patch.

**My position:** Begin with explicit session context and lexical/vector
retrieval. Trial graph memory when relationship queries justify extraction
cost. Keep provenance, validity dates, tenant filters and deletion propagation.
Test prompt injection through documents, tool results and memory.
[OWASP LLM application risks](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final).

**Next test:** Compare with a memory-free baseline on held-out tasks, delete
a source and verify it cannot return, then replay an incident in an isolated
environment. Production remediation requires explicit permissions, validation
and review before writes.

</div>

<div class="comparison-entry" data-group="ai" data-category="Evaluation" data-position="use" data-label="Use" data-summary="Check real task outcomes and failure cases; compare AI scoring with human judgment." markdown="block">

### Evaluation: Measure Outcomes, Calibrate Judges

Agent evaluations need both task-level outcomes and operational failure tests.
Code assertions, model rubrics and human review serve different purposes;
model judges need calibration. The evaluation harness itself can introduce
shared state or grading errors.
[Agent evaluation methodology](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

**My position:** Use deterministic checks for permissions, schemas, data
integrity and known outcomes. Use model judges for subjective dimensions with
a documented rubric and human reference labels. Report failed trials and
variance; track capability improvements separately from regression protection.

**Next test:** Hold out data by source and time, replay representative failures,
and compare judges against human labels. Public benchmarks can supply task
ideas; a leaderboard score does not establish fitness for a private workflow.

</div>

<div class="comparison-entry" data-group="platform" data-category="Platforms" data-position="trial" data-label="Trial" data-summary="Add shared GPU scheduling and routing only when several teams need them and can recover from failures." markdown="block">

### Platforms: Schedule, Route and Recover

Kubernetes DRA allocates devices through claims and drivers; an inference
gateway chooses endpoints using serving-specific information. These are
separate control layers, with their own compatibility requirements.
[Kubernetes DRA](https://kubernetes.io/docs/concepts/resource-management/dynamic-resource-allocation/),
[Gateway API Inference Extension](https://gateway-api-inference-extension.sigs.k8s.io/).

**My position:** Trial when several teams share a serving fleet. Start from
documented driver and gateway support, workload identity, admission controls,
image provenance and a restore procedure. A single service may need much less.

**Next test:** Driver failure, drained GPU nodes, lost capacity, model rollback,
noisy neighbors and denied admission. Policy checks on a Terraform/OpenTofu
plan complement runtime drift detection; neither observes the whole system.
See the [production gates](blueprints.md#production-readiness-gates).

</div>

<div class="comparison-entry" data-group="platform" data-category="Observability" data-position="use" data-label="Use" data-summary="Connect each request to its outcome and cost, without exposing sensitive content." markdown="block">

### Observability and Cost: Version the Contract

GenAI semantic conventions now have a dedicated OpenTelemetry repository.
Pin the conventions and instrumentation together, and review stability at the
individual signal level. FOCUS 1.3 defines cost-and-usage data and contract
commitment relationships; it does not automatically map a bill to a successful
agent task.
[GenAI conventions](https://github.com/open-telemetry/semantic-conventions-genai),
[FOCUS 1.3](https://focus.finops.org/docs/specification/v1-3/).

**My position:** Correlate request identity, model/route revision, tokens,
latency, outcome and allocated cost. Redact prompts and tool payloads by
default. Control metric cardinality, sampling, retention and telemetry expense.

**Next test:** Reconcile a representative bill with traces, including retries,
cache hits, idle GPUs and egress. Enforce request budgets in execution code,
and flag unattributed cost explicitly. Continue the experiments in
[Research Labs](labs.md#evidence-contract).

</div>

</div>

</div>

## Release Channels to Watch {#release-watch}

Novelty helps choose what to test; it does not replace pinned versions or
operating evidence. Snapshot: September 2026.

| Technology | Verified change | Next check |
| :--- | :--- | :--- |
| [DuckDB](https://duckdb.org/release_calendar) | Stable 1.5.5; 2.0 alpha published 2026-09-02, stable planned for late October; DuckLabs joins AWS with the MIT license and foundation governance unchanged | Keep the stable baseline; isolate client/server experiments on the 2.0 alpha; watch governance once the acquisition closes. |
| [dbt v2.0](https://github.com/dbt-labs/dbt/releases/tag/v2.0.5) | 2.0.0 GA on 2026-09-14, 2.0.5 on 2026-09-18; a Rust rewrite with five GA adapters, and 1.12.x fully supported | Confirm adapters and macros before replacing Core 1.x; licensing and maturity are separate questions. |
| [Kafka 4.3](https://kafka.apache.org/blog/) | 4.3 line; 4.3.1 published in June; 4.4.0 release candidate 1 tagged 2026-09-22 | Test broker/client upgrades, recovery and state compatibility. |
| [Airflow 3.3.2](https://airflow.apache.org/docs/apache-airflow/stable/release_notes.html) | Published September 17 | Rehearse DAG, provider, worker and XCom serialization migration; Composer/MWAA follow separate schedules. |
| [ClickHouse 26.8 LTS](https://presentations.clickhouse.com/2026-release-26.8/) | August LTS; adds pipelined SQL with <code>&#124;&gt;</code> (chains SQL stages); 26.9 stable published 2026-09-21 | Compare analytical serving with a batch baseline; measure semantics, cost and dialect portability. |

The SQL Explorer in [Interactive Tools](tools.md) is a small teaching interpreter;
it does not embed DuckDB or implement the ClickHouse dialect.
