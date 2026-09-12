import test from "node:test";
import assert from "node:assert/strict";
import { createGatheringController } from "../src/systems/gatheringController.js";

function createHarness({ canReceive = true, claimResult = null } = {}) {
  let time = 0;
  const position = { x: 0, y: 0, z: 0 };
  const plant = { id: "grass-1", kind: "grass", itemId: "wildGrass" };
  const calls = { claims: 0, added: 0, snapshots: 0, messages: [] };
  let active = true;
  const controller = createGatheringController({
    getPlayerPosition: () => position,
    getCurrentMapId: () => "광산",
    findNearestPlant: () => (active ? plant : null),
    isPlantActive: () => active,
    canReceiveItem: () => canReceive,
    claimPlant: async () => {
      calls.claims += 1;
      return claimResult ?? {
        ok: true, resourceId: plant.id, itemId: plant.itemId, count: 1,
        gathering: { plants: [] },
      };
    },
    addItem: (_itemId, count) => { calls.added += count; return true; },
    applySnapshot: () => { calls.snapshots += 1; active = false; },
    notify: (message) => calls.messages.push(message),
    now: () => time,
    durationMs: 1000,
    createRequestId: () => "request-1",
  });
  return { controller, calls, position, setTime: (value) => { time = value; } };
}

test("completes a one-second gathering action and grants one item", async () => {
  const harness = createHarness();
  assert.equal(harness.controller.begin(), true);

  harness.setTime(999);
  harness.controller.update();
  assert.equal(harness.calls.claims, 0);

  harness.setTime(1000);
  harness.controller.update();
  await Promise.resolve();

  assert.equal(harness.calls.claims, 1);
  assert.equal(harness.calls.added, 1);
  assert.equal(harness.calls.snapshots, 1);
  assert.equal(harness.controller.isActive(), false);
});

test("cancels gathering when the player moves", () => {
  const harness = createHarness();
  harness.controller.begin();
  harness.position.x = 0.5;
  harness.controller.update();

  assert.equal(harness.controller.isActive(), false);
  assert.equal(harness.calls.claims, 0);
  assert.match(harness.calls.messages.at(-1), /취소/);
});

test("does not start gathering when inventory cannot receive the item", () => {
  const harness = createHarness({ canReceive: false });

  assert.equal(harness.controller.begin(), true);
  assert.equal(harness.controller.isActive(), false);
  assert.match(harness.calls.messages.at(-1), /인벤토리/);
});

test("does not grant an item when another player gathers first", async () => {
  const harness = createHarness({ claimResult: { ok: false, error: "이미 다른 사람이 채집했습니다." } });
  harness.controller.begin();
  harness.setTime(1000);
  harness.controller.update();
  await Promise.resolve();

  assert.equal(harness.calls.added, 0);
  assert.match(harness.calls.messages.at(-1), /다른 사람/);
});
