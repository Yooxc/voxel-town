import test from "node:test";
import assert from "node:assert/strict";
import { createSessionRuntime } from "../src/auth/sessionRuntime.js";
test("validates profiles, nicknames, and local save keys", () => {
  const runtime = createSessionRuntime({ devProfileIds: ["a", "b"], fallbackProfileId: "a", devProfileSavePrefix: "dev.", guestSaveKey: "guest" });
  assert.equal(runtime.sanitizeDevProfileId("x"), "a");
  assert.equal(runtime.validateNickname("tester"), "");
  assert.notEqual(runtime.validateNickname("!"), "");
  assert.equal(runtime.getPlayerSaveKey({ sessionType: "dev" }, "b"), "dev.b");
  assert.equal(runtime.getPlayerSaveKey({ sessionType: "guest" }, "a"), "guest");
});

test("applies normalized auth state and parses restorable sessions", () => {
  const runtime = createSessionRuntime({ devProfileIds: ["a", "b"], fallbackProfileId: "a", devProfileSavePrefix: "dev.", guestSaveKey: "guest" });
  const auth = {};
  const profile = {};
  const activeProfileId = runtime.applyAuthState({
    auth,
    profile,
    nextState: { authenticated: true, address: "invalid", sessionType: "dev" },
    activeDevProfileId: "b",
    getDevProfileDisplayName: (id) => `name:${id}`,
  });
  assert.equal(activeProfileId, "a");
  assert.equal(auth.address, "a");
  assert.equal(profile.nickname, "name:a");
  assert.deepEqual(runtime.parseRestorableSession("saved", () => ({ sessionType: "guest" })), {
    session: { sessionType: "guest" },
    invalid: false,
  });
  assert.equal(runtime.shortenWalletAddress("guest-local", () => "remote"), "GUEST");
});
