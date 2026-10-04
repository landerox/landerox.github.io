---
description: "Six browser-local tools for failure policies, inference memory, SQL, SLO budgets, schema changes and table files."
hide:
  - toc
icon: material/tools
---

# :material-tools: Interactive Tools

Explore a failure, compare an assumption, or inspect a data contract. Six
tools run in your browser; they do not connect to infrastructure or send your
inputs to an AI service. Start with an example; open the assumptions for detail.

=== "Failure Lab"

    <div class="interactive-lab-embed" id="failure-lab" markdown>

    ## Failure Lab { #failure-lab-model }

    Enable JavaScript to step through a simulated pipeline:
    **Producer → Queue → Workers → Store**. Pause workers, interrupt writes
    or inject a traffic burst, then restore service and inspect recovery.

    The model admits 3 events per simulated second (12 during a burst),
    allows 5 processing attempts per tick and holds 24 queued messages.
    A message gets at most 3 total attempts before entering a dead-letter
    queue. Backoff waits 1 second, then 2 seconds; jitter is not modeled.
    Arrivals enter before processing; delayed retries also occupy queue slots.

    This is a deterministic teaching model, not a benchmark or a real fault
    injector. Rejected events and dead letters are not automatically replayed.

    Compare two retry policies against the same 30-second incident. The second
    adds seeded, reproducible jitter to backoff. Inspect completed, queued,
    rejected and dead-letter messages in the timeline; neither policy is
    assumed to win. The manual simulator above retains its no-jitter policy.

    </div>

    Read the underlying patterns: [bounded retries and backoff](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter)
    and [dead-letter queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html).

=== "Memory planner"

    <div class="interactive-lab-embed" id="interactive-llm-calculator" markdown>

    ## Plan inference memory

    Enable JavaScript to size the three published Qwen3.8 weights: the dense
    27B, the 180B Flash-Next and the 2.4T-A95B mixture of experts. All three
    use hybrid attention: only one layer in four keeps a KV cache, the other
    three are Gated DeltaNet layers with a fixed state per request.

    Without the tool: weight bytes = total parameters × bits / 8, keeping the
    parameters an FP8 checkpoint leaves in BF16 at 2 bytes. KV bytes = 2 ×
    full-attention layers × KV heads × head dimension × tokens × requests × KV
    bytes. Linear state = linear layers × value heads × key dimension × value
    dimension × state bytes × requests. Divide by 2³⁰ for GiB. An MoE model
    keeps every expert resident, even though each token uses only a few.

    This is a planning estimate, not a per-GPU sizing guarantee. Runtime
    buffers, sparse-attention indexers and placement still require measurement.

    Save a baseline A, change context, requests or precision, and compare
    scenario B by weights, cache, state and reserve. Lower memory is not a
    quality or speed score.

    </div>

=== "SQL explorer"

    <div class="interactive-lab-embed" id="interactive-sql-sandbox" markdown>

    ## Explore data with SQL

    Enable JavaScript to explore two tables with 16 fictional rows:
    inference scenarios and batch/streaming pipelines. Start with a guided
    question; the help explains each column with units and examples.

    Combine AND/OR, IN, BETWEEN and LIKE filters; group and sort by several
    columns, remove duplicates with DISTINCT or limit results.
    Copy the query or download its CSV result. Only SELECT over one table
    at a time is allowed: no joins, subqueries or writes.

    This is a local teaching interpreter, not DuckDB or a real data connection.
    No engine performance conclusions can be drawn from these datasets.

    The query walkthrough explains actual row and group counts at each logical
    stage. It is not a database query planner or a runtime performance profile.

    </div>

=== "SLO & error budget"

    <div class="interactive-lab-embed" id="interactive-slo-budget" markdown>

    ## How much failure can this service tolerate?

    Enable JavaScript to compare a service-level objective with observed errors
    or downtime. Request-based and time-based availability are separate modes;
    requests are not silently converted into minutes.

    Error budget = eligible requests or window minutes × (1 − target).
    Burn rate = observed bad fraction ÷ (1 − target). With no observations,
    or a 100% target, the corresponding undefined ratios stay unavailable.
    Partial-window projections require explicit assumptions, not a promise
    about future traffic or availability.

    </div>

    Method: [Google SRE — alerting on SLOs](https://sre.google/workbook/alerting-on-slos/).

=== "Schema diff"

    <div class="interactive-lab-embed" id="interactive-schema-diff" markdown>

    ## What changes between these two data contracts?

    Enable JavaScript to compare two flat table schemas locally. Start with
    the example, then review added or removed columns, type changes and
    nullability changes. Download the report for a migration review.

    Each input is a JSON object with a `columns` array. Each column has a
    unique `name`, an allowed `type` and an explicit boolean `nullable`.
    This is a small table-schema format, not a full JSON Schema validator,
    SQL parser or schema-registry compatibility checker. No data is uploaded.

    Risks depend on direction: old readers consuming new records and old
    records meeting new constraints are different checks. A rename appears
    as removal plus addition; nullability does not mean a field can be omitted.

    </div>

=== "Table files"

    <div class="interactive-lab-embed" id="interactive-table-planner" markdown>

    ## How many files will this table keep?

    Enable JavaScript to plan the files an open-table-format table writes:
    daily volume, commits per day, day or hour partitions, hash buckets,
    target file size and retention. Compare the files kept without compaction
    with the files left after compacting each partition to the target size.

    Without the tool: files per commit = partitions touched × max(1,
    ⌈data per commit ÷ partitions touched ÷ target⌉). After compaction, each
    partition keeps max(1, ⌈partition size ÷ target⌉) files. Iceberg writes
    toward `write.target-file-size-bytes`, 512 MiB by default.

    This is a planning estimate for one append-only table with evenly spread
    data, not a benchmark. Parallel writers, deletes and sort order usually
    add files; old files stay on storage until their snapshots expire.

    </div>

    Sources: [Iceberg write properties](https://iceberg.apache.org/docs/latest/configuration/)
    and [table maintenance](https://iceberg.apache.org/docs/latest/maintenance/).

Research questions and evaluation criteria remain in [Research Labs](labs.md).
