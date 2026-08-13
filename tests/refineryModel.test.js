import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createRefineryModel } from "../src/world/refineryModel.js";

test("creates a refinery model with its collider and grinder interaction target", () => {
  const { group, collider, grinderCore } = createRefineryModel(() => new THREE.Group());
  assert.equal(group.children.includes(collider), true);
  assert.equal(group.children.includes(grinderCore), true);
  assert.deepEqual(collider.position.toArray(), [0.1, 1.13, 0]);
  assert.equal(group.children.length, 22);
});
