export function createGameHudController(ctx) {
  let messageTimer = null;
  let arrivalTimer = null;
  let dialogTimer = null;
  let dialogTarget = null;
  let dialogVariant = "dialog";
  let observedDialogHeight = 0;
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
      applyNpcDialogVariant(dialogVariant);
      updateNpcDialogPosition();
    });
    restoreAirHudPosition();
  }

  function notifyNpcDialogLayoutChanged() {
    if (ctx.dialog.style.display === "none" || dialogVariant !== "dialog") return;
    const nextHeight = ctx.dialog.offsetHeight || 0;
    if (nextHeight > 0) observedDialogHeight = nextHeight;
    ctx.onNpcDialogLayoutChange?.();
  }

  function bindNpcDialogResize() {
    const ResizeObserverClass = ctx.ResizeObserver ?? globalThis.ResizeObserver;
    if (!ResizeObserverClass || !ctx.dialogPanel) return;
    const observer = new ResizeObserverClass(() => {
      if (ctx.dialog.style.display === "none" || dialogVariant !== "dialog") return;
      const nextHeight = ctx.dialog.offsetHeight || 0;
      if (nextHeight <= 0 || Math.abs(nextHeight - observedDialogHeight) < 1) return;
      observedDialogHeight = nextHeight;
      updateNpcDialogPosition();
      ctx.onNpcDialogLayoutChange?.();
    });
    observer.observe(ctx.dialogPanel);
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
    const viewport = ctx.airHud.viewport;
    position.y += offsetY;
    position.project(ctx.getCamera());
    if (position.z < -1 || position.z > 1) return null;
    return {
      x: (position.x * 0.5 + 0.5) * viewport.innerWidth,
      y: (-position.y * 0.5 + 0.5) * viewport.innerHeight,
    };
  }

  function clearNpcDialogChoices() {
    if (!ctx.dialogChoices) return;
    ctx.dialogChoices.replaceChildren();
    ctx.dialogChoices.style.display = "none";
  }

  function setChoiceHighlight(button, marker, highlighted) {
    button.style.background = highlighted ? "rgba(221,232,218,0.72)" : "transparent";
    button.style.color = highlighted ? "#203c27" : "#344438";
    marker.textContent = highlighted ? "›" : "";
  }

  function showNpcDialogChoices(choices = []) {
    clearNpcDialogChoices();
    if (!ctx.dialogChoices || choices.length === 0) return;
    ctx.dialogChoices.style.display = "grid";
    for (const choice of choices) {
      const button = document.createElement("button");
      button.type = "button";
      Object.assign(button.style, {
        width: "100%", minHeight: "44px", padding: "10px 12px 10px 34px", borderRadius: "6px",
        border: "0", background: "transparent", color: "#344438", position: "relative",
        fontFamily: "inherit", fontSize: "14px", fontWeight: "500", lineHeight: "1.45",
        overflowWrap: "anywhere", textAlign: "left", cursor: "pointer",
      });
      if (choice.kind === "exit") {
        button.style.marginTop = "8px";
        button.style.boxShadow = "inset 0 1px 0 rgba(63,83,65,0.14)";
        button.style.paddingTop = "14px";
      }
      const marker = document.createElement("span");
      Object.assign(marker.style, {
        position: "absolute", left: "13px", top: "50%", width: "12px",
        transform: "translateY(-50%)", color: "#58715b", fontSize: "18px", fontWeight: "800",
      });
      const label = document.createElement("span");
      label.textContent = choice.label;
      button.append(marker, label);
      button.addEventListener("pointerenter", () => setChoiceHighlight(button, marker, true));
      button.addEventListener("pointerleave", () => setChoiceHighlight(button, marker, false));
      button.addEventListener("focus", () => setChoiceHighlight(button, marker, true));
      button.addEventListener("blur", () => setChoiceHighlight(button, marker, false));
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        choice.onSelect?.();
      });
      ctx.dialogChoices.appendChild(button);
    }
  }

  function resolveDialogSpeakerName(target, explicitName = "") {
    if (explicitName) return explicitName;
    const activeEntry = ctx.getActiveNpc?.();
    if (activeEntry?.obj === target) return activeEntry.name ?? "";
    return ctx.getTutorialNpcs?.().find((entry) => entry?.obj === target)?.name ?? "";
  }

  function applyNpcDialogVariant(variant) {
    const compact = variant === "compact";
    const viewportHeight = Math.max(1, Number(ctx.airHud.viewport.innerHeight) || 1);
    const focusedMaxHeight = Math.max(140, Math.min(360, Math.floor(viewportHeight * 0.44)));
    ctx.dialog.style.width = compact
      ? "min(300px, calc(100vw - 32px))"
      : "min(620px, calc(100vw - 32px))";
    if (ctx.dialogPanel) {
      ctx.dialogPanel.style.padding = compact ? "10px 13px" : "16px 18px 14px";
      ctx.dialogPanel.style.maxHeight = compact
        ? "calc(100vh - 56px)"
        : `${focusedMaxHeight}px`;
      ctx.dialogPanel.style.overflowY = "auto";
      ctx.dialogPanel.style.overflowX = "hidden";
    }
    if (ctx.dialogText?.style) {
      ctx.dialogText.style.fontSize = compact ? "14px" : "17px";
      ctx.dialogText.style.fontWeight = compact ? "600" : "600";
    }
    if (ctx.dialogName) {
      ctx.dialogName.style.marginBottom = compact ? "3px" : "7px";
    }
    if (ctx.dialogChoices) {
      ctx.dialogChoices.style.maxHeight = "none";
      ctx.dialogChoices.style.overflowY = "visible";
    }
  }

  function showNpcDialog(text, duration = 3000, target = null, {
    choices = [], speakerName = "", variant = "dialog",
  } = {}) {
    ctx.dialogText.textContent = text;
    dialogTarget = target ?? ctx.getActiveNpc()?.obj ?? ctx.getTutorialNpcs()[0]?.obj ?? null;
    dialogVariant = variant;
    if (variant === "compact") ctx.onNpcDialogCompact?.();
    applyNpcDialogVariant(variant);
    if (ctx.dialogName) {
      const resolvedName = resolveDialogSpeakerName(dialogTarget, speakerName);
      ctx.dialogName.textContent = resolvedName;
      ctx.dialogName.style.display = resolvedName ? "block" : "none";
    }
    showNpcDialogChoices(choices);
    ctx.dialog.style.display = "block";
    ctx.dialog.style.pointerEvents = choices.length > 0 ? "auto" : "none";
    if (ctx.dialogPanel) ctx.dialogPanel.scrollTop = 0;
    updateNpcDialogPosition();
    notifyNpcDialogLayoutChanged();
    if (dialogTimer) clearTimeout(dialogTimer);
    dialogTimer = null;
    if (Number.isFinite(duration) && duration > 0) {
      dialogTimer = setTimeout(hideNpcDialog, duration);
    }
  }

  function hideNpcDialog() {
    if (dialogTimer) clearTimeout(dialogTimer);
    dialogTimer = null;
    ctx.dialog.style.display = "none";
    ctx.dialog.style.pointerEvents = "none";
    clearNpcDialogChoices();
    dialogTarget = null;
    ctx.onNpcDialogHidden?.();
  }

  function updateNpcDialogPosition() {
    if (ctx.dialog.style.display === "none") return;
    if (!dialogTarget?.parent) {
      hideNpcDialog();
      return;
    }
    const viewport = ctx.airHud.viewport;
    const focused = dialogVariant === "dialog" && ctx.isDialogueCameraFocused?.();
    if (focused) {
      ctx.dialog.style.bottom = viewport.innerWidth <= 720 ? "16px" : "24px";
      ctx.dialog.style.left = "50%";
      ctx.dialog.style.top = "auto";
      ctx.dialog.style.transform = "translateX(-50%)";
      if (ctx.dialogTail) ctx.dialogTail.style.display = "none";
      return;
    }
    dialogPosition.copy(dialogTarget.position);
    const point = projectToScreen(dialogPosition, 3.45);
    if (!point) { ctx.dialog.style.display = "none"; return; }
    ctx.dialog.style.bottom = "auto";
    ctx.dialog.style.transform = "translate(-50%, -100%)";
    if (ctx.dialogTail) ctx.dialogTail.style.display = "block";
    const width = ctx.dialog.offsetWidth || 390;
    const height = ctx.dialog.offsetHeight || 160;
    const halfWidth = width / 2;
    const left = Math.max(16 + halfWidth, Math.min(viewport.innerWidth - 16 - halfWidth, point.x));
    const top = Math.max(16 + height, Math.min(viewport.innerHeight - 16, point.y));
    ctx.dialog.style.left = `${left}px`;
    ctx.dialog.style.top = `${top}px`;
    if (ctx.dialogTail) {
      const tailLeft = Math.max(24, Math.min(width - 24, point.x - (left - halfWidth)));
      ctx.dialogTail.style.left = `${tailLeft}px`;
    }
  }

  function updateTutorialNpcNameTag() {
    const entry = ctx.getActiveNpc() ?? ctx.getTutorialNpcs()[0];
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

  function getDialogueViewportState() {
    const viewport = ctx.airHud.viewport;
    return {
      width: viewport.innerWidth,
      height: viewport.innerHeight,
      dialogHeight: ctx.dialog.offsetHeight || 240,
    };
  }

  bindAirHudDrag();
  bindNpcDialogResize();
  return {
    showMessage, hideMessage, showTooltip, hideTooltip, showMapArrival,
    showNpcDialog, hideNpcDialog, updateNpcDialogPosition,
    updateTutorialNpcNameTag, updatePlayerNameTag, getDialogueViewportState,
  };
}
