import test from "node:test";
import assert from "node:assert/strict";
import { createInventoryController } from "../src/ui/inventoryController.js";

test("tracks inventory and personal storage UI state without retaining stale drag data", () => {
  const controller = createInventoryController();
  controller.setInventoryOpen(true);
  controller.setPersonalStorageOpen(true);
  controller.beginDrag({ source: "inventory", entry: { itemId: "stone", count: 3 } });

  assert.equal(controller.isInventoryOpen(), true);
  assert.equal(controller.isPersonalStorageOpen(), true);
  assert.equal(controller.getDragState().source, "inventory");

  controller.setPersonalStorageOpen(false);
  assert.equal(controller.getDragState(), null);
  assert.equal(controller.getTransferState(), null);
});

test("creates and validates personal storage transfer plans", () => {
  const controller = createInventoryController();
  const state = controller.openTransfer(
    { target: "storage", entry: { itemId: "stone", count: 4 } },
    (entry) => entry.count
  );

  assert.equal(state.maxCount, 4);
  assert.deepEqual(controller.getTransferCommitPlan("2"), {
    ok: true,
    target: "storage",
    entry: { itemId: "stone", count: 4 },
    maxCount: 4,
    count: 2,
  });
  assert.deepEqual(controller.getTransferCommitPlan("5"), {
    ok: false,
    reason: "invalid-count",
    maxCount: 4,
  });
});
