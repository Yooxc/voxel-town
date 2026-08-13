import test from "node:test";
import assert from "node:assert/strict";
import { createWastelandController } from "../src/ui/wastelandController.js";

test("keeps fence and structure placement modes mutually exclusive", () => {
  const controller = createWastelandController();

  assert.equal(controller.toggleFencePlacementMode(), true);
  assert.equal(controller.getSelectedStructureItemId(), "");
  assert.equal(controller.toggleStructurePlacement("woodFloor"), "woodFloor");
  assert.equal(controller.isFencePlacementMode(), false);
  assert.equal(controller.toggleFencePlacementMode(), true);
  assert.equal(controller.getSelectedStructureItemId(), "");
});

test("tracks claim dialog states independently", () => {
  const controller = createWastelandController();

  controller.openClaimConfirm();
  controller.openClaimCancel();
  controller.closeClaimConfirm();
  assert.equal(controller.isClaimConfirmOpen(), false);
  assert.equal(controller.isClaimCancelOpen(), true);
  controller.closeClaimCancel();
  controller.resetPlacementMode();
  assert.equal(controller.isClaimCancelOpen(), false);
  assert.equal(controller.isFencePlacementMode(), false);
});
