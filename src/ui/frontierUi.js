export function renderFrontierBuildWindowUi(ctx, els) {
  const {
    parcelLabel,
    buildState,
    isCompleted,
    hasAuthority,
    nextStage,
    woodOwned,
    stoneOwned,
    getShopStatusText,
    getDisplayStatusText,
  } = ctx;

  els.title.textContent = `${parcelLabel} 건축 진행`;
  els.headerNote.textContent = isCompleted ? "개척지 건축 완료" : "개척지 건축 예정지";
  els.stageCard.innerHTML = "";
  els.requirementCard.innerHTML = "";
  els.ownedCard.innerHTML = "";

  const stageTitle = document.createElement("div");
  stageTitle.textContent = `현재 진척도 ${buildState.stage}%`;
  stageTitle.style.fontSize = "24px";
  stageTitle.style.fontWeight = "900";
  stageTitle.style.color = "#222";
  els.stageCard.appendChild(stageTitle);

  const stageDesc = document.createElement("div");
  stageDesc.style.marginTop = "10px";
  stageDesc.style.fontSize = "13px";
  stageDesc.style.lineHeight = "1.65";
  stageDesc.style.color = "#555";
  stageDesc.textContent =
    isCompleted
      ? "건축이 완료되었습니다. 이 필지의 상점 슬롯 1개와 전시 슬롯 2개의 운영 상태를 여기서 확인할 수 있습니다."
      : nextStage
        ? `${nextStage.label} 단계로 올리려면 목재 ${nextStage.wood}개와 석재 ${nextStage.stone}개가 필요합니다.`
        : "건축 대기 중";
  els.stageCard.appendChild(stageDesc);

  if (isCompleted) {
    els.requirementCard.innerHTML = `
      <div style="font-size:13px;font-weight:800;color:#222;">건축 상태</div>
      <div style="margin-top:10px;font-size:14px;line-height:1.8;color:#444;">
        <div>현재 상태: <strong>건축 완료</strong></div>
        <div>건물 운영은 내부 부스 앞에서 <strong>E</strong>키로 진행할 수 있습니다.</div>
        <div style="margin-top:6px;opacity:0.72;">상점은 판매 관리/보기, 전시는 관리/보기로 분리됩니다.</div>
      </div>
    `;

    els.ownedCard.innerHTML = `
      <div style="font-size:13px;font-weight:800;color:#222;">운영 슬롯 요약</div>
      <div style="margin-top:10px;font-size:14px;line-height:1.8;color:#444;">
        <div>상점 슬롯 1: <strong>${getShopStatusText()}</strong></div>
        <div>전시 슬롯 A: <strong>${getDisplayStatusText("displayA")}</strong></div>
        <div>전시 슬롯 B: <strong>${getDisplayStatusText("displayB")}</strong></div>
      </div>
    `;
    els.shopManagerCard.style.display = "none";
  } else {
    els.requirementCard.innerHTML = `
      <div style="font-size:13px;font-weight:800;color:#222;">다음 단계 필요 재료</div>
      <div style="margin-top:10px;font-size:14px;line-height:1.8;color:#444;">
        <div>목재: <strong>${nextStage ? nextStage.wood : 0}</strong></div>
        <div>석재: <strong>${nextStage ? nextStage.stone : 0}</strong></div>
      </div>
    `;

    els.ownedCard.innerHTML = `
      <div style="font-size:13px;font-weight:800;color:#222;">현재 보유 재료</div>
      <div style="margin-top:10px;font-size:14px;line-height:1.8;color:#444;">
        <div>목재: <strong>${woodOwned}</strong></div>
        <div>석재: <strong>${stoneOwned}</strong></div>
      </div>
    `;
    els.shopManagerCard.style.display = "none";
  }

  const canAdvance = Boolean(nextStage && woodOwned >= nextStage.wood && stoneOwned >= nextStage.stone);
  els.actionBtn.disabled = isCompleted ? true : !nextStage || !canAdvance;
  els.actionBtn.textContent = isCompleted ? "건축 완료" : nextStage ? "건축 진행" : "완공";
  els.actionBtn.style.opacity = els.actionBtn.disabled ? "0.58" : "1";
  els.actionBtn.style.cursor = els.actionBtn.disabled ? "default" : "pointer";

  els.notice.textContent =
    isCompleted
      ? "건축은 완료되었습니다. 상점/전시 운영은 각 부스 앞에서 E키로 관리하거나 볼 수 있습니다."
      : canAdvance
        ? "재료가 충분합니다. 건축 진행을 누르면 다음 단계로 즉시 상승합니다."
        : "다음 단계를 올리려면 필요한 목재와 석재를 먼저 준비해야 합니다.";

  els.signCard.style.display = isCompleted ? "block" : "none";
  els.signInput.value = buildState.signText;
  els.signInput.disabled = !isCompleted || !hasAuthority;
  els.signSaveBtn.disabled = !isCompleted || !hasAuthority;
}

