import { getRebuildLayout, getRebuildTerrainHeight } from "../world/rebuildLayout.js";

const BASE_REST_POSITION = { x: -5, y: 2.4, z: 10.4 };
const ARRIVAL_ROUTE = [
  { x: 11.5, z: -17 },
  { x: 10.8, z: -9 },
  { x: 10, z: -1 },
  { x: 9, z: 6 },
  { x: 7.5, z: 9.2 },
];
const CHECKPOINT_ROUTES = Object.freeze({
  "guide-intro:rest-area": [
    { x: 2.4, z: 8.8 },
    { x: -1.2, z: 9.2 },
  ],
  "rest-area:work-area": [
    { x: -3.2, z: 7 },
    { x: -0.8, z: 1 },
    { x: 0.6, z: -6 },
    { x: 0.1, z: -14 },
    { x: -2.2, z: -20 },
  ],
  "work-area:exploration-path": [
    { x: -3.2, z: -27.5 },
    { x: -2.2, z: -32.5 },
    { x: -1.2, z: -36.5 },
  ],
});

function getTerrainOrigin(checkpoints) {
  const rest = checkpoints.find((checkpoint) => checkpoint.id === "rest-area")?.position;
  if (!rest) return { x: 0, y: 0, z: 0 };
  return {
    x: rest.x - BASE_REST_POSITION.x,
    y: rest.y - BASE_REST_POSITION.y,
    z: rest.z - BASE_REST_POSITION.z,
  };
}

function groundedRoutePoint(point, origin) {
  const x = point.x + origin.x;
  const z = point.z + origin.z;
  return { x, y: getRebuildTerrainHeight(x, z, origin), z };
}

function getCheckpoint(checkpoints, id) {
  return checkpoints.find((checkpoint) => checkpoint.id === id) ?? null;
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
  const origin = getTerrainOrigin(checkpoints);
  return [
    groundedRoutePoint({ x: guide.origin.x - origin.x - 1.2, z: guide.origin.z - origin.z + 0.3 }, origin),
    ...ARRIVAL_ROUTE.map((point) => groundedRoutePoint(point, origin)),
    { ...firstCheckpoint },
  ];
}

export function getTourLegPath(checkpoints, fromCheckpointId, toCheckpointId) {
  const destination = getCheckpoint(checkpoints, toCheckpointId)?.position;
  if (!destination) return [];
  const origin = getTerrainOrigin(checkpoints);
  const route = CHECKPOINT_ROUTES[`${fromCheckpointId}:${toCheckpointId}`] ?? [];
  return [...route.map((point) => groundedRoutePoint(point, origin)), { ...destination }];
}

export function getGuideReturnPath(guide, checkpoints, checkpointId) {
  const origin = getTerrainOrigin(checkpoints);
  const officeApproach = [
    { x: 4.5, z: -19 },
    { x: 8, z: -19.5 },
    { x: guide.origin.x - origin.x - 1.2, z: guide.origin.z - origin.z + 0.3 },
  ];
  let route;
  if (checkpointId === "guide-intro" || checkpointId === "rest-area") {
    route = [...ARRIVAL_ROUTE].reverse();
  } else if (checkpointId === "exploration-path") {
    route = [{ x: -1.2, z: -36.5 }, { x: -2.2, z: -32.5 }, { x: -3.2, z: -27.5 }, { x: -2.2, z: -21 }, ...officeApproach];
  } else {
    route = [{ x: -2.2, z: -21 }, ...officeApproach];
  }
  return [...route.map((point) => groundedRoutePoint(point, origin)), { ...guide.origin }];
}
