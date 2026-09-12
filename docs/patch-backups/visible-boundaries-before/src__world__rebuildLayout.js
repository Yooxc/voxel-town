const REBUILD_MAP_ID = "광산";
const HILL_HEIGHT = 6;
const QUARRY_FLOOR_HEIGHT = 3;

function smoothstep(min, max, value) {
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

export function getRebuildTerrainHeight(x, z, origin = { x: 0, y: 0, z: 0 }) {
  const localX = x - origin.x;
  const localZ = z - origin.z;
  const arrivalHill = HILL_HEIGHT * smoothstep(-3, 16, localZ)
    * (1 - smoothstep(24, 48, Math.abs(localX)));
  const distantEastRise = smoothstep(48, 72, localX) * 2.1;
  const distantNorthRise = smoothstep(42, 62, localZ) * 1.8;
  const mine = BASE_LAYOUT.generalMine;
  const edgeDistance = distanceToPolygon(localX, localZ, mine.floorPolygon);
  const quarryHeight = QUARRY_FLOOR_HEIGHT * (1 - smoothstep(0, 12, edgeDistance));
  let roadHeight = 0;
  for (let index = 1; index < mine.pathPoints.length; index += 1) {
    const a = mine.pathPoints[index - 1];
    const b = mine.pathPoints[index];
    const projection = projectToSegment(localX, localZ, a, b);
    const y = a.y + (b.y - a.y) * projection.t;
    roadHeight = Math.max(roadHeight, y * (1 - smoothstep(4, 12, projection.distance)));
  }
  return origin.y + Math.max(arrivalHill, quarryHeight, roadHeight, distantEastRise, distantNorthRise);
}

const BASE_LAYOUT = Object.freeze({
  origin: { x: 0, y: 0, z: 0 },
  arrival: {
    spawn: { x: 0, y: HILL_HEIGHT, z: 27, rotationY: Math.PI },
    door: { x: 0, y: HILL_HEIGHT, z: 31 },
  },
  welcomeArea: {
    anchor: { x: 7, y: HILL_HEIGHT, z: 23 },
    tree: { x: -7, y: HILL_HEIGHT + 1.35, z: 26 },
    bench: { x: -6, y: HILL_HEIGHT, z: 22.5 },
    resident: { x: 7, y: HILL_HEIGHT, z: 23 },
    guideMeeting: { x: 4.8, y: HILL_HEIGHT, z: 22.5 },
  },
  descentPath: {
    points: [
      { x: 0, y: 6, z: 28, width: 4.8 },
      { x: -0.5, y: 5.75, z: 22, width: 5 },
      { x: -1.5, y: 4.65, z: 14, width: 5.2 },
      { x: -1, y: 2.5, z: 5, width: 5.6 },
      { x: 0, y: 0.45, z: -5, width: 6 },
      { x: 0, y: 0, z: -13, width: 7.5 },
    ],
  },
  workArea: {
    stall: { x: -8, y: 0, z: -12 },
    approach: { x: -10.5, y: 0, z: -13.5 },
  },
  restArea: { approach: { x: -6, y: HILL_HEIGHT, z: 23 } },
  guideOrigins: [
    { id: "guide-1", name: "다온", coatColor: 0x58758a, position: { x: 9, y: 0, z: -3 } },
  ],
  explorationPath: { x: -23, y: 0.2, z: -13 },
  miningArea: { x: 24, y: 0, z: -22 },
  miningDemo: {
    rockBounds: { minX: 20.5, maxX: 28.5, minZ: -26.5, maxZ: -17.5 },
  },
  gathering: {
    interactionRadius: 2.0,
    collectDurationMs: 1000,
    minSpacing: 0.85,
    types: [
      { kind: "grass", itemId: "wildGrass", count: 30, respawnMinMs: 20_000, respawnMaxMs: 30_000 },
      { kind: "flower", itemId: "wildFlower", count: 15, respawnMinMs: 30_000, respawnMaxMs: 45_000 },
    ],
    zones: [
      { id: "arrival-west", minX: -16, maxX: -9, minZ: 19, maxZ: 32 },
      { id: "arrival-east", minX: 10, maxX: 18, minZ: 18, maxZ: 31 },
      { id: "slope-west", minX: -18, maxX: -10, minZ: -6, maxZ: 16 },
      { id: "slope-east", minX: 10, maxX: 19, minZ: -7, maxZ: 16 },
      { id: "market-west", minX: -22, maxX: -15, minZ: -24, maxZ: -9 },
      { id: "market-east", minX: 14, maxX: 22, minZ: -25, maxZ: -8 },
    ],
  },
  generalMine: {
    entrance: { x: -28, y: 0.3, z: -12 },
    center: { x: -123, y: QUARRY_FLOOR_HEIGHT, z: -42 },
    pathPoints: [
      { x: -28, y: 0.3, z: -12 },
      { x: -31, y: 1, z: -24 },
      { x: -41, y: 1.8, z: -35 },
      { x: -57, y: 2.4, z: -40 },
      { x: -74, y: 3, z: -34 },
      { x: -91.26434499470908, y: QUARRY_FLOOR_HEIGHT, z: -39 },
    ],
    floorHeight: QUARRY_FLOOR_HEIGHT,
    floorPolygon: [
      { x: -153, z: -53 }, { x: -143, z: -63 }, { x: -124, z: -65 },
      { x: -106, z: -62 }, { x: -94, z: -53 }, { x: -89, z: -44 },
      { x: -89, z: -34 }, { x: -100, z: -24 }, { x: -119, z: -19 },
      { x: -142, z: -23 }, { x: -154, z: -35 },
    ],
    rockBounds: { minX: -153, maxX: -90, minZ: -64, maxZ: -20 },
    resourceArea: {
      exclusions: [
        { id: "quarry-entrance", type: "capsule", ax: -100, az: -39, bx: -85, bz: -39, radius: 3.1 },
        { id: "quarry-facility", type: "box", x: -137, z: -56, halfWidth: 3.5, halfDepth: 2.2 },
        { id: "quarry-return-sign", type: "circle", x: -93, z: -33, radius: 1.2 },
      ],
    },
    rubbleClusters: [
      { id: "central-a", x: -127, z: -46, radius: 4.2, count: 8, scale: 2.4 },
      { id: "central-b", x: -111, z: -32, radius: 3.7, count: 6, scale: 2.1 },
      { id: "north-west", x: -143, z: -45, radius: 3.2, count: 5, scale: 2 },
      { id: "south-east", x: -105, z: -54, radius: 3.1, count: 5, scale: 1.9 },
    ],
    terraces: [{ inset: 0, outset: 3.2, height: 3 }, { inset: 3.2, outset: 7, height: 6.8 }],
    terraceOpeningEdge: 5,
    workPath: [{ x: -91.26434499470908, z: -39 }, { x: -100, z: -39 },
      { x: -110, z: -44 }, { x: -117, z: -39 }, { x: -122, z: -33 }, { x: -139, z: -33 }],
    facility: { x: -137, y: QUARRY_FLOOR_HEIGHT, z: -56 },
    initialRocks: [
      { x: -139, y: QUARRY_FLOOR_HEIGHT, z: -35, sizeIndex: 1 },
      { x: -130, y: QUARRY_FLOOR_HEIGHT, z: -25, sizeIndex: 0 },
      { x: -119, y: QUARRY_FLOOR_HEIGHT, z: -57, sizeIndex: 2 },
      { x: -98, y: QUARRY_FLOOR_HEIGHT, z: -31, sizeIndex: 1 },
      { x: -97, y: QUARRY_FLOOR_HEIGHT, z: -44, sizeIndex: 0 },
      { x: -147, y: QUARRY_FLOOR_HEIGHT, z: -36, sizeIndex: 1 },
    ],
  },
  market: {
    stalls: [
      {
        id: "materials", x: -8, y: 0, z: -12, accentColor: 0xc49a61,
        displayItems: [
          { id: "stone-sample", kind: "stone", name: "돌 견본", color: 0x777b7c, description: "표면과 모서리를 조금씩 다듬은 돌 견본이에요. 단단한 생활 도구나 작은 장식의 재료로 쓸 수 있어요." },
          { id: "wood-sample", kind: "wood", name: "나무 견본", color: 0x8c603b, description: "결과 색이 서로 다른 나무 견본이에요. 가구나 생활용품을 만들 때 재료의 느낌을 비교할 수 있어요." },
        ],
      },
      {
        id: "craft", x: 0, y: 0, z: -15, accentColor: 0x6c8c9d,
        displayItems: [
          {
            id: "crafted-box", kind: "crafted", name: "작은 상자", color: 0x7192a0,
            description: "모서리를 단정하게 다듬은 작은 상자예요. 자주 쓰는 물건을 가지런히 보관하기 좋아 보여요.",
            interestResponse: "작은 물건들을 정리해 두기 좋은 상자예요. 이런 단정한 모양이 마음에 드는군요.",
          },
          {
            id: "small-tool", kind: "tool", name: "작업 도구", color: 0x646b70,
            description: "손에 쥐기 편하도록 손잡이를 다듬은 작업 도구 견본이에요. 무엇을 만들지 상상하게 해요.",
            interestResponse: "손으로 무언가 만드는 데 관심이 있나 봐요. 쓰기 편하도록 손잡이를 다듬은 견본이에요.",
          },
        ],
      },
      {
        id: "living", x: 8, y: 0, z: -12, accentColor: 0x9d7664,
        displayItems: [
          { id: "small-pot", kind: "pot", name: "작은 화분", color: 0x96705d, description: "작은 식물을 곁에 둘 수 있는 화분이에요. 머무는 자리에 생기를 더해 줍니다." },
          { id: "table-lamp", kind: "lamp", name: "탁상 조명", color: 0xe2c978, description: "자리를 은은하게 밝혀 주는 작은 조명이에요. 쉬거나 무언가 만들 때 편안한 빛을 냅니다." },
        ],
      },
    ],
    residents: [
      {
        id: "materials-resident", stallId: "materials", name: "도윤",
        x: -4.5, y: 0, z: -10.7, rotationY: -0.4, color: 0x727e6a,
        aboutText: "돌과 나무 같은 재료를 모아 두고 있어요. 직접 구해도 좋고, 다른 사람에게 구해도 괜찮아요.",
        displayText: "돌 조각과 나무 견본이 놓여 있어요. 같은 재료도 쓰는 사람에 따라 전혀 다른 물건이 됩니다.",
      },
      {
        id: "craft-resident", stallId: "craft", name: "세아",
        x: 3.4, y: 0, z: -13.5, rotationY: 2.6, color: 0x7b687f,
        aboutText: "가져온 재료를 다듬고 조합해 보고 있어요. 정해진 답보다 무엇을 만들지가 더 중요하죠.",
        displayText: "작은 상자와 작업 도구 견본이 보여요. 같은 재료로도 여러 가지 형태를 만들 수 있습니다.",
      },
      {
        id: "living-resident", stallId: "living", name: "라온",
        x: 11, y: 0, z: -10.5, rotationY: -1.8, color: 0x766850,
        aboutText: "머물 곳을 편하게 만드는 물건을 소개하고 있어요. 공간이 필요해질 때 천천히 시작하면 돼요.",
        displayText: "작은 화분과 조명이 놓여 있어요. 언젠가 자신만의 자리를 꾸밀 때 참고할 만합니다.",
      },
    ],
  },
  navigationObstacles: [
    { id: "arrival-door", type: "box", x: 0, z: 31, halfWidth: 1.55, halfDepth: 0.35 },
    { id: "welcome-tree", type: "circle", x: -7, z: 26, radius: 0.55 },
    { id: "welcome-bench", type: "box", x: -6, z: 22.5, halfWidth: 1.05, halfDepth: 0.55 },
    { id: "maru", type: "circle", x: 7, z: 23, radius: 0.58 },
    { id: "market-stall-1", type: "box", x: -8, z: -12, halfWidth: 1.7, halfDepth: 0.58 },
    { id: "market-stall-2", type: "box", x: 0, z: -15, halfWidth: 1.7, halfDepth: 0.58 },
    { id: "market-stall-3", type: "box", x: 8, z: -12, halfWidth: 1.7, halfDepth: 0.58 },
    { id: "market-resident-1", type: "circle", x: -4.5, z: -10.7, radius: 0.55 },
    { id: "market-resident-2", type: "circle", x: 3.4, z: -13.5, radius: 0.55 },
    { id: "market-resident-3", type: "circle", x: 11, z: -10.5, radius: 0.55 },
  ],
  facilityAnchors: {
    forge: { x: -15, y: 0, z: -15 },
    refinery: { x: -11.75, y: 0, z: -15 },
    nftBoard: { x: -17.35, y: 0, z: -17.55 },
  },
  expansionAnchors: {
    f1: { x: 35, y: 0, z: -6 },
    f2: { x: -147, y: QUARRY_FLOOR_HEIGHT, z: -73 },
  },
  ridge: {
    segments: [
      { x: -36, y: 0, z: -15, width: 5, height: 4.5, depth: 8, rotationY: -0.28 },
      { x: -47, y: 0, z: -25, width: 6, height: 5.4, depth: 9, rotationY: -0.55 },
      { x: -62, y: 0, z: -29, width: 7, height: 6, depth: 9, rotationY: -0.82 },
      { x: -78, y: 0, z: -23, width: 7, height: 6.8, depth: 8.5, rotationY: -1.03 },
    ],
  },
  tourRoutes: {
    arrival: [
      { x: 8.3, z: 1 }, { x: 8, z: 8 }, { x: 7, z: 15 }, { x: 5.5, z: 20.5 },
    ],
    legs: {
      "guide-intro:rest-area": [{ x: 2.5, z: 22 }, { x: -2, z: 23 }],
      "rest-area:work-area": [
        { x: -4, z: 19 }, { x: -2, z: 13 }, { x: -1, z: 7 },
        { x: 0, z: 1 }, { x: -4, z: -6 }, { x: -8, z: -11 },
      ],
      "work-area:exploration-path": [{ x: -14, z: -12 }, { x: -19, z: -12.5 }],
    },
    returns: {
      "guide-intro": [{ x: 5.5, z: 20.5 }, { x: 7, z: 15 }, { x: 8, z: 8 }, { x: 8.3, z: 1 }],
      "rest-area": [{ x: 2.5, z: 22 }, { x: 5.5, z: 20.5 }, { x: 7, z: 15 }, { x: 8, z: 8 }, { x: 8.3, z: 1 }],
      "work-area": [{ x: -6, z: -10 }, { x: 0, z: -6 }, { x: 7, z: -5 }],
      "exploration-path": [{ x: -19, z: -12.5 }, { x: -14, z: -12 }, { x: -6, z: -10 }, { x: 0, z: -6 }, { x: 7, z: -5 }],
    },
  },
});

function offsetPosition(position, startX, startZ, startFlatY) {
  return { x: position.x + startX, y: (position.y ?? 0) + startFlatY, z: position.z + startZ };
}

export function projectToSegment(x, z, a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const t = Math.min(1, Math.max(0, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  const px = a.x + dx * t;
  const pz = a.z + dz * t;
  return { x: px, z: pz, t, distance: Math.hypot(x - px, z - pz) };
}

export function distanceToPolygon(x, z, polygon) {
  if (isPointInPolygon(x, z, polygon)) return 0;
  return Math.min(...polygon.map((a, i) => projectToSegment(x, z, a, polygon[(i + 1) % polygon.length]).distance));
}

function offsetXZ(position, startX, startZ) {
  return { ...position, x: position.x + startX, z: position.z + startZ };
}

function offsetBounds(bounds, startX, startZ) {
  return {
    minX: bounds.minX + startX,
    maxX: bounds.maxX + startX,
    minZ: bounds.minZ + startZ,
    maxZ: bounds.maxZ + startZ,
  };
}

function offsetExclusion(exclusion, startX, startZ) {
  if (exclusion.type === "capsule") {
    return {
      ...exclusion,
      ax: exclusion.ax + startX,
      az: exclusion.az + startZ,
      bx: exclusion.bx + startX,
      bz: exclusion.bz + startZ,
    };
  }
  return offsetXZ(exclusion, startX, startZ);
}

function groundedRoutePoint(point, origin) {
  const x = point.x + origin.x;
  const z = point.z + origin.z;
  return { x, y: getRebuildTerrainHeight(x, z, origin), z };
}

export function isPointInPolygon(x, z, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const crosses = (currentPoint.z > z) !== (previousPoint.z > z)
      && x < ((previousPoint.x - currentPoint.x) * (z - currentPoint.z))
        / (previousPoint.z - currentPoint.z) + currentPoint.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function isPositionInRebuildArea(position, area) {
  if (!position || !area) return false;
  if (area.type === "polygon" || area.polygon) return isPointInPolygon(position.x, position.z, area.polygon);
  return position.x >= area.minX && position.x <= area.maxX
    && position.z >= area.minZ && position.z <= area.maxZ;
}

export function getRebuildLayout(startX = 0, startZ = 0, startFlatY = 0) {
  const origin = offsetPosition(BASE_LAYOUT.origin, startX, startZ, startFlatY);
  const restPosition = offsetPosition(BASE_LAYOUT.restArea.approach, startX, startZ, startFlatY);
  const workPosition = offsetPosition(BASE_LAYOUT.workArea.approach, startX, startZ, startFlatY);
  const quarryPolygon = BASE_LAYOUT.generalMine.floorPolygon.map((point) => offsetXZ(point, startX, startZ));
  const quarryResourcePolygon = quarryPolygon.map((point) => ({ ...point }));
  const groundRoute = (points) => points.map((point) => groundedRoutePoint(point, origin));
  return {
    mapId: REBUILD_MAP_ID,
    origin,
    arrival: Object.fromEntries(Object.entries(BASE_LAYOUT.arrival).map(([key, position]) => [
      key, offsetPosition(position, startX, startZ, startFlatY),
    ])),
    welcomeArea: Object.fromEntries(Object.entries(BASE_LAYOUT.welcomeArea).map(([key, position]) => [
      key, offsetPosition(position, startX, startZ, startFlatY),
    ])),
    workArea: {
      stall: offsetPosition(BASE_LAYOUT.workArea.stall, startX, startZ, startFlatY),
      approach: workPosition,
    },
    explorationPath: offsetPosition(BASE_LAYOUT.explorationPath, startX, startZ, startFlatY),
    descentPath: {
      points: BASE_LAYOUT.descentPath.points.map((point) => ({
        ...groundedRoutePoint(point, origin),
        width: point.width,
      })),
    },
    miningArea: offsetPosition(BASE_LAYOUT.miningArea, startX, startZ, startFlatY),
    miningDemo: {
      rockBounds: offsetBounds(BASE_LAYOUT.miningDemo.rockBounds, startX, startZ),
    },
    gathering: {
      ...BASE_LAYOUT.gathering,
      mapId: REBUILD_MAP_ID,
      types: BASE_LAYOUT.gathering.types.map((type) => ({ ...type })),
      zones: BASE_LAYOUT.gathering.zones.map((zone) => ({
        ...zone,
        minX: zone.minX + startX,
        maxX: zone.maxX + startX,
        minZ: zone.minZ + startZ,
        maxZ: zone.maxZ + startZ,
      })),
    },
    generalMine: {
      entrance: offsetPosition(BASE_LAYOUT.generalMine.entrance, startX, startZ, startFlatY),
      center: offsetPosition(BASE_LAYOUT.generalMine.center, startX, startZ, startFlatY),
      pathPoints: BASE_LAYOUT.generalMine.pathPoints.map((point) => offsetPosition(point, startX, startZ, startFlatY)),
      floorHeight: BASE_LAYOUT.generalMine.floorHeight + startFlatY,
      floorPolygon: quarryPolygon,
      rockBounds: offsetBounds(BASE_LAYOUT.generalMine.rockBounds, startX, startZ),
      resourceArea: {
        bounds: offsetBounds(BASE_LAYOUT.generalMine.rockBounds, startX, startZ),
        polygon: quarryResourcePolygon,
        exclusions: [
          ...BASE_LAYOUT.generalMine.resourceArea.exclusions.map((entry) => offsetExclusion(entry, startX, startZ)),
          ...BASE_LAYOUT.generalMine.rubbleClusters.map((cluster) => ({
            ...offsetXZ(cluster, startX, startZ), type: "circle", radius: cluster.radius + cluster.scale * 1.3,
          })),
          ...BASE_LAYOUT.generalMine.workPath.slice(1).map((b, i) => {
            const a = BASE_LAYOUT.generalMine.workPath[i];
            return offsetExclusion({ id: `work-path-${i}`, type: "capsule", ax: a.x, az: a.z, bx: b.x, bz: b.z, radius: 2.5 }, startX, startZ);
          }),
        ],
      },
      visitArea: { type: "polygon", polygon: quarryPolygon.map((point) => ({ ...point })) },
      rubbleClusters: BASE_LAYOUT.generalMine.rubbleClusters.map((cluster) => offsetXZ(cluster, startX, startZ)),
      terraces: BASE_LAYOUT.generalMine.terraces.map((terrace) => ({ ...terrace })),
      terraceOpeningEdge: BASE_LAYOUT.generalMine.terraceOpeningEdge,
      workPath: BASE_LAYOUT.generalMine.workPath.map((point) => ({ ...offsetXZ(point, startX, startZ), y: QUARRY_FLOOR_HEIGHT + startFlatY })),
      facility: offsetPosition(BASE_LAYOUT.generalMine.facility, startX, startZ, startFlatY),
      initialRocks: BASE_LAYOUT.generalMine.initialRocks.map((rock) => ({
        ...rock,
        ...offsetPosition(rock, startX, startZ, startFlatY),
      })),
    },
    market: {
      stalls: BASE_LAYOUT.market.stalls.map((stall) => ({ ...stall, ...offsetPosition(stall, startX, startZ, startFlatY) })),
      residents: BASE_LAYOUT.market.residents.map((resident) => ({ ...resident, ...offsetPosition(resident, startX, startZ, startFlatY) })),
    },
    facilityAnchors: Object.fromEntries(Object.entries(BASE_LAYOUT.facilityAnchors).map(([id, position]) => [
      id, offsetPosition(position, startX, startZ, startFlatY),
    ])),
    expansionAnchors: Object.fromEntries(Object.entries(BASE_LAYOUT.expansionAnchors).map(([id, position]) => [
      id, offsetPosition(position, startX, startZ, startFlatY),
    ])),
    ridge: {
      outline: [[-31, -15], [-39, -26], [-56, -31], [-73, -25], [-88, -29], [-94, -13], [-65, 1], [-42, 3]]
        .map(([x, z]) => ({ x: x + startX, z: z + startZ })),
      segments: BASE_LAYOUT.ridge.segments.map((segment) => ({
        ...offsetPosition(segment, startX, startZ, startFlatY),
        width: segment.width,
        height: segment.height,
        depth: segment.depth,
      })),
    },
    outdoorZone: { mapId: REBUILD_MAP_ID, centerX: startX - 105, centerZ: startZ - 35, width: 160, depth: 110 },
    navigationObstacles: [
      ...BASE_LAYOUT.navigationObstacles.map((obstacle) => ({
        ...obstacle,
        x: obstacle.x + startX,
        z: obstacle.z + startZ,
      })),
      ...BASE_LAYOUT.guideOrigins.flatMap((guide) => [
        { id: `${guide.id}-station-left`, type: "circle", x: guide.position.x - 0.2 + startX, z: guide.position.z - 0.75 + startZ, radius: 0.18 },
        { id: `${guide.id}-station-right`, type: "circle", x: guide.position.x + 1.4 + startX, z: guide.position.z - 0.75 + startZ, radius: 0.18 },
      ]),
    ],
    activityLocations: [
      { id: "rest-area", mapId: REBUILD_MAP_ID, position: restPosition },
      { id: "work-area", mapId: REBUILD_MAP_ID, position: workPosition },
    ],
    tour: {
      checkpoints: [
        {
          id: "guide-intro",
          mapId: REBUILD_MAP_ID,
          position: offsetPosition(BASE_LAYOUT.welcomeArea.guideMeeting, startX, startZ, startFlatY),
          text: "안녕하세요. 이번 투어를 맡은 {guideName}입니다. 저를 따라와 주세요.",
        },
        { id: "rest-area", mapId: REBUILD_MAP_ID, position: restPosition, text: "이 나무와 벤치는 누구든 쉬어 갈 수 있는 곳이에요. 서두르지 않아도 괜찮아요." },
        { id: "work-area", mapId: REBUILD_MAP_ID, position: workPosition, text: "저쪽에서는 가져온 재료를 다듬고 물건을 만들어요. 재료를 직접 구하지 않아도 다른 길이 생길 거예요." },
        { id: "exploration-path", mapId: REBUILD_MAP_ID, position: offsetPosition(BASE_LAYOUT.explorationPath, startX, startZ, startFlatY), text: "이 길 너머에는 탐험할 곳이 있어요. 지금 가도 되고, 동네를 더 둘러본 뒤 가도 돼요." },
      ],
      guides: BASE_LAYOUT.guideOrigins.map((guide) => ({
        id: guide.id,
        name: guide.name,
        coatColor: guide.coatColor,
        origin: offsetPosition(guide.position, startX, startZ, startFlatY),
      })),
      routes: {
        arrival: groundRoute(BASE_LAYOUT.tourRoutes.arrival),
        legs: Object.fromEntries(Object.entries(BASE_LAYOUT.tourRoutes.legs).map(([id, points]) => [id, groundRoute(points)])),
        returns: Object.fromEntries(Object.entries(BASE_LAYOUT.tourRoutes.returns).map(([id, points]) => [id, groundRoute(points)])),
      },
    },
  };
}
