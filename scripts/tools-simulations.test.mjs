import assert from "node:assert/strict";
import test from "node:test";
import {
  FAILURE_LIMITS,
  FAILURE_SCENARIOS,
  createSimulation,
  retryDelay,
  runFailureComparison,
  stepSimulation,
} from "../content/en/assets/javascripts/failure-core.js";
import {
  executeSql,
  resultToCsv,
  SQL_TABLES,
} from "../content/en/assets/javascripts/sql-core.js";

test("retry schedules stay bounded and distinguish next-tick, backoff and additive jitter", () => {
  const outcomes = new Set();
  for (const seed of [0, 1, 42, 100, 0xffffffff]) {
    for (let id = 1; id <= 200; id++) {
      for (const attempt of [1, 2]) {
        const base = 2 ** (attempt - 1);
        assert.equal(retryDelay("immediate", attempt, id, seed), 1);
        assert.equal(retryDelay("backoff", attempt, id, seed), base);
        const delay = retryDelay("jitter", attempt, id, seed);
        assert.ok(Number.isInteger(delay));
        assert.ok(delay >= base && delay <= base * 2);
        assert.equal(delay, retryDelay("jitter", attempt, id, seed));
        outcomes.add(delay);
      }
    }
  }
  assert.deepEqual([...outcomes].sort(), [1, 2, 3, 4]);
});

test("jitter seeds change schedules, not the seeded next-tick control", () => {
  const schedule = (seed, policy) =>
    Array.from({ length: 30 }, (_, i) => retryDelay(policy, 2, i + 1, seed));
  assert.notDeepEqual(schedule(1, "jitter"), schedule(2, "jitter"));
  assert.deepEqual(schedule(1, "immediate"), schedule(2, "immediate"));
  const first = runFailureComparison({ seed: 1 });
  const second = runFailureComparison({ seed: 2 });
  assert.deepEqual(first.runs[0], second.runs[0]);
  assert.notDeepEqual(first.runs[1].timeline, second.runs[1].timeline);
});

test("retry parameters reject unsupported policies and unsafe inputs", () => {
  assert.throws(() => retryDelay("forever", 1, 1), /retry_mode/);
  for (const attempt of [-1, 0, 1.5, 3, Infinity, NaN])
    assert.throws(() => retryDelay("jitter", attempt, 1), /retry_inputs/);
  for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity])
    assert.throws(() => retryDelay("jitter", 1, id), /retry_inputs/);
  for (const seed of [-1, 0x100000000, 1.5, Infinity, NaN, "42"])
    assert.throws(() => retryDelay("jitter", 1, 1, seed), /retry_inputs/);
});

test("every compared snapshot conserves arrivals with identical incident and load", () => {
  for (const scenario of Object.keys(FAILURE_SCENARIOS)) {
    for (const seed of [0, 1, 42, 8723, 0xffffffff]) {
      const comparison = runFailureComparison({ scenario, seed });
      assert.equal(comparison.runs.length, 2);
      assert.deepEqual(
        comparison.runs.map((run) => run.policy),
        ["immediate", "jitter"],
      );
      for (const run of comparison.runs) {
        assert.equal(run.timeline.length, 31);
        assert.deepEqual(run.final, run.timeline.at(-1));
        assert.equal(
          run.peakQueue,
          Math.max(...run.timeline.map((point) => point.queued)),
        );
        for (const point of run.timeline) {
          for (const [key, value] of Object.entries(point)) {
            if (key === "phase") continue;
            assert.ok(Number.isSafeInteger(value) && value >= 0, key);
          }
          assert.equal(
            point.total,
            point.written + point.queued + point.dead + point.rejected,
          );
          assert.ok(point.queued <= FAILURE_LIMITS.queue);
          assert.ok(point.attempts <= point.total * FAILURE_LIMITS.attempts);
          assert.ok(
            point.retries <= point.total * (FAILURE_LIMITS.attempts - 1),
          );
          assert.equal(Object.hasOwn(point, "queue"), false);
          assert.equal(Object.hasOwn(point, "events"), false);
        }
      }
      for (let tick = 0; tick <= 30; tick++) {
        const [a, b] = comparison.runs.map((run) => run.timeline[tick]);
        assert.equal(a.tick, tick);
        assert.equal(b.tick, tick);
        assert.equal(a.total, b.total);
        assert.equal(a.phase, b.phase);
        if (tick) {
          const arrivals =
            comparison.schedule.failure === "burst" && a.phase === "incident"
              ? FAILURE_LIMITS.burst
              : FAILURE_LIMITS.arrivals;
          assert.equal(
            a.total - comparison.runs[0].timeline[tick - 1].total,
            arrivals,
          );
        }
      }
      for (const [key, value] of Object.entries(comparison.difference))
        assert.equal(
          value,
          comparison.runs[1].final[key] - comparison.runs[0].final[key],
        );
    }
  }
});

