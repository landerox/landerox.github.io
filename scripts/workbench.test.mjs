import assert from "node:assert/strict";
import test from "node:test";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import {
  validateGlossary,
  filterGlossary,
  searchGlossary,
} from "../content/en/assets/javascripts/glossary-core.js";
import {
  createSimulation,
  stepSimulation,
  FAILURE_LIMITS,
} from "../content/en/assets/javascripts/failure-core.js";
import {
  completions,
  estimateMemory,
  parseCommand,
  COMMANDS,
  inspectSubnet,
  transformText,
  hashText,
  createUUIDs,
  inspectTime,
  inspectCron,
  inspectAvailability,
  suggestCommand,
  COMMAND_EXAMPLES,
  convertBytes,
  convertBase,
  inspectContrast,
  inspectJwt,
  inspectRate,
} from "../content/en/assets/javascripts/workbench-core.js";
import {
  executeSql,
  SAMPLE_DATA,
  SQL_EXAMPLES,
  SQL_TABLES,
  SQL_LIMITS,
  resultToCsv,
} from "../content/en/assets/javascripts/sql-core.js";

test("SQL applies projection, ordering and LIMIT rather than returning every field", () => {
  const result = executeSql(SQL_EXAMPLES[0]);
  assert.deepEqual(result.columns, ["scenario", "engine", "throughput_tps"]);
  assert.equal(result.rows.length, 4);
  assert.deepEqual(result.rows[0], {
    scenario: "short-warm",
    engine: "candidate",
    throughput_tps: 140,
  });
  assert.deepEqual(
    executeSql(
      "SELECT scenario,\n engine, throughput_tps\nFROM benchmarks\nORDER BY throughput_tps DESC\nLIMIT 4;",
    ),
    result,
  );
});

test("SQL respects inclusive operators, string filters and aliases", () => {
  assert.equal(
    executeSql("SELECT ttft_ms FROM benchmarks WHERE ttft_ms <= 120;").rows
      .length,
    5,
  );
  assert.equal(
    executeSql("SELECT ttft_ms FROM benchmarks WHERE ttft_ms >= 120;").rows
      .length,
    5,
  );
  const { rows } = executeSql(
    "SELECT engine AS runner FROM benchmarks WHERE engine = 'candidate' LIMIT 1;",
  );
  assert.deepEqual(rows, [{ runner: "candidate" }]);
});

test("aggregates are calculated from selected fields and groups", () => {
  const { rows } = executeSql(SQL_EXAMPLES[2]);
  assert.deepEqual(rows, [
    { engine: "baseline", avg_tps: 77.5, runs: 4 },
    { engine: "candidate", avg_tps: 100, runs: 4 },
  ]);
  assert.deepEqual(
    executeSql(
      "SELECT COUNT(*) AS count, AVG(ttft_ms) AS latency FROM benchmarks WHERE ttft_ms < 0;",
    ).rows,
    [{ count: 0, latency: null }],
  );
  assert.equal(executeSql("SELECT * FROM benchmarks LIMIT 0;").rows.length, 0);
});

test("unsupported SQL fails explicitly, including trailing statements and prototype keys", () => {
  for (const sql of [
    "DELETE FROM benchmarks",
    "SELECT * FROM other",
    "SELECT missing FROM benchmarks",
    "SELECT * FROM benchmarks; DROP TABLE benchmarks",
    "SELECT * FROM benchmarks WHERE ttft_ms < 80 OR 1=1",
    "SELECT * FROM benchmarks ORDER BY missing",
    "SELECT AVG(engine) FROM benchmarks",
    "SELECT engine, AVG(ttft_ms) FROM benchmarks",
    "SELECT engine, engine FROM benchmarks",
    "SELECT * FROM benchmarks LIMIT 1001",
    "SELECT __proto__ FROM benchmarks",
    "SELECT * FROM benchmarks WHERE constructor = 'Object'",
    "SELECT * FROM benchmarks -- ignored",
    "SELECT * FROM benchmarks WHERE engine = 1",
    "SELECT SUM(*) FROM benchmarks",
  ])
    assert.throws(() => executeSql(sql), undefined, sql);
  assert.equal(SAMPLE_DATA.length, 8);
  assert.equal(SAMPLE_DATA[0].throughput_tps, 80);
});

test("SQL combines conditions with standard precedence and explicit parentheses", () => {
  const prefix = "SELECT pipeline FROM pipelines WHERE ";
  assert.deepEqual(
    executeSql(
      prefix + "mode = 'batch' OR mode = 'streaming' AND error_pct > 1",
    ).rows.map((row) => row.pipeline),
    ["orders", "payments", "inventory", "support", "customers"],
  );
  assert.deepEqual(
    executeSql(
      prefix + "(mode = 'batch' OR mode = 'streaming') AND error_pct > 1",
    ).rows.map((row) => row.pipeline),
    ["payments", "support"],
  );
  assert.equal(
    executeSql(prefix + "freshness_s BETWEEN 8 AND 42 AND error_pct <= 1").rows
      .length,
    2,
  );
});

test("SQL supports typed IN lists, safe LIKE wildcards and escaped quotes", () => {
  assert.equal(
    executeSql("SELECT * FROM pipelines WHERE freshness_s IN (8, 12, 42)").rows
      .length,
    3,
  );
  assert.equal(
    executeSql("SELECT * FROM pipelines WHERE mode IN ('batch', 'streaming')")
      .rows.length,
    8,
  );
  for (const [pattern, expected] of [
    ["orders%", 2],
    ["order_", 1],
    ["%live", 1],
    ["%", 8],
    ["", 0],
    ["Orders%", 0],
    [".*", 0],
    ["%''%", 0],
  ]) {
    assert.equal(
      executeSql(
        "SELECT * FROM pipelines WHERE pipeline LIKE '" + pattern + "'",
      ).rows.length,
      expected,
    );
  }
  assert.equal(
    executeSql("SELECT * FROM pipelines WHERE pipeline = 'O''Reilly'").rows
      .length,
    0,
  );
  assert.throws(
    () => executeSql("SELECT * FROM pipelines WHERE pipeline IN ('orders', 1)"),
    /type/,
  );
  assert.throws(
    () => executeSql("SELECT * FROM pipelines WHERE freshness_s LIKE 8"),
    /type/,
  );
});

