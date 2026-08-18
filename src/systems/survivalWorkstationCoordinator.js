import { createAirRuntime } from "./airRuntime.js";
import { createWorkstationRuntime } from "./workstationRuntime.js";
import {
  getAirOverlayVisualState,
  getAirPurifierHintText as getAirPurifierHintTextFromModule,
  getMapPollutionVisualStrength as getMapPollutionVisualStrengthFromModule,
  resetAllMapPurificationValues as resetAllMapPurificationValuesFromModule,
} from "./air.js";
import {
  getDefaultRefineryRecipe as getDefaultRefineryRecipeFromModule,
  getRefineryRecipeDescription as getRefineryRecipeDescriptionFromModule,
  getRefineryRecipeEntries as getRefineryRecipeEntriesFromModule,
  getSelectedRefineryRecipe as getSelectedRefineryRecipeFromModule,
  createRefineryCraftPlan,
} from "./refinery.js";
import {
  getMansionRoomEntryPlan,
  getMansionRoomExitPlan,
  getMansionSleepPlan,
} from "./residence.js";
import { createPollutionField, updatePollutionFieldPositions } from "../world/pollutionField.js";
import { createForgeRenderer } from "../ui/forgeRenderer.js";
import { createRefineryRenderer } from "../ui/refineryRenderer.js";

