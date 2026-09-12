import test from "node:test";
import assert from "node:assert/strict";
import { createGatheringService } from "../server/src/world/gatheringService.js";

function createRandom(seed = 7) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createService({ now }) {
  return createGatheringService({
    config: {
      mapId: "광산",
      interactionRadius: 2,
      minSpacing: 0.5,
      zones: [{ id: "meadow", minX: -10, maxX: 10, minZ: -10, maxZ: 10 }],
      types: [
        { kind: "grass", itemId: "wildGrass", count: 2, respawnMinMs: 1000, respawnMaxMs: 1000 },
        { kind: "flower", itemId: "wildFlower", count: 1, respawnMinMs: 2000, respawnMaxMs: 2000 },
      ],
    },
    now,
    random: createRandom(),
  });
}

test("creates the configured shared gathering population", () => {
  const service = createService({ now: () => 0 });
  const snapshot = service.getSnapshot();

  assert.equal(snapshot.plants.filter((plant) => plant.kind === "grass").length, 2);
  assert.equal(snapshot.plants.filter((plant) => plant.kind === "flower").length, 1);
  assert.equal(new Set(snapshot.plants.map((plant) => plant.id)).size, 3);
});

test("awards one collector, deduplicates retries, and respawns later", () => {
  let time = 0;
  const service = createService({ now: () => time });
  const plant = service.getSnapshot().plants.find((entry) => entry.kind === "grass");
  const player = { x: plant.x, y: plant.y, z: plant.z, mapId: "광산" };

  const first = service.gather({ identity: "player-1", resourceId: plant.id, requestId: "request-1", player });
  const retry = service.gather({ identity: "player-1", resourceId: plant.id, requestId: "request-1", player });
  const competing = service.gather({ identity: "player-2", resourceId: plant.id, requestId: "request-2", player });

  assert.equal(first.ok, true);
  assert.deepEqual(retry, first);
  assert.equal(competing.ok, false);
  assert.equal(service.getSnapshot().plants.some((entry) => entry.id === plant.id), false);

  time = 1001;
  const respawned = service.getSnapshot().plants.find((entry) => entry.id === plant.id);
  assert.ok(respawned);
});

test("rejects gathering from another map or outside the interaction radius", () => {
  const service = createService({ now: () => 0 });
  const plant = service.getSnapshot().plants[0];

  assert.equal(service.gather({
    identity: "player-1", resourceId: plant.id, requestId: "far", player: { x: 99, z: 99, mapId: "광산" },
  }).ok, false);
  assert.equal(service.gather({
    identity: "player-1", resourceId: plant.id, requestId: "map", player: { x: plant.x, z: plant.z, mapId: "폐광" },
  }).ok, false);
});
