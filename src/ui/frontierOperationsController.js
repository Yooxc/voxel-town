export function createFrontierOperationsController(ctx) {
  const registerState = { open: false, parcelLabel: "", itemId: "", available: 0 };

  function notify(message, duration = 1000) {
    if (!message) return;
    ctx.showUI(message, duration);
    ctx.setLastMessageUntil(ctx.now() + duration);
  }

  function refresh(parcelLabel, { inventory = false, booth = false, build = true, register = false } = {}) {
    ctx.rebuildParcel(parcelLabel);
    if (inventory) ctx.updateInventoryUI();
    ctx.scheduleSave(true);
    if (booth) ctx.renderBoothDialog();
    if (build && ctx.isBuildOpen()) ctx.renderBuildWindow();
    if (register) renderShopRegisterDialog();
  }

  function assignDisplayEntry(parcelLabel, slotKey, entry) {
    const validation = ctx.isDisplayableEntry(entry);
    const result = ctx.canAssignDisplayEntry(slotKey, Boolean(parcelLabel) && ctx.canUseDisplaySlot(parcelLabel, slotKey), validation);
    if (!result.ok) {
      notify(result.reason);
      return false;
    }
    ctx.assignDisplayEntryState(ctx.getDisplayOperation(parcelLabel, slotKey), entry);
    refresh(parcelLabel, { booth: true });
    notify(`${ctx.getEntryName(entry)} 전시`);
    return true;
  }

  function clearDisplayEntry(parcelLabel, slotKey) {
    const displayState = ctx.getDisplayOperation(parcelLabel, slotKey);
    const result = ctx.canClearDisplayEntry(slotKey, Boolean(parcelLabel) && ctx.canUseDisplaySlot(parcelLabel, slotKey), displayState);
    if (!result.ok) {
      notify(result.reason, 900);
      return false;
    }
    ctx.clearDisplayEntryState(displayState);
    refresh(parcelLabel, { booth: true });
    notify("전시를 해제했습니다.", 900);
    return true;
  }

  function collectShopSettlement(parcelLabel = ctx.getSelectedParcelLabel()) {
    if (!parcelLabel || !ctx.canCollectSettlement(parcelLabel)) {
      notify("회수할 정산금이 없거나 판매자 권한이 없습니다.", 1100);
      return false;
    }
    const shopState = ctx.getShopOperation(parcelLabel);
    const settlement = ctx.getSettlement(shopState);
    if (!settlement.canCollect) return false;
    if (!ctx.grantSellerCredits(settlement.sellerWallet, settlement.amount)) {
      notify("정산금 회수에 실패했습니다.", 1100);
      return false;
    }
    ctx.applySettlement(shopState);
    refresh(parcelLabel, { inventory: true, booth: true });
    notify(`정산금 ${settlement.amount}원을 회수했습니다.`, 1100);
    return true;
  }

  function assignDisplaySlotUser(parcelLabel, slotKey, walletAddress) {
    const displayState = ctx.getDisplayOperation(parcelLabel, slotKey);
    const result = ctx.canAssignDisplayUser(slotKey, Boolean(parcelLabel) && ctx.canManageDisplaySlot(parcelLabel, slotKey), displayState, walletAddress);
    if (!result.ok) {
      notify(result.reason, result.reason?.includes("입력") ? 1000 : 1100);
      return false;
    }
    ctx.assignDisplayUserState(displayState, result.wallet);
    ctx.scheduleSave(true);
    if (ctx.isBuildOpen()) ctx.renderBuildWindow();
    notify(`${slotKey === "displayA" ? "전시 A" : "전시 B"} 사용자를 ${ctx.shortenWallet(result.wallet)}(으)로 지정했습니다.`, 1100);
    return true;
  }

  function clearDisplaySlotUser(parcelLabel, slotKey) {
    const displayState = ctx.getDisplayOperation(parcelLabel, slotKey);
    const result = ctx.canClearDisplayUser(slotKey, Boolean(parcelLabel) && ctx.canManageDisplaySlot(parcelLabel, slotKey), displayState);
    if (!result.ok) {
      notify(result.reason, 1100);
      return false;
    }
    ctx.clearDisplayUserState(displayState);
    ctx.scheduleSave(true);
    if (ctx.isBuildOpen()) ctx.renderBuildWindow();
    notify(`${slotKey === "displayA" ? "전시 A" : "전시 B"} 사용자를 해제했습니다.`);
    return true;
  }

  function openShopRegisterDialog(parcelLabel = ctx.getSelectedParcelLabel()) {
    const access = ctx.getShopRegistrationAccess(parcelLabel);
    if (!access.ok) {
      notify(access.reason);
      return false;
    }
    Object.assign(registerState, { open: true, parcelLabel, itemId: "", available: 0 });
    ctx.setRegisterOpen(true);
    ctx.elements.overlay.style.display = "block";
    ctx.elements.window.style.display = "block";
    ctx.closeBoothDialog();
    renderShopRegisterDialog();
    return true;
  }

  function closeShopRegisterDialog() {
    Object.assign(registerState, { open: false, parcelLabel: "", itemId: "", available: 0 });
    ctx.setRegisterOpen(false);
    ctx.elements.overlay.style.display = "none";
    ctx.elements.window.style.display = "none";
  }

  function clearShopListing(parcelLabel = registerState.parcelLabel) {
    const result = ctx.runtime.clearShopListing({ parcelLabel, canEdit: ctx.canEditShop(parcelLabel), shopState: ctx.getShopOperation(parcelLabel), addItem: ctx.addItem });
    if (!result.ok) {
      notify(result.reason === "inventory-full" ? "인벤토리가 가득 차 판매 물품을 회수할 수 없습니다." : result.reason, result.reason === "inventory-full" ? 1200 : result.duration);
      return false;
    }
    refresh(parcelLabel, { inventory: true, register: true });
    notify("판매 물품을 회수했습니다.");
    return true;
  }

  function purchaseShopListing(parcelLabel, quantity) {
    const inventorySnapshot = ctx.snapshotInventory();
    const purchase = ctx.runtime.purchaseShopListing({
      parcelLabel,
      shopState: ctx.getShopOperation(parcelLabel),
      quantity,
      currentWallet: ctx.getCurrentWallet(),
      canAffordPlayerCredits: ctx.canAffordCredits,
      addEntry: ctx.addPurchasedEntry,
      spendCredits: ctx.spendCredits,
      restoreInventory: () => ctx.restoreInventory(inventorySnapshot),
      restoreCredits: ctx.grantCredits,
      getStatusText: ctx.getShopStatusText,
    });
    if (!purchase.ok) {
      const messages = { "inventory-full": "인벤토리 공간이 부족합니다.", "credit-failed": "개척 코인을 차감하지 못했습니다.", "seller-missing": "판매자 정보를 찾을 수 없습니다." };
      return { ...purchase, reason: messages[purchase.reason] ?? purchase.reason };
    }
    refresh(parcelLabel, { inventory: true });
    return { ok: true, itemName: ctx.getItemName(purchase.plan.purchasedItemId), totalPrice: purchase.plan.totalPrice };
  }

  function commitShopListing() {
    const parcelLabel = registerState.parcelLabel || ctx.getSelectedParcelLabel();
    const listing = ctx.runtime.registerShopListing({
      parcelLabel,
      canRegister: ctx.canRegisterShop(parcelLabel),
      itemId: registerState.itemId,
      quantity: ctx.elements.quantityInput.value,
      price: ctx.elements.priceInput.value,
      ownedCount: ctx.getItemCount(registerState.itemId),
      shopState: ctx.getShopOperation(parcelLabel),
      sellerWallet: ctx.getCurrentWallet(),
      getStatusText: ctx.getShopStatusText,
      addItem: ctx.addItem,
      consumeItem: ctx.consumeItem,
    });
    if (!listing.ok) {
      const messages = { "inventory-full-previous": "기존 판매 물품을 회수할 인벤토리 공간이 부족합니다.", "consume-failed": "판매 물품을 등록하지 못했습니다." };
      notify(messages[listing.reason] ?? listing.reason, listing.duration ?? 1000);
      return false;
    }
    refresh(parcelLabel, { inventory: true, register: true });
    notify("판매 물품을 등록했습니다.");
    return true;
  }

  function renderShopRegisterDialog() {
    if (!registerState.open) return;
    const parcelLabel = registerState.parcelLabel || ctx.getSelectedParcelLabel();
    const summary = ctx.getShopListingSummary(ctx.getShopOperation(parcelLabel));
    const assignedWallet = ctx.getShopAssignedWallet(parcelLabel);
    const elements = ctx.elements;
    elements.title.textContent = `${parcelLabel} 판매 등록`;
    elements.currentStatus.innerHTML = summary.active
      ? `현재 판매 상태: <strong>${summary.statusText}</strong><br><span style="font-weight:600;color:#6b6053;">상품 ${summary.itemName} / 재고 ${summary.quantity}개 / 개당 ${summary.price}원 / 상점 사용자 ${assignedWallet ? ctx.shortenWallet(assignedWallet) : "미지정"}</span>`
      : `현재 판매 상태: <strong>비어 있음</strong><br><span style="font-weight:600;color:#6b6053;">상점 사용자 ${assignedWallet ? ctx.shortenWallet(assignedWallet) : "미지정"} / 판매 중인 상품 없음</span>`;
    elements.inventoryGrid.replaceChildren();
    const entries = ctx.getSellableEntries();
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.textContent = "판매 등록 가능한 재료/소비 아이템이 없습니다.";
      Object.assign(empty.style, { gridColumn: "1 / -1", padding: "16px 10px", borderRadius: "12px", background: "rgba(0,0,0,0.05)", fontSize: "13px", color: "#666" });
      elements.inventoryGrid.appendChild(empty);
    }
    for (const { entry } of entries) {
      const itemId = ctx.getEntryItemId(entry);
      const count = ctx.getEntryCount(entry);
      const card = document.createElement("button");
      card.type = "button";
      Object.assign(card.style, { border: registerState.itemId === itemId ? "2px solid rgba(255,145,45,0.95)" : "1px solid rgba(0,0,0,0.14)", borderRadius: "12px", background: registerState.itemId === itemId ? "rgba(255,235,205,0.88)" : "rgba(255,255,255,0.96)", padding: "10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" });
      card.appendChild(ctx.createEntryVisual(entry, { size: 40 }));
      const name = document.createElement("div");
      name.textContent = ctx.getEntryName(entry);
      Object.assign(name.style, { fontSize: "12px", fontWeight: "800", color: "#333", textAlign: "center" });
      card.appendChild(name);
      const meta = document.createElement("div");
      meta.textContent = `보유 ${count}개`;
      Object.assign(meta.style, { fontSize: "11px", color: "#7a6550" });
      card.appendChild(meta);
      card.addEventListener("click", () => {
        Object.assign(registerState, { itemId, available: count });
        elements.quantityInput.max = String(count);
        elements.quantityInput.value = "1";
        renderShopRegisterDialog();
      });
      elements.inventoryGrid.appendChild(card);
    }
    const selectedName = registerState.itemId ? ctx.getItemName(registerState.itemId) : "선택 없음";
    elements.selectedItem.textContent = `선택한 아이템: ${selectedName}`;
    elements.selectedOwned.textContent = registerState.itemId ? `보유 수량: ${registerState.available}개 / 등록 시 기존 상품은 회수 후 새 상품으로 교체됩니다.` : "보유 수량: 0개 / 판매할 아이템을 먼저 고르세요.";
    elements.quantityInput.max = String(Math.max(1, registerState.available));
    if (!registerState.itemId) elements.quantityInput.value = "1";
    elements.registerButton.disabled = !registerState.itemId;
    elements.registerButton.style.opacity = elements.registerButton.disabled ? "0.58" : "1";
    elements.clearButton.disabled = !ctx.canEditShop(parcelLabel);
    elements.clearButton.style.opacity = elements.clearButton.disabled ? "0.58" : "1";
  }

  function assignShopSlotUser(parcelLabel, walletAddress) {
    const result = ctx.runtime.assignShopUser({ canManage: ctx.canManageShopSlot(parcelLabel), walletAddress, shopState: ctx.getShopOperation(parcelLabel), normalizeWalletAddress: ctx.normalizeWallet });
    if (!result.ok) {
      notify(result.reason, result.duration);
      return false;
    }
    ctx.scheduleSave(true);
    ctx.renderBuildWindow();
    notify(`상점 사용자를 ${ctx.shortenWallet(result.plan.walletAddress)}(으)로 지정했습니다.`, 1100);
    return true;
  }

  function clearShopSlotUser(parcelLabel) {
    const result = ctx.runtime.clearShopUser({ canManage: ctx.canManageShopSlot(parcelLabel), shopState: ctx.getShopOperation(parcelLabel) });
    if (!result.ok) {
      notify(result.reason, result.duration);
      return false;
    }
    ctx.scheduleSave(true);
    ctx.renderBuildWindow();
    notify("상점 사용자를 해제했습니다.");
    return true;
  }

  function updateShopListingPrice(parcelLabel, nextPrice) {
    const result = ctx.runtime.updateShopPrice({ parcelLabel, canEdit: ctx.canEditShop(parcelLabel), shopState: ctx.getShopOperation(parcelLabel), nextPrice, getStatusText: ctx.getShopStatusText });
    if (!result.ok) return false;
    refresh(parcelLabel, { booth: true });
    notify(`판매 가격을 ${result.plan.price}원으로 수정했습니다.`);
    return true;
  }

  return {
    assignDisplayEntry, clearDisplayEntry, collectShopSettlement, assignDisplaySlotUser,
    clearDisplaySlotUser, openShopRegisterDialog, closeShopRegisterDialog, clearShopListing,
    purchaseShopListing, commitShopListing, renderShopRegisterDialog, assignShopSlotUser,
    clearShopSlotUser, updateShopListingPrice,
  };
}
