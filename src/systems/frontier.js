import {
  getWastelandStructureDependencyError,
  getWastelandStructureFootprintCells,
  getWastelandStairLandingCell,
  getWastelandStructurePlacementKey,
} from "./wastelandBuilding.js";

export const FRONTIER_BUILDING_HEIGHT = 4.4;
export const FRONTIER_BUILDING_SIGN_MAX_CHARS = 8;

export const FRONTIER_BUILD_STAGE_CONFIG = [
  { from: 0, to: 25, wood: 10, stone: 6, label: "기둥 설치" },
  { from: 25, to: 50, wood: 14, stone: 9, label: "하단 벽면 시공" },
  { from: 50, to: 75, wood: 18, stone: 12, label: "상단 골조 보강" },
  { from: 75, to: 100, wood: 24, stone: 16, label: "천장 완성" },
];

export function getFrontierParcelAuthorityItemId(parcelLabel, authorityItemIds) {
  return authorityItemIds?.[parcelLabel] ?? null;
}

export function createDefaultFrontierShopState() {
  return {
    statusText: "비어 있음",
    itemId: "",
    quantity: 0,
    price: 0,
    userWallet: "",
    sellerWallet: "",
    pendingCredits: 0,
    lifetimeCredits: 0,
  };
}

export function createDefaultFrontierDisplayState() {
  return {
    statusText: "비어 있음",
    entry: null,
    userWallet: "",
  };
}

export function createDefaultFrontierParcelOperationsState() {
  return {
    shop: createDefaultFrontierShopState(),
    displayA: createDefaultFrontierDisplayState(),
    displayB: createDefaultFrontierDisplayState(),
  };
}

export function createDefaultFrontierParcelBuildEntry(label) {
  return {
    stage: 0,
    signText: label,
    operations: createDefaultFrontierParcelOperationsState(),
  };
}

export function createDefaultFrontierBuildState(parcelLabels) {
  return Object.fromEntries(
    parcelLabels.map((label) => [
      label.toLowerCase(),
      createDefaultFrontierParcelBuildEntry(label),
    ])
  );
}

export function normalizeFrontierWalletAddress(rawAddress) {
  return String(rawAddress || "").trim().toLowerCase();
}

export function formatFrontierShopStatusText(itemId, quantity, price, itemDefs) {
  if (!itemId || quantity <= 0) return "비어 있음";
  const itemName = itemDefs[itemId]?.name ?? itemId;
  return `${itemName} x${quantity} / ${price}원`;
}

export function formatFrontierDisplayStatusText(entry, getInventoryEntryDisplayName) {
  if (!entry) return "비어 있음";
  return `${getInventoryEntryDisplayName(entry)} 전시 중`;
}

export function getFrontierDisplaySummary(
  displayState,
  { normalizeInventorySlotEntry, getInventoryEntryDisplayName }
) {
  const entry = normalizeInventorySlotEntry(displayState?.entry);
  if (!entry) {
    return {
      active: false,
      itemName: "없음",
      statusText: "비어 있음",
      entry: null,
    };
  }
  return {
    active: true,
    itemName: getInventoryEntryDisplayName(entry),
    statusText: formatFrontierDisplayStatusText(entry, getInventoryEntryDisplayName),
    entry,
  };
}

export function getFrontierShopListingSummary(
  shopState,
  { itemDefs, clampPlayerCredits }
) {
  if (!shopState?.itemId || shopState.quantity <= 0) {
    return {
      active: false,
      itemName: "없음",
      quantity: 0,
      price: 0,
      totalPrice: 0,
      statusText: "비어 있음",
      pendingCredits: clampPlayerCredits(shopState?.pendingCredits || 0),
      lifetimeCredits: clampPlayerCredits(shopState?.lifetimeCredits || 0),
    };
  }
  return {
    active: true,
    itemName: itemDefs[shopState.itemId]?.name ?? shopState.itemId,
    quantity: shopState.quantity,
    price: shopState.price,
    totalPrice: clampPlayerCredits(shopState.quantity * shopState.price),
    statusText: formatFrontierShopStatusText(
      shopState.itemId,
      shopState.quantity,
      shopState.price,
      itemDefs
    ),
    pendingCredits: clampPlayerCredits(shopState.pendingCredits || 0),
    lifetimeCredits: clampPlayerCredits(shopState.lifetimeCredits || 0),
  };
}

export function normalizeFrontierShopOperationEntry(
  rawEntry,
  { itemDefs, clampPlayerCredits }
) {
  const source = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
  const itemId =
    typeof source.itemId === "string" && itemDefs[source.itemId]
      ? source.itemId
      : "";
  const quantity = itemId ? Math.max(0, Math.min(999, Math.floor(Number(source.quantity) || 0))) : 0;
  const price = itemId ? Math.max(0, Math.min(999999, Math.floor(Number(source.price) || 0))) : 0;
  const userWallet = normalizeFrontierWalletAddress(source.userWallet);
  const sellerWallet = normalizeFrontierWalletAddress(source.sellerWallet || userWallet);
  const pendingCredits = clampPlayerCredits(source.pendingCredits || 0);
  const lifetimeCredits = clampPlayerCredits(source.lifetimeCredits || 0);
  return {
    statusText: formatFrontierShopStatusText(itemId, quantity, price, itemDefs),
    itemId,
    quantity,
    price,
    userWallet,
    sellerWallet,
    pendingCredits,
    lifetimeCredits,
  };
}

export function normalizeFrontierDisplayOperationEntry(
  rawEntry,
  { normalizeInventorySlotEntry, getInventoryEntryDisplayName }
) {
  const source = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
  const entry = normalizeInventorySlotEntry(source.entry);
  return {
    statusText: formatFrontierDisplayStatusText(entry, getInventoryEntryDisplayName),
    entry,
    userWallet: normalizeFrontierWalletAddress(source.userWallet),
  };
}

