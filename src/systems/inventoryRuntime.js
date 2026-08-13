import {
  addEntryToInventory,
  addEntryToStorage,
  addItem,
  consumeItem,
  createPartialInventoryEntry,
  equipFirstOwnedInventoryItem,
  findFirstEmptySlot,
  findFirstSlotWithItem,
  findInventorySlotIndexByEntry,
  getEquippedItemForSlot,
  getEquippedItemRef,
  getInventorySlotEntryByEntry,
  getItemCount,
  hasItem,
  moveInventoryEntryToStorage,
  moveStorageEntryToInventory,
  setEquippedItem,
} from "./inventory.js";

export function createInventoryRuntime({
  inventory,
  personalStorage,
  itemDefs,
  getSlotItemId,
  getSlotItemCount,
  isNftInventoryEntry,
  normalizeInventorySlotEntry,
  normalizeEquippedItemRef,
  createInventorySlotEntry,
  createEquippedItemRef,
  getInventoryStackMax,
  getInventoryEntryEquipSlot,
  isSameInventoryEntryAsEquipped,
  isQuestCriticalItemBlockedFromDiscard,
  getQuickUseAssignState,
  setQuickUseAssignState,
  onCreditsChanged,
}) {
  let playerCredits = 0;

  function findInventorySlotIndex(entry) {
    return findInventorySlotIndexByEntry(inventory.slots, entry, {
      isNftInventoryEntry,
      getSlotItemId,
    });
  }

  function getInventorySlotEntry(entry) {
    return getInventorySlotEntryByEntry(inventory.slots, entry, {
      isNftInventoryEntry,
      getSlotItemId,
    });
  }

  function findFirstEmptyInventorySlot() {
    return findFirstEmptySlot(inventory.slots);
  }

  function findFirstInventorySlotWithItem(itemId) {
    return findFirstSlotWithItem(inventory.slots, itemId, { getSlotItemId });
  }

  function getOwnedItemCount(itemId) {
    return getItemCount(inventory.slots, itemId, { getSlotItemId, getSlotItemCount });
  }

  function hasOwnedItem(itemId) {
    return hasItem(inventory.slots, itemId, { getItemCount: getOwnedItemCount });
  }

  function createPartialEntry(entry, count) {
    return createPartialInventoryEntry(entry, count, {
      normalizeInventorySlotEntry,
      isNftInventoryEntry,
      getSlotItemCount,
      createInventorySlotEntry,
    });
  }

  function addEntryToPersonalStorage(entry, count = getSlotItemCount(entry)) {
    return addEntryToStorage(personalStorage.slots, entry, count, {
      createPartialInventoryEntry: createPartialEntry,
      getSlotItemId,
      getInventoryStackMax,
      getSlotItemCount,
      isNftInventoryEntry,
      createInventorySlotEntry,
    });
  }

  function addEntryToPlayerInventory(entry, count = getSlotItemCount(entry)) {
    return addEntryToInventory(inventory.slots, entry, count, {
      createPartialInventoryEntry: createPartialEntry,
      getSlotItemId,
      getInventoryStackMax,
      getSlotItemCount,
      isNftInventoryEntry,
      createInventorySlotEntry,
    });
  }

  function getEquippedRef(slotId) {
    return getEquippedItemRef(inventory.equipped, slotId);
  }

  function getEquippedItem(slotId) {
    return getEquippedItemForSlot(inventory.equipped, slotId);
  }

  function setEquippedRef(slotId, itemOrRef) {
    setEquippedItem(inventory.equipped, slotId, itemOrRef, normalizeEquippedItemRef);
  }

  function pruneQuickUseBindings() {
    for (const key of Object.keys(inventory.quickUse)) {
      const itemId = inventory.quickUse[key]?.itemId;
      if (itemId && !hasOwnedItem(itemId)) inventory.quickUse[key] = null;
    }
    const pending = getQuickUseAssignState();
    if (pending && !hasOwnedItem(pending.itemId)) setQuickUseAssignState(null);
  }

  function canDiscard(entry) {
    if (!entry) return { ok: false, reason: "아이템 정보가 없습니다." };
    if (isNftInventoryEntry(entry)) return { ok: false, reason: "NFT 아이템은 버릴 수 없습니다." };
    const itemId = getSlotItemId(entry);
    if (itemDefs[itemId]?.isAuthorityItem) return { ok: false, reason: "권한 아이템은 버릴 수 없습니다." };
    const equipSlot = getInventoryEntryEquipSlot(entry);
    if (equipSlot && isSameInventoryEntryAsEquipped(entry, getEquippedRef(equipSlot))) {
      return { ok: false, reason: "장착 중인 아이템은 먼저 해제해야 합니다." };
    }
    if (isQuestCriticalItemBlockedFromDiscard(entry)) {
      return { ok: false, reason: "핵심 퀘스트 아이템은 버릴 수 없습니다." };
    }
    return getSlotItemCount(entry) > 0
      ? { ok: true }
      : { ok: false, reason: "버릴 수량이 없습니다." };
  }

  function canStore(entry) {
    if (!entry) return { ok: false, reason: "아이템 정보가 없습니다." };
    if (isNftInventoryEntry(entry)) return { ok: false, reason: "NFT 아이템은 창고에 보관할 수 없습니다." };
    const itemId = getSlotItemId(entry);
    if (itemDefs[itemId]?.isAuthorityItem) return { ok: false, reason: "권한 아이템은 창고에 보관할 수 없습니다." };
    const equipSlot = getInventoryEntryEquipSlot(entry);
    if (equipSlot && isSameInventoryEntryAsEquipped(entry, getEquippedRef(equipSlot))) {
      return { ok: false, reason: "장착 중인 아이템은 먼저 해제해야 합니다." };
    }
    return isQuestCriticalItemBlockedFromDiscard(entry)
      ? { ok: false, reason: "핵심 퀘스트 아이템은 창고에 보관할 수 없습니다." }
      : { ok: true };
  }

  function moveToStorage(entry, count = getSlotItemCount(entry)) {
    return moveInventoryEntryToStorage(inventory.slots, personalStorage.slots, entry, count, {
      findInventorySlotIndexByEntry: findInventorySlotIndex,
      canMoveInventoryEntryToPersonalStorage: canStore,
      addEntryToStorage: addEntryToPersonalStorage,
      getSlotItemCount,
      pruneQuickUseBindings,
    });
  }

  function moveToInventory(storageIndex, count = null) {
    return moveStorageEntryToInventory(inventory.slots, personalStorage.slots, storageIndex, count, {
      addEntryToInventory: addEntryToPlayerInventory,
      getSlotItemCount,
    });
  }

  function addItemToInventory(itemId, count = 1) {
    return addItem(inventory.slots, itemDefs, itemId, count, {
      getSlotItemId,
      getInventoryStackMax,
      isNftInventoryEntry,
      getSlotItemCount,
      createInventorySlotEntry,
    });
  }

  function consumeInventoryItem(itemId, count = 1) {
    return consumeItem(inventory.slots, itemId, count, {
      getItemCount: getOwnedItemCount,
      getSlotItemId,
      isNftInventoryEntry,
      getSlotItemCount,
      pruneQuickUseBindings,
    });
  }

  function equipFirstOwnedItem(slotId, itemId) {
    return equipFirstOwnedInventoryItem(inventory, slotId, itemId, {
      findFirstSlotWithItem: findFirstInventorySlotWithItem,
      normalizeInventorySlotEntry,
      setEquippedItem: setEquippedRef,
      createEquippedItemRef,
    });
  }

  function clampCredits(value) {
    return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  }

  function setCredits(value) {
    playerCredits = clampCredits(value);
    onCreditsChanged?.(playerCredits);
  }

  function grantCredits(amount) {
    setCredits(playerCredits + amount);
  }

  function spendCredits(amount) {
    const normalized = clampCredits(amount);
    if (playerCredits < normalized) return false;
    setCredits(playerCredits - normalized);
    return true;
  }

  return {
    findInventorySlotIndex,
    getInventorySlotEntry,
    findFirstEmptyInventorySlot,
    findFirstInventorySlotWithItem,
    getOwnedItemCount,
    hasOwnedItem,
    addEntryToPersonalStorage,
    addEntryToPlayerInventory,
    moveToStorage,
    moveToInventory,
    addItemToInventory,
    consumeInventoryItem,
    getEquippedRef,
    getEquippedItem,
    setEquippedRef,
    equipFirstOwnedItem,
    pruneQuickUseBindings,
    canDiscard,
    canStore,
    clampCredits,
    getCredits: () => playerCredits,
    setCredits,
    grantCredits,
    canAffordCredits: (amount) => playerCredits >= clampCredits(amount),
    spendCredits,
  };
}
