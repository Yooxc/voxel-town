import {
  renderFrontierBuildWindowUi,
  renderFrontierBoothDialogUi,
} from "./frontierUi.js";

function appendElement(parent, tagName, options = {}) {
  const element = document.createElement(tagName);
  if (options.id) element.id = options.id;
  if (options.type) element.type = options.type;
  if (options.text != null) element.textContent = options.text;
  if (options.placeholder) element.placeholder = options.placeholder;
  if (options.dataset) Object.assign(element.dataset, options.dataset);
  if (options.attributes) {
    for (const [name, value] of Object.entries(options.attributes)) element[name] = value;
  }
  if (options.style) Object.assign(element.style, options.style);
  parent.appendChild(element);
  return element;
}

const baseButtonStyle = {
  border: "1px solid rgba(0,0,0,0.18)",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
  background: "rgba(255,255,255,0.92)",
  color: "#333",
};

function createBuildElements(uiLayer, maxSignChars) {
  const overlay = appendElement(uiLayer, "div", {
    id: "frontierBuildOverlay",
    style: {
      position: "fixed", inset: "0", background: "rgba(20, 24, 30, 0.3)",
      backdropFilter: "blur(3px)", display: "none", pointerEvents: "auto", zIndex: "1000001",
    },
  });
  const win = appendElement(uiLayer, "div", {
    id: "frontierBuildWindow",
    style: {
      position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
      width: "min(640px, calc(100vw - 36px))", minHeight: "430px",
      background: "rgba(235, 235, 235, 0.96)", border: "1px solid rgba(0,0,0,0.25)",
      borderRadius: "14px", boxShadow: "0 18px 42px rgba(0,0,0,0.28)",
      backdropFilter: "blur(6px)", boxSizing: "border-box", display: "none",
      pointerEvents: "auto", userSelect: "none", zIndex: "1000002", overflow: "hidden",
    },
  });
  const header = appendElement(win, "div", {
    style: {
      display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px",
      borderBottom: "1px solid rgba(0,0,0,0.15)", background: "rgba(255,255,255,0.7)",
    },
  });
  const title = appendElement(header, "div", {
    text: "P6 건축 진행",
    style: {
      fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "18px",
      fontWeight: "800", color: "#222", marginRight: "auto",
    },
  });
  const headerNote = appendElement(header, "div", {
    text: "개척지 건축 예정지",
    style: {
      fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px",
      fontWeight: "700", color: "rgba(70,70,70,0.78)",
    },
  });
  const closeButton = appendElement(header, "button", {
    text: "닫기",
    style: { ...baseButtonStyle, minWidth: "74px", padding: "8px 10px" },
  });
  const body = appendElement(win, "div", {
    style: { padding: "18px", display: "grid", gridTemplateRows: "auto auto auto auto auto", gap: "14px" },
  });
  const stageHero = appendElement(body, "div", {
    style: { display: "grid", gridTemplateColumns: "1fr 160px", gap: "14px" },
  });
  const stageCard = appendElement(stageHero, "div", {
    style: {
      minHeight: "120px", borderRadius: "12px", background: "rgba(255,255,255,0.95)",
      border: "1px solid rgba(0,0,0,0.18)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
      padding: "14px", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, sans-serif",
    },
  });
  const actionCard = appendElement(stageHero, "div", {
    style: {
      minHeight: "120px", borderRadius: "14px",
      background: "linear-gradient(180deg, rgba(255,194,105,0.22), rgba(255,156,64,0.12))",
      border: "1px solid rgba(255,162,68,0.38)",
      boxShadow: "0 0 0 3px rgba(255,186,90,0.14), inset 0 1px 0 rgba(255,255,255,0.7)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px",
    },
  });
  appendElement(actionCard, "div", {
    text: "다음 단계",
    style: {
      fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px",
      fontWeight: "700", color: "rgba(88,66,34,0.76)",
    },
  });
  const actionBtn = appendElement(actionCard, "button", {
    type: "button", text: "건축 진행",
    style: {
      marginTop: "10px", minWidth: "112px", border: "1px solid rgba(150,90,20,0.35)",
      borderRadius: "12px", padding: "14px 12px", fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "18px", fontWeight: "900", color: "#7a4a12", background: "rgba(255,255,255,0.82)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)", cursor: "pointer",
    },
  });
  const resourceGrid = appendElement(body, "div", {
    style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" },
  });
  const resourceCardStyle = {
    padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(0,0,0,0.14)", fontFamily: "system-ui, -apple-system, sans-serif",
  };
  const requirementCard = appendElement(resourceGrid, "div", { style: resourceCardStyle });
  const ownedCard = appendElement(resourceGrid, "div", { style: resourceCardStyle });
  const notice = appendElement(body, "div", {
    style: {
      padding: "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.9)",
      border: "1px solid rgba(0,0,0,0.12)", fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "13px", lineHeight: "1.5", color: "#444",
    },
  });
  const signCard = appendElement(body, "div", { style: { ...resourceCardStyle, display: "none" } });
  appendElement(signCard, "div", {
    text: "간판 텍스트", style: { fontSize: "13px", fontWeight: "800", color: "#222" },
  });
  const signInput = appendElement(signCard, "input", {
    type: "text", placeholder: "간판 문구를 입력하세요", attributes: { maxLength: maxSignChars },
    style: {
      marginTop: "10px", width: "100%", boxSizing: "border-box", border: "1px solid rgba(0,0,0,0.18)",
      borderRadius: "10px", padding: "11px 12px", fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px", background: "rgba(255,255,255,0.96)",
    },
  });
  const signSaveBtn = appendElement(signCard, "button", {
    text: "간판 저장",
    style: { ...baseButtonStyle, marginTop: "10px", minWidth: "90px", padding: "9px 12px" },
  });
  const shopManagerCard = appendElement(body, "div", { style: { ...resourceCardStyle, display: "none" } });
  appendElement(shopManagerCard, "div", {
    text: "상점 슬롯 사용자 관리", style: { fontSize: "13px", fontWeight: "800", color: "#222" },
  });
  appendElement(shopManagerCard, "div", {
    style: { marginTop: "10px", fontSize: "13px", fontWeight: "700", color: "#444" },
  });
  const shopAddressInput = appendElement(shopManagerCard, "input", {
    type: "text", placeholder: "상점 사용자 지갑 주소 입력",
    style: {
      marginTop: "10px", width: "100%", boxSizing: "border-box", border: "1px solid rgba(0,0,0,0.18)",
      borderRadius: "10px", padding: "11px 12px", fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px", background: "rgba(255,255,255,0.96)",
    },
  });
  const shopButtonRow = appendElement(shopManagerCard, "div", {
    style: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" },
  });
  const shopSelfBtn = appendElement(shopButtonRow, "button", {
    text: "내가 직접 사용", style: { ...baseButtonStyle, padding: "9px 12px" },
  });
  const shopAssignBtn = appendElement(shopButtonRow, "button", {
    text: "지갑 주소로 지정", style: { ...baseButtonStyle, padding: "9px 12px" },
  });
  const shopClearBtn = appendElement(shopButtonRow, "button", {
    text: "사용자 해제", style: { ...baseButtonStyle, padding: "9px 12px" },
  });

  return {
    overlay, win, closeButton, shopAddressInput, shopSelfBtn, shopAssignBtn, shopClearBtn,
    renderElements: {
      title, headerNote, stageCard, requirementCard, ownedCard, shopManagerCard,
      actionBtn, notice, signCard, signInput, signSaveBtn,
    },
  };
}

