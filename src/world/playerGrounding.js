import * as THREE from "three";

export function createPlayerGroundingRuntime({
  groundSurfaces,
  footOffset,
  rayHeight = 20,
  rayFar = 50,
  followBase = 0.001,
}) {
  const groundRay = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3(0, -1, 0);

  function update(player, dt) {
    rayOrigin.set(player.position.x, player.position.y + rayHeight, player.position.z);
    groundRay.set(rayOrigin, rayDirection);
    groundRay.far = rayFar;

    const hits = groundRay.intersectObjects(groundSurfaces, false);
    if (hits.length === 0) return false;

    const targetY = hits[0].point.y + footOffset;
    const follow = 1 - Math.pow(followBase, dt);
    player.position.y += (targetY - player.position.y) * follow;
    return true;
  }

  return { update };
}