test("comparison fixes inclusive fault boundaries and a finite recovery window", () => {
  const { schedule, runs } = runFailureComparison();
  assert.deepEqual(schedule, {
    failure: "store",
    start: 5,
    end: 10,
    ticks: 30,
  });
  for (const { timeline } of runs) {
    assert.equal(timeline[0].phase, "before");
    assert.equal(timeline[4].phase, "before");
    assert.equal(timeline[5].phase, "incident");
    assert.equal(timeline[10].phase, "incident");
    assert.equal(timeline[11].phase, "recovery");
    assert.equal(timeline[30].phase, "recovery");
    assert.equal(timeline[10].written, timeline[4].written);
  }
});

test("identical seed reproduces the experiment without shared mutable output", () => {
  const first = runFailureComparison({
    scenario: "long-write-outage",
    seed: 1729,
  });
  const again = runFailureComparison({
    scenario: "long-write-outage",
    seed: 1729,
  });
  assert.deepEqual(first, again);
  first.runs[0].timeline[2].written = 99999;
  first.runs[1].final.written = 99999;
  first.difference.written = 99999;
  assert.deepEqual(
    runFailureComparison({ scenario: "long-write-outage", seed: 1729 }),
    again,
  );
  assert.ok(Object.isFrozen(FAILURE_SCENARIOS));
  assert.ok(Object.isFrozen(first.schedule));
  assert.throws(() => {
    first.schedule.ticks = 1e9;
  }, TypeError);
});

test("comparison rejects non-allowlisted scenarios and invalid seed values", () => {
  for (const scenario of ["", "outage", "__proto__", "constructor", null])
    assert.throws(
      () => runFailureComparison({ scenario }),
      /comparison_scenario/,
    );
  for (const seed of [-1, 0x100000000, 0.2, NaN, Infinity, "42", null])
    assert.throws(() => runFailureComparison({ seed }), /simulation_seed/);
});

test("successful writes during a burst give neither retry policy an advantage", () => {
  const { runs, difference } = runFailureComparison({
    scenario: "traffic-burst",
  });
  assert.deepEqual(runs[0].timeline, runs[1].timeline);
  assert.equal(runs[0].final.retries, 0);
  assert.equal(runs[0].final.dead, 0);
  assert.equal(runs[0].final.total, 144);
  assert.equal(runs[0].final.written, 121);
  assert.equal(runs[0].final.rejected, 23);
  assert.ok(Object.values(difference).every((value) => value === 0));
});

test("fixed default fixture documents a model outcome rather than universal superiority", () => {
  const brief = runFailureComparison();
  assert.deepEqual(
    brief.runs.map((run) => run.final.written),
    [84, 87],
  );
  assert.deepEqual(
    brief.runs.map((run) => run.final.dead),
    [6, 3],
  );
  const long = runFailureComparison({ scenario: "long-write-outage" });
  assert.deepEqual(
    long.runs.map((run) => run.final.written),
    [69, 69],
  );
  assert.deepEqual(
    long.runs.map((run) => run.final.rejected),
    [6, 6],
  );
});

