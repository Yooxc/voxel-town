import * as THREE from "three";

export function createRefineryModel(buildPurifyPowderModel) {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x48515c, roughness: 0.72, metalness: 0.28 });
  const chamberMat = new THREE.MeshStandardMaterial({ color: 0xa6ddc8, roughness: 0.38, metalness: 0.1, emissive: 0x3f9372, emissiveIntensity: 0.16 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xc7ced8, roughness: 0.28, metalness: 0.44 });
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x72543c, roughness: 0.84, metalness: 0.08 });
  const gaugeMat = new THREE.MeshStandardMaterial({ color: 0xf0f2f5, roughness: 0.22, metalness: 0.06 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2d3238, roughness: 0.88, metalness: 0.18 });
  const addBox = (width, height, depth, material, position) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(...position);
    group.add(mesh);
    return mesh;
  };
  addBox(1.9, 0.16, 1.16, frameMat, [0, 0.08, 0]);
  for (const position of [[-0.76, 0.56, -0.42], [0.76, 0.56, -0.42], [-0.76, 0.56, 0.42], [0.76, 0.56, 0.42]]) {
    addBox(0.12, 0.96, 0.12, darkMat, position);
  }
  addBox(1.58, 0.12, 0.88, frameMat, [0, 0.64, 0]);
  const grinderCore = addBox(0.78, 0.68, 0.6, frameMat, [-0.22, 1.06, 0]);
  addBox(0.48, 0.3, 0.4, accentMat, [-0.22, 1.5, 0]);
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, 0.42, 22), accentMat);
  hopper.position.set(-0.22, 1.86, 0);
  group.add(hopper);
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.84, 20), chamberMat);
  chamber.position.set(0.56, 1.18, 0);
  group.add(chamber);
  for (const [topRadius, bottomRadius, height, y] of [[0.16, 0.18, 0.14, 1.66], [0.17, 0.19, 0.14, 0.7]]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, height, 18), accentMat);
    cap.position.set(0.56, y, 0);
    group.add(cap);
  }
  const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.96, 14), accentMat);
  conduit.rotation.z = Math.PI * 0.5;
  conduit.position.set(0.17, 1.26, 0);
  group.add(conduit);
  const dischargeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.54, 14), accentMat);
  dischargeTube.rotation.z = Math.PI * 0.34;
  dischargeTube.position.set(0.84, 0.82, 0);
  group.add(dischargeTube);
  addBox(0.56, 0.08, 0.34, trayMat, [0.98, 0.5, 0]);
  const powderJar = buildPurifyPowderModel();
  powderJar.scale.setScalar(0.9);
  powderJar.position.set(0.95, 0.62, 0.12);
  group.add(powderJar);
  const gaugeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 20), gaugeMat);
  gaugeBody.rotation.x = Math.PI * 0.5;
  gaugeBody.position.set(-0.63, 1.08, 0.34);
  group.add(gaugeBody);
  const gaugeNeedle = addBox(0.09, 0.01, 0.018, darkMat, [-0.61, 1.08, 0.37]);
  gaugeNeedle.rotation.z = -0.58;
  const leverBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 16), darkMat);
  leverBase.position.set(-0.72, 0.82, -0.32);
  group.add(leverBase);
  const leverHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.34, 12), accentMat);
  leverHandle.rotation.z = Math.PI * -0.22;
  leverHandle.position.set(-0.78, 1.02, -0.32);
  group.add(leverHandle);
  addBox(0.34, 0.08, 0.02, gaugeMat, [-0.22, 2.12, 0]);
  const collider = new THREE.Mesh(new THREE.BoxGeometry(1.72, 2.26, 1.1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
  collider.position.set(0.1, 1.13, 0);
  group.add(collider);
  return { group, collider, grinderCore };
}