export function renderFrontierBoothDialogUi(ctx, els) {
  const {
    parcelLabel,
    slotKey,
    boothTitle,
    mode,
    buildState,
    slotState,
    getShopAssignedWallet,
    getShopListingSummary,
    getShopSellerWallet,
    canManageShopSlot,
    isShopSeller,
    canUseShopSlot,
    shortenWalletAddress,
    itemDefs,
    formatPlayerCreditsLabel,
    clampPlayerCredits,
    getShopPurchaseFeedback,
    tryPurchaseShopListing,
    showUi,
    setLastMessageUntil,
    openShopRegisterDialog,
    canRegisterShopListing,
    canManageShopSellerTools,
    canEditShopListing,
    updateShopListingPrice,
    clearShopListing,
    canCollectShopSettlement,
    collectShopSettlement,
    getDisplaySummary,
    getDisplayAssignedWallet,
    canManageDisplaySlot,
    canUseDisplaySlot,
    getCurrentWallet,
    assignDisplaySlotUser,
    clearDisplaySlotUser,
    clearDisplayEntry,
    getDisplayableEntries,
    createInventoryEntryVisualElement,
    getInventoryEntryDisplayName,
    isNftInventoryEntry,
    getSlotItemCount,
    assignDisplayEntry,
  } = ctx;

  const isDisplayManageMode = slotKey !== "shop" && mode === "manage";
  els.win.style.width = isDisplayManageMode ? "min(1040px, calc(100vw - 48px))" : els.win.dataset.defaultWidth;
  els.title.textContent = `${parcelLabel} ${boothTitle} ${mode === "manage" ? "관리" : "보기"}`;
  els.actionArea.innerHTML = "";

  const makeManageBtn = (label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.style.padding = "10px 12px";
    btn.style.borderRadius = "10px";
    btn.style.border = "1px solid rgba(0,0,0,0.14)";
    btn.style.background = "rgba(255,255,255,0.94)";
    btn.style.fontSize = "13px";
    btn.style.fontWeight = "800";
    btn.style.cursor = "pointer";
    return btn;
  };

  if (slotKey === "shop") {
    const assignedWallet = getShopAssignedWallet(parcelLabel);
    const listingSummary = getShopListingSummary(slotState);
    const sellerWallet = getShopSellerWallet(parcelLabel);
    const isOperator = canManageShopSlot(parcelLabel);
    const isSeller = isShopSeller(parcelLabel);
    const isAssignedUser = canUseShopSlot(parcelLabel);

    const appendShopBuyerView = (targetWrap) => {
      const viewWrap = document.createElement("div");
      viewWrap.style.display = "grid";
      viewWrap.style.gap = "12px";

      const slotsGrid = document.createElement("div");
      slotsGrid.style.display = "grid";
      slotsGrid.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
      slotsGrid.style.gap = "10px";

      for (let i = 0; i < 3; i += 1) {
        const slotCard = document.createElement("div");
        slotCard.style.border = "1px solid rgba(0,0,0,0.12)";
        slotCard.style.borderRadius = "12px";
        slotCard.style.background = "rgba(255,255,255,0.94)";
        slotCard.style.padding = "12px";
        slotCard.style.minHeight = "116px";
        slotCard.style.display = "grid";
        slotCard.style.alignContent = "start";
        slotCard.style.gap = "6px";

        const slotTitle = document.createElement("div");
        slotTitle.style.fontSize = "13px";
        slotTitle.style.fontWeight = "900";
        slotTitle.style.color = "#222";
        slotTitle.textContent = `판매 슬롯 ${i + 1}`;
        slotCard.appendChild(slotTitle);

        const isActiveSlot = i === 0 && slotState.itemId && slotState.quantity > 0;
        if (!isActiveSlot) {
          const empty = document.createElement("div");
          empty.style.fontSize = "12px";
          empty.style.lineHeight = "1.5";
          empty.style.color = "#6b6053";
          empty.textContent = i === 0 ? "등록된 상품이 없습니다." : "준비 중";
          slotCard.appendChild(empty);
        } else {
          const itemName = itemDefs[slotState.itemId]?.name ?? slotState.itemId;
          for (const line of [`상품: ${itemName}`, `재고: ${slotState.quantity}개`, `가격: ${slotState.price}원`]) {
            const info = document.createElement("div");
            info.style.fontSize = "12px";
            info.style.color = "#4a4138";
            info.textContent = line;
            slotCard.appendChild(info);
          }
        }
        slotsGrid.appendChild(slotCard);
      }

      viewWrap.appendChild(slotsGrid);

      if (slotState.itemId && slotState.quantity > 0) {
        const purchaseCard = document.createElement("div");
        purchaseCard.style.border = "1px solid rgba(0,0,0,0.12)";
        purchaseCard.style.borderRadius = "12px";
        purchaseCard.style.background = "rgba(255,255,255,0.94)";
        purchaseCard.style.padding = "14px";
        purchaseCard.style.display = "grid";
        purchaseCard.style.gridTemplateColumns = "1fr auto";
        purchaseCard.style.gap = "10px 14px";

        const balance = document.createElement("div");
        balance.style.gridColumn = "1 / -1";
        balance.style.fontSize = "13px";
        balance.style.fontWeight = "800";
        balance.style.color = "#2f3f2b";
        balance.textContent = `보유 개척 코인: ${formatPlayerCreditsLabel()}`;
        purchaseCard.appendChild(balance);

        const qtyLabel = document.createElement("label");
        qtyLabel.textContent = "구매 수량";
        qtyLabel.style.fontSize = "12px";
        qtyLabel.style.fontWeight = "700";
        qtyLabel.style.color = "#555";
        purchaseCard.appendChild(qtyLabel);

        const totalHint = document.createElement("div");
        totalHint.style.fontSize = "12px";
        totalHint.style.fontWeight = "700";
        totalHint.style.color = "#7a4a12";
        totalHint.style.alignSelf = "end";
        purchaseCard.appendChild(totalHint);

        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.min = "1";
        qtyInput.max = String(Math.max(1, slotState.quantity));
        qtyInput.step = "1";
        qtyInput.value = "1";
        qtyInput.style.border = "1px solid rgba(0,0,0,0.16)";
        qtyInput.style.borderRadius = "10px";
        qtyInput.style.padding = "10px 12px";
        qtyInput.style.fontSize = "14px";
        qtyInput.style.background = "rgba(255,255,255,0.96)";
        purchaseCard.appendChild(qtyInput);

        const purchaseBtn = document.createElement("button");
        purchaseBtn.type = "button";
        purchaseBtn.textContent = "구매";
        purchaseBtn.style.minWidth = "94px";
        purchaseBtn.style.border = "1px solid rgba(150,90,20,0.35)";
        purchaseBtn.style.borderRadius = "12px";
        purchaseBtn.style.padding = "10px 12px";
        purchaseBtn.style.fontSize = "14px";
        purchaseBtn.style.fontWeight = "900";
        purchaseBtn.style.cursor = "pointer";
        purchaseBtn.style.background = "rgba(255,255,255,0.94)";
        purchaseBtn.style.color = "#7a4a12";
        purchaseCard.appendChild(purchaseBtn);

        const note = document.createElement("div");
        note.style.gridColumn = "1 / -1";
        note.style.fontSize = "12px";
        note.style.color = "#6b6053";
        purchaseCard.appendChild(note);

        const purchaseState = document.createElement("div");
        purchaseState.style.gridColumn = "1 / -1";
        purchaseState.style.padding = "10px 12px";
        purchaseState.style.borderRadius = "10px";
        purchaseState.style.fontSize = "12px";
        purchaseState.style.fontWeight = "700";
        purchaseCard.appendChild(purchaseState);

        const normalizePurchaseQtyInput = () => {
          const qty = Math.max(1, Math.min(slotState.quantity, Math.floor(Number(qtyInput.value) || 1)));
          qtyInput.value = String(qty);
          updatePurchaseFeedback();
        };
        const updatePurchaseFeedback = () => {
          const rawValue = qtyInput.value.trim();
          let qty = 1;
          if (!rawValue) {
            totalHint.textContent = `총 ${clampPlayerCredits(slotState.price)}원`;
          } else {
            qty = Math.max(1, Math.min(slotState.quantity, Math.floor(Number(rawValue) || 1)));
            totalHint.textContent = `총 ${clampPlayerCredits(slotState.price * qty)}원`;
          }
          const feedback = getShopPurchaseFeedback(parcelLabel, qty);
          purchaseBtn.disabled = !feedback.ok;
          purchaseBtn.style.opacity = feedback.ok ? "1" : "0.58";
          purchaseState.textContent = feedback.reason;
          purchaseState.style.background = feedback.ok ? "rgba(54,179,126,0.12)" : "rgba(220,38,38,0.1)";
          purchaseState.style.color = feedback.ok ? "#1f6a4a" : "#9f1239";
          note.textContent = feedback.ok
            ? `재고 ${slotState.quantity}개 / 구매 후 총 ${feedback.totalPrice}원 차감`
            : `재고 ${slotState.quantity}개 / 현재 구매 불가`;
        };
        qtyInput.addEventListener("focus", () => qtyInput.select());
        qtyInput.addEventListener("click", () => qtyInput.select());
        qtyInput.addEventListener("input", updatePurchaseFeedback);
        qtyInput.addEventListener("blur", normalizePurchaseQtyInput);
        updatePurchaseFeedback();

        purchaseBtn.addEventListener("click", () => {
          normalizePurchaseQtyInput();
          const result = tryPurchaseShopListing(parcelLabel, qtyInput.value);
          if (!result.ok) {
            showUi(result.reason, 1100);
            setLastMessageUntil(1100);
            return;
          }
          showUi(`${result.itemName} 구매 완료 (-${result.totalPrice}원)`, 1100);
          setLastMessageUntil(1100);
          ctx.rerender();
        });

        viewWrap.appendChild(purchaseCard);
      }

      targetWrap.appendChild(viewWrap);
    };

    els.status.innerHTML = `
      <div>현재 판매 상태 카드</div>
      <div style="margin-top:6px;">현재 사용자: <strong>${assignedWallet ? shortenWalletAddress(assignedWallet) : "미지정"}</strong></div>
      <div style="margin-top:6px;">현재 판매자: <strong>${sellerWallet ? shortenWalletAddress(sellerWallet) : "없음"}</strong></div>
      <div style="margin-top:6px;">판매 상품: <strong>${listingSummary.itemName}</strong></div>
      <div style="margin-top:6px;">재고 <strong>${listingSummary.quantity}개</strong> / 개당 <strong>${listingSummary.price}원</strong></div>
      <div style="margin-top:6px;">정산 대기금 <strong>${listingSummary.pendingCredits}원</strong> / 누적 판매금 <strong>${listingSummary.lifetimeCredits}원</strong></div>
      <div style="margin-top:6px;opacity:0.78;">${mode === "manage" ? "운영자는 사용자 지정, 판매자는 상품/정산을 관리합니다." : "방문자는 등록된 판매 물품 상태를 여기서 확인할 수 있습니다."}</div>
    `;

    if (mode === "manage") {
      if (isOperator) {
        const controls = document.createElement("div");
        controls.style.display = "grid";
        controls.style.gap = "10px";

        const current = document.createElement("div");
        current.style.fontSize = "13px";
        current.style.fontWeight = "700";
        current.style.color = "#444";
        current.textContent = assignedWallet ? `현재 지정: ${shortenWalletAddress(assignedWallet)}` : "현재 지정: 미지정";
        controls.appendChild(current);

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "상점 사용자 지갑 주소 입력";
        input.value = assignedWallet;
        input.style.border = "1px solid rgba(0,0,0,0.14)";
        input.style.borderRadius = "10px";
        input.style.padding = "10px 12px";
        input.style.fontSize = "14px";
        controls.appendChild(input);

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.flexWrap = "wrap";
        row.style.gap = "8px";
        controls.appendChild(row);

        const selfBtn = makeManageBtn("내가 직접 사용");
        selfBtn.addEventListener("click", () => {
          const currentWallet = getCurrentWallet();
          if (!currentWallet) {
            showUi("로그인 지갑 주소를 확인할 수 없습니다.", 1000);
            setLastMessageUntil(1000);
            return;
          }
          ctx.assignShopSlotUser(parcelLabel, currentWallet);
          ctx.rerender();
        });
        row.appendChild(selfBtn);

        const assignBtn = makeManageBtn("지갑 주소로 지정");
        assignBtn.addEventListener("click", () => {
          ctx.assignShopSlotUser(parcelLabel, input.value);
          ctx.rerender();
        });
        row.appendChild(assignBtn);

        const clearBtn = makeManageBtn("사용자 해제");
        clearBtn.addEventListener("click", () => {
          ctx.clearShopSlotUser(parcelLabel);
          ctx.rerender();
        });
        row.appendChild(clearBtn);

        els.actionArea.appendChild(controls);
      }

      if (canRegisterShopListing(parcelLabel)) {
        const salesBtn = document.createElement("button");
        salesBtn.type = "button";
        salesBtn.textContent = listingSummary.active ? "상품 교체 등록" : "판매 등록";
        salesBtn.style.padding = "12px 14px";
        salesBtn.style.borderRadius = "12px";
        salesBtn.style.border = "1px solid rgba(150,90,20,0.35)";
        salesBtn.style.background = "rgba(255,255,255,0.94)";
        salesBtn.style.fontSize = "15px";
        salesBtn.style.fontWeight = "900";
        salesBtn.style.color = "#7a4a12";
        salesBtn.style.cursor = "pointer";
        salesBtn.addEventListener("click", () => openShopRegisterDialog(parcelLabel));
        els.actionArea.appendChild(salesBtn);
      }

      if (canManageShopSellerTools(parcelLabel)) {
        const sellerTools = document.createElement("div");
        sellerTools.style.display = "grid";
        sellerTools.style.gap = "10px";

        if (canEditShopListing(parcelLabel)) {
          const priceRow = document.createElement("div");
          priceRow.style.display = "grid";
          priceRow.style.gridTemplateColumns = "1fr auto";
          priceRow.style.gap = "8px";
          sellerTools.appendChild(priceRow);

          const priceInput = document.createElement("input");
          priceInput.type = "number";
          priceInput.min = "0";
          priceInput.step = "1";
          priceInput.value = String(listingSummary.price);
          priceInput.style.border = "1px solid rgba(0,0,0,0.14)";
          priceInput.style.borderRadius = "10px";
          priceInput.style.padding = "10px 12px";
          priceInput.style.fontSize = "14px";
          priceRow.appendChild(priceInput);

          const priceBtn = makeManageBtn("가격 수정");
          priceBtn.addEventListener("click", () => updateShopListingPrice(parcelLabel, priceInput.value));
          priceRow.appendChild(priceBtn);
        }

        const sellerRow = document.createElement("div");
        sellerRow.style.display = "flex";
        sellerRow.style.flexWrap = "wrap";
        sellerRow.style.gap = "8px";
        sellerTools.appendChild(sellerRow);

        if (canEditShopListing(parcelLabel)) {
          const revokeBtn = makeManageBtn("판매 회수");
          revokeBtn.addEventListener("click", () => clearShopListing(parcelLabel));
          sellerRow.appendChild(revokeBtn);
        }

        const collectBtn = makeManageBtn("정산금 회수");
        collectBtn.disabled = !canCollectShopSettlement(parcelLabel);
        collectBtn.style.opacity = collectBtn.disabled ? "0.58" : "1";
        collectBtn.addEventListener("click", () => collectShopSettlement(parcelLabel));
        sellerRow.appendChild(collectBtn);

        els.actionArea.appendChild(sellerTools);
      } else if (isOperator && listingSummary.active) {
        const operatorBuyerNote = document.createElement("div");
        operatorBuyerNote.style.fontSize = "13px";
        operatorBuyerNote.style.color = "#6b6053";
        operatorBuyerNote.textContent = "현재 판매자는 다른 사용자입니다. 아래에서 상품 상태를 확인하고 방문자처럼 구매할 수 있습니다.";
        els.actionArea.appendChild(operatorBuyerNote);
        appendShopBuyerView(els.actionArea);
      } else if (!isOperator) {
        const note = document.createElement("div");
        note.style.fontSize = "13px";
        note.style.color = "#6b6053";
        note.textContent = assignedWallet
          ? (listingSummary.active
            ? "현재 등록된 상품은 실제 판매자만 가격 수정, 회수, 정산금 회수를 할 수 있습니다."
            : (isAssignedUser
              ? "상품을 등록하면 판매 관리 항목이 여기에 표시됩니다."
              : "현재 로그인한 지갑은 상점 사용자로 지정되어 있지 않아 판매 등록을 할 수 없습니다."))
          : "상점 사용자를 먼저 지정해야 판매 등록을 할 수 있습니다.";
        els.actionArea.appendChild(note);
      }
    } else {
      appendShopBuyerView(els.actionArea);
    }
    return;
  }

  const displaySummary = getDisplaySummary(slotState);
  const displayAssignedWallet = getDisplayAssignedWallet(parcelLabel, slotKey);
  els.status.innerHTML = `
    <div>현재 상태: <strong>${displaySummary.statusText}</strong></div>
    <div style="margin-top:6px;">전시 슬롯: <strong>${boothTitle}</strong></div>
    <div style="margin-top:6px;">현재 사용자: <strong>${displayAssignedWallet ? shortenWalletAddress(displayAssignedWallet) : "미지정"}</strong></div>
    <div style="margin-top:6px;">전시 대상: <strong>${displaySummary.itemName}</strong></div>
    <div style="margin-top:6px;opacity:0.78;">${mode === "manage" ? "운영자는 사용자 지정, 전시 사용자는 전시 관리가 가능합니다." : "방문자는 현재 전시 중인 대상을 여기서 확인할 수 있습니다."}</div>
  `;

  if (mode === "manage") {
    const manageWrap = document.createElement("div");
    manageWrap.style.display = "grid";
    manageWrap.style.gap = "16px";
    const isDisplayOperator = canManageDisplaySlot(parcelLabel, slotKey);
    const isDisplayUser = canUseDisplaySlot(parcelLabel, slotKey);

    let leftColumn = manageWrap;
    let rightColumn = manageWrap;
    manageWrap.style.gridTemplateColumns = "minmax(300px, 340px) minmax(0, 1fr)";
    manageWrap.style.alignItems = "start";
    manageWrap.style.maxHeight = "calc(100vh - 224px)";
    manageWrap.style.overflow = "hidden";

    leftColumn = document.createElement("div");
    leftColumn.style.display = "grid";
    leftColumn.style.gap = "12px";
    leftColumn.style.alignContent = "start";
    manageWrap.appendChild(leftColumn);

    rightColumn = document.createElement("div");
    rightColumn.style.display = "grid";
    rightColumn.style.gap = "10px";
    rightColumn.style.alignContent = "start";
    rightColumn.style.minHeight = "0";
    manageWrap.appendChild(rightColumn);

    const statusCard = document.createElement("div");
    statusCard.style.border = "1px solid rgba(0,0,0,0.12)";
    statusCard.style.borderRadius = "12px";
    statusCard.style.background = "rgba(255,255,255,0.94)";
    statusCard.style.padding = "14px";
    statusCard.appendChild(els.status);
    leftColumn.appendChild(statusCard);

    if (isDisplayOperator) {
      const assignWrap = document.createElement("div");
      assignWrap.style.display = "grid";
      assignWrap.style.gap = "10px";
      assignWrap.style.border = "1px solid rgba(0,0,0,0.12)";
      assignWrap.style.borderRadius = "12px";
      assignWrap.style.background = "rgba(255,255,255,0.94)";
      assignWrap.style.padding = "14px";
      leftColumn.appendChild(assignWrap);

      const current = document.createElement("div");
      current.style.fontSize = "13px";
      current.style.fontWeight = "700";
      current.style.color = "#444";
      current.textContent = displayAssignedWallet ? `현재 지정: ${shortenWalletAddress(displayAssignedWallet)}` : "현재 지정: 미지정";
      assignWrap.appendChild(current);

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `${boothTitle} 사용자 지갑 주소 입력`;
      input.value = displayAssignedWallet;
      input.style.border = "1px solid rgba(0,0,0,0.14)";
      input.style.borderRadius = "10px";
      input.style.padding = "10px 12px";
      input.style.fontSize = "14px";
      assignWrap.appendChild(input);

      const assignRow = document.createElement("div");
      assignRow.style.display = "flex";
      assignRow.style.flexWrap = "wrap";
      assignRow.style.gap = "8px";
      assignWrap.appendChild(assignRow);

      const selfBtn = makeManageBtn("내가 직접 사용");
      selfBtn.addEventListener("click", () => {
        const currentWallet = getCurrentWallet();
        if (!currentWallet) {
          showUi("로그인 지갑 주소를 확인할 수 없습니다.", 1000);
          setLastMessageUntil(1000);
          return;
        }
        assignDisplaySlotUser(parcelLabel, slotKey, currentWallet);
        ctx.rerender();
      });
      assignRow.appendChild(selfBtn);

      const assignBtn = makeManageBtn("지갑 주소로 지정");
      assignBtn.addEventListener("click", () => {
        assignDisplaySlotUser(parcelLabel, slotKey, input.value);
        ctx.rerender();
      });
      assignRow.appendChild(assignBtn);

      const clearUserBtn = makeManageBtn("사용자 해제");
      clearUserBtn.addEventListener("click", () => {
        clearDisplaySlotUser(parcelLabel, slotKey);
        ctx.rerender();
      });
      assignRow.appendChild(clearUserBtn);
    }

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.flexWrap = "wrap";
    controls.style.gap = "8px";
    if (isDisplayUser) {
      leftColumn.appendChild(controls);
    }

    if (isDisplayUser) {
      const clearBtn = makeManageBtn("전시 해제");
      clearBtn.disabled = !displaySummary.active;
      clearBtn.style.opacity = displaySummary.active ? "1" : "0.58";
      clearBtn.addEventListener("click", () => clearDisplayEntry(parcelLabel, slotKey));
      controls.appendChild(clearBtn);

      const listTitle = document.createElement("div");
      listTitle.textContent = "전시할 물품";
      listTitle.style.fontSize = "14px";
      listTitle.style.fontWeight = "900";
      listTitle.style.color = "#222";
      rightColumn.appendChild(listTitle);

      const availableEntries = getDisplayableEntries();
      if (!availableEntries.length) {
        const empty = document.createElement("div");
        empty.textContent = "전시 가능한 아이템이 인벤토리에 없습니다.";
        empty.style.padding = "14px 12px";
        empty.style.borderRadius = "12px";
        empty.style.background = "rgba(0,0,0,0.05)";
        empty.style.fontSize = "13px";
        empty.style.color = "#666";
        rightColumn.appendChild(empty);
      } else {
        const scrollWrap = document.createElement("div");
        scrollWrap.style.minHeight = "0";
        scrollWrap.style.maxHeight = "calc(100vh - 300px)";
        scrollWrap.style.overflowY = "auto";
        scrollWrap.style.paddingRight = "6px";
        rightColumn.appendChild(scrollWrap);

        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(118px, 1fr))";
        grid.style.gap = "10px";
        scrollWrap.appendChild(grid);

        for (const { entry } of availableEntries) {
          const card = document.createElement("button");
          card.type = "button";
          card.style.border = "1px solid rgba(0,0,0,0.14)";
          card.style.borderRadius = "12px";
          card.style.background = "rgba(255,255,255,0.96)";
          card.style.padding = "10px";
          card.style.cursor = "pointer";
          card.style.display = "flex";
          card.style.flexDirection = "column";
          card.style.alignItems = "center";
          card.style.gap = "6px";

          const visual = createInventoryEntryVisualElement(entry, { size: 42 });
          card.appendChild(visual);

          const name = document.createElement("div");
          name.textContent = getInventoryEntryDisplayName(entry);
          name.style.fontSize = "12px";
          name.style.fontWeight = "800";
          name.style.color = "#333";
          name.style.textAlign = "center";
          card.appendChild(name);

          const meta = document.createElement("div");
          meta.textContent = isNftInventoryEntry(entry) ? "NFT 전시" : `보유 ${getSlotItemCount(entry)}개`;
          meta.style.fontSize = "11px";
          meta.style.color = "#7a6550";
          card.appendChild(meta);

          card.addEventListener("click", () => assignDisplayEntry(parcelLabel, slotKey, entry));
          grid.appendChild(card);
        }
      }
    } else if (!isDisplayOperator) {
      const note = document.createElement("div");
      note.textContent = displayAssignedWallet
        ? "현재 로그인한 지갑은 이 전시 슬롯 사용자로 지정되어 있지 않습니다."
        : "전시 사용자를 먼저 지정해야 전시 관리가 가능합니다.";
      note.style.padding = "14px 12px";
      note.style.borderRadius = "12px";
      note.style.background = "rgba(0,0,0,0.05)";
      note.style.fontSize = "13px";
      note.style.color = "#666";
      leftColumn.appendChild(note);
    }

    els.actionArea.appendChild(manageWrap);
  } else {
    const viewCard = document.createElement("div");
    viewCard.style.border = "1px solid rgba(0,0,0,0.12)";
    viewCard.style.borderRadius = "12px";
    viewCard.style.background = "rgba(255,255,255,0.94)";
    viewCard.style.padding = "14px";
    viewCard.style.display = "grid";
    viewCard.style.gap = "10px";

    if (!displaySummary.active) {
      const empty = document.createElement("div");
      empty.textContent = "현재 전시 중인 대상이 없습니다.";
      empty.style.fontSize = "13px";
      empty.style.color = "#6b6053";
      viewCard.appendChild(empty);
    } else {
      const visualWrap = document.createElement("div");
      visualWrap.style.display = "flex";
      visualWrap.style.alignItems = "center";
      visualWrap.style.gap = "12px";
      viewCard.appendChild(visualWrap);

      const visual = createInventoryEntryVisualElement(displaySummary.entry, { size: 54 });
      visualWrap.appendChild(visual);

      const textWrap = document.createElement("div");
      textWrap.style.display = "grid";
      textWrap.style.gap = "4px";
      visualWrap.appendChild(textWrap);

      const title = document.createElement("div");
      title.textContent = displaySummary.itemName;
      title.style.fontSize = "14px";
      title.style.fontWeight = "900";
      title.style.color = "#222";
      textWrap.appendChild(title);

      const state = document.createElement("div");
      state.textContent = displaySummary.statusText;
      state.style.fontSize = "12px";
      state.style.color = "#6b6053";
      textWrap.appendChild(state);

      const slotName = document.createElement("div");
      slotName.textContent = `슬롯: ${boothTitle}`;
      slotName.style.fontSize = "12px";
      slotName.style.color = "#6b6053";
      textWrap.appendChild(slotName);
    }

    els.actionArea.appendChild(viewCard);
  }
}
