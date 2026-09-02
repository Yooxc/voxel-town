function applyStyles(element, styles) {
  Object.assign(element.style, styles);
  return element;
}

function createElement(tagName, styles = {}, textContent = null) {
  const element = document.createElement(tagName);
  applyStyles(element, styles);
  if (textContent !== null) element.textContent = textContent;
  return element;
}

const overlayStyles = {
  position: "fixed",
  inset: "0",
  background: "rgba(20, 24, 30, 0.3)",
  backdropFilter: "blur(3px)",
  display: "none",
  pointerEvents: "auto",
  zIndex: "1000001",
};

const windowStyles = {
  position: "fixed",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(1056px, calc(100vw - 36px))",
  height: "min(688px, calc(100vh - 36px))",
  background: "rgba(235, 235, 235, 0.96)",
  border: "1px solid rgba(0,0,0,0.25)",
  borderRadius: "14px",
  boxShadow: "0 18px 42px rgba(0,0,0,0.28)",
  backdropFilter: "blur(6px)",
  boxSizing: "border-box",
  display: "none",
  pointerEvents: "auto",
  userSelect: "none",
  zIndex: "1000002",
  overflow: "hidden",
};

const headerStyles = {
  display: "flex",
  alignItems: "center",
  padding: "12px 14px",
  borderBottom: "1px solid rgba(0,0,0,0.15)",
  background: "rgba(255,255,255,0.7)",
};

const closeButtonStyles = {
  minWidth: "74px",
  border: "1px solid rgba(0,0,0,0.18)",
  borderRadius: "10px",
  padding: "8px 10px",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
  background: "rgba(255,255,255,0.92)",
  color: "#333",
};

