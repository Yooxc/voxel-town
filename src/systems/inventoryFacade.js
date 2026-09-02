export function createInventoryFacade(ctx) {
  const { inventory, personalStorage, itemDefs, runtime } = ctx;

  function normalizeSlot(entry) { return ctx.normalizeSlot(itemDefs, entry); }
  function createSlot(itemId, count = 1, extra = {}) { return ctx.createSlot(itemDefs, itemId, count, extra); }
  function getEquippedEntry(slotId) {
    const equipped = runtime.getEquippedRef(slotId);
    if (!equipped || ctx.isNftEntry(equipped)) return equipped ?? null;
    return inventory.slots.find((slot) => slot && ctx.isSameAsEquipped(slot, equipped)) ?? equipped;
  }
  function resolveDisplayEntry(entry) {
    if (entry && !ctx.isNftEntry(entry) && typeof entry.instanceId === "string" && entry.instanceId.trim()) {
      const matched = inventory.slots.find((slot) => slot && !ctx.isNftEntry(slot) && slot.instanceId === entry.instanceId);
      if (matched) return { ...entry, ...matched };
    }
    if (entry && !ctx.isNftEntry(entry) && ctx.getSlotItemId(entry) === "pickaxe" && !Number.isFinite(entry.pickaxeLevel)) {
      return { ...entry, pickaxeLevel: inventory.pickaxeLevel };
    }
    return entry;
  }
  function getResolvedPickaxeLevel(entry, fallback = inventory.pickaxeLevel) {
    return ctx.clampPickaxeLevel(Number.isFinite(entry?.pickaxeLevel) ? entry.pickaxeLevel : fallback);
  }
  function getEquippedPickaxeLevel() {
    const entry = getEquippedEntry("tool");
    return entry && ctx.getSlotItemId(entry) === "pickaxe" ? getResolvedPickaxeLevel(entry) : 0;
  }
  function getEntryTooltip(entry) {
    const tooltip = ctx.getEntryTooltipData(itemDefs, resolveDisplayEntry(entry));
    if (!tooltip || !ctx.isQuestCritical(entry)) return tooltip;
    return { ...tooltip, lines: [...tooltip.lines, "퀘스트 아이템"] };
  }
  function getForgeTargetItemId() {
    for (const slotId of ["tool", "head", "body", "shoes"]) {
      const itemId = runtime.getEquippedItem(slotId);
      if (itemId && itemDefs[itemId]?.upgradeKey) return itemId;
    }
    return null;
  }
  function getForgeUpgradeState() {
    const itemId = getForgeTargetItemId();
    return itemId === "pickaxe" ? ctx.getForgeUpgradeState({ targetItemId: itemId, pickaxeLevel: getEquippedPickaxeLevel(), itemDefs }) : null;
  }
  function setCredits(value) { runtime.setCredits(value); ctx.syncCredits(runtime.getCredits()); }
  function grantCredits(value) { runtime.grantCredits(value); ctx.syncCredits(runtime.getCredits()); }
  function spendCredits(value) { const spent = runtime.spendCredits(value); ctx.syncCredits(runtime.getCredits()); return spent; }

  return {
    getDevMaterialItemIds: () => ctx.getDevMaterialItemIds(itemDefs),
    getDevBulkGrantItemIds: () => ctx.getDevBulkGrantItemIds(itemDefs, ctx.stackLimit),
    createEntryInstanceId: ctx.createEntryInstanceId,
    getStackMax: (itemId) => ctx.getStackMax(itemDefs, itemId, ctx.stackLimit),
    createSlot,
    addEntry: (entry) => {
      const normalized = normalizeSlot(entry);
      const index = runtime.findFirstEmptyInventorySlot();
      if (!normalized || index < 0) return false;
      inventory.slots[index] = normalized;
      return true;
    },
    normalizeSlot,
    createEquippedRef: ctx.createEquippedRef,
    normalizeEquippedRef: ctx.normalizeEquippedRef,
    getEntryCategory: (entry) => ctx.getEntryCategory(itemDefs, entry),
    getEntryEquipSlot: (entry) => ctx.getEntryEquipSlot(itemDefs, entry),
    getEquippedEntry,
    resolveDisplayEntry,
    getResolvedPickaxeLevel,
    getEquippedPickaxeLevel,
    getEntryName: (entry) => ctx.getEntryName(itemDefs, resolveDisplayEntry(entry)),
    getEntryIcon: (entry) => ctx.getEntryIcon(itemDefs, entry),
    getEntryTooltip,
    createQuickUseBinding: ctx.createQuickUseBinding,
    normalizeQuickUseBinding: ctx.normalizeQuickUseBinding,
    getQuickUseBinding: (key) => ctx.getQuickUseBinding(inventory, key),
    getQuickUseItemId: (key) => ctx.getQuickUseItemId(inventory, key),
    getQuickUseKeyForItemId: (itemId) => ctx.getQuickUseKeyForItemId(inventory, itemId, ctx.quickUseKeys),
    getCurrentPickaxeStats: () => ctx.getCurrentPickaxeStats(getEquippedPickaxeLevel()),
    getEquippedToolId: () => runtime.getEquippedItem("tool"),
    getNextPickaxeUpgrade: () => ctx.getNextPickaxeUpgrade(inventory.pickaxeLevel),
    getForgeTargetItemId,
    getForgeUpgradeState,
    getEquippedMiningPower: () => ctx.getMiningPower({ toolId: runtime.getEquippedItem("tool"), pickaxeLevel: getEquippedPickaxeLevel(), itemDefs, randRange: ctx.randRange }),
    findInventorySlotIndex: runtime.findInventorySlotIndex,
    getInventorySlotEntry: runtime.getInventorySlotEntry,
    clampCredits: runtime.clampCredits,
    getCredits: runtime.getCredits,
    setCredits,
    grantCredits,
    canAffordCredits: runtime.canAffordCredits,
    spendCredits,
    findFirstEmptyStorageSlot: () => ctx.findFirstEmptySlot(personalStorage.slots),
    addEntryToStorage: runtime.addEntryToPersonalStorage,
    addEntryToInventory: runtime.addEntryToPlayerInventory,
    moveToStorage: runtime.moveToStorage,
    moveToInventory: runtime.moveToInventory,
    findFirstSlotWithItem: runtime.findFirstInventorySlotWithItem,
    getItemCount: runtime.getOwnedItemCount,
    findFirstEmptySlot: runtime.findFirstEmptyInventorySlot,
    addItem: runtime.addItemToInventory,
    consumeItem: runtime.consumeInventoryItem,
    hasItem: runtime.hasOwnedItem,
    getEquippedRef: runtime.getEquippedRef,
    getEquippedItem: runtime.getEquippedItem,
    setEquippedRef: runtime.setEquippedRef,
    equipFirstOwnedItem: runtime.equipFirstOwnedItem,
  };
}
