import assert from "node:assert/strict";
import test from "node:test";
import {
  DecisionToolError,
  planTableFiles,
  TABLE_LIMITS,
} from "../content/en/assets/javascripts/decision-tools-core.js";

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
  // Commit counts below 24 that do not divide it: compaction never adds files.
  for (const commitsPerDay of [5, 7, 10, 23]) {
    const plan = planTableFiles({ ...lake, commitsPerDay, buckets: 1 });
    assert.ok(plan.compactedFiles <= plan.retainedFiles, `${commitsPerDay} commits`);
  }
  // Unpartitioned: compaction works on the whole retained table per bucket.
  const flat = planTableFiles({ ...lake, partitioning: "none", buckets: 1 });
  assert.equal(flat.partitions, 1);
  assert.equal(flat.compactedFiles, Math.ceil((50 * 1024 * 90) / 512));
});

test("table planner never compacts to more files than a table keeps", () => {
  for (let commitsPerDay = 1; commitsPerDay <= 200; commitsPerDay += 1)
    for (const dailyGiB of [0.05, 1, 12.5, 50, 120])
      for (const buckets of [1, 4, 16]) {
        const plan = planTableFiles({ ...lake, dailyGiB, commitsPerDay, buckets });
        const label = `${commitsPerDay} commits, ${dailyGiB} GiB, ${buckets} buckets`;
        assert.ok(plan.compactedFiles <= plan.retainedFiles, label);
        assert.ok(plan.reduction >= 0, label);
      }
  // 25 commits a day into hourly partitions: each hour takes two writes,
  // because a commit that straddles an hour boundary writes both hours.
  const straddle = planTableFiles({ ...lake, dailyGiB: 12.5, commitsPerDay: 25, buckets: 1 });
  assert.equal(straddle.filesPerDay, 48);
  assert.equal(straddle.compactedFiles, straddle.retainedFiles);
  assert.equal(straddle.filesPerCommit, 48 / 25);
});

test("table planner names the layout problem and states its ratios", () => {
  const daily = { ...lake, partitioning: "day" };
  // Hourly × 16 buckets: small writes into partitions below the target.
  assert.equal(planTableFiles(lake).verdict, "trap");
  // Daily × 4 buckets: small writes, but each partition outgrows the target.
  const heals = planTableFiles({ ...daily, buckets: 4 });
  assert.equal(heals.verdict, "heals");
  assert.equal(heals.filesPerDay, 1152);
  assert.equal(heals.partitionRatio, 25);
  // One 512 MiB write a day split over 4 buckets: no small files, but each
  // partition stays below one target file.
  const over = planTableFiles({ ...daily, dailyGiB: 0.5, commitsPerDay: 1, buckets: 4 });
  assert.equal(over.verdict, "over-partitioned");
  assert.equal(over.reduction, 0);
  // A 2 TiB daily batch: target-size writes, nothing to merge. The ratio is
  // reported in full (4,096 target files per partition), never clamped.
  const batch = planTableFiles({ ...daily, dailyGiB: 2048, commitsPerDay: 1, buckets: 1, retentionDays: 30 });
  assert.equal(batch.verdict, "balanced");
  assert.equal(batch.reduction, 0);
  assert.equal(batch.writeRatio, 1);
  assert.equal(batch.partitionRatio, 4096);
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
