/** Browser-local AI engineering worksheets: agent crash recovery and
 * evaluation statistics. Arithmetic only: no model runs in the page.
 */
import {
  element,
  button,
  fill,
  barRow,
  presetGroup,
  matchesPreset,
  tableShell,
  stackRows,
  readNumber,
  field,
  select,
  help,
  shell,
  statusNode,
  showError,
} from "./workbench-dom.js";
import { useScenario, shareControl } from "./share.js";
import {
  AI_LIMITS,
  CRASH_POINTS,
  describeIncident,
  intervalLadder,
  intervalReading,
  sampleSize,
  cohenKappa,
  kappaReading,
} from "./ai-tools-core.js";

const mounted = new WeakSet();
const copy = {
  en: {
    local: "Local worksheet · no model, no connection",
    example: "Load example",
    inputError: "Check the input",
    unavailable: "Not defined",
    yes: "Yes",
    no: "No",
    agent: {
      title: "Agent Replay",
      intro:
        "What does an agent repeat after a crash? Replay one incident under four recovery strategies and see which ones apply a write twice.",
      steps: "Tool calls in the run",
      writeEvery: "A write every N calls",
      writeEveryHelp:
        "2 makes calls 2, 4, 6… change state and the others only read. 1 makes every call a write.",
      crashStep: "Crash at call",
      crashStepHelp: "0 runs to the end without a crash.",
      crashPoint: "Where the crash lands",
      crashPoints: ["Before the call runs", "After its effect"],
      crashPointHelp: "After its effect: the call ran, but nothing recorded that it did.",
      strategies: {
        restart: "Restart from the first call",
        "restart-keys": "Restart, with idempotency keys",
        checkpoint: "Resume from the last checkpoint",
        "checkpoint-keys": "Resume from the checkpoint, with idempotency keys",
      },
      columns: [
        "Recovery strategy",
        "Outcome",
        "Duplicate writes",
        "Calls repeated",
        "Calls received",
        "Writes applied",
      ],
      caption: "The same incident under four recovery strategies",
      safe: "No duplicate",
      unsafe: "Writes twice",
      traces: "Call by call",
      kinds: { read: "read", write: "write" },
      crash: { before: "crash before call {step}", after: "crash after call {step}" },
      outcomes: {
        repeated: "repeated",
        duplicate: "applied again",
        deduplicated: "key found, not applied",
      },
      none: "No strategy applies a write twice in this incident.",
      one: "1 of 4 strategies applies a write twice in this incident.",
      some: "{count} of 4 strategies apply a write twice in this incident.",
      presetsLabel: "Try an incident scenario",
      presets: [
        {
          id: "after-write",
          label: "Crash after write (unrecorded effect)",
          values: { steps: "6", every: "2", crash: "4", point: "after" },
        },
        {
          id: "before-call",
          label: "Crash before call",
          values: { steps: "6", every: "2", crash: "4", point: "before" },
        },
        {
          id: "on-read",
          label: "Crash after a read call",
          values: { steps: "6", every: "2", crash: "3", point: "after" },
        },
        {
          id: "no-crash",
          label: "Healthy run (no crash)",
          values: { steps: "6", every: "2", crash: "0", point: "after" },
        },
      ],
      writes: { one: "{count} write", other: "{count} writes" },
      takeawayHealthy:
        "Healthy baseline: without a crash, every strategy executes the exact same calls and writes once. Recovery trade-offs only surface when a fault interrupts the run.",
      takeawayFirst:
        "Crash before call #1: nothing has run yet, so every strategy starts cleanly and no write repeats.",
      takeawayBefore:
        "Crash before call #{step} ran: the checkpoint saved after call #{previous} is exact, so resuming from it repeats no call and duplicates no write. A restart without keys runs the plan again from call #1 and duplicates {restartWrites}.",
      takeawayAfterWrite:
        "Unrecorded write at call #{step}: the tool applied it, but the process crashed before saving the checkpoint. Resuming from the checkpoint repeats call #{step} and duplicates 1 write; restarting from call #1 duplicates {restartWrites}. Only an idempotency key remembered by the tool turns the repeated write into a lookup.",
      takeawayAfterRead:
        "Crash after read call #{step}: resuming from the checkpoint repeats that read and duplicates no write. A restart without keys runs the plan again from call #1 and duplicates {restartWrites}.",
      boundary:
        "A deterministic teaching model of one crash, not a durable-execution engine. Each strategy is replayed on the same incident; none is assumed to win.",
      help: "Formulas and limits",
      model:
        "Each call is a read or a write. The process crashes once at the chosen call and recovers under each strategy: a restart runs the plan again from the first call, a checkpoint resumes after the last call it recorded.",
      checkpoint:
        "A checkpoint is recorded after a call returns. A crash between the effect and the record leaves that call unrecorded, so it runs again: checkpoints shorten a replay, they do not make a write happen exactly once.",
      keys: "An idempotency key is derived from the run and the call number, so a replay sends the same key. The tool that owns the write remembers it and returns the stored result instead of acting again.",
      scope:
        "Not modeled: a plan that changes after a restart, since a model may choose different calls; partial effects; key stores that expire; concurrent runs and compensation.",
      source: "Temporal — why activities should be idempotent",
      errors: {
        number_range: "Use whole numbers within the shown bounds. The crash cannot come after the last call.",
        integer: "Calls, write interval and crash position must be whole numbers.",
        crash_point: "Choose before the call or after its effect.",
      },
    },
    evals: {
      title: "Eval Statistics",
      intro:
        "How much does an evaluation result tell you? Put an interval around a pass rate, size a comparison between two variants, or measure how far two judges agree.",
      mode: "What do you need?",
      modes: [
        "Interval around a pass rate",
        "Examples needed to compare two variants",
        "Agreement between two judges",
      ],
      presetsLabel: "Try an evaluation scenario",
      presets: [
        {
          id: "pilot-50",
          label: "50-case pilot (42/50 · 84%)",
          values: { mode: "interval", successes: "42", trials: "50", confidence: "95" },
        },
        {
          id: "perfect-20",
          label: "Small 100% run (20/20)",
          values: { mode: "interval", successes: "20", trials: "20", confidence: "95" },
        },
        {
          id: "gate-500",
          label: "500-case gate (420/500 · 84%)",
          values: { mode: "interval", successes: "420", trials: "500", confidence: "95" },
        },
        {
          id: "lift-5",
          label: "Moderate +5 pp lift (80% → 85%)",
          values: { mode: "sample", baseline: "80", candidate: "85", confidence: "95", power: "80" },
        },
        {
          id: "lift-2",
          label: "Subtle +2 pp lift (80% → 82%)",
          values: { mode: "sample", baseline: "80", candidate: "82", confidence: "95", power: "80" },
        },
        {
          id: "lift-10",
          label: "Large +10 pp lift (75% → 85%)",
          values: { mode: "sample", baseline: "75", candidate: "85", confidence: "95", power: "80" },
        },
        {
          id: "balanced-judges",
          label: "Balanced judges (85% · κ = 0.70)",
          values: { mode: "agreement", bothpass: "40", onlya: "5", onlyb: "10", bothfail: "45" },
        },
        {
          id: "prevalence-paradox",
          label: "Prevalence paradox (90% · κ = −0.05)",
          values: { mode: "agreement", bothpass: "90", onlya: "5", onlyb: "5", bothfail: "0" },
        },
        {
          id: "calibrated-rubric",
          label: "Calibrated rubric (94% · κ = 0.88)",
          values: { mode: "agreement", bothpass: "47", onlya: "3", onlyb: "3", bothfail: "47" },
        },
      ],
      successes: "Examples passed",
      trials: "Examples evaluated",
      confidence: "Confidence level",
      baseline: "Baseline pass rate (%)",
      candidate: "Pass rate to tell apart from it (%)",
      power: "Power",
      powerHelp: "The chance of detecting the difference when it is real.",
      bothPass: "Both judges pass",
      onlyA: "Only judge A passes",
      onlyB: "Only judge B passes",
      bothFail: "Both judges fail",
      metrics: {
        rate: "Observed pass rate",
        interval: "{level}% interval",
        width: "Interval width",
        perVariant: "Examples per variant",
        total: "Examples in total",
        difference: "Difference to detect",
        examples: "Examples labelled",
        observed: "Observed agreement",
        expected: "Agreement expected by chance",
        kappa: "Cohen's kappa",
      },
      points: "points",
      intervalBarLabel: "Wilson {level}% confidence band on 0–100% scale",
      observedRange: "{range} · observed {rate}",
      intervalTakeawayPerfect:
        "Small-sample ceiling: even with {passed}/{trials} passes, the {level}% Wilson lower bound is {lower}, so an all-pass run this small cannot rule out a failure rate of up to {gap} points. Add examples before trusting it.",
      intervalTakeawayStandard:
        "Reading the result: with {trials} examples, the {level}% interval runs from {lower} to {upper}, {below} points below and {above} above the observed {rate}. Wilson intervals lean toward 50%, so read both bounds rather than a ± margin.",
      sampleTakeaway:
        "Quadratic scaling (1/Δ²): detecting a {difference}-point shift ({baseline}% → {candidate}%) at {confidence}% confidence and {power}% power requires {perVariant} independent examples per variant ({total} total). Halving the target lift roughly quadruples the required eval set.",
      kappaBarObserved: "Observed agreement",
      kappaBarExpected: "Agreement expected by chance (judge A passes {passA}, judge B {passB})",
      kappaTakeawayParadox:
        "Prevalence paradox: raw agreement looks high ({observed}), but judge A passes {passA} and judge B {passB} of the examples, so chance alone predicts {expected} agreement (κ = {kappa}). {rare}",
      kappaRare: {
        fail: "Failures are rare here: add failing examples to check that the judges agree on defects.",
        pass: "Passes are rare here: add passing examples to check that the judges agree on successes.",
      },
      kappaTakeawayStrong:
        "Agreement well beyond chance (κ = {kappa}): observed {observed} against the {expected} that the judges' pass rates predict (judge A {passA}, judge B {passB}).",
      kappaTakeawayModerate:
        "Some agreement beyond chance (κ = {kappa}), but not enough to let either judge decide alone: observed {observed} against {expected} expected. Review the examples where they differ and tighten the rubric.",
      kappaTakeawayNone:
        "No agreement beyond chance (κ = {kappa}): observed {observed} is at or below the {expected} that chance alone predicts. The judges are not applying the same rubric.",
      intervalStatus: "With {trials} examples, the {level}% interval is {width} points wide.",
      intervalNote:
        "This interval describes one run. Comparing two variants needs its own test: size it with the second mode, or evaluate both variants on the same examples.",
      ladderCaption: "The same {rate} pass rate at three sample sizes",
      ladderColumns: ["Examples", "{level}% interval", "Width"],
      ladderOf: "{passed} of {total}",
      ladderNote: "Four times the examples, half the width: precision grows with the square root of the sample.",
      sampleStatus: "{count} examples per variant to detect a difference of {difference} points.",
      sampleNote:
        "Independent samples and a two-sided test. Running both variants on the same examples is a paired design and usually needs fewer; this estimate does not cover it.",
      kappaStatus:
        "Kappa {kappa}: agreement beyond chance, where 1 is perfect and 0 is what chance alone gives.",
      kappaUndefined:
        "Kappa is not defined: both judges gave every example the same label, so chance agreement is already 100%.",
      kappaNote:
        "Kappa depends on how often each label occurs: with a rare label, high raw agreement can still give a low kappa. Report both figures.",
      help: "Formulas and limits",
      formulaInterval:
        "Wilson score interval: centre = (p + z²/2n) ÷ (1 + z²/n); half-width = z × √(p(1 − p)/n + z²/4n²) ÷ (1 + z²/n). It stays within 0–100% and remains usable at zero or n passes.",
      formulaSample:
        "Examples per variant = (z × √(2m(1 − m)) + z_power × √(p1(1 − p1) + p2(1 − p2)))² ÷ (p1 − p2)², where m is the mean of both rates.",
      formulaKappa:
        "Kappa = (observed − expected) ÷ (1 − expected). Expected agreement multiplies each judge's own pass and fail rates.",
      scope:
        "Examples are treated as independent. Questions that share a document or a conversation are clustered and need wider intervals. Nothing here corrects for running many comparisons.",
      source: "Miller (2024) — Adding Error Bars to Evals",
      errors: {
        number_range:
          "Use values within the shown bounds. Passed examples cannot exceed evaluated examples; rates stay between 0.1% and 99.9%.",
        integer: "Counts of examples must be whole numbers.",
        confidence: "Choose 90%, 95% or 99%.",
        power: "Choose 80% or 90%.",
        no_difference: "The two pass rates must differ by at least 0.1 points.",
        no_examples: "Enter at least one labelled example.",
      },
    },
  },
  es: {
    local: "Hoja local · sin modelo ni conexión a servicios",
    example: "Cargar ejemplo",
    inputError: "Revisa los datos",
    unavailable: "No definido",
    yes: "Sí",
    no: "No",
    agent: {
      title: "Repetición de agente",
      intro:
        "¿Qué repite un agente después de una caída? Reproduce un incidente con cuatro estrategias de recuperación y comprueba cuáles aplican dos veces una escritura.",
      steps: "Llamadas a herramientas en la ejecución",
      writeEvery: "Una escritura cada N llamadas",
      writeEveryHelp:
        "Con 2, las llamadas 2, 4, 6… cambian estado y las demás solo leen. Con 1, todas escriben.",
      crashStep: "Caída en la llamada",
      crashStepHelp: "Con 0 la ejecución termina sin caída.",
      crashPoint: "En qué momento cae",
      crashPoints: ["Antes de la llamada", "Tras su efecto"],
      crashPointHelp: "Tras su efecto: la llamada se ejecutó, pero nada registró que lo hizo.",
      strategies: {
        restart: "Reiniciar desde la primera llamada",
        "restart-keys": "Reiniciar, con claves de idempotencia",
        checkpoint: "Reanudar desde el último checkpoint",
        "checkpoint-keys": "Reanudar desde el checkpoint, con claves de idempotencia",
      },
      columns: [
        "Estrategia de recuperación",
        "Resultado",
        "Escrituras duplicadas",
        "Llamadas repetidas",
        "Llamadas recibidas",
        "Escrituras aplicadas",
      ],
      caption: "El mismo incidente con cuatro estrategias de recuperación",
      safe: "Sin duplicados",
      unsafe: "Escribe dos veces",
      traces: "Llamada a llamada",
      kinds: { read: "lectura", write: "escritura" },
      crash: {
        before: "caída antes de la llamada {step}",
        after: "caída tras la llamada {step}",
      },
      outcomes: {
        repeated: "repetida",
        duplicate: "aplicada otra vez",
        deduplicated: "clave encontrada, no se aplica",
      },
      none: "Ninguna estrategia aplica dos veces una escritura en este incidente.",
      one: "1 de 4 estrategias aplica dos veces una escritura en este incidente.",
      some: "{count} de 4 estrategias aplican dos veces una escritura en este incidente.",
      presetsLabel: "Probar escenario de incidente",
      presets: [
        {
          id: "after-write",
          label: "Caída tras escribir (efecto sin registrar)",
          values: { steps: "6", every: "2", crash: "4", point: "after" },
        },
        {
          id: "before-call",
          label: "Caída antes de la llamada",
          values: { steps: "6", every: "2", crash: "4", point: "before" },
        },
        {
          id: "on-read",
          label: "Caída tras una lectura",
          values: { steps: "6", every: "2", crash: "3", point: "after" },
        },
        {
          id: "no-crash",
          label: "Ejecución limpia (sin caída)",
          values: { steps: "6", every: "2", crash: "0", point: "after" },
        },
      ],
      writes: { one: "{count} escritura", other: "{count} escrituras" },
      takeawayHealthy:
        "Base sin fallos: sin caída, las cuatro estrategias ejecutan exactamente las mismas llamadas y escrituras una sola vez. Las diferencias aparecen cuando un fallo interrumpe el flujo.",
      takeawayFirst:
        "Caída antes de la llamada #1: aún no se ha ejecutado nada, así que todas las estrategias empiezan limpias y ninguna escritura se repite.",
      takeawayBefore:
        "Caída antes de ejecutar la llamada #{step}: el checkpoint guardado tras la llamada #{previous} es exacto, así que reanudar desde él no repite ninguna llamada ni duplica escrituras. Reiniciar sin claves ejecuta el plan otra vez desde la llamada #1 y duplica {restartWrites}.",
      takeawayAfterWrite:
        "Escritura sin registrar en la llamada #{step}: la herramienta la aplicó, pero el proceso cayó antes de guardar el checkpoint. Reanudar desde el checkpoint repite la llamada #{step} y duplica 1 escritura; reiniciar desde la llamada #1 duplica {restartWrites}. Solo una clave de idempotencia recordada por la herramienta convierte la escritura repetida en una consulta.",
      takeawayAfterRead:
        "Caída tras la llamada de lectura #{step}: reanudar desde el checkpoint repite esa lectura y no duplica ninguna escritura. Reiniciar sin claves ejecuta el plan otra vez desde la llamada #1 y duplica {restartWrites}.",
      boundary:
        "Un modelo didáctico y determinista de una sola caída, no un motor de ejecución durable. Cada estrategia se reproduce sobre el mismo incidente; no se asume que alguna gane.",
      help: "Fórmulas y límites",
      model:
        "Cada llamada es una lectura o una escritura. El proceso cae una vez en la llamada elegida y se recupera con cada estrategia: un reinicio vuelve a ejecutar el plan desde la primera llamada; un checkpoint reanuda tras la última llamada que registró.",
      checkpoint:
        "El checkpoint se registra cuando la llamada devuelve. Una caída entre el efecto y el registro deja esa llamada sin registrar, así que se ejecuta otra vez: los checkpoints acortan la repetición, pero no garantizan que una escritura ocurra exactamente una vez.",
      keys: "La clave de idempotencia se deriva de la ejecución y del número de llamada, por lo que una repetición envía la misma clave. La herramienta dueña de la escritura la recuerda y devuelve el resultado guardado en lugar de actuar otra vez.",
      scope:
        "No se modelan: un plan que cambia tras el reinicio, porque un modelo puede elegir otras llamadas; efectos parciales; almacenes de claves que caducan; ejecuciones concurrentes ni compensaciones.",
      source: "Temporal — por qué las actividades deben ser idempotentes",
      errors: {
        number_range:
          "Usa números enteros dentro de los límites indicados. La caída no puede llegar después de la última llamada.",
        integer:
          "Las llamadas, el intervalo de escritura y la posición de la caída deben ser números enteros.",
        crash_point: "Elige antes de la llamada o tras su efecto.",
      },
    },
    evals: {
      title: "Estadística de evaluación",
      intro:
        "¿Cuánto dice de verdad un resultado de evaluación? Calcula el intervalo de una tasa de acierto, el tamaño de una comparación entre dos variantes o el acuerdo entre dos jueces.",
      mode: "¿Qué necesitas?",
      modes: [
        "Intervalo de una tasa de acierto",
        "Ejemplos necesarios para comparar dos variantes",
        "Acuerdo entre dos jueces",
      ],
      presetsLabel: "Probar escenario de evaluación",
      presets: [
        {
          id: "pilot-50",
          label: "Piloto de 50 casos (42/50 · 84%)",
          values: { mode: "interval", successes: "42", trials: "50", confidence: "95" },
        },
        {
          id: "perfect-20",
          label: "Muestra pequeña 100% (20/20)",
          values: { mode: "interval", successes: "20", trials: "20", confidence: "95" },
        },
        {
          id: "gate-500",
          label: "Evaluación de 500 casos (420/500 · 84%)",
          values: { mode: "interval", successes: "420", trials: "500", confidence: "95" },
        },
        {
          id: "lift-5",
          label: "Mejora moderada +5 pp (80% → 85%)",
          values: { mode: "sample", baseline: "80", candidate: "85", confidence: "95", power: "80" },
        },
        {
          id: "lift-2",
          label: "Mejora sutil +2 pp (80% → 82%)",
          values: { mode: "sample", baseline: "80", candidate: "82", confidence: "95", power: "80" },
        },
        {
          id: "lift-10",
          label: "Mejora grande +10 pp (75% → 85%)",
          values: { mode: "sample", baseline: "75", candidate: "85", confidence: "95", power: "80" },
        },
        {
          id: "balanced-judges",
          label: "Jueces equilibrados (85% · κ = 0,70)",
          values: { mode: "agreement", bothpass: "40", onlya: "5", onlyb: "10", bothfail: "45" },
        },
        {
          id: "prevalence-paradox",
          label: "Paradoja de prevalencia (90% · κ = −0,05)",
          values: { mode: "agreement", bothpass: "90", onlya: "5", onlyb: "5", bothfail: "0" },
        },
        {
          id: "calibrated-rubric",
          label: "Rúbrica calibrada (94% · κ = 0,88)",
          values: { mode: "agreement", bothpass: "47", onlya: "3", onlyb: "3", bothfail: "47" },
        },
      ],
      successes: "Ejemplos aprobados",
      trials: "Ejemplos evaluados",
      confidence: "Nivel de confianza",
      baseline: "Tasa de acierto de referencia (%)",
      candidate: "Tasa de acierto que quieres distinguir (%)",
      power: "Potencia",
      powerHelp: "La probabilidad de detectar la diferencia cuando es real.",
      bothPass: "Ambos jueces aprueban",
      onlyA: "Solo aprueba el juez A",
      onlyB: "Solo aprueba el juez B",
      bothFail: "Ambos jueces suspenden",
      metrics: {
        rate: "Tasa de acierto observada",
        interval: "Intervalo del {level}%",
        width: "Anchura del intervalo",
        perVariant: "Ejemplos por variante",
        total: "Ejemplos en total",
        difference: "Diferencia que detectar",
        examples: "Ejemplos etiquetados",
        observed: "Acuerdo observado",
        expected: "Acuerdo esperado por azar",
        kappa: "Kappa de Cohen",
      },
      points: "puntos",
      intervalBarLabel: "Banda de confianza de Wilson ({level}%) en escala 0–100%",
      observedRange: "{range} · observada {rate}",
      intervalTakeawayPerfect:
        "Techo de muestra pequeña: incluso con {passed}/{trials} aciertos, el límite inferior de Wilson al {level}% es {lower}, así que una ejecución tan pequeña sin fallos no descarta una tasa de fallo de hasta {gap} puntos. Añade ejemplos antes de confiar en ella.",
      intervalTakeawayStandard:
        "Cómo leerlo: con {trials} ejemplos, el intervalo del {level}% va de {lower} a {upper}, {below} puntos por debajo y {above} por encima de la tasa observada ({rate}). El intervalo de Wilson se inclina hacia el 50%, así que lee ambos límites y no un margen ±.",
      sampleTakeaway:
        "Escala cuadrática (1/Δ²): detectar un cambio de {difference} puntos ({baseline}% → {candidate}%) con {confidence}% de confianza y {power}% de potencia exige {perVariant} ejemplos independientes por variante ({total} en total). Reducir a la mitad la mejora buscada multiplica la muestra por cuatro, aproximadamente.",
      kappaBarObserved: "Acuerdo observado",
      kappaBarExpected: "Acuerdo esperado por azar (el juez A aprueba el {passA}, el juez B el {passB})",
      kappaTakeawayParadox:
        "Paradoja de prevalencia: el acuerdo bruto parece alto ({observed}), pero el juez A aprueba el {passA} y el juez B el {passB} de los ejemplos, así que el azar por sí solo predice un {expected} de coincidencia (κ = {kappa}). {rare}",
      kappaRare: {
        fail: "Aquí los suspensos son raros: añade ejemplos que fallen para comprobar que los jueces coinciden en los defectos.",
        pass: "Aquí los aprobados son raros: añade ejemplos que aprueben para comprobar que los jueces coinciden en los aciertos.",
      },
      kappaTakeawayStrong:
        "Acuerdo muy por encima del azar (κ = {kappa}): {observed} observado frente al {expected} que predicen las tasas de aprobado de los jueces (juez A {passA}, juez B {passB}).",
      kappaTakeawayModerate:
        "Algo de acuerdo por encima del azar (κ = {kappa}), pero no basta para que un juez decida solo: {observed} observado frente a {expected} esperado. Revisa los ejemplos en que difieren y ajusta la rúbrica.",
      kappaTakeawayNone:
        "Sin acuerdo por encima del azar (κ = {kappa}): el {observed} observado no supera el {expected} que predice el azar. Los jueces no aplican la misma rúbrica.",
      intervalStatus:
        "Con {trials} ejemplos, el intervalo del {level}% mide {width} puntos.",
      intervalNote:
        "Este intervalo describe una sola ejecución. Comparar dos variantes exige su propia prueba: dimensiónala con el segundo modo o evalúa ambas variantes sobre los mismos ejemplos.",
      ladderCaption: "La misma tasa de acierto ({rate}) con tres tamaños de muestra",
      ladderColumns: ["Ejemplos", "Intervalo del {level}%", "Anchura"],
      ladderOf: "{passed} de {total}",
      ladderNote: "Cuatro veces más ejemplos, la mitad de anchura: la precisión crece con la raíz cuadrada de la muestra.",
      sampleStatus:
        "{count} ejemplos por variante para detectar una diferencia de {difference} puntos.",
      sampleNote:
        "Muestras independientes y prueba bilateral. Evaluar ambas variantes sobre los mismos ejemplos es un diseño pareado y suele necesitar menos; esta estimación no lo cubre.",
      kappaStatus:
        "Kappa {kappa}: acuerdo por encima del azar, donde 1 es perfecto y 0 es lo que daría el azar.",
      kappaUndefined:
        "Kappa no está definida: ambos jueces dieron la misma etiqueta a todos los ejemplos, así que el acuerdo por azar ya es del 100%.",
      kappaNote:
        "Kappa depende de la frecuencia de cada etiqueta: con una etiqueta poco frecuente, un acuerdo bruto alto puede dar una kappa baja. Publica ambas cifras.",
      help: "Fórmulas y límites",
      formulaInterval:
        "Intervalo de Wilson: centro = (p + z²/2n) ÷ (1 + z²/n); semianchura = z × √(p(1 − p)/n + z²/4n²) ÷ (1 + z²/n). Se mantiene entre 0 y 100% y sigue siendo útil con cero o n aciertos.",
      formulaSample:
        "Ejemplos por variante = (z × √(2m(1 − m)) + z_potencia × √(p1(1 − p1) + p2(1 − p2)))² ÷ (p1 − p2)², donde m es la media de ambas tasas.",
      formulaKappa:
        "Kappa = (observado − esperado) ÷ (1 − esperado). El acuerdo esperado multiplica las tasas de aprobado y de suspenso de cada juez.",
      scope:
        "Los ejemplos se tratan como independientes. Las preguntas que comparten documento o conversación están agrupadas y necesitan intervalos más anchos. Nada aquí corrige por hacer muchas comparaciones.",
      source: "Miller (2024) — Adding Error Bars to Evals",
      errors: {
        number_range:
          "Usa valores dentro de los límites indicados. Los aprobados no pueden superar los evaluados; las tasas van de 0,1% a 99,9%.",
        integer: "Los recuentos de ejemplos deben ser números enteros.",
        confidence: "Elige 90%, 95% o 99%.",
        power: "Elige 80% o 90%.",
        no_difference: "Las dos tasas deben diferir al menos 0,1 puntos.",
        no_examples: "Introduce al menos un ejemplo etiquetado.",
      },
    },
  },
};