test("SQL groups multiple columns after filtering and sorts selected aliases", () => {
  const result = executeSql(
    "SELECT engine, scenario, SUM(throughput_tps) AS speed, COUNT(*) AS n FROM benchmarks WHERE cache_hit_pct > 0 GROUP BY engine, scenario ORDER BY engine DESC, speed ASC",
  );
  assert.deepEqual(result.rows, [
    { engine: "candidate", scenario: "long-warm", speed: 95, n: 1 },
    { engine: "candidate", scenario: "short-warm", speed: 140, n: 1 },
    { engine: "baseline", scenario: "long-warm", speed: 75, n: 1 },
    { engine: "baseline", scenario: "short-warm", speed: 110, n: 1 },
  ]);
  assert.deepEqual(
    executeSql(
      "SELECT MIN(pipeline) AS first, MAX(pipeline) AS last FROM pipelines",
    ).rows,
    [{ first: "clicks", last: "support" }],
  );
  assert.deepEqual(
    executeSql(
      "SELECT SUM(freshness_s) AS total, MIN(freshness_s) AS low, MAX(freshness_s) AS high FROM pipelines WHERE freshness_s < 0",
    ).rows,
    [{ total: null, low: null, high: null }],
  );
});

test("SQL DISTINCT precedes LIMIT/OFFSET and repeated queries cannot mutate data", () => {
  const before = JSON.stringify(SQL_TABLES);
  assert.deepEqual(
    executeSql(
      "SELECT DISTINCT mode FROM pipelines ORDER BY mode LIMIT 1 OFFSET 1",
    ).rows,
    [{ mode: "streaming" }],
  );
  assert.deepEqual(
    executeSql("SELECT engine FROM benchmarks GROUP BY engine ORDER BY engine")
      .rows,
    [{ engine: "baseline" }, { engine: "candidate" }],
  );
  assert.equal(
    executeSql("SELECT * FROM pipelines LIMIT 10 OFFSET 1000").rows.length,
    0,
  );
  const result = executeSql("SELECT * FROM pipelines");
  result.rows[0].pipeline = "changed";
  assert.equal(result.table, "pipelines");
  assert.equal(result.sourceRows, 8);
  assert.equal(JSON.stringify(SQL_TABLES), before);
});

test("SQL consumes all input and enforces query, token and nesting budgets", () => {
  for (const query of [
    "SELECT * FROM pipelines; SELECT * FROM benchmarks",
    "SELECT * FROM pipelines JOIN benchmarks",
    "SELECT * FROM pipelines WHERE mode = 'batch' /* ignored */",
    "SELECT * FROM pipelines WHERE mode = 'batch' garbage",
    "SELECT * FROM pipelines WHERE (mode = 'batch'",
    "SELECT * FROM pipelines WHERE mode IN ()",
    "SELECT * FROM pipelines WHERE mode NOT IN ('batch')",
    "SELECT * FROM pipelines WHERE error_pct BETWEEN 0 AND",
    "SELECT * FROM pipelines WHERE error_pct = 1e2",
    "SELECT * FROM pipelines WHERE error_pct = NaN",
    "SELECT * FROM pipelines LIMIT -1",
    "SELECT * FROM pipelines LIMIT 1.5",
    "SELECT * FROM pipelines OFFSET 1",
    "SELECT mode FROM pipelines GROUP BY mode, mode",
    "SELECT mode AS constructor FROM pipelines",
    "SELECT mode AS __proto__ FROM pipelines",
    "SELECT mode AS prototype FROM pipelines",
    "SELECT COUNT(*) FROM pipelines HAVING COUNT(*) > 1",
    "SELECT AVG(mode) FROM pipelines",
  ])
    assert.throws(() => executeSql(query), undefined, query);
  assert.throws(
    () => executeSql(" ".repeat(SQL_LIMITS.characters + 1)),
    /query_length/,
  );
  assert.throws(
    () =>
      executeSql(
        "SELECT * FROM pipelines WHERE error_pct IN (" +
          "0,".repeat(201) +
          "0)",
      ),
    /query_complexity/,
  );
  const nested = (n) =>
    "SELECT * FROM pipelines WHERE " +
    "(".repeat(n) +
    "mode = 'batch'" +
    ")".repeat(n);
  assert.equal(executeSql(nested(SQL_LIMITS.depth)).rows.length, 4);
  assert.throws(
    () => executeSql(nested(SQL_LIMITS.depth + 1)),
    /query_complexity/,
  );
  assert.equal(Object.prototype.polluted, undefined);
});

test("CSV exports headers, exact numbers and quoted values without spreadsheet formulas", () => {
  const csv = resultToCsv({
    columns: ["name", "value"],
    rows: [
      { name: 'comma, quote" and\nline', value: 1.23456 },
      { name: " =SUM(A1)", value: null },
      { name: "+cmd", value: -2 },
      { name: "@SUM(A1)", value: 0 },
      { name: "-cmd", value: 1 },
    ],
  });
  assert.ok(csv.startsWith('"name","value"\r\n'));
  assert.ok(csv.includes('"comma, quote"" and\nline","1.23456"'));
  assert.ok(csv.includes('"\' =SUM(A1)",""'));
  for (const prefix of ["+cmd", "@SUM(A1)", "-cmd"])
    assert.ok(csv.includes("\"'" + prefix + '"'));
  assert.ok(csv.includes('"-2"'));
  assert.ok(csv.endsWith("\r\n"));
});

