import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createTerrainDiggingController } from "../src/systems/terrainDiggingController.js";

test("digs only on the terrain lab while a shovel is equipped", () => {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2));
  mesh.updateMatrixWorld(true);
  let applied = 0;
  const controller = createTerrainDiggingController({
    terrainMap: {
      mapId: "terrain-lab",
      mesh,
      canDigAt: () => true,
      terrain: { digAt: () => ({ changed: true, changedIndices: [1, 2] }) },
      applyHeights: () => { applied += 1; },
      reset: () => {},
    },
    getCurrentMapId: () => "terrain-lab",
    getPlayer: () => ({ position: new THREE.Vector3(0, 0, 0), rotation: { y: 0 } }),
    getEquippedToolId: () => "shovel",
  });

  const result = controller.dig();
  assert.equal(result.ok, true);
  assert.equal(result.changedVertices, 2);
  assert.equal(applied, 1);
});

test("refuses digging without a shovel", () => {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2));
  mesh.updateMatrixWorld(true);
  const controller = createTerrainDiggingController({
    terrainMap: { mapId: "terrain-lab", mesh, canDigAt: () => true },
    getCurrentMapId: () => "terrain-lab",
    getPlayer: () => ({ position: new THREE.Vector3(), rotation: { y: 0 } }),
    getEquippedToolId: () => null,
  });
  assert.equal(controller.dig().reason, "need-shovel");
});
