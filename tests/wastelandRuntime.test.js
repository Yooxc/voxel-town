import test from "node:test";
import assert from "node:assert/strict";
import { createWastelandRuntime } from "../src/systems/wastelandRuntime.js";

function createRuntime() {
  const plot = {
    cells: [
      { id: "W1-1", row: 0, col: 0, clearProgress: 25 },
      { id: "W1-2", row: 0, col: 1, clearProgress: 100 },
    ],
    claimDrafts: new Map([["owner", { ownerId: "owner", postKeys: ["0:0"] }]]),
    fencePosts: new Map([["0:0", { key: "0:0", row: 0, col: 0, x: 1, z: 2, ownerId: "owner", mesh: {} }]]),
    claims: [{ ownerId: "owner", minRow: 0, maxRow: 0, minCol: 0, maxCol: 1 }],
    structures: [{ row: 0, col: 1, slot: "floor" }],
  };
  return { plot, runtime: createWastelandRuntime({ getPlot: () => plot, getOwnerId: () => "owner", landDeedItemId: "deed" }) };
}

test("resolves claims, cells, construction conflicts, and deed data", () => {
  const { runtime, plot } = createRuntime();
  assert.equal(runtime.getCurrentClaim(), plot.claims[0]);
  assert.equal(runtime.getClaimForCell(plot.cells[1]), plot.claims[0]);
  assert.equal(runtime.getCellById("W1-1"), plot.cells[0]);
  assert.equal(runtime.getStructureConflict(plot.cells[1], "floor"), plot.structures[0]);
  assert.equal(runtime.createLandDeedData({ minRow: 0, maxRow: 0, minCol: 0, maxCol: 1 }).itemId, "deed");
});

test("serializes gameplay state without scene mesh references", () => {
  const { runtime } = createRuntime();
  const state = runtime.serializeState((cell) => cell.clearProgress);
  assert.deepEqual(state.cells, [{ id: "W1-1", clearProgress: 25 }, { id: "W1-2", clearProgress: 100 }]);
  assert.equal("mesh" in state.fencePosts[0], false);
  assert.equal(state.drafts[0].ownerId, "owner");
});

test("creates claim records, overlap decisions, and status patches without scene state", () => {
  const { runtime, plot } = createRuntime();
  const rect = { minRow: 0, maxRow: 1, minCol: 2, maxCol: 3, width: 2, height: 2, cellIds: ["W2-1"] };

  assert.equal(runtime.hasClaimOverlap(rect, plot.claims), false);
  assert.equal(runtime.hasClaimOverlap({ ...rect, minCol: 1 }, plot.claims), true);
  assert.deepEqual(
    runtime.createClaimRecord({
      ownerId: "owner",
      rect,
      draft: { postKeys: ["0:2"] },
      landMeta: { mapId: "frontier-wasteland", landId: "land-2", displayName: "Land", detailAddress: "r0" },
      now: 100,
      durationMs: 50,
      activeStatus: "active",
    }),
    {
      status: "active",
      ownerId: "owner",
      mapId: "frontier-wasteland",
      landId: "land-2",
      displayName: "Land",
      detailAddress: "r0",
      ...rect,
      postKeys: ["0:2"],
      confirmedAt: 100,
      expiresAt: 150,
    }
  );
  assert.deepEqual(runtime.createClaimStatusPatch("completed", "completedAt", 200, { rewardIssuedAt: 200 }), {
    status: "completed",
    completedAt: 200,
    rewardIssuedAt: 200,
  });
});

test("creates fence placement decisions and reservation updates without rendering dependencies", () => {
  const { runtime } = createRuntime();
  assert.deepEqual(runtime.getFencePostPlacementDecision({ cell: null }), { ok: false, reason: "missing-cell" });
  assert.equal(runtime.getFencePostPlacementDecision({
    cell: { row: 1, col: 2 },
    ownerId: "owner",
    hasCurrentClaim: false,
    hasExistingPost: false,
    isInsideConfirmedClaim: false,
    hasConfirmedClaimBuffer: false,
    reservationHit: { buffer: 2 },
    hasFencePostItem: true,
  }).reason, "draft-reservation-buffer");
  assert.deepEqual(runtime.createFencePostRecord({ row: 1, col: 2, x: 3, z: 4 }, "owner"), {
    key: "1:2", row: 1, col: 2, x: 3, z: 4, ownerId: "owner",
  });
  assert.deepEqual(runtime.createDraftReservationUpdate({
    draft: { ownerId: "owner", postKeys: ["0:0"], reservedAt: 5 },
    ownerId: "owner",
    postKey: "1:2",
    now: 10,
    reservationMs: 20,
  }), {
    ownerId: "owner",
    postKeys: ["0:0", "1:2"],
    lastPromptSignature: "",
    reservedAt: 5,
    updatedAt: 10,
    expiresAt: 30,
  });
});

