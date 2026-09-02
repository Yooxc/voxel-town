import test from "node:test";
import assert from "node:assert/strict";
import { createMapGateProgressionCoordinator } from "../src/world/mapGateProgressionCoordinator.js";

test("unlocks a gate, removes its blocker, and persists progress", () => {
  const inventory = {};
  let removed = 0;
  let saved = 0;
  const coordinator = createMapGateProgressionCoordinator({
    getInventory: () => inventory, hasItem: () => true, consumeItem: () => true,
    getColliderIndex: () => 3, removeCollider: () => { removed += 1; },
    updateInventoryUi: () => {}, renderQuestIfOpen: () => {}, scheduleSave: () => { saved += 1; },
    showUi: () => {}, setLastMessageUntil: () => {}, now: () => 0,
  });
  const gate = { unlockWithItem: "key", unlockFlag: "opened", lockBlocker: { parent: { remove() {} }, removeFromParent() { this.parent = null; } } };
  assert.equal(coordinator.unlock(gate), true);
  assert.equal(inventory.opened, true);
  assert.equal(removed, 1);
  assert.equal(saved, 1);
});
