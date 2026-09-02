import * as THREE from "three";

export function createPlayerGroundingRuntime({
  groundSurfaces,
  ceilingSurfaces = [],
  footOffset,
  playerHeight = 0,
  ceilingClearance = 0.04,
  rayHeight = 20,
  rayFar = 50,
  followBase = 0.001,
  maxStepUp = 0.5,
}) {
  const groundRay = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3(0, -1, 0);
  const ceilingBox = new THREE.Box3();

  function hasHeadroom(position, footY) {
    if (!(playerHeight > 0)) return true;
    const headY = footY + playerHeight + ceilingClearance;
    for (const surface of ceilingSurfaces) {
      if (!surface?.parent) continue;
      surface.updateWorldMatrix(true, true);
      ceilingBox.setFromObject(surface);
      if (
        position.x >= ceilingBox.min.x && position.x <= ceilingBox.max.x
        && position.z >= ceilingBox.min.z && position.z <= ceilingBox.max.z
        && ceilingBox.min.y > footY + 0.001 && headY > ceilingBox.min.y
      ) return false;
    }
    return true;
  }

  function update(player, dt) {
    rayOrigin.set(player.position.x, player.position.y + rayHeight, player.position.z);
    groundRay.set(rayOrigin, rayDirection);
    groundRay.far = rayFar;

    const hits = groundRay.intersectObjects(groundSurfaces, true);
    const accessibleHit = hits.find((hit) => (
      hit.point.y + footOffset <= player.position.y + maxStepUp + 0.0001
    ));
    if (!accessibleHit) return false;

    const targetY = accessibleHit.point.y + footOffset;
    if (!hasHeadroom(player.position, targetY)) return false;
    const heightDelta = targetY - player.position.y;
    if (heightDelta > 0 && heightDelta <= maxStepUp + 0.0001) {
      player.position.y = targetY;
    } else {
      const follow = 1 - Math.pow(followBase, dt);
      player.position.y += heightDelta * follow;
    }
    return true;
  }

  return { update };
}
