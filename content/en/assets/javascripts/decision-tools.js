/** Example-first, browser-local decision worksheets. Visitor text stays local. */
import { element, button, downloadText } from "./workbench-dom.js";
import { useScenario, shareControl } from "./share.js";
import {
  calculateSlo,
  compareTableSchemas,
  planTableFiles,
  TABLE_LIMITS,
  TABLE_PARTITIONING,
  COLUMN_TYPES,
  DECISION_LIMITS,
} from "./decision-tools-core.js";

const mounted = new WeakSet();
const copy = {
  en: {
    local: "Local worksheet · no connection",
    calculate: "Calculate budget",
    example: "Load example",
    compare: "Compare schemas",
    stale: "Inputs changed. Run the worksheet again to refresh the result.",
    inputError: "Check the input",
    unavailable: "Not defined",
    unknown:
      "No observed exposure: reliability and burn rate cannot be calculated.",
    sloTitle: "SLO & Error Budget",
    sloIntro:
      "How much failure can this reliability goal tolerate? Try an example, then enter your own measured counts or minutes.",
    mode: "1 · What are you measuring?",
    modes: ["Requests · successful outcomes", "Time · available minutes"],
    target: "Reliability target (%)",
    window: "Measurement window (days)",
    observedRequests: "Eligible requests in this complete window",
    observedTime: "Minutes actually observed in the window",
    badRequests: "Bad requests in that same window",
    badTime: "Unavailable minutes within observed time",
    targetHelp: "0–100%, up to six decimal places. The example uses 99.9%.",
    windowHelp:
      "One minute to 366 days. State whether your real policy uses rolling or calendar windows.",
    requestsHelp:
      "Count each eligible request once. Define “bad” before counting: for example, failed OR too slow, without double counting.",
    timeHelp:
      "Use one consistent observation method. Unobserved minutes are unknown, not automatically available.",
    requestBasis:
      "The allowance covers only the requests you measured across this complete window. It is not a forecast of future traffic.",
    timeBasis:
      "The allowance covers the entire selected window. Burn rate uses only the observed minutes, which may be a shorter interval.",
    total: "Total allowance",
    used: "Already used",
    remaining: "Remaining allowance",
    burn: "Observed burn rate",
    sli: "Observed good outcomes",
    requestsUnit: "requests",
    minutesUnit: "minutes",
    within: "Measured use is within this allowance.",
    exhausted: "This allowance is fully used.",
    exceeded:
      "Measured failures exceed this allowance. A negative remainder is the overspend, not a negative failure count.",
    perfect:
      "A 100% target permits no failures. Dividing by a zero allowance cannot produce a meaningful burn rate.",
    partial:
      "Partial observation: the remaining window has not been classified. A positive remainder is not proof that the whole window will meet its target.",
    sloHelp: "How the calculation works",
    sloFormula:
      "Allowed failure fraction = (100 − target) / 100. Total allowance = eligible window requests × fraction, or whole-window minutes × fraction. Remaining = allowance − bad outcomes. Burn rate = (bad / observed) / fraction.",
    sloLimits:
      "A burn rate of 1× consumes allowance at the target failure ratio; 2× means twice that ratio. This single interval is not a multi-window alert, an SLA assessment or a predicted exhaustion date. Request counts and unavailable minutes are different SLIs; do not convert one into the other.",
    fractional:
      "A request allowance may be fractional; an actual failed request is indivisible. No traffic means no measured success ratio. Missing telemetry is not counted as success.",
    sloSource: "Google SRE: turning SLOs into alerts",
    schemaTitle: "Schema Diff",
    schemaIntro:
      "Will a changed table surprise a reader? Compare two small column contracts and review the questions each change raises.",
    preset: "1 · Choose an example",
    presets: [
      "Add a column and allow nulls",
      "Rename a column",
      "Require a value and change a type",
    ],
    previous: "2 · Previous contract",
    next: "3 · Proposed contract",
    schemaHint:
      "JSON only: columns with name, type and nullable. Nothing is uploaded or executed.",
    schemaHelp: "Contract, direction and limits",
    contract:
      "This is a small flat-table contract, not full JSON Schema, SQL DDL, Avro or a schema-registry validator. Use exactly a columns array; every column requires name, type and a true/false nullable value. Empty arrays are allowed for comparison.",
    names:
      "Names are case-sensitive ASCII identifiers: a letter or underscore, then letters, digits or underscores; at most 64 characters. Up to 200 columns and 32,768 characters per editor. Duplicate column names are rejected.",
    scope:
      "Nullable means a value may be null; it does not mean a field may be omitted. Defaults, constraints, keys, precision, time zones, nested shapes and engine-specific casts are outside this contract. Renames appear as removal plus addition; they are not guessed.",
    direction:
      "The two directions are deliberate: new readers consuming old data (backward direction), and old readers consuming new data (forward direction). Review actual readers, storage and deployment order; these notes never certify compatibility.",
    types: "Supported type labels",
    schemaSource: "Why real format and reader rules matter",
    unchanged:
      "No name, type or nullability differences. This does not verify data, constraints or reader behavior.",
    changed: (changes, columns) =>
      `${changes} changes across ${columns} columns. Review both reader directions before rollout.`,
    reordered:
      "The relative order of existing columns also changed. Positional readers and SELECT * mappings need a separate review.",
    change: {
      added: "Added",
      removed: "Removed",
      type: "Type changed",
      nullability: "Nullability changed",
    },
    before: "Previous",
    after: "Proposed",
    absent: "Not present",
    nullable: "null allowed",
    required: "non-null value required",
    newer: "New reader ← old data",
    older: "Old reader ← new data",
    report: "Inspect the JSON report",
    copyReport: "Copy report",
    download: "Download JSON",
    copied: "Report copied.",
    copyFailed:
      "Clipboard unavailable. Open the JSON report and select its text to copy manually.",
    downloaded: "JSON download requested.",
    risk: {
      added_nullable: [
        "Old data has no value for this column. A reader or migration must explicitly supply or accept a missing value; allowing null alone is not a default.",
        "New data includes an extra column. Check strict readers, field lists and positional mappings rather than assuming extra columns are ignored.",
      ],
      added_required: [
        "Old data lacks this required value. Plan a backfill, explicit default or reader migration before enforcing it.",
        "New data includes an extra column. Old readers may reject it or misinterpret positional output; test their field handling.",
      ],
      removed: [
        "Old data still contains this column. Check how the new reader handles extra fields or changes its projection.",
        "Old readers may still query or require the removed column. Migrate those readers before they encounter new data.",
      ],
      type: [
        "The new reader expects a different type. Test conversion, precision, encoding and date/time meaning with existing values.",
        "Old readers still expect the former type. New values or encodings may be rejected or silently coerced; test the actual engine and serializer.",
      ],
      required: [
        "Old data may contain null. Validate or backfill those records before requiring a non-null value.",
        "New non-null values satisfy the old nullability rule alone. Other constraints, formats and application assumptions still need tests.",
      ],
      relaxed: [
        "Old non-null values satisfy the relaxed nullability rule alone. This says nothing about other schema or reader constraints.",
        "New data may now contain null. Old readers expecting a value can fail; update their handling before such data arrives.",
      ],
    },
    errors: {
      number_range:
        "Use finite values within the shown bounds. Bad outcomes cannot exceed observed exposure; observed time cannot exceed the window.",
      target_precision:
        "Use at most six decimal places for the percentage target.",
      whole_requests:
        "Request counts must be whole numbers, from zero to one trillion.",
      slo_mode: "Choose requests or time.",
      schema_size: "Use no more than 32,768 characters per schema.",
      schema_json: "Enter valid JSON, with double-quoted keys and no comments.",
      schema_shape: "Use an object containing only a columns array.",
      schema_columns: "Use no more than 200 columns.",
      column_shape: "Every column needs exactly name, type and nullable.",
      column_name:
        "Use unique ASCII identifiers up to 64 characters, starting with a letter or underscore.",
      column_type: "Choose a supported lowercase type label.",
      column_nullable:
        "nullable must be the boolean true or false, not a quoted word.",
      column_duplicate:
        "Two columns have the same name. Names must be unique and are case-sensitive.",
    },
    table: {
      title: "Table File Planner",
      intro:
        "How many files will this table write, and how many will compaction leave? Try the example, then enter your own volume and commit rhythm.",
      daily: "Data written per day (GiB, compressed)",
      dailyHelp: "The Parquet size after compression, not the raw input.",
      commits: "Commits per day",
      commitsHelp: "288 is one commit every 5 minutes, 24 is hourly and 1 is a daily batch.",
      partitioning: "Time partitioning",
      partitionLabels: ["None", "By day", "By hour"],
      buckets: "Hash buckets",
      bucketsHelp: "1 means no bucketing; bucket(16, id) is 16.",
      target: "Target file size (MiB)",
      targetHelp: "Iceberg writes toward write.target-file-size-bytes, 536,870,912 bytes (512 MiB) by default.",
      retention: "Days kept",
      plan: "Plan files",
      metrics: {
        averageFile: "Average file written",
        filesPerCommit: "Files per commit",
        filesPerDay: "Files per day",
        retained: "Files kept without compaction",
        compacted: "Files after compaction",
        partitions: "Partitions × buckets",
        partitionSize: "Data per partition",
      },
      healthy: "Commits already write files near the target; compaction has little to merge.",
      findingOne: "1 finding to review below the figures.",
      findingMany: "{count} findings to review below the figures.",
      smallFiles: "Each commit writes files far below the target: schedule compaction, or commit less often.",
      overPartitioned: "Each partition holds less than one target file: coarser partitions or fewer buckets avoid small files, even after compaction.",
      manyFiles: "Over a million files to track without compaction: query planning and metadata grow with every file.",
      boundary:
        "A planning estimate for one append-only table with evenly spread data, not a benchmark. Parallel writers, deletes and sort order usually add files.",
      help: "How the estimate works",
      formula:
        "Files per commit = partitions touched × max(1, ⌈data per commit ÷ partitions touched ÷ target⌉). An hourly table touches ⌈24 ÷ commits per day⌉ hours per commit, at most 24, times the buckets.",
      compaction:
        "After compaction each partition keeps max(1, ⌈partition size ÷ target⌉) files. An unpartitioned table compacts each bucket across the whole retention.",
      scope:
        "Not modeled: parallel writers, delete files, sorting, manifest rewrites and snapshot expiry. Old files stay on storage until their snapshots expire.",
      source: "Apache Iceberg — table maintenance",
      errors: {
        number_range: "Use finite values within the shown bounds.",
        integer: "Commits, buckets, target size and days must be whole numbers.",
        partitioning: "Choose none, day or hour.",
      },
    },
  },
  es: {
    local: "Hoja local · sin conexión a servicios",
    calculate: "Calcular presupuesto",
    example: "Cargar ejemplo",
    compare: "Comparar esquemas",
    stale:
      "Cambiaste los datos. Ejecuta la herramienta de nuevo para actualizar el resultado.",
    inputError: "Revisa los datos",
    unavailable: "No definido",
    unknown:
      "Sin exposición observada: no se pueden calcular fiabilidad ni tasa de consumo.",
    sloTitle: "SLO y presupuesto de error",
    sloIntro:
      "¿Cuántos fallos admite este objetivo de fiabilidad? Prueba un ejemplo y después introduce tus recuentos o minutos medidos.",
    mode: "1 · ¿Qué estás midiendo?",
    modes: [
      "Solicitudes · resultados correctos",
      "Tiempo · minutos disponibles",
    ],
    target: "Objetivo de fiabilidad (%)",
    window: "Ventana de medición (días)",
    observedRequests: "Solicitudes elegibles en toda esta ventana",
    observedTime: "Minutos realmente observados en la ventana",
    badRequests: "Solicitudes incorrectas en la misma ventana",
    badTime: "Minutos no disponibles entre los observados",
    targetHelp: "0–100%, hasta seis decimales. El ejemplo usa 99,9%.",
    windowHelp:
      "De un minuto a 366 días. Define si tu política real usa ventanas móviles o de calendario.",
    requestsHelp:
      "Cuenta cada solicitud elegible una sola vez. Define antes qué es incorrecto: por ejemplo, falló O fue demasiado lenta, sin contarla dos veces.",
    timeHelp:
      "Usa un método de observación consistente. Los minutos no observados son desconocidos, no disponibles por defecto.",
    requestBasis:
      "El presupuesto cubre solo las solicitudes medidas durante toda esta ventana. No predice tráfico futuro.",
    timeBasis:
      "El presupuesto cubre toda la ventana elegida. La tasa de consumo usa solo los minutos observados, que pueden corresponder a un intervalo menor.",
    total: "Presupuesto total",
    used: "Ya consumido",
    remaining: "Presupuesto restante",
    burn: "Tasa de consumo observada",
    sli: "Resultados correctos observados",
    requestsUnit: "solicitudes",
    minutesUnit: "minutos",
    within: "El consumo medido está dentro de este presupuesto.",
    exhausted: "Este presupuesto se consumió por completo.",
    exceeded:
      "Los fallos medidos superan el presupuesto. El resto negativo indica cuánto se excedió, no un número negativo de fallos.",
    perfect:
      "Un objetivo del 100% no admite fallos. Dividir entre un presupuesto de cero no produce una tasa de consumo significativa.",
    partial:
      "Observación parcial: el resto de la ventana no está clasificado. Un resto positivo no demuestra que toda la ventana vaya a cumplir el objetivo.",
    sloHelp: "Cómo funciona el cálculo",
    sloFormula:
      "Fracción de fallos permitida = (100 − objetivo) / 100. Presupuesto = solicitudes elegibles de la ventana × fracción, o minutos de toda la ventana × fracción. Resto = presupuesto − resultados incorrectos. Ritmo = (incorrectos / observados) / fracción.",
    sloLimits:
      "Un ritmo de 1× consume presupuesto con la proporción de fallos del objetivo; 2× significa el doble. Este intervalo aislado no es una alerta multiventana, una evaluación de SLA ni una fecha prevista de agotamiento. Solicitudes y minutos no disponibles son indicadores distintos; no conviertas uno en el otro.",
    fractional:
      "El presupuesto de solicitudes puede ser fraccionario; una solicitud fallida real es indivisible. Sin tráfico no hay proporción de éxito medida. La falta de telemetría no se cuenta como éxito.",
    sloSource: "Google SRE: convertir SLO en alertas",
    schemaTitle: "Comparador de esquemas",
    schemaIntro:
      "¿Un cambio de tabla puede sorprender a quien la lee? Compara dos contratos pequeños de columnas y revisa las preguntas que plantea cada cambio.",
    preset: "1 · Elige un ejemplo",
    presets: [
      "Añadir columna y permitir nulos",
      "Renombrar una columna",
      "Exigir un valor y cambiar un tipo",
    ],
    previous: "2 · Contrato anterior",
    next: "3 · Contrato propuesto",
    schemaHint:
      "Solo JSON: columnas con name, type y nullable. Nada se sube ni se ejecuta.",
    schemaHelp: "Contrato, dirección y límites",
    contract:
      "Este es un contrato pequeño de tabla plana, no JSON Schema completo, DDL de SQL, Avro ni un validador de Schema Registry. Usa solo un array columns; cada columna exige name, type y nullable con valor true/false. Se admiten arrays vacíos para comparar.",
    names:
      "Los nombres distinguen mayúsculas y usan identificadores ASCII: letra o guion bajo, después letras, dígitos o guiones bajos; hasta 64 caracteres. Máximo 200 columnas y 32.768 caracteres por editor. Se rechazan nombres duplicados.",
    scope:
      "Nullable permite un valor null; no significa que el campo pueda omitirse. Defaults, restricciones, claves, precisión, zonas horarias, estructuras anidadas y conversiones de cada motor quedan fuera del contrato. Renombrar aparece como retirar y añadir; no se adivinan renombrados.",
    direction:
      "Hay dos direcciones: lectores nuevos consumiendo datos antiguos (hacia atrás), y lectores antiguos consumiendo datos nuevos (hacia delante). Revisa lectores, almacenamiento y orden de despliegue reales; estas notas nunca certifican compatibilidad.",
    types: "Etiquetas de tipo admitidas",
    schemaSource: "Por qué importan el formato y las reglas reales del lector",
    unchanged:
      "Sin diferencias en nombres, tipos o nulabilidad. Esto no verifica datos, restricciones ni el comportamiento del lector.",
    changed: (changes, columns) =>
      `${changes} cambios en ${columns} columnas. Revisa ambas direcciones antes del despliegue.`,
    reordered:
      "También cambió el orden relativo de las columnas existentes. Los lectores por posición y los mapeos SELECT * necesitan otra revisión.",
    change: {
      added: "Añadida",
      removed: "Retirada",
      type: "Tipo cambiado",
      nullability: "Nulabilidad cambiada",
    },
    before: "Anterior",
    after: "Propuesto",
    absent: "No presente",
    nullable: "admite null",
    required: "exige valor no nulo",
    newer: "Lector nuevo ← datos antiguos",
    older: "Lector antiguo ← datos nuevos",
    report: "Inspeccionar el informe JSON",
    copyReport: "Copiar informe",
    download: "Descargar JSON",
    copied: "Informe copiado.",
    copyFailed:
      "Portapapeles no disponible. Abre el informe JSON y selecciona el texto para copiarlo manualmente.",
    downloaded: "Descarga JSON solicitada.",
    risk: {
      added_nullable: [
        "Los datos antiguos no tienen valor para esta columna. Un lector o una migración debe aceptar o completar explícitamente el campo ausente; permitir null no define un default.",
        "Los datos nuevos incluyen una columna extra. Comprueba lectores estrictos, listas de campos y mapeos por posición; no supongas que ignoran campos adicionales.",
      ],
      added_required: [
        "A los datos antiguos les falta este valor obligatorio. Prepara backfill, default explícito o migración del lector antes de exigirlo.",
        "Los datos nuevos incluyen una columna extra. Los lectores antiguos pueden rechazarla o interpretar mal el orden; prueba su manejo de campos.",
      ],
      removed: [
        "Los datos antiguos todavía incluyen esta columna. Comprueba cómo el lector nuevo maneja campos extra o cambia su proyección.",
        "Los lectores antiguos pueden consultar o exigir la columna retirada. Migra esos lectores antes de que reciban datos nuevos.",
      ],
      type: [
        "El lector nuevo espera otro tipo. Prueba conversión, precisión, codificación y significado de fechas/horas con valores existentes.",
        "Los lectores antiguos esperan el tipo anterior. Pueden rechazar o convertir silenciosamente valores o codificaciones nuevos; prueba el motor y serializador reales.",
      ],
      required: [
        "Los datos antiguos pueden contener null. Valida o completa esos registros antes de exigir valores no nulos.",
        "Los valores nuevos no nulos cumplen solo la regla anterior de nulabilidad. Las demás restricciones, formatos y supuestos de aplicación siguen necesitando pruebas.",
      ],
      relaxed: [
        "Los valores antiguos no nulos cumplen solo la regla relajada de nulabilidad. Esto no demuestra nada sobre otras restricciones o lectores.",
        "Los datos nuevos ahora pueden contener null. Los lectores antiguos que esperan un valor pueden fallar; actualízalos antes de recibir esos datos.",
      ],
    },
    errors: {
      number_range:
        "Usa números finitos dentro de los límites indicados. Los fallos no pueden superar lo observado, ni el tiempo observado superar la ventana.",
      target_precision:
        "Usa hasta seis decimales en el porcentaje del objetivo.",
      whole_requests:
        "Los recuentos de solicitudes deben ser enteros entre cero y un billón (10¹²).",
      slo_mode: "Elige solicitudes o tiempo.",
      schema_size: "Usa hasta 32.768 caracteres por esquema.",
      schema_json:
        "Introduce JSON válido, con claves entre comillas dobles y sin comentarios.",
      schema_shape: "Usa un objeto que contenga solo el array columns.",
      schema_columns: "Usa hasta 200 columnas.",
      column_shape: "Cada columna necesita exactamente name, type y nullable.",
      column_name:
        "Usa identificadores ASCII únicos de hasta 64 caracteres, que empiecen por letra o guion bajo.",
      column_type: "Elige una etiqueta de tipo admitida en minúsculas.",
      column_nullable:
        "nullable debe ser el booleano true o false, no una palabra entre comillas.",
      column_duplicate:
        "Dos columnas tienen el mismo nombre. Deben ser únicos y distinguen mayúsculas.",
    },
    table: {
      title: "Planificador de archivos de tabla",
      intro:
        "¿Cuántos archivos escribirá esta tabla y cuántos dejará la compactación? Prueba el ejemplo y luego introduce tu volumen y tu ritmo de commits.",
      daily: "Datos escritos por día (GiB, comprimidos)",
      dailyHelp: "El tamaño en Parquet tras la compresión, no la entrada en bruto.",
      commits: "Commits por día",
      commitsHelp: "288 es un commit cada 5 minutos, 24 es uno por hora y 1 es un lote diario.",
      partitioning: "Particionado temporal",
      partitionLabels: ["Ninguno", "Por día", "Por hora"],
      buckets: "Buckets de hash",
      bucketsHelp: "1 significa sin buckets; bucket(16, id) son 16.",
      target: "Tamaño de archivo objetivo (MiB)",
      targetHelp: "Iceberg escribe hacia write.target-file-size-bytes, 536.870.912 bytes (512 MiB) por defecto.",
      retention: "Días conservados",
      plan: "Planificar archivos",
      metrics: {
        averageFile: "Archivo medio escrito",
        filesPerCommit: "Archivos por commit",
        filesPerDay: "Archivos por día",
        retained: "Archivos sin compactar",
        compacted: "Archivos tras compactar",
        partitions: "Particiones × buckets",
        partitionSize: "Datos por partición",
      },
      healthy: "Los commits ya escriben archivos cercanos al objetivo; la compactación tiene poco que unir.",
      findingOne: "1 hallazgo que revisar bajo las cifras.",
      findingMany: "{count} hallazgos que revisar bajo las cifras.",
      smallFiles: "Cada commit escribe archivos muy por debajo del objetivo: programa compactaciones o haz commits con menos frecuencia.",
      overPartitioned: "Cada partición guarda menos de un archivo objetivo: particiones más gruesas o menos buckets evitan archivos pequeños, incluso tras compactar.",
      manyFiles: "Más de un millón de archivos que rastrear sin compactación: la planificación de consultas y los metadatos crecen con cada archivo.",
      boundary:
        "Una estimación para una tabla de solo inserciones con datos repartidos de forma uniforme, no un benchmark. Los escritores en paralelo, los borrados y el orden de escritura suelen añadir archivos.",
      help: "Cómo se calcula",
      formula:
        "Archivos por commit = particiones tocadas × max(1, ⌈datos por commit ÷ particiones tocadas ÷ objetivo⌉). Una tabla horaria toca ⌈24 ÷ commits por día⌉ horas por commit, como máximo 24, por los buckets.",
      compaction:
        "Tras compactar, cada partición conserva max(1, ⌈tamaño de la partición ÷ objetivo⌉) archivos. Una tabla sin particionar compacta cada bucket sobre toda la retención.",
      scope:
        "No se modelan: escritores en paralelo, archivos de borrado, ordenación, reescritura de manifiestos ni expiración de snapshots. Los archivos antiguos siguen en el almacenamiento hasta que expiran sus snapshots.",
      source: "Apache Iceberg — mantenimiento de tablas",
      errors: {
        number_range: "Usa valores finitos dentro de los límites indicados.",
        integer: "Commits, buckets, tamaño objetivo y días deben ser números enteros.",
        partitioning: "Elige ninguno, día u hora.",
      },
    },
  },
};

