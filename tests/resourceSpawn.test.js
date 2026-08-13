import test from "node:test";
import assert from "node:assert/strict";
import { createTreeSpawnPositions, createRockSpawnPlans, getCaveMasonryRockOptions } from "../src/world/resourceSpawn.js";

test("creates the requested tree positions outside the safe radius when candidates allow", () => {
  const positions = createTreeSpawnPositions({
    count: 2, minX: -10, maxX: 10, minZ: -10, maxZ: 10, safeRadius: 8, maxAttempts: 3,
    randomRange: () => 9,
  });
  assert.deepEqual(positions, [{ x: 9, z: 9 }, { x: 9, z: 9 }]);
});

test("creates rock plans and cave masonry options", () => {
  const small = { id: "small", maxHp: 2 };
  const large = { id: "large", maxHp: 6 };
  assert.deepEqual(createRockSpawnPlans(3, [small, large], () => 0.8), [large, large, large]);
  assert.deepEqual(getCaveMasonryRockOptions(large), {
    mapId: "폐광", resourceItemId: "masonryStone", requiredPickaxeLevel: 4,
    hint: "Space : 석재 채굴", color: 0x3f372f, detail: 1, maxHp: 6.6,
    bonusDropEnabled: false, hpLabelPrefix: "석재 돌 체력",
  });
});