function createShopElements(uiLayer) {
  const overlay = appendElement(uiLayer, "div", {
    style: {
      position: "fixed", inset: "0", background: "rgba(12, 16, 22, 0.28)",
      display: "none", pointerEvents: "auto", zIndex: "1000003",
    },
  });
  const win = appendElement(uiLayer, "div", {
    style: {
      position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
      width: "min(620px, calc(100vw - 40px))", maxHeight: "min(76vh, 720px)",
      background: "rgba(244, 241, 235, 0.98)", border: "1px solid rgba(0,0,0,0.2)",
      borderRadius: "14px", boxShadow: "0 18px 42px rgba(0,0,0,0.28)", display: "none",
      pointerEvents: "auto", zIndex: "1000004", overflow: "hidden",
    },
  });
  const header = appendElement(win, "div", {
    style: {
      display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px",
      borderBottom: "1px solid rgba(0,0,0,0.15)", background: "rgba(255,255,255,0.74)",
    },
  });
  const title = appendElement(header, "div", {
    text: "판매 등록",
    style: {
      fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "18px",
      fontWeight: "800", color: "#222", marginRight: "auto",
    },
  });
  const closeButton = appendElement(header, "button", {
    type: "button", text: "닫기", style: { ...baseButtonStyle, minWidth: "74px", padding: "8px 10px" },
  });
  const body = appendElement(win, "div", {
    style: { padding: "16px", display: "grid", gridTemplateRows: "auto auto auto auto", gap: "14px" },
  });
  const currentStatus = appendElement(body, "div", {
    style: {
      padding: "12px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.94)",
      border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", fontWeight: "700", color: "#333",
    },
  });
  const inventoryGrid = appendElement(body, "div", {
    style: {
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: "10px",
      maxHeight: "240px", overflowY: "auto", paddingRight: "4px",
    },
  });
  const configCard = appendElement(body, "div", {
    style: {
      padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.94)",
      border: "1px solid rgba(0,0,0,0.12)", display: "grid",
      gridTemplateColumns: "1fr 1fr", gap: "10px 14px",
    },
  });
  const selectedItem = appendElement(configCard, "div", {
    style: { gridColumn: "1 / -1", fontSize: "13px", fontWeight: "800", color: "#222" },
  });
  const selectedOwned = appendElement(configCard, "div", {
    style: { gridColumn: "1 / -1", marginTop: "-4px", fontSize: "12px", color: "#6b6053" },
  });
  appendElement(configCard, "label", {
    text: "판매 수량", style: { fontSize: "12px", fontWeight: "700", color: "#555" },
  });
  appendElement(configCard, "label", {
    text: "가격", style: { fontSize: "12px", fontWeight: "700", color: "#555" },
  });
  const inputStyle = {
    border: "1px solid rgba(0,0,0,0.16)", borderRadius: "10px", padding: "10px 12px",
    fontSize: "14px", background: "rgba(255,255,255,0.96)",
  };
  const quantityInput = appendElement(configCard, "input", {
    type: "number", attributes: { min: "1", step: "1", value: "1" }, style: inputStyle,
  });
  const priceInput = appendElement(configCard, "input", {
    type: "number", attributes: { min: "0", step: "1", value: "0" }, style: inputStyle,
  });
  const buttonRow = appendElement(body, "div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  });
  const clearButton = appendElement(buttonRow, "button", {
    type: "button", text: "판매 해제",
    style: { ...baseButtonStyle, minWidth: "100px", padding: "10px 12px" },
  });
  const registerButton = appendElement(buttonRow, "button", {
    type: "button", text: "판매 등록",
    style: {
      minWidth: "112px", border: "1px solid rgba(150,90,20,0.35)", borderRadius: "12px",
      padding: "12px 14px", fontSize: "15px", fontWeight: "900", cursor: "pointer",
      background: "rgba(255,255,255,0.92)", color: "#7a4a12",
    },
  });
  return {
    overlay, window: win, title, closeButton, currentStatus, inventoryGrid,
    selectedItem, selectedOwned, quantityInput, priceInput, registerButton, clearButton,
  };
}

