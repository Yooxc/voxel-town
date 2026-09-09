import {
  getGuideArrivalPath,
  getGuideReturnPath,
  getTourLegPath,
  getTourCheckpoints,
  getTourGuideDefinitions,
} from "../../../src/systems/tourPlan.js";
import { buildGuideNavigationPath } from "../../../src/systems/guideNavigation.js";
import { getRebuildLayout, getRebuildTerrainHeight } from "../../../src/world/rebuildLayout.js";

const PLAYER_TTL_MS = 12_000;
const GUIDE_SPEED = 2.15;
const GUIDE_PAUSE_DISTANCE = 6.2;
const GUIDE_RESUME_DISTANCE = 3.5;
const MAX_STEP_SECONDS = 0.25;

function clampNumber(value, min, max, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function normalizePlayer(raw = {}) {
  return {
    x: clampNumber(raw.x, -10_000, 10_000),
    y: clampNumber(raw.y, -100, 100),
    z: clampNumber(raw.z, -10_000, 10_000),
    rotationY: clampNumber(raw.rotationY, -Math.PI * 4, Math.PI * 4),
    mapId: String(raw.mapId ?? "광산").slice(0, 32),
    moving: Boolean(raw.moving),
    sprinting: Boolean(raw.sprinting),
  };
}

function copyPosition(position) {
  return { x: position.x, y: position.y, z: position.z };
}

function distance2d(left, right) {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function createGuideState(definition, checkpoints) {
  return {
    id: definition.id,
    name: definition.name,
    position: copyPosition(definition.origin),
    rotationY: 0,
    status: "idle",
    ownerId: "",
    checkpointId: "",
    path: [],
    pathIndex: 0,
    dialogVersion: 0,
    returnReason: "",
    resumeStatus: "",
    checkpoints,
    origin: copyPosition(definition.origin),
    arrivalPath: getGuideArrivalPath(definition, checkpoints),
  };
}

function createGuideSnapshot(guide) {
  return {
    id: guide.id,
    name: guide.name,
    x: guide.position.x,
    y: guide.position.y,
    z: guide.position.z,
    rotationY: guide.rotationY,
    status: guide.status,
    ownerId: guide.ownerId,
    checkpointId: guide.checkpointId,
    dialogVersion: guide.dialogVersion,
    returnReason: guide.returnReason,
  };
}

export function createPresenceService({ now = () => Date.now() } = {}) {
  const players = new Map();
  const layout = getRebuildLayout();
  const checkpoints = getTourCheckpoints();
  const navigationObstacles = layout.navigationObstacles;
  const guides = getTourGuideDefinitions().map((definition) => createGuideState(definition, checkpoints));
  let lastGuideUpdateAt = now();

  function getCheckpoint(id) {
    return checkpoints.find((checkpoint) => checkpoint.id === id) ?? checkpoints[0];
  }

  function getOwnerGuide(ownerId) {
    return guides.find((guide) => guide.ownerId === ownerId && guide.status !== "idle") ?? null;
  }

  function beginPath(guide, path, status, { returnReason = "" } = {}) {
    const navigationPath = buildGuideNavigationPath(guide.position, path, {
      obstacles: navigationObstacles,
      heightAt: (x, z, fallbackY) => getRebuildTerrainHeight(x, z, layout.origin) ?? fallbackY,
    });
    guide.path = navigationPath.map(copyPosition);
    guide.pathIndex = 0;
    guide.status = path.length > 0 && navigationPath.length === 0 ? "path_blocked" : status;
    guide.returnReason = returnReason;
    guide.resumeStatus = "";
  }

  function beginReturn(guide, reason) {
    if (guide.status === "idle" || guide.status === "returning") return;
    beginPath(guide, getGuideReturnPath(guide, checkpoints, guide.checkpointId), "returning", { returnReason: reason });
  }

  function assignGuide(ownerId, checkpointId) {
    const existing = getOwnerGuide(ownerId);
    if (existing) return { ok: true, guide: existing };
    const guide = guides.find((entry) => entry.status === "idle");
    if (!guide) return { ok: false, error: "현재 모든 길잡이가 안내 중이에요. 잠시 후 다시 요청해 주세요." };
    const checkpoint = getCheckpoint(checkpointId);
    const checkpointIndex = checkpoints.findIndex((entry) => entry.id === checkpoint.id);
    guide.ownerId = ownerId;
    guide.checkpointId = checkpoint.id;
    const path = [...guide.arrivalPath];
    for (let index = 1; index <= checkpointIndex; index += 1) {
      path.push(...getTourLegPath(checkpoints, checkpoints[index - 1].id, checkpoints[index].id));
    }
    beginPath(guide, path, "arriving");
    return { ok: true, guide };
  }

  function advanceGuide(ownerId) {
    const guide = getOwnerGuide(ownerId);
    if (!guide || guide.status !== "waiting") return { ok: false, error: "현재 진행할 안내가 없습니다." };
    const index = checkpoints.findIndex((checkpoint) => checkpoint.id === guide.checkpointId);
    if (index < 0 || index >= checkpoints.length - 1) {
      beginReturn(guide, "completed");
      return { ok: true, guide };
    }
    const nextCheckpoint = checkpoints[index + 1];
    const previousCheckpointId = guide.checkpointId;
    guide.checkpointId = nextCheckpoint.id;
    beginPath(guide, getTourLegPath(checkpoints, previousCheckpointId, nextCheckpoint.id), "moving");
    return { ok: true, guide };
  }

  function applyCommand(ownerId, command) {
    if (!command || typeof command !== "object") return { ok: true };
    if (command.type === "tour.request") return assignGuide(ownerId, command.checkpointId);
    if (command.type === "tour.advance") return advanceGuide(ownerId);
    if (command.type === "tour.cancel") {
      const guide = getOwnerGuide(ownerId);
      if (guide) beginReturn(guide, "paused");
      return { ok: true, guide };
    }
    return { ok: false, error: "지원하지 않는 안내 요청입니다." };
  }

  function prunePlayers(time) {
    for (const [id, player] of players) {
      if (time - player.updatedAt <= PLAYER_TTL_MS) continue;
      players.delete(id);
      const guide = getOwnerGuide(id);
      if (guide) beginReturn(guide, "paused");
    }
  }

  function stepGuide(guide, dt) {
    const target = guide.path[guide.pathIndex];
    if (!target) return true;
    const dx = target.x - guide.position.x;
    const dz = target.z - guide.position.z;
    const distance = Math.hypot(dx, dz);
    const step = GUIDE_SPEED * dt;
    if (distance <= Math.max(0.05, step)) {
      guide.position = copyPosition(target);
      guide.pathIndex += 1;
      return guide.pathIndex >= guide.path.length;
    }
    guide.position.x += (dx / distance) * step;
    guide.position.z += (dz / distance) * step;
    guide.position.y += (target.y - guide.position.y) * (step / distance);
    guide.rotationY = Math.atan2(dx, dz);
    return false;
  }

  function updateGuides(time) {
    const dt = Math.min(MAX_STEP_SECONDS, Math.max(0, (time - lastGuideUpdateAt) / 1000));
    lastGuideUpdateAt = time;
    for (const guide of guides) {
      const owner = players.get(guide.ownerId);
      if (guide.status === "waiting") {
        if (owner) {
          const dx = owner.player.x - guide.position.x;
          const dz = owner.player.z - guide.position.z;
          if (Math.hypot(dx, dz) > 0.01) guide.rotationY = Math.atan2(dx, dz);
        }
        continue;
      }
      if (guide.status === "idle" || guide.status === "path_blocked") continue;
      if (guide.status !== "returning" && (!owner || owner.player.mapId !== "광산")) {
        beginReturn(guide, "paused");
      }
      if (guide.status === "waiting_for_player") {
        if (distance2d(guide.position, owner.player) > GUIDE_RESUME_DISTANCE) continue;
        guide.status = guide.resumeStatus || "moving";
        guide.resumeStatus = "";
      }
      if (guide.status === "moving" && distance2d(guide.position, owner.player) > GUIDE_PAUSE_DISTANCE) {
        guide.resumeStatus = guide.status;
        guide.status = "waiting_for_player";
        continue;
      }
      if (!stepGuide(guide, dt)) continue;
      if (guide.status === "returning") {
        guide.status = "idle";
        guide.ownerId = "";
        guide.checkpointId = "";
        guide.path = [];
        guide.pathIndex = 0;
        guide.returnReason = "";
        guide.resumeStatus = "";
        continue;
      }
      guide.status = "waiting";
      guide.dialogVersion += 1;
    }
  }

  function sync({ identity, displayName, player, command }) {
    const time = now();
    prunePlayers(time);
    players.set(identity, {
      id: identity,
      name: String(displayName ?? "방문자").slice(0, 20),
      player: normalizePlayer(player),
      updatedAt: time,
    });
    const commandResult = applyCommand(identity, command);
    updateGuides(time);
    return {
      ok: commandResult.ok,
      error: commandResult.error ?? "",
      selfId: identity,
      players: [...players.values()].map((entry) => ({ id: entry.id, name: entry.name, ...entry.player })),
      guides: guides.map(createGuideSnapshot),
    };
  }

  function leave(identity) {
    const guide = getOwnerGuide(identity);
    if (guide) beginReturn(guide, "paused");
    players.delete(identity);
    updateGuides(now());
    return { ok: true };
  }

  return { sync, leave, getGuides: () => guides.map(createGuideSnapshot) };
}
