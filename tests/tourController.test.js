import test from "node:test";
import assert from "node:assert/strict";
import { createTourController } from "../src/systems/tourController.js";

function createHarness({ tourStatus = "not_started", checkpointId = "" } = {}) {
  const state = { tourStatus, tourCheckpointId: checkpointId };
  const calls = [];
  const root = {
    position: {
      x: 10, y: 0, z: -7,
      set(x, y, z) { this.x = x; this.y = y; this.z = z; },
    },
    rotation: { y: 0 },
  };
  const makeLimb = () => ({ rotation: { x: 0 } });
  const entry = { role: "tour-guide", hint: "대기" };
  const guide = {
    root, entry,
    leftArm: makeLimb(), rightArm: makeLimb(), leftLeg: makeLimb(), rightLeg: makeLimb(),
    origin: { x: 10, y: 0, z: -7 },
    arrivalPath: [{ x: 2, y: 0, z: 0 }],
    checkpoints: [
      { id: "rest-area", position: { x: 2, y: 0, z: 0 }, text: "쉬는 곳" },
      { id: "work-area", position: { x: -2, y: 0, z: 1 }, text: "만드는 곳" },
    ],
  };
  const controller = createTourController({
    guide,
    getOnboardingState: () => state,
    startTour: (id) => { state.tourStatus = "in_progress"; state.tourCheckpointId = id; calls.push(["start", id]); },
    pauseTour: (id) => { state.tourStatus = "paused"; state.tourCheckpointId = id; calls.push(["pause", id]); },
    completeTour: (id) => { state.tourStatus = "completed"; state.tourCheckpointId = id; calls.push(["complete", id]); },
    getPlayerPosition: () => ({ x: 2, z: 0 }),
    getCurrentMapId: () => "광산",
    showDialog: (text) => calls.push(["dialog", text]),
    hideDialog: () => calls.push(["hide"]),
    notify: (text) => calls.push(["notify", text]),
    walkSpeed: 100,
  });
  return { controller, state, guide, calls };
}

test("keeps the guide at the office until requested, then walks to the player", () => {
  const harness = createHarness();
  assert.deepEqual(harness.guide.root.position, {
    x: 10, y: 0, z: -7, set: harness.guide.root.position.set,
  });

  assert.equal(harness.controller.requestTour(), true);
  assert.equal(harness.controller.getMode(), "arriving");
  assert.equal(harness.guide.root.position.x, 10);
  harness.controller.update(1);
  assert.equal(harness.controller.getMode(), "waiting");
  assert.equal(harness.guide.root.position.x, 2);
  assert.ok(harness.calls.some(([type, text]) => type === "dialog" && text === "쉬는 곳"));
});

test("advances checkpoints and returns to the office after completion", () => {
  const harness = createHarness();
  harness.controller.requestTour();
  harness.controller.update(1);
  harness.controller.interact(harness.guide.entry);
  harness.controller.update(1);
  harness.controller.interact(harness.guide.entry);

  assert.equal(harness.state.tourStatus, "completed");
  assert.equal(harness.controller.getMode(), "returning");
  harness.controller.update(1);
  assert.equal(harness.controller.getMode(), "idle");
  assert.equal(harness.guide.root.position.x, harness.guide.origin.x);
});

test("resumes from the saved checkpoint without replaying earlier dialogue", () => {
  const harness = createHarness({ tourStatus: "paused", checkpointId: "work-area" });
  harness.controller.requestTour();
  harness.controller.update(1);

  assert.equal(harness.controller.getMode(), "waiting");
  assert.ok(harness.calls.some(([type, text]) => type === "dialog" && text === "만드는 곳"));
  assert.ok(!harness.calls.some(([type, text]) => type === "dialog" && text === "쉬는 곳"));
});

test("closing checkpoint dialogue does not skip that checkpoint", () => {
  const harness = createHarness();
  harness.controller.requestTour();
  harness.controller.update(1);
  assert.equal(harness.controller.closeDialog(), true);
  const result = harness.controller.interact(harness.guide.entry);

  assert.equal(result.action, "repeat");
  assert.equal(harness.state.tourCheckpointId, "rest-area");
});
