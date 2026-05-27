export const TREE_HARVEST_RESPAWN_MS = 10000;

export const PICKAXE_UPGRADE_LEVELS = [
  { level: 0, miningPowerMin: 0.9, miningPowerMax: 1.1, bonusDropChance: 0.0, swingDuration: 0.28, cost: 0, successChance: 1.0 },
  { level: 1, miningPowerMin: 1.0, miningPowerMax: 1.15, bonusDropChance: 0.0, swingDuration: 0.265, cost: 3, successChance: 1.0 },
  { level: 2, miningPowerMin: 1.05, miningPowerMax: 1.2, bonusDropChance: 0.05, swingDuration: 0.25, cost: 6, successChance: 0.9 },
  { level: 3, miningPowerMin: 1.15, miningPowerMax: 1.25, bonusDropChance: 0.1, swingDuration: 0.235, cost: 10, successChance: 0.75 },
  { level: 4, miningPowerMin: 1.2, miningPowerMax: 1.35, bonusDropChance: 0.15, swingDuration: 0.22, cost: 15, successChance: 0.55 },
  { level: 5, miningPowerMin: 1.3, miningPowerMax: 1.45, bonusDropChance: 0.2, swingDuration: 0.205, cost: 22, successChance: 0.35 },
];

export const ROCK_SIZE_DEFS = [
  { id: "small", label: "작은 돌", scale: 0.8, maxHp: 1, stoneDustDropCount: 1 },
  { id: "medium", label: "중간 돌", scale: 1.05, maxHp: 2, stoneDustDropCount: 2 },
  { id: "large", label: "큰 돌", scale: 1.3, maxHp: 3, stoneDustDropCount: 3 },
];

export function clampPickaxeLevel(level, levels = PICKAXE_UPGRADE_LEVELS) {
  return Math.max(0, Math.min(Number.isFinite(level) ? level : 0, levels.length - 1));
}

export function getCurrentPickaxeStats(level = 0, levels = PICKAXE_UPGRADE_LEVELS) {
  return levels[clampPickaxeLevel(level, levels)];
}

export function getNextPickaxeUpgrade(level = 0, levels = PICKAXE_UPGRADE_LEVELS) {
  return levels[clampPickaxeLevel(level, levels) + 1] ?? null;
}

export function getForgeUpgradeStateData({ targetItemId, pickaxeLevel = 0, itemDefs }) {
  if (!targetItemId) return null;
  if (targetItemId !== "pickaxe") return null;
  return {
    itemId: targetItemId,
    name: itemDefs?.[targetItemId]?.name ?? targetItemId,
    level: clampPickaxeLevel(pickaxeLevel),
    current: getCurrentPickaxeStats(pickaxeLevel),
    next: getNextPickaxeUpgrade(pickaxeLevel),
  };
}

export function getMiningPowerForTool({ toolId, pickaxeLevel = 0, itemDefs, randRange }) {
  if (toolId === "pickaxe") {
    const stats = getCurrentPickaxeStats(pickaxeLevel);
    return randRange(stats.miningPowerMin, stats.miningPowerMax);
  }
  const def = toolId ? itemDefs?.[toolId] : null;
  return def?.miningPower ?? 0;
}

export function getRockSizeDefById(rockSizeId, rockSizeDefs = ROCK_SIZE_DEFS) {
  return rockSizeDefs.find((entry) => entry.id === rockSizeId) ?? null;
}

export function getRockDefaultResourceCount(rockSizeDef, options = {}) {
  if (options.resourceItemId === "stoneDust" || (!options.resourceItemId && !options.resourceCount)) {
    return rockSizeDef.stoneDustDropCount ?? 1;
  }
  return 1;
}

export function getHarvestTreeCooldownUntil(now, respawnMs = TREE_HARVEST_RESPAWN_MS) {
  return now + respawnMs;
}

export function isHarvestTreeReady(now, cooldownUntil = 0) {
  return now >= cooldownUntil;
}

export function getHarvestTreeRegrowthProgress(
  now,
  cooldownUntil = 0,
  respawnMs = TREE_HARVEST_RESPAWN_MS,
  mathUtils = Math
) {
  if (!(cooldownUntil > 0) || respawnMs <= 0) return 1;
  const remaining = Math.max(0, cooldownUntil - now);
  const progress = 1 - remaining / respawnMs;
  return mathUtils.clamp ? mathUtils.clamp(progress, 0, 1) : Math.max(0, Math.min(progress, 1));
}

export function getHarvestTreeShakeRotation(now, startedAt, shakeUntil, baseRotationZ = 0, mathUtils) {
  if (!(shakeUntil > now)) {
    return mathUtils.lerp(baseRotationZ, baseRotationZ, 1);
  }
  const duration = Math.max(1, shakeUntil - startedAt);
  const progress = mathUtils.clamp((now - startedAt) / duration, 0, 1);
  const damping = 1 - progress;
  return baseRotationZ + Math.sin(progress * Math.PI * 7) * 0.12 * damping;
}
