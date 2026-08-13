import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createDynamicPropsRuntime } from "../src/world/dynamicProps.js";

function addBox(scene, y) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  mesh.position.y = y;
  scene.add(mesh);
  scene.updateMatrixWorld(true);
  return mesh;
}

test("rests a prop on a registered support surface", () => {
  const scene = new THREE.Scene();
  const support = addBox(scene, 1);
  const prop = addBox(scene, 4);
  const runtime = createDynamicPropsRuntime();
  runtime.restPropOnSupport(prop, support);
  assert.equal(prop.position.y, 2.01);
});

test("drops a prop and marks it sleeping when it reaches a support", () => {
  const scene = new THREE.Scene();
  const support = addBox(scene, 0);
  const prop = addBox(scene, 2);
  const runtime = createDynamicPropsRuntime({ gravity: 18 });
  runtime.registerSupportSurface(support);
  const body = runtime.enableDynamicProp(prop);
  runtime.update(0.11);
  runtime.update(0.11);
  runtime.update(0.11);
  assert.equal(body.sleeping, true);
  assert.equal(body.velocityY, 0);
  assert.equal(prop.position.y, 1.01);
});

test("unregisters a dynamic prop from future updates", () => {
  const scene = new THREE.Scene();
  const prop = addBox(scene, 2);
  const runtime = createDynamicPropsRuntime();
  runtime.enableDynamicProp(prop);
  runtime.unregisterDynamicProp(prop);
  runtime.update(1);
  assert.equal(prop.userData.dynamicPropBody, undefined);
  assert.equal(prop.position.y, 2);
});
