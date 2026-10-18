import assert from "node:assert/strict";
import test from "node:test";
import {
  GROUPS,
  selectEntries,
  groupCounts,
} from "../content/en/assets/javascripts/comparison-core.js";

const entries = [
  { title: "Analytics", group: "data" },
  { title: "Inference", group: "ai" },
  { title: "Streaming", group: "data" },
  { title: "Agents", group: "ai" },
  { title: "Operations", group: "platform" },
];

test("reference groups retain editorial order and default to all", () => {
  assert.deepEqual(selectEntries(entries), entries);
  assert.notEqual(selectEntries(entries), entries);
  assert.deepEqual(selectEntries(entries, "data"), [entries[0], entries[2]]);
  assert.deepEqual(selectEntries(entries, "ai"), [entries[1], entries[3]]);
});

test("reference counts describe each explicit topic without mutating data", () => {
  const snapshot = entries.map((entry) => ({ ...entry }));
  assert.deepEqual(groupCounts(entries), {
    all: 5,
    data: 2,
    ai: 2,
    platform: 1,
  });
  assert.deepEqual(entries, snapshot);
  assert.deepEqual(GROUPS, ["all", "data", "ai", "platform"]);
  assert.ok(Object.isFrozen(GROUPS));
});

test("invalid reference filters never silently hide the collection", () => {
  for (const value of ["unknown", "", null, "<script>", "__proto__"]) {
    assert.deepEqual(selectEntries(entries, value), entries);
  }
  const extended = [...entries, { title: "Future topic", group: "future" }];
  assert.equal(selectEntries(extended).length, 6);
});

test("empty reference groups remain well-defined", () => {
  assert.deepEqual(selectEntries([], "data"), []);
  assert.deepEqual(selectEntries(entries, "platform"), [entries[4]]);
  assert.deepEqual(groupCounts([]), { all: 0, data: 0, ai: 0, platform: 0 });
});
