export const FIRST_CRAFT_RECIPE = Object.freeze({
  inputItemId: "stoneDust",
  inputCount: 3,
  outputItemId: "stoneCup",
  outputCount: 1,
});

export function createFirstCraftController({
  getOnboardingState = () => null,
  startFirstCraft = () => false,
  completeFirstCraft = () => false,
  getItemCount,
  consumeItem,
  addItem,
  updateInventoryUi = () => {},
  hasOwnedPickaxe = () => false,
  hasEquippedPickaxe = () => false,
  isInMineArea = () => false,
  recordMineVisit = () => false,
  recipe = FIRST_CRAFT_RECIPE,
}) {
  function getStatus() {
    const owned = Math.max(0, Number(getItemCount(recipe.inputItemId)) || 0);
    const pickaxeOwned = Boolean(hasOwnedPickaxe());
    const pickaxeEquipped = Boolean(hasEquippedPickaxe());
    return {
      ...recipe,
      owned,
      missing: Math.max(0, recipe.inputCount - owned),
      started: Boolean(getOnboardingState()?.firstCraft?.started),
      completed: Boolean(getOnboardingState()?.firstCraft?.completed),
      mineVisited: Boolean(getOnboardingState()?.firstCraft?.mineVisited),
      starterPickaxeClaimed: Boolean(getOnboardingState()?.firstCraft?.starterPickaxeClaimed),
      pickaxeOwned,
      pickaxeEquipped,
    };
  }

  function begin() {
    startFirstCraft();
    return getStatus();
  }

  function craft() {
    const status = getStatus();
    if (status.completed) return { ok: false, reason: "already-completed", status };
    if (status.owned < recipe.inputCount) return { ok: false, reason: "missing-materials", status };
    if (!consumeItem(recipe.inputItemId, recipe.inputCount)) {
      return { ok: false, reason: "consume-failed", status: getStatus() };
    }
    if (!addItem(recipe.outputItemId, recipe.outputCount)) {
      addItem(recipe.inputItemId, recipe.inputCount);
      updateInventoryUi();
      return { ok: false, reason: "inventory-full", status: getStatus() };
    }
    completeFirstCraft();
    updateInventoryUi();
    return { ok: true, status: getStatus() };
  }

  function updatePlayerPosition(position, mapId) {
    const status = getStatus();
    if (!status.started || status.completed || status.mineVisited || !isInMineArea(position, mapId)) return false;
    return Boolean(recordMineVisit());
  }

  function getProgressView(activityView = null) {
    const status = getStatus();
    if (!status.started || status.completed) return activityView;
    const dustCount = Math.min(status.owned, status.inputCount);
    let nextAction = "돌 앞으로 이동한 뒤 Space로 채광하세요";
    if (dustCount >= status.inputCount) nextAction = "세아에게 돌아가세요";
    else if (!status.pickaxeOwned) nextAction = status.starterPickaxeClaimed
      ? "받은 기본 곡괭이가 가방에 있는지 확인하세요"
      : "작업대에서 기본 곡괭이를 받으세요";
    else if (!status.pickaxeEquipped) nextAction = "인벤토리에서 곡괭이를 장착하세요";
    else if (!status.mineVisited) nextAction = "마을 서쪽 광산지대로 이동하세요";
    const craftView = {
      title: "첫 제작 준비: 돌 컵",
      objectives: [
        { label: "기본 곡괭이 받기", current: status.pickaxeOwned ? 1 : 0, target: 1, display: `기본 곡괭이 받기 ${status.pickaxeOwned ? "O" : "X"}` },
        { label: "곡괭이 장착", current: status.pickaxeEquipped ? 1 : 0, target: 1, display: `곡괭이 장착 ${status.pickaxeEquipped ? "O" : "X"}` },
        { label: "마을 서쪽 광산지대 방문", current: status.mineVisited ? 1 : 0, target: 1, display: `마을 서쪽 광산지대 방문 ${status.mineVisited ? "O" : "X"}` },
        { label: "돌가루 준비", current: dustCount, target: status.inputCount, display: `돌가루 준비 ${dustCount}/${status.inputCount}` },
      ],
      status: nextAction,
      completed: false,
    };
    if (!activityView) return craftView;
    return {
      title: "진행 중인 일",
      objectives: [
        ...activityView.objectives.map((objective) => ({
          ...objective,
          display: `${activityView.title}: ${objective.label} ${objective.current}/${objective.target}`,
        })),
        ...craftView.objectives.map((objective) => ({
          ...objective,
          display: `${craftView.title}: ${objective.display}`,
        })),
      ],
      status: craftView.status,
      completed: false,
    };
  }

  return { begin, craft, getProgressView, getStatus, updatePlayerPosition };
}
