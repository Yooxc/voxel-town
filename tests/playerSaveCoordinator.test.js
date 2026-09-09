import test from "node:test";
import assert from "node:assert/strict";
import { createPlayerSaveRuntime } from "../src/save/playerSaveRuntime.js";
import { createPlayerSaveCoordinator } from "../src/save/playerSaveCoordinator.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("local developer saves exclude shared-world-only fields", () => {
  const storage = createStorage();
  const coordinator = createPlayerSaveCoordinator({
    runtime: createPlayerSaveRuntime(),
    storage,
    authApiBaseUrl: "http://test",
    intervalMs: 1,
    getSaveKey: () => "profile-a",
    getFailedLoadKey: () => "failed-a",
    getAuthToken: () => "",
    isDevSession: () => true,
    isServerBackedSession: () => false,
    serializeSave: () => ({
      inventory: { slots: [], abandonedMineUnlocked: true },
      airSystem: { current: 80, mapPurification: { "폐광": 50 } },
      frontierBuild: { parcels: [] },
      displayBoard: { tokenId: "1" },
    }),
    applySave: () => {},
    getActiveProfileId: () => "dev_user_1",
    setPlayerCredits: () => {},
    setLoginStatus: () => {},
    setStatus: () => {},
    hideStatus: () => {},
    saveSharedWorldState: () => {},
  });

  assert.equal(coordinator.saveActiveLocalProfileState(), true);
  assert.deepEqual(JSON.parse(storage.getItem("profile-a")), {
    inventory: { slots: [] },
    airSystem: { current: 80 },
  });
});

test("local profile hydration preserves shared world in developer sessions", () => {
  const storage = createStorage();
  storage.setItem("profile-a", JSON.stringify({ economy: { credits: 25 } }));
  let received = null;
  const coordinator = createPlayerSaveCoordinator({
    runtime: createPlayerSaveRuntime(),
    storage,
    authApiBaseUrl: "http://test",
    intervalMs: 1,
    getSaveKey: () => "profile-a",
    getFailedLoadKey: () => "failed-a",
    getAuthToken: () => "",
    isDevSession: () => true,
    isServerBackedSession: () => false,
    serializeSave: () => ({}),
    applySave: (save, options) => { received = { save, options }; },
    getActiveProfileId: () => "dev_user_1",
    setPlayerCredits: () => {},
    setLoginStatus: () => {},
    setStatus: () => {},
    hideStatus: () => {},
    saveSharedWorldState: () => {},
  });

  assert.equal(coordinator.loadActiveLocalProfileState(), "loaded");
  assert.deepEqual(received, { save: { economy: { credits: 25 } }, options: { preserveSharedWorld: true } });
});

test("rebuild guest scheduled sync saves locally without writing shared world", () => {
  const storage = createStorage();
  let sharedWorldSaves = 0;
  const coordinator = createPlayerSaveCoordinator({
    runtime: createPlayerSaveRuntime(),
    storage,
    authApiBaseUrl: "http://test",
    intervalMs: 1,
    getSaveKey: () => "guest-save",
    getFailedLoadKey: () => "guest-save.failed",
    getAuthToken: () => "",
    isDevSession: () => false,
    isLocalSession: () => true,
    isServerBackedSession: () => false,
    serializeSave: () => ({
      onboarding: { hasEnteredWorld: true },
      frontierBuild: { parcels: [{ id: "shared" }] },
      displayBoard: { tokenId: "shared" },
      airSystem: { current: 90, mapPurification: { "개척지": 70 } },
      inventory: { slots: [], abandonedMineUnlocked: true },
    }),
    applySave: () => {},
    getActiveProfileId: () => "guest",
    setPlayerCredits: () => {},
    setLoginStatus: () => {},
    setStatus: () => {},
    hideStatus: () => {},
    saveSharedWorldState: () => { sharedWorldSaves += 1; },
  });

  coordinator.scheduleSync(true, {});

  assert.deepEqual(JSON.parse(storage.getItem("guest-save")), {
    onboarding: { hasEnteredWorld: true },
    airSystem: { current: 90 },
    inventory: { slots: [] },
  });
  assert.equal(sharedWorldSaves, 0);
});

test("rebuild guest hydration preserves shared world state", () => {
  const storage = createStorage();
  storage.setItem("guest-save", JSON.stringify({ onboarding: { hasEnteredWorld: true } }));
  let received = null;
  const coordinator = createPlayerSaveCoordinator({
    runtime: createPlayerSaveRuntime(), storage, authApiBaseUrl: "http://test", intervalMs: 1,
    getSaveKey: () => "guest-save", getFailedLoadKey: () => "guest-save.failed",
    getAuthToken: () => "", isDevSession: () => false, isLocalSession: () => true,
    isServerBackedSession: () => false, serializeSave: () => ({}),
    applySave: (save, options) => { received = { save, options }; },
    getActiveProfileId: () => "guest", setPlayerCredits: () => {}, setLoginStatus: () => {},
    setStatus: () => {}, hideStatus: () => {}, saveSharedWorldState: () => {},
  });

  assert.equal(coordinator.loadActiveLocalProfileState(), "loaded");
  assert.deepEqual(received, {
    save: { onboarding: { hasEnteredWorld: true } },
    options: { preserveSharedWorld: true },
  });
});
