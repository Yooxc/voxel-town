import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createDeformableTerrain } from "../src/world/deformableTerrain.js";
import { createDeformableTerrainMap } from "../src/world/deformableTerrainMap.js";

function createTerrain() {
  return createDeformableTerrain({
    width: 4,
    depth: 4,
    segmentsX: 4,
    segmentsZ: 4,
    maxDepth: 0.5,
  });
}

test("digs a smooth radial depression without exceeding the depth limit", () => {
  const terrain = createTerrain();
  const centerIndex = terrain.getIndex(2, 2);
  const neighborIndex = terrain.getIndex(3, 2);

  terrain.digAt({ x: 0, z: 0, radius: 1.5, amount: 0.3 });
  assert.ok(Math.abs(terrain.heights[centerIndex] + 0.3) < 1e-6);
  assert.ok(terrain.heights[neighborIndex] < 0);
  assert.ok(terrain.heights[neighborIndex] > terrain.heights[centerIndex]);

  terrain.digAt({ x: 0, z: 0, radius: 1.5, amount: 1 });
  assert.ok(Math.abs(terrain.heights[centerIndex] + 0.5) < 1e-6);
});

test("does not alter protected terrain and reset restores the original surface", () => {
  const terrain = createTerrain();
  const centerIndex = terrain.getIndex(2, 2);
  const protectedResult = terrain.digAt({
    x: 0,
    z: 0,
    radius: 1,
    amount: 0.2,
    canDigAt: () => false,
  });
  assert.equal(protectedResult.changed, false);
  assert.equal(terrain.heights[centerIndex], 0);

  terrain.digAt({ x: 0, z: 0, radius: 1, amount: 0.2 });
  terrain.reset();
  assert.equal(terrain.heights[centerIndex], terrain.originalHeights[centerIndex]);
});

test("registers the terrain lab mesh for movement bounds and player grounding", () => {
  const walkableSurfaces = [];
  const groundSurfaces = [];
  const isolatedZones = [];
  const terrainMap = createDeformableTerrainMap({
    scene: new THREE.Scene(),
    registerWalkableSurface: (_mapId, mesh) => walkableSurfaces.push(mesh),
    registerGroundSurface: (mesh) => groundSurfaces.push(mesh),
    registerIsolatedMapZone: (zone) => isolatedZones.push(zone),
  });

  assert.equal(walkableSurfaces[0], terrainMap.mesh);
  assert.equal(groundSurfaces[0], terrainMap.mesh);
  assert.equal(isolatedZones[0].mapId, terrainMap.mapId);
  assert.equal(terrainMap.spawn.y, 0);
  assert.notEqual(terrainMap.spawn.z, 510);
});
