import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createSceneObjectFactory } from "../src/world/sceneObjectFactory.js";

function createFactory(overrides = {}) {
  const scene = new THREE.Scene();
  const colliders = [];
  const factory = createSceneObjectFactory({
    scene, groundSurfaces: [], interactables: [], addCollider: (object) => { colliders.push(object); return colliders.length - 1; },
    registerWalkableSurface: () => {}, registerConnectorTunnelZone: () => {}, registerTutorialNpc: () => {},
    registerHarvestTree: (tree) => tree, registerMineRock: (rock) => rock, registerCaveDarkMaterial: () => {},
    setNftScreenMaterial: () => {}, refreshNftExhibitBoard: async () => {}, scheduleNftExhibitBoardRefresh: () => {},
    buildPickaxeModel: () => new THREE.Group(), buildShovelModel: () => new THREE.Group(), buildSafetyHelmetModel: () => new THREE.Group(), buildBasicShoesModel: () => new THREE.Group(), buildPurifyPowderModel: () => new THREE.Group(),
    getRockDefaultResourceCount: () => 1, getRockSizeDefById: () => null, rockSizeDefs: [{ id: "small", scale: 1, maxHp: 1 }, { id: "medium", scale: 1, maxHp: 2 }],
    findMineRockSpawnPosition: () => ({ x: 4, z: 5 }), findCaveRockSpawnPosition: () => ({ x: 6, z: 7 }), randomRange: () => 0,
    startZone: { wallOn: true, wallVisible: true, openRatio: 0.25, openCenter: 0, radius: 5, thickness: 1, height: 2, x: 1, z: 2 }, startFlatY: 0,
    ...overrides,
  });
  return { factory, scene, colliders };
}

test("builds start props and registers their colliders", () => {
  const { factory, scene, colliders } = createFactory();
  const wall = factory.buildStartZoneWall();
  const stall = factory.buildStartStall();
  assert.ok(wall.parent === scene);
  assert.ok(stall.group.parent === scene);
  assert.equal(colliders.includes(stall.group), true);
});

test("creates a respawn rock through the map-specific placement callback", () => {
  const { factory, scene } = createFactory();
  const rock = factory.createRespawnRockFromSpawn({ mapId: "폐광", rockSize: "medium", resourceItemId: "masonryStone" });
  assert.ok(rock.parent === scene);
  assert.equal(rock.userData.spawn.mapId, "폐광");
  assert.equal(rock.userData.resourceItemId, "masonryStone");
});
