import test from "node:test";
import assert from "node:assert/strict";
import {
  isPositionInsideMapGateTrigger,
  findTriggeredMapGate,
  getMapGateHintText,
  getCurrentMapIdForPlayer,
  getLowPolyCaveCeilingBottomY,
  createLowPolyCaveCeilingGeometry,
  createIrregularCaveCollarGeometry,
} from "../src/systems/maps.js";

test("recognizes circular and rectangular map gate triggers", () => {
  assert.equal(
    isPositionInsideMapGateTrigger({ x: 1, z: 0 }, { x: 0, z: 0, radius: 1 }),
    true
  );
  assert.equal(
    isPositionInsideMapGateTrigger({ x: 1.01, z: 0 }, { x: 0, z: 0, radius: 1 }),
    false
  );
  assert.equal(
    isPositionInsideMapGateTrigger({ x: 2, z: 1 }, { x: 0, z: 0, width: 4, depth: 2 }),
    true
  );
});

test("finds only an unlocked gate on the current map", () => {
  const gate = { mapId: "폐광", trigger: { x: 0, z: 0, radius: 2 } };
  assert.equal(
    findTriggeredMapGate({ mapGates: [gate], currentMapId: "폐광", playerPosition: { x: 1, z: 0 } }),
    gate
  );
  assert.equal(
    findTriggeredMapGate({ mapGates: [gate], currentMapId: "개척지", playerPosition: { x: 1, z: 0 } }),
    null
  );
  assert.equal(
    findTriggeredMapGate({ mapGates: [gate], currentMapId: "폐광", playerPosition: { x: 1, z: 0 }, isLocked: true }),
    null
  );
});

test("builds map gate hints from lock and item state", () => {
  const gate = { unlockWithItem: "key", denyText: "잠겨 있습니다", hint: "다음 맵으로 이동" };
  assert.equal(
    getMapGateHintText(gate, { canUseMapGate: () => false, hasItem: () => true, getItemName: () => "폐광 열쇠" }),
    "E : 폐광 열쇠 사용"
  );
  assert.equal(
    getMapGateHintText(gate, { canUseMapGate: () => false, hasItem: () => false, getItemName: () => "폐광 열쇠" }),
    "잠겨 있습니다"
  );
  assert.equal(
    getMapGateHintText(gate, { canUseMapGate: () => true, hasItem: () => false, getItemName: () => "폐광 열쇠" }),
    "다음 맵으로 이동"
  );
});

test("prefers an isolated map zone over normal position thresholds", () => {
  assert.equal(getCurrentMapIdForPlayer({
    playerPosition: { x: 500, z: 500 },
    isolatedMapZones: [{ mapId: "terrain-lab", centerX: 500, centerZ: 500, width: 30, depth: 30 }],
    mineDoorThresholdZ: 10,
    campDoorThresholdZ: -10,
    campNorthDoorThresholdZ: -20,
    frontierDoorThresholdZ: -30,
  }), "terrain-lab");
});

test("builds deterministic low-poly cave ceilings with a safe bounded underside", () => {
  const slab = {
    x: 0,
    z: 0,
    sx: 20,
    sy: 3,
    sz: 12,
    bottomY: 9.8,
    segmentsX: 4,
    segmentsZ: 3,
    roughness: 0.7,
    seed: 11,
  };
  const centerY = getLowPolyCaveCeilingBottomY(slab, 0, 0);
  assert.equal(getLowPolyCaveCeilingBottomY(slab, 0, 0), centerY);
  assert.ok(centerY >= slab.bottomY - slab.roughness);
  assert.ok(centerY <= slab.bottomY + slab.roughness);

  const geometry = createLowPolyCaveCeilingGeometry(slab);
  assert.equal(geometry.getAttribute("position").count, (slab.segmentsX + 1) * (slab.segmentsZ + 1) * 2);
  assert.ok(geometry.index.count > 0);
});

test("builds a closed multi-ring collar for mine pillars", () => {
  const geometry = createIrregularCaveCollarGeometry({
    seed: 17,
    sides: 8,
    rings: [
      { y: 0, radiusX: 1.2, radiusZ: 1.4, offsetX: 0, offsetZ: 0 },
      { y: 1, radiusX: 1.8, radiusZ: 2.1, offsetX: 0.1, offsetZ: -0.1 },
      { y: 2.2, radiusX: 2.2, radiusZ: 2.5, offsetX: 0, offsetZ: 0 },
    ],
  });
  assert.equal(geometry.getAttribute("position").count, 24);
  assert.equal(geometry.index.count, 8 * 2 * 6);
});
