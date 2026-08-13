import test from "node:test";
import assert from "node:assert/strict";
import { createHarvestTreeModel, createMineRockModel } from "../src/world/resourceModels.js";

test("creates harvest tree meshes with default harvest state", () => {
  const { tree, trunk } = createHarvestTreeModel(3, -2);
  assert.equal(tree.children.length, 4);
  assert.equal(trunk.position.y, 1.1);
  assert.equal(tree.userData.harvestItemId, "woodChip");
  assert.equal(tree.userData.harvestDisabled, false);
  assert.equal(tree.userData.stump.visible, false);
});

test("creates mine rocks with spawn, resource, and fade state", () => {
  const rock = createMineRockModel(1, 2, { id: "large", scale: 2, maxHp: 8 }, true, {
    mapId: "폐광",
    resourceItemId: "masonryStone",
    resourceCount: 3,
    requiredPickaxeLevel: 2,
  }, {
    defaultResourceCount: 1,
    randomRange: () => 0.5,
  });
  assert.equal(rock.position.y, 1.8);
  assert.equal(rock.userData.hp, 8);
  assert.equal(rock.userData.spawn.mapId, "폐광");
  assert.equal(rock.userData.resourceCount, 3);
  assert.equal(rock.userData.fadeInDuration, 1);
  assert.equal(rock.material.opacity, 0);
});
