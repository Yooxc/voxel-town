import test from "node:test";
import assert from "node:assert/strict";
import { createForgeAnvilModel } from "../src/world/forgeAnvilModel.js";

test("creates forge anvil base, body, horn, and top plate", () => {
  const group = createForgeAnvilModel();
  assert.equal(group.children.length, 4);
  assert.deepEqual(group.children[0].position.toArray(), [0, 0.28, 0]);
  assert.deepEqual(group.children[2].position.toArray(), [0.54, 0.81, 0]);
  assert.deepEqual(group.children[2].scale.toArray(), [1.2, 1, 0.7]);
});
