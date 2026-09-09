const DEFAULT_GRID_SIZE = 0.7;
const DEFAULT_CLEARANCE = 0.48;

function pointKey(x, z) {
  return `${x}:${z}`;
}

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

export function isGuidePointBlocked(point, obstacles, clearance = DEFAULT_CLEARANCE) {
  return obstacles.some((obstacle) => {
    if (obstacle.type === "circle") {
      return Math.hypot(point.x - obstacle.x, point.z - obstacle.z) < obstacle.radius + clearance;
    }
    return Math.abs(point.x - obstacle.x) < obstacle.halfWidth + clearance
      && Math.abs(point.z - obstacle.z) < obstacle.halfDepth + clearance;
  });
}

export function isGuideSegmentClear(start, end, obstacles, clearance = DEFAULT_CLEARANCE) {
  const length = distance(start, end);
  const samples = Math.max(1, Math.ceil(length / 0.25));
  for (let index = 1; index < samples; index += 1) {
    const ratio = index / samples;
    if (isGuidePointBlocked({
      x: start.x + (end.x - start.x) * ratio,
      z: start.z + (end.z - start.z) * ratio,
    }, obstacles, clearance)) return false;
  }
  return true;
}

function reconstructPath(nodes, cameFrom, currentKey) {
  const path = [];
  while (currentKey) {
    const node = nodes.get(currentKey);
    if (node) path.push(node);
    currentKey = cameFrom.get(currentKey);
  }
  return path.reverse();
}

function simplifyPath(start, path, obstacles, clearance) {
  const points = [{ x: start.x, z: start.z }, ...path];
  const simplified = [];
  let anchorIndex = 0;
  while (anchorIndex < points.length - 1) {
    let nextIndex = points.length - 1;
    while (nextIndex > anchorIndex + 1
      && !isGuideSegmentClear(points[anchorIndex], points[nextIndex], obstacles, clearance)) {
      nextIndex -= 1;
    }
    simplified.push(points[nextIndex]);
    anchorIndex = nextIndex;
  }
  return simplified;
}

export function findGuidePath(start, end, {
  obstacles = [],
  gridSize = DEFAULT_GRID_SIZE,
  clearance = DEFAULT_CLEARANCE,
} = {}) {
  if (isGuideSegmentClear(start, end, obstacles, clearance)) return [{ x: end.x, z: end.z }];

  const padding = 7;
  const minX = Math.min(start.x, end.x) - padding;
  const maxX = Math.max(start.x, end.x) + padding;
  const minZ = Math.min(start.z, end.z) - padding;
  const maxZ = Math.max(start.z, end.z) + padding;
  const width = Math.ceil((maxX - minX) / gridSize);
  const depth = Math.ceil((maxZ - minZ) / gridSize);
  const toWorld = (x, z) => ({ x: minX + x * gridSize, z: minZ + z * gridSize });
  const toGrid = (point) => ({
    x: Math.min(width, Math.max(0, Math.round((point.x - minX) / gridSize))),
    z: Math.min(depth, Math.max(0, Math.round((point.z - minZ) / gridSize))),
  });
  const startGrid = toGrid(start);
  const endGrid = toGrid(end);
  const startKey = pointKey(startGrid.x, startGrid.z);
  const endKey = pointKey(endGrid.x, endGrid.z);
  const open = new Set([startKey]);
  const startWorld = toWorld(startGrid.x, startGrid.z);
  const nodes = new Map([[startKey, { gx: startGrid.x, gz: startGrid.z, ...startWorld }]]);
  const cameFrom = new Map();
  const gScore = new Map([[startKey, 0]]);
  const fScore = new Map([[startKey, distance(startGrid, endGrid)]]);
  const directions = [-1, 0, 1].flatMap((dx) => [-1, 0, 1]
    .filter((dz) => dx !== 0 || dz !== 0)
    .map((dz) => ({ dx, dz })));

  while (open.size > 0) {
    let currentKey = null;
    let currentScore = Infinity;
    for (const key of open) {
      const score = fScore.get(key) ?? Infinity;
      if (score < currentScore) {
        currentKey = key;
        currentScore = score;
      }
    }
    if (currentKey === endKey) {
      const raw = reconstructPath(nodes, cameFrom, currentKey).slice(1);
      const simplified = simplifyPath(start, raw, obstacles, clearance);
      simplified[simplified.length - 1] = { x: end.x, z: end.z };
      return simplified;
    }
    open.delete(currentKey);
    const current = nodes.get(currentKey);
    for (const { dx, dz } of directions) {
      const x = current.gx + dx;
      const z = current.gz + dz;
      if (x < 0 || z < 0 || x > width || z > depth) continue;
      const key = pointKey(x, z);
      const world = toWorld(x, z);
      if (key !== endKey && isGuidePointBlocked(world, obstacles, clearance)) continue;
      if (dx !== 0 && dz !== 0) {
        const horizontal = toWorld(current.gx + dx, current.gz);
        const vertical = toWorld(current.gx, current.gz + dz);
        if (isGuidePointBlocked(horizontal, obstacles, clearance)
          || isGuidePointBlocked(vertical, obstacles, clearance)) continue;
      }
      const tentative = (gScore.get(currentKey) ?? Infinity) + Math.hypot(dx, dz);
      if (tentative >= (gScore.get(key) ?? Infinity)) continue;
      cameFrom.set(key, currentKey);
      gScore.set(key, tentative);
      fScore.set(key, tentative + Math.hypot(endGrid.x - x, endGrid.z - z));
      nodes.set(key, { gx: x, gz: z, ...world });
      open.add(key);
    }
  }
  return [];
}

export function buildGuideNavigationPath(start, waypoints, {
  obstacles = [],
  heightAt = (_x, _z, fallbackY) => fallbackY,
} = {}) {
  const result = [];
  let current = { ...start };
  for (const waypoint of waypoints) {
    const segment = findGuidePath(current, waypoint, { obstacles });
    if (segment.length === 0) return [];
    for (const point of segment) {
      result.push({ x: point.x, y: heightAt(point.x, point.z, waypoint.y), z: point.z });
    }
    current = waypoint;
  }
  return result;
}
