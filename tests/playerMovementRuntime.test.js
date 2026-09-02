import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { updatePlayerMovementRuntime } from "../src/core/playerMovementRuntime.js";
import {
  getPlayerBoxFromPosition,
  intersectsAnyColliderBox,
  resolvePlayerColliderPenetration,
} from "../src/core/collisions.js";

function createRuntime(overrides = {}) {
  const calls = [];
  const player = {
    position: { clone: () => ({ x: 0, y: 0, z: 0 }) },
    rotation: { y: 0 },
  };
  const runtime = {
    dt: 0.1,
    keys: { w: true, shift: false },
    player,
    camera: {},
    controls: { enabled: true },
    state: { miningSwingTime: 0, pickupReachTime: 0, currentMiningSwingDuration: 0.25, pickupReachDuration: 0.2 },
    rig: {},
    canPlayGame: () => true,
    isWorkUiMovementLocked: () => false,
    isSleeping: () => false,
    isDevSession: () => false,
    hasShoesEquipped: () => false,
    getAirMoveScalar: () => 1,
    getMovementBasisVectors: () => ({ forward: {}, right: {} }),
    buildMoveVector: () => ({ x: 1, z: 0 }),
    isMoveVectorActive: () => true,
    normalizeMoveVector: () => calls.push("normalize"),
    updateLatestMoveDirection: () => calls.push("direction"),
    getMovementSpeed: () => ({ speed: 5 }),
    getMovementDelta: () => ({ x: 1, z: 0 }),
    applyMovementCollisionStep: ({ axis }) => { calls.push(axis); return { afterX: 1 }; },
    isInsideBounds: () => true,
    intersectsAnyCollider: () => false,
    isStartRingTransitionBlocked: () => false,
    isCrossingBlockedStartRing: () => false,
    applyMovementPostCollisionCorrections: () => calls.push("correct"),
    getPostCollisionOptions: () => ({ resolveStartRingPenetration: () => {}, startWallOn: false }),
    getMovementYaw: () => 1.2,
    getWalkAnimationSpeed: () => 1,
    applyWalkIdlePose: () => ({}),
    applyMiningSwingPose: () => calls.push("mining"),
    applyPickupReachPose: () => calls.push("pickup"),
    applySleepPose: () => calls.push("sleep"),
    updatePlayerGroundY: () => calls.push("ground"),
    onWorkUiLocked: () => calls.push("locked"),
    now: 100,
    ...overrides,
  };
  return { runtime, calls, player };
}

test("clears movement input while work UI locks movement", () => {
  const { runtime, calls } = createRuntime({ isWorkUiMovementLocked: () => true });
  updatePlayerMovementRuntime(runtime);
  assert.equal(runtime.keys.w, false);
  assert.deepEqual(calls, ["locked", "ground"]);
});

test("runs axis collision steps and movement correction", () => {
  const { runtime, calls, player } = createRuntime();
  updatePlayerMovementRuntime(runtime);
  assert.deepEqual(calls.slice(0, 4), ["normalize", "direction", "x", "z"]);
  assert.equal(calls.includes("correct"), true);
  assert.equal(player.rotation.y, 1.2);
});

test("updates mining before pickup pose timing", () => {
  const { runtime, calls } = createRuntime({
    state: { miningSwingTime: 0.1, pickupReachTime: 0.1, currentMiningSwingDuration: 0.25, pickupReachDuration: 0.2 },
  });
  const result = updatePlayerMovementRuntime(runtime);
  assert.equal(result.miningSwingTime, 0);
  assert.equal(result.pickupReachTime, 0);
  assert.equal(calls.includes("mining"), true);
  assert.equal(calls.includes("pickup"), true);
});

test("uses the true rotated pillar outline instead of its oversized broad-phase box", () => {
  const collider = new THREE.Box3(
    new THREE.Vector3(-2.2, 0, -2.2),
    new THREE.Vector3(2.2, 4, 2.2),
  );
  collider.userData = {
    preciseShape: { type: "orientedBox", centerX: 0, centerZ: 0, halfX: 0.35, halfZ: 2, rotationY: Math.PI * 0.25, minY: 0, maxY: 4 },
  };
  const openCornerPlayer = getPlayerBoxFromPosition(new THREE.Vector3(1.5, 0, 0));
  const touchingPlayer = getPlayerBoxFromPosition(new THREE.Vector3(0.5, 0, -0.5));

  assert.equal(intersectsAnyColliderBox(openCornerPlayer, [collider]), false);
  assert.equal(intersectsAnyColliderBox(touchingPlayer, [collider]), true);
});

test("pushes a player out of a rotated pillar without leaving them embedded", () => {
  const collider = new THREE.Box3(
    new THREE.Vector3(-2.2, 0, -2.2),
    new THREE.Vector3(2.2, 4, 2.2),
  );
  collider.userData = {
    preciseShape: { type: "orientedBox", centerX: 0, centerZ: 0, halfX: 0.4, halfZ: 1.8, rotationY: Math.PI * 0.25, minY: 0, maxY: 4 },
  };
  const position = new THREE.Vector3(0, 0, 0);
  const result = resolvePlayerColliderPenetration({
    position,
    getPlayerBox: () => getPlayerBoxFromPosition(position),
    colliderBoxes: [collider],
  });

  assert.equal(result.resolved, true);
  assert.equal(intersectsAnyColliderBox(getPlayerBoxFromPosition(position), [collider]), false);
});
