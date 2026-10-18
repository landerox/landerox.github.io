import assert from "node:assert/strict";
import test from "node:test";
import {
  FAILURE_DRILLS,
  FAILURE_LIMITS,
  FAILURE_SCENARIOS,
  createSimulation,
  retryDelay,
  runDrill,
  runFailureComparison,
  stepSimulation,
} from "../content/en/assets/javascripts/failure-core.js";

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

test("guided drills run their fault, then drain the queue and conserve every event", () => {
  const ends = Object.fromEntries(Object.keys(FAILURE_DRILLS).map((id) => [id, runDrill(id)]));
  for (const [id, state] of Object.entries(ends)) {
    assert.equal(state.total, state.written + state.queue.length + state.dead + state.rejected, id);
    // A drill that drains ends with nothing waiting, within the playback limit.
    if (FAILURE_DRILLS[id].drain) assert.equal(state.queue.length, 0, id);
    assert.ok(state.tick >= FAILURE_DRILLS[id].seconds && state.tick <= FAILURE_LIMITS.ticks, id);
  }
  // Six seconds of failed writes leave six messages for review; the queue
  // drains two seconds after service returns.
  assert.deepEqual(
    [ends["outage-drain"].tick, ends["outage-drain"].dead, ends["outage-drain"].written],
    [12, 6, 30],
  );
  // Paused workers fill the queue until arrivals are refused.
  assert.equal(ends["workers-drain"].rejected, 6);
  assert.deepEqual([ends["healthy-flow"].tick, ends["healthy-flow"].written], [5, 15]);
  assert.throws(() => runDrill("meteor"), /drill/);
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
