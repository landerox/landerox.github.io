/** Bounded, DOM-free worksheets. No service checks or schema-registry claims. */
export const DECISION_LIMITS = Object.freeze({
  windowDays: 366,
  requests: 1_000_000_000_000,
  schemaCharacters: 32_768,
  columns: 200,
  columnName: 64,
});

export const COLUMN_TYPES = Object.freeze([
  "string",
  "integer",
  "number",
  "boolean",
  "date",
  "timestamp",
  "bytes",
  "json",
]);

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

/** Requests cover a complete measured window, not predicted future traffic.
 * Time uses a whole-window allowance and a possibly partial observed interval.
 * A null ratio is undefined, never silently coerced into healthy or infinity.
 */
export function calculateSlo({ mode, target, windowDays, observed, bad } = {}) {
  if (mode !== "requests" && mode !== "time")
    throw new DecisionToolError("slo_mode", "mode");
  requireNumber(target, 0, 100, "target");
  if (Number(target.toFixed(6)) !== target)
    throw new DecisionToolError("target_precision", "target");
  requireNumber(windowDays, 1 / 1440, DECISION_LIMITS.windowDays, "windowDays");
  const windowMinutes = windowDays * 24 * 60;
  requireNumber(
    observed,
    0,
    mode === "requests" ? DECISION_LIMITS.requests : windowMinutes,
    "observed",
  );
  requireNumber(bad, 0, observed, "bad");
  if (
    mode === "requests" &&
    (!Number.isSafeInteger(observed) || !Number.isSafeInteger(bad))
  )
    throw new DecisionToolError(
      "whole_requests",
      Number.isSafeInteger(observed) ? "bad" : "observed",
    );

  // Six decimal places in a percentage fit exactly into this integer scale.
  // This avoids 100 - 99.9 turning an exact 1,000-request allowance into 999.99…
  const allowedFraction =
    (100_000_000 - Math.round(target * 1_000_000)) / 100_000_000;
  const basis = mode === "requests" ? observed : windowMinutes;
  const budgetTotal = basis * allowedFraction;
  const difference = budgetTotal - bad;
  const tolerance = Number.EPSILON * 8 * Math.max(1, budgetTotal, bad);
  const budgetRemaining = Math.abs(difference) <= tolerance ? 0 : difference;
  const errorFraction = observed > 0 ? bad / observed : null;
  const burnRate =
    errorFraction !== null && allowedFraction > 0
      ? errorFraction / allowedFraction
      : null;
  return {
    mode,
    target,
    windowDays,
    windowMinutes,
    observed,
    bad,
    allowedFraction,
    budgetTotal,
    budgetUsed: bad,
    budgetRemaining,
    budgetUsedPercent: budgetTotal > 0 ? (bad / budgetTotal) * 100 : null,
    observedSli: errorFraction === null ? null : (1 - errorFraction) * 100,
    burnRate,
    state:
      observed === 0
        ? "unmeasured"
        : budgetRemaining < 0
          ? "exceeded"
          : budgetRemaining === 0
            ? "exhausted"
            : "within",
    partialObservation: mode === "time" && observed < windowMinutes,
  };
}

function plainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** An explicit small contract, NOT JSON Schema, Avro, SQL DDL or protobuf. */
export function parseTableSchema(text) {
  if (
    typeof text !== "string" ||
    text.length > DECISION_LIMITS.schemaCharacters
  )
    throw new DecisionToolError("schema_size");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new DecisionToolError("schema_json");
  }
  if (
    !plainRecord(parsed) ||
    Object.keys(parsed).length !== 1 ||
    !Object.hasOwn(parsed, "columns") ||
    !Array.isArray(parsed.columns)
  )
    throw new DecisionToolError("schema_shape");
  if (parsed.columns.length > DECISION_LIMITS.columns)
    throw new DecisionToolError("schema_columns");
  const names = new Set();
  const columns = parsed.columns.map((column) => {
    if (
      !plainRecord(column) ||
      Object.keys(column).length !== 3 ||
      !["name", "type", "nullable"].every((key) => Object.hasOwn(column, key))
    )
      throw new DecisionToolError("column_shape");
    if (
      typeof column.name !== "string" ||
      !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(column.name)
    )
      throw new DecisionToolError("column_name");
    if (!COLUMN_TYPES.includes(column.type))
      throw new DecisionToolError("column_type");
    if (typeof column.nullable !== "boolean")
      throw new DecisionToolError("column_nullable");
    if (names.has(column.name)) throw new DecisionToolError("column_duplicate");
    names.add(column.name);
    return { name: column.name, type: column.type, nullable: column.nullable };
  });
  return { columns };
}

