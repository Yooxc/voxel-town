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

function distanceToSegment(x, z, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared === 0) return Math.hypot(x - ax, z - az);
  const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / lengthSquared));
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

function isPointInPolygon(x, z, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const crosses = (currentPoint.z > z) !== (previousPoint.z > z)
      && x < ((previousPoint.x - currentPoint.x) * (z - currentPoint.z))
        / (previousPoint.z - currentPoint.z) + currentPoint.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function hasPolygonClearance(x, z, polygon, clearance) {
  if (!isPointInPolygon(x, z, polygon)) return false;
  return polygon.every((point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return distanceToSegment(x, z, point.x, point.z, next.x, next.z) >= clearance;
  });
}

function overlapsExclusion(x, z, clearance, exclusion) {
  if (exclusion.type === "circle") {
    return Math.hypot(x - exclusion.x, z - exclusion.z) < exclusion.radius + clearance;
  }
  if (exclusion.type === "box") {
    return Math.abs(x - exclusion.x) < exclusion.halfWidth + clearance
      && Math.abs(z - exclusion.z) < exclusion.halfDepth + clearance;
  }
  if (exclusion.type === "capsule") {
    return distanceToSegment(x, z, exclusion.ax, exclusion.az, exclusion.bx, exclusion.bz)
      < exclusion.radius + clearance;
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

export function isMineRockSpawnValid({
  x,
  z,
  scale,
  rocks,
  safeRadius = 0,
  minGap = 0,
  polygon = null,
  exclusions = [],
  playerPosition = null,
  playerClearance = 2.4,
}) {
  const rockRadius = 0.9 * scale;
  if (x * x + z * z < safeRadius * safeRadius) return false;
  if (polygon && !hasPolygonClearance(x, z, polygon, rockRadius + 0.25)) return false;
  if (exclusions.some((exclusion) => overlapsExclusion(x, z, rockRadius + 0.25, exclusion))) return false;
  if (playerPosition && Math.hypot(x - playerPosition.x, z - playerPosition.z) < playerClearance + rockRadius) return false;
  return !isTooClose(x, z, scale, rocks, minGap, (rock) => rock.userData?.spawnScale ?? 1);
}

export function findMineRockSpawnPosition({
  scale,
  tries = 80,
  bounds,
  rocks,
  safeRadius,
  minGap,
  randomRange,
  polygon = null,
  exclusions = [],
  playerPosition = null,
  playerClearance = 2.4,
}) {
  for (let index = 0; index < tries; index += 1) {
    const x = randomRange(bounds.minX, bounds.maxX);
    const z = randomRange(bounds.minZ, bounds.maxZ);
    if (isMineRockSpawnValid({
      x, z, scale, rocks, safeRadius, minGap, polygon, exclusions, playerPosition, playerClearance,
    })) return { x, z };
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