function createBoothElements(uiLayer) {
  const overlay = appendElement(uiLayer, "div", {
    style: {
      position: "fixed", inset: "0", background: "rgba(12, 16, 22, 0.28)",
      display: "none", pointerEvents: "auto", zIndex: "1000003",
    },
  });
  const win = appendElement(uiLayer, "div", {
    dataset: { defaultWidth: "min(520px, calc(100vw - 40px))" },
    style: {
      position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
      width: "min(520px, calc(100vw - 40px))", background: "rgba(245,245,245,0.98)",
      border: "1px solid rgba(0,0,0,0.16)", borderRadius: "18px",
      boxShadow: "0 18px 42px rgba(0,0,0,0.28)", display: "none", pointerEvents: "auto",
      zIndex: "1000004", overflow: "hidden", maxHeight: "calc(100vh - 48px)",
    },
  });
  const header = appendElement(win, "div", {
    style: {
      display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
      borderBottom: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.72)",
    },
  });
  const title = appendElement(header, "div", {
    style: { fontSize: "19px", fontWeight: "900", color: "#222", marginRight: "auto" },
  });
  const closeButton = appendElement(header, "button", {
    type: "button", text: "닫기",
    style: {
      padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.14)",
      background: "rgba(255,255,255,0.92)", fontSize: "13px", fontWeight: "800", cursor: "pointer",
    },
  });
  const body = appendElement(win, "div", {
    style: {
      padding: "16px", display: "grid", gap: "14px", maxHeight: "calc(100vh - 132px)", overflow: "hidden",
    },
  });
  const status = appendElement(body, "div", {
    style: {
      padding: "12px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.94)",
      border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", lineHeight: "1.6", color: "#444",
    },
  });
  const actionArea = appendElement(body, "div", { style: { display: "grid", gap: "10px" } });
  return { overlay, win, title, closeButton, status, actionArea };
}

