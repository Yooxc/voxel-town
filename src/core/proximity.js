export function findNearestByPosition({
  entries,
  playerPosition,
  radius,
  getPosition = (entry) => entry?.position,
  isEligible = () => true,
}) {
  const radiusSquared = radius * radius;
  let nearest = null;
  let nearestDistanceSquared = radiusSquared;
  for (const entry of entries ?? []) {
    if (!isEligible(entry)) continue;
    const position = getPosition(entry);
    if (!position) continue;
    const dx = position.x - playerPosition.x;
    const dz = position.z - playerPosition.z;
    const distanceSquared = dx * dx + dz * dz;
    if (distanceSquared < nearestDistanceSquared) {
      nearest = entry;
      nearestDistanceSquared = distanceSquared;
    }
  }
  return nearest;
}
