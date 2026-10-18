import assert from "node:assert/strict";
import test from "node:test";
import {
  STATUS_STATES,
  WORKING_HOURS,
  statusFor,
  statusAt,
} from "../content/en/assets/javascripts/features/status-core.js";
import {
  parseToolHash,
  toolHash,
  SHARE_LIMIT,
} from "../content/en/assets/javascripts/share-core.js";

test("the pill is available on weekdays from 08:00 to 20:00 and offline otherwise", () => {
  const expected = [
    [0, "offline"],
    [7, "offline"],
    [8, "available"],
    [12, "available"],
    [19, "available"],
    [20, "offline"],
    [23, "offline"],
  ];
  for (const [hour, state] of expected) {
    assert.equal(statusFor(hour, false).id, state, `${hour}:00`);
    assert.equal(statusFor(hour, true).id, "offline", `weekend ${hour}:00`);
  }
  assert.deepEqual(WORKING_HOURS, { start: 8, end: 20 });
});

test("both states have a color token and localized labels and tooltips", () => {
  assert.deepEqual(Object.keys(STATUS_STATES), ["available", "offline"]);
  for (const [name, state] of Object.entries(STATUS_STATES)) {
    assert.equal(state.id, name);
    assert.equal(state.color, `--status-${name}`);
    for (const field of ["en", "es", "titleEn", "titleEs"])
      assert.ok(state[field]?.trim(), `${name}.${field}`);
  }
  assert.ok(Object.isFrozen(STATUS_STATES));
});

test("the pill reads a fixed UTC-4 Caracas clock, including across midnight", () => {
  // Wednesday 2026-09-23 12:00 UTC is 08:00 in Caracas.
  assert.equal(statusAt(Date.UTC(2026, 8, 23, 12, 0)).id, "available");
  // 11:59 UTC is 07:59 in Caracas.
  assert.equal(statusAt(Date.UTC(2026, 8, 23, 11, 59)).id, "offline");
  // Saturday 03:30 UTC is still Friday 23:30 in Caracas: after hours.
  assert.equal(statusAt(Date.UTC(2026, 8, 26, 3, 30)).id, "offline");
  // Saturday 14:00 UTC is Saturday 10:00 in Caracas: weekend.
  assert.equal(statusAt(Date.UTC(2026, 8, 26, 14, 0)).id, "offline");
  // Friday 23:59 UTC is Friday 19:59 in Caracas.
  assert.equal(statusAt(Date.UTC(2026, 8, 25, 23, 59)).id, "available");
});

test("scenario links keep ids plain, drop unknown keys and cap their size", () => {
  const hash = toolHash("interactive-eval-stats", [
    ["mode", "sample"], ["baseline", "80"], ["candidate", "85.5"], ["empty", ""],
  ]);
  assert.equal(hash, "#interactive-eval-stats?mode=sample&baseline=80&candidate=85.5");
  const parsed = parseToolHash(hash);
  assert.equal(parsed.id, "interactive-eval-stats");
  assert.deepEqual([...parsed.params], [["mode", "sample"], ["baseline", "80"], ["candidate", "85.5"]]);
  // Plain anchors still work, and a query needs a valid key to count.
  assert.deepEqual(parseToolHash("#failure-lab"), { id: "failure-lab", params: new Map(), query: false });
  assert.deepEqual([...parseToolHash("#x?Bad=1&ok=2&ok=3&__proto__=4").params], [["ok", "2"]]);
  // Values round-trip through encoding, whatever text a crafted link carries.
  const query = "SELECT * FROM benchmarks WHERE engine = 'a&b' LIMIT 2;";
  assert.equal(parseToolHash(toolHash("x", [["q", query]])).params.get("q"), query);
  assert.equal(parseToolHash("#%E0%A4%A").id, "");
  assert.throws(() => toolHash("x", [["Bad", "1"]]), /share_key/);
  assert.throws(() => toolHash("x", [["q", "a".repeat(SHARE_LIMIT)]]), /share_size/);
  assert.equal(parseToolHash(`#x?q=${"a".repeat(SHARE_LIMIT)}`).params.size, 0);
});

test("scenario links survive the theme's single decode of the fragment", () => {
  // The theme decodes the whole fragment once and uses it in a selector.
  const values = [["q", 'SELECT "a"\nFROM b WHERE c = \'x\\y\' AND d LIKE \'%z%\';'], ["before", '{"columns":[]}']];
  const hash = toolHash("x", values);
  assert.doesNotMatch(decodeURIComponent(hash.slice(1)), /["\\\n]/);
  assert.deepEqual([...parseToolHash(hash).params], values);
  assert.equal(parseToolHash(hash).query, true);
  assert.equal(parseToolHash("#failure-lab").query, false);
});
