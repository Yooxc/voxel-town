import test from "node:test";
import assert from "node:assert/strict";
import { createForgeUpgradeAttemptPlan, createForgeUpgradeResultPlan } from "../src/systems/forge.js";

const upgradeState = {
  itemId: "pickaxe",
  name: "곡괭이",
  next: { level: 2, cost: 4, successChance: 0.6 },
};

test("validates forge upgrade attempts before consuming materials", () => {
  assert.equal(createForgeUpgradeAttemptPlan({ isProcessing: false, upgradeState: null, stoneDustCount: 9, delayMs: 1000 }).reason, "장착 중인 강화 가능 장비가 필요합니다");
  assert.equal(createForgeUpgradeAttemptPlan({ isProcessing: false, upgradeState: { ...upgradeState, next: null }, stoneDustCount: 9, delayMs: 1000 }).reason, "곡괭이가 이미 최대 강화입니다");
  assert.equal(createForgeUpgradeAttemptPlan({ isProcessing: false, upgradeState, stoneDustCount: 3, delayMs: 1000 }).reason, "돌가루가 부족합니다");
  assert.deepEqual(
    createForgeUpgradeAttemptPlan({ isProcessing: false, upgradeState, stoneDustCount: 4, delayMs: 1000 }),
    { ok: true, itemId: "pickaxe", name: "곡괭이", targetLevel: 2, successChance: 0.6, costItemId: "stoneDust", cost: 4, delayMs: 1000 }
  );
});

test("resolves forge result plans from the supplied random value", () => {
  const pending = { itemId: "pickaxe", name: "곡괭이", targetLevel: 2, successChance: 0.6 };
  assert.equal(createForgeUpgradeResultPlan(pending, 0.2).success, true);
  assert.deepEqual(createForgeUpgradeResultPlan(pending, 0.9), {
    success: false,
    itemId: "pickaxe",
    targetLevel: 2,
    text: "곡괭이 강화 실패...",
  });
});
