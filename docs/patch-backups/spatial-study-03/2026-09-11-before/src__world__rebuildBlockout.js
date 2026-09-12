import * as THREE from "three";
import { getRebuildTerrainHeight } from "./rebuildLayout.js";

const TERRAIN_WIDTH = 96;
const TERRAIN_DEPTH = 110;
const TERRAIN_CENTER_Z = -5;

export { getRebuildTerrainHeight as getRebuildBlockoutHeight } from "./rebuildLayout.js";

function createTerrain(layout) {
  const terrain = new THREE.Mesh(
    new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_DEPTH, 48, 55),
    new THREE.MeshStandardMaterial({ color: 0x728d5e, roughness: 0.98 }),
  );
  terrain.name = "EXCIT_REBUILD_HILL_TERRAIN";
  const positions = terrain.geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index) + layout.origin.x;
    const z = layout.origin.z + TERRAIN_CENTER_Z - positions.getY(index);
    positions.setZ(index, getRebuildTerrainHeight(x, z, layout.origin) - layout.origin.y);
  }
  positions.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.set(layout.origin.x, layout.origin.y + 0.015, layout.origin.z + TERRAIN_CENTER_Z);
  return terrain;
}

function createPathRibbon(layout) {
  const points = [
    { x: -0.2, z: 16.0, width: 4.8 }, { x: -0.7, z: 10.0, width: 5.1 },
    { x: 0.4, z: 2.5, width: 5.4 }, { x: 0.9, z: -6.0, width: 5.8 },
    { x: 0.1, z: -14.5, width: 6.2 }, { x: 0.2, z: -23.0, width: 7.0 },
    { x: 0.2, z: -29.5, width: 8.2 },
  ];
  const vertices = [];
  const indices = [];
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const prev = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const length = Math.hypot(dx, dz) || 1;
    const nx = -dz / length;
    const nz = dx / length;
    const y = getRebuildTerrainHeight(point.x + layout.origin.x, point.z + layout.origin.z, layout.origin) + 0.028;
    vertices.push(
      point.x + layout.origin.x + nx * point.width * 0.5, y, point.z + layout.origin.z + nz * point.width * 0.5,
      point.x + layout.origin.x - nx * point.width * 0.5, y, point.z + layout.origin.z - nz * point.width * 0.5,
    );
    if (index > 0) {
      const base = index * 2;
      indices.push(base - 2, base, base - 1, base - 1, base, base + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const path = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x9c8059, roughness: 1 }));
  path.name = "EXCIT_REBUILD_DESCENT_PATH";
  return path;
}

function createDoor(position) {
  const root = new THREE.Group();
  root.name = "EXCIT_ARRIVAL_DOOR";
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x435460, roughness: 0.86 });
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x263743, roughness: 0.82 });
  const postGeometry = new THREE.BoxGeometry(0.24, 3.2, 0.38);
  const leftPost = new THREE.Mesh(postGeometry, frameMaterial);
  leftPost.position.set(-1.28, 1.6, 0);
  const rightPost = leftPost.clone();
  rightPost.position.x = 1.28;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.28, 0.42), frameMaterial);
  lintel.position.set(0, 3.06, 0);
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.25, 2.78, 0.15), doorMaterial);
  door.position.set(0, 1.4, 0.06);
  root.add(leftPost, rightPost, lintel, door);
  root.position.set(position.x, position.y, position.z);
  root.rotation.y = Math.PI;
  return { root, colliders: [leftPost, rightPost, lintel, door] };
}

