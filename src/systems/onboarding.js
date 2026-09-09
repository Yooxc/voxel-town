export const ONBOARDING_VERSION = 7;

export const TOUR_STATUS = Object.freeze({
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  PAUSED: "paused",
  COMPLETED: "completed",
});

const TOUR_STATUSES = new Set(Object.values(TOUR_STATUS));
const ACTIVITY_IDS = new Set(["explore", "gather"]);
const ACTIVITY_RESIDENTS = Object.freeze({
  explore: new Set(["craft-resident", "living-resident"]),
  gather: new Set(["craft-resident"]),
});
const MARKET_INTEREST_ITEM_IDS = new Set(["crafted-box", "small-tool"]);

function createDefaultIntroductionState() {
  return { residentId: "", conversationCompleted: false };
}

function normalizeIntroductionState(rawState, activityId) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const residentId = ACTIVITY_RESIDENTS[activityId]?.has(source.residentId)
    ? source.residentId
    : "";
  return {
    residentId,
    conversationCompleted: Boolean(residentId && source.conversationCompleted),
  };
}

function createDefaultFirstActivityState() {
  return {
    selectedId: "",
    exploreRestVisited: false,
    exploreWorkVisited: false,
    exploreCompleted: false,
    gatherCompleted: false,
    exploreReactionAcknowledged: false,
    gatherReactionAcknowledged: false,
    introductions: {
      explore: createDefaultIntroductionState(),
      gather: createDefaultIntroductionState(),
    },
  };
}

function normalizeFirstActivityState(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const selectedId = ACTIVITY_IDS.has(source.selectedId) ? source.selectedId : "";
  const exploreRestVisited = Boolean(source.exploreRestVisited);
  const exploreWorkVisited = Boolean(source.exploreWorkVisited);
  return {
    selectedId,
    exploreRestVisited,
    exploreWorkVisited,
    exploreCompleted: Boolean(source.exploreCompleted) || (exploreRestVisited && exploreWorkVisited),
    gatherCompleted: Boolean(source.gatherCompleted),
    exploreReactionAcknowledged: Boolean(source.exploreReactionAcknowledged),
    gatherReactionAcknowledged: Boolean(source.gatherReactionAcknowledged),
    introductions: {
      explore: normalizeIntroductionState(source.introductions?.explore, "explore"),
      gather: normalizeIntroductionState(source.introductions?.gather, "gather"),
    },
  };
}

export function createDefaultOnboardingState() {
  return {
    version: ONBOARDING_VERSION,
    hasEnteredWorld: false,
    welcomeCompleted: false,
    tourStatus: TOUR_STATUS.NOT_STARTED,
    tourCheckpointId: "",
    activityHelpRequested: false,
    marketInterestItemIds: [],
    firstCraft: {
      started: false,
      completed: false,
      mineVisited: false,
    },
    firstActivities: createDefaultFirstActivityState(),
  };
}

export function normalizeOnboardingState(rawState, { pauseInterruptedTour = true } = {}) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const savedTourStatus = TOUR_STATUSES.has(source.tourStatus)
    ? source.tourStatus
    : TOUR_STATUS.NOT_STARTED;
  const tourStatus = pauseInterruptedTour && savedTourStatus === TOUR_STATUS.IN_PROGRESS
    ? TOUR_STATUS.PAUSED
    : savedTourStatus;

  return {
    version: ONBOARDING_VERSION,
    hasEnteredWorld: Boolean(source.hasEnteredWorld),
    welcomeCompleted: Boolean(source.welcomeCompleted),
    tourStatus,
    tourCheckpointId: typeof source.tourCheckpointId === "string"
      ? source.tourCheckpointId.slice(0, 64)
      : "",
    activityHelpRequested: Boolean(source.activityHelpRequested),
    marketInterestItemIds: Array.isArray(source.marketInterestItemIds)
      ? [...new Set(source.marketInterestItemIds.filter((itemId) => MARKET_INTEREST_ITEM_IDS.has(itemId)))]
      : [],
    firstCraft: {
      started: Boolean(source.firstCraft?.started) || Boolean(source.firstCraft?.completed),
      completed: Boolean(source.firstCraft?.completed),
      mineVisited: Boolean(source.firstCraft?.mineVisited),
    },
    firstActivities: normalizeFirstActivityState(source.firstActivities),
  };
}

export function applyOnboardingState(target, rawState, options) {
  Object.assign(target, normalizeOnboardingState(rawState, options));
  return target;
}

export function markOnboardingWorldEntered(state) {
  const firstVisit = !state.hasEnteredWorld;
  state.hasEnteredWorld = true;
  return { changed: firstVisit, firstVisit };
}

export function completeOnboardingWelcome(state) {
  if (state.welcomeCompleted) return false;
  state.welcomeCompleted = true;
  return true;
}

