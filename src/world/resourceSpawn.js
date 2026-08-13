export function createTreeSpawnPositions({ count, minX, maxX, minZ, maxZ, safeRadius, maxAttempts, randomRange }) {
  const positions = [];
  for (let index = 0; index < count; index += 1) {
    let x = 0;
    let z = 0;
    let attempts = 0;
    do {
      x = randomRange(minX, maxX);
      z = randomRange(minZ, maxZ);
      attempts += 1;
    } while (x * x + z * z < safeRadius * safeRadius && attempts < maxAttempts);
    positions.push({ x, z });
  }
  return positions;
}

export function createRockSpawnPlans(count, rockSizeDefs, random) {
  return Array.from({ length: count }, () => rockSizeDefs[Math.floor(random() * rockSizeDefs.length)]);
}

export function getCaveMasonryRockOptions(rockSizeDef) {
  return {
    mapId: "폐광",
    resourceItemId: "masonryStone",
    requiredPickaxeLevel: 4,
    hint: "Space : 석재 채굴",
    color: 0x3f372f,
    detail: 1,
    maxHp: rockSizeDef.maxHp + 0.6,
    bonusDropEnabled: false,
    hpLabelPrefix: "석재 돌 체력",
  };
}
