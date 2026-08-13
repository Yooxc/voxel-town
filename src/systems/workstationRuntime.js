export function createWorkstationRuntime({
  createRefineryCraftPlan,
  createForgeUpgradeAttemptPlan,
  createForgeUpgradeResultPlan,
  consumeItem,
  addItem,
  getItemCount,
  getItemName,
  now = () => performance.now(),
  random = Math.random,
}) {
  let pendingForgeUpgrade = null;
  let forgeLastResult = null;
  let refineryLastSuccess = null;

  function craftRefineryRecipe(recipe) {
    const plan = createRefineryCraftPlan(recipe, {
      inputOwned: recipe ? getItemCount(recipe.inputItemId) : 0,
      getItemName,
    });
    if (!plan.ok) return { ok: false, kind: "plan", plan };
    if (!consumeItem(plan.inputItemId, plan.inputCount)) return { ok: false, kind: "consume" };
    if (!addItem(plan.outputItemId, plan.outputCount)) {
      addItem(plan.inputItemId, plan.inputCount);
      return { ok: false, kind: "inventory-full" };
    }
    refineryLastSuccess = {
      message: plan.successMessage,
      until: now() + 1000,
    };
    return { ok: true, plan, success: refineryLastSuccess };
  }

  function beginForgeUpgrade(upgradeState, delayMs) {
    const attemptPlan = createForgeUpgradeAttemptPlan({
      isProcessing: Boolean(pendingForgeUpgrade),
      upgradeState,
      stoneDustCount: getItemCount("stoneDust"),
      delayMs,
    });
    if (!attemptPlan.ok) return { ok: false, plan: attemptPlan };
    if (!consumeItem(attemptPlan.costItemId, attemptPlan.cost)) return { ok: false, plan: attemptPlan };
    pendingForgeUpgrade = {
      itemId: attemptPlan.itemId,
      name: attemptPlan.name,
      targetLevel: attemptPlan.targetLevel,
      successChance: attemptPlan.successChance,
      resolveAt: now() + attemptPlan.delayMs,
    };
    forgeLastResult = null;
    return { ok: true, pending: pendingForgeUpgrade };
  }

  function finishForgeUpgrade() {
    if (!pendingForgeUpgrade) return null;
    const pending = pendingForgeUpgrade;
    pendingForgeUpgrade = null;
    const resultPlan = createForgeUpgradeResultPlan(pending, random());
    forgeLastResult = {
      success: resultPlan.success,
      text: resultPlan.text,
      until: now() + 1600,
    };
    return { pending, resultPlan, result: forgeLastResult };
  }

  return {
    craftRefineryRecipe,
    beginForgeUpgrade,
    finishForgeUpgrade,
    get pendingForgeUpgrade() { return pendingForgeUpgrade; },
    get forgeLastResult() { return forgeLastResult; },
    get refineryLastSuccess() { return refineryLastSuccess; },
  };
}