export function startOnboardingTour(state, checkpointId = "") {
  if (state.tourStatus === TOUR_STATUS.COMPLETED) return false;
  const nextCheckpointId = checkpointId == null ? "" : String(checkpointId).slice(0, 64);
  const changed = state.tourStatus !== TOUR_STATUS.IN_PROGRESS
    || state.tourCheckpointId !== nextCheckpointId;
  state.tourStatus = TOUR_STATUS.IN_PROGRESS;
  state.tourCheckpointId = nextCheckpointId;
  return changed;
}

export function pauseOnboardingTour(state, checkpointId = state.tourCheckpointId) {
  if (state.tourStatus === TOUR_STATUS.COMPLETED) return false;
  const nextCheckpointId = checkpointId == null
    ? state.tourCheckpointId
    : String(checkpointId).slice(0, 64);
  const changed = state.tourStatus !== TOUR_STATUS.PAUSED
    || state.tourCheckpointId !== nextCheckpointId;
  state.tourStatus = TOUR_STATUS.PAUSED;
  state.tourCheckpointId = nextCheckpointId;
  return changed;
}

export function completeOnboardingTour(state, checkpointId = state.tourCheckpointId) {
  const nextCheckpointId = checkpointId == null
    ? state.tourCheckpointId
    : String(checkpointId).slice(0, 64);
  const changed = state.tourStatus !== TOUR_STATUS.COMPLETED
    || state.tourCheckpointId !== nextCheckpointId;
  state.tourStatus = TOUR_STATUS.COMPLETED;
  state.tourCheckpointId = nextCheckpointId;
  return changed;
}

export function recordOnboardingActivityHelpRequest(state) {
  if (state.activityHelpRequested) return false;
  state.activityHelpRequested = true;
  return true;
}

export function selectOnboardingFirstActivity(state, activityId) {
  if (!ACTIVITY_IDS.has(activityId) || state.firstActivities.selectedId === activityId) return false;
  state.firstActivities.selectedId = activityId;
  return true;
}

export function recordOnboardingExploreVisit(state, locationId) {
  const activities = state.firstActivities;
  if (activities.selectedId !== "explore" || activities.exploreCompleted) return { changed: false, completed: false };
  const key = locationId === "rest-area" ? "exploreRestVisited"
    : locationId === "work-area" ? "exploreWorkVisited"
      : "";
  if (!key || activities[key]) return { changed: false, completed: false };
  activities[key] = true;
  const completed = activities.exploreRestVisited && activities.exploreWorkVisited;
  activities.exploreCompleted = completed;
  return { changed: true, completed };
}

export function completeOnboardingGatheringActivity(state) {
  const activities = state.firstActivities;
  if (activities.selectedId !== "gather" || activities.gatherCompleted) return false;
  activities.gatherCompleted = true;
  return true;
}

export function acknowledgeOnboardingActivityReaction(state, activityId) {
  const activities = state.firstActivities;
  const key = activityId === "explore" ? "exploreReactionAcknowledged"
    : activityId === "gather" ? "gatherReactionAcknowledged"
      : "";
  if (!key || activities[key]) return false;
  activities[key] = true;
  return true;
}

function getIntroductionState(state, activityId) {
  if (!ACTIVITY_IDS.has(activityId)) return null;
  state.firstActivities.introductions ??= {};
  state.firstActivities.introductions[activityId] ??= createDefaultIntroductionState();
  return state.firstActivities.introductions[activityId];
}

export function recordOnboardingResidentIntroduction(state, activityId, residentId) {
  if (!ACTIVITY_RESIDENTS[activityId]?.has(residentId)) return false;
  const introduction = getIntroductionState(state, activityId);
  if (introduction.residentId === residentId) return false;
  introduction.residentId = residentId;
  introduction.conversationCompleted = false;
  return true;
}

export function completeOnboardingResidentIntroduction(state, activityId, residentId) {
  const introduction = getIntroductionState(state, activityId);
  if (!introduction || introduction.residentId !== residentId || introduction.conversationCompleted) return false;
  introduction.conversationCompleted = true;
  return true;
}

export function setOnboardingMarketItemInterest(state, itemId, interested) {
  if (!MARKET_INTEREST_ITEM_IDS.has(itemId)) return false;
  const currentIds = Array.isArray(state.marketInterestItemIds) ? state.marketInterestItemIds : [];
  const hasInterest = currentIds.includes(itemId);
  if (hasInterest === Boolean(interested)) return false;
  state.marketInterestItemIds = interested
    ? [...currentIds, itemId]
    : currentIds.filter((currentId) => currentId !== itemId);
  return true;
}

export function startOnboardingFirstCraft(state) {
  if (state.firstCraft?.started || state.firstCraft?.completed) return false;
  state.firstCraft = { started: true, completed: false, mineVisited: false };
  return true;
}

export function completeOnboardingFirstCraft(state) {
  if (state.firstCraft?.completed) return false;
  state.firstCraft = { ...state.firstCraft, started: true, completed: true };
  return true;
}

export function recordOnboardingFirstCraftMineVisit(state) {
  if (!state.firstCraft?.started || state.firstCraft.completed || state.firstCraft.mineVisited) return false;
  state.firstCraft.mineVisited = true;
  return true;
}
