import test from "node:test";
import assert from "node:assert/strict";
import {
  TOUR_STATUS,
  completeOnboardingTour,
  acknowledgeOnboardingActivityReaction,
  completeOnboardingGatheringActivity,
  completeOnboardingResidentIntroduction,
  completeOnboardingFirstCraft,
  completeOnboardingWelcome,
  createDefaultOnboardingState,
  markOnboardingWorldEntered,
  normalizeOnboardingState,
  pauseOnboardingTour,
  recordOnboardingActivityHelpRequest,
  recordOnboardingExploreVisit,
  recordOnboardingResidentIntroduction,
  setOnboardingMarketItemInterest,
  startOnboardingFirstCraft,
  selectOnboardingFirstActivity,
  startOnboardingTour,
} from "../src/systems/onboarding.js";
import {
  buildNormalizedPlayerSaveSource,
  createDefaultPlayerSave,
} from "../src/save/playerSave.js";

function createSaveOptions(overrides = {}) {
  return {
    playerSaveVersion: 2,
    startX: 0,
    startY: 0,
    startZ: 0,
    airGaugeMax: 100,
    inventorySlotCount: 2,
    personalStorageSlotCount: 1,
    createDefaultFrontierBuildState: () => ({}),
    onboardingEnabled: true,
    ...overrides,
  };
}

test("creates an untouched onboarding state for a new rebuild player", () => {
  assert.deepEqual(createDefaultOnboardingState(), {
    version: 6,
    hasEnteredWorld: false,
    welcomeCompleted: false,
    tourStatus: TOUR_STATUS.NOT_STARTED,
    tourCheckpointId: "",
    activityHelpRequested: false,
    marketInterestItemIds: [],
    firstCraft: { started: false, completed: false },
    firstActivities: {
      selectedId: "",
      exploreRestVisited: false,
      exploreWorkVisited: false,
      exploreCompleted: false,
      gatherCompleted: false,
      exploreReactionAcknowledged: false,
      gatherReactionAcknowledged: false,
      introductions: {
        explore: { residentId: "", conversationCompleted: false },
        gather: { residentId: "", conversationCompleted: false },
      },
    },
  });
});

test("normalizes an interrupted tour as paused when loading a save", () => {
  const normalized = normalizeOnboardingState({
    hasEnteredWorld: true,
    welcomeCompleted: true,
    tourStatus: TOUR_STATUS.IN_PROGRESS,
    tourCheckpointId: "plaza",
  });

  assert.equal(normalized.tourStatus, TOUR_STATUS.PAUSED);
  assert.equal(normalized.tourCheckpointId, "plaza");
});

