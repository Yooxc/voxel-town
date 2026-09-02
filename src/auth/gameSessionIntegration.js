export function bindGameSessionIntegration(ctx) {
  ctx.nftCloseButton.addEventListener("click", ctx.closeNftSelection);
  ctx.nftOverlay.addEventListener("click", (event) => {
    if (event.target === ctx.nftOverlay) ctx.closeNftSelection();
  });
  ctx.eventTarget.addEventListener("keydown", (event) => {
    if (!ctx.isNftSelectionOpen() || ctx.getInputKey(event) !== "escape") return;
    event.preventDefault();
    ctx.closeNftSelection();
  });
  ctx.eventTarget.addEventListener("keydown", (event) => {
    if (!ctx.isQuickUseAssigning()) return;
    const key = ctx.getInputKey(event);
    if (key === "escape") { event.preventDefault(); ctx.cancelQuickUseAssignment(); return; }
    if (!ctx.quickUseAllowedKeys.includes(key)) return;
    event.preventDefault();
    ctx.setQuickUseAssignmentConsumedUntil(ctx.now() + 120);
    ctx.commitQuickUseAssignment(key);
  });
  ctx.walletSessionUi.bindEvents(ctx.walletEvents);
}

export function createPlayerSaveStatusPresenter(ctx) {
  const palette = {
    neutral: ["rgba(255,255,255,0.18)", "white"],
    saving: ["rgba(114,179,255,0.5)", "#dceeff"],
    success: ["rgba(122,209,151,0.5)", "#dff8e7"],
    error: ["rgba(255,122,122,0.55)", "#ffe3e3"],
  };

  return {
    setStatus(text, tone) {
      const [borderColor, color] = palette[tone] ?? palette.neutral;
      ctx.updateBadge(ctx.badge, {
        text,
        borderColor,
        color,
        visible: ctx.isServerBackedSession(),
      });
    },
    hideStatus() {
      ctx.hideBadge(ctx.badge);
    },
  };
}
