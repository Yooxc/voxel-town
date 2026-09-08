import * as THREE from "three";
import { createMiningFeedbackRuntime } from "../world/miningFeedback.js";
import {
  createCameraOcclusionState,
  updateThirdPersonCameraOcclusion,
} from "../world/cameraOcclusion.js";
import {
  triggerRockHitReaction,
  updateRockHitReactions,
} from "../world/resourceVisuals.js";
import { updatePlayerMovementRuntime } from "./playerMovementRuntime.js";
import { EXCIT_MINING_IMPACT_PROGRESS } from "./playerAnimationRuntime.js";
import { createResourceWorldRuntime } from "../systems/resourceWorldRuntime.js";

export function createPlayerGameplayCoordinator({
  player,
  getPlayerPosition = () => player.position,
  findNearestByPosition,
  setHarvestTreeActive,
  updateHarvestTrees,
  updateRockFadeIns,
  rockRespawnMs,
  createRespawnRock,
  miningParticles,
  randomRange,
  hitStopDuration,
  cameraShakeDuration,
  rockHitReactionDuration,
}) {
  const resourceWorldRuntime = createResourceWorldRuntime({
    getPlayerPosition,
    findNearestByPosition,
    setHarvestTreeActive,
    updateHarvestTrees,
    updateRockFadeIns,
    rockRespawnMs,
    createRespawnRock,
  });
  const miningFeedback = createMiningFeedbackRuntime({
    hitStopDuration,
    cameraShakeDuration,
    randomRange,
  });
  const rockHitReactions = [];
  const followTargetOffset = new THREE.Vector3(0, 1, 0);
  const lastFollowPlayerPosition = new THREE.Vector3().copy(player.position);
  const framePlayerDelta = new THREE.Vector3();
  let cameraRuntime = null;
  let miningSwingTime = 0;
  let miningSwingId = 0;
  let pickupReachTime = 0;
  let currentMiningSwingDuration = 1.1;
  let pendingMiningImpact = null;
  let buildCameraSnapshot = null;

  function initializeCamera({ camera, controls, colliders, scene, config }) {
    cameraRuntime = {
      camera,
      controls,
      colliders,
      scene,
      config,
      state: createCameraOcclusionState(camera.position.distanceTo(controls.target)),
    };
  }

  function snapCameraToPlayer() {
    if (!cameraRuntime) return;
    const { camera, controls } = cameraRuntime;
    const currentOffset = new THREE.Vector3().copy(camera.position).sub(controls.target);
    controls.target.copy(player.position).add(followTargetOffset);
    camera.position.copy(controls.target).add(currentOffset);
    lastFollowPlayerPosition.copy(player.position);
    controls.update();
  }

  function enterBuildCamera({ center, extent = 10 } = {}) {
    if (!cameraRuntime || !center) return false;
    const { camera, controls } = cameraRuntime;
    if (!buildCameraSnapshot) {
      buildCameraSnapshot = {
        position: camera.position.clone(),
        target: controls.target.clone(),
        controlsEnabled: controls.enabled,
      };
    }
    const safeExtent = Math.max(6, Number(extent) || 10);
    controls.enabled = false;
    controls.target.set(center.x, center.y ?? 0, center.z);
    camera.position.set(
      center.x + safeExtent * 0.72,
      (center.y ?? 0) + Math.max(7, safeExtent * 0.82),
      center.z + safeExtent * 0.9,
    );
    camera.lookAt(controls.target);
    controls.update();
    return true;
  }

  function exitBuildCamera() {
    if (!cameraRuntime || !buildCameraSnapshot) return false;
    const { camera, controls } = cameraRuntime;
    camera.position.copy(buildCameraSnapshot.position);
    controls.target.copy(buildCameraSnapshot.target);
    controls.enabled = buildCameraSnapshot.controlsEnabled;
    buildCameraSnapshot = null;
    lastFollowPlayerPosition.copy(player.position);
    controls.update();
    return true;
  }

  function isBuildCameraActive() {
    return Boolean(buildCameraSnapshot);
  }

  function updateCameraOcclusion(dt) {
    if (!cameraRuntime || buildCameraSnapshot) return;
    const { camera, controls, colliders, scene, state, config } = cameraRuntime;
    updateThirdPersonCameraOcclusion({ camera, controls, colliders, scene, state, dt, config });
  }

  function updateCameraFollow() {
    if (!cameraRuntime) return;
    const { camera, controls } = cameraRuntime;
    if (buildCameraSnapshot) {
      controls.update();
      return;
    }
    framePlayerDelta.copy(player.position).sub(lastFollowPlayerPosition);
    if (framePlayerDelta.lengthSq() > 0) {
      camera.position.add(framePlayerDelta);
      controls.target.add(framePlayerDelta);
      lastFollowPlayerPosition.copy(player.position);
    }
    controls.update();
  }

  function setCameraControlsEnabled(enabled) {
    if (!cameraRuntime || buildCameraSnapshot) return false;
    cameraRuntime.controls.enabled = Boolean(enabled);
    return true;
  }

  function triggerMiningSwing(target, getSwingDuration, options = {}) {
    if (miningSwingTime > 0) return false;
    currentMiningSwingDuration = getSwingDuration();
    if (!(currentMiningSwingDuration > 0)) return false;
    miningSwingTime = currentMiningSwingDuration;
    miningSwingId += 1;
    const impactProgress = THREE.MathUtils.clamp(
      Number.isFinite(options.impactProgress) ? options.impactProgress : EXCIT_MINING_IMPACT_PROGRESS,
      0,
      1,
    );
    pendingMiningImpact = typeof options.onImpact === "function"
      ? {
        swingId: miningSwingId,
        target,
        impactTime: currentMiningSwingDuration * (1 - impactProgress),
        isTargetValid: options.isTargetValid,
        onImpact: options.onImpact,
      }
      : null;
    faceTarget(target);
    return true;
  }

  function isMiningLocked() {
    return miningSwingTime > 0;
  }

  function cancelMiningSwing() {
    const wasMining = miningSwingTime > 0;
    miningSwingTime = 0;
    pendingMiningImpact = null;
    return wasMining;
  }

  function triggerPickupReach(target, duration) {
    pickupReachTime = duration;
    faceTarget(target);
  }

  function faceTarget(target) {
    if (!target) return;
    const dx = target.position.x - player.position.x;
    const dz = target.position.z - player.position.z;
    if (Math.abs(dx) > 1e-4 || Math.abs(dz) > 1e-4) {
      player.rotation.y = Math.atan2(dx, dz);
    }
  }

  function updateMovement({ dt, pickupReachDuration, ...options }) {
    const state = updatePlayerMovementRuntime({
      dt,
      state: {
        miningSwingTime,
        miningSwingId,
        pickupReachTime,
        currentMiningSwingDuration,
        miningImpactTime: pendingMiningImpact?.impactTime,
        pickupReachDuration,
      },
      player,
      ...options,
    });
    miningSwingTime = state.miningSwingTime;
    pickupReachTime = state.pickupReachTime;
    if (state.miningInterrupted) {
      pendingMiningImpact = null;
      return;
    }
    if (state.miningImpactCrossed && pendingMiningImpact?.swingId === miningSwingId) {
      const impact = pendingMiningImpact;
      pendingMiningImpact = null;
      if (!impact.isTargetValid || impact.isTargetValid(impact.target)) {
        impact.onImpact(impact.target);
      }
    }
    if (miningSwingTime <= 0) pendingMiningImpact = null;
  }

  function updateFeedback(dt) {
    return miningFeedback.update(dt);
  }

  function triggerHitStop(duration) {
    miningFeedback.triggerHitStop(duration);
  }

  function triggerCameraShake(strength, duration) {
    miningFeedback.triggerCameraShake(strength, duration);
  }

  function applyCameraShake() {
    if (!cameraRuntime) return;
    const offset = miningFeedback.getCameraShakeOffset();
    if (!offset) return;
    const { camera } = cameraRuntime;
    camera.position.x += offset.x;
    camera.position.y += offset.y;
    camera.position.z += offset.z;
  }

  function triggerRockHitReactionFor(rock) {
    triggerRockHitReaction(rock, rockHitReactions, rockHitReactionDuration);
  }

  function updateResourceVisuals({ dt, reactionDt = dt }) {
    miningParticles.update(dt);
    resourceWorldRuntime.updateHarvestTreeStates();
    updateRockHitReactions(rockHitReactions, reactionDt);
    resourceWorldRuntime.updateRockFadeStates(dt);
  }

  function spawnDustBurst(position, count = 16) {
    miningParticles.spawnDustBurst(position, count);
  }

  function spawnRockBreakBurst(rock) {
    miningParticles.spawnRockBreakBurst(rock);
  }

  function setTreeActive(tree, active) {
    if (active) {
      setHarvestTreeActive(tree, true);
      return;
    }
    resourceWorldRuntime.deactivateHarvestTree(tree);
  }

  return {
    mineRocks: resourceWorldRuntime.mineRocks,
    harvestTrees: resourceWorldRuntime.harvestTrees,
    initializeCamera,
    snapCameraToPlayer,
    enterBuildCamera,
    exitBuildCamera,
    isBuildCameraActive,
    updateCameraOcclusion,
    updateCameraFollow,
    setCameraControlsEnabled,
    triggerMiningSwing,
    isMiningLocked,
    cancelMiningSwing,
    triggerPickupReach,
    updateMovement,
    updateFeedback,
    triggerHitStop,
    triggerCameraShake,
    applyCameraShake,
    triggerRockHitReaction: triggerRockHitReactionFor,
    updateResourceVisuals,
    spawnDustBurst,
    spawnRockBreakBurst,
    registerMineRock: resourceWorldRuntime.registerMineRock,
    unregisterMineRock: resourceWorldRuntime.unregisterMineRock,
    registerHarvestTree: resourceWorldRuntime.registerHarvestTree,
    findNearestMineRock: resourceWorldRuntime.findNearestMineRock,
    findNearestHarvestTree: resourceWorldRuntime.findNearestHarvestTree,
    setHarvestTreeActive: setTreeActive,
    scheduleRockRespawn: resourceWorldRuntime.scheduleRockRespawn,
  };
}
