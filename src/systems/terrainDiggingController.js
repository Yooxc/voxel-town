import * as THREE from "three";

export function createTerrainDiggingController({
  terrainMap,
  getCurrentMapId,
  getPlayer,
  getEquippedToolId,
  digRadius = 1.4,
  digAmount = 0.3,
}) {
  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3(0, -1, 0);
  const targetPoint = new THREE.Vector3();
  const localPoint = new THREE.Vector3();

  function findTarget() {
    if (getCurrentMapId() !== terrainMap.mapId) return null;
    const player = getPlayer();
    targetPoint.set(
      player.position.x + Math.sin(player.rotation.y) * 1.6,
      player.position.y + 3,
      player.position.z + Math.cos(player.rotation.y) * 1.6,
    );
    rayOrigin.copy(targetPoint);
    raycaster.set(rayOrigin, rayDirection);
    raycaster.far = 6;
    const hit = raycaster.intersectObject(terrainMap.mesh, false)[0];
    if (!hit) return null;
    terrainMap.mesh.worldToLocal(localPoint.copy(hit.point));
    return { mesh: terrainMap.mesh, worldPoint: hit.point.clone(), localPoint: localPoint.clone() };
  }

  function getHint() {
    const target = findTarget();
    if (!target) return "";
    if (getEquippedToolId() !== "shovel") return "Space : 땅 파기 (삽 장착 필요)";
    if (!terrainMap.canDigAt(target.localPoint.x, target.localPoint.z)) return "이 구역은 파낼 수 없습니다";
    return "Space : 땅 파기";
  }

  function dig() {
    const target = findTarget();
    if (!target) return { ok: false, reason: "no-target" };
    if (getEquippedToolId() !== "shovel") return { ok: false, reason: "need-shovel", target };
    if (!terrainMap.canDigAt(target.localPoint.x, target.localPoint.z)) return { ok: false, reason: "blocked", target };
    const result = terrainMap.terrain.digAt({
      x: target.localPoint.x,
      z: target.localPoint.z,
      radius: digRadius,
      amount: digAmount,
      canDigAt: terrainMap.canDigAt,
    });
    if (!result.changed) return { ok: false, reason: "max-depth", target };
    terrainMap.applyHeights();
    return { ok: true, target, changedVertices: result.changedIndices.length };
  }

  function reset() {
    terrainMap.reset();
  }

  return { findTarget, getHint, dig, reset };
}
