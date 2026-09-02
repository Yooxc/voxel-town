import * as THREE from "three";
import {
  getWastelandWallOffset,
  getWastelandStairVisualRotation,
  getWastelandStructureLevelOffset,
  normalizeWastelandBuildLevel,
  WASTELAND_DOOR_HEADER_HEIGHT,
  WASTELAND_DOOR_OPENING_HEIGHT,
  WASTELAND_STORY_HEIGHT,
  WASTELAND_WALL_THICKNESS,
  WASTELAND_WINDOW_HEADER_HEIGHT,
  WASTELAND_WINDOW_OPENING_HEIGHT,
  WASTELAND_WINDOW_SILL_HEIGHT,
} from "../systems/wastelandBuilding.js";

function createProceduralTexture(kind) {
  const size = 32;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const grain = ((x * 17 + y * 11) % 9) - 4;
      if (kind === "wood") {
        const seam = y % 8 === 0 || (x + Math.floor(y / 8) * 5) % 29 === 0;
        pixels[index] = seam ? 73 : 151 + grain * 2;
        pixels[index + 1] = seam ? 41 : 92 + grain;
        pixels[index + 2] = seam ? 19 : 48 + grain;
      } else {
        const mortar = x % 8 === 0 || y % 6 === 0 || ((Math.floor(y / 6) % 2) && x % 8 === 7);
        const shade = mortar ? 116 : 169 + grain * 2;
        pixels[index] = shade;
        pixels[index + 1] = shade + 4;
        pixels[index + 2] = shade + 9;
      }
      pixels[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(
    pixels,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createStructureMaterial(type, { accent = false } = {}) {
  const isStone = type.startsWith("stone");
  return new THREE.MeshStandardMaterial({
    color: accent ? (isStone ? 0x68707c : 0x5c3118) : 0xffffff,
    map: createProceduralTexture(isStone ? "stone" : "wood"),
    roughness: isStone ? 0.94 : 0.78,
    metalness: 0,
  });
}

function createWastelandStructurePartBox({ width, height, depth, y, type, showOutline = false }) {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, createStructureMaterial(type));
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  if (showOutline) {
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82, depthTest: true, depthWrite: false }),
    );
    outline.position.y = y;
    group.add(outline);
  }
  return group;
}

function addWallEndCaps(group, width, height, depth, y, type) {
  const geometry = new THREE.BoxGeometry(0.08, height + 0.04, depth + 0.025);
  for (const x of [-width * 0.5 + 0.04, width * 0.5 - 0.04]) {
    const cap = new THREE.Mesh(geometry, createStructureMaterial(type, { accent: true }));
    cap.position.set(x, y, 0);
    cap.castShadow = true;
    cap.receiveShadow = true;
    group.add(cap);
  }
}

function addStructureBox(group, { width, height, depth, x = 0, y = 0, z = 0, type, accent = false, showOutline = false }) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, createStructureMaterial(type, { accent }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  if (showOutline) {
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82, depthTest: true, depthWrite: false }),
    );
    outline.position.copy(mesh.position);
    group.add(outline);
  }
  return mesh;
}

function createDoorStructure({ width, depth, type, isOpen, showOutline }) {
  const group = new THREE.Group();
  const frameWidth = 0.16;
  addStructureBox(group, { width: frameWidth, height: WASTELAND_STORY_HEIGHT, depth: depth + 0.04, x: -width * 0.5 + frameWidth * 0.5, y: WASTELAND_STORY_HEIGHT * 0.5, type, accent: true, showOutline });
  addStructureBox(group, { width: frameWidth, height: WASTELAND_STORY_HEIGHT, depth: depth + 0.04, x: width * 0.5 - frameWidth * 0.5, y: WASTELAND_STORY_HEIGHT * 0.5, type, accent: true, showOutline });
  addStructureBox(group, { width, height: WASTELAND_DOOR_HEADER_HEIGHT, depth: depth + 0.04, y: WASTELAND_DOOR_OPENING_HEIGHT + WASTELAND_DOOR_HEADER_HEIGHT * 0.5, type, accent: true, showOutline });

  const doorWidth = width - frameWidth * 2 - 0.05;
  const doorHeight = WASTELAND_DOOR_OPENING_HEIGHT - 0.05;
  const pivot = new THREE.Group();
  pivot.position.set(-width * 0.5 + frameWidth, 0, 0);
  pivot.rotation.y = isOpen ? -Math.PI * 0.5 : 0;
  const slab = addStructureBox(pivot, {
    width: doorWidth,
    height: doorHeight,
    depth: depth * 0.72,
    x: doorWidth * 0.5,
    y: doorHeight * 0.5,
    type,
    showOutline,
  });
  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xc9a04f, roughness: 0.45, metalness: 0.35 }),
  );
  handle.position.set(doorWidth * 0.82, doorHeight * 0.52, depth * 0.48);
  pivot.add(handle);
  group.add(pivot);
  group.userData.wastelandDoorPivot = pivot;
  group.userData.wastelandDoorSlab = slab;
  return group;
}

