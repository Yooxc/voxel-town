const ACTIVE_FOOTER = "Q 키로 퀘스트를 열고, Space 키로 튜토리얼 NPC와 대화할 수 있습니다.";
const COMPLETED_FOOTER = "완료 버튼을 눌러 정리한 단계는 여기서 다시 확인할 수 있습니다.";

export function getQuestWindowView({ quest, viewMode, currentStep }) {
  const visibleSteps = quest.steps
    .map((step, index) => {
      const isDone = index < quest.currentStep || quest.completed;
      const isArchived = quest.archivedSteps.includes(index);
      return {
        step,
        index,
        isDone,
        isArchived,
        isActive: !quest.completed && index === quest.currentStep,
        canArchive: viewMode === "active" && isDone && !isArchived,
      };
    })
    .filter((entry) => (viewMode === "completed"
      ? entry.isDone && entry.isArchived
      : !entry.isDone || !entry.isArchived));

  const description = viewMode === "completed"
    ? "완료 버튼을 눌러 정리한 단계들이 이곳에 모여 표시됩니다."
    : quest.completed
      ? "작업 감독관의 기본 교육을 모두 마쳤습니다. 앞으로 새 기능이 생기면 이 창에서 진행 상황을 확인할 수 있습니다."
      : currentStep?.description ?? quest.description;

  return {
    title: quest.title,
    description,
    toggleText: viewMode === "active" ? "완료 보기" : "진행 보기",
    footer: viewMode === "completed" ? COMPLETED_FOOTER : ACTIVE_FOOTER,
    emptyText: viewMode === "completed" ? "아직 보관한 완료 퀘스트가 없습니다." : "진행 중인 퀘스트가 없습니다.",
    visibleSteps,
  };
}

export function renderQuestWindowUi({ quest, viewMode, currentStep, onArchive }, elements) {
  const view = getQuestWindowView({ quest, viewMode, currentStep });
  const { archiveToggleButton, title, description, stepList, footer } = elements;
  archiveToggleButton.textContent = view.toggleText;
  title.textContent = view.title;
  description.textContent = view.description;
  stepList.innerHTML = "";

  if (view.visibleSteps.length === 0) {
    const row = document.createElement("div");
    Object.assign(row.style, {
      padding: "10px 12px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.9)",
      border: "1px solid rgba(0,0,0,0.1)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    });
    row.textContent = view.emptyText;
    stepList.appendChild(row);
  } else {
    for (const entry of view.visibleSteps) {
      const row = document.createElement("div");
      Object.assign(row.style, {
        padding: "10px 12px",
        borderRadius: "10px",
        background: entry.isActive ? "rgba(255,199,120,0.2)" : "rgba(255,255,255,0.9)",
        border: entry.isActive ? "1px solid rgba(220,140,40,0.35)" : "1px solid rgba(0,0,0,0.1)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      });
      const top = document.createElement("div");
      Object.assign(top.style, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" });
      const stepTitle = document.createElement("div");
      stepTitle.textContent = entry.step.title;
      Object.assign(stepTitle.style, { fontSize: "14px", fontWeight: "800", color: "#222" });
      top.appendChild(stepTitle);

      if (entry.canArchive) {
        const archiveButton = document.createElement("button");
        archiveButton.type = "button";
        archiveButton.textContent = "완료";
        Object.assign(archiveButton.style, {
          padding: "4px 8px", borderRadius: "999px", border: "1px solid rgba(70,150,70,0.22)",
          background: "rgba(81,181,81,0.16)", color: "#2d7c2d", fontSize: "12px", fontWeight: "700",
          cursor: "pointer", pointerEvents: "auto",
        });
        archiveButton.addEventListener("click", () => onArchive(entry.index));
        top.appendChild(archiveButton);
      } else {
        const status = document.createElement("div");
        status.textContent = entry.isDone ? "완료됨" : entry.isActive ? "진행 중" : "대기";
        Object.assign(status.style, {
          fontSize: "12px", fontWeight: "700",
          color: entry.isDone ? "#2d7c2d" : entry.isActive ? "#9a5c12" : "#888",
        });
        top.appendChild(status);
      }

      const stepDescription = document.createElement("div");
      stepDescription.textContent = entry.step.description;
      Object.assign(stepDescription.style, { marginTop: "6px", fontSize: "12px", lineHeight: "1.5", color: "#555" });
      row.append(top, stepDescription);
      stepList.appendChild(row);
    }
  }
  footer.textContent = view.footer;
}
