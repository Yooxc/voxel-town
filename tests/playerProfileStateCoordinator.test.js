import assert from "node:assert/strict";
import test from "node:test";
import {
  createPlayerProfileStateCoordinator,
  resetSerializedDevProfileTestState,
  resetSerializedDevProfileWorldState,
} from "../src/save/playerProfileStateCoordinator.js";

function createContext() {
  const inventory = {
    slots: [{ itemId: "pickaxe", count: 1 }, null],
    pickaxeLevel: 3,
    mineKeyIssued: true,
    abandonedMineUnlocked: true,
    quickUse: { "1": { itemId: "freshAirCanister" }, "2": null },
    equipped: { head: { itemId: "safetyHelmet" }, body: null, shoes: null, tool: { itemId: "pickaxe" } },
  };
  const personalStorage = { slots: [{ itemId: "woodPlank", count: 2 }, null] };
  const tutorialQuest = { steps: ["a", "b"], currentStep: 2, minedRockCount: 4, upgradeCount: 2, completed: true, archivedSteps: [0] };
  const player = {
    position: { x: 12, y: 1.5, z: 24, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
    rotation: { y: 0.7 },
  };
  let credits = 80;
  let currentMapId = "폐광";
  let airState = { current: 50, max: 100 };
  let frontierBuildState = { p6: { stage: 50 } };
  let selectedBoardItem = { tokenId: "3" };
  let activeRoomKey = "102";
  const gate = { lockBlocker: { removeFromParent() {} }, lockColliderIndex: 2 };
  const calls = [];

  return {
    inventory,
    personalStorage,
    tutorialQuest,
    player,
    calls,
    ctx: {
      playerSaveVersion: 1,
      startPosition: { x: 0, z: 0 },
      airGaugeMax: 100,
      inventoryStackLimit: 99,
      quickUseAllowedKeys: ["1", "2"],
      frontierParcelLabels: ["P6"],
      devPresetEnabled: true,
      devPreset: { completeTutorial: false, giveStarterGear: false, unlockAbandonedMine: false },
      devMockNftItems: [],
      residenceMapId: "저택",
      validMapIds: ["광산", "폐광", "개척지", "저택"],
      mapPollutionMapIds: ["폐광", "개척지"],
      inventory,
      personalStorage,
      tutorialQuest,
      getPlayer: () => player,
      getActiveProfileId: () => "dev_user_1",
      getDevProfileBaselineState: () => ({
        inventory: {
          slots: [{ itemId: "pickaxe", count: 1 }, null],
          pickaxeLevel: 5,
          mineKeyIssued: true,
          abandonedMineUnlocked: false,
          quickUse: { "1": null, "2": null },
          equipped: { head: null, body: null, shoes: null, tool: { itemId: "pickaxe" } },
        },
        personalStorage: { slots: [null, null] },
        credits: 500,
      }),
      getWastelandLandDeedEntries: () => [],
      restorePreservedWastelandLandDeeds: () => {},
      getWastelandBuildPartItemIds: () => [],
      getDevBulkGrantItemIds: () => [],
      getFrontierParcelAuthorityItemId: () => null,
      addItem: () => true,
      addInventoryEntry: () => true,
      removeAllItemsById: () => {},
      ensureExactOwnedItemCount: () => {},
      equipFirstOwnedItem: () => {},
      clampPickaxeLevel: (value) => Math.max(0, Math.floor(Number(value) || 0)),
      setPlayerCredits: (value) => { credits = Math.max(0, Math.floor(Number(value) || 0)); },
      getPlayerCredits: () => credits,
      clampPlayerCredits: (value) => Math.max(0, Math.floor(Number(value) || 0)),
      setAirState: (next) => { airState = { ...airState, ...next }; },
      getAirState: () => airState,
      resetMapPurificationValues: () => calls.push("reset-purification"),
      getMapPurificationValue: () => 0,
      setMapPurificationValue: () => {},
      normalizeInventorySlotEntry: (entry) => entry,
      normalizeQuickUseBinding: (entry) => entry,
      normalizeEquippedItemRef: (entry) => entry,
      normalizeFrontierBuildState: (state) => state ?? { p6: { stage: 0 } },
      normalizeNftBoardSelection: (entry) => entry,
      pruneQuickUseBindings: () => calls.push("prune"),
      getFrontierBuildStateData: () => frontierBuildState,
      setFrontierBuildState: (state) => { frontierBuildState = state; },
      createDefaultFrontierBuildState: () => ({ p6: { stage: 0 } }),
      getSelectedNftBoardItem: () => selectedBoardItem,
      setSelectedNftBoardItem: (item) => { selectedBoardItem = item; },
      getAbandonedMineGate: () => gate,
      getTrackedColliderIndex: () => 2,
      removeColliderAt: () => calls.push("remove-gate-collider"),
      restoreLockedMapGate: () => calls.push("restore-gate"),
      getCurrentMapId: () => currentMapId,
      setCurrentMapId: (mapId) => { currentMapId = mapId; },
      getMansionActiveRoomKey: () => activeRoomKey,
      setMansionActiveRoomKey: (key) => { activeRoomKey = key; },
      createMansionRoomInstance: () => calls.push("create-room"),
      destroyMansionRoomInstance: () => calls.push("destroy-room"),
      updateSceneFogForCurrentMap: () => calls.push("fog"),
      updateLatestMoveDirection: () => calls.push("direction"),
      snapCameraToPlayer: () => calls.push("snap"),
      getCampSpawn: () => ({ x: 3, z: 4, rotationY: Math.PI }),
      setPersonalStorageOpen: () => calls.push("close-storage"),
      updateInventoryUi: () => calls.push("inventory-ui"),
      rebuildAllFrontierConstructionVisuals: () => calls.push("rebuild-frontier"),
      scheduleNftExhibitBoardRefresh: () => calls.push("refresh-board"),
      refreshQuestProgress: () => calls.push("refresh-quest"),
      renderQuestIfOpen: () => calls.push("render-quest"),
      setLastSnapshot: () => calls.push("snapshot"),
    },
  };
}

test("fresh player state clears inventory, progress, and restores the mine gate", () => {
  const fixture = createContext();
  const coordinator = createPlayerProfileStateCoordinator(fixture.ctx);

  coordinator.applyFreshPlayerStartState();

  assert.deepEqual(fixture.inventory.slots, [null, null]);
  assert.deepEqual(fixture.personalStorage.slots, [null, null]);
  assert.equal(fixture.inventory.pickaxeLevel, 1);
  assert.equal(fixture.inventory.abandonedMineUnlocked, false);
  assert.equal(fixture.tutorialQuest.completed, false);
  assert.equal(fixture.player.position.x, 0);
  assert.equal(fixture.player.position.z, 0);
  assert.ok(fixture.calls.includes("restore-gate"));
  assert.ok(fixture.calls.includes("inventory-ui"));
});

test("player save serialization preserves runtime player and profile state", () => {
  const fixture = createContext();
  const coordinator = createPlayerProfileStateCoordinator(fixture.ctx);

  const save = coordinator.serializePlayerSave();

  assert.equal(save.mapId, "폐광");
  assert.equal(save.position.x, 12);
  assert.equal(save.economy.credits, 80);
  assert.equal(save.inventory.slots[0].itemId, "pickaxe");
  assert.equal(save.residence.activeRoomKey, "102");
  assert.deepEqual(save.displayBoard, { tokenId: "3" });
});

test("developer inventory recovery does not mutate shared mine gate state", () => {
  const fixture = createContext();
  fixture.inventory.abandonedMineUnlocked = false;
  const coordinator = createPlayerProfileStateCoordinator(fixture.ctx);

  coordinator.ensureDevTestInventory();

  assert.equal(fixture.inventory.abandonedMineUnlocked, false);
  assert.equal(fixture.calls.includes("remove-gate-collider"), false);
});

test("developer two receives the shared developer material set in its own inventory", () => {
  const fixture = createContext();
  const ensured = [];
  fixture.ctx.getActiveProfileId = () => "dev_user_2";
  fixture.ctx.getDevProfileBaselineState = () => ({
    inventory: {
      slots: [
        { itemId: "freshAirCanister", count: 200 },
        { itemId: "purifyPowder", count: 200 },
        { itemId: "woodPlank", count: 200 },
      ],
      pickaxeLevel: 1,
      mineKeyIssued: true,
    },
  });
  fixture.ctx.ensureExactOwnedItemCount = (itemId, count) => ensured.push([itemId, count]);
  const coordinator = createPlayerProfileStateCoordinator(fixture.ctx);

  coordinator.ensureDevTestInventory();

  assert.ok(ensured.some(([itemId]) => itemId === "freshAirCanister"));
  assert.ok(ensured.some(([itemId]) => itemId === "purifyPowder"));
  assert.ok(ensured.some(([itemId]) => itemId === "woodPlank"));
});

test("world reset keeps profile inventory while removing land deeds and resetting spawn state", () => {
  const resetSave = resetSerializedDevProfileWorldState({
    mapId: "개척지",
    position: { x: 50, y: 3, z: 70 },
    rotationY: 1.5,
    airSystem: { current: 12, max: 100, mapPurification: { "개척지": 80 } },
    inventory: {
      slots: [
        { itemId: "wastelandLandDeed", landId: "land-1" },
        { itemId: "shovel", count: 1 },
      ],
      abandonedMineUnlocked: true,
      quickUse: { "1": { itemId: "wastelandLandDeed" }, "2": { itemId: "shovel" } },
      equipped: { tool: { itemId: "shovel" }, head: null },
    },
    personalStorage: { slots: [{ itemId: "woodPlank", count: 4 }] },
    economy: { credits: 500 },
  }, {
    startPosition: { x: 1.2, y: 0, z: 0 },
    airGaugeMax: 100,
    landDeedItemId: "wastelandLandDeed",
  });

  assert.equal(resetSave.mapId, "광산");
  assert.deepEqual(resetSave.position, { x: 1.2, y: 0, z: 0 });
  assert.equal(resetSave.rotationY, 0);
  assert.deepEqual(resetSave.airSystem, { current: 100, max: 100 });
  assert.equal(resetSave.inventory.slots[0], null);
  assert.deepEqual(resetSave.inventory.slots[1], { itemId: "shovel", count: 1 });
  assert.equal(resetSave.inventory.quickUse["1"], null);
  assert.equal(resetSave.inventory.abandonedMineUnlocked, undefined);
  assert.deepEqual(resetSave.personalStorage.slots, [{ itemId: "woodPlank", count: 4 }]);
  assert.equal(resetSave.economy.credits, 500);
});

test("developer test reset replaces earned inventory, clears storage, and restores credits", () => {
  const baselineInventory = {
    slots: [
      { kind: "item", itemId: "pickaxe", count: 1, instanceId: "pickaxe-1" },
      { kind: "item", itemId: "abandonedMineKey", count: 1, instanceId: "key-1" },
      null,
    ],
    pickaxeLevel: 5,
    mineKeyIssued: true,
    abandonedMineUnlocked: false,
    quickUse: { "1": null, "2": null },
    equipped: { head: null, body: null, shoes: null, tool: { itemId: "pickaxe" } },
  };
  const baselinePersonalStorage = { slots: [null, null] };
  const resetSave = resetSerializedDevProfileTestState({
    mapId: "개척지",
    position: { x: 30, y: 2, z: 40 },
    inventory: {
      slots: [{ itemId: "stoneDust", count: 80 }, { itemId: "woodPlank", count: 40 }],
      mineKeyIssued: false,
    },
    personalStorage: { slots: [{ itemId: "masonryStone", count: 20 }, null] },
    economy: { credits: 37 },
    tutorial: { completed: true, currentStep: 6 },
  }, {
    startPosition: { x: -1.2, y: 0, z: 0 },
    airGaugeMax: 100,
    landDeedItemId: "wastelandLandDeed",
    baselineInventory,
    baselinePersonalStorage,
    credits: 500,
  });

  assert.deepEqual(resetSave.inventory, baselineInventory);
  assert.deepEqual(resetSave.personalStorage, baselinePersonalStorage);
  assert.equal(resetSave.economy.credits, 500);
  assert.equal(resetSave.mapId, "광산");
  assert.deepEqual(resetSave.position, { x: -1.2, y: 0, z: 0 });
  assert.deepEqual(resetSave.tutorial, { completed: true, currentStep: 6 });
});
