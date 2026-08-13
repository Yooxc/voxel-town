export function createInventoryController() {
  let inventoryOpen = false;
  let personalStorageOpen = false;
  let dragState = null;
  let transferState = null;

  function setInventoryOpen(open) {
    inventoryOpen = Boolean(open);
    if (!inventoryOpen) dragState = null;
    return inventoryOpen;
  }

  function setPersonalStorageOpen(open) {
    personalStorageOpen = Boolean(open);
    if (!personalStorageOpen) {
      dragState = null;
      transferState = null;
    }
    return personalStorageOpen;
  }

  function beginDrag(nextDragState) {
    dragState = nextDragState?.entry ? { ...nextDragState } : null;
    return dragState;
  }

  function clearDrag() {
    dragState = null;
  }

  function openTransfer(config, getEntryCount) {
    if (!config?.entry) return null;
    const maxCount = Math.max(1, getEntryCount(config.entry));
    if (maxCount <= 1) return null;
    transferState = { ...config, maxCount };
    return transferState;
  }

  function closeTransfer() {
    transferState = null;
  }

  function getTransferCommitPlan(rawCount) {
    if (!transferState) return { ok: false, reason: "no-transfer" };
    const count = Number.parseInt(rawCount, 10);
    if (!Number.isFinite(count) || count < 1 || count > transferState.maxCount) {
      return { ok: false, reason: "invalid-count", maxCount: transferState.maxCount };
    }
    return { ok: true, ...transferState, count };
  }

  return {
    isInventoryOpen: () => inventoryOpen,
    isPersonalStorageOpen: () => personalStorageOpen,
    getDragState: () => dragState,
    getTransferState: () => transferState,
    setInventoryOpen,
    setPersonalStorageOpen,
    beginDrag,
    clearDrag,
    openTransfer,
    closeTransfer,
    getTransferCommitPlan,
  };
}
