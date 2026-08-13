export function updatePlayerMovementRuntime({
  dt,
  keys,
  player,
  camera,
  controls,
  state,
  rig,
  canPlayGame,
  isWorkUiMovementLocked,
  isSleeping,
  isDevSession,
  hasShoesEquipped,
  getAirMoveScalar,
  getMovementBasisVectors,
  buildMoveVector,
  isMoveVectorActive,
  normalizeMoveVector,
  updateLatestMoveDirection,
  getMovementSpeed,
  getMovementDelta,
  applyMovementCollisionStep,
  isInsideBounds,
  intersectsAnyCollider,
  isStartRingTransitionBlocked,
  isCrossingBlockedStartRing,
  applyMovementPostCollisionCorrections,
  getPostCollisionOptions,
  getMovementYaw,
  getWalkAnimationSpeed,
  applyWalkIdlePose,
  applyMiningSwingPose,
  applyPickupReachPose,
  applySleepPose,
  updatePlayerGroundY,
  onWorkUiLocked,
  now,
}) {
  const clearKeys = () => {
    for (const key of Object.keys(keys)) keys[key] = false;
  };
  if (!canPlayGame()) {
    clearKeys();
    updatePlayerGroundY(dt);
    return state;
  }
  if (isWorkUiMovementLocked()) {
    clearKeys();
    onWorkUiLocked?.();
    controls.enabled = canPlayGame() && !isWorkUiMovementLocked();
    updatePlayerGroundY(dt);
    return state;
  }
  if (isSleeping()) {
    clearKeys();
    updatePlayerGroundY(dt);
    applySleepPose(rig);
    return state;
  }

  const { forward, right } = getMovementBasisVectors(camera);
  const move = buildMoveVector(keys, forward, right);
  const isMoving = isMoveVectorActive(move);
  if (isMoving) {
    normalizeMoveVector(move);
    updateLatestMoveDirection(move);
    const { speed } = getMovementSpeed({
      isDevMovementMode: isDevSession(),
      hasShoesEquipped: hasShoesEquipped(),
      shiftPressed: keys.shift,
      airMoveScalar: getAirMoveScalar(),
    });
    const previousPosition = player.position.clone();
    const delta = getMovementDelta(move, speed, dt);
    const { afterX } = applyMovementCollisionStep({
      axis: "x", position: player.position, prevPos: previousPosition, delta,
      isInsideBounds, intersectsAnyCollider, isStartRingTransitionBlocked, isCrossingBlockedStartRing,
    });
    applyMovementCollisionStep({
      axis: "z", position: player.position, prevPos: { ...previousPosition, x: afterX }, delta,
      isInsideBounds, intersectsAnyCollider, isStartRingTransitionBlocked, isCrossingBlockedStartRing,
    });
    applyMovementPostCollisionCorrections({
      position: player.position,
      prevPos: previousPosition,
      resolveStartRingPenetration: getPostCollisionOptions().resolveStartRingPenetration,
      ...getPostCollisionOptions(),
    });
    player.rotation.y = getMovementYaw(move);
  }

  const basePose = applyWalkIdlePose(rig, {
    isMoving,
    walkT: now * 0.015,
    walkAnimSpeed: getWalkAnimationSpeed({
      isMoving,
      shiftPressed: keys.shift,
      isDevSession: isDevSession(),
      hasShoesEquipped: hasShoesEquipped(),
    }),
  });
  if (state.miningSwingTime > 0) {
    state.miningSwingTime = Math.max(0, state.miningSwingTime - dt);
    applyMiningSwingPose(rig, 1 - state.miningSwingTime / state.currentMiningSwingDuration, basePose);
  }
  if (state.pickupReachTime > 0 && state.miningSwingTime <= 0) {
    state.pickupReachTime = Math.max(0, state.pickupReachTime - dt);
    applyPickupReachPose(rig, Math.sin((1 - state.pickupReachTime / state.pickupReachDuration) * Math.PI));
  }
  updatePlayerGroundY(dt);
  return state;
}
