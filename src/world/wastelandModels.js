import * as THREE from "three";

function createWastelandStructurePartBox({
  width,
  height,
  depth,
  y,
  color,
  emissive,
  outlineColor,
}) {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 0.18,
      roughness: 0.86,
      metalness: 0.02,
    })
  );
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.renderOrder = 4;
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({
      color: outlineColor,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    })
  );
  outline.position.y = y;
  outline.renderOrder = 5;
  group.add(mesh);
  group.add(outline);
  return group;
}

export function createWastelandStructureMesh(structure, getBuildPartDef) {
  const type = structure?.type ?? "";
  const def = getBuildPartDef(type);
  if (!def) return null;
  const surfaceY = Number.isFinite(Number(structure?.y)) ? Number(structure.y) : 0.22;
  let mesh = null;
  if (def.slot === "floor") {
    mesh = createWastelandStructurePartBox({
      width: 1.64,
      height: 0.22,
      depth: 1.64,
      y: 0.11,
      color: type.startsWith("stone") ? 0xd9dde6 : 0xb77a3e,
      emissive: type.startsWith("stone") ? 0x3f4652 : 0x4a2108,
      outlineColor: type.startsWith("stone") ? 0xf5f7ff : 0xffd09a,
    });
    mesh.position.set(structure.x, surfaceY + 0.035, structure.z);
  } else if (def.slot === "wall") {
    mesh = createWastelandStructurePartBox({
      width: 1.74,
      height: 1.78,
      depth: 0.24,
      y: 0.89,
      color: type.startsWith("stone") ? 0xcbd0db : 0x9a6537,
      emissive: type.startsWith("stone") ? 0x333b48 : 0x351808,
      outlineColor: type.startsWith("stone") ? 0xf3f6ff : 0xffc47f,
    });
    mesh.position.set(structure.x, surfaceY + 0.02, structure.z);
    mesh.rotation.y = (structure.rotationQuarter ?? 0) * (Math.PI * 0.5);
  } else if (def.slot === "pillar") {
    mesh = createWastelandStructurePartBox({
      width: 0.44,
      height: 1.88,
      depth: 0.44,
      y: 0.94,
      color: type.startsWith("stone") ? 0xc1c6d0 : 0x89572f,
      emissive: type.startsWith("stone") ? 0x323944 : 0x321707,
      outlineColor: type.startsWith("stone") ? 0xf3f6ff : 0xffc47f,
    });
    mesh.position.set(structure.x, surfaceY + 0.02, structure.z);
  }
  if (!mesh) return null;
  mesh.name = `wasteland-structure-${type}-${structure.row}-${structure.col}`;
  mesh.userData.wastelandStructureKey = structure.key;
  mesh.traverse((child) => {
    child.frustumCulled = false;
  });
  return mesh;
}

export function createWastelandFencePostMesh() {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.9, 8),
    new THREE.MeshStandardMaterial({ color: 0x75573a, roughness: 0.95 })
  );
  shaft.position.y = 0.45;
  group.add(shaft);
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.12, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x4d3824, roughness: 0.92 })
  );
  cap.position.y = 0.93;
  group.add(cap);
  return group;
}

export function createWastelandFenceLinkMesh(length, horizontal = true) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(horizontal ? length : 0.12, 0.1, horizontal ? 0.12 : length),
    new THREE.MeshStandardMaterial({ color: 0x8a6a49, roughness: 0.95 })
  );
  mesh.position.y = 0.62;
  return mesh;
}

export function createWastelandPreviewCellMesh(cell, color, opacity, height = 0.018) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(cell.size - 0.26, height, cell.size - 0.26),
    new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      roughness: 0.9,
      depthWrite: false,
    })
  );
  mesh.position.set(cell.x, 0.19, cell.z);
  return mesh;
}
