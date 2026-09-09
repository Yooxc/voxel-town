import test from "node:test";
import assert from "node:assert/strict";
import { createSharedTourController } from "../src/systems/sharedTourController.js";

test("an idle guide sends activity questions back to Maru", () => {
  const guide = {
    id: "guide-1",
    entry: { role: "tour-guide", guideId: "guide-1" },
    root: { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } },
    origin: { x: 0, y: 0, z: 0 },
    leftArm: { rotation: {} }, rightArm: { rotation: {} }, leftLeg: { rotation: {} }, rightLeg: { rotation: {} },
  };
  const notices = [];
  const controller = createSharedTourController({
    guides: [guide],
    getSelfId: () => "player-1",
    startTour: () => {}, pauseTour: () => {}, completeTour: () => {}, requestAdvance: () => {},
    showDialog: () => {}, hideDialog: () => {}, notify: (text) => notices.push(text),
  });

  controller.applySnapshot({ guides: [{ id: "guide-1", status: "idle", ownerId: "", x: 0, y: 0, z: 0, rotationY: 0 }], selfId: "player-1" });
  assert.equal(guide.entry.hint, "안내소에서 대기 중");
  assert.deepEqual(controller.interact(guide.entry), { handled: true, action: "idle" });
  assert.match(notices[0], /마루/);
});

test("shows a follow prompt only while the assigned guide waits for the visitor", () => {
  const shown = [];
  let hidden = 0;
  const guide = {
    id: "guide-1", entry: { role: "tour-guide", guideId: "guide-1" },
    root: { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } }, origin: { x: 0, y: 0, z: 0 },
    leftArm: { rotation: {} }, rightArm: { rotation: {} }, leftLeg: { rotation: {} }, rightLeg: { rotation: {} },
  };
  const controller = createSharedTourController({
    guides: [guide], getSelfId: () => "player-1",
    startTour: () => {}, pauseTour: () => {}, completeTour: () => {}, requestAdvance: () => {},
    showDialog: (text) => shown.push(text), hideDialog: () => { hidden += 1; }, notify: () => {},
  });
  const snapshot = (status) => ({
    guides: [{ id: "guide-1", status, ownerId: "player-1", checkpointId: "rest-area", x: 0, y: 0, z: 0, rotationY: 0 }],
    selfId: "player-1",
  });

  controller.applySnapshot(snapshot("waiting_for_player"));
  controller.applySnapshot(snapshot("waiting_for_player"));
  assert.deepEqual(shown, ["저를 따라와주세요."]);
  controller.applySnapshot(snapshot("moving"));
  assert.equal(hidden, 1);
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
