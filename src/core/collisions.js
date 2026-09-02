import * as THREE from "three";

export const PLAYER_COLLIDER_SIZE = Object.freeze({ x: 0.8, y: 2.65, z: 0.8 });
export const PLAYER_COLLIDER_CENTER_Y_OFFSET = PLAYER_COLLIDER_SIZE.y * 0.5;

export function getPlayerBoxFromPosition(
  position,
  size = PLAYER_COLLIDER_SIZE,
  centerYOffset = PLAYER_COLLIDER_CENTER_Y_OFFSET,
) {
  const center = position.clone().add(new THREE.Vector3(0, centerYOffset, 0));
  const box = new THREE.Box3();
  box.setFromCenterAndSize(center, new THREE.Vector3(size.x, size.y, size.z));
  return box;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPlayerColliderContact(playerBox, colliderBox) {
  if (!playerBox.intersectsBox(colliderBox)) return null;
  const shape = colliderBox?.userData?.preciseShape;
  if (shape?.type !== "orientedBox") {
    const overlapX = Math.min(playerBox.max.x, colliderBox.max.x) - Math.max(playerBox.min.x, colliderBox.min.x);
    const overlapZ = Math.min(playerBox.max.z, colliderBox.max.z) - Math.max(playerBox.min.z, colliderBox.min.z);
    if (overlapX <= 0 || overlapZ <= 0) return null;
    const playerCenterX = (playerBox.min.x + playerBox.max.x) * 0.5;
    const playerCenterZ = (playerBox.min.z + playerBox.max.z) * 0.5;
    const colliderCenterX = (colliderBox.min.x + colliderBox.max.x) * 0.5;
    const colliderCenterZ = (colliderBox.min.z + colliderBox.max.z) * 0.5;
    return overlapX <= overlapZ
      ? { depth: overlapX, pushX: playerCenterX < colliderCenterX ? -1 : 1, pushZ: 0 }
      : { depth: overlapZ, pushX: 0, pushZ: playerCenterZ < colliderCenterZ ? -1 : 1 };
  }

  if (playerBox.max.y <= shape.minY || playerBox.min.y >= shape.maxY) return null;
  const centerX = (playerBox.min.x + playerBox.max.x) * 0.5;
  const centerZ = (playerBox.min.z + playerBox.max.z) * 0.5;
  const radius = Math.max(playerBox.max.x - playerBox.min.x, playerBox.max.z - playerBox.min.z) * 0.5;
  const cos = Math.cos(shape.rotationY);
  const sin = Math.sin(shape.rotationY);
  const offsetX = centerX - shape.centerX;
  const offsetZ = centerZ - shape.centerZ;
  const localX = cos * offsetX - sin * offsetZ;
  const localZ = sin * offsetX + cos * offsetZ;
  const closestX = clamp(localX, -shape.halfX, shape.halfX);
  const closestZ = clamp(localZ, -shape.halfZ, shape.halfZ);
  const deltaX = localX - closestX;
  const deltaZ = localZ - closestZ;
  const distance = Math.hypot(deltaX, deltaZ);
  if (distance >= radius) return null;

  let normalX = 0;
  let normalZ = 0;
  let depth = 0;
  if (distance > 0.000001) {
    normalX = deltaX / distance;
    normalZ = deltaZ / distance;
    depth = radius - distance;
  } else {
    const edgeX = shape.halfX - Math.abs(localX);
    const edgeZ = shape.halfZ - Math.abs(localZ);
    if (edgeX <= edgeZ) {
      normalX = localX < 0 ? -1 : 1;
      depth = radius + edgeX;
    } else {
      normalZ = localZ < 0 ? -1 : 1;
      depth = radius + edgeZ;
    }
  }
  return {
    depth,
    pushX: cos * normalX + sin * normalZ,
    pushZ: -sin * normalX + cos * normalZ,
  };
}

export function intersectsAnyColliderBox(playerBox, colliderBoxes = []) {
  for (let i = 0; i < colliderBoxes.length; i++) {
    if (getPlayerColliderContact(playerBox, colliderBoxes[i])) return true;
  }
  return false;
}

export function getPlayerColliderPenetrationDepth(playerBox, colliderBoxes = []) {
  let totalDepth = 0;
  for (const colliderBox of colliderBoxes) {
    const contact = getPlayerColliderContact(playerBox, colliderBox);
    if (contact) totalDepth += contact.depth;
  }
  return totalDepth;
}

export function resolvePlayerColliderPenetration({
  position,
  getPlayerBox,
  colliderBoxes = [],
  padding = 0.012,
  maxIterations = 6,
}) {
  let resolved = false;
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const playerBox = getPlayerBox();
    let correction = null;

    for (const colliderBox of colliderBoxes) {
      const contact = getPlayerColliderContact(playerBox, colliderBox);
      if (!contact) continue;
      const nextCorrection = {
        x: contact.pushX * (contact.depth + padding),
        z: contact.pushZ * (contact.depth + padding),
        depth: contact.depth,
      };
      if (!correction || nextCorrection.depth < correction.depth) correction = nextCorrection;
    }

    if (!correction) break;
    position.x += correction.x;
    position.z += correction.z;
    resolved = true;
  }
  return {
    resolved,
    remainingDepth: getPlayerColliderPenetrationDepth(getPlayerBox(), colliderBoxes),
  };
}

