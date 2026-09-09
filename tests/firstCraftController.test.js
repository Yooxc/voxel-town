import test from "node:test";
import assert from "node:assert/strict";
import { createFirstCraftController } from "../src/systems/firstCraftController.js";

function createHarness({
  stoneDust = 3,
  addSucceeds = true,
  pickaxeOwned = false,
  pickaxeEquipped = false,
  inMineArea = false,
} = {}) {
  const state = { firstCraft: { started: false, completed: false, mineVisited: false } };
  const inventory = { stoneDust, stoneCup: 0 };
  let renders = 0;
  const controller = createFirstCraftController({
    getOnboardingState: () => state,
    startFirstCraft: () => {
      if (state.firstCraft.started) return false;
      state.firstCraft.started = true;
      return true;
    },
    completeFirstCraft: () => {
      if (state.firstCraft.completed) return false;
      state.firstCraft = { ...state.firstCraft, started: true, completed: true };
      return true;
    },
    getItemCount: (itemId) => inventory[itemId] ?? 0,
    consumeItem: (itemId, count) => {
      if ((inventory[itemId] ?? 0) < count) return false;
      inventory[itemId] -= count;
      return true;
    },
    addItem: (itemId, count) => {
      if (itemId === "stoneCup" && !addSucceeds) return false;
      inventory[itemId] = (inventory[itemId] ?? 0) + count;
      return true;
    },
    updateInventoryUi: () => { renders += 1; },
    hasOwnedPickaxe: () => pickaxeOwned,
    hasEquippedPickaxe: () => pickaxeEquipped,
    isInMineArea: () => inMineArea,
    recordMineVisit: () => {
      if (state.firstCraft.mineVisited) return false;
      state.firstCraft.mineVisited = true;
      return true;
    },
  });
  return { controller, inventory, state, getRenders: () => renders };
}

test("crafts one stone cup and completes the first craft", () => {
  const harness = createHarness();
  assert.equal(harness.controller.begin().started, true);

  assert.equal(harness.controller.craft().ok, true);
  assert.deepEqual(harness.inventory, { stoneDust: 0, stoneCup: 1 });
  assert.equal(harness.state.firstCraft.completed, true);
  assert.equal(harness.getRenders(), 1);
});

test("does not consume materials when the first craft lacks stone dust", () => {
  const harness = createHarness({ stoneDust: 2 });
  const result = harness.controller.craft();

  assert.equal(result.reason, "missing-materials");
  assert.deepEqual(harness.inventory, { stoneDust: 2, stoneCup: 0 });
  assert.equal(harness.state.firstCraft.completed, false);
});

test("restores materials when the stone cup cannot fit in inventory", () => {
  const harness = createHarness({ stoneDust: 4, addSucceeds: false });
  const result = harness.controller.craft();

  assert.equal(result.reason, "inventory-full");
  assert.deepEqual(harness.inventory, { stoneDust: 4, stoneCup: 0 });
  assert.equal(harness.state.firstCraft.completed, false);
  assert.equal(harness.getRenders(), 1);
});

test("does not grant another cup after completion", () => {
  const harness = createHarness({ stoneDust: 6 });
  assert.equal(harness.controller.craft().ok, true);

  const repeated = harness.controller.craft();
  assert.equal(repeated.reason, "already-completed");
  assert.deepEqual(harness.inventory, { stoneDust: 3, stoneCup: 1 });
});

test("shows the first craft preparation steps and records the mine visit", () => {
  const harness = createHarness({
    stoneDust: 0,
    pickaxeOwned: true,
    pickaxeEquipped: true,
    inMineArea: true,
  });
  harness.controller.begin();

  assert.equal(harness.controller.updatePlayerPosition({ x: 1, z: 1 }, "광산"), true);
  const view = harness.controller.getProgressView();

  assert.equal(harness.state.firstCraft.mineVisited, true);
  assert.match(view.objectives[0].display, /곡괭이 1\/1/);
  assert.match(view.objectives[1].display, /O/);
  assert.match(view.objectives[2].display, /O/);
  assert.match(view.objectives[3].display, /O/);
  assert.match(view.objectives[4].display, /0\/3/);
  assert.match(view.status, /Space/);
});

test("sends a prepared visitor back to Se-a before equipment checks", () => {
  const harness = createHarness({ stoneDust: 3 });
  harness.controller.begin();

  assert.match(harness.controller.getProgressView().status, /세아에게 돌아가세요/);
});