function createWindowStructure({ width, depth, type, showOutline }) {
  const group = new THREE.Group();
  const sideWidth = 0.18;
  addStructureBox(group, { width: sideWidth, height: WASTELAND_STORY_HEIGHT, depth, x: -width * 0.5 + sideWidth * 0.5, y: WASTELAND_STORY_HEIGHT * 0.5, type, accent: true, showOutline });
  addStructureBox(group, { width: sideWidth, height: WASTELAND_STORY_HEIGHT, depth, x: width * 0.5 - sideWidth * 0.5, y: WASTELAND_STORY_HEIGHT * 0.5, type, accent: true, showOutline });
  addStructureBox(group, { width: width - sideWidth * 2, height: WASTELAND_WINDOW_SILL_HEIGHT, depth, y: WASTELAND_WINDOW_SILL_HEIGHT * 0.5, type, showOutline });
  addStructureBox(group, { width: width - sideWidth * 2, height: WASTELAND_WINDOW_HEADER_HEIGHT, depth, y: WASTELAND_WINDOW_SILL_HEIGHT + WASTELAND_WINDOW_OPENING_HEIGHT + WASTELAND_WINDOW_HEADER_HEIGHT * 0.5, type, showOutline });

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width - sideWidth * 2 - 0.08, WASTELAND_WINDOW_OPENING_HEIGHT - 0.08, 0.035),
    new THREE.MeshPhysicalMaterial({
      color: 0xaedcf0,
      transparent: true,
      opacity: 0.3,
      roughness: 0.16,
      metalness: 0,
      transmission: 0.12,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  glass.position.y = WASTELAND_WINDOW_SILL_HEIGHT + WASTELAND_WINDOW_OPENING_HEIGHT * 0.5;
  glass.renderOrder = 1;
  group.add(glass);
  return group;
}

function createStairStructure({ cellSize, type, showOutline }) {
  const group = new THREE.Group();
  const steps = 8;
  const width = cellSize * 0.78;
  const run = cellSize * 2;
  const stepDepth = run / steps;
  for (let index = 0; index < steps; index += 1) {
    const height = WASTELAND_STORY_HEIGHT * ((index + 1) / steps);
    addStructureBox(group, {
      width,
      height,
      depth: stepDepth + 0.025,
      x: 0,
      y: height * 0.5,
      z: cellSize * 0.5 - stepDepth * (index + 0.5),
      type,
      showOutline,
    });
  }
  const sideColliderMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  for (const x of [-(width * 0.5 + 0.06), width * 0.5 + 0.06]) {
    const sideCollider = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, WASTELAND_STORY_HEIGHT, run),
      sideColliderMaterial,
    );
    sideCollider.position.set(x, WASTELAND_STORY_HEIGHT * 0.5, cellSize * 0.5 - run * 0.5);
    sideCollider.userData.isWastelandStairSideCollider = true;
    group.add(sideCollider);
  }
  // Block entry through the stair's rear underside without obstructing the top landing.
  const rearColliderHeight = WASTELAND_STORY_HEIGHT - 0.5;
  const rearCollider = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.12, rearColliderHeight, 0.12),
    sideColliderMaterial,
  );
  rearCollider.position.set(0, rearColliderHeight * 0.5, cellSize * 0.5 - run - 0.06);
  rearCollider.userData.isWastelandStairRearCollider = true;
  group.add(rearCollider);
  return group;
}

