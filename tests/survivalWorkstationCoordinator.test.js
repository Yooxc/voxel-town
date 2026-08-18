import test from "node:test";
import assert from "node:assert/strict";
import { createSurvivalWorkstationCoordinator } from "../src/systems/survivalWorkstationCoordinator.js";
import { createForgeUpgradeAttemptPlan, createForgeUpgradeResultPlan } from "../src/systems/forge.js";

function createCoordinatorFixture() {
  const items = { freshAirCanister: 1, purifyPowder: 1, stoneDust: 0 };
  const air = { current: 50, max: 100 };
  const purify = { test: 0 };
  const messages = [];
  const workstationUiController = {
    isForgeOpen: () => false,
    isRefineryOpen: () => false,
    setForgeOpen: () => ({ forgeOpen: false }),
    setRefineryOpen: () => ({ refineryOpen: false }),
    setSleepOpen: () => ({ sleepOpen: false }),
    openSleepDialog: () => ({ sleepOpen: true }),
  };
  const coordinator = createSurvivalWorkstationCoordinator({
    airGaugeMax: 100,
    airRecoveryPerSecond: 1,
    mapPurificationProgress: purify,
    mapPollutionConfig: { test: { displayName: "시험 구역", drainPerSecondAtZeroPurify: 2, purifierPowderCost: 1, purifierGain: 12 } },
    getPlayerAirState: () => air,
    setPlayerAirCurrent: (value) => { air.current = value; },
    setPlayerAirMax: (value) => { air.max = value; },
    getCurrentMapId: () => "test",
    getEffectiveAirMapId: () => "test",
    canPlayGame: () => true,
    hasItem: (itemId) => (items[itemId] ?? 0) > 0,
    consumeItem: (itemId, count) => {
      if ((items[itemId] ?? 0) < count) return false;
      items[itemId] -= count;
      return true;
    },
    getItemCount: (itemId) => items[itemId] ?? 0,
    addItem: () => true,
    getItemName: (itemId) => itemId,
    itemDefs: {},
    isBuildPartItemId: () => false,
    createForgeUpgradeAttemptPlan,
    createForgeUpgradeResultPlan,
    workstationUiController,
    workstationWindowsUi: { elements: { refinery: {}, forge: {} }, setForgeOpen: () => {}, setRefineryOpen: () => {} },
    createItemVisual: () => null,
    createForgeUpgradeVisual: () => null,
    getForgeUpgradeState: () => null,
    getForgeTargetItemId: () => null,
    getForgeDistance: () => Infinity,
    getRefineryDistance: () => Infinity,
    getDefaultForgeStats: {},
    setInventoryOpen: () => {},
    setQuestOpen: () => {},
    updateInventoryUi: () => {},
    schedulePlayerSaveSync: () => {},
    showUi: (message) => messages.push(message),
    setLastMessageUntil: () => {},
    airHudElements: {},
    updateAirHudUi: () => {},
    pollutionOverlay: { style: {} },
    scene: { add: () => {} },
    three: { MathUtils: { lerp: (a, b) => b } },
    randomRange: () => 0,
    pollutionVisualConfig: { particleCount: 0, particleSway: 0, overlayMaxOpacity: 0, lowAirEdgeBlurMaxPx: 0, campMapX: 0, campMapZ: 0, frontierMapX: 0, frontierMapZ: 0, groundSize: 1, frontierGroundSize: 1 },
    getPlayer: () => ({ position: { y: 0, set: () => {} }, rotation: {} }),
    getActiveInteractable: () => null,
    getMansionBedInteractable: () => null,
    getMansionActiveRoomKey: () => "101",
    setMansionActiveRoomKey: () => {},
    getMansionExteriorReturn: () => ({ x: 0, z: 0, rotationY: 0 }),
    destroyMansionRoomInstance: () => {},
    createMansionRoomInstance: () => null,
    getFacingDirectionFromYaw: () => ({}),
    latestMoveDir: { copy: () => {} },
    snapCameraToPlayer: () => {},
    mansionSleepOverlay: null,
    mansionSleepDialog: null,
    setPersonalStorageOpen: () => {},
    hasMansionPersonalStorageAuthority: () => true,
    isServerBackedWalletSession: () => false,
    handleWalletLogout: async () => {},
    clearWalletSession: () => {},
    setWalletLogoutStatus: () => {},
  });
  return { coordinator, air, purify, items, messages };
}

test("coordinates air canisters, purification, and persisted air state", () => {
  const { coordinator, air, purify, items, messages } = createCoordinatorFixture();

  assert.equal(coordinator.useFreshAirCanister(), true);
  assert.equal(air.current, 84);
  assert.equal(items.freshAirCanister, 0);
  assert.equal(coordinator.tryUseAirPurifier("test"), true);
  assert.equal(purify.test, 12);
  assert.equal(items.purifyPowder, 0);

  coordinator.setAirState({ max: 80, current: 99 });
  assert.deepEqual(air, { current: 80, max: 80 });
  assert.match(messages.at(-1), /정화율 12%/);
});
