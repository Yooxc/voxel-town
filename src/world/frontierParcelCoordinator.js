import { createFrontierSceneController } from "./frontierSceneController.js";
import { createFrontierOperationsController } from "../ui/frontierOperationsController.js";
import { createFrontierWindowsUi } from "../ui/frontierWindowsUi.js";
import {
  getFrontierParcelAuthorityItemId,
  createDefaultFrontierBuildState,
  createDefaultFrontierParcelBuildEntry,
  createDefaultFrontierParcelOperationsState,
  normalizeFrontierWalletAddress,
  formatFrontierShopStatusText,
  formatFrontierDisplayStatusText,
  getFrontierDisplaySummary,
  getFrontierShopListingSummary,
  normalizeFrontierBuildState,
  getFrontierNextStageConfig,
  isFrontierShopSeller,
  canManageFrontierShopSellerTools,
  canRegisterFrontierShopListing,
  canCollectFrontierShopSettlement,
  getFrontierCurrentParcelLabel,
  getFrontierSelectedParcelLabel,
  getFrontierBuildStateEntry,
  getFrontierShopOperation,
  getFrontierDisplayOperation,
  getFrontierShopAssignedWallet,
  getFrontierShopSellerWallet,
  getFrontierDisplayAssignedWallet,
  canManageFrontierShopSlot,
  canUseFrontierShopSlot,
  canEditFrontierShopListing,
  canManageFrontierDisplaySlot,
  canUseFrontierDisplaySlot,
  getFrontierBoothInteractionPlan,
  getSellableFrontierShopEntries,
  getFrontierShopRegistrationAccess,
  isFrontierDisplayableEntry,
  getDisplayableFrontierEntries,
  getFrontierShopPurchaseFeedback,
  formatFrontierShopUserDisplay,
  canAssignFrontierDisplayEntryState,
  assignFrontierDisplayEntryState,
  canClearFrontierDisplayEntryState,
  clearFrontierDisplayEntryState,
  canAssignFrontierDisplaySlotUserState,
  assignFrontierDisplaySlotUserState,
  canClearFrontierDisplaySlotUserState,
  clearFrontierDisplaySlotUserState,
  getCollectFrontierShopSettlementState,
  applyCollectedFrontierShopSettlementState,
  getFrontierParcelSafeStandingPoint,
} from "../systems/frontier.js";

