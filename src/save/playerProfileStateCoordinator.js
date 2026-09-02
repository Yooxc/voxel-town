import {
  createDefaultPlayerSave as createDefaultPlayerSaveData,
  serializePlayerSaveData,
  buildNormalizedPlayerSaveSource,
} from "./playerSave.js";

function clearSlots(slots) {
  for (let index = 0; index < slots.length; index += 1) slots[index] = null;
}

function resetEquipment(inventory) {
  inventory.equipped.head = null;
  inventory.equipped.body = null;
  inventory.equipped.shoes = null;
  inventory.equipped.tool = null;
}

function resetTutorialQuest(tutorialQuest, { complete = false } = {}) {
  tutorialQuest.minedRockCount = complete ? 1 : 0;
  tutorialQuest.upgradeCount = complete ? 3 : 0;
  tutorialQuest.archivedSteps = [];
  tutorialQuest.currentStep = complete ? tutorialQuest.steps.length : 0;
  tutorialQuest.completed = complete;
}

function removeItemFromSerializedSlots(slots, itemId) {
  if (!Array.isArray(slots)) return slots;
  return slots.map((entry) => {
    const entryItemId = entry?.itemId ?? entry?.id ?? "";
    return entryItemId === itemId ? null : entry;
  });
}

export function resetSerializedDevProfileWorldState(rawSave, {
  startPosition,
  airGaugeMax,
  landDeedItemId,
}) {
  const save = rawSave && typeof rawSave === "object" ? structuredClone(rawSave) : {};
  save.mapId = "광산";
  save.position = {
    x: Number(startPosition?.x) || 0,
    y: Number(startPosition?.y) || 0,
    z: Number(startPosition?.z) || 0,
  };
  save.rotationY = 0;
  save.airSystem = {
    ...(save.airSystem ?? {}),
    current: airGaugeMax,
    max: airGaugeMax,
  };
  delete save.airSystem.mapPurification;

  if (save.inventory) {
    save.inventory.slots = removeItemFromSerializedSlots(save.inventory.slots, landDeedItemId);
    for (const key of Object.keys(save.inventory.quickUse ?? {})) {
      const binding = save.inventory.quickUse[key];
      if ((binding?.itemId ?? binding?.id) === landDeedItemId) save.inventory.quickUse[key] = null;
    }
    for (const slotId of Object.keys(save.inventory.equipped ?? {})) {
      const equipped = save.inventory.equipped[slotId];
      if ((equipped?.itemId ?? equipped?.id) === landDeedItemId) save.inventory.equipped[slotId] = null;
    }
    delete save.inventory.abandonedMineUnlocked;
  }
  if (save.personalStorage) {
    save.personalStorage.slots = removeItemFromSerializedSlots(
      save.personalStorage.slots,
      landDeedItemId,
    );
  }
  return save;
}

export function resetSerializedDevProfileTestState(rawSave, {
  startPosition,
  airGaugeMax,
  landDeedItemId,
  baselineInventory,
  baselinePersonalStorage,
  credits = 500,
}) {
  const save = resetSerializedDevProfileWorldState(rawSave, {
    startPosition,
    airGaugeMax,
    landDeedItemId,
  });
  save.inventory = structuredClone(baselineInventory);
  save.personalStorage = structuredClone(baselinePersonalStorage);
  save.economy = {
    ...(save.economy ?? {}),
    credits: Math.max(0, Math.floor(Number(credits) || 0)),
  };
  return save;
}