export function createSurvivalWorkstationCoordinator({
  airGaugeMax,
  airRecoveryPerSecond,
  mapPurificationProgress,
  mapPollutionConfig,
  getPlayerAirState,
  setPlayerAirCurrent,
  setPlayerAirMax,
  getCurrentMapId,
  getEffectiveAirMapId,
  canPlayGame,
  hasItem,
  consumeItem,
  getItemCount,
  addItem,
  getItemName,
  itemDefs,
  isBuildPartItemId,
  createForgeUpgradeAttemptPlan,
  createForgeUpgradeResultPlan,
  workstationUiController,
  workstationWindowsUi,
  createItemVisual,
  createForgeUpgradeVisual,
  getForgeUpgradeState,
  getForgeTargetItemId,
  getForgeDistance,
  getRefineryDistance,
  getDefaultForgeStats,
  setInventoryOpen,
  setQuestOpen,
  closeFrontierBuild,
  updateInventoryUi,
  schedulePlayerSaveSync,
  showUi,
  setLastMessageUntil,
  now = () => performance.now(),
  random = Math.random,
  onForgeUpgradeSucceeded,
  applyForgeUpgrade,
  airHudElements,
  updateAirHudUi,
  pollutionOverlay,
  scene,
  three,
  createPollutionField: createPollutionFieldModel = createPollutionField,
  updatePollutionFieldPositions: updateFieldPositions = updatePollutionFieldPositions,
  randomRange,
  pollutionVisualConfig,
  getPlayer,
  getActiveInteractable,
  getMansionBedInteractable,
  getMansionActiveRoomKey,
  setMansionActiveRoomKey,
  getMansionExteriorReturn,
  destroyMansionRoomInstance,
  createMansionRoomInstance,
  getFacingDirectionFromYaw,
  latestMoveDir,
  snapCameraToPlayer,
  mansionSleepOverlay,
  mansionSleepDialog,
  setPersonalStorageOpen,
  hasMansionPersonalStorageAuthority,
  isServerBackedWalletSession,
  handleWalletLogout,
  clearWalletSession,
  setWalletLogoutStatus,
}) {
  const mapPollutionFields = {};
  let airDepletedNoticeUntil = 0;
  let refinerySelectedRecipeId = "purifyPowder";
  let refinerySuccessUntil = 0;
  let refinerySuccessMessage = "";
  let forgePendingUpgrade = null;
  let forgeLastResult = null;
  let mansionSleepWakePoint = { x: 0, z: 0, rotationY: Math.PI };

  const airRuntime = createAirRuntime({
    initialAir: getPlayerAirState().current,
    maxAir: getPlayerAirState().max,
    mapPurificationProgress,
    mapPollutionConfig,
    hasItem,
    consumeItem,
    getItemCount,
    onAirChanged: setPlayerAirCurrent,
  });
  const workstationRuntime = createWorkstationRuntime({
    createRefineryCraftPlan,
    createForgeUpgradeAttemptPlan,
    createForgeUpgradeResultPlan,
    consumeItem,
    addItem,
    getItemCount,
    getItemName,
    now,
    random,
  });

  const refineryRenderer = createRefineryRenderer({
    elements: workstationWindowsUi.elements.refinery,
    itemDefs,
    createItemVisual,
    getRecipes: getRefineryRecipeEntriesFromModule,
    getSelectedRecipe: () => getSelectedRefineryRecipeFromModule(refinerySelectedRecipeId),
    selectRecipe: (recipeId) => { refinerySelectedRecipeId = recipeId; },
    getItemCount,
    getRecipeDescription: (recipe) => getRefineryRecipeDescriptionFromModule(recipe, { isBuildPartItemId, itemDefs }),
    getSuccessState: () => ({ until: refinerySuccessUntil, message: refinerySuccessMessage }),
    now,
  });
  const forgeRenderer = createForgeRenderer({
    elements: workstationWindowsUi.elements.forge,
    itemDefs,
    createUpgradeVisual: createForgeUpgradeVisual,
    getUpgradeState: getForgeUpgradeState,
    getTargetItemId: getForgeTargetItemId,
    getStoneDustCount: () => getItemCount("stoneDust"),
    getPendingUpgrade: () => forgePendingUpgrade,
    getLastResult: () => forgeLastResult,
    isForgeOpen: () => workstationUiController.isForgeOpen(),
    getForgeDistance,
    defaultStats: getDefaultForgeStats,
    now,
  });

  function notify(text, duration = 1000) {
    showUi(text, duration);
    setLastMessageUntil(now() + duration);
  }

  function getMapPollutionConfig(mapId = getCurrentMapId()) {
    return airRuntime.getPollutionConfig(mapId);
  }

  function isPollutedMap(mapId = getCurrentMapId()) {
    return airRuntime.isPollutedMap(mapId);
  }

  function getMapPurificationValue(mapId = getCurrentMapId()) {
    return airRuntime.getPurification(mapId);
  }

  function setMapPurificationValue(mapId, value) {
    return airRuntime.setPurification(mapId, value);
  }

  function resetAllMapPurificationValues() {
    return resetAllMapPurificationValuesFromModule(mapPurificationProgress, mapPollutionConfig);
  }

  function setAirState({ current, max }) {
    if (max != null) {
      const nextMax = Math.max(1, Number(max) || airGaugeMax);
      setPlayerAirMax(nextMax);
      airRuntime.setMaxAir(nextMax);
    }
    if (current != null) airRuntime.setCurrentAir(current);
  }

  function getCurrentAirDrainPerSecond() {
    return airRuntime.getHudState(getEffectiveAirMapId()).drainPerSecond;
  }

  function canRecoverAirInMap(mapId = getCurrentMapId()) {
    return airRuntime.getHudState(mapId).recoverable;
  }

  function updateAirHud() {
    const visible = canPlayGame();
    const effectiveMapId = getEffectiveAirMapId();
    const airState = getPlayerAirState();
    const base = {
      ...airHudElements,
      visible,
      currentAir: airState.current,
      maxAir: airState.max,
    };
    if (effectiveMapId == null) {
      updateAirHudUi({
        ...base,
        statusText: `연결통로는 호흡 가능한 구역입니다. 초당 ${airRecoveryPerSecond.toFixed(1)} 공기 회복`,
        purifyText: "",
      });
      return;
    }
    if (!isPollutedMap(effectiveMapId)) {
      updateAirHudUi({
        ...base,
        statusText: `현재 맵은 호흡 가능한 구역입니다. 초당 ${airRecoveryPerSecond.toFixed(1)} 공기 회복`,
        purifyText: "",
      });
      return;
    }
    const purify = getMapPurificationValue(effectiveMapId);
    updateAirHudUi({
      ...base,
      statusText: purify >= 100
        ? `정화 완료: 초당 ${airRecoveryPerSecond.toFixed(1)} 공기 회복`
        : `오염 구역: 초당 ${getCurrentAirDrainPerSecond().toFixed(2)} 공기 소모`,
      purifyText: `${getMapPollutionConfig(effectiveMapId)?.displayName ?? effectiveMapId} 정화율 ${purify}%`,
    });
  }

  function buildPollutionFieldForMap(mapId, centerX, centerZ, halfSize) {
    const pollutionField = createPollutionFieldModel({
      centerX,
      centerZ,
      halfSize,
      particleCount: pollutionVisualConfig.particleCount,
      random: randomRange,
    });
    scene.add(pollutionField.field);
    mapPollutionFields[mapId] = pollutionField;
  }

  function buildCavePollutionField() {
    buildPollutionFieldForMap("폐광", pollutionVisualConfig.campMapX, pollutionVisualConfig.campMapZ, pollutionVisualConfig.groundSize * 0.5 - 6);
    buildPollutionFieldForMap("개척지", pollutionVisualConfig.frontierMapX, pollutionVisualConfig.frontierMapZ, pollutionVisualConfig.frontierGroundSize * 0.5 - 4);
  }

  function updateCavePollutionVisuals(dt) {
    const localPollutionStrength = getMapPollutionVisualStrengthFromModule(getEffectiveAirMapId(), mapPurificationProgress, mapPollutionConfig);
    const time = now() * 0.001;
    for (const [mapId, pollutionField] of Object.entries(mapPollutionFields)) {
      if (!pollutionField?.field || !pollutionField.material || !pollutionField.base || !pollutionField.phase) continue;
      const targetStrength = getMapPollutionVisualStrengthFromModule(mapId, mapPurificationProgress, mapPollutionConfig);
      pollutionField.strength = three.MathUtils.lerp(pollutionField.strength, targetStrength, Math.min(1, dt * 2.4));
      pollutionField.field.visible = pollutionField.strength > 0.02;
      pollutionField.material.opacity = pollutionField.strength * 0.82;
      if (pollutionField.field.visible) {
        const positions = pollutionField.field.geometry.attributes.position.array;
        updateFieldPositions({
          positions,
          base: pollutionField.base,
          phase: pollutionField.phase,
          time,
          strength: pollutionField.strength,
          particleSway: pollutionVisualConfig.particleSway,
        });
        pollutionField.field.geometry.attributes.position.needsUpdate = true;
      }
    }
    const airState = getPlayerAirState();
    const { overlayOpacity, blurPx } = getAirOverlayVisualState({
      localPollutionStrength,
      playerAirCurrent: airState.current,
      playerAirMax: airState.max,
      overlayMaxOpacity: pollutionVisualConfig.overlayMaxOpacity,
      lowAirEdgeBlurMaxPx: pollutionVisualConfig.lowAirEdgeBlurMaxPx,
    });
    pollutionOverlay.style.opacity = overlayOpacity.toFixed(3);
    pollutionOverlay.style.backdropFilter = `blur(${blurPx.toFixed(2)}px)`;
    pollutionOverlay.style.webkitBackdropFilter = `blur(${blurPx.toFixed(2)}px)`;
  }

  function useFreshAirCanister() {
    const result = airRuntime.useAirCanister();
    if (!result.ok) {
      const messages = {
        "missing-canister": ["신선한 공기 캔이 없습니다.", 1000],
        "air-full": ["공기 게이지가 이미 가득 찼습니다.", 900],
      };
      const [message, duration] = messages[result.reason] ?? ["신선한 공기 캔을 사용할 수 없습니다.", 1000];
      notify(message, duration);
      return false;
    }
    airDepletedNoticeUntil = 0;
    updateInventoryUi();
    updateAirHud();
    schedulePlayerSaveSync(true);
    notify("신선한 공기를 보충했습니다.", 1000);
    return true;
  }

  function useQuickUseItem(key, getQuickUseItemId) {
    return getQuickUseItemId(key) === "freshAirCanister" ? useFreshAirCanister() : false;
  }

  function getSelectedRefineryRecipe() {
    return getSelectedRefineryRecipeFromModule(refinerySelectedRecipeId);
  }

  function getRefineryHintText() {
    return workstationUiController.isRefineryOpen() ? "재련대 이용 중" : "E : 작업대 사용";
  }

  function tryUseRefineryRecipe(recipe = getSelectedRefineryRecipe()) {
    const result = workstationRuntime.craftRefineryRecipe(recipe);
    if (!result.ok) {
      if (result.kind === "plan" && result.plan.reason) notify(result.plan.reason, result.plan.duration);
      else if (result.kind === "consume") notify("재련 재료를 소모하지 못했습니다.", 1000);
      else if (result.kind === "inventory-full") notify("인벤토리가 가득 차 재련할 수 없습니다.", 1100);
      return true;
    }
    refinerySuccessMessage = result.success.message;
    refinerySuccessUntil = result.success.until;
    updateInventoryUi();
    schedulePlayerSaveSync(true);
    notify(refinerySuccessMessage, 1000);
    if (workstationUiController.isRefineryOpen()) {
      renderRefineryWindow();
      setTimeout(() => {
        if (workstationUiController.isRefineryOpen()) renderRefineryWindow();
      }, 1020);
    }
    return true;
  }

  function getAirPurifierHintText(mapId = "폐광") {
    return getAirPurifierHintTextFromModule({
      config: getMapPollutionConfig(mapId),
      purification: getMapPurificationValue(mapId),
      currentMapId: getCurrentMapId(),
      mapId,
      powderCount: getItemCount("purifyPowder"),
    });
  }

  function tryUseAirPurifier(mapId = "폐광") {
    const result = airRuntime.usePurifier(mapId);
    if (!result.ok && result.reason === "missing-config") return false;
    const cfg = result.config;
    if (!result.ok && result.reason === "already-purified") {
      notify(`${cfg.displayName} 공기 정화탑 가동이 이미 완료되었습니다.`, 1100);
      return true;
    }
    if (!result.ok && result.reason === "missing-powder") {
      notify(`정화 가루 ${cfg.purifierPowderCost}개가 필요합니다.`, 1100);
      return true;
    }
    updateInventoryUi();
    updateAirHud();
    schedulePlayerSaveSync(true);
    notify(result.purification >= 100
      ? `${cfg.displayName} 공기 정화탑 가동 완료! 이제 공기를 소모하지 않습니다.`
      : `${cfg.displayName} 정화율 ${result.purification}%`, result.purification >= 100 ? 1400 : 1000);
    return true;
  }

  function setForgeOpen(open) {
    if (open) {
      closeFrontierBuild?.();
      if (workstationUiController.isRefineryOpen()) setRefineryOpen(false);
    }
    const forgeOpen = workstationUiController.setForgeOpen(open).forgeOpen;
    workstationWindowsUi.setForgeOpen(forgeOpen);
    if (forgeOpen) renderForgeWindow();
  }

  function setRefineryOpen(open) {
    if (open) {
      closeFrontierBuild?.();
      if (workstationUiController.isForgeOpen()) setForgeOpen(false);
    }
    const refineryOpen = workstationUiController.setRefineryOpen(open).refineryOpen;
    workstationWindowsUi.setRefineryOpen(refineryOpen);
    if (!refineryOpen) {
      refinerySuccessUntil = 0;
      refinerySuccessMessage = "";
      return;
    }
    setInventoryOpen(false);
    setQuestOpen(false);
    renderRefineryWindow();
  }

  function renderRefineryWindow() {
    refineryRenderer.render();
  }

  function tryCraftSelectedRefineryRecipe() {
    const recipe = getSelectedRefineryRecipe();
    if (recipe) tryUseRefineryRecipe(recipe);
  }

  function renderForgeWindow() {
    forgeRenderer.render();
  }

  function setForgeButtonPressed(pressed) {
    forgeRenderer.setButtonPressed(pressed);
  }

  function tryUpgradeEquippedItem() {
    const upgradeState = getForgeUpgradeState();
    const result = workstationRuntime.beginForgeUpgrade(upgradeState, 1050);
    if (!result.ok) {
      if (result.plan.reason) showUi(result.plan.reason);
      return;
    }
    forgePendingUpgrade = result.pending;
    forgeLastResult = workstationRuntime.forgeLastResult;
    renderForgeWindow();
    notify(`${upgradeState.name} 강화 시도 중...`, 900);
  }

  function updateForgeUpgradeState() {
    if (forgePendingUpgrade && now() >= forgePendingUpgrade.resolveAt) {
      const completed = workstationRuntime.finishForgeUpgrade();
      if (completed) {
        forgePendingUpgrade = workstationRuntime.pendingForgeUpgrade;
        if (completed.resultPlan.success) {
          applyForgeUpgrade(completed.pending);
          onForgeUpgradeSucceeded?.();
        }
        forgeLastResult = completed.result;
        updateInventoryUi();
        if (workstationUiController.isForgeOpen()) renderForgeWindow();
        notify(forgeLastResult.text, 1100);
      }
    }
    if (forgeLastResult && forgeLastResult.until <= now()) forgeLastResult = null;
  }

  function enterMansionOneRoom(roomKey) {
    const player = getPlayer();
    const entryPlan = getMansionRoomEntryPlan(roomKey, { x: 0, z: 0 }, player.position.y);
    destroyMansionRoomInstance(entryPlan.roomToDestroy);
    const instance = createMansionRoomInstance(entryPlan.activeRoomKey);
    if (!instance?.root) return false;
    const targetPlan = getMansionRoomEntryPlan(roomKey, instance.root.position, player.position.y);
    setMansionActiveRoomKey(targetPlan.activeRoomKey);
    player.position.set(targetPlan.position.x, targetPlan.position.y, targetPlan.position.z);
    player.rotation.y = targetPlan.rotationY;
    latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
    snapCameraToPlayer();
    notify(`Mansion ONE ${targetPlan.activeRoomKey}호 입장`, 1000);
    return true;
  }

  function setMansionSleepOpen(open) {
    const sleepState = workstationUiController.setSleepOpen(open);
    if (mansionSleepOverlay && mansionSleepDialog) {
      mansionSleepOverlay.style.display = sleepState.sleepOpen ? "block" : "none";
      mansionSleepDialog.style.display = sleepState.sleepOpen ? "block" : "none";
    }
  }

  function exitMansionOneRoom() {
    const player = getPlayer();
    const exitPlan = getMansionRoomExitPlan(getMansionActiveRoomKey(), getMansionExteriorReturn(), player.position.y);
    setMansionSleepOpen(false);
    setPersonalStorageOpen(false);
    player.position.set(exitPlan.position.x, exitPlan.position.y, exitPlan.position.z);
    player.rotation.y = exitPlan.rotationY;
    latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
    snapCameraToPlayer();
    destroyMansionRoomInstance(exitPlan.roomToDestroy);
    notify("Mansion ONE 외부로 나왔습니다.", 1000);
    return true;
  }

  function openMansionSleepDialog() {
    const bed = getActiveInteractable()?.type === "mansionBed"
      ? getActiveInteractable()
      : getMansionBedInteractable();
    if (!bed) return;
    const player = getPlayer();
    const sleepPlan = getMansionSleepPlan(bed.obj.position, player.position.y);
    mansionSleepWakePoint = sleepPlan.wakePoint;
    player.position.set(sleepPlan.sleepPosition.x, sleepPlan.sleepPosition.y, sleepPlan.sleepPosition.z);
    player.rotation.y = sleepPlan.rotationY;
    latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
    workstationUiController.openSleepDialog();
    snapCameraToPlayer();
    setMansionSleepOpen(true);
  }

  function closeMansionSleepDialog() {
    const player = getPlayer();
    setMansionSleepOpen(false);
    player.position.set(mansionSleepWakePoint.x, player.position.y, mansionSleepWakePoint.z);
    player.rotation.y = mansionSleepWakePoint.rotationY;
    latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
    snapCameraToPlayer();
  }

  function openPersonalStorage() {
    if (!hasMansionPersonalStorageAuthority()) {
      notify("101호 거주권 필요", 1000);
      return false;
    }
    setPersonalStorageOpen(true);
    return true;
  }

  async function confirmMansionSleepLogout() {
    setMansionSleepOpen(false);
    if (isServerBackedWalletSession()) {
      await handleWalletLogout();
      return;
    }
    clearWalletSession();
    setWalletLogoutStatus();
  }

  function updateAirSystem(dt) {
    if (!canPlayGame()) {
      updateAirHud();
      return;
    }
    const { depletedThisFrame } = airRuntime.updateFrame(dt, getEffectiveAirMapId());
    if (depletedThisFrame && now() > airDepletedNoticeUntil) {
      notify("공기가 바닥났습니다. R로 신선한 공기 캔을 사용하세요.", 1200);
      airDepletedNoticeUntil = now() + 2200;
    }
    updateAirHud();
  }

  return {
    airRuntime,
    getMapPollutionConfig,
    isPollutedMap,
    getMapPurificationValue,
    setMapPurificationValue,
    resetAllMapPurificationValues,
    setAirState,
    getCurrentAirDrainPerSecond,
    canRecoverAirInMap,
    updateAirHud,
    buildCavePollutionField,
    updateCavePollutionVisuals,
    useFreshAirCanister,
    useQuickUseItem,
    getDefaultRefineryRecipe: getDefaultRefineryRecipeFromModule,
    getRefineryRecipeEntries: getRefineryRecipeEntriesFromModule,
    getSelectedRefineryRecipe,
    getRefineryHintText,
    tryUseRefineryRecipe,
    getAirPurifierHintText,
    tryUseAirPurifier,
    setForgeOpen,
    setRefineryOpen,
    renderForgeWindow,
    setForgeButtonPressed,
    renderRefineryWindow,
    tryCraftSelectedRefineryRecipe,
    tryUpgradeEquippedItem,
    updateForgeUpgradeState,
    enterMansionOneRoom,
    exitMansionOneRoom,
    setMansionSleepOpen,
    openMansionSleepDialog,
    closeMansionSleepDialog,
    openPersonalStorage,
    confirmMansionSleepLogout,
    updateAirSystem,
  };
}
