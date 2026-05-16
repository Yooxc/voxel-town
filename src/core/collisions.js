import * as THREE from "three";

export function getPlayerBoxFromPosition(position, size = { x: 0.8, y: 2.0, z: 0.8 }, centerYOffset = 1.0) {
  const center = position.clone().add(new THREE.Vector3(0, centerYOffset, 0));
  const box = new THREE.Box3();
  box.setFromCenterAndSize(center, new THREE.Vector3(size.x, size.y, size.z));
  return box;
}

export function intersectsAnyColliderBox(playerBox, colliderBoxes = []) {
  for (let i = 0; i < colliderBoxes.length; i++) {
    if (playerBox.intersectsBox(colliderBoxes[i])) return true;
  }
  return false;
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
  isStartRingTransitionBlocked,
  isCrossingBlockedStartRing,
}) {
  if (axis === "x") {
    position.x = prevPos.x + delta.x;
    if (
      !isInsideBounds(position.x, position.z) ||
      intersectsAnyCollider() ||
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
    intersectsAnyCollider() ||
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
