export const TREE_HARVEST_SHAKE_DURATION_MS = 380;

export function createTreeHarvestPlan({
  itemId,
  count = 1,
  now,
  shakeDuration = TREE_HARVEST_SHAKE_DURATION_MS,
} = {}) {
  return {
    itemId,
    count,
    shakeStartedAt: now,
    shakeUntil: now + shakeDuration,
  };
}

export function createRockMiningPlan({
  hp,
  maxHp = 1,
  miningPower,
  isPickaxeEquipped,
  hasOwnedPickaxe,
  equippedPickaxeLevel = 0,
  requiredPickaxeLevel = 0,
} = {}) {
  if (!isPickaxeEquipped) {
    return {
      status: "blocked",
      reason: hasOwnedPickaxe ? "equip-pickaxe" : "need-pickaxe",
    };
  }

  if (equippedPickaxeLevel < requiredPickaxeLevel) {
    return { status: "blocked", reason: "pickaxe-level-required" };
  }

  if (!(miningPower > 0)) {
    return { status: "blocked", reason: "no-mining-power" };
  }

  let remainingHp = Math.max(0, (hp ?? 1) - miningPower);
  if (maxHp <= 1 && remainingHp <= 0.15) {
    remainingHp = 0;
  }

  return {
    status: remainingHp > 0 ? "damaged" : "destroyed",
    remainingHp,
  };
}
