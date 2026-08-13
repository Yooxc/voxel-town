import test from "node:test";
import assert from "node:assert/strict";
import {
  findCaveRockSpawnPosition,
  findMineRockSpawnPosition,
  getRockSpawnBounds,
  isMineRockSpawnValid,
} from "../src/world/rockPlacement.js";

function rock(x, z, userData = {}) {
  return { parent: {}, position: { x, z }, userData };
}

test("rejects mine positions inside the starting safe radius and beside existing rocks", () => {
  assert.equal(isMineRockSpawnValid({
    x: 3, z: 3, scale: 1, rocks: [], safeRadius: 8, minGap: 0.55,
  }), false);
  assert.equal(isMineRockSpawnValid({
    x: 10, z: 10, scale: 1, rocks: [rock(10.5, 10, { spawn: { s: 1 } })], safeRadius: 8, minGap: 0.55,
  }), false);
});

test("finds a valid mine position inside the configured bounds", () => {
  const bounds = getRockSpawnBounds(120, 6);
  assert.deepEqual(bounds, { minX: -54, maxX: 54, minZ: -54, maxZ: 54 });
  assert.deepEqual(findMineRockSpawnPosition({
    scale: 1, tries: 1, bounds, rocks: [], safeRadius: 8, minGap: 0.55, randomRange: () => 20,
  }), { x: 20, z: 20 });
});

test("avoids cave facilities and reports failure when every candidate conflicts", () => {
  assert.equal(findCaveRockSpawnPosition({
    scale: 1, tries: 1, groundSize: 120, centerX: 0, centerZ: 0, rocks: [],
    airPurifierPosition: { x: -52, z: -52 }, gatePosition: null, randomRange: () => -52,
  }), null);
});