test("CLI provides a single-line example for every command and predictable ghost suggestions", () => {
  assert.deepEqual(
    Object.keys(COMMAND_EXAMPLES).sort(),
    Object.keys(COMMANDS).sort(),
  );
  for (const [command, example] of Object.entries(COMMAND_EXAMPLES)) {
    assert.equal(parseCommand(example).command, command);
    assert.ok(!/[\r\n]/.test(example));
  }
  assert.equal(suggestCommand(""), "help");
  assert.equal(suggestCommand("uu"), "uuid 3");
  assert.equal(suggestCommand("base64 d"), "base64 decode");
  assert.equal(suggestCommand("bytes "), "bytes 1 GiB GB");
  assert.equal(suggestCommand("base "), "base ff 16 10");
  assert.equal(suggestCommand("contrast "), "contrast #1a1a2e #ffffff");
  assert.equal(suggestCommand("u", ["uuid 2", "uuid 4"]), "uuid 4");
  assert.equal(suggestCommand("uuid 4", ["uuid 4"]), "");
  assert.equal(suggestCommand("UUID"), "");
  assert.equal(suggestCommand("hash secret"), "");
  assert.equal(suggestCommand("unknown"), "");
  assert.equal(suggestCommand("hash\nsecret"), "");
  assert.equal(suggestCommand("x".repeat(2201)), "");
});

test("memory uses binary GiB, independent KV dtype and all resident weights", () => {
  const config = {
    parameters: 8,
    bits: 16,
    layers: 32,
    kvHeads: 8,
    headDim: 128,
    tokens: 8192,
    concurrency: 4,
    kvBytes: 2,
    overhead: 20,
  };
  const fp16 = estimateMemory(config);
  assert.equal(fp16.cache, 4);
  assert.equal(fp16.weights, 16e9 / 2 ** 30);
  assert.equal(fp16.total, (fp16.weights + fp16.cache) * 1.2);
  const int4 = estimateMemory({ ...config, bits: 4 });
  assert.equal(int4.weights, fp16.weights / 4);
  assert.equal(int4.cache, fp16.cache);
  assert.equal(
    estimateMemory({ ...config, parameters: 671 }).weights,
    (671e9 * 2) / 2 ** 30,
  );
  assert.equal(estimateMemory({ ...config, kvBytes: 1 }).cache, fp16.cache / 2);
  for (const change of [
    { parameters: NaN },
    { tokens: Infinity },
    { layers: 0 },
    { concurrency: 1.5 },
    { overhead: -1 },
  ]) {
    assert.throws(() => estimateMemory({ ...config, ...change }));
  }
});

test("CLI preserves text, uses exact utility commands and never offers site commands", () => {
  assert.deepEqual(parseCommand("  SHA256  café "), {
    command: "hash",
    argument: "café ",
  });
  assert.equal(parseCommand("querySelector hello").command, "queryselector");
  assert.equal(parseCommand("constructor").command, "constructor");
  assert.deepEqual(completions("uu"), ["uuid"]);
  assert.deepEqual(completions("help pi"), ["help ping"]);
  assert.deepEqual(completions("base64 de"), ["base64 decode"]);
  assert.deepEqual(completions("url en"), ["url encode"]);
  assert.deepEqual(completions("help con"), ["help contrast"]);
  assert.deepEqual(completions("bytes 1 Gi"), ["bytes 1 GiB"]);
  assert.deepEqual(completions("bytes 1 GiB M"), [
    "bytes 1 GiB MB",
    "bytes 1 GiB MiB",
  ]);
  assert.deepEqual(completions("bytes 1.5 k"), [
    "bytes 1.5 kB",
    "bytes 1.5 KiB",
  ]);
  assert.deepEqual(completions("base ff 1"), ["base ff 10", "base ff 16"]);
  assert.deepEqual(completions("base ff 16 1"), [
    "base ff 16 10",
    "base ff 16 16",
  ]);
  assert.deepEqual(completions("hash text"), []);
  for (const name of [
    "about",
    "bio",
    "stack",
    "labs",
    "blueprints",
    "radar",
    "contact",
    "status",
    "open",
    "ask",
    "search",
    "query",
    "calc",
    "agent-trace",
  ]) {
    assert.equal(
      Object.hasOwn(COMMANDS, parseCommand(name).command),
      false,
      name,
    );
  }
});

test("byte conversions distinguish decimal and binary units without Number precision loss", () => {
  assert.deepEqual(convertBytes("1 GiB GB"), [
    { unit: "GB", value: "1.073741824", approximate: false },
  ]);
  assert.deepEqual(convertBytes("1.5 MiB B"), [
    { unit: "B", value: "1572864", approximate: false },
  ]);
  assert.deepEqual(convertBytes("9007199254740993 B B"), [
    { unit: "B", value: "9007199254740993", approximate: false },
  ]);
  assert.deepEqual(convertBytes("0.000001 GB B"), [
    { unit: "B", value: "1000", approximate: false },
  ]);
  assert.equal(
    convertBytes("999999999999999999 TiB B")[0].value,
    (999999999999999999n * 1024n ** 4n).toString(),
  );
  const comparison = convertBytes("1 kB");
  assert.equal(comparison.length, 9);
  assert.equal(comparison.find(({ unit }) => unit === "B").value, "1000");
  assert.equal(
    comparison.find(({ unit }) => unit === "KiB").value,
    "0.9765625",
  );
  assert.ok(
    convertBytes("0 B").every(
      ({ value, approximate }) => value === "0" && !approximate,
    ),
  );
});

