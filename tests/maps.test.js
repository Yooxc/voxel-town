import test from "node:test";
import assert from "node:assert/strict";
import {
  isPositionInsideMapGateTrigger,
  findTriggeredMapGate,
  getMapGateHintText,
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
