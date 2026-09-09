import test from "node:test";
import assert from "node:assert/strict";
import { createSessionRuntime } from "../src/auth/sessionRuntime.js";
import { createSessionWorkflowController } from "../src/auth/sessionWorkflowController.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("guest workflow persists a guest session and waits for a nickname before play", () => {
  const auth = {};
  const profile = { nickname: "" };
  const storage = createStorage();
  const sessionRuntime = createSessionRuntime({
    devProfileIds: ["dev_user_1"],
    fallbackProfileId: "dev_user_1",
    devProfileSavePrefix: "dev-save.",
    guestSaveKey: "guest-save",
  });
  const workflow = createSessionWorkflowController({
    auth,
    profile,
    storage,
    walletSessionKey: "wallet-session",
    sessionRuntime,
    sessionController: { createGuestSessionState: () => ({ authenticated: true, address: "guest-local", sessionType: "guest" }) },
    serializeSession: (state) => state.authenticated ? state : null,
    parseStoredSession: () => null,
    isGuestSessionState: (state) => state.sessionType === "guest",
    isDevSessionState: () => false,
    isWalletAuthenticatedState: (state) => Boolean(state.authenticated),
    isServerBackedWalletSessionState: () => false,
    getActiveDevProfileId: () => "dev_user_1",
    setActiveDevProfileId: () => {},
    getDevProfileDisplayName: () => "DEV-1",
    getAddressLabel: (address) => address,
    getChainLabel: () => "guest",
    getUiState: () => ({}),
    renderUi: () => {},
    onSessionCleared: () => {},
    applyFreshPlayerStartState: () => {},
    saveCoordinator: { setSyncPaused: () => {}, resetProtectionState: () => {}, clearStatusTimer: () => {} },
    getApiFetchJson: () => async () => ({ ok: true }),
    getAuthHeaders: () => ({}),
    getLoginMessage: () => "",
    getNicknameInput: () => "",
    setNicknameStatus: () => {},
    setLoginStatus: () => {},
    setLoginBusy: () => {},
    setNicknameBusy: () => {},
    notify: () => {},
  });

  workflow.startGuestSession();
  assert.equal(workflow.isGuestSession(), true);
  assert.equal(workflow.canPlayGame(), false);
  assert.equal(JSON.parse(storage.getItem("wallet-session")).address, "guest-local");
});

test("restored rebuild guest enters only after local save hydration", () => {
  const auth = {};
  const profile = { nickname: "" };
  const storage = createStorage();
  storage.setItem("wallet-session", JSON.stringify({
    authenticated: true,
    address: "guest-local",
    sessionType: "guest",
    nickname: "Visitor",
  }));
  const calls = [];
  let entered = false;
  const sessionRuntime = createSessionRuntime({
    devProfileIds: ["dev_user_1"], fallbackProfileId: "dev_user_1",
    devProfileSavePrefix: "dev-save.", guestSaveKey: "guest-save",
  });
  const workflow = createSessionWorkflowController({
    auth, profile, storage, walletSessionKey: "wallet-session", sessionRuntime,
    sessionController: {},
    serializeSession: (state) => state,
    parseStoredSession: JSON.parse,
    isGuestSessionState: (state) => state.sessionType === "guest",
    isDevSessionState: () => false,
    isWalletAuthenticatedState: (state) => Boolean(state.authenticated),
    isServerBackedWalletSessionState: () => false,
    getActiveDevProfileId: () => "dev_user_1", setActiveDevProfileId: () => {},
    getDevProfileDisplayName: () => "DEV-1", getAddressLabel: (value) => value,
    getChainLabel: () => "guest", getUiState: () => ({}), renderUi: () => {},
    onSessionCleared: () => {},
    applyFreshPlayerStartState: () => calls.push("fresh"),
    saveCoordinator: {
      loadActiveLocalProfileState: () => { calls.push("load"); return "loaded"; },
      saveActiveLocalProfileState: () => calls.push("save"),
    },
    getApiFetchJson: () => null, getAuthHeaders: () => ({}), getLoginMessage: () => "",
    getNicknameInput: () => "", setNicknameStatus: () => {}, setLoginStatus: () => {},
    setLoginBusy: () => {}, setNicknameBusy: () => {}, notify: () => {},
    onboardingEnabled: true,
    onPlayableWorldEntered: () => {
      calls.push("enter");
      const changed = !entered;
      entered = true;
      return { changed, firstVisit: changed };
    },
  });

  workflow.restoreWalletSession();

  assert.equal(profile.nickname, "Visitor");
  assert.deepEqual(calls, ["fresh", "load", "enter", "save"]);
});

test("failed rebuild guest hydration does not overwrite onboarding as a first visit", () => {
  const auth = {};
  const profile = { nickname: "" };
  const storage = createStorage();
  storage.setItem("wallet-session", JSON.stringify({
    authenticated: true, address: "guest-local", sessionType: "guest", nickname: "Visitor",
  }));
  let entered = false;
  let status = "";
  const sessionRuntime = createSessionRuntime({
    devProfileIds: ["dev_user_1"], fallbackProfileId: "dev_user_1",
    devProfileSavePrefix: "dev-save.", guestSaveKey: "guest-save",
  });
  const workflow = createSessionWorkflowController({
    auth, profile, storage, walletSessionKey: "wallet-session", sessionRuntime,
    sessionController: {}, serializeSession: (state) => state, parseStoredSession: JSON.parse,
    isGuestSessionState: (state) => state.sessionType === "guest", isDevSessionState: () => false,
    isWalletAuthenticatedState: (state) => Boolean(state.authenticated),
    isServerBackedWalletSessionState: () => false,
    getActiveDevProfileId: () => "dev_user_1", setActiveDevProfileId: () => {},
    getDevProfileDisplayName: () => "DEV-1", getAddressLabel: (value) => value,
    getChainLabel: () => "guest", getUiState: () => ({}), renderUi: () => {},
    onSessionCleared: () => {}, applyFreshPlayerStartState: () => {},
    saveCoordinator: { loadActiveLocalProfileState: () => "apply_error" },
    getApiFetchJson: () => null, getAuthHeaders: () => ({}), getLoginMessage: () => "",
    getNicknameInput: () => "", setNicknameStatus: () => {},
    setLoginStatus: (value) => { status = value; }, setLoginBusy: () => {},
    setNicknameBusy: () => {}, notify: () => {}, onboardingEnabled: true,
    onPlayableWorldEntered: () => { entered = true; return { changed: true, firstVisit: true }; },
  });

  workflow.restoreWalletSession();

  assert.equal(entered, false);
  assert.match(status, /덮어쓰지 않습니다/);
});
