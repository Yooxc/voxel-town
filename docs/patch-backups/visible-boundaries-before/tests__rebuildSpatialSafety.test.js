import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { getRebuildLayout, getRebuildTerrainHeight, isPointInPolygon } from "../src/world/rebuildLayout.js";
import { createRebuildTraversal } from "../src/world/rebuildTraversal.js";
import { createRebuildBlockout } from "../src/world/rebuildBlockout.js";
import { createRebuildMine } from "../src/world/rebuildMine.js";
import { getCurrentMapIdForPlayer } from "../src/systems/maps.js";
import { isMineRockSpawnValid } from "../src/world/rockPlacement.js";
import { createMapEnvironmentController } from "../src/world/mapEnvironmentController.js";

test("outdoor override keeps world fog even when cave fog is enabled", () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 85, 280);
  const torch = new THREE.PointLight();
  const controller = createMapEnvironmentController({
    getState: () => ({ player: { position: new THREE.Vector3(-120, 3, -70) },
      mineGate: { position: { z: -50 } }, campGate: { position: { z: -60 } },
      ambientLight: {}, sunLight: {}, torchLight: torch, torchEquipped: true, isOutdoor: true }),
    MathUtils: THREE.MathUtils, createColor: (value) => new THREE.Color(value),
    createVector3: (x, y, z) => new THREE.Vector3(x, y, z), scene,
    caveDarkMaterials: [], fogEnabled: true, darkeningEnabled: true,
    worldFogColor: 0xb9d6e4, caveFogColor: 0, worldFogNear: 85, worldFogFar: 280,
  });
  controller.update();
  assert.equal(scene.fog.near, 85);
  assert.equal(scene.fog.far, 280);
  assert.equal(torch.visible, false);
});

test("outdoor quarry stays breathable beyond the old north/south map thresholds", () => {
  const layout = getRebuildLayout(10, 20, 0);
  for (const position of [layout.generalMine.center, ...layout.generalMine.pathPoints]) {
    assert.equal(getCurrentMapIdForPlayer({ playerPosition: position, isolatedMapZones: [layout.outdoorZone],
      mineDoorThresholdZ: 0, campDoorThresholdZ: -10, campNorthDoorThresholdZ: -80, frontierDoorThresholdZ: -90 }), "광산");
  }
  assert.equal(getCurrentMapIdForPlayer({ playerPosition: { x: 10, z: -15 }, isolatedMapZones: [layout.outdoorZone],
    mineDoorThresholdZ: 0, campDoorThresholdZ: -10, campNorthDoorThresholdZ: -80, frontierDoorThresholdZ: -90 }), "폐광");
});

test("route is connected, floor is supported and saved positions below it recover", () => {
  const layout = getRebuildLayout(10, 20, 2);
  const navigation = createRebuildTraversal(layout);
  for (let i = 1; i < layout.generalMine.pathPoints.length; i += 1) {
    const a = layout.generalMine.pathPoints[i - 1];
    const b = layout.generalMine.pathPoints[i];
    for (let step = 0; step <= 100; step += 1) {
      const t = step / 100;
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      assert.ok(navigation.isInside(x, z));
      assert.ok(getRebuildTerrainHeight(x, z, layout.origin) >= a.y + (b.y - a.y) * t - 0.0001);
    }
  }
  const player = { position: { ...layout.generalMine.center, y: 0 } };
  navigation.prepare(player);
  assert.ok(player.position.y >= layout.generalMine.floorHeight);
  player.position.x = layout.origin.x - 167;
  assert.equal(navigation.isInside(player.position.x, player.position.z), false);
  navigation.prepare(player);
  assert.ok(navigation.isInside(player.position.x, player.position.z));
  assert.equal(navigation.isInside(layout.origin.x, layout.origin.z - 100), true);
});

test("rendered surfaces have no drops along the complete approach or quarry floor", () => {
  const layout = getRebuildLayout();
  const scene = new THREE.Scene();
  const groundSurfaces = [];
  const args = { scene, layout, groundSurfaces, registerWalkableSurface() {}, addCollider() {} };
  createRebuildBlockout(args);
  const mine = createRebuildMine(args);
  scene.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const navigation = createRebuildTraversal(layout);
  const points = [...layout.generalMine.pathPoints, ...layout.generalMine.workPath];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    for (let t = 0; t <= 1; t += 0.1) {
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      ray.set(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObjects(groundSurfaces, true)[0];
      assert.ok(hit, `missing ground at ${x},${z}`);
      assert.ok(Math.abs(hit.point.y - getRebuildTerrainHeight(x, z)) < 0.15);
      assert.ok(navigation.isInside(x, z));
    }
  }
  const polygon = layout.generalMine.floorPolygon;
  for (let x = -153; x < -89; x += 2) for (let z = -64; z < -19; z += 2) {
    if (!isPointInPolygon(x, z, polygon) || !navigation.isInside(x, z)) continue;
    assert.equal(getRebuildTerrainHeight(x, z), 3);
    ray.set(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0));
    assert.ok(ray.intersectObject(mine.floor).length > 0);
  }
  // Every perimeter segment except the intentional entry is a connected vertical face.
  mine.terraces.forEach((terrace) => assert.equal(terrace.children[0].geometry.index.count, (polygon.length - 1) * 6));
});

test("resource samples fill the broad floor but exclude every rubble cluster and work path", () => {
  const layout = getRebuildLayout();
  const area = layout.generalMine.resourceArea;
  let valid = 0;
  const quarters = new Set();
  for (let x = -153; x < -89; x += 1) for (let z = -64; z < -19; z += 1) {
    if (!isMineRockSpawnValid({ x, z, scale: 1, rocks: [], polygon: area.polygon, exclusions: area.exclusions })) continue;
    valid += 1;
    quarters.add(`${x < -122}:${z < -42}`);
  }
  assert.ok(valid > 700, `usable spawn area: ${valid}`);
  assert.equal(quarters.size, 4);
  for (const cluster of layout.generalMine.rubbleClusters) {
    assert.equal(isMineRockSpawnValid({ ...cluster, scale: 1, rocks: [], polygon: area.polygon, exclusions: area.exclusions }), false);
  }
});
