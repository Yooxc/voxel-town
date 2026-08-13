import * as THREE from "three";

export function resolveCameraOcclusionDistance({
  currentDistance,
  preferredDistance,
  previousResolvedDistance,
  wasOccludedLastFrame,
  hitDistance,
  dt,
  maxDistance,
  margin,
  minDistance,
  returnSpeed,
}) {
  if (currentDistance < 0.001) return null;
  const nextPreferredDistance = !wasOccludedLastFrame || currentDistance > previousResolvedDistance + 0.2
    ? THREE.MathUtils.clamp(currentDistance, minDistance, maxDistance)
    : preferredDistance;
  if (Number.isFinite(hitDistance)) {
    return {
      preferredDistance: nextPreferredDistance,
      resolvedDistance: Math.max(minDistance, hitDistance - margin),
      wasOccluded: true,
    };
  }
  return {
    preferredDistance: nextPreferredDistance,
    resolvedDistance: THREE.MathUtils.lerp(currentDistance, nextPreferredDistance, Math.min(1, dt * returnSpeed)),
    wasOccluded: false,
  };
}

export function createCameraOcclusionState(initialDistance) {
  return {
    ray: new THREE.Raycaster(),
    target: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    resolvedPosition: new THREE.Vector3(),
    preferredDistance: initialDistance,
    resolvedDistance: initialDistance,
    wasOccludedLastFrame: false,
    fadedMeshes: new Set(),
  };
}

export function clearCameraOcclusionFades(state) {
  for (const mesh of state.fadedMeshes) {
    if (!mesh?.material || !mesh.userData?.cameraFadeOriginal) continue;
    const original = mesh.userData.cameraFadeOriginal;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      material.transparent = original.transparent;
      material.opacity = original.opacity;
    }
  }
  state.fadedMeshes.clear();
}

export function markCameraOcclusionFade(root, state, opacity) {
  root?.traverse((child) => {
    if (!child?.isMesh || !child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    if (!materials.some((material) => (material?.opacity ?? 1) > 0.05)) return;
    if (!child.userData.cameraFadeOriginal) {
      child.userData.cameraFadeOriginal = {
        transparent: materials[0].transparent,
        opacity: materials[0].opacity,
      };
    }
    for (const material of materials) {
      material.transparent = true;
      material.opacity = Math.min(material.opacity, opacity);
    }
    state.fadedMeshes.add(child);
  });
}

export function getCameraFadeRootFromHit(hitObject, scene) {
  if (!hitObject) return null;
  const material = hitObject.material;
  const opacity = Array.isArray(material) ? (material[0]?.opacity ?? 1) : (material?.opacity ?? 1);
  if (hitObject.isMesh && opacity > 0.05) return hitObject;
  let node = hitObject.parent;
  while (node && node !== scene) {
    if (node.isMesh || node.type === "Group") return node;
    node = node.parent;
  }
  return hitObject.parent && hitObject.parent !== scene ? hitObject.parent : null;
}

export function updateThirdPersonCameraOcclusion({ camera, controls, colliders, scene, state, dt, config }) {
  clearCameraOcclusionFades(state);
  state.target.copy(controls.target);
  state.target.y += 0.22;
  const currentOffset = new THREE.Vector3().copy(camera.position).sub(controls.target);
  const currentDistance = currentOffset.length();
  if (currentDistance < 0.001) return;
  state.direction.copy(currentOffset).normalize();
  if (!state.wasOccludedLastFrame || currentDistance > state.resolvedDistance + 0.2) {
    state.preferredDistance = THREE.MathUtils.clamp(currentDistance, config.minDistance, controls.maxDistance);
  }
  state.ray.far = state.preferredDistance;
  state.ray.set(state.target, state.direction);
  const hit = state.ray.intersectObjects(colliders, false)[0] ?? null;
  const resolution = resolveCameraOcclusionDistance({
    currentDistance,
    preferredDistance: state.preferredDistance,
    previousResolvedDistance: state.resolvedDistance,
    wasOccludedLastFrame: state.wasOccludedLastFrame,
    hitDistance: hit?.distance,
    dt,
    maxDistance: controls.maxDistance,
    margin: config.margin,
    minDistance: config.minDistance,
    returnSpeed: config.returnSpeed,
  });
  if (!resolution) return;
  state.preferredDistance = resolution.preferredDistance;
  state.resolvedDistance = resolution.resolvedDistance;
  state.wasOccludedLastFrame = resolution.wasOccluded;
  if (hit && resolution.resolvedDistance <= config.fadeDistance) {
    markCameraOcclusionFade(getCameraFadeRootFromHit(hit.object, scene), state, config.fadeOpacity);
  }
  state.resolvedPosition.copy(controls.target).addScaledVector(state.direction, resolution.resolvedDistance);
  camera.position.copy(state.resolvedPosition);
}
