import test from "node:test";
import assert from "node:assert/strict";
import { createWastelandOperationsController } from "../src/ui/wastelandOperationsController.js";

test("completing a cleared claim creates its construction foundation", () => {
  const claim = {
    ownerId: "dev_user_1",
    landId: "land-1",
    minRow: 1,
    maxRow: 5,
    minCol: 2,
    maxCol: 6,
    width: 5,
    height: 5,
  };
  const plot = {
    claims: [claim],
    foundations: [],
    claimDrafts: new Map(),
    fencePosts: new Map(),
  };
  const inventory = [];
  const calls = [];
  const controller = createWastelandOperationsController({
    ensurePlot: () => plot,
    getOwnerId: () => "dev_user_1",
    getClaimProgress: () => ({ claim, completed: 20, total: 25, percent: 80 }),
    getCellById: () => null,
    canCompleteClaimState: () => true,
    getInventorySlots: () => inventory,
    isNftInventoryEntry: () => false,
    getSlotItemId: (entry) => entry.itemId,
    createInventorySlotEntry: (itemId, count, extra) => ({ itemId, count, ...extra }),
    addInventoryEntry: (entry) => { inventory.push(entry); return true; },
    setClaimStatus: (target, patch) => Object.assign(target, patch),
    removeClaimFences: () => calls.push("remove-fences"),
    gradeFoundationTerrain: () => calls.push("grade-foundation"),
    rebuildFoundations: () => calls.push("rebuild-foundations"),
    updateClaimActions: () => calls.push("claim-ui"),
    updateInventoryUI: () => calls.push("inventory-ui"),
    saveWorld: () => calls.push("save-world"),
    saveProfile: () => calls.push("save-profile"),
    showUI: () => {},
    setLastMessageUntil: () => {},
    now: () => 100,
    dateNow: () => 1234,
    runtime: {
      getCurrentClaim: () => claim,
      getClaimCompletionRewardPlan: () => ({ ok: true, action: "grant" }),
      createClaimStatusPatch: (status, field, value, extra) => ({ status, [field]: value, ...extra }),
      createLandDeedData: (target) => ({ itemId: "wastelandLandDeed", landId: target.landId }),
    },
    constants: {
      landDeedItemId: "wastelandLandDeed",
      claimStatus: { completed: "completed" },
    },
  });

  assert.equal(controller.completeClaim(), true);
  assert.equal(inventory[0].itemId, "wastelandLandDeed");
  assert.deepEqual(plot.foundations, [{
    id: "foundation_land-1",
    ownerId: "dev_user_1",
    landId: "land-1",
    status: "completed",
    bounds: {
      minRow: 1,
      maxRow: 5,
      minCol: 2,
      maxCol: 6,
      width: 5,
      height: 5,
    },
    completedAt: 1234,
  }]);
  assert.deepEqual(calls, [
    "grade-foundation",
    "rebuild-foundations",
    "remove-fences",
    "claim-ui",
    "inventory-ui",
    "save-world",
    "save-profile",
  ]);
});

test("developer completion bypass is limited to the active claim owner", () => {
  const claim = { ownerId: "dev_user_1", status: "active" };
  const controller = createWastelandOperationsController({
    getOwnerId: () => "dev_user_1",
    canBypassClaimCompletion: (progress) => progress?.claim?.ownerId === "dev_user_1",
    canCompleteClaimState: () => false,
  });

  assert.equal(controller.canCompleteClaim({ claim }), true);
  assert.equal(controller.canCompleteClaim({ claim: { ownerId: "dev_user_2", status: "active" } }), false);
});

test("restores a consumed build part when remote placement fails", async () => {
  const cell = { row: 1, col: 1, size: 2 };
  const claim = { ownerId: "owner", landId: "land-1", status: "completed", minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 };
  const plot = {
    claims: [claim],
    structures: [],
    foundations: [{ id: "foundation-1", ownerId: "owner", landId: "land-1", status: "completed", bounds: { minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 } }],
    revision: 4,
  };
  const calls = [];
  const controller = createWastelandOperationsController({
    ensurePlot: () => plot,
    getOwnerId: () => "owner",
    getSelectedStructureItemId: () => "woodWall",
    getBuildPart: () => ({ itemId: "woodWall", slot: "wall" }),
    getStructureRotationQuarter: () => 1,
    getStructurePlacementKey: () => "wall:v:1:2",
    isCellInsideBounds: () => true,
    canBuildOnCell: () => ({ ok: true }),
    getInventorySlots: () => [{ itemId: "wastelandLandDeed", landId: "land-1" }],
    isNftInventoryEntry: () => false,
    getSlotItemId: (entry) => entry.itemId,
    consumeItem: () => { calls.push("consume"); return true; },
    addItem: () => { calls.push("restore"); return true; },
    usesRemoteStructureWorld: () => true,
    dispatchStructureAction: async () => ({ ok: false, status: 409, error: "conflict", world: { revision: 5, structures: [] } }),
    serializeState: () => ({ foundations: plot.foundations }),
    applyRemoteStructureWorld: () => calls.push("apply-world"),
    updateInventoryUI: () => calls.push("inventory-ui"),
    saveProfile: () => calls.push("save-profile"),
    showUI: () => {},
    setLastMessageUntil: () => {},
    now: () => 0,
    dateNow: () => 100,
    getStructureSurfaceY: () => 0.2,
    getItemName: () => "목재 벽",
    constants: { landDeedItemId: "wastelandLandDeed" },
    runtime: {
      getClaimForCell: () => claim,
      createStructureRecord: (data) => ({ key: "local-wall", type: data.itemId, ownerId: data.ownerId, rotationQuarter: data.rotationQuarter }),
    },
  });

  assert.equal(await controller.placeStructure(cell, "woodWall"), false);
  assert.deepEqual(calls, ["consume", "restore", "apply-world", "inventory-ui", "save-profile"]);
  assert.equal(plot.structures.length, 0);
});