export function hasPlayerOverlapWithColliderObjects({
  playerBox,
  colliderObjects = [],
  getTrackedColliderIndex,
  colliderBoxes = [],
}) {
  if (!Array.isArray(colliderObjects) || !colliderObjects.length) return false;
  return colliderObjects.some((obj) => {
    const colliderIndex = getTrackedColliderIndex(obj, obj?.userData?.colliderIndex);
    return typeof colliderIndex === "number" && colliderBoxes[colliderIndex] && playerBox.intersectsBox(colliderBoxes[colliderIndex]);
  });
}

export function getCurrentMapBoundsFromSurfaces(entries = [], fallbackBounds) {
  if (!entries.length) return fallbackBounds;

  const union = new THREE.Box3();
  let seeded = false;

  for (const entry of entries) {
    const mesh = entry.mesh;
    if (!mesh?.parent) continue;
    mesh.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(mesh);
    box.min.x -= entry.padding;
    box.max.x += entry.padding;
    box.min.z -= entry.padding;
    box.max.z += entry.padding;
    if (!seeded) {
      union.copy(box);
      seeded = true;
    } else {
      union.union(box);
    }
  }

  if (!seeded) return fallbackBounds;

  return {
    minX: union.min.x,
    maxX: union.max.x,
    minZ: union.min.z,
    maxZ: union.max.z,
  };
}

export function isInsideMapBoundsFromSurfaces(x, z, entries = [], fallbackBounds) {
  if (!entries.length) {
    return (
      x >= fallbackBounds.minX &&
      x <= fallbackBounds.maxX &&
      z >= fallbackBounds.minZ &&
      z <= fallbackBounds.maxZ
    );
  }

  for (const entry of entries) {
    const mesh = entry.mesh;
    if (!mesh?.parent) continue;
    mesh.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(mesh);
    box.min.x -= entry.padding;
    box.max.x += entry.padding;
    box.min.z -= entry.padding;
    box.max.z += entry.padding;
    if (x >= box.min.x && x <= box.max.x && z >= box.min.z && z <= box.max.z) {
      return true;
    }
  }

  return false;
}

export function applyMovementCollisionStep({
  axis,
  position,
  prevPos,
  delta,
  isInsideBounds,
  intersectsAnyCollider,
  getColliderPenetration,
  isStartRingTransitionBlocked,
  isCrossingBlockedStartRing,
}) {
  const previousPenetration = typeof getColliderPenetration === "function"
    ? getColliderPenetration()
    : null;
  const shouldBlockCollider = () => {
    if (!intersectsAnyCollider()) return false;
    if (previousPenetration === null) return true;
    return getColliderPenetration() >= previousPenetration - 0.0001;
  };
  if (axis === "x") {
    position.x = prevPos.x + delta.x;
    if (
      !isInsideBounds(position.x, position.z) ||
      shouldBlockCollider() ||
      isStartRingTransitionBlocked(prevPos.x, prevPos.z, position.x, position.z) ||
      isCrossingBlockedStartRing(prevPos.x, prevPos.z, position.x, position.z)
    ) {
      position.x = prevPos.x;
    }
    return {
      afterX: position.x,
      blocked: position.x === prevPos.x && delta.x !== 0,
    };
  }

  position.z = prevPos.z + delta.z;
  if (
    !isInsideBounds(position.x, position.z) ||
    shouldBlockCollider() ||
    isStartRingTransitionBlocked(position.x, prevPos.z, position.x, position.z) ||
    isCrossingBlockedStartRing(position.x, prevPos.z, position.x, position.z)
  ) {
    position.z = prevPos.z;
  }
  return {
    blocked: position.z === prevPos.z && delta.z !== 0,
  };
}

export function applyMovementPostCollisionCorrections({
  position,
  prevPos = null,
  resolveStartRingPenetration,
  startWallOn = false,
  startHardClamp = false,
  startX = 0,
  startZ = 0,
  startRadius = 0,
  margin = 0.6,
}) {
  if (typeof resolveStartRingPenetration === "function") {
    resolveStartRingPenetration(position, prevPos);
  }

  if (!(startWallOn && startHardClamp)) return;

  const dx = position.x - startX;
  const dz = position.z - startZ;
  const dist = Math.hypot(dx, dz);
  const limit = startRadius - margin;

  if (dist > limit && dist > 0.0001) {
    const nx = dx / dist;
    const nz = dz / dist;
    position.x = startX + nx * limit;
    position.z = startZ + nz * limit;
  }
}
