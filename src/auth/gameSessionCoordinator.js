import { createPlayerSaveCoordinator } from "../save/playerSaveCoordinator.js";
import { createSessionWorkflowController } from "./sessionWorkflowController.js";
import { createDevProfileOrchestrator } from "./sessionController.js";

export function createDevCreditsMigrationKey(prefix, sanitizeProfileId, profileId) {
  return `${prefix}${sanitizeProfileId(profileId)}`;
}

export function createGameSessionCoordinator(ctx) {
  const playerSaveCoordinator = createPlayerSaveCoordinator(ctx.playerSave);
  const getPlayerSaveTransport = () => ctx.playerSave.getTransport();
  const hydratePlayerSaveFromServer = () => playerSaveCoordinator.hydrateFromServer(getPlayerSaveTransport());
  const pushPlayerSaveToServer = () => playerSaveCoordinator.pushToServer(getPlayerSaveTransport());
  const schedulePlayerSaveSync = (force = false) => playerSaveCoordinator.scheduleSync(force, getPlayerSaveTransport());
  const commitOnboardingTransition = (transition) => {
    if (!ctx.onboarding?.enabled || typeof transition !== "function") return false;
    const changed = transition();
    if (changed) schedulePlayerSaveSync(true);
    return changed;
  };
  const commitOnboardingResult = (transition, getChanged = (result) => Boolean(result)) => {
    if (!ctx.onboarding?.enabled || typeof transition !== "function") return null;
    const result = transition();
    if (getChanged(result)) schedulePlayerSaveSync(true);
    return result;
  };
  const workflow = createSessionWorkflowController({
    ...ctx.workflow,
    saveCoordinator: playerSaveCoordinator,
  });
  const {
    canPlayGame, clearWalletSession, handleWalletLogout, hasNickname, isDevSession,
    isGuestSession, isServerBackedWalletSession, isWalletAuthenticated, restoreWalletSession,
    saveWalletSession, setWalletAuthState, updateWalletUi,
  } = workflow;
  const applyDevProfileStartPosition = (profileId = ctx.getActiveProfileId()) => {
    const start = ctx.sessionController.getDevProfileStartPosition(profileId);
    ctx.setPlayerStartPosition(start);
  };

  const devProfileOrchestrator = createDevProfileOrchestrator({
    ...ctx.devProfile,
    isDevSession,
    setWalletAuthState,
    getCreditsMigrationKey: (profileId) => (
      createDevCreditsMigrationKey(ctx.devCreditsMigrationPrefix, ctx.sanitizeProfileId, profileId)
    ),
    getInventorySeedKey: (profileId) => (
      createDevCreditsMigrationKey(ctx.devInventorySeedPrefix, ctx.sanitizeProfileId, profileId)
    ),
    resetPlayerSaveProtectionState: playerSaveCoordinator.resetProtectionState,
    setPlayerSaveSyncPaused: playerSaveCoordinator.setSyncPaused,
    loadActiveLocalProfileState: playerSaveCoordinator.loadActiveLocalProfileState,
    saveActiveLocalProfileState: playerSaveCoordinator.saveActiveLocalProfileState,
    applyDevProfileStartPosition,
  });

  return {
    playerSaveCoordinator,
    canPlayGame,
    clearWalletSession,
    handleWalletLogout,
    hasNickname,
    isDevSession,
    isGuestSession,
    isServerBackedWalletSession,
    isWalletAuthenticated,
    restoreWalletSession,
    saveWalletSession,
    setWalletAuthState,
    updateWalletUi,
    bindWalletProviderEvents: () => workflow.bindWalletProviderEvents(ctx.getProvider()),
    connectWalletLogin: () => workflow.connectWalletLogin(ctx.getProvider()),
    startGuestSession: () => workflow.startGuestSession(),
    commitNickname: () => workflow.commitNickname(schedulePlayerSaveSync),
    hydrateWalletSessionFromServer: () => workflow.hydrateWalletSessionFromServer(),
    getDevCreditsMigrationKey: (profileId = ctx.getActiveProfileId()) => (
      createDevCreditsMigrationKey(ctx.devCreditsMigrationPrefix, ctx.sanitizeProfileId, profileId)
    ),
    applyDevProfileStartPosition,
    initializeDevProfileState: (profileId = "") => devProfileOrchestrator.initialize(profileId),
    switchDevProfile: (profileId) => devProfileOrchestrator.switchProfile(profileId),
    resetDevTestingEnvironment: () => devProfileOrchestrator.resetTestingEnvironment(),
    hydratePlayerSaveFromServer,
    pushPlayerSaveToServer,
    schedulePlayerSaveSync,
    getOnboardingState: () => ctx.onboarding?.getState?.() ?? null,
    completeOnboardingWelcome: () => commitOnboardingTransition(ctx.onboarding?.completeWelcome),
    startOnboardingTour: (checkpointId) => commitOnboardingTransition(
      () => ctx.onboarding.startTour(checkpointId)
    ),
    pauseOnboardingTour: (checkpointId) => commitOnboardingTransition(
      () => ctx.onboarding.pauseTour(checkpointId)
    ),
    completeOnboardingTour: (checkpointId) => commitOnboardingTransition(
      () => ctx.onboarding.completeTour(checkpointId)
    ),
    recordOnboardingActivityHelpRequest: () => commitOnboardingTransition(
      ctx.onboarding?.recordActivityHelpRequest
    ),
    selectOnboardingFirstActivity: (activityId) => commitOnboardingTransition(
      () => ctx.onboarding.selectFirstActivity(activityId)
    ),
    recordOnboardingExploreVisit: (locationId) => commitOnboardingResult(
      () => ctx.onboarding.recordExploreVisit(locationId),
      (result) => Boolean(result?.changed)
    ),
    completeOnboardingGatheringActivity: () => commitOnboardingTransition(
      ctx.onboarding?.completeGatheringActivity
    ),
    acknowledgeOnboardingActivityReaction: (activityId) => commitOnboardingTransition(
      () => ctx.onboarding.acknowledgeActivityReaction(activityId)
    ),
    recordOnboardingResidentIntroduction: (activityId, residentId) => commitOnboardingTransition(
      () => ctx.onboarding.recordResidentIntroduction(activityId, residentId)
    ),
    completeOnboardingResidentIntroduction: (activityId, residentId) => commitOnboardingTransition(
      () => ctx.onboarding.completeResidentIntroduction(activityId, residentId)
    ),
    setOnboardingMarketItemInterest: (itemId, interested) => commitOnboardingTransition(
      () => ctx.onboarding.setMarketItemInterest(itemId, interested)
    ),
    startOnboardingFirstCraft: () => commitOnboardingTransition(
      ctx.onboarding?.startFirstCraft
    ),
    completeOnboardingFirstCraft: () => commitOnboardingTransition(
      ctx.onboarding?.completeFirstCraft
    ),
  };
}
