/** Bounded, read-only SQL teaching engine. No eval, network or database runtime. */
/** Fictional scenarios, not measured hardware results or vendor comparisons. */
export const SAMPLE_DATA = Object.freeze(
  [
    {
      scenario: "short-cold",
      engine: "baseline",
      precision: "FP16",
      throughput_tps: 80,
      ttft_ms: 120,
      p99_ms: 290,
      cache_hit_pct: 0,
    },
    {
      scenario: "short-warm",
      engine: "baseline",
      precision: "FP16",
      throughput_tps: 110,
      ttft_ms: 65,
      p99_ms: 190,
      cache_hit_pct: 70,
    },
    {
      scenario: "long-cold",
      engine: "baseline",
      precision: "FP16",
      throughput_tps: 45,
      ttft_ms: 410,
      p99_ms: 720,
      cache_hit_pct: 0,
    },
    {
      scenario: "long-warm",
      engine: "baseline",
      precision: "FP16",
      throughput_tps: 75,
      ttft_ms: 150,
      p99_ms: 330,
      cache_hit_pct: 60,
    },
    {
      scenario: "short-cold",
      engine: "candidate",
      precision: "FP8",
      throughput_tps: 100,
      ttft_ms: 100,
      p99_ms: 240,
      cache_hit_pct: 0,
    },
    {
      scenario: "short-warm",
      engine: "candidate",
      precision: "FP8",
      throughput_tps: 140,
      ttft_ms: 50,
      p99_ms: 160,
      cache_hit_pct: 75,
    },
    {
      scenario: "long-cold",
      engine: "candidate",
      precision: "FP8",
      throughput_tps: 65,
      ttft_ms: 340,
      p99_ms: 620,
      cache_hit_pct: 0,
    },
    {
      scenario: "long-warm",
      engine: "candidate",
      precision: "FP8",
      throughput_tps: 95,
      ttft_ms: 120,
      p99_ms: 280,
      cache_hit_pct: 65,
    },
  ].map(Object.freeze),
);

const PIPELINES = Object.freeze(
  [
    ["orders", "batch", 900, 3600, 0.2],
    ["orders-live", "streaming", 4200, 8, 0.4],
    ["payments", "streaming", 2100, 42, 1.2],
    ["inventory", "batch", 600, 1800, 0.1],
    ["clicks", "streaming", 12000, 12, 0.8],
    ["support", "batch", 180, 7200, 2.1],
    ["shipments", "streaming", 800, 65, 0.6],
    ["customers", "batch", 350, 900, 0],
  ].map(([pipeline, mode, events_per_min, freshness_s, error_pct]) =>
    Object.freeze({ pipeline, mode, events_per_min, freshness_s, error_pct }),
  ),
);

export const SQL_TABLES = Object.freeze({
  benchmarks: SAMPLE_DATA,
  pipelines: PIPELINES,
});

export const SQL_EXAMPLES = Object.freeze([
  "SELECT scenario, engine, throughput_tps\nFROM benchmarks\nORDER BY throughput_tps DESC\nLIMIT 4;",
  "SELECT scenario, engine, ttft_ms\nFROM benchmarks\nWHERE ttft_ms <= 120\nORDER BY ttft_ms;",
  "SELECT engine, AVG(throughput_tps) AS avg_tps, COUNT(*) AS runs\nFROM benchmarks\nGROUP BY engine;",
]);

export const SQL_LIMITS = Object.freeze({
  characters: 2000,
  tokens: 400,
  depth: 12,
  rows: 1000,
});

function tokenize(query) {
  const tokens = [];
  const pattern =
    /\s+|'(?:[^']|'')*'|-?\d+(?:\.\d+)?|[a-z_][a-z0-9_]*|<=|>=|!=|<>|[(),;*=<>]/giy;
  let position = 0;
  while (position < query.length) {
    pattern.lastIndex = position;
    const match = pattern.exec(query);
    if (!match) throw new Error("syntax");
    position = pattern.lastIndex;
    const value = match[0];
    if (/^\s/.test(value)) continue;
    tokens.push({
      value,
      upper: value.toUpperCase(),
      type: value.startsWith("'")
        ? "string"
        : /^-?\d/.test(value)
          ? "number"
          : /^[a-z_]/i.test(value)
            ? "word"
            : "symbol",
    });
    if (tokens.length > SQL_LIMITS.tokens) throw new Error("query_complexity");
  }
  return tokens;
}

// Linear-space wildcard matching avoids compiling visitor text to a regex.
function matchesLike(value, pattern) {
  let previous = Array(value.length + 1).fill(false);
  previous[0] = true;
  for (const char of pattern) {
    const current = Array(value.length + 1).fill(false);
    current[0] = char === "%" && previous[0];
    for (let i = 1; i <= value.length; i++) {
      current[i] =
        char === "%"
          ? current[i - 1] || previous[i]
          : previous[i - 1] && (char === "_" || char === value[i - 1]);
    }
    previous = current;
  }
  return previous[value.length];
}

