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
