import test from "node:test";
import assert from "node:assert/strict";
import { createQuestUiController } from "../src/ui/questUiController.js";

function createElement() {
  const listeners = new Map();
  return {
    style: {}, offsetWidth: 200, offsetHeight: 120,
    addEventListener: (name, handler) => listeners.set(name, handler),
    getBoundingClientRect: () => ({ left: 20, top: 30 }),
    setPointerCapture: () => {},
    trigger: (name, event) => listeners.get(name)?.(event),
  };
}

test("quest controller updates progress, saves, and renders when open", () => {
  const quest = { currentStep: 0, completed: false, archivedSteps: [], steps: [{ title: "장비" }] };
  let saves = 0;
  let renders = 0;
  const header = createElement();
  const archiveToggleButton = createElement();
  const controller = createQuestUiController({
    getQuest: () => quest,
    isOpen: () => true,
    getCurrentStep: () => quest.steps[quest.currentStep] ?? null,
    canArchive: () => true,
    getProgress: () => ({ currentStep: 1, completed: true, advanced: true, events: [{ type: "completed" }] }),
    scheduleSave: () => { saves += 1; },
    notify: () => {},
    renderWindow: () => { renders += 1; },
    elements: { window: createElement(), header, archiveToggleButton, title: {}, description: {}, stepList: {}, footer: {} },
  });

  controller.refreshProgress();
  assert.equal(quest.completed, true);
  assert.equal(saves, 1);
  assert.equal(renders, 1);

  controller.archiveStep(0);
  assert.deepEqual(quest.archivedSteps, [0]);
  assert.equal(saves, 2);
});

test("rerenders an open rebuild journal only when its entries change", () => {
  let quest = { kind: "rebuild-journal", entries: [] };
  let renders = 0;
  const controller = createQuestUiController({
    getQuest: () => quest,
    isOpen: () => true,
    getCurrentStep: () => null,
    renderWindow: () => { renders += 1; },
    elements: {
      window: createElement(), header: createElement(), archiveToggleButton: createElement(),
      title: {}, description: {}, stepList: {}, footer: {},
    },
  });

  controller.render();
  assert.equal(controller.refreshDisplay(), false);
  quest = { kind: "rebuild-journal", entries: [{ id: "flower-crown", completed: false }] };
  assert.equal(controller.refreshDisplay(), true);
  assert.equal(controller.refreshDisplay(), false);
  assert.equal(renders, 2);
});
