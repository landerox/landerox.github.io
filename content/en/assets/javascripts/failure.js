/** Browser-only fault simulation with explicit playback and bounded state. */
import { element, button, widgetHeader, tableShell } from "./workbench-dom.js";
import { useScenario, shareControl } from "./share.js";
import {
  createSimulation,
  stepSimulation,
  FAILURE_LIMITS,
  FAILURE_SCENARIOS,
  runFailureComparison,
} from "./failure-core.js";

const strings = {
  en: {
    title: "Failure Lab",
    badge: "Local simulation",
    intro:
      "Imagine orders waiting to be saved. Interrupt their journey and see why queues, retries and recovery matter.",
    steps: [
      "Choose a fault",
      "Run or advance one second",
      "Restore service and inspect recovery",
    ],
    nodeHelp: [
      "Creates events",
      "Holds pending work",
      "Attempts delivery",
      "Keeps completed work",
    ],
    metricsTitle: "Follow the outcome",
    metricHelp: [
      "Time inside this model",
      "Still waiting in the queue",
      "Completed writes",
      "Retries already attempted",
      "Attempt limit reached (DLQ)",
      "Arrived when the queue was full",
    ],
    insightTitle: "What this shows",
    insights: {
      none: "With capacity available, incoming work can be saved in the same step.",
      draining:
        "Service is back. Pending messages can drain, but failed and rejected messages are not replayed.",
      workers:
        "Nothing is being processed. The queue fills until new arrivals can no longer enter.",
      store:
        "Processing continues, but saving fails. Retries consume capacity; exhausted messages need review.",
      burst:
        "More events arrive than the workers can handle. A queue absorbs a short burst, not permanent overload.",
    },
    failure: "Inject a condition",
    retry: "Retry policy",
    conditions: [
      "Healthy",
      "Workers paused",
      "Writes unavailable",
      "Traffic burst",
    ],
    policies: ["Backoff · 1s, then 2s", "Retry next tick · 1s"],
    play: "Run",
    pause: "Pause",
    step: "Step +1s",
    reset: "Reset",
    recover: "Restore service",
    producer: "Producer",
    queue: "Queue",
    workers: "Workers",
    store: "Store",
    perSecond: "/s",
    paused: "Paused",
    unavailable: "Unavailable",
    full: "Full",
    filling: "Near capacity",
    ready: "Ready",
    metricLabels: [
      "Simulated time",
      "Waiting",
      "Saved",
      "Extra attempts",
      "Needs review",
      "Not admitted",
    ],
    timeline: "Recent events",
    empty: "Choose a condition, then run or step through the simulation.",
    events: {
      accepted: "admitted",
      rejected: "rejected: queue full",
      paused: "waiting for workers",
      written: "written successfully",
      retry: "scheduled for retry",
      dead: "moved to dead letters",
    },
    capacity: "Queue occupancy",
    model: "Model & limits",
    modelLabels: [
      "Time",
      "Arrivals",
      "Queue capacity",
      "Processing capacity",
      "Attempt limit",
      "Backoff",
      "Playback limit",
    ],
    modelValues: [
      "1 step = 1 simulated second",
      "3 events/step; 12 during a burst",
      "24 messages, including delayed retries",
      "Up to 5 attempts/step; none when workers are paused",
      "3 total attempts per message, then dead letters",
      "Wait 1s, then 2s; no jitter",
      "120 simulated seconds; no automatic restart",
    ],
    details:
      "Arrivals enter before processing. Policy changes affect newly scheduled retries. The numbers below are teaching assumptions, not production recommendations.",
    limits:
      "This is a deterministic teaching model, not a real queue, distributed runtime or benchmark. It omits network latency, acknowledgements, duplicate delivery, circuit breaking and durable storage. Restoring service drains pending work; it does not replay dead letters or rejected arrivals.",
    stopped: "Paused. Step to inspect the next simulated second.",
    running:
      "Running locally. Playback advances one simulated second every 600ms.",
    finished: "The 120-second simulation is complete. Reset to start again.",
    restored:
      "Service restored. Pending work can drain; dead letters and rejected arrivals still require recovery.",
    changed: "Condition updated. It takes effect on the next step.",
  },
  es: {
    title: "Failure Lab",
    badge: "Simulación local",
    intro:
      "Imagina pedidos esperando a guardarse. Interrumpe su recorrido y observa por qué importan las colas, los reintentos y la recuperación.",
    steps: [
      "Elige un fallo",
      "Ejecuta o avanza un segundo",
      "Restaura el servicio y observa la recuperación",
    ],
    nodeHelp: [
      "Crea eventos",
      "Retiene trabajo pendiente",
      "Intenta entregar",
      "Conserva el trabajo completado",
    ],
    metricsTitle: "Sigue el resultado",
    metricHelp: [
      "Tiempo dentro del modelo",
      "Pendientes en la cola",
      "Escrituras completadas",
      "Reintentos ya realizados",
      "Límite de intentos alcanzado (DLQ)",
      "Llegaron con la cola llena",
    ],
    insightTitle: "Qué demuestra",
    insights: {
      none: "Con capacidad disponible, el trabajo entrante puede guardarse en el mismo paso.",
      draining:
        "El servicio volvió. La cola puede vaciarse, pero no se reenvían los mensajes fallidos ni rechazados.",
      workers:
        "No se procesa ningún mensaje. La cola se llena hasta que las nuevas llegadas ya no pueden entrar.",
      store:
        "Se sigue procesando, pero guardar falla. Los reintentos consumen capacidad; los mensajes agotados necesitan revisión.",
      burst:
        "Llegan más eventos de los que se pueden procesar. Una cola absorbe una ráfaga breve, no una sobrecarga permanente.",
    },
    failure: "Inyectar una condición",
    retry: "Política de reintentos",
    conditions: [
      "Normal",
      "Workers detenidos",
      "Escrituras no disponibles",
      "Ráfaga de tráfico",
    ],
    policies: ["Backoff · 1s, después 2s", "Reintentar al siguiente paso · 1s"],
    play: "Ejecutar",
    pause: "Pausar",
    step: "Avanzar +1s",
    reset: "Reiniciar",
    recover: "Restaurar servicio",
    producer: "Productor",
    queue: "Cola",
    workers: "Workers",
    store: "Almacén",
    perSecond: "/s",
    paused: "Detenidos",
    unavailable: "No disponible",
    full: "Llena",
    filling: "Casi llena",
    ready: "Listo",
    metricLabels: [
      "Tiempo simulado",
      "En espera",
      "Guardados",
      "Intentos extra",
      "Requieren revisión",
      "No admitidos",
    ],
    timeline: "Eventos recientes",
    empty: "Elige una condición y ejecuta la simulación o avanza paso a paso.",
    events: {
      accepted: "admitidos",
      rejected: "rechazados: cola llena",
      paused: "esperando workers",
      written: "escritos correctamente",
      retry: "programados para reintento",
      dead: "enviados a la cola de fallidos",
    },
    capacity: "Ocupación de la cola",
    model: "Modelo y límites",
    modelLabels: [
      "Tiempo",
      "Llegadas",
      "Capacidad de la cola",
      "Capacidad de proceso",
      "Límite de intentos",
      "Backoff",
      "Límite de ejecución",
    ],
    modelValues: [
      "1 paso = 1 segundo simulado",
      "3 eventos/paso; 12 durante una ráfaga",
      "24 mensajes, incluidos reintentos en espera",
      "Hasta 5 intentos/paso; ninguno con workers detenidos",
      "3 intentos totales por mensaje; después, cola de fallidos",
      "Espera 1s, después 2s; sin jitter",
      "120 segundos simulados; sin reinicio automático",
    ],
    details:
      "Las llegadas entran antes de procesar. Cambiar la política afecta a los nuevos reintentos programados. Estas cifras son supuestos didácticos, no recomendaciones de producción.",
    limits:
      "Modelo didáctico determinista, no una cola real, un runtime distribuido ni un benchmark. Omite latencia de red, confirmaciones, entregas duplicadas, circuit breakers y almacenamiento duradero. Restaurar el servicio permite procesar lo pendiente; no recupera mensajes fallidos ni llegadas rechazadas.",
    stopped: "En pausa. Avanza para examinar el siguiente segundo simulado.",
    running:
      "Ejecución local. La reproducción avanza un segundo simulado cada 600ms.",
    finished:
      "La simulación de 120 segundos terminó. Reinicia para comenzar otra vez.",
    restored:
      "Servicio restaurado. Se puede procesar lo pendiente; fallidos y rechazados aún requieren recuperación.",
    changed: "Condición actualizada. Se aplicará en el siguiente paso.",
  },
};

