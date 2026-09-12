export const FLOWER_CROWN_RECIPE = Object.freeze({
  inputs: Object.freeze([
    Object.freeze({ itemId: "wildGrass", count: 3, name: "풀" }),
    Object.freeze({ itemId: "wildFlower", count: 2, name: "꽃" }),
  ]),
  outputItemId: "flowerCrown",
  outputCount: 1,
});

export function createFlowerCrownQuestController({
  getOnboardingState = () => null,
  startQuest = () => false,
  completeQuest = () => false,
  getItemCount,
  consumeItem,
  addItem,
  updateInventoryUi = () => {},
  recipe = FLOWER_CROWN_RECIPE,
}) {
  function getStatus() {
    const materials = recipe.inputs.map((input) => {
      const owned = Math.max(0, Number(getItemCount(input.itemId)) || 0);
      return { ...input, owned, missing: Math.max(0, input.count - owned) };
    });
    return {
      ...recipe,
      materials,
      ready: materials.every((material) => material.missing === 0),
      started: Boolean(getOnboardingState()?.flowerCrownQuest?.started),
      completed: Boolean(getOnboardingState()?.flowerCrownQuest?.completed),
    };
  }

  function begin() {
    startQuest();
    return getStatus();
  }

  function craft() {
    const status = getStatus();
    if (status.completed) return { ok: false, reason: "already-completed", status };
    if (!status.started) return { ok: false, reason: "not-started", status };
    if (!status.ready) return { ok: false, reason: "missing-materials", status };

    const consumed = [];
    for (const material of status.materials) {
      if (!consumeItem(material.itemId, material.count)) {
        for (const entry of consumed) addItem(entry.itemId, entry.count);
        updateInventoryUi();
        return { ok: false, reason: "consume-failed", status: getStatus() };
      }
      consumed.push(material);
    }

    if (!addItem(recipe.outputItemId, recipe.outputCount)) {
      for (const material of consumed) addItem(material.itemId, material.count);
      updateInventoryUi();
      return { ok: false, reason: "inventory-full", status: getStatus() };
    }

    completeQuest();
    updateInventoryUi();
    return { ok: true, status: getStatus() };
  }

  function getProgressView(previousView = null) {
    const status = getStatus();
    if (!status.started || status.completed) return previousView;
    const objectives = status.materials.map((material) => ({
      label: `${material.name} 채집`,
      current: Math.min(material.owned, material.count),
      target: material.count,
      display: `${material.name} ${Math.min(material.owned, material.count)}/${material.count}`,
    }));
    const questView = {
      title: "화관 만들기",
      objectives,
      status: status.ready ? "라온에게 돌아가세요" : "마을에서 풀과 꽃을 맨손으로 채집하세요",
      completed: false,
    };
    if (!previousView) return questView;
    return {
      title: "진행 중인 일",
      objectives: [
        ...previousView.objectives.map((objective) => ({
          ...objective,
          display: previousView.title === "진행 중인 일" && objective.display
            ? objective.display
            : `${previousView.title}: ${objective.display ?? `${objective.label} ${objective.current}/${objective.target}`}`,
        })),
        ...questView.objectives.map((objective) => ({
          ...objective,
          display: `${questView.title}: ${objective.display}`,
        })),
      ],
      status: questView.status,
      completed: false,
    };
  }

  return { begin, craft, getProgressView, getStatus };
}