export function createPlayerProfileStateCoordinator(ctx) {
  function resizeInventorySlotsForActiveProfile() {
    const slotCount = typeof ctx.getInventorySlotCount === "function"
      ? ctx.getInventorySlotCount(ctx.getActiveProfileId())
      : ctx.inventory.slots.length;
    const normalizedSlotCount = Math.max(0, Math.floor(Number(slotCount) || 0));
    if (ctx.inventory.slots.length === normalizedSlotCount) return;
    const nextSlots = Array.from(
      { length: normalizedSlotCount },
      (_, index) => ctx.inventory.slots[index] ?? null,
    );
    ctx.inventory.slots.splice(0, ctx.inventory.slots.length, ...nextSlots);
  }

  function resetInventoryAndStorage() {
    clearSlots(ctx.inventory.slots);
    clearSlots(ctx.personalStorage.slots);
    for (const key of ctx.quickUseAllowedKeys) ctx.inventory.quickUse[key] = null;
    resetEquipment(ctx.inventory);
  }

  function resetAirAndPurification() {
    ctx.setAirState({ max: ctx.airGaugeMax, current: ctx.airGaugeMax });
    ctx.resetMapPurificationValues();
  }

  function resetPlayerAir() {
    ctx.setAirState({ max: ctx.airGaugeMax, current: ctx.airGaugeMax });
  }

  function applyBaselineInventory(baseline, { preserveSharedMineUnlock = false } = {}) {
    if (!baseline?.inventory) return false;
    const sharedMineUnlocked = ctx.inventory.abandonedMineUnlocked;
    resizeInventorySlotsForActiveProfile();
    resetInventoryAndStorage();
    for (let index = 0; index < ctx.inventory.slots.length; index += 1) {
      ctx.inventory.slots[index] = ctx.normalizeInventorySlotEntry(
        baseline.inventory.slots?.[index] ?? null,
      );
    }
    ctx.inventory.pickaxeLevel = Math.max(
      0,
      ctx.clampPickaxeLevel(baseline.inventory.pickaxeLevel ?? 1),
    );
    ctx.inventory.mineKeyIssued = Boolean(baseline.inventory.mineKeyIssued);
    ctx.inventory.abandonedMineUnlocked = preserveSharedMineUnlock
      ? sharedMineUnlocked
      : Boolean(baseline.inventory.abandonedMineUnlocked);
    for (const key of ctx.quickUseAllowedKeys) {
      ctx.inventory.quickUse[key] = ctx.normalizeQuickUseBinding(
        baseline.inventory.quickUse?.[key] ?? null,
      );
    }
    for (const slotId of Object.keys(ctx.inventory.equipped)) {
      ctx.inventory.equipped[slotId] = ctx.normalizeEquippedItemRef(
        baseline.inventory.equipped?.[slotId] ?? null,
      );
    }
    ctx.setPlayerCredits(baseline.credits ?? 500);
    ctx.pruneQuickUseBindings();
    return true;
  }

  function syncPlayerTransform(position, rotationY = 0) {
    const player = ctx.getPlayer();
    player.position.set(position.x, position.y ?? player.position.y, position.z);
    player.rotation.y = rotationY;
    ctx.updateLatestMoveDirection(rotationY);
    ctx.snapCameraToPlayer();
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

  function createDefaultPlayerSave() {
    const player = ctx.getPlayer();
    return createDefaultPlayerSaveData({
      playerSaveVersion: ctx.playerSaveVersion,
      startX: ctx.startPosition.x,
      startY: player.position.y,
      startZ: ctx.startPosition.z,
      airGaugeMax: ctx.airGaugeMax,
      inventorySlotCount: ctx.inventory.slots.length,
      personalStorageSlotCount: ctx.personalStorage.slots.length,
      createDefaultFrontierBuildState: ctx.createDefaultFrontierBuildState,
    });
  }

  function serializePlayerSave() {
    const player = ctx.getPlayer();
    const airState = ctx.getAirState();
    return serializePlayerSaveData({
      playerSaveVersion: ctx.playerSaveVersion,
      currentMapId: ctx.getCurrentMapId(),
      playerPosition: player.position,
      playerRotationY: player.rotation.y,
      clampPlayerCredits: ctx.clampPlayerCredits,
      playerCredits: ctx.getPlayerCredits(),
      inventory: ctx.inventory,
      tutorialQuest: ctx.tutorialQuest,
      playerAirCurrent: airState.current,
      playerAirMax: airState.max,
      getMapPurificationValue: ctx.getMapPurificationValue,
      personalStorage: ctx.personalStorage,
      mansionOneActiveRoomKey: ctx.getMansionActiveRoomKey(),
      frontierBuildState: ctx.getFrontierBuildStateData(),
      nftExhibitSelectedItem: ctx.getSelectedNftBoardItem(),
      quickUseAllowedKeys: ctx.quickUseAllowedKeys,
    });
  }

  function applyDevPreset() {
    if (!ctx.devPresetEnabled) return;
    const preset = ctx.devPreset;
    const baseline = ctx.getDevProfileBaselineState(ctx.getActiveProfileId());
    const preservedLandDeeds = ctx.getWastelandLandDeedEntries().map((entry) => structuredClone(entry));

    applyBaselineInventory(baseline);
    ctx.restorePreservedWastelandLandDeeds(preservedLandDeeds);
    resetTutorialQuest(ctx.tutorialQuest, { complete: Boolean(preset.completeTutorial) });

    resetPlayerAir();
    const mapId = preset.startMapId ?? "광산";
    ctx.setCurrentMapId(mapId);
    ctx.updateSceneFogForCurrentMap();
    const spawn = mapId === "폐광" ? ctx.getCampSpawn() : { ...ctx.startPosition, rotationY: 0 };
    syncPlayerTransform(spawn, spawn.rotationY);
    ctx.updateInventoryUi();
  }

  function ensureDevTestInventory() {
    if (!ctx.devPresetEnabled) return;
    const baseline = ctx.getDevProfileBaselineState(ctx.getActiveProfileId());
    ctx.inventory.pickaxeLevel = Math.max(
      ctx.inventory.pickaxeLevel,
      ctx.clampPickaxeLevel(baseline.inventory.pickaxeLevel ?? 1),
    );
    for (const entry of baseline.inventory.slots) {
      const itemId = entry?.itemId ?? entry?.id;
      if (!itemId) continue;
      ctx.ensureExactOwnedItemCount(itemId, entry.count ?? 1);
    }
    ctx.inventory.mineKeyIssued = Boolean(baseline.inventory.mineKeyIssued);
    ctx.equipFirstOwnedItem("tool", "pickaxe");
    ctx.equipFirstOwnedItem("head", "safetyHelmet");
    ctx.updateInventoryUi();
  }

  function applyFreshPlayerStartState() {
    ctx.setSelectedNftBoardItem(null);
    ctx.destroyMansionRoomInstance("101");
    ctx.destroyMansionRoomInstance("102");
    resetInventoryAndStorage();
    ctx.inventory.pickaxeLevel = 1;
    ctx.inventory.mineKeyIssued = false;
    ctx.inventory.abandonedMineUnlocked = false;
    resetTutorialQuest(ctx.tutorialQuest);
    resetAirAndPurification();
    applyMineGateState(false);
    ctx.setCurrentMapId("광산");
    ctx.updateSceneFogForCurrentMap();
    syncPlayerTransform(ctx.startPosition, 0);
    ctx.setPersonalStorageOpen(false);
    ctx.updateInventoryUi();
    ctx.renderQuestIfOpen();
  }

  function applySerializedPlayerSave(rawSave, { preserveSharedWorld = false } = {}) {
    resizeInventorySlotsForActiveProfile();
    const source = buildNormalizedPlayerSaveSource(rawSave, {
      createDefaultPlayerSave,
      normalizeFrontierBuildState: ctx.normalizeFrontierBuildState,
      normalizeNftBoardSelection: ctx.normalizeNftBoardSelection,
    });
    if (preserveSharedWorld) source.frontierBuild = ctx.normalizeFrontierBuildState(ctx.getFrontierBuildStateData());

    for (let index = 0; index < ctx.inventory.slots.length; index += 1) {
      ctx.inventory.slots[index] = ctx.normalizeInventorySlotEntry(source.inventory.slots[index] ?? null);
    }
    ctx.inventory.pickaxeLevel = Math.max(0, ctx.clampPickaxeLevel(source.inventory.pickaxeLevel ?? 0));
    ctx.inventory.mineKeyIssued = Boolean(source.inventory.mineKeyIssued);
    ctx.inventory.abandonedMineUnlocked = preserveSharedWorld
      ? Boolean(ctx.inventory.abandonedMineUnlocked)
      : Boolean(source.inventory.abandonedMineUnlocked);
    for (const key of ctx.quickUseAllowedKeys) {
      ctx.inventory.quickUse[key] = ctx.normalizeQuickUseBinding(source.inventory.quickUse[key]);
    }
    ctx.inventory.equipped.head = ctx.normalizeEquippedItemRef(source.inventory.equipped.head);
    ctx.inventory.equipped.body = ctx.normalizeEquippedItemRef(source.inventory.equipped.body);
    ctx.inventory.equipped.shoes = ctx.normalizeEquippedItemRef(source.inventory.equipped.shoes);
    ctx.inventory.equipped.tool = ctx.normalizeEquippedItemRef(source.inventory.equipped.tool);
    ctx.setPlayerCredits(source.economy.credits);
    ctx.pruneQuickUseBindings();

    ctx.tutorialQuest.currentStep = Math.max(0, Math.min(source.tutorial.currentStep ?? 0, ctx.tutorialQuest.steps.length));
    ctx.tutorialQuest.minedRockCount = Math.max(0, source.tutorial.minedRockCount ?? 0);
    ctx.tutorialQuest.upgradeCount = Math.max(0, source.tutorial.upgradeCount ?? 0);
    ctx.tutorialQuest.completed = Boolean(source.tutorial.completed);
    ctx.tutorialQuest.archivedSteps = Array.isArray(source.tutorial.archivedSteps) ? [...source.tutorial.archivedSteps] : [];
    ctx.setAirState({
      max: Math.max(1, Number(source.airSystem.max) || ctx.airGaugeMax),
      current: Number(source.airSystem.current) || ctx.airGaugeMax,
    });
    if (!preserveSharedWorld) {
      for (const mapId of ctx.mapPollutionMapIds) {
        ctx.setMapPurificationValue(mapId, Number(source.airSystem.mapPurification?.[mapId]) || 0);
      }
    }
    for (let index = 0; index < ctx.personalStorage.slots.length; index += 1) {
      ctx.personalStorage.slots[index] = ctx.normalizeInventorySlotEntry(source.personalStorage.slots?.[index] ?? null);
    }
    if (!preserveSharedWorld) ctx.setFrontierBuildState(ctx.normalizeFrontierBuildState(source.frontierBuild));
    if (!preserveSharedWorld) ctx.setSelectedNftBoardItem(source.displayBoard);

    applyMineGateState(ctx.inventory.abandonedMineUnlocked);
    const mapId = ctx.validMapIds.includes(source.mapId) ? source.mapId : "광산";
    ctx.setCurrentMapId(mapId);
    const roomKey = source.residence?.activeRoomKey === "102" ? "102" : "101";
    ctx.setMansionActiveRoomKey(roomKey);
    if (mapId === ctx.residenceMapId) {
      ctx.createMansionRoomInstance(roomKey);
      ctx.destroyMansionRoomInstance(roomKey === "102" ? "101" : "102");
    } else {
      ctx.destroyMansionRoomInstance("101");
      ctx.destroyMansionRoomInstance("102");
    }
    ctx.updateSceneFogForCurrentMap();
    syncPlayerTransform({
      x: Number.isFinite(source.position?.x) ? source.position.x : ctx.startPosition.x,
      y: Number.isFinite(source.position?.y) ? source.position.y : ctx.getPlayer().position.y,
      z: Number.isFinite(source.position?.z) ? source.position.z : ctx.startPosition.z,
    }, Number.isFinite(source.rotationY) ? source.rotationY : 0);
    ctx.updateInventoryUi();
    ctx.rebuildAllFrontierConstructionVisuals();
    ctx.scheduleNftExhibitBoardRefresh();
    ctx.refreshQuestProgress();
    ctx.renderQuestIfOpen();
    ctx.setLastSnapshot(JSON.stringify(serializePlayerSave()));
  }

  return {
    applyDevPreset,
    ensureDevTestInventory,
    applyFreshPlayerStartState,
    createDefaultPlayerSave,
    serializePlayerSave,
    applySerializedPlayerSave,
  };
}
