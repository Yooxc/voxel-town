import { randomUUID } from "node:crypto";

import { getSessionUser } from "../auth/service.js";
import { store } from "../db/store.js";
import {
  placeWastelandStructureInWorld,
  removeWastelandStructureFromWorld,
  toggleWastelandDoorInWorld,
  normalizeWastelandStructureCollection,
} from "../../../src/systems/wastelandBuilding.js";

const WASTELAND_WORLD_KEY = "frontier-wasteland";
const MIN_FOUNDATION_SIZE = 3;
const MAX_FOUNDATION_SIZE = 8;
const REQUIRED_DEPTH = 0.6;
const MAX_DEPTH = 1.5;
const REQUIRED_READY_RATIO = 0.8;

function createDefaultWorld() {
  return {
    revision: 0,
    foundations: [],
    structures: [],
    terrainDepthByCell: {},
    updatedAt: 0,
  };
}

function getWorld(draft) {
  if (!draft.worlds || typeof draft.worlds !== "object") draft.worlds = {};
  const existing = draft.worlds[WASTELAND_WORLD_KEY];
  if (!existing || typeof existing !== "object") {
    draft.worlds[WASTELAND_WORLD_KEY] = createDefaultWorld();
  }
  const world = draft.worlds[WASTELAND_WORLD_KEY];
  if (!Array.isArray(world.foundations)) world.foundations = [];
  if (!Array.isArray(world.structures)) world.structures = [];
  if (!world.terrainDepthByCell || typeof world.terrainDepthByCell !== "object") world.terrainDepthByCell = {};
  world.structures = normalizeWastelandStructureCollection({
    structures: world.structures,
    foundations: world.foundations,
  }).structures;
  return world;
}

function normalizeBounds(rawBounds) {
  const minRow = Number(rawBounds?.minRow);
  const maxRow = Number(rawBounds?.maxRow);
  const minCol = Number(rawBounds?.minCol);
  const maxCol = Number(rawBounds?.maxCol);
  if (![minRow, maxRow, minCol, maxCol].every(Number.isInteger)) return null;
  if (minRow > maxRow || minCol > maxCol) return null;
  const width = maxCol - minCol + 1;
  const height = maxRow - minRow + 1;
  if (width < MIN_FOUNDATION_SIZE || height < MIN_FOUNDATION_SIZE || width > MAX_FOUNDATION_SIZE || height > MAX_FOUNDATION_SIZE) {
    return null;
  }
  return { minRow, maxRow, minCol, maxCol, width, height };
}

function isInsideBounds(cell, bounds) {
  return cell.row >= bounds.minRow && cell.row <= bounds.maxRow
    && cell.col >= bounds.minCol && cell.col <= bounds.maxCol;
}

function overlapsBounds(left, right) {
  return !(left.maxRow < right.minRow || left.minRow > right.maxRow || left.maxCol < right.minCol || left.minCol > right.maxCol);
}

function getCompletedClaim(wastelandState, ownerId, bounds) {
  return (wastelandState?.claims ?? []).find((claim) => (
    claim?.ownerId === ownerId
    && claim?.status === "completed"
    && bounds.minRow >= claim.minRow
    && bounds.maxRow <= claim.maxRow
    && bounds.minCol >= claim.minCol
    && bounds.maxCol <= claim.maxCol
  )) ?? null;
}

function getFoundationReadyState(world, foundation) {
  const total = foundation.bounds.width * foundation.bounds.height;
  let prepared = 0;
  for (let row = foundation.bounds.minRow; row <= foundation.bounds.maxRow; row += 1) {
    for (let col = foundation.bounds.minCol; col <= foundation.bounds.maxCol; col += 1) {
      if ((Number(world.terrainDepthByCell[`${row}:${col}`]) || 0) >= REQUIRED_DEPTH) prepared += 1;
    }
  }
  return { prepared, total, ratio: total > 0 ? prepared / total : 0 };
}

function snapshot(world) {
  return structuredClone(world);
}

export function getWastelandWorld(token) {
  if (!getSessionUser(token)) return { ok: false, status: 401, error: "세션이 유효하지 않습니다." };
  const world = getWorld(store.read());
  return { ok: true, payload: { world: snapshot(world) } };
}

