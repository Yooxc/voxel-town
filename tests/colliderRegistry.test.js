import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createColliderRegistry } from "../src/world/colliderRegistry.js";

function boxMesh(x = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  mesh.position.x = x;
  return mesh;
}

test("caches a shrunken collider box and its index", () => {
  const registry = createColliderRegistry();
  const mesh = boxMesh();
  assert.equal(registry.add(mesh, 0.5), 0);
  assert.equal(mesh.userData.colliderIndex, 0);
  assert.equal(registry.boxes[0].getSize(new THREE.Vector3()).x, 1);
});

test("reindexes remaining colliders after removal and resolves fallbacks", () => {
  const registry = createColliderRegistry();
  const first = boxMesh();
  const second = boxMesh(3);
  registry.add(first);
  registry.add(second);
  registry.removeAt(0);
  assert.equal(first.userData.colliderIndex, null);
  assert.equal(second.userData.colliderIndex, 0);
  assert.equal(registry.getTrackedIndex(second, 4), 0);
  assert.equal(registry.getTrackedIndex({}, 4), 4);
});

test("stores optional oriented-box collision data alongside a broad-phase box", () => {
  const registry = createColliderRegistry();
  const mesh = boxMesh();
  registry.add(mesh, {
    preciseShape: { type: "orientedBox", halfX: 0.7, halfZ: 1.4, rotationY: Math.PI * 0.25 },
  });

  assert.equal(registry.boxes[0].userData.preciseShape.type, "orientedBox");
  assert.equal(registry.boxes[0].userData.preciseShape.halfX, 0.7);
  assert.equal(registry.boxes[0].userData.preciseShape.halfZ, 1.4);
});
