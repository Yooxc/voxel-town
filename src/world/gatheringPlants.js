import * as THREE from "three";

const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x5f8f55, roughness: 0.95 });
const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x4f7f4b, roughness: 0.94 });
const petalMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f1df, roughness: 0.88 });
const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xe6bd58, roughness: 0.84 });

function createGrassModel() {
  const root = new THREE.Group();
  root.name = "EXCIT_GATHERING_GRASS";
  const bladeGeometry = new THREE.ConeGeometry(0.075, 0.52, 5);
  for (let index = 0; index < 7; index += 1) {
    const blade = new THREE.Mesh(bladeGeometry, grassMaterial);
    const angle = (index / 7) * Math.PI * 2;
    blade.position.set(Math.cos(angle) * 0.12, 0.24, Math.sin(angle) * 0.12);
    blade.rotation.z = Math.cos(angle) * 0.22;
    blade.rotation.x = Math.sin(angle) * 0.22;
    root.add(blade);
  }
  return root;
}

function createFlowerModel() {
  const root = new THREE.Group();
  root.name = "EXCIT_GATHERING_FLOWER";
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.58, 7), stemMaterial);
  stem.position.y = 0.29;
  root.add(stem);

  const petalGeometry = new THREE.SphereGeometry(0.105, 8, 6);
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    petal.scale.set(1, 0.55, 0.72);
    petal.position.set(Math.cos(angle) * 0.12, 0.62, Math.sin(angle) * 0.12);
    root.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), centerMaterial);
  center.position.y = 0.64;
  root.add(center);
  return root;
}

function createPlantModel(kind) {
  return kind === "flower" ? createFlowerModel() : createGrassModel();
}

export function createGatheringPlantsRuntime({ scene, mapId = "광산" }) {
  const entries = new Map();

  function applySnapshot(snapshot = {}) {
    const seen = new Set();
    for (const plant of snapshot.plants ?? []) {
      let entry = entries.get(plant.id);
      if (!entry) {
        const root = createPlantModel(plant.kind);
        scene.add(root);
        entry = { id: plant.id, kind: plant.kind, itemId: plant.itemId, root, active: true };
        entries.set(plant.id, entry);
      }
      entry.kind = plant.kind;
      entry.itemId = plant.itemId;
      entry.active = true;
      entry.root.visible = true;
      entry.root.position.set(plant.x, plant.y, plant.z);
      seen.add(plant.id);
    }
    for (const entry of entries.values()) {
      if (seen.has(entry.id)) continue;
      entry.active = false;
      entry.root.visible = false;
    }
  }

  function findNearest(position, currentMapId, radius = 2) {
    if (currentMapId !== mapId) return null;
    let nearest = null;
    let nearestDistance = radius;
    for (const entry of entries.values()) {
      if (!entry.active || !entry.root.visible) continue;
      const distance = Math.hypot(position.x - entry.root.position.x, position.z - entry.root.position.z);
      if (distance >= nearestDistance) continue;
      nearest = entry;
      nearestDistance = distance;
    }
    return nearest;
  }

  function deactivate(id) {
    const entry = entries.get(id);
    if (!entry) return false;
    entry.active = false;
    entry.root.visible = false;
    return true;
  }

  function clear() {
    for (const entry of entries.values()) {
      entry.active = false;
      entry.root.visible = false;
    }
  }

  return {
    applySnapshot,
    clear,
    deactivate,
    findNearest,
    getEntry: (id) => entries.get(id) ?? null,
    getEntries: () => [...entries.values()],
    isActive: (id) => Boolean(entries.get(id)?.active),
  };
}