function createMarketDisplayItem(item, index) {
  const material = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.9 });
  const root = new THREE.Group();
  let mesh;
  if (item.kind === "stone") mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), material);
  else if (item.kind === "wood") {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.58, 8), material);
    mesh.rotation.z = Math.PI / 2;
  } else if (item.kind === "pot") mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.34, 10), material);
  else if (item.kind === "lamp") {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.36, 10), material);
    mesh.add(new THREE.PointLight(item.color, 0.35, 2.5));
  } else if (item.kind === "tool") {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.5, 8), material);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.11, 0.14), material);
    head.position.y = 0.22;
    root.add(handle, head);
    root.rotation.z = 0.7;
  } else {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.36), material);
    if (item.kind === "crafted") {
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.4), material.clone());
      lid.position.y = 0.19;
      root.add(lid);
    }
  }
  if (mesh) root.add(mesh);
  root.name = `EXCIT_MARKET_DISPLAY_${item.id}`;
  root.position.set(index === 0 ? -0.85 : 0.05, 1.32, 0.38);
  root.userData.setHighlighted = (highlighted) => {
    root.scale.setScalar(highlighted ? 1.16 : 1);
    root.traverse((child) => {
      if (!child.isMesh || !child.material?.emissive) return;
      child.material.emissive.setHex(highlighted ? 0x4b431c : 0x000000);
      child.material.emissiveIntensity = highlighted ? 0.8 : 0;
    });
  };
  return root;
}

function createMarketStall(position, accentColor) {
  const root = new THREE.Group();
  root.name = "EXCIT_MARKET_STALL";
  const wood = new THREE.MeshStandardMaterial({ color: 0x7e5d3e, roughness: 0.96 });
  const canopy = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.92 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 1.15), wood);
  counter.position.y = 1.05;
  root.add(counter);
  const postGeometry = new THREE.BoxGeometry(0.13, 2.1, 0.13);
  for (const x of [-1.42, 1.42]) for (const z of [-0.42, 0.42]) {
    const post = new THREE.Mesh(postGeometry, wood);
    post.position.set(x, 1.05, z);
    root.add(post);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.18, 1.7), canopy);
  roof.position.y = 2.15;
  roof.rotation.z = -0.035;
  root.add(roof);
  const displayItems = (position.displayItems ?? []).map(createMarketDisplayItem);
  root.add(...displayItems);
  root.position.set(position.x, position.y, position.z);
  return { root, counter, displayItems };
}

function createAmbientResident(position, color) {
  const root = new THREE.Group();
  root.name = "EXCIT_MARKET_RESIDENT";
  const clothing = new THREE.MeshStandardMaterial({ color, roughness: 0.96 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe2c7ad, roughness: 0.92 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.52, 3, 8), clothing);
  torso.position.y = 1.12;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skin);
  head.position.y = 1.8;
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.65, 0.23), clothing);
  legs.position.y = 0.34;
  root.add(torso, head, legs);
  root.position.set(position.x, position.y, position.z);
  root.rotation.y = position.rotationY ?? 0;
  return root;
}

function createBoundaryTree(position) {
  const root = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x694b35, roughness: 1 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x516f49, roughness: 0.98 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 3.2, 7), trunkMaterial);
  trunk.position.y = 1.6;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, 1), leafMaterial);
  crown.position.y = 4.05;
  crown.scale.set(1.1, 0.9, 1.05);
  root.add(trunk, crown);
  root.position.set(position.x, position.y, position.z);
  return { root, trunk };
}

function createBoundaryRock(position, scale = 1) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x5c625b, roughness: 1 }));
  rock.name = "EXCIT_REBUILD_BOUNDARY_ROCK";
  rock.position.set(position.x, position.y + scale * 0.65, position.z);
  rock.scale.set(1.25 * scale, 0.9 * scale, scale);
  rock.rotation.set(0.16, position.rotationY ?? 0, -0.1);
  return rock;
}

function createBackdropHill(position) {
  const hill = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: position.color ?? 0x5f7653, roughness: 1 }),
  );
  hill.name = "EXCIT_REBUILD_BACKDROP_HILL";
  hill.position.set(position.x, position.y + position.height * 0.32, position.z);
  hill.scale.set(position.width, position.height, position.depth);
  hill.rotation.y = position.rotationY ?? 0;
  return hill;
}

