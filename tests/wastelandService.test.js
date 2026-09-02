import test from "node:test";
import assert from "node:assert/strict";

import {
  placeWastelandStructureInWorld,
  removeWastelandStructureFromWorld,
  toggleWastelandDoorInWorld,
} from "../src/systems/wastelandBuilding.js";

function createWorld() {
  return {
    revision: 0,
    foundations: [{
      id: "foundation-1",
      ownerId: "owner-1",
      landId: "land-1",
      status: "completed",
      bounds: { minRow: 0, maxRow: 4, minCol: 0, maxCol: 4 },
    }],
    structures: [],
    terrainDepthByCell: {},
  };
}

test("server places one owned structure per canonical cell edge", () => {
  const world = createWorld();
  world.structures.push(
    { key: "floor-1", ownerId: "owner-1", row: 1, col: 1, level: 0, slot: "floor" },
    { key: "floor-2", ownerId: "owner-1", row: 1, col: 2, level: 0, slot: "floor" },
  );
  const first = placeWastelandStructureInWorld({
    world,
    ownerId: "owner-1",
    action: { type: "structure.place", foundationId: "foundation-1", itemId: "woodWall", row: 1, col: 1, rotationQuarter: 1, cellSize: 2 },
    createId: () => "wall-1",
    now: () => 100,
  });
  const conflict = placeWastelandStructureInWorld({
    world,
    ownerId: "owner-1",
    action: { type: "structure.place", foundationId: "foundation-1", itemId: "stoneWall", row: 1, col: 2, rotationQuarter: 3, cellSize: 2 },
    createId: () => "wall-2",
  });

  assert.equal(first.ok, true);
  assert.equal(first.structure.key, "wasteland_structure_wall-1");
  assert.equal(first.structure.placementKey, "wall:v:1:2");
  assert.equal(first.structure.ownerId, "owner-1");
  assert.equal(conflict.ok, false);
  assert.equal(conflict.status, 409);
  assert.equal(world.structures.length, 3);
});

test("server allows stairs across required floors only on the first level", () => {
  const world = createWorld();
  const place = (itemId, row, col, level = 0, rotationQuarter = 0) => placeWastelandStructureInWorld({
    world,
    ownerId: "owner-1",
    action: {
      type: "structure.place",
      foundationId: "foundation-1",
      itemId,
      row,
      col,
      level,
      rotationQuarter,
      cellSize: 2,
    },
  });

  assert.equal(place("woodFloor", 2, 2).ok, true);
  assert.equal(place("woodFloor", 2, 3).ok, true);
  assert.equal(place("woodFloor", 2, 4).ok, true);
  assert.equal(place("woodFloor", 2, 4, 1).ok, true);
  const stairs = place("woodStairs", 2, 2, 0, 1);
  const upperStairs = place("stoneStairs", 2, 2, 1, 1);

  assert.equal(stairs.ok, true);
  assert.deepEqual(stairs.structure.footprintCells, [{ row: 2, col: 2 }, { row: 2, col: 3 }]);
  assert.equal(upperStairs.ok, false);
  assert.match(upperStairs.error, /1층에서만/);
});

test("server rejects a stair when its start cell is covered by an upper floor", () => {
  const world = createWorld();
  world.structures.push(
    { key: "start-floor", ownerId: "owner-1", row: 2, col: 2, level: 0, slot: "floor" },
    { key: "landing-floor", ownerId: "owner-1", row: 2, col: 4, level: 1, slot: "floor" },
    { key: "blocked-start", ownerId: "owner-1", row: 2, col: 2, level: 1, slot: "floor" },
  );
  const result = placeWastelandStructureInWorld({
    world,
    ownerId: "owner-1",
    action: { foundationId: "foundation-1", itemId: "woodStairs", row: 2, col: 2, rotationQuarter: 1, cellSize: 2 },
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /시작점 위/);
});

test("server toggles only an owned door", () => {
  const world = createWorld();
  world.structures.push({ key: "floor-1", ownerId: "owner-1", row: 2, col: 2, level: 0, slot: "floor" });
  const placement = placeWastelandStructureInWorld({
    world,
    ownerId: "owner-1",
    action: { type: "structure.place", foundationId: "foundation-1", itemId: "woodDoor", row: 2, col: 2, rotationQuarter: 0 },
    createId: () => "door-1",
  });
  const denied = toggleWastelandDoorInWorld({
    world,
    ownerId: "owner-2",
    action: { structureKey: placement.structure.key },
  });
  const toggled = toggleWastelandDoorInWorld({
    world,
    ownerId: "owner-1",
    action: { structureKey: placement.structure.key },
  });

  assert.equal(placement.structure.structureKind, "door");
  assert.equal(denied.status, 403);
  assert.equal(toggled.ok, true);
  assert.equal(toggled.structure.isOpen, true);
});

test("server rejects foreign foundations and foreign demolition", () => {
  const world = createWorld();
  const deniedPlacement = placeWastelandStructureInWorld({
    world,
    ownerId: "owner-2",
    action: { type: "structure.place", foundationId: "foundation-1", itemId: "woodFloor", row: 1, col: 1 },
  });
  world.structures.push({ key: "owned-wall", ownerId: "owner-1", type: "woodWall" });
  const deniedRemoval = removeWastelandStructureFromWorld({
    world,
    ownerId: "owner-2",
    action: { type: "structure.remove", structureKey: "owned-wall" },
  });
  const removal = removeWastelandStructureFromWorld({
    world,
    ownerId: "owner-1",
    action: { type: "structure.remove", structureKey: "owned-wall" },
  });

  assert.equal(deniedPlacement.status, 403);
  assert.equal(deniedRemoval.status, 403);
  assert.equal(removal.ok, true);
  assert.equal(world.structures.length, 0);
});

test("server blocks demolition of a floor supporting an upper floor or wall", () => {
  const world = createWorld();
  world.structures.push(
    { key: "floor-1", ownerId: "owner-1", row: 2, col: 2, level: 0, slot: "floor" },
    { key: "wall-1", ownerId: "owner-1", row: 2, col: 2, level: 0, slot: "wall" },
    { key: "floor-2", ownerId: "owner-1", row: 2, col: 2, level: 1, slot: "floor" },
  );
  const removal = removeWastelandStructureFromWorld({
    world,
    ownerId: "owner-1",
    action: { type: "structure.remove", structureKey: "floor-1" },
  });

  assert.equal(removal.ok, false);
  assert.equal(removal.status, 409);
  assert.match(removal.error, /지지하고 있어/);
  assert.equal(world.structures.length, 3);
});
