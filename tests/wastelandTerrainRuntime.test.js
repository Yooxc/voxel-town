import test from "node:test";
import assert from "node:assert/strict";
import { createWastelandTerrainRuntime } from "../src/world/wastelandTerrainRuntime.js";

test("applies each wasteland cell's clearing progress as a bounded terrain depression", () => {
  const runtime = createWastelandTerrainRuntime({
    width: 8,
    depth: 8,
    rows: 4,
    cols: 4,
    cellSize: 2,
    centerX: 10,
    centerZ: -10,
  });
  const cell = { row: 1, col: 1, x: 9, z: -11 };

  runtime.applyCellProgress(cell, 100);

  assert.equal(runtime.getSurfaceY(cell), -1.355);
  assert.ok(runtime.terrain.heights.every((height) => height >= -1.5));
  assert.equal(runtime.mesh.name, "DIGGABLE_frontier_wasteland_ground");
});

test("grades the completed foundation footprint below the concrete slab", () => {
  const runtime = createWastelandTerrainRuntime({
    width: 8,
    depth: 8,
    rows: 4,
    cols: 4,
    cellSize: 2,
  });

  const result = runtime.gradeFoundation({ minRow: 1, maxRow: 2, minCol: 1, maxCol: 2 });

  assert.ok(result.changedVertices > 0);
  assert.ok(Math.abs(runtime.getSurfaceY({ x: -1, z: -1 }) - (-0.475)) < 1e-6);
  assert.equal(runtime.getCellProgress({ row: 1, col: 1, x: -1, z: -1 }), 100);
});
