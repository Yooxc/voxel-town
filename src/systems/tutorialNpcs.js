import { findNearestByPosition } from "../core/proximity.js";

export function createTutorialNpcRuntime() {
  const entries = [];

  function register(obj, name, hint = "Space : 대화") {
    const entry = { obj, name, hint };
    entries.push(entry);
    return entry;
  }

  function findNearest(playerPosition, radius = 2.2) {
    return findNearestByPosition({
      entries,
      playerPosition,
      radius,
      getPosition: (entry) => entry?.obj?.position,
      isEligible: (entry) => Boolean(entry?.obj?.parent),
    });
  }

  return { entries, register, findNearest };
}
