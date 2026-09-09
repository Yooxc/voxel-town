import test from "node:test";
import assert from "node:assert/strict";
import { createSharedTourController } from "../src/systems/sharedTourController.js";

test("an idle guide can offer activity help after the visitor completes the tour", () => {
  const guide = {
    id: "guide-1",
    entry: { role: "tour-guide", guideId: "guide-1" },
    root: { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } },
    origin: { x: 0, y: 0, z: 0 },
    leftArm: { rotation: {} }, rightArm: { rotation: {} }, leftLeg: { rotation: {} }, rightLeg: { rotation: {} },
  };
  let helpRequests = 0;
  const controller = createSharedTourController({
    guides: [guide],
    getSelfId: () => "player-1",
    startTour: () => {}, pauseTour: () => {}, completeTour: () => {}, requestAdvance: () => {},
    getTourStatus: () => "completed",
    openActivityHelp: () => { helpRequests += 1; return true; },
    showDialog: () => {}, hideDialog: () => {}, notify: () => {},
  });

  controller.applySnapshot({ guides: [{ id: "guide-1", status: "idle", ownerId: "", x: 0, y: 0, z: 0, rotationY: 0 }], selfId: "player-1" });
  assert.equal(guide.entry.hint, "Space : 할 일 물어보기");
  assert.deepEqual(controller.interact(guide.entry), { handled: true, action: "activity-help" });
  assert.equal(helpRequests, 1);
});

test("shows the assigned guide name in the introduction", () => {
  const shown = [];
  const guide = {
    id: "guide-1",
    entry: { role: "tour-guide", guideId: "guide-1" },
    root: { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } },
    origin: { x: 0, y: 0, z: 0 },
    checkpoints: [{ id: "guide-intro", text: "이번 투어를 맡은 {guideName}입니다." }],
    leftArm: { rotation: {} }, rightArm: { rotation: {} }, leftLeg: { rotation: {} }, rightLeg: { rotation: {} },
  };
  const controller = createSharedTourController({
    guides: [guide],
    getSelfId: () => "player-1",
    startTour: () => {}, pauseTour: () => {}, completeTour: () => {}, requestAdvance: () => {},
    showDialog: (text) => shown.push(text), hideDialog: () => {}, notify: () => {},
  });

  controller.applySnapshot({
    guides: [{
      id: "guide-1", name: "다온", status: "waiting", ownerId: "player-1",
      checkpointId: "guide-intro", dialogVersion: 1, x: 0, y: 0, z: 0, rotationY: 0,
    }],
    selfId: "player-1",
  });

  assert.deepEqual(shown, ["이번 투어를 맡은 다온입니다."]);
});