function number(minimum, maximum, step = "1") {
  return element("input", {
    type: "number",
    min: String(minimum),
    max: String(maximum),
    step,
    required: "",
    inputmode: step === "1" ? "numeric" : "decimal",
  });
}

function metricList(name, rows) {
  const metrics = element("dl", { class: "decision-metrics" });
  for (const [key, label, value] of rows) {
    const metric = element("div");
    metric.append(
      element("dt", {}, label),
      element("dd", { [`data-${name}-metric`]: key }, value),
    );
    metrics.append(metric);
  }
  return metrics;
}

/**
 * Shared wiring for one worksheet: the example runs at mount, the result
 * follows every edit, and a scenario link restores validated inputs.
 * `fields` maps a share key to its control; `core` names the model argument
 * that an input error refers to. `immediate` is a control that runs through
 * its own handler and is not debounced again.
 */
function worksheet(host, locale, base, t, spec) {
  shell(host, t.title, t.intro, base);
  const { id, prefix, fields } = spec;
  const form = element("form", { class: "decision-form", novalidate: "" });
  const presets = presetGroup(`${prefix}-presets`, t.presetsLabel, t.presets, `${prefix}-preset`);
  const grid = element("div", { class: "decision-fields" });
  for (const { wrapper } of Object.values(fields)) grid.append(wrapper);
  const actions = element("div", { class: "decision-actions" });
  const example = button(base.example, { id: `${prefix}-example` });
  actions.append(example);
  const status = statusNode(`${prefix}-status`);
  const results = element("div", {
    id: `${prefix}-results`,
    class: "decision-results",
    role: "region",
    "aria-label": t.title,
  });
  form.append(presets.group, grid, actions);
  host.append(
    form,
    status,
    results,
    shareControl(
      id,
      () =>
        Object.entries(fields)
          .filter(([, { wrapper }]) => !wrapper.hidden)
          .map(([key, { input }]) => [key, input.value]),
      locale,
    ),
    help(t.help, spec.notes, spec.href, t.source),
  );
  const controls = Object.fromEntries(
    Object.entries(fields).map(([key, item]) => [item.core || key, item.input]),
  );
  const byKey = Object.fromEntries(
    Object.entries(fields).map(([key, { input }]) => [key, input]),
  );
  function run(focus = true) {
    for (const input of Object.values(controls)) input.removeAttribute("aria-invalid");
    // A preset of another eval mode is hidden, never pressed.
    presets.mark(
      (preset) => matchesPreset(preset.values, byKey),
      (preset) => !preset.values.mode || preset.values.mode === byKey.mode?.value,
    );
    results.replaceChildren();
    try {
      const outcome = spec.render(spec.compute(), results);
      status.dataset.state = outcome.state || "ready";
      status.textContent = outcome.text;
    } catch (error) {
      if (!error.code) throw error;
      showError(error, status, controls, { ...base, errors: t.errors }, focus);
    }
  }
  function load(values, focus = true) {
    for (const [key, { input }] of Object.entries(fields))
      if (values[key] !== undefined) input.value = values[key];
    spec.configure?.();
    run(focus);
  }
  for (const preset of t.presets)
    presets.buttons.get(preset.id).addEventListener("click", () => load(preset.values));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  // A short pause lets a number be typed whole before it is checked.
  let pending = 0;
  form.addEventListener("input", (event) => {
    if (event.target === spec.immediate) return;
    window.clearTimeout(pending);
    pending = window.setTimeout(() => run(false), 250);
  });
  example.addEventListener("click", () =>
    load({ ...spec.example, ...spec.keep?.() }),
  );
  load(spec.example, false);
  // Missing values keep the example; invalid ones surface as form errors.
  useScenario(id, host, (shared) => {
    const values = { ...spec.example };
    for (const [key, { input }] of Object.entries(fields)) {
      const value = shared.get(key);
      if (value === undefined) continue;
      if (
        input instanceof window.HTMLSelectElement &&
        ![...input.options].some((option) => option.value === value)
      )
        continue;
      values[key] = value.slice(0, input.maxLength > 0 ? input.maxLength : 32);
    }
    load(values, false);
  });
  return { run };
}

