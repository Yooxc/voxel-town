import { getRebuildLayout } from "../world/rebuildLayout.js";

function getCheckpoint(checkpoints, id) {
  return checkpoints.find((checkpoint) => checkpoint.id === id) ?? null;
}

function getTerrainOrigin(checkpoints) {
  const baseLayout = getRebuildLayout();
  const baseRest = baseLayout.activityLocations.find((location) => location.id === "rest-area")?.position;
  const rest = checkpoints.find((checkpoint) => checkpoint.id === "rest-area")?.position;
  if (!baseRest || !rest) return { x: 0, y: 0, z: 0 };
  return { x: rest.x - baseRest.x, y: rest.y - baseRest.y, z: rest.z - baseRest.z };
}

function getLayoutFromCheckpoints(checkpoints) {
  const origin = getTerrainOrigin(checkpoints);
  return getRebuildLayout(origin.x, origin.z, origin.y);
}

export const TOUR_CHECKPOINTS = Object.freeze(getRebuildLayout().tour.checkpoints);
export const TOUR_GUIDE_DEFINITIONS = Object.freeze(getRebuildLayout().tour.guides);

export function getTourCheckpoints(startX = 0, startZ = 0, startFlatY = 0) {
  return getRebuildLayout(startX, startZ, startFlatY).tour.checkpoints;
}

export function getTourGuideDefinitions(startX = 0, startZ = 0, startFlatY = 0) {
  return getRebuildLayout(startX, startZ, startFlatY).tour.guides;
}

export function getTourNavigationObstacles(startX = 0, startZ = 0, startFlatY = 0) {
  return getRebuildLayout(startX, startZ, startFlatY).navigationObstacles;
}

export function getGuideArrivalPath(guide, checkpoints) {
  const firstCheckpoint = checkpoints[0]?.position;
  if (!firstCheckpoint) return [];
  const routes = getLayoutFromCheckpoints(checkpoints).tour.routes;
  return [{ ...guide.origin }, ...routes.arrival.map((point) => ({ ...point })), { ...firstCheckpoint }];
}

export function getTourLegPath(checkpoints, fromCheckpointId, toCheckpointId) {
  const destination = getCheckpoint(checkpoints, toCheckpointId)?.position;
  if (!destination) return [];
  const routes = getLayoutFromCheckpoints(checkpoints).tour.routes;
  const route = routes.legs[`${fromCheckpointId}:${toCheckpointId}`] ?? [];
  return [...route.map((point) => ({ ...point })), { ...destination }];
}

export function getGuideReturnPath(guide, checkpoints, checkpointId) {
  const routes = getLayoutFromCheckpoints(checkpoints).tour.routes;
  const route = routes.returns[checkpointId] ?? [];
  return [...route.map((point) => ({ ...point })), { ...guide.origin }];
}
