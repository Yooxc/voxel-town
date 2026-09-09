import test from "node:test";
import assert from "node:assert/strict";
import { createMultiplayerPresenceController } from "../src/systems/multiplayerPresenceController.js";

test("queues a tour request and includes it in the next presence sync", async () => {
  let time = 0;
  const calls = [];
  const controller = createMultiplayerPresenceController({
    client: {
      sync: async (payload) => {
        calls.push(payload);
        return { ok: true, selfId: "local:dev:one", players: [], guides: [] };
      },
      leave: async () => ({ ok: true }),
    },
    getEnabled: () => true,
    getIdentity: () => "dev:one",
    getDisplayName: () => "개발자1",
    getPlayerState: () => ({ x: 0, y: 0, z: 0, rotationY: 0, mapId: "광산", sprinting: false }),
    onSnapshot: () => {},
    now: () => time,
  });

  assert.equal(controller.requestTour("work-area"), true);
  controller.update();
  await Promise.resolve();
  assert.equal(calls[0].command.checkpointId, "work-area");
});
