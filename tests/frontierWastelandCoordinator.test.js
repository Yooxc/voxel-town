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
});
