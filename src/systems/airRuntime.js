import {
  AIR_CANISTER_RESTORE_AMOUNT,
  AIR_RECOVERY_PER_SECOND,
  canRecoverAirInMap,
  getCurrentAirDrainPerSecond,
  getMapPollutionConfig,
  getMapPurificationValue,
  getNextMapPurificationValue,
  isPollutedMap,
  setMapPurificationValue,
  updateAirValueForFrame,
} from "./air.js";

export function createAirRuntime({
  initialAir,
  maxAir: initialMaxAir,
  mapPurificationProgress,
  mapPollutionConfig,
  hasItem,
  consumeItem,
  getItemCount,
  onAirChanged,
  recoveryPerSecond = AIR_RECOVERY_PER_SECOND,
  canisterRestoreAmount = AIR_CANISTER_RESTORE_AMOUNT,
}) {
  let maxAir = Math.max(1, Number(initialMaxAir) || 1);
  let currentAir = Math.max(0, Math.min(maxAir, Number(initialAir) || 0));

  function setCurrentAir(value) {
    currentAir = Math.max(0, Math.min(maxAir, Number(value) || 0));
    onAirChanged?.(currentAir);
    return currentAir;
  }

  function setMaxAir(value) {
    maxAir = Math.max(1, Number(value) || 1);
    return setCurrentAir(currentAir);
  }

  function getPurification(mapId) {
    return getMapPurificationValue(mapId, mapPurificationProgress, mapPollutionConfig);
  }

  function setPurification(mapId, value) {
    return setMapPurificationValue(mapId, value, mapPurificationProgress, mapPollutionConfig);
  }

  function getHudState(effectiveMapId) {
    const config = getMapPollutionConfig(effectiveMapId, mapPollutionConfig);
    const purification = getPurification(effectiveMapId);
    const recoverable = canRecoverAirInMap(effectiveMapId, mapPurificationProgress, mapPollutionConfig);
    return {
      currentAir,
      maxAir,
      config,
      purification,
      recoverable,
      drainPerSecond: getCurrentAirDrainPerSecond(effectiveMapId, mapPurificationProgress, mapPollutionConfig),
    };
  }

  function updateFrame(dt, effectiveMapId) {
    const result = updateAirValueForFrame({
      currentAir,
      maxAir,
      dt,
      effectiveMapId,
      mapPurificationProgress,
      mapPollutionConfig,
      recoveryPerSecond,
    });
    setCurrentAir(result.nextAir);
    return { ...result, currentAir };
  }

  function useAirCanister() {
    if (!hasItem("freshAirCanister")) return { ok: false, reason: "missing-canister" };
    if (currentAir >= maxAir) return { ok: false, reason: "air-full" };
    if (!consumeItem("freshAirCanister", 1)) return { ok: false, reason: "consume-failed" };
    setCurrentAir(currentAir + canisterRestoreAmount);
    return { ok: true, currentAir };
  }

  function usePurifier(mapId) {
    const config = getMapPollutionConfig(mapId, mapPollutionConfig);
    if (!config) return { ok: false, reason: "missing-config" };
    const currentPurification = getPurification(mapId);
    if (currentPurification >= 100) return { ok: false, reason: "already-purified", config };
    if (!consumeItem("purifyPowder", config.purifierPowderCost)) {
      return { ok: false, reason: "missing-powder", config };
    }
    const purification = getNextMapPurificationValue(currentPurification, config.purifierGain);
    setPurification(mapId, purification);
    return { ok: true, config, purification, completed: purification >= 100 };
  }

  return {
    getCurrentAir: () => currentAir,
    getMaxAir: () => maxAir,
    setCurrentAir,
    setMaxAir,
    getHudState,
    getPurification,
    setPurification,
    isPollutedMap: (mapId) => isPollutedMap(mapId, mapPollutionConfig),
    getPollutionConfig: (mapId) => getMapPollutionConfig(mapId, mapPollutionConfig),
    updateFrame,
    useAirCanister,
    usePurifier,
    getPurifyPowderCount: () => getItemCount("purifyPowder"),
  };
}
