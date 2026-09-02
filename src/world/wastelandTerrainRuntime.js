import { createDeformableTerrain } from "./deformableTerrain.js";
import { createDeformableTerrainMesh } from "./deformableTerrainMesh.js";

const TERRAIN_SEGMENTS_PER_CELL = 8;
const TERRAIN_BASE_Y = 0.145;
const FOUNDATION_SUBGRADE_DEPTH = 0.62;

export function createWastelandTerrainRuntime({ width, depth, rows, cols, cellSize, centerX = 0, centerZ = 0 }) {
  const terrain = createDeformableTerrain({
    width,
    depth,
    segmentsX: cols * TERRAIN_SEGMENTS_PER_CELL,
    segmentsZ: rows * TERRAIN_SEGMENTS_PER_CELL,
    maxDepth: 1.5,
  });
  const terrainMesh = createDeformableTerrainMesh({
    terrain,
    color: 0x9a8065,
    roughness: 0.98,
  });
  terrainMesh.mesh.name = "DIGGABLE_frontier_wasteland_ground";

  function isInsideBounds(localX, localZ, bounds) {
    if (!bounds) return false;
    const minX = -width * 0.5 + bounds.minCol * cellSize;
    const maxX = -width * 0.5 + (bounds.maxCol + 1) * cellSize;
    const minZ = -depth * 0.5 + bounds.minRow * cellSize;
    const maxZ = -depth * 0.5 + (bounds.maxRow + 1) * cellSize;
    return localX >= minX && localX <= maxX && localZ >= minZ && localZ <= maxZ;
  }

  function digAtWorldPoint({ x, z, bounds, radius = 1.4, amount = 0.3 }) {
    const localX = x - centerX;
    const localZ = z - centerZ;
    if (!isInsideBounds(localX, localZ, bounds)) return { ok: false, reason: "outside-claim" };
    const result = terrain.digAt({
      x: localX,
      z: localZ,
      radius,
      amount,
      canDigAt: (pointX, pointZ) => isInsideBounds(pointX, pointZ, bounds),
    });
    if (!result.changed) return { ok: false, reason: "max-depth" };
    terrainMesh.applyHeights();
    return { ok: true, changedVertices: result.changedIndices.length };
  }

  function getCellProgress(cell, requiredDepth = 0.6) {
    if (!cell) return 0;
    const minColumn = Math.max(0, Math.round(cell.col * TERRAIN_SEGMENTS_PER_CELL));
    const maxColumn = Math.min(terrain.segmentsX, Math.round((cell.col + 1) * TERRAIN_SEGMENTS_PER_CELL));
    const minRow = Math.max(0, Math.round(cell.row * TERRAIN_SEGMENTS_PER_CELL));
    const maxRow = Math.min(terrain.segmentsZ, Math.round((cell.row + 1) * TERRAIN_SEGMENTS_PER_CELL));
    let prepared = 0;
    let total = 0;
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let column = minColumn; column <= maxColumn; column += 1) {
        total += 1;
        if (-terrain.heights[terrain.getIndex(column, row)] >= requiredDepth) prepared += 1;
      }
    }
    return total > 0 ? Math.round((prepared / total) * 100) : 0;
  }

  // Compatibility path for saves made before free-form digging existed.
  function applyLegacyCellProgress(cell, progress) {
    if (!cell || Number(progress) <= 0) return;
    const depthAmount = terrain.maxDepth * (Math.min(100, Number(progress) || 0) / 100);
    const localX = cell.x - centerX;
    const localZ = cell.z - centerZ;
    const radius = Math.max(0.2, cellSize * 0.7);
    for (let row = 0; row < terrain.rows; row += 1) {
      for (let column = 0; column < terrain.columns; column += 1) {
        const index = terrain.getIndex(column, row);
        const point = terrain.getVertexPosition(column, row);
        const distance = Math.hypot(point.x - localX, point.z - localZ);
        if (distance > radius) continue;
        const falloff = (1 - distance / radius) ** 2;
        terrain.heights[index] = Math.min(terrain.heights[index], -depthAmount * falloff);
      }
    }
  }

  function applyCellProgress(cell, progress) {
    applyLegacyCellProgress(cell, progress);
    terrainMesh.applyHeights();
  }

  function gradeFoundation(bounds, targetDepth = FOUNDATION_SUBGRADE_DEPTH) {
    const depthAmount = Math.max(0, Math.min(terrain.maxDepth, Number(targetDepth) || 0));
    const targetHeight = -depthAmount;
    let changedVertices = 0;
    for (let row = 0; row < terrain.rows; row += 1) {
      for (let column = 0; column < terrain.columns; column += 1) {
        const point = terrain.getVertexPosition(column, row);
        if (!isInsideBounds(point.x, point.z, bounds)) continue;
        const index = terrain.getIndex(column, row);
        if (Math.abs(terrain.heights[index] - targetHeight) < 1e-6) continue;
        terrain.heights[index] = targetHeight;
        changedVertices += 1;
      }
    }
    if (changedVertices > 0) terrainMesh.applyHeights();
    return { changedVertices, targetDepth: depthAmount };
  }

  function getHeightAt(localX, localZ) {
    const normalizedX = Math.max(0, Math.min(1, (localX + width * 0.5) / width));
    const normalizedZ = Math.max(0, Math.min(1, (localZ + depth * 0.5) / depth));
    const column = normalizedX * terrain.segmentsX;
    const row = normalizedZ * terrain.segmentsZ;
    const left = Math.floor(column);
    const top = Math.floor(row);
    const right = Math.min(terrain.segmentsX, left + 1);
    const bottom = Math.min(terrain.segmentsZ, top + 1);
    const tx = column - left;
    const tz = row - top;
    const topHeight = terrain.heights[terrain.getIndex(left, top)] * (1 - tx)
      + terrain.heights[terrain.getIndex(right, top)] * tx;
    const bottomHeight = terrain.heights[terrain.getIndex(left, bottom)] * (1 - tx)
      + terrain.heights[terrain.getIndex(right, bottom)] * tx;
    return topHeight * (1 - tz) + bottomHeight * tz;
  }

  function reset() {
    terrain.reset();
    terrainMesh.applyHeights();
  }

  return {
    mesh: terrainMesh.mesh,
    terrain,
    digAtWorldPoint,
    getCellProgress,
    applyCellProgress,
    applyLegacyCellProgress,
    gradeFoundation,
    applyHeights: terrainMesh.applyHeights,
    serializeHeights: () => Array.from(terrain.heights),
    restoreHeights: (heights) => {
      if (!Array.isArray(heights) || heights.length !== terrain.heights.length) return false;
      terrain.heights.set(heights.map((height) => Math.max(-terrain.maxDepth, Math.min(0, Number(height) || 0))));
      terrainMesh.applyHeights();
      return true;
    },
    getSurfaceY(cell) {
      if (!cell) return 0;
      return TERRAIN_BASE_Y + getHeightAt(cell.x - centerX, cell.z - centerZ);
    },
    reset,
  };
}
