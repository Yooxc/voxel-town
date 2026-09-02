import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

import {
  createWastelandStructureMesh,
  createWastelandStructurePreviewMesh,
  getWastelandStructureOccupancyBounds,
  createWastelandFencePostMesh,
  createWastelandFenceLinkMesh,
  createWastelandPreviewCellMesh,
} from "../src/world/wastelandModels.js";
import {
  clampWastelandClearProgress,
  getWastelandCellVisualForProgress,
  syncWastelandCellStateFromProgress,
  applyWastelandCellVisual,
  applyWastelandCellHighlight,
  clearWastelandCellHighlight,
} from "../src/world/wastelandCells.js";
import {
  WASTELAND_DOOR_HEADER_HEIGHT,
  WASTELAND_STORY_HEIGHT,
  WASTELAND_WINDOW_HEADER_HEIGHT,
  WASTELAND_WINDOW_OPENING_HEIGHT,
  WASTELAND_WINDOW_SILL_HEIGHT,
} from "../src/systems/wastelandBuilding.js";

const buildPartDefs = {
  woodFloor: { slot: "floor" },
  stoneWall: { slot: "wall" },
  woodDoor: { slot: "wall", structureKind: "door" },
  stoneWindow: { slot: "wall", structureKind: "window" },
  woodStairs: { slot: "stairs", structureKind: "stairs" },
  woodPillar: { slot: "pillar" },
};

function getBuildPartDef(type) {
  return buildPartDefs[type] ?? null;
}

test("creates wasteland structures using the injected part definition lookup", () => {
  const mesh = createWastelandStructureMesh(
    {
      key: "wall-3-4",
      type: "stoneWall",
      row: 3,
      col: 4,
      x: 10,
      y: 1.4,
      z: -8,
      cellSize: 2,
      rotationQuarter: 1,
    },
    getBuildPartDef
  );

  assert.ok(mesh);
  assert.equal(mesh.name, "wasteland-structure-stoneWall-3-4");
  assert.equal(mesh.userData.wastelandStructureKey, "wall-3-4");
  assert.deepEqual(mesh.position.toArray(), [11, 1.42, -8]);
  assert.equal(mesh.rotation.y, Math.PI * 0.5);
  assert.equal(mesh.children.length, 3);
  assert.equal(mesh.children[0].geometry.parameters.height, WASTELAND_STORY_HEIGHT);
  const texture = mesh.children[0].material.map;
  assert.ok(texture);
  assert.equal(texture.format, THREE.RGBAFormat);
  assert.equal(texture.type, THREE.UnsignedByteType);
  assert.equal(texture.image.data.length, 32 * 32 * 4);
  assert.equal(mesh.children.every((child) => child.frustumCulled === false), true);
});

test("raises upper-floor structures by one story", () => {
  const mesh = createWastelandStructureMesh({
    key: "upper-floor", type: "woodFloor", row: 0, col: 0, x: 0, y: 0.5, z: 0,
    cellSize: 2, level: 1,
  }, getBuildPartDef);
  assert.equal(mesh.position.y, 0.5 + WASTELAND_STORY_HEIGHT + 0.035);
  assert.equal(mesh.userData.wastelandStructureLevel, 1);
});

test("creates translucent validity-colored structure previews", () => {
  const valid = createWastelandStructurePreviewMesh({
    type: "woodFloor", row: 1, col: 1, x: 2, y: -0.2, z: 3,
  }, getBuildPartDef, { valid: true });
  const invalid = createWastelandStructurePreviewMesh({
    type: "stoneWall", row: 1, col: 2, x: 4, y: -0.2, z: 3,
  }, getBuildPartDef, { valid: false });

  assert.equal(valid.userData.isWastelandStructurePreview, true);
  assert.equal(valid.children[0].material.opacity, 0.52);
  assert.equal(valid.children[0].material.color.getHex(), 0x52d681);
  assert.equal(invalid.children[0].material.color.getHex(), 0xf05b57);
  assert.equal(invalid.children[0].material.depthWrite, false);
});

test("creates hinged doors and framed windows on wall edges", () => {
  const door = createWastelandStructureMesh({
    key: "door-1", type: "woodDoor", row: 0, col: 0, x: 0, y: 0, z: 0,
    cellSize: 2, rotationQuarter: 0, isOpen: true,
  }, getBuildPartDef);
  const window = createWastelandStructureMesh({
    key: "window-1", type: "stoneWindow", row: 0, col: 1, x: 2, y: 0, z: 0,
    cellSize: 2, rotationQuarter: 1,
  }, getBuildPartDef);

  assert.equal(door.userData.wastelandStructureKind, "door");
  assert.equal(door.userData.wastelandDoorOpen, true);
  assert.equal(door.userData.wastelandDoorPivot.rotation.y, -Math.PI * 0.5);
  assert.equal(door.children[2].geometry.parameters.height, WASTELAND_DOOR_HEADER_HEIGHT);
  assert.equal(window.userData.wastelandStructureKind, "window");
  assert.equal(window.children[2].geometry.parameters.height, WASTELAND_WINDOW_SILL_HEIGHT);
  assert.equal(window.children[3].geometry.parameters.height, WASTELAND_WINDOW_HEADER_HEIGHT);
  const glass = window.children.find((child) => child.material?.transparent);
  assert.ok(glass);
  assert.equal(glass.material.depthTest, true);
  assert.equal(glass.material.depthWrite, false);
  assert.equal(glass.geometry.parameters.height, WASTELAND_WINDOW_OPENING_HEIGHT - 0.08);
  assert.deepEqual(window.position.toArray(), [3, 0.02, 0]);
});