export function normalizeFrontierParcelOperationsState(
  rawState,
  deps
) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const defaults = createDefaultFrontierParcelOperationsState();
  return {
    shop: normalizeFrontierShopOperationEntry(source.shop ?? defaults.shop, deps),
    displayA: normalizeFrontierDisplayOperationEntry(source.displayA ?? defaults.displayA, deps),
    displayB: normalizeFrontierDisplayOperationEntry(source.displayB ?? defaults.displayB, deps),
  };
}

export function normalizeFrontierParcelBuildEntry(
  label,
  rawEntry,
  {
    signMaxChars = FRONTIER_BUILDING_SIGN_MAX_CHARS,
    normalizeInventorySlotEntry,
    getInventoryEntryDisplayName,
    itemDefs,
    clampPlayerCredits,
  }
) {
  const source = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
  const stage = Number(source.stage);
  const normalizedStage = [0, 25, 50, 75, 100].includes(stage) ? stage : 0;
  const signText = String(source.signText ?? label).trim().slice(0, signMaxChars) || label;
  return {
    stage: normalizedStage,
    signText,
    operations: normalizeFrontierParcelOperationsState(source.operations, {
      normalizeInventorySlotEntry,
      getInventoryEntryDisplayName,
      itemDefs,
      clampPlayerCredits,
    }),
  };
}

export function normalizeFrontierBuildState(
  rawState,
  { parcelLabels, ...deps }
) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const normalized = {};
  for (const label of parcelLabels) {
    const key = label.toLowerCase();
    const legacyRaw = label === "P6" ? source.p6 : null;
    normalized[key] = normalizeFrontierParcelBuildEntry(label, source[key] ?? legacyRaw, deps);
  }
  return normalized;
}

export function getFrontierNextStageConfig(stage, stageConfig = FRONTIER_BUILD_STAGE_CONFIG) {
  return stageConfig.find((entry) => entry.from === stage) ?? null;
}

export function isFrontierShopSlotUser(assignedWallet, walletAddress) {
  const currentWallet = normalizeFrontierWalletAddress(walletAddress);
  if (!currentWallet) return false;
  return normalizeFrontierWalletAddress(assignedWallet) === currentWallet;
}

export function isFrontierShopSeller(sellerWallet, walletAddress) {
  const currentWallet = normalizeFrontierWalletAddress(walletAddress);
  if (!currentWallet) return false;
  return normalizeFrontierWalletAddress(sellerWallet) === currentWallet;
}

export function canManageFrontierShopSellerTools(shopState, walletAddress, clampPlayerCredits) {
  return isFrontierShopSeller(shopState?.sellerWallet, walletAddress) && (
    (shopState?.itemId && shopState?.quantity > 0) ||
    clampPlayerCredits(shopState?.pendingCredits || 0) > 0
  );
}

export function canRegisterFrontierShopListing(shopState, assignedWallet, walletAddress) {
  if (!isFrontierShopSlotUser(assignedWallet, walletAddress)) return false;
  if (!shopState?.itemId || shopState?.quantity <= 0) return true;
  return isFrontierShopSeller(shopState?.sellerWallet, walletAddress);
}

export function canCollectFrontierShopSettlement(shopState, walletAddress, clampPlayerCredits) {
  return isFrontierShopSeller(shopState?.sellerWallet, walletAddress) &&
    clampPlayerCredits(shopState?.pendingCredits || 0) > 0;
}

export function isFrontierDisplaySlotUser(assignedWallet, walletAddress) {
  const currentWallet = normalizeFrontierWalletAddress(walletAddress);
  if (!currentWallet) return false;
  return normalizeFrontierWalletAddress(assignedWallet) === currentWallet;
}

export function getFrontierCurrentParcelLabel(parcelLabels, isPlayerInsideFrontierParcel) {
  for (const label of parcelLabels) {
    if (isPlayerInsideFrontierParcel(label)) return label;
  }
  return "";
}

export function getFrontierSelectedParcelLabel(currentLabel, activeLabel, fallback = "P6") {
  return currentLabel || activeLabel || fallback;
}

export function getFrontierBuildStateEntry(frontierBuildState, parcelLabel, createDefaultEntry) {
  const key = String(parcelLabel || "P6").toLowerCase();
  if (!frontierBuildState[key]) {
    frontierBuildState[key] = createDefaultEntry(parcelLabel || "P6");
  }
  return frontierBuildState[key];
}

export function getFrontierShopOperation(frontierBuildState, parcelLabel, createDefaultEntry) {
  return getFrontierBuildStateEntry(frontierBuildState, parcelLabel, createDefaultEntry).operations.shop;
}

export function getFrontierDisplayOperation(frontierBuildState, parcelLabel, slotKey, createDefaultEntry) {
  return getFrontierBuildStateEntry(frontierBuildState, parcelLabel, createDefaultEntry).operations[slotKey];
}

export function getFrontierShopAssignedWallet(shopState) {
  return normalizeFrontierWalletAddress(shopState?.userWallet);
}

export function getFrontierShopSellerWallet(shopState) {
  return normalizeFrontierWalletAddress(shopState?.sellerWallet);
}

export function getFrontierDisplayAssignedWallet(displayState) {
  return normalizeFrontierWalletAddress(displayState?.userWallet);
}

export function canManageFrontierShopSlot(hasFrontierParcelAuthority, parcelLabel) {
  return hasFrontierParcelAuthority(parcelLabel);
}

export function canUseFrontierShopSlot(shopState, walletAddress) {
  return isFrontierShopSlotUser(shopState?.userWallet, walletAddress);
}

