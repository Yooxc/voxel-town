import { createPlayerRuntimeController } from "./playerRuntimeController.js";
import {
  buildMoveVector,
  getMovementBasisVectors,
  getMovementDelta,
  getMovementSpeed,
  getMovementYaw,
  getWalkAnimationSpeed,
  isMoveVectorActive,
  normalizeMoveVector,
  updateLatestMoveDirection,
} from "./movement.js";
import {
  applyMovementCollisionStep,
  applyMovementPostCollisionCorrections,
} from "./collisions.js";
import {
  applyMiningSwingPose,
  applyPickupReachPose,
  applySleepPose,
  applyWalkIdlePose,
} from "./player.js";

export function createPlayerMovementRuntime(movement) {
  const {
    player,
    camera,
    controls,
    rig,
    latestMoveDirection,
    ...runtime
  } = movement;

  return {
    ...runtime,
    getPlayer: () => player,
    getOptions: () => ({
      player,
      camera,
      controls,
      rig,
      canPlayGame: runtime.canPlayGame,
      isWorkUiMovementLocked: runtime.isWorkUiMovementLocked,
      isSleeping: runtime.isSleeping,
      isDevSession: runtime.isDevSession,
      hasShoesEquipped: runtime.hasShoesEquipped,
      getAirMoveScalar: runtime.getAirMoveScalar,
      getColliderPenetration: runtime.getColliderPenetration,
      getMovementBasisVectors,
      buildMoveVector,
      isMoveVectorActive,
      normalizeMoveVector,
      updateLatestMoveDirection: (move) => updateLatestMoveDirection(latestMoveDirection, move),
      getMovementSpeed,
      getMovementDelta,
      applyMovementCollisionStep,
      applyMovementPostCollisionCorrections,
      getMovementYaw,
      getWalkAnimationSpeed,
      applyWalkIdlePose,
      applyMiningSwingPose,
      applyPickupReachPose,
      applySleepPose,
      updatePlayerGroundY: runtime.updatePlayerGroundY,
      now: runtime.now(),
    }),
  };
}

export function createPlayerFrameRuntime(frame) {
  return {
    ...frame,
    announceMapChange: () => {
      const mapId = frame.getCurrentMapId();
      if (mapId === frame.getLastAnnouncedMapId()) return;
      frame.showMapArrivalBanner(mapId);
      frame.setLastAnnouncedMapId(mapId);
    },
    renderEquipmentPreviewIfOpen: () => {
      if (frame.isInventoryOpen()) frame.renderEquipmentPreview();
    },
    updateCompass: () => frame.updateCompassFromDirection(
      frame.getCompassDirection(frame.latestMoveDirection, frame.getPlayerYaw())
    ),
    updateWorldLabels: () => {
      frame.updateNpcDialogPosition();
      frame.updateTutorialNpcNameTag();
      frame.updatePlayerNameTag();
    },
    closeDistantWorkstations: () => {
      if (frame.isForgeOpen() && frame.getForgeDistance() >= 2.8) frame.setForgeOpen(false);
      if (frame.isRefineryOpen() && frame.getRefineryDistance() >= 2.8) frame.setRefineryOpen(false);
    },
  };
}

export function createPlayerRuntimeIntegration({
  runtime,
  platform,
  gameplayCoordinator,
  input,
  movement,
  frame,
  interaction,
  interactionState,
  mining,
}) {
  const interactionContext = {
    ...interaction,
    getInteractionState: () => interactionState.get(),
    setInteractionState: (state) => interactionState.set(state),
    createRockMiningPlan: (rock) => mining.createPlan({
      hp: rock.userData.hp,
      maxHp: rock.userData.maxHp ?? 1,
      miningPower: mining.hasEquippedPickaxe() ? mining.getEquippedMiningPower() : 0,
      isPickaxeEquipped: mining.hasEquippedPickaxe(),
      hasOwnedPickaxe: mining.hasOwnedPickaxe(),
      equippedPickaxeLevel: mining.getEquippedPickaxeLevel(),
      requiredPickaxeLevel: rock.userData.requiredPickaxeLevel ?? 0,
    }),
    finishRockMining: (rock, spawn) => {
      mining.spawnBreakBurst(rock);
      if (rock.userData.resourceItemId === "stoneDust") mining.incrementTutorialRockCount();
      mining.addItem(rock.userData.resourceItemId ?? "stoneDust", rock.userData.resourceCount ?? 1);
      if (rock.userData.bonusDropEnabled) {
        if (mining.random() < mining.getBonusDropChance()) {
          mining.addItem("stoneDust", 1);
          mining.notify("보너스 돌가루 획득!", 800);
        }
      } else {
        mining.notify(`${mining.getItemName(rock.userData.resourceItemId) ?? "자원"} 획득!`, 800);
      }
      mining.updateInventoryUi();
      mining.refreshQuestProgress();
      if (typeof rock.userData.colliderIndex === "number") mining.removeCollider(rock.userData.colliderIndex);
      mining.unregisterRock(rock);
      rock.removeFromParent();
      mining.scheduleRespawn(spawn);
    },
  };
  const controllerRuntime = runtime ?? {
    ...platform,
    gameplayCoordinator,
    input,
    movement: createPlayerMovementRuntime(movement),
    frame: {
      ...createPlayerFrameRuntime(frame),
      cancelFrame: platform.cancelFrame,
    },
  };
  return createPlayerRuntimeController({ ...controllerRuntime, interactionContext });
}
