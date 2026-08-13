import test from "node:test";
import assert from "node:assert/strict";
import { getQuestWindowView } from "../src/ui/questWindow.js";

const steps = [
  { title: "첫 단계", description: "첫 설명" },
  { title: "둘째 단계", description: "둘째 설명" },
  { title: "셋째 단계", description: "셋째 설명" },
];

test("shows active and unarchived quest steps with archive availability", () => {
  const view = getQuestWindowView({
    quest: { title: "튜토리얼", description: "기본 설명", steps, currentStep: 1, completed: false, archivedSteps: [] },
    viewMode: "active",
    currentStep: steps[1],
  });
  assert.equal(view.toggleText, "완료 보기");
  assert.deepEqual(view.visibleSteps.map(({ index, isActive, canArchive }) => ({ index, isActive, canArchive })), [
    { index: 0, isActive: false, canArchive: true },
    { index: 1, isActive: true, canArchive: false },
    { index: 2, isActive: false, canArchive: false },
  ]);
});

test("shows only archived completed steps in completed mode", () => {
  const view = getQuestWindowView({
    quest: { title: "튜토리얼", description: "기본 설명", steps, currentStep: 2, completed: false, archivedSteps: [0] },
    viewMode: "completed",
    currentStep: steps[2],
  });
  assert.equal(view.description.includes("정리한 단계"), true);
  assert.deepEqual(view.visibleSteps.map((entry) => entry.index), [0]);
});

test("returns the empty active view after all completed steps are archived", () => {
  const view = getQuestWindowView({
    quest: { title: "튜토리얼", description: "기본 설명", steps, currentStep: 3, completed: true, archivedSteps: [0, 1, 2] },
    viewMode: "active",
    currentStep: null,
  });
  assert.equal(view.visibleSteps.length, 0);
  assert.equal(view.emptyText, "진행 중인 퀘스트가 없습니다.");
});
