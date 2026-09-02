import {
  createDefaultSharedWorldSave as createDefaultSharedWorldSaveData,
  serializeSharedWorldStateData,
  normalizeSharedWorldStateData,
} from "./playerSave.js";

export function createSharedWorldStateCoordinator(ctx) {
  function createDefaultSharedWorldSave() {
    return createDefaultSharedWorldSaveData({
      createDefaultFrontierBuildState: ctx.createDefaultFrontierBuildState,
      mapPollutionConfig: ctx.mapPollutionConfig,
      createDefaultResidenceNoticeBoardState: ctx.createDefaultResidenceNoticeBoardState,
    });
  }

  function serializeSharedWorldState() {
    return serializeSharedWorldStateData({
      frontierBuildState: ctx.getFrontierBuildState(),
      abandonedMineUnlocked: ctx.inventory.abandonedMineUnlocked,
      mapPollutionConfig: ctx.mapPollutionConfig,
      getMapPurificationValue: ctx.getMapPurificationValue,
      nftExhibitSelectedItem: ctx.getSelectedNftBoardItem(),
      residenceNoticeBoardState: ctx.getResidenceNoticeBoardState(),
      frontierWastelandState: ctx.serializeFrontierWastelandState(),
    });
  }

  function normalizeSharedWorldState(rawWorld) {
    return normalizeSharedWorldStateData(rawWorld, {
      createDefaultSharedWorldSave,
      normalizeFrontierBuildState: ctx.normalizeFrontierBuildState,
      normalizeNftBoardSelection: ctx.normalizeNftBoardSelection,
      normalizeResidenceNoticeBoardState: ctx.normalizeResidenceNoticeBoardState,
      normalizeFrontierWastelandState: ctx.normalizeFrontierWastelandState,
    });
  }

  function applyMineGateState(unlocked) {
    const gate = ctx.getAbandonedMineGate();
    if (unlocked) {
      const colliderIndex = ctx.getTrackedColliderIndex(gate.lockBlocker, gate.lockColliderIndex);
      if (typeof colliderIndex === "number") {
        ctx.removeColliderAt(colliderIndex);
        gate.lockColliderIndex = null;
      }
      gate.lockBlocker?.removeFromParent?.();
      return;
    }
    ctx.restoreLockedMapGate(gate);
  }

  function applySharedWorldState(rawWorld) {
    const world = normalizeSharedWorldState(rawWorld);
    ctx.setFrontierBuildState(ctx.normalizeFrontierBuildState(world.frontierBuild));
    ctx.inventory.abandonedMineUnlocked = Boolean(world.abandonedMineUnlocked);
    for (const mapId of Object.keys(ctx.mapPollutionConfig)) {
      ctx.setMapPurificationValue(mapId, Number(world.mapPurification?.[mapId]) || 0);
    }
    applyMineGateState(ctx.inventory.abandonedMineUnlocked);
    ctx.setSelectedNftBoardItem(world.displayBoard);
    ctx.setResidenceNoticeBoardState(ctx.normalizeResidenceNoticeBoardState(world.residenceNoticeBoards));
    ctx.applyFrontierWastelandState(world.frontierWasteland);
    ctx.rebuildAllFrontierConstructionVisuals();
    ctx.renderResidenceNoticeBoards();
    ctx.scheduleNftExhibitBoardRefresh();
    return world;
  }

  function saveToLocal() {
    if (!ctx.isDevSession()) return false;
    try {
      ctx.storage.setItem(ctx.storageKey, JSON.stringify(serializeSharedWorldState()));
      return true;
    } catch {
      return false;
    }
  }

  function loadFromLocal() {
    try {
      const raw = ctx.storage.getItem(ctx.storageKey);
      if (!raw) return createDefaultSharedWorldSave();
      return normalizeSharedWorldState(JSON.parse(raw));
    } catch {
      return createDefaultSharedWorldSave();
    }
  }

  return {
    createDefaultSharedWorldSave,
    serializeSharedWorldState,
    normalizeSharedWorldState,
    applySharedWorldState,
    saveToLocal,
    loadFromLocal,
  };
}