function createRoofStructure({ cellSize, type, showOutline }) {
  const group = new THREE.Group();
  const overhang = 0.14;
  const halfWidth = (cellSize + overhang) * 0.5;
  const roofDepth = cellSize + overhang;
  const rise = Math.max(0.42, cellSize * 0.3);
  addStructureBox(group, { width: cellSize + overhang, height: 0.16, depth: roofDepth, y: 0.08, type, accent: true, showOutline });
  const slopeLength = Math.hypot(halfWidth, rise) + 0.05;
  for (const direction of [-1, 1]) {
    const slope = addStructureBox(group, {
      width: slopeLength,
      height: 0.14,
      depth: roofDepth,
      x: direction * halfWidth * 0.5,
      y: 0.16 + rise * 0.5,
      type,
      showOutline,
    });
    slope.rotation.z = direction * Math.atan2(rise, halfWidth);
  }
  return group;
}

export function createWastelandStructureMesh(structure, getBuildPartDef, { preview = false } = {}) {
  const type = structure?.type ?? "";
  const def = getBuildPartDef(type);
  if (!def) return null;
  const surfaceY = Number.isFinite(Number(structure?.y)) ? Number(structure.y) : 0.22;
  const levelOffset = getWastelandStructureLevelOffset(structure?.level);
  const cellSize = Math.max(0.5, Number(structure?.cellSize) || 1.8);
  let mesh = null;
  if (def.slot === "floor") {
    mesh = createWastelandStructurePartBox({ width: cellSize + 0.01, height: 0.22, depth: cellSize + 0.01, y: 0.11, type, showOutline: preview });
    mesh.position.set(structure.x, surfaceY + levelOffset + 0.035, structure.z);
  } else if (def.slot === "stairs") {
    mesh = createStairStructure({ cellSize, type, showOutline: preview });
    mesh.position.set(structure.x, surfaceY + levelOffset + 0.02, structure.z);
    mesh.rotation.y = getWastelandStairVisualRotation(structure.rotationQuarter);
  } else if (def.slot === "roof" && def.structureKind === "roof") {
    mesh = createRoofStructure({ cellSize, type, showOutline: preview });
    mesh.position.set(structure.x, surfaceY + levelOffset + WASTELAND_STORY_HEIGHT + 0.02, structure.z);
  } else if (def.slot === "wall") {
    const width = cellSize + 0.015;
    const height = WASTELAND_STORY_HEIGHT;
    const depth = WASTELAND_WALL_THICKNESS;
    if (def.structureKind === "door") {
      mesh = createDoorStructure({ width, depth, type, isOpen: Boolean(structure.isOpen), showOutline: preview });
    } else if (def.structureKind === "window") {
      mesh = createWindowStructure({ width, depth, type, showOutline: preview });
    } else {
      mesh = createWastelandStructurePartBox({ width, height, depth, y: height * 0.5, type, showOutline: preview });
      addWallEndCaps(mesh, width, height, depth, height * 0.5, type);
    }
    const offset = getWastelandWallOffset(cellSize, structure.rotationQuarter);
    mesh.position.set(structure.x + offset.x, surfaceY + levelOffset + 0.02, structure.z + offset.z);
    mesh.rotation.y = (structure.rotationQuarter ?? 0) * (Math.PI * 0.5);
  } else if (def.slot === "pillar") {
    mesh = createWastelandStructurePartBox({ width: 0.44, height: WASTELAND_STORY_HEIGHT, depth: 0.44, y: WASTELAND_STORY_HEIGHT * 0.5, type, showOutline: preview });
    mesh.position.set(structure.x, surfaceY + levelOffset + 0.02, structure.z);
  }
  if (!mesh) return null;
  mesh.name = `wasteland-structure-${type}-${structure.row}-${structure.col}`;
  mesh.userData.wastelandStructureKey = structure.key;
  mesh.userData.wastelandStructureLevel = normalizeWastelandBuildLevel(structure?.level) ?? 0;
  mesh.userData.wastelandStructureKind = def.structureKind ?? def.slot;
  mesh.userData.wastelandDoorOpen = def.structureKind === "door" && Boolean(structure.isOpen);
  mesh.traverse((child) => { child.frustumCulled = false; });
  return mesh;
}

