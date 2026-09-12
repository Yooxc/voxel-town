import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { getRebuildLayout, getRebuildTerrainHeight, isPointInPolygon, projectToSegment } from "../src/world/rebuildLayout.js";
import { getRebuildFogSettings } from "../src/world/rebuildSettings.js";
import { createColliderRegistry } from "../src/world/colliderRegistry.js";
import { getPlayerBoxFromPosition, intersectsAnyColliderBox, applyMovementCollisionStep } from "../src/core/collisions.js";
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
  player.position.x = layout.perimeter.safetyBounds.minX - 1;
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
    if (!isPointInPolygon(x, z, polygon) || polygon.some((a, i) => projectToSegment(x, z, a, polygon[(i + 1) % polygon.length]).distance < 0.01)) continue;
    assert.equal(getRebuildTerrainHeight(x, z), 3);
    ray.set(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0));
    assert.ok(ray.intersectObject(mine.floor).length > 0);
  }
  // Every perimeter segment except the intentional entry is a connected vertical face.
  mine.terraces.forEach((terrace) => assert.equal(terrace.children[0].geometry.index.count, (polygon.length - 1) * 6));
});

test("fog exposes two distances and rejects invalid settings without breaking rendering", () => {
  assert.deepEqual(getRebuildFogSettings(), { near: 35, far: 95 });
  assert.deepEqual(getRebuildFogSettings({ near: 40, far: 110 }), { near: 40, far: 110 });
  for (const settings of [null, {}, { near: -1, far: 90 }, { near: 90, far: 35 },
    { near: 35, far: 35 }, { near: NaN, far: 95 }, { near: 35, far: Infinity }]) {
    const warnings = [];
    assert.deepEqual(getRebuildFogSettings(settings, (message) => warnings.push(message)), { near: 35, far: 95 });
    assert.equal(warnings.length, 1);
  }
});

function collisionFixture() {
  const layout = getRebuildLayout();
  const registry = createColliderRegistry();
  const scene = new THREE.Scene();
  const args = { layout, scene, groundSurfaces: [], registerWalkableSurface() {},
    addCollider: (object, options) => registry.add(object, options) };
  const blockout = createRebuildBlockout(args);
  createRebuildMine(args);
  scene.updateMatrixWorld(true);
  const blocked = (position) => intersectsAnyColliderBox(getPlayerBoxFromPosition(position), registry.boxes);
  return { layout, registry, blocked, blockout };
}

test("off-road visible ground is walkable without teleporting back to the approach", () => {
  const { layout, blocked } = collisionFixture();
  const traversal = createRebuildTraversal(layout);
  for (const [x, z] of [[-34, -35], [-50, -43], [-80, -44], [35, -6], [-25, 26]]) {
    const player = { position: new THREE.Vector3(x, getRebuildTerrainHeight(x, z) + 0.05, z) };
    const before = player.position.clone();
    assert.ok(traversal.isInside(x, z));
    assert.equal(blocked(player.position), false, `unexpected obstacle at ${x},${z}`);
    traversal.prepare(player);
    assert.deepEqual(player.position, before);
  }
});

test("removed perimeter leaves neither wall meshes nor invisible colliders", () => {
  const { layout, blocked, blockout, registry } = collisionFixture();
  const names = [];
  blockout.root.traverse((object) => names.push(object.name));
  assert.equal(names.some((name) => /PERIMETER|^perimeter_/.test(name)), false);
  assert.equal(registry.colliders.some((object) => object.name.startsWith("perimeter_")), false);
  assert.ok(names.some((name) => name.startsWith("ridge_")));
  const polygon = layout.perimeter.outline;
  // Sample open ground, excluding the retained quarry terraces and existing props.
  for (const edge of [2, 4, 8, 10, 12, 14]) {
    const a = polygon[edge], b = polygon[(edge + 1) % polygon.length];
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    for (let distance = 0; distance <= length; distance += 0.2) {
      const x = a.x + (b.x - a.x) * distance / length;
      const z = a.z + (b.z - a.z) * distance / length;
      assert.equal(blocked(new THREE.Vector3(x, getRebuildTerrainHeight(x, z) + 0.05, z)), false, `residual wall at ${x},${z}`);
    }
  }
  for (const z of [-47, -48, -49, -50, -53]) {
    assert.equal(blocked(new THREE.Vector3(0, 0.05, z)), false, "gate center must be controlled by existing gate logic");
    if (z <= -48) for (const x of [-5, 5]) assert.equal(blocked(new THREE.Vector3(x, 0.05, z)), false);
  }
});

test("walking and running cross the removed wall line without an invisible stop", () => {
  const { layout, blocked } = collisionFixture();
  const polygon = layout.perimeter.outline;
  for (const edge of [2, 4, 8, 10, 12, 14]) {
    const a = polygon[edge], b = polygon[(edge + 1) % polygon.length];
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    const nx = -(b.z - a.z) / length, nz = (b.x - a.x) / length;
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    for (const sign of [-1, 1]) for (const speed of [4, 8, 20]) {
      const position = new THREE.Vector3(mx + nx * 3 * sign, 0, mz + nz * 3 * sign);
      const delta = { x: -nx * speed * 0.033 * sign, z: -nz * speed * 0.033 * sign };
      for (let frame = 0; frame < Math.ceil(5 / (speed * 0.033)); frame += 1) {
        position.y = getRebuildTerrainHeight(position.x, position.z) + 0.05;
        const prevPos = position.clone();
        for (const axis of ["x", "z"]) applyMovementCollisionStep({ axis, position, prevPos, delta,
          isInsideBounds: () => true, intersectsAnyCollider: () => blocked(position),
          isStartRingTransitionBlocked: () => false, isCrossingBlockedStartRing: () => false });
      }
      assert.ok(((position.x - mx) * nx + (position.z - mz) * nz) * sign < 0, `residual stop ${edge}, speed ${speed}`);
    }
  }
});

test("approach remains free of cliff colliders throughout its 80-unit route", () => {
  const { layout, blocked } = collisionFixture();
  const points = layout.generalMine.pathPoints;
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1], b = points[i];
    length += Math.hypot(b.x - a.x, b.z - a.z);
    for (let t = 0; t <= 1; t += 0.02) {
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      assert.equal(blocked(new THREE.Vector3(x, getRebuildTerrainHeight(x, z) + 0.1, z)), false, `blocked approach ${x},${z}`);
    }
  }
  assert.ok(Math.abs(length - 80) < 0.001);
});

test("quarry inner walls cover every edge and corner except the intended entrance", () => {
  const { layout, blocked } = collisionFixture();
  const mine = layout.generalMine;
  mine.floorPolygon.forEach((a, edge) => {
    if (edge === mine.terraceOpeningEdge) return;
    const b = mine.floorPolygon[(edge + 1) % mine.floorPolygon.length];
    for (let t = 0; t <= 1; t += 0.01) {
      const position = new THREE.Vector3(a.x + (b.x - a.x) * t, mine.floorHeight + 0.05, a.z + (b.z - a.z) * t);
      assert.ok(blocked(position), `quarry wall gap at ${position.x},${position.z}`);
    }
  });
  assert.equal(blocked(new THREE.Vector3(-89, mine.floorHeight + 0.05, -39)), false);
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
