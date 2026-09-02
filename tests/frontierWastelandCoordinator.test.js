import test from "node:test";
import assert from "node:assert/strict";
import { createFrontierWastelandCoordinator } from "../src/world/frontierWastelandCoordinator.js";

test("summarizes frontier progress and creates cell clearing plans through the coordinator", () => {
  const plot = {
    cells: [
      { id: "a", state: "dug3", clearProgress: 100 },
      { id: "b", state: "dug1", clearProgress: 25 },
      { id: "c", state: "idle", clearProgress: 0 },
    ],
  };
  const coordinator = createFrontierWastelandCoordinator({
    getPlot: () => plot,
    getOwnerId: () => "owner",
    landDeedItemId: "wastelandLandDeed",
    getClaimActionButtons: () => ({}),
    cellClearProgressGain: 25,
    getCellClearProgress: (cell) => cell.clearProgress,
  });

  assert.deepEqual(coordinator.getProgress(), {
    completed: 1,
    total: 3,
    percent: (1 / 3) * 100,
  });
  assert.deepEqual(coordinator.createCellClearPlan(plot.cells[1]), {
    ok: true,
    progress: 50,
    completed: false,
  });
  assert.deepEqual(coordinator.createCellClearPlan(plot.cells[0]), {
    ok: false,
    reason: "already-cleared",
    progress: 100,
  });
  assert.equal(coordinator.api.getProgress, coordinator.getProgress);
  assert.equal(coordinator.api.createCellClearPlan, coordinator.createCellClearPlan);
});

test("rebuilds completed foundation visuals through the scene runtime", () => {
  const createRoot = () => ({
    children: [],
    add(child) { this.children.push(child); },
    remove(child) { this.children.splice(this.children.indexOf(child), 1); },
  });
  const foundationRoot = createRoot();
  const plot = {
    root: createRoot(),
    cells: [],
    fenceRoot: createRoot(),
    fenceLinkRoot: createRoot(),
    claimPreviewRoot: createRoot(),
    structureRoot: createRoot(),
    foundationRoot,
    foundations: [{ id: "foundation-1", status: "completed" }],
  };
  const registered = [];
  const unregistered = [];
  const disposed = [];
  const coordinator = createFrontierWastelandCoordinator({
    getPlot: () => plot,
    createGroup: createRoot,
    getClaimActionButtons: () => ({}),
    disposeObject: (mesh) => disposed.push(mesh),
    createFoundationMesh: (foundation) => ({ id: foundation.id }),
    registerFoundationSurface: (mesh) => registered.push(mesh),
    unregisterFoundationSurface: (mesh) => unregistered.push(mesh),
  });

  coordinator.rebuildFoundations();
  const firstMesh = foundationRoot.children[0];
  coordinator.rebuildFoundations();

  assert.equal(registered.length, 2);
  assert.deepEqual(unregistered, [firstMesh]);
  assert.deepEqual(disposed, [firstMesh]);
  assert.equal(foundationRoot.children.length, 1);
});

test("forwards structure placement keys into build checks", () => {
  const createRoot = () => ({
    children: [],
    add(child) { this.children.push(child); },
    remove(child) { this.children.splice(this.children.indexOf(child), 1); },
  });
  const cell = { row: 1, col: 2 };
  const claim = { ownerId: "owner", landId: "land-1", status: "completed" };
  const plot = {
    root: createRoot(),
    cells: [cell],
    claims: [claim],
    structures: [],
    foundations: [{ landId: "land-1", ownerId: "owner", status: "completed" }],
  };
  let receivedPlacementKey = "";
  const coordinator = createFrontierWastelandCoordinator({
    getPlot: () => plot,
    createGroup: createRoot,
    getOwnerId: () => "owner",
    getClaimActionButtons: () => ({}),
    controller: {
      getSelectedStructureItemId: () => "woodWall",
      isBuildModeActive: () => true,
      getBuildRotationQuarter: () => 1,
      isFencePlacementMode: () => false,
    },
    getBuildPart: () => ({ slot: "wall" }),
    getStructurePlacementKey: (targetCell, slot, rotationQuarter) => (
      `${slot}:${targetCell.row}:${targetCell.col}:${rotationQuarter}`
    ),
    canBuildOnCell: (options) => {
      receivedPlacementKey = options.structurePlacementKey;
      return { ok: true };
    },
    getInventorySlots: () => [{ itemId: "wastelandLandDeed", landId: "land-1", ownerId: "owner" }],
    isNftInventoryEntry: () => false,
    getSlotItemId: (entry) => entry.itemId,
    landDeedItemId: "wastelandLandDeed",
  });

  assert.equal(coordinator.getBuildCheck(cell).ok, true);
  assert.equal(receivedPlacementKey, "wall:1:2:1");
});
