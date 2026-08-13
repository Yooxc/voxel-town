import test from "node:test";
import assert from "node:assert/strict";

import {
  createWastelandStructureMesh,
  createWastelandFencePostMesh,
  createWastelandFenceLinkMesh,
  createWastelandPreviewCellMesh,
} from "../src/world/wastelandModels.js";
import {
  clampWastelandClearProgress,
  getWastelandCellVisualForProgress,
  syncWastelandCellStateFromProgress,
  applyWastelandCellHighlight,
  clearWastelandCellHighlight,
} from "../src/world/wastelandCells.js";

const buildPartDefs = {
  woodFloor: { slot: "floor" },
  stoneWall: { slot: "wall" },
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
      rotationQuarter: 1,
    },
    getBuildPartDef
  );

  assert.ok(mesh);
  assert.equal(mesh.name, "wasteland-structure-stoneWall-3-4");
  assert.equal(mesh.userData.wastelandStructureKey, "wall-3-4");
  assert.deepEqual(mesh.position.toArray(), [10, 1.42, -8]);
  assert.equal(mesh.rotation.y, Math.PI * 0.5);
  assert.equal(mesh.children.length, 2);
  assert.equal(mesh.children.every((child) => child.frustumCulled === false), true);
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
