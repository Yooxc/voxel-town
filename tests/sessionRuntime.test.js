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
