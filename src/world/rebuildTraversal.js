import { getRebuildTerrainHeight } from "./rebuildLayout.js";

export function createRebuildTraversal(layout, footOffset = 0) {
  const bounds = layout.perimeter.safetyBounds;
  function isInside(x, z) {
    return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
  }
  function prepare(player) {
    const p = player.position;
    if (!isInside(p.x, p.z)) {
      const target = layout.arrival.spawn;
      p.x = target.x;
      p.z = target.z;
      p.y = target.y + footOffset + 0.06;
      return;
    }
    // Ordinary grounding owns slopes; only recover a genuine fall through terrain.
    const floorY = getRebuildTerrainHeight(p.x, p.z, layout.origin) + footOffset;
    if (p.y < floorY - 1) p.y = floorY + 0.06;
  }
  return { isInside, prepare };
}