test("creates clearing permissions, progress, and reward plans", () => {
  const { runtime } = createRuntime();
  assert.equal(runtime.getCellClearPermission({ cell: {}, claim: null, ownerId: "owner", activeStatus: "active" }).reason, "claim-required");
  assert.equal(runtime.getCellClearPermission({
    cell: {},
    claim: { ownerId: "other", status: "active" },
    ownerId: "owner",
    activeStatus: "active",
  }).reason, "owner-mismatch");
  assert.deepEqual(runtime.createCellClearProgressPlan({ currentProgress: 75, gain: 25 }), {
    ok: true, progress: 100, completed: true,
  });
  assert.equal(runtime.createCellClearProgressPlan({ currentProgress: 100, gain: 25 }).reason, "already-cleared");
  assert.deepEqual(runtime.getClaimCompletionRewardPlan({ canComplete: true, hasIssuedDeed: true }), {
    ok: true, action: "confirm-issued",
  });
});

test("creates reset and restore plans without carrying scene objects", () => {
  const { runtime } = createRuntime();
  const resetPlan = runtime.createResetStatePlan([{ id: "W1" }]);
  assert.equal(resetPlan.cellProgressById.get("W1"), 0);
  assert.deepEqual(resetPlan.claims, []);
  assert.equal(resetPlan.revision, 0);

  const restorePlan = runtime.createRestoreStatePlan({
    cells: [{ id: "W1", clearProgress: 75 }],
    fencePosts: [{ key: "0:0" }],
    drafts: [{ ownerId: "owner", lastPromptSignature: "stale" }],
    claims: [{ ownerId: "owner" }],
    structures: [{ key: "floor" }],
    revision: 7,
  });
  assert.equal(restorePlan.cellProgressById.get("W1"), 75);
  assert.equal(restorePlan.drafts[0].lastPromptSignature, "");
  assert.deepEqual(restorePlan.fencePosts, [{ key: "0:0" }]);
  assert.equal(restorePlan.revision, 7);
});

test("excludes malformed structures while restoring saved wasteland state", () => {
  const { runtime } = createRuntime();
  const restorePlan = runtime.createRestoreStatePlan({
    foundations: [{
      ownerId: "owner",
      landId: "land-1",
      status: "completed",
      bounds: { minRow: 0, maxRow: 1, minCol: 0, maxCol: 1 },
    }],
    structures: [
      { key: "floor", ownerId: "owner", landId: "land-1", type: "woodFloor", row: 0, col: 0 },
      { key: "bad", ownerId: "owner", landId: "land-1", type: "unknown", row: 0, col: 1 },
    ],
  });

  assert.deepEqual(restorePlan.structures.map((structure) => structure.key), ["floor"]);
});

test("creates build records with stable land ownership and wall rotation", () => {
  const { runtime } = createRuntime();
  assert.deepEqual(runtime.createStructureRecord({
    key: "wall-1",
    claim: { landId: "land-1" },
    ownerId: "owner",
    itemId: "woodWall",
    slot: "wall",
    cell: { row: 2, col: 3 },
    surfaceY: 0.5,
    rotationQuarter: 3,
  }), {
    key: "wall-1",
    landId: "land-1",
    ownerId: "owner",
    type: "woodWall",
    slot: "wall",
    structureKind: "wall",
    row: 2,
    col: 3,
    y: 0.5,
    rotationQuarter: 3,
    edge: "west",
    placementKey: "wall:v:2:3",
    cellSize: 0,
  });
  assert.equal(runtime.createStructureRecord({
    key: "floor-1",
    ownerId: "owner",
    itemId: "woodFloor",
    slot: "floor",
    cell: { row: 0, col: 0 },
    surfaceY: 0.2,
    rotationQuarter: 2,
  }).rotationQuarter, 0);
});

test("selects missing deeds and creates cancellation and expiration plans", () => {
  const { runtime } = createRuntime();
  const claims = [
    { ownerId: "owner", status: "completed", landId: "land-a" },
    { ownerId: "owner", status: "completed", landId: "land-b" },
    { ownerId: "other", status: "completed", landId: "land-c" },
  ];
  assert.deepEqual(runtime.getMissingLandDeedClaims({
    claims,
    ownerId: "owner",
    completedStatus: "completed",
    hasLandDeed: (landId) => landId === "land-a",
  }), [claims[1]]);
  assert.equal(runtime.getClaimCancellationPlan({ claim: { status: "completed" }, completedStatus: "completed" }).ok, false);
  const expirationPlan = runtime.createClaimExpirationPlan({
    claims,
    now: 99,
    failedStatus: "failed",
    partitionExpiredClaims: (entries) => ({ expired: [entries[0]], active: entries.slice(1) }),
  });
  assert.equal(expirationPlan.active.length, 2);
  assert.deepEqual(expirationPlan.expired[0].patch, { status: "failed", failedAt: 99 });
});
