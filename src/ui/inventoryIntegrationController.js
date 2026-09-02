export function createInventoryIntegrationController(ctx) {
  const equipment = ctx.createEquipmentVisuals(ctx.rigParts, ctx.equipmentBuilders);
  let equipmentPreview = null;

  function syncToolGroupModel(group, itemId, level) {
    while (group.children.length) {
      const child = group.children[0];
      ctx.disposeObject(child);
      group.remove(child);
    }
    if (itemId === "shovel") group.add(ctx.buildShovelModel());
    else if (itemId === "pickaxe") group.add(ctx.buildPickaxeModel(level));
    group.userData.toolItemId = itemId ?? null;
    group.userData.pickaxeLevel = level;
  }

  function refreshToolModel() {
    syncToolGroupModel(equipment.equippedPickaxe, ctx.getEquippedToolId(), ctx.getEquippedPickaxeLevel());
  }

  function updateEquipmentVisibility() {
    const headRef = ctx.getEquippedItemRef("head");
    const isNftHelmetEquipped = headRef?.kind === "nft"
      && headRef?.contractAddress === ctx.nftHelmetContract
      && String(headRef?.tokenId) === ctx.nftHelmetTokenId;
    ctx.updateEquipmentVisibility(equipment, {
      hasToolEquipped: Boolean(ctx.getEquippedToolId()),
      isSafetyHelmetEquipped: !isNftHelmetEquipped && ctx.getEquippedItem("head") === "safetyHelmet",
      isNftHelmetEquipped,
      shoesVisible: ctx.getEquippedItem("shoes") === "basicShoes",
    });
  }

  function initializePreview(config) {
    equipmentPreview = ctx.createEquipmentPreview({
      ...config,
      getEquipmentVisibility: () => ({
        equippedPickaxeVisible: equipment.equippedPickaxe.visible,
        equippedSafetyHelmetVisible: equipment.equippedSafetyHelmet.visible,
        equippedNftHelmetVisible: equipment.equippedNftHelmet.visible,
      }),
      syncEquippedToolGroupModel: syncToolGroupModel,
    });
    return equipmentPreview;
  }

  function updateInventoryUi() {
    ctx.pruneQuickUseBindings();
    refreshToolModel();
    updateEquipmentVisibility();
    equipmentPreview?.renderWindow();
    if (ctx.isForgeOpen()) ctx.renderForgeWindow();
    if (ctx.isRefineryOpen()) ctx.renderRefineryWindow();
    if (ctx.isFrontierBuildVisible()) ctx.renderFrontierBuildWindow();
    if (ctx.isPersonalStorageOpen()) ctx.renderPersonalStorageWindow();
    if (ctx.isInventoryOpen()) ctx.renderInventoryWindow();
    ctx.scheduleSave(true);
  }

  function bindWindowEvents() {
    if (!ctx.bindWindowEvents) return;
    ctx.bindWindowEvents({
      onWalletLogout: ctx.onWalletLogout,
      onWalletCopy: ctx.onWalletCopy,
      onTabChange: ctx.setActiveTab,
      onTrashDragOver: ctx.handleTrashDragOver,
      onTrashDragLeave: ctx.handleTrashDragLeave,
      onTrashDrop: ctx.handleTrashDrop,
      onDiscardOverlayClick: ctx.closeDiscardDialog,
      onDiscardCancel: ctx.closeDiscardDialog,
      onDiscardConfirm: ctx.commitDiscardDialog,
      onDiscardKeyDown: (event) => handleDialogKey(event, ctx.commitDiscardDialog, ctx.closeDiscardDialog),
      onPersonalStorageOverlayClick: ctx.closePersonalStorage,
      onPersonalStorageClose: ctx.closePersonalStorage,
      onPersonalStorageCurtainClick: ctx.closePersonalStorageTransferDialog,
      onPersonalStorageTransferCancel: ctx.closePersonalStorageTransferDialog,
      onPersonalStorageTransferConfirm: ctx.commitPersonalStorageTransferDialog,
      onPersonalStorageTransferKeyDown: (event) => handleDialogKey(
        event,
        ctx.commitPersonalStorageTransferDialog,
        ctx.closePersonalStorageTransferDialog,
      ),
    });
  }

  refreshToolModel();
  updateEquipmentVisibility();
  bindWindowEvents();

  return {
    equipment,
    initializePreview,
    syncToolGroupModel,
    refreshToolModel,
    updateEquipmentVisibility,
    resizePreview: () => equipmentPreview?.resize(),
    renderPreview: () => equipmentPreview?.renderPreview(),
    renderEquipmentWindow: () => equipmentPreview?.renderWindow(),
    bindWindowEvents,
    updateInventoryUi,
  };
}

function handleDialogKey(event, onConfirm, onCancel) {
  if (event.key === "Enter") {
    event.preventDefault();
    onConfirm();
  } else if (event.key === "Escape") {
    event.preventDefault();
    onCancel();
  }
}
