import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateSlo,
  parseTableSchema,
  compareTableSchemas,
  DECISION_LIMITS,
  DecisionToolError,
  planTableFiles,
  TABLE_LIMITS,
} from "../content/en/assets/javascripts/decision-tools-core.js";

const request = {
  mode: "requests",
  target: 99.9,
  windowDays: 30,
  observed: 1_000_000,
  bad: 250,
};
const schema = (columns) => JSON.stringify({ columns });
const column = (name, type = "string", nullable = false) => ({
  name,
  type,
  nullable,
});
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≈ ${expected}`);

test("request SLO uses measured requests, with stable decimal allowance and burn", () => {
  const result = calculateSlo(request);
  assert.equal(result.budgetTotal, 1000);
  assert.equal(result.budgetUsed, 250);
  assert.equal(result.budgetRemaining, 750);
  assert.equal(result.budgetUsedPercent, 25);
  assert.equal(result.burnRate, 0.25);
  close(result.observedSli, 99.975);
  assert.equal(result.state, "within");
  assert.equal(calculateSlo({ ...request, bad: 1000 }).state, "exhausted");
});

test("time SLO distinguishes whole-window budget from partial observed exposure", () => {
  const result = calculateSlo({
    mode: "time",
    target: 99.9,
    windowDays: 30,
    observed: 1440,
    bad: 10,
  });
  close(result.budgetTotal, 43.2);
  close(result.budgetRemaining, 33.2);
  close(result.burnRate, 10 / 1440 / 0.001);
  assert.equal(result.partialObservation, true);
  const overspent = calculateSlo({
    mode: "time",
    target: 99.9,
    windowDays: 30,
    observed: 43200,
    bad: 60,
  });
  close(overspent.budgetRemaining, -16.8);
  assert.equal(overspent.state, "exceeded");
});

test("zero traffic and unobserved time never imply a healthy SLI", () => {
  for (const mode of ["requests", "time"]) {
    const result = calculateSlo({ ...request, mode, observed: 0, bad: 0 });
    assert.equal(result.observedSli, null);
    assert.equal(result.burnRate, null);
    assert.equal(result.state, "unmeasured");
  }
});

test("100% SLO has no allowance or defined burn ratio, and exposes failures", () => {
  const clean = calculateSlo({ ...request, target: 100, bad: 0 });
  assert.equal(clean.budgetTotal, 0);
  assert.equal(clean.budgetRemaining, 0);
  assert.equal(clean.burnRate, null);
  assert.equal(clean.budgetUsedPercent, null);
  const failed = calculateSlo({ ...request, target: 100, bad: 1 });
  assert.equal(failed.state, "exceeded");
  assert.equal(failed.budgetRemaining, -1);
});

test("0% and the highest supported precision stay finite without rounding requests away", () => {
  const trivial = calculateSlo({ ...request, target: 0, bad: 1_000_000 });
  assert.equal(trivial.budgetTotal, 1_000_000);
  assert.equal(trivial.burnRate, 1);
  const strict = calculateSlo({ ...request, target: 99.999999 });
  assert.equal(strict.budgetTotal, 0.01);
  assert.equal(strict.budgetUsed, 250);
  assert.equal(strict.state, "exceeded");
  assert.ok(
    Object.values(strict).every(
      (value) => typeof value !== "number" || Number.isFinite(value),
    ),
  );
});

test("SLO rejects coercions, impossible exposure, invalid periods and fractional requests", () => {
  for (const patch of [
    { mode: "uptime" },
    { target: "99.9" },
    { target: NaN },
    { target: Infinity },
    { target: -0.1 },
    { target: 100.1 },
    { target: 99.9999999 },
    { windowDays: 0 },
    { windowDays: 1e-12 },
    { windowDays: 367 },
    { observed: -1 },
    { observed: 1.5 },
    { observed: DECISION_LIMITS.requests + 1 },
    { bad: -1 },
    { bad: 0.5 },
    { bad: 1_000_001 },
    { observed: 0 },
    { mode: "time", observed: 43201 },
    { mode: "time", observed: 5, bad: 6 },
  ])
    assert.throws(
      () => calculateSlo({ ...request, ...patch }),
      DecisionToolError,
    );
  assert.throws(() => calculateSlo(), DecisionToolError);
});

test("SLO conservation holds over a range of eligible exposure and goals", () => {
  for (const target of [0, 50, 99, 99.9, 99.999999, 100]) {
    for (const observed of [0, 1, 100, 1_000_000, DECISION_LIMITS.requests]) {
      for (const bad of [0, Math.floor(observed / 2), observed]) {
        const result = calculateSlo({ ...request, target, observed, bad });
        const delta = Math.abs(
          result.budgetUsed + result.budgetRemaining - result.budgetTotal,
        );
        assert.ok(delta <= 1e-3);
        assert.ok(
          result.observedSli === null ||
            (result.observedSli >= 0 && result.observedSli <= 100),
        );
        assert.ok(result.burnRate === null || Number.isFinite(result.burnRate));
      }
    }
  }
});

test("flat schemas validate exact fields, names, types, booleans and size bounds", () => {
  assert.deepEqual(parseTableSchema(schema([])), { columns: [] });
  for (const input of [
    "",
    "{",
    "null",
    "[]",
    '{"columns":{}}',
    '{"columns":[],"extra":true}',
    schema([column("a"), column("a")]),
    schema([{ name: "a", type: "string" }]),
    schema([{ ...column("a"), nullable: "false" }]),
    schema([{ ...column("a"), default: 0 }]),
    schema([column("1bad")]),
    schema([column(" spaced ")]),
    schema([column("a".repeat(65))]),
    schema([column("a", "varchar(30)")]),
    schema([column("a", "String")]),
    schema([null]),
    schema([[]]),
    " ".repeat(DECISION_LIMITS.schemaCharacters + 1),
    schema(Array.from({ length: 201 }, (_, index) => column("c" + index))),
  ])
    assert.throws(() => parseTableSchema(input), DecisionToolError);
  assert.equal(
    parseTableSchema(
      schema(Array.from({ length: 200 }, (_, i) => column("c" + i))),
    ).columns.length,
    200,
  );
});

test("schema input is inert JSON, including prototype names and hostile markup", () => {
  for (const name of [
    "<img src=x onerror=alert(1)>",
    'a";alert(1)',
    "a\u0000b",
    "a.b",
    "a b",
  ]) {
    assert.throws(
      () => parseTableSchema(schema([column(name)])),
      DecisionToolError,
    );
  }
  assert.throws(
    () => parseTableSchema('{"columns":[],"__proto__":{"polluted":true}}'),
    DecisionToolError,
  );
  const result = compareTableSchemas(
    schema([column("__proto__"), column("constructor")]),
    schema([column("__proto__", "integer")]),
  );
  assert.deepEqual(
    result.changes.map((change) => [change.name, change.kind]),
    [
      ["__proto__", "type"],
      ["constructor", "removed"],
    ],
  );
  assert.equal({}.polluted, undefined);
});

test("diff reports additions, removals, types and both nullability directions", () => {
  const result = compareTableSchemas(
    schema([
      column("gone"),
      column("count", "integer"),
      column("optional", "string", true),
      column("required"),
    ]),
    schema([
      column("count", "number"),
      column("optional"),
      column("required", "string", true),
      column("new_a", "date", true),
      column("new_b", "json"),
    ]),
  );
  assert.deepEqual(
    result.changes.map((change) => change.risk),
    [
      "removed",
      "type",
      "required",
      "relaxed",
      "added_nullable",
      "added_required",
    ],
  );
  assert.equal(result.changedColumns, 6);
});

test("renames remain removal plus addition; shared-column reordering is explicit", () => {
  const renamed = compareTableSchemas(
    schema([column("old_name")]),
    schema([column("new_name")]),
  );
  assert.deepEqual(
    renamed.changes.map((change) => change.kind),
    ["removed", "added"],
  );
  const reordered = compareTableSchemas(
    schema([column("a"), column("b")]),
    schema([column("b"), column("a")]),
  );
  assert.equal(reordered.changes.length, 0);
  assert.equal(reordered.orderChanged, true);
  assert.equal(
    compareTableSchemas(schema([column("a")]), schema([column("a")]))
      .orderChanged,
    false,
  );
});

test("validation identifies the edited side without modifying supplied strings", () => {
  const text = schema([column("a")]);
  assert.throws(
    () => compareTableSchemas("invalid", text),
    (error) => error.field === "previous",
  );
  assert.throws(
    () => compareTableSchemas(text, "invalid"),
    (error) => error.field === "next",
  );
  assert.deepEqual(compareTableSchemas(text, text).previous, JSON.parse(text));
});

const lake = {
  dailyGiB: 50,
  commitsPerDay: 288,
  partitioning: "hour",
  buckets: 16,
  targetMiB: 512,
  retentionDays: 90,
};

test("table planner shows small files from frequent commits into fine partitions", () => {
  const plan = planTableFiles(lake);
  // 51,200 MiB/day over 288 commits, spread over 16 buckets of one hour.
  assert.equal(plan.touched, 16);
  assert.equal(plan.filesPerCommit, 16);
  assert.equal(Math.round(plan.averageFileMiB * 100) / 100, 11.11);
  assert.equal(plan.filesPerDay, 4608);
  assert.equal(plan.retainedFiles, 414_720);
  assert.equal(plan.partitions, 24 * 90 * 16);
  assert.equal(Math.round(plan.partitionMiB * 100) / 100, 133.33);
  // Each hourly bucket holds less than one target file, even compacted.
  assert.equal(plan.compactedFiles, plan.partitions);
  assert.equal(plan.smallFiles, true);
  assert.equal(plan.overPartitioned, true);
});

test("table planner splits large commits and compacts whole partitions", () => {
  const daily = planTableFiles({ ...lake, dailyGiB: 2048, commitsPerDay: 1, partitioning: "day", buckets: 1 });
  // One 2 TiB daily commit: 4,096 target-size files, already compact.
  assert.equal(daily.filesPerCommit, 4096);
  assert.equal(daily.averageFileMiB, 512);
  assert.equal(daily.compactedFiles, daily.retainedFiles);
  assert.equal(daily.smallFiles, false);
  assert.equal(daily.overPartitioned, false);
  // A daily batch into hourly partitions touches all 24 hours.
  assert.equal(planTableFiles({ ...lake, commitsPerDay: 1, buckets: 1 }).touched, 24);
  assert.equal(planTableFiles({ ...lake, commitsPerDay: 5, buckets: 1 }).touched, 5);
  // Unpartitioned: compaction works on the whole retained table per bucket.
  const flat = planTableFiles({ ...lake, partitioning: "none", buckets: 1 });
  assert.equal(flat.partitions, 1);
  assert.equal(flat.compactedFiles, Math.ceil((50 * 1024 * 90) / 512));
});

test("table planner rejects out-of-range and fractional inputs", () => {
  const code = (input) => {
    try {
      planTableFiles(input);
    } catch (error) {
      assert.ok(error instanceof DecisionToolError);
      return `${error.code}:${error.field}`;
    }
    return "ok";
  };
  assert.equal(code(lake), "ok");
  assert.equal(code({ ...lake, dailyGiB: 0 }), "number_range:dailyGiB");
  assert.equal(code({ ...lake, dailyGiB: TABLE_LIMITS.dailyGiB + 1 }), "number_range:dailyGiB");
  assert.equal(code({ ...lake, commitsPerDay: 1.5 }), "integer:commitsPerDay");
  assert.equal(code({ ...lake, partitioning: "month" }), "partitioning:partitioning");
  assert.equal(code({ ...lake, buckets: 0 }), "number_range:buckets");
  assert.equal(code({ ...lake, targetMiB: Number.NaN }), "number_range:targetMiB");
  assert.equal(code({ ...lake, retentionDays: 3651 }), "number_range:retentionDays");
  assert.equal(code({}), "number_range:dailyGiB");
});
