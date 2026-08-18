import { createInventoryRenderer } from "./inventoryRenderer.js";

export function createInventoryGameplayController({
  inventory,
  personalStorage,
  inventoryRuntime,
  inventoryUiController,
  quickUseAllowedKeys,
  itemDefs,
  ui,
  getSlotItemId,
  getSlotItemCount,
  getEntryCategory,
  getEntryName,
  getEntryTooltipData,
  getEntryEquipSlot,
  getEntryVisual,
  getDisplayResolvedEntry,
  normalizeInventorySlotEntry,
  createInventorySlotEntry,
  createEquippedItemRef,
  getEquippedItemRef,
  getEquippedItem,
  setEquippedItem,
  isNftEntry,
  isSameAsEquipped,
  isQuickUseAssignableItemId,
  getQuickUseItemId,
  getQuickUseKeyForItemId,
  assignQuickUseKeyToItem,
  getQuickUseAssignState,
  setQuickUseAssignState,
  isBuildPartItemId,
  isFencePlacementMode,
  getSelectedStructureItemId,
  makeSlot,
  setTabStyles,
  showTooltip,
  hideTooltip,
  showMessage,
  updateInventoryUi,
  refreshQuestProgress,
  schedulePlayerSave,
  closeFrontierBuild,
  useFreshAirCanister,
  toggleFencePlacementMode,
  toggleStructurePlacement,
  setLastMessageUntil,
}) {
  let activeTab = "cons";
  let draggedEntry = null;
  let discardTargetEntry = null;

  function resetTrashDropZone() {
    ui.inventoryTrashDropZone.style.background = "rgba(255,255,255,0.72)";
    ui.inventoryTrashDropZone.style.borderColor = "rgba(120,120,120,0.38)";
    ui.inventoryTrashDropZone.style.transform = "scale(1)";
  }

  function showTimedMessage(message, duration) {
    showMessage(message, duration);
    setLastMessageUntil(performance.now() + duration);
  }

  function isQuickUseAssignableEntry(entry) {
    return getEntryCategory(entry) === "cons" && isQuickUseAssignableItemId(getSlotItemId(entry));
  }

  function getAssignedQuickUseKeyForEntry(entry) {
    const itemId = getSlotItemId(entry);
    for (const key of quickUseAllowedKeys) {
      if (getQuickUseItemId(key) === itemId) return key;
    }
    return "";
  }

  function isQuickUseAssignPendingForEntry(entry) {
    return getQuickUseAssignState()?.itemId === getSlotItemId(entry);
  }

  function pruneQuickUseBindings() {
    inventoryRuntime.pruneQuickUseBindings();
  }

  function closeDiscardDialog() {
    discardTargetEntry = null;
    ui.discardOverlay.style.display = "none";
    ui.discardDialog.style.display = "none";
    ui.discardError.textContent = "";
  }

  function openDiscardDialog(entry) {
    const liveEntry = inventoryRuntime.getInventorySlotEntry(entry);
    const check = inventoryRuntime.canDiscard(liveEntry ?? entry);
    if (!check.ok) {
      showTimedMessage(check.reason, 1000);
      return false;
    }

    discardTargetEntry = liveEntry ?? entry;
    const ownedCount = Math.max(1, getSlotItemCount(discardTargetEntry));
    ui.discardItemLabel.textContent = getEntryName(discardTargetEntry);
    ui.discardOwnedCount.textContent = `현재 보유 개수: ${ownedCount}`;
    ui.discardCountInput.value = String(ownedCount);
    ui.discardCountInput.max = String(ownedCount);
    ui.discardCountInput.disabled = ownedCount <= 1;
    ui.discardInputLabel.style.opacity = ownedCount <= 1 ? "0.55" : "1";
    ui.discardError.textContent = "";
    ui.discardOverlay.style.display = "block";
    ui.discardDialog.style.display = "block";
    setTimeout(() => {
      ui.discardCountInput.focus();
      ui.discardCountInput.select();
    }, 0);
    return true;
  }

  function commitDiscardDialog() {
    if (!discardTargetEntry) return false;
    const slotIndex = inventoryRuntime.findInventorySlotIndex(discardTargetEntry);
    if (slotIndex < 0) {
      ui.discardError.textContent = "아이템을 다시 찾을 수 없습니다.";
      return false;
    }

    const liveEntry = inventory.slots[slotIndex];
    const check = inventoryRuntime.canDiscard(liveEntry);
    if (!check.ok) {
      ui.discardError.textContent = check.reason;
      return false;
    }

    const ownedCount = Math.max(1, getSlotItemCount(liveEntry));
    const rawCount = Number.parseInt(ui.discardCountInput.value, 10);
    const discardCount = Math.max(1, Math.min(ownedCount, Number.isFinite(rawCount) ? rawCount : ownedCount));
    if (!Number.isFinite(rawCount) || rawCount < 1 || rawCount > ownedCount) {
      ui.discardError.textContent = `1 ~ ${ownedCount} 사이의 숫자를 입력하세요.`;
      return false;
    }

    if (ownedCount <= discardCount) inventory.slots[slotIndex] = null;
    else liveEntry.count -= discardCount;

    pruneQuickUseBindings();
    const itemName = getEntryName(liveEntry);
    closeDiscardDialog();
    updateInventoryUi();
    showTimedMessage(`${itemName} ${discardCount}개 버렸습니다.`, 1000);
    return true;
  }

  function toggleEquipItem(itemOrId) {
    const entry = typeof itemOrId === "string"
      ? createInventorySlotEntry(itemOrId, 1)
      : normalizeInventorySlotEntry(itemOrId);
    if (!entry) return;

    const equipSlot = getEntryEquipSlot(entry);
    if (!equipSlot) return;

    const equippedRef = getEquippedItemRef(equipSlot);
    const alreadyEquipped = isSameAsEquipped(entry, equippedRef);
    if (alreadyEquipped) {
      setEquippedItem(equipSlot, null);
    } else if (isNftEntry(entry)) {
      setEquippedItem(equipSlot, {
        kind: "nft",
        contractAddress: entry.contractAddress,
        tokenId: entry.tokenId,
        nftType: entry.nftType,
        name: entry.name,
        rarity: entry.rarity,
        icon: entry.icon,
      });
    } else {
      setEquippedItem(equipSlot, createEquippedItemRef(getSlotItemId(entry), {
        instanceId: entry.instanceId ?? null,
        pickaxeLevel: entry.pickaxeLevel ?? null,
      }));
    }

    showTimedMessage(`${getEntryName(entry)} ${alreadyEquipped ? "해제" : "장착"}`, 800);
    updateInventoryUi();
    refreshQuestProgress();
  }

  function unequipSlot(slotId) {
    const equippedRef = getEquippedItemRef(slotId);
    if (equippedRef) toggleEquipItem(equippedRef);
  }

  function beginQuickUseAssignment(entry) {
    if (!isQuickUseAssignableEntry(entry)) return;
    setQuickUseAssignState({ itemId: getSlotItemId(entry) });
    showTimedMessage("단축키를 눌러 지정하세요 (1~5, ESC 취소)", 1200);
    updateInventoryUi();
  }

  function cancelQuickUseAssignment() {
    if (!getQuickUseAssignState()) return;
    setQuickUseAssignState(null);
    updateInventoryUi();
  }

  function clearQuickUseAssignmentForEntry(entry) {
    if (!isQuickUseAssignableEntry(entry)) return;
    const itemId = getSlotItemId(entry);
    const assignedKey = getQuickUseKeyForItemId(itemId);
    if (!assignedKey) return;
    inventory.quickUse[assignedKey] = null;
    if (getQuickUseAssignState()?.itemId === itemId) setQuickUseAssignState(null);
    showTimedMessage(`${itemDefs[itemId]?.name ?? itemId} 단축 해제`, 900);
    updateInventoryUi();
  }

  function commitQuickUseAssignment(key) {
    const assignment = getQuickUseAssignState();
    if (!assignment) return false;
    if (!quickUseAllowedKeys.includes(key) || !inventoryRuntime.hasOwnedItem(assignment.itemId)) {
      setQuickUseAssignState(null);
      updateInventoryUi();
      return false;
    }
    assignQuickUseKeyToItem(assignment.itemId, key);
    setQuickUseAssignState(null);
    showTimedMessage(`${itemDefs[assignment.itemId]?.name ?? assignment.itemId} ${key} 단축 지정`, 900);
    updateInventoryUi();
    return true;
  }

  function closePersonalStorageTransferDialog() {
    inventoryUiController.closeTransfer();
    ui.personalStorageTransferCurtain.style.display = "none";
    ui.personalStorageTransferDialog.style.display = "none";
    ui.personalStorageTransferError.textContent = "";
  }

  function openPersonalStorageTransferDialog(config) {
    const transferState = inventoryUiController.openTransfer(config, getSlotItemCount);
    if (!transferState) return false;
    const { maxCount } = transferState;
    ui.personalStorageTransferTitle.textContent = config.target === "storage" ? "창고로 옮길 개수" : "인벤토리로 옮길 개수";
    ui.personalStorageTransferItemLabel.textContent = getEntryName(config.entry);
    ui.personalStorageTransferOwnedCount.textContent = `현재 개수: ${maxCount}`;
    ui.personalStorageTransferCountInput.max = String(maxCount);
    ui.personalStorageTransferCountInput.value = String(maxCount);
    ui.personalStorageTransferError.textContent = "";
    ui.personalStorageTransferCurtain.style.display = "block";
    ui.personalStorageTransferDialog.style.display = "block";
    setTimeout(() => {
      ui.personalStorageTransferCountInput.focus();
      ui.personalStorageTransferCountInput.select();
    }, 0);
    return true;
  }

  function commitPersonalStorageTransferDialog() {
    const transferPlan = inventoryUiController.getTransferCommitPlan(ui.personalStorageTransferCountInput.value);
    if (!transferPlan.ok) {
      if (transferPlan.reason === "invalid-count") {
        ui.personalStorageTransferError.textContent = `1 ~ ${transferPlan.maxCount} 사이의 숫자를 입력하세요.`;
      }
      return false;
    }

    const result = transferPlan.target === "storage"
      ? inventoryRuntime.moveToStorage(transferPlan.entry, transferPlan.count)
      : inventoryRuntime.moveToInventory(transferPlan.index, transferPlan.count);
    if (!result.ok) {
      ui.personalStorageTransferError.textContent = result.reason;
      return false;
    }

    closePersonalStorageTransferDialog();
    ui.personalStorageMessage.textContent = "";
    updateInventoryUi();
    schedulePlayerSave(true);
    renderPersonalStorageWindow();
    return true;
  }

  function setPersonalStorageOpen(open) {
    const visible = inventoryUiController.setPersonalStorageOpen(open);
    ui.personalStorageOverlay.style.display = visible ? "block" : "none";
    ui.personalStorageWin.style.display = visible ? "block" : "none";
    if (!visible) {
      closePersonalStorageTransferDialog();
      ui.personalStorageMessage.textContent = "";
      hideTooltip();
    } else {
      renderPersonalStorageWindow();
    }
  }

  function movePersonalStorageEntry({ source, target, entry, index }) {
    if (getSlotItemCount(entry) > 1) {
      openPersonalStorageTransferDialog({ source, target, entry: structuredClone(entry), ...(index == null ? {} : { index }) });
      return;
    }
    const result = target === "storage"
      ? inventoryRuntime.moveToStorage(entry)
      : inventoryRuntime.moveToInventory(index);
    ui.personalStorageMessage.textContent = result.ok ? "" : result.reason;
    if (result.ok) {
      updateInventoryUi();
      schedulePlayerSave(true);
    }
    renderPersonalStorageWindow();
  }

  const inventoryRenderer = createInventoryRenderer({
    invgrid: ui.invgrid,
    inventoryStoragePanel: ui.inventoryStoragePanel,
    personalStoragePanel: ui.personalStoragePanel,
    getInventory: () => inventory,
    getStorage: () => personalStorage,
    getActiveTab: () => activeTab,
    getEntryCategory,
    getEntryName,
    getEntryCount: getSlotItemCount,
    createEntryVisual: getEntryVisual,
    getTooltipData: getEntryTooltipData,
    getItemId: getSlotItemId,
    getEquipSlot: getEntryEquipSlot,
    getEquippedItem: getEquippedItemRef,
    isSameAsEquipped,
    isNftEntry,
    isBuildPartItemId,
    isFencePlacementMode,
    getSelectedStructureItemId,
    isQuickUseAssignable: isQuickUseAssignableEntry,
    getAssignedQuickUseKey: getAssignedQuickUseKeyForEntry,
    isQuickUsePending: isQuickUseAssignPendingForEntry,
    makeSlot,
    setTabStyles,
    showTooltip,
    hideTooltip,
    toggleEquip: toggleEquipItem,
    useFreshAirCanister,
    toggleFencePlacementMode,
    toggleStructurePlacement,
    clearQuickUse: clearQuickUseAssignmentForEntry,
    beginQuickUse: beginQuickUseAssignment,
    setInventoryDrag: (entry) => { draggedEntry = entry; },
    clearInventoryDrag: () => { draggedEntry = null; },
    resetTrashDropZone,
    highlightSlot: (slot, kind) => {
      slot.style.borderColor = kind === "build" ? "rgba(80,160,255,0.95)" : "rgba(255,140,0,0.95)";
      slot.style.boxShadow = kind === "build"
        ? "0 0 0 3px rgba(80,160,255,0.28), inset 0 1px 0 rgba(255,255,255,0.8)"
        : "0 0 0 3px rgba(255,140,0,0.35), inset 0 1px 0 rgba(255,255,255,0.8)";
    },
    beginStorageDrag: (state) => inventoryUiController.beginDrag(state),
    clearStorageDrag: () => inventoryUiController.clearDrag(),
    getStorageDrag: () => inventoryUiController.getDragState(),
    highlightStorageDrop: (slot, active) => {
      slot.style.background = active ? "rgba(255,239,219,0.96)" : "rgba(255,255,255,0.95)";
      slot.style.borderColor = active ? "rgba(232,120,66,0.9)" : "rgba(0,0,0,0.2)";
    },
    highlightInventoryDrop: (slot, active) => {
      slot.style.background = active ? "rgba(228,241,255,0.98)" : "rgba(255,255,255,0.95)";
      slot.style.borderColor = active ? "rgba(92,145,228,0.86)" : "rgba(0,0,0,0.2)";
    },
    setStorageMessage: (message) => { ui.personalStorageMessage.textContent = message; },
    moveEntry: movePersonalStorageEntry,
  });

  function renderInventoryWindow() {
    inventoryRenderer.renderInventoryWindow();
  }

  function renderPersonalStorageWindow() {
    inventoryRenderer.renderPersonalStorageWindow();
  }

  function setInventoryOpen(open) {
    if (open) closeFrontierBuild();
    const visible = inventoryUiController.setInventoryOpen(open);
    ui.invWin.style.display = visible ? "block" : "none";
    ui.equipWin.style.display = visible ? "block" : "none";
    if (!visible) {
      hideTooltip();
      draggedEntry = null;
      closeDiscardDialog();
    } else {
      renderInventoryWindow();
    }
  }

  function setActiveTab(tabId) {
    activeTab = tabId;
    renderInventoryWindow();
  }

  function cycleActiveTab() {
    const order = ["equip", "cons", "misc"];
    const index = Math.max(0, order.indexOf(activeTab));
    setActiveTab(order[(index + 1) % order.length]);
  }

  return {
    handleTrashDragOver(event) {
      if (!draggedEntry) return;
      event.preventDefault();
      ui.inventoryTrashDropZone.style.background = "rgba(255,231,214,0.96)";
      ui.inventoryTrashDropZone.style.borderColor = "rgba(232,120,66,0.9)";
      ui.inventoryTrashDropZone.style.transform = "scale(1.01)";
    },
    handleTrashDragLeave: resetTrashDropZone,
    handleTrashDrop(event) {
      event.preventDefault();
      resetTrashDropZone();
      const entry = draggedEntry;
      draggedEntry = null;
      if (entry) openDiscardDialog(entry);
    },
    getActiveTab: () => activeTab,
    getQuickUseAssignState,
    pruneQuickUseBindings,
    renderInventoryWindow,
    renderPersonalStorageWindow,
    setInventoryOpen,
    setPersonalStorageOpen,
    setActiveTab,
    cycleActiveTab,
    closeDiscardDialog,
    openDiscardDialog,
    commitDiscardDialog,
    closePersonalStorageTransferDialog,
    openPersonalStorageTransferDialog,
    commitPersonalStorageTransferDialog,
    toggleEquipItem,
    unequipSlot,
    beginQuickUseAssignment,
    cancelQuickUseAssignment,
    clearQuickUseAssignmentForEntry,
    commitQuickUseAssignment,
  };
}
