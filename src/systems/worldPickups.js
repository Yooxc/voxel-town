import { findNearestByPosition } from "../core/proximity.js";

export function createWorldPickupRuntime({ getItemName } = {}) {
  const entries = [];

  function register(obj, itemId, text = null) {
    const entry = {
      obj,
      itemId,
      text: text ?? `E : ${getItemName?.(itemId) ?? itemId} 줍기`,
    };
    entries.push(entry);
    obj.userData.pickupItemId = itemId;
    return entry;
  }

  function unregister(obj) {
    const index = entries.findIndex((entry) => entry.obj === obj);
    if (index !== -1) entries.splice(index, 1);
    if (obj?.userData) delete obj.userData.pickupItemId;
  }

  function findNearest(playerPosition, radius = 2) {
    return findNearestByPosition({
      entries,
      playerPosition,
      radius,
      getPosition: (entry) => entry?.obj?.position,
      isEligible: (entry) => Boolean(entry?.obj?.parent),
    });
  }

  return { entries, register, unregister, findNearest };
}