export function canEditFrontierShopListing(shopState, walletAddress) {
  if (!shopState?.itemId || shopState?.quantity <= 0) return false;
  return isFrontierShopSeller(shopState?.sellerWallet, walletAddress);
}

export function canManageFrontierDisplaySlot(hasFrontierParcelAuthority, parcelLabel) {
  return hasFrontierParcelAuthority(parcelLabel);
}

export function canUseFrontierDisplaySlot(displayState, walletAddress) {
  return isFrontierDisplaySlotUser(displayState?.userWallet, walletAddress);
}

export function getFrontierBoothInteractionPlan(interactable, fallbackParcelLabel, {
  canManageShopSlot,
  canUseShopSlot,
  canManageDisplaySlot,
  canUseDisplaySlot,
}) {
  if (interactable?.type === "frontierShopBooth") {
    const parcelLabel = interactable.parcelLabel ?? fallbackParcelLabel;
    const mode = canManageShopSlot(parcelLabel) || canUseShopSlot(parcelLabel) ? "manage" : "view";
    return {
      parcelLabel,
      slotKey: "shop",
      boothTitle: interactable.boothTitle ?? "상점",
      mode,
      hintText: mode === "manage" ? "E : 판매 관리" : "E : 판매 보기",
    };
  }
  if (interactable?.type === "frontierDisplayBooth") {
    const parcelLabel = interactable.parcelLabel ?? fallbackParcelLabel;
    const slotKey = interactable.slotKey ?? "displayA";
    const mode = canManageDisplaySlot(parcelLabel, slotKey) || canUseDisplaySlot(parcelLabel, slotKey)
      ? "manage"
      : "view";
    return {
      parcelLabel,
      slotKey,
      boothTitle: interactable.boothTitle ?? "전시",
      mode,
      hintText: mode === "manage" ? "E : 전시 관리" : "E : 전시 보기",
    };
  }
  return null;
}

export function getFrontierShopSellability(entry, {
  isNftInventoryEntry,
  getSlotItemId,
  itemDefs,
  getInventoryEntryCategory,
  isQuestCriticalItemBlockedFromDiscard,
}) {
  if (!entry || isNftInventoryEntry(entry)) return { ok: false, reason: "NFT 아이템은 판매 등록할 수 없습니다." };
  const itemId = getSlotItemId(entry);
  const def = itemDefs[itemId];
  if (!def) return { ok: false, reason: "알 수 없는 아이템입니다." };
  if (getInventoryEntryCategory(entry) === "equip") return { ok: false, reason: "장비 아이템은 판매 등록할 수 없습니다." };
  if (def.isAuthorityItem) return { ok: false, reason: "권한 아이템은 판매 등록할 수 없습니다." };
  if (isQuestCriticalItemBlockedFromDiscard(entry)) return { ok: false, reason: "퀘스트 아이템은 판매 등록할 수 없습니다." };
  if (!["cons", "misc"].includes(def.category)) return { ok: false, reason: "이 아이템은 판매할 수 없습니다." };
  return { ok: true, reason: "" };
}

export function getSellableFrontierShopEntries(inventorySlots, dependencies) {
  return (inventorySlots ?? [])
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry)
    .filter(({ entry }) => getFrontierShopSellability(entry, dependencies).ok);
}

export function getFrontierShopRegistrationAccess({ buildState, assignedWallet, canUse }) {
  if ((buildState?.stage ?? 0) < 100) {
    return { ok: false, reason: "건축 완료 후 상점을 운영할 수 있습니다." };
  }
  if (!assignedWallet) return { ok: false, reason: "상점 사용자 지정 필요" };
  if (!canUse) return { ok: false, reason: "상점 운영 권한이 없습니다." };
  return { ok: true, reason: "" };
}

export function isFrontierDisplayableEntry(entry, isQuestCriticalItemBlockedFromDiscard) {
  if (!entry) return { ok: false, reason: "전시할 아이템이 없습니다." };
  if (isQuestCriticalItemBlockedFromDiscard(entry)) {
    return { ok: false, reason: "퀘스트 아이템은 전시할 수 없습니다." };
  }
  return { ok: true };
}

export function getDisplayableFrontierEntries(inventorySlots, isQuestCriticalItemBlockedFromDiscard) {
  return inventorySlots
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry)
    .filter(({ entry }) => isFrontierDisplayableEntry(entry, isQuestCriticalItemBlockedFromDiscard).ok);
}

export function getFrontierShopPurchaseFeedback({
  parcelLabel,
  shopState,
  quantity,
  currentWallet,
  canAffordPlayerCredits,
  clampPlayerCredits,
  validateInventorySpace,
}) {
  const purchaseQty = Math.max(1, Math.floor(Number(quantity) || 0));
  const totalPrice = clampPlayerCredits((shopState?.price || 0) * purchaseQty);
  let purchaseResult = { ok: true, reason: "" };
  if (!parcelLabel) {
    purchaseResult = { ok: false, reason: "상점 정보를 찾을 수 없습니다." };
  } else if (!shopState?.itemId || shopState.quantity <= 0) {
    purchaseResult = { ok: false, reason: "등록된 판매 물품이 없습니다." };
  } else if (purchaseQty <= 0) {
    purchaseResult = { ok: false, reason: "구매 수량을 확인해주세요." };
  } else if (purchaseQty > shopState.quantity) {
    purchaseResult = { ok: false, reason: "재고가 부족합니다." };
  } else {
    const sellerWallet = normalizeFrontierWalletAddress(shopState.sellerWallet || shopState.userWallet);
    const normalizedCurrentWallet = normalizeFrontierWalletAddress(currentWallet);
    if (sellerWallet && sellerWallet === normalizedCurrentWallet) {
      purchaseResult = { ok: false, reason: "자신이 등록한 상품은 구매할 수 없습니다." };
    } else if (!canAffordPlayerCredits(totalPrice)) {
      purchaseResult = { ok: false, reason: "개척 코인이 부족합니다." };
    } else if (!validateInventorySpace()) {
      purchaseResult = { ok: false, reason: "인벤토리 공간이 부족합니다." };
    }
  }
  return {
    ok: purchaseResult.ok,
    reason: purchaseResult.ok ? "바로 구매할 수 있습니다." : purchaseResult.reason,
    totalPrice,
    purchaseQty,
  };
}

