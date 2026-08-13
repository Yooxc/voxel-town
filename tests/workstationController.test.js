import test from "node:test";
import assert from "node:assert/strict";
import { createWorkstationController } from "../src/ui/workstationController.js";

test("keeps forge and refinery panels mutually exclusive", () => {
  const controller = createWorkstationController();
  controller.setForgeOpen(true);
  assert.equal(controller.isForgeOpen(), true);
  controller.setRefineryOpen(true);
  assert.equal(controller.isForgeOpen(), false);
  assert.equal(controller.isRefineryOpen(), true);
});

test("clears the sleeping pose when the sleep dialog closes", () => {
  const controller = createWorkstationController();
  controller.beginSleep();
  assert.equal(controller.isSleepOpen(), true);
  assert.equal(controller.isSleepPoseActive(), true);
  controller.closeSleep();
  assert.equal(controller.isSleepOpen(), false);
  assert.equal(controller.isSleepPoseActive(), false);
});

test("opens the sleep dialog with the sleeping pose active", () => {
  const controller = createWorkstationController();
  const state = controller.openSleepDialog();

  assert.deepEqual(state, { sleepOpen: true, sleepPoseActive: true });
});