export function applyWastelandWorldAction(token, { action, knownRevision, wastelandState } = {}) {
  const user = getSessionUser(token);
  if (!user) return { ok: false, status: 401, error: "세션이 유효하지 않습니다." };
  const ownerId = user.walletAddress;
  let result = null;

  store.mutate((draft) => {
    const world = getWorld(draft);
    if (Number.isInteger(knownRevision) && knownRevision !== world.revision) {
      result = { ok: false, status: 409, error: "월드 상태가 갱신되었습니다.", payload: { world: snapshot(world) } };
      return draft;
    }

    if (action?.type === "foundation.reserve") {
      const bounds = normalizeBounds(action.bounds);
      if (!bounds) {
        result = { ok: false, status: 400, error: "기초 영역은 3x3에서 8x8 크기의 직사각형이어야 합니다." };
        return draft;
      }
      if (!getCompletedClaim(wastelandState, ownerId, bounds)) {
        result = { ok: false, status: 403, error: "내가 완료한 황무지 토지 안에서만 기초를 지정할 수 있습니다." };
        return draft;
      }
      if (world.foundations.some((foundation) => overlapsBounds(foundation.bounds, bounds))) {
        result = { ok: false, status: 409, error: "다른 유저가 지정했거나 설치한 기초 영역과 겹칩니다." };
        return draft;
      }
      world.foundations.push({
        id: `foundation-${randomUUID()}`,
        ownerId,
        landId: String(action.landId ?? ""),
        bounds,
        status: "excavating",
        postKeys: Array.isArray(action.postKeys) ? action.postKeys.map(String).slice(0, 2) : [],
        createdAt: Date.now(),
      });
    } else if (action?.type === "terrain.dig") {
      const cell = { row: Number(action.row), col: Number(action.col) };
      const foundation = world.foundations.find((entry) => entry.id === action.foundationId);
      if (!foundation || foundation.ownerId !== ownerId || foundation.status !== "excavating" || !Number.isInteger(cell.row) || !Number.isInteger(cell.col) || !isInsideBounds(cell, foundation.bounds)) {
        result = { ok: false, status: 403, error: "지정한 기초 영역의 소유자만 해당 땅을 팔 수 있습니다." };
        return draft;
      }
      const key = `${cell.row}:${cell.col}`;
      const amount = Math.max(0, Math.min(0.3, Number(action.amount) || 0));
      world.terrainDepthByCell[key] = Math.min(MAX_DEPTH, (Number(world.terrainDepthByCell[key]) || 0) + amount);
    } else if (action?.type === "foundation.install") {
      const foundation = world.foundations.find((entry) => entry.id === action.foundationId);
      if (!foundation || foundation.ownerId !== ownerId || foundation.status !== "excavating") {
        result = { ok: false, status: 403, error: "설치 권한이 없는 기초입니다." };
        return draft;
      }
      const readiness = getFoundationReadyState(world, foundation);
      if (readiness.ratio < REQUIRED_READY_RATIO) {
        result = { ok: false, status: 400, error: "기초 영역의 80% 이상을 0.6m 이상 굴착해야 합니다." };
        return draft;
      }
      foundation.status = "completed";
      foundation.completedAt = Date.now();
    } else if (action?.type === "structure.place") {
      const placement = placeWastelandStructureInWorld({ world, ownerId, action, wastelandState, createId: randomUUID });
      if (!placement.ok) {
        result = { ...placement, payload: { world: snapshot(world) } };
        return draft;
      }
    } else if (action?.type === "structure.remove") {
      const removal = removeWastelandStructureFromWorld({ world, ownerId, action });
      if (!removal.ok) {
        result = { ...removal, payload: { world: snapshot(world) } };
        return draft;
      }
    } else if (action?.type === "structure.toggle") {
      const toggle = toggleWastelandDoorInWorld({ world, ownerId, action });
      if (!toggle.ok) {
        result = { ...toggle, payload: { world: snapshot(world) } };
        return draft;
      }
    } else {
      result = { ok: false, status: 400, error: "지원하지 않는 황무지 작업입니다." };
      return draft;
    }

    world.revision += 1;
    world.updatedAt = Date.now();
    result = { ok: true, payload: { world: snapshot(world) } };
    return draft;
  });
  return result;
}
