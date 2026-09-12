const ACTIVITY_DEFINITIONS = Object.freeze({
  explore: Object.freeze({
    title: "동네 더 둘러보기",
    issuer: "마루",
    completedKey: "exploreCompleted",
    acknowledgedKey: "exploreReactionAcknowledged",
    objectives: Object.freeze([
      Object.freeze({ label: "벤치 방문", stateKey: "exploreRestVisited" }),
      Object.freeze({ label: "작업대 방문", stateKey: "exploreWorkVisited" }),
    ]),
  }),
  gather: Object.freeze({
    title: "재료 직접 구해보기",
    issuer: "마루",
    completedKey: "gatherCompleted",
    acknowledgedKey: "gatherReactionAcknowledged",
    objectives: Object.freeze([
      Object.freeze({ label: "돌가루 직접 구하기", stateKey: "gatherCompleted" }),
    ]),
  }),
});

function objective(label, current, target = 1, display = "") {
  const safeTarget = Math.max(1, Number(target) || 1);
  const safeCurrent = Math.min(safeTarget, Math.max(0, Number(current) || 0));
  return {
    label,
    current: safeCurrent,
    target: safeTarget,
    display: display || `${label} ${safeCurrent}/${safeTarget}`,
  };
}

function createActivityEntry(activityId, activities) {
  const definition = ACTIVITY_DEFINITIONS[activityId];
  if (!definition) return null;
  const acknowledged = Boolean(activities[definition.acknowledgedKey]);
  const objectivesComplete = Boolean(activities[definition.completedKey]);
  const accepted = activities.selectedId === activityId || objectivesComplete || acknowledged;
  if (!accepted) return null;
  return {
    id: `activity-${activityId}`,
    title: definition.title,
    issuer: definition.issuer,
    status: acknowledged
      ? "완료"
      : objectivesComplete
        ? "마루에게 돌아가세요"
        : "진행 중",
    completed: acknowledged,
    objectives: definition.objectives.map((entry) => objective(
      entry.label,
      activities[entry.stateKey] ? 1 : 0,
    )),
  };
}

function createFirstCraftEntry(controller) {
  const status = controller?.getStatus?.();
  if (!status || (!status.started && !status.completed)) return null;
  if (status.completed) {
    return {
      id: "first-craft",
      title: "돌 컵 만들기",
      issuer: "세아",
      status: "완료",
      completed: true,
      objectives: [objective("돌 컵 제작", 1)],
    };
  }
  const progress = controller.getProgressView?.();
  return {
    id: "first-craft",
    title: "돌 컵 만들기",
    issuer: "세아",
    status: progress?.status || "진행 중",
    completed: false,
    objectives: (progress?.objectives ?? []).map((entry) => objective(
      entry.label,
      entry.current,
      entry.target,
      entry.display,
    )),
  };
}

function createFlowerCrownEntry(controller) {
  const status = controller?.getStatus?.();
  if (!status || (!status.started && !status.completed)) return null;
  if (status.completed) {
    return {
      id: "flower-crown",
      title: "화관 만들기",
      issuer: "라온",
      status: "완료",
      completed: true,
      objectives: [objective("화관 받기", 1)],
    };
  }
  const progress = controller.getProgressView?.();
  return {
    id: "flower-crown",
    title: "화관 만들기",
    issuer: "라온",
    status: progress?.status || "진행 중",
    completed: false,
    objectives: (progress?.objectives ?? []).map((entry) => objective(
      entry.label,
      entry.current,
      entry.target,
      entry.display,
    )),
  };
}

export function createRebuildQuestJournal({
  getOnboardingState = () => null,
  getFirstCraftController = () => null,
  getFlowerCrownQuestController = () => null,
} = {}) {
  function getEntries() {
    const state = getOnboardingState() ?? {};
    const activities = state.firstActivities ?? {};
    return [
      createActivityEntry("explore", activities),
      createActivityEntry("gather", activities),
      createFirstCraftEntry(getFirstCraftController()),
      createFlowerCrownEntry(getFlowerCrownQuestController()),
    ].filter(Boolean);
  }

  function getQuest() {
    return {
      kind: "rebuild-journal",
      title: "퀘스트",
      description: "수락한 퀘스트와 현재 목표를 확인하세요.",
      entries: getEntries(),
    };
  }

  return { getEntries, getQuest };
}
