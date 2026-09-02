import assert from "node:assert/strict";
import test from "node:test";
import { createSharedWorldStateCoordinator } from "../src/save/sharedWorldStateCoordinator.js";

function createFixture() {
  const storage = new Map();
  const inventory = { abandonedMineUnlocked: false };
  let frontierBuildState = { p6: { stage: 10 } };
  let board = null;
  let noticeBoards = { lobby: { text: "hello" } };
  const calls = [];
  const gate = { lockBlocker: { removeFromParent: () => calls.push("remove-blocker") }, lockColliderIndex: 5 };
  const coordinator = createSharedWorldStateCoordinator({
    storage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    storageKey: "shared",
    inventory,
    mapPollutionConfig: { "폐광": {}, "개척지": {} },
    isDevSession: () => true,
    createDefaultFrontierBuildState: () => ({ p6: { stage: 0 } }),
    normalizeFrontierBuildState: (state) => state ?? { p6: { stage: 0 } },
    normalizeNftBoardSelection: (value) => value ?? null,
    createDefaultResidenceNoticeBoardState: () => ({ lobby: { text: "" } }),
    normalizeResidenceNoticeBoardState: (state) => state ?? { lobby: { text: "" } },
    normalizeFrontierWastelandState: (state) => state ?? { cells: [] },
    getFrontierBuildState: () => frontierBuildState,
    setFrontierBuildState: (state) => { frontierBuildState = state; },
    getMapPurificationValue: (mapId) => mapId === "폐광" ? 25 : 50,
    setMapPurificationValue: (mapId, value) => calls.push(`${mapId}:${value}`),
    getSelectedNftBoardItem: () => board,
    setSelectedNftBoardItem: (value) => { board = value; },
    getResidenceNoticeBoardState: () => noticeBoards,
    setResidenceNoticeBoardState: (value) => { noticeBoards = value; },
    serializeFrontierWastelandState: () => ({ cells: [{ id: "a" }] }),
    applyFrontierWastelandState: (value) => calls.push(value.cells.length),
    getAbandonedMineGate: () => gate,
    getTrackedColliderIndex: () => 5,
    removeColliderAt: () => calls.push("remove-collider"),
    restoreLockedMapGate: () => calls.push("restore-gate"),
    rebuildAllFrontierConstructionVisuals: () => calls.push("rebuild"),
    renderResidenceNoticeBoards: () => calls.push("notices"),
    scheduleNftExhibitBoardRefresh: () => calls.push("board-refresh"),
  });
  return { coordinator, storage, inventory, calls, getState: () => ({ frontierBuildState, board, noticeBoards }) };
}

test("serializes and loads shared world state through local storage", () => {
  const fixture = createFixture();
  assert.equal(fixture.coordinator.saveToLocal(), true);

  const loaded = fixture.coordinator.loadFromLocal();
  assert.equal(loaded.frontierBuild.p6.stage, 10);
  assert.equal(loaded.mapPurification["폐광"], 25);
  assert.equal(loaded.frontierWasteland.cells.length, 1);
});

test("applies shared world state and unlocks the mine gate", () => {
  const fixture = createFixture();
  fixture.coordinator.applySharedWorldState({
    frontierBuild: { p6: { stage: 100 } },
    abandonedMineUnlocked: true,
    mapPurification: { "폐광": 75, "개척지": 30 },
    displayBoard: { tokenId: "8" },
    residenceNoticeBoards: { lobby: { text: "updated" } },
    frontierWasteland: { cells: [{ id: "b" }] },
  });

  assert.equal(fixture.inventory.abandonedMineUnlocked, true);
  assert.equal(fixture.getState().frontierBuildState.p6.stage, 100);
  assert.deepEqual(fixture.getState().board, { tokenId: "8" });
  assert.ok(fixture.calls.includes("remove-collider"));
  assert.ok(fixture.calls.includes("rebuild"));
});