export function createFrontierShopPurchasePlan({
  parcelLabel,
  shopState,
  quantity,
  currentWallet,
  canAffordPlayerCredits,
  clampPlayerCredits,
}) {
  if (!parcelLabel) return { ok: false, reason: "상점 정보를 찾을 수 없습니다." };
  if (!shopState?.itemId || shopState.quantity <= 0) {
    return { ok: false, reason: "등록된 판매 물품이 없습니다." };
  }
  const purchaseQty = Math.max(1, Math.floor(Number(quantity) || 0));
  if (purchaseQty <= 0) return { ok: false, reason: "구매 수량을 확인해주세요." };
  if (purchaseQty > shopState.quantity) return { ok: false, reason: "재고가 부족합니다." };
  const sellerWallet = normalizeFrontierWalletAddress(shopState.sellerWallet || shopState.userWallet);
  if (sellerWallet && sellerWallet === normalizeFrontierWalletAddress(currentWallet)) {
    return { ok: false, reason: "자신이 등록한 상품은 구매할 수 없습니다." };
  }
  const totalPrice = clampPlayerCredits(shopState.price * purchaseQty);
  if (!canAffordPlayerCredits(totalPrice)) return { ok: false, reason: "개척 코인이 부족합니다." };
  return {
    ok: true,
    purchaseQty,
    totalPrice,
    purchasedItemId: shopState.itemId,
    sellerWallet,
  };
}

export function getFrontierShopListingClearPlan({ parcelLabel, canEdit, shopState, clampPlayerCredits }) {
  if (!parcelLabel || !canEdit) return { ok: false, reason: "" };
  if (!shopState?.itemId || shopState.quantity <= 0) {
    return { ok: false, reason: "현재 등록된 판매 물품이 없습니다.", duration: 900 };
  }
  return {
    ok: true,
    itemId: shopState.itemId,
    quantity: shopState.quantity,
    clearSellerWallet: clampPlayerCredits(shopState.pendingCredits || 0) <= 0,
  };
}

export function applyFrontierShopListingClearState(shopState, { clearSellerWallet }) {
  shopState.itemId = "";
  shopState.quantity = 0;
  shopState.price = 0;
  shopState.statusText = "비어 있음";
  if (clearSellerWallet) shopState.sellerWallet = "";
  return shopState;
}

export function getFrontierShopListingRegistrationPlan({
  parcelLabel,
  canRegister,
  itemId,
  quantity,
  price,
  ownedCount,
  shopState,
}) {
  if (!parcelLabel || !canRegister) return { ok: false, reason: "" };
  if (!itemId) return { ok: false, reason: "판매할 아이템을 먼저 선택하세요.", duration: 1000 };
  const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 0));
  const safePrice = Math.max(0, Math.floor(Number(price) || 0));
  if (ownedCount < safeQuantity) {
    return { ok: false, reason: "판매 수량만큼 아이템을 보유하고 있지 않습니다.", duration: 1000 };
  }
  return {
    ok: true,
    itemId,
    quantity: safeQuantity,
    price: safePrice,
    previousItemId: shopState?.itemId && shopState.quantity > 0 ? shopState.itemId : "",
    previousQuantity: shopState?.itemId && shopState.quantity > 0 ? shopState.quantity : 0,
  };
}

export function applyFrontierShopListingRegistrationState(shopState, { itemId, quantity, price, sellerWallet, statusText }) {
  shopState.itemId = itemId;
  shopState.quantity = quantity;
  shopState.price = price;
  shopState.sellerWallet = sellerWallet;
  shopState.statusText = statusText;
  return shopState;
}

export function getFrontierShopSlotUserAssignmentPlan({
  canManage,
  walletAddress,
  shopState,
  normalizeWalletAddress,
  clampPlayerCredits,
}) {
  if (!canManage) return { ok: false, reason: "" };
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  if (!normalizedWalletAddress) return { ok: false, reason: "지갑 주소를 입력해주세요.", duration: 1000 };
  if ((shopState?.itemId && shopState.quantity > 0) || clampPlayerCredits(shopState?.pendingCredits || 0) > 0) {
    return { ok: false, reason: "판매 물품 또는 정산금이 남아 있을 때는 상점 사용자를 변경할 수 없습니다.", duration: 1200 };
  }
  return { ok: true, walletAddress: normalizedWalletAddress };
}

export function getFrontierShopSlotUserClearPlan({ canManage, shopState, clampPlayerCredits }) {
  if (!canManage) return { ok: false, reason: "" };
  if ((shopState?.itemId && shopState.quantity > 0) || clampPlayerCredits(shopState?.pendingCredits || 0) > 0) {
    return { ok: false, reason: "판매 물품 또는 정산금이 남아 있을 때는 사용자를 해제할 수 없습니다.", duration: 1200 };
  }
  return { ok: true };
}

export function getFrontierShopListingPriceUpdatePlan({ parcelLabel, canEdit, shopState, nextPrice }) {
  if (!parcelLabel || !canEdit || !shopState?.itemId || shopState.quantity <= 0) {
    return { ok: false, reason: "" };
  }
  return { ok: true, price: Math.max(0, Math.min(999999, Math.floor(Number(nextPrice) || 0))) };
}

export function formatFrontierShopUserDisplay(assignedWallet, shortenWalletAddress) {
  return assignedWallet ? shortenWalletAddress(assignedWallet) : "미지정";
}

