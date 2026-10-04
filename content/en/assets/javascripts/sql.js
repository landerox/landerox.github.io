/** Guided SQL worksheet with local, fictional data and readable reference tables. */
import {
  element,
  button,
  widgetHeader,
  tableShell,
  downloadText,
} from "./workbench-dom.js";
import { useScenario, shareControl } from "./share.js";
import {
  SQL_TABLES,
  SQL_EXAMPLES,
  executeSql,
  resultToCsv,
} from "./sql-core.js";

const fields = {
  scenario: [
    "text",
    "Test situation: short/long prompt, cold/warm cache.",
    "Situación: prompt corto/largo, caché fría/caliente.",
  ],
  engine: [
    "text",
    "Fictional configuration: baseline or candidate, not a vendor.",
    "Configuración ficticia: baseline o candidate; no es un proveedor.",
  ],
  precision: [
    "text",
    "Number format used to represent model weights.",
    "Formato numérico usado para representar los pesos del modelo.",
  ],
  throughput_tps: [
    "number",
    "Generated tokens per second: output speed.",
    "Tokens generados por segundo: velocidad de salida.",
  ],
  ttft_ms: [
    "number",
    "Milliseconds until the first token: the initial wait.",
    "Milisegundos hasta el primer token: la espera inicial.",
  ],
  p99_ms: [
    "number",
    "Response-time threshold covering about 99 in 100 requests, in milliseconds. The slowest 1% can take longer.",
    "Umbral que cubre unas 99 de cada 100 respuestas, en milisegundos. El 1% más lento puede tardar más.",
  ],
  cache_hit_pct: [
    "number",
    "Percentage of requests served with reusable cache entries.",
    "Porcentaje de solicitudes con entradas de caché reutilizables.",
  ],
  pipeline: [
    "text",
    "Name of the data workflow.",
    "Nombre del flujo de datos.",
  ],
  mode: [
    "text",
    "Batch works in groups; streaming processes a continuing flow.",
    "Batch trabaja por lotes; streaming procesa un flujo continuo.",
  ],
  events_per_min: [
    "number",
    "Events processed per minute.",
    "Eventos procesados por minuto.",
  ],
  freshness_s: [
    "number",
    "Seconds between an event and its availability to a reader.",
    "Segundos entre un evento y su disponibilidad para consulta.",
  ],
  error_pct: [
    "number",
    "Percentage of processing attempts that fail.",
    "Porcentaje de intentos de procesamiento que fallan.",
  ],
};

const recipes = {
  benchmarks: [
    [
      "Which runs produce output fastest?",
      "¿Qué casos generan salida más rápido?",
      SQL_EXAMPLES[0],
    ],
    [
      "Which runs start within 120 ms?",
      "¿Cuáles empiezan en 120 ms o menos?",
      SQL_EXAMPLES[1],
    ],
    [
      "What is the average per configuration?",
      "¿Cuál es la media por configuración?",
      SQL_EXAMPLES[2],
    ],
    [
      "Find warm-cache, fast-start runs",
      "Busca caché reutilizada y poca espera",
      "SELECT scenario, engine, ttft_ms, cache_hit_pct\nFROM benchmarks\nWHERE cache_hit_pct > 0 AND ttft_ms BETWEEN 40 AND 120\nORDER BY ttft_ms, engine;",
    ],
  ],
  pipelines: [
    [
      "Which data arrives late?",
      "¿Qué datos llegan tarde?",
      "SELECT pipeline, mode, freshness_s\nFROM pipelines\nWHERE freshness_s > 60\nORDER BY freshness_s DESC;",
    ],
    [
      "Find streaming flows with errors",
      "Busca flujos continuos con errores",
      "SELECT pipeline, error_pct, freshness_s\nFROM pipelines\nWHERE mode = 'streaming' AND error_pct >= 0.5\nORDER BY error_pct DESC;",
    ],
    [
      "Compare batch and streaming",
      "Compara lotes y flujo continuo",
      "SELECT mode, COUNT(*) AS flows, AVG(freshness_s) AS avg_freshness_s\nFROM pipelines\nGROUP BY mode\nORDER BY mode;",
    ],
    [
      "Which processing modes exist?",
      "¿Qué modos de procesamiento hay?",
      "SELECT DISTINCT mode\nFROM pipelines\nORDER BY mode;",
    ],
  ],
};