export function compareTableSchemas(previousText, nextText) {
  const parse = (text, field) => {
    try {
      return parseTableSchema(text);
    } catch (error) {
      if (error instanceof DecisionToolError) error.field = field;
      throw error;
    }
  };
  const previous = parse(previousText, "previous");
  const next = parse(nextText, "next");
  // Maps, not name-keyed plain objects: __proto__ and constructor are inert names.
  const before = new Map(
    previous.columns.map((column) => [column.name, column]),
  );
  const after = new Map(next.columns.map((column) => [column.name, column]));
  const changes = [];
  const add = (kind, name, risk) =>
    changes.push({
      kind,
      name,
      before: before.get(name) || null,
      after: after.get(name) || null,
      risk,
    });
  for (const column of previous.columns) {
    const replacement = after.get(column.name);
    if (!replacement) {
      add("removed", column.name, "removed");
      continue;
    }
    if (column.type !== replacement.type) add("type", column.name, "type");
    if (column.nullable !== replacement.nullable)
      add(
        "nullability",
        column.name,
        replacement.nullable ? "relaxed" : "required",
      );
  }
  for (const column of next.columns) {
    if (!before.has(column.name))
      add(
        "added",
        column.name,
        column.nullable ? "added_nullable" : "added_required",
      );
  }
  const sharedBefore = previous.columns
    .filter((column) => after.has(column.name))
    .map((column) => column.name);
  const sharedAfter = next.columns
    .filter((column) => before.has(column.name))
    .map((column) => column.name);
  return {
    format: "landerox-flat-schema-diff/v1",
    previous,
    next,
    changes,
    changedColumns: new Set(changes.map((change) => change.name)).size,
    orderChanged: sharedBefore.some(
      (name, index) => name !== sharedAfter[index],
    ),
  };
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

/** One append-only table, data spread evenly: a planning estimate, not a
 * benchmark. Each commit writes at least one file per partition it touches,
 * split at the target size; parallel writers, deletes and sort order are not
 * modeled and usually add files. Compaction rewrites each partition into
 * files of about the target size.
 */
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
  // A daily batch into hourly partitions touches all 24 hours at once.
  const timePerCommit =
    partitioning === "hour" ? Math.ceil(24 / commitsPerDay) : 1;
  const touched = timePerCommit * buckets;
  const commitMiB = dailyMiB / commitsPerDay;
  // Fewer commits than hours: each write carries about one hour of data. An
  // even split over ceil(24 / commits) hours made writes smaller than a
  // partition, and compaction then "added" files. Same result when the
  // commit count divides 24.
  const writeMiB =
    partitioning === "hour" && commitsPerDay < 24
      ? dailyMiB / 24 / buckets
      : commitMiB / touched;
  const filesPerCommit =
    touched * Math.max(1, Math.ceil(writeMiB / targetMiB));
  const filesPerDay = filesPerCommit * commitsPerDay;
  const retainedMiB = dailyMiB * retentionDays;
  const partitions =
    partitioning === "none" ? buckets : perDay * retentionDays * buckets;
  const partitionMiB = retainedMiB / partitions;
  const averageFileMiB = commitMiB / filesPerCommit;
  return {
    commitMiB,
    touched,
    filesPerCommit,
    averageFileMiB,
    filesPerDay,
    retainedFiles: filesPerDay * retentionDays,
    compactedFiles:
      partitions * Math.max(1, Math.ceil(partitionMiB / targetMiB)),
    partitions,
    partitionMiB,
    // Below a quarter of the target, reads open many more files than needed.
    smallFiles: averageFileMiB < targetMiB / 4,
    // A partition smaller than one target file stays small after compaction.
    overPartitioned: partitionMiB < targetMiB,
  };
}
