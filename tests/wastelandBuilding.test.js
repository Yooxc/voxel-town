import test from "node:test";
import assert from "node:assert/strict";

import {
  WASTELAND_BUILD_PART_DEFS,
  isWastelandBuildPartItemId,
  getWastelandBuildPartDef,
  getWastelandBuildPalettePartDefs,
  getWastelandWallEdge,
  getWastelandStructurePlacementKey,
  getWastelandStructureFootprintCells,
  getWastelandStairLandingCell,
  getWastelandStairVisualRotation,
  getWastelandStructureSlotLabel,
  getWastelandStructureSurfaceY,
  getWastelandStructureRotationQuarter,
  getWastelandBuildModeEligibility,
  getWastelandStructureDependencyError,
  getWastelandStructureRemovalDependencyError,
  normalizeWastelandStructureCollection,
  getWastelandBuildingInspection,
  WASTELAND_DOOR_HEADER_HEIGHT,
  WASTELAND_DOOR_OPENING_HEIGHT,
  WASTELAND_STORY_HEIGHT,
  WASTELAND_WINDOW_HEADER_HEIGHT,
  WASTELAND_WINDOW_OPENING_HEIGHT,
  WASTELAND_WINDOW_SILL_HEIGHT,
  WASTELAND_MAX_BUILD_LEVEL,
  WASTELAND_ROOF_MAX_SPAN,
} from "../src/systems/wastelandBuilding.js";

test("provides wasteland build part definitions and slot labels", () => {
  assert.equal(WASTELAND_BUILD_PART_DEFS.woodFloor.slot, "floor");
  assert.equal(WASTELAND_BUILD_PART_DEFS.woodFloor.blocksMovement, undefined);
  assert.equal(WASTELAND_BUILD_PART_DEFS.woodFloor.walkable, true);
  assert.equal(WASTELAND_BUILD_PART_DEFS.woodStairs.walkable, true);
  assert.equal(WASTELAND_BUILD_PART_DEFS.woodStairs.blocksMovement, undefined);
  assert.equal(WASTELAND_BUILD_PART_DEFS.woodWall.blocksMovement, true);
  assert.equal(WASTELAND_BUILD_PART_DEFS.stoneWall.blocksMovement, true);
  assert.equal(WASTELAND_BUILD_PART_DEFS.woodDoor.structureKind, "door");
  assert.equal(WASTELAND_BUILD_PART_DEFS.stoneWindow.structureKind, "window");
  assert.equal(isWastelandBuildPartItemId("stoneWall"), true);
  assert.equal(isWastelandBuildPartItemId("missing"), false);
  assert.equal(getWastelandBuildPartDef("woodPillar")?.label, "목재 기둥");
  assert.equal(getWastelandBuildPartDef("missing"), null);
  assert.equal(getWastelandStructureSlotLabel("wall"), "벽");
  assert.equal(getWastelandStructureSlotLabel("stairs"), "계단");
  assert.equal(getWastelandStructureSlotLabel("missing"), "건축");
  assert.equal(getWastelandBuildPalettePartDefs().some((part) => part.id === "woodPillar"), false);
  assert.equal(getWastelandBuildPalettePartDefs().some((part) => part.itemId === "woodDoor"), true);
  assert.equal(getWastelandBuildPalettePartDefs().some((part) => part.itemId === "stoneWindow"), true);
  assert.equal(WASTELAND_STORY_HEIGHT, 3.2);
  assert.equal(WASTELAND_DOOR_OPENING_HEIGHT, 2.7);
  assert.equal(WASTELAND_WINDOW_SILL_HEIGHT, 1.15);
  assert.equal(WASTELAND_WINDOW_OPENING_HEIGHT, 1.35);
  assert.ok(Math.abs(WASTELAND_WINDOW_HEADER_HEIGHT - 0.7) < 0.000001);
  assert.equal(WASTELAND_DOOR_OPENING_HEIGHT + WASTELAND_DOOR_HEADER_HEIGHT, WASTELAND_STORY_HEIGHT);
  assert.equal(WASTELAND_WINDOW_SILL_HEIGHT + WASTELAND_WINDOW_OPENING_HEIGHT + WASTELAND_WINDOW_HEADER_HEIGHT, WASTELAND_STORY_HEIGHT);
});

