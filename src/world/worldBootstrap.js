import { createWelcomeArea } from "./welcomeArea.js";
import { createTourGuides } from "./tourGuide.js";
import { getRebuildLayout } from "./rebuildLayout.js";
import { createRebuildBlockout } from "./rebuildBlockout.js";
import { createRebuildMine } from "./rebuildMine.js";

export function bootstrapWorld({
  scene,
  groundSurfaces,
  interactables,
  addCollider,
  registerWalkableSurface,
  registerSupportSurface,
  registerCaveDarkMaterial,
  registerResidenceMapZone,
  registerMapGate,
  registerTutorialNpc,
  makeTree,
  makeRock,
  makePickaxe,
  makeSafetyHelmet,
  makeBasicShoes,
  makeShovel,
  makeTutorialNpc,
  makeSign,
  buildStartZoneWall,
  buildStartStall,
  buildMinePerimeterCliffs,
  buildForgeAnvil,
  buildRefineryStation,
  buildNftExhibitBoard,
  buildFreshAirCanisterModel,
  buildAirPurifierStation,
  buildTravelGate,
  buildCampTestArea,
  buildCavePollutionField,
  buildMapConnectorTunnel,
  buildTunnelFence,
  buildFrontierArea,
  buildFrontierBuildingSign,
  rebuildFrontierParcelConstructionVisual,
  renderResidenceNoticeBoard,
  registerPickupItem,
  restPropOnSupport,
  enableDynamicProp,
  createTreeSpawnPositions,
  createRockSpawnPlans,
  findRockSpawnPosition,
  findCampStoneSpawnPosition,
  getCaveMasonryRockOptions,
  randomRange,
  rockCount,
  caveStoneCount,
  rockSizeDefs,
  groundSize,
  frontierGroundSize,
  startX,
  startZ,
  startFlatY,
  campMapX,
  campMapZ,
  frontierMapX,
  frontierMapZ,
  frontierParcelBorderColor,
  residenceNoticeBoardVisuals,
  inventory,
  welcomeAreaEnabled = false,
  rebuildBlockoutEnabled = false,
}) {
  const rebuildLayout = getRebuildLayout(startX, startZ, startFlatY);
  const spawnTreesAndRocks = () => {
    const half = groundSize / 2;
    const margin = 6;
    const minX = -half + margin;
    const maxX = half - margin;
    const minZ = -half + margin;
    const maxZ = half - margin;
    const safeRadius = 8;

    for (const position of createTreeSpawnPositions({
      count: 20, minX, maxX, minZ, maxZ, safeRadius, maxAttempts: 30, randomRange,
    })) makeTree(position.x, position.z);

    for (const rockSizeDef of createRockSpawnPlans(rockCount, rockSizeDefs, Math.random)) {
      const spawnPos = findRockSpawnPosition(rockSizeDef.scale, 120);
      if (spawnPos) makeRock(spawnPos.x, spawnPos.z, rockSizeDef);
    }
  };

  const spawnCaveMasonryRocks = () => {
    for (const rockSizeDef of createRockSpawnPlans(caveStoneCount, rockSizeDefs, Math.random)) {
      const spawnPos = findCampStoneSpawnPosition(rockSizeDef.scale, 140);
      if (spawnPos) makeRock(spawnPos.x, spawnPos.z, rockSizeDef, false, getCaveMasonryRockOptions(rockSizeDef));
    }
  };

  const rebuildBlockout = rebuildBlockoutEnabled
    ? createRebuildBlockout({
      scene, groundSurfaces, registerWalkableSurface, addCollider,
      registerNpc: registerTutorialNpc,
      layout: rebuildLayout,
    })
    : null;
  const rebuildMine = rebuildBlockoutEnabled
    ? createRebuildMine({ scene, groundSurfaces, registerWalkableSurface, addCollider, layout: rebuildLayout })
    : null;
  if (!rebuildBlockoutEnabled) spawnTreesAndRocks();
  if (!rebuildBlockoutEnabled) buildMinePerimeterCliffs({ scene, addCollider, startX, startZ });
  if (!rebuildBlockoutEnabled) buildStartZoneWall();
  const startStall = rebuildBlockoutEnabled
    ? { group: rebuildBlockout.marketStalls[0].root, top: rebuildBlockout.marketStalls[0].counter }
    : buildStartStall(welcomeAreaEnabled ? rebuildLayout.workArea.stall : null);
  registerSupportSurface(startStall.top);

  const welcomeArea = welcomeAreaEnabled
    ? createWelcomeArea({
      scene,
      addCollider,
      registerNpc: registerTutorialNpc,
      x: rebuildLayout.welcomeArea.anchor.x,
      y: rebuildLayout.welcomeArea.anchor.y,
      z: rebuildLayout.welcomeArea.anchor.z,
      layout: rebuildLayout.welcomeArea,
    })
    : null;
  const tourGuides = welcomeAreaEnabled
    ? createTourGuides({
      scene,
      registerNpc: registerTutorialNpc,
      addCollider,
      startX,
      startZ,
      startFlatY,
      layout: rebuildLayout,
    })
    : [];

  const pickupOrigin = rebuildBlockoutEnabled ? rebuildLayout.workArea.stall : { x: startX, y: startFlatY, z: startZ };
  const pickaxe = makePickaxe(pickupOrigin.x + 0.8, pickupOrigin.z - 0.2, pickupOrigin.y, { x: Math.PI / 2, y: Math.PI * 0.04, z: 0 }, 1);
  restPropOnSupport(pickaxe, startStall.top);
  enableDynamicProp(pickaxe, { sleeping: true });
  registerPickupItem(
    pickaxe,
    "pickaxe",
    rebuildBlockoutEnabled ? "E : 기본 곡괭이 받기" : "E : 곡괭이 줍기",
    rebuildBlockoutEnabled ? { kind: "starter-pickaxe", persistent: true } : {},
  );

  const safetyHelmet = makeSafetyHelmet(pickupOrigin.x - 1.15, pickupOrigin.z - 0.15, pickupOrigin.y, { x: 0, y: Math.PI * -0.12, z: Math.PI * 0.02 });
  restPropOnSupport(safetyHelmet, startStall.top);
  enableDynamicProp(safetyHelmet, { sleeping: true });
  registerPickupItem(safetyHelmet, "safetyHelmet", "E : 안전모 줍기");

  const airCanLeft = buildFreshAirCanisterModel();
  airCanLeft.position.set(pickupOrigin.x - 0.18, pickupOrigin.y, pickupOrigin.z - 0.28);
  airCanLeft.rotation.set(0, Math.PI * 0.12, 0.08);
  scene.add(airCanLeft);
  restPropOnSupport(airCanLeft, startStall.top);
  enableDynamicProp(airCanLeft, { sleeping: true });
  registerPickupItem(airCanLeft, "freshAirCanister", "E : 신선한 공기 캔 줍기");

  const airCanRight = buildFreshAirCanisterModel();
  airCanRight.position.set(pickupOrigin.x - 0.52, pickupOrigin.y, pickupOrigin.z + 0.18);
  airCanRight.rotation.set(0, Math.PI * -0.08, -0.05);
  scene.add(airCanRight);
  restPropOnSupport(airCanRight, startStall.top);
  enableDynamicProp(airCanRight, { sleeping: true });
  registerPickupItem(airCanRight, "freshAirCanister", "E : 신선한 공기 캔 줍기");

  const basicShoes = makeBasicShoes(pickupOrigin.x + 0.18, pickupOrigin.z + 0.18, pickupOrigin.y, { x: 0, y: Math.PI * 0.08, z: 0 });
  restPropOnSupport(basicShoes, startStall.top);
  enableDynamicProp(basicShoes, { sleeping: true });
  registerPickupItem(basicShoes, "basicShoes", "E : 기본신발 줍기");

  const shovel = makeShovel(pickupOrigin.x + 1.3, pickupOrigin.z + 0.22, pickupOrigin.y, { x: Math.PI / 2, y: Math.PI * -0.08, z: 0 });
  restPropOnSupport(shovel, startStall.top);
  enableDynamicProp(shovel, { sleeping: true });
  registerPickupItem(shovel, "shovel", "E : 삽 줍기");

  if (!rebuildBlockoutEnabled) makeTutorialNpc(startX, startZ - 5.15, 0);
  const facilityOrigin = rebuildBlockoutEnabled
    ? rebuildLayout.facilityAnchors.forge
    : { x: startX - 3.0, y: startFlatY, z: startZ + 1.55 };
  const forgeStation = buildForgeAnvil(facilityOrigin.x, facilityOrigin.z);
  const refineryPosition = rebuildBlockoutEnabled ? rebuildLayout.facilityAnchors.refinery : {
    x: forgeStation.position.x + 3.25, y: facilityOrigin.y, z: forgeStation.position.z,
  };
  const nftBoardPosition = rebuildBlockoutEnabled ? rebuildLayout.facilityAnchors.nftBoard : {
    x: forgeStation.position.x - 2.35, y: facilityOrigin.y, z: forgeStation.position.z - 2.55,
  };
  const refineryStation = buildRefineryStation(refineryPosition.x, refineryPosition.z, refineryPosition.y, Math.PI);
  buildNftExhibitBoard(nftBoardPosition.x, nftBoardPosition.z, Math.PI * 0.5);

  const signStartX = rebuildBlockoutEnabled ? -13.1 : startX + 3.9;
  const signStartZ = rebuildBlockoutEnabled ? -8.2 : startZ + 0.8;
  const signTexts = [
    "곡괭이 안전모 착용 필수!!!",
    "E키를 눌러 안전모와 곡괭이를 획득하세요",
    "I키를 눌러 인벤토리를 열고 클릭으로 아이템을 착용하세요",
  ];
  if (!rebuildBlockoutEnabled) {
    for (let i = 0; i < signTexts.length; i += 1) makeSign(signStartX, signStartZ + 2.25 * i, signTexts[i], -Math.PI / 2);
  } else {
    makeSign(pickupOrigin.x - 2.4, pickupOrigin.z + 0.6, "첫 작업 도구 지원", Math.PI * 0.5);
  }

  const mineGate = buildTravelGate({ scene, x: startX, z: startZ - 51.2, rotationY: Math.PI, startFlatY });
  mineGate.userData.mapId = "광산";
  registerWalkableSurface("광산", mineGate.userData.walkSurface, 0.45);
  const { airPurifierStation } = buildCampTestArea({
    scene, groundSurfaces, registerWalkableSurface, registerCaveDarkMaterial, addCollider,
    buildAirPurifierStation, buildFreshAirCanisterModel, registerPickupItem, startFlatY, campMapX, campMapZ,
  });
  buildCavePollutionField();
  if (rebuildBlockoutEnabled) {
    makeRock(rebuildLayout.miningArea.x, rebuildLayout.miningArea.z, rockSizeDefs[1], false, {
      respawnRegion: "village-demo",
      groundY: rebuildLayout.miningArea.y,
    });
    makeRock(rebuildLayout.miningArea.x + 3.1, rebuildLayout.miningArea.z - 2.3, rockSizeDefs[0], false, {
      respawnRegion: "village-demo",
      groundY: rebuildLayout.miningArea.y,
    });
    for (const spawn of rebuildLayout.generalMine.initialRocks) {
      const rockSizeDef = rockSizeDefs[spawn.sizeIndex] ?? rockSizeDefs[0];
      const position = findRockSpawnPosition(rockSizeDef.scale, 120, "general-mine");
      if (!position) continue;
      makeRock(position.x, position.z, rockSizeDef, false, {
        respawnRegion: "general-mine",
        groundY: position.y ?? 0,
      });
    }
  }
  spawnCaveMasonryRocks();
  const campGate = buildTravelGate({ scene, x: campMapX, z: campMapZ + groundSize * 0.5 + 1.25, rotationY: 0, startFlatY });
  campGate.userData.mapId = "폐광";
  registerWalkableSurface("폐광", campGate.userData.walkSurface, 0.45);
  buildMapConnectorTunnel(mineGate, campGate);

  const frontierArea = buildFrontierArea({
    scene, groundSurfaces, interactables, registerWalkableSurface, addCollider, makeSign,
    rebuildFrontierParcelConstructionVisual, buildAirPurifierStation, buildFrontierBuildingSign,
    registerResidenceMapZone, renderResidenceNoticeBoard, residenceNoticeBoardVisuals,
    frontierParcelBorderColor, startFlatY, frontierMapX, frontierMapZ,
  });
  for (const parcel of frontierArea.frontierParcelDefs) rebuildFrontierParcelConstructionVisual(parcel.label);

  const frontierCampGate = buildTravelGate({ scene, x: campMapX, z: campMapZ - groundSize * 0.5 - 1.25, rotationY: Math.PI, startFlatY });
  frontierCampGate.userData.mapId = "폐광";
  registerWalkableSurface("폐광", frontierCampGate.userData.walkSurface, 0.45);
  const frontierGate = buildTravelGate({ scene, x: frontierMapX, z: frontierMapZ + frontierGroundSize * 0.5 + 1.25, rotationY: 0, startFlatY });
  frontierGate.userData.mapId = "개척지";
  registerWalkableSurface("개척지", frontierGate.userData.walkSurface, 0.45);
  buildMapConnectorTunnel(frontierCampGate, frontierGate);

  const abandonedMineGate = registerMapGate({
    mapId: "광산", targetMapId: "폐광", require: () => inventory.abandonedMineUnlocked,
    unlockWithItem: "abandonedMineKey", unlockFlag: "abandonedMineUnlocked",
    unlockText: "폐광 입구의 잠금이 해제되었습니다.", denyText: "감독관에게서 폐광 열쇠를 받아야 합니다.",
    trigger: { x: mineGate.position.x, z: mineGate.position.z + 0.95, width: 10.6, depth: 2.4 },
    hint: "북쪽 갱도로 들어가면 폐광으로 이어집니다",
  });
  const mineGateFence = buildTunnelFence(mineGate.position.x, mineGate.position.z + 0.95, 10.2, 0);
  abandonedMineGate.lockBlocker = mineGateFence;
  abandonedMineGate.lockColliderIndex = addCollider(mineGateFence, 1.0);
  registerMapGate({ mapId: "폐광", targetMapId: "개척지", trigger: { x: frontierCampGate.position.x, z: frontierCampGate.position.z - 1.2, width: 10.6, depth: 2.6 }, hint: "북쪽 통로를 지나면 개척지로 이어집니다" });
  registerMapGate({ mapId: "개척지", targetMapId: "폐광", trigger: { x: frontierGate.position.x, z: frontierGate.position.z + 1.2, width: 10.6, depth: 2.6 }, hint: "남쪽 통로를 지나면 폐광으로 돌아갑니다" });

  return {
    forgeStation,
    refineryStation,
    airPurifierStation,
    mineGate,
    campGate,
    frontierCampGate,
    frontierGate,
    abandonedMineGate,
    welcomeArea,
    rebuildBlockout,
    rebuildMine,
    marketResidents: rebuildBlockout?.marketResidents ?? [],
    activityLocations: welcomeAreaEnabled ? rebuildLayout.activityLocations : [],
    tourGuide: tourGuides[0] ?? null,
    tourGuides,
    ...frontierArea,
  };
}
