export function createHudUi({ uiLayer, lastPatchedAt }) {
  const patchInfoWrap = document.createElement("div");
  patchInfoWrap.id = "patchInfoWrap";
  patchInfoWrap.style.position = "fixed";
  patchInfoWrap.style.right = "12px";
  patchInfoWrap.style.top = "12px";
  patchInfoWrap.style.padding = "10px 12px";
  patchInfoWrap.style.background = "rgba(20,20,20,0.52)";
  patchInfoWrap.style.border = "1px solid rgba(255,255,255,0.18)";
  patchInfoWrap.style.borderRadius = "12px";
  patchInfoWrap.style.backdropFilter = "blur(4px)";
  patchInfoWrap.style.color = "white";
  patchInfoWrap.style.fontFamily = "system-ui, -apple-system, sans-serif";
  patchInfoWrap.style.fontSize = "12px";
  patchInfoWrap.style.lineHeight = "1.45";
  patchInfoWrap.style.whiteSpace = "pre-line";
  patchInfoWrap.style.userSelect = "none";
  patchInfoWrap.style.pointerEvents = "none";
  patchInfoWrap.style.zIndex = "999999";
  patchInfoWrap.style.display = "none";
  patchInfoWrap.textContent = `마지막 패치\n${lastPatchedAt}`;
  uiLayer.appendChild(patchInfoWrap);

  const airHudWrap = document.createElement("div");
  airHudWrap.id = "airHudWrap";
  airHudWrap.style.position = "fixed";
  airHudWrap.style.left = "16px";
  airHudWrap.style.top = "214px";
  airHudWrap.style.width = "214px";
  airHudWrap.style.padding = "12px 14px";
  airHudWrap.style.background = "rgba(20,20,20,0.56)";
  airHudWrap.style.border = "1px solid rgba(255,255,255,0.16)";
  airHudWrap.style.borderRadius = "14px";
  airHudWrap.style.backdropFilter = "blur(4px)";
  airHudWrap.style.color = "white";
  airHudWrap.style.fontFamily = "system-ui, -apple-system, sans-serif";
  airHudWrap.style.fontSize = "12px";
  airHudWrap.style.lineHeight = "1.45";
  airHudWrap.style.userSelect = "none";
  airHudWrap.style.pointerEvents = "auto";
  airHudWrap.style.zIndex = "1000001";
  airHudWrap.style.display = "none";
  uiLayer.appendChild(airHudWrap);

  const airHudTitle = document.createElement("div");
  airHudTitle.textContent = "AIR SUPPORT";
  airHudTitle.style.fontWeight = "800";
  airHudTitle.style.letterSpacing = "0.06em";
  airHudTitle.style.opacity = "0.84";
  airHudTitle.style.marginBottom = "8px";
  airHudTitle.style.cursor = "grab";
  airHudWrap.appendChild(airHudTitle);

  const airHudValue = document.createElement("div");
  airHudValue.style.fontWeight = "800";
  airHudValue.style.fontSize = "18px";
  airHudValue.style.color = "#f4fbff";
  airHudWrap.appendChild(airHudValue);

  const airHudBarTrack = document.createElement("div");
  airHudBarTrack.style.position = "relative";
  airHudBarTrack.style.height = "10px";
  airHudBarTrack.style.marginTop = "8px";
  airHudBarTrack.style.borderRadius = "999px";
  airHudBarTrack.style.background = "rgba(255,255,255,0.14)";
  airHudBarTrack.style.overflow = "hidden";
  airHudWrap.appendChild(airHudBarTrack);

  const airHudBarFill = document.createElement("div");
  airHudBarFill.style.width = "100%";
  airHudBarFill.style.height = "100%";
  airHudBarFill.style.background = "linear-gradient(90deg, #5be7ff 0%, #a2fff0 100%)";
  airHudBarFill.style.borderRadius = "inherit";
  airHudBarTrack.appendChild(airHudBarFill);

  const airHudStatus = document.createElement("div");
  airHudStatus.style.marginTop = "8px";
  airHudStatus.style.opacity = "0.8";
  airHudWrap.appendChild(airHudStatus);

  const airHudPurify = document.createElement("div");
  airHudPurify.style.marginTop = "6px";
  airHudPurify.style.fontWeight = "700";
  airHudPurify.style.color = "#fff2bf";
  airHudWrap.appendChild(airHudPurify);

  const playerSaveStatusBadge = document.createElement("div");
  playerSaveStatusBadge.id = "playerSaveStatus";
  playerSaveStatusBadge.style.position = "fixed";
  playerSaveStatusBadge.style.left = "12px";
  playerSaveStatusBadge.style.bottom = "12px";
  playerSaveStatusBadge.style.padding = "8px 12px";
  playerSaveStatusBadge.style.borderRadius = "12px";
  playerSaveStatusBadge.style.background = "rgba(20,20,20,0.52)";
  playerSaveStatusBadge.style.border = "1px solid rgba(255,255,255,0.18)";
  playerSaveStatusBadge.style.backdropFilter = "blur(4px)";
  playerSaveStatusBadge.style.color = "white";
  playerSaveStatusBadge.style.fontFamily = "system-ui, -apple-system, sans-serif";
  playerSaveStatusBadge.style.fontSize = "12px";
  playerSaveStatusBadge.style.fontWeight = "700";
  playerSaveStatusBadge.style.lineHeight = "1.4";
  playerSaveStatusBadge.style.userSelect = "none";
  playerSaveStatusBadge.style.pointerEvents = "none";
  playerSaveStatusBadge.style.zIndex = "1000002";
  playerSaveStatusBadge.style.opacity = "0";
  playerSaveStatusBadge.style.transform = "translateY(4px)";
  playerSaveStatusBadge.style.transition = "opacity 180ms ease, transform 180ms ease, border-color 180ms ease";
  playerSaveStatusBadge.textContent = "";
  uiLayer.appendChild(playerSaveStatusBadge);

  const compassWrap = document.createElement("div");
  compassWrap.id = "compassWrap";
  compassWrap.style.position = "fixed";
  compassWrap.style.left = "12px";
  compassWrap.style.top = "12px";
  compassWrap.style.width = "126px";
  compassWrap.style.padding = "10px 10px 8px";
  compassWrap.style.background = "rgba(20,20,20,0.52)";
  compassWrap.style.border = "1px solid rgba(255,255,255,0.18)";
  compassWrap.style.borderRadius = "12px";
  compassWrap.style.backdropFilter = "blur(4px)";
  compassWrap.style.color = "white";
  compassWrap.style.fontFamily = "system-ui, -apple-system, sans-serif";
  compassWrap.style.fontSize = "12px";
  compassWrap.style.userSelect = "none";
  compassWrap.style.pointerEvents = "none";
  compassWrap.style.zIndex = "999999";

  const compassTitle = document.createElement("div");
  compassTitle.textContent = "나침반";
  compassTitle.style.opacity = "0.85";
  compassTitle.style.marginBottom = "6px";

  const compassFace = document.createElement("div");
  compassFace.style.width = "56px";
  compassFace.style.height = "56px";
  compassFace.style.margin = "0 auto";
  compassFace.style.borderRadius = "999px";
  compassFace.style.border = "2px solid rgba(255,255,255,0.45)";
  compassFace.style.position = "relative";
  compassFace.style.background = "rgba(255,255,255,0.08)";

  const compassNeedle = document.createElement("div");
  compassNeedle.style.position = "absolute";
  compassNeedle.style.left = "50%";
  compassNeedle.style.top = "50%";
  compassNeedle.style.transform = "translate(-50%, -50%)";
  compassNeedle.style.transformOrigin = "50% 72%";
  compassNeedle.style.width = "0";
  compassNeedle.style.height = "0";
  compassNeedle.style.borderLeft = "7px solid transparent";
  compassNeedle.style.borderRight = "7px solid transparent";
  compassNeedle.style.borderBottom = "18px solid #ffde7a";
  compassNeedle.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.35))";
  compassFace.appendChild(compassNeedle);

  const compassText = document.createElement("div");
  compassText.textContent = "북 0°";
  compassText.style.marginTop = "7px";
  compassText.style.textAlign = "center";
  compassText.style.fontWeight = "700";

  compassWrap.appendChild(compassTitle);
  compassWrap.appendChild(compassFace);
  compassWrap.appendChild(compassText);
  uiLayer.appendChild(compassWrap);

  const ui = document.createElement("div");
  ui.style.position = "fixed";
  ui.style.left = "50%";
  ui.style.bottom = "56px";
  ui.style.transform = "translateX(-50%) translateY(8px)";
  ui.style.padding = "8px 10px";
  ui.style.background = "rgba(0,0,0,0.62)";
  ui.style.color = "white";
  ui.style.fontFamily = "system-ui, -apple-system, sans-serif";
  ui.style.fontSize = "13px";
  ui.style.borderRadius = "10px";
  ui.style.pointerEvents = "none";
  ui.style.opacity = "0";
  ui.style.transition = "opacity 160ms ease, transform 160ms ease";
  ui.style.willChange = "opacity, transform";
  ui.style.display = "block";
  uiLayer.appendChild(ui);

  const mapArrivalBanner = document.createElement("div");
  mapArrivalBanner.style.position = "fixed";
  mapArrivalBanner.style.left = "50%";
  mapArrivalBanner.style.top = "36px";
  mapArrivalBanner.style.transform = "translateX(-50%) translateY(-10px)";
  mapArrivalBanner.style.padding = "12px 22px";
  mapArrivalBanner.style.borderRadius = "14px";
  mapArrivalBanner.style.background = "rgba(18,22,28,0.62)";
  mapArrivalBanner.style.border = "1px solid rgba(255,255,255,0.16)";
  mapArrivalBanner.style.backdropFilter = "blur(5px)";
  mapArrivalBanner.style.boxShadow = "0 14px 32px rgba(0,0,0,0.22)";
  mapArrivalBanner.style.color = "#fff6dc";
  mapArrivalBanner.style.fontFamily = "system-ui, -apple-system, sans-serif";
  mapArrivalBanner.style.fontSize = "28px";
  mapArrivalBanner.style.fontWeight = "900";
  mapArrivalBanner.style.letterSpacing = "0.04em";
  mapArrivalBanner.style.pointerEvents = "none";
  mapArrivalBanner.style.zIndex = "1000002";
  mapArrivalBanner.style.opacity = "0";
  mapArrivalBanner.style.transition = "opacity 260ms ease, transform 260ms ease";
  uiLayer.appendChild(mapArrivalBanner);

  return {
    patchInfoWrap,
    airHudWrap,
    airHudTitle,
    airHudValue,
    airHudBarTrack,
    airHudBarFill,
    airHudStatus,
    airHudPurify,
    playerSaveStatusBadge,
    compassWrap,
    compassTitle,
    compassFace,
    compassNeedle,
    compassText,
    ui,
    mapArrivalBanner,
  };
}
