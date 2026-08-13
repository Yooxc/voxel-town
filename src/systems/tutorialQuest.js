export const TUTORIAL_NPC_LINES = [
  "가판대에서 곡괭이와 안전모를 챙겨. 작업장에선 장비부터 갖추는 게 우선이야.",
  "좋아. 이제 인벤토리를 열어서 안전모부터 써. 광산에선 보호구가 기본이야.",
  "다음은 곡괭이를 손에 들어. 장비를 갖췄으면 바로 작업할 수 있게 준비해야지.",
  "앞에 있는 돌을 하나 캐봐. 직접 해보는 게 제일 빠르다.",
  "이제 모루로 가서 곡괭이를 세 번 강화해봐. 장비를 충분히 다뤄봐야 폐광 출입을 맡길 수 있어.",
  "좋아, 준비는 끝났다. 나에게 말을 걸면 폐광 열쇠를 넘겨주지.",
];

export function getCurrentTutorialQuestStep(state, steps) {
  if (state.completed) return null;
  return steps[state.currentStep] ?? null;
}

export function getTutorialNpcLine({ state, steps, mineKeyIssued, abandonedMineUnlocked }) {
  const step = getCurrentTutorialQuestStep(state, steps);
  if (!step) {
    if (!mineKeyIssued) return "좋아, 이제 폐광에 들어갈 자격이 생겼다. 이 열쇠를 가져가서 북쪽 폐광 입구를 열어.";
    if (!abandonedMineUnlocked) return "북쪽 폐광 입구로 가서 E키로 열쇠를 사용해. 한 번 열어두면 계속 드나들 수 있다.";
    return "좋아, 폐광 통로도 열렸다. 더 깊은 곳으로 들어갈 준비가 됐군.";
  }
  return TUTORIAL_NPC_LINES[state.currentStep] ?? step.description;
}

export function getTutorialQuestProgressPlan({ state, steps }) {
  let currentStep = state.currentStep;
  let completed = state.completed;
  const events = [];
  while (!completed) {
    const step = steps[currentStep];
    if (!step || !step.check()) break;
    currentStep += 1;
    if (currentStep >= steps.length) {
      completed = true;
      events.push({ type: "completed" });
      break;
    }
    events.push({ type: "advanced", step: steps[currentStep] });
  }
  return { currentStep, completed, advanced: events.length > 0, events };
}

export function canArchiveTutorialQuestStep({ stepIndex, currentStep, completed, archivedSteps }) {
  const isDone = stepIndex < currentStep || completed;
  return isDone && !archivedSteps.includes(stepIndex);
}
