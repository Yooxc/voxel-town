import test from "node:test";
import assert from "node:assert/strict";
import { createAirPurifierModel } from "../src/world/airPurifierModel.js";

test("creates the air purifier model", () => {
  const { group, chamber } = createAirPurifierModel();
  assert.equal(group.children.length, 6);
  assert.equal(group.children.includes(chamber), true);
  assert.deepEqual(chamber.position.toArray(), [0, 1.18, 0]);
});
