export function createMansionSleepDialogUi({ uiLayer, onClose, onConfirm, documentRef = document }) {
  const overlay = documentRef.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed", inset: "0", background: "rgba(228,236,244,0.24)", backdropFilter: "blur(7px)",
    display: "none", pointerEvents: "auto", zIndex: "1000005",
  });
  uiLayer.appendChild(overlay);

  const dialog = documentRef.createElement("div");
  Object.assign(dialog.style, {
    position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
    width: "min(360px, calc(100vw - 36px))", background: "rgba(248,248,248,0.97)",
    border: "1px solid rgba(0,0,0,0.18)", borderRadius: "16px", boxShadow: "0 18px 42px rgba(0,0,0,0.24)",
    padding: "18px", boxSizing: "border-box", display: "none", pointerEvents: "auto", zIndex: "1000006",
  });
  uiLayer.appendChild(dialog);

  const title = documentRef.createElement("div");
  title.textContent = "로그아웃하시겠습니까?";
  Object.assign(title.style, { fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "19px", fontWeight: "800", color: "#222" });
  const body = documentRef.createElement("div");
  body.textContent = "침대에 누워 쉬는 동안 excit에서 로그아웃합니다.";
  Object.assign(body.style, { marginTop: "10px", fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "14px", lineHeight: "1.55", color: "#555" });
  const buttons = documentRef.createElement("div");
  Object.assign(buttons.style, { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" });
  const wakeButton = documentRef.createElement("button");
  wakeButton.textContent = "기상";
  Object.assign(wakeButton.style, { minWidth: "84px", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.18)", background: "rgba(255,255,255,0.92)", fontWeight: "700", cursor: "pointer" });
  const confirmButton = documentRef.createElement("button");
  confirmButton.textContent = "취침";
  Object.assign(confirmButton.style, { minWidth: "88px", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,116,171,0.24)", background: "linear-gradient(180deg, rgba(133,173,230,0.96), rgba(101,143,214,0.96))", color: "#fff", fontWeight: "800", cursor: "pointer" });
  buttons.append(wakeButton, confirmButton);
  dialog.append(title, body, buttons);

  overlay.addEventListener("click", onClose);
  wakeButton.addEventListener("click", onClose);
  confirmButton.addEventListener("click", () => { void onConfirm(); });
  return { overlay, dialog };
}

export function createMapEffectOverlays({ uiLayer, documentRef = document }) {
  const mapFade = documentRef.createElement("div");
  Object.assign(mapFade.style, {
    position: "fixed", inset: "0", background: "rgba(10,12,16,0.0)", pointerEvents: "none",
    transition: "background 260ms ease", zIndex: "1000003",
  });
  uiLayer.appendChild(mapFade);

  const pollutionOverlay = documentRef.createElement("div");
  pollutionOverlay.id = "pollutionOverlay";
  Object.assign(pollutionOverlay.style, {
    position: "fixed", inset: "0",
    background: "radial-gradient(circle at 50% 42%, rgba(255,255,255,0) 18%, rgba(244,246,248,0.22) 46%, rgba(229,234,239,0.58) 70%, rgba(214,220,226,0.94) 100%)",
    opacity: "0", pointerEvents: "none", transition: "opacity 220ms ease", backdropFilter: "blur(0px)",
    webkitBackdropFilter: "blur(0px)",
    maskImage: "radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 16%, rgba(0,0,0,0.28) 40%, rgba(0,0,0,0.88) 70%, rgba(0,0,0,1) 100%)",
    webkitMaskImage: "radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 16%, rgba(0,0,0,0.28) 40%, rgba(0,0,0,0.88) 70%, rgba(0,0,0,1) 100%)",
    zIndex: "999998",
  });
  uiLayer.appendChild(pollutionOverlay);
  return { mapFade, pollutionOverlay };
}