const cardStyles = {
  borderRadius: "12px",
  background: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(0,0,0,0.18)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
  boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

export function createWorkstationWindowsUi({
  uiLayer,
  onForgeAction,
  onForgeButtonPressed,
  onForgeClose,
  onRefineryAction,
  onRefineryClose,
}) {
  const forgeOverlay = createElement("div", overlayStyles);
  forgeOverlay.id = "forgeOverlay";
  uiLayer.appendChild(forgeOverlay);

  const forgeWindow = createElement("div", windowStyles);
  forgeWindow.id = "forgeWindow";
  uiLayer.appendChild(forgeWindow);

  const forgeHeader = createElement("div", { ...headerStyles, justifyContent: "space-between" });
  forgeWindow.appendChild(forgeHeader);
  const forgeTitle = createElement("div", {
    fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "20px", fontWeight: "800", color: "#222",
  }, "장비 강화");
  forgeHeader.appendChild(forgeTitle);
  forgeHeader.appendChild(createElement("div", {
    fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px", fontWeight: "700", color: "rgba(70,70,70,0.78)",
  }, "대장간 모루"));
  const forgeCloseButton = createElement("button", closeButtonStyles, "닫기");
  forgeHeader.appendChild(forgeCloseButton);

  const forgeBody = createElement("div", {
    padding: "14px", display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", gap: "20px",
    height: "100%", boxSizing: "border-box", overflow: "hidden",
  });
  forgeWindow.appendChild(forgeBody);
  const forgeListPanel = createElement("div", { display: "flex", flexDirection: "column", gap: "8px" });
  forgeBody.appendChild(forgeListPanel);
  forgeListPanel.appendChild(createElement("div", {
    fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px", fontWeight: "800", color: "rgba(70,70,70,0.76)",
  }, "강화 목록"));
  const forgeTargetList = createElement("div", { display: "flex", flexDirection: "column", gap: "8px", overflow: "auto" });
  forgeListPanel.appendChild(forgeTargetList);

  const forgeDetailPanel = createElement("div", {
    display: "grid", gridTemplateRows: "308px 88px 88px 124px", gap: "12px", minWidth: "0",
    height: "100%", overflow: "hidden",
  });
  forgeBody.appendChild(forgeDetailPanel);
  const forgeHero = createElement("div", {
    display: "grid", gridTemplateColumns: "210px 1fr 210px", alignItems: "center", gap: "16px",
  });
  forgeDetailPanel.appendChild(forgeHero);
  const forgeCurrentCard = createElement("div", { ...cardStyles, height: "308px", padding: "16px" });
  forgeHero.appendChild(forgeCurrentCard);
  const forgeCenterCard = createElement("div", {
    height: "224px", borderRadius: "14px", background: "linear-gradient(180deg, rgba(255,194,105,0.22), rgba(255,156,64,0.12))",
    border: "1px solid rgba(255,162,68,0.38)", boxShadow: "0 0 0 3px rgba(255,186,90,0.14), inset 0 1px 0 rgba(255,255,255,0.7)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px",
  });
  forgeHero.appendChild(forgeCenterCard);
  forgeCenterCard.appendChild(createElement("div", {
    fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "14px", fontWeight: "700", color: "rgba(88,66,34,0.76)",
  }, "강화 실행"));
  const forgeAction = createElement("button", {
    marginTop: "10px", minWidth: "146px", border: "1px solid rgba(150,90,20,0.35)", borderRadius: "12px",
    padding: "16px 18px", fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "22px", fontWeight: "900",
    color: "#7a4a12", background: "rgba(255,255,255,0.78)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    cursor: "pointer", transform: "translateY(0)", transition: "transform 90ms ease, box-shadow 90ms ease, background 90ms ease",
  });
  forgeAction.type = "button";
  forgeCenterCard.appendChild(forgeAction);
  const forgeNextCard = createElement("div", { ...cardStyles, height: "308px", padding: "16px" });
  forgeHero.appendChild(forgeNextCard);
  const forgeStatCompare = createElement("div", { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" });
  forgeDetailPanel.appendChild(forgeStatCompare);
  const forgeInfo = createElement("div", { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" });
  forgeDetailPanel.appendChild(forgeInfo);
  const forgeNotice = createElement("div", {
    ...cardStyles, padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", lineHeight: "1.45", color: "#444", height: "80px",
  });
  forgeDetailPanel.appendChild(forgeNotice);

  const refineryOverlay = createElement("div", overlayStyles);
  refineryOverlay.id = "refineryOverlay";
  uiLayer.appendChild(refineryOverlay);
  const refineryWindow = createElement("div", { ...windowStyles, gridTemplateRows: "96px minmax(0, 1fr)" });
  refineryWindow.id = "refineryWindow";
  uiLayer.appendChild(refineryWindow);
  const refineryHeader = createElement("div", { ...headerStyles, justifyContent: "flex-start", gap: "12px" });
  refineryWindow.appendChild(refineryHeader);
  const refineryTitle = createElement("div", {
    fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "20px", fontWeight: "800", color: "#222", marginRight: "auto",
  }, "작업대");
  refineryHeader.appendChild(refineryTitle);
  refineryHeader.appendChild(createElement("div", {
    fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px", fontWeight: "700", color: "rgba(70,70,70,0.78)",
  }, "재료를 가공해 새로운 아이템을 만듭니다"));
  const refineryCloseButton = createElement("button", closeButtonStyles, "닫기");
  refineryHeader.appendChild(refineryCloseButton);

  const refineryBody = createElement("div", {
    padding: "14px", display: "grid", gridTemplateColumns: "230px minmax(0, 1fr)", gap: "20px",
    boxSizing: "border-box", height: "100%", overflow: "hidden",
  });
  refineryWindow.appendChild(refineryBody);
  const refineryListPanel = createElement("div", {
    display: "flex", flexDirection: "column", gap: "8px", minWidth: "0", minHeight: "0", overflow: "hidden",
  });
  refineryBody.appendChild(refineryListPanel);
  refineryListPanel.appendChild(createElement("div", {
    fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px", fontWeight: "800", color: "rgba(70,70,70,0.76)",
  }, "재련 목록"));
  const refineryRecipeList = createElement("div", {
    display: "flex", flexDirection: "column", gap: "6px", minHeight: "0", flex: "1 1 auto",
    overflowX: "hidden", overflowY: "auto", scrollbarGutter: "stable",
  });
  refineryListPanel.appendChild(refineryRecipeList);
  const refineryDetailPanel = createElement("div", {
    display: "grid", gridTemplateRows: "360px 88px 124px", gap: "14px", minWidth: "0", height: "100%", overflow: "hidden",
  });
  refineryBody.appendChild(refineryDetailPanel);
  const refineryHero = createElement("div", {
    display: "grid", gridTemplateColumns: "210px 1fr 210px", alignItems: "center", gap: "18px",
  });
  refineryDetailPanel.appendChild(refineryHero);
  const refineryInputCard = createElement("div", { ...cardStyles, height: "360px", padding: "16px 14px", overflow: "hidden" });
  refineryHero.appendChild(refineryInputCard);
  const refineryArrowCard = createElement("div", {
    height: "268px", borderRadius: "14px", background: "linear-gradient(180deg, rgba(255,194,105,0.22), rgba(255,156,64,0.12))",
    border: "1px solid rgba(255,162,68,0.38)", boxShadow: "0 0 0 3px rgba(255,186,90,0.14), inset 0 1px 0 rgba(255,255,255,0.7)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px", boxSizing: "border-box",
  });
  refineryHero.appendChild(refineryArrowCard);
  refineryArrowCard.appendChild(createElement("div", {
    fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px", fontWeight: "700", color: "rgba(88,66,34,0.76)",
  }, "재련 결과"));
  const refineryAction = createElement("button", {
    marginTop: "12px", minWidth: "150px", border: "1px solid rgba(150,90,20,0.35)", borderRadius: "12px",
    padding: "14px 16px", fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "22px", fontWeight: "900",
    color: "#7a4a12", background: "rgba(255,255,255,0.82)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    cursor: "pointer", transition: "transform 90ms ease, box-shadow 90ms ease, background 90ms ease",
  }, "재련하기");
  refineryAction.type = "button";
  refineryArrowCard.appendChild(refineryAction);
  const refineryOutputCard = createElement("div", { ...cardStyles, height: "360px", padding: "16px 14px", overflow: "hidden" });
  refineryHero.appendChild(refineryOutputCard);
  const refineryInfo = createElement("div", { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" });
  refineryDetailPanel.appendChild(refineryInfo);
  const refineryNotice = createElement("div", {
    ...cardStyles, padding: "14px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(0,0,0,0.12)", fontSize: "14px", lineHeight: "1.55", color: "#444",
    height: "124px", overflow: "hidden",
  });
  refineryDetailPanel.appendChild(refineryNotice);

  forgeAction.addEventListener("click", () => {
    onForgeButtonPressed(false);
    onForgeAction();
  });
  for (const eventName of ["pointerup", "pointerleave", "pointercancel"]) {
    forgeAction.addEventListener(eventName, () => onForgeButtonPressed(false));
  }
  forgeAction.addEventListener("pointerdown", () => onForgeButtonPressed(true));
  forgeCloseButton.addEventListener("click", onForgeClose);
  forgeOverlay.addEventListener("click", onForgeClose);
  refineryAction.addEventListener("click", onRefineryAction);
  refineryCloseButton.addEventListener("click", onRefineryClose);
  refineryOverlay.addEventListener("click", onRefineryClose);

  function setForgeOpen(open) {
    forgeOverlay.style.display = open ? "block" : "none";
    forgeWindow.style.display = open ? "block" : "none";
  }

  function setRefineryOpen(open) {
    refineryOverlay.style.display = open ? "block" : "none";
    refineryWindow.style.display = open ? "grid" : "none";
  }

  return {
    elements: {
      forge: {
        title: forgeTitle, targetList: forgeTargetList, currentCard: forgeCurrentCard, nextCard: forgeNextCard,
        action: forgeAction, statCompare: forgeStatCompare, info: forgeInfo, notice: forgeNotice,
      },
      refinery: {
        title: refineryTitle, recipeList: refineryRecipeList, inputCard: refineryInputCard, outputCard: refineryOutputCard,
        info: refineryInfo, notice: refineryNotice, action: refineryAction,
      },
    },
    setForgeOpen,
    setRefineryOpen,
  };
}
