import {
  getWastelandBuildPartDef,
  getWastelandStructureFootprintCells,
  getWastelandStructureDependencyError,
  getWastelandStructurePlacementKey,
  getWastelandWallEdge,
  normalizeWastelandStructureCollection,
} from "./wastelandBuilding.js";

export function createWastelandRuntime({ getPlot, getOwnerId, landDeedItemId }) {
  function getPlotState() {
    return getPlot?.() ?? null;
  }

  function getCurrentClaim() {
    const plot = getPlotState();
    const ownerId = getOwnerId?.();
    if (!plot || !ownerId) return null;
    return plot.claims?.find((claim) => claim.ownerId === ownerId) ?? null;
  }

  function getClaimForCell(cell) {
    if (!cell) return null;
    const plot = getPlotState();
    return plot?.claims?.find(
      (claim) =>
        cell.row >= claim.minRow && cell.row <= claim.maxRow &&
        cell.col >= claim.minCol && cell.col <= claim.maxCol
    ) ?? null;
  }

  function getCellById(cellId) {
    return getPlotState()?.cells?.find((cell) => cell.id === cellId) ?? null;
  }

  function getStructureConflict(cell, slot, rotationQuarter = 0, level = 0) {
    if (!cell || !slot) return null;
    const placementKey = getWastelandStructurePlacementKey({ cell, slot, rotationQuarter, level });
    return getPlotState()?.structures?.find(
      (structure) => {
        const existingKey = structure?.placementKey || getWastelandStructurePlacementKey({
          cell: structure,
          slot: structure?.slot,
          rotationQuarter: structure?.rotationQuarter,
          level: structure?.level,
        });
        return existingKey === placementKey;
      }
    ) ?? null;
  }

  function hasClaimOverlap(rect, claims = getPlotState()?.claims ?? []) {
    if (!rect) return false;
    return claims.some(
      (claim) =>
        !(rect.maxRow < claim.minRow || rect.minRow > claim.maxRow || rect.maxCol < claim.minCol || rect.minCol > claim.maxCol)
    );
  }

  function createClaimRecord({ ownerId, rect, draft, landMeta, now, durationMs, activeStatus }) {
    if (!ownerId || !rect || !draft || !landMeta) return null;
    return {
      status: activeStatus,
      ownerId,
      mapId: landMeta.mapId,
      landId: landMeta.landId,
      displayName: landMeta.displayName,
      detailAddress: landMeta.detailAddress,
      minRow: rect.minRow,
      maxRow: rect.maxRow,
      minCol: rect.minCol,
      maxCol: rect.maxCol,
      width: rect.width,
      height: rect.height,
      cellIds: rect.cellIds,
      postKeys: [...draft.postKeys],
      confirmedAt: now,
      expiresAt: now + durationMs,
    };
  }

  function createClaimStatusPatch(status, timestampKey, now, extra = {}) {
    return {
      status,
      ...(timestampKey ? { [timestampKey]: now } : {}),
      ...extra,
    };
  }

  function getFencePostPlacementDecision({
    cell,
    ownerId,
    hasCurrentClaim,
    hasExistingPost,
    isInsideConfirmedClaim,
    hasConfirmedClaimBuffer,
    reservationHit,
    hasFencePostItem,
  }) {
    if (!cell) return { ok: false, reason: "missing-cell" };
    if (!ownerId) return { ok: false, reason: "owner-required" };
    if (hasCurrentClaim) return { ok: false, reason: "current-claim-exists" };
    if (hasExistingPost) return { ok: false, reason: "post-exists" };
    if (isInsideConfirmedClaim) return { ok: false, reason: "confirmed-claim-overlap" };
    if (hasConfirmedClaimBuffer) return { ok: false, reason: "confirmed-claim-buffer" };
    if (reservationHit) return {
      ok: false,
      reason: reservationHit.buffer > 0 ? "draft-reservation-buffer" : "draft-reservation-overlap",
    };
    if (!hasFencePostItem) return { ok: false, reason: "fence-post-required" };
    return { ok: true, key: `${cell.row}:${cell.col}` };
  }

  function createFencePostRecord(cell, ownerId) {
    if (!cell || !ownerId) return null;
    const key = `${cell.row}:${cell.col}`;
    return {
      key,
      row: cell.row,
      col: cell.col,
      x: cell.x,
      z: cell.z,
      ownerId,
    };
  }

  function createDraftReservationUpdate({ draft, ownerId, postKey, now, reservationMs }) {
    if (!ownerId || !postKey) return null;
    const postKeys = [...(draft?.postKeys ?? [])];
    if (!postKeys.includes(postKey)) postKeys.push(postKey);
    return {
      ownerId,
      postKeys,
      lastPromptSignature: draft?.lastPromptSignature ?? "",
      reservedAt: draft?.reservedAt ?? now,
      updatedAt: now,
      expiresAt: now + reservationMs,
    };
  }

  function getCellClearPermission({ cell, claim, ownerId, activeStatus }) {
    if (!cell || !claim) return { ok: false, reason: "claim-required" };
    if (!ownerId) return { ok: false, reason: "owner-required" };
    if (claim.ownerId !== ownerId) return { ok: false, reason: "owner-mismatch" };
    if (claim.status && claim.status !== activeStatus) return { ok: false, reason: "claim-inactive" };
    return { ok: true, claim };
  }

  function createCellClearProgressPlan({ currentProgress, gain, maxProgress = 100 }) {
    const progress = Math.max(0, Math.min(maxProgress, Math.floor(Number(currentProgress) || 0)));
    if (progress >= maxProgress) return { ok: false, reason: "already-cleared", progress };
    const nextProgress = Math.max(0, Math.min(maxProgress, progress + Math.floor(Number(gain) || 0)));
    return { ok: true, progress: nextProgress, completed: nextProgress >= maxProgress };
  }

  function getClaimCompletionRewardPlan({ canComplete, hasIssuedDeed }) {
    if (!canComplete) return { ok: false, action: "blocked" };
    return { ok: true, action: hasIssuedDeed ? "confirm-issued" : "issue-deed" };
  }

  function createResetStatePlan(cells = getPlotState()?.cells ?? []) {
    return {
      cellProgressById: new Map((cells ?? []).map((cell) => [cell.id, 0])),
      fencePosts: [],
      drafts: [],
      claims: [],
      structures: [],
      foundations: [],
      revision: 0,
    };
  }

  function createRestoreStatePlan(state) {
    const source = state ?? {};
    const normalizedStructures = normalizeWastelandStructureCollection({
      structures: source.structures,
      foundations: source.foundations,
    });
    return {
      cellProgressById: new Map((source.cells ?? []).map((cell) => [cell.id, cell.clearProgress ?? 0])),
      fencePosts: [...(source.fencePosts ?? [])],
      drafts: (source.drafts ?? []).map((draft) => ({ ...draft, lastPromptSignature: "" })),
      claims: [...(source.claims ?? [])],
      structures: normalizedStructures.structures,
      foundations: [...(source.foundations ?? [])],
      revision: Math.max(0, Math.floor(Number(source.revision) || 0)),
    };
  }

  function createStructureRecord({
    key,
    claim,
    ownerId,
    itemId,
    slot,
    cell,
    surfaceY,
    rotationQuarter = 0,
    cellSize = 0,
    level = 0,
  }) {
    if (!key || !ownerId || !itemId || !slot || !cell) return null;
    const normalizedRotationQuarter = slot === "wall" || slot === "stairs"
      ? ((Math.round(Number(rotationQuarter) || 0) % 4) + 4) % 4
      : 0;
    const placementKey = getWastelandStructurePlacementKey({ cell, slot, rotationQuarter: normalizedRotationQuarter, level });
    return {
      key,
      landId: claim?.landId ?? "",
      ownerId,
      type: itemId,
      slot,
      structureKind: getWastelandBuildPartDef(itemId)?.structureKind ?? slot,
      row: cell.row,
      col: cell.col,
      ...(Number(level) > 0 ? { level: 1 } : {}),
      ...(slot === "stairs" ? { footprintCells: getWastelandStructureFootprintCells(cell, slot, normalizedRotationQuarter) } : {}),
      y: surfaceY,
      rotationQuarter: normalizedRotationQuarter,
      edge: slot === "wall" ? getWastelandWallEdge(normalizedRotationQuarter) : "",
      placementKey,
      cellSize: Number(cellSize) || Number(cell?.size) || 0,
      ...(getWastelandBuildPartDef(itemId)?.structureKind === "door" ? { isOpen: false } : {}),
    };
  }

  function getMissingLandDeedClaims({ claims, ownerId, completedStatus, hasLandDeed }) {
    if (!ownerId) return [];
    return (claims ?? []).filter(
      (claim) =>
        claim?.ownerId === ownerId &&
        claim.status === completedStatus &&
        Boolean(claim.landId) &&
        !hasLandDeed(claim.landId)
    );
  }

  function getClaimCancellationPlan({ claim, completedStatus }) {
    if (!claim || claim.status === completedStatus || claim.rewardIssuedAt) {
      return { ok: false, reason: "claim-not-cancellable" };
    }
    return { ok: true, claim };
  }

  function createClaimExpirationPlan({ claims, now, partitionExpiredClaims, failedStatus }) {
    const { expired = [], active = [] } = partitionExpiredClaims(claims ?? [], now);
    return {
      active,
      expired: expired.map((claim) => ({
        claim,
        patch: createClaimStatusPatch(failedStatus, "failedAt", now),
      })),
    };
  }

  function buildLandMeta(rect) {
    if (!rect) return null;
    const mapId = "frontier-wasteland";
    return {
      mapId,
      landId: `${mapId}-r${rect.minRow}-${rect.maxRow}-c${rect.minCol}-${rect.maxCol}`,
      displayName: `개척지 황무지 ${rect.minRow}-${rect.minCol} 구역`,
      detailAddress: `${mapId} / r${rect.minRow}-${rect.maxRow} / c${rect.minCol}-${rect.maxCol}`,
    };
  }

  function createLandDeedData(claim) {
    if (!claim) return null;
    const meta = buildLandMeta(claim) ?? {};
    return {
      itemId: landDeedItemId,
      landId: claim.landId || meta.landId || "",
      mapId: claim.mapId || meta.mapId || "frontier-wasteland",
      displayName: claim.displayName || meta.displayName || "개척지 황무지 토지권",
      detailAddress: claim.detailAddress || meta.detailAddress || "frontier-wasteland",
      minRow: claim.minRow,
      maxRow: claim.maxRow,
      minCol: claim.minCol,
      maxCol: claim.maxCol,
    };
  }

  function serializeState(getClearProgress) {
    const plot = getPlotState();
    if (!plot) return null;
    const normalizedStructures = normalizeWastelandStructureCollection({
      structures: plot.structures,
      foundations: plot.foundations,
    });
    return {
      cells: (plot.cells ?? []).map((cell) => ({ id: cell.id, clearProgress: getClearProgress(cell) })),
      drafts: [...(plot.claimDrafts?.values?.() ?? [])].map((draft) => ({
        ownerId: draft.ownerId,
        postKeys: [...(draft.postKeys ?? [])],
        reservedAt: draft.reservedAt ?? 0,
        updatedAt: draft.updatedAt ?? 0,
        expiresAt: draft.expiresAt ?? 0,
        phase: draft.phase,
      })),
      fencePosts: [...(plot.fencePosts?.values?.() ?? [])].map(({ mesh: _mesh, ...post }) => post),
      claims: plot.claims ?? [],
      structures: normalizedStructures.structures.map(({ mesh: _mesh, x: _x, y: _y, z: _z, ...structure }) => structure),
      foundations: plot.foundations ?? [],
      revision: Math.max(0, Math.floor(Number(plot.revision) || 0)),
    };
  }

  return {
    getCurrentClaim,
    getClaimForCell,
    getCellById,
    getStructureConflict,
    hasClaimOverlap,
    createClaimRecord,
    createClaimStatusPatch,
    getFencePostPlacementDecision,
    createFencePostRecord,
    createDraftReservationUpdate,
    getCellClearPermission,
    createCellClearProgressPlan,
    getClaimCompletionRewardPlan,
    createResetStatePlan,
    createRestoreStatePlan,
    createStructureRecord,
    getMissingLandDeedClaims,
    getClaimCancellationPlan,
    createClaimExpirationPlan,
    buildLandMeta,
    createLandDeedData,
    serializeState,
  };
}
