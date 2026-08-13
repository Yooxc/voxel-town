import test from "node:test";
import assert from "node:assert/strict";
import { createTunnelFenceModel } from "../src/world/tunnelFenceModel.js";

test("creates tunnel fence rails, posts, and braces", () => {
  const group = createTunnelFenceModel(10);
  assert.equal(group.children.length, 11);
  assert.deepEqual(group.children[0].position.toArray(), [0, 1.38, 0]);
  assert.deepEqual(group.children[1].position.toArray(), [0, 0.8, 0]);
  assert.deepEqual(group.children[2].position.toArray(), [-4.72, 0.85, 0]);
  assert.equal(group.children[8].rotation.z, Math.PI * 0.18);
  assert.equal(group.children[9].rotation.z, 0);
  assert.equal(group.children[10].rotation.z, -Math.PI * 0.18);
});