test("creates a rear stair collider in addition to its side colliders", () => {
  const stairs = createWastelandStructureMesh({
    key: "stairs-1", type: "woodStairs", row: 0, col: 0, x: 0, y: 0, z: 0, cellSize: 2,
  }, getBuildPartDef);
  const colliders = [];
  stairs.traverse((child) => {
    if (child.userData?.isWastelandStairSideCollider || child.userData?.isWastelandStairRearCollider) {
      colliders.push(child);
    }
  });

  assert.equal(colliders.filter((child) => child.userData.isWastelandStairSideCollider).length, 2);
  assert.equal(colliders.filter((child) => child.userData.isWastelandStairRearCollider).length, 1);
});

test("orients east-west stairs and their exclusion bounds toward the logical landing cell", () => {
  const eastStairs = createWastelandStructureMesh({
    key: "stairs-east", type: "woodStairs", row: 0, col: 0, x: 0, y: 0, z: 0, cellSize: 2, rotationQuarter: 1,
  }, getBuildPartDef);
  const westStairs = getWastelandStructureOccupancyBounds({
    type: "woodStairs", x: 0, y: 0, z: 0, cellSize: 2, rotationQuarter: 3,
  }, getBuildPartDef);

  assert.equal(eastStairs.rotation.y, -Math.PI * 0.5);
  assert.ok(westStairs.minX < -2);
  assert.ok(westStairs.maxX > 0);
});

test("calculates player exclusion bounds for walls, stairs, and roofs but not floors", () => {
  const wall = getWastelandStructureOccupancyBounds({
    type: "stoneWall", x: 0, y: 0, z: 0, cellSize: 2, rotationQuarter: 1,
  }, getBuildPartDef);
  const stairs = getWastelandStructureOccupancyBounds({
    type: "woodStairs", x: 0, y: 0, z: 0, cellSize: 2, rotationQuarter: 0,
  }, getBuildPartDef);

  assert.ok(wall.minX < wall.maxX && wall.minZ < wall.maxZ);
  assert.ok(stairs.maxY - stairs.minY >= WASTELAND_STORY_HEIGHT);
  assert.equal(getWastelandStructureOccupancyBounds({ type: "woodFloor", x: 0, y: 0, z: 0 }, getBuildPartDef), null);
});

test("returns null for unknown or unsupported wasteland structure types", () => {
  assert.equal(createWastelandStructureMesh({ type: "missing" }, getBuildPartDef), null);
  assert.equal(
    createWastelandStructureMesh({ type: "woodFloor" }, () => ({ slot: "roof" })),
    null
  );
});

test("creates fence and claim preview meshes with stable dimensions", () => {
  const post = createWastelandFencePostMesh();
  const horizontalLink = createWastelandFenceLinkMesh(4, true);
  const verticalLink = createWastelandFenceLinkMesh(4, false);
  const preview = createWastelandPreviewCellMesh(
    { size: 2, x: 3, z: -5 },
    0xffffff,
    0.5,
    0.04
  );

  assert.equal(post.children.length, 2);
  assert.equal(horizontalLink.position.y, 0.62);
  assert.equal(verticalLink.position.y, 0.62);
  assert.deepEqual(preview.position.toArray(), [3, 0.19, -5]);
  assert.equal(preview.geometry.parameters.width, 1.74);
  assert.equal(preview.geometry.parameters.height, 0.04);
  assert.equal(preview.geometry.parameters.depth, 1.74);
});

test("synchronizes wasteland cell progress and applies its visual state", () => {
  const appliedColors = [];
  const appliedEmissiveColors = [];
  const cell = {
    clearProgress: 51.9,
    baseMesh: { visible: false },
    coverMesh: {
      visible: true,
      position: { y: 0 },
      scale: { y: 1 },
      material: {
        color: { set: (color) => appliedColors.push(color) },
        emissive: { set: (color) => appliedEmissiveColors.push(color) },
        emissiveIntensity: 0,
        opacity: 1,
        transparent: false,
        needsUpdate: false,
      },
    },
  };

  syncWastelandCellStateFromProgress(cell);
  assert.equal(cell.clearProgress, 51);
  assert.equal(cell.state, "dug2");
  assert.equal(cell.digStage, 2);
  assert.equal(clampWastelandClearProgress(145), 100);
  assert.equal(getWastelandCellVisualForProgress(100).visible, false);

  applyWastelandCellHighlight(cell);
  assert.equal(cell.baseMesh.visible, true);
  assert.equal(cell.coverMesh.visible, true);
  assert.equal(cell.coverMesh.material.emissiveIntensity, 0.28);
  assert.equal(appliedColors.length, 1);
  assert.deepEqual(appliedEmissiveColors, [0xffb13d]);

  clearWastelandCellHighlight(cell);
  assert.equal(cell.coverMesh.material.emissiveIntensity, 0);
  assert.deepEqual(appliedEmissiveColors, [0xffb13d, 0x000000]);
});

test("does not rebuild wasteland terrain during highlight frames", () => {
  let terrainUpdates = 0;
  const cell = {
    clearProgress: 25,
    baseMesh: { visible: true },
    coverMesh: {
      visible: true,
      position: { y: 0 },
      scale: { y: 1 },
      material: {
        color: { set() {} },
        emissive: { set() {} },
        emissiveIntensity: 0,
        opacity: 1,
        transparent: false,
        needsUpdate: false,
      },
    },
    terrainRuntime: {
      applyCellProgress() {
        terrainUpdates += 1;
      },
    },
  };

  applyWastelandCellVisual(cell);
  applyWastelandCellVisual(cell);

  assert.equal(terrainUpdates, 0);
  cell.clearProgress = 50;
  applyWastelandCellVisual(cell);
  assert.equal(terrainUpdates, 0);
});
