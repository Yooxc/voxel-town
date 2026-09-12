import test from "node:test";
import assert from "node:assert/strict";
import { createFlowerCrownQuestController } from "../src/systems/flowerCrownQuestController.js";

function createHarness({ grass = 0, flower = 0, addSucceeds = true } = {}) {
  const state = { flowerCrownQuest: { started: false, completed: false } };
  const inventory = { wildGrass: grass, wildFlower: flower, flowerCrown: 0 };
  const controller = createFlowerCrownQuestController({
    getOnboardingState: () => state,
    startQuest: () => {
      if (state.flowerCrownQuest.started) return false;
      state.flowerCrownQuest.started = true;
      return true;
    },
    completeQuest: () => {
      if (state.flowerCrownQuest.completed) return false;
      state.flowerCrownQuest.completed = true;
      return true;
    },
    getItemCount: (itemId) => inventory[itemId] ?? 0,
    consumeItem: (itemId, count) => {
      if ((inventory[itemId] ?? 0) < count) return false;
      inventory[itemId] -= count;
      return true;
    },
    addItem: (itemId, count) => {
      if (itemId === "flowerCrown" && !addSucceeds) return false;
      inventory[itemId] = (inventory[itemId] ?? 0) + count;
      return true;
    },
  });
  return { controller, inventory, state };
}

test("tracks pre-collected materials and completes the flower crown exchange once", () => {
  const harness = createHarness({ grass: 4, flower: 2 });
  harness.controller.begin();

  assert.equal(harness.controller.getStatus().ready, true);
  assert.equal(harness.controller.craft().ok, true);
  assert.deepEqual(harness.inventory, { wildGrass: 1, wildFlower: 0, flowerCrown: 1 });
  assert.equal(harness.state.flowerCrownQuest.completed, true);
  assert.equal(harness.controller.craft().reason, "already-completed");
});

test("keeps materials and quest progress when the reward cannot fit", () => {
  const harness = createHarness({ grass: 3, flower: 2, addSucceeds: false });
  harness.controller.begin();

  assert.equal(harness.controller.craft().reason, "inventory-full");
  assert.deepEqual(harness.inventory, { wildGrass: 3, wildFlower: 2, flowerCrown: 0 });
  assert.equal(harness.state.flowerCrownQuest.completed, false);
});

test("shows live material counts and sends a ready player back to Raon", () => {
  const harness = createHarness({ grass: 3, flower: 1 });
  harness.controller.begin();
  assert.match(harness.controller.getProgressView().status, /풀과 꽃/);
  harness.inventory.wildFlower = 2;
  assert.equal(harness.controller.getProgressView().status, "라온에게 돌아가세요");
});