test("byte conversion marks rounded values and rejects ambiguous units and unbounded inputs", () => {
  assert.deepEqual(convertBytes("1 GB GiB"), [
    { unit: "GiB", value: "0.931322574615", approximate: true },
  ]);
  assert.deepEqual(convertBytes("1 B GiB"), [
    { unit: "GiB", value: "0.000000000931", approximate: true },
  ]);
  for (const input of [
    "",
    "1",
    "1 GB GB extra",
    "-1 B",
    "1,5 GB",
    "1e3 B",
    "Infinity B",
    "1 gb",
    "1 KB",
    "1 b",
    "1 MB/s",
    "1 B nope",
    "1.0000001 B",
    "1".repeat(19) + " B",
    "1 B" + " ".repeat(81),
    "1 B; alert(1)",
    "1 constructor",
    "1 B __proto__",
  ]) {
    assert.throws(() => convertBytes(input), /bytes/, input);
  }
});

test("integer base conversion is exact for signed values and every base from 2 through 36", () => {
  assert.deepEqual(convertBase("ff 16 10"), {
    input: "ff",
    from: 16,
    to: 10,
    value: "255",
  });
  assert.equal(convertBase("-FF 16 2").value, "-11111111");
  assert.equal(convertBase("+255 10 16").value, "ff");
  assert.equal(convertBase("-000 10 2").value, "0");
  assert.equal(convertBase("9007199254740993 10 16").value, "20000000000001");
  for (let base = 2; base <= 36; base++) {
    const value = 123456789012345678901234567890n;
    assert.equal(
      convertBase(`${value.toString(base)} ${base} 10`).value,
      value.toString(),
    );
  }
  const largest = "z".repeat(256);
  const converted = convertBase(`${largest} 36 2`).value;
  assert.ok(converted.length < 1400);
  assert.equal(BigInt(`0b${converted}`).toString(36), largest);
});

test("integer base conversion refuses invalid digits, radices, syntax and excess work", () => {
  for (const input of [
    "",
    "ff 16",
    "ff 16 10 extra",
    "2 2 10",
    "g 16 10",
    "0xFF 16 10",
    "0b11 2 10",
    "1.2 10 16",
    "1_000 10 16",
    "1e3 10 16",
    "1 1 10",
    "1 37 10",
    "1 10 0",
    "1 10 37",
    "1 02 10",
    "--1 10 2",
    "Infinity 10 2",
    "0".repeat(257) + " 10 2",
    "1 10 2" + " ".repeat(281),
    "1 10 2; alert(1)",
  ]) {
    assert.throws(() => convertBase(input), /base/, input);
  }
});

test("opaque sRGB contrast follows WCAG luminance and compares unrounded text thresholds", () => {
  const extremes = inspectContrast("#000 #FFF");
  assert.equal(extremes.foreground, "#000000");
  assert.equal(extremes.background, "#ffffff");
  assert.equal(extremes.ratio, 21);
  assert.ok(
    extremes.aaText &&
      extremes.aaLargeText &&
      extremes.aaaText &&
      extremes.aaaLargeText,
  );
  assert.equal(inspectContrast("#abc #abc").ratio, 1);
  assert.equal(
    inspectContrast("#ff0000 #ffffff").ratio,
    inspectContrast("#ffffff #ff0000").ratio,
  );
  assert.ok(
    Math.abs(inspectContrast("#ff0000 #ffffff").ratio - 3.9984767707539985) <
      1e-12,
  );
  assert.equal(inspectContrast("#767676 #fff").aaText, true);
  assert.equal(inspectContrast("#777 #fff").aaText, false);
  const rounded = inspectContrast("#959595 #fff");
  assert.equal(rounded.ratio.toFixed(2), "3.00");
  assert.equal(rounded.aaLargeText, false);
  assert.equal(inspectContrast("#595959 #fff").aaaText, true);
  assert.equal(inspectContrast("#5a5a5a #fff").aaaText, false);
});

test("contrast refuses alpha, named colors, CSS expressions and extra arguments", () => {
  for (const input of [
    "",
    "#fff",
    "fff 000",
    "#fff #000 #aaa",
    "#ffff #000",
    "#ffffffff #000",
    "white black",
    "rgb(0,0,0) #fff",
    "var(--color) #fff",
    "#12 #fff",
    "#12345g #fff",
    "#000 #fff;alert(1)",
    "#fff #000" + " ".repeat(33),
  ]) {
    assert.throws(() => inspectContrast(input), /contrast/, input);
  }
});

test("IPv4 CIDR handles unsigned arithmetic, point-to-point links and host routes", () => {
  assert.deepEqual(inspectSubnet("192.168.10.42/24"), {
    address: "192.168.10.42",
    prefix: 24,
    network: "192.168.10.0",
    mask: "255.255.255.0",
    broadcast: "192.168.10.255",
    count: 256,
    hosts: 254,
    firstHost: "192.168.10.1",
    lastHost: "192.168.10.254",
  });
  const pair = inspectSubnet("192.0.2.1/31");
  assert.equal(pair.firstHost, "192.0.2.0");
  assert.equal(pair.lastHost, "192.0.2.1");
  assert.equal(pair.hosts, 2);
  assert.equal(pair.broadcast, null);
  assert.equal(inspectSubnet("255.255.255.255").firstHost, "255.255.255.255");
  assert.equal(inspectSubnet("255.255.255.255/32").hosts, 1);
  const all = inspectSubnet("203.0.113.99/0");
  assert.equal(all.network, "0.0.0.0");
  assert.equal(all.mask, "0.0.0.0");
  assert.equal(all.count, 4294967296);
  assert.equal(all.broadcast, "255.255.255.255");
  for (const input of [
    "",
    "127.1",
    "example.com",
    "1.2.3.256/24",
    "1.2.3.4/33",
    "1.2.3.4/-1",
    "1.2.3.4/01",
    "01.2.3.4",
    "1.2.3.4/24 more",
    "::1",
  ]) {
    assert.throws(() => inspectSubnet(input), /ip/, input);
  }
});