export function createFrontierWindowsUi({
  uiLayer,
  maxSignChars,
  getBuildRenderContext,
  getBoothRenderContext,
  onBuildOpened,
  onBuildClosed,
  onBuildAction,
  onBuildSignSave,
  onShopClose,
  onShopRegister,
  onShopClear,
  onShopSelfAssign,
  onShopAddressAssign,
  onShopUserClear,
}) {
  const build = createBuildElements(uiLayer, maxSignChars);
  const shop = createShopElements(uiLayer);
  const booth = createBoothElements(uiLayer);
  let buildOpen = false;
  let shopRegisterOpen = false;
  let boothOpen = false;
  let boothContext = null;

  const renderBuild = () => renderFrontierBuildWindowUi(getBuildRenderContext(), build.renderElements);
  const renderBooth = () => {
    if (!boothContext) return;
    renderFrontierBoothDialogUi(
      { ...getBoothRenderContext(boothContext), rerender: renderBooth },
      { win: booth.win, title: booth.title, status: booth.status, actionArea: booth.actionArea },
    );
  };
  const closeBooth = () => {
    boothOpen = false;
    boothContext = null;
    booth.overlay.style.display = "none";
    booth.win.style.display = "none";
  };
  const setBuildOpen = (open) => {
    buildOpen = Boolean(open);
    if (!buildOpen) {
      onBuildClosed();
      onShopClose();
    }
    build.overlay.style.display = buildOpen ? "block" : "none";
    build.win.style.display = buildOpen ? "block" : "none";
    if (buildOpen) {
      onBuildOpened();
      renderBuild();
    }
  };

  build.closeButton.addEventListener("click", () => setBuildOpen(false));
  build.overlay.addEventListener("click", () => setBuildOpen(false));
  build.renderElements.actionBtn.addEventListener("click", onBuildAction);
  build.renderElements.signSaveBtn.addEventListener("click", onBuildSignSave);
  build.shopSelfBtn.addEventListener("click", onShopSelfAssign);
  build.shopAssignBtn.addEventListener("click", () => onShopAddressAssign(build.shopAddressInput.value));
  build.shopClearBtn.addEventListener("click", onShopUserClear);
  shop.closeButton.addEventListener("click", onShopClose);
  shop.overlay.addEventListener("click", onShopClose);
  shop.registerButton.addEventListener("click", onShopRegister);
  shop.clearButton.addEventListener("click", onShopClear);
  booth.closeButton.addEventListener("click", closeBooth);
  booth.overlay.addEventListener("click", closeBooth);

  return {
    renderBuild,
    setBuildOpen,
    isBuildOpen: () => buildOpen,
    isBuildVisible: () => build.win.style.display !== "none",
    getBuildSignText: () => build.renderElements.signInput.value,
    setShopRegisterOpen: (open) => { shopRegisterOpen = Boolean(open); },
    isShopRegisterOpen: () => shopRegisterOpen,
    getShopElements: () => ({
      overlay: shop.overlay,
      window: shop.window,
      title: shop.title,
      currentStatus: shop.currentStatus,
      inventoryGrid: shop.inventoryGrid,
      selectedItem: shop.selectedItem,
      selectedOwned: shop.selectedOwned,
      quantityInput: shop.quantityInput,
      priceInput: shop.priceInput,
      registerButton: shop.registerButton,
      clearButton: shop.clearButton,
    }),
    renderBooth,
    openBooth: (context) => {
      boothContext = context;
      boothOpen = true;
      booth.overlay.style.display = "block";
      booth.win.style.display = "block";
      renderBooth();
    },
    closeBooth,
    isBoothOpen: () => boothOpen,
  };
}
