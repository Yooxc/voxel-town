import test from "node:test";
import assert from "node:assert/strict";
import { createPlayerSaveRuntime } from "../src/save/playerSaveRuntime.js";

test("tracks baseline protection and save metadata", () => {
  const runtime = createPlayerSaveRuntime();
  assert.equal(runtime.hasConfirmedBaseline(), false);
  runtime.beginHydration();
  runtime.lastSnapshot = "snapshot";
  runtime.lastKnownUpdatedAt = "time";
  runtime.markBaselineReady("hydrated");
  assert.equal(runtime.hasConfirmedBaseline(), true);
  runtime.blockBaseline();
  assert.equal(runtime.hasConfirmedBaseline(), false);
  runtime.reset();
  assert.equal(runtime.lastSnapshot, "");
  assert.equal(runtime.lastKnownUpdatedAt, "");
});
