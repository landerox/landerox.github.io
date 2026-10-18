// @ts-check
/** Table Files planning arithmetic: bounded, DOM-free, no service checks. */
export class DecisionToolError extends Error {
  constructor(code, field = "") {
    super(code);
    this.name = "DecisionToolError";
    this.code = code;
    this.field = field;
  }
}

function requireNumber(value, minimum, maximum, field) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  )
    throw new DecisionToolError("number_range", field);
}

export const TABLE_LIMITS = Object.freeze({
  dailyGiB: 1_000_000,
  commitsPerDay: 86_400,
  buckets: 1024,
  targetMiB: 4096,
  retentionDays: 3650,
});
export const TABLE_PARTITIONING = Object.freeze(["none", "day", "hour"]);

function requireInteger(value, minimum, maximum, field) {
  requireNumber(value, minimum, maximum, field);
  if (!Number.isInteger(value))
    throw new DecisionToolError("integer", field);
}

/** Which layout problem dominates: files written small that compaction can
 * merge (`heals`), partitions too small to merge into (`over-partitioned`),
 * both (`trap`) or neither (`balanced`). */
function tableVerdict(smallFiles, overPartitioned) {
  if (smallFiles) return overPartitioned ? "trap" : "heals";
  return overPartitioned ? "over-partitioned" : "balanced";
}

/** One append-only table, data spread evenly: a planning estimate, not a
 * benchmark. Each commit writes at least one file per partition it touches,
 * split at the target size; parallel writers, deletes and sort order are not
 * modeled and usually add files. Compaction rewrites each partition into
 * files of about the target size.
 */
/** @param {{dailyGiB?: number, commitsPerDay?: number, partitioning?: string, buckets?: number, targetMiB?: number, retentionDays?: number}} [input] */
export function planTableFiles({
  dailyGiB,
  commitsPerDay,
  partitioning,
  buckets,
  targetMiB,
  retentionDays,
} = {}) {
  requireNumber(dailyGiB, 0.001, TABLE_LIMITS.dailyGiB, "dailyGiB");
  requireInteger(commitsPerDay, 1, TABLE_LIMITS.commitsPerDay, "commitsPerDay");
  if (!TABLE_PARTITIONING.includes(partitioning))
    throw new DecisionToolError("partitioning", "partitioning");
  requireInteger(buckets, 1, TABLE_LIMITS.buckets, "buckets");
  requireInteger(targetMiB, 1, TABLE_LIMITS.targetMiB, "targetMiB");
  requireInteger(retentionDays, 1, TABLE_LIMITS.retentionDays, "retentionDays");
  const dailyMiB = dailyGiB * 1024;
  const perDay = partitioning === "hour" ? 24 : 1;
  // Partition-bucket writes per day and the data each one carries.
  let writesPerDay;
  let writeMiB;
  if (partitioning !== "hour") {
    writesPerDay = commitsPerDay * buckets;
    writeMiB = dailyMiB / writesPerDay;
  } else if (commitsPerDay < 24) {
    // Fewer commits than hours: each commit writes the ceil(24 / commits)
    // hours since the last one, about one hour of data per write; a daily
    // batch touches all 24.
    writesPerDay = commitsPerDay * Math.ceil(24 / commitsPerDay) * buckets;
    writeMiB = dailyMiB / 24 / buckets;
  } else {
    // At least a commit an hour: each hour takes ceil(commits / 24) writes,
    // so a commit that straddles an hour boundary writes to both hours.
    writesPerDay = 24 * Math.ceil(commitsPerDay / 24) * buckets;
    writeMiB = dailyMiB / writesPerDay;
  }
  const filesPerDay = writesPerDay * Math.max(1, Math.ceil(writeMiB / targetMiB));
  const retainedMiB = dailyMiB * retentionDays;
  const partitions =
    partitioning === "none" ? buckets : perDay * retentionDays * buckets;
  const partitionMiB = retainedMiB / partitions;
  const retainedFiles = filesPerDay * retentionDays;
  const compactedFiles = partitions * Math.max(1, Math.ceil(partitionMiB / targetMiB));
  const averageFileMiB = dailyMiB / filesPerDay;
  // Below a quarter of the target, reads open many more files than needed.
  const smallFiles = averageFileMiB < targetMiB / 4;
  // A partition smaller than one target file stays small after compaction.
  const overPartitioned = partitionMiB < targetMiB;
  return {
    commitMiB: dailyMiB / commitsPerDay,
    // Averages per commit: a commit can straddle partition boundaries.
    touched: writesPerDay / commitsPerDay,
    filesPerCommit: filesPerDay / commitsPerDay,
    averageFileMiB,
    filesPerDay,
    retainedFiles,
    compactedFiles,
    // Share of retained files that compaction removes.
    reduction: 1 - compactedFiles / retainedFiles,
    partitions,
    partitionMiB,
    writeRatio: averageFileMiB / targetMiB,
    partitionRatio: partitionMiB / targetMiB,
    smallFiles,
    overPartitioned,
    verdict: tableVerdict(smallFiles, overPartitioned),
  };
}
