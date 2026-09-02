import test from "node:test";
import assert from "node:assert/strict";
import { createDevProfileOrchestrator, createSessionController } from "../src/auth/sessionController.js";

function createController() {
  return createSessionController({
    authApiBaseUrl: "http://auth.test",
    devActiveProfileKey: "active-profile",
    devProfileIds: ["dev_user_1", "dev_user_2"],
    devProfileStartOffsets: {
      dev_user_1: { x: -1.2, z: 0 },
      dev_user_2: { x: 1.2, z: 0 },
    },
    fallbackProfileId: "dev_user_1",
    startX: 10,
  });
}

test("creates normalized development session and spawn plans", () => {
  const controller = createController();
  const plan = controller.getDevProfileInitializationPlan({
    preferredProfileId: "",
    storedProfileId: "dev_user_2",
    activeProfileId: "invalid",
  });

  assert.deepEqual(plan, { profileId: "dev_user_2", activeProfileKey: "active-profile" });
  assert.deepEqual(controller.getDevProfileStartPosition(plan.profileId), { x: 11.2, z: 0 });
  assert.deepEqual(
    controller.createDevSessionState("invalid", (profileId) => `name:${profileId}`, "now"),
    {
      authenticated: true,
      address: "dev_user_1",
      signature: "",
      nonce: "",
      issuedAt: "now",
      chainId: "development",
      token: "",
      sessionType: "dev",
      nickname: "name:dev_user_1",
      devProfileId: "dev_user_1",
    }
  );
});

test("wraps auth responses with stable success and failure results", async () => {
  const controller = createController();
  const success = await controller.apiFetchJson("/me", { method: "GET" }, async (url, options) => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, url, method: options.method }),
  }));
  const failure = await controller.apiFetchJson("/me", {}, async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: "expired" }),
  }));

  assert.deepEqual(success, {
    ok: true,
    data: { ok: true, url: "http://auth.test/me", method: "GET" },
  });
  assert.deepEqual(failure, { ok: false, status: 401, error: "expired", data: { error: "expired" } });
});

test("orchestrates guest, wallet, hydration, and nickname session payloads", async () => {
  const controller = createController();
  assert.equal(controller.createGuestSessionState("now").address, "guest-local");

  const requests = [];
  const provider = {
    request: async ({ method }) => {
      if (method === "eth_requestAccounts") return ["0xabc"];
      if (method === "personal_sign") return "signed";
      if (method === "eth_chainId") return "0x1";
      return null;
    },
  };
  const login = await controller.connectWallet({
    provider,
    getLoginMessage: () => "message",
    apiFetchJson: async (path) => {
      requests.push(path);
      if (path === "/auth/nonce") return { ok: true, data: { nonce: "n", issuedAt: "now" } };
      return { ok: true, data: { token: "token", user: { nickname: "tester" } } };
    },
  });
  assert.equal(login.ok, true);
  assert.equal(login.state.address, "0xabc");
  assert.deepEqual(requests, ["/auth/nonce", "/auth/verify"]);

  const hydrated = await controller.hydrateWalletSession({
    auth: login.state,
    headers: { Authorization: "Bearer token" },
    apiFetchJson: async () => ({ ok: true, data: { user: { walletAddress: "0xdef", nickname: "next" } } }),
  });
  assert.equal(hydrated.state.address, "0xdef");
  assert.equal(hydrated.state.nickname, "next");

  const nickname = await controller.saveNickname({
    nickname: "local",
    local: true,
    apiFetchJson: async () => assert.fail("local nickname should not call the API"),
    headers: {},
  });
  assert.deepEqual(nickname, { ok: true, nickname: "local", local: true });
});