export function createFrontierParcelCoordinator(ctx) {
  let windowsUi = null;
  let operationsController = null;

  function createDefaultBuildState() {
    return createDefaultFrontierBuildState(ctx.parcelLabels);
  }

  function createDefaultBuildEntry(label) {
    return createDefaultFrontierParcelBuildEntry(label);
  }

  function getAuthorityItemId(parcelLabel) {
    return getFrontierParcelAuthorityItemId(parcelLabel, ctx.authorityItemIds);
  }

  function hasAuthority(parcelLabel) {
    const itemId = getAuthorityItemId(parcelLabel);
    return Boolean(itemId && ctx.hasItem(itemId));
  }

  function getCurrentWallet() {
    return normalizeFrontierWalletAddress(ctx.getWalletAddress());
  }

  function getCurrentParcelLabel() {
    return getFrontierCurrentParcelLabel(ctx.parcelLabels, ctx.isPlayerInsideParcel);
  }

  function getSelectedParcelLabel() {
    const currentLabel = getCurrentParcelLabel();
    if (currentLabel) ctx.setActiveParcelLabel(currentLabel);
    return getFrontierSelectedParcelLabel(currentLabel, ctx.getActiveParcelLabel(), ctx.defaultParcelLabel);
  }

  function getBuildState(parcelLabel = getSelectedParcelLabel()) {
    return getFrontierBuildStateEntry(ctx.getBuildStateData(), parcelLabel, createDefaultBuildEntry);
  }

  function getShopOperation(parcelLabel = getSelectedParcelLabel()) {
    return getFrontierShopOperation(ctx.getBuildStateData(), parcelLabel, createDefaultBuildEntry);
  }

  function getDisplayOperation(parcelLabel = getSelectedParcelLabel(), slotKey = "displayA") {
    return getFrontierDisplayOperation(ctx.getBuildStateData(), parcelLabel, slotKey, createDefaultBuildEntry);
  }

  function getShopAssignedWallet(parcelLabel = getSelectedParcelLabel()) {
    return getFrontierShopAssignedWallet(getShopOperation(parcelLabel));
  }

  function getShopSellerWallet(parcelLabel = getSelectedParcelLabel()) {
    return getFrontierShopSellerWallet(getShopOperation(parcelLabel));
  }

  function getDisplayAssignedWallet(parcelLabel = getSelectedParcelLabel(), slotKey = "displayA") {
    return getFrontierDisplayAssignedWallet(getDisplayOperation(parcelLabel, slotKey));
  }

  function isShopSeller(parcelLabel = getSelectedParcelLabel(), walletAddress = getCurrentWallet()) {
    return isFrontierShopSeller(getShopSellerWallet(parcelLabel), walletAddress);
  }

  function canManageShopSlot(parcelLabel = getSelectedParcelLabel()) {
    return canManageFrontierShopSlot(hasAuthority, parcelLabel);
  }

  function canUseShopSlot(parcelLabel = getSelectedParcelLabel()) {
    return canUseFrontierShopSlot(getShopOperation(parcelLabel), getCurrentWallet());
  }

  function canEditShopListing(parcelLabel = getSelectedParcelLabel()) {
    return canEditFrontierShopListing(getShopOperation(parcelLabel), getCurrentWallet());
  }

  function canManageShopSellerTools(parcelLabel = getSelectedParcelLabel()) {
    return canManageFrontierShopSellerTools(getShopOperation(parcelLabel), getCurrentWallet(), ctx.clampCredits);
  }

  function canRegisterShopListing(parcelLabel = getSelectedParcelLabel()) {
    return canRegisterFrontierShopListing(getShopOperation(parcelLabel), getShopAssignedWallet(parcelLabel), getCurrentWallet());
  }

  function canCollectShopSettlement(parcelLabel = getSelectedParcelLabel()) {
    return canCollectFrontierShopSettlement(getShopOperation(parcelLabel), getCurrentWallet(), ctx.clampCredits);
  }

  function canManageDisplaySlot(parcelLabel = getSelectedParcelLabel()) {
    return canManageFrontierDisplaySlot(hasAuthority, parcelLabel);
  }

  function canUseDisplaySlot(parcelLabel = getSelectedParcelLabel(), slotKey = "displayA") {
    return canUseFrontierDisplaySlot(getDisplayOperation(parcelLabel, slotKey), getCurrentWallet());
  }

  function getBoothInteractionPlan(interactable) {
    return getFrontierBoothInteractionPlan(interactable, getSelectedParcelLabel(), {
      canManageShopSlot,
      canUseShopSlot,
      canManageDisplaySlot,
      canUseDisplaySlot,
    });
  }

  function getShopStatusText(itemId, quantity, price) {
    return formatFrontierShopStatusText(itemId, quantity, price, ctx.itemDefs);
  }

  function getDisplayStatusText(entry) {
    return formatFrontierDisplayStatusText(entry, ctx.getEntryName);
  }

  function getDisplaySummary(displayState) {
    return getFrontierDisplaySummary(displayState, {
      normalizeInventorySlotEntry: ctx.normalizeInventorySlotEntry,
      getInventoryEntryDisplayName: ctx.getEntryName,
    });
  }

  function getShopListingSummary(shopState) {
    return getFrontierShopListingSummary(shopState, {
      itemDefs: ctx.itemDefs,
      clampPlayerCredits: ctx.clampCredits,
    });
  }

  function getShopPurchaseFeedback(parcelLabel, quantity) {
    const shopState = getShopOperation(parcelLabel);
    return getFrontierShopPurchaseFeedback({
      parcelLabel,
      shopState,
      quantity,
      currentWallet: getCurrentWallet(),
      canAffordPlayerCredits: ctx.canAffordCredits,
      clampPlayerCredits: ctx.clampCredits,
      validateInventorySpace: () => ctx.validateShopInventorySpace(shopState.itemId, quantity),
    });
  }

  function normalizeBuildState(rawState) {
    return normalizeFrontierBuildState(rawState, {
      parcelLabels: ctx.parcelLabels,
      normalizeInventorySlotEntry: ctx.normalizeInventorySlotEntry,
      getInventoryEntryDisplayName: ctx.getEntryName,
      itemDefs: ctx.itemDefs,
      clampPlayerCredits: ctx.clampCredits,
    });
  }

  function getNextStageConfig(stage = getBuildState().stage) {
    return getFrontierNextStageConfig(stage, ctx.buildStageConfig);
  }

  function getSafeStandingPoint(parcelLabel) {
    return getFrontierParcelSafeStandingPoint(ctx.getParcel(parcelLabel), ctx.frontierMapX, ctx.getPlayerStandingPoint());
  }

  const sceneController = createFrontierSceneController({
    interactables: ctx.interactables,
    scene: ctx.scene,
    getMarkers: ctx.getBoothMarkers,
    setMarkers: ctx.setBoothMarkers,
    getColliders: ctx.getConstructionColliders,
    setColliders: ctx.setConstructionColliders,
    getTrackedColliderIndex: ctx.getTrackedColliderIndex,
    removeColliderAt: ctx.removeColliderAt,
    getConstructionRoot: ctx.getConstructionRoot,
    getConstructionGroup: ctx.getConstructionGroup,
    setConstructionGroup: ctx.setConstructionGroup,
    getParcel: ctx.getParcel,
    getBuildState,
    frontierMapX: ctx.frontierMapX,
    buildingHeight: ctx.buildingHeight,
    addCollider: ctx.addCollider,
    buildBuildingSign: ctx.buildBuildingSign,
    buildBoothLabel: ctx.buildBoothLabel,
    buildBoothProductVisual: ctx.buildBoothProductVisual,
    buildDisplayBoothVisual: ctx.buildDisplayBoothVisual,
    ensurePlayerNotInsideGeneratedColliders: ctx.ensurePlayerNotInsideGeneratedColliders,
    getSafeStandingPoint,
  });

  function rebuildParcelConstructionVisual(parcelLabel) {
    sceneController.rebuildParcelConstructionVisual(parcelLabel);
  }

  function rebuildAllConstructionVisuals() {
    for (const label of ctx.parcelLabels) rebuildParcelConstructionVisual(label);
  }

  function grantSellerCredits(walletAddress, amount) {
    const normalizedWallet = normalizeFrontierWalletAddress(walletAddress);
    const safeAmount = ctx.clampCredits(amount);
    if (!normalizedWallet || safeAmount <= 0) return false;
    if (normalizedWallet === getCurrentWallet()) {
      ctx.grantCredits(safeAmount);
      return true;
    }
    return ctx.grantOfflineSellerCredits(normalizedWallet, safeAmount);
  }

  function setBuildOpen(open) {
    windowsUi?.setBuildOpen(open);
  }

  function tryAdvanceBuildStage() {
    const parcelLabel = getSelectedParcelLabel();
    if (!hasAuthority(parcelLabel)) {
      ctx.notify(`${parcelLabel} 개발권 필요`, 1000);
      return true;
    }
    const buildState = getBuildState(parcelLabel);
    const nextStage = getNextStageConfig(buildState.stage);
    if (!nextStage) {
      ctx.notify(`${parcelLabel} 건축은 이미 완료되었습니다.`, 1000);
      return true;
    }
    if (ctx.getItemCount("woodPlank") < nextStage.wood || ctx.getItemCount("masonryStone") < nextStage.stone) {
      ctx.notify("건축 재료가 부족합니다.", 1000);
      return true;
    }
    if (!ctx.consumeItem("woodPlank", nextStage.wood)) {
      ctx.notify("목재를 차감하지 못했습니다.", 1000);
      return true;
    }
    if (!ctx.consumeItem("masonryStone", nextStage.stone)) {
      ctx.addItem("woodPlank", nextStage.wood);
      ctx.notify("석재를 차감하지 못했습니다.", 1000);
      return true;
    }
    buildState.stage = nextStage.to;
    rebuildParcelConstructionVisual(parcelLabel);
    ctx.updateInventoryUi();
    ctx.scheduleSave(true);
    windowsUi.renderBuild();
    ctx.notify(`${parcelLabel} 건축 진척도 ${buildState.stage}%`, 1100);
    return true;
  }

  function saveBuildSignText() {
    const parcelLabel = getSelectedParcelLabel();
    if (!hasAuthority(parcelLabel) || getBuildState(parcelLabel).stage < 100) return false;
    const text = String(windowsUi.getBuildSignText() || "").trim().slice(0, ctx.maxSignChars) || parcelLabel;
    ctx.getBuildStateData()[parcelLabel.toLowerCase()].signText = text;
    rebuildParcelConstructionVisual(parcelLabel);
    ctx.scheduleSave(true);
    windowsUi.renderBuild();
    ctx.notify("간판 문구를 저장했습니다.", 900);
    return true;
  }

  function initializeUi() {
    windowsUi = createFrontierWindowsUi({
      uiLayer: ctx.uiLayer,
      maxSignChars: ctx.maxSignChars,
      getBuildRenderContext: () => {
        const parcelLabel = getSelectedParcelLabel();
        const buildState = getBuildState(parcelLabel);
        return {
          parcelLabel,
          buildState,
          isCompleted: buildState.stage >= 100,
          hasAuthority: hasAuthority(parcelLabel),
          nextStage: getNextStageConfig(buildState.stage),
          woodOwned: ctx.getItemCount("woodPlank"),
          stoneOwned: ctx.getItemCount("masonryStone"),
          getShopStatusText: () => buildState.operations.shop.statusText,
          getDisplayStatusText: (slotKey) => buildState.operations[slotKey].statusText,
        };
      },
      getBoothRenderContext: ({ parcelLabel, slotKey, boothTitle, mode }) => {
        const buildState = getBuildState(parcelLabel);
        const slotState = slotKey === "shop" ? buildState.operations.shop : buildState.operations[slotKey];
        return {
          parcelLabel, slotKey, boothTitle, mode, buildState, slotState,
          getShopAssignedWallet,
          getShopListingSummary,
          getShopSellerWallet,
          canManageShopSlot,
          isShopSeller,
          canUseShopSlot,
          shortenWalletAddress: ctx.shortenWallet,
          itemDefs: ctx.itemDefs,
          formatPlayerCreditsLabel: ctx.formatCreditsLabel,
          clampPlayerCredits: ctx.clampCredits,
          getShopPurchaseFeedback,
          tryPurchaseShopListing: (label, quantity) => operationsController.purchaseShopListing(label, quantity),
          showUi: ctx.showUI,
          setLastMessageUntil: ctx.setLastMessageFromDuration,
          openShopRegisterDialog: (label) => operationsController.openShopRegisterDialog(label),
          canRegisterShopListing,
          canManageShopSellerTools,
          canEditShopListing,
          updateShopListingPrice: (label, price) => operationsController.updateShopListingPrice(label, price),
          clearShopListing: (label) => operationsController.clearShopListing(label),
          canCollectShopSettlement,
          collectShopSettlement: (label) => operationsController.collectShopSettlement(label),
          assignShopSlotUser: (label, wallet) => operationsController.assignShopSlotUser(label, wallet),
          clearShopSlotUser: (label) => operationsController.clearShopSlotUser(label),
          getDisplaySummary,
          getDisplayAssignedWallet,
          canManageDisplaySlot,
          canUseDisplaySlot,
          getCurrentWallet,
          assignDisplaySlotUser: (label, key, wallet) => operationsController.assignDisplaySlotUser(label, key, wallet),
          clearDisplaySlotUser: (label, key) => operationsController.clearDisplaySlotUser(label, key),
          clearDisplayEntry: (label, key) => operationsController.clearDisplayEntry(label, key),
          getDisplayableEntries: () => getDisplayableFrontierEntries(ctx.getInventorySlots(), ctx.isQuestCriticalItemBlocked),
          createInventoryEntryVisualElement: ctx.createEntryVisual,
          getInventoryEntryDisplayName: ctx.getEntryName,
          isNftInventoryEntry: ctx.isNftInventoryEntry,
          getSlotItemCount: ctx.getEntryCount,
          assignDisplayEntry: (label, key, entry) => operationsController.assignDisplayEntry(label, key, entry),
        };
      },
      onBuildOpened: ctx.onBuildOpened,
      onBuildClosed: () => {},
      onBuildAction: () => {
        const parcelLabel = getSelectedParcelLabel();
        if (getBuildState(parcelLabel).stage >= 100) {
          operationsController.openShopRegisterDialog(parcelLabel);
          return;
        }
        tryAdvanceBuildStage();
      },
      onBuildSignSave: saveBuildSignText,
      onShopClose: () => operationsController?.closeShopRegisterDialog(),
      onShopRegister: () => operationsController.commitShopListing(),
      onShopClear: () => operationsController.clearShopListing(),
      onShopSelfAssign: () => {
        const wallet = getCurrentWallet();
        if (!wallet) {
          ctx.notify("로그인 지갑 주소를 확인할 수 없습니다.", 1000);
          return;
        }
        operationsController.assignShopSlotUser(getSelectedParcelLabel(), wallet);
      },
      onShopAddressAssign: (wallet) => operationsController.assignShopSlotUser(getSelectedParcelLabel(), wallet),
      onShopUserClear: () => operationsController.clearShopSlotUser(getSelectedParcelLabel()),
    });

    operationsController = createFrontierOperationsController({
      now: ctx.now,
      showUI: ctx.showUI,
      setLastMessageUntil: ctx.setLastMessageUntil,
      runtime: ctx.runtime,
      isBuildOpen: () => windowsUi.isBuildOpen(),
      setRegisterOpen: windowsUi.setShopRegisterOpen,
      getSelectedParcelLabel,
      getShopOperation,
      getDisplayOperation,
      getCurrentWallet,
      getShopAssignedWallet,
      canUseDisplaySlot,
      canManageDisplaySlot,
      canEditShop: canEditShopListing,
      canRegisterShop: canRegisterShopListing,
      canManageShopSlot,
      canCollectSettlement: canCollectShopSettlement,
      isDisplayableEntry: (entry) => isFrontierDisplayableEntry(entry, ctx.isQuestCriticalItemBlocked),
      canAssignDisplayEntry: canAssignFrontierDisplayEntryState,
      assignDisplayEntryState: (state, entry) => assignFrontierDisplayEntryState(state, entry, { normalizeInventorySlotEntry: ctx.normalizeInventorySlotEntry, getInventoryEntryDisplayName: ctx.getEntryName }),
      canClearDisplayEntry: canClearFrontierDisplayEntryState,
      clearDisplayEntryState: clearFrontierDisplayEntryState,
      canAssignDisplayUser: canAssignFrontierDisplaySlotUserState,
      assignDisplayUserState: assignFrontierDisplaySlotUserState,
      canClearDisplayUser: canClearFrontierDisplaySlotUserState,
      clearDisplayUserState: clearFrontierDisplaySlotUserState,
      getSettlement: (state) => getCollectFrontierShopSettlementState(state, ctx.clampCredits),
      applySettlement: applyCollectedFrontierShopSettlementState,
      grantSellerCredits,
      normalizeWallet: normalizeFrontierWalletAddress,
      shortenWallet: ctx.shortenWallet,
      getShopRegistrationAccess: (parcelLabel) => getFrontierShopRegistrationAccess({ buildState: getBuildState(parcelLabel), assignedWallet: getShopAssignedWallet(parcelLabel), canUse: canUseShopSlot(parcelLabel) }),
      getShopListingSummary,
      getSellableEntries: () => getSellableFrontierShopEntries(ctx.getInventorySlots(), { isNftInventoryEntry: ctx.isNftInventoryEntry, getSlotItemId: ctx.getEntryItemId, itemDefs: ctx.itemDefs, getInventoryEntryCategory: ctx.getEntryCategory, isQuestCriticalItemBlockedFromDiscard: ctx.isQuestCriticalItemBlocked }),
      getEntryItemId: ctx.getEntryItemId,
      getEntryCount: ctx.getEntryCount,
      getEntryName: ctx.getEntryName,
      createEntryVisual: ctx.createEntryVisual,
      getItemName: ctx.getItemName,
      getItemCount: ctx.getItemCount,
      addItem: ctx.addItem,
      consumeItem: ctx.consumeItem,
      canAffordCredits: ctx.canAffordCredits,
      spendCredits: ctx.spendCredits,
      grantCredits: ctx.grantCredits,
      addPurchasedEntry: ctx.addPurchasedEntry,
      snapshotInventory: ctx.snapshotInventory,
      restoreInventory: ctx.restoreInventory,
      getShopStatusText,
      rebuildParcel: rebuildParcelConstructionVisual,
      updateInventoryUI: ctx.updateInventoryUi,
      scheduleSave: ctx.scheduleSave,
      renderBoothDialog: () => windowsUi.renderBooth(),
      renderBuildWindow: () => windowsUi.renderBuild(),
      closeBoothDialog: () => windowsUi.closeBooth(),
      elements: windowsUi.getShopElements(),
    });
  }

  return {
    initializeUi,
    createDefaultBuildState,
    createDefaultBuildEntry,
    createDefaultParcelOperationsState,
    getAuthorityItemId,
    hasAuthority,
    getCurrentWallet,
    getCurrentParcelLabel,
    getSelectedParcelLabel,
    getBuildState,
    getShopOperation,
    getDisplayOperation,
    getShopAssignedWallet,
    getShopSellerWallet,
    getDisplayAssignedWallet,
    isShopSeller,
    canManageShopSlot,
    canUseShopSlot,
    canEditShopListing,
    canManageShopSellerTools,
    canRegisterShopListing,
    canCollectShopSettlement,
    canManageDisplaySlot,
    canUseDisplaySlot,
    getBoothInteractionPlan,
    getShopStatusText,
    getDisplayStatusText,
    getDisplaySummary,
    getShopListingSummary,
    getShopPurchaseFeedback,
    normalizeBuildState,
    getNextStageConfig,
    getSafeStandingPoint,
    rebuildParcelConstructionVisual,
    rebuildAllConstructionVisuals,
    setBuildOpen,
    isBuildOpen: () => windowsUi?.isBuildOpen() ?? false,
    isBuildVisible: () => windowsUi?.isBuildVisible() ?? false,
    isBoothOpen: () => windowsUi?.isBoothOpen() ?? false,
    isShopRegisterOpen: () => windowsUi?.isShopRegisterOpen() ?? false,
    renderBuildWindow: () => windowsUi?.renderBuild(),
    openBoothDialog: (context) => windowsUi?.openBooth(context),
    closeBoothDialog: () => windowsUi?.closeBooth(),
    renderBoothDialog: () => windowsUi?.renderBooth(),
    tryAdvanceBuildStage,
    saveBuildSignText,
    assignDisplayEntry: (...args) => operationsController?.assignDisplayEntry(...args),
    clearDisplayEntry: (...args) => operationsController?.clearDisplayEntry(...args),
    collectShopSettlement: (...args) => operationsController?.collectShopSettlement(...args),
    assignDisplaySlotUser: (...args) => operationsController?.assignDisplaySlotUser(...args),
    clearDisplaySlotUser: (...args) => operationsController?.clearDisplaySlotUser(...args),
    openShopRegisterDialog: (...args) => operationsController?.openShopRegisterDialog(...args),
    closeShopRegisterDialog: () => operationsController?.closeShopRegisterDialog(),
    clearShopListing: (...args) => operationsController?.clearShopListing(...args),
    purchaseShopListing: (...args) => operationsController?.purchaseShopListing(...args),
    commitShopListing: () => operationsController?.commitShopListing(),
    renderShopRegisterDialog: () => operationsController?.renderShopRegisterDialog(),
    assignShopSlotUser: (...args) => operationsController?.assignShopSlotUser(...args),
    clearShopSlotUser: (...args) => operationsController?.clearShopSlotUser(...args),
    updateShopListingPrice: (...args) => operationsController?.updateShopListingPrice(...args),
    formatShopUserDisplay: (parcelLabel = getSelectedParcelLabel()) => formatFrontierShopUserDisplay(getShopAssignedWallet(parcelLabel), ctx.shortenWallet),
  };

  function createDefaultParcelOperationsState() {
    return createDefaultFrontierParcelOperationsState();
  }
}