/** An empty field reads as NaN, never as zero. */
const readNumber = (input) =>
  input.value.trim() ? Number(input.value) : NaN;

function field(id, label, input, help = "") {
  const wrapper = element("div", { class: "decision-field" });
  const caption = element("label", { for: id }, label);
  input.id = id;
  wrapper.append(caption, input);
  if (help) {
    const hint = element(
      "p",
      { id: id + "-hint", class: "decision-hint" },
      help,
    );
    input.setAttribute("aria-describedby", hint.id);
    wrapper.append(hint);
  }
  return { wrapper, input, caption };
}

function select(values, labels) {
  const input = element("select");
  for (const [index, value] of values.entries())
    input.append(element("option", { value }, labels[index]));
  return input;
}

function help(title, paragraphs, href, linkLabel) {
  const details = element("details", { class: "decision-help" });
  details.append(element("summary", {}, title));
  for (const text of paragraphs) details.append(element("p", {}, text));
  if (href) {
    const paragraph = element("p");
    paragraph.append(element("a", { href }, linkLabel));
    details.append(paragraph);
  }
  return details;
}

function shell(host, title, intro, t) {
  host.classList.add("decision-tool");
  host.replaceChildren(
    element("h2", { class: "lab-widget-title" }, title),
    element("p", { class: "decision-local" }, t.local),
    element("p", {}, intro),
  );
}

