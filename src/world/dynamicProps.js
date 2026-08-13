import * as THREE from "three";

export function createDynamicPropsRuntime({
  ground,
  gravity = 18,
  sleepVelocity = 0.08,
  clearance = 0.01,
} = {}) {
  const groundRay = new THREE.Raycaster();
  const props = [];
  const supportSurfaces = [];

  function registerSupportSurface(mesh) {
    supportSurfaces.push(mesh);
    return mesh;
  }

  function enableDynamicProp(obj, options = {}) {
    const body = {
      obj,
      velocityY: options.velocityY ?? 0,
      sleeping: options.sleeping ?? false,
      clearance: options.clearance ?? clearance,
    };
    props.push(body);
    obj.userData.dynamicPropBody = body;
    return body;
  }

  function unregisterDynamicProp(obj) {
    const body = obj?.userData?.dynamicPropBody;
    if (!body) return;
    const index = props.indexOf(body);
    if (index !== -1) props.splice(index, 1);
    delete obj.userData.dynamicPropBody;
  }

  function getGroundYAt(x, z) {
    if (!ground) return null;
    groundRay.set(new THREE.Vector3(x, 40, z), new THREE.Vector3(0, -1, 0));
    groundRay.far = 80;
    const hits = groundRay.intersectObject(ground, false);
    return hits.length > 0 ? hits[0].point.y : null;
  }

  function getHighestSupportY(box, excludeObj = null) {
    let bestY = null;
    const centerX = (box.min.x + box.max.x) * 0.5;
    const centerZ = (box.min.z + box.max.z) * 0.5;
    const groundY = getGroundYAt(centerX, centerZ);
    if (groundY !== null) bestY = groundY;

    for (const mesh of [...supportSurfaces, ...props.filter((body) => body.sleeping).map((body) => body.obj)]) {
      if (!mesh || mesh === excludeObj || !mesh.parent) continue;
      const supportBox = new THREE.Box3().setFromObject(mesh);
      const overlapsXZ = box.max.x > supportBox.min.x && box.min.x < supportBox.max.x
        && box.max.z > supportBox.min.z && box.min.z < supportBox.max.z;
      if (!overlapsXZ || supportBox.max.y > box.max.y) continue;
      if (bestY === null || supportBox.max.y > bestY) bestY = supportBox.max.y;
    }

    return bestY;
  }

  function restPropOnSupport(obj, supportMesh, propClearance = clearance) {
    if (!obj || !supportMesh) return;
    obj.updateWorldMatrix(true, true);
    const objBox = new THREE.Box3().setFromObject(obj);
    const supportBox = new THREE.Box3().setFromObject(supportMesh);
    obj.position.y += supportBox.max.y + propClearance - objBox.min.y;
    obj.updateWorldMatrix(true, true);
  }

  function update(dt) {
    for (const body of props) {
      const obj = body.obj;
      if (!obj || !obj.parent || body.sleeping) continue;

      obj.updateWorldMatrix(true, true);
      const previousBox = new THREE.Box3().setFromObject(obj);
      const previousMinY = previousBox.min.y;
      body.velocityY -= gravity * dt;
      obj.position.y += body.velocityY * dt;
      obj.updateWorldMatrix(true, true);

      const nextBox = new THREE.Box3().setFromObject(obj);
      const supportY = getHighestSupportY(nextBox, obj);
      if (supportY === null) continue;
      const crossedSupport = body.velocityY <= 0
        && previousMinY >= supportY - body.clearance
        && nextBox.min.y <= supportY + body.clearance;
      if (!crossedSupport) continue;

      obj.position.y += supportY + body.clearance - nextBox.min.y;
      body.velocityY = 0;
      if (Math.abs(body.velocityY) <= sleepVelocity) body.sleeping = true;
      obj.updateWorldMatrix(true, true);
    }
  }

  return {
    registerSupportSurface,
    enableDynamicProp,
    unregisterDynamicProp,
    restPropOnSupport,
    update,
  };
}