test("developer test reset applies world and profile baseline resets", () => {
  const calls = [];
  const stored = new Map();
  const blankWorld = { frontierWasteland: { claims: [] } };
  const orchestrator = createDevProfileOrchestrator({
    profileIds: ["dev_user_1", "dev_user_2"],
    activeProfileKey: "active-profile",
    sharedWorldKey: "shared-world",
    storage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    },
    sessionController: { sanitizeDevProfileId: (profileId) => profileId },
    getActiveProfileId: () => "dev_user_1",
    isDevSession: () => true,
    setPlayerSaveSyncPaused: (paused) => calls.push(["sync-paused", paused]),
    resetWastelandDraftUiState: () => calls.push("reset-draft-ui"),
    createDefaultSharedWorldSave: () => blankWorld,
    applySharedWorldState: (world) => calls.push(["apply-world", world]),
    resetFrontierWastelandRuntimeState: () => calls.push("reset-wasteland"),
    resetTerrainLabState: () => calls.push("reset-terrain-lab"),
    resetDevTestProfiles: (profileId) => calls.push(["reset-profiles", profileId]),
    refreshWastelandDraftUiState: () => calls.push("refresh-draft-ui"),
    saveSharedWorldState: () => calls.push("save-world"),
    notify: (message) => calls.push(["notify", message]),
  });

  assert.equal(orchestrator.resetTestingEnvironment(), true);
  assert.deepEqual(calls.slice(0, 10), [
    ["sync-paused", true],
    "reset-draft-ui",
    ["apply-world", blankWorld],
    "reset-wasteland",
    "reset-terrain-lab",
    ["reset-profiles", "dev_user_1"],
    "refresh-draft-ui",
    "save-world",
    ["notify", "공용 맵과 두 개발자 테스트 상태를 초기화했습니다."],
    ["sync-paused", false],
  ]);
  assert.equal(stored.get("active-profile"), "dev_user_1");
  assert.equal(stored.get("shared-world"), JSON.stringify(blankWorld));
});

test("developer test reset resumes save sync and reports a failed transaction", () => {
  const pauses = [];
  const notifications = [];
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const orchestrator = createDevProfileOrchestrator({
      activeProfileKey: "active-profile",
      sharedWorldKey: "shared-world",
      storage: { setItem() {} },
      sessionController: { sanitizeDevProfileId: (profileId) => profileId },
      getActiveProfileId: () => "dev_user_1",
      isDevSession: () => true,
      setPlayerSaveSyncPaused: (paused) => pauses.push(paused),
      createDefaultSharedWorldSave: () => ({}),
      resetWastelandDraftUiState: () => {},
      applySharedWorldState: () => {},
      resetFrontierWastelandRuntimeState: () => {},
      resetTerrainLabState: () => {},
      resetDevTestProfiles: () => { throw new Error("profile reset failed"); },
      refreshWastelandDraftUiState: () => assert.fail("refresh must not run after failure"),
      saveSharedWorldState: () => assert.fail("save must not run after failure"),
      notify: (message) => notifications.push(message),
    });

    assert.equal(orchestrator.resetTestingEnvironment(), false);
    assert.deepEqual(pauses, [true, false]);
    assert.match(notifications.at(-1), /초기화에 실패/);
  } finally {
    console.error = originalConsoleError;
  }
});

function createProfileSwitchHarness({ failingProfileId = "", throwOnDraftReset = false } = {}) {
  const controller = createController();
  const stored = new Map([["active-profile", "dev_user_1"]]);
  const saves = new Map([
    ["dev_user_1", { position: { x: 11 }, items: ["developer-1-item"] }],
    ["dev_user_2", { position: { x: 22 }, items: ["developer-2-item"] }],
  ]);
  let activeProfileId = "dev_user_1";
  let runtimeState = structuredClone(saves.get(activeProfileId));
  const notifications = [];
  const orchestrator = createDevProfileOrchestrator({
    profileIds: ["dev_user_1", "dev_user_2"],
    activeProfileKey: "active-profile",
    sharedWorldKey: "shared-world",
    storage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    },
    sessionController: controller,
    getActiveProfileId: () => activeProfileId,
    setActiveProfileId: (profileId) => { activeProfileId = profileId; },
    getDisplayName: (profileId) => profileId,
    getCreditsMigrationKey: (profileId) => `credits:${profileId}`,
    getInventorySeedKey: (profileId) => `inventory-seed:${profileId}`,
    getPlayerCredits: () => 500,
    setPlayerCredits: () => {},
    isDevSession: () => true,
    setWalletAuthState: () => {},
    setWalletLoginStatus: () => {},
    resetPlayerSaveProtectionState: () => {},
    setPlayerSaveSyncPaused: () => {},
    loadSharedWorldState: () => ({}),
    applySharedWorldState: () => {},
    loadActiveLocalProfileState: () => {
      if (activeProfileId === failingProfileId) return "apply_error";
      runtimeState = structuredClone(saves.get(activeProfileId));
      return "loaded";
    },
    applyFreshPlayerStartState: () => { runtimeState = { items: [] }; },
    applyDevProfileStartPosition: () => {},
    applyDevPreset: () => {},
    saveActiveLocalProfileState: () => saves.set(activeProfileId, structuredClone(runtimeState)),
    saveSharedWorldState: () => {},
    applyDevProfileRoleOverrides: () => {},
    restoreMissingLandDeeds: () => {},
    resetWastelandDraftUiState: () => {
      if (throwOnDraftReset) throw new Error("draft UI unavailable");
    },
    refreshWastelandDraftUiState: () => {},
    createDefaultSharedWorldSave: () => ({}),
    resetFrontierWastelandRuntimeState: () => {},
    resetTerrainLabState: () => {},
    resetDevTestProfiles: () => {},
    notify: (message) => notifications.push(message),
  });
  return {
    orchestrator,
    saves,
    notifications,
    stored,
    getActiveProfileId: () => activeProfileId,
    getRuntimeState: () => structuredClone(runtimeState),
    setRuntimeState: (state) => { runtimeState = structuredClone(state); },
  };
}