function statusNode(id) {
  return element("p", {
    id,
    class: "decision-status",
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "true",
  });
}

/** `focus` is false when a shared scenario runs at mount: no focus jump. */
function showError(error, status, controls, t, focus = true) {
  status.dataset.state = "error";
  status.textContent =
    t.inputError + ": " + (t.errors[error.code] || t.inputError);
  const input = controls[error.field];
  if (input) {
    input.setAttribute("aria-invalid", "true");
    if (focus) input.focus();
  }
}

function mountSlo(host, locale, t) {
  shell(host, t.sloTitle, t.sloIntro, t);
  const form = element("form", { class: "decision-form", novalidate: "" });
  const mode = select(["requests", "time"], t.modes);
  const grid = element("div", { class: "decision-fields" });
  const number = (min, max, step = "any") =>
    element("input", {
      type: "number",
      min: String(min),
      max: String(max),
      step,
      required: "",
      inputmode: "decimal",
    });
  const target = field(
    "slo-target",
    t.target,
    number(0, 100, "0.000001"),
    t.targetHelp,
  );
  const windowField = field(
    "slo-window-days",
    t.window,
    number(1 / 1440, DECISION_LIMITS.windowDays),
    t.windowHelp,
  );
  const observed = field(
    "slo-observed",
    t.observedRequests,
    number(0, DECISION_LIMITS.requests, "1"),
  );
  const bad = field(
    "slo-bad",
    t.badRequests,
    number(0, DECISION_LIMITS.requests, "1"),
  );
  grid.append(target.wrapper, windowField.wrapper, observed.wrapper, bad.wrapper);
  const modeHelp = element("p", {
    class: "decision-hint",
    id: "slo-mode-hint",
  });
  observed.input.setAttribute("aria-describedby", modeHelp.id);
  bad.input.setAttribute("aria-describedby", modeHelp.id);
  const actions = element("div", { class: "decision-actions" });
  const calculate = button(t.calculate, {
    id: "slo-calculate",
    type: "submit",
    class: "decision-primary",
  });
  const example = button(t.example, { id: "slo-example" });
  actions.append(calculate, example);
  const status = statusNode("slo-status");
  const results = element("div", {
    id: "slo-results",
    class: "decision-results",
    role: "region",
    "aria-label": t.sloTitle,
  });
  const controls = {
    mode,
    target: target.input,
    windowDays: windowField.input,
    observed: observed.input,
    bad: bad.input,
  };
  form.append(field("slo-mode", t.mode, mode).wrapper, grid, modeHelp, actions);
  host.append(
    form,
    status,
    results,
    shareControl(
      "interactive-slo-budget",
      () => [
        ["mode", mode.value],
        ["target", target.input.value],
        ["window", windowField.input.value],
        ["observed", observed.input.value],
        ["bad", bad.input.value],
      ],
      locale,
    ),
    help(
      t.sloHelp,
      [t.sloFormula, t.sloLimits, t.fractional],
      "https://sre.google/workbook/alerting-on-slos/",
      t.sloSource,
    ),
  );
  const format = (value) => {
    if (value === null) return t.unavailable;
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 6,
      ...(value !== 0 && Math.abs(value) < 0.000001
        ? { notation: "scientific" }
        : {}),
    }).format(value);
  };
  function run(focus = true) {
    for (const input of Object.values(controls))
      input.removeAttribute("aria-invalid");
    results.replaceChildren();
    try {
      const result = calculateSlo({
        mode: mode.value,
        target: readNumber(target.input),
        windowDays: readNumber(windowField.input),
        observed: readNumber(observed.input),
        bad: readNumber(bad.input),
      });
      const unit = result.mode === "requests" ? t.requestsUnit : t.minutesUnit;
      const metrics = element("dl", { class: "decision-metrics" });
      for (const [key, label, value] of [
        ["total", t.total, format(result.budgetTotal) + " " + unit],
        ["used", t.used, format(result.budgetUsed) + " " + unit],
        ["remaining", t.remaining, format(result.budgetRemaining) + " " + unit],
        [
          "burn",
          t.burn,
          result.burnRate === null
            ? t.unavailable
            : format(result.burnRate) + "×",
        ],
        [
          "sli",
          t.sli,
          result.observedSli === null
            ? t.unavailable
            : format(result.observedSli) + "%",
        ],
      ]) {
        const metric = element("div");
        metric.append(
          element("dt", {}, label),
          element("dd", { "data-slo-metric": key }, value),
        );
        metrics.append(metric);
      }
      results.append(
        metrics,
        element(
          "p",
          { class: "decision-hint" },
          result.mode === "requests" ? t.requestBasis : t.timeBasis,
        ),
      );
      if (result.partialObservation)
        results.append(element("p", { class: "decision-caution" }, t.partial));
      status.dataset.state = result.state === "exceeded" ? "error" : "ready";
      status.textContent =
        result.state === "unmeasured"
          ? t.unknown
          : result.target === 100
            ? t.perfect + (result.bad > 0 ? " " + t.exceeded : "")
            : t[result.state];
    } catch (error) {
      showError(error, status, controls, t, focus);
    }
  }
  function load() {
    const time = mode.value === "time";
    target.input.value = "99.9";
    windowField.input.value = "30";
    observed.input.value = time ? "1440" : "1000000";
    bad.input.value = time ? "10" : "250";
    configure();
    run();
  }
  // Captions, steps and limits follow the mode; values are left untouched.
  function configure() {
    const time = mode.value === "time";
    observed.caption.textContent = time ? t.observedTime : t.observedRequests;
    bad.caption.textContent = time ? t.badTime : t.badRequests;
    observed.input.step = bad.input.step = time ? "any" : "1";
    observed.input.max = bad.input.max = String(
      time ? DECISION_LIMITS.windowDays * 1440 : DECISION_LIMITS.requests,
    );
    modeHelp.textContent = time ? t.timeHelp : t.requestsHelp;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  form.addEventListener("input", () => {
    results.replaceChildren();
    status.dataset.state = "stale";
    status.textContent = t.stale;
  });
  mode.addEventListener("change", load);
  example.addEventListener("click", load);
  load();
  // Missing values keep the example; invalid ones surface as form errors.
  useScenario("interactive-slo-budget", host, (shared) => {
    if (["requests", "time"].includes(shared.get("mode")))
      mode.value = shared.get("mode");
    load();
    for (const [key, input] of [
      ["target", target.input],
      ["window", windowField.input],
      ["observed", observed.input],
      ["bad", bad.input],
    ])
      if (shared.has(key)) input.value = shared.get(key).slice(0, 32);
    run(false);
  });
}

