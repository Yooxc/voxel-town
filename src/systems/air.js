export const AIR_GAUGE_MAX = 100;
export const AIR_CANISTER_RESTORE_AMOUNT = 34;
export const AIR_RECOVERY_PER_SECOND = 1.1;

export const MAP_POLLUTION_CONFIG = {
  "폐광": {
    displayName: "폐광",
    drainPerSecondAtZeroPurify: 2.25,
    purifierPowderCost: 1,
    purifierGain: 12,
  },
  "개척지": {
    displayName: "개척지",
    drainPerSecondAtZeroPurify: 2.5,
    purifierPowderCost: 1,
    purifierGain: 12,
  },
};

export function clampMapPurificationValue(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

export function getMapPollutionConfig(mapId, mapPollutionConfig = MAP_POLLUTION_CONFIG) {
  return mapPollutionConfig[mapId] ?? null;
}

export function isPollutedMap(mapId, mapPollutionConfig = MAP_POLLUTION_CONFIG) {
  return Boolean(getMapPollutionConfig(mapId, mapPollutionConfig));
}

export function getMapPurificationValue(
  mapId,
  mapPurificationProgress,
  mapPollutionConfig = MAP_POLLUTION_CONFIG
) {
  if (!isPollutedMap(mapId, mapPollutionConfig)) return 0;
  return clampMapPurificationValue(mapPurificationProgress?.[mapId] ?? 0);
}

export function setMapPurificationValue(
  mapId,
  value,
  mapPurificationProgress,
  mapPollutionConfig = MAP_POLLUTION_CONFIG
) {
  if (!getMapPollutionConfig(mapId, mapPollutionConfig)) return false;
  mapPurificationProgress[mapId] = clampMapPurificationValue(value);
  return true;
}

export function resetAllMapPurificationValues(
  mapPurificationProgress,
  mapPollutionConfig = MAP_POLLUTION_CONFIG
) {
  for (const mapId of Object.keys(mapPollutionConfig)) {
    setMapPurificationValue(mapId, 0, mapPurificationProgress, mapPollutionConfig);
  }
}

export function getCurrentAirDrainPerSecond(
  effectiveMapId,
  mapPurificationProgress,
  mapPollutionConfig = MAP_POLLUTION_CONFIG
) {
  const cfg = getMapPollutionConfig(effectiveMapId, mapPollutionConfig);
  if (!cfg) return 0;
  const purifyRatio =
    getMapPurificationValue(effectiveMapId, mapPurificationProgress, mapPollutionConfig) / 100;
  return cfg.drainPerSecondAtZeroPurify * Math.pow(1 - purifyRatio, 1.1);
}

export function canRecoverAirInMap(
  mapId,
  mapPurificationProgress,
  mapPollutionConfig = MAP_POLLUTION_CONFIG
) {
  if (mapId == null) return true;
  if (!isPollutedMap(mapId, mapPollutionConfig)) return true;
  return getMapPurificationValue(mapId, mapPurificationProgress, mapPollutionConfig) >= 100;
}

export function getMapPollutionVisualStrength(
  mapId,
  mapPurificationProgress,
  mapPollutionConfig = MAP_POLLUTION_CONFIG
) {
  if (!isPollutedMap(mapId, mapPollutionConfig)) return 0;
  const purifyRatio =
    getMapPurificationValue(mapId, mapPurificationProgress, mapPollutionConfig) / 100;
  return Math.pow(1 - purifyRatio, 1.08);
}

export function getLowAirBlurStrength(playerAirCurrent, playerAirMax) {
  const airRatio =
    playerAirMax > 0 ? Math.max(0, Math.min(1, playerAirCurrent / playerAirMax)) : 1;
  if (airRatio >= 0.5) return 0;
  if (airRatio >= 0.2) {
    return ((0.5 - airRatio) / 0.3) * 0.6;
  }
  const severeFactor = Math.max(0, (0.2 - airRatio) / 0.2);
  return 0.6 + Math.pow(severeFactor, 1.16) * 1.3;
}

export function getAirOverlayVisualState({
  localPollutionStrength,
  playerAirCurrent,
  playerAirMax,
  overlayMaxOpacity,
  lowAirEdgeBlurMaxPx,
}) {
  const lowAirBlurStrength = getLowAirBlurStrength(playerAirCurrent, playerAirMax);
  const overlayOpacity = Math.min(
    overlayMaxOpacity,
    localPollutionStrength * 0.12 + lowAirBlurStrength * 0.96
  );
  const blurPx = Math.min(
    lowAirEdgeBlurMaxPx,
    localPollutionStrength * 2.4 + lowAirBlurStrength * lowAirEdgeBlurMaxPx
  );
  return {
    overlayOpacity,
    blurPx,
    lowAirBlurStrength,
  };
}

export function updateAirValueForFrame({
  currentAir,
  maxAir,
  dt,
  effectiveMapId,
  mapPurificationProgress,
  mapPollutionConfig = MAP_POLLUTION_CONFIG,
  recoveryPerSecond = AIR_RECOVERY_PER_SECOND,
}) {
  let nextAir = currentAir;
  let depletedThisFrame = false;

  if (canRecoverAirInMap(effectiveMapId, mapPurificationProgress, mapPollutionConfig)) {
    nextAir = Math.min(maxAir, currentAir + recoveryPerSecond * dt);
  } else if (isPollutedMap(effectiveMapId, mapPollutionConfig)) {
    const purify = getMapPurificationValue(effectiveMapId, mapPurificationProgress, mapPollutionConfig);
    if (purify < 100) {
      nextAir = Math.max(
        0,
        currentAir -
          getCurrentAirDrainPerSecond(effectiveMapId, mapPurificationProgress, mapPollutionConfig) * dt
      );
      depletedThisFrame = currentAir > 0 && nextAir <= 0;
    }
  }

  return {
    nextAir,
    depletedThisFrame,
  };
}
