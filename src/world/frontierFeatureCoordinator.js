import {
  createDefaultFrontierParcelBuildEntry,
  createDefaultFrontierParcelOperationsState,
  normalizeFrontierBuildState,
  normalizeFrontierWalletAddress,
} from "../systems/frontier.js";

export function createFrontierFeatureCoordinator(ctx) {
  let parcelCoordinator = null;

  function getCoordinator() {
    if (!parcelCoordinator) throw new Error("Frontier parcel coordinator has not been initialized.");
    return parcelCoordinator;
  }

  function setParcelCoordinator(nextCoordinator) {
    parcelCoordinator = nextCoordinator;
    return parcelCoordinator;
  }

  function getCurrentWallet() {
    return parcelCoordinator?.getCurrentWallet() ?? normalizeFrontierWalletAddress(ctx.getWalletAddress());
  }

  function grantOfflineSellerCredits(walletAddress, amount) {
    const normalizedWallet = normalizeFrontierWalletAddress(walletAddress);
    const safeAmount = ctx.clampCredits(amount);
    if (!normalizedWallet || safeAmount <= 0) return false;
    if (normalizedWallet === getCurrentWallet()) {
      ctx.grantCredits(safeAmount);
      return true;
    }
    if (!ctx.devProfileIds.includes(normalizedWallet)) return false;

    const saveKey = ctx.getDevProfileSaveKey(normalizedWallet);
    let parsed = ctx.createDefaultPlayerSave();
    try {
      const raw = ctx.storage.getItem(saveKey);
      if (raw) {
        const stored = JSON.parse(raw);
        parsed = {
          ...parsed,
          ...stored,
          economy: { ...parsed.economy, ...(stored.economy ?? {}) },
        };
      }
    } catch {
      parsed = ctx.createDefaultPlayerSave();
    }
    parsed.economy = {
      ...ctx.createDefaultPlayerSave().economy,
      ...(parsed.economy ?? {}),
      credits: ctx.clampCredits((Number(parsed.economy?.credits) || 0) + safeAmount),
    };
    try {
      ctx.storage.setItem(saveKey, JSON.stringify(parsed));
      return true;
    } catch {
      return false;
    }
  }

  return {
    setParcelCoordinator,
    getCurrentWallet,
    grantOfflineSellerCredits,
    createDefaultBuildEntry: (label) => parcelCoordinator?.createDefaultBuildEntry(label) ?? createDefaultFrontierParcelBuildEntry(label),
    createDefaultParcelOperationsState: () => parcelCoordinator?.createDefaultParcelOperationsState() ?? createDefaultFrontierParcelOperationsState(),
    normalizeBuildState: (rawState) => parcelCoordinator?.normalizeBuildState(rawState) ?? normalizeFrontierBuildState(rawState, ctx.normalizeBuildStateOptions()),
    getAuthorityItemId: (label) => getCoordinator().getAuthorityItemId(label),
    hasAuthority: (label) => getCoordinator().hasAuthority(label),
    getShopPurchaseFeedback: (label, quantity) => getCoordinator().getShopPurchaseFeedback(label, quantity),
    getShopOperation: (label) => getCoordinator().getShopOperation(label),
    getDisplayOperation: (label, slotKey) => getCoordinator().getDisplayOperation(label, slotKey),
    assignDisplayEntry: (label, slotKey, entry) => getCoordinator().assignDisplayEntry(label, slotKey, entry),
    clearDisplayEntry: (label, slotKey) => getCoordinator().clearDisplayEntry(label, slotKey),
    getShopAssignedWallet: (label) => getCoordinator().getShopAssignedWallet(label),
    getShopSellerWallet: (label) => getCoordinator().getShopSellerWallet(label),
    isShopSeller: (label, wallet) => getCoordinator().isShopSeller(label, wallet),
    canManageShopSlot: (label) => getCoordinator().canManageShopSlot(label),
    canUseShopSlot: (label) => getCoordinator().canUseShopSlot(label),
    canEditShopListing: (label) => getCoordinator().canEditShopListing(label),
    canManageShopSellerTools: (label) => getCoordinator().canManageShopSellerTools(label),
    canRegisterShopListing: (label) => getCoordinator().canRegisterShopListing(label),
    canCollectShopSettlement: (label) => getCoordinator().canCollectShopSettlement(label),
    getDisplayAssignedWallet: (label, slotKey) => getCoordinator().getDisplayAssignedWallet(label, slotKey),
    canManageDisplaySlot: (label, slotKey) => getCoordinator().canManageDisplaySlot(label, slotKey),
    canUseDisplaySlot: (label, slotKey) => getCoordinator().canUseDisplaySlot(label, slotKey),
    getBoothInteractionPlan: (interactable) => getCoordinator().getBoothInteractionPlan(interactable),
    collectShopSettlement: (label) => getCoordinator().collectShopSettlement(label),
    assignDisplaySlotUser: (label, slotKey, wallet) => getCoordinator().assignDisplaySlotUser(label, slotKey, wallet),
    clearDisplaySlotUser: (label, slotKey) => getCoordinator().clearDisplaySlotUser(label, slotKey),
    getCurrentParcelLabel: () => getCoordinator().getCurrentParcelLabel(),
    getSelectedParcelLabel: () => getCoordinator().getSelectedParcelLabel(),
    getBuildState: (label) => getCoordinator().getBuildState(label),
    getSafeStandingPoint: (label) => getCoordinator().getSafeStandingPoint(label),
    rebuildAllConstructionVisuals: () => getCoordinator().rebuildAllConstructionVisuals(),
    getNextStageConfig: (stage) => getCoordinator().getNextStageConfig(stage),
    rebuildParcelConstructionVisual: (label) => getCoordinator().rebuildParcelConstructionVisual(label),
    renderBuildWindow: () => getCoordinator().renderBuildWindow(),
    setBuildOpen: (open) => getCoordinator().setBuildOpen(open),
    openShopRegisterDialog: (label) => getCoordinator().openShopRegisterDialog(label),
    closeShopRegisterDialog: () => getCoordinator().closeShopRegisterDialog(),
    clearShopListing: (label) => getCoordinator().clearShopListing(label),
    purchaseShopListing: (label, quantity) => getCoordinator().purchaseShopListing(label, quantity),
    commitShopListing: () => getCoordinator().commitShopListing(),
    renderShopRegisterDialog: () => getCoordinator().renderShopRegisterDialog(),
    assignShopSlotUser: (label, wallet) => getCoordinator().assignShopSlotUser(label, wallet),
    clearShopSlotUser: (label) => getCoordinator().clearShopSlotUser(label),
    updateShopListingPrice: (label, price) => getCoordinator().updateShopListingPrice(label, price),
    tryAdvanceBuildStage: () => getCoordinator().tryAdvanceBuildStage(),
    saveBuildSignText: () => getCoordinator().saveBuildSignText(),
    closeBoothDialog: () => getCoordinator().closeBoothDialog(),
    renderBoothDialog: () => getCoordinator().renderBoothDialog(),
    openBoothDialog: (options) => getCoordinator().openBoothDialog(options),
  };
}
