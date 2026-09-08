import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createPlayerGameplayCoordinator } from "../src/core/playerGameplayCoordinator.js";

function createCoordinator(overrides = {}) {
  const calls = { treeUpdates: 0, rockUpdates: 0, particles: 0, reactions: 0 };
  const player = { position: new THREE.Vector3(), rotation: { y: 0 } };
  const coordinator = createPlayerGameplayCoordinator({
    player,
    findNearestByPosition: ({ entries, playerPosition, radius, isEligible }) =>
      entries.find((entry) => isEligible(entry) && entry.position.distanceTo(playerPosition) <= radius) ?? null,
    setHarvestTreeActive: (tree, active) => { tree.userData.harvestDisabled = !active; },
    updateHarvestTrees: () => { calls.treeUpdates += 1; },
    updateRockFadeIns: (_rocks, dt) => { calls.rockUpdates += dt; },
    rockRespawnMs: 10,
    createRespawnRock: () => {},
    miningParticles: {
      update: () => { calls.particles += 1; },
      spawnDustBurst: () => {},
      spawnRockBreakBurst: () => {},
    },
    randomRange: (_min, max) => max,
    hitStopDuration: 0.04,
    cameraShakeDuration: 0.1,
    rockHitReactionDuration: 0.1,
    ...overrides,
  });
  return { coordinator, player, calls };
}

function createMiningMotionOptions(overrides = {}) {
  return {
    pickupReachDuration: 0.2,
    keys: { w: true, a: false, s: false, d: false, shift: false },
    camera: {},
    controls: {},
    canPlayGame: () => true,
    isWorkUiMovementLocked: () => false,
    isSleeping: () => false,
    isDevSession: () => false,
    hasShoesEquipped: () => false,
    getAirMoveScalar: () => 1,
    getMovementBasisVectors: () => ({ forward: {}, right: {} }),
    buildMoveVector: () => ({ x: 1, z: 0 }),
    isMoveVectorActive: () => true,
    normalizeMoveVector: () => {},
    updateLatestMoveDirection: () => {},
    getMovementSpeed: () => ({ speed: 1, isSprinting: false }),
    getMovementDelta: () => ({ x: 0, z: 0 }),
    applyMovementCollisionStep: () => ({ afterX: 0 }),
    isInsideBounds: () => true,
    intersectsAnyCollider: () => false,
    getColliderPenetration: () => 0,
    isStartRingTransitionBlocked: () => false,
    isCrossingBlockedStartRing: () => false,
    applyMovementPostCollisionCorrections: () => {},
    getPostCollisionOptions: () => ({ resolveStartRingPenetration: () => {} }),
    getMovementYaw: () => 0,
    updatePlayerGroundY: () => {},
    ...overrides,
  };
}

test("owns resource target lookup and lifecycle updates", () => {
  const { coordinator, player, calls } = createCoordinator();
  const rock = { parent: {}, position: new THREE.Vector3(1, 0, 0), userData: {} };
  const tree = { parent: {}, position: new THREE.Vector3(1, 0, 0), userData: {} };
  coordinator.registerMineRock(rock);
  coordinator.registerHarvestTree(tree);

  assert.equal(coordinator.findNearestMineRock(), rock);
  assert.equal(coordinator.findNearestHarvestTree(), tree);
  coordinator.setHarvestTreeActive(tree, false);
  assert.equal(coordinator.findNearestHarvestTree(), null);

  coordinator.updateResourceVisuals({ dt: 0.25, reactionDt: 0.1 });
  assert.equal(calls.particles, 1);
  assert.equal(calls.treeUpdates, 1);
  assert.equal(calls.rockUpdates, 0.25);
  assert.equal(player.rotation.y, 0);
});

test("faces interaction targets and applies mining feedback to the camera", () => {
  const { coordinator, player } = createCoordinator();
  const camera = { position: new THREE.Vector3(0, 4, 8) };
  const controls = {
    target: new THREE.Vector3(0, 1, 0),
    minDistance: 3,
    maxDistance: 20,
    minPolarAngle: 0.1,
    maxPolarAngle: 1.4,
    update: () => {},
  };
  coordinator.initializeCamera({
    camera,
    controls,
    colliders: [],
    scene: new THREE.Scene(),
    config: { minDistance: 4, margin: 0.2, fadeDistance: 5, fadeOpacity: 0.6, returnSpeed: 7 },
  });

  assert.equal(coordinator.triggerMiningSwing({ position: new THREE.Vector3(2, 0, 0) }, () => 0.2), true);
  assert.equal(player.rotation.y, Math.PI / 2);
  assert.equal(coordinator.isMiningLocked(), true);
  assert.equal(coordinator.triggerMiningSwing({ position: new THREE.Vector3(0, 0, 2) }, () => 0.2), false);

  const before = camera.position.clone();
  coordinator.triggerCameraShake(0.1, 0.1);
  coordinator.applyCameraShake();
  assert.notDeepEqual(camera.position.toArray(), before.toArray());
});

test("fires one rock impact when the mining animation crosses its contact time", () => {
  const { coordinator } = createCoordinator();
  const target = { position: new THREE.Vector3(0, 0, 1) };
  let impacts = 0;
  assert.equal(coordinator.triggerMiningSwing(target, () => 0.25, {
    impactProgress: 0.4,
    onImpact: () => { impacts += 1; },
  }), true);

  coordinator.updateMovement({ dt: 0.09, ...createMiningMotionOptions() });
  assert.equal(impacts, 0);
  coordinator.updateMovement({ dt: 0.02, ...createMiningMotionOptions() });
  assert.equal(impacts, 1);
  coordinator.updateMovement({ dt: 0.14, ...createMiningMotionOptions() });
  assert.equal(impacts, 1);
});

test("focuses the build camera and restores its previous transform", () => {
  const { coordinator } = createCoordinator();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 4, 8);
  const controls = {
    target: new THREE.Vector3(0, 1, 0),
    enabled: true,
    update: () => {},
  };
  coordinator.initializeCamera({ camera, controls, colliders: [], scene: new THREE.Scene(), config: {} });
  const originalPosition = camera.position.clone();
  const originalTarget = controls.target.clone();

  assert.equal(coordinator.enterBuildCamera({ center: { x: 10, y: 0, z: -5 }, extent: 12 }), true);
  assert.equal(coordinator.isBuildCameraActive(), true);
  assert.equal(controls.enabled, false);
  assert.deepEqual(controls.target.toArray(), [10, 0, -5]);

  assert.equal(coordinator.exitBuildCamera(), true);
  assert.equal(coordinator.isBuildCameraActive(), false);
  assert.deepEqual(camera.position.toArray(), originalPosition.toArray());
  assert.deepEqual(controls.target.toArray(), originalTarget.toArray());
  assert.equal(controls.enabled, true);
});

test("controls gameplay camera input without overriding the build camera", () => {
  const { coordinator } = createCoordinator();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 4, 8);
  const controls = {
    target: new THREE.Vector3(0, 1, 0),
    enabled: true,
    minPolarAngle: 0.1,
    maxPolarAngle: 1.4,
    update: () => {},
  };
  coordinator.initializeCamera({ camera, controls, colliders: [], scene: new THREE.Scene(), config: {} });

  assert.equal(coordinator.setCameraControlsEnabled(false), true);
  assert.equal(controls.enabled, false);
  assert.equal(coordinator.setCameraControlsEnabled(true), true);
  assert.equal(controls.enabled, true);
  coordinator.enterBuildCamera({ center: { x: 2, y: 0, z: 3 } });
  assert.equal(coordinator.setCameraControlsEnabled(true), false);
  assert.equal(controls.enabled, false);
});