test("UTF-8 transformations round-trip Unicode and do not evaluate markup or shell text", () => {
  for (const text of [
    "Hola 🌎",
    "café & data",
    "\uFEFFhello",
    "<img onerror=alert(1)>",
    "$HOME; echo test",
    "hello  ",
  ]) {
    const encoded = transformText("base64", `encode ${text}`);
    assert.equal(transformText("base64", `decode ${encoded}`), text);
    assert.equal(
      transformText("url", `decode ${transformText("url", `encode ${text}`)}`),
      text,
    );
  }
  assert.equal(transformText("base64", "decode aGk"), "hi");
  assert.equal(transformText("base64", "decode aG k="), "hi");
  assert.equal(transformText("url", "decode a+b"), "a+b");
  for (const text of [
    "decode /w==",
    "decode !!!!",
    "decode Zh==",
    "decode a===",
    "encode",
    "run hi",
  ])
    assert.throws(() => transformText("base64", text));
  assert.throws(() => transformText("url", "decode %E0%A4"), /url/);
  assert.throws(
    () => transformText("url", "encode " + "a".repeat(2200)),
    /text_length/,
  );
});

test("JSON formatting validates syntax and rejects silent integer overflow", () => {
  assert.equal(transformText("json", '{"ok":true}'), '{\n  "ok": true\n}');
  assert.equal(transformText("json", "null"), "null");
  assert.equal(transformText("json", "1.25"), "1.25");
  assert.throws(() => transformText("json", '{"ok":true,}'), /^Error: json$/);
  assert.throws(() => transformText("json", "9007199254740993"), /json_number/);
  assert.throws(() => transformText("json", "1e400"), /json_number/);
  assert.throws(
    () => transformText("json", "[".repeat(100) + "0" + "]".repeat(100)),
    /json_size/,
  );
  assert.match(
    transformText("json", '{"__proto__":{"polluted":true}}'),
    /__proto__/,
  );
  assert.equal(Object.prototype.polluted, undefined);
});

test("SHA-256 uses the standard UTF-8 digest and preserves trailing spaces", async () => {
  assert.equal(
    await hashText("hello"),
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  );
  assert.notEqual(await hashText("hello "), await hashText("hello"));
  await assert.rejects(hashText(""), /text_length/);
});

