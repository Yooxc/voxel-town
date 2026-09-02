export function createGameHudController(ctx) {
  let messageTimer = null;
  let arrivalTimer = null;
  let dialogTimer = null;
  let dialogTarget = null;
  const npcNamePosition = new ctx.Vector3();
  const dialogPosition = new ctx.Vector3();
  const playerNamePosition = new ctx.Vector3();
  let airHudDragState = null;

  function clampAirHudPosition(left, top) {
    const { wrap, viewport } = ctx.airHud;
    const width = wrap.offsetWidth || 214;
    const height = wrap.offsetHeight || 120;
    return {
      left: Math.min(Math.max(12, left), Math.max(12, viewport.innerWidth - width - 12)),
      top: Math.min(Math.max(12, top), Math.max(12, viewport.innerHeight - height - 12)),
    };
  }

  function applyAirHudPosition(left, top, { persist = true } = {}) {
    const { wrap, storage, storageKey } = ctx.airHud;
    const clamped = clampAirHudPosition(left, top);
    wrap.style.left = `${Math.round(clamped.left)}px`;
    wrap.style.top = `${Math.round(clamped.top)}px`;
    wrap.style.right = "auto";
    wrap.style.bottom = "auto";
    if (!persist) return;
    try { storage.setItem(storageKey, JSON.stringify(clamped)); } catch {}
  }

  function restoreAirHudPosition() {
    const { storage, storageKey } = ctx.airHud;
    try {
      const saved = JSON.parse(storage.getItem(storageKey) || "null");
      if (Number.isFinite(saved?.left) && Number.isFinite(saved?.top)) {
        applyAirHudPosition(saved.left, saved.top, { persist: false });
      }
    } catch {}
  }

  function endAirHudDrag() {
    if (!airHudDragState) return;
    airHudDragState = null;
    ctx.airHud.title.style.cursor = "grab";
    ctx.airHud.viewport.removeEventListener("pointermove", handleAirHudPointerMove);
    ctx.airHud.viewport.removeEventListener("pointerup", endAirHudDrag);
  }

  function handleAirHudPointerMove(event) {
    if (!airHudDragState) return;
    applyAirHudPosition(event.clientX - airHudDragState.offsetX, event.clientY - airHudDragState.offsetY);
  }

  function bindAirHudDrag() {
    const { title, wrap, viewport } = ctx.airHud;
    title.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const rect = wrap.getBoundingClientRect();
      airHudDragState = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
      title.style.cursor = "grabbing";
      viewport.addEventListener("pointermove", handleAirHudPointerMove);
      viewport.addEventListener("pointerup", endAirHudDrag);
      event.preventDefault();
    });
    viewport.addEventListener("resize", () => {
      applyAirHudPosition(parseFloat(wrap.style.left) || 16, parseFloat(wrap.style.top) || 214);
    });
    restoreAirHudPosition();
  }

  function showMessage(text, duration = 900) {
    if (messageTimer) clearTimeout(messageTimer);
    ctx.showMessageUi(text);
    messageTimer = setTimeout(hideMessage, duration);
  }

  function hideMessage() {
    ctx.hideMessageUi();
  }

  function showTooltip(data, clientX, clientY) {
    if (!data || !ctx.tooltip) return;
    ctx.tooltip.title.textContent = data.title || "";
    ctx.tooltip.body.textContent = Array.isArray(data.lines) ? data.lines.join("\n") : "";
    const element = ctx.tooltip.element;
    element.style.display = "block";
    const x = Math.min(clientX + 14, window.innerWidth - element.offsetWidth - 8);
    const y = Math.min(clientY + 14, window.innerHeight - element.offsetHeight - 8);
    element.style.left = `${Math.max(8, x)}px`;
    element.style.top = `${Math.max(8, y)}px`;
  }

  function hideTooltip() {
    if (ctx.tooltip) ctx.tooltip.element.style.display = "none";
  }

  function showMapArrival(mapName, duration = 1800) {
    ctx.showMapArrivalUi(mapName);
    if (arrivalTimer) clearTimeout(arrivalTimer);
    arrivalTimer = setTimeout(() => ctx.hideMapArrivalUi(), duration);
  }

  function projectToScreen(position, offsetY) {
    position.y += offsetY;
    position.project(ctx.getCamera());
    if (position.z < -1 || position.z > 1) return null;
    return {
      x: (position.x * 0.5 + 0.5) * window.innerWidth,
      y: (-position.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  function showNpcDialog(text, duration = 3000) {
    ctx.dialogText.textContent = text;
    dialogTarget = ctx.getActiveNpc()?.obj ?? ctx.getTutorialNpcs()[0]?.obj ?? null;
    ctx.dialog.style.display = "block";
    updateNpcDialogPosition();
    if (dialogTimer) clearTimeout(dialogTimer);
    dialogTimer = setTimeout(() => {
      ctx.dialog.style.display = "none";
      dialogTarget = null;
    }, duration);
  }

  function updateNpcDialogPosition() {
    if (ctx.dialog.style.display === "none" || !dialogTarget?.parent) return;
    dialogPosition.copy(dialogTarget.position);
    const point = projectToScreen(dialogPosition, 3.45);
    if (!point) { ctx.dialog.style.display = "none"; return; }
    ctx.dialog.style.left = `${point.x}px`;
    ctx.dialog.style.top = `${Math.max(28, point.y)}px`;
  }

  function updateTutorialNpcNameTag() {
    const entry = ctx.getTutorialNpcs()[0];
    const npc = entry?.obj;
    if (!npc?.parent || ctx.dialog.style.display !== "none") { ctx.npcNameTag.style.display = "none"; return; }
    npcNamePosition.copy(npc.position);
    const point = projectToScreen(npcNamePosition, 2.7);
    if (!point) { ctx.npcNameTag.style.display = "none"; return; }
    const distance = npc.position.distanceTo(ctx.getPlayer().position);
    const opacity = ctx.MathUtils.clamp(1 - (distance - 8) / 18, 0.12, 1);
    ctx.npcNameTag.textContent = entry.name;
    ctx.npcNameTag.style.left = `${point.x}px`;
    ctx.npcNameTag.style.top = `${point.y}px`;
    ctx.npcNameTag.style.opacity = `${opacity}`;
    ctx.npcNameTag.style.display = "block";
  }

  function updatePlayerNameTag() {
    if (!ctx.canPlayGame() || !ctx.hasNickname()) { ctx.playerNameTag.style.display = "none"; return; }
    playerNamePosition.copy(ctx.getPlayer().position);
    const point = projectToScreen(playerNamePosition, 2.7);
    if (!point) { ctx.playerNameTag.style.display = "none"; return; }
    ctx.playerNameTag.textContent = ctx.getNickname();
    ctx.playerNameTag.style.left = `${point.x}px`;
    ctx.playerNameTag.style.top = `${point.y}px`;
    ctx.playerNameTag.style.opacity = "1";
    ctx.playerNameTag.style.display = "block";
  }

  bindAirHudDrag();
  return { showMessage, hideMessage, showTooltip, hideTooltip, showMapArrival, showNpcDialog, updateNpcDialogPosition, updateTutorialNpcNameTag, updatePlayerNameTag };
}
