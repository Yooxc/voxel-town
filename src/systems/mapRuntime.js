import {
  findTriggeredMapGate,
  getCurrentMapIdForPlayer,
  getEffectiveAirMapIdForPlayer,
  isPlayerPositionInConnectorTunnel,
} from "./maps.js";

export function createMapRuntime({
  mapGates,
  connectorTunnelZones,
  getPlayerPosition,
  getCurrentMapId,
  setCurrentMapId,
  getMapThresholds,
  isInResidenceZone,
  residenceMapId,
  now = () => performance.now(),
}) {
  let transitionLockUntil = 0;
  let transitionPending = null;

  function registerMapGate(entry) {
    mapGates.push(entry);
    return entry;
  }

  function registerConnectorTunnelZone(centerX, minZ, maxZ, halfWidth = 7.2) {
    const zone = {
      centerX,
      minZ: Math.min(minZ, maxZ),
      maxZ: Math.max(minZ, maxZ),
      halfWidth,
    };
    connectorTunnelZones.push(zone);
    return zone;
  }

  function findTriggeredGate() {
    return findTriggeredMapGate({
      mapGates,
      currentMapId: getCurrentMapId(),
      playerPosition: getPlayerPosition(),
      isLocked: now() < transitionLockUntil,
    });
  }

  function updateCurrentMap() {
    const nextMapId = getCurrentMapIdForPlayer({
      playerPosition: getPlayerPosition(),
      isInResidenceZone: isInResidenceZone(),
      ...getMapThresholds(),
      currentMapId: getCurrentMapId(),
      residenceMapId,
    });
    setCurrentMapId(nextMapId);
    return nextMapId;
  }

  function isInConnectorTunnel() {
    return isPlayerPositionInConnectorTunnel(getPlayerPosition(), connectorTunnelZones);
  }

  function getEffectiveAirMapId() {
    return getEffectiveAirMapIdForPlayer(getCurrentMapId(), getPlayerPosition(), connectorTunnelZones);
  }

  function lockTransition(durationMs) {
    transitionLockUntil = now() + Math.max(0, Number(durationMs) || 0);
  }

  return {
    registerMapGate,
    registerConnectorTunnelZone,
    findTriggeredGate,
    updateCurrentMap,
    isInConnectorTunnel,
    getEffectiveAirMapId,
    lockTransition,
    get transitionPending() { return transitionPending; },
    set transitionPending(value) { transitionPending = value; },
  };
}