test("UUID v4 generation uses Web Crypto and bounds the requested count", () => {
  const values = createUUIDs("10");
  assert.equal(values.length, 10);
  assert.equal(new Set(values).size, 10);
  for (const uuid of values)
    assert.match(
      uuid,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  assert.equal(createUUIDs().length, 1);
  for (const argument of ["0", "11", "1.5", "1e1", "1 x"])
    assert.throws(() => createUUIDs(argument), /uuid/);
});

test("time accepts zones or Unix seconds without guessing units", () => {
  assert.equal(inspectTime("0").iso, "1970-01-01T00:00:00.000Z");
  assert.equal(inspectTime("-1").seconds, -1);
  assert.equal(inspectTime("UTC", 0).zone, "UTC");
  assert.equal(inspectTime("Europe/Madrid", 0).iso, "1970-01-01T00:00:00.000Z");
  assert.equal(inspectTime("-62167219200").iso, "0000-01-01T00:00:00.000Z");
  assert.equal(inspectTime("253402300799").iso, "9999-12-31T23:59:59.000Z");
  for (const argument of [
    "Mars/Olympus",
    "1725494400000",
    "Infinity",
    "1.5",
    "253402300800",
  ])
    assert.throws(() => inspectTime(argument), /time/);
});

const glossaryData = JSON.parse(
  readFileSync(
    new globalThis.URL("../content/en/assets/glossary.json", import.meta.url),
    "utf8",
  ),
);
const glossary = validateGlossary(glossaryData);

test("cron lists UTC runs, ranges, names and the Vixie day-of-month or weekday rule", () => {
  const iso = (result) => result.runs.map((run) => run.toISOString());
  // Friday 2026-09-25 17:50 UTC: the next window opens on Monday.
  const weekdays = inspectCron("*/15 9-17 * * MON-FRI", Date.UTC(2026, 8, 25, 17, 50));
  assert.deepEqual(weekdays.fields[0], [0, 15, 30, 45]);
  assert.deepEqual(weekdays.fields[1], [9, 10, 11, 12, 13, 14, 15, 16, 17]);
  assert.deepEqual(weekdays.fields[4], [1, 2, 3, 4, 5]);
  assert.equal(weekdays.either, false);
  assert.deepEqual(iso(weekdays), [
    "2026-09-28T09:00:00.000Z",
    "2026-09-28T09:15:00.000Z",
    "2026-09-28T09:30:00.000Z",
    "2026-09-28T09:45:00.000Z",
    "2026-09-28T10:00:00.000Z",
  ]);
  // Both day fields restricted: every Friday and every 13th.
  const either = inspectCron("0 0 13 * 5", Date.UTC(2026, 8, 23, 12));
  assert.equal(either.either, true);
  assert.deepEqual(iso(either).map((value) => value.slice(0, 10)), [
    "2026-09-25",
    "2026-10-02",
    "2026-10-09",
    "2026-10-13",
    "2026-10-16",
  ]);
  // A day field starting with * does not restrict, even with a step.
  assert.equal(inspectCron("0 0 13 * */2").either, false);
  assert.deepEqual(inspectCron("0 12 * * 7").fields[4], [0]);
  assert.deepEqual(inspectCron("0 12 * * 5-7").fields[4], [0, 5, 6]);
  const daily = inspectCron("  @DAILY ", Date.UTC(2026, 11, 31, 23, 59));
  assert.equal(daily.macro, "@daily");
  assert.equal(daily.expression, "0 0 * * *");
  assert.equal(iso(daily)[0], "2027-01-01T00:00:00.000Z");
  // The current minute is never listed; the search starts strictly after it.
  assert.equal(
    iso(inspectCron("30 6 * * *", Date.UTC(2026, 8, 23, 6, 30, 5)))[0],
    "2026-09-24T06:30:00.000Z",
  );
  const leap = inspectCron("0 0 29 2 *", Date.UTC(2026, 8, 23));
  assert.deepEqual(iso(leap), ["2028-02-29T00:00:00.000Z"]);
  assert.deepEqual(inspectCron("0 0 30 2 *", Date.UTC(2026, 8, 23)).runs, []);
});

test("cron refuses other dialects, reversed ranges and unbounded input", () => {
  for (const [input, code] of [
    ["", "cron"],
    ["* * * *", "cron"],
    ["constructor", "cron"],
    ["0 0 ? * MON", "cron"],
    ["0 0 L * *", "cron"],
    ["0 0 1W * *", "cron"],
    ["0 0 * * 5#3", "cron"],
    ["5/15 * * * *", "cron"],
    ["0 9 * * funday", "cron"],
    ["* ".repeat(61), "cron"],
    ["0 * * * * *", "cron_seconds"],
    ["@reboot", "cron_macro"],
    ["@constructor", "cron_macro"],
    ["60 * * * *", "cron_range"],
    ["0 24 * * *", "cron_range"],
    ["0 0 0 * *", "cron_range"],
    ["0 0 * 13 *", "cron_range"],
    ["0 0 * * 8", "cron_range"],
    ["5-1 * * * *", "cron_range"],
    ["*/0 * * * *", "cron_range"],
  ])
    assert.throws(() => inspectCron(input, Date.UTC(2026, 0, 1)), new RegExp(`^Error: ${code}$`), input);
});

test("availability targets use exact digits for downtime and request budgets", () => {
  const three = inspectAvailability("99.9");
  assert.equal(three.target, 99.9);
  const period = (result, name) =>
    result.periods.find((item) => item.name === name).seconds;
  assert.equal(period(three, "month"), 2592);
  assert.equal(period(three, "day"), 86.4);
  assert.equal(three.perMillion, 1000);
  assert.equal(period(inspectAvailability("99.99%"), "year"), 3153.6);
  assert.equal(period(inspectAvailability("99.95 %"), "month"), 1296);
  assert.equal(inspectAvailability("99.999999").perMillion, 0.01);
  assert.equal(period(inspectAvailability("100"), "year"), 0);
  for (const input of ["", "0", "0.0", "100.000001", "101", "99.9999999", "-1", "1e2", "99,9", "abc"])
    assert.throws(() => inspectAvailability(input), /^Error: nines$/, input);
});

test("new utility commands parse aliases and complete like the others", () => {
  assert.equal(parseCommand("crontab 0 6 * * 2").command, "cron");
  assert.equal(parseCommand("disponibilidad 99.9").command, "nines");
  assert.equal(parseCommand("availability 99.9").command, "nines");
  assert.deepEqual(completions("help cr"), ["help cron"]);
  assert.deepEqual(completions("ni"), ["nines"]);
  assert.equal(suggestCommand("nines "), "nines 99.95");
});

test("glossary validates bilingual editorial data, IDs and HTTPS sources", () => {
  assert.equal(glossaryData.license, "CC-BY-4.0");
  assert.equal(glossary.length, glossaryData.terms.length);
  assert.ok(glossary.length >= 50);
  for (const change of [
    (data) => {
      data.terms[0].source.url = "javascript:alert(1)";
    },
    (data) => {
      delete data.terms[0].es;
    },
    (data) => {
      data.terms[1].id = data.terms[0].id;
    },
    (data) => {
      data.terms[0].category = "constructor";
    },
    (data) => {
      data.terms[0].source.url = "https://user:password@example.com";
    },
  ]) {
    const data = globalThis.structuredClone(glossaryData);
    change(data);
    assert.throws(() => validateGlossary(data));
  }
});

test("glossary searches accents, aliases and prefixes, and combines domain filters", () => {
  assert.equal(
    filterGlossary(glossary, "¿Qué es idempotencia?", "all", "es")[0].id,
    "idempotency",
  );
  assert.equal(filterGlossary(glossary, "kv ca", "ai")[0].id, "kv-cache");
  assert.equal(
    filterGlossary(glossary, "cuantización", "ai", "es")[0].id,
    "quantization",
  );
  assert.equal(filterGlossary(glossary, "retry", "platform")[0].id, "backoff");
  assert.deepEqual(filterGlossary(glossary, "RAG", "cloud"), []);
  assert.deepEqual(filterGlossary(glossary, "<img onerror=alert(1)>"), []);
  assert.deepEqual(filterGlossary(glossary, "bitcoin tomorrow prices"), []);
  assert.ok(
    filterGlossary(glossary, "", "data").every(
      (term) => term.category === "data",
    ),
  );
  assert.equal(filterGlossary(glossary).length, glossary.length);
});

test("glossary corrects typos without guessing short acronyms or overriding exact matches", () => {
  // cspell:disable-next-line
  const fuzzy = searchGlossary(glossary, "idempotnecia", "all", "es");
  assert.equal(fuzzy[0].term.id, "idempotency");
  assert.equal(fuzzy[0].approximate, true);
  assert.equal(searchGlossary(glossary, "idempotencia", "all", "es")[0].approximate, false);
  assert.deepEqual(filterGlossary(glossary, "RQG"), []);
  assert.deepEqual(filterGlossary(glossary, "MPC"), []);
  // cspell:disable-next-line
  assert.deepEqual(filterGlossary(glossary, "idempotnecia", "ai", "es"), []);
  const names = glossary.map((term) => term.en.term);
  searchGlossary(glossary, "quantization");
  assert.deepEqual(glossary.map((term) => term.en.term), names);
});

test("related terms reject missing, repeated and self references and unsafe practice routes", () => {
  for (const related of [["missing"], ["private-cloud"], ["vpc", "vpc"], []]) {
    const data = globalThis.structuredClone(glossaryData);
    data.terms[0].related = related;
    assert.throws(() => validateGlossary(data), /glossary_related/);
  }
  const data = globalThis.structuredClone(glossaryData);
  data.terms[0].practice = { path: "https://example.com/", en: "Example", es: "Ejemplo" };
  assert.throws(() => validateGlossary(data), /glossary_practice/);
});

test("glossary covers data, agents and Ops with bilingual explanations and sources", () => {
  for (const term of [
    "batch",
    "streaming",
    "agent",
    "multi-agent",
    "rag",
    "sre",
    "kafka",
    "dbt",
    "airflow",
    "duckdb",
    "lakehouse",
    "medallion",
    "clickhouse",
    "aiops",
    "llmops",
    "finops",
    "devsecops",
  ]) {
    assert.ok(
      glossary.some((entry) => entry.id === term),
      term,
    );
    for (const locale of ["en", "es"])
      assert.ok(
        filterGlossary(glossary, term, "all", locale).some(
          (entry) => entry.id === term,
        ),
        locale + " " + term,
      );
  }
});

function assertConservation(state) {
  assert.equal(
    state.total,
    state.written + state.queue.length + state.dead + state.rejected,
  );
  assert.ok(state.queue.length <= FAILURE_LIMITS.queue);
  assert.ok(state.events.length <= FAILURE_LIMITS.log);
  assert.equal(
    new Set(state.queue.map((job) => job.id)).size,
    state.queue.length,
  );
}

test("healthy simulation processes every admitted event without retries", () => {
  const original = createSimulation();
  const state = stepSimulation(original);
  assert.deepEqual(
    original,
    createSimulation(),
    "must not mutate the prior snapshot",
  );
  assert.equal(state.tick, 1);
  assert.equal(state.total, 3);
  assert.equal(state.written, 3);
  assert.equal(state.attempts, 3);
  assert.equal(state.retries, 0);
  assert.equal(state.queue.length, 0);
  assertConservation(state);
});

test("worker failure creates a bounded queue, and recovery drains only pending work", () => {
  let state = createSimulation();
  for (let i = 0; i < 10; i++)
    state = stepSimulation(state, { failure: "workers" });
  assert.equal(state.queue.length, 24);
  assert.equal(state.rejected, 6);
  assert.equal(state.attempts, 0);
  const rejected = state.rejected;
  for (let i = 0; i < 14; i++) {
    state = stepSimulation(state);
    assertConservation(state);
  }
  assert.equal(state.queue.length, 0);
  assert.ok(
    state.rejected >= rejected,
    "rejected arrivals cannot silently become completed",
  );
});

test("failed writes use at most three attempts and eventually enter dead letters", () => {
  let state = createSimulation();
  for (let i = 0; i < 25; i++) {
    const before = state.attempts;
    state = stepSimulation(state, { failure: "store" });
    assert.ok(state.attempts - before <= FAILURE_LIMITS.workers);
    assertConservation(state);
  }
  assert.equal(state.written, 0);
  assert.ok(state.dead > 0);
  assert.ok(state.retries > 0);
  assert.ok(state.queue.every((job) => job.attempts < 3));
  const dead = state.dead;
  for (let i = 0; i < 20; i++) state = stepSimulation(state);
  assert.equal(
    state.dead,
    dead,
    "restoring service does not replay dead letters",
  );
  assert.equal(state.queue.length, 0);
  assertConservation(state);
});

test("backoff schedules retries later; immediate policy never retries twice per tick", () => {
  const first = stepSimulation(createSimulation(), { failure: "store" });
  const second = stepSimulation(first, { failure: "store" });
  assert.ok(second.queue.some((job) => job.attempts === 2 && job.ready === 4));
  const immediate = stepSimulation(first, {
    failure: "store",
    retry: "immediate",
  });
  assert.ok(
    immediate.queue.some((job) => job.attempts === 2 && job.ready === 3),
  );
  assert.ok(immediate.attempts - first.attempts <= 5);
});

test("all failure modes conserve events, cap playback and produce deterministic results", () => {
  for (const failure of ["none", "workers", "store", "burst"]) {
    for (const retry of ["backoff", "immediate"]) {
      let state = createSimulation();
      for (let i = 0; i < 140; i++) {
        const next = stepSimulation(state, { failure, retry });
        assert.deepEqual(next, stepSimulation(state, { failure, retry }));
        state = next;
        assertConservation(state);
      }
      assert.equal(state.tick, 120);
      assert.equal(stepSimulation(state), state);
    }
  }
  assert.throws(() =>
    stepSimulation(createSimulation(), { failure: "constructor" }),
  );
  assert.throws(() =>
    stepSimulation(createSimulation(), { retry: "unlimited" }),
  );
});

test("rate spreads byte volumes and event counts exactly across periods", () => {
  const tera = inspectRate("5 TB/day");
  assert.equal(tera.bytes, true);
  const second = tera.rows.find((row) => row.period === "second");
  // 5e12 / 86400 = 57,870,370.37 B/s: 57.87 MB/s and 55.189 MiB/s.
  assert.deepEqual(second.decimal, { unit: "MB", value: "57.87", approximate: true });
  assert.deepEqual(second.binary, { unit: "MiB", value: "55.189", approximate: true });
  assert.deepEqual(tera.rows.find((row) => row.period === "day").decimal, {
    unit: "TB", value: "5", approximate: false,
  });
  assert.deepEqual(tera.rows.find((row) => row.period === "month").decimal, {
    unit: "TB", value: "150", approximate: false,
  });
  const events = inspectRate("1200000 events per hour");
  assert.equal(events.bytes, false);
  assert.equal(events.label, "events");
  assert.deepEqual(events.rows.find((row) => row.period === "second").count, {
    value: "333.333333", approximate: true,
  });
  assert.equal(events.rows.find((row) => row.period === "day").count.value, "28800000");
  // Spanish periods, plurals and accents; a bare count needs no label.
  assert.equal(inspectRate("86400/día").rows[0].count.value, "1");
  assert.equal(inspectRate("3600 eventos por hora").rows[0].count.value, "1");
  assert.equal(inspectRate("60/minutes").rows[0].count.value, "1");
  assert.equal(inspectRate("1.5 GiB/s").rows[0].binary.value, "1.5");
  assert.equal(inspectRate("0/day").rows[0].count.value, "0");
  // Accented event labels; rounding that reaches the next unit moves up.
  assert.equal(inspectRate("500 páginas/día").label, "páginas");
  assert.equal(inspectRate("20 órdenes por hora").rows[4].count.value, "14400");
  assert.deepEqual(inspectRate("999.9999 GB/s").rows[0].decimal, { unit: "TB", value: "1", approximate: true });
  assert.equal(inspectRate("1023.9999 MiB/s").rows[0].binary.unit, "GiB");
  // cspell:disable-next-line -- bit-rate units the parser must reject
  for (const input of ["", "5 TB", "5 tb/day", "5 Mb/day", "5 bits/s", "5 gbps/s", "5 kbps/min",
    "5 bytes/s", "-1/day", "1e3/day", "5 TB/fortnight", "5 TB/ses", "5 TB/hes", "5,5 TB/day",
    "1/s extra", "x".repeat(81)])
    assert.throws(() => inspectRate(input), /^Error: rate$/, input);
});

const segment = (value) =>
  Buffer.from(typeof value === "string" ? value : JSON.stringify(value))
    .toString("base64url");
const token = (header, payload, signature = "c2ln") =>
  [segment(header), segment(payload), signature].join(".");

test("jwt decodes header, payload and time claims without verifying", () => {
  const now = Date.UTC(2026, 8, 25, 12);
  const decoded = inspectJwt(
    token({ alg: "HS256", typ: "JWT" }, {
      sub: "visitor", aud: ["api"], iat: 1790000000, exp: 1790003600, nbf: 1900000000, extra: 1,
    }),
    now,
  );
  assert.equal(decoded.kind, "jws");
  assert.equal(decoded.alg, "HS256");
  assert.equal(decoded.unsigned, false);
  assert.deepEqual(decoded.claims.map((claim) => claim.name), ["sub", "aud", "exp", "nbf", "iat"]);
  const exp = decoded.claims.find((claim) => claim.name === "exp");
  assert.equal(exp.iso, "2026-09-21T15:13:20.000Z");
  assert.equal(exp.state, "expired");
  assert.equal(decoded.claims.find((claim) => claim.name === "nbf").state, "future");
  assert.equal(decoded.claims.find((claim) => claim.name === "iat").state, "past");
  // UTF-8 in claims survives the Base64URL round trip.
  assert.equal(inspectJwt(token({ alg: "ES256" }, { name: "café ☕" })).payload.name, "café ☕");
  // Unsigned tokens are flagged; a non-JSON payload is shown as text.
  assert.equal(inspectJwt(token({ alg: "none" }, { sub: "x" }, "")).unsigned, true);
  assert.equal(inspectJwt(token({ alg: "HS256" }, "plain text")).payload, "plain text");
  // JWE: five segments, only the header is read.
  const jwe = inspectJwt([segment({ alg: "RSA-OAEP", enc: "A256GCM" }), "a", "b", "c", "d"].join("."));
  assert.deepEqual([jwe.kind, jwe.alg, jwe.payload, jwe.claims], ["jwe", "RSA-OAEP", null, []]);
  // A safe integer beyond JavaScript's date range is listed without a date;
  // an unsafe one is refused like any other rounded JSON number.
  assert.equal(inspectJwt(token({ alg: "HS256" }, { exp: 9e12 })).claims[0].iso, undefined);
  assert.throws(() => inspectJwt(token({ alg: "HS256" }, { exp: 1e20 })), /^Error: json_number$/);
  for (const input of ["", "abc", "a.b", "a.b.c.d", `${segment({ alg: "HS256" })}.***.x`,
    `${segment("[1]")}.${segment({})}.x`, `${segment({ alg: "HS256" })} .${segment({})}.x`,
    `${Buffer.from([0xff, 0xfe]).toString("base64url")}.${segment({})}.x`, "e".repeat(8193),
    `${segment({ alg: "HS256" })}.${segment({})}.!!!`])
    assert.throws(() => inspectJwt(input), /^Error: jwt$/, input.slice(0, 40));
  // Like the json command, a number JavaScript would round is refused.
  assert.throws(
    () => inspectJwt(`${segment({ alg: "HS256" })}.${segment("{\"id\":9007199254740993}")}.x`),
    /^Error: json_number$/,
  );
  // A JWE with an empty encrypted key (direct encryption) still decodes.
  assert.equal(inspectJwt([segment({ alg: "dir", enc: "A256GCM" }), "", "iv", "ct", "tag"].join(".")).kind, "jwe");
});

test("rate and jwt parse aliases and complete like the others", () => {
  assert.equal(parseCommand("tasa 5 TB/day").command, "rate");
  assert.deepEqual(completions("ra"), ["rate"]);
  assert.deepEqual(completions("jw"), ["jwt"]);
  assert.equal(suggestCommand("rate "), "rate 5 TB/day");
  assert.equal(inspectJwt(COMMAND_EXAMPLES.jwt.slice(4)).claims.length, 3);
});
