import test from "node:test";
import assert from "node:assert/strict";
import { createWelcomeController } from "../src/systems/welcomeController.js";

function createHarness({ completed = false, tourStatus = "not_started" } = {}) {
  const state = { welcomeCompleted: completed, tourStatus };
  const calls = [];
  const resident = { role: "welcome", obj: {} };
  const controller = createWelcomeController({
    getOnboardingState: () => state,
    completeWelcome: () => { state.welcomeCompleted = true; calls.push("complete"); },
    getTourStatus: () => state.tourStatus,
    requestTour: () => { state.tourStatus = "in_progress"; calls.push("tour"); return true; },
    showDialog: (text, entry) => calls.push(["show", text, entry]),
    hideDialog: () => calls.push("hide"),
  });
  return { state, calls, resident, controller };
}

test("welcomes a first visitor on approach and completes only after the final confirmation", () => {
  const harness = createHarness();

  harness.controller.updateNearby(harness.resident);
  assert.match(harness.calls[0][1], /환영/);
  assert.equal(harness.state.welcomeCompleted, false);

  harness.controller.interact(harness.resident);
  assert.match(harness.calls[1][1], /천천히/);
  assert.equal(harness.state.welcomeCompleted, false);

  harness.controller.interact(harness.resident);
  assert.equal(harness.state.welcomeCompleted, true);
  assert.equal(harness.calls.at(-2), "complete");
  assert.match(harness.calls.at(-1)[1], /안내받기/);
  harness.controller.interact(harness.resident);
  assert.deepEqual(harness.calls.slice(-2), ["tour", "hide"]);
});

test("leaving or closing an unfinished greeting does not complete it", () => {
  const harness = createHarness();
  harness.controller.updateNearby(harness.resident);
  harness.controller.close();

  assert.equal(harness.state.welcomeCompleted, false);
  assert.equal(harness.controller.isOpen(), false);

  harness.controller.updateNearby(null);
  harness.controller.updateNearby(harness.resident);
  assert.equal(harness.controller.isOpen(), true);
});

test("a returning visitor with an unfinished tour receives the tour offer", () => {
  const harness = createHarness({ completed: true });

  harness.controller.interact(harness.resident);
  assert.match(harness.calls[0][1], /안내받기/);
});

test("a selected first activity takes priority over the unfinished tour offer", () => {
  const resident = { role: "welcome", obj: {} };
  let activityStatusChecks = 0;
  const controller = createWelcomeController({
    getOnboardingState: () => ({ welcomeCompleted: true }),
    completeWelcome: () => {},
    getTourStatus: () => "not_started",
    requestTour: () => true,
    showActivityStatus: () => { activityStatusChecks += 1; return true; },
    showDialog: () => {},
    hideDialog: () => {},
  });

  assert.equal(controller.interact(resident).action, "activity-status");
  assert.equal(activityStatusChecks, 1);
});

test("a returning visitor receives one short greeting after completing the tour", () => {
  const harness = createHarness({ completed: true, tourStatus: "completed" });

  harness.controller.updateNearby(harness.resident);
  assert.equal(harness.calls.length, 0);
  harness.controller.interact(harness.resident);
  assert.match(harness.calls[0][1], /다시 오셨네요/);
  harness.controller.interact(harness.resident);
  assert.equal(harness.calls.at(-1), "hide");
});

test("a visitor can ask Maru about activities instead of starting the tour", () => {
  const state = { welcomeCompleted: true, tourStatus: "not_started" };
  const resident = { role: "welcome", obj: {} };
  let choices = [];
  let activityRequests = 0;
  const controller = createWelcomeController({
    getOnboardingState: () => state,
    completeWelcome: () => {},
    getTourStatus: () => state.tourStatus,
    requestTour: () => true,
    openActivityHelp: () => { activityRequests += 1; return true; },
    showTourChoices: (_text, _entry, nextChoices) => { choices = nextChoices; },
    showDialog: () => {},
    hideDialog: () => {},
  });

  controller.interact(resident);
  assert.equal(controller.isChoiceOpen(), true);
  choices.find((choice) => choice.label === "할 일 물어보기").onSelect();
  assert.equal(activityRequests, 1);
  assert.equal(controller.isChoiceOpen(), false);
});

test("Maru asks the visitor to wait while the requested guide is arriving", () => {
  const state = { welcomeCompleted: true, tourStatus: "not_started" };
  const resident = { role: "welcome", obj: {} };
  const calls = [];
  let choices = [];
  const controller = createWelcomeController({
    getOnboardingState: () => state,
    completeWelcome: () => {},
    getTourStatus: () => state.tourStatus,
    requestTour: () => { state.tourStatus = "in_progress"; return true; },
    showTourChoices: (_text, _entry, nextChoices) => { choices = nextChoices; },
    showDialog: (text, entry) => calls.push([text, entry]),
    hideDialog: () => calls.push("hide"),
  });

  controller.interact(resident);
  choices.find((choice) => choice.label === "동네 안내받기").onSelect();

  assert.match(calls.at(-1)[0], /잠깐 기다려줘/);
  assert.equal(calls.at(-1)[1], resident);
  assert.equal(controller.isOpen(), false);
});

test("Maru checks the selected first activity before reopening activity choices", () => {
  const resident = { role: "welcome", obj: {} };
  let reactions = 0;
  const controller = createWelcomeController({
    getOnboardingState: () => ({ welcomeCompleted: true }),
    completeWelcome: () => {},
    getTourStatus: () => "completed",
    showActivityStatus: () => { reactions += 1; return true; },
    showDialog: () => {},
    hideDialog: () => {},
  });

  assert.equal(controller.interact(resident).action, "activity-status");
  assert.equal(reactions, 1);
});

test("ignores non-welcome tutorial NPCs", () => {
  const harness = createHarness();
  const result = harness.controller.interact({ role: "tutorial", obj: {} });
  assert.deepEqual(result, { handled: false });
  assert.equal(harness.calls.length, 0);
});
