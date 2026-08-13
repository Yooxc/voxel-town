import test from "node:test";
import assert from "node:assert/strict";
import {
  createHouseModel,
  createSignModel,
  createTutorialNpcModel,
} from "../src/world/startAreaModels.js";

test("creates a house with a base collider at the requested position", () => {
  const { group, collider } = createHouseModel(4, -3);
  assert.equal(group.children.length, 2);
  assert.equal(collider.parent, group);
  assert.deepEqual(group.position.toArray(), [4, 0, -3]);
});

test("creates a sign board and invisible collision mesh", () => {
  const { group, board, collider } = createSignModel();
  assert.equal(group.children.length, 3);
  assert.equal(board.parent, group);
  assert.equal(collider.material.visible, false);
});

test("creates a tutorial NPC with a collider and safety helmet", () => {
  const { group, collider } = createTutorialNpcModel();
  assert.equal(collider.parent, group);
  assert.equal(group.children.length, 7);
  assert.equal(group.children.some((child) => child.children.length > 0), true);
});