test("developer profile switching preserves each profile inventory", () => {
  const harness = createProfileSwitchHarness();

  assert.equal(harness.orchestrator.switchProfile("dev_user_2"), true);
  assert.equal(harness.getActiveProfileId(), "dev_user_2");
  assert.deepEqual(harness.getRuntimeState(), {
    position: { x: 22 }, items: ["developer-2-item"],
  });

  harness.setRuntimeState({ position: { x: 29 }, items: ["developer-2-changed"] });

  assert.equal(harness.orchestrator.switchProfile("dev_user_1"), true);
  assert.equal(harness.getActiveProfileId(), "dev_user_1");
  assert.deepEqual(harness.getRuntimeState(), {
    position: { x: 11 }, items: ["developer-1-item"],
  });
  assert.deepEqual(harness.saves.get("dev_user_2"), {
    position: { x: 29 }, items: ["developer-2-changed"],
  });

  harness.setRuntimeState({ position: { x: 17 }, items: ["developer-1-changed"] });
  assert.equal(harness.orchestrator.switchProfile("dev_user_2"), true);
  assert.deepEqual(harness.getRuntimeState(), {
    position: { x: 29 }, items: ["developer-2-changed"],
  });
  assert.deepEqual(harness.saves.get("dev_user_1"), {
    position: { x: 17 }, items: ["developer-1-changed"],
  });
});

test("developer inventory is seeded once per separate profile", () => {
  const harness = createProfileSwitchHarness();

  assert.equal(harness.orchestrator.switchProfile("dev_user_2"), true);
  assert.equal(harness.stored.get("inventory-seed:dev_user_2"), "1");

  harness.setRuntimeState({ position: { x: 29 }, items: ["developer-2-consumed"] });
  assert.equal(harness.orchestrator.switchProfile("dev_user_1"), true);
  assert.equal(harness.stored.get("inventory-seed:dev_user_1"), "1");
  assert.equal(harness.orchestrator.switchProfile("dev_user_2"), true);
  assert.deepEqual(harness.getRuntimeState(), {
    position: { x: 29 }, items: ["developer-2-consumed"],
  });
});

test("clicking the already selected developer profile performs its pending one-time inventory seed", () => {
  const harness = createProfileSwitchHarness();

  assert.equal(harness.orchestrator.switchProfile("dev_user_1"), true);
  assert.equal(harness.stored.get("inventory-seed:dev_user_1"), "1");
  assert.match(harness.notifications.at(-1), /기본 아이템을 지급했습니다/);
});

test("developer profile switching enters a recovery preset without clearing a failed profile save", () => {
  const harness = createProfileSwitchHarness({ failingProfileId: "dev_user_2" });
  const originalDev1Save = structuredClone(harness.saves.get("dev_user_1"));
  const originalDev2Save = structuredClone(harness.saves.get("dev_user_2"));

  assert.equal(harness.orchestrator.switchProfile("dev_user_2"), true);
  assert.equal(harness.getActiveProfileId(), "dev_user_2");
  assert.deepEqual(harness.saves.get("dev_user_1"), originalDev1Save);
  assert.deepEqual(harness.saves.get("dev_user_2"), originalDev2Save);
  assert.match(harness.notifications.at(-2), /임시 상태로 입장했습니다/);
});

test("developer profile selection survives a non-critical wasteland UI failure", () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const harness = createProfileSwitchHarness({ throwOnDraftReset: true });
    assert.equal(harness.orchestrator.switchProfile("dev_user_2"), true);
    assert.equal(harness.getActiveProfileId(), "dev_user_2");
    assert.deepEqual(harness.getRuntimeState(), {
      position: { x: 22 }, items: ["developer-2-item"],
    });
  } finally {
    console.error = originalConsoleError;
  }
});