const strings = {
  en: {
    title: "SQL Explorer",
    badge: "Local · read-only",
    intro:
      "Ask a table a question. Start with an example, change the query, then inspect the result. All 16 sample rows are fictional.",
    dataset: "1 · Choose a dataset",
    datasets: ["AI response scenarios", "Data pipelines"],
    questions: "2 · Try a question",
    editor: "3 · Read or edit the SQL",
    hint: "SQL is a language for asking questions about tables. Ctrl+Enter or ⌘+Enter runs your query.",
    run: "Run query",
    copy: "Copy query",
    export: "Download CSV",
    copied: "Query copied.",
    copyError: "Copy is unavailable. Select the query to copy it manually.",
    results: "Query result",
    rows: ["result row", "result rows"],
    source: "Source",
    fictional: "fictional rows",
    empty: "No rows match. Try a wider range or remove a filter.",
    changed: "Query changed. Run it to refresh the result and CSV.",
    stages: "How this query produced its result",
    stagesIntro:
      "Follow the actual counts from this interpreter, in logical order. This is not a database optimizer plan, a timing measurement or EXPLAIN.",
    stageUnits: { rows: ["row", "rows"], groups: ["group", "groups"] },
    stageExplanation: {
      FROM: (step) => `Read the fictional table ${step.table}.`,
      WHERE: (step) =>
        `Keep rows matching the condition; ${step.input - step.output} ${step.input - step.output === 1 ? "does" : "do"} not match.`,
      "GROUP BY": (step) =>
        `Collect rows with the same ${step.columns.join(", ")} values into groups.`,
      AGGREGATE: () =>
        "Treat all matching rows as one group for the summary, even when no rows match.",
      SELECT: (step) =>
        `Produce these output columns: ${step.columns.join(", ")}. Calculate any requested summaries for each group.`,
      DISTINCT: (step) =>
        `Remove repeated output rows; ${step.input - step.output} ${step.input - step.output === 1 ? "duplicate" : "duplicates"} removed.`,
      "ORDER BY": (step) =>
        `Sort by ${step.columns.join(", ")}. ASC means ascending; DESC means descending. Sorting does not remove rows.`,
      LIMIT: (step) =>
        `Skip ${step.offset} ${step.offset === 1 ? "row" : "rows"} from the start, then keep up to ${step.limit} ${step.limit === 1 ? "row" : "rows"} from what remains.`,
    },
    schema: "Understand the data",
    schemaIntro:
      "Each row is one example; each column describes a property. These numbers teach SQL, not real engine performance or service targets.",
    schemaHeaders: ["Column", "Meaning", "Type / example"],
    type: { text: "Text", number: "Number" },
    syntax: "Build a query, one step at a time",
    syntaxIntro: "Start with SELECT and FROM. Add only the clauses you need.",
    syntaxHeaders: ["What you want", "SQL", "How to read it"],
    guide: [
      [
        "Choose columns",
        "SELECT pipeline, freshness_s\nFROM pipelines",
        "Show the workflow name and its data delay.",
      ],
      [
        "Filter rows",
        "WHERE freshness_s > 60",
        "Keep only delays above 60 seconds.",
      ],
      [
        "Combine conditions",
        "WHERE mode = 'streaming'\n  AND (error_pct > 1 OR freshness_s > 30)",
        "Both AND sides must match; either OR side may match. Parentheses make the grouping explicit.",
      ],
      [
        "Match values",
        "WHERE mode IN ('batch', 'streaming')",
        "Match any item in the list. BETWEEN includes both bounds; LIKE supports % (any text) and _ (one character).",
      ],
      [
        "Summarize groups",
        "SELECT mode, AVG(freshness_s) AS avg_delay\nFROM pipelines\nGROUP BY mode",
        "Calculate one average per mode. COUNT, SUM, MIN and MAX are also supported.",
      ],
      [
        "Sort and limit",
        "ORDER BY freshness_s DESC, pipeline ASC\nLIMIT 5 OFFSET 0",
        "Largest delay first; names break ties. Keep five rows, skipping none.",
      ],
      [
        "Remove repetitions",
        "SELECT DISTINCT mode\nFROM pipelines",
        "Return each processing mode once.",
      ],
    ],
    limits:
      "Scope: one table per query; SELECT only. Multiple GROUP BY / ORDER BY columns and AS aliases are supported. No joins, subqueries, HAVING, arithmetic, comments or writes. LIKE is case-sensitive. Limits: 2,000 characters, 400 tokens, 12 nested groups and LIMIT/OFFSET up to 1,000. This is a small interpreter, not DuckDB or a full database.",
    errors: {
      syntax:
        "This query uses unsupported syntax. Start with one of the examples below.",
      table: "Choose FROM benchmarks or FROM pipelines.",
      column: "Unknown column. Check the names under “Understand the data”.",
      aggregate: "Use COUNT, AVG, SUM, MIN or MAX. Only COUNT accepts *.",
      type: "Match numbers with numbers and text with single-quoted text. AVG and SUM need numeric columns.",
      duplicate: "Two output columns have the same name. Give one an AS alias.",
      group: "Put every selected, non-aggregated column in GROUP BY.",
      where:
        "Use a column, a comparison and a value; put text in single quotes.",
      order: "ORDER BY must use a selected column or its AS alias.",
      limit: "LIMIT and OFFSET accept integers from 0 to 1,000.",
      query_length: "Keep the query within 2,000 characters.",
      query_complexity:
        "Simplify the query: at most 400 tokens and 12 nested groups.",
    },
  },
  es: {
    title: "Explorador SQL",
    badge: "Local · solo lectura",
    intro:
      "Hazle una pregunta a una tabla. Empieza con un ejemplo, modifica la consulta y examina el resultado. Las 16 filas de muestra son ficticias.",
    dataset: "1 · Elige los datos",
    datasets: ["Escenarios de respuesta de IA", "Pipelines de datos"],
    questions: "2 · Prueba una pregunta",
    editor: "3 · Lee o modifica el SQL",
    hint: "SQL es un lenguaje para hacer preguntas sobre tablas. Ctrl+Enter o ⌘+Enter ejecuta tu consulta.",
    run: "Ejecutar consulta",
    copy: "Copiar consulta",
    export: "Descargar CSV",
    copied: "Consulta copiada.",
    copyError:
      "No se pudo copiar. Selecciona la consulta para copiarla manualmente.",
    results: "Resultado",
    rows: ["fila de resultado", "filas de resultado"],
    source: "Origen",
    fictional: "filas ficticias",
    empty:
      "Ninguna fila coincide. Prueba un rango más amplio o elimina un filtro.",
    changed:
      "Consulta modificada. Ejecútala para actualizar el resultado y el CSV.",
    stages: "Cómo se obtuvo este resultado",
    stagesIntro:
      "Sigue los conteos reales de este intérprete, en orden lógico. No es un plan del optimizador de una base de datos, una medición de tiempo ni EXPLAIN.",
    stageUnits: { rows: ["fila", "filas"], groups: ["grupo", "grupos"] },
    stageExplanation: {
      FROM: (step) => `Lee la tabla ficticia ${step.table}.`,
      WHERE: (step) =>
        `Conserva las filas que cumplen la condición; ${step.input - step.output} no la ${step.input - step.output === 1 ? "cumple" : "cumplen"}.`,
      "GROUP BY": (step) =>
        `Reúne en grupos las filas con los mismos valores de ${step.columns.join(", ")}.`,
      AGGREGATE: () =>
        "Trata todas las filas coincidentes como un grupo para el resumen, incluso si ninguna coincide.",
      SELECT: (step) =>
        `Genera estas columnas: ${step.columns.join(", ")}. Calcula los resúmenes solicitados para cada grupo.`,
      DISTINCT: (step) =>
        `Elimina filas de salida repetidas; ${step.input - step.output} ${step.input - step.output === 1 ? "duplicado eliminado" : "duplicados eliminados"}.`,
      "ORDER BY": (step) =>
        `Ordena por ${step.columns.join(", ")}. ASC indica orden ascendente; DESC, descendente. Ordenar no elimina filas.`,
      LIMIT: (step) =>
        `Omite ${step.offset} ${step.offset === 1 ? "fila" : "filas"} del inicio y conserva hasta ${step.limit} ${step.limit === 1 ? "fila" : "filas"} de las restantes.`,
    },
    schema: "Entiende los datos",
    schemaIntro:
      "Cada fila es un ejemplo; cada columna describe una propiedad. Los números sirven para aprender SQL, no representan rendimiento real ni objetivos de servicio.",
    schemaHeaders: ["Columna", "Significado", "Tipo / ejemplo"],
    type: { text: "Texto", number: "Número" },
    syntax: "Construye una consulta paso a paso",
    syntaxIntro:
      "Empieza con SELECT y FROM. Añade solo las cláusulas que necesites.",
    syntaxHeaders: ["Qué quieres hacer", "SQL", "Cómo se interpreta"],
    guide: [
      [
        "Elegir columnas",
        "SELECT pipeline, freshness_s\nFROM pipelines",
        "Muestra el nombre del flujo y el retraso de sus datos.",
      ],
      [
        "Filtrar filas",
        "WHERE freshness_s > 60",
        "Conserva solo retrasos superiores a 60 segundos.",
      ],
      [
        "Combinar condiciones",
        "WHERE mode = 'streaming'\n  AND (error_pct > 1 OR freshness_s > 30)",
        "AND exige ambas condiciones; OR permite cualquiera. Los paréntesis hacen explícita la agrupación.",
      ],
      [
        "Buscar valores",
        "WHERE mode IN ('batch', 'streaming')",
        "Acepta cualquier valor de la lista. BETWEEN incluye ambos extremos; LIKE admite % (cualquier texto) y _ (un carácter).",
      ],
      [
        "Resumir grupos",
        "SELECT mode, AVG(freshness_s) AS avg_delay\nFROM pipelines\nGROUP BY mode",
        "Calcula una media por modo. También admite COUNT, SUM, MIN y MAX.",
      ],
      [
        "Ordenar y limitar",
        "ORDER BY freshness_s DESC, pipeline ASC\nLIMIT 5 OFFSET 0",
        "Primero el mayor retraso; el nombre resuelve empates. Devuelve cinco filas, sin saltar ninguna.",
      ],
      [
        "Eliminar repeticiones",
        "SELECT DISTINCT mode\nFROM pipelines",
        "Devuelve cada modo de procesamiento una sola vez.",
      ],
    ],
    limits:
      "Alcance: una tabla por consulta, solo SELECT. Admite varias columnas en GROUP BY / ORDER BY y alias AS. Sin joins, subconsultas, HAVING, aritmética, comentarios ni escrituras. LIKE distingue mayúsculas. Límites: 2.000 caracteres, 400 tokens, 12 grupos anidados y LIMIT/OFFSET hasta 1.000. Es un intérprete pequeño, no DuckDB ni una base de datos completa.",
    errors: {
      syntax:
        "La consulta usa sintaxis no admitida. Empieza con uno de los ejemplos.",
      table: "Usa FROM benchmarks o FROM pipelines.",
      column:
        "Columna desconocida. Consulta los nombres en «Entiende los datos».",
      aggregate: "Usa COUNT, AVG, SUM, MIN o MAX. Solo COUNT admite *.",
      type: "Compara números con números y texto con texto entre comillas simples. AVG y SUM necesitan columnas numéricas.",
      duplicate:
        "Dos columnas de salida tienen el mismo nombre. Usa AS para renombrar una.",
      group:
        "Incluye en GROUP BY cada columna seleccionada que no use agregación.",
      where:
        "Usa una columna, una comparación y un valor; el texto lleva comillas simples.",
      order: "ORDER BY debe usar una columna seleccionada o su alias AS.",
      limit: "LIMIT y OFFSET admiten enteros entre 0 y 1.000.",
      query_length: "Limita la consulta a 2.000 caracteres.",
      query_complexity:
        "Simplifica la consulta: hasta 400 tokens y 12 grupos anidados.",
    },
  },
};

