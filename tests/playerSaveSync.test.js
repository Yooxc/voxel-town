import test from "node:test";
import assert from "node:assert/strict";
import {
  createPlayerSaveExitPlan,
  createPlayerSaveSchedulePlan,
  hydratePlayerSaveRuntime,
  pushPlayerSaveRuntime,
} from "../src/save/playerSaveSync.js";

test("skips a push when the serialized save is unchanged", async () => {
  let requested = false;
  const result = await pushPlayerSaveRuntime({
    isServerBackedSession: () => true,
    hasConfirmedBaseline: () => true,
    setStatus: () => {},
    serializeSave: () => ({ version: 1 }),
    getSnapshot: () => JSON.stringify({ version: 1 }),
    getKnownUpdatedAt: () => "old",
    apiFetchJson: async () => { requested = true; },
    getAuthHeaders: () => ({}),
  });
  assert.equal(result, true);
  assert.equal(requested, false);
});

test("blocks push before the save baseline is confirmed", async () => {
  const statuses = [];
  const result = await pushPlayerSaveRuntime({
    isServerBackedSession: () => true,
    hasConfirmedBaseline: () => false,
    setStatus: (...args) => statuses.push(args),
  });
  assert.equal(result, false);
  assert.deepEqual(statuses, [["baseline-pending", "error"]]);
});

test("hydrates the latest server save and marks its baseline", async () => {
  const applied = [];
  const baselines = [];
  const updatedAt = [];
  const result = await hydratePlayerSaveRuntime({
    isServerBackedSession: () => true,
    setStatus: () => {},
    apiFetchJson: async () => ({
      ok: true,
      data: { save: { data: { version: 2 }, updatedAt: "new" } },
    }),
    getAuthHeaders: () => ({}),
    blockBaseline: () => {},
    serializeSave: () => ({}),
    setKnownUpdatedAt: (value) => updatedAt.push(value),
    setSnapshot: () => {},
    markBaselineReady: (mode) => baselines.push(mode),
    applySave: (save) => applied.push(save),
    setWalletLoginStatus: () => {},
  });
  assert.equal(result, true);
  assert.deepEqual(applied, [{ version: 2 }]);
  assert.deepEqual(updatedAt, ["new"]);
  assert.deepEqual(baselines, ["hydrated"]);
});

test("applies the server save on a concurrent update conflict", async () => {
  const applied = [];
  const statuses = [];
  const result = await pushPlayerSaveRuntime({
    isServerBackedSession: () => true,
    hasConfirmedBaseline: () => true,
    setStatus: (...args) => statuses.push(args),
    serializeSave: () => ({ version: 1 }),
    getSnapshot: () => "different",
    getKnownUpdatedAt: () => "old",
    apiFetchJson: async () => ({
      ok: false,
      status: 409,
      data: { save: { data: { version: 2 }, updatedAt: "new" } },
    }),
    getAuthHeaders: () => ({}),
    applySave: (save) => applied.push(save),
    setKnownUpdatedAt: () => {},
    setWalletLoginStatus: () => {},
  });
  assert.equal(result, false);
  assert.deepEqual(applied, [{ version: 2 }]);
  assert.deepEqual(statuses.at(-1), ["conflict", "error"]);
});

test("creates exit and scheduled-sync plans from current save state", () => {
  assert.deepEqual(createPlayerSaveExitPlan({
    isDevSession: false, isServerBackedSession: true, syncPaused: false,
    hasConfirmedBaseline: true, snapshot: "next", previousSnapshot: "previous",
  }), { type: "remote", snapshot: "next" });
  assert.deepEqual(createPlayerSaveSchedulePlan({
    isDevSession: false, isServerBackedSession: true, syncPaused: false,
    hasConfirmedBaseline: true, force: false, now: 5000, lastAttemptAt: 0,
    inFlight: false, intervalMs: 4000,
  }), { type: "sync", attemptedAt: 5000 });
});
