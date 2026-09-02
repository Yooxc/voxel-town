import test from "node:test";
import assert from "node:assert/strict";
import { createDevCreditsMigrationKey, createGameSessionCoordinator } from "../src/auth/gameSessionCoordinator.js";

test("creates migration keys from only valid development profile ids", () => {
  const sanitize = (profileId) => profileId === "dev_user_2" ? profileId : "dev_user_1";
  assert.equal(
    createDevCreditsMigrationKey("voxel-town.dev-credits-migrated.v1.", sanitize, "dev_user_2"),
    "voxel-town.dev-credits-migrated.v1.dev_user_2"
  );
  assert.equal(
    createDevCreditsMigrationKey("voxel-town.dev-credits-migrated.v1.", sanitize, "unknown"),
    "voxel-town.dev-credits-migrated.v1.dev_user_1"
  );
});

test("exposes player-save transport methods from the session coordinator", () => {
  const calls = [];
  const coordinator = createGameSessionCoordinator({
    getProvider: () => null,
    getActiveProfileId: () => "dev_user_1",
    devCreditsMigrationPrefix: "migration.",
    devInventorySeedPrefix: "inventory-seed.",
    sanitizeProfileId: (value) => value,
    sessionController: {
      getDevProfileStartPosition: () => ({ x: 0, z: 0 }),
      createDevProfileOrchestrator: undefined,
    },
    setPlayerStartPosition() {},
    playerSave: {
      getTransport: () => ({ apiFetchJson: "fetch", getAuthHeaders: "headers" }),
      runtime: {}, storage: {}, authApiBaseUrl: "", intervalMs: 1, getSaveKey: () => "save",
      getFailedLoadKey: () => "failed", getAuthToken: () => "", isDevSession: () => false,
      isServerBackedSession: () => false, serializeSave: () => ({}), applySave() {},
      getActiveProfileId: () => "dev_user_1", setPlayerCredits() {}, setLoginStatus() {}, setStatus() {}, hideStatus() {},
      saveSharedWorldState() {},
    },
    workflow: {
      auth: {}, profile: {}, storage: {}, walletSessionKey: "", sessionRuntime: {}, sessionController: {},
      serializeSession() {}, parseStoredSession() {}, isGuestSessionState: () => false, isDevSessionState: () => false,
      isWalletAuthenticatedState: () => false, isServerBackedWalletSessionState: () => false,
      getActiveDevProfileId: () => "dev_user_1", setActiveDevProfileId() {}, getDevProfileDisplayName: () => "",
      getAddressLabel: () => "", getChainLabel: () => "", getUiState: () => ({}), renderUi() {}, onSessionCleared() {},
      applyFreshPlayerStartState() {}, getApiFetchJson: () => null, getAuthHeaders: () => ({}), getLoginMessage: () => "",
      getNicknameInput: () => "", setNicknameStatus() {}, setLoginStatus() {}, setLoginBusy() {}, setNicknameBusy() {}, notify() {},
    },
    devProfile: {
      profileIds: [], activeProfileKey: "", sharedWorldKey: "", storage: {}, sessionController: {},
      getActiveProfileId: () => "dev_user_1", setActiveProfileId() {}, getDisplayName: () => "", getPlayerCredits: () => 0,
      setPlayerCredits() {}, setWalletLoginStatus() {}, loadSharedWorldState() {}, applySharedWorldState() {},
      applyFreshPlayerStartState() {}, applyDevPreset() {}, saveSharedWorldState() {}, applyDevProfileRoleOverrides() {},
      restoreMissingLandDeeds() {}, resetWastelandDraftUiState() {}, refreshWastelandDraftUiState() {},
      createDefaultSharedWorldSave() {}, resetFrontierWastelandRuntimeState() {}, resetTerrainLabState() {},
      resetDevProfilesForWorldReset() {}, resetActiveProfilePosition() {}, notify() {},
    },
  });

  coordinator.playerSaveCoordinator.hydrateFromServer = (transport) => calls.push(["hydrate", transport]);
  coordinator.playerSaveCoordinator.pushToServer = (transport) => calls.push(["push", transport]);
  coordinator.playerSaveCoordinator.scheduleSync = (force, transport) => calls.push(["schedule", force, transport]);
  coordinator.hydratePlayerSaveFromServer();
  coordinator.pushPlayerSaveToServer();
  coordinator.schedulePlayerSaveSync(true);

  assert.deepEqual(calls, [
    ["hydrate", { apiFetchJson: "fetch", getAuthHeaders: "headers" }],
    ["push", { apiFetchJson: "fetch", getAuthHeaders: "headers" }],
    ["schedule", true, { apiFetchJson: "fetch", getAuthHeaders: "headers" }],
  ]);
});