function mountAgent(host, locale, base) {
  const t = base.agent;
  const count = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const plural = new Intl.PluralRules(locale);
  const writes = (value) => fill(t.writes[plural.select(value)], { count: count.format(value) });
  const fields = {
    steps: field("agent-steps", t.steps, number(1, AI_LIMITS.steps)),
    every: {
      ...field("agent-every", t.writeEvery, number(1, AI_LIMITS.steps), t.writeEveryHelp),
      core: "writeEvery",
    },
    crash: {
      ...field("agent-crash", t.crashStep, number(0, AI_LIMITS.steps), t.crashStepHelp),
      core: "crashStep",
    },
    point: {
      ...field(
        "agent-point",
        t.crashPoint,
        select(CRASH_POINTS, t.crashPoints),
        t.crashPointHelp,
      ),
      core: "crashPoint",
    },
  };
  const describe = (item) => {
    if (item.kind === "crash") return fill(t.crash[item.outcome], { step: item.step });
    const note =
      item.outcome === "applied"
        ? item.replay && t.outcomes.repeated
        : t.outcomes[item.outcome];
    return `${item.step} · ${t.kinds[item.kind]}${note ? ` · ${note}` : ""}`;
  };
  worksheet(host, locale, base, t, {
    id: "interactive-agent-run",
    prefix: "agent",
    fields,
    example: { steps: "6", every: "2", crash: "4", point: "after" },
    notes: [t.model, t.checkpoint, t.keys, t.scope],
    href: "https://docs.temporal.io/activity-definition#idempotency",
    compute() {
      const config = {
        steps: readNumber(fields.steps.input),
        writeEvery: readNumber(fields.every.input),
        crashStep: readNumber(fields.crash.input),
        crashPoint: fields.point.input.value,
      };
      return describeIncident(config);
    },
    render(incident, results) {
      const { rows } = incident;
      // The decisive columns come first: a phone shows them without scrolling.
      const numeric = new Set(t.columns.slice(2));
      const { wrapper, body } = tableShell(t.columns, t.caption, "agent-table", numeric);
      // The table carries the verdict; each call's wording opens on demand.
      const traces = element("details", { class: "decision-help agent-traces" });
      traces.append(element("summary", {}, t.traces));
      for (const row of rows) {
        const line = element("tr", { "data-strategy": row.strategy });
        line.append(
          element("th", { scope: "row" }, t.strategies[row.strategy]),
          element("td", { "data-safe": String(row.safe) }, row.safe ? t.safe : t.unsafe),
        );
        for (const [key, value] of [
          ["duplicates", row.duplicateWrites],
          ["replayed", row.replayed],
          ["calls", row.calls],
          ["writes", row.writes],
        ])
          line.append(
            element(
              "td",
              { class: "tool-number", "data-agent-metric": key },
              count.format(value),
            ),
          );
        body.append(line);
        const list = element("ol", {
          class: "agent-trace",
          "data-strategy": row.strategy,
        });
        for (const item of row.trace)
          list.append(
            element(
              "li",
              {
                "data-kind": item.kind,
                "data-outcome": item.outcome,
                ...(item.replay ? { "data-replay": "true" } : {}),
              },
              describe(item),
            ),
          );
        traces.append(element("h3", {}, t.strategies[row.strategy]), list);
      }
      stackRows(body);
      const takeaway = {
        healthy: t.takeawayHealthy,
        first: t.takeawayFirst,
        before: t.takeawayBefore,
        "after-write": t.takeawayAfterWrite,
        "after-read": t.takeawayAfterRead,
      }[incident.kind];
      const diagnosis = element("div", { class: "decision-diagnosis" });
      diagnosis.append(
        element(
          "p",
          { class: "decision-takeaway" },
          fill(takeaway, {
            step: count.format(incident.step),
            previous: count.format(incident.step - 1),
            restartWrites: writes(incident.restartWrites),
          }),
        ),
      );
      results.append(
        wrapper,
        diagnosis,
        traces,
        element("p", { class: "decision-hint" }, t.boundary),
      );
      const unsafe = rows.filter((row) => !row.safe).length;
      return {
        text: !unsafe ? t.none : unsafe === 1 ? t.one : fill(t.some, { count: unsafe }),
      };
    },
  });
}