export function canAssignFrontierDisplayEntryState(slotKey, canUseSlot, entryValidation) {
  if (!["displayA", "displayB"].includes(slotKey)) {
    return { ok: false, reason: "" };
  }
  if (!canUseSlot) {
    return { ok: false, reason: "" };
  }
  if (!entryValidation?.ok) {
    return { ok: false, reason: entryValidation?.reason || "전시할 수 없습니다." };
  }
  return { ok: true, reason: "" };
}

export function assignFrontierDisplayEntryState(
  displayState,
  entry,
  { normalizeInventorySlotEntry, getInventoryEntryDisplayName }
) {
  displayState.entry = normalizeInventorySlotEntry(entry);
  displayState.statusText = formatFrontierDisplayStatusText(
    displayState.entry,
    getInventoryEntryDisplayName
  );
  return displayState;
}

export function canClearFrontierDisplayEntryState(slotKey, canUseSlot, displayState) {
  if (!["displayA", "displayB"].includes(slotKey)) {
    return { ok: false, reason: "" };
  }
  if (!canUseSlot) {
    return { ok: false, reason: "" };
  }
  if (!displayState?.entry) {
    return { ok: false, reason: "현재 전시 중인 대상이 없습니다." };
  }
  return { ok: true, reason: "" };
}

export function clearFrontierDisplayEntryState(displayState) {
  displayState.entry = null;
  displayState.statusText = "비어 있음";
  return displayState;
}

export function canAssignFrontierDisplaySlotUserState(slotKey, canManageSlot, displayState, walletAddress) {
  if (!["displayA", "displayB"].includes(slotKey)) {
    return { ok: false, reason: "", wallet: "" };
  }
  if (!canManageSlot) {
    return { ok: false, reason: "", wallet: "" };
  }
  if (displayState?.entry) {
    return { ok: false, reason: "전시 중인 대상이 있을 때는 사용자를 변경할 수 없습니다.", wallet: "" };
  }
  const normalizedWallet = normalizeFrontierWalletAddress(walletAddress);
  if (!normalizedWallet) {
    return { ok: false, reason: "지갑 주소를 입력해주세요.", wallet: "" };
  }
  return { ok: true, reason: "", wallet: normalizedWallet };
}

export function assignFrontierDisplaySlotUserState(displayState, normalizedWallet) {
  displayState.userWallet = normalizedWallet;
  return displayState;
}

export function canClearFrontierDisplaySlotUserState(slotKey, canManageSlot, displayState) {
  if (!["displayA", "displayB"].includes(slotKey)) {
    return { ok: false, reason: "" };
  }
  if (!canManageSlot) {
    return { ok: false, reason: "" };
  }
  if (displayState?.entry) {
    return { ok: false, reason: "전시 중인 대상이 있을 때는 사용자를 해제할 수 없습니다." };
  }
  return { ok: true, reason: "" };
}

export function clearFrontierDisplaySlotUserState(displayState) {
  displayState.userWallet = "";
  return displayState;
}

export function getCollectFrontierShopSettlementState(shopState, clampPlayerCredits) {
  const amount = clampPlayerCredits(shopState?.pendingCredits || 0);
  return {
    amount,
    sellerWallet: normalizeFrontierWalletAddress(shopState?.sellerWallet),
    canCollect: amount > 0,
  };
}

export function applyCollectedFrontierShopSettlementState(shopState) {
  shopState.pendingCredits = 0;
  return shopState;
}

export function getFrontierParcelSafeStandingPoint(parcel, frontierMapX, fallback) {
  if (!parcel) return fallback;
  const facesCenterLaneFromLeft = parcel.x < frontierMapX;
  return {
    x: parcel.x + (facesCenterLaneFromLeft ? parcel.width * 0.28 : -parcel.width * 0.28),
    z: parcel.z,
    rotationY: facesCenterLaneFromLeft ? Math.PI * 0.5 : -Math.PI * 0.5,
  };
}

export function getWastelandDraftBounds(draft, fencePosts) {
  const posts = (draft?.postKeys ?? [])
    .map((key) => fencePosts?.get?.(key))
    .filter(Boolean);
  if (!posts.length) return null;
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;
  for (const post of posts) {
    minRow = Math.min(minRow, post.row);
    maxRow = Math.max(maxRow, post.row);
    minCol = Math.min(minCol, post.col);
    maxCol = Math.max(maxCol, post.col);
  }
  return { minRow, maxRow, minCol, maxCol };
}

export function isCellInsideWastelandBounds(cell, bounds, buffer = 0) {
  if (!cell || !bounds) return false;
  return (
    cell.row >= bounds.minRow - buffer &&
    cell.row <= bounds.maxRow + buffer &&
    cell.col >= bounds.minCol - buffer &&
    cell.col <= bounds.maxCol + buffer
  );
}

export function canLinkWastelandFencePostsByOwner(post, otherPost) {
  return Boolean(
    post &&
      otherPost &&
      post.ownerId &&
      otherPost.ownerId &&
      post.ownerId === otherPost.ownerId
  );
}

export function findWastelandDraftReservationHit({
  cell,
  claimDrafts,
  currentOwnerId,
  getFencePostsByOwner,
  buffer = 0,
}) {
  if (!cell || !claimDrafts || !currentOwnerId || typeof getFencePostsByOwner !== "function") {
    return null;
  }
  for (const [draftOwnerId, draft] of claimDrafts.entries()) {
    if (!draft || draftOwnerId === currentOwnerId || !draft.postKeys?.length) continue;
    const bounds = getWastelandDraftBounds(draft, getFencePostsByOwner(draft, draftOwnerId));
    if (!bounds || !isCellInsideWastelandBounds(cell, bounds, buffer)) continue;
    return {
      ownerId: draftOwnerId,
      bounds,
      buffer,
      expiresAt: draft.expiresAt ?? 0,
    };
  }
  return null;
}

