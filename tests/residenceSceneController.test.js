import assert from "node:assert/strict";
import test from "node:test";
import { createResidenceSceneController } from "../src/world/residenceSceneController.js";

test("forwards room lifecycle state and stores returned scene references", () => {
  let state = { root: "old" };
  const controller = createResidenceSceneController({
    getState: () => state,
    setState: (next) => { state = next; },
    destroyRoomInstance: ({ roomKey }) => ({ root: `destroyed-${roomKey}` }),
    createRoomInstance: ({ roomKey }) => ({ root: `created-${roomKey}`, instance: { roomKey } }),
  });
  controller.destroyRoom("101");
  assert.equal(state.root, "destroyed-101");
  assert.deepEqual(controller.createRoom("102"), { roomKey: "102" });
  assert.equal(state.root, "created-102");
});
