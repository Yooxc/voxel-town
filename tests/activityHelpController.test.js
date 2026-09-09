import test from "node:test";
import assert from "node:assert/strict";
import { createActivityHelpController } from "../src/systems/activityHelpController.js";

test("records an activity-help request and shows the selected optional activity", () => {
  const entry = { obj: {} };
  const calls = [];
  const controller = createActivityHelpController({
    recordActivityHelpRequest: () => calls.push("record"),
    showChoiceDialog: (text, target, choices) => calls.push(["choices", text, target, choices]),
    showDialog: (text, target) => calls.push(["detail", text, target]),
    hideDialog: () => calls.push("hide"),
  });

  assert.equal(controller.openFor(entry), true);
  assert.equal(controller.isOpen(), true);
  assert.equal(calls[0], "record");
  assert.equal(calls[1][3].length, 2);

  calls[1][3][1].onSelect();
  assert.match(calls.at(-1)[1], /곡괭이/);
  assert.equal(controller.close(), true);
  assert.equal(calls.at(-1), "hide");
});

test("closes the activity dialogue when its NPC is no longer nearby", () => {
  const entry = { obj: {} };
  let hidden = 0;
  const controller = createActivityHelpController({
    recordActivityHelpRequest: () => {},
    showChoiceDialog: () => {},
    showDialog: () => {},
    hideDialog: () => { hidden += 1; },
  });

  controller.openFor(entry);
  assert.equal(controller.updateNearby(null), true);
  assert.equal(controller.isOpen(), false);
  assert.equal(hidden, 1);
});

test("keeps completed activity reporting pending until the player chooses a response", () => {
  const entry = { obj: {} };
  const state = {
    firstActivities: {
      selectedId: "", exploreRestVisited: false, exploreWorkVisited: false,
      exploreCompleted: false, gatherCompleted: false,
      exploreReactionAcknowledged: false, gatherReactionAcknowledged: false,
    },
  };
  let choices = [];
  let notifications = 0;
  const controller = createActivityHelpController({
    recordActivityHelpRequest: () => {},
    selectActivity: (id) => { state.firstActivities.selectedId = id; },
    recordExploreVisit: (id) => {
      const key = id === "rest-area" ? "exploreRestVisited" : "exploreWorkVisited";
      if (state.firstActivities[key]) return { changed: false, completed: false };
      state.firstActivities[key] = true;
      state.firstActivities.exploreCompleted = state.firstActivities.exploreRestVisited && state.firstActivities.exploreWorkVisited;
      return { changed: true, completed: state.firstActivities.exploreCompleted };
    },
    acknowledgeActivityReaction: () => { state.firstActivities.exploreReactionAcknowledged = true; return true; },
    getOnboardingState: () => state,
    notify: () => { notifications += 1; },
    showChoiceDialog: (_text, _entry, nextChoices) => { choices = nextChoices; },
    showDialog: () => {}, hideDialog: () => {},
  });

  controller.openFor(entry);
  choices.find((choice) => choice.id === "explore").onSelect();
  controller.setExplorationLocations([
    { id: "rest-area", position: { x: 0, z: 0 } },
    { id: "work-area", position: { x: 4, z: 0 } },
  ]);
  assert.equal(controller.updatePlayerPosition({ x: 0, z: 0 }), false);
  assert.equal(controller.updatePlayerPosition({ x: 4, z: 0 }), true);
  assert.equal(notifications, 1);
  assert.equal(controller.showActivityStatus(entry), true);
  assert.equal(state.firstActivities.exploreReactionAcknowledged, false);
  choices.find((choice) => choice.label === "그냥 더 둘러보고 싶어요").onSelect();
  assert.equal(state.firstActivities.exploreReactionAcknowledged, true);
});

