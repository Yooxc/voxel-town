export const RESIDENCE_MAP_ID = "거주구역";

export const GROUND_SIZE = 100;
export const FRONTIER_GROUND_SIZE = 50;
export const START_X = 0;
export const START_Z = 0;
export const START_RADIUS = 5.0;
export const START_RING_OPEN_RATIO = 0.20;
export const START_RING_OPEN_CENTER = Math.PI / 2;
export const START_RING_THICKNESS = 1.275;
export const CAMP_MAP_X = 0;
export const CAMP_MAP_Z = -126;
export const FRONTIER_MAP_X = 0;
export const FRONTIER_MAP_Z = -218;
export const MAP_GATE_RADIUS = 1.15;

export function isInStartRingOpening(
  angle,
  openCenter = START_RING_OPEN_CENTER,
  openRatio = START_RING_OPEN_RATIO
) {
  const d = Math.atan2(Math.sin(angle - openCenter), Math.cos(angle - openCenter));
  const openHalf = Math.PI * openRatio;
  return Math.abs(d) <= openHalf;
}

export function isBlockedByStartRingPosition({
  x,
  z,
  startWallOn,
  startX = START_X,
  startZ = START_Z,
  startRadius = START_RADIUS,
  startRingThickness = START_RING_THICKNESS,
  openCenter = START_RING_OPEN_CENTER,
  openRatio = START_RING_OPEN_RATIO,
  playerRadius = 0.55,
}) {
  if (!startWallOn) return false;

  const dx = x - startX;
  const dz = z - startZ;
  const dist = Math.hypot(dx, dz);
  const inner = startRadius - startRingThickness * 0.5 - playerRadius;
  const outer = startRadius + startRingThickness * 0.5 + playerRadius;

  if (dist < inner || dist > outer) return false;

  const angle = Math.atan2(dz, dx);
  return !isInStartRingOpening(angle, openCenter, openRatio);
}

export function isCrossingBlockedStartRingPosition({
  prevX,
  prevZ,
  nextX,
  nextZ,
  startWallOn,
  startX = START_X,
  startZ = START_Z,
  startRadius = START_RADIUS,
  openCenter = START_RING_OPEN_CENTER,
  openRatio = START_RING_OPEN_RATIO,
}) {
  if (!startWallOn) return false;

  const pdx = prevX - startX;
  const pdz = prevZ - startZ;
  const ndx = nextX - startX;
  const ndz = nextZ - startZ;
  const prevDist = Math.hypot(pdx, pdz);
  const nextDist = Math.hypot(ndx, ndz);

  const wasInside = prevDist < startRadius;
  const isInside = nextDist < startRadius;
  if (wasInside === isInside) return false;

  const denom = nextDist - prevDist;
  let t = 0.5;
  if (Math.abs(denom) > 1e-6) {
    t = (startRadius - prevDist) / denom;
    t = Math.max(0, Math.min(1, t));
  }
  const cx = prevX + (nextX - prevX) * t;
  const cz = prevZ + (nextZ - prevZ) * t;
  const crossingAngle = Math.atan2(cz - startZ, cx - startX);

  return !isInStartRingOpening(crossingAngle, openCenter, openRatio);
}

export function resolveStartRingPenetrationPosition({
  currentPos,
  prevPos = null,
  startWallOn,
  startX = START_X,
  startZ = START_Z,
  startRadius = START_RADIUS,
  startRingThickness = START_RING_THICKNESS,
  openCenter = START_RING_OPEN_CENTER,
  openRatio = START_RING_OPEN_RATIO,
}) {
  if (!startWallOn) return;

  const dx = currentPos.x - startX;
  const dz = currentPos.z - startZ;
  const dist = Math.hypot(dx, dz);
  const playerRadius = 0.55;
  const inner = startRadius - startRingThickness * 0.5 - playerRadius;
  const outer = startRadius + startRingThickness * 0.5 + playerRadius;
  if (dist < inner || dist > outer) return;

  const angle = Math.atan2(dz, dx);
  if (isInStartRingOpening(angle, openCenter, openRatio)) return;

  const eps = 0.02;
  const nx = dist > 1e-5 ? dx / dist : 1;
  const nz = dist > 1e-5 ? dz / dist : 0;
  const prevDist = prevPos ? Math.hypot(prevPos.x - startX, prevPos.z - startZ) : dist;

  if (prevDist <= startRadius) {
    currentPos.x = startX + nx * (inner - eps);
    currentPos.z = startZ + nz * (inner - eps);
  } else {
    currentPos.x = startX + nx * (outer + eps);
    currentPos.z = startZ + nz * (outer + eps);
  }
}

export function isStartRingTransitionBlocked({
  x0,
  z0,
  x1,
  z1,
  startWallOn,
  startX = START_X,
  startZ = START_Z,
  startRadius = START_RADIUS,
  startRingThickness = START_RING_THICKNESS,
  openCenter = START_RING_OPEN_CENTER,
  openRatio = START_RING_OPEN_RATIO,
}) {
  if (!startWallOn) return false;

  const dist = Math.hypot(x1 - x0, z1 - z0);
  const steps = Math.max(2, Math.ceil(dist / 0.08));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    if (
      isBlockedByStartRingPosition({
        x,
        z,
        startWallOn,
        startX,
        startZ,
        startRadius,
        startRingThickness,
        openCenter,
        openRatio,
      })
    ) {
      return true;
    }
  }
  return false;
}

export function isPositionInConnectorTunnel(x, z, connectorTunnelZones) {
  for (const zone of connectorTunnelZones) {
    if (
      z < zone.maxZ &&
      z > zone.minZ &&
      Math.abs(x - zone.centerX) <= zone.halfWidth
    ) {
      return true;
    }
  }
  return false;
}

export function getEffectiveAirMapIdForPosition(currentMapId, x, z, connectorTunnelZones) {
  return isPositionInConnectorTunnel(x, z, connectorTunnelZones) ? null : currentMapId;
}

export function getCurrentMapIdFromPosition({
  playerZ,
  isInResidenceZone = false,
  mineDoorThresholdZ,
  campDoorThresholdZ,
  campNorthDoorThresholdZ,
  frontierDoorThresholdZ,
  currentMapId = "광산맵",
  residenceMapId = RESIDENCE_MAP_ID,
}) {
  if (isInResidenceZone) return residenceMapId;
  if (playerZ <= frontierDoorThresholdZ) return "개척지";
  if (playerZ <= campDoorThresholdZ && playerZ > campNorthDoorThresholdZ) return "폐광맵";
  if (playerZ >= mineDoorThresholdZ) return "광산맵";
  return currentMapId;
}