export function getWastelandDraftPhaseState({
  draft,
  isConfirmable,
  phases,
}) {
  if (!draft?.postKeys?.length) return phases.NONE;
  if (draft.phase === phases.EXPIRED) return phases.EXPIRED;
  return isConfirmable ? phases.CONFIRMABLE : phases.ACTIVE;
}

export function validateWastelandDraftRectangle({
  draft,
  fencePosts,
  cells,
  minWidth,
  minHeight,
}) {
  if (!draft?.postKeys?.length || !fencePosts) return null;
  const bounds = getWastelandDraftBounds(draft, fencePosts);
  if (!bounds) return null;
  const width = bounds.maxCol - bounds.minCol + 1;
  const height = bounds.maxRow - bounds.minRow + 1;
  if (!(Math.max(width, height) >= minWidth && Math.min(width, height) >= minHeight)) {
    return null;
  }
  const keySet = new Set(draft.postKeys);
  const requiredPostKeys = [];
  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
      const isBorder =
        row === bounds.minRow ||
        row === bounds.maxRow ||
        col === bounds.minCol ||
        col === bounds.maxCol;
      const key = `${row}:${col}`;
      if (isBorder) {
        requiredPostKeys.push(key);
        if (!keySet.has(key)) return null;
      } else if (keySet.has(key)) {
        return null;
      }
    }
  }
  return {
    ...bounds,
    width,
    height,
    requiredPostKeys,
    cellIds: (cells ?? [])
      .filter(
        (cell) =>
          cell.row >= bounds.minRow &&
          cell.row <= bounds.maxRow &&
          cell.col >= bounds.minCol &&
          cell.col <= bounds.maxCol
      )
      .map((cell) => cell.id),
  };
}

export function getWastelandClaimProgress(claim, getCellById) {
  if (!claim) return null;
  let preparedPercent = 0;
  for (const cellId of claim.cellIds ?? []) {
    const cell = getCellById(cellId);
    const progress = Number.isFinite(Number(cell?.clearProgress))
      ? Number(cell.clearProgress)
      : cell?.state === "dug3" ? 100 : cell?.state === "dug2" ? 50 : cell?.state === "dug1" ? 25 : 0;
    preparedPercent += Math.max(0, Math.min(100, progress));
  }
  const total = claim.cellIds?.length ?? 0;
  const percent = total > 0 ? preparedPercent / total : 0;
  return {
    claim,
    completed: Math.round((percent / 100) * total),
    total,
    percent,
    readyToComplete: total > 0 && percent >= 80,
  };
}

export function canCompleteWastelandClaimState(progress, ownerId) {
  const claim = progress?.claim;
  return Boolean(
    claim &&
    progress.readyToComplete &&
    (!claim.status || claim.status === "active") &&
    !claim.rewardIssuedAt &&
    claim.ownerId === ownerId
  );
}

export function canCancelWastelandClaimState(progress, ownerId) {
  const claim = progress?.claim;
  return Boolean(
    claim &&
    claim.ownerId === ownerId &&
    claim.status !== "completed" &&
    !claim.rewardIssuedAt
  );
}

export function getWastelandClaimPhaseState({
  progress,
  claimStatuses,
  claimPhases,
}) {
  const claim = progress?.claim;
  if (!claim) return claimPhases.NONE;
  if (claim.status === claimStatuses.COMPLETED) return claimPhases.COMPLETED;
  if (claim.status === claimStatuses.FAILED) return claimPhases.FAILED;
  if (progress.readyToComplete && !claim.rewardIssuedAt) return claimPhases.REWARD_PENDING;
  return claimPhases.ACTIVE;
}