test("requires an owned completed claim, foundation, and land deed for build mode", () => {
  const ownerId = "dev-1";
  const claim = { ownerId, status: "completed" };
  const foundation = { ownerId, status: "completed" };
  assert.equal(getWastelandBuildModeEligibility({ ownerId, claim, foundation, hasLandDeed: true }).ok, true);
  assert.match(getWastelandBuildModeEligibility({ ownerId, claim: null, foundation, hasLandDeed: true }).reason, /개간/);
  assert.match(getWastelandBuildModeEligibility({ ownerId, claim, foundation: null, hasLandDeed: true }).reason, /기초/);
  assert.match(getWastelandBuildModeEligibility({ ownerId, claim, foundation, hasLandDeed: false }).reason, /토지권/);
});

test("calculates surface height from a cell mesh and wall rotation from yaw", () => {
  assert.equal(getWastelandStructureSurfaceY({ baseMesh: { position: { y: 0.4 } } }), 0.54);
  assert.equal(getWastelandStructureSurfaceY({ coverMesh: { position: { y: 0.3 } } }), 0.4);
  assert.equal(getWastelandStructureSurfaceY({}), 0.22);
  assert.equal(getWastelandStructureRotationQuarter(0), 0);
  assert.equal(getWastelandStructureRotationQuarter(Math.PI * 0.5), 1);
  assert.equal(getWastelandStructureRotationQuarter(-Math.PI * 0.5), 3);
});

test("normalizes wall rotations into shared cell-edge placement keys", () => {
  assert.equal(getWastelandWallEdge(-1), "west");
  assert.equal(
    getWastelandStructurePlacementKey({ cell: { row: 2, col: 3 }, slot: "wall", rotationQuarter: 1 }),
    "wall:v:2:4"
  );
  assert.equal(
    getWastelandStructurePlacementKey({ cell: { row: 2, col: 4 }, slot: "wall", rotationQuarter: 3 }),
    "wall:v:2:4"
  );
});

test("keeps stair visual rotation aligned with its logical landing cell", () => {
  assert.equal(getWastelandStairVisualRotation(0), 0);
  assert.equal(getWastelandStairVisualRotation(1), -Math.PI * 0.5);
  assert.equal(getWastelandStairVisualRotation(2), -Math.PI);
  assert.equal(getWastelandStairVisualRotation(3), -Math.PI * 1.5);
});

test("calculates the stair landing one cell beyond the two-cell stair footprint", () => {
  assert.deepEqual(getWastelandStairLandingCell({ row: 4, col: 4 }, 0), { row: 2, col: 4 });
  assert.deepEqual(getWastelandStairLandingCell({ row: 4, col: 4 }, 1), { row: 4, col: 6 });
  assert.deepEqual(getWastelandStairLandingCell({ row: 4, col: 4 }, 2), { row: 6, col: 4 });
  assert.deepEqual(getWastelandStairLandingCell({ row: 4, col: 4 }, 3), { row: 4, col: 2 });
});

test("requires a clear upper stair cell and a floor at the true landing in every direction", () => {
  const start = { row: 4, col: 4 };
  for (const rotationQuarter of [0, 1, 2, 3]) {
    const upper = getWastelandStructureFootprintCells(start, "stairs", rotationQuarter)[1];
    const landing = getWastelandStairLandingCell(start, rotationQuarter);
    const base = [{ ...start, slot: "floor", level: 0 }];
    assert.equal(
      getWastelandStructureDependencyError({
        structures: [...base, { ...landing, slot: "floor", level: 1 }],
        ...start,
        itemId: "woodStairs",
        rotationQuarter,
      }),
      "",
    );
    assert.match(
      getWastelandStructureDependencyError({
        structures: [...base, { ...upper, slot: "floor", level: 1 }],
        ...start,
        itemId: "woodStairs",
        rotationQuarter,
      }),
      /상부를 덮는/,
    );
  }
});

