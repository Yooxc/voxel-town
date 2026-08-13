import * as THREE from "three";

export function createForgeAnvilModel() {
  const group = new THREE.Group();
  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.55, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x67584a, roughness: 1.0 })
  );
  stand.position.y = 0.28;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.24, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x4d5661, roughness: 0.9 })
  );
  body.position.y = 0.78;
  const horn = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.18, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x59636f, roughness: 0.85 })
  );
  horn.position.set(0.54, 0.81, 0);
  horn.scale.set(1.2, 1, 0.7);
  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x717a87, roughness: 0.82 })
  );
  topPlate.position.set(-0.1, 0.94, 0);
  group.add(stand, body, horn, topPlate);
  return group;
}
