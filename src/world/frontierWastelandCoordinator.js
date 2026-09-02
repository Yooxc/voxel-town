import * as THREE from "three";
import { createWastelandSceneRuntime } from "./wastelandSceneRuntime.js";
import { createWastelandRuntime } from "../systems/wastelandRuntime.js";
import {
  createWastelandDraftGuide,
  createWastelandFenceHudState,
} from "../systems/wastelandDraftGuide.js";
import { createWastelandOperationsController } from "../ui/wastelandOperationsController.js";
import {
  getWastelandBuildingInspection,
  getWastelandStructureLevelOffset,
  normalizeWastelandStructureCollection,
} from "../systems/wastelandBuilding.js";

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
  const buildRaycaster = new THREE.Raycaster();
  const buildPointer = new THREE.Vector2();
  let buildHoveredCell = null;
  let buildPreviewMesh = null;
  let buildSelectionHelper = null;
  let buildOperationPending = false;
  let buildStatusText = "";
  let lastBuildUiSignature = "";
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
    const plot = sceneRuntime.ensureState({
      plot: ctx.getPlot(),
      createGroup: ctx.createGroup,
    });
    if (plot && !plot.buildPreviewRoot) {
      plot.buildPreviewRoot = ctx.createGroup();
      plot.root.add(plot.buildPreviewRoot);
    }
    return plot;
  }

  function clearBuildPreview() {
    const plot = ensureState();
    if (buildPreviewMesh?.parent) buildPreviewMesh.parent.remove(buildPreviewMesh);
    if (buildPreviewMesh) ctx.disposeObject(buildPreviewMesh);
    buildPreviewMesh = null;
    buildHoveredCell = null;
    if (!plot?.buildPreviewRoot) return;
    for (const child of [...plot.buildPreviewRoot.children]) {
      if (child === buildSelectionHelper) continue;
      ctx.disposeObject(child);
      plot.buildPreviewRoot.remove(child);
    }
  }

  function clearBuildSelection() {
    if (buildSelectionHelper?.parent) buildSelectionHelper.parent.remove(buildSelectionHelper);
    buildSelectionHelper?.geometry?.dispose?.();
    buildSelectionHelper?.material?.dispose?.();
    buildSelectionHelper = null;
    ctx.controller.clearSelectedStructure();
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
      registerCollider: ctx.registerStructureCollider,
      unregisterCollider: ctx.unregisterStructureCollider,
      registerInteractable: ctx.registerStructureInteractable,
      unregisterInteractable: ctx.unregisterStructureInteractable,
      registerSurface: ctx.registerStructureSurface,
      unregisterSurface: ctx.unregisterStructureSurface,
      registerCeiling: ctx.registerStructureCeiling,
      unregisterCeiling: ctx.unregisterStructureCeiling,
    });
    clearBuildSelection();
  }

  function applyRemoteStructureWorld(world) {
    const plot = ensureState();
    if (!plot || !world) return false;
    const normalizedStructures = normalizeWastelandStructureCollection({
      structures: world.structures,
      foundations: world.foundations ?? plot.foundations,
    });
    plot.structures = normalizedStructures.structures;
    plot.revision = Math.max(0, Math.floor(Number(world.revision) || 0));
    rebuildStructures();
    return true;
  }

  async function syncRemoteStructureWorld() {
    if (!ctx.usesRemoteStructureWorld?.()) return false;
    const result = await ctx.loadStructureWorld();
    if (!result?.ok) {
      notify(result?.error ?? "서버 건축 상태를 불러오지 못했습니다.", 1200);
      return false;
    }
    return applyRemoteStructureWorld(result.world);
  }

  function rebuildFoundations() {
    const plot = ensureState();
    if (!plot) return;
    sceneRuntime.rebuildFoundations({
      plot,
      disposeObject: ctx.disposeObject,
      createMesh: ctx.createFoundationMesh,
      registerSurface: ctx.registerFoundationSurface,
      unregisterSurface: ctx.unregisterFoundationSurface,
    });
  }

  function gradeFoundationTerrain(foundation) {
    const plot = ensureState();
    if (!plot?.terrainRuntime || !foundation?.bounds) return false;
    const result = plot.terrainRuntime.gradeFoundation(foundation.bounds);
    for (const cell of plot.cells ?? []) {
      const insideFoundation = (
        cell.row >= foundation.bounds.minRow && cell.row <= foundation.bounds.maxRow
        && cell.col >= foundation.bounds.minCol && cell.col <= foundation.bounds.maxCol
      );
      if (!insideFoundation) continue;
      cell.clearProgress = plot.terrainRuntime.getCellProgress(cell);
      ctx.syncCellState(cell);
      ctx.applyCellVisual(cell);
    }
    return result.changedVertices > 0;
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
    canBypassClaimCompletion: (progress) => (
      Boolean(ctx.isDevSession?.())
      && progress?.claim?.status === WASTELAND_CLAIM_STATUS.ACTIVE
      && progress.claim.ownerId === ctx.getOwnerId()
    ),
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
    getBuildLevel: () => ctx.controller.getBuildLevel?.() ?? 0,
    updateDraftPrompt,
    updateClaimPreview,
    rebuildFenceLinks,
    rebuildStructures,
    updateInventoryUI: ctx.updateInventoryUI,
    saveWorld: ctx.saveWorld,
    saveProfile: ctx.saveProfile,
    addInventoryEntry: ctx.addInventoryEntry,
    getBuildPart: ctx.getBuildPart,
    getStructurePlacementKey: ctx.getStructurePlacementKey,
    getStructureConflict: runtime.getStructureConflict,
    usesRemoteStructureWorld: ctx.usesRemoteStructureWorld,
    dispatchStructureAction: ctx.dispatchStructureAction,
    serializeState,
    applyRemoteStructureWorld,
    rebuildFoundations,
    gradeFoundationTerrain,
    getStructureSlotLabel: ctx.getStructureSlotLabel,
    getStructureSurfaceY: ctx.getStructureSurfaceY,
    getStructureRotationQuarter: () => (
      ctx.controller.isBuildModeActive()
        ? ctx.controller.getBuildRotationQuarter()
        : ctx.getStructureRotationQuarter()
    ),
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

  function digTerrain(point) {
    const plot = ensureState();
    if (!plot?.terrainRuntime || !point) return { ok: false, reason: "no-target" };
    const cell = plot.cells.find((entry) => (
      Math.abs(entry.x - point.x) <= entry.size * 0.5
      && Math.abs(entry.z - point.z) <= entry.size * 0.5
    ));
    const clearCheck = operations.canClearCell(cell);
    if (!clearCheck.ok) return clearCheck;
    const result = plot.terrainRuntime.digAtWorldPoint({
      x: point.x,
      z: point.z,
      bounds: clearCheck.claim,
    });
    if (!result.ok) return result;
    for (const entry of plot.cells) {
      if (!clearCheck.claim.cellIds.includes(entry.id)) continue;
      entry.clearProgress = plot.terrainRuntime.getCellProgress(entry);
      ctx.syncCellState(entry);
    }
    ctx.saveWorld();
    return { ok: true, changedVertices: result.changedVertices, progress: getCurrentClaimProgress() };
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
    exitBuildMode({ silent: true });
    sceneRuntime.resetState({
      plot,
      resetPlan: runtime.createResetStatePlan(plot.cells),
      disposeObject: ctx.disposeObject,
      unregisterStructureCollider: ctx.unregisterStructureCollider,
      unregisterStructureInteractable: ctx.unregisterStructureInteractable,
      unregisterStructureSurface: ctx.unregisterStructureSurface,
      unregisterStructureCeiling: ctx.unregisterStructureCeiling,
      unregisterFoundationSurface: ctx.unregisterFoundationSurface,
      resetPlacementMode: () => ctx.controller.resetPlacementMode(),
      closeConfirm: closeClaimConfirmDialog,
      closeCancel: closeClaimCancelDialog,
      setCellState,
      updateClaimActions: updateClaimActionUi,
    });
    plot.terrainRuntime?.reset?.();
  }

  function refreshDraftUiState(options = {}) {
    return operations.refreshDraftUi({
      rebuildOwned: options.rebuildOwnedDraft ?? true,
      closeConfirm: options.closeConfirm ?? false,
      closeCancel: options.closeCancel ?? false,
    });
  }

  function findStructureSlotConflict(cell, slot, rotationQuarter = 0, level = ctx.controller.getBuildLevel?.() ?? 0) {
    ensureState();
    return runtime.getStructureConflict(cell, slot, rotationQuarter, level);
  }

  function getBuildCheck(cell, itemId = ctx.controller.getSelectedStructureItemId()) {
    return operations.getBuildCheck(cell, itemId);
  }

  function toggleStructurePlacementItem(itemId) {
    const part = ctx.getBuildPart(itemId);
    if (!ctx.isBuildPartItemId(itemId) || part?.manualPlacement === false) return false;
    const selectedStructureItemId = ctx.controller.isBuildModeActive()
      ? ctx.controller.selectBuildPart(itemId)
      : ctx.controller.toggleStructurePlacement(itemId);
    ctx.updateInventoryUI();
    notify(
      selectedStructureItemId
        ? `${ctx.getItemName(selectedStructureItemId)} 배치 모드`
        : "건축 부품 배치 모드 해제",
    );
    if (ctx.controller.isBuildModeActive()) refreshBuildPreview();
    return true;
  }

  function serializeState() {
    ensureState();
    const state = runtime.serializeState(ctx.getCellClearProgress);
    if (!state) return ctx.normalizeState(null);
    state.terrainHeights = ctx.getPlot()?.terrainRuntime?.serializeHeights?.() ?? [];
    return ctx.serializeServerState(state);
  }

  function applyState(rawState) {
    const plot = ensureState();
    if (!plot) return;
    exitBuildMode({ silent: true });
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
      unregisterStructureCollider: ctx.unregisterStructureCollider,
      unregisterStructureInteractable: ctx.unregisterStructureInteractable,
      unregisterStructureSurface: ctx.unregisterStructureSurface,
      unregisterStructureCeiling: ctx.unregisterStructureCeiling,
      unregisterFoundationSurface: ctx.unregisterFoundationSurface,
      updateClaimActions: updateClaimActionUi,
    });
    const restored = plot.terrainRuntime?.restoreHeights?.(state.terrainHeights);
    if (!restored && plot.terrainRuntime) {
      plot.terrainRuntime.reset();
      for (const cell of plot.cells ?? []) {
        plot.terrainRuntime.applyLegacyCellProgress(cell, cell.clearProgress);
      }
      plot.terrainRuntime.applyHeights();
    }
    for (const foundation of plot.foundations ?? []) {
      if (foundation?.status === WASTELAND_CLAIM_STATUS.COMPLETED) {
        gradeFoundationTerrain(foundation);
      }
    }
    rebuildFoundations();
  }

  function getCompletedBuildFoundation() {
    const plot = ensureState();
    const claim = getCurrentClaim();
    if (!plot || !claim) return null;
    return plot.foundations?.find((foundation) => (
      foundation?.status === WASTELAND_CLAIM_STATUS.COMPLETED
      && foundation.ownerId === ctx.getOwnerId()
      && foundation.landId === claim.landId
    )) ?? null;
  }

  function getBuildModeEligibility() {
    const claim = getCurrentClaim();
    const foundation = getCompletedBuildFoundation();
    return ctx.getBuildModeEligibility({
      ownerId: ctx.getOwnerId(),
      claim,
      foundation,
      hasLandDeed: Boolean(claim?.landId && operations.findOwnedLandDeed(claim.landId)),
    });
  }

  function getFoundationView(foundation) {
    const plot = ensureState();
    if (!plot || !foundation?.bounds) return null;
    const first = getCellByGrid(foundation.bounds.minRow, foundation.bounds.minCol);
    const last = getCellByGrid(foundation.bounds.maxRow, foundation.bounds.maxCol);
    if (!first || !last) return null;
    return {
      center: {
        x: (first.x + last.x) * 0.5,
        y: -0.18,
        z: (first.z + last.z) * 0.5,
      },
      extent: Math.max(foundation.bounds.width, foundation.bounds.height) * plot.cellSize + 2,
    };
  }

  function renderBuildModeUi() {
    const ui = ctx.getBuildModeUi?.();
    if (!ui) return;
    const active = ctx.controller.isBuildModeActive();
    const eligibility = getBuildModeEligibility();
    const selectedItemId = ctx.controller.getSelectedStructureItemId();
    const toolMode = ctx.controller.getBuildToolMode();
    const selectedStructureKey = ctx.controller.getSelectedStructureKey();
    const buildLevel = ctx.controller.getBuildLevel?.() ?? 0;
    const counts = ctx.getBuildPartEntries().map((part) => `${part.itemId}:${ctx.getItemCount(part.itemId)}`).join("|");
    const signature = `${active}:${eligibility.ok}:${toolMode}:${buildLevel}:${selectedItemId}:${selectedStructureKey}:${counts}:${buildStatusText}:${buildOperationPending}`;
    if (signature === lastBuildUiSignature) return;
    lastBuildUiSignature = signature;
    ui.enterButton.style.display = !active && eligibility.ok ? "block" : "none";
    ui.wrap.style.display = active ? "flex" : "none";
    if (!active) return;
    const demolishing = toolMode === "demolish";
    ui.placeModeButton.style.background = demolishing ? "rgba(255,255,255,0.12)" : "rgba(65, 151, 105, 0.78)";
    ui.demolishModeButton.style.background = demolishing ? "rgba(184, 67, 57, 0.88)" : "rgba(255,255,255,0.12)";
    for (const [level, button] of ui.levelButtons ?? []) {
      button.style.background = Number(level) === buildLevel ? "rgba(65, 151, 105, 0.78)" : "rgba(255,255,255,0.08)";
      button.disabled = demolishing || buildOperationPending;
    }
    ui.rotateButton.style.display = demolishing ? "none" : "block";
    if (ui.inspectButton) {
      ui.inspectButton.style.display = demolishing ? "none" : "block";
      ui.inspectButton.disabled = demolishing || buildOperationPending;
    }
    for (const [itemId, button] of ui.partButtons.entries()) {
      const part = ctx.getBuildPart(itemId);
      const count = ctx.getItemCount(itemId);
      button.textContent = `${part?.label ?? ctx.getItemName(itemId)}\n${count}개`;
      button.style.whiteSpace = "pre-line";
      button.disabled = demolishing || count <= 0 || buildOperationPending;
      button.style.opacity = demolishing ? "0.28" : count > 0 ? "1" : "0.42";
      button.style.borderColor = itemId === selectedItemId ? "#63d99b" : "rgba(255,255,255,0.22)";
      button.style.background = itemId === selectedItemId ? "rgba(65, 151, 105, 0.78)" : "rgba(255,255,255,0.08)";
    }
    ui.status.textContent = buildStatusText || (demolishing ? "건축물에 마우스를 올리고 클릭하여 철거" : selectedItemId ? ctx.getItemName(selectedItemId) : "부품 선택");
  }

  function enterBuildMode() {
    const eligibility = getBuildModeEligibility();
    if (!eligibility.ok) {
      notify(eligibility.reason, 1200);
      return false;
    }
    const foundation = getCompletedBuildFoundation();
    const view = getFoundationView(foundation);
    if (!view || !ctx.enterBuildCamera(view)) {
      notify("건축 카메라를 준비하지 못했습니다.", 1200);
      return false;
    }
    const selectedItemId = ctx.getBuildPartEntries().find((part) => ctx.getItemCount(part.itemId) > 0)?.itemId ?? "";
    ctx.controller.enterBuildMode(selectedItemId);
    buildStatusText = "";
    lastBuildUiSignature = "";
    ctx.updateInventoryUI();
    renderBuildModeUi();
    notify("건축 모드", 700);
    void syncRemoteStructureWorld();
    return true;
  }

  function exitBuildMode({ silent = false } = {}) {
    const wasActive = ctx.controller.isBuildModeActive();
    clearBuildPreview();
    clearBuildSelection();
    ctx.controller.exitBuildMode();
    buildStatusText = "";
    lastBuildUiSignature = "";
    ctx.exitBuildCamera();
    renderBuildModeUi();
    if (wasActive) ctx.updateInventoryUI();
    if (wasActive && !silent) notify("건축 모드 종료", 700);
    return wasActive;
  }

  function rotateBuildPart() {
    if (!ctx.controller.isBuildModeActive() || ctx.controller.isDemolishMode()) return false;
    ctx.controller.rotateBuildPart();
    refreshBuildPreview();
    return true;
  }

  function inspectBuilding() {
    const foundation = getCompletedBuildFoundation();
    const result = getWastelandBuildingInspection({
      structures: ensureState()?.structures ?? [],
      ownerId: ctx.getOwnerId(),
      foundation,
    });
    buildStatusText = result.reason;
    lastBuildUiSignature = "";
    renderBuildModeUi();
    notify(result.reason, result.ok ? 1400 : 1800);
    return result;
  }

  function setBuildLevel(level) {
    if (!ctx.controller.isBuildModeActive()) return false;
    const previousCell = buildHoveredCell;
    clearBuildPreview();
    ctx.controller.setBuildLevel(level);
    buildStatusText = "";
    lastBuildUiSignature = "";
    renderBuildModeUi();
    buildHoveredCell = previousCell;
    if (buildHoveredCell) refreshBuildPreview();
    return true;
  }

  function getBuildCellFromPointer(event) {
    const plot = ensureState();
    const foundation = getCompletedBuildFoundation();
    const camera = ctx.getCamera?.();
    const canvas = ctx.getCanvas?.();
    if (!plot || !foundation || !camera || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    buildPointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    buildRaycaster.setFromCamera(buildPointer, camera);
    const baseCell = getCellByGrid(foundation.bounds.minRow, foundation.bounds.minCol);
    const baseSurfaceY = baseCell ? ctx.getStructureSurfaceY(baseCell) : -0.2;
    const level = ctx.controller.getBuildLevel?.() ?? 0;
    const buildPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(
      baseSurfaceY + getWastelandStructureLevelOffset(level) + 0.02
    ));
    const hitPoint = new THREE.Vector3();
    if (!buildRaycaster.ray.intersectPlane(buildPlane, hitPoint)) return null;
    return plot.cells.find((cell) => (
      cell.row >= foundation.bounds.minRow && cell.row <= foundation.bounds.maxRow
      && cell.col >= foundation.bounds.minCol && cell.col <= foundation.bounds.maxCol
      && Math.abs(cell.x - hitPoint.x) <= cell.size * 0.5
      && Math.abs(cell.z - hitPoint.z) <= cell.size * 0.5
    )) ?? null;
  }

  function refreshBuildPreview() {
    const previousCell = buildHoveredCell;
    clearBuildPreview();
    buildHoveredCell = previousCell;
    if (!ctx.controller.isBuildModeActive() || !buildHoveredCell) {
      buildStatusText = "";
      renderBuildModeUi();
      return;
    }
    const itemId = ctx.controller.getSelectedStructureItemId();
    const part = ctx.getBuildPart(itemId);
    if (!part) {
      buildStatusText = "부품 선택";
      renderBuildModeUi();
      return;
    }
    const buildCheck = operations.getBuildCheck(buildHoveredCell, itemId);
    const structure = {
      key: "wasteland-build-preview",
      type: itemId,
      slot: part.slot,
      row: buildHoveredCell.row,
      col: buildHoveredCell.col,
      x: buildHoveredCell.x,
      y: ctx.getStructureSurfaceY(buildHoveredCell),
      z: buildHoveredCell.z,
      level: ctx.controller.getBuildLevel?.() ?? 0,
      rotationQuarter: ctx.controller.getBuildRotationQuarter(),
      cellSize: buildHoveredCell.size,
    };
    buildPreviewMesh = ctx.createStructurePreviewMesh(structure, ctx.getBuildPart, { valid: buildCheck.ok });
    if (buildPreviewMesh) ensureState().buildPreviewRoot.add(buildPreviewMesh);
    buildStatusText = buildCheck.ok ? `${part.label} | 설치 가능` : buildCheck.reason;
    renderBuildModeUi();
  }

  function updateBuildPointer(event) {
    if (!ctx.controller.isBuildModeActive()) return;
    if (ctx.controller.isDemolishMode()) {
      updateDemolishHover(event);
      return;
    }
    const nextCell = getBuildCellFromPointer(event);
    if (nextCell?.id === buildHoveredCell?.id) return;
    buildHoveredCell = nextCell;
    refreshBuildPreview();
  }

  async function placeBuildPreview() {
    if (!ctx.controller.isBuildModeActive() || !buildHoveredCell) return false;
    if (buildOperationPending || ctx.controller.isDemolishMode()) return false;
    const itemId = ctx.controller.getSelectedStructureItemId();
    buildOperationPending = true;
    renderBuildModeUi();
    let placed = false;
    try {
      placed = itemId ? await operations.placeStructure(buildHoveredCell, itemId) : false;
    } finally {
      buildOperationPending = false;
    }
    if (!placed) {
      refreshBuildPreview();
      return false;
    }
    refreshBuildPreview();
    return true;
  }

  function setBuildToolMode(mode) {
    clearBuildPreview();
    clearBuildSelection();
    ctx.controller.setBuildToolMode(mode);
    buildStatusText = mode === "demolish" ? "건축물에 마우스를 올리고 클릭하여 철거" : "";
    lastBuildUiSignature = "";
    renderBuildModeUi();
  }

  function getStructureFromPointer(event) {
    const plot = ensureState();
    const camera = ctx.getCamera?.();
    const canvas = ctx.getCanvas?.();
    if (!plot?.structureRoot || !camera || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    buildPointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    buildRaycaster.setFromCamera(buildPointer, camera);
    let object = buildRaycaster.intersectObjects(plot.structureRoot.children, true)[0]?.object ?? null;
    while (object && !object.userData?.wastelandStructureKey) object = object.parent;
    const key = object?.userData?.wastelandStructureKey;
    return key ? plot.structures.find((entry) => entry.key === key) ?? null : null;
  }

  function updateDemolishHover(event) {
    const structure = getStructureFromPointer(event);
    if (structure?.key === ctx.controller.getSelectedStructureKey()) return structure;
    clearBuildSelection();
    if (!structure) {
      buildStatusText = "건축물에 마우스를 올리고 클릭하여 철거";
      renderBuildModeUi();
      return null;
    }
    const mesh = structure.mesh;
    ctx.controller.selectStructure(structure.key);
    buildSelectionHelper = new THREE.BoxHelper(mesh, structure.ownerId === ctx.getOwnerId() ? 0xff6b4a : 0x8f5960);
    ensureState().buildPreviewRoot.add(buildSelectionHelper);
    buildStatusText = structure.ownerId === ctx.getOwnerId()
      ? `${ctx.getItemName(structure.type)} | 클릭하여 즉시 철거`
      : `다른 소유자의 ${ctx.getItemName(structure.type)} | 철거 불가`;
    renderBuildModeUi();
    return structure;
  }

  async function demolishStructureFromPointer(event) {
    if (buildOperationPending) return false;
    const structure = updateDemolishHover(event);
    if (!structure) return false;
    if (structure.ownerId !== ctx.getOwnerId()) {
      notify("다른 소유자의 건축물은 철거할 수 없습니다.", 1200);
      return false;
    }
    buildOperationPending = true;
    buildStatusText = `${ctx.getItemName(structure.type)} 철거 중`;
    lastBuildUiSignature = "";
    renderBuildModeUi();
    let removed = false;
    try {
      removed = await operations.removeStructure(structure.key);
    } catch (error) {
      console.error("Wasteland structure demolition failed.", error);
      notify("건축물 철거 중 오류가 발생했습니다.", 1300);
    } finally {
      buildOperationPending = false;
    }
    clearBuildSelection();
    buildStatusText = removed ? "철거 완료 | 다음 건축물을 클릭하세요" : "철거하지 못했습니다";
    lastBuildUiSignature = "";
    renderBuildModeUi();
    return removed;
  }

  function updateBuildModeUi() {
    renderBuildModeUi();
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
  const buildUi = ctx.getBuildModeUi?.();
  buildUi?.enterButton.addEventListener("click", enterBuildMode);
  buildUi?.exitButton.addEventListener("click", () => exitBuildMode());
  buildUi?.rotateButton.addEventListener("click", rotateBuildPart);
  buildUi?.inspectButton?.addEventListener("click", inspectBuilding);
  buildUi?.placeModeButton.addEventListener("click", () => setBuildToolMode("place"));
  buildUi?.demolishModeButton.addEventListener("click", () => setBuildToolMode("demolish"));
  for (const [level, button] of buildUi?.levelButtons ?? []) {
    button.addEventListener("click", () => setBuildLevel(level));
  }
  for (const [itemId, button] of buildUi?.partButtons ?? []) {
    button.addEventListener("click", () => {
      ctx.controller.selectBuildPart(itemId);
      refreshBuildPreview();
    });
  }
  const canvas = ctx.getCanvas?.();
  canvas?.addEventListener("pointermove", updateBuildPointer);
  canvas?.addEventListener("pointerleave", () => {
    if (!ctx.controller.isBuildModeActive()) return;
    clearBuildSelection();
    buildHoveredCell = null;
    clearBuildPreview();
    buildStatusText = ctx.controller.isDemolishMode() ? "건축물에 마우스를 올리고 클릭하여 철거" : "";
    renderBuildModeUi();
  });
  canvas?.addEventListener("pointerdown", (event) => {
    if (!ctx.controller.isBuildModeActive() || event.button !== 0) return;
    event.preventDefault();
    if (ctx.controller.isDemolishMode()) {
      void demolishStructureFromPointer(event);
      return;
    }
    updateBuildPointer(event);
    void placeBuildPreview();
  });

  const api = {
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
    enterBuildMode,
    exitBuildMode,
    rotateBuildPart,
    inspectBuilding,
    setBuildLevel,
    updateBuildModeUi,
    isBuildModeActive: () => ctx.controller.isBuildModeActive(),
    placeStructure: operations.placeStructure,
    removeStructure: operations.removeStructure,
    toggleDoor: operations.toggleDoor,
    syncRemoteStructureWorld,
    serializeState,
    applyState,
    rebuildStructures,
    rebuildFoundations,
    rebuildFenceLinks,
    canClearCell: operations.canClearCell,
    digTerrain,
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

  return {
    ...api,
    api,
  };
}
