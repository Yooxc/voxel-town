export function createInventoryWindowUi({
  uiLayer,
  onWalletLogout,
  onWalletCopy,
  onTabChange,
  onTrashDragOver,
  onTrashDragLeave,
  onTrashDrop,
  onDiscardOverlayClick,
  onDiscardCancel,
  onDiscardConfirm,
  onDiscardKeyDown,
  onPersonalStorageOverlayClick,
  onPersonalStorageClose,
  onPersonalStorageCurtainClick,
  onPersonalStorageTransferCancel,
  onPersonalStorageTransferConfirm,
  onPersonalStorageTransferKeyDown,
}) {
  const invWin = document.createElement("div");
  invWin.id = "invWindow";
  Object.assign(invWin.style, {
    position: "fixed",
    left: "12px",
    top: "12px",
    width: "340px",
    height: "500px",
    background: "rgba(235, 235, 235, 0.92)",
    border: "1px solid rgba(0,0,0,0.25)",
    borderRadius: "10px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
    backdropFilter: "blur(6px)",
    display: "none",
    pointerEvents: "auto",
    userSelect: "none",
    zIndex: "1000000",
  });
  uiLayer.appendChild(invWin);

  const equipWin = document.createElement("div");
  equipWin.id = "equipWindow";
  Object.assign(equipWin.style, {
    position: "fixed",
    left: "368px",
    top: "12px",
    width: "288px",
    height: "520px",
    background: "rgba(235, 235, 235, 0.92)",
    border: "1px solid rgba(0,0,0,0.25)",
    borderRadius: "10px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
    backdropFilter: "blur(6px)",
    display: "none",
    pointerEvents: "auto",
    userSelect: "none",
    zIndex: "1000001",
    overflow: "hidden",
  });
  uiLayer.appendChild(equipWin);

  const equipHeader = document.createElement("div");
  equipHeader.textContent = "EQUIPMENT";
  Object.assign(equipHeader.style, {
    padding: "10px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "0.04em",
    color: "#222",
    borderBottom: "1px solid rgba(0,0,0,0.15)",
    background: "rgba(255,255,255,0.7)",
  });
  equipWin.appendChild(equipHeader);

  const equipBody = document.createElement("div");
  Object.assign(equipBody.style, {
    padding: "12px",
    height: "calc(100% - 44px)",
    position: "relative",
    boxSizing: "border-box",
  });
  equipWin.appendChild(equipBody);

  const equipmentGrid = document.createElement("div");
  Object.assign(equipmentGrid.style, {
    position: "absolute",
    left: "12px",
    right: "12px",
    top: "12px",
    bottom: "154px",
    display: "grid",
    gridTemplateColumns: "64px minmax(0, 1.45fr) 64px",
    gridTemplateRows: "76px 1fr 76px",
    gap: "10px",
  });
  equipBody.appendChild(equipmentGrid);

  const previewWrap = document.createElement("div");
  Object.assign(previewWrap.style, {
    gridColumn: "2",
    gridRow: "1 / span 3",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(0,0,0,0.2)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    position: "relative",
    overflow: "hidden",
  });
  equipmentGrid.appendChild(previewWrap);

  const previewLabel = document.createElement("div");
  previewLabel.textContent = "장착 미리보기";
  Object.assign(previewLabel.style, {
    position: "absolute",
    left: "12px",
    top: "10px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "12px",
    fontWeight: "700",
    color: "rgba(34,34,34,0.78)",
  });
  previewWrap.appendChild(previewLabel);

  const previewCanvasWrap = document.createElement("div");
  Object.assign(previewCanvasWrap.style, {
    position: "absolute",
    inset: "34px 8px 10px",
  });
  previewWrap.appendChild(previewCanvasWrap);

  const equipmentSlotEls = {};
  function createEquipmentSlot(slotId, label, gridColumn, gridRow) {
    const slot = document.createElement("div");
    Object.assign(slot.style, {
      gridColumn: String(gridColumn),
      gridRow: String(gridRow),
      borderRadius: "8px",
      background: "rgba(255,255,255,0.95)",
      border: "1px solid rgba(0,0,0,0.2)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
      padding: "8px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    });

    const title = document.createElement("div");
    title.textContent = label;
    Object.assign(title.style, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "11px",
      fontWeight: "800",
      letterSpacing: "0.04em",
      color: "rgba(70,70,70,0.92)",
    });

    const content = document.createElement("div");
    Object.assign(content.style, {
      flex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "rgba(48,56,66,0.82)",
    });

    slot.appendChild(title);
    slot.appendChild(content);
    equipmentGrid.appendChild(slot);
    equipmentSlotEls[slotId] = { slot, content, label };
  }

  createEquipmentSlot("head", "모자", 1, 1);
  createEquipmentSlot("body", "상의", 1, 2);
  createEquipmentSlot("shoes", "신발", 1, 3);
  createEquipmentSlot("tool", "무기", 3, 2);

  const equipProfileCard = document.createElement("div");
  Object.assign(equipProfileCard.style, {
    position: "absolute",
    left: "12px",
    right: "12px",
    bottom: "12px",
    minHeight: "118px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(0,0,0,0.14)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    padding: "10px 12px",
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, sans-serif",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "8px 12px",
    alignItems: "center",
  });
  equipBody.appendChild(equipProfileCard);

  const equipProfileTitle = document.createElement("div");
  equipProfileTitle.textContent = "WALLET";
  Object.assign(equipProfileTitle.style, {
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.06em",
    color: "rgba(70,70,70,0.88)",
  });
  equipProfileCard.appendChild(equipProfileTitle);

  const equipProfileLogoutBtn = document.createElement("button");
  equipProfileLogoutBtn.type = "button";
  equipProfileLogoutBtn.textContent = "로그아웃";
  Object.assign(equipProfileLogoutBtn.style, {
    justifySelf: "end",
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(0,0,0,0.14)",
    background: "rgba(255,255,255,0.95)",
    color: "#333",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  });
  equipProfileLogoutBtn.addEventListener("click", onWalletLogout);
  equipProfileCard.appendChild(equipProfileLogoutBtn);

  const equipProfileInfo = document.createElement("div");
  Object.assign(equipProfileInfo.style, {
    gridColumn: "1 / span 2",
    display: "grid",
    gap: "4px",
  });
  equipProfileCard.appendChild(equipProfileInfo);

  const equipProfileAddressRow = document.createElement("div");
  Object.assign(equipProfileAddressRow.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  });
  equipProfileInfo.appendChild(equipProfileAddressRow);

  const equipProfileAddress = document.createElement("div");
  Object.assign(equipProfileAddress.style, {
    fontSize: "14px",
    fontWeight: "800",
    color: "#222",
    minWidth: "0",
  });
  equipProfileAddressRow.appendChild(equipProfileAddress);

  const equipProfileCopyBtn = document.createElement("button");
  equipProfileCopyBtn.type = "button";
  equipProfileCopyBtn.textContent = "복사";
  Object.assign(equipProfileCopyBtn.style, {
    flex: "0 0 auto",
    padding: "5px 9px",
    borderRadius: "999px",
    border: "1px solid rgba(0,0,0,0.14)",
    background: "rgba(255,255,255,0.95)",
    color: "#333",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "700",
  });
  equipProfileCopyBtn.addEventListener("click", onWalletCopy);
  equipProfileAddressRow.appendChild(equipProfileCopyBtn);

  const equipProfileChain = document.createElement("div");
  equipProfileChain.style.fontSize = "12px";
  equipProfileChain.style.color = "rgba(70,70,70,0.82)";
  equipProfileInfo.appendChild(equipProfileChain);

  const equipProfileNickname = document.createElement("div");
  equipProfileNickname.style.fontSize = "12px";
  equipProfileNickname.style.fontWeight = "700";
  equipProfileNickname.style.color = "#8b6b1b";
  equipProfileInfo.appendChild(equipProfileNickname);

  const equipProfileCredits = document.createElement("div");
  equipProfileCredits.style.fontSize = "12px";
  equipProfileCredits.style.fontWeight = "700";
  equipProfileCredits.style.color = "#2d5f1f";
  equipProfileInfo.appendChild(equipProfileCredits);

  const tabBar = document.createElement("div");
  Object.assign(tabBar.style, {
    display: "flex",
    gap: "6px",
    padding: "10px",
    borderBottom: "1px solid rgba(0,0,0,0.15)",
    background: "rgba(255,255,255,0.7)",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
  });
  invWin.appendChild(tabBar);

  const tabs = [
    { id: "equip", label: "장비" },
    { id: "cons", label: "소비" },
    { id: "misc", label: "기타" },
  ];
  const tabButtons = {};
  for (const tab of tabs) {
    const btn = document.createElement("button");
    btn.textContent = tab.label;
    Object.assign(btn.style, {
      border: "1px solid rgba(0,0,0,0.2)",
      borderRadius: "8px",
      padding: "6px 10px",
      fontSize: "14px",
      cursor: "pointer",
      background: "rgba(255,255,255,0.9)",
      color: "#222",
    });
    btn.addEventListener("click", () => onTabChange(tab.id));
    tabButtons[tab.id] = btn;
    tabBar.appendChild(btn);
  }

  const invBody = document.createElement("div");
  Object.assign(invBody.style, {
    padding: "12px",
    height: "calc(100% - 52px)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  });
  invWin.appendChild(invBody);

  const gridWrap = document.createElement("div");
  Object.assign(gridWrap.style, {
    flex: "1",
    minHeight: "0",
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: "6px",
  });
  invBody.appendChild(gridWrap);

  const invgrid = document.createElement("div");
  Object.assign(invgrid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "10px",
  });
  gridWrap.appendChild(invgrid);

  const inventoryTrashRow = document.createElement("div");
  Object.assign(inventoryTrashRow.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "64px",
    paddingTop: "4px",
  });
  invBody.appendChild(inventoryTrashRow);

  const inventoryTrashDropZone = document.createElement("div");
  Object.assign(inventoryTrashDropZone.style, {
    width: "100%",
    minHeight: "52px",
    borderRadius: "12px",
    border: "2px dashed rgba(120,120,120,0.38)",
    background: "rgba(255,255,255,0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "13px",
    fontWeight: "800",
    color: "#555",
    transition: "background 120ms ease, border-color 120ms ease, transform 120ms ease",
  });
  inventoryTrashDropZone.textContent = "🗑️ 아이템을 여기로 드래그해 버리기";
  inventoryTrashDropZone.addEventListener("dragover", onTrashDragOver);
  inventoryTrashDropZone.addEventListener("dragleave", onTrashDragLeave);
  inventoryTrashDropZone.addEventListener("drop", onTrashDrop);
  inventoryTrashRow.appendChild(inventoryTrashDropZone);

  const discardOverlay = document.createElement("div");
  Object.assign(discardOverlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(16,18,22,0.28)",
    backdropFilter: "blur(3px)",
    display: "none",
    pointerEvents: "auto",
    zIndex: "1000003",
  });
  discardOverlay.addEventListener("click", onDiscardOverlayClick);
  uiLayer.appendChild(discardOverlay);

  const discardDialog = document.createElement("div");
  Object.assign(discardDialog.style, {
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(340px, calc(100vw - 36px))",
    background: "rgba(245,245,245,0.98)",
    border: "1px solid rgba(0,0,0,0.18)",
    borderRadius: "14px",
    boxShadow: "0 18px 42px rgba(0,0,0,0.28)",
    padding: "16px",
    display: "none",
    pointerEvents: "auto",
    zIndex: "1000004",
    boxSizing: "border-box",
  });
  uiLayer.appendChild(discardDialog);

  const discardTitle = document.createElement("div");
  discardTitle.textContent = "아이템 버리기";
  Object.assign(discardTitle.style, {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "18px",
    fontWeight: "800",
    color: "#222",
  });
  discardDialog.appendChild(discardTitle);

  const discardItemLabel = document.createElement("div");
  Object.assign(discardItemLabel.style, {
    marginTop: "10px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "15px",
    fontWeight: "700",
    color: "#333",
  });
  discardDialog.appendChild(discardItemLabel);

  const discardOwnedCount = document.createElement("div");
  Object.assign(discardOwnedCount.style, {
    marginTop: "6px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "13px",
    color: "#666",
  });
  discardDialog.appendChild(discardOwnedCount);

  const discardInputLabel = document.createElement("label");
  discardInputLabel.textContent = "버릴 개수";
  Object.assign(discardInputLabel.style, {
    display: "block",
    marginTop: "14px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "13px",
    fontWeight: "700",
    color: "#444",
  });
  discardDialog.appendChild(discardInputLabel);

  const discardCountInput = document.createElement("input");
  discardCountInput.type = "number";
  discardCountInput.min = "1";
  discardCountInput.step = "1";
  Object.assign(discardCountInput.style, {
    marginTop: "8px",
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(0,0,0,0.18)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "15px",
    background: "rgba(255,255,255,0.96)",
  });
  discardCountInput.addEventListener("keydown", onDiscardKeyDown);
  discardDialog.appendChild(discardCountInput);

  const discardError = document.createElement("div");
  Object.assign(discardError.style, {
    marginTop: "8px",
    minHeight: "18px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "12px",
    fontWeight: "700",
    color: "#c24c24",
  });
  discardDialog.appendChild(discardError);

  const discardButtonRow = document.createElement("div");
  Object.assign(discardButtonRow.style, {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "16px",
  });
  discardDialog.appendChild(discardButtonRow);

  const discardCancelBtn = document.createElement("button");
  discardCancelBtn.type = "button";
  discardCancelBtn.textContent = "취소";
  Object.assign(discardCancelBtn.style, {
    minWidth: "78px",
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(0,0,0,0.18)",
    background: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    fontWeight: "700",
  });
  discardCancelBtn.addEventListener("click", onDiscardCancel);
  discardButtonRow.appendChild(discardCancelBtn);

  const discardConfirmBtn = document.createElement("button");
  discardConfirmBtn.type = "button";
  discardConfirmBtn.textContent = "버리기";
  Object.assign(discardConfirmBtn.style, {
    minWidth: "86px",
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(155,58,26,0.28)",
    background: "linear-gradient(180deg, rgba(255,161,115,0.95), rgba(240,118,72,0.95))",
    color: "white",
    cursor: "pointer",
    fontWeight: "800",
  });
  discardConfirmBtn.addEventListener("click", onDiscardConfirm);
  discardButtonRow.appendChild(discardConfirmBtn);

  const personalStorageOverlay = document.createElement("div");
  Object.assign(personalStorageOverlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(16,18,22,0.34)",
    backdropFilter: "blur(3px)",
    display: "none",
    pointerEvents: "auto",
    zIndex: "1000003",
  });
  personalStorageOverlay.addEventListener("click", onPersonalStorageOverlayClick);
  uiLayer.appendChild(personalStorageOverlay);

  const personalStorageWin = document.createElement("div");
  Object.assign(personalStorageWin.style, {
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(860px, calc(100vw - 30px))",
    height: "min(620px, calc(100vh - 40px))",
    background: "rgba(246,246,246,0.98)",
    border: "1px solid rgba(0,0,0,0.18)",
    borderRadius: "18px",
    boxShadow: "0 18px 42px rgba(0,0,0,0.28)",
    display: "none",
    pointerEvents: "auto",
    zIndex: "1000004",
    boxSizing: "border-box",
    padding: "18px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    overflow: "hidden",
  });
  uiLayer.appendChild(personalStorageWin);

  const personalStorageHeader = document.createElement("div");
  Object.assign(personalStorageHeader.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  });
  personalStorageWin.appendChild(personalStorageHeader);

  const personalStorageTitle = document.createElement("div");
  personalStorageTitle.textContent = "개인 창고";
  Object.assign(personalStorageTitle.style, {
    fontSize: "26px",
    fontWeight: "900",
    color: "#222",
  });
  personalStorageHeader.appendChild(personalStorageTitle);

  const personalStorageCloseBtn = document.createElement("button");
  personalStorageCloseBtn.type = "button";
  personalStorageCloseBtn.textContent = "닫기";
  Object.assign(personalStorageCloseBtn.style, {
    padding: "8px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(0,0,0,0.18)",
    background: "rgba(255,255,255,0.9)",
    fontWeight: "800",
    cursor: "pointer",
  });
  personalStorageCloseBtn.addEventListener("click", onPersonalStorageClose);
  personalStorageHeader.appendChild(personalStorageCloseBtn);

  const personalStorageGuide = document.createElement("div");
  personalStorageGuide.textContent = "아이템을 드래그해서 인벤토리와 개인 창고 사이로 옮길 수 있습니다.";
  Object.assign(personalStorageGuide.style, {
    marginTop: "8px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#6a6a6a",
  });
  personalStorageWin.appendChild(personalStorageGuide);

  const personalStorageMessage = document.createElement("div");
  Object.assign(personalStorageMessage.style, {
    marginTop: "8px",
    minHeight: "18px",
    fontSize: "12px",
    fontWeight: "800",
    color: "#c24c24",
  });
  personalStorageWin.appendChild(personalStorageMessage);

  const personalStorageColumns = document.createElement("div");
  Object.assign(personalStorageColumns.style, {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "14px",
    height: "calc(100% - 100px)",
  });
  personalStorageWin.appendChild(personalStorageColumns);

  const personalStorageTransferCurtain = document.createElement("div");
  Object.assign(personalStorageTransferCurtain.style, {
    position: "absolute",
    inset: "0",
    background: "rgba(18,22,28,0.32)",
    backdropFilter: "blur(2px)",
    display: "none",
    zIndex: "5",
    borderRadius: "18px",
  });
  personalStorageTransferCurtain.addEventListener("click", onPersonalStorageCurtainClick);
  personalStorageWin.appendChild(personalStorageTransferCurtain);

  const personalStorageTransferDialog = document.createElement("div");
  Object.assign(personalStorageTransferDialog.style, {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(340px, calc(100% - 30px))",
    padding: "18px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.98)",
    border: "1px solid rgba(0,0,0,0.14)",
    boxShadow: "0 14px 30px rgba(0,0,0,0.2)",
    display: "none",
    zIndex: "6",
    pointerEvents: "auto",
    boxSizing: "border-box",
  });
  personalStorageWin.appendChild(personalStorageTransferDialog);

  const personalStorageTransferTitle = document.createElement("div");
  Object.assign(personalStorageTransferTitle.style, {
    fontSize: "22px",
    fontWeight: "900",
    color: "#232323",
  });
  personalStorageTransferDialog.appendChild(personalStorageTransferTitle);

  const personalStorageTransferItemLabel = document.createElement("div");
  Object.assign(personalStorageTransferItemLabel.style, {
    marginTop: "8px",
    fontSize: "15px",
    fontWeight: "800",
    color: "#444",
  });
  personalStorageTransferDialog.appendChild(personalStorageTransferItemLabel);

  const personalStorageTransferOwnedCount = document.createElement("div");
  Object.assign(personalStorageTransferOwnedCount.style, {
    marginTop: "4px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#767676",
  });
  personalStorageTransferDialog.appendChild(personalStorageTransferOwnedCount);

  const personalStorageTransferInputLabel = document.createElement("label");
  personalStorageTransferInputLabel.textContent = "옮길 개수";
  Object.assign(personalStorageTransferInputLabel.style, {
    display: "block",
    marginTop: "12px",
    fontSize: "12px",
    fontWeight: "800",
    color: "#5f5f5f",
  });
  personalStorageTransferDialog.appendChild(personalStorageTransferInputLabel);

  const personalStorageTransferCountInput = document.createElement("input");
  personalStorageTransferCountInput.type = "number";
  personalStorageTransferCountInput.min = "1";
  personalStorageTransferCountInput.step = "1";
  Object.assign(personalStorageTransferCountInput.style, {
    width: "100%",
    marginTop: "6px",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(0,0,0,0.18)",
    fontSize: "16px",
    fontWeight: "800",
    boxSizing: "border-box",
  });
  personalStorageTransferCountInput.addEventListener("keydown", onPersonalStorageTransferKeyDown);
  personalStorageTransferDialog.appendChild(personalStorageTransferCountInput);

  const personalStorageTransferError = document.createElement("div");
  Object.assign(personalStorageTransferError.style, {
    marginTop: "8px",
    minHeight: "16px",
    fontSize: "12px",
    fontWeight: "800",
    color: "#c24c24",
  });
  personalStorageTransferDialog.appendChild(personalStorageTransferError);

  const personalStorageTransferActions = document.createElement("div");
  Object.assign(personalStorageTransferActions.style, {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "14px",
  });
  personalStorageTransferDialog.appendChild(personalStorageTransferActions);

  const personalStorageTransferCancelBtn = document.createElement("button");
  personalStorageTransferCancelBtn.type = "button";
  personalStorageTransferCancelBtn.textContent = "취소";
  Object.assign(personalStorageTransferCancelBtn.style, {
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(0,0,0,0.18)",
    background: "rgba(255,255,255,0.94)",
    fontWeight: "800",
    cursor: "pointer",
  });
  personalStorageTransferCancelBtn.addEventListener("click", onPersonalStorageTransferCancel);
  personalStorageTransferActions.appendChild(personalStorageTransferCancelBtn);

  const personalStorageTransferConfirmBtn = document.createElement("button");
  personalStorageTransferConfirmBtn.type = "button";
  personalStorageTransferConfirmBtn.textContent = "이동";
  Object.assign(personalStorageTransferConfirmBtn.style, {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "1px solid rgba(204,110,50,0.34)",
    background: "rgba(255,166,82,0.96)",
    color: "#2a1804",
    fontWeight: "900",
    cursor: "pointer",
  });
  personalStorageTransferConfirmBtn.addEventListener("click", onPersonalStorageTransferConfirm);
  personalStorageTransferActions.appendChild(personalStorageTransferConfirmBtn);

  function createPersonalStoragePanel(titleText) {
    const panel = document.createElement("div");
    Object.assign(panel.style, {
      display: "flex",
      flexDirection: "column",
      minHeight: "0",
      padding: "14px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.92)",
      border: "1px solid rgba(0,0,0,0.12)",
    });

    const title = document.createElement("div");
    title.textContent = titleText;
    Object.assign(title.style, {
      fontSize: "18px",
      fontWeight: "900",
      color: "#2b2b2b",
    });
    panel.appendChild(title);

    const subtitle = document.createElement("div");
    Object.assign(subtitle.style, {
      marginTop: "4px",
      fontSize: "12px",
      fontWeight: "700",
      color: "#777",
    });
    panel.appendChild(subtitle);

    const wrap = document.createElement("div");
    Object.assign(wrap.style, {
      flex: "1",
      minHeight: "0",
      overflowY: "auto",
      marginTop: "12px",
    });
    panel.appendChild(wrap);

    const grid = document.createElement("div");
    Object.assign(grid.style, {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: "10px",
    });
    wrap.appendChild(grid);

    return { panel, subtitle, grid };
  }

  const inventoryStoragePanel = createPersonalStoragePanel("인벤토리");
  const personalStoragePanel = createPersonalStoragePanel("개인 창고");
  personalStorageColumns.appendChild(inventoryStoragePanel.panel);
  personalStorageColumns.appendChild(personalStoragePanel.panel);

  return {
    invWin,
    equipWin,
    previewCanvasWrap,
    equipmentSlotEls,
    equipProfileLogoutBtn,
    equipProfileCopyBtn,
    equipProfileAddress,
    equipProfileChain,
    equipProfileNickname,
    equipProfileCredits,
    tabButtons,
    tabs,
    invgrid,
    inventoryTrashDropZone,
    discardOverlay,
    discardDialog,
    discardItemLabel,
    discardOwnedCount,
    discardInputLabel,
    discardCountInput,
    discardError,
    personalStorageOverlay,
    personalStorageWin,
    personalStorageMessage,
    personalStorageTransferCurtain,
    personalStorageTransferDialog,
    personalStorageTransferTitle,
    personalStorageTransferItemLabel,
    personalStorageTransferOwnedCount,
    personalStorageTransferCountInput,
    personalStorageTransferError,
    inventoryStoragePanel,
    personalStoragePanel,
  };
}

export function makeInventorySlotElement() {
  const slot = document.createElement("div");
  Object.assign(slot.style, {
    width: "52px",
    height: "52px",
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
  });
  return slot;
}