test("blocks structure placement before consuming an item when the player occupies the target space", async () => {
  const calls = [];
  const controller = createWastelandOperationsController({
    ensurePlot: () => ({ structures: [], foundations: [], claims: [] }),
    getOwnerId: () => "owner",
    getSelectedStructureItemId: () => "woodWall",
    getBuildPart: () => ({ itemId: "woodWall", slot: "wall" }),
    getStructureRotationQuarter: () => 0,
    getStructurePlacementKey: () => "wall:h:0:0",
    getStructureConflict: () => null,
    canBuildOnCell: () => ({ ok: true }),
    getBuildOccupancyError: () => "플레이어가 있는 공간에는 건축할 수 없습니다.",
    consumeItem: () => { calls.push("consume"); return true; },
    showUI: (message) => calls.push(message),
    setLastMessageUntil: () => {},
    now: () => 0,
    runtime: { getClaimForCell: () => null },
  });

  assert.equal(await controller.placeStructure({ row: 0, col: 0, size: 2 }, "woodWall"), false);
  assert.deepEqual(calls, ["플레이어가 있는 공간에는 건축할 수 없습니다."]);
});

test("returns the original part when an owned local structure is demolished", async () => {
  const structure = { key: "wall-1", ownerId: "owner", type: "stoneWall" };
  const plot = { structures: [structure], revision: 2 };
  const calls = [];
  const controller = createWastelandOperationsController({
    ensurePlot: () => plot,
    getOwnerId: () => "owner",
    addItem: () => { calls.push("refund"); return true; },
    usesRemoteStructureWorld: () => false,
    rebuildStructures: () => calls.push("rebuild"),
    saveWorld: () => calls.push("save-world"),
    updateInventoryUI: () => calls.push("inventory-ui"),
    saveProfile: () => calls.push("save-profile"),
    getItemName: () => "석재 벽",
    showUI: () => {},
    setLastMessageUntil: () => {},
    now: () => 0,
  });

  assert.equal(await controller.removeStructure("wall-1"), true);
  assert.equal(plot.structures.length, 0);
  assert.equal(plot.revision, 3);
  assert.deepEqual(calls, ["refund", "rebuild", "save-world", "inventory-ui", "save-profile"]);
});

test("reclaims a provisional refund when remote demolition fails", async () => {
  const structure = { key: "wall-1", ownerId: "owner", type: "stoneWall" };
  const plot = { structures: [structure], revision: 2 };
  const calls = [];
  const controller = createWastelandOperationsController({
    ensurePlot: () => plot,
    getOwnerId: () => "owner",
    addItem: () => { calls.push("refund"); return true; },
    consumeItem: () => { calls.push("rollback-refund"); return true; },
    usesRemoteStructureWorld: () => true,
    dispatchStructureAction: async () => ({ ok: false, status: 409, error: "conflict", world: { revision: 3, structures: [structure] } }),
    serializeState: () => ({ structures: plot.structures }),
    applyRemoteStructureWorld: () => calls.push("apply-world"),
    updateInventoryUI: () => calls.push("inventory-ui"),
    saveProfile: () => calls.push("save-profile"),
    showUI: () => {},
    setLastMessageUntil: () => {},
    now: () => 0,
  });

  assert.equal(await controller.removeStructure("wall-1"), false);
  assert.deepEqual(calls, ["refund", "rollback-refund", "apply-world", "inventory-ui", "save-profile"]);
});

test("toggles an owned local door and rebuilds its collision state", async () => {
  const structure = { key: "door-1", ownerId: "owner", type: "woodDoor", isOpen: false };
  const plot = { structures: [structure], revision: 6 };
  const calls = [];
  const controller = createWastelandOperationsController({
    ensurePlot: () => plot,
    getOwnerId: () => "owner",
    getBuildPart: () => ({ itemId: "woodDoor", slot: "wall", structureKind: "door" }),
    usesRemoteStructureWorld: () => false,
    rebuildStructures: () => calls.push("rebuild"),
    saveWorld: () => calls.push("save-world"),
    showUI: (message) => calls.push(message),
    setLastMessageUntil: () => {},
    now: () => 0,
  });

  assert.equal(await controller.toggleDoor("door-1"), true);
  assert.equal(structure.isOpen, true);
  assert.equal(plot.revision, 7);
  assert.deepEqual(calls, ["rebuild", "save-world", "문을 열었습니다."]);
});

test("ignores repeated door input while a remote toggle is pending", async () => {
  const structure = { key: "door-1", ownerId: "owner", type: "woodDoor", isOpen: false };
  const plot = { structures: [structure], revision: 1 };
  let resolveDispatch;
  let dispatchCount = 0;
  const controller = createWastelandOperationsController({
    ensurePlot: () => plot,
    getOwnerId: () => "owner",
    getBuildPart: () => ({ structureKind: "door" }),
    usesRemoteStructureWorld: () => true,
    dispatchStructureAction: () => {
      dispatchCount += 1;
      return new Promise((resolve) => { resolveDispatch = resolve; });
    },
    serializeState: () => ({ structures: plot.structures }),
    applyRemoteStructureWorld: () => {},
    showUI: () => {},
    setLastMessageUntil: () => {},
    now: () => 0,
  });

  const first = controller.toggleDoor("door-1");
  assert.equal(await controller.toggleDoor("door-1"), false);
  resolveDispatch({ ok: true, world: { revision: 2, structures: [{ ...structure, isOpen: true }] } });
  assert.equal(await first, true);
  assert.equal(dispatchCount, 1);
});