test("jitter does not mutate previous manual state or exceed existing simulation bounds", () => {
  const initial = createSimulation();
  const copy = globalThis.structuredClone(initial);
  let state = stepSimulation(initial, { failure: "store", retry: "jitter" });
  assert.deepEqual(initial, copy);
  assert.equal(state.attempts, 3);
  assert.equal(state.queue.length, 3);
  for (const message of state.queue) assert.ok(message.ready > state.tick);
  const saved = globalThis.structuredClone(state);
  runFailureComparison();
  assert.deepEqual(state, saved);
  for (let i = 1; i < FAILURE_LIMITS.ticks; i++) {
    state = stepSimulation(state, {
      failure: "store",
      retry: "jitter",
      seed: 0xffffffff,
    });
    assert.ok(state.queue.length <= FAILURE_LIMITS.queue);
    assert.ok(state.events.length <= FAILURE_LIMITS.log);
    assert.equal(
      state.total,
      state.written + state.queue.length + state.dead + state.rejected,
    );
    for (const message of state.queue)
      assert.ok(message.attempts < FAILURE_LIMITS.attempts);
  }
  assert.equal(stepSimulation(state, { retry: "jitter" }), state);
  assert.throws(
    () => stepSimulation(initial, { retry: "jitter", seed: -1 }),
    /simulation_seed/,
  );
});

const counts = (result) =>
  result.stages.map(({ clause, input, output, inputKind, outputKind }) => [
    clause,
    input,
    inputKind,
    output,
    outputKind,
  ]);

test("SQL traces actual filter, grouping, projection, deduplication, sorting and pagination counts", () => {
  const result = executeSql(
    "SELECT DISTINCT mode, COUNT(*) AS flows FROM pipelines WHERE error_pct >= 0.5 GROUP BY mode ORDER BY flows DESC LIMIT 1 OFFSET 1;",
  );
  assert.deepEqual(counts(result), [
    ["FROM", 8, "rows", 8, "rows"],
    ["WHERE", 8, "rows", 4, "rows"],
    ["GROUP BY", 4, "rows", 2, "groups"],
    ["SELECT", 2, "groups", 2, "rows"],
    ["DISTINCT", 2, "rows", 2, "rows"],
    ["ORDER BY", 2, "rows", 2, "rows"],
    ["LIMIT", 2, "rows", 1, "rows"],
  ]);
  assert.deepEqual(result.rows, [{ mode: "batch", flows: 1 }]);
  assert.deepEqual(result.stages[2].columns, ["mode"]);
  assert.deepEqual(result.stages[3].columns, ["mode", "flows"]);
  assert.deepEqual(result.stages[5].columns, ["flows DESC"]);
  assert.equal(result.stages[6].limit, 1);
  assert.equal(result.stages[6].offset, 1);
});

test("SQL omits unrequested stages and leaves result rows unchanged", () => {
  const result = executeSql("SELECT * FROM pipelines;");
  assert.deepEqual(result.rows, SQL_TABLES.pipelines);
  assert.deepEqual(counts(result), [
    ["FROM", 8, "rows", 8, "rows"],
    ["SELECT", 8, "rows", 8, "rows"],
  ]);
  assert.equal(result.stages[0].table, "pipelines");
});

test("empty global aggregation reports zero input rows but one summary group", () => {
  const result = executeSql(
    "SELECT COUNT(*) AS count, AVG(ttft_ms) AS latency FROM benchmarks WHERE ttft_ms < 0;",
  );
  assert.deepEqual(result.rows, [{ count: 0, latency: null }]);
  assert.deepEqual(counts(result), [
    ["FROM", 8, "rows", 8, "rows"],
    ["WHERE", 8, "rows", 0, "rows"],
    ["AGGREGATE", 0, "rows", 1, "groups"],
    ["SELECT", 1, "groups", 1, "rows"],
  ]);
});

