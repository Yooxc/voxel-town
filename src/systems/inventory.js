import { QUICK_USE_ALLOWED_KEYS } from "./items.js";

export function createInitialInventoryState(slotCount = 30) {
  return {
    slots: Array.from({ length: slotCount }, () => null),
    pickaxeLevel: 1,
    mineKeyIssued: false,
    abandonedMineUnlocked: false,
    quickUse: Object.fromEntries(QUICK_USE_ALLOWED_KEYS.map((key) => [key, null])),
    equipped: {
      head: null,
      body: null,
      shoes: null,
      tool: null,
    },
  };
}

export function createInitialPersonalStorageState(slotCount = 20) {
  return {
    slots: Array.from({ length: slotCount }, () => null),
  };
}

export function createQuickUseBinding(itemId, extra = {}) {
  return itemId
    ? {
        kind: "item",
        itemId,
        ...extra,
      }
    : null;
}

export function normalizeQuickUseBinding(rawBinding) {
  if (!rawBinding) return null;
  if (typeof rawBinding === "string") {
    return createQuickUseBinding(rawBinding);
  }
  if (typeof rawBinding === "object" && rawBinding.itemId) {
    return createQuickUseBinding(rawBinding.itemId, rawBinding);
  }
  return null;
}

export function getQuickUseBinding(inventoryState, key) {
  return inventoryState?.quickUse?.[key] ?? null;
}

export function getQuickUseItemId(inventoryState, key) {
  return getQuickUseBinding(inventoryState, key)?.itemId ?? null;
}

export function clearQuickUseBindingForItemId(
  inventoryState,
  itemId,
  allowedKeys = QUICK_USE_ALLOWED_KEYS
) {
  for (const key of allowedKeys) {
    if (getQuickUseItemId(inventoryState, key) === itemId) {
      inventoryState.quickUse[key] = null;
    }
  }
}

export function assignQuickUseKeyToItem(
  inventoryState,
  itemId,
  key,
  allowedKeys = QUICK_USE_ALLOWED_KEYS
) {
  if (!itemId || !allowedKeys.includes(key)) return false;
  clearQuickUseBindingForItemId(inventoryState, itemId, allowedKeys);
  inventoryState.quickUse[key] = createQuickUseBinding(itemId);
  return true;
}

export function getQuickUseKeyForItemId(
  inventoryState,
  itemId,
  allowedKeys = QUICK_USE_ALLOWED_KEYS
) {
  for (const key of allowedKeys) {
    if (getQuickUseItemId(inventoryState, key) === itemId) return key;
  }
  return "";
}

export function findInventorySlotIndexByEntry(slots, entry, { isNftInventoryEntry, getSlotItemId }) {
  if (!entry) return -1;
  if (isNftInventoryEntry(entry)) {
    return slots.findIndex(
      (slot) =>
        slot &&
        slot.kind === "nft" &&
        slot.contractAddress === entry.contractAddress &&
        String(slot.tokenId) === String(entry.tokenId)
    );
  }
  if (entry.instanceId) {
    return slots.findIndex((slot) => slot?.instanceId === entry.instanceId);
  }
  const itemId = getSlotItemId(entry);
  return slots.findIndex((slot) => slot && getSlotItemId(slot) === itemId);
}

export function getInventorySlotEntryByEntry(slots, entry, deps) {
  const idx = findInventorySlotIndexByEntry(slots, entry, deps);
  return idx >= 0 ? slots[idx] : null;
}

export function findFirstEmptySlot(slots) {
  for (let i = 0; i < slots.length; i += 1) {
    if (!slots[i]) return i;
  }
  return -1;
}

export function findFirstSlotWithItem(slots, itemId, { getSlotItemId }) {
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (slot && getSlotItemId(slot) === itemId) return i;
  }
  return -1;
}

export function getItemCount(slots, itemId, { getSlotItemId, getSlotItemCount }) {
  let total = 0;
  for (const slot of slots) {
    if (!slot || getSlotItemId(slot) !== itemId) continue;
    total += getSlotItemCount(slot);
  }
  return total;
}

export function createPartialInventoryEntry(
  entry,
  count,
  { normalizeInventorySlotEntry, isNftInventoryEntry, getSlotItemCount, createInventorySlotEntry }
) {
  const normalizedEntry = normalizeInventorySlotEntry(entry);
  if (!normalizedEntry) return null;
  if (isNftInventoryEntry(normalizedEntry)) return structuredClone(normalizedEntry);
  const safeCount = Math.max(1, Math.min(getSlotItemCount(normalizedEntry), Math.floor(count || 1)));
  const { count: _ignoredCount, itemId, instanceId: _ignoredInstanceId, ...extra } = normalizedEntry;
  return createInventorySlotEntry(itemId, safeCount, extra);
}

