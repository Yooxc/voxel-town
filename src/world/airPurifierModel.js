import * as THREE from "three";

export function createAirPurifierModel(registerDarkMaterial = (material) => material) {
  const group = new THREE.Group();
  const bodyMat = registerDarkMaterial(
    new THREE.MeshStandardMaterial({ color: 0x45505b, roughness: 0.8, metalness: 0.18 }),
    0.2
  );
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x7ae2cb, emissive: 0x2ebf96, roughness: 0.38, metalness: 0.08 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x8398aa, roughness: 0.54, metalness: 0.12 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.1, 1.08), bodyMat);
  base.position.y = 0.56;
  group.add(base);
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.08, 18), glowMat);
  chamber.position.set(0, 1.18, 0);
  group.add(chamber);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.72), accentMat);
  cap.position.set(0, 1.78, 0);
  group.add(cap);
  const pipeLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 12), accentMat);
  pipeLeft.rotation.z = Math.PI * 0.5;
  pipeLeft.position.set(-0.36, 1.16, 0);
  group.add(pipeLeft);
  const pipeRight = pipeLeft.clone();
  pipeRight.position.x *= -1;
  group.add(pipeRight);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.3, 0.05), glowMat);
  screen.position.set(0, 1.05, 0.57);
  group.add(screen);
  return { group, chamber };
}
