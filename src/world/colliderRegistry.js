import * as THREE from "three";

export function createColliderRegistry() {
  const colliders = [];
  const boxes = [];

  function add(obj, options = 1) {
    const config = typeof options === "number" ? { shrink: options } : (options ?? {});
    const shrink = Number.isFinite(Number(config.shrink)) ? Number(config.shrink) : 1;
    obj.userData.colliderShrink = shrink;
    obj.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(obj);
    if (shrink !== 1) {
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).multiplyScalar(shrink);
      box.setFromCenterAndSize(center, size);
    }
    if (config.preciseShape?.type === "orientedBox") {
      const center = box.getCenter(new THREE.Vector3());
      box.userData = {
        preciseShape: {
          type: "orientedBox",
          centerX: Number.isFinite(Number(config.preciseShape.centerX)) ? Number(config.preciseShape.centerX) : center.x,
          centerZ: Number.isFinite(Number(config.preciseShape.centerZ)) ? Number(config.preciseShape.centerZ) : center.z,
          halfX: Math.max(0.01, Number(config.preciseShape.halfX) || 0.01),
          halfZ: Math.max(0.01, Number(config.preciseShape.halfZ) || 0.01),
          rotationY: Number(config.preciseShape.rotationY) || 0,
          minY: Number.isFinite(Number(config.preciseShape.minY)) ? Number(config.preciseShape.minY) : box.min.y,
          maxY: Number.isFinite(Number(config.preciseShape.maxY)) ? Number(config.preciseShape.maxY) : box.max.y,
        },
      };
    }
    const index = colliders.length;
    colliders.push(obj);
    boxes.push(box);
    obj.userData.colliderIndex = index;
    return index;
  }

  function removeAt(index) {
    const removed = colliders[index];
    colliders.splice(index, 1);
    boxes.splice(index, 1);
    if (removed?.userData) removed.userData.colliderIndex = null;
    for (let entryIndex = 0; entryIndex < colliders.length; entryIndex += 1) {
      const collider = colliders[entryIndex];
      if (collider?.userData) collider.userData.colliderIndex = entryIndex;
    }
  }

  function getTrackedIndex(obj, fallback = null) {
    const tracked = obj?.userData?.colliderIndex;
    if (typeof tracked === "number") return tracked;
    return typeof fallback === "number" ? fallback : null;
  }

  return { colliders, boxes, add, removeAt, getTrackedIndex };
}