/** Narrowest interval band drawn, in percent of the 0–100% track. */
const MIN_BAND = 2;

const EVAL_MODES = Object.freeze({
  interval: ["successes", "trials", "confidence"],
  sample: ["baseline", "candidate", "confidence", "power"],
  agreement: ["bothpass", "onlya", "onlyb", "bothfail"],
});

function mountEvals(host, locale, base) {
  const t = base.evals;
  const count = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const ratio = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const percent = (value) => `${decimal.format(value * 100)}%`;
  const labels = (values) => values.map((value) => `${value}%`);
  const fields = {
    mode: field("eval-mode", t.mode, select(Object.keys(EVAL_MODES), t.modes)),
    successes: field("eval-successes", t.successes, number(0, AI_LIMITS.trials)),
    trials: field("eval-trials", t.trials, number(1, AI_LIMITS.trials)),
    baseline: field("eval-baseline", t.baseline, number(0.1, 99.9, "any")),
    candidate: field("eval-candidate", t.candidate, number(0.1, 99.9, "any")),
    confidence: field(
      "eval-confidence",
      t.confidence,
      select(["90", "95", "99"], labels([90, 95, 99])),
    ),
    power: field("eval-power", t.power, select(["80", "90"], labels([80, 90])), t.powerHelp),
    bothpass: {
      ...field("eval-both-pass", t.bothPass, number(0, AI_LIMITS.trials)),
      core: "bothPass",
    },
    onlya: {
      ...field("eval-only-a", t.onlyA, number(0, AI_LIMITS.trials)),
      core: "onlyA",
    },
    onlyb: {
      ...field("eval-only-b", t.onlyB, number(0, AI_LIMITS.trials)),
      core: "onlyB",
    },
    bothfail: {
      ...field("eval-both-fail", t.bothFail, number(0, AI_LIMITS.trials)),
      core: "bothFail",
    },
  };
  const mode = fields.mode.input;
  const read = (key) => readNumber(fields[key].input);
  // Only the controls of the chosen question are shown and shared.
  const configure = () => {
    const visible = EVAL_MODES[mode.value] || EVAL_MODES.interval;
    for (const [key, { wrapper }] of Object.entries(fields))
      if (key !== "mode") wrapper.hidden = !visible.includes(key);
  };
  const compute = {
    interval: () =>
      intervalLadder({
        successes: read("successes"),
        trials: read("trials"),
        confidence: read("confidence"),
      }),
    sample: () =>
      sampleSize({
        baseline: read("baseline") / 100,
        candidate: read("candidate") / 100,
        confidence: read("confidence"),
        power: read("power"),
      }),
    agreement: () =>
      cohenKappa({
        bothPass: read("bothpass"),
        onlyA: read("onlya"),
        onlyB: read("onlyb"),
        bothFail: read("bothfail"),
      }),
  };
  const note = (text) => element("p", { class: "decision-hint" }, text);
  // The same rate at n, 4n and 16n examples: the width halves each time.
  const ladderTable = (ladder) => {
    if (ladder.length < 2) return "";
    const level = fields.confidence.input.value;
    const columns = t.ladderColumns.map((label) => fill(label, { level }));
    const { wrapper, body } = tableShell(
      columns,
      fill(t.ladderCaption, { rate: percent(ladder[0].rate) }),
      "eval-ladder",
      new Set([columns[2]]),
    );
    for (const row of ladder) {
      const line = element("tr");
      line.append(
        element(
          "th",
          { scope: "row" },
          fill(t.ladderOf, {
            passed: count.format(row.successes),
            total: count.format(row.trials),
          }),
        ),
        element("td", {}, `${percent(row.lower)} – ${percent(row.upper)}`),
        element(
          "td",
          { class: "tool-number" },
          `${decimal.format((row.upper - row.lower) * 100)} ${t.points}`,
        ),
      );
      body.append(line);
    }
    stackRows(body);
    const block = element("div", { class: "eval-ladder-block" });
    block.append(wrapper, note(t.ladderNote));
    return block;
  };
  const render = {
    interval(ladder, results) {
      const [result] = ladder;
      const level = fields.confidence.input.value;
      const reading = intervalReading(result);
      const width = decimal.format((result.upper - result.lower) * 100);
      const range = `${percent(result.lower)} – ${percent(result.upper)}`;
      const rangeRow = element("div", { class: "decision-bar-row" });
      const rangeHeader = element("div", { class: "decision-bar-header" });
      rangeHeader.append(
        element("span", { class: "decision-bar-label" }, fill(t.intervalBarLabel, { level })),
        element(
          "span",
          { class: "decision-bar-value" },
          fill(t.observedRange, { range, rate: percent(result.rate) }),
        ),
      );
      const track = element("div", {
        class: "decision-bar-track eval-interval-track",
        "aria-hidden": "true",
      });
      // A band narrower than the minimum keeps its centre and stays on the track.
      const lower = result.lower * 100;
      const upper = result.upper * 100;
      const bandWidth = Math.max(MIN_BAND, upper - lower);
      const bandLeft = Math.min(100 - bandWidth, Math.max(0, (lower + upper - bandWidth) / 2));
      const band = element("div", { class: "eval-interval-band" });
      band.style.left = `${bandLeft.toFixed(1)}%`;
      band.style.width = `${bandWidth.toFixed(1)}%`;
      const pin = element("div", { class: "eval-interval-pin" });
      pin.style.left = `${(result.rate * 100).toFixed(1)}%`;
      track.append(band, pin);
      rangeRow.append(rangeHeader, track);
      const trials = count.format(result.trials);
      const takeaway =
        reading.kind === "perfect"
          ? fill(t.intervalTakeawayPerfect, {
              passed: count.format(result.successes),
              trials,
              level,
              lower: percent(result.lower),
              gap: decimal.format((1 - result.lower) * 100),
            })
          : fill(t.intervalTakeawayStandard, {
              trials,
              level,
              lower: percent(result.lower),
              upper: percent(result.upper),
              below: decimal.format(reading.below * 100),
              above: decimal.format(reading.above * 100),
              rate: percent(result.rate),
            });
      const diagnosis = element("div", { class: "decision-diagnosis" });
      diagnosis.append(rangeRow, element("p", { class: "decision-takeaway" }, takeaway));
      results.append(
        metricList("eval", [
          ["rate", t.metrics.rate, percent(result.rate)],
          ["interval", fill(t.metrics.interval, { level }), range],
          ["width", t.metrics.width, `${width} ${t.points}`],
        ]),
        diagnosis,
        ladderTable(ladder),
        note(t.intervalNote),
      );
      return { text: fill(t.intervalStatus, { trials, level, width }) };
    },
    sample(result, results) {
      const difference = decimal.format(result.difference * 100);
      const baseline = read("baseline");
      const candidate = read("candidate");
      const diagnosis = element("div", { class: "decision-diagnosis" });
      const bars = element("div", { class: "decision-bars" });
      bars.append(
        barRow(t.baseline, `${decimal.format(baseline)}%`, baseline),
        barRow(t.candidate, `${decimal.format(candidate)}%`, candidate),
      );
      diagnosis.append(
        bars,
        element(
          "p",
          { class: "decision-takeaway" },
          fill(t.sampleTakeaway, {
            difference,
            baseline: decimal.format(baseline),
            candidate: decimal.format(candidate),
            confidence: fields.confidence.input.value,
            power: fields.power.input.value,
            perVariant: count.format(result.perVariant),
            total: count.format(result.total),
          }),
        ),
      );
      results.append(
        metricList("eval", [
          ["per-variant", t.metrics.perVariant, count.format(result.perVariant)],
          ["total", t.metrics.total, count.format(result.total)],
          ["difference", t.metrics.difference, `${difference} ${t.points}`],
        ]),
        diagnosis,
        note(t.sampleNote),
      );
      return {
        text: fill(t.sampleStatus, { count: count.format(result.perVariant), difference }),
      };
    },
    agreement(result, results) {
      const kappa = result.kappa === null ? base.unavailable : ratio.format(result.kappa);
      const reading = kappaReading(result);
      results.append(
        metricList("eval", [
          ["examples", t.metrics.examples, count.format(result.total)],
          ["observed", t.metrics.observed, percent(result.observed)],
          ["expected", t.metrics.expected, percent(result.expected)],
          ["kappa", t.metrics.kappa, kappa],
        ]),
      );
      if (reading.kind !== "undefined") {
        const values = {
          observed: percent(result.observed),
          expected: percent(result.expected),
          passA: percent(result.passA),
          passB: percent(result.passB),
          kappa,
          rare: reading.rare ? t.kappaRare[reading.rare] : "",
        };
        const bars = element("div", { class: "decision-bars" });
        bars.append(
          barRow(t.kappaBarObserved, values.observed, result.observed * 100),
          barRow(
            fill(t.kappaBarExpected, values),
            values.expected,
            result.expected * 100,
            reading.kind === "paradox" ? "warn" : "ok",
          ),
        );
        const takeaway = {
          paradox: t.kappaTakeawayParadox,
          strong: t.kappaTakeawayStrong,
          moderate: t.kappaTakeawayModerate,
          none: t.kappaTakeawayNone,
        }[reading.kind];
        const diagnosis = element("div", { class: "decision-diagnosis" });
        diagnosis.append(bars, element("p", { class: "decision-takeaway" }, fill(takeaway, values)));
        results.append(diagnosis);
      }
      results.append(note(t.kappaNote));
      return {
        text:
          result.kappa === null ? t.kappaUndefined : fill(t.kappaStatus, { kappa }),
      };
    },
  };
  const sheet = worksheet(host, locale, base, t, {
    id: "interactive-eval-stats",
    prefix: "eval",
    fields,
    example: {
      mode: "interval",
      successes: "42",
      trials: "50",
      baseline: "80",
      candidate: "85",
      confidence: "95",
      power: "80",
      bothpass: "40",
      onlya: "5",
      onlyb: "10",
      bothfail: "45",
    },
    keep: () => ({ mode: mode.value }),
    immediate: mode,
    notes: [t.formulaInterval, t.formulaSample, t.formulaKappa, t.scope],
    href: "https://arxiv.org/abs/2411.00640",
    configure,
    compute: () => ({ mode: mode.value, result: compute[mode.value]() }),
    render: (outcome, results) => render[outcome.mode](outcome.result, results),
  });
  mode.addEventListener("change", () => {
    configure();
    sheet.run(false);
  });
}

/** Repeated setup does not reset inputs or attach duplicate handlers. */
export function setupAiTools(locale) {
  const base = copy[locale] || copy.en;
  for (const [id, mount] of [
    ["interactive-agent-run", mountAgent],
    ["interactive-eval-stats", mountEvals],
  ]) {
    const host = document.getElementById(id);
    if (!host || mounted.has(host)) continue;
    mount(host, locale, base);
    mounted.add(host);
    // Siblings mount together; the loader must not announce them again.
    host.dataset.initialized = "true";
  }
}
