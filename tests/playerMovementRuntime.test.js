import test from "node:test";
import assert from "node:assert/strict";
import { updatePlayerMovementRuntime } from "../src/core/playerMovementRuntime.js";

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
