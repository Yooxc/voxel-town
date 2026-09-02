import { getWastelandStructureRemovalDependencyError } from "../systems/wastelandBuilding.js";

export function createWastelandOperationsController(ctx) {
  const pendingDoorKeys = new Set();

  function notify(message, duration = 1000) {
    ctx.showUI(message, duration);
    ctx.setLastMessageUntil(ctx.now() + duration);
  }

  async function dispatchStructureAction(request) {
    try {
      return await ctx.dispatchStructureAction(request);
    } catch {
      return { ok: false, status: 0, error: "황무지 서버에 연결할 수 없습니다.", world: null };
    }
  }

  function getCurrentDraft() {
    const plot = ctx.ensurePlot();
    return plot?.claimDrafts?.get(ctx.getOwnerId()) ?? null;
  }

  function getScopedDraftFencePosts(draft, ownerId = ctx.getOwnerId()) {
    const plot = ctx.ensurePlot();
    const scoped = new Map();
    if (!plot?.fencePosts || !draft?.postKeys?.length || !ownerId) return scoped;
    for (const key of draft.postKeys) {
      const post = plot.fencePosts.get(key);
      if (post?.ownerId === ownerId) scoped.set(key, post);
    }
    return scoped;
  }

  function getCurrentClaim() {
    ctx.ensurePlot();
    return ctx.runtime.getCurrentClaim();
  }

  function getClaimByCell(cell) {
    ctx.ensurePlot();
    return ctx.runtime.getClaimForCell(cell);
  }

  function formatClaimRemaining(ms) {
    const totalMinutes = Math.ceil(Math.max(0, ms) / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  }

  function getDraftBounds(draft) {
    return ctx.getDraftBounds(draft, getScopedDraftFencePosts(draft));
  }

  function validateDraft(draft) {
    return ctx.validateDraftRectangle({
      draft,
      fencePosts: getScopedDraftFencePosts(draft),
      cells: ctx.ensurePlot()?.cells,
      minWidth: ctx.constants.fenceMinWidth,
      minHeight: ctx.constants.fenceMinHeight,
    });
  }

  function getDraftPhase(draft = getCurrentDraft()) {
    return ctx.getDraftPhaseState({
      draft,
      isConfirmable: Boolean(validateDraft(draft)),
      phases: ctx.constants.draftPhase,
    });
  }

  function syncDraftPhase(draft) {
    if (!draft) return ctx.constants.draftPhase.none;
    draft.phase = getDraftPhase(draft);
    return draft.phase;
  }

  function touchDraftReservation(draft, now = ctx.dateNow()) {
    if (!draft) return null;
    const update = ctx.runtime.createDraftReservationUpdate({
      draft,
      ownerId: draft.ownerId,
      postKey: draft.postKeys?.[0],
      now,
      reservationMs: ctx.constants.draftReservationMs,
    });
    if (!update) return null;
    Object.assign(draft, update);
    syncDraftPhase(draft);
    return draft;
  }

  function getDraftGuide() {
    const draft = getCurrentDraft();
    return ctx.createDraftGuide({
      draft,
      bounds: getDraftBounds(draft),
      phase: getDraftPhase(draft),
      minWidth: ctx.constants.fenceMinWidth,
      minHeight: ctx.constants.fenceMinHeight,
      confirmablePhase: ctx.constants.draftPhase.confirmable,
    });
  }

  function getFenceHudState() {
    const guide = getDraftGuide();
    const draft = getCurrentDraft();
    const reservationText = draft?.expiresAt != null
      ? `예약 유지 ${formatClaimRemaining(draft.expiresAt - ctx.dateNow())}`
      : "예약 대기 중";
    return ctx.createFenceHudState({
      placementMode: ctx.isFencePlacementMode(),
      guide,
      reservationText,
      minWidth: ctx.constants.fenceMinWidth,
      minHeight: ctx.constants.fenceMinHeight,
    });
  }

  function getDraftReservationHit(cell, buffer = 0) {
    const plot = ctx.ensurePlot();
    return ctx.findDraftReservationHit({
      cell,
      claimDrafts: plot?.claimDrafts,
      currentOwnerId: ctx.getOwnerId(),
      getFencePostsByOwner: (draft, ownerId) => getScopedDraftFencePosts(draft, ownerId),
      buffer,
    });
  }

  function getConfirmedClaimBufferHit(cell, buffer = 2) {
    if (!cell) return null;
    const plot = ctx.ensurePlot();
    return plot?.claims?.find((claim) => ctx.isCellInsideBounds(cell, claim, buffer)) ?? null;
  }

  function isCellInsideConfirmedClaim(cell) {
    return Boolean(getConfirmedClaimBufferHit(cell, 0));
  }

  function getBuildCheck(cell, itemId = ctx.getSelectedStructureItemId()) {
    const part = ctx.getBuildPart(itemId);
    const rotationQuarter = ctx.getStructureRotationQuarter();
    const level = ctx.getBuildLevel?.() ?? 0;
    const claim = getClaimByCell(cell);
    const baseCheck = ctx.canBuildOnCell({
      cell,
      claim,
      hasLandDeed: Boolean(claim?.landId && findOwnedLandDeed(claim.landId)),
      currentOwnerId: ctx.getOwnerId(),
      structures: ctx.ensurePlot()?.structures ?? [],
      foundations: ctx.ensurePlot()?.foundations ?? [],
      structureSlot: part?.slot ?? "",
      structurePlacementKey: ctx.getStructurePlacementKey(cell, part?.slot, rotationQuarter, level),
      structureItemId: itemId,
      buildLevel: level,
      structureRotationQuarter: rotationQuarter,
      minSpacing: 0,
    });
    if (!baseCheck.ok) return baseCheck;
    const occupancyError = ctx.getBuildOccupancyError?.({
      cell,
      itemId,
      part,
      rotationQuarter,
      level,
    });
    return occupancyError ? { ok: false, reason: occupancyError } : baseCheck;
  }

  function findIssuedLandDeed(landId) {
    if (!landId) return null;
    return ctx.getInventorySlots().find((entry) => (
      entry
      && !ctx.isNftInventoryEntry(entry)
      && ctx.getSlotItemId(entry) === ctx.constants.landDeedItemId
      && entry.landId === landId
    )) ?? null;
  }

  function findOwnedLandDeed(landId) {
    return ctx.getOwnerId() && landId ? findIssuedLandDeed(landId) : null;
  }

  function createLandDeedEntry(claim) {
    const deedData = ctx.runtime.createLandDeedData(claim);
    if (!deedData) return null;
    const { itemId, ...extra } = deedData;
    return ctx.createInventorySlotEntry(itemId, 1, extra);
  }

  function getLandDeedEntries() {
    return ctx.getInventorySlots().filter((entry) => (
      entry
      && !ctx.isNftInventoryEntry(entry)
      && ctx.getSlotItemId(entry) === ctx.constants.landDeedItemId
      && entry.landId
    ));
  }

  function restorePreservedLandDeeds(entries) {
    if (!Array.isArray(entries) || !entries.length) return 0;
    let restored = 0;
    for (const entry of entries) {
      if (!entry?.landId || findIssuedLandDeed(entry.landId)) continue;
      if (ctx.addInventoryEntry(structuredClone(entry))) restored += 1;
    }
    return restored;
  }

  function canClearCell(cell) {
    const permission = ctx.runtime.getCellClearPermission({
      cell,
      claim: getClaimByCell(cell),
      ownerId: ctx.getOwnerId(),
      activeStatus: ctx.constants.claimStatus.active,
    });
    const reasons = {
      "claim-required": "울타리 구역을 먼저 확정해야 개간할 수 있습니다.",
      "owner-required": "개간은 지갑 로그인이 필요합니다.",
      "owner-mismatch": "이 구역의 소유자만 개간할 수 있습니다.",
      "claim-inactive": "진행 중인 개간 구역이 아닙니다.",
    };
    return permission.ok ? permission : { ok: false, reason: reasons[permission.reason] };
  }

  function canPlaceFencePost(cell) {
    const plot = ctx.ensurePlot();
    const decision = ctx.runtime.getFencePostPlacementDecision({
      cell,
      ownerId: ctx.getOwnerId(),
      hasCurrentClaim: Boolean(getCurrentClaim()),
      hasExistingPost: Boolean(plot?.fencePosts?.has(`${cell?.row}:${cell?.col}`)),
      isInsideConfirmedClaim: isCellInsideConfirmedClaim(cell),
      hasConfirmedClaimBuffer: Boolean(getConfirmedClaimBufferHit(cell, 2)),
      reservationHit: getDraftReservationHit(cell, 2),
      hasFencePostItem: ctx.hasItem("fencePost"),
    });
    const reasons = {
      "missing-cell": "설치할 셀을 찾을 수 없습니다.",
      "owner-required": "울타리 기둥 설치는 지갑 로그인이 필요합니다.",
      "current-claim-exists": "이미 확정된 개간 구역이 있습니다.",
      "post-exists": "이미 울타리 기둥이 설치된 셀입니다.",
      "confirmed-claim-overlap": "확정된 개간 구역과 겹치는 셀에는 설치할 수 없습니다.",
      "confirmed-claim-buffer": "확정된 개간 구역 주변 2셀 안에는 설치할 수 없습니다.",
      "draft-reservation-buffer": "다른 플레이어가 예약한 토지 선언 구역 주변 2셀 안에는 설치할 수 없습니다.",
      "draft-reservation-overlap": "다른 플레이어가 예약한 토지 선언 구역입니다.",
      "fence-post-required": "울타리 기둥이 없습니다.",
    };
    return decision.ok ? decision : { ok: false, reason: reasons[decision.reason] };
  }

  function getClaimProgress() {
    return ctx.getClaimProgress(getCurrentClaim(), ctx.getCellById);
  }

  function getClaimPhase(progress = getClaimProgress()) {
    return ctx.getClaimPhaseState({
      progress,
      claimStatuses: ctx.constants.claimStatus,
      claimPhases: ctx.constants.claimPhase,
    });
  }

  function canCompleteClaim(progress) {
    return Boolean(ctx.canBypassClaimCompletion?.(progress))
      || ctx.canCompleteClaimState(progress, ctx.getOwnerId());
  }

  function canCancelClaim(progress) {
    return ctx.canCancelClaimState(progress, ctx.getOwnerId());
  }

  function rebuildAllDrafts() {
    const plot = ctx.ensurePlot();
    if (!plot?.claimDrafts) return null;
    plot.claimDrafts = ctx.rebuildDrafts({
      fencePosts: plot.fencePosts,
      claims: plot.claims,
      previousDrafts: plot.claimDrafts,
      now: ctx.dateNow(),
      reservationMs: ctx.constants.draftReservationMs,
      activePhase: ctx.constants.draftPhase.active,
    });
    return plot.claimDrafts;
  }

  function rebuildOwnedDraft() {
    const ownerId = ctx.getOwnerId();
    return ownerId ? rebuildAllDrafts()?.get(ownerId) ?? null : null;
  }

  function refreshDraftUi({ rebuildOwned = true, closeConfirm = false, closeCancel = false } = {}) {
    if (rebuildOwned) rebuildOwnedDraft();
    ctx.clearClaimPreview();
    if (closeConfirm) ctx.closeConfirmDialog();
    if (closeCancel) ctx.closeCancelDialog();
    ctx.updateClaimActions(getClaimProgress());
    if (ctx.isFencePlacementMode()) {
      ctx.updateDraftPrompt();
      ctx.updateClaimPreview();
    }
  }

  function finalize(options = {}) {
    if (options.rebuildDrafts) rebuildAllDrafts();
    if (options.rebuildLinks) ctx.rebuildFenceLinks();
    if (options.clearPlacementMode) ctx.clearFencePlacementMode();
    if (options.refreshDraftUi) {
      refreshDraftUi({ rebuildOwned: options.rebuildOwnedDraft, closeConfirm: options.closeConfirm, closeCancel: options.closeCancel });
    } else {
      if (options.closeConfirm) ctx.closeConfirmDialog();
      if (options.closeCancel) ctx.closeCancelDialog();
      if (options.updateClaimUi) ctx.updateClaimActions(getClaimProgress());
    }
    if (options.updateInventory) ctx.updateInventoryUI();
    if (options.save) ctx.saveWorld();
  }

  function restoreMissingDeeds({ showMessage = false, saveProfile = false } = {}) {
    const plot = ctx.ensurePlot();
    const ownerId = ctx.getOwnerId();
    if (!plot || !ownerId) return 0;
    let restored = 0;
    let blocked = false;
    const claims = ctx.runtime.getMissingLandDeedClaims({
      claims: plot.claims,
      ownerId,
      completedStatus: ctx.constants.claimStatus.completed,
      hasLandDeed: (landId) => Boolean(findIssuedLandDeed(landId)),
    });
    for (const claim of claims) {
      const deed = createLandDeedEntry(claim);
      if (!deed || !ctx.addInventoryEntry(deed)) blocked = true;
      else restored += 1;
    }
    if (restored > 0) {
      ctx.updateInventoryUI();
      if (saveProfile) ctx.saveProfile();
      if (showMessage) notify(`누락된 황무지 토지권 ${restored}개를 복구했습니다.`, 1300);
    } else if (blocked && showMessage) {
      notify("기타 아이템 슬롯을 비우면 누락된 황무지 토지권을 복구할 수 있습니다.", 1400);
    }
    return restored;
  }

  async function placeStructure(cell, itemId = ctx.getSelectedStructureItemId()) {
    const plot = ctx.ensurePlot();
    const part = ctx.getBuildPart(itemId);
    if (!plot || !cell || !part) return false;
    const buildCheck = getBuildCheck(cell, itemId);
    if (!buildCheck.ok) {
      const conflict = ctx.getStructureConflict(
        cell,
        part.slot,
        ctx.getStructureRotationQuarter(),
        ctx.getBuildLevel?.() ?? 0,
      );
      notify(conflict ? `이미 해당 위치에 ${ctx.getStructureSlotLabel(part.slot)} 부품이 있습니다.` : buildCheck.reason);
      return false;
    }
    if (!ctx.consumeItem(itemId, 1)) {
      notify("건축 부품을 소모하지 못했습니다.");
      return false;
    }
    const claim = getClaimByCell(cell);
    const foundation = plot.foundations?.find((entry) => (
      entry?.status === "completed"
      && entry.ownerId === ctx.getOwnerId()
      && cell.row >= entry.bounds.minRow && cell.row <= entry.bounds.maxRow
      && cell.col >= entry.bounds.minCol && cell.col <= entry.bounds.maxCol
    ));
    const structure = ctx.runtime.createStructureRecord({
      key: `wasteland_structure_${ctx.dateNow().toString(36)}_${cell.row}_${cell.col}`,
      claim,
      ownerId: ctx.getOwnerId(),
      itemId,
      slot: part.slot,
      cell,
      surfaceY: ctx.getStructureSurfaceY(cell),
      rotationQuarter: ctx.getStructureRotationQuarter(),
      cellSize: cell.size,
      level: ctx.getBuildLevel?.() ?? 0,
    });
    if (!structure) {
      ctx.addItem(itemId, 1);
      return false;
    }
    if (ctx.usesRemoteStructureWorld?.()) {
      const result = await dispatchStructureAction({
        action: {
          type: "structure.place",
          foundationId: foundation?.id ?? "",
          landId: claim?.landId ?? "",
          itemId,
          row: cell.row,
          col: cell.col,
          rotationQuarter: structure.rotationQuarter,
          cellSize: cell.size,
          level: structure.level,
        },
        knownRevision: Number(plot.revision) || 0,
        wastelandState: ctx.serializeState(),
      });
      if (!result?.ok) {
        ctx.addItem(itemId, 1);
        if (result?.world) ctx.applyRemoteStructureWorld(result.world);
        ctx.updateInventoryUI();
        ctx.saveProfile();
        notify(result?.error ?? "건축물 설치에 실패했습니다.", 1300);
        return false;
      }
      ctx.applyRemoteStructureWorld(result.world);
      ctx.requestPlayerCollisionRecovery?.({ source: "build", immediate: true });
    } else {
      plot.structures.push(structure);
      plot.revision = (Number(plot.revision) || 0) + 1;
      ctx.rebuildStructures();
      ctx.requestPlayerCollisionRecovery?.({ source: "build", immediate: true });
      ctx.saveWorld();
    }
    ctx.updateInventoryUI();
    ctx.saveProfile();
    notify(`${ctx.getItemName(itemId)} 설치 완료`, 900);
    return true;
  }

  async function removeStructure(structureKey) {
    const plot = ctx.ensurePlot();
    const structure = plot?.structures?.find((entry) => entry?.key === structureKey);
    if (!plot || !structure) {
      notify("철거할 건축물을 찾을 수 없습니다.");
      return false;
    }
    if (structure.ownerId !== ctx.getOwnerId()) {
      notify("자신이 설치한 건축물만 철거할 수 있습니다.", 1200);
      return false;
    }
    const dependencyError = getWastelandStructureRemovalDependencyError({
      structures: plot.structures,
      structureKey: structure.key,
    });
    if (dependencyError) {
      notify(dependencyError, 1300);
      return false;
    }
    if (!ctx.addItem(structure.type, 1)) {
      notify("인벤토리 공간을 확보해야 철거할 수 있습니다.", 1300);
      return false;
    }
    if (ctx.usesRemoteStructureWorld?.()) {
      const result = await dispatchStructureAction({
        action: { type: "structure.remove", structureKey: structure.key },
        knownRevision: Number(plot.revision) || 0,
        wastelandState: ctx.serializeState(),
      });
      if (!result?.ok) {
        ctx.consumeItem(structure.type, 1);
        if (result?.world) ctx.applyRemoteStructureWorld(result.world);
        ctx.updateInventoryUI();
        ctx.saveProfile();
        notify(result?.error ?? "건축물 철거에 실패했습니다.", 1300);
        return false;
      }
      ctx.applyRemoteStructureWorld(result.world);
    } else {
      plot.structures = plot.structures.filter((entry) => entry !== structure);
      plot.revision = (Number(plot.revision) || 0) + 1;
      ctx.rebuildStructures();
      ctx.saveWorld();
    }
    ctx.updateInventoryUI();
    ctx.saveProfile();
    notify(`${ctx.getItemName(structure.type)} 철거 완료`, 1000);
    return true;
  }

  async function toggleDoor(structureKey) {
    const plot = ctx.ensurePlot();
    const structure = plot?.structures?.find((entry) => entry?.key === structureKey);
    const part = structure ? ctx.getBuildPart(structure.type) : null;
    if (!plot || !structure || part?.structureKind !== "door") {
      notify("사용할 문을 찾을 수 없습니다.");
      return false;
    }
    if (structure.ownerId !== ctx.getOwnerId()) {
      notify("자신이 설치한 문만 사용할 수 있습니다.", 1200);
      return false;
    }
    if (pendingDoorKeys.has(structure.key)) return false;
    pendingDoorKeys.add(structure.key);
    try {
      let isOpen = Boolean(structure.isOpen);
      if (ctx.usesRemoteStructureWorld?.()) {
        const result = await dispatchStructureAction({
          action: { type: "structure.toggle", structureKey: structure.key },
          knownRevision: Number(plot.revision) || 0,
          wastelandState: ctx.serializeState(),
        });
        if (!result?.ok) {
          if (result?.world) ctx.applyRemoteStructureWorld(result.world);
          notify(result?.error ?? "문 상태를 변경하지 못했습니다.", 1300);
          return false;
        }
        isOpen = Boolean(result.world?.structures?.find((entry) => entry?.key === structure.key)?.isOpen);
        ctx.applyRemoteStructureWorld(result.world);
      } else {
        structure.isOpen = !Boolean(structure.isOpen);
        isOpen = structure.isOpen;
        plot.revision = (Number(plot.revision) || 0) + 1;
        ctx.rebuildStructures();
        ctx.saveWorld();
      }
      ctx.requestPlayerCollisionRecovery?.({ source: "door", immediate: true });
      notify(isOpen ? "문을 열었습니다." : "문을 닫았습니다.", 800);
      return true;
    } finally {
      pendingDoorKeys.delete(structure.key);
    }
  }

  function removeDraftFencePost(cell) {
    const plot = ctx.ensurePlot();
    const ownerId = ctx.getOwnerId();
    if (!plot || !cell || !ownerId) return false;
    const key = `${cell.row}:${cell.col}`;
    const post = plot.fencePosts.get(key);
    const draft = plot.claimDrafts.get(ownerId);
    if (!post || post.ownerId !== ownerId || !draft?.postKeys?.includes(key)) return false;
    ctx.removeFencePostMesh(post);
    plot.fencePosts.delete(key);
    draft.postKeys = draft.postKeys.filter((postKey) => postKey !== key);
    draft.lastPromptSignature = "";
    if (!draft.postKeys.length) plot.claimDrafts.delete(ownerId);
    else touchDraftReservation(draft);
    ctx.addItem("fencePost", 1);
    finalize({ rebuildLinks: true, closeConfirm: true, refreshDraftUi: true, updateInventory: true, save: true });
    notify("울타리 기둥을 회수했습니다.", 900);
    return true;
  }

  function placeFencePost(cell) {
    const plot = ctx.ensurePlot();
    if (!plot || !cell) return false;
    if (removeDraftFencePost(cell)) return true;
    const check = canPlaceFencePost(cell);
    if (!check.ok) {
      notify(check.reason);
      return false;
    }
    if (!ctx.consumeItem("fencePost", 1)) {
      notify("울타리 기둥을 소모하지 못했습니다.");
      return false;
    }
    const ownerId = ctx.getOwnerId();
    if (!ownerId) {
      notify("울타리 기둥 설치는 지갑 로그인이 필요합니다.");
      return false;
    }
    const postData = ctx.runtime.createFencePostRecord(cell, ownerId);
    if (!postData) return false;
    const mesh = ctx.createFencePostMesh();
    mesh.position.set(cell.x, 0.02, cell.z);
    plot.fenceRoot.add(mesh);
    plot.fencePosts.set(postData.key, { ...postData, mesh });
    const draft = plot.claimDrafts.get(ownerId);
    const update = ctx.runtime.createDraftReservationUpdate({ draft, ownerId, postKey: postData.key, now: ctx.dateNow(), reservationMs: ctx.constants.draftReservationMs });
    if (!update) return false;
    if (draft) {
      Object.assign(draft, update);
      syncDraftPhase(draft);
    } else plot.claimDrafts.set(ownerId, { ...update, phase: ctx.constants.draftPhase.active });
    finalize({ rebuildLinks: true, refreshDraftUi: true, updateInventory: true, save: true });
    return true;
  }

  function commitDraft() {
    const plot = ctx.ensurePlot();
    const ownerId = ctx.getOwnerId();
    const draft = plot?.claimDrafts?.get(ownerId);
    if (!ownerId) {
      notify("개간 구역 확정은 지갑 로그인이 필요합니다.", 1100);
      ctx.closeConfirmDialog();
      return false;
    }
    if (!plot || !draft) return false;
    const rect = validateDraft(draft);
    if (!rect) return false;
    if (ctx.runtime.hasClaimOverlap(rect, plot.claims)) {
      notify("다른 확정 구역과 겹치는 직사각형은 확정할 수 없습니다.", 1100);
      return false;
    }
    const claim = ctx.runtime.createClaimRecord({ ownerId, rect, draft, landMeta: ctx.buildLandMeta(rect), now: ctx.dateNow(), durationMs: ctx.constants.claimDurationMs, activeStatus: ctx.constants.claimStatus.active });
    if (!claim) return false;
    plot.claims.push(claim);
    plot.claimDrafts.delete(ownerId);
    const reclaimed = ctx.reclaimConflictingPosts(claim, 2);
    finalize({ clearPlacementMode: true, closeConfirm: true, refreshDraftUi: true, updateInventory: true, save: true });
    notify(reclaimed > 0 ? `개간 구역을 확정했습니다. 충돌 울타리 ${reclaimed}개를 자동 회수했습니다.` : "개간 구역을 확정했습니다.", 1300);
    return true;
  }

  function confirmDraft() {
    const plot = ctx.ensurePlot();
    const ownerId = ctx.getOwnerId();
    const draft = plot?.claimDrafts?.get(ownerId);
    if (!ownerId || !plot || !draft) return false;
    const rect = validateDraft(draft);
    if (!rect) return false;
    if (ctx.runtime.hasClaimOverlap(rect, plot.claims)) {
      notify("다른 확정 구역과 겹치는 직사각형은 확정할 수 없습니다.", 1100);
      return false;
    }
    return ctx.isConfirmOpen() || ctx.openConfirmDialog(rect);
  }

  function expireClaims() {
    const plot = ctx.ensurePlot();
    if (!plot?.claims?.length) return;
    const plan = ctx.runtime.createClaimExpirationPlan({ claims: plot.claims, now: ctx.dateNow(), partitionExpiredClaims: ctx.partitionExpiredClaims, failedStatus: ctx.constants.claimStatus.failed });
    if (!plan.expired.length) return;
    const ownerId = ctx.getOwnerId();
    for (const { claim, patch } of plan.expired) ctx.setClaimStatus(claim, patch);
    plot.claims = plan.active;
    for (const { claim } of plan.expired) {
      ctx.removeClaimFences(claim);
      if (claim.ownerId === ownerId) notify("개간 기한이 만료되어 울타리 기둥이 철거되었습니다.", 1300);
    }
    finalize({ closeCancel: true, updateClaimUi: true, save: true });
  }

  function expireDrafts() {
    const plot = ctx.ensurePlot();
    if (!plot?.claimDrafts?.size) return;
    const ownerId = ctx.getOwnerId();
    const expired = ctx.getExpiredDrafts(plot.claimDrafts, ctx.dateNow());
    if (!expired.length) return;
    for (const [draftOwnerId, draft] of expired) {
      draft.phase = ctx.constants.draftPhase.expired;
      for (const key of draft.postKeys) {
        const post = plot.fencePosts.get(key);
        if (post) ctx.removeFencePostMesh(post);
        plot.fencePosts.delete(key);
      }
      plot.claimDrafts.delete(draftOwnerId);
      if (draftOwnerId === ownerId) notify("토지 선언 예약이 만료되어 울타리 기둥이 해제되었습니다.", 1300);
    }
    finalize({ rebuildLinks: true, closeConfirm: true, refreshDraftUi: true, updateInventory: true, save: true });
  }

  function completeClaim() {
    const plot = ctx.ensurePlot();
    if (!plot) return false;
    const progress = getClaimProgress();
    const claim = progress?.claim;
    const issued = claim ? findIssuedLandDeed(claim.landId) : null;
    const reward = ctx.runtime.getClaimCompletionRewardPlan({ canComplete: canCompleteClaim(progress), hasIssuedDeed: Boolean(issued) });
    if (!reward.ok) {
      notify("아직 완료할 수 없습니다.");
      return false;
    }
    const issuedAt = ctx.dateNow();
    const ensureFoundation = () => {
      if (plot.foundations.some((foundation) => foundation.landId === claim.landId && foundation.status === "completed")) return;
      const foundation = {
        id: `foundation_${claim.landId}`,
        ownerId: claim.ownerId,
        landId: claim.landId,
        status: "completed",
        bounds: {
          minRow: claim.minRow,
          maxRow: claim.maxRow,
          minCol: claim.minCol,
          maxCol: claim.maxCol,
          width: claim.width,
          height: claim.height,
        },
        completedAt: issuedAt,
      };
      plot.foundations.push(foundation);
      ctx.gradeFoundationTerrain?.(foundation);
      ctx.rebuildFoundations();
    };
    if (reward.action === "confirm-issued") {
      ctx.setClaimStatus(claim, ctx.runtime.createClaimStatusPatch(ctx.constants.claimStatus.completed, "", issuedAt, { completedAt: claim.completedAt || issuedAt, rewardItemId: ctx.constants.landDeedItemId, rewardIssuedAt: claim.rewardIssuedAt || issuedAt }));
      ensureFoundation();
      ctx.removeClaimFences(claim);
      finalize({ updateClaimUi: true, updateInventory: true, save: true });
      ctx.saveProfile();
      notify("이미 지급된 토지권을 확인했습니다.", 1400);
      return true;
    }
    const deed = createLandDeedEntry(claim);
    if (!ctx.addInventoryEntry(deed)) {
      finalize({ updateClaimUi: true, updateInventory: true });
      notify("기타 아이템 슬롯을 한 칸 비워주세요.", 1400);
      return false;
    }
    ctx.setClaimStatus(claim, ctx.runtime.createClaimStatusPatch(ctx.constants.claimStatus.completed, "completedAt", issuedAt, { rewardItemId: ctx.constants.landDeedItemId, rewardIssuedAt: issuedAt }));
    ensureFoundation();
    ctx.removeClaimFences(claim);
    finalize({ updateClaimUi: true, updateInventory: true, save: true });
    ctx.saveProfile();
    notify(`개간 완료! ${deed.displayName} 토지권을 획득했습니다.`, 1400);
    return true;
  }

  function cancelClaim() {
    const plot = ctx.ensurePlot();
    const plan = ctx.runtime.getClaimCancellationPlan({ claim: plot ? getCurrentClaim() : null, completedStatus: ctx.constants.claimStatus.completed });
    if (!plan.ok) {
      ctx.closeCancelDialog();
      notify("취소할 수 있는 확정 구역이 없습니다.");
      return false;
    }
    ctx.setClaimStatus(plan.claim, ctx.runtime.createClaimStatusPatch(ctx.constants.claimStatus.cancelled, "cancelledAt", ctx.dateNow()));
    ctx.removeClaimFences(plan.claim);
    plot.claims = plot.claims.filter((claim) => claim !== plan.claim);
    finalize({ closeCancel: true, updateClaimUi: true, save: true });
    notify("개간 구역 확정을 취소했습니다.", 1100);
    return true;
  }

  return {
    getCurrentDraft,
    getScopedDraftFencePosts,
    getCurrentClaim,
    getClaimByCell,
    formatClaimRemaining,
    getDraftBounds,
    validateDraft,
    getDraftPhase,
    syncDraftPhase,
    touchDraftReservation,
    getDraftGuide,
    getFenceHudState,
    getDraftReservationHit,
    getConfirmedClaimBufferHit,
    isCellInsideConfirmedClaim,
    getBuildCheck,
    findIssuedLandDeed,
    findOwnedLandDeed,
    createLandDeedEntry,
    getLandDeedEntries,
    restorePreservedLandDeeds,
    canClearCell,
    canPlaceFencePost,
    getClaimProgress,
    getClaimPhase,
    canCompleteClaim,
    canCancelClaim,
    rebuildAllDrafts,
    rebuildOwnedDraft,
    refreshDraftUi,
    finalize,
    restoreMissingDeeds,
    placeStructure,
    removeStructure,
    toggleDoor,
    removeDraftFencePost,
    placeFencePost,
    commitDraft,
    confirmDraft,
    expireClaims,
    expireDrafts,
    completeClaim,
    cancelClaim,
  };
}
