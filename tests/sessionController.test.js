import test from "node:test";
import assert from "node:assert/strict";
import { createSessionController } from "../src/auth/sessionController.js";

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
