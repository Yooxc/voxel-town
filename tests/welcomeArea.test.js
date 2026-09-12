import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createWelcomeArea } from "../src/world/welcomeArea.js";
import { createColliderRegistry } from "../src/world/colliderRegistry.js";
import { getPlayerBoxFromPosition, intersectsAnyColliderBox } from "../src/core/collisions.js";

function fakeModel() {
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.235, 0.585), new THREE.MeshStandardMaterial()));
  return { scene };
}

function fixture(loader, onError = () => {}) {
  const scene = new THREE.Scene();
  const registry = createColliderRegistry();
  const area = createWelcomeArea({ scene,
    addCollider: (object, options) => registry.add(object, options), registerNpc: () => ({}),
    layout: { tree: { x: -7, y: 7.35, z: 26 }, bench: { x: -6, y: 6, z: 22.5 }, resident: { x: 7, y: 6, z: 23 } },
    benchLoader: loader, onBenchLoadError: onError,
  });
  return { area, registry };
}

test("creates a shared welcome landmark and registers its resident", async () => {
  const sceneObjects = [];
  const colliders = [];
  let registration = null;
  const area = createWelcomeArea({
    scene: { add: (object) => sceneObjects.push(object) },
    addCollider: (object) => { colliders.push(object); return colliders.length - 1; },
    registerNpc: (obj, name, hint, metadata) => {
      registration = { obj, name, hint, metadata };
      return registration;
    },
    x: 6,
    y: 0,
    z: -4,
    benchLoader: { loadAsync: async () => fakeModel() },
  });

  assert.equal(sceneObjects[0], area.root);
  assert.equal(area.root.name, "EXCIT_WELCOME_AREA");
  assert.equal(area.resident.name, "EXCIT_WELCOME_RESIDENT");
  assert.equal(registration.obj, area.resident);
  assert.equal(registration.name, "마루");
  assert.equal(registration.metadata.role, "welcome");
  assert.equal(colliders.length, 4);
  await area.bench.userData.assetReady;
});

test("replaces only the bench visual after loading and preserves its transform and colliders", async () => {
  let finish;
  let requestedUrl;
  const { area, registry } = fixture({ loadAsync: (url) => {
    requestedUrl = url;
    return new Promise((resolve) => { finish = resolve; });
  } });
  const fallback = [...area.bench.children];
  const boxes = registry.boxes.map((box) => box.clone());
  const position = area.bench.position.clone();
  const rotation = area.bench.rotation.clone();
  assert.equal(area.bench.userData.assetStatus, "loading");
  assert.ok(fallback.every((object) => object.visible));
  await Promise.resolve();
  finish(fakeModel());
  const model = await area.bench.userData.assetReady;
  assert.equal(requestedUrl, "/models/excit-bench-test.glb");
  assert.equal(area.bench.userData.assetStatus, "ready");
  assert.equal(model.parent, area.bench);
  assert.equal(model.name, "EXCIT_WELCOME_BENCH_MODEL");
  assert.equal(area.bench.children.filter((object) => object.visible).length, 1);
  assert.ok(fallback.every((object) => object.parent === area.bench && !object.visible));
  assert.deepEqual(area.bench.position, position);
  assert.ok(area.bench.rotation.equals(rotation));
  assert.equal(registry.boxes.length, 4);
  assert.ok(registry.boxes.every((box, index) => box.equals(boxes[index])));
  assert.ok(model.children.every((mesh) => mesh.castShadow && mesh.receiveShadow));
});

test("failed or empty bench assets retain the original visual and report one error", async () => {
  for (const loader of [
    { loadAsync: async () => { throw new Error("Network unavailable"); } },
    { loadAsync: () => { throw new Error("Invalid URL"); } },
    { loadAsync: async () => ({ scene: new THREE.Group() }) },
  ]) {
    const errors = [];
    const { area, registry } = fixture(loader, (error) => errors.push(error));
    const fallback = [...area.bench.children];
    assert.equal(await area.bench.userData.assetReady, null);
    assert.equal(area.bench.userData.assetStatus, "fallback");
    assert.equal(errors.length, 1);
    assert.deepEqual(area.bench.children, fallback);
    assert.ok(fallback.every((object) => object.visible));
    assert.equal(registry.boxes.length, 4);
  }
});

test("exported Blender bench has the intended scale, orientation, materials and collision envelope", async () => {
  const bytes = await readFile(new URL("../public/models/excit-bench-test.glb", import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  const bounds = new THREE.Box3().setFromObject(gltf.scene);
  const size = bounds.getSize(new THREE.Vector3());
  const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.0001, `${actual} != ${expected}`);
  near(size.x, 1.8);
  near(size.y, 1.235);
  near(size.z, 0.585);
  near(bounds.min.y, 0);
  near(bounds.min.z, -0.275);
  near(bounds.max.z, 0.31);
  assert.equal(gltf.animations.length, 0);
  let meshCount = 0;
  let triangles = 0;
  const colors = new Set();
  gltf.scene.traverse((object) => {
    assert.equal(object.isCamera === true || object.isLight === true || object.name.includes("REFERENCE"), false);
    if (!object.isMesh) return;
    meshCount += 1;
    triangles += object.geometry.index.count / 3;
    colors.add(object.material.color.getHexString());
    assert.equal(object.material.map, null);
    if (object.name.startsWith("EXCIT_BENCH_BACK_")) {
      assert.ok(object.getWorldPosition(new THREE.Vector3()).z > 0, "backrest must be on game +Z");
    }
  });
  assert.equal(meshCount, 10);
  assert.equal(colors.size, 3);
  assert.ok(triangles < 1000);

  const { area, registry } = fixture({ loadAsync: async () => gltf });
  const testPoints = [];
  for (let x = -2; x <= 2; x += 0.2) for (let z = -1; z <= 1; z += 0.2) {
    testPoints.push(new THREE.Vector3(-6 + x, 6.05, 22.5 + z));
  }
  const contacts = () => testPoints.map((position) => intersectsAnyColliderBox(getPlayerBoxFromPosition(position), registry.boxes));
  const before = contacts();
  await area.bench.userData.assetReady;
  assert.deepEqual(contacts(), before);
  assert.ok(before.some(Boolean) && before.some((value) => !value));
});
