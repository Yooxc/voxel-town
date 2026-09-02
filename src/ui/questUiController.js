export function createQuestUiController(ctx) {
  let viewMode = "active";
  let dragState = null;

  function render() {
    ctx.renderWindow({ quest: ctx.getQuest(), viewMode, currentStep: ctx.getCurrentStep(), onArchive: archiveStep }, ctx.elements);
  }

  function archiveStep(stepIndex) {
    const quest = ctx.getQuest();
    if (ctx.canArchive({ stepIndex, currentStep: quest.currentStep, completed: quest.completed, archivedSteps: quest.archivedSteps })) {
      quest.archivedSteps.push(stepIndex);
      ctx.scheduleSave();
    }
    if (ctx.isOpen()) render();
  }

  function refreshProgress() {
    const quest = ctx.getQuest();
    const progress = ctx.getProgress({ state: quest, steps: quest.steps });
    quest.currentStep = progress.currentStep;
    quest.completed = progress.completed;
    for (const event of progress.events) ctx.notify(event.type === "completed" ? "튜토리얼 퀘스트 완료!" : `퀘스트 갱신: ${event.step.title}`, event.type === "completed" ? 1200 : 1100);
    if (progress.advanced) ctx.scheduleSave();
    if (progress.advanced && ctx.isOpen()) render();
  }

  function endDrag(pointerId = null) {
    if (!dragState || (pointerId !== null && dragState.pointerId !== pointerId)) return;
    dragState = null;
    ctx.elements.header.style.cursor = "grab";
  }

  ctx.elements.header.addEventListener("pointerdown", (event) => {
    if (event.target === ctx.elements.archiveToggleButton) return;
    const rect = ctx.elements.window.getBoundingClientRect();
    Object.assign(ctx.elements.window.style, { left: `${rect.left}px`, top: `${rect.top}px`, right: "auto" });
    dragState = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    ctx.elements.header.style.cursor = "grabbing";
    ctx.elements.header.setPointerCapture(event.pointerId);
  });
  ctx.elements.header.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const left = Math.max(8, Math.min(event.clientX - dragState.offsetX, window.innerWidth - ctx.elements.window.offsetWidth - 8));
    const top = Math.max(8, Math.min(event.clientY - dragState.offsetY, window.innerHeight - ctx.elements.window.offsetHeight - 8));
    Object.assign(ctx.elements.window.style, { left: `${left}px`, top: `${top}px` });
  });
  ctx.elements.header.addEventListener("pointerup", (event) => endDrag(event.pointerId));
  ctx.elements.header.addEventListener("pointercancel", (event) => endDrag(event.pointerId));
  ctx.elements.archiveToggleButton.addEventListener("click", (event) => { event.stopPropagation(); viewMode = viewMode === "active" ? "completed" : "active"; render(); });
  return { render, refreshProgress, archiveStep, endDrag };
}
