import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_STRATEGIES,
  AI_LIMITS,
  AiToolError,
  cohenKappa,
  compareAgentStrategies,
  describeIncident,
  intervalLadder,
  intervalReading,
  kappaReading,
  sampleSize,
  simulateAgentRun,
  wilsonInterval,
} from "../content/en/assets/javascripts/ai-tools-core.js";

const close = (actual, expected, tolerance = 1e-4) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} ≈ ${expected}`,
  );
const rejects = (run, code, field) =>
  assert.throws(run, (error) => {
    assert.ok(error instanceof AiToolError);
    assert.equal(error.code, code);
    if (field) assert.equal(error.field, field);
    return true;
  });

const incident = { steps: 6, writeEvery: 2, crashStep: 4, crashPoint: "after" };
const byStrategy = (config) =>
  Object.fromEntries(
    compareAgentStrategies(config).map((row) => [row.strategy, row]),
  );

test("a run without a crash calls each step once under every strategy", () => {
  for (const row of compareAgentStrategies({ ...incident, crashStep: 0 })) {
    assert.equal(row.calls, 6);
    assert.equal(row.replayed, 0);
    assert.equal(row.writes, 3);
    assert.equal(row.intendedWrites, 3);
    assert.equal(row.safe, true);
    assert.ok(row.trace.every((item) => item.kind !== "crash"));
  }
});

test("a crash after the effect duplicates writes unless a key is remembered", () => {
  const rows = byStrategy(incident);
  // Restart replays steps 1–4; writes 2 and 4 already happened.
  assert.equal(rows.restart.calls, 10);
  assert.equal(rows.restart.replayed, 4);
  assert.equal(rows.restart.duplicateWrites, 2);
  assert.equal(rows.restart.writes, 5);
  assert.equal(rows.restart.safe, false);
  // Keys keep the calls but turn both repeated writes into lookups.
  assert.equal(rows["restart-keys"].calls, 10);
  assert.equal(rows["restart-keys"].deduplicated, 2);
  assert.equal(rows["restart-keys"].writes, 3);
  assert.equal(rows["restart-keys"].safe, true);
  // A checkpoint resumes at the step whose record was lost: one replay.
  assert.equal(rows.checkpoint.calls, 7);
  assert.equal(rows.checkpoint.replayed, 1);
  assert.equal(rows.checkpoint.duplicateWrites, 1);
  assert.equal(rows.checkpoint.safe, false);
  assert.equal(rows["checkpoint-keys"].calls, 7);
  assert.equal(rows["checkpoint-keys"].duplicateWrites, 0);
  assert.equal(rows["checkpoint-keys"].writes, 3);
  assert.equal(rows["checkpoint-keys"].safe, true);
});

test("a checkpoint alone is safe when the crash precedes the call or hits a read", () => {
  const before = byStrategy({ ...incident, crashPoint: "before" });
  assert.equal(before.checkpoint.calls, 6);
  assert.equal(before.checkpoint.replayed, 0);
  assert.equal(before.checkpoint.safe, true);
  // Restart still repeats write 2, which ran before the crash.
  assert.equal(before.restart.replayed, 3);
  assert.equal(before.restart.duplicateWrites, 1);
  const read = byStrategy({ ...incident, crashStep: 3 });
  assert.equal(read.checkpoint.replayed, 1);
  assert.equal(read.checkpoint.safe, true);
});

test("the trace records the crash and each repeated call in order", () => {
  const { trace } = simulateAgentRun({ ...incident, strategy: "checkpoint" });
  assert.deepEqual(
    trace.map((item) => `${item.step}:${item.kind}:${item.outcome}`),
    [
      "1:read:applied",
      "2:write:applied",
      "3:read:applied",
      "4:write:applied",
      "4:crash:after",
      "4:write:duplicate",
      "5:read:applied",
      "6:write:applied",
    ],
  );
  assert.equal(trace[5].replay, true);
  assert.equal(trace[6].replay, false);
});

test("the incident reading matches what each strategy actually repeats", () => {
  const kind = (config) => describeIncident({ ...incident, ...config });
  assert.equal(kind({ crashStep: 0 }).kind, "healthy");
  // Before call 1 nothing has run: no strategy repeats a write.
  const first = kind({ crashStep: 1, crashPoint: "before" });
  assert.equal(first.kind, "first");
  assert.ok(first.rows.every((row) => row.replayed === 0 && row.duplicateWrites === 0));
  // Before a later call the checkpoint is exact; a restart repeats write 2.
  const before = kind({ crashPoint: "before" });
  assert.equal(before.kind, "before");
  assert.equal(before.restartWrites, 1);
  const checkpoint = before.rows.find((row) => row.strategy === "checkpoint");
  assert.equal(checkpoint.replayed + checkpoint.duplicateWrites, 0);
  // After a write the checkpoint repeats exactly that write.
  const write = kind({});
  assert.equal(write.kind, "after-write");
  assert.equal(write.restartWrites, 2);
  assert.equal(write.rows.find((row) => row.strategy === "checkpoint").duplicateWrites, 1);
  // After the first write, a restart repeats it once: one write, not "writes".
  assert.equal(kind({ crashStep: 2 }).restartWrites, 1);
  // After a read the checkpoint repeats only that read.
  const read = kind({ crashStep: 3 });
  assert.equal(read.kind, "after-read");
  const replay = read.rows.find((row) => row.strategy === "checkpoint");
  assert.deepEqual([replay.replayed, replay.duplicateWrites], [1, 0]);
});

test("agent runs reject values outside the bounded model", () => {
  rejects(() => simulateAgentRun(), "number_range", "steps");
  rejects(
    () => simulateAgentRun({ ...incident, steps: AI_LIMITS.steps + 1, strategy: "restart" }),
    "number_range",
    "steps",
  );
  rejects(
    () => simulateAgentRun({ ...incident, steps: 2.5, strategy: "restart" }),
    "integer",
    "steps",
  );
  rejects(
    () => simulateAgentRun({ ...incident, crashStep: 7, strategy: "restart" }),
    "number_range",
    "crashStep",
  );
  rejects(
    () => simulateAgentRun({ ...incident, crashPoint: "during", strategy: "restart" }),
    "crash_point",
    "crashPoint",
  );
  rejects(() => simulateAgentRun({ ...incident, strategy: "retry" }), "strategy");
  assert.equal(AGENT_STRATEGIES.length, 4);
});

test("Wilson interval matches a hand-checked pass rate and stays inside 0–1", () => {
  const result = wilsonInterval({ successes: 42, trials: 50, confidence: 95 });
  close(result.rate, 0.84);
  close(result.lower, 0.7149);
  close(result.upper, 0.9166);
  const none = wilsonInterval({ successes: 0, trials: 20, confidence: 95 });
  assert.equal(none.lower, 0);
  close(none.upper, 0.1611);
  const all = wilsonInterval({ successes: 20, trials: 20, confidence: 95 });
  assert.equal(all.upper, 1);
  close(all.lower, 0.8389);
  // A higher confidence level widens the interval.
  const wide = wilsonInterval({ successes: 42, trials: 50, confidence: 99 });
  assert.ok(wide.lower < result.lower && wide.upper > result.upper);
});

test("Wilson interval rejects impossible counts and unknown levels", () => {
  rejects(() => wilsonInterval({ successes: 5, trials: 0, confidence: 95 }), "number_range", "trials");
  rejects(() => wilsonInterval({ successes: 51, trials: 50, confidence: 95 }), "number_range", "successes");
  rejects(() => wilsonInterval({ successes: 1.5, trials: 50, confidence: 95 }), "integer", "successes");
  rejects(() => wilsonInterval({ successes: 5, trials: 50, confidence: 97 }), "confidence", "confidence");
});

test("sample size grows as the difference shrinks or the power rises", () => {
  const base = sampleSize({ baseline: 0.8, candidate: 0.85, confidence: 95, power: 80 });
  assert.equal(base.perVariant, 906);
  assert.equal(base.total, 1812);
  close(base.difference, 0.05);
  // The same difference is found in either direction.
  assert.equal(
    sampleSize({ baseline: 0.85, candidate: 0.8, confidence: 95, power: 80 }).perVariant,
    906,
  );
  assert.equal(
    sampleSize({ baseline: 0.8, candidate: 0.85, confidence: 95, power: 90 }).perVariant,
    1212,
  );
  assert.ok(
    sampleSize({ baseline: 0.8, candidate: 0.82, confidence: 95, power: 80 }).perVariant >
      base.perVariant,
  );
  rejects(
    () => sampleSize({ baseline: 0.8, candidate: 0.8, confidence: 95, power: 80 }),
    "no_difference",
    "candidate",
  );
  rejects(
    () => sampleSize({ baseline: 1, candidate: 0.8, confidence: 95, power: 80 }),
    "number_range",
    "baseline",
  );
  rejects(
    () => sampleSize({ baseline: 0.8, candidate: 0.85, confidence: 95, power: 95 }),
    "power",
    "power",
  );
});

test("Cohen's kappa separates agreement from chance and stays undefined when it must", () => {
  const result = cohenKappa({ bothPass: 40, onlyA: 5, onlyB: 10, bothFail: 45 });
  assert.equal(result.total, 100);
  close(result.observed, 0.85);
  close(result.expected, 0.5);
  close(result.kappa, 0.7);
  // 90% raw agreement can still be no better than chance.
  const skewed = cohenKappa({ bothPass: 90, onlyA: 5, onlyB: 5, bothFail: 0 });
  close(skewed.observed, 0.9);
  assert.ok(skewed.kappa < 0);
  assert.equal(cohenKappa({ bothPass: 30, onlyA: 0, onlyB: 0, bothFail: 0 }).kappa, null);
  close(cohenKappa({ bothPass: 0, onlyA: 10, onlyB: 10, bothFail: 0 }).kappa, -1);
  rejects(() => cohenKappa({ bothPass: 0, onlyA: 0, onlyB: 0, bothFail: 0 }), "no_examples");
  rejects(() => cohenKappa({ bothPass: -1, onlyA: 0, onlyB: 0, bothFail: 2 }), "number_range", "bothPass");
});

test("interval readings report both bounds and flag small all-pass runs", () => {
  // 42/50: Wilson is not symmetric around the observed 84%.
  const pilot = wilsonInterval({ successes: 42, trials: 50, confidence: 95 });
  const reading = intervalReading({ successes: 42, trials: 50, ...pilot });
  assert.equal(reading.kind, "standard");
  close(reading.below, 0.84 - 0.7149);
  close(reading.above, 0.9166 - 0.84);
  assert.ok(reading.below > reading.above);
  const perfect = (trials) =>
    intervalReading({ successes: trials, trials, ...wilsonInterval({ successes: trials, trials, confidence: 95 }) }).kind;
  assert.equal(perfect(20), "perfect");
  // A large all-pass run leaves less than half a point below 100%.
  assert.equal(perfect(1000), "standard");
  // Zero passes is not a ceiling: the standard reading applies.
  const none = wilsonInterval({ successes: 0, trials: 20, confidence: 95 });
  assert.equal(intervalReading({ successes: 0, trials: 20, ...none }).kind, "standard");
});

test("kappa readings separate the paradox, strong, some and no agreement", () => {
  const reading = (counts) => kappaReading(cohenKappa(counts));
  assert.deepEqual(reading({ bothPass: 90, onlyA: 5, onlyB: 5, bothFail: 0 }), { kind: "paradox", rare: "fail" });
  // The mirror case: passes are the rare label.
  assert.deepEqual(reading({ bothPass: 0, onlyA: 5, onlyB: 5, bothFail: 90 }), { kind: "paradox", rare: "pass" });
  assert.equal(reading({ bothPass: 47, onlyA: 3, onlyB: 3, bothFail: 47 }).kind, "strong");
  assert.equal(reading({ bothPass: 40, onlyA: 5, onlyB: 10, bothFail: 45 }).kind, "strong");
  assert.equal(reading({ bothPass: 60, onlyA: 10, onlyB: 10, bothFail: 20 }).kind, "moderate");
  // 40% observed against 50% expected: below chance, not "calibrated".
  assert.equal(reading({ bothPass: 20, onlyA: 30, onlyB: 30, bothFail: 20 }).kind, "none");
  assert.equal(reading({ bothPass: 30, onlyA: 0, onlyB: 0, bothFail: 0 }).kind, "undefined");
  const rates = cohenKappa({ bothPass: 40, onlyA: 5, onlyB: 10, bothFail: 45 });
  close(rates.passA, 0.45);
  close(rates.passB, 0.5);
});

test("the interval ladder multiplies the sample by four until the limit", () => {
  const ladder = intervalLadder({ successes: 42, trials: 50, confidence: 95 });
  assert.deepEqual(ladder.map((row) => [row.successes, row.trials]), [[42, 50], [168, 200], [672, 800]]);
  const widths = ladder.map((row) => row.upper - row.lower);
  assert.ok(widths[1] / widths[0] > 0.49 && widths[1] / widths[0] < 0.51);
  assert.ok(widths[2] / widths[1] > 0.49 && widths[2] / widths[1] < 0.51);
  assert.equal(intervalLadder({ successes: 1, trials: AI_LIMITS.trials, confidence: 95 }).length, 1);
  assert.equal(intervalLadder({ successes: 1, trials: AI_LIMITS.trials / 4, confidence: 95 }).length, 2);
  assert.throws(() => intervalLadder({ successes: 60, trials: 50, confidence: 95 }), { code: "number_range" });
});
