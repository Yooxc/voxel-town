const ACTIVITY_CHOICES = Object.freeze([
  {
    id: "explore",
    label: "동네 더 둘러보기",
    text: "벤치와 쉼터, 작업대를 천천히 둘러보세요. 누군가 쉬고 있거나 무언가 만들고 있는 모습에서 다음 하고 싶은 일을 찾을 수도 있어요.",
  },
  {
    id: "gather",
    label: "재료 직접 구해보기",
    text: "가판대에서 곡괭이를 챙겨 장착한 뒤, 가까운 돌을 하나 캐 보세요. 채굴은 이곳의 여러 활동 가운데 하나일 뿐이에요.",
  },
]);

const RESIDENT_LOCATIONS = Object.freeze({
  "craft-resident": "세아는 내리막길 아래 가운데의 푸른 지붕 제작 가판에 있어요.",
  "living-resident": "라온은 장터 오른쪽의 붉은 지붕 생활 가판에 있어요.",
});

const ACTIVITY_PROGRESS = Object.freeze({
  explore: {
    title: "동네 더 둘러보기",
    pendingText: "벤치와 작업대를 모두 둘러보면 돼요. 천천히 보고 난 뒤 마루에게 다시 이야기해 보세요.",
    objectives: [
      { key: "exploreRestVisited", label: "벤치 방문" },
      { key: "exploreWorkVisited", label: "작업대 방문" },
    ],
    completedKey: "exploreCompleted",
    acknowledgedKey: "exploreReactionAcknowledged",
  },
  gather: {
    title: "재료 직접 구해보기",
    pendingText: "가판대에서 곡괭이를 장착한 뒤 가까운 돌을 하나 끝까지 캐 보세요.",
    objectives: [{ key: "gatherCompleted", label: "돌가루 직접 구하기" }],
    completedKey: "gatherCompleted",
    acknowledgedKey: "gatherReactionAcknowledged",
  },
});

