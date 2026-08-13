import test from "node:test";
import assert from "node:assert/strict";
import { createResourceWorldRuntime } from "../src/systems/resourceWorldRuntime.js";

function createRuntime({ schedule = () => {} } = {}) {
  const playerPosition = { x: 0, y: 0, z: 0 };
  const calls = { treeUpdates: 0, rockUpdates: 0, respawns: [] };
  const runtime = createResourceWorldRuntime({
    getPlayerPosition: () => playerPosition,
    findNearestByPosition: ({ entries, playerPosition: position, radius, isEligible }) =>
      entries.find((entry) => isEligible(entry) && Math.hypot(entry.position.x - position.x, entry.position.z - position.z) < radius) ?? null,
    setHarvestTreeActive: (tree, active) => { tree.userData.harvestDisabled = !active; },
    updateHarvestTrees: () => { calls.treeUpdates += 1; },
    updateRockFadeIns: (_rocks, dt) => { calls.rockUpdates += dt; },
    schedule,
    rockRespawnMs: 100,
    createRespawnRock: (spawn) => { calls.respawns.push(spawn); },
  });
  return { runtime, calls };
}

test("registers resources and finds nearby eligible targets", () => {
  const { runtime } = createRuntime();
  const rock = { parent: {}, position: { x: 1, z: 0 }, userData: {} };
  const tree = { parent: {}, position: { x: 1, z: 0 }, userData: {} };
  runtime.registerMineRock(rock);
  runtime.registerHarvestTree(tree);

  assert.equal(runtime.findNearestMineRock(), rock);
  assert.equal(runtime.findNearestHarvestTree(), tree);
  runtime.deactivateHarvestTree(tree);
  assert.equal(runtime.findNearestHarvestTree(), null);
  runtime.unregisterMineRock(rock);
  assert.equal(runtime.mineRocks.length, 0);
});

test("keeps tree, fade, and respawn updates under the runtime", () => {
  let scheduled = null;
  const { runtime, calls } = createRuntime({ schedule: (callback, delay) => { scheduled = { callback, delay }; } });
  runtime.updateHarvestTreeStates();
  runtime.updateRockFadeStates(0.25);
  runtime.scheduleRockRespawn({ mapId: "mine" });

  assert.equal(calls.treeUpdates, 1);
  assert.equal(calls.rockUpdates, 0.25);
  assert.equal(scheduled.delay, 100);
  scheduled.callback();
  assert.deepEqual(calls.respawns, [{ mapId: "mine" }]);
});
