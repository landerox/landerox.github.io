import assert from "node:assert/strict";
import test from "node:test";
import {
  MEMORY_PRESETS,
  compareMemory,
  estimateMemory,
} from "../content/en/assets/javascripts/workbench-core.js";

const GIB = 2 ** 30;
const preset = (id) => MEMORY_PRESETS.find((item) => item.id === id);
const workload = Object.freeze({
  bits: 16,
  tokens: 262144,
  concurrency: 1,
  kvBytes: 2,
  overhead: 0,
});

const baseline = Object.freeze({
  ...preset("qwen3.8-27b"),
  ...workload,
  tokens: 32768,
  concurrency: 4,
  overhead: 20,
});

test("memory comparison uses actual estimates and leaves snapshots untouched", () => {
  const current = { ...baseline, tokens: baseline.tokens * 2 };
  const result = compareMemory(baseline, current);
  assert.equal(result.current.cache, result.baseline.cache * 2);
  assert.equal(result.current.weights, result.baseline.weights);
  assert.equal(result.current.state, result.baseline.state);
  assert.equal(result.delta.cache, result.baseline.cache);
  assert.equal(result.driver, "cache");
  assert.ok(result.percent > 0);
  assert.equal(baseline.tokens, 32768);
  assert.equal(current.tokens, 65536);
});

test("identical estimates have no driver and FP8 keeps the BF16 share", () => {
  assert.equal(compareMemory(baseline, baseline).driver, null);
  assert.equal(compareMemory(baseline, baseline).percent, 0);
  const result = compareMemory(baseline, { ...baseline, bits: 8 });
  assert.equal(result.driver, "weights");
  assert.ok(result.percent < 0);
  // 24.70B parameters at 1 byte plus 3.08B kept at 2 bytes.
  assert.equal(result.current.weights, ((27.78 - 3.08) + 3.08 * 2) * 1e9 / GIB);
  assert.equal(result.delta.cache, 0);
});

test("Qwen3.8 presets match their published configurations", () => {
  assert.deepEqual(
    MEMORY_PRESETS.map((item) => item.id),
    ["qwen3.8-27b", "qwen3.8-flash-next", "qwen3.8-2.4t-a95b"],
  );
  const expected = {
    "qwen3.8-27b": { layers: 16, linearLayers: 48, kvHeads: 4, linearHeads: 48, active: 27.78 },
    "qwen3.8-flash-next": { layers: 12, linearLayers: 36, kvHeads: 2, linearHeads: 48, active: 6 },
    "qwen3.8-2.4t-a95b": { layers: 23, linearLayers: 69, kvHeads: 4, linearHeads: 128, active: 95 },
  };
  for (const item of MEMORY_PRESETS) {
    const want = expected[item.id];
    assert.equal(item.layers, want.layers);
    assert.equal(item.linearLayers, want.linearLayers);
    // Hybrid layout: one full-attention layer every four.
    assert.equal(item.linearLayers, item.layers * 3);
    assert.equal(item.kvHeads, want.kvHeads);
    assert.equal(item.linearHeads, want.linearHeads);
    assert.equal(item.activeParameters, want.active);
    assert.equal(item.headDim, 256);
    assert.equal(item.context, 262144);
    assert.ok(item.highPrecisionParameters < item.parameters);
    assert.match(item.source, /^https:\/\/huggingface.co\/Qwen\/Qwen3\.8-/);
    assert.match(item.config, /\/blob\/main\/config\.json$/);
    assert.ok(Object.isFrozen(item));
  }
});

test("hybrid attention caches only full-attention layers", () => {
  const dense = estimateMemory({ ...preset("qwen3.8-27b"), ...workload });
  // 2 × 16 layers × 4 KV heads × 256 × 2 bytes = 64 KiB per token.
  assert.equal(dense.kvPerTokenKiB, 64);
  assert.equal(dense.cache, 16);
  assert.equal(dense.allLayersCache, 64);
  // 48 layers × 48 heads × 128 × 128 × 4 bytes of fixed state.
  assert.equal(dense.statePerRequestMiB, 144);
  assert.equal(dense.state, 144 / 1024);
  const doubled = estimateMemory({ ...preset("qwen3.8-27b"), ...workload, tokens: 524288 });
  assert.equal(doubled.cache, dense.cache * 2);
  assert.equal(doubled.state, dense.state);
  const classic = estimateMemory({ ...preset("qwen3.8-27b"), ...workload, layers: 64, linearLayers: 0 });
  assert.equal(classic.cache, dense.allLayersCache);
  assert.equal(classic.state, 0);
});

test("mixture of experts keeps every expert resident but reads the active share", () => {
  const moe = estimateMemory({ ...preset("qwen3.8-2.4t-a95b"), ...workload });
  assert.equal(moe.weights, (2446.18e9 * 2) / GIB);
  assert.ok(Math.abs(moe.activeWeightsRead - (95e9 * 2) / GIB) < 1e-9);
  assert.equal(moe.kvPerTokenKiB, 92);
  const flash = estimateMemory({ ...preset("qwen3.8-flash-next"), ...workload });
  assert.equal(flash.kvPerTokenKiB, 24);
  assert.ok(flash.activeWeightsRead < flash.weights / 20);
});

test("comparison rejects invalid inputs before presenting a delta", () => {
  for (const invalid of [
    { tokens: 0 },
    { overhead: 101 },
    { parameters: Infinity },
    { activeParameters: 40 },
    { highPrecisionParameters: 30 },
    { layers: 0, linearLayers: 0 },
    { linearHeads: 0 },
    { linearLayers: 2.5 },
  ]) {
    assert.throws(() => compareMemory(baseline, { ...baseline, ...invalid }));
    assert.throws(() => compareMemory({ ...baseline, ...invalid }, baseline));
  }
});

test("cross-field memory errors name the input to fix", () => {
  const field = (input) => {
    try {
      estimateMemory(input);
    } catch (error) {
      assert.equal(error.message, "memory_inputs");
      return error.field;
    }
    return "ok";
  };
  const base = { ...preset("qwen3.8-27b"), ...workload };
  assert.equal(field(base), "ok");
  assert.equal(field({ ...base, activeParameters: base.parameters + 1 }), "activeParameters");
  assert.equal(field({ ...base, highPrecisionParameters: base.parameters + 1 }), "highPrecisionParameters");
  assert.equal(field({ ...base, layers: 0, linearLayers: 0 }), "layers");
  assert.equal(field({ ...base, linearKeyDim: 0 }), "linearKeyDim");
  assert.equal(field({ ...base, overhead: 101 }), "overhead");
  assert.equal(field({ ...base, tokens: 1.5 }), "");
});