export function addEntryToStorage(
  storageSlots,
  entry,
  count,
  {
    createPartialInventoryEntry: createPartialEntry,
    getSlotItemId,
    getInventoryStackMax,
    getSlotItemCount,
    isNftInventoryEntry,
    createInventorySlotEntry,
  }
) {
  const normalizedEntry = createPartialEntry(entry, count);
  if (!normalizedEntry) return false;
  const snapshot = storageSlots.map((slot) => (slot ? structuredClone(slot) : null));
  const itemId = getSlotItemId(normalizedEntry);
  const stackMax = getInventoryStackMax(itemId);
  let remaining = getSlotItemCount(normalizedEntry);

  if (stackMax > 1) {
    for (let i = 0; i < storageSlots.length && remaining > 0; i += 1) {
      const slot = storageSlots[i];
      if (!slot || getSlotItemId(slot) !== itemId || isNftInventoryEntry(slot)) continue;
      const currentCount = getSlotItemCount(slot);
      if (currentCount >= stackMax) continue;
      const addedCount = Math.min(stackMax - currentCount, remaining);
      slot.count += addedCount;
      remaining -= addedCount;
    }
  }

  while (remaining > 0) {
    const empty = findFirstEmptySlot(storageSlots);
    if (empty === -1) {
      for (let i = 0; i < storageSlots.length; i += 1) {
        storageSlots[i] = snapshot[i];
      }
      return false;
    }
    const countToPlace = Math.min(remaining, stackMax);
    const { count: _ignoredCount, itemId: _ignoredItemId, instanceId: _ignoredInstanceId, ...extra } =
      normalizedEntry;
    storageSlots[empty] = createInventorySlotEntry(itemId, countToPlace, extra);
    remaining -= countToPlace;
  }

  return true;
}

export function addEntryToInventory(
  inventorySlots,
  entry,
  count,
  {
    createPartialInventoryEntry: createPartialEntry,
    getSlotItemId,
    getInventoryStackMax,
    getSlotItemCount,
    isNftInventoryEntry,
    createInventorySlotEntry,
  }
) {
  const normalizedEntry = createPartialEntry(entry, count);
  if (!normalizedEntry) return false;
  const itemId = getSlotItemId(normalizedEntry);
  const stackMax = getInventoryStackMax(itemId);
  let remaining = getSlotItemCount(normalizedEntry);

  if (stackMax > 1) {
    for (let i = 0; i < inventorySlots.length && remaining > 0; i += 1) {
      const slot = inventorySlots[i];
      if (!slot || getSlotItemId(slot) !== itemId || isNftInventoryEntry(slot)) continue;
      const currentCount = getSlotItemCount(slot);
      if (currentCount >= stackMax) continue;
      const addedCount = Math.min(stackMax - currentCount, remaining);
      slot.count += addedCount;
      remaining -= addedCount;
    }
  }

  while (remaining > 0) {
    const empty = findFirstEmptySlot(inventorySlots);
    if (empty === -1) return false;
    const countToPlace = Math.min(remaining, stackMax);
    const { count: _ignoredCount, itemId: _ignoredItemId, instanceId: _ignoredInstanceId, ...extra } =
      normalizedEntry;
    inventorySlots[empty] = createInventorySlotEntry(itemId, countToPlace, extra);
    remaining -= countToPlace;
  }

  return true;
}

export function moveInventoryEntryToStorage(
  inventorySlots,
  storageSlots,
  entry,
  count,
  {
    findInventorySlotIndexByEntry: findSlotIndex,
    canMoveInventoryEntryToPersonalStorage,
    addEntryToStorage: addToStorage,
    getSlotItemCount,
    pruneQuickUseBindings,
  }
) {
  const slotIndex = findSlotIndex(entry);
  if (slotIndex < 0) return { ok: false, reason: "인벤토리에서 아이템을 찾을 수 없습니다." };
  const liveEntry = inventorySlots[slotIndex];
  const check = canMoveInventoryEntryToPersonalStorage(liveEntry);
  if (!check.ok) return check;
  const moveCount = Math.max(1, Math.min(getSlotItemCount(liveEntry), Math.floor(count || 1)));
  if (!addToStorage(structuredClone(liveEntry), moveCount)) {
    return { ok: false, reason: "개인 창고가 가득 찼습니다." };
  }
  if (getSlotItemCount(liveEntry) <= moveCount) {
    inventorySlots[slotIndex] = null;
  } else {
    liveEntry.count -= moveCount;
  }
  pruneQuickUseBindings();
  return { ok: true };
}

