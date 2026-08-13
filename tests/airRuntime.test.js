import test from "node:test";
import assert from "node:assert/strict";
import { createAirRuntime } from "../src/systems/airRuntime.js";

const CONFIG = {
  mine: {
    displayName: "Mine",
    drainPerSecondAtZeroPurify: 2,
    purifierPowderCost: 1,
    purifierGain: 50,
  },
};

function createRuntime({ air = 100, inventory = {} } = {}) {
  const items = { ...inventory };
  const progress = { mine: 0 };
  const runtime = createAirRuntime({
    initialAir: air,
    maxAir: 100,
    mapPurificationProgress: progress,
    mapPollutionConfig: CONFIG,
    hasItem: (itemId) => (items[itemId] ?? 0) > 0,
    consumeItem: (itemId, count) => {
      if ((items[itemId] ?? 0) < count) return false;
      items[itemId] -= count;
      return true;
    },
    getItemCount: (itemId) => items[itemId] ?? 0,
  });
  return { runtime, progress, items };
}

test("drains in polluted maps and recovers in safe maps", () => {
  const { runtime } = createRuntime({ air: 50 });
  runtime.updateFrame(2, "mine");
  assert.equal(runtime.getCurrentAir(), 46);
  runtime.updateFrame(2, null);
  assert.equal(runtime.getCurrentAir(), 48.2);
});

test("uses an air canister only when air is missing", () => {
  const { runtime, items } = createRuntime({ air: 60, inventory: { freshAirCanister: 1 } });
  assert.deepEqual(runtime.useAirCanister(), { ok: true, currentAir: 94 });
  assert.equal(items.freshAirCanister, 0);
  assert.equal(runtime.useAirCanister().reason, "missing-canister");
});

test("consumes powder and caps purifier progress at one hundred", () => {
  const { runtime, progress, items } = createRuntime({ inventory: { purifyPowder: 2 } });
  assert.equal(runtime.usePurifier("mine").purification, 50);
  assert.equal(runtime.usePurifier("mine").completed, true);
  assert.equal(progress.mine, 100);
  assert.equal(items.purifyPowder, 0);
  assert.equal(runtime.usePurifier("mine").reason, "already-purified");
});