export function canBuildOnWastelandCellState({
  cell,
  claim,
  hasLandDeed,
  currentOwnerId,
  structures = [],
  foundations,
  structureSlot = "",
  structurePlacementKey = "",
  structureItemId = "",
  buildLevel = 0,
  structureRotationQuarter = 0,
  minSpacing = 2,
}) {
  if (!currentOwnerId) {
    return { ok: false, reason: "건축은 지갑 로그인이 필요합니다." };
  }
  if (!cell || !claim) {
    return { ok: false, reason: "내 확정 구역에서만 건축할 수 있습니다" };
  }
  if (
    cell.row < claim.minRow ||
    cell.row > claim.maxRow ||
    cell.col < claim.minCol ||
    cell.col > claim.maxCol
  ) {
    return { ok: false, reason: "내 확정 구역에서만 건축할 수 있습니다" };
  }
  if (!hasLandDeed) {
    return { ok: false, reason: "해당 토지권을 보유해야 건축할 수 있습니다." };
  }
  const foundation = Array.isArray(foundations) && foundations.find((entry) => (
    entry?.status === "completed"
    && entry.ownerId === currentOwnerId
    && cell.row >= entry.bounds.minRow && cell.row <= entry.bounds.maxRow
    && cell.col >= entry.bounds.minCol && cell.col <= entry.bounds.maxCol
  ));
  if (Array.isArray(foundations) && !foundation) {
    return { ok: false, reason: "완성된 건축 기초 위에서만 건축할 수 있습니다" };
  }
  if (structurePlacementKey && structures.some((structure) => (
    structure?.placementKey || getWastelandStructurePlacementKey({
      cell: structure,
      slot: structure?.slot,
      rotationQuarter: structure?.rotationQuarter,
      level: structure?.level,
    })
  ) === structurePlacementKey)) {
    return { ok: false, reason: "이미 해당 변에 건축물이 있습니다." };
  }
  const dependencyError = structureItemId
    ? getWastelandStructureDependencyError({
      structures,
      row: cell.row,
      col: cell.col,
      itemId: structureItemId,
      level: buildLevel,
      rotationQuarter: structureRotationQuarter,
    })
    : "";
  if (dependencyError) return { ok: false, reason: dependencyError };
  if (structureSlot === "stairs") {
    const footprint = getWastelandStructureFootprintCells(cell, structureSlot, structureRotationQuarter);
    const stairCells = [...footprint, getWastelandStairLandingCell(cell, structureRotationQuarter)];
    if (foundation && stairCells.some((candidate) => (
      candidate.row < foundation.bounds.minRow || candidate.row > foundation.bounds.maxRow
      || candidate.col < foundation.bounds.minCol || candidate.col > foundation.bounds.maxCol
    ))) return { ok: false, reason: "계단이 건축 기초 영역을 벗어납니다." };
    const hasOverlap = structures.some((structure) => {
      if (structure?.slot !== "stairs") return false;
      const existingFootprint = Array.isArray(structure.footprintCells)
        ? structure.footprintCells
        : getWastelandStructureFootprintCells(structure, structure.slot, structure.rotationQuarter);
      return existingFootprint.some((existing) => footprint.some((candidate) => (
        Number(existing.row) === candidate.row && Number(existing.col) === candidate.col
      )));
    });
    if (hasOverlap) return { ok: false, reason: "계단이 다른 계단과 겹칩니다." };
  }
  if (!structurePlacementKey && structures.some(
    (structure) =>
      Number(structure?.row) === cell.row &&
      Number(structure?.col) === cell.col &&
      (!structureSlot || String(structure?.slot ?? "") === structureSlot)
  )) {
    return { ok: false, reason: "이미 건축물이 있는 셀입니다." };
  }
  if (
    minSpacing > 0 &&
    structures.some(
      (structure) =>
        Math.abs(Number(structure?.row) - cell.row) <= minSpacing &&
        Math.abs(Number(structure?.col) - cell.col) <= minSpacing
    )
  ) {
    return { ok: false, reason: "주변 2셀 이내에는 다른 건축물을 지을 수 없습니다" };
  }
  return { ok: true, reason: "" };
}

export function getConflictingWastelandFencePostsForClaim({
  fencePosts,
  claim,
  buffer = 2,
}) {
  if (!fencePosts || !claim) return [];
  return [...fencePosts.values()].filter(
    (post) => post && post.ownerId !== claim.ownerId && isCellInsideWastelandBounds(post, claim, buffer)
  );
}

export function createEmptyFrontierWastelandState() {
  return {
    cells: [],
    drafts: [],
    fencePosts: [],
    claims: [],
    structures: [],
    foundations: [],
    terrainDepthByCell: {},
    revision: 0,
  };
}

export function rebuildWastelandDraftsFromFencePosts({
  fencePosts,
  claims,
  previousDrafts,
  now,
  reservationMs,
  activePhase,
}) {
  const claimedPostKeys = new Set(
    (claims ?? []).flatMap((claim) => claim?.postKeys ?? [])
  );
  const groupedPostKeys = new Map();
  for (const post of [...(fencePosts?.values?.() ?? [])]) {
    if (!post?.ownerId || claimedPostKeys.has(post.key)) continue;
    if (!groupedPostKeys.has(post.ownerId)) groupedPostKeys.set(post.ownerId, []);
    groupedPostKeys.get(post.ownerId).push(post.key);
  }

  const nextDrafts = new Map();
  for (const [ownerId, postKeys] of groupedPostKeys.entries()) {
    postKeys.sort();
    const previousDraft = previousDrafts?.get(ownerId);
    nextDrafts.set(ownerId, {
      ownerId,
      postKeys,
      lastPromptSignature: previousDraft?.lastPromptSignature ?? "",
      reservedAt: previousDraft?.reservedAt ?? now,
      updatedAt: previousDraft?.updatedAt ?? now,
      expiresAt: previousDraft?.expiresAt ?? now + reservationMs,
      phase: previousDraft?.phase ?? activePhase,
    });
  }
  return nextDrafts;
}

export function partitionExpiredWastelandClaims(claims, now) {
  const expired = [];
  const active = [];
  for (const claim of claims ?? []) {
    if (claim?.expiresAt <= now) {
      expired.push(claim);
    } else {
      active.push(claim);
    }
  }
  return { expired, active };
}

export function getExpiredWastelandDraftReservations(claimDrafts, now) {
  return [...(claimDrafts?.entries?.() ?? [])].filter(
    ([, draft]) => draft?.postKeys?.length && draft.expiresAt && draft.expiresAt <= now
  );
}

export function serializeFrontierWastelandServerState(rawState) {
  return normalizeFrontierWastelandState(rawState);
}