test("onboarding transitions are explicit and idempotent", () => {
  const state = createDefaultOnboardingState();

  assert.deepEqual(markOnboardingWorldEntered(state), { changed: true, firstVisit: true });
  assert.deepEqual(markOnboardingWorldEntered(state), { changed: false, firstVisit: false });
  assert.equal(completeOnboardingWelcome(state), true);
  assert.equal(completeOnboardingWelcome(state), false);
  assert.equal(startOnboardingTour(state, "gate"), true);
  assert.equal(pauseOnboardingTour(state, "plaza"), true);
  assert.equal(pauseOnboardingTour(state), false);
  assert.equal(state.tourCheckpointId, "plaza");
  assert.equal(startOnboardingTour(state, "plaza"), true);
  assert.equal(completeOnboardingTour(state, "guide"), true);
  assert.equal(startOnboardingTour(state, "gate"), false);
  assert.equal(recordOnboardingActivityHelpRequest(state), true);
  assert.equal(recordOnboardingActivityHelpRequest(state), false);
  assert.equal(selectOnboardingFirstActivity(state, "explore"), true);
  assert.deepEqual(recordOnboardingExploreVisit(state, "rest-area"), { changed: true, completed: false });
  assert.deepEqual(recordOnboardingExploreVisit(state, "work-area"), { changed: true, completed: true });
  assert.equal(state.firstActivities.exploreCompleted, true);
  assert.equal(acknowledgeOnboardingActivityReaction(state, "explore"), true);
  assert.equal(acknowledgeOnboardingActivityReaction(state, "explore"), false);
  assert.equal(selectOnboardingFirstActivity(state, "gather"), true);
  assert.equal(completeOnboardingGatheringActivity(state), true);
  assert.equal(completeOnboardingGatheringActivity(state), false);
  assert.equal(recordOnboardingResidentIntroduction(state, "gather", "craft-resident"), true);
  assert.equal(recordOnboardingResidentIntroduction(state, "gather", "living-resident"), false);
  assert.equal(completeOnboardingResidentIntroduction(state, "gather", "craft-resident"), true);
  assert.equal(completeOnboardingResidentIntroduction(state, "gather", "craft-resident"), false);
  assert.equal(setOnboardingMarketItemInterest(state, "crafted-box", true), true);
  assert.equal(setOnboardingMarketItemInterest(state, "crafted-box", true), false);
  assert.deepEqual(state.marketInterestItemIds, ["crafted-box"]);
  assert.equal(setOnboardingMarketItemInterest(state, "crafted-box", false), true);
  assert.deepEqual(state.marketInterestItemIds, []);
  assert.equal(setOnboardingMarketItemInterest(state, "unknown-item", true), false);
  assert.equal(startOnboardingFirstCraft(state), true);
  assert.equal(startOnboardingFirstCraft(state), false);
  assert.equal(completeOnboardingFirstCraft(state), true);
  assert.equal(completeOnboardingFirstCraft(state), false);
  assert.deepEqual(state.firstCraft, { started: true, completed: true });
});

test("keeps resident introductions independent for each first activity", () => {
  const state = createDefaultOnboardingState();

  assert.equal(recordOnboardingResidentIntroduction(state, "gather", "craft-resident"), true);
  assert.equal(recordOnboardingResidentIntroduction(state, "explore", "craft-resident"), true);
  assert.equal(completeOnboardingResidentIntroduction(state, "gather", "craft-resident"), true);
  assert.equal(state.firstActivities.introductions.gather.conversationCompleted, true);
  assert.equal(state.firstActivities.introductions.explore.conversationCompleted, false);
});

test("migrates version 3 activity saves with empty introduction records", () => {
  const normalized = normalizeOnboardingState({
    version: 3,
    firstActivities: { selectedId: "gather", gatherCompleted: true },
  });

  assert.equal(normalized.version, 6);
  assert.deepEqual(normalized.firstActivities.introductions, {
    explore: { residentId: "", conversationCompleted: false },
    gather: { residentId: "", conversationCompleted: false },
  });
});

test("migrates old saves with a pending first craft default", () => {
  const normalized = normalizeOnboardingState({ version: 5, welcomeCompleted: true });

  assert.equal(normalized.welcomeCompleted, true);
  assert.deepEqual(normalized.firstCraft, { started: false, completed: false });
});

test("normalizes saved market interests to known unique item ids", () => {
  const normalized = normalizeOnboardingState({
    marketInterestItemIds: ["small-tool", "unknown-item", "small-tool", "crafted-box"],
  });

  assert.deepEqual(normalized.marketInterestItemIds, ["small-tool", "crafted-box"]);
});

test("old rebuild saves receive defaults without changing their existing data", () => {
  const options = createSaveOptions();
  const createSave = () => createDefaultPlayerSave(options);
  const normalized = buildNormalizedPlayerSaveSource({
    version: 1,
    economy: { credits: 25 },
  }, {
    createDefaultPlayerSave: createSave,
    normalizeFrontierBuildState: (value) => value ?? {},
    normalizeNftBoardSelection: (value) => value,
    onboardingEnabled: true,
  });

  assert.equal(normalized.economy.credits, 25);
  assert.deepEqual(normalized.onboarding, createDefaultOnboardingState());
});

test("legacy mode does not add onboarding data to its save format", () => {
  const save = createDefaultPlayerSave(createSaveOptions({
    playerSaveVersion: 1,
    onboardingEnabled: false,
  }));

  assert.equal("onboarding" in save, false);
});
