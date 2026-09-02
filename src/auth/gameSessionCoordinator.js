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
  };
}
