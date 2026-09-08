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
  getColliderPenetration,
  isStartRingTransitionBlocked,
  isCrossingBlockedStartRing,
  applyMovementPostCollisionCorrections,
  getPostCollisionOptions,
  getMovementYaw,
  animationRuntime,
  updatePlayerGroundY,
  onWorkUiLocked,
  now,
}) {
  const clearKeys = () => {
    for (const key of Object.keys(keys)) keys[key] = false;
  };
  if (!canPlayGame()) {
    state.miningInterrupted = state.miningSwingTime > 0;
    state.miningSwingTime = 0;
    clearKeys();
    animationRuntime?.update(dt, { isMoving: false });
    updatePlayerGroundY(dt);
    return state;
  }
  if (isWorkUiMovementLocked()) {
    state.miningInterrupted = state.miningSwingTime > 0;
    state.miningSwingTime = 0;
    clearKeys();
    onWorkUiLocked?.();
    animationRuntime?.update(dt, { isMoving: false });
    updatePlayerGroundY(dt);
    return state;
  }
  if (isSleeping()) {
    state.miningInterrupted = state.miningSwingTime > 0;
    state.miningSwingTime = 0;
    clearKeys();
    animationRuntime?.update(dt, { isMoving: false });
    updatePlayerGroundY(dt);
    return state;
  }

  const isMining = state.miningSwingTime > 0;
  let isMoving = false;
  let isSprinting = false;
  if (!isMining) {
    const { forward, right } = getMovementBasisVectors(camera);
    const move = buildMoveVector(keys, forward, right);
    isMoving = isMoveVectorActive(move);
    if (isMoving) {
      normalizeMoveVector(move);
      updateLatestMoveDirection(move);
      const movementSpeed = getMovementSpeed({
        isDevMovementMode: isDevSession(),
        hasShoesEquipped: hasShoesEquipped(),
        shiftPressed: keys.shift,
        airMoveScalar: getAirMoveScalar(),
      });
      const { speed } = movementSpeed;
      isSprinting = movementSpeed.isSprinting;
      const previousPosition = player.position.clone();
      const delta = getMovementDelta(move, speed, dt);
      const { afterX } = applyMovementCollisionStep({
        axis: "x", position: player.position, prevPos: previousPosition, delta,
        isInsideBounds, intersectsAnyCollider, getColliderPenetration, isStartRingTransitionBlocked, isCrossingBlockedStartRing,
      });
      applyMovementCollisionStep({
        axis: "z", position: player.position, prevPos: { ...previousPosition, x: afterX }, delta,
        isInsideBounds, intersectsAnyCollider, getColliderPenetration, isStartRingTransitionBlocked, isCrossingBlockedStartRing,
      });
      applyMovementPostCollisionCorrections({
        position: player.position,
        prevPos: previousPosition,
        resolveStartRingPenetration: getPostCollisionOptions().resolveStartRingPenetration,
        ...getPostCollisionOptions(),
      });
      player.rotation.y = getMovementYaw(move);
    }
  }

  if (isMining) {
    const previousMiningTime = state.miningSwingTime;
    state.miningSwingTime = Math.max(0, previousMiningTime - dt);
    const impactTime = state.miningImpactTime;
    state.miningImpactCrossed = Number.isFinite(impactTime)
      && previousMiningTime > state.miningSwingTime
      && previousMiningTime >= impactTime
      && state.miningSwingTime <= impactTime;
  }
  if (state.pickupReachTime > 0 && state.miningSwingTime <= 0) {
    state.pickupReachTime = Math.max(0, state.pickupReachTime - dt);
  }
  animationRuntime?.update(dt, {
    isMoving,
    isSprinting,
    isMining,
    miningDuration: state.currentMiningSwingDuration,
    miningSwingId: state.miningSwingId,
  });
  updatePlayerGroundY(dt);
  return state;
}