export function setupSql(locale) {
  const host = document.getElementById("interactive-sql-sandbox");
  if (!host || host.dataset.initialized) return;
  host.dataset.initialized = "true";
  host.replaceChildren();
  const t = strings[locale] || strings.en;
  const lang = locale === "es" ? 1 : 0;
  const counted = (count, labels) => `${count} ${labels[count === 1 ? 0 : 1]}`;
  const header = widgetHeader(t.title, t.badge);
  const dataset = element("select", {
    id: "sql-dataset",
    class: "calc-select",
  });
  for (const [i, name] of Object.keys(SQL_TABLES).entries())
    dataset.append(
      element("option", { value: name }, t.datasets[i] + " · " + name),
    );
  const presets = element("div", {
    class: "sql-presets",
    role: "group",
    "aria-label": t.questions,
  });
  const editor = element("textarea", {
    id: "sql-textarea",
    class: "sql-textarea",
    rows: "5",
    maxlength: "2000",
    spellcheck: "false",
    autocapitalize: "off",
    "aria-describedby": "sql-help sql-status",
  });
  const output = element("div", { id: "sql-results" });
  const stages = element("details", {
    id: "sql-stages",
    class: "lab-widget-details sql-stages",
  });
  const stageList = element("ol", { class: "sql-stage-list" });
  stages.append(
    element("summary", {}, t.stages),
    element("p", { class: "lab-widget-note" }, t.stagesIntro),
    stageList,
  );
  stages.hidden = true;
  const status = element("p", {
    id: "sql-status",
    class: "sql-status",
    role: "status",
  });
  const run = button(t.run, { class: "console-primary-button" });
  const copy = button(t.copy, { class: "tool-button" });
  const copyStatus = element("span", {
    class: "sql-status",
    role: "status",
  });
  const download = button(t.export, { id: "sql-export", class: "tool-button" });
  const bar = element("div", { class: "sql-run-bar" });
  bar.append(run, copy, download, copyStatus);
  const schema = element("details", {
    class: "lab-widget-details sql-reference",
    id: "sql-schema",
  });
  schema.append(
    element("summary", {}, t.schema),
    element("p", {}, t.schemaIntro),
  );
  const schemaBody = element("div");
  schema.append(schemaBody);
  const syntax = element("details", {
    class: "lab-widget-details sql-reference sql-guide",
    id: "sql-syntax",
  });
  syntax.append(
    element("summary", {}, t.syntax),
    element("p", {}, t.syntaxIntro),
  );
  const guide = tableShell(t.syntaxHeaders, t.syntax, "sql-reference-table");
  for (const [purpose, query, explanation] of t.guide) {
    const row = element("tr");
    const codeCell = element("td");
    const pre = element("pre");
    pre.append(element("code", {}, query));
    codeCell.append(pre);
    row.append(
      element("th", { scope: "row" }, purpose),
      codeCell,
      element("td", {}, explanation),
    );
    guide.body.append(row);
  }
  syntax.append(
    guide.wrapper,
    element("p", { class: "tool-boundary" }, t.limits),
  );
  host.append(
    header,
    element("p", { class: "lab-widget-note" }, t.intro),
    element("label", { class: "calc-label", for: "sql-dataset" }, t.dataset),
    dataset,
    element("h3", { class: "tool-section-title" }, t.questions),
    presets,
    element("label", { class: "calc-label", for: "sql-textarea" }, t.editor),
    editor,
    element("p", { class: "lab-widget-note", id: "sql-help" }, t.hint),
    bar,
    status,
    output,
    shareControl(
      "interactive-sql-sandbox",
      () => [
        ["table", dataset.value],
        ["q", editor.value],
      ],
      locale,
    ),
    stages,
    schema,
    syntax,
  );
  let result = null;
  let resultQuery = "";
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  function showStages() {
    stageList.replaceChildren();
    for (const step of result.stages) {
      const item = element("li");
      const heading = element("div", { class: "sql-stage-heading" });
      heading.append(
        element("code", {}, step.clause),
        element(
          "span",
          { class: "sql-stage-count" },
          `${counted(step.input, t.stageUnits[step.inputKind])} → ${counted(step.output, t.stageUnits[step.outputKind])}`,
        ),
      );
      item.append(
        heading,
        element("p", {}, t.stageExplanation[step.clause](step)),
      );
      stageList.append(item);
    }
    stages.hidden = false;
  }

  function showReference() {
    const name = dataset.value;
    presets.replaceChildren();
    for (const recipe of recipes[name]) {
      const preset = button(recipe[lang], { class: "tool-chip" });
      preset.addEventListener("click", () => {
        editor.value = recipe[2];
        execute();
      });
      presets.append(preset);
    }
    const reference = tableShell(
      t.schemaHeaders,
      name + " · " + SQL_TABLES[name].length + " " + t.fictional,
      "sql-reference-table",
    );
    for (const [column, example] of Object.entries(SQL_TABLES[name][0])) {
      const meta = fields[column];
      const row = element("tr");
      const label = element("th", { scope: "row" });
      label.append(element("code", {}, column));
      const sample = element("td");
      sample.append(
        element("span", { class: "sql-field-type" }, t.type[meta[0]]),
        element("code", {}, String(example)),
      );
      row.append(label, element("td", {}, meta[lang + 1]), sample);
      reference.body.append(row);
    }
    schemaBody.replaceChildren(reference.wrapper);
  }

  function execute() {
    copyStatus.textContent = "";
    output.replaceChildren();
    stages.hidden = true;
    result = null;
    download.disabled = true;
    try {
      result = executeSql(editor.value);
      resultQuery = editor.value;
      if (dataset.value !== result.table) {
        dataset.value = result.table;
        showReference();
      }
      const caption =
        t.results +
        " · " +
        t.source +
        ": " +
        result.table +
        " · " +
        result.sourceRows +
        " " +
        t.fictional;
      if (!result.rows.length)
        output.append(element("p", { class: "tool-boundary" }, t.empty));
      else {
        // Align a column's header with its values when every value is a number.
        const numeric = new Set(
          result.columns.filter((column) =>
            result.rows.every(
              (row) => row[column] === null || typeof row[column] === "number",
            ) && result.rows.some((row) => typeof row[column] === "number"),
          ),
        );
        const view = tableShell(result.columns, caption, "", numeric);
        for (const row of result.rows) {
          const tr = element("tr");
          for (const column of result.columns) {
            const value = row[column];
            const cell = element(
              "td",
              { class: typeof value === "number" ? "sql-number" : "" },
              value === null
                ? "NULL"
                : typeof value === "number"
                  ? number.format(value)
                  : String(value),
            );
            tr.append(cell);
          }
          view.body.append(tr);
        }
        output.append(view.wrapper);
      }
      status.textContent = counted(result.rows.length, t.rows);
      status.dataset.state = "ready";
      editor.removeAttribute("aria-invalid");
      download.disabled = !result.rows.length;
      showStages();
    } catch (error) {
      status.textContent = t.errors[error.message] || t.errors.syntax;
      status.dataset.state = "error";
      editor.setAttribute("aria-invalid", "true");
    }
  }
  dataset.addEventListener("change", () => {
    showReference();
    editor.value = recipes[dataset.value][0][2];
    execute();
  });
  editor.addEventListener("input", () => {
    copyStatus.textContent = "";
    if (!result || editor.value !== resultQuery) {
      stages.hidden = true;
      download.disabled = true;
      status.textContent = t.changed;
      status.dataset.state = "stale";
      editor.removeAttribute("aria-invalid");
    } else {
      stages.hidden = false;
      download.disabled = !result.rows.length;
      status.textContent = counted(result.rows.length, t.rows);
      status.dataset.state = "ready";
      editor.removeAttribute("aria-invalid");
    }
  });
  editor.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey) &&
      !event.isComposing
    ) {
      event.preventDefault();
      execute();
    }
  });
  run.addEventListener("click", execute);
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      copyStatus.textContent = t.copied;
    } catch {
      copyStatus.textContent = t.copyError;
    }
  });
  download.addEventListener("click", () => {
    if (!result?.rows.length || editor.value !== resultQuery) return;
    downloadText(
      `${result.table}-example.csv`,
      resultToCsv(result),
      "text/csv;charset=utf-8",
    );
  });
  showReference();
  editor.value = recipes[dataset.value][0][2];
  execute();
  // A shared query runs through the same read-only interpreter as typed text.
  useScenario("interactive-sql-sandbox", host, (shared) => {
    if (Object.hasOwn(SQL_TABLES, shared.get("table"))) {
      dataset.value = shared.get("table");
      showReference();
    }
    editor.value = shared.has("q")
      ? shared.get("q").slice(0, 2000)
      : recipes[dataset.value][0][2];
    execute();
  });
}