export function getWastelandStructureOccupancyBounds(structure, getBuildPartDef, { padding = 0.08 } = {}) {
  const type = structure?.type ?? "";
  const def = getBuildPartDef(type);
  if (!def) return null;
  const cellSize = Math.max(0.5, Number(structure?.cellSize) || 1.8);
  const surfaceY = Number.isFinite(Number(structure?.y)) ? Number(structure.y) : 0.22;
  const levelOffset = getWastelandStructureLevelOffset(structure?.level);
  const baseY = surfaceY + levelOffset;
  const rotation = ((Math.round(Number(structure?.rotationQuarter) || 0) % 4) + 4) % 4;
  const pad = Math.max(0, Number(padding) || 0);
  let centerX = Number(structure?.x) || 0;
  let centerZ = Number(structure?.z) || 0;
  let width = cellSize;
  let depth = cellSize;
  let minY = baseY;
  let maxY = baseY;

  if (def.slot === "floor") return null;
  if (def.slot === "stairs") {
    const run = cellSize * 2;
    const stairWidth = cellSize * 0.78;
    const visualRotation = getWastelandStairVisualRotation(rotation);
    const sin = Math.sin(visualRotation);
    const cos = Math.cos(visualRotation);
    centerX += sin * -cellSize * 0.5;
    centerZ += cos * -cellSize * 0.5;
    width = Math.abs(cos) * stairWidth + Math.abs(sin) * run;
    depth = Math.abs(sin) * stairWidth + Math.abs(cos) * run;
    minY = baseY + 0.02;
    maxY = minY + WASTELAND_STORY_HEIGHT;
  } else if (def.slot === "roof") {
    const rise = Math.max(0.42, cellSize * 0.3);
    width = cellSize + 0.14;
    depth = cellSize + 0.14;
    minY = baseY + WASTELAND_STORY_HEIGHT + 0.02;
    maxY = minY + 0.16 + rise;
  } else if (def.slot === "wall") {
    const offset = getWastelandWallOffset(cellSize, rotation);
    centerX += offset.x;
    centerZ += offset.z;
    const horizontal = rotation % 2 === 0;
    width = horizontal ? cellSize + 0.015 : WASTELAND_WALL_THICKNESS;
    depth = horizontal ? WASTELAND_WALL_THICKNESS : cellSize + 0.015;
    minY = baseY + 0.02;
    maxY = minY + WASTELAND_STORY_HEIGHT;
  } else if (def.slot === "pillar") {
    width = 0.44;
    depth = 0.44;
    minY = baseY + 0.02;
    maxY = minY + WASTELAND_STORY_HEIGHT;
  } else {
    return null;
  }

  return {
    minX: centerX - width * 0.5 - pad,
    maxX: centerX + width * 0.5 + pad,
    minY,
    maxY,
    minZ: centerZ - depth * 0.5 - pad,
    maxZ: centerZ + depth * 0.5 + pad,
  };
}

export function createWastelandStructurePreviewMesh(structure, getBuildPartDef, { valid = true } = {}) {
  const preview = createWastelandStructureMesh(structure, getBuildPartDef, { preview: true });
  if (!preview) return null;
  const color = valid ? 0x52d681 : 0xf05b57;
  preview.name = `wasteland-structure-preview-${structure?.type ?? "unknown"}`;
  preview.userData.isWastelandStructurePreview = true;
  preview.traverse((child) => {
    if (!child.material) return;
    child.material = child.material.clone();
    child.material.transparent = true;
    child.material.opacity = child.isLineSegments ? 0.9 : 0.52;
    child.material.depthWrite = false;
    child.material.depthTest = true;
    child.material.color?.set?.(color);
    child.material.emissive?.set?.(color);
    if ("emissiveIntensity" in child.material) child.material.emissiveIntensity = 0.22;
  });
  return preview;
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


export function createWastelandFoundationMesh(foundation, plot) {
  if (!foundation?.bounds || !plot) return null;
  const { bounds } = foundation;
  const width = bounds.width * plot.cellSize - 0.12;
  const depth = bounds.height * plot.cellSize - 0.12;
  const centerColumn = (bounds.minCol + bounds.maxCol) * 0.5;
  const centerRow = (bounds.minRow + bounds.maxRow) * 0.5;
  const firstCell = plot.cells.find((cell) => cell.row === bounds.minRow && cell.col === bounds.minCol);
  if (!firstCell) return null;
  const x = firstCell.x + (centerColumn - bounds.minCol) * plot.cellSize;
  const z = firstCell.z + (centerRow - bounds.minRow) * plot.cellSize;
  const geometry = new THREE.BoxGeometry(width, 0.26, depth);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x8d9399, roughness: 0.82, metalness: 0.04 }),
  );
  mesh.name = `wasteland-foundation-${foundation.id}`;
  mesh.position.set(x, -0.33, z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.userData.foundationId = foundation.id;
  return mesh;
}
