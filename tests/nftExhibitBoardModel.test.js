import test from "node:test";
import assert from "node:assert/strict";
import { createNftExhibitBoardModel } from "../src/world/nftExhibitBoardModel.js";

test("creates an NFT exhibit board with frame, screen material, and wheels", () => {
  const { group, frame, screenMaterial } = createNftExhibitBoardModel();
  assert.equal(group.children.length, 12);
  assert.equal(group.children.includes(frame), true);
  assert.equal(group.children[5].material, screenMaterial);
  assert.deepEqual(group.children[8].position.toArray(), [-2.09, 0.02, -0.08]);
});
