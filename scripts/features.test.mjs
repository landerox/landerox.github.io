import assert from "node:assert/strict";
import test from "node:test";
import {
  STATUS_STATES,
  statusFor,
  statusAt,
} from "../content/en/assets/javascripts/features/status-core.js";
import {
  parseToolHash,
  toolHash,
  SHARE_LIMIT,
} from "../content/en/assets/javascripts/share-core.js";

const key = (state) =>
  Object.keys(STATUS_STATES).find((name) => STATUS_STATES[name] === state);

test("availability follows the documented weekday schedule minute by minute", () => {
  const expected = [
    [0, 0, "offline"],
    [7, 59, "offline"],
    [8, 0, "triage"],
    [8, 59, "triage"],
    [9, 0, "sessions"],
    [10, 0, "available"],
    [11, 0, "coffee"],
    [11, 14, "coffee"],
    [11, 15, "available"],
    [12, 0, "lunch"],
    [13, 0, "available"],
    [14, 0, "focus"],
    [15, 0, "coffee"],
    [15, 15, "focus"],
    [16, 0, "reviews"],
    [18, 0, "lab"],
    [19, 59, "lab"],
    [20, 0, "offline"],
    [23, 59, "offline"],
  ];
  for (const [hour, minute, state] of expected)
    assert.equal(key(statusFor(hour, minute, false)), state, `${hour}:${minute}`);
});

test("every weekday minute resolves to one state and weekends are weekend", () => {
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute++) {
      assert.ok(key(statusFor(hour, minute, false)), `${hour}:${minute}`);
      assert.equal(key(statusFor(hour, minute, true)), "weekend");
    }
  }
});

test("each state has a color token and both localized labels and tooltips", () => {
  for (const [name, state] of Object.entries(STATUS_STATES)) {
    assert.match(state.color, /^--status-[a-z]+$/, name);
    for (const field of ["en", "es", "titleEn", "titleEs"])
      assert.ok(state[field]?.trim(), `${name}.${field}`);
  }
  assert.ok(Object.isFrozen(STATUS_STATES));
});

test("the pill reads a fixed UTC-4 Caracas clock, including across midnight", () => {
  // Wednesday 2026-09-23 12:00 UTC is 08:00 in Caracas.
  assert.equal(key(statusAt(Date.UTC(2026, 8, 23, 12, 0))), "triage");
  // Saturday 03:30 UTC is still Friday 23:30 in Caracas: offline, not weekend.
  assert.equal(key(statusAt(Date.UTC(2026, 8, 26, 3, 30))), "offline");
  // Saturday 04:00 UTC is Saturday 00:00 in Caracas.
  assert.equal(key(statusAt(Date.UTC(2026, 8, 26, 4, 0))), "weekend");
});

test("scenario links keep ids plain, drop unknown keys and cap their size", () => {
  const hash = toolHash("interactive-slo-budget", [
    ["mode", "time"], ["target", "99.95"], ["window", "30"], ["empty", ""],
  ]);
  assert.equal(hash, "#interactive-slo-budget?mode=time&target=99.95&window=30");
  const parsed = parseToolHash(hash);
  assert.equal(parsed.id, "interactive-slo-budget");
  assert.deepEqual([...parsed.params], [["mode", "time"], ["target", "99.95"], ["window", "30"]]);
  // Plain anchors still work, and a query needs a valid key to count.
  assert.deepEqual(parseToolHash("#failure-lab"), { id: "failure-lab", params: new Map(), query: false });
  assert.deepEqual([...parseToolHash("#x?Bad=1&ok=2&ok=3&__proto__=4").params], [["ok", "2"]]);
  // Values round-trip through encoding, including SQL text and JSON.
  const query = "SELECT * FROM benchmarks WHERE engine = 'a&b' LIMIT 2;";
  assert.equal(parseToolHash(toolHash("interactive-sql-sandbox", [["q", query]])).params.get("q"), query);
  assert.equal(parseToolHash("#%E0%A4%A").id, "");
  assert.throws(() => toolHash("x", [["Bad", "1"]]), /share_key/);
  assert.throws(() => toolHash("x", [["q", "a".repeat(SHARE_LIMIT)]]), /share_size/);
  assert.equal(parseToolHash(`#x?q=${"a".repeat(SHARE_LIMIT)}`).params.size, 0);
});

test("scenario links survive the theme's single decode of the fragment", () => {
  // The theme decodes the whole fragment once and uses it in a selector.
  const values = [["q", 'SELECT "a"\nFROM b WHERE c = \'x\\y\' AND d LIKE \'%z%\';'], ["before", '{"columns":[]}']];
  const hash = toolHash("interactive-schema-diff", values);
  assert.doesNotMatch(decodeURIComponent(hash.slice(1)), /["\\\n]/);
  assert.deepEqual([...parseToolHash(hash).params], values);
  assert.equal(parseToolHash(hash).query, true);
  assert.equal(parseToolHash("#failure-lab").query, false);
});
