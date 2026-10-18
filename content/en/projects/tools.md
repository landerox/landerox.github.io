---
description: "Four browser-local tools for data platforms and AI engineering: retry policies during an outage, table files and compaction, agent crash recovery and evaluation statistics."
hide:
  - toc
icon: material/tools
---

# :material-tools: Interactive Tools

> Four browser-local tools, one question each, from my work on data platforms
> and AI systems.

Each tool opens on a worked example and offers preset scenarios for common
failure modes and sizing trade-offs. Change any value and the result follows;
everything is computed in your browser, no model is called and nothing you
type leaves the page.

<!-- The anchors live on the tools' own blocks inside the tabs. -->
<!-- markdownlint-disable MD013 MD051 -->

| Tool | The question it answers |
| :--- | :--- |
| [Failure Lab](#failure-lab) | What does a queue do during an outage, and which retry policy drains it better? |
| [Table Files](#interactive-table-planner) | How many files will a table keep, and how many will compaction leave? |
| [Agent Replay](#interactive-agent-run) | What does an agent repeat after a crash, and when is a write applied twice? |
| [Eval Statistics](#interactive-eval-stats) | How much does an evaluation result tell you, and how many examples does a comparison need? |

<!-- markdownlint-enable MD013 MD051 -->

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

    Below the simulator, two retry policies face the same 30-second incident;
    the second adds seeded, reproducible jitter to backoff. Neither policy is
    assumed to win.

    </div>

    Read the underlying patterns: [bounded retries and backoff](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter)
    and [dead-letter queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html).

=== "Table Files"

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

=== "Agent Replay"

    <div class="interactive-lab-embed" id="interactive-agent-run" markdown>

    ## What does an agent repeat after a crash?

    Enable JavaScript to replay one incident under four recovery strategies:
    restart from the first tool call or resume from the last checkpoint, each
    with and without idempotency keys. The table shows the calls each
    strategy repeats and whether a write is applied twice.

    Without the tool: a checkpoint is recorded after a call returns, so a
    crash between a write's effect and its record makes that write run again.
    Only an idempotency key remembered by the tool that owns the write turns
    the repeat into a lookup.

    This is a deterministic teaching model of one crash, not a
    durable-execution engine. A plan that changes after a restart, partial
    effects and expiring key stores are not modeled.

    </div>

    Read the pattern: [Temporal — why activities should be idempotent](https://docs.temporal.io/activity-definition#idempotency).

=== "Eval Statistics"

    <div class="interactive-lab-embed" id="interactive-eval-stats" markdown>

    ## How much does an evaluation result tell you?

    Enable JavaScript to put a Wilson interval around a pass rate, size a
    comparison between two variants, or measure the agreement between two
    judges with Cohen's kappa.

    Without the tool: 42 passes out of 50 is 84%, with a 95% interval from
    71.5% to 91.7%. Telling 80% from 85% with 95% confidence and 80% power
    takes 906 independent examples per variant. Two judges who agree on 85 of
    100 examples, with pass rates of 45% and 50%, reach a kappa of 0.70.

    Examples are treated as independent; questions that share a document are
    clustered and need wider intervals. A paired comparison on the same
    examples usually needs fewer than the independent estimate.

    </div>

    Method: [NIST — confidence intervals for a proportion](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm).
    Further reading: [Miller (2024) — Adding Error Bars to Evals](https://arxiv.org/abs/2411.00640).

Research questions and evaluation criteria remain in [Research Labs](labs.md).