let active;

export function disposeFailureLab() {
  active?.dispose();
  active = null;
}

export function pauseFailureLab() {
  active?.pause();
}

export function setupFailureLab(locale) {
  const host = document.getElementById("failure-lab");
  if (active?.host === host) return;
  disposeFailureLab();
  if (!host) return;
  const t = strings[locale] || strings.en;
  const listeners = new window.AbortController();
  const options = { signal: listeners.signal };
  let state = createSimulation();
  let timer = null;
  host.replaceChildren();
  host.classList.add("failure-lab");
  host.dataset.initialized = "true";

  host.append(
    widgetHeader(t.title, t.badge),
    element("p", { class: "lab-widget-note" }, t.intro),
  );
  const steps = element("ol", { class: "tool-steps" });
  for (const [index, text] of t.steps.entries()) {
    const step = element("li");
    step.append(
      element(
        "span",
        { class: "tool-step-number", "aria-hidden": "true" },
        String(index + 1),
      ),
      document.createTextNode(text),
    );
    steps.append(step);
  }
  host.append(steps);

  const controls = element("div", { class: "failure-controls" });
  function select(id, label, values, labels) {
    const field = element("div", { class: "calc-row" });
    const input = element("select", { id, class: "calc-select" });
    for (const [i, value] of values.entries())
      input.append(element("option", { value }, labels[i]));
    field.append(
      element("label", { class: "calc-label", for: id }, label),
      input,
    );
    controls.append(field);
    return input;
  }
  const condition = select(
    "failure-condition",
    t.failure,
    ["none", "workers", "store", "burst"],
    t.conditions,
  );
  const policy = select(
    "failure-policy",
    t.retry,
    ["backoff", "immediate"],
    t.policies,
  );
  const actions = element("div", { class: "failure-actions" });
  const play = button(t.play, {
    id: "failure-play",
    class: "console-primary-button",
  });
  const step = button(t.step, { id: "failure-step", class: "tool-button" });
  const restore = button(t.recover, {
    id: "failure-restore",
    class: "tool-button",
  });
  const reset = button(t.reset, { id: "failure-reset", class: "tool-button" });
  actions.append(play, step, restore, reset);
  host.append(
    controls,
    actions,
    shareControl(
      "failure-lab",
      () => [
        ["condition", condition.value],
        ["policy", policy.value],
      ],
      locale,
    ),
  );

  const flow = element("ol", {
    class: "failure-flow",
    "aria-label": `${t.producer} → ${t.queue} → ${t.workers} → ${t.store}`,
  });
  const nodes = {};
  for (const [index, name] of [
    "producer",
    "queue",
    "workers",
    "store",
  ].entries()) {
    const node = element("li", { class: "failure-node", "data-node": name });
    const value = element("strong");
    const status = element("span", { class: "failure-node-status" });
    node.append(
      element("span", { class: "failure-node-label" }, t[name]),
      value,
      status,
      element("span", { class: "failure-node-help" }, t.nodeHelp[index]),
    );
    flow.append(node);
    nodes[name] = { node, value, status };
  }
  const capacity = element("meter", {
    id: "failure-capacity",
    min: "0",
    max: String(FAILURE_LIMITS.queue),
    low: String(FAILURE_LIMITS.queue / 2),
    high: String((FAILURE_LIMITS.queue * 3) / 4),
    optimum: "0",
    value: "0",
  });
  const capacityRow = element("div", { class: "failure-capacity" });
  capacityRow.append(
    element("label", { for: "failure-capacity" }, t.capacity),
    capacity,
  );
  host.append(flow, capacityRow);

  const metrics = element("dl", { class: "failure-metrics" });
  const values = {};
  for (const [i, name] of [
    "tick",
    "queue",
    "written",
    "retries",
    "dead",
    "rejected",
  ].entries()) {
    const metric = element("div");
    values[name] = element("dd", { id: `failure-${name}-value` }, "0");
    const description = element(
      "dd",
      { class: "failure-metric-help" },
      t.metricHelp[i],
    );
    metric.append(
      element("dt", {}, t.metricLabels[i]),
      values[name],
      description,
    );
    metrics.append(metric);
  }
  const status = element(
    "p",
    { class: "lab-widget-note failure-notice", role: "status" },
    t.empty,
  );
  const trace = element("ol", {
    class: "failure-trace",
    "aria-label": t.timeline,
    tabindex: "0",
  });
  const traceDetails = element("details", { class: "lab-widget-details" });
  traceDetails.append(element("summary", {}, t.timeline), trace);
  const model = element("details", { class: "lab-widget-details" });
  const assumptions = element("dl", { class: "failure-model" });
  for (const [index, label] of t.modelLabels.entries()) {
    const row = element("div");
    row.append(
      element("dt", {}, label),
      element("dd", {}, t.modelValues[index]),
    );
    assumptions.append(row);
  }
  model.append(
    element("summary", {}, t.model),
    element("p", {}, t.details),
    assumptions,
    element("p", { class: "tool-boundary" }, t.limits),
  );
  const insight = element("p");
  const explanation = element("div", { class: "failure-insight" });
  explanation.append(element("strong", {}, t.insightTitle), insight);
  host.append(
    element("h3", { class: "tool-section-title" }, t.metricsTitle),
    metrics,
    explanation,
    status,
    traceDetails,
    model,
  );

  function render() {
    const fault = condition.value;
    insight.textContent =
      t.insights[
        fault === "none" && (state.queue.length || state.dead || state.rejected)
          ? "draining"
          : fault
      ];
    const setNode = (name, value, label, blocked) => {
      nodes[name].value.textContent = value;
      nodes[name].status.textContent = label;
      nodes[name].node.dataset.state = blocked ? "blocked" : "ready";
    };
    setNode(
      "producer",
      `${fault === "burst" ? FAILURE_LIMITS.burst : FAILURE_LIMITS.arrivals} ${t.perSecond}`,
      t.ready,
      false,
    );
    setNode(
      "queue",
      `${state.queue.length} / ${FAILURE_LIMITS.queue}`,
      state.queue.length === FAILURE_LIMITS.queue
        ? t.full
        : state.queue.length >= capacity.high
          ? t.filling
          : t.ready,
      state.queue.length >= capacity.high,
    );
    setNode(
      "workers",
      `${fault === "workers" ? 0 : FAILURE_LIMITS.workers} ${t.perSecond}`,
      fault === "workers" ? t.paused : t.ready,
      fault === "workers",
    );
    setNode(
      "store",
      String(state.written),
      fault === "store" ? t.unavailable : t.ready,
      fault === "store",
    );
    capacity.value = state.queue.length;
    for (const [name, value] of Object.entries(values)) {
      value.textContent =
        name === "queue"
          ? state.queue.length
          : name === "tick"
            ? `${state.tick}s`
            : state[name];
    }
    trace.replaceChildren(
      ...state.events.map((event) => {
        const entry = element("li");
        entry.append(
          element("code", {}, `t+${event.tick}s`),
          element("span", {}, `${event.count} ${t.events[event.kind]}`),
        );
        return entry;
      }),
    );
    const finished = state.tick >= FAILURE_LIMITS.ticks;
    step.disabled = finished || timer !== null;
    play.disabled = finished;
    restore.disabled = fault === "none";
    play.textContent = timer === null ? t.play : t.pause;
  }

  function pause(announce = true) {
    if (timer === null) return;
    window.clearInterval(timer);
    timer = null;
    render();
    if (announce) status.textContent = t.stopped;
  }

  function advance() {
    if (!host.isConnected || document.hidden) {
      pause();
      return;
    }
    state = stepSimulation(state, {
      failure: condition.value,
      retry: policy.value,
    });
    if (state.tick >= FAILURE_LIMITS.ticks) {
      pause(false);
      status.textContent = t.finished;
    }
    render();
  }

  play.addEventListener(
    "click",
    () => {
      if (timer !== null) {
        pause();
        return;
      }
      timer = window.setInterval(advance, 600);
      status.textContent = t.running;
      advance();
    },
    options,
  );
  step.addEventListener(
    "click",
    () => {
      advance();
      if (state.tick < FAILURE_LIMITS.ticks) {
        status.textContent = `t+${state.tick}s | ${t.metricLabels[1]}: ${state.queue.length} | ${t.metricLabels[2]}: ${state.written} | ${t.metricLabels[4]}: ${state.dead}`;
      }
    },
    options,
  );
  reset.addEventListener(
    "click",
    () => {
      pause(false);
      state = createSimulation();
      condition.value = "none";
      policy.value = "backoff";
      status.textContent = t.empty;
      render();
    },
    options,
  );
  restore.addEventListener(
    "click",
    () => {
      condition.value = "none";
      status.textContent = t.restored;
      render();
    },
    options,
  );
  for (const input of [condition, policy])
    input.addEventListener(
      "change",
      () => {
        status.textContent = t.changed;
        render();
      },
      options,
    );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) pause();
    },
    options,
  );
  window.addEventListener("pagehide", () => pause(), options);
  const observer =
    "IntersectionObserver" in window
      ? new window.IntersectionObserver((entries) => {
          if (!entries[0].isIntersecting) pause();
        })
      : null;
  observer?.observe(host);
  active = {
    host,
    pause,
    dispose() {
      pause(false);
      observer?.disconnect();
      listeners.abort();
    },
  };
  setupPolicyComparison(host, locale, options, () => pause(false));
  render();
  useScenario("failure-lab", host, (shared) => {
    pause(false);
    for (const [key, input] of [["condition", condition], ["policy", policy]]) {
      const value = shared.get(key);
      if ([...input.options].some((option) => option.value === value))
        input.value = value;
    }
    status.textContent = t.changed;
    render();
  });
}

