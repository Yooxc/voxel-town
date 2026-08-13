import {
  applyFrontierShopListingClearState,
  applyFrontierShopListingRegistrationState,
  createFrontierShopPurchasePlan,
  getFrontierShopListingClearPlan,
  getFrontierShopListingRegistrationPlan,
  getFrontierShopListingPriceUpdatePlan,
  getFrontierShopSlotUserAssignmentPlan,
  getFrontierShopSlotUserClearPlan,
} from "./frontier.js";

export function createFrontierRuntime({ clampPlayerCredits }) {
  function clearShopListing({ parcelLabel, canEdit, shopState, addItem }) {
    const plan = getFrontierShopListingClearPlan({
      parcelLabel,
      canEdit,
      shopState,
      clampPlayerCredits,
    });
    if (!plan.ok) return plan;
    if (!addItem(plan.itemId, plan.quantity)) {
      return { ok: false, reason: "inventory-full" };
    }
    applyFrontierShopListingClearState(shopState, plan);
    return { ok: true, plan };
  }

  function registerShopListing({
    parcelLabel,
    canRegister,
    itemId,
    quantity,
    price,
    ownedCount,
    shopState,
    sellerWallet,
    getStatusText,
    addItem,
    consumeItem,
  }) {
    const plan = getFrontierShopListingRegistrationPlan({
      parcelLabel,
      canRegister,
      itemId,
      quantity,
      price,
      ownedCount,
      shopState,
    });
    if (!plan.ok) return plan;
    if (plan.previousItemId && plan.previousQuantity > 0 && !addItem(plan.previousItemId, plan.previousQuantity)) {
      return { ok: false, reason: "inventory-full-previous" };
    }
    if (!consumeItem(plan.itemId, plan.quantity)) {
      if (plan.previousItemId && plan.previousQuantity > 0) consumeItem(plan.previousItemId, plan.previousQuantity);
      return { ok: false, reason: "consume-failed" };
    }
    applyFrontierShopListingRegistrationState(shopState, {
      ...plan,
      sellerWallet,
      statusText: getStatusText(plan.itemId, plan.quantity, plan.price),
    });
    return { ok: true, plan };
  }

  function purchaseShopListing({
    parcelLabel,
    shopState,
    quantity,
    currentWallet,
    canAffordPlayerCredits,
    addEntry,
    spendCredits,
    restoreInventory,
    restoreCredits,
    getStatusText,
  }) {
    const plan = createFrontierShopPurchasePlan({
      parcelLabel,
      shopState,
      quantity,
      currentWallet,
      canAffordPlayerCredits,
      clampPlayerCredits,
    });
    if (!plan.ok) return plan;
    if (!addEntry(plan.purchasedItemId, plan.purchaseQty)) {
      return { ok: false, reason: "inventory-full" };
    }
    if (!spendCredits(plan.totalPrice)) {
      restoreInventory();
      return { ok: false, reason: "credit-failed" };
    }
    if (!plan.sellerWallet) {
      restoreInventory();
      restoreCredits(plan.totalPrice);
      return { ok: false, reason: "seller-missing" };
    }
    shopState.pendingCredits = clampPlayerCredits((shopState.pendingCredits || 0) + plan.totalPrice);
    shopState.lifetimeCredits = clampPlayerCredits((shopState.lifetimeCredits || 0) + plan.totalPrice);
    shopState.quantity -= plan.purchaseQty;
    if (shopState.quantity <= 0) {
      shopState.itemId = "";
      shopState.quantity = 0;
      shopState.price = 0;
      shopState.statusText = "비어 있음";
    } else {
      shopState.statusText = getStatusText(shopState.itemId, shopState.quantity, shopState.price);
    }
    return { ok: true, plan };
  }

  function assignShopUser({ canManage, walletAddress, shopState, normalizeWalletAddress }) {
    const plan = getFrontierShopSlotUserAssignmentPlan({
      canManage,
      walletAddress,
      shopState,
      normalizeWalletAddress,
      clampPlayerCredits,
    });
    if (!plan.ok) return plan;
    shopState.userWallet = plan.walletAddress;
    return { ok: true, plan };
  }

  function clearShopUser({ canManage, shopState }) {
    const plan = getFrontierShopSlotUserClearPlan({ canManage, shopState, clampPlayerCredits });
    if (!plan.ok) return plan;
    shopState.userWallet = "";
    shopState.sellerWallet = "";
    return { ok: true, plan };
  }

  function updateShopPrice({ parcelLabel, canEdit, shopState, nextPrice, getStatusText }) {
    const plan = getFrontierShopListingPriceUpdatePlan({ parcelLabel, canEdit, shopState, nextPrice });
    if (!plan.ok) return plan;
    shopState.price = plan.price;
    shopState.statusText = getStatusText(shopState.itemId, shopState.quantity, plan.price);
    return { ok: true, plan };
  }

  return {
    clearShopListing,
    registerShopListing,
    purchaseShopListing,
    assignShopUser,
    clearShopUser,
    updateShopPrice,
  };
}