function compare(left, op, right) {
  if (op === "=") return left === right;
  if (op === "!=" || op === "<>") return left !== right;
  if (op === "<") return left < right;
  if (op === ">") return left > right;
  if (op === "<=") return left <= right;
  return left >= right;
}

/** Full input consumption; Boolean precedence is AND before OR.
 * Fields and tables are allow-listed. Aggregates run after filtering.
 * LIKE is case-sensitive and supports only % and _ (no ESCAPE clause).
 */
export function executeSql(query) {
  if (typeof query !== "string" || query.length > SQL_LIMITS.characters)
    throw new Error("query_length");
  const tokens = tokenize(query);
  let cursor = 0;
  let depth = 0;
  const take = (word) => {
    if (tokens[cursor]?.upper !== word) return false;
    cursor++;
    return true;
  };
  const expect = (word, error = "syntax") => {
    if (!take(word)) throw new Error(error);
  };
  const name = (error = "syntax") => {
    const token = tokens[cursor++];
    if (token?.type !== "word") throw new Error(error);
    return token.value.toLowerCase();
  };
  const list = (read) => {
    const values = [read()];
    while (take(",")) values.push(read());
    return values;
  };
  expect("SELECT");
  const distinct = take("DISTINCT");
  const star = take("*");
  const fields = star
    ? []
    : list(() => {
        const first = name();
        let fn;
        let field = first;
        if (take("(")) {
          fn = first.toUpperCase();
          if (!["COUNT", "AVG", "SUM", "MIN", "MAX"].includes(fn))
            throw new Error("aggregate");
          field = take("*") ? "*" : name();
          expect(")");
          if (field === "*" && fn !== "COUNT") throw new Error("aggregate");
        }
        const alias = take("AS")
          ? name()
          : fn
            ? fn.toLowerCase() + "_" + (field === "*" ? "rows" : field)
            : field;
        if (["__proto__", "prototype", "constructor"].includes(alias))
          throw new Error("column");
        return { name: field, alias, fn };
      });
  expect("FROM");
  const table = name();
  if (!Object.hasOwn(SQL_TABLES, table)) throw new Error("table");
  const data = SQL_TABLES[table];
  const schema = Object.keys(data[0]);
  const validColumn = (column) => {
    if (!schema.includes(column)) throw new Error("column");
    return column;
  };
  if (star)
    fields.push(...schema.map((column) => ({ name: column, alias: column })));
  for (const field of fields) {
    if (field.name !== "*") validColumn(field.name);
    if (
      ["AVG", "SUM"].includes(field.fn) &&
      typeof data[0][field.name] !== "number"
    )
      throw new Error("type");
  }
  const columns = fields.map((field) => field.alias);
  if (new Set(columns).size !== columns.length) throw new Error("duplicate");
  const literal = (column) => {
    const token = tokens[cursor++];
    if (!["number", "string"].includes(token?.type)) throw new Error("where");
    const value =
      token.type === "number"
        ? Number(token.value)
        : token.value.slice(1, -1).replace(/''/g, "'");
    if (
      typeof value !== typeof data[0][column] ||
      (typeof value === "number" && !Number.isFinite(value))
    )
      throw new Error("type");
    return value;
  };
  const primary = () => {
    if (take("(")) {
      if (++depth > SQL_LIMITS.depth) throw new Error("query_complexity");
      const expression = or();
      expect(")", "where");
      depth--;
      return expression;
    }
    const column = validColumn(name("where"));
    if (take("IN")) {
      expect("(", "where");
      const values = list(() => literal(column));
      expect(")", "where");
      return (row) => values.includes(row[column]);
    }
    if (take("BETWEEN")) {
      const low = literal(column);
      expect("AND", "where");
      const high = literal(column);
      return (row) => row[column] >= low && row[column] <= high;
    }
    if (take("LIKE")) {
      const value = literal(column);
      if (typeof value !== "string") throw new Error("type");
      return (row) => matchesLike(row[column], value);
    }
    const operator = tokens[cursor++]?.value;
    if (!["=", "!=", "<>", "<", ">", "<=", ">="].includes(operator))
      throw new Error("where");
    const value = literal(column);
    return (row) => compare(row[column], operator, value);
  };
  const and = () => {
    const parts = [primary()];
    while (take("AND")) parts.push(primary());
    return (row) => parts.every((part) => part(row));
  };
  const or = () => {
    const parts = [and()];
    while (take("OR")) parts.push(and());
    return (row) => parts.some((part) => part(row));
  };
  const filtered = take("WHERE");
  const predicate = filtered ? or() : () => true;
  let groups = [];
  if (take("GROUP")) {
    expect("BY");
    groups = list(() => validColumn(name()));
    if (new Set(groups).size !== groups.length) throw new Error("group");
  }
  const orders = [];
  if (take("ORDER")) {
    expect("BY");
    orders.push(
      ...list(() => {
        const column = name("order");
        if (!columns.includes(column)) throw new Error("order");
        const descending = take("DESC");
        if (!descending) take("ASC");
        return { column, descending };
      }),
    );
  }
  let limit = SQL_LIMITS.rows;
  let offset = 0;
  const integer = () => {
    const token = tokens[cursor++];
    const value = Number(token?.value);
    if (
      token?.type !== "number" ||
      !/^\d+$/.test(token.value) ||
      !Number.isSafeInteger(value) ||
      value > SQL_LIMITS.rows
    )
      throw new Error("limit");
    return value;
  };
  const limited = take("LIMIT");
  if (limited) {
    limit = integer();
    if (take("OFFSET")) offset = integer();
  }
  take(";");
  if (cursor !== tokens.length) throw new Error("syntax");
  const aggregated = fields.some((field) => field.fn);
  if (
    (aggregated || groups.length) &&
    fields.some((field) => !field.fn && !groups.includes(field.name))
  )
    throw new Error("group");
  // Logical stages are observed here during execution, not guessed from SQL text.
  // This is not a physical optimizer plan, timing measurement or EXPLAIN output.
  const stages = [
    {
      clause: "FROM",
      input: data.length,
      output: data.length,
      inputKind: "rows",
      outputKind: "rows",
      table,
    },
  ];
  const stage = (clause, input, output, extra = {}) =>
    stages.push({
      clause,
      input,
      output,
      inputKind: "rows",
      outputKind: "rows",
      ...extra,
    });
  let rows = data.filter(predicate);
  if (filtered) stage("WHERE", data.length, rows.length);
  const selectedRows = rows.length;
  if (aggregated || groups.length) {
    const buckets = new Map();
    if (!groups.length) buckets.set("all", rows);
    else
      for (const row of rows) {
        const key = JSON.stringify(groups.map((column) => row[column]));
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(row);
      }
    stage(groups.length ? "GROUP BY" : "AGGREGATE", rows.length, buckets.size, {
      outputKind: "groups",
      columns: [...groups],
    });
    rows = [...buckets.values()].map((members) =>
      Object.fromEntries(
        fields.map(({ name: column, alias, fn }) => {
          if (!fn) return [alias, members[0][column]];
          const values =
            column === "*"
              ? members
              : members
                  .map((member) => member[column])
                  .filter((value) => value !== null);
          if (fn === "COUNT") return [alias, values.length];
          if (!values.length) return [alias, null];
          if (fn === "MIN" || fn === "MAX")
            return [
              alias,
              values.reduce((best, value) =>
                (fn === "MIN" ? value < best : value > best) ? value : best,
              ),
            ];
          const sum = values.reduce((total, value) => total + value, 0);
          return [alias, fn === "AVG" ? sum / values.length : sum];
        }),
      ),
    );
  } else
    rows = rows.map((row) =>
      Object.fromEntries(fields.map((field) => [field.alias, row[field.name]])),
    );
  stage(
    "SELECT",
    aggregated || groups.length ? rows.length : selectedRows,
    rows.length,
    {
      inputKind: aggregated || groups.length ? "groups" : "rows",
      columns: [...columns],
    },
  );
  if (distinct) {
    const before = rows.length;
    const seen = new Set();
    rows = rows.filter((row) => {
      const key = JSON.stringify(columns.map((column) => row[column]));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    stage("DISTINCT", before, rows.length);
  }
  if (orders.length) {
    rows.sort((a, b) => {
      for (const { column, descending } of orders) {
        const left = a[column],
          right = b[column];
        const result =
          left === right
            ? 0
            : left === null
              ? -1
              : right === null
                ? 1
                : left < right
                  ? -1
                  : 1;
        if (result) return descending ? -result : result;
      }
      return 0;
    });
    stage("ORDER BY", rows.length, rows.length, {
      columns: orders.map(
        ({ column, descending }) => `${column} ${descending ? "DESC" : "ASC"}`,
      ),
    });
  }
  const finalRows = rows.slice(offset, offset + limit);
  if (limited) stage("LIMIT", rows.length, finalRows.length, { limit, offset });
  return {
    columns,
    rows: finalRows,
    table,
    sourceRows: data.length,
    stages,
  };
}

/** CSV values are quoted and spreadsheet-formula prefixes neutralized. */
export function resultToCsv({ columns, rows }) {
  const cell = (value) => {
    let text = value === null ? "" : String(value);
    if (typeof value === "string" && /^[\s]*[=+@-]/.test(text))
      text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return (
    [columns, ...rows.map((row) => columns.map((column) => row[column]))]
      .map((row) => row.map(cell).join(","))
      .join("\r\n") + "\r\n"
  );
}
