import test from "node:test";
import assert from "node:assert/strict";
import {
  canArchiveTutorialQuestStep,
  getCurrentTutorialQuestStep,
  getTutorialNpcLine,
  getTutorialQuestProgressPlan,
} from "../src/systems/tutorialQuest.js";

const steps = [
  { title: "One", description: "First", check: () => true },
  { title: "Two", description: "Second", check: () => false },
];

test("returns the active step and advances completed checks", () => {
  const state = { currentStep: 0, completed: false };
  assert.equal(getCurrentTutorialQuestStep(state, steps), steps[0]);
  assert.deepEqual(getTutorialQuestProgressPlan({ state, steps }), {
    currentStep: 1,
    completed: false,
    advanced: true,
    events: [{ type: "advanced", step: steps[1] }],
  });
});

test("marks the tutorial complete after its final satisfied step", () => {
  const finalSteps = [{ title: "Final", description: "Done", check: () => true }];
  assert.deepEqual(getTutorialQuestProgressPlan({
    state: { currentStep: 0, completed: false }, steps: finalSteps,
  }), {
    currentStep: 1,
    completed: true,
    advanced: true,
    events: [{ type: "completed" }],
  });
});

test("chooses NPC dialogue and only archives completed steps once", () => {
  assert.equal(getTutorialNpcLine({
    state: { currentStep: 0, completed: false }, steps, mineKeyIssued: false, abandonedMineUnlocked: false,
  }).includes("가판대"), true);
  assert.equal(canArchiveTutorialQuestStep({
    stepIndex: 0, currentStep: 1, completed: false, archivedSteps: [],
  }), true);
  assert.equal(canArchiveTutorialQuestStep({
    stepIndex: 0, currentStep: 1, completed: false, archivedSteps: [0],
  }), false);
});