/** A separate, finite experiment; never changes the manual simulator's state. */
function setupPolicyComparison(host, locale, listenerOptions, beforeRun) {
  const es = locale === "es";
  const t = es
    ? {
        title: "Mismo incidente, dos políticas",
        intro:
          "Compara dos recorridos de 30 segundos simulados. Las llegadas, el fallo, la cola y el límite de 3 intentos son iguales; solo cambia cuándo se reintenta. La comparación pausa la reproducción manual, sin reiniciarla.",
        scenario: "Incidente repetible",
        seed: "Semilla de jitter",
        run: "Comparar políticas",
        scenarios: [
          "Corte breve de escrituras",
          "Corte prolongado de escrituras",
          "Ráfaga de tráfico",
        ],
        seedHelp:
          "Un entero de 0 a 4294967295. La misma semilla e incidente producen exactamente el mismo recorrido; no es aleatoriedad criptográfica.",
        policies: ["A · Siguiente paso", "B · Backoff + jitter"],
        policyNote:
          "A espera siempre 1s. B espera 1s + 0–1s de jitter, después 2s + 0–2s. El jitter es aditivo, discreto y reproducible, no full jitter continuo. Ambas políticas permiten como máximo 3 intentos por mensaje.",
        ready:
          "Elige un incidente y compara. Los controles manuales de arriba no afectan estos recorridos.",
        changed:
          "Configuración modificada. Compara de nuevo para ver el recorrido correspondiente.",
        error:
          "Elige un incidente válido y una semilla entera entre 0 y 4294967295.",
        schedule: (start, end, ticks, seed) =>
          `Fallo activo en los pasos ${start}–${end}, ambos incluidos; servicio normal desde el paso ${end + 1}. Observación hasta ${ticks}s. Semilla: ${seed}.`,
        result: "Resultados del modelo, no mediciones reales",
        headers: ["Al terminar", "A · 1 s", "B · jitter"],
        metrics: [
          "Llegadas totales",
          "Guardados",
          "Todavía en espera",
          "No admitidos",
          "Requieren revisión (DLQ)",
          "Intentos extra",
          "Máxima cola observada al final de un paso",
        ],
        conclusion: "Cómo interpretar la comparación",
        insights: {
          burst:
            "Las políticas no cambian esta ráfaga: las escrituras funcionan y no hay nada que reintentar. El límite está en la capacidad, no en la espera de los reintentos.",
          more: "Esperar más permitió guardar más mensajes tras este corte. Revisa también los intentos extra y la cola máxima; no demuestra que el jitter sea siempre mejor.",
          fewer:
            "Aquí el recorrido con jitter guarda menos mensajes dentro del plazo fijo. Revisa lo pendiente y lo rechazado: esperar más puede consumir tiempo y espacio en la cola.",
          same: "Ambas políticas guardan la misma cantidad. Aun así, pueden consumir distintos intentos o alcanzar diferentes cantidades de trabajo pendiente.",
        },
        timeline: "Ver el recorrido A / B",
        timelineNote:
          "Puntos seleccionados de un cálculo paso a paso. Cada celda muestra A / B. En espera es la cola en ese instante; los demás contadores acumulan desde el inicio. El modelo no mide latencia real ni dispersión subsegundo.",
        timelineScroll:
          "En pantallas pequeñas, desplaza la tabla horizontalmente para ver todas las columnas. Con teclado, enfoca la tabla y usa ← / →.",
        timelineHeaders: [
          "Tiempo y fase",
          "En espera · A / B",
          "Guardados · A / B",
          "No admitidos · A / B",
          "Revisión · A / B",
        ],
        phases: {
          before: "Antes",
          incident: "Fallo activo",
          recovery: "Recuperación",
        },
        conservation:
          "En cada paso: llegadas = guardados + en espera + fallidos + no admitidos. No se reenvían automáticamente fallidos ni rechazos. Un caso y una semilla no establecen una recomendación de producción.",
      }
    : {
        title: "Same incident, two policies",
        intro:
          "Compare two runs of 30 simulated seconds. Arrivals, the fault, the queue and the 3-attempt limit are identical; only retry timing changes. Comparing pauses manual playback without resetting it.",
        scenario: "Repeatable incident",
        seed: "Jitter seed",
        run: "Compare policies",
        scenarios: ["Brief write outage", "Long write outage", "Traffic burst"],
        seedHelp:
          "An integer from 0 to 4294967295. The same seed and incident produce exactly the same run; this is not cryptographic randomness.",
        policies: ["A · Next tick", "B · Backoff + jitter"],
        policyNote:
          "A always waits 1s. B waits 1s + 0–1s of jitter, then 2s + 0–2s. This is additive, discrete, reproducible jitter, not continuous full jitter. Both policies allow at most 3 total attempts per message.",
        ready:
          "Choose an incident and compare. The manual controls above do not affect these runs.",
        changed:
          "Configuration changed. Compare again to see the corresponding run.",
        error:
          "Choose a valid incident and an integer seed from 0 to 4294967295.",
        schedule: (start, end, ticks, seed) =>
          `Fault active on steps ${start}–${end}, both inclusive; normal service from step ${end + 1}. Observe through ${ticks}s. Seed: ${seed}.`,
        result: "Model outcomes, not real measurements",
        headers: ["At the end", "A · 1 s", "B · jitter"],
        metrics: [
          "Total arrivals",
          "Saved",
          "Still waiting",
          "Not admitted",
          "Needs review (DLQ)",
          "Extra attempts",
          "Peak queue observed at the end of a step",
        ],
        conclusion: "How to read the comparison",
        insights: {
          burst:
            "Neither policy changes this burst: writes succeed, so there is nothing to retry. Capacity, not retry timing, limits the outcome.",
          more: "Waiting longer allowed more messages to be saved after this outage. Check extra attempts and peak queue too; this does not make jitter universally better.",
          fewer:
            "Here the jitter run saves fewer messages within the fixed window. Inspect pending and rejected work: waiting longer can consume time and queue capacity.",
          same: "Both policies save the same number of messages here. They may still use different numbers of attempts or reach different amounts of pending work.",
        },
        timeline: "Inspect the A / B timeline",
        timelineNote:
          "Selected checkpoints from a step-by-step calculation. Each cell shows A / B. Waiting is the queue at that instant; other counters accumulate from the start. This model does not measure real latency or subsecond spreading.",
        timelineScroll:
          "On small screens, scroll the table sideways to see every column. With a keyboard, focus the table area and use ← / →.",
        timelineHeaders: [
          "Time and phase",
          "Waiting · A / B",
          "Saved · A / B",
          "Not admitted · A / B",
          "Review · A / B",
        ],
        phases: {
          before: "Before",
          incident: "Fault active",
          recovery: "Recovery",
        },
        conservation:
          "At every step: arrivals = saved + waiting + dead letters + not admitted. Dead letters and rejected arrivals are not automatically replayed. One case and seed do not establish production advice.",
      };
  const section = element("section", {
    class: "failure-comparison",
    "aria-labelledby": "failure-comparison-title",
  });
  section.append(
    element(
      "h3",
      { id: "failure-comparison-title", class: "tool-section-title" },
      t.title,
    ),
    element("p", { class: "lab-widget-note" }, t.intro),
  );
  const form = element("form", { class: "failure-comparison-controls" });
  const scenario = element("select", {
    id: "failure-comparison-scenario",
    class: "calc-select",
  });
  Object.keys(FAILURE_SCENARIOS).forEach((value, index) =>
    scenario.append(element("option", { value }, t.scenarios[index])),
  );
  const seed = element("input", {
    id: "failure-comparison-seed",
    class: "calc-select",
    type: "number",
    inputmode: "numeric",
    min: "0",
    max: "4294967295",
    step: "1",
    value: "42",
    required: "",
    "aria-describedby": "failure-comparison-seed-help",
  });
  for (const [control, label] of [
    [scenario, t.scenario],
    [seed, t.seed],
  ]) {
    const field = element("div", { class: "calc-row" });
    field.append(
      element("label", { class: "calc-label", for: control.id }, label),
      control,
    );
    form.append(field);
  }
  form.append(
    button(t.run, {
      id: "failure-compare",
      type: "submit",
      class: "tool-button",
    }),
  );
  const status = element(
    "p",
    {
      id: "failure-comparison-status",
      class: "lab-widget-note",
      role: "status",
    },
    t.ready,
  );
  const output = element("div", { id: "failure-comparison-results" });
  section.append(
    form,
    element(
      "p",
      { id: "failure-comparison-seed-help", class: "lab-widget-note" },
      t.seedHelp,
    ),
    element("p", { class: "tool-boundary" }, t.policyNote),
    status,
    output,
  );
  host.append(section);
  const table = (headers, caption, className = "") => {
    const view = tableShell(headers, caption, `simulation-table ${className}`);
    view.wrapper.classList.add("simulation-table-wrapper");
    return view;
  };
  form.addEventListener(
    "input",
    () => {
      output.replaceChildren();
      status.textContent = t.changed;
    },
    listenerOptions,
  );
  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      beforeRun();
      output.replaceChildren();
      try {
        const result = runFailureComparison({
          scenario: scenario.value,
          seed: seed.valueAsNumber,
        });
        const { start, end, ticks } = result.schedule;
        const summary = table(t.headers, t.result, "simulation-summary");
        [
          "total",
          "written",
          "queued",
          "rejected",
          "dead",
          "retries",
          "peakQueue",
        ].forEach((key, index) => {
          const row = element("tr");
          row.append(element("th", { scope: "row" }, t.metrics[index]));
          result.runs.forEach((run) =>
            row.append(
              element(
                "td",
                { class: "sql-number" },
                String(key === "peakQueue" ? run.peakQueue : run.final[key]),
              ),
            ),
          );
          summary.body.append(row);
        });
        const kind =
          result.schedule.failure === "burst"
            ? "burst"
            : result.difference.written > 0
              ? "more"
              : result.difference.written < 0
                ? "fewer"
                : "same";
        const conclusion = element("div", { class: "failure-insight" });
        conclusion.append(
          element("strong", {}, t.conclusion),
          element("p", {}, t.insights[kind]),
        );
        const timeline = element("details", {
          id: "failure-comparison-timeline",
          class: "lab-widget-details",
        });
        const checkpoints = table(t.timelineHeaders, t.timeline);
        const ticksToShow = [
          ...new Set([0, start - 1, start, end, end + 1, 15, 20, 25, ticks]),
        ].sort((a, b) => a - b);
        for (const tick of ticksToShow) {
          const points = result.runs.map((run) => run.timeline[tick]);
          const row = element("tr");
          const label = element("th", { scope: "row" });
          label.append(
            element("code", {}, `t+${tick}s`),
            element(
              "span",
              { class: "simulation-phase" },
              t.phases[points[0].phase],
            ),
          );
          row.append(label);
          for (const key of ["queued", "written", "rejected", "dead"])
            row.append(
              element(
                "td",
                { class: "sql-number" },
                points.map((point) => point[key]).join(" / "),
              ),
            );
          checkpoints.body.append(row);
        }
        timeline.append(
          element("summary", {}, t.timeline),
          element("p", {}, t.timelineNote),
          element("p", { class: "lab-widget-note" }, t.timelineScroll),
          checkpoints.wrapper,
        );
        output.append(
          summary.wrapper,
          conclusion,
          timeline,
          element("p", { class: "tool-boundary" }, t.conservation),
        );
        status.textContent = t.schedule(start, end, ticks, result.seed);
      } catch {
        status.textContent = t.error;
      }
    },
    listenerOptions,
  );
}