export function createRebuildBlockout({ scene, groundSurfaces, registerWalkableSurface, addCollider, registerNpc = null, layout }) {
  const root = new THREE.Group();
  root.name = "EXCIT_REBUILD_BLOCKOUT";
  const terrain = createTerrain(layout);
  const path = createPathRibbon(layout);
  const arrivalDoor = createDoor(layout.arrival.door);
  root.add(terrain, path, arrivalDoor.root);
  for (const collider of arrivalDoor.colliders) addCollider(collider, 0.92);
  const marketStalls = layout.market.stalls.map((stall) => createMarketStall(stall, stall.accentColor));
  for (const stall of marketStalls) {
    root.add(stall.root);
    addCollider(stall.counter, 0.92);
  }
  const marketStallById = new Map(layout.market.stalls.map((definition, index) => [
    definition.id,
    { definition, runtime: marketStalls[index] },
  ]));
  const marketResidents = [];
  for (const resident of layout.market.residents) {
    const model = createAmbientResident(resident, resident.color);
    root.add(model);
    addCollider(model, 0.72);
    const stall = marketStallById.get(resident.stallId);
    const setHighlightedDisplayItem = (itemId = "") => {
      stall?.runtime.displayItems.forEach((item, index) => {
        item.userData.setHighlighted?.(stall.definition.displayItems[index]?.id === itemId);
      });
    };
    const entry = registerNpc?.(model, resident.name, "Space : 이야기하기", {
      role: "market-resident",
      market: {
        ...resident,
        displayItems: stall?.definition.displayItems.map((item) => ({ ...item })) ?? [],
        setHighlightedDisplayItem,
      },
    }) ?? null;
    marketResidents.push({ model, entry, definition: resident });
  }

  const boundaryTreePositions = [[-18, 11], [-13, 16], [17, 12], [23, 5], [-25, -3], [26, -13], [16, -25]];
  const boundaryRockPositions = [[-30, 17, 1.8], [30, 16, 1.7], [-32, -9, 2.1], [31, -19, 2], [13, -31, 1.7]];
  for (const [x, z] of boundaryTreePositions) {
    const y = getRebuildTerrainHeight(x + layout.origin.x, z + layout.origin.z, layout.origin);
    const tree = createBoundaryTree({ x: x + layout.origin.x, y, z: z + layout.origin.z });
    root.add(tree.root);
    addCollider(tree.trunk, 0.8);
  }
  for (const [x, z, scale] of boundaryRockPositions) {
    const y = getRebuildTerrainHeight(x + layout.origin.x, z + layout.origin.z, layout.origin);
    const rock = createBoundaryRock({ x: x + layout.origin.x, y, z: z + layout.origin.z, rotationY: x * 0.11 }, scale);
    root.add(rock);
    addCollider(rock, 0.9);
  }
  const backdropHills = [
    [-43, 15, 10, 5.5, 8], [-43, -9, 12, 6.5, 10], [-41, -34, 11, 5.5, 9],
    [43, 16, 10, 5.2, 8], [43, -10, 13, 6.8, 10], [41, -35, 11, 5.8, 9],
    [-31, -50, 13, 6.2, 9], [31, -50, 13, 6.2, 9], [-25, 43, 12, 5.8, 9], [25, 43, 12, 5.8, 9],
  ];
  for (const [x, z, width, height, depth] of backdropHills) {
    const worldX = x + layout.origin.x;
    const worldZ = z + layout.origin.z;
    root.add(createBackdropHill({
      x: worldX,
      y: getRebuildTerrainHeight(worldX, worldZ, layout.origin),
      z: worldZ,
      width,
      height,
      depth,
      rotationY: x * 0.025,
    }));
  }
  scene.add(root);
  groundSurfaces.push(terrain, path);
  registerWalkableSurface(layout.mapId, terrain, 0.8);
  registerWalkableSurface(layout.mapId, path, 0.25);
  return { root, terrain, path, arrivalDoor: arrivalDoor.root, marketStalls, marketResidents };
}