test("empty GROUP BY reports zero groups and no summary rows", () => {
  const result = executeSql(
    "SELECT engine, COUNT(*) AS count FROM benchmarks WHERE ttft_ms < 0 GROUP BY engine;",
  );
  assert.deepEqual(result.rows, []);
  assert.deepEqual(counts(result).slice(-2), [
    ["GROUP BY", 0, "rows", 0, "groups"],
    ["SELECT", 0, "groups", 0, "rows"],
  ]);
});

test("grouping without aggregates and multiple group keys preserve the same logical contract", () => {
  const result = executeSql(
    "SELECT engine, precision FROM benchmarks GROUP BY engine, precision ORDER BY engine ASC, precision DESC;",
  );
  assert.deepEqual(counts(result).slice(1), [
    ["GROUP BY", 8, "rows", 2, "groups"],
    ["SELECT", 2, "groups", 2, "rows"],
    ["ORDER BY", 2, "rows", 2, "rows"],
  ]);
  assert.deepEqual(result.stages[1].columns, ["engine", "precision"]);
  assert.deepEqual(result.stages[3].columns, ["engine ASC", "precision DESC"]);
});

test("DISTINCT counts removed repetitions after projection, before LIMIT zero", () => {
  const result = executeSql(
    "SELECT DISTINCT mode FROM pipelines ORDER BY mode LIMIT 0;",
  );
  assert.deepEqual(result.rows, []);
  assert.deepEqual(counts(result).slice(2), [
    ["DISTINCT", 8, "rows", 2, "rows"],
    ["ORDER BY", 2, "rows", 2, "rows"],
    ["LIMIT", 2, "rows", 0, "rows"],
  ]);
  const offset = executeSql(
    "SELECT pipeline FROM pipelines LIMIT 10 OFFSET 1000;",
  );
  assert.deepEqual(counts(offset).at(-1), ["LIMIT", 8, "rows", 0, "rows"]);
});

test("stage counts and units connect from source to final result for teaching examples", () => {
  for (const query of [
    "SELECT * FROM benchmarks;",
    "SELECT AVG(ttft_ms) AS mean FROM benchmarks;",
    "SELECT engine, AVG(ttft_ms) AS mean FROM benchmarks GROUP BY engine;",
    "SELECT pipeline FROM pipelines WHERE error_pct > 0 AND mode LIKE '%ing' ORDER BY pipeline LIMIT 2 OFFSET 1;",
    "SELECT DISTINCT mode FROM pipelines;",
    "SELECT mode FROM pipelines WHERE freshness_s < 0;",
  ]) {
    const result = executeSql(query);
    assert.ok(result.stages.length >= 2 && result.stages.length <= 7);
    assert.equal(result.stages[0].input, result.sourceRows);
    for (let i = 1; i < result.stages.length; i++) {
      assert.equal(result.stages[i].input, result.stages[i - 1].output);
      assert.equal(result.stages[i].inputKind, result.stages[i - 1].outputKind);
    }
    assert.equal(result.stages.at(-1).output, result.rows.length);
    assert.equal(result.stages.at(-1).outputKind, "rows");
  }
});

test("SQL stage metadata is independent across executions and absent from CSV", () => {
  const result = executeSql("SELECT DISTINCT mode FROM pipelines;");
  assert.equal(resultToCsv(result), '"mode"\r\n"batch"\r\n"streaming"\r\n');
  result.stages[0].input = 999;
  result.stages[1].columns[0] = "changed";
  result.rows[0].mode = "changed";
  const fresh = executeSql("SELECT DISTINCT mode FROM pipelines;");
  assert.equal(fresh.stages[0].input, 8);
  assert.deepEqual(fresh.stages[1].columns, ["mode"]);
  assert.deepEqual(fresh.rows, [{ mode: "batch" }, { mode: "streaming" }]);
});
