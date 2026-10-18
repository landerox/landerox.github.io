// @ts-check
/** Bounded, DOM-free worksheets for AI engineering: agent crash recovery and
 * evaluation statistics. Pure arithmetic: no model runs. */
export const AI_LIMITS = Object.freeze({
  steps: 12,
  trials: 1_000_000,
});

export class AiToolError extends Error {
  constructor(code, field = "") {
    super(code);
    this.name = "AiToolError";
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
    throw new AiToolError("number_range", field);
}

function requireInteger(value, minimum, maximum, field) {
  requireNumber(value, minimum, maximum, field);
  if (!Number.isInteger(value)) throw new AiToolError("integer", field);
}

// ---------------------------------------------------------------------------
// Durable agent run
// ---------------------------------------------------------------------------

export const CRASH_POINTS = Object.freeze(["before", "after"]);

/** How a run resumes after a crash. `checkpoint` saves after every step;
 * `keys` gives each write an idempotency key the tool remembers. */
export const AGENT_STRATEGIES = Object.freeze([
  Object.freeze({ id: "restart", checkpoint: false, keys: false }),
  Object.freeze({ id: "restart-keys", checkpoint: false, keys: true }),
  Object.freeze({ id: "checkpoint", checkpoint: true, keys: false }),
  Object.freeze({ id: "checkpoint-keys", checkpoint: true, keys: true }),
]);

/**
 * One agent run of `steps` tool calls, where every `writeEvery`-th call has a
 * side effect. The process crashes once at `crashStep`: `before` the call
 * runs, or `after` its effect and before anything records that it ran.
 *
 * The trace lists every call the tool received. A write counts once per call
 * that changed state, so a replayed write without an idempotency key is a
 * duplicate. `crashStep` 0 means no crash.
 */
/** @param {{steps?: number, writeEvery?: number, crashStep?: number, crashPoint?: string, strategy?: string}} [input] */
export function simulateAgentRun({
  steps,
  writeEvery,
  crashStep,
  crashPoint,
  strategy,
} = {}) {
  requireInteger(steps, 1, AI_LIMITS.steps, "steps");
  requireInteger(writeEvery, 1, AI_LIMITS.steps, "writeEvery");
  requireInteger(crashStep, 0, steps, "crashStep");
  if (!CRASH_POINTS.includes(crashPoint))
    throw new AiToolError("crash_point", "crashPoint");
  const plan = AGENT_STRATEGIES.find((item) => item.id === strategy);
  if (!plan) throw new AiToolError("strategy", "strategy");

  const isWrite = (step) => step % writeEvery === 0;
  const trace = [];
  const applied = new Map();
  const call = (step, replay) => {
    const write = isWrite(step);
    const seen = applied.get(step) || 0;
    // A remembered key returns the stored result instead of acting again.
    const deduplicated = write && plan.keys && seen > 0;
    if (write && !deduplicated) applied.set(step, seen + 1);
    trace.push({
      step,
      kind: write ? "write" : "read",
      replay,
      outcome: deduplicated
        ? "deduplicated"
        : write && seen > 0
          ? "duplicate"
          : "applied",
    });
  };

  if (crashStep === 0) {
    for (let step = 1; step <= steps; step += 1) call(step, false);
  } else {
    const reached = crashPoint === "after" ? crashStep : crashStep - 1;
    for (let step = 1; step <= reached; step += 1) call(step, false);
    trace.push({ step: crashStep, kind: "crash", replay: false, outcome: crashPoint });
    // The checkpoint for a step is written after its call returns, so a
    // crash after the effect leaves that step unrecorded.
    const resumeAt = plan.checkpoint ? crashStep : 1;
    for (let step = resumeAt; step <= steps; step += 1)
      call(step, step <= reached);
  }

  const calls = trace.filter((item) => item.kind !== "crash");
  const duplicateWrites = calls.filter((item) => item.outcome === "duplicate").length;
  return {
    trace,
    calls: calls.length,
    replayed: calls.filter((item) => item.replay).length,
    deduplicated: calls.filter((item) => item.outcome === "deduplicated").length,
    writes: [...applied.values()].reduce((total, count) => total + count, 0),
    intendedWrites: Math.floor(steps / writeEvery),
    duplicateWrites,
    safe: duplicateWrites === 0,
  };
}

/** The same incident under each resume strategy, in a fixed order. */
/** @param {{steps?: number, writeEvery?: number, crashStep?: number, crashPoint?: string}} [config] */
export function compareAgentStrategies(config = {}) {
  return AGENT_STRATEGIES.map(({ id }) => ({
    strategy: id,
    ...simulateAgentRun({ ...config, strategy: id }),
  }));
}

/**
 * What kind of incident a configuration describes, for the explanation that
 * follows the comparison: no crash, a crash before anything ran, a crash
 * before a call, or a crash after a write or a read whose effect went
 * unrecorded. `restartWrites` counts the writes a keyless restart repeats.
 */
/** @param {{steps?: number, writeEvery?: number, crashStep?: number, crashPoint?: string}} [config] */
export function describeIncident(config = {}) {
  const rows = compareAgentStrategies(config);
  const { crashStep = 0, crashPoint, writeEvery = 1 } = config;
  const kind =
    crashStep === 0
      ? "healthy"
      : crashPoint === "before"
        ? crashStep === 1
          ? "first"
          : "before"
        : crashStep % writeEvery === 0
          ? "after-write"
          : "after-read";
  return { kind, step: crashStep, restartWrites: rows[0].duplicateWrites, rows };
}

// ---------------------------------------------------------------------------
// Evaluation statistics
// ---------------------------------------------------------------------------

/** Two-sided standard normal quantiles for the offered confidence levels. */
const CONFIDENCE_Z = Object.freeze({ 90: 1.6448536, 95: 1.959964, 99: 2.5758293 });
/** One-sided quantiles for the offered statistical power. */
const POWER_Z = Object.freeze({ 80: 0.8416212, 90: 1.2815516 });
/** An all-pass run is worth a warning while its lower bound sits at least
 * this far below 100%. */
const PERFECT_GAP = 0.005;
/** High raw agreement with a low kappa: the prevalence paradox. */
const PARADOX_AGREEMENT = 0.8;
const PARADOX_KAPPA = 0.4;
/** Kappa from which agreement reads as substantial (Landis and Koch). */
const STRONG_KAPPA = 0.6;

/**
 * Wilson score interval for a pass rate. Unlike the normal approximation it
 * stays inside 0–1 and remains usable at 0 or 100% observed passes.
 */
/** @param {{successes?: number, trials?: number, confidence?: number}} [input] */
export function wilsonInterval({ successes, trials, confidence } = {}) {
  requireInteger(trials, 1, AI_LIMITS.trials, "trials");
  requireInteger(successes, 0, trials, "successes");
  const z = CONFIDENCE_Z[confidence];
  if (!z) throw new AiToolError("confidence", "confidence");
  const rate = successes / trials;
  const z2 = z * z;
  const denominator = 1 + z2 / trials;
  const center = (rate + z2 / (2 * trials)) / denominator;
  const half =
    (z * Math.sqrt((rate * (1 - rate)) / trials + z2 / (4 * trials * trials))) /
    denominator;
  return {
    rate,
    // At the bounds the algebra is exact but floating point may stray by 1e-17.
    lower: successes === 0 ? 0 : Math.max(0, center - half),
    upper: successes === trials ? 1 : Math.min(1, center + half),
  };
}

/**
 * How to read one interval. Wilson bounds are not symmetric around the
 * observed rate, so the distance to each bound is reported separately. An
 * all-pass run gets its own reading while its lower bound is visibly below
 * 100%: a small green run cannot rule out a real failure rate.
 */
/** @param {{successes: number, trials: number, rate: number, lower: number, upper: number}} row */
export function intervalReading(row) {
  return {
    kind:
      row.successes === row.trials && 1 - row.lower >= PERFECT_GAP
        ? "perfect"
        : "standard",
    below: row.rate - row.lower,
    above: row.upper - row.rate,
  };
}

/**
 * The same pass rate from 1, 4 and 16 times the examples: each step halves
 * the interval. Steps beyond the sample limit are left out.
 */
/** @param {{successes?: number, trials?: number, confidence?: number}} [input] */
export function intervalLadder({ successes, trials, confidence } = {}) {
  const rows = [{ successes, trials, ...wilsonInterval({ successes, trials, confidence }) }];
  for (const factor of [4, 16]) {
    const sample = { successes: successes * factor, trials: trials * factor };
    if (sample.trials > AI_LIMITS.trials) break;
    rows.push({ ...sample, ...wilsonInterval({ ...sample, confidence }) });
  }
  return rows;
}

/**
 * Examples per variant needed to tell two pass rates apart, for independent
 * samples and a two-sided test. Evaluating both variants on the same
 * examples is a paired design and usually needs fewer.
 */
/** @param {{baseline?: number, candidate?: number, confidence?: number, power?: number}} [input] */
export function sampleSize({ baseline, candidate, confidence, power } = {}) {
  requireNumber(baseline, 0.001, 0.999, "baseline");
  requireNumber(candidate, 0.001, 0.999, "candidate");
  const z = CONFIDENCE_Z[confidence];
  if (!z) throw new AiToolError("confidence", "confidence");
  const zPower = POWER_Z[power];
  if (!zPower) throw new AiToolError("power", "power");
  const difference = Math.abs(candidate - baseline);
  if (difference < 0.001) throw new AiToolError("no_difference", "candidate");
  const pooled = (baseline + candidate) / 2;
  const numerator =
    z * Math.sqrt(2 * pooled * (1 - pooled)) +
    zPower *
      Math.sqrt(baseline * (1 - baseline) + candidate * (1 - candidate));
  const perVariant = Math.ceil((numerator * numerator) / (difference * difference));
  return { perVariant, total: perVariant * 2, difference };
}

/**
 * Cohen's kappa for two judges and a pass/fail label: agreement beyond what
 * their own pass rates would produce by chance. Undefined when both judges
 * give every example the same label, because chance agreement is then 1.
 */
/** @param {{bothPass?: number, onlyA?: number, onlyB?: number, bothFail?: number}} [input] */
export function cohenKappa({ bothPass, onlyA, onlyB, bothFail } = {}) {
  for (const [value, field] of [
    [bothPass, "bothPass"],
    [onlyA, "onlyA"],
    [onlyB, "onlyB"],
    [bothFail, "bothFail"],
  ])
    requireInteger(value, 0, AI_LIMITS.trials, field);
  const total = bothPass + onlyA + onlyB + bothFail;
  if (total === 0) throw new AiToolError("no_examples", "bothPass");
  const observed = (bothPass + bothFail) / total;
  const passA = (bothPass + onlyA) / total;
  const passB = (bothPass + onlyB) / total;
  const expected = passA * passB + (1 - passA) * (1 - passB);
  return {
    total,
    observed,
    expected,
    passA,
    passB,
    kappa: expected >= 1 ? null : (observed - expected) / (1 - expected),
  };
}

/**
 * How to read a kappa: undefined, the prevalence paradox (high raw agreement,
 * low kappa), substantial, some agreement, or none beyond chance. For the
 * paradox, `rare` names the label the judges seldom give: failing cases when
 * their pass rates add up to more than one.
 */
/** @param {{observed: number, kappa: number | null, passA: number, passB: number}} result */
export function kappaReading({ observed, kappa, passA, passB }) {
  if (kappa === null) return { kind: "undefined" };
  if (observed >= PARADOX_AGREEMENT && kappa < PARADOX_KAPPA)
    return { kind: "paradox", rare: passA + passB > 1 ? "fail" : "pass" };
  if (kappa >= STRONG_KAPPA) return { kind: "strong" };
  return { kind: kappa > 0 ? "moderate" : "none" };
}
