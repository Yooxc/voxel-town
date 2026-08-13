import test from "node:test";
import assert from "node:assert/strict";

import {
  WASTELAND_BUILD_PART_DEFS,
  isWastelandBuildPartItemId,
  getWastelandBuildPartDef,
  getWastelandStructureSlotLabel,
  getWastelandStructureSurfaceY,
  getWastelandStructureRotationQuarter,
} from "../src/systems/wastelandBuilding.js";

test("provides wasteland build part definitions and slot labels", () => {
  assert.equal(WASTELAND_BUILD_PART_DEFS.woodFloor.slot, "floor");
  assert.equal(isWastelandBuildPartItemId("stoneWall"), true);
  assert.equal(isWastelandBuildPartItemId("missing"), false);
  assert.equal(getWastelandBuildPartDef("woodPillar")?.label, "목재 기둥");
  assert.equal(getWastelandBuildPartDef("missing"), null);
  assert.equal(getWastelandStructureSlotLabel("wall"), "벽");
  assert.equal(getWastelandStructureSlotLabel("missing"), "건축");
});

test("calculates surface height from a cell mesh and wall rotation from yaw", () => {
  assert.equal(getWastelandStructureSurfaceY({ baseMesh: { position: { y: 0.4 } } }), 0.54);
  assert.equal(getWastelandStructureSurfaceY({ coverMesh: { position: { y: 0.3 } } }), 0.4);
  assert.equal(getWastelandStructureSurfaceY({}), 0.22);
  assert.equal(getWastelandStructureRotationQuarter(0), 0);
  assert.equal(getWastelandStructureRotationQuarter(Math.PI * 0.5), 1);
  assert.equal(getWastelandStructureRotationQuarter(-Math.PI * 0.5), 3);
});
