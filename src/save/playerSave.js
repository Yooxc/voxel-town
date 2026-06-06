function cloneOrNull(value) {
  return value == null ? null : structuredClone(value);
}

export function createDefaultSharedWorldSave({
  createDefaultFrontierBuildState,
  mapPollutionConfig,
  createDefaultResidenceNoticeBoardState,
}) {
  return {
    frontierBuild: createDefaultFrontierBuildState(),
    abandonedMineUnlocked: false,
    mapPurification: Object.fromEntries(
      Object.keys(mapPollutionConfig).map((mapId) => [mapId, 0])
    ),
    displayBoard: null,
    residenceNoticeBoards: createDefaultResidenceNoticeBoardState(),
    frontierWasteland: {
      cells: [],
      fencePosts: [],
      claims: [],
      structures: [],
    },
  };
}

export function serializeSharedWorldStateData({
  frontierBuildState,
  abandonedMineUnlocked,
  mapPollutionConfig,
  getMapPurificationValue,
  nftExhibitSelectedItem,
  residenceNoticeBoardState,
  frontierWastelandState,
}) {
  return {
    frontierBuild: structuredClone(frontierBuildState),
    abandonedMineUnlocked: Boolean(abandonedMineUnlocked),
    mapPurification: Object.fromEntries(
      Object.keys(mapPollutionConfig).map((mapId) => [mapId, getMapPurificationValue(mapId)])
    ),
    displayBoard: cloneOrNull(nftExhibitSelectedItem),
    residenceNoticeBoards: structuredClone(residenceNoticeBoardState),
    frontierWasteland: structuredClone(frontierWastelandState ?? {
      cells: [],
      fencePosts: [],
      claims: [],
      structures: [],
    }),
  };
}

export function normalizeSharedWorldStateData(rawWorld, {
  createDefaultSharedWorldSave,
  normalizeFrontierBuildState,
  normalizeNftBoardSelection,
  normalizeResidenceNoticeBoardState,
  normalizeFrontierWastelandState,
}) {
  return {
    ...createDefaultSharedWorldSave(),
    ...(rawWorld && typeof rawWorld === "object" ? rawWorld : {}),
    frontierBuild: normalizeFrontierBuildState(rawWorld?.frontierBuild),
    abandonedMineUnlocked: Boolean(rawWorld?.abandonedMineUnlocked),
    mapPurification: {
      ...createDefaultSharedWorldSave().mapPurification,
      ...(rawWorld?.mapPurification ?? {}),
    },
    displayBoard: normalizeNftBoardSelection(rawWorld?.displayBoard),
    residenceNoticeBoards: normalizeResidenceNoticeBoardState(rawWorld?.residenceNoticeBoards),
    frontierWasteland: normalizeFrontierWastelandState(rawWorld?.frontierWasteland),
  };
}

export function createDefaultPlayerSave({
  playerSaveVersion,
  startX,
  startY,
  startZ,
  airGaugeMax,
  inventorySlotCount,
  personalStorageSlotCount,
  createDefaultFrontierBuildState,
}) {
  return {
    version: playerSaveVersion,
    mapId: "광산맵",
    position: {
      x: startX,
      y: startY,
      z: startZ,
    },
    rotationY: 0,
    economy: {
      credits: 0,
    },
    inventory: {
      slots: Array.from({ length: inventorySlotCount }, () => null),
      pickaxeLevel: 1,
      mineKeyIssued: false,
      abandonedMineUnlocked: false,
      quickUse: {
        "1": null,
        "2": null,
        "3": null,
        "4": null,
        "5": null,
      },
      equipped: {
        head: null,
        body: null,
        shoes: null,
        tool: null,
      },
    },
    tutorial: {
      currentStep: 0,
      minedRockCount: 0,
      upgradeCount: 0,
      completed: false,
      archivedSteps: [],
    },
    airSystem: {
      current: airGaugeMax,
      max: airGaugeMax,
      mapPurification: {
        "폐광맵": 0,
        "개척지": 0,
      },
    },
    personalStorage: {
      slots: Array.from({ length: personalStorageSlotCount }, () => null),
    },
    residence: {
      activeRoomKey: "101",
    },
    frontierBuild: createDefaultFrontierBuildState(),
    displayBoard: null,
  };
}

