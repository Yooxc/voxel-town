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

  const wastelandHudWrap = document.createElement("div");
  wastelandHudWrap.id = "wastelandHudWrap";
  wastelandHudWrap.style.position = "fixed";
  wastelandHudWrap.style.right = "12px";
  wastelandHudWrap.style.bottom = "88px";
  wastelandHudWrap.style.width = "214px";
  wastelandHudWrap.style.padding = "12px 14px";
  wastelandHudWrap.style.background = "rgba(20,20,20,0.56)";
  wastelandHudWrap.style.border = "1px solid rgba(255,255,255,0.16)";
  wastelandHudWrap.style.borderRadius = "14px";
  wastelandHudWrap.style.backdropFilter = "blur(4px)";
  wastelandHudWrap.style.color = "white";
  wastelandHudWrap.style.fontFamily = "system-ui, -apple-system, sans-serif";
  wastelandHudWrap.style.fontSize = "12px";
  wastelandHudWrap.style.lineHeight = "1.45";
  wastelandHudWrap.style.userSelect = "none";
  wastelandHudWrap.style.pointerEvents = "none";
  wastelandHudWrap.style.zIndex = "1000001";
  wastelandHudWrap.style.display = "none";
  uiLayer.appendChild(wastelandHudWrap);

  const wastelandHudTitle = document.createElement("div");
  wastelandHudTitle.textContent = "개간 진행";
  wastelandHudTitle.style.fontWeight = "800";
  wastelandHudTitle.style.letterSpacing = "0.04em";
  wastelandHudTitle.style.opacity = "0.84";
  wastelandHudTitle.style.marginBottom = "8px";
  wastelandHudWrap.appendChild(wastelandHudTitle);

  const wastelandHudValue = document.createElement("div");
  wastelandHudValue.style.fontWeight = "800";
  wastelandHudValue.style.fontSize = "18px";
  wastelandHudValue.style.color = "#f4fbff";
  wastelandHudWrap.appendChild(wastelandHudValue);

  const wastelandHudBarTrack = document.createElement("div");
  wastelandHudBarTrack.style.position = "relative";
  wastelandHudBarTrack.style.height = "10px";
  wastelandHudBarTrack.style.marginTop = "8px";
  wastelandHudBarTrack.style.borderRadius = "999px";
  wastelandHudBarTrack.style.background = "rgba(255,255,255,0.14)";
  wastelandHudBarTrack.style.overflow = "hidden";
  wastelandHudWrap.appendChild(wastelandHudBarTrack);

  const wastelandHudBarFill = document.createElement("div");
  wastelandHudBarFill.style.width = "0%";
  wastelandHudBarFill.style.height = "100%";
  wastelandHudBarFill.style.background = "linear-gradient(90deg, #f2b85f 0%, #fff0bb 100%)";
  wastelandHudBarFill.style.borderRadius = "inherit";
  wastelandHudBarTrack.appendChild(wastelandHudBarFill);

  const wastelandHudStatus = document.createElement("div");
  wastelandHudStatus.style.marginTop = "8px";
  wastelandHudStatus.style.opacity = "0.8";
  wastelandHudWrap.appendChild(wastelandHudStatus);

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
    wastelandHudWrap,
    wastelandHudTitle,
    wastelandHudValue,
    wastelandHudBarTrack,
    wastelandHudBarFill,
    wastelandHudStatus,
    ui,
    mapArrivalBanner,
  };
}

export function updatePlayerSaveStatusBadgeUi(
  playerSaveStatusBadge,
  { text, borderColor, color, visible }
) {
  playerSaveStatusBadge.textContent = text;
  playerSaveStatusBadge.style.borderColor = borderColor;
  playerSaveStatusBadge.style.color = color;
  playerSaveStatusBadge.style.opacity = visible ? "1" : "0";
  playerSaveStatusBadge.style.transform = visible
    ? "translateY(0)"
    : "translateY(4px)";
}

export function hidePlayerSaveStatusBadgeUi(playerSaveStatusBadge) {
  playerSaveStatusBadge.style.opacity = "0";
  playerSaveStatusBadge.style.transform = "translateY(4px)";
}

export function showHudMessageUi(ui, text) {
  ui.textContent = text;
  ui.style.opacity = "1";
  ui.style.transform = "translateX(-50%) translateY(0px)";
}

export function hideHudMessageUi(ui) {
  ui.style.opacity = "0";
  ui.style.transform = "translateX(-50%) translateY(8px)";
}

export function showMapArrivalBannerUi(mapArrivalBanner, mapName) {
  mapArrivalBanner.textContent = mapName;
  mapArrivalBanner.style.opacity = "1";
  mapArrivalBanner.style.transform = "translateX(-50%) translateY(0)";
}

export function hideMapArrivalBannerUi(mapArrivalBanner) {
  mapArrivalBanner.style.opacity = "0";
  mapArrivalBanner.style.transform = "translateX(-50%) translateY(-10px)";
}

export function updateCompassUi(compassNeedle, compassText, dir) {
  const d = dir.clone();
  d.y = 0;
  if (d.lengthSq() < 1e-6) return;
  d.normalize();

  const deg = (Math.atan2(d.x, -d.z) * 180) / Math.PI;
  const heading = (deg + 360) % 360;
  const labels = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  const idx = Math.round(heading / 45) % 8;

  compassNeedle.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
  compassText.textContent = `${labels[idx]} ${Math.round(heading)}°`;
}

export function updateWastelandHudUi(
  wastelandHudWrap,
  wastelandHudValue,
  wastelandHudBarFill,
  wastelandHudStatus,
  { visible, completed, total, percent, statusText }
) {
  wastelandHudWrap.style.display = visible ? "block" : "none";
  if (!visible) return;
  wastelandHudValue.textContent = `${completed} / ${total}`;
  wastelandHudBarFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  wastelandHudStatus.textContent = statusText || `개간률 ${percent.toFixed(1)}%`;
}

export function updateAirHudUi({
  airHudWrap,
  airHudValue,
  airHudBarFill,
  airHudStatus,
  airHudPurify,
  visible,
  currentAir,
  maxAir,
  statusText,
  purifyText,
}) {
  if (!visible) {
    airHudWrap.style.display = "none";
    return;
  }

  airHudWrap.style.display = "block";
  const airRatio =
    maxAir > 0 ? Math.max(0, Math.min(1, currentAir / maxAir)) : 0;
  airHudValue.textContent = `${Math.round(currentAir)} / ${maxAir}`;
  airHudBarFill.style.width = `${Math.round(airRatio * 100)}%`;
  airHudBarFill.style.background =
    airRatio <= 0.18
      ? "linear-gradient(90deg, #ff6a6a 0%, #ffb066 100%)"
      : airRatio <= 0.45
        ? "linear-gradient(90deg, #ffcf5b 0%, #ffec8a 100%)"
        : "linear-gradient(90deg, #5be7ff 0%, #a2fff0 100%)";
  airHudStatus.textContent = statusText;
  airHudPurify.textContent = purifyText;
}
