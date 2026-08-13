export function createForgeUpgradeAttemptPlan({ isProcessing, upgradeState, stoneDustCount, delayMs }) {
  if (isProcessing) return { ok: false, reason: "" };
  if (!upgradeState) return { ok: false, reason: "장착 중인 강화 가능 장비가 필요합니다" };
  if (!upgradeState.next) return { ok: false, reason: `${upgradeState.name}가 이미 최대 강화입니다` };
  if (stoneDustCount < upgradeState.next.cost) return { ok: false, reason: "돌가루가 부족합니다" };
  return {
    ok: true,
    itemId: upgradeState.itemId,
    name: upgradeState.name,
    targetLevel: upgradeState.next.level,
    successChance: upgradeState.next.successChance ?? 1,
    costItemId: "stoneDust",
    cost: upgradeState.next.cost,
    delayMs,
  };
}

export function createForgeUpgradeResultPlan(pendingUpgrade, randomValue) {
  if (!pendingUpgrade) return null;
  const success = randomValue < pendingUpgrade.successChance;
  return {
    success,
    itemId: pendingUpgrade.itemId,
    targetLevel: pendingUpgrade.targetLevel,
    text: success
      ? `${pendingUpgrade.name} Lv.${pendingUpgrade.targetLevel} 강화 성공!`
      : `${pendingUpgrade.name} 강화 실패...`,
  };
}
