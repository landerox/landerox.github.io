/** Table Files: an example-first, browser-local planning worksheet. */
import {
  element,
  button,
  fill,
  barRow,
  presetGroup,
  matchesPreset,
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
  planTableFiles,
  TABLE_LIMITS,
  TABLE_PARTITIONING,
} from "./decision-tools-core.js";

const mounted = new WeakSet();
const copy = {
  en: {
    local: "Local worksheet · no connection",
    example: "Load example",
    inputError: "Check the input",
    table: {
      title: "Table Files",
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
      metrics: {
        averageFile: "Average file written",
        filesPerCommit: "Files per commit",
        filesPerDay: "Files per day",
        retained: "Files kept without compaction",
        compacted: "Files after compaction",
        partitions: "Partitions × buckets",
        partitionSize: "Data per partition",
      },
      presetsLabel: "Try a workload scenario",
      presets: [
        {
          id: "small-trap",
          label: "5-min streaming (small-file trap)",
          values: { daily: "50", commits: "288", partitioning: "hour", buckets: "16", target: "512", retention: "90" },
        },
        {
          id: "right-sized",
          label: "Daily partitions + 4 buckets",
          values: { daily: "50", commits: "288", partitioning: "day", buckets: "4", target: "512", retention: "90" },
        },
        {
          id: "hourly-batch",
          label: "Hourly micro-batch (120 GiB/day)",
          values: { daily: "120", commits: "24", partitioning: "day", buckets: "1", target: "512", retention: "90" },
        },
        {
          id: "daily-batch",
          label: "2 TiB daily batch (already compact)",
          values: { daily: "2048", commits: "1", partitioning: "day", buckets: "1", target: "512", retention: "30" },
        },
      ],
      bars: {
        compaction: "Compaction reduction",
        compactionValue: "{retained} → {compacted} files (−{pct}%)",
        compactionNoneTarget: "{compacted} files: writes already reach the target, nothing to merge",
        compactionNonePartition: "{compacted} files: each partition is smaller than one target file, nothing to merge",
        writeFill: "Written file vs. target",
        partitionFill: "Partition volume vs. target",
        ofTarget: "{size} of {target} ({pct}%)",
      },
      takeawayTrap:
        "Why compaction stalls here: commits write {avgFile} files, and each partition holds only {partSize}, below the {target} target. Compaction never merges across partitions or buckets, so compacted files stay near {partSize}; coarser partitions or fewer buckets let them reach the target.",
      takeawayCompactionHeals:
        "Frequent commits write small {avgFile} files on arrival, but each partition accumulates {partSize} (≥ {target} target). Scheduled compaction merges {retained} files down to {compacted} target-sized files (−{pct}%), or buffering fewer commits per day avoids rewriting them.",
      takeawayOverPartitioned:
        "Commits write {avgFile} files, but each partition holds only {partSize}, below the {target} target, so its files stay small even after compaction. Coarser time partitions or fewer hash buckets let them reach the target.",
      takeawayBalanced:
        "Balanced layout: each commit writes {avgFile} files and each partition holds {partSize} (≥ {target} target), keeping metadata overhead and compaction rewrites low.",
      healthy: "Commits already write files near the target; compaction has little to merge.",
      findingOne: "1 finding to review below the numbers.",
      findingMany: "{count} findings to review below the numbers.",
      smallFiles: "Each commit writes files far below the target: schedule compaction, or commit less often.",
      overPartitioned: "Each partition holds less than one target file: coarser partitions or fewer buckets avoid small files, even after compaction.",
      manyFiles: "Over a million files to track without compaction: query planning and metadata grow with every file.",
      boundary:
        "A planning estimate for one append-only table with evenly spread data, not a benchmark. Parallel writers, deletes and sort order usually add files.",
      help: "Formulas and limits",
      formula:
        "Files per day = partition writes × max(1, ⌈data per write ÷ target⌉). A daily or unpartitioned table writes each bucket once per commit. An hourly table with fewer than 24 commits a day writes ⌈24 ÷ commits⌉ hours per commit; with more, each hour takes ⌈commits ÷ 24⌉ writes, because a commit that straddles an hour boundary writes both hours.",
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
    example: "Cargar ejemplo",
    inputError: "Revisa los datos",
    table: {
      title: "Archivos de tabla",
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
      metrics: {
        averageFile: "Archivo medio escrito",
        filesPerCommit: "Archivos por commit",
        filesPerDay: "Archivos por día",
        retained: "Archivos sin compactar",
        compacted: "Archivos tras compactar",
        partitions: "Particiones × buckets",
        partitionSize: "Datos por partición",
      },
      presetsLabel: "Probar escenario de carga",
      presets: [
        {
          id: "small-trap",
          label: "Streaming cada 5 min (trampa de archivos pequeños)",
          values: { daily: "50", commits: "288", partitioning: "hour", buckets: "16", target: "512", retention: "90" },
        },
        {
          id: "right-sized",
          label: "Particiones diarias + 4 buckets",
          values: { daily: "50", commits: "288", partitioning: "day", buckets: "4", target: "512", retention: "90" },
        },
        {
          id: "hourly-batch",
          label: "Micro-batch horario (120 GiB/día)",
          values: { daily: "120", commits: "24", partitioning: "day", buckets: "1", target: "512", retention: "90" },
        },
        {
          id: "daily-batch",
          label: "Lote diario de 2 TiB (ya compacto)",
          values: { daily: "2048", commits: "1", partitioning: "day", buckets: "1", target: "512", retention: "30" },
        },
      ],
      bars: {
        compaction: "Reducción por compactación",
        compactionValue: "{retained} → {compacted} archivos (−{pct}%)",
        compactionNoneTarget: "{compacted} archivos: las escrituras ya alcanzan el objetivo, no hay nada que unir",
        compactionNonePartition: "{compacted} archivos: cada partición es menor que un archivo objetivo, no hay nada que unir",
        writeFill: "Archivo escrito frente al objetivo",
        partitionFill: "Volumen por partición frente al objetivo",
        ofTarget: "{size} de {target} ({pct}%)",
      },
      takeawayTrap:
        "Por qué la compactación toca techo aquí: los commits escriben archivos de {avgFile} y cada partición guarda solo {partSize}, por debajo del objetivo de {target}. La compactación nunca une datos de particiones o buckets distintos, así que los archivos compactados se quedan cerca de {partSize}; particiones más gruesas o menos buckets les permiten llegar al objetivo.",
      takeawayCompactionHeals:
        "Los commits frecuentes escriben archivos pequeños de {avgFile} al llegar, pero cada partición acumula {partSize} (≥ objetivo de {target}). La compactación programada une {retained} archivos en {compacted} archivos del tamaño objetivo (−{pct}%), o espaciar los commits evita reescribirlos.",
      takeawayOverPartitioned:
        "Los commits escriben archivos de {avgFile}, pero cada partición guarda solo {partSize}, por debajo del objetivo de {target}, así que sus archivos siguen siendo pequeños incluso tras compactar. Particiones temporales más gruesas o menos buckets de hash les permiten llegar al objetivo.",
      takeawayBalanced:
        "Diseño equilibrado: cada commit escribe archivos de {avgFile} y cada partición acumula {partSize} (≥ objetivo de {target}), manteniendo bajos los metadatos y las reescrituras por compactación.",
      healthy: "Los commits ya escriben archivos cercanos al objetivo; la compactación tiene poco que unir.",
      findingOne: "1 hallazgo que revisar bajo las cifras.",
      findingMany: "{count} hallazgos que revisar bajo las cifras.",
      smallFiles: "Cada commit escribe archivos muy por debajo del objetivo: programa compactaciones o haz commits con menos frecuencia.",
      overPartitioned: "Cada partición guarda menos de un archivo objetivo: particiones más gruesas o menos buckets evitan archivos pequeños, incluso tras compactar.",
      manyFiles: "Más de un millón de archivos que rastrear sin compactación: la planificación de consultas y los metadatos crecen con cada archivo.",
      boundary:
        "Una estimación para una tabla de solo inserciones con datos repartidos de forma uniforme, no un benchmark. Los escritores en paralelo, los borrados y el orden de escritura suelen añadir archivos.",
      help: "Fórmulas y límites",
      formula:
        "Archivos por día = escrituras de partición × max(1, ⌈datos por escritura ÷ objetivo⌉). Una tabla diaria o sin particionar escribe cada bucket una vez por commit. Una tabla horaria con menos de 24 commits al día escribe ⌈24 ÷ commits⌉ horas por commit; con más, cada hora recibe ⌈commits ÷ 24⌉ escrituras, porque un commit que cruza el cambio de hora escribe en ambas.",
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
  const presets = presetGroup("table-presets", t.presetsLabel, t.presets, "table-preset");
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
  const example = button(base.example, { id: "table-example" });
  actions.append(example);
  const status = statusNode("table-status");
  const results = element("div", {
    id: "table-results",
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
  const share = (ratio) => decimal.format(ratio * 100);
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
  const byKey = Object.fromEntries(
    Object.entries(inputs).map(([key, { input }]) => [key, input]),
  );
  function run(focus = true) {
    for (const input of Object.values(controls)) input.removeAttribute("aria-invalid");
    presets.mark((preset) => matchesPreset(preset.values, byKey));
    results.replaceChildren();
    try {
      const targetMiB = readNumber(controls.targetMiB);
      const result = planTableFiles({
        dailyGiB: readNumber(controls.dailyGiB),
        commitsPerDay: readNumber(controls.commitsPerDay),
        partitioning: controls.partitioning.value,
        buckets: readNumber(controls.buckets),
        targetMiB,
        retentionDays: readNumber(controls.retentionDays),
      });
      const metrics = element("dl", { class: "decision-metrics" });
      for (const [key, value] of [
        ["averageFile", size(result.averageFileMiB)],
        // An average: a commit can straddle an hour boundary.
        ["filesPerCommit", decimal.format(result.filesPerCommit)],
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
      const compacted = count.format(result.compactedFiles);
      const reduction =
        result.reduction > 0
          ? fill(t.bars.compactionValue, {
              retained: count.format(result.retainedFiles),
              compacted,
              pct: share(result.reduction),
            })
          : fill(
              result.overPartitioned ? t.bars.compactionNonePartition : t.bars.compactionNoneTarget,
              { compacted },
            );
      // The text states each ratio; only the bar is clamped to its track.
      const ofTarget = (mib, ratio) =>
        fill(t.bars.ofTarget, { size: size(mib), target: size(targetMiB), pct: share(ratio) });
      const bars = element("div", { class: "decision-bars" });
      bars.append(
        barRow(t.bars.compaction, reduction, result.reduction * 100, result.overPartitioned ? "warn" : "ok"),
        barRow(t.bars.writeFill, ofTarget(result.averageFileMiB, result.writeRatio), result.writeRatio * 100, result.smallFiles ? "warn" : "ok"),
        barRow(t.bars.partitionFill, ofTarget(result.partitionMiB, result.partitionRatio), result.partitionRatio * 100, result.overPartitioned ? "warn" : "ok"),
      );
      const takeaway = {
        trap: t.takeawayTrap,
        heals: t.takeawayCompactionHeals,
        "over-partitioned": t.takeawayOverPartitioned,
        balanced: t.takeawayBalanced,
      }[result.verdict];
      const diagnosis = element("div", { class: "decision-diagnosis" });
      diagnosis.append(
        bars,
        element(
          "p",
          { class: "decision-takeaway", "data-table-takeaway": result.verdict },
          fill(takeaway, {
            avgFile: size(result.averageFileMiB),
            partSize: size(result.partitionMiB),
            target: size(targetMiB),
            retained: count.format(result.retainedFiles),
            compacted,
            pct: share(result.reduction),
          }),
        ),
      );
      const findings = [
        result.smallFiles && t.smallFiles,
        result.overPartitioned && t.overPartitioned,
        result.retainedFiles > 1_000_000 && t.manyFiles,
      ].filter(Boolean);
      // A healthy result is said once, by the status line.
      results.append(metrics, diagnosis);
      for (const text of findings)
        results.append(element("p", { class: "decision-hint" }, text));
      results.append(element("p", { class: "decision-hint" }, t.boundary));
      status.dataset.state = findings.length ? "error" : "ready";
      status.textContent = !findings.length
        ? t.healthy
        : findings.length === 1
          ? t.findingOne
          : fill(t.findingMany, { count: findings.length });
    } catch (error) {
      showError(error, status, controls, { ...base, errors: t.errors }, focus);
    }
  }
  function load(values, focus = true) {
    for (const [key, { input }] of Object.entries(inputs))
      if (values[key] !== undefined) input.value = values[key];
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
  form.addEventListener("input", () => {
    window.clearTimeout(pending);
    pending = window.setTimeout(() => run(false), 250);
  });
  example.addEventListener("click", () => load(TABLE_EXAMPLE));
  load(TABLE_EXAMPLE, false);
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
 * Repeated setup does not reset inputs or attach duplicate handlers.
 */
export function setupDecisionTools(locale) {
  const host = document.getElementById("interactive-table-planner");
  if (!host || mounted.has(host)) return;
  mountTablePlanner(host, locale, copy[locale] || copy.en);
  mounted.add(host);
  host.dataset.initialized = "true";
}
