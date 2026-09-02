import * as THREE from "three";
import { createDeformableTerrain } from "./deformableTerrain.js";
import { createDeformableTerrainMesh } from "./deformableTerrainMesh.js";

export const TERRAIN_LAB_MAP_ID = "지형 실험장";
export const TERRAIN_LAB_CENTER = Object.freeze({ x: 500, z: 500 });

function isInsideCircle(point, zone) {
  return Math.hypot(point.x - zone.x, point.z - zone.z) <= zone.radius;
}

export function createDeformableTerrainMap({
  scene,
  registerWalkableSurface,
  registerGroundSurface,
  registerIsolatedMapZone,
  center = TERRAIN_LAB_CENTER,
}) {
  const root = new THREE.Group();
  root.name = "terrain-lab";
  root.position.set(center.x, 0, center.z);
  scene.add(root);

  const terrain = createDeformableTerrain({
    width: 30,
    depth: 30,
    segmentsX: 60,
    segmentsZ: 60,
    maxDepth: 1.5,
    getInitialHeight: (x, z) => Math.sin(x * 0.22) * Math.cos(z * 0.17) * 0.18,
  });
  const terrainMesh = createDeformableTerrainMesh({ terrain });
  root.add(terrainMesh.mesh);

  const spawn = { x: center.x, y: 0, z: center.z - 8, rotationY: 0 };
  const noDigZones = [
    { x: 0, z: 10, radius: 3.2 },
  ];
  const border = 1.5;
  const canDigAt = (x, z) => (
    Math.abs(x) < terrain.width * 0.5 - border
    && Math.abs(z) < terrain.depth * 0.5 - border
    && !noDigZones.some((zone) => isInsideCircle({ x, z }, zone))
  );

  const marker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 0.08, 20),
    new THREE.MeshStandardMaterial({ color: 0x4e8fbd, emissive: 0x102a36, roughness: 0.75 }),
  );
  marker.position.set(0, 0.05, 10);
  marker.name = "NO_DIG_terrain_lab_spawn";
  root.add(marker);

  registerWalkableSurface(TERRAIN_LAB_MAP_ID, terrainMesh.mesh, 0.25);
  registerGroundSurface(terrainMesh.mesh);
  registerIsolatedMapZone({
    mapId: TERRAIN_LAB_MAP_ID,
    centerX: center.x,
    centerZ: center.z,
    width: terrain.width,
    depth: terrain.depth,
  });

  return {
    mapId: TERRAIN_LAB_MAP_ID,
    root,
    terrain,
    mesh: terrainMesh.mesh,
    spawn,
    canDigAt,
    applyHeights: terrainMesh.applyHeights,
    reset() {
      terrain.reset();
      terrainMesh.applyHeights();
    },
  };
}