const col = (name, type = "string", nullable = false) => ({
  name,
  type,
  nullable,
});
const presets = {
  additive: [
    [col("id", "integer"), col("region")],
    [
      col("id", "integer"),
      col("region", "string", true),
      col("email", "string", true),
    ],
  ],
  rename: [
    [col("customer_id", "integer"), col("email")],
    [col("account_id", "integer"), col("email")],
  ],
  required: [
    [
      col("id", "integer"),
      col("total", "integer"),
      col("email", "string", true),
    ],
    [col("id", "integer"), col("total", "number"), col("email")],
  ],
};

function mountSchema(host, locale, t) {
  shell(host, t.schemaTitle, t.schemaIntro, t);
  const form = element("form", { class: "decision-form" });
  const preset = select(Object.keys(presets), t.presets);
  const example = button(t.example, { id: "schema-example" });
  const choose = element("div", { class: "decision-example" });
  choose.append(field("schema-preset", t.preset, preset).wrapper, example);
  const editors = element("div", { class: "decision-editors" });
  const editor = () =>
    element("textarea", {
      rows: "12",
      maxlength: String(DECISION_LIMITS.schemaCharacters),
      spellcheck: "false",
      autocapitalize: "off",
      autocomplete: "off",
      "aria-describedby": "schema-hint",
    });
  const previous = field("schema-previous", t.previous, editor());
  const next = field("schema-next", t.next, editor());
  editors.append(previous.wrapper, next.wrapper);
  const compare = button(t.compare, {
    id: "schema-compare",
    type: "submit",
    class: "decision-primary",
  });
  const actions = element("div", { class: "decision-actions" });
  const copyButton = button(t.copyReport, { id: "schema-copy", disabled: "" });
  const download = button(t.download, { id: "schema-download", disabled: "" });
  actions.append(compare, copyButton, download);
  const status = statusNode("schema-status");
  const transfer = statusNode("schema-transfer-status");
  const results = element("div", {
    id: "schema-results",
    class: "decision-results",
    role: "region",
    "aria-label": t.schemaTitle,
  });
  const reportDetails = help(t.report, []);
  const report = element("textarea", {
    id: "schema-report",
    rows: "8",
    readonly: "",
    spellcheck: "false",
    "aria-label": t.report,
  });
  reportDetails.append(report);
  reportDetails.hidden = true;
  form.append(
    choose,
    element("p", { id: "schema-hint", class: "decision-hint" }, t.schemaHint),
    editors,
    actions,
  );
  // Compact JSON keeps a shared link short; unparsable text is sent as typed.
  const compact = (text) => {
    try {
      return JSON.stringify(JSON.parse(text));
    } catch {
      return text;
    }
  };
  host.append(
    form,
    status,
    transfer,
    results,
    reportDetails,
    shareControl(
      "interactive-schema-diff",
      () => [
        ["before", compact(previous.input.value)],
        ["after", compact(next.input.value)],
      ],
      locale,
    ),
    help(
      t.schemaHelp,
      [
        t.contract,
        t.names,
        t.types + ": " + COLUMN_TYPES.join(", ") + ".",
        t.scope,
        t.direction,
      ],
      "https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html",
      t.schemaSource,
    ),
  );
  let current = null;
  let serialized = "";
  const describe = (column) =>
    column
      ? column.type + " · " + (column.nullable ? t.nullable : t.required)
      : t.absent;
  function invalidate() {
    current = null;
    serialized = "";
    results.replaceChildren();
    report.value = "";
    reportDetails.hidden = true;
    copyButton.disabled = download.disabled = true;
    status.dataset.state = "stale";
    status.textContent = t.stale;
    transfer.textContent = "";
  }
  function run(focus = true) {
    invalidate();
    previous.input.removeAttribute("aria-invalid");
    next.input.removeAttribute("aria-invalid");
    try {
      current = compareTableSchemas(previous.input.value, next.input.value);
      const list = element("ol", { class: "decision-changes" });
      for (const change of current.changes) {
        const item = element("li", { "data-change": change.kind });
        const heading = element("h3");
        heading.append(
          element("code", {}, change.name),
          document.createTextNode(" · " + t.change[change.kind]),
        );
        item.append(
          heading,
          element(
            "p",
            { class: "decision-change-shape" },
            t.before +
              ": " +
              describe(change.before) +
              " → " +
              t.after +
              ": " +
              describe(change.after),
          ),
        );
        for (const [index, title] of [t.newer, t.older].entries()) {
          const paragraph = element("p");
          paragraph.append(
            element("strong", {}, title + ". "),
            document.createTextNode(t.risk[change.risk][index]),
          );
          item.append(paragraph);
        }
        list.append(item);
      }
      results.append(list);
      if (current.orderChanged)
        results.append(
          element("p", { class: "decision-caution" }, t.reordered),
        );
      status.dataset.state = "ready";
      status.textContent = current.changes.length
        ? t.changed(current.changes.length, current.changedColumns)
        : t.unchanged;
      serialized = JSON.stringify(
        {
          ...current,
          assessment: t.direction,
          notes: current.changes.map((change) => ({
            name: change.name,
            kind: change.kind,
            newReaderOldData: t.risk[change.risk][0],
            oldReaderNewData: t.risk[change.risk][1],
          })),
        },
        null,
        2,
      );
      report.value = serialized;
      reportDetails.hidden = false;
      copyButton.disabled = download.disabled = false;
    } catch (error) {
      showError(
        error,
        status,
        { previous: previous.input, next: next.input },
        t,
        focus,
      );
    }
  }
  function load() {
    const [before, after] = presets[preset.value];
    previous.input.value = JSON.stringify({ columns: before }, null, 2);
    next.input.value = JSON.stringify({ columns: after }, null, 2);
    run();
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  previous.input.addEventListener("input", invalidate);
  next.input.addEventListener("input", invalidate);
  example.addEventListener("click", load);
  copyButton.addEventListener("click", async () => {
    if (!current) return;
    const snapshot = serialized;
    try {
      await navigator.clipboard.writeText(snapshot);
      if (serialized === snapshot) transfer.textContent = t.copied;
    } catch {
      if (serialized === snapshot) {
        transfer.textContent = t.copyFailed;
        reportDetails.open = true;
        report.focus();
        report.select();
      }
    }
  });
  download.addEventListener("click", () => {
    if (!current) return;
    downloadText("schema-diff.json", serialized, "application/json;charset=utf-8");
    transfer.textContent = t.downloaded;
  });
  load();
  const pretty = (text) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };
  useScenario("interactive-schema-diff", host, (shared) => {
    if (!shared.has("before") || !shared.has("after")) return;
    previous.input.value = pretty(shared.get("before"));
    next.input.value = pretty(shared.get("after"));
    run(false);
  });
}