test("normalizes persisted structures and removes invalid or duplicate records", () => {
  const foundation = {
    ownerId: "dev-1",
    landId: "land-1",
    status: "completed",
    bounds: { minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 },
  };
  const result = normalizeWastelandStructureCollection({
    foundations: [foundation],
    structures: [
      { key: "floor", ownerId: "dev-1", landId: "land-1", type: "woodFloor", row: 1, col: 1, slot: "wall", rotationQuarter: 3, placementKey: "broken" },
      { key: "wall", ownerId: "dev-1", landId: "land-1", type: "woodWall", row: 1, col: 1, rotationQuarter: -1, placementKey: "broken" },
      { key: "duplicate-floor", ownerId: "dev-1", landId: "land-1", type: "stoneFloor", row: 1, col: 1 },
      { key: "unknown", ownerId: "dev-1", landId: "land-1", type: "missingPart", row: 1, col: 2 },
      { key: "outside", ownerId: "dev-1", landId: "land-1", type: "woodFloor", row: 8, col: 8 },
    ],
  });

  assert.deepEqual(result.structures.map((structure) => structure.key), ["floor", "wall"]);
  assert.equal(result.structures[0].slot, "floor");
  assert.equal(result.structures[0].rotationQuarter, 0);
  assert.equal(result.structures[0].placementKey, "floor:1:1");
  assert.equal(result.structures[1].rotationQuarter, 3);
  assert.equal(result.structures[1].edge, "west");
  assert.equal(result.dropped.length, 3);
});

test("removes structures whose required support is absent from persisted data", () => {
  const result = normalizeWastelandStructureCollection({
    foundations: [{
      ownerId: "dev-1",
      landId: "land-1",
      status: "completed",
      bounds: { minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 },
    }],
    structures: [{
      key: "unsupported-wall",
      ownerId: "dev-1",
      landId: "land-1",
      type: "woodWall",
      row: 1,
      col: 1,
    }],
  });

  assert.deepEqual(result.structures, []);
  assert.deepEqual(result.dropped, [{ key: "unsupported-wall", reason: "dependency-invalid" }]);
});

test("separates upper-floor placement keys and prerequisites", () => {
  assert.equal(WASTELAND_MAX_BUILD_LEVEL, 1);
  assert.equal(
    getWastelandStructurePlacementKey({ cell: { row: 2, col: 3 }, slot: "floor", level: 0 }),
    "floor:2:3",
  );
  assert.equal(
    getWastelandStructurePlacementKey({ cell: { row: 2, col: 3 }, slot: "floor", level: 1 }),
    "floor:1:2:3",
  );
  assert.match(
    getWastelandStructureDependencyError({ structures: [], row: 2, col: 3, itemId: "woodFloor", level: 1 }),
    /1층 바닥/,
  );
  assert.equal(
    getWastelandStructureDependencyError({
      structures: [{ row: 2, col: 3, slot: "floor", level: 0 }],
      row: 2,
      col: 3,
      itemId: "woodFloor",
      level: 1,
    }),
    "",
  );
  assert.equal(
    getWastelandStructureDependencyError({
      structures: [
        { row: 2, col: 3, slot: "floor", level: 0 },
        { row: 2, col: 5, slot: "floor", level: 1 },
      ],
      row: 2,
      col: 3,
      itemId: "woodStairs",
      level: 0,
      rotationQuarter: 1,
    }),
    "",
  );
  assert.match(
    getWastelandStructureDependencyError({
      structures: [
        { row: 2, col: 3, slot: "floor", level: 0 },
        { row: 2, col: 4, slot: "floor", level: 1 },
      ],
      row: 2,
      col: 3,
      itemId: "woodStairs",
      level: 0,
      rotationQuarter: 1,
    }),
    /상부를 덮는/,
  );
  assert.match(
    getWastelandStructureDependencyError({
      structures: [
        { row: 2, col: 3, slot: "floor", level: 0 },
        { row: 2, col: 3, slot: "floor", level: 1 },
        { row: 2, col: 5, slot: "floor", level: 1 },
      ],
      row: 2,
      col: 3,
      itemId: "woodStairs",
      level: 0,
      rotationQuarter: 1,
    }),
    /시작점 위/,
  );
  assert.equal(
    getWastelandStructureDependencyError({
      structures: [
        { row: 2, col: 3, slot: "floor", level: 0 },
        { row: 2, col: 5, slot: "floor", level: 1 },
      ],
      row: 2,
      col: 3,
      itemId: "woodStairs",
      level: 0,
      rotationQuarter: 1,
    }),
    "",
  );
  assert.match(
    getWastelandStructureDependencyError({
      structures: [
        { row: 2, col: 3, slot: "floor", level: 0 },
        { row: 2, col: 5, slot: "floor", level: 1 },
        { row: 2, col: 3, slot: "wall", level: 0, rotationQuarter: 1 },
      ],
      row: 2,
      col: 3,
      itemId: "woodStairs",
      level: 0,
      rotationQuarter: 1,
    }),
    /진행 경로/,
  );
  assert.match(
    getWastelandStructureDependencyError({
      structures: [
        { row: 2, col: 3, slot: "floor", level: 0 },
        { row: 2, col: 5, slot: "floor", level: 1 },
        { row: 2, col: 3, slot: "roof", level: 0 },
      ],
      row: 2,
      col: 3,
      itemId: "woodStairs",
      level: 0,
      rotationQuarter: 1,
    }),
    /천장 공간/,
  );
  assert.match(
    getWastelandStructureDependencyError({
      structures: [
        { row: 2, col: 3, slot: "floor", level: 0 },
        { row: 2, col: 5, slot: "floor", level: 1 },
      ],
      row: 2,
      col: 3,
      itemId: "woodStairs",
      level: 1,
      rotationQuarter: 1,
    }),
    /1층에서만/,
  );
});

