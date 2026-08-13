import * as THREE from "three";

export function createNftExhibitBoardModel() {
  const group = new THREE.Group();
  const boardWidth = 4.02;
  const boardHeight = 3.52;
  const halfWidth = boardWidth * 0.5;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2d3138, roughness: 0.55, metalness: 0.45 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.92, metalness: 0.03 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1d1f24, roughness: 0.72, metalness: 0.25 });
  const addBox = (width, height, depth, material, position) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(...position);
    group.add(mesh);
    return mesh;
  };
  addBox(0.12, 3.55, 0.12, frameMat, [-halfWidth - 0.12, 1.78, -0.12]);
  addBox(0.12, 3.55, 0.12, frameMat, [halfWidth + 0.12, 1.78, -0.12]);
  addBox(boardWidth + 0.18, 0.1, 0.1, frameMat, [0, 0.42, -0.12]);
  const frame = addBox(boardWidth + 0.12, boardHeight + 0.12, 0.08, frameMat, [0, 2.66, -0.02]);
  addBox(boardWidth, boardHeight, 0.04, panelMat, [0, 2.66, 0.03]);
  const screenMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(boardWidth - 0.16, boardHeight - 0.16), screenMaterial);
  screen.position.set(0, 2.66, 0.055);
  group.add(screen);
  addBox(1.22, 0.08, 0.18, frameMat, [-halfWidth + 0.42, 0.08, -0.12]);
  addBox(1.22, 0.08, 0.18, frameMat, [halfWidth - 0.42, 0.08, -0.12]);
  for (const position of [[-halfWidth - 0.08, 0.02, -0.08], [-halfWidth + 0.78, 0.02, 0.08], [halfWidth - 0.78, 0.02, -0.08], [halfWidth + 0.08, 0.02, 0.08]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16), wheelMat);
    wheel.rotation.z = Math.PI * 0.5;
    wheel.position.set(...position);
    group.add(wheel);
  }
  return { group, frame, screenMaterial };
}
