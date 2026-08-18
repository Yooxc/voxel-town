import { createWastelandSceneRuntime } from "./wastelandSceneRuntime.js";
import { createWastelandRuntime } from "../systems/wastelandRuntime.js";
import {
  createWastelandDraftGuide,
  createWastelandFenceHudState,
} from "../systems/wastelandDraftGuide.js";
import { createWastelandOperationsController } from "../ui/wastelandOperationsController.js";

const WASTELAND_FENCE_MIN_WIDTH = 5;
const WASTELAND_FENCE_MIN_HEIGHT = 5;
const WASTELAND_CLAIM_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const WASTELAND_DRAFT_RESERVATION_MS = 5 * 60 * 1000;

const WASTELAND_DRAFT_PHASE = Object.freeze({
  NONE: "draft_none",
  ACTIVE: "draft_active",
  CONFIRMABLE: "draft_confirmable",
  EXPIRED: "draft_expired",
});

const WASTELAND_CLAIM_STATUS = Object.freeze({
  ACTIVE: "active",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
});

const WASTELAND_CLAIM_PHASE = Object.freeze({
  NONE: "claim_none",
  ACTIVE: "claim_active",
  REWARD_PENDING: "claim_reward_pending",
  COMPLETED: "claim_completed",
  FAILED: "claim_failed",
});

