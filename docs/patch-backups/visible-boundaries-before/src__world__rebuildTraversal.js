import { getRebuildTerrainHeight, isPointInPolygon, projectToSegment } from "./rebuildLayout.js";

export function createRebuildTraversal(layout, footOffset = 0) {
  const route = [{ x: layout.origin.x - 24, z: layout.origin.z - 12 }, ...layout.generalMine.pathPoints];
  const polygon = layout.generalMine.floorPolygon;
  const onRoute = (x, z) => route.slice(1).some((b, i) => projectToSegment(x, z, route[i], b).distance <= 3.45);
  const isWest = (x) => x < layout.origin.x - 25;
  const inFloor = (x, z) => isPointInPolygon(x, z, polygon) && polygon.every((a, i) => (
    projectToSegment(x, z, a, polygon[(i + 1) % polygon.length]).distance >= 0.5
  ));
  function isInside(x, z) {
    if (!isWest(x, z)) return true;
    return onRoute(x, z) || inFloor(x, z);
  }
  function prepare(player) {
    const p = player.position;
    if (!isWest(p.x, p.z)) return;
    if (!isInside(p.x, p.z)) {
      // A saved position can be outside the revised terrain. Recover to the nearest route, not a map reset.
      const candidates = route.slice(1).map((b, i) => projectToSegment(p.x, p.z, route[i], b));
      const target = candidates.sort((a, b) => a.distance - b.distance)[0];
      p.x = target.x;
      p.z = target.z;
    }
    const floorY = getRebuildTerrainHeight(p.x, p.z, layout.origin) + footOffset + 0.06;
    if (p.y < floorY - 0.3) p.y = floorY;
  }
  return { isInside, prepare };
}