test("records the chosen introduction target only after a completed activity response", () => {
  const entry = { obj: {} };
  const state = {
    firstActivities: {
      selectedId: "gather", gatherCompleted: true, gatherReactionAcknowledged: false,
      introductions: { gather: { residentId: "", conversationCompleted: false } },
    },
  };
  const recorded = [];
  let choices = [];
  let text = "";
  const controller = createActivityHelpController({
    getOnboardingState: () => state,
    recordResidentIntroduction: (...args) => {
      recorded.push(args);
      state.firstActivities.introductions.gather.residentId = args[1];
    },
    acknowledgeActivityReaction: () => { state.firstActivities.gatherReactionAcknowledged = true; },
    showChoiceDialog: (nextText, _entry, nextChoices) => { text = nextText; choices = nextChoices; },
    showDialog: () => {}, hideDialog: () => {},
  });

  assert.equal(controller.showActivityStatus(entry), true);
  assert.match(text, /제작 가판의 세아/);
  choices.find((choice) => choice.label === "세아는 어디에 있나요?").onSelect();
  assert.deepEqual(recorded, [["gather", "craft-resident"]]);
  assert.match(text, /푸른 지붕 제작 가판/);
});

test("offers a declined resident introduction again on the next Maru conversation", () => {
  const entry = { obj: {} };
  const state = {
    firstActivities: {
      selectedId: "gather", gatherCompleted: true, gatherReactionAcknowledged: true,
      introductions: { gather: { residentId: "", conversationCompleted: false } },
    },
  };
  let text = "";
  const controller = createActivityHelpController({
    getOnboardingState: () => state,
    showChoiceDialog: (nextText) => { text = nextText; },
    showDialog: () => {}, hideDialog: () => {},
  });

  assert.equal(controller.showActivityStatus(entry), true);
  assert.match(text, /세아/);
});

test("lets Maru react to a completed first craft after the Se-a introduction", () => {
  const entry = { obj: {} };
  const state = {
    firstCraft: { completed: true },
    firstActivities: {
      selectedId: "gather", gatherCompleted: true, gatherReactionAcknowledged: true,
      introductions: { gather: { residentId: "craft-resident", conversationCompleted: true } },
    },
  };
  let text = "";
  let choices = [];
  const controller = createActivityHelpController({
    getOnboardingState: () => state,
    showChoiceDialog: (nextText, _entry, nextChoices) => { text = nextText; choices = nextChoices; },
    showDialog: () => {}, hideDialog: () => {},
  });

  assert.equal(controller.showActivityStatus(entry), true);
  assert.match(text, /첫 물건/);
  assert.deepEqual(choices.map((choice) => choice.label), [
    "재료를 더 찾아보고 싶어요",
    "다른 물건도 구경하고 싶어요",
    "일단 자유롭게 둘러볼게요",
  ]);
  choices[1].onSelect();
  assert.match(text, /라온/);
});

test("explains the remaining activity requirement before completion", () => {
  const entry = { obj: {} };
  const state = {
    firstActivities: {
      selectedId: "gather", exploreRestVisited: false, exploreWorkVisited: false,
      exploreCompleted: false, gatherCompleted: false,
      exploreReactionAcknowledged: false, gatherReactionAcknowledged: false,
    },
  };
  let choices = [];
  let text = "";
  const controller = createActivityHelpController({
    getOnboardingState: () => state,
    showChoiceDialog: (nextText, _entry, nextChoices) => { text = nextText; choices = nextChoices; },
    showDialog: () => {}, hideDialog: () => {},
  });

  assert.equal(controller.showActivityStatus(entry), true);
  assert.match(text, /돌가루 직접 구하기/);
  assert.deepEqual(choices.map((choice) => choice.label), ["계속 해보기", "다른 활동 알아보기"]);
  assert.deepEqual(controller.getProgressView(), {
    title: "해보는 중: 재료 직접 구해보기",
    objectives: [{ label: "돌가루 직접 구하기", current: 0, target: 1 }],
    status: "진행 중",
    completed: false,
  });
});

test("does not record a visit for the same coordinates on another map", () => {
  const state = {
    firstActivities: {
      selectedId: "explore", exploreRestVisited: false, exploreWorkVisited: false,
      exploreCompleted: false, gatherCompleted: false,
      exploreReactionAcknowledged: false, gatherReactionAcknowledged: false,
    },
  };
  let recorded = 0;
  const controller = createActivityHelpController({
    getOnboardingState: () => state,
    recordExploreVisit: () => { recorded += 1; return { changed: true, completed: false }; },
    showChoiceDialog: () => {}, showDialog: () => {}, hideDialog: () => {},
  });
  controller.setExplorationLocations([{ id: "rest-area", mapId: "광산", position: { x: 0, z: 0 } }]);

  assert.equal(controller.updatePlayerPosition({ x: 0, z: 0 }, "폐광"), false);
  assert.equal(recorded, 0);
});
