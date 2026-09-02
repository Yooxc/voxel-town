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

test("owns build mode selection and quarter-turn rotation state", () => {
  const controller = createWastelandController();

  controller.enterBuildMode("woodWall");
  assert.equal(controller.isBuildModeActive(), true);
  assert.equal(controller.getSelectedStructureItemId(), "woodWall");
  assert.equal(controller.rotateBuildPart(), 1);
  assert.equal(controller.rotateBuildPart(), 2);
  assert.equal(controller.selectBuildPart("stoneFloor"), "stoneFloor");

  controller.exitBuildMode();
  assert.equal(controller.isBuildModeActive(), false);
  assert.equal(controller.getSelectedStructureItemId(), "");
  assert.equal(controller.getBuildRotationQuarter(), 0);
});

test("tracks demolition mode and selected structures only while demolishing", () => {
  const controller = createWastelandController();
  controller.enterBuildMode("woodWall");
  assert.equal(controller.getBuildToolMode(), "place");
  assert.equal(controller.selectStructure("wall-1"), "");
  assert.equal(controller.setBuildToolMode("demolish"), "demolish");
  assert.equal(controller.isDemolishMode(), true);
  assert.equal(controller.selectStructure("wall-1"), "wall-1");
  controller.selectBuildPart("woodFloor");
  assert.equal(controller.getBuildToolMode(), "place");
  assert.equal(controller.getSelectedStructureKey(), "");
  controller.exitBuildMode();
  assert.equal(controller.isDemolishMode(), false);
});
