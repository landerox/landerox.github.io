/** Deterministic teaching model, not a real queue, benchmark or fault injector. */
export const FAILURE_LIMITS = Object.freeze({
  queue: 24,
  arrivals: 3,
  burst: 12,
  workers: 5,
  attempts: 3,
  ticks: 120,
  log: 12,
});

export function createSimulation() {
  return {
    tick: 0,
    total: 0,
    written: 0,
    rejected: 0,
    dead: 0,
    retries: 0,
    attempts: 0,
    queue: [],
    events: [],
  };
}

/** One tick = one simulated second. Each message is attempted at most once
 * per tick. Delayed retries occupy queue slots, but not worker slots.
 * Conservation: total = written + queued + dead + rejected.
 */
export function stepSimulation(
  previous,
  { failure = "none", retry = "backoff", seed = 42 } = {},
) {
  if (!["none", "workers", "store", "burst"].includes(failure)) {
    throw new Error("failure_mode");
  }
  if (!["backoff", "immediate", "jitter"].includes(retry))
    throw new Error("retry_mode");
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new Error("simulation_seed");
  if (previous.tick >= FAILURE_LIMITS.ticks) return previous;

  const state = {
    ...previous,
    tick: previous.tick + 1,
    queue: previous.queue.map((job) => ({ ...job })),
    events: [...previous.events],
  };
  const log = (kind, count) => {
    if (count) state.events.push({ tick: state.tick, kind, count });
  };
  const arrivals =
    failure === "burst" ? FAILURE_LIMITS.burst : FAILURE_LIMITS.arrivals;
  const accepted = Math.min(
    arrivals,
    FAILURE_LIMITS.queue - state.queue.length,
  );
  for (let i = 0; i < accepted; i++) {
    state.queue.push({
      id: state.total + i + 1,
      attempts: 0,
      ready: state.tick,
    });
  }
  state.total += arrivals;
  state.rejected += arrivals - accepted;
  log("accepted", accepted);
  log("rejected", arrivals - accepted);

  if (failure === "workers") {
    log("paused", state.queue.length);
  } else {
    const due = state.queue
      .filter((job) => job.ready <= state.tick)
      .slice(0, FAILURE_LIMITS.workers);
    const selected = new Set(due.map((job) => job.id));
    state.queue = state.queue.filter((job) => !selected.has(job.id));
    let written = 0;
    let delayed = 0;
    let dead = 0;
    for (const job of due) {
      state.attempts++;
      if (job.attempts > 0) state.retries++;
      job.attempts++;
      if (failure !== "store") written++;
      else if (job.attempts >= FAILURE_LIMITS.attempts) dead++;
      else {
        job.ready = state.tick + retryDelay(retry, job.attempts, job.id, seed);
        state.queue.push(job);
        delayed++;
      }
    }
    state.written += written;
    state.dead += dead;
    log("written", written);
    log("retry", delayed);
    log("dead", dead);
  }

  state.events = state.events.slice(-FAILURE_LIMITS.log);
  return state;
}

/** Stable teaching jitter keyed by seed/message/attempt, not cryptography.
 * Additive integer jitter: base 1s + [0,1], then base 2s + [0,2].
 * Never retries twice within one tick; not a continuous-time/full-jitter model.
 */
export function retryDelay(policy, attempt, messageId, seed = 42) {
  if (!["immediate", "backoff", "jitter"].includes(policy))
    throw new Error("retry_mode");
  if (
    !Number.isInteger(attempt) ||
    attempt < 1 ||
    attempt >= FAILURE_LIMITS.attempts ||
    !Number.isSafeInteger(messageId) ||
    messageId < 1 ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff
  )
    throw new Error("retry_inputs");
  if (policy === "immediate") return 1;
  const base = 2 ** (attempt - 1);
  if (policy === "backoff") return base;
  let mixed =
    (seed ^
      Math.imul(messageId, 0x9e3779b1) ^
      Math.imul(attempt, 0x85ebca6b)) >>>
    0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return base + Math.floor(((mixed >>> 0) / 2 ** 32) * (base + 1));
}

export const FAILURE_SCENARIOS = Object.freeze({
  "brief-write-outage": Object.freeze({
    failure: "store",
    start: 5,
    end: 10,
    ticks: 30,
  }),
  "long-write-outage": Object.freeze({
    failure: "store",
    start: 5,
    end: 18,
    ticks: 30,
  }),
  "traffic-burst": Object.freeze({
    failure: "burst",
    start: 5,
    end: 10,
    ticks: 30,
  }),
});

/** Same workload and fault schedule in both runs; only retry scheduling differs.
 * Retain 31 scalar snapshots per policy, not an unbounded history of queue copies.
 */
export function runFailureComparison({
  scenario = "brief-write-outage",
  seed = 42,
} = {}) {
  if (!Object.hasOwn(FAILURE_SCENARIOS, scenario))
    throw new Error("comparison_scenario");
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new Error("simulation_seed");
  const schedule = FAILURE_SCENARIOS[scenario];
  const snapshot = (state) => ({
    tick: state.tick,
    phase:
      state.tick < schedule.start
        ? "before"
        : state.tick <= schedule.end
          ? "incident"
          : "recovery",
    total: state.total,
    queued: state.queue.length,
    written: state.written,
    rejected: state.rejected,
    dead: state.dead,
    retries: state.retries,
    attempts: state.attempts,
  });
  const runs = ["immediate", "jitter"].map((policy) => {
    let state = createSimulation();
    const timeline = [snapshot(state)];
    for (let tick = 1; tick <= schedule.ticks; tick++) {
      state = stepSimulation(state, {
        failure:
          tick >= schedule.start && tick <= schedule.end
            ? schedule.failure
            : "none",
        retry: policy,
        seed,
      });
      timeline.push(snapshot(state));
    }
    return {
      policy,
      timeline,
      final: { ...timeline.at(-1) },
      peakQueue: Math.max(...timeline.map((point) => point.queued)),
    };
  });
  const difference = Object.fromEntries(
    ["written", "queued", "rejected", "dead", "retries"].map((key) => [
      key,
      runs[1].final[key] - runs[0].final[key],
    ]),
  );
  return { scenario, seed, schedule, runs, difference };
}
