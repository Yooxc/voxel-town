function isTooClose(x, z, scale, rocks, gap, getOtherScale) {
  for (const rock of rocks) {
    if (!rock || !rock.parent) continue;
    const otherScale = getOtherScale(rock);
    const minDistance = 0.9 * scale + 0.9 * otherScale + gap;
    const dx = x - rock.position.x;
    const dz = z - rock.position.z;
    if (dx * dx + dz * dz < minDistance * minDistance) return true;
  }
  return false;
}

export function getRockSpawnBounds(groundSize, margin) {
  const half = groundSize / 2;
  return {
    minX: -half + margin,
    maxX: half - margin,
    minZ: -half + margin,
    maxZ: half - margin,
  };
}

export function isMineRockSpawnValid({ x, z, scale, rocks, safeRadius, minGap }) {
  if (x * x + z * z < safeRadius * safeRadius) return false;
  return !isTooClose(x, z, scale, rocks, minGap, (rock) => rock.userData?.spawn?.s ?? 1);
}

export function findMineRockSpawnPosition({ scale, tries = 80, bounds, rocks, safeRadius, minGap, randomRange }) {
  for (let index = 0; index < tries; index += 1) {
    const x = randomRange(bounds.minX, bounds.maxX);
    const z = randomRange(bounds.minZ, bounds.maxZ);
    if (isMineRockSpawnValid({ x, z, scale, rocks, safeRadius, minGap })) return { x, z };
  }
  return null;
}

export function findCaveRockSpawnPosition({
  scale,
  tries = 120,
  groundSize,
  centerX,
  centerZ,
  rocks,
  airPurifierPosition,
  gatePosition,
  randomRange,
}) {
  const half = groundSize * 0.5 - 8;
  for (let index = 0; index < tries; index += 1) {
    const x = centerX + randomRange(-half, half);
    const z = centerZ + randomRange(-half, half);
    if (airPurifierPosition && Math.abs(x - airPurifierPosition.x) < 8 && Math.abs(z - airPurifierPosition.z) < 8) continue;
    if (gatePosition && Math.abs(x - gatePosition.x) < 7 && Math.abs(z - gatePosition.z) < 8) continue;
    if (!isTooClose(x, z, scale, rocks, 0.8, (rock) => rock.userData?.spawnScale ?? 1)) return { x, z };
  }
  return null;
}