const TABLE_EXAMPLE = Object.freeze({
  daily: "50",
  commits: "288",
  partitioning: "hour",
  buckets: "16",
  target: "512",
  retention: "90",
});

function mountTablePlanner(host, locale, base) {
  const t = base.table;
  shell(host, t.title, t.intro, base);
  const form = element("form", { class: "decision-form", novalidate: "" });
  const grid = element("div", { class: "decision-fields" });
  const number = (min, max, step, mode = "numeric") =>
    element("input", {
      type: "number",
      min: String(min),
      max: String(max),
      step,
      required: "",
      inputmode: mode,
    });
  const inputs = {
    daily: field("table-daily", t.daily, number(0.001, TABLE_LIMITS.dailyGiB, "any", "decimal"), t.dailyHelp),
    commits: field("table-commits", t.commits, number(1, TABLE_LIMITS.commitsPerDay, "1"), t.commitsHelp),
    partitioning: field("table-partitioning", t.partitioning, select(TABLE_PARTITIONING, t.partitionLabels)),
    buckets: field("table-buckets", t.buckets, number(1, TABLE_LIMITS.buckets, "1"), t.bucketsHelp),
    target: field("table-target", t.target, number(1, TABLE_LIMITS.targetMiB, "1"), t.targetHelp),
    retention: field("table-retention", t.retention, number(1, TABLE_LIMITS.retentionDays, "1")),
  };
  for (const { wrapper } of Object.values(inputs)) grid.append(wrapper);
  const actions = element("div", { class: "decision-actions" });
  const plan = button(t.plan, { id: "table-plan", type: "submit", class: "decision-primary" });
  const example = button(base.example, { id: "table-example" });
  actions.append(plan, example);
  const status = statusNode("table-status");
  const results = element("div", {
    id: "table-results",
    class: "decision-results",
    role: "region",
    "aria-label": t.title,
  });
  form.append(grid, actions);
  host.append(
    form,
    status,
    results,
    shareControl(
      "interactive-table-planner",
      () => Object.entries(inputs).map(([key, { input }]) => [key, input.value]),
      locale,
    ),
    help(
      t.help,
      [t.formula, t.compaction, t.scope],
      "https://iceberg.apache.org/docs/latest/maintenance/",
      t.source,
    ),
  );
  const count = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const size = (mib) =>
    mib >= 1024 ? `${decimal.format(mib / 1024)} GiB` : `${decimal.format(mib)} MiB`;
  const controls = {
    dailyGiB: inputs.daily.input,
    commitsPerDay: inputs.commits.input,
    partitioning: inputs.partitioning.input,
    buckets: inputs.buckets.input,
    targetMiB: inputs.target.input,
    retentionDays: inputs.retention.input,
  };
  function run(focus = true) {
    for (const input of Object.values(controls)) input.removeAttribute("aria-invalid");
    results.replaceChildren();
    try {
      const result = planTableFiles({
        dailyGiB: readNumber(controls.dailyGiB),
        commitsPerDay: readNumber(controls.commitsPerDay),
        partitioning: controls.partitioning.value,
        buckets: readNumber(controls.buckets),
        targetMiB: readNumber(controls.targetMiB),
        retentionDays: readNumber(controls.retentionDays),
      });
      const metrics = element("dl", { class: "decision-metrics" });
      for (const [key, value] of [
        ["averageFile", size(result.averageFileMiB)],
        ["filesPerCommit", count.format(result.filesPerCommit)],
        ["filesPerDay", count.format(result.filesPerDay)],
        ["retained", count.format(result.retainedFiles)],
        ["compacted", count.format(result.compactedFiles)],
        ["partitions", count.format(result.partitions)],
        ["partitionSize", size(result.partitionMiB)],
      ]) {
        const metric = element("div");
        metric.append(
          element("dt", {}, t.metrics[key]),
          element("dd", { "data-table-metric": key }, value),
        );
        metrics.append(metric);
      }
      const findings = [
        result.smallFiles && t.smallFiles,
        result.overPartitioned && t.overPartitioned,
        result.retainedFiles > 1_000_000 && t.manyFiles,
      ].filter(Boolean);
      results.append(metrics);
      for (const text of findings.length ? findings : [t.healthy])
        results.append(element("p", { class: "decision-hint" }, text));
      results.append(element("p", { class: "decision-hint" }, t.boundary));
      status.dataset.state = findings.length ? "error" : "ready";
      status.textContent = !findings.length
        ? t.healthy
        : findings.length === 1
          ? t.findingOne
          : t.findingMany.replace("{count}", String(findings.length));
    } catch (error) {
      showError(error, status, controls, { ...base, errors: t.errors }, focus);
    }
  }
  function load(values, focus = true) {
    for (const [key, { input }] of Object.entries(inputs))
      if (values[key] !== undefined) input.value = values[key];
    run(focus);
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  form.addEventListener("input", () => {
    results.replaceChildren();
    status.dataset.state = "stale";
    status.textContent = base.stale;
  });
  example.addEventListener("click", () => load(TABLE_EXAMPLE));
  load(TABLE_EXAMPLE);
  useScenario("interactive-table-planner", host, (shared) => {
    const values = { ...TABLE_EXAMPLE };
    for (const key of Object.keys(TABLE_EXAMPLE)) {
      const value = shared.get(key);
      if (value === undefined) continue;
      if (key === "partitioning" && !TABLE_PARTITIONING.includes(value)) continue;
      values[key] = value.slice(0, 32);
    }
    load(values, false);
  });
}

/** DOM nodes carry their own listeners; detached pages can be garbage-collected.
 * Repeated setup does not reset editors or attach duplicate handlers.
 */
export function setupDecisionTools(locale) {
  const t = copy[locale] || copy.en;
  for (const [id, mount] of [
    ["interactive-slo-budget", (host) => mountSlo(host, locale, t)],
    ["interactive-schema-diff", (host) => mountSchema(host, locale, t)],
    ["interactive-table-planner", (host) => mountTablePlanner(host, locale, t)],
  ]) {
    const host = document.getElementById(id);
    if (!host || mounted.has(host)) continue;
    mount(host);
    mounted.add(host);
    // Siblings mount together; the loader must not announce them again.
    host.dataset.initialized = "true";
  }
}