export function normalizeFrontierWastelandState(rawState) {
  const raw = rawState && typeof rawState === "object" ? rawState : {};
  const cells = Array.isArray(raw.cells)
    ? raw.cells
        .map((cell) => ({
          id: String(cell?.id ?? ""),
          clearProgress: Math.max(0, Math.min(100, Math.floor(Number(cell?.clearProgress) || 0))),
        }))
        .filter((cell) => cell.id)
    : [];
  const fencePosts = Array.isArray(raw.fencePosts)
    ? raw.fencePosts
        .map((post) => ({
          key: String(post?.key ?? ""),
          row: Number(post?.row),
          col: Number(post?.col),
          x: Number(post?.x),
          z: Number(post?.z),
          ownerId: String(post?.ownerId ?? ""),
        }))
        .filter(
          (post) =>
            post.key &&
            Number.isFinite(post.row) &&
            Number.isFinite(post.col) &&
            Number.isFinite(post.x) &&
            Number.isFinite(post.z) &&
            post.ownerId
        )
    : [];
  const drafts = Array.isArray(raw.drafts)
    ? raw.drafts
        .map((draft) => ({
          ownerId: String(draft?.ownerId ?? ""),
          postKeys: Array.isArray(draft?.postKeys) ? draft.postKeys.map(String).filter(Boolean) : [],
          reservedAt: Number(draft?.reservedAt) || 0,
          updatedAt: Number(draft?.updatedAt) || 0,
          expiresAt: Number(draft?.expiresAt) || 0,
          phase: String(draft?.phase ?? ""),
        }))
        .filter((draft) => draft.ownerId && draft.postKeys.length > 0)
    : [];
  const structures = Array.isArray(raw.structures)
    ? raw.structures
        .map((structure) => ({
          key: String(structure?.key ?? ""),
          landId: String(structure?.landId ?? ""),
          ownerId: String(structure?.ownerId ?? ""),
          type: String(structure?.type ?? ""),
          slot: String(structure?.slot ?? ""),
          structureKind: String(structure?.structureKind ?? structure?.slot ?? ""),
          row: Number(structure?.row),
          col: Number(structure?.col),
          rotationQuarter: Number(structure?.rotationQuarter) || 0,
          level: Number(structure?.level) === 1 ? 1 : 0,
          edge: String(structure?.edge ?? ""),
          placementKey: String(structure?.placementKey ?? ""),
          cellSize: Number(structure?.cellSize) || 0,
          isOpen: Boolean(structure?.isOpen),
          createdAt: Number(structure?.createdAt) || 0,
        }))
        .map((structure) => ({
          ...structure,
          edge: structure.slot === "wall" ? (["north", "east", "south", "west"][structure.rotationQuarter % 4] ?? "north") : "",
          placementKey: structure.placementKey || getWastelandStructurePlacementKey({
            cell: structure,
            slot: structure.slot,
            rotationQuarter: structure.rotationQuarter,
            level: structure.level,
          }),
        }))
        .filter(
          (structure) =>
            Number.isFinite(structure.row) &&
            Number.isFinite(structure.col)
        )
    : [];
  const claims = Array.isArray(raw.claims)
    ? raw.claims
        .map((claim) => ({
          status:
            claim?.status === "completed" ||
            claim?.status === "failed" ||
            claim?.status === "cancelled"
              ? claim.status
              : "active",
          ownerId: String(claim?.ownerId ?? ""),
          mapId: String(claim?.mapId ?? "frontier-wasteland"),
          landId: String(claim?.landId ?? ""),
          displayName: String(claim?.displayName ?? ""),
          detailAddress: String(claim?.detailAddress ?? ""),
          minRow: Number(claim?.minRow),
          maxRow: Number(claim?.maxRow),
          minCol: Number(claim?.minCol),
          maxCol: Number(claim?.maxCol),
          width: Number(claim?.width),
          height: Number(claim?.height),
          cellIds: Array.isArray(claim?.cellIds) ? claim.cellIds.map(String).filter(Boolean) : [],
          postKeys: Array.isArray(claim?.postKeys) ? claim.postKeys.map(String).filter(Boolean) : [],
          confirmedAt: Number(claim?.confirmedAt) || 0,
          expiresAt: Number(claim?.expiresAt) || 0,
          completedAt: Number(claim?.completedAt) || 0,
          rewardItemId: String(claim?.rewardItemId ?? ""),
          rewardIssuedAt: Number(claim?.rewardIssuedAt) || 0,
        }))
        .filter(
          (claim) =>
            claim.ownerId &&
            Number.isFinite(claim.minRow) &&
            Number.isFinite(claim.maxRow) &&
            Number.isFinite(claim.minCol) &&
            Number.isFinite(claim.maxCol)
        )
    : [];
  const foundations = Array.isArray(raw.foundations)
    ? raw.foundations
        .map((foundation) => ({
          id: String(foundation?.id ?? ""),
          ownerId: String(foundation?.ownerId ?? ""),
          landId: String(foundation?.landId ?? ""),
          status: foundation?.status === "completed" ? "completed" : "excavating",
          bounds: {
            minRow: Number(foundation?.bounds?.minRow),
            maxRow: Number(foundation?.bounds?.maxRow),
            minCol: Number(foundation?.bounds?.minCol),
            maxCol: Number(foundation?.bounds?.maxCol),
            width: Number(foundation?.bounds?.width),
            height: Number(foundation?.bounds?.height),
          },
          postKeys: Array.isArray(foundation?.postKeys) ? foundation.postKeys.map(String).filter(Boolean) : [],
          createdAt: Number(foundation?.createdAt) || 0,
          completedAt: Number(foundation?.completedAt) || 0,
        }))
        .filter((foundation) => foundation.id && foundation.ownerId && [
          foundation.bounds.minRow,
          foundation.bounds.maxRow,
          foundation.bounds.minCol,
          foundation.bounds.maxCol,
        ].every(Number.isFinite))
    : [];
  const terrainDepthByCell = Object.fromEntries(
    Object.entries(raw.terrainDepthByCell && typeof raw.terrainDepthByCell === "object" ? raw.terrainDepthByCell : {})
      .filter(([key, value]) => /^-?\d+:-?\d+$/.test(key) && Number.isFinite(Number(value)))
      .map(([key, value]) => [key, Math.max(0, Math.min(1.5, Number(value)))])
  );
  const terrainHeights = Array.isArray(raw.terrainHeights)
    ? raw.terrainHeights.map((height) => Math.max(-1.5, Math.min(0, Number(height) || 0)))
    : [];
  return {
    cells,
    drafts,
    fencePosts,
    claims,
    structures,
    foundations,
    terrainDepthByCell,
    terrainHeights,
    revision: Math.max(0, Math.floor(Number(raw.revision) || 0)),
  };
}