export function createActivityHelpController({
  recordActivityHelpRequest,
  selectActivity,
  recordExploreVisit,
  acknowledgeActivityReaction,
  recordResidentIntroduction,
  getOnboardingState,
  notify = () => {},
  showChoiceDialog,
  showDialog,
  hideDialog,
}) {
  let activeEntry = null;
  let open = false;
  let explorationLocations = [];

  function close() {
    if (!open) return false;
    open = false;
    activeEntry = null;
    hideDialog();
    return true;
  }

  function select(choiceId) {
    if (!open || !activeEntry) return false;
    const choice = ACTIVITY_CHOICES.find((entry) => entry.id === choiceId);
    if (!choice) return false;
    selectActivity?.(choice.id);
    if (!showActivityStatus(activeEntry)) showDialog(choice.text, activeEntry);
    return true;
  }

  function showChoices() {
    if (!activeEntry) return false;
    showChoiceDialog(
      "이곳에는 정해진 답이 없어요. 지금 해보고 싶은 일을 골라볼까요?",
      activeEntry,
      ACTIVITY_CHOICES.map((choice) => ({
        id: choice.id,
        label: getChoiceLabel(choice),
        onSelect: () => select(choice.id),
      }))
    );
    return true;
  }

  function openFor(entry) {
    if (!entry?.obj) return false;
    activeEntry = entry;
    open = true;
    recordActivityHelpRequest?.();
    return showChoices();
  }

  function updateNearby(entry) {
    if (!open || entry === activeEntry) return false;
    return close();
  }

  function setExplorationLocations(locations = []) {
    explorationLocations = locations
      .filter((location) => location?.id && Number.isFinite(location?.position?.x) && Number.isFinite(location?.position?.z))
      .map((location) => ({ id: location.id, mapId: location.mapId ?? "", position: { ...location.position } }));
  }

  function updatePlayerPosition(position, mapId = "") {
    const activities = getOnboardingState?.()?.firstActivities;
    if (activities?.selectedId !== "explore" || activities.exploreCompleted || !position) return false;
    let completed = false;
    for (const location of explorationLocations) {
      if (location.mapId && location.mapId !== mapId) continue;
      if (Math.hypot(position.x - location.position.x, position.z - location.position.z) > 2.5) continue;
      const result = recordExploreVisit?.(location.id);
      if (result?.completed) completed = true;
    }
    if (completed) notify("동네를 충분히 둘러봤어요. 마루에게 이야기해 보세요.", 1200);
    return completed;
  }

  function getActivityState(activityId, activities = getOnboardingState?.()?.firstActivities) {
    const definition = ACTIVITY_PROGRESS[activityId];
    if (!definition || !activities) return null;
    return {
      id: activityId,
      ...definition,
      completed: Boolean(activities[definition.completedKey]),
      acknowledged: Boolean(activities[definition.acknowledgedKey]),
      objectives: definition.objectives.map((objective) => ({
        label: objective.label,
        current: activities[objective.key] ? 1 : 0,
        target: 1,
      })),
    };
  }

  function getSelectedActivityState() {
    const activities = getOnboardingState?.()?.firstActivities;
    return getActivityState(activities?.selectedId, activities);
  }

  function getChoiceLabel(choice) {
    const activity = getActivityState(choice.id);
    return activity?.acknowledged ? `${choice.label} (완료)` : choice.label;
  }

  function getProgressView() {
    const activity = getSelectedActivityState();
    if (!activity || activity.acknowledged) return null;
    return {
      title: `해보는 중: ${activity.title}`,
      objectives: activity.objectives,
      status: activity.completed ? "완료 - 마루에게 돌아가기" : "진행 중",
      completed: activity.completed,
    };
  }

  function acknowledgeReaction(activityId, afterAcknowledged) {
    acknowledgeActivityReaction?.(activityId);
    afterAcknowledged?.();
  }

  function introduceResident(activityId, residentId) {
    recordResidentIntroduction?.(activityId, residentId);
    acknowledgeActivityReaction?.(activityId);
    showChoiceDialog(RESIDENT_LOCATIONS[residentId], activeEntry, [
      { label: "알겠어요", kind: "exit", onSelect: close },
    ]);
  }

  function showCompletedActivity(activity) {
    if (activity.acknowledged && getOnboardingState?.()?.firstCraft?.completed) {
      return showFirstCraftFollowUp(activity);
    }
    if (activity.id === "gather") {
      showChoiceDialog(
        "직접 재료를 구해봤군요. 그 돌가루가 어디에 쓰이는지 궁금하다면, 제작 가판의 세아에게 물어봐도 좋아요.",
        activeEntry,
        [
          { label: "세아는 어디에 있나요?", onSelect: () => introduceResident("gather", "craft-resident") },
          { label: "나중에 가볼게요", kind: "exit", onSelect: () => acknowledgeReaction("gather", close) },
        ]
      );
      return true;
    }
    showChoiceDialog("둘러보니 어느 쪽이 더 궁금했어요?", activeEntry, [
      { label: "물건 만드는 모습이요", onSelect: () => introduceResident("explore", "craft-resident") },
      { label: "장터에 놓인 물건들이요", onSelect: () => introduceResident("explore", "living-resident") },
      { label: "그냥 더 둘러보고 싶어요", kind: "exit", onSelect: () => acknowledgeReaction("explore", close) },
    ]);
    return true;
  }

  function showFirstCraftFollowUp(activity) {
    showChoiceDialog("세아와 첫 물건을 만들어봤군요. 이제 조금 더 궁금해진 곳이 있나요?", activeEntry, [
      {
        label: "재료를 더 찾아보고 싶어요",
        onSelect: () => showChoiceDialog("일반 광산은 마을에서 이어지는 길을 따라가면 나와요. 필요할 때 천천히 가보세요.", activeEntry, [
          { label: "알겠어요", kind: "exit", onSelect: close },
        ]),
      },
      {
        label: "다른 물건도 구경하고 싶어요",
        onSelect: () => showChoiceDialog("라온은 장터 오른쪽의 붉은 지붕 생활 가판에 있어요. 마음에 드는 물건을 찾아봐도 좋아요.", activeEntry, [
          { label: "알겠어요", kind: "exit", onSelect: close },
        ]),
      },
      { label: "일단 자유롭게 둘러볼게요", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function showActivityStatus(entry) {
    const activities = getOnboardingState?.()?.firstActivities;
    if (!activities || !entry?.obj) return false;
    const activity = getSelectedActivityState();
    if (!activity) return false;
    const introduction = activities.introductions?.[activity.id];
    const firstCraftCompleted = Boolean(getOnboardingState?.()?.firstCraft?.completed);
    if (activity.acknowledged && introduction?.residentId && !firstCraftCompleted) return false;
    if (activity.acknowledged && !activity.completed) return false;
    activeEntry = entry;
    open = true;
    if (!activity.completed) {
      const remaining = activity.objectives
        .filter((objective) => objective.current < objective.target)
        .map((objective) => objective.label)
        .join("과 ");
      showChoiceDialog(`${activity.pendingText}\n남은 일: ${remaining}`, entry, [
        { label: "계속 해보기", kind: "exit", onSelect: close },
        { label: "다른 활동 알아보기", onSelect: showChoices },
      ]);
      return true;
    }
    return showCompletedActivity(activity);
  }

  return {
    close,
    getProgressView,
    isOpen: () => open,
    openFor,
    select,
    setExplorationLocations,
    showActivityStatus,
    updatePlayerPosition,
    updateNearby,
  };
}
