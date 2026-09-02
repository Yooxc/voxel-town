import test from "node:test";
import assert from "node:assert/strict";
import { createDevTestEnvironmentCoordinator } from "../src/save/devTestEnvironmentCoordinator.js";

function createDefaultPlayerSave() {
  return {
    mapId: "광산",
    position: { x: 0, y: 0, z: 0 },
    rotationY: 0,
    inventory: {
      slots: Array(12).fill(null),
      pickaxeLevel: 1,
      mineKeyIssued: false,
      abandonedMineUnlocked: false,
      quickUse: { "1": null, "2": null },
      equipped: { head: null, body: null, shoes: null, tool: null },
    },
    personalStorage: { slots: Array(4).fill(null) },
    economy: { credits: 0 },
    airSystem: { current: 100, max: 100 },
  };
}

function createHarness() {
  const storageData = new Map();
  let activeRuntime = {
    ...createDefaultPlayerSave(),
    mapId: "개척지",
    position: { x: 91, y: 4, z: 72 },
    inventory: {
      ...createDefaultPlayerSave().inventory,
      slots: [
        { itemId: "stoneDust", count: 12 },
        { itemId: "earnedOre", count: 8 },
        ...Array(10).fill(null),
      ],
    },
    personalStorage: {
      slots: [{ itemId: "storedOre", count: 9 }, null, null, null],
    },
    economy: { credits: 37 },
  };
  const inactiveSave = {
    ...createDefaultPlayerSave(),
    mapId: "개척지",
    position: { x: 22, y: 1, z: 33 },
    inventory: {
      ...createDefaultPlayerSave().inventory,
      slots: [{ itemId: "earnedWood", count: 5 }, ...Array(11).fill(null)],
    },
    personalStorage: {
      slots: [{ itemId: "storedWood", count: 3 }, null, null, null],
    },
    economy: { credits: 12 },
  };
  storageData.set("profile:dev_user_2", JSON.stringify(inactiveSave));
  let saveActiveCalls = 0;
  let applyOptions = null;

  const coordinator = createDevTestEnvironmentCoordinator({
    profileIds: ["dev_user_1", "dev_user_2"],
    storage: {
      getItem: (key) => storageData.get(key) ?? null,
      setItem: (key, value) => storageData.set(key, value),
    },
    sanitizeProfileId: (profileId) => (
      profileId === "dev_user_2" ? "dev_user_2" : "dev_user_1"
    ),
    createDefaultPlayerSave,
    serializeActiveProfileState: () => structuredClone(activeRuntime),
    applyActiveProfileState: (save, options) => {
      activeRuntime = structuredClone(save);
      applyOptions = options;
    },
    saveActiveProfileState: () => { saveActiveCalls += 1; },
    getProfileSaveKey: (profileId) => `profile:${profileId}`,
    getCreditsMigrationKey: (profileId) => `credits:${profileId}`,
    getInventorySeedKey: (profileId) => `seed:${profileId}`,
    getProfileStartPosition: (profileId) => ({
      x: profileId === "dev_user_2" ? 2 : -2,
      z: 0,
    }),
    startY: 0,
    airGaugeMax: 100,
    landDeedItemId: "wastelandLandDeed",
    inventoryStackLimit: 200,
    wastelandBuildPartItemIds: ["woodFloor"],
    devBulkGrantItemIds: ["stoneDust"],
    frontierParcelLabels: ["P1"],
    getFrontierParcelAuthorityItemId: (label) => `permit:${label}`,
    devMockNftItems: [{ kind: "nft", tokenId: "1" }],
    createInventorySlotEntry: (itemId, count) => ({ itemId, count }),
    createEquippedItemRef: (itemId) => ({ itemId }),
  });

  return {
    coordinator,
    storageData,
    getActiveRuntime: () => structuredClone(activeRuntime),
    getSaveActiveCalls: () => saveActiveCalls,
    getApplyOptions: () => applyOptions,
  };
}

test("developer test reset replaces both profiles with one canonical baseline", () => {
  const harness = createHarness();

  const result = harness.coordinator.resetProfiles("dev_user_1");
  const active = harness.getActiveRuntime();
  const inactive = JSON.parse(harness.storageData.get("profile:dev_user_2"));

  assert.deepEqual(result, {
    activeProfileId: "dev_user_1",
    resetProfileIds: ["dev_user_1", "dev_user_2"],
  });
  assert.equal(active.mapId, "광산");
  assert.deepEqual(active.position, { x: -2, y: 0, z: 0 });
  assert.equal(active.economy.credits, 500);
  assert.deepEqual(active.personalStorage.slots, [null, null, null, null]);
  assert.equal(active.inventory.slots.some((entry) => entry?.itemId === "earnedOre"), false);
  assert.equal(active.inventory.slots.find((entry) => entry?.itemId === "stoneDust")?.count, 200);
  assert.equal(active.inventory.slots.find((entry) => entry?.itemId === "abandonedMineKey")?.count, 1);
  assert.equal(inactive.mapId, "광산");
  assert.deepEqual(inactive.position, { x: 2, y: 0, z: 0 });
  assert.equal(inactive.economy.credits, 500);
  assert.deepEqual(inactive.personalStorage.slots, [null, null, null, null]);
  assert.equal(inactive.inventory.slots.some((entry) => entry?.itemId === "earnedWood"), false);
  assert.equal(inactive.inventory.slots.find((entry) => entry?.itemId === "abandonedMineKey")?.count, 1);
  assert.deepEqual(harness.getApplyOptions(), { preserveSharedWorld: true });
  assert.equal(harness.getSaveActiveCalls(), 1);
  assert.equal(harness.storageData.get("seed:dev_user_1"), "1");
  assert.equal(harness.storageData.get("seed:dev_user_2"), "1");
});

test("developer two receives its own role permits without developer one permits", () => {
  const harness = createHarness();
  const baseline = harness.coordinator.createProfileBaselineState("dev_user_2");
  const itemIds = baseline.inventory.slots.filter(Boolean).map((entry) => entry.itemId);

  assert.ok(itemIds.includes("mansionOneRoom102Permit"));
  assert.equal(itemIds.includes("mansionOneRoom101Permit"), false);
  assert.equal(itemIds.includes("permit:P1"), false);
});