test("requires a floor for first-floor walls and protects supporting floors from demolition", () => {
  assert.match(
    getWastelandStructureDependencyError({ structures: [], row: 2, col: 3, itemId: "woodWall", level: 0 }),
    /1층 바닥/,
  );
  const structures = [
    { key: "floor-1", row: 2, col: 3, level: 0, slot: "floor" },
    { key: "wall-1", row: 2, col: 3, level: 0, slot: "wall" },
    { key: "floor-2", row: 2, col: 3, level: 1, slot: "floor" },
  ];
  assert.equal(getWastelandStructureDependencyError({ structures, row: 2, col: 3, itemId: "woodWall", level: 0 }), "");
  assert.match(
    getWastelandStructureRemovalDependencyError({ structures, structureKey: "floor-1" }),
    /지지하고 있어/,
  );
  assert.equal(getWastelandStructureRemovalDependencyError({ structures, structureKey: "wall-1" }), "");
});

test("requires supported roofs and identifies a completed enclosed building", () => {
  assert.match(
    getWastelandStructureDependencyError({
      structures: [{ row: 2, col: 2, level: 0, slot: "floor" }],
      row: 2,
      col: 2,
      itemId: "woodRoof",
      level: 0,
    }),
    /벽에서/,
  );
  const structures = [
    { key: "floor", ownerId: "dev-1", row: 2, col: 2, level: 0, slot: "floor", type: "woodFloor" },
    { key: "north", ownerId: "dev-1", row: 2, col: 2, level: 0, slot: "wall", type: "woodWall", rotationQuarter: 0 },
    { key: "east", ownerId: "dev-1", row: 2, col: 2, level: 0, slot: "wall", type: "woodWall", rotationQuarter: 1 },
    { key: "south", ownerId: "dev-1", row: 2, col: 2, level: 0, slot: "wall", type: "woodWall", rotationQuarter: 2 },
    { key: "door", ownerId: "dev-1", row: 2, col: 2, level: 0, slot: "wall", structureKind: "door", type: "woodDoor", rotationQuarter: 3 },
    { key: "roof", ownerId: "dev-1", row: 2, col: 2, level: 0, slot: "roof", type: "woodRoof" },
  ];
  assert.equal(WASTELAND_ROOF_MAX_SPAN, 2);
  assert.equal(getWastelandStructureDependencyError({ structures, row: 2, col: 2, itemId: "woodRoof", level: 0 }), "");
  assert.equal(getWastelandBuildingInspection({ structures, ownerId: "dev-1" }).ok, true);
  const soleRoofSupport = structures.filter((structure) => ["floor", "north", "roof"].includes(structure.key));
  assert.match(getWastelandStructureRemovalDependencyError({ structures: soleRoofSupport, structureKey: "north" }), /지붕/);
});
