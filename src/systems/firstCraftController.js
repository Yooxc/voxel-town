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
  recipe = FIRST_CRAFT_RECIPE,
}) {
  function getStatus() {
    const owned = Math.max(0, Number(getItemCount(recipe.inputItemId)) || 0);
    return {
      ...recipe,
      owned,
      missing: Math.max(0, recipe.inputCount - owned),
      started: Boolean(getOnboardingState()?.firstCraft?.started),
      completed: Boolean(getOnboardingState()?.firstCraft?.completed),
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

  return { begin, craft, getStatus };
}