export function moveStorageEntryToInventory(
  inventorySlots,
  storageSlots,
  storageIndex,
  count,
  { addEntryToInventory: addToInventory, getSlotItemCount }
) {
  if (storageIndex < 0 || storageIndex >= storageSlots.length) {
    return { ok: false, reason: "창고 슬롯을 찾을 수 없습니다." };
  }
  const liveEntry = storageSlots[storageIndex];
  if (!liveEntry) return { ok: false, reason: "비어 있는 창고 슬롯입니다." };
  const moveCount = Math.max(
    1,
    Math.min(getSlotItemCount(liveEntry), Math.floor(count ?? getSlotItemCount(liveEntry)))
  );
  const inventorySnapshot = inventorySlots.map((slot) => (slot ? structuredClone(slot) : null));
  if (!addToInventory(structuredClone(liveEntry), moveCount)) {
    for (let i = 0; i < inventorySlots.length; i += 1) {
      inventorySlots[i] = inventorySnapshot[i];
    }
    return { ok: false, reason: "인벤토리가 가득 찼습니다." };
  }
  if (getSlotItemCount(liveEntry) <= moveCount) {
    storageSlots[storageIndex] = null;
  } else {
    liveEntry.count -= moveCount;
  }
  return { ok: true };
}

export function addItem(
  inventorySlots,
  itemDefs,
  itemId,
  count,
  {
    getSlotItemId,
    getInventoryStackMax,
    isNftInventoryEntry,
    getSlotItemCount,
    createInventorySlotEntry,
  }
) {
  const def = itemDefs[itemId];
  if (!def) return false;
  let remaining = Math.max(0, Math.floor(count));
  if (remaining <= 0) return false;
  const stackMax = getInventoryStackMax(itemId);

  if (stackMax > 1) {
    for (let i = 0; i < inventorySlots.length && remaining > 0; i += 1) {
      const slot = inventorySlots[i];
      if (!slot || getSlotItemId(slot) !== itemId || isNftInventoryEntry(slot)) continue;
      const currentCount = getSlotItemCount(slot);
      if (currentCount >= stackMax) continue;
      const addedCount = Math.min(stackMax - currentCount, remaining);
      slot.count += addedCount;
      remaining -= addedCount;
    }
  }

  while (remaining > 0) {
    const empty = findFirstEmptySlot(inventorySlots);
    if (empty === -1) return false;
    const countToPlace = Math.min(remaining, stackMax);
    inventorySlots[empty] = createInventorySlotEntry(itemId, countToPlace);
    remaining -= countToPlace;
  }
  return true;
}

export function consumeItem(
  inventorySlots,
  itemId,
  count,
  { getItemCount, getSlotItemId, isNftInventoryEntry, getSlotItemCount, pruneQuickUseBindings }
) {
  let remaining = Math.max(0, Math.floor(count));
  if (remaining <= 0) return false;
  if (getItemCount(itemId) < remaining) return false;

  for (let i = 0; i < inventorySlots.length && remaining > 0; i += 1) {
    const slot = inventorySlots[i];
    if (!slot || getSlotItemId(slot) !== itemId || isNftInventoryEntry(slot)) continue;
    const consumeCount = Math.min(getSlotItemCount(slot), remaining);
    slot.count -= consumeCount;
    remaining -= consumeCount;
    if (slot.count <= 0) inventorySlots[i] = null;
  }
  pruneQuickUseBindings();
  return true;
}

export function hasItem(inventorySlots, itemId, { getItemCount }) {
  return getItemCount(itemId) > 0;
}

export function getEquippedItemRef(equippedState, slotId) {
  return equippedState[slotId] ?? null;
}

export function getEquippedItemForSlot(equippedState, slotId) {
  const ref = getEquippedItemRef(equippedState, slotId);
  return ref?.itemId ?? ref?.id ?? null;
}

export function setEquippedItem(equippedState, slotId, itemOrRef, normalizeEquippedItemRef) {
  equippedState[slotId] = normalizeEquippedItemRef(itemOrRef);
}

export function equipFirstOwnedInventoryItem(
  inventoryState,
  slotId,
  itemId,
  {
    findFirstSlotWithItem,
    normalizeInventorySlotEntry,
    setEquippedItem,
    createEquippedItemRef,
  }
) {
  const slotIndex = findFirstSlotWithItem(itemId);
  if (slotIndex === -1) {
    setEquippedItem(slotId, itemId);
    return false;
  }
  const entry = normalizeInventorySlotEntry(inventoryState.slots[slotIndex]);
  if (!entry) {
    setEquippedItem(slotId, itemId);
    return false;
  }
  setEquippedItem(
    slotId,
    createEquippedItemRef(itemId, {
      instanceId: entry.instanceId ?? null,
    })
  );
  return true;
}
