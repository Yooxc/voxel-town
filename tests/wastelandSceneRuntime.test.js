import test from "node:test";
import assert from "node:assert/strict";
import { createWastelandSceneRuntime } from "../src/world/wastelandSceneRuntime.js";

test("creates fence link and structure scene plans from game state", () => {
  const runtime = createWastelandSceneRuntime();
  const posts = new Map([
    ["0:0", { row: 0, col: 0, x: 0, z: 0, ownerId: "owner" }],
    ["0:1", { row: 0, col: 1, x: 2, z: 0, ownerId: "owner" }],
    ["1:0", { row: 1, col: 0, x: 0, z: 2, ownerId: "other" }],
  ]);
  const links = runtime.getFenceLinkPlans({
    fencePosts: posts,
    cellSize: 2,
    canLinkPosts: (first, second) => first?.ownerId === second?.ownerId,
  });
  assert.deepEqual(links, [{ horizontal: true, length: 2, x: 1, z: 0 }]);

  const structure = { row: 1, col: 2, type: "woodFloor" };
  assert.deepEqual(runtime.getStructureScenePlans({
    structures: [structure],
    getCellByGrid: () => ({ x: 4, z: -2 }),
    getSurfaceY: () => 0.3,
  }), [{ structure, position: { x: 4, y: 0.3, z: -2 } }]);
});

test("creates preview overlays and validation markers", () => {
  const runtime = createWastelandSceneRuntime();
  const plans = runtime.getClaimPreviewPlans({
    cells: [{ row: 0, col: 0, x: 0, z: 0, size: 2 }, { row: 0, col: 1, x: 2, z: 0, size: 2 }],
    draftEntries: [["owner", { postKeys: ["0:0"] }]],
    currentOwnerId: "owner",
    isFencePlacementMode: true,
    getDraftBounds: () => ({ minRow: 0, maxRow: 0, minCol: 0, maxCol: 1 }),
    getDraftFencePosts: () => [],
    getDraftGuide: () => ({ canConfirm: false, missingBorderCount: 1, innerPostCount: 0 }),
  });
  assert.equal(plans.length, 3);
  assert.equal(plans[0].color, 0xff5b4a);
  assert.equal(plans[2].color, 0xff2f2f);
  assert.equal(plans[2].scale, 0.54);
});
