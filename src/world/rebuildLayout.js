const REBUILD_MAP_ID = "광산";
const HILL_HEIGHT = 2.4;

function smoothstep(min, max, value) {
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

export function getRebuildTerrainHeight(x, z, origin = { x: 0, y: 0, z: 0 }) {
  const localX = x - origin.x;
  const localZ = z - origin.z;
  const hill = HILL_HEIGHT * smoothstep(-20, 10, localZ);
  const sideRidge = smoothstep(32, 46, Math.abs(localX)) * 2.6;
  const northRidge = smoothstep(33, 48, localZ) * 2.2;
  const southSides = smoothstep(7, 20, Math.abs(localX));
  const southRidge = smoothstep(40, 54, -localZ) * southSides * 1.8;
  return origin.y + hill + Math.max(sideRidge, northRidge, southRidge);
}

const BASE_LAYOUT = Object.freeze({
  origin: { x: 0, y: 0, z: 0 },
  arrival: {
    spawn: { x: 0, y: HILL_HEIGHT, z: 15.1, rotationY: Math.PI },
    door: { x: 0, y: HILL_HEIGHT, z: 18.2 },
  },
  welcomeArea: {
    anchor: { x: 7.1, y: HILL_HEIGHT, z: 10.2 },
    tree: { x: -6.2, y: HILL_HEIGHT + 1.35, z: 14.7 },
    bench: { x: -5.0, y: HILL_HEIGHT, z: 11.9 },
    resident: { x: 7.1, y: HILL_HEIGHT, z: 10.2 },
    guideMeeting: { x: 5.25, y: HILL_HEIGHT, z: 10.2 },
  },
  workArea: {
    stall: { x: -8.0, y: 0, z: -24.0 },
    approach: { x: -5.7, y: 0, z: -23.2 },
  },
  restArea: { approach: { x: -5.0, y: HILL_HEIGHT, z: 10.4 } },
  guideOrigins: [
    { id: "guide-1", name: "다온", coatColor: 0x58758a, position: { x: 11.0, y: 0, z: -21.0 } },
    { id: "guide-2", name: "소은", coatColor: 0x8a6658, position: { x: 14.0, y: 0, z: -24.0 } },
    { id: "guide-3", name: "유진", coatColor: 0x6d7f5a, position: { x: 10.8, y: 0, z: -27.5 } },
    { id: "guide-4", name: "하린", coatColor: 0x78628e, position: { x: 15.4, y: 0, z: -30.0 } },
  ],
  explorationPath: { x: 0.4, y: 0, z: -31.0 },
  miningArea: { x: 19.0, y: 0, z: -23.0 },
  miningDemo: {
    rockBounds: { minX: 16.5, maxX: 24.5, minZ: -28.5, maxZ: -19.5 },
  },
  generalMine: {
    entrance: { x: -11.5, y: 0, z: -27.5 },
    center: { x: -26.0, y: 0, z: -34.0 },
    pathPoints: [
      { x: -10.0, y: 0, z: -26.5 },
      { x: -14.0, y: 0, z: -21.5 },
      { x: -20.0, y: 0, z: -23.0 },
      { x: -23.0, y: 0, z: -28.0 },
      { x: -26.0, y: 0, z: -34.0 },
    ],
    rockBounds: { minX: -31.0, maxX: -21.0, minZ: -38.0, maxZ: -29.0 },
    initialRocks: [
      { x: -29.0, y: 0, z: -36.0, sizeIndex: 1 },
      { x: -25.5, y: 0, z: -36.8, sizeIndex: 0 },
      { x: -22.5, y: 0, z: -35.0, sizeIndex: 1 },
      { x: -29.5, y: 0, z: -32.3, sizeIndex: 0 },
      { x: -25.8, y: 0, z: -31.5, sizeIndex: 1 },
      { x: -22.2, y: 0, z: -30.5, sizeIndex: 0 },
    ],
  },
  market: {
    stalls: [
      {
        id: "materials", x: -8.0, y: 0, z: -24.0, accentColor: 0xc49a61,
        displayItems: [
          { id: "stone-sample", kind: "stone", color: 0x777b7c },
          { id: "wood-sample", kind: "wood", color: 0x8c603b },
        ],
      },
      {
        id: "craft", x: 0.2, y: 0, z: -27.0, accentColor: 0x6c8c9d,
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
        id: "living", x: 8.2, y: 0, z: -24.0, accentColor: 0x9d7664,
        displayItems: [
          { id: "small-pot", kind: "pot", color: 0x96705d },
          { id: "table-lamp", kind: "lamp", color: 0xe2c978 },
        ],
      },
    ],
    residents: [
      {
        id: "materials-resident", stallId: "materials", name: "도윤",
        x: -3.0, y: 0, z: -22.4, rotationY: -0.4, color: 0x727e6a,
        aboutText: "돌과 나무 같은 재료를 모아 두고 있어요. 직접 구해도 좋고, 다른 사람에게 구해도 괜찮아요.",
        displayText: "돌 조각과 나무 견본이 놓여 있어요. 같은 재료도 쓰는 사람에 따라 전혀 다른 물건이 됩니다.",
      },
      {
        id: "craft-resident", stallId: "craft", name: "세아",
        x: 3.4, y: 0, z: -25.5, rotationY: 2.6, color: 0x7b687f,
        aboutText: "가져온 재료를 다듬고 조합해 보고 있어요. 정해진 답보다 무엇을 만들지가 더 중요하죠.",
        displayText: "작은 상자와 작업 도구 견본이 보여요. 같은 재료로도 여러 가지 형태를 만들 수 있습니다.",
      },
      {
        id: "living-resident", stallId: "living", name: "라온",
        x: 10.5, y: 0, z: -22.5, rotationY: -1.8, color: 0x766850,
        aboutText: "머물 곳을 편하게 만드는 물건을 소개하고 있어요. 공간이 필요해질 때 천천히 시작하면 돼요.",
        displayText: "작은 화분과 조명이 놓여 있어요. 언젠가 자신만의 자리를 꾸밀 때 참고할 만합니다.",
      },
    ],
  },
  navigationObstacles: [
    { id: "arrival-door", type: "box", x: 0, z: 18.2, halfWidth: 1.55, halfDepth: 0.35 },
    { id: "welcome-tree", type: "circle", x: -6.2, z: 14.7, radius: 0.55 },
    { id: "welcome-bench", type: "box", x: -5, z: 11.9, halfWidth: 1.05, halfDepth: 0.55 },
    { id: "maru", type: "circle", x: 7.1, z: 10.2, radius: 0.58 },
    { id: "market-stall-1", type: "box", x: -8, z: -24, halfWidth: 1.7, halfDepth: 0.58 },
    { id: "market-stall-2", type: "box", x: 0.2, z: -27, halfWidth: 1.7, halfDepth: 0.58 },
    { id: "market-stall-3", type: "box", x: 8.2, z: -24, halfWidth: 1.7, halfDepth: 0.58 },
    { id: "market-resident-1", type: "circle", x: -3, z: -22.4, radius: 0.55 },
    { id: "market-resident-2", type: "circle", x: 3.4, z: -25.5, radius: 0.55 },
    { id: "market-resident-3", type: "circle", x: 10.5, z: -22.5, radius: 0.55 },
  ],
});

function offsetPosition(position, startX, startZ, startFlatY) {
  return { x: position.x + startX, y: position.y + startFlatY, z: position.z + startZ };
}

export function getRebuildLayout(startX = 0, startZ = 0, startFlatY = 0) {
  const restPosition = offsetPosition(BASE_LAYOUT.restArea.approach, startX, startZ, startFlatY);
  const workPosition = offsetPosition(BASE_LAYOUT.workArea.approach, startX, startZ, startFlatY);
  return {
    mapId: REBUILD_MAP_ID,
    origin: offsetPosition(BASE_LAYOUT.origin, startX, startZ, startFlatY),
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
    miningArea: offsetPosition(BASE_LAYOUT.miningArea, startX, startZ, startFlatY),
    miningDemo: {
      rockBounds: {
        minX: BASE_LAYOUT.miningDemo.rockBounds.minX + startX,
        maxX: BASE_LAYOUT.miningDemo.rockBounds.maxX + startX,
        minZ: BASE_LAYOUT.miningDemo.rockBounds.minZ + startZ,
        maxZ: BASE_LAYOUT.miningDemo.rockBounds.maxZ + startZ,
      },
    },
    generalMine: {
      entrance: offsetPosition(BASE_LAYOUT.generalMine.entrance, startX, startZ, startFlatY),
      center: offsetPosition(BASE_LAYOUT.generalMine.center, startX, startZ, startFlatY),
      pathPoints: BASE_LAYOUT.generalMine.pathPoints.map((point) => offsetPosition(point, startX, startZ, startFlatY)),
      rockBounds: {
        minX: BASE_LAYOUT.generalMine.rockBounds.minX + startX,
        maxX: BASE_LAYOUT.generalMine.rockBounds.maxX + startX,
        minZ: BASE_LAYOUT.generalMine.rockBounds.minZ + startZ,
        maxZ: BASE_LAYOUT.generalMine.rockBounds.maxZ + startZ,
      },
      initialRocks: BASE_LAYOUT.generalMine.initialRocks.map((rock) => ({
        ...rock,
        ...offsetPosition(rock, startX, startZ, startFlatY),
      })),
    },
    market: {
      stalls: BASE_LAYOUT.market.stalls.map((stall) => ({ ...stall, ...offsetPosition(stall, startX, startZ, startFlatY) })),
      residents: BASE_LAYOUT.market.residents.map((resident) => ({ ...resident, ...offsetPosition(resident, startX, startZ, startFlatY) })),
    },
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
    },
  };
}
