---
description: "Applied research in inference, data platforms and agent systems, with explicit baselines, evaluation gates and failure tests."
hide:
  - toc
icon: material/flask
---

<!-- markdownlint-disable MD013 -->

# :material-flask: Research Labs

> Architecture questions from my cloud, data and AI work, each tested against a simpler baseline.

Each experiment starts with that baseline and a concrete failure mode to
investigate. Status labels follow my internal research lifecycle; client
code stays confidential.

## Research Laboratories { .reading-panel-heading }

=== "Active Development"

    <div class="lab-entry" markdown>

    ### Inference Serving {#inference-fabric-inference-fabric}

    **Purpose:** Faster model responses without losing answer quality or
    hiding operating costs.

    **Starting point:** One server batching incoming requests, tested with
    cold and warm caches at matched quality. Compare vLLM or SGLang; consider
    Dynamo and LMCache for a specific bottleneck, not as a mandatory bundle.

    **Measure:** Time to the first token, a text fragment (TTFT), and gaps
    between tokens (ITL). Record tail latency (p95/p99), requests completed
    within the latency target, queueing, memory and cost per successful task.

    **Test failures:** Overload, cancellation, cache eviction, fallback loops,
    cross-tenant cache leaks and a failed prompt-processing worker.

    **Next evidence:** A reproducible load sweep, changing one optimization
    at a time. Separating prompt processing from output generation must pay
    for cache transfer and extra capacity. Speculative decoding must justify
    draft-model memory and acceptance rate.
    [Dynamo architecture guide](https://docs.dynamo.nvidia.com/dynamo/knowledge-base/concepts/system-architecture/disaggregated-serving).

    </div>

    <div class="lab-entry" markdown>

    ### Open Table Interoperability {#data-fabric-data-fabric}

    **Purpose:** Keep analytical results consistent when query engines,
    catalogs or storage change.

    **Starting point:** DuckDB or Polars over Parquet with explicit schemas.
    Evaluate Iceberg with a REST catalog for shared, multi-engine tables;
    compare DuckLake's SQL catalog and concurrency model.

    **Measure:** Result equivalence, decimal precision, timestamps, nulls,
    freshness and full versus incremental ingestion.

    **Test failures:** Interrupted inserts/deletes, incompatible schema
    changes, concurrent writers, expired snapshots and recovery. Replay
    duplicate and out-of-order source changes before connecting a live
    change-data feed.

    **Next evidence:** A reader/writer compatibility matrix and recovery
    transcript. The [Iceberg v3 specification](https://iceberg.apache.org/spec/)
    defines deletion vectors and row lineage; each engine still needs tests.
    [DuckLake catalog choices](https://ducklake.select/docs/stable/duckdb/usage/choosing_a_catalog_database)
    have different concurrency limits.

    </div>

    <div class="lab-entry" markdown>

    ### Durable Agent Workflows {#agent-fabric-agent-fabric}

    **Purpose:** Resume AI workflows safely without repeating writes or
    letting a model grant itself permission.

    **Starting point:** One agent with structured tools and bounded execution.
    Add LangGraph or Pydantic AI when durable checkpoints justify orchestration.
    Keep application state separate from transport state. Pin tool-protocol
    (MCP) revisions; consider agent-to-agent (A2A) communication only across
    independently operated agents.

    **Measure:** Completed tasks, elapsed time, token cost, tool calls,
    retries and denied actions. Check identity, tenant scope and arguments
    outside the model; a classifier does not grant authority.

    **Test failures:** Expired credentials or approvals, duplicate delivery,
    cancellation and hostile tool output. Isolate execution; cap time,
    tokens, tool calls and retries.

    **Next evidence:** Failure traces demonstrating that replay cannot repeat
    an approved write. Use durable state and idempotent operations, not an
    assumption that model output is deterministic.
    [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
    and [A2A 1.0](https://a2a-protocol.org/latest/specification/).

    </div>

=== "Completed"

    <div class="lab-entry" markdown>

    ### Log-Driven Code Repair {#engineering-fabric-engineering-fabric}

    A study of how logs and data dependencies can guide a reviewable code
    repair.

    **Internal scope:** Log-based diagnosis, dbt lineage and proposed patches,
    with affected dependencies and validation in an isolated environment.

    **Limit:** A proposed fix must reproduce the failure, pass regression
    checks and receive human review before application. Producing a patch
    does not prove that a production incident is resolved.

    </div>

    <div class="lab-entry" markdown>

    ### AI Evaluation Harness {#eval-fabric-eval-fabric}

    A repeatable way to compare prompts, retrieval and agent workflows.

    **Internal scope:** An evaluation harness with versioned datasets,
    deterministic assertions and calibrated scoring rubrics. Candidate tools
    include Pytest, Promptfoo, DeepEval and Phoenix.

    **Limit:** Reserve unseen regression tasks, retain failed trials and
    calibrate model judges against human labels. Track task success,
    unauthorized actions, latency and cost separately. Several judges can
    share one bias; agreement alone is not ground truth.
    [Evaluation methodology](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

    </div>

=== "Planned"

    <div class="lab-entry" markdown>

    ### Retrieval & Memory {#knowledge-fabric-knowledge-fabric}

    Find relevant knowledge without retaining stale or withdrawn information.

    **Starting point:** Compare keyword, vector and hybrid retrieval using
    PostgreSQL/pgvector or Qdrant before adding graph-based memory.

    **Evidence needed:** Run unseen tasks with recorded sources and validity
    dates. Delete a source and verify that derived records cannot retrieve
    it again. Compare answer relevance, freshness and maintenance cost.
    Consider Graphiti or a graph database only when relationship queries
    improve those tasks enough to justify extraction and ongoing upkeep.

    </div>

    <div class="lab-entry" markdown>

    ### Policy-Checked Decisions {#governance-fabric-governance-fabric}

    Make architecture decisions and policy exceptions easier to review.

    **Starting point:** Architecture decision records checked with Open
    Policy Agent (OPA) and Conftest, using explicit rules and testable
    exceptions.

    **Evidence needed:** Compare accepted and rejected examples, preserve the
    policy revision and identify who can approve an exception. Agents may
    identify missing evidence and draft a review; they must not grant
    themselves authority. A named owner accepts exceptions, while
    deterministic checks enforce the decision. Record the evidence behind
    each proposed policy change.

    </div>

    <div class="lab-entry" markdown>

    ### Reproducible Platforms {#platform-fabric-platform-fabric}

    Make deployments reproducible and recovery something a team can rehearse.

    **Starting point:** Terraform/OpenTofu, GitOps and Kubernetes controls
    around a documented deployment and restore procedure.

    **Evidence needed:** Recreate an environment, restore its state and
    demonstrate a rollback with the intended runtime and drivers. Introduce
    Crossplane, dynamic resource allocation (DRA) or an inference gateway
    only for a demonstrated platform requirement. Record compatibility,
    capacity ownership and the steps needed when a dependency fails;
    another control layer must justify its operating work.

    </div>

    <div class="lab-entry" markdown>

    ### Cost per Successful Task {#fabric-ops-fabric-ops}

    Connect each useful result with its real cost and operational evidence.

    **Starting point:** Application outcomes, OpenTelemetry signals and
    billing data normalized with the FOCUS cost format.

    **Evidence needed:** Account for retries, idle capacity, data transfer
    and telemetry retention in cost per successful task. Enforce budgets
    during execution; a dashboard cannot stop excess consumption.
    Compare read-only AI-assisted investigation with a human runbook,
    keeping sources and measuring false positives. Any proposed remediation
    still requires review and explicit authority before writes.

    </div>

    <div class="lab-entry" markdown>

    ### Streaming Freshness {#streaming-fabric-streaming-fabric}

    Decide whether fresher data is worth continuously operating more services.

    **Starting point:** Batch processing over Parquet/DuckDB. Trial Kafka
    4.3, Flink and ClickHouse 26.8 LTS in stages, not as a required bundle.

    **Evidence needed:** Measure freshness, processing delay, concurrent
    queries and cost. Replay duplicates and late events from known positions,
    rebuild the destination and compare results. Test schema changes,
    overload and consumer failure. The [radar](explorations.md#release-watch)
    links versions and sources. This studies continuous data delivery;
    Open Table Interoperability studies engine and catalog compatibility.

    </div>

    <div class="lab-entry" markdown>

    ### Tool Usability {#experience-lab-experience-lab}

    Help people understand an engineering tool and interpret its result.

    **Starting point:** Guided examples and native HTML controls.
    Use [Interactive Tools](tools.md) to compare progressive help, command suggestions
    and failure explanations with technical and non-technical visitors.

    **Evidence needed:** Task completion, result comprehension, recovery
    from errors and keyboard/touch journeys. Review reduced motion, zoom
    and assistive technology alongside the [UX/UI principles](blueprints.md#ux-ui).
    These user sessions have not been conducted. Adding visual complexity
    needs evidence that it helps people complete the intended task.

    </div>

## Engineering Foundation

| Principle | Operational commitment |
| :--- | :--- |
| Open source first | Record licenses, model terms and an exit path; managed services remain an explicit option. |
| Local first | Reproduce behavior locally; do not infer production concurrency or resilience from a laptop run. |
| Portable by contract | Test schemas, auth, SQL semantics and failure behavior across named targets. |
| Evaluate before deployment | Version workloads and acceptance thresholds before comparing candidates. |
| Human authority | Enforce tool scope and approval checks in code, outside model judgment. |
| Cost-aware execution | Include retries, idle hardware, operations and failed tasks in the denominator. |

**Current compatibility watch:** MCP 2026-07-28 changes the transport
lifecycle; dbt v2.0 is GA with five adapters while 1.12 stays supported, and DuckDB 2.0 is an alpha;
GenAI telemetry has its own evolving conventions repository.
The [Tech Radar](explorations.md) records the primary sources and
adoption conditions for these changes.

## Evidence Contract

Before publishing a performance claim, attach:

1. **Reproduction:** code revision, dataset/version, seed where applicable,
   hardware, drivers, runtime, model weights, precision and dependency lock.
2. **Workload:** arrival pattern, concurrency, prompt/output lengths,
   cache state, warm-up policy, repetitions and raw failures.
3. **Comparison:** the baseline, quality threshold, latency percentiles,
   useful throughput, confidence or variance, and total cost assumptions.
4. **Operations:** authorization tests, recovery/rollback evidence, known
   limitations and the conditions that would invalidate the result.

No percentage saving or latency target on this page is presented as a measured
result. Architecture selection starts in
[Production Blueprints](blueprints.md); candidate evaluation lives in
[Tech Radar](explorations.md).