export function serializePlayerSaveData({
  playerSaveVersion,
  currentMapId,
  playerPosition,
  playerRotationY,
  clampPlayerCredits,
  playerCredits,
  inventory,
  tutorialQuest,
  playerAirCurrent,
  playerAirMax,
  getMapPurificationValue,
  personalStorage,
  mansionOneActiveRoomKey,
  frontierBuildState,
  nftExhibitSelectedItem,
  quickUseAllowedKeys,
}) {
  return {
    version: playerSaveVersion,
    mapId: currentMapId,
    position: {
      x: Number(playerPosition.x.toFixed(3)),
      y: Number(playerPosition.y.toFixed(3)),
      z: Number(playerPosition.z.toFixed(3)),
    },
    rotationY: Number(playerRotationY.toFixed(4)),
    economy: {
      credits: clampPlayerCredits(playerCredits),
    },
    inventory: {
      slots: inventory.slots.map((slot) => cloneOrNull(slot)),
      pickaxeLevel: inventory.pickaxeLevel,
      mineKeyIssued: inventory.mineKeyIssued,
      abandonedMineUnlocked: inventory.abandonedMineUnlocked,
      quickUse: Object.fromEntries(
        quickUseAllowedKeys.map((key) => [key, cloneOrNull(inventory.quickUse[key])])
      ),
      equipped: {
        head: cloneOrNull(inventory.equipped.head),
        body: cloneOrNull(inventory.equipped.body),
        shoes: cloneOrNull(inventory.equipped.shoes),
        tool: cloneOrNull(inventory.equipped.tool),
      },
    },
    tutorial: {
      currentStep: tutorialQuest.currentStep,
      minedRockCount: tutorialQuest.minedRockCount,
      upgradeCount: tutorialQuest.upgradeCount,
      completed: tutorialQuest.completed,
      archivedSteps: [...tutorialQuest.archivedSteps],
    },
    airSystem: {
      current: Number(playerAirCurrent.toFixed(2)),
      max: playerAirMax,
      mapPurification: {
        "폐광맵": getMapPurificationValue("폐광맵"),
        "개척지": getMapPurificationValue("개척지"),
      },
    },
    personalStorage: {
      slots: personalStorage.slots.map((slot) => cloneOrNull(slot)),
    },
    residence: {
      activeRoomKey: mansionOneActiveRoomKey === "102" ? "102" : "101",
    },
    frontierBuild: structuredClone(frontierBuildState),
    displayBoard: cloneOrNull(nftExhibitSelectedItem),
  };
}

export function buildNormalizedPlayerSaveSource(rawSave, {
  createDefaultPlayerSave,
  normalizeFrontierBuildState,
  normalizeNftBoardSelection,
}) {
  const save = rawSave && typeof rawSave === "object" ? rawSave : createDefaultPlayerSave();
  const defaultSave = createDefaultPlayerSave();
  return {
    ...defaultSave,
    ...save,
    inventory: {
      ...defaultSave.inventory,
      ...(save.inventory ?? {}),
      quickUse: {
        ...defaultSave.inventory.quickUse,
        ...(save.inventory?.quickUse ?? {}),
      },
      equipped: {
        ...defaultSave.inventory.equipped,
        ...(save.inventory?.equipped ?? {}),
      },
    },
    tutorial: {
      ...defaultSave.tutorial,
      ...(save.tutorial ?? {}),
    },
    economy: {
      ...defaultSave.economy,
      ...(save.economy ?? {}),
    },
    airSystem: {
      ...defaultSave.airSystem,
      ...(save.airSystem ?? {}),
      mapPurification: {
        ...defaultSave.airSystem.mapPurification,
        ...(save.airSystem?.mapPurification ?? {}),
      },
    },
    personalStorage: {
      ...defaultSave.personalStorage,
      ...(save.personalStorage ?? {}),
    },
    residence: {
      ...defaultSave.residence,
      ...(save.residence ?? {}),
    },
    frontierBuild: normalizeFrontierBuildState(save.frontierBuild),
    displayBoard: normalizeNftBoardSelection(save.displayBoard ?? null),
  };
}
