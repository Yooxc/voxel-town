import { createInteractionController } from "../ui/interactionController.js";
import {
  getCurrentMapBoundsFromSurfaces,
  intersectsAnyColliderBox,
  isInsideMapBoundsFromSurfaces,
} from "./collisions.js";
import { createStartRingRuleHelpers } from "../systems/maps.js";

const DEFAULT_KEYS = Object.freeze({ w: false, a: false, s: false, d: false, shift: false });

export function createPlayerRuntimeController({
  eventTarget,
  inputElement,
  requestFrame,
  clock,
  gameplayCoordinator,
  interactionContext,
  input,
  movement,
  frame,
}) {
  const keys = { ...DEFAULT_KEYS };
  const startRingRules = createStartRingRuleHelpers(movement.startRing);
  let running = false;
  let frameRequestId = null;
  const safePositionsByMap = new Map();
  let unresolvedCollisionFrames = 0;

  const clearKeys = () => {
    for (const key of Object.keys(keys)) keys[key] = false;
  };

  const canUseCameraInput = () => input.canPlayGame() && !input.isWorkUiMovementLocked();
  const setCameraControlsEnabled = (enabled = canUseCameraInput()) => gameplayCoordinator.setCameraControlsEnabled(enabled);

  const interactionController = createInteractionController(Object.assign(Object.create(interactionContext), {
    getKeys: () => keys,
    setCameraControlsEnabled,
  }));

  function handleWindowBlur() {
    clearKeys();
  }

  function handleKeyDown(event) {
    interactionController.handleKeyDown(event);
  }

  function handleKeyUp(event) {
    const key = input.getLogicalInputKey(event);
    if (key in keys) keys[key] = false;
  }

  function handleWorldSpaceKeyDown(event) {
    if (!input.canPlayGame() || input.isNftExhibitOpen() || input.isQuickUseAssigning()) return;
    if (input.isSleeping() || input.isClaimDialogOpen()) return;
    if (event.code !== "Space") return;
    if (input.isPersonalStorageOpen()) {
      event.preventDefault();
      return;
    }
    if (input.isInventoryOpen()) event.preventDefault();
    interactionController.handleWorldSpaceInteraction(event);
  }

  function updateMovement(dt) {
    setCameraControlsEnabled();
    const surfaces = movement.getWalkableSurfaces();
    const mapBounds = getCurrentMapBoundsFromSurfaces(surfaces, movement.defaultMapBounds);
    stabilizePlayerCollision();
    gameplayCoordinator.updateMovement({
      ...movement.getOptions(),
      dt,
      keys,
      pickupReachDuration: movement.pickupReachDuration,
      isInsideBounds: (x, z) => isInsideMapBoundsFromSurfaces(x, z, surfaces, mapBounds),
      intersectsAnyCollider: () => intersectsAnyColliderBox(movement.getPlayerBox(), movement.colliderBoxes),
      getColliderPenetration: movement.getColliderPenetration,
      isStartRingTransitionBlocked: startRingRules.isStartRingTransitionBlocked,
      isCrossingBlockedStartRing: startRingRules.isCrossingBlockedStartRing,
      getPostCollisionOptions: () => ({
        resolveStartRingPenetration: startRingRules.resolveStartRingPenetration,
        startWallOn: movement.startRing.startWallOn,
        startHardClamp: movement.startHardClamp,
        startX: movement.startRing.startX,
        startZ: movement.startRing.startZ,
        startRadius: movement.startRing.startRadius,
      }),
      onWorkUiLocked: () => setCameraControlsEnabled(false),
    });
    stabilizePlayerCollision();
  }

  function getCurrentMapKey() {
    return movement.getCurrentMapId?.() ?? "default";
  }

  function clonePlayerPosition(player) {
    return {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z,
      rotationY: player.rotation.y,
    };
  }

  function isSafeRecoveryPosition(position, mapId) {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) return false;
    return movement.isSafePosition?.(position, mapId) ?? true;
  }

  function rememberSafePosition(player, mapId = getCurrentMapKey()) {
    const position = clonePlayerPosition(player);
    if (!isSafeRecoveryPosition(position, mapId)) return;
    const history = safePositionsByMap.get(mapId) ?? [];
    const previous = history.at(-1);
    if (previous && Math.hypot(previous.x - position.x, previous.y - position.y, previous.z - position.z) < 0.1) return;
    history.push(position);
    if (history.length > 8) history.shift();
    safePositionsByMap.set(mapId, history);
  }

  function findRecoveryPosition(mapId, origin, preferredFallback = null) {
    const candidates = [];
    if (preferredFallback) candidates.push(preferredFallback);
    const history = safePositionsByMap.get(mapId) ?? [];
    candidates.push(...history.slice().reverse());
    const nearby = movement.findNearestSafePosition?.({ mapId, origin, safePositions: history });
    if (nearby) candidates.push(nearby);
    const mapFallback = movement.getSafePositionFallback?.(mapId);
    if (mapFallback) candidates.push(mapFallback);
    return candidates.find((candidate) => isSafeRecoveryPosition(candidate, mapId)) ?? null;
  }

  function recoverPlayerCollision({ source = "movement", immediate = false, preferredFallback = null } = {}) {
    const player = movement.getPlayer?.();
    if (!player || typeof movement.getColliderPenetration !== "function") return false;
    const mapId = getCurrentMapKey();
    if (movement.getColliderPenetration() <= 0.0001) {
      rememberSafePosition(player, mapId);
      unresolvedCollisionFrames = 0;
      return false;
    }

    movement.resolvePlayerPenetration?.();
    if (movement.getColliderPenetration() <= 0.0001) {
      rememberSafePosition(player, mapId);
      unresolvedCollisionFrames = 0;
      return true;
    }

    unresolvedCollisionFrames += 1;
    if (!immediate && unresolvedCollisionFrames < 2) return false;
    const fallback = findRecoveryPosition(mapId, clonePlayerPosition(player), preferredFallback);
    if (!fallback) return false;
    player.position.set(fallback.x, fallback.y, fallback.z);
    if (Number.isFinite(fallback.rotationY)) player.rotation.y = fallback.rotationY;
    unresolvedCollisionFrames = 0;
    clearKeys();
    movement.onPlayerCollisionRecovery?.({ source, mapId, position: fallback });
    return true;
  }

  function stabilizePlayerCollision() {
    recoverPlayerCollision();
  }

  function runFrame(rawDt) {
    frame.updateForgeUpgradeState();
    const feedbackState = gameplayCoordinator.updateFeedback(rawDt);
    const dt = feedbackState.hitStopped ? 0 : rawDt;

    updateMovement(dt);
    frame.updateCurrentMapFromPlayerPosition();
    frame.updateOnboardingTour?.(rawDt);
    frame.updateSceneFogForCurrentMap();
    frame.schedulePlayerSaveSync();
    frame.announceMapChange();
    frame.updateDynamicProps(dt);
    frame.updateAirSystem(rawDt);
    frame.updateCavePollutionVisuals(rawDt);
    gameplayCoordinator.updateResourceVisuals({ dt, reactionDt: rawDt });
    frame.renderEquipmentPreviewIfOpen();
    frame.updateCompass();
    interactionController.updateFrame();
    gameplayCoordinator.updateCameraFollow(rawDt);
    frame.updateWorldLabels();
    gameplayCoordinator.applyCameraShake();
    frame.closeDistantWorkstations();
    frame.render();
  }

  function animate() {
    if (!running) return;
    frameRequestId = requestFrame(animate);
    runFrame(Math.min(clock.getDelta(), 0.033));
  }

  function bind() {
    eventTarget.addEventListener("blur", handleWindowBlur);
    eventTarget.addEventListener("keydown", handleKeyDown);
    eventTarget.addEventListener("keyup", handleKeyUp);
    eventTarget.addEventListener("keydown", handleWorldSpaceKeyDown);
  }

  function unbind() {
    eventTarget.removeEventListener("blur", handleWindowBlur);
    eventTarget.removeEventListener("keydown", handleKeyDown);
    eventTarget.removeEventListener("keyup", handleKeyUp);
    eventTarget.removeEventListener("keydown", handleWorldSpaceKeyDown);
  }

  function start() {
    if (running) return;
    running = true;
    bind();
    animate();
  }

  function stop() {
    if (!running) return;
    running = false;
    unbind();
    if (frameRequestId !== null) frame.cancelFrame?.(frameRequestId);
    frameRequestId = null;
    gameplayCoordinator.cancelMiningSwing();
    clearKeys();
    setCameraControlsEnabled(false);
  }

  return {
    start,
    stop,
    runFrame,
    clearKeys,
    cancelMiningSwing: () => gameplayCoordinator.cancelMiningSwing(),
    requestCollisionRecovery: (options) => recoverPlayerCollision(options),
    clearSafePositionHistory: (mapId = null) => {
      if (mapId) safePositionsByMap.delete(mapId);
      else safePositionsByMap.clear();
    },
    getKeys: () => keys,
    triggerMiningSwing: (target = null, options = {}) => gameplayCoordinator.triggerMiningSwing(target, movement.getSwingDuration, options),
    isMiningLocked: () => gameplayCoordinator.isMiningLocked(),
    triggerPickupReach: (target = null) => gameplayCoordinator.triggerPickupReach(target, movement.pickupReachDuration),
    interactionContext,
  };
}