export function createFrontierWastelandCoordinator(ctx) {
  const sceneRuntime = createWastelandSceneRuntime();
  const runtime = createWastelandRuntime({
    getPlot: ctx.getPlot,
    getOwnerId: ctx.getOwnerId,
    landDeedItemId: ctx.landDeedItemId,
  });

  function notify(message, duration = 1000) {
    ctx.showUI(message, duration);
    ctx.setLastMessageUntil(ctx.now() + duration);
  }

  function ensureState() {
    return sceneRuntime.ensureState({
      plot: ctx.getPlot(),
      createGroup: ctx.createGroup,
    });
  }

  function setCellState(cell, state) {
    if (!cell?.mesh) return;
    cell.clearProgress = state === "dug3" ? 100 : state === "dug2" ? 50 : state === "dug1" ? 25 : 0;
    ctx.syncCellState(cell);
    ctx.applyCellVisual(cell);
  }

  function getCellByGrid(row, col) {
    return ensureState()?.cells?.find((cell) => cell.row === row && cell.col === col) ?? null;
  }

  function closeClaimConfirmDialog() {
    const { confirmOverlay, confirmDialog } = ctx.getClaimDialogElements();
    ctx.controller.closeClaimConfirmDialog({
      overlay: confirmOverlay,
      dialog: confirmDialog,
      clearRect: () => ctx.setClaimConfirmRect(null),
    });
  }

  function closeClaimCancelDialog() {
    const { cancelOverlay, cancelDialog } = ctx.getClaimDialogElements();
    ctx.controller.closeClaimCancelDialog({
      overlay: cancelOverlay,
      dialog: cancelDialog,
    });
  }

  function clearClaimPreview() {
    sceneRuntime.clearClaimPreview({
      plot: ensureState(),
      disposeObject: ctx.disposeObject,
    });
  }

  function rebuildFenceLinks() {
    sceneRuntime.rebuildFenceLinks({
      plot: ensureState(),
      disposeObject: ctx.disposeObject,
      canLinkPosts: ctx.canLinkFencePosts,
      createMesh: ctx.createFenceLinkMesh,
    });
  }

  function rebuildStructures() {
    const plot = ensureState();
    if (!plot) return;
    sceneRuntime.rebuildStructures({
      plot,
      disposeObject: ctx.disposeObject,
      getCellByGrid,
      getSurfaceY: ctx.getStructureSurfaceY,
      createMesh: ctx.createStructureMesh,
      getPartDef: ctx.getBuildPart,
    });
  }

  function removeClaimFences(claim) {
    sceneRuntime.removeClaimFences({
      plot: ensureState(),
      claim,
      disposeObject: ctx.disposeObject,
      rebuildLinks: rebuildFenceLinks,
    });
  }

  function reclaimConflictingPosts(claim, buffer = 2) {
    const plot = ensureState();
    if (!plot?.fencePosts || !claim) return 0;
    const reclaimedByOwner = new Map();
    const conflictingPosts = ctx.getConflictingFencePosts({
      fencePosts: plot.fencePosts,
      claim,
      buffer,
    });
    for (const post of conflictingPosts) {
      const key = post.key ?? `${post.row}:${post.col}`;
      if (post.mesh?.parent) {
        ctx.disposeObject(post.mesh);
        post.mesh.parent.remove(post.mesh);
      }
      plot.fencePosts.delete(key);
      reclaimedByOwner.set(post.ownerId, (reclaimedByOwner.get(post.ownerId) ?? 0) + 1);
    }
    if (!reclaimedByOwner.size) return 0;
    let totalReclaimed = 0;
    for (const [ownerId, count] of reclaimedByOwner.entries()) {
      if (ctx.grantLocalProfileItem(ownerId, "fencePost", count)) totalReclaimed += count;
    }
    operations.rebuildAllDrafts();
    rebuildFenceLinks();
    clearClaimPreview();
    return totalReclaimed;
  }

  function updateClaimPreview() {
    sceneRuntime.updateClaimPreview({
      plot: ensureState(),
      disposeObject: ctx.disposeObject,
      currentOwnerId: ctx.getOwnerId(),
      isFencePlacementMode: ctx.controller.isFencePlacementMode(),
      getDraftBounds: ctx.getDraftBounds,
      getDraftFencePosts: (draft, ownerId) => operations.getScopedDraftFencePosts(draft, ownerId),
      getDraftGuide: getDraftGuide,
      createMesh: ctx.createPreviewCellMesh,
    });
  }

  function updateClaimActionUi(progress = getCurrentClaimProgress()) {
    const { completeButton, abortButton } = ctx.getClaimActionButtons();
    ctx.controller.updateClaimActionUi({
      progress,
      completeButton,
      abortButton,
      canComplete: canCompleteClaim,
      canCancel: canCancelClaim,
      onNoClaim: closeClaimCancelDialog,
    });
  }

  function openClaimConfirmDialog(rect) {
    const { confirmOverlay, confirmDialog, confirmBody } = ctx.getClaimDialogElements();
    return ctx.controller.openClaimConfirmDialog({
      rect,
      overlay: confirmOverlay,
      dialog: confirmDialog,
      body: confirmBody,
      setRect: ctx.setClaimConfirmRect,
    });
  }

  function openClaimCancelDialog() {
    const { cancelOverlay, cancelDialog } = ctx.getClaimDialogElements();
    return ctx.controller.openClaimCancelDialog({
      claim: getCurrentClaim(),
      completedPhase: WASTELAND_CLAIM_PHASE.COMPLETED,
      getClaimPhase,
      notify,
      overlay: cancelOverlay,
      dialog: cancelDialog,
    });
  }

  function resetDraftUiState({ clearPlacementMode = true } = {}) {
    ctx.setActiveCell(null);
    if (clearPlacementMode) ctx.controller.clearFencePlacementMode();
    clearClaimPreview();
    closeClaimConfirmDialog();
    closeClaimCancelDialog();
  }

  const operations = createWastelandOperationsController({
    runtime,
    now: ctx.now,
    dateNow: ctx.dateNow,
    showUI: ctx.showUI,
    setLastMessageUntil: ctx.setLastMessageUntil,
    constants: {
      fenceMinWidth: WASTELAND_FENCE_MIN_WIDTH,
      fenceMinHeight: WASTELAND_FENCE_MIN_HEIGHT,
      draftReservationMs: WASTELAND_DRAFT_RESERVATION_MS,
      claimDurationMs: WASTELAND_CLAIM_DURATION_MS,
      landDeedItemId: ctx.landDeedItemId,
      draftPhase: {
        none: WASTELAND_DRAFT_PHASE.NONE,
        active: WASTELAND_DRAFT_PHASE.ACTIVE,
        confirmable: WASTELAND_DRAFT_PHASE.CONFIRMABLE,
        expired: WASTELAND_DRAFT_PHASE.EXPIRED,
      },
      claimStatus: {
        active: WASTELAND_CLAIM_STATUS.ACTIVE,
        completed: WASTELAND_CLAIM_STATUS.COMPLETED,
        failed: WASTELAND_CLAIM_STATUS.FAILED,
        cancelled: WASTELAND_CLAIM_STATUS.CANCELLED,
      },
      claimPhase: {
        none: WASTELAND_CLAIM_PHASE.NONE,
        active: WASTELAND_CLAIM_PHASE.ACTIVE,
        rewardPending: WASTELAND_CLAIM_PHASE.REWARD_PENDING,
        completed: WASTELAND_CLAIM_PHASE.COMPLETED,
        failed: WASTELAND_CLAIM_PHASE.FAILED,
      },
    },
    ensurePlot: ensureState,
    getOwnerId: ctx.getOwnerId,
    getDraftBounds: ctx.getDraftBounds,
    validateDraftRectangle: ctx.validateDraftRectangle,
    getDraftPhaseState: ctx.getDraftPhaseState,
    createDraftGuide: createWastelandDraftGuide,
    createFenceHudState: createWastelandFenceHudState,
    findDraftReservationHit: ctx.findDraftReservationHit,
    isCellInsideBounds: ctx.isCellInsideBounds,
    canBuildOnCell: ctx.canBuildOnCell,
    getClaimProgress: ctx.getClaimProgress,
    getClaimPhaseState: ctx.getClaimPhaseState,
    canCompleteClaimState: ctx.canCompleteClaimState,
    canCancelClaimState: ctx.canCancelClaimState,
    getCellById: runtime.getCellById,
    getInventorySlots: ctx.getInventorySlots,
    isNftInventoryEntry: ctx.isNftInventoryEntry,
    getSlotItemId: ctx.getSlotItemId,
    createInventorySlotEntry: ctx.createInventorySlotEntry,
    hasItem: ctx.hasItem,
    rebuildDrafts: ctx.rebuildDrafts,
    clearClaimPreview,
    closeConfirmDialog: closeClaimConfirmDialog,
    closeCancelDialog: closeClaimCancelDialog,
    updateClaimActions: updateClaimActionUi,
    isFencePlacementMode: () => ctx.controller.isFencePlacementMode(),
    clearFencePlacementMode: () => ctx.controller.clearFencePlacementMode(),
    getSelectedStructureItemId: () => ctx.controller.getSelectedStructureItemId(),
    updateDraftPrompt,
    updateClaimPreview,
    rebuildFenceLinks,
    rebuildStructures,
    updateInventoryUI: ctx.updateInventoryUI,
    saveWorld: ctx.saveWorld,
    saveProfile: ctx.saveProfile,
    addInventoryEntry: ctx.addInventoryEntry,
    getBuildPart: ctx.getBuildPart,
    getStructureConflict: runtime.getStructureConflict,
    getStructureSlotLabel: ctx.getStructureSlotLabel,
    getStructureSurfaceY: ctx.getStructureSurfaceY,
    getStructureRotationQuarter: ctx.getStructureRotationQuarter,
    getItemName: ctx.getItemName,
    addItem: ctx.addItem,
    consumeItem: ctx.consumeItem,
    createFencePostMesh: ctx.createFencePostMesh,
    removeFencePostMesh: (post) => {
      if (!post?.mesh?.parent) return;
      ctx.disposeObject(post.mesh);
      post.mesh.parent.remove(post.mesh);
    },
    buildLandMeta: runtime.buildLandMeta,
    reclaimConflictingPosts,
    isConfirmOpen: () => ctx.controller.isClaimConfirmOpen(),
    openConfirmDialog: openClaimConfirmDialog,
    partitionExpiredClaims: ctx.partitionExpiredClaims,
    getExpiredDrafts: ctx.getExpiredDrafts,
    setClaimStatus: (claim, patch) => {
      if (!claim) return null;
      Object.assign(claim, patch);
      return claim;
    },
    removeClaimFences,
  });

  function getCurrentDraft() {
    return operations.getCurrentDraft();
  }

  function getCurrentClaim() {
    return operations.getCurrentClaim();
  }

  function getClaimByCell(cell) {
    return operations.getClaimByCell(cell);
  }

  function getDraftGuide() {
    return operations.getDraftGuide();
  }

  function getFenceHudState() {
    return operations.getFenceHudState();
  }

  function getCurrentClaimProgress() {
    return operations.getClaimProgress();
  }

  function getClaimPhase(progress = getCurrentClaimProgress()) {
    return operations.getClaimPhase(progress);
  }

  function canCompleteClaim(progress) {
    return operations.canCompleteClaim(progress);
  }

  function canCancelClaim(progress) {
    return operations.canCancelClaim(progress);
  }

  function resetState() {
    const plot = ensureState();
    if (!plot) return;
    sceneRuntime.resetState({
      plot,
      resetPlan: runtime.createResetStatePlan(plot.cells),
      disposeObject: ctx.disposeObject,
      resetPlacementMode: () => ctx.controller.resetPlacementMode(),
      closeConfirm: closeClaimConfirmDialog,
      closeCancel: closeClaimCancelDialog,
      setCellState,
      updateClaimActions: updateClaimActionUi,
    });
  }

  function refreshDraftUiState(options = {}) {
    return operations.refreshDraftUi({
      rebuildOwned: options.rebuildOwnedDraft ?? true,
      closeConfirm: options.closeConfirm ?? false,
      closeCancel: options.closeCancel ?? false,
    });
  }

  function findStructureSlotConflict(cell, slot) {
    ensureState();
    return runtime.getStructureConflict(cell, slot);
  }

  function getBuildCheck(cell, itemId = ctx.controller.getSelectedStructureItemId()) {
    return operations.getBuildCheck(cell, itemId);
  }

  function toggleStructurePlacementItem(itemId) {
    if (!ctx.isBuildPartItemId(itemId)) return false;
    const selectedStructureItemId = ctx.controller.toggleStructurePlacement(itemId);
    ctx.updateInventoryUI();
    notify(
      selectedStructureItemId
        ? `${ctx.getItemName(selectedStructureItemId)} 배치 모드`
        : "건축 부품 배치 모드 해제",
    );
    return true;
  }

  function serializeState() {
    ensureState();
    const state = runtime.serializeState(ctx.getCellClearProgress);
    return state ? ctx.serializeServerState(state) : ctx.normalizeState(null);
  }

  function applyState(rawState) {
    const plot = ensureState();
    if (!plot) return;
    const state = ctx.normalizeState(rawState);
    sceneRuntime.applyState({
      plot,
      restorePlan: runtime.createRestoreStatePlan(state),
      disposeObject: ctx.disposeObject,
      syncCellState: ctx.syncCellState,
      applyCellVisual: ctx.applyCellVisual,
      createFencePostMesh: ctx.createFencePostMesh,
      resetPlacementMode: () => ctx.controller.resetPlacementMode(),
      closeConfirm: closeClaimConfirmDialog,
      closeCancel: closeClaimCancelDialog,
      rebuildDrafts: operations.rebuildAllDrafts,
      rebuildLinks: rebuildFenceLinks,
      rebuildStructures,
      updateClaimActions: updateClaimActionUi,
    });
  }

  function updateDraftPrompt() {
    const draft = getCurrentDraft();
    if (!draft || getCurrentClaim()) return;
    const rect = operations.validateDraft(draft);
    if (!rect) return;
    const signature = `${rect.minRow}:${rect.maxRow}:${rect.minCol}:${rect.maxCol}:${draft.postKeys.length}`;
    if (draft.lastPromptSignature === signature) return;
    draft.lastPromptSignature = signature;
    operations.confirmDraft();
  }

  function toggleFencePlacementMode() {
    return ctx.controller.toggleFencePlacement({
      ownerId: ctx.getOwnerId(),
      hasFencePost: ctx.hasItem("fencePost"),
      hasClaim: Boolean(getCurrentClaim()),
      notify,
      clearPreview: clearClaimPreview,
      updateInventory: ctx.updateInventoryUI,
      updatePrompt: updateDraftPrompt,
    });
  }

  function findActiveCell(radius = 2.4) {
    return ctx.findNearestCell({ entries: ctx.getPlot()?.cells, radius });
  }

  function getProgress() {
    const cells = ctx.getPlot()?.cells ?? [];
    const total = cells.length;
    const completed = cells.filter((cell) => cell.state === "dug3").length;
    return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
  }

  function shouldShowHud() {
    return Boolean(getCurrentClaim());
  }

  function getClaimHudStatusText(progress) {
    return ctx.controller.getClaimHudStatusText({
      progress,
      phase: getClaimPhase(progress),
      phases: {
        completed: WASTELAND_CLAIM_PHASE.COMPLETED,
        rewardPending: WASTELAND_CLAIM_PHASE.REWARD_PENDING,
        failed: WASTELAND_CLAIM_PHASE.FAILED,
      },
      formatRemaining: operations.formatClaimRemaining,
    });
  }

  function createCellClearPlan(cell) {
    return runtime.createCellClearProgressPlan({
      currentProgress: ctx.getCellClearProgress(cell),
      gain: ctx.cellClearProgressGain,
    });
  }

  const { completeButton, abortButton } = ctx.getClaimActionButtons();
  completeButton?.addEventListener("click", () => operations.completeClaim());
  abortButton?.addEventListener("click", openClaimCancelDialog);

  return {
    runtime,
    ensureState,
    resetState,
    resetDraftUiState,
    refreshDraftUiState,
    finalizeStateTransition: operations.finalize,
    getCurrentDraft,
    getCurrentClaim,
    getClaimByCell,
    getCellById: runtime.getCellById,
    getLandDeedEntries: operations.getLandDeedEntries,
    restorePreservedLandDeeds: operations.restorePreservedLandDeeds,
    restoreMissingDeeds: operations.restoreMissingDeeds,
    findIssuedLandDeed: operations.findIssuedLandDeed,
    findOwnedLandDeed: operations.findOwnedLandDeed,
    createLandDeedEntry: operations.createLandDeedEntry,
    findStructureSlotConflict,
    getBuildCheck,
    toggleStructurePlacementItem,
    placeStructure: operations.placeStructure,
    serializeState,
    applyState,
    rebuildStructures,
    rebuildFenceLinks,
    canClearCell: operations.canClearCell,
    canPlaceFencePost: operations.canPlaceFencePost,
    placeFencePost: operations.placeFencePost,
    removeDraftFencePost: operations.removeDraftFencePost,
    validateDraft: operations.validateDraft,
    getDraftGuide,
    getFenceHudState,
    clearClaimPreview,
    updateClaimPreview,
    closeClaimConfirmDialog,
    closeClaimCancelDialog,
    openClaimCancelDialog,
    commitDraft: operations.commitDraft,
    confirmDraft: operations.confirmDraft,
    expireClaims: operations.expireClaims,
    expireDrafts: operations.expireDrafts,
    getCurrentClaimProgress,
    getClaimPhase,
    canCompleteClaim,
    completeClaim: operations.completeClaim,
    canCancelClaim,
    cancelClaim: operations.cancelClaim,
    updateClaimActionUi,
    toggleFencePlacementMode,
    findActiveCell,
    getProgress,
    shouldShowHud,
    getClaimHudStatusText,
    createCellClearPlan,
  };
}
