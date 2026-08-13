import test from "node:test";
import assert from "node:assert/strict";
import {
  createForgeUpgradeAttemptPlan,
  createForgeUpgradeResultPlan,
} from "../src/systems/forge.js";
import { createRefineryCraftPlan } from "../src/systems/refinery.js";
import { createWorkstationRuntime } from "../src/systems/workstationRuntime.js";

function createRuntime(items, { canAdd = true, random = () => 0 } = {}) {
  let now = 100;
  return {
    runtime: createWorkstationRuntime({
      createRefineryCraftPlan,
      createForgeUpgradeAttemptPlan,
      createForgeUpgradeResultPlan,
      consumeItem: (itemId, count) => {
        if ((items[itemId] ?? 0) < count) return false;
        items[itemId] -= count;
        return true;
      },
      addItem: (itemId, count) => {
        if (!canAdd && itemId === "powder") return false;
        items[itemId] = (items[itemId] ?? 0) + count;
        return true;
      },
      getItemCount: (itemId) => items[itemId] ?? 0,
      getItemName: (itemId) => itemId,
      now: () => now,
      random,
    }),
    advance: (ms) => { now += ms; },
  };
}

const recipe = {
  id: "powder",
  inputItemId: "ore",
  inputCount: 2,
  outputItemId: "powder",
  outputCount: 1,
  successMessage: "crafted",
};

test("crafts refinery recipes and restores materials when output cannot fit", () => {
  const items = { ore: 2 };
  const { runtime } = createRuntime(items);
  assert.equal(runtime.craftRefineryRecipe(recipe).ok, true);
  assert.deepEqual(items, { ore: 0, powder: 1 });

  const blockedItems = { ore: 2 };
  const { runtime: blockedRuntime } = createRuntime(blockedItems, { canAdd: false });
  assert.equal(blockedRuntime.craftRefineryRecipe(recipe).kind, "inventory-full");
  assert.equal(blockedItems.ore, 2);
});

test("starts and resolves a forge upgrade through one pending state", () => {
  const items = { stoneDust: 3 };
  const { runtime } = createRuntime(items, { random: () => 0 });
  const upgradeState = {
    itemId: "pickaxe",
    name: "Pickaxe",
    level: 1,
    next: { level: 2, cost: 2, successChance: 1 },
  };
  const started = runtime.beginForgeUpgrade(upgradeState, 500);
  assert.equal(started.ok, true);
  assert.equal(items.stoneDust, 1);
  assert.equal(runtime.beginForgeUpgrade(upgradeState, 500).ok, false);

  const completed = runtime.finishForgeUpgrade();
  assert.equal(completed.resultPlan.success, true);
  assert.equal(runtime.pendingForgeUpgrade, null);
});
