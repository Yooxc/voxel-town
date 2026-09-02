function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function createDeformableTerrain({
  width,
  depth,
  segmentsX,
  segmentsZ,
  maxDepth = 1.5,
  getInitialHeight = () => 0,
}) {
  const columns = segmentsX + 1;
  const rows = segmentsZ + 1;
  const originalHeights = new Float32Array(columns * rows);
  const heights = new Float32Array(columns * rows);

  function getIndex(column, row) {
    return row * columns + column;
  }

  function getVertexPosition(column, row) {
    return {
      x: (column / segmentsX - 0.5) * width,
      z: (row / segmentsZ - 0.5) * depth,
    };
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = getIndex(column, row);
      const position = getVertexPosition(column, row);
      const height = Number(getInitialHeight(position.x, position.z)) || 0;
      originalHeights[index] = height;
      heights[index] = height;
    }
  }

  function digAt({ x, z, radius, amount, canDigAt = () => true }) {
    const changedIndices = [];
    const safeRadius = Math.max(0.01, Number(radius) || 0);
    const safeAmount = Math.max(0, Number(amount) || 0);
    if (!canDigAt(x, z) || safeAmount <= 0) return { changedIndices, changed: false };

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const position = getVertexPosition(column, row);
        const distance = Math.hypot(position.x - x, position.z - z);
        if (distance > safeRadius || !canDigAt(position.x, position.z)) continue;

        const index = getIndex(column, row);
        const falloff = (1 - distance / safeRadius) ** 2;
        const minimum = originalHeights[index] - maxDepth;
        const nextHeight = clamp(heights[index] - safeAmount * falloff, minimum, originalHeights[index]);
        if (Math.abs(nextHeight - heights[index]) < 1e-6) continue;
        heights[index] = nextHeight;
        changedIndices.push(index);
      }
    }
    return { changedIndices, changed: changedIndices.length > 0 };
  }

  function reset() {
    heights.set(originalHeights);
    return Array.from({ length: heights.length }, (_value, index) => index);
  }

  return {
    width,
    depth,
    segmentsX,
    segmentsZ,
    columns,
    rows,
    maxDepth,
    heights,
    originalHeights,
    getIndex,
    getVertexPosition,
    digAt,
    reset,
  };
}
