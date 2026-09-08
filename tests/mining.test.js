import test from "node:test";
import assert from "node:assert/strict";
import {
  PICKAXE_UPGRADE_LEVELS,
  getCurrentPickaxeStats,
} from "../src/systems/mining.js";

test("uses deliberate mining durations for every pickaxe level", () => {
  assert.deepEqual(
    PICKAXE_UPGRADE_LEVELS.map((entry) => entry.swingDuration),
    [1.1, 1.0, 0.9, 0.82, 0.75, 0.68],
  );
  assert.equal(Math.min(...PICKAXE_UPGRADE_LEVELS.map((entry) => entry.swingDuration)), 0.68);
});

test("resolves the active pickaxe level to its complete swing duration", () => {
  assert.equal(getCurrentPickaxeStats(0).swingDuration, 1.1);
  assert.equal(getCurrentPickaxeStats(5).swingDuration, 0.68);
  assert.equal(getCurrentPickaxeStats(99).swingDuration, 0.68);
});
