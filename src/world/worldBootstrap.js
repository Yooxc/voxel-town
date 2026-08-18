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
}) {
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

  spawnTreesAndRocks();
  buildMinePerimeterCliffs({ scene, addCollider, startX, startZ });
  buildStartZoneWall();
  const startStall = buildStartStall();
  registerSupportSurface(startStall.top);

  const pickaxe = makePickaxe(startX + 0.8, startZ - 2.8, startFlatY, { x: Math.PI / 2, y: Math.PI * 0.04, z: 0 }, 1);
  restPropOnSupport(pickaxe, startStall.top);
  enableDynamicProp(pickaxe, { sleeping: true });
  registerPickupItem(pickaxe, "pickaxe", "E : 곡괭이 줍기");

  const safetyHelmet = makeSafetyHelmet(startX - 1.15, startZ - 2.62, startFlatY, { x: 0, y: Math.PI * -0.12, z: Math.PI * 0.02 });
  restPropOnSupport(safetyHelmet, startStall.top);
  enableDynamicProp(safetyHelmet, { sleeping: true });
  registerPickupItem(safetyHelmet, "safetyHelmet", "E : 안전모 줍기");

  const airCanLeft = buildFreshAirCanisterModel();
  airCanLeft.position.set(startX - 0.18, startFlatY, startZ - 2.88);
  airCanLeft.rotation.set(0, Math.PI * 0.12, 0.08);
  scene.add(airCanLeft);
  restPropOnSupport(airCanLeft, startStall.top);
  enableDynamicProp(airCanLeft, { sleeping: true });
  registerPickupItem(airCanLeft, "freshAirCanister", "E : 신선한 공기 캔 줍기");

  const airCanRight = buildFreshAirCanisterModel();
  airCanRight.position.set(startX - 0.52, startFlatY, startZ - 2.42);
  airCanRight.rotation.set(0, Math.PI * -0.08, -0.05);
  scene.add(airCanRight);
  restPropOnSupport(airCanRight, startStall.top);
  enableDynamicProp(airCanRight, { sleeping: true });
  registerPickupItem(airCanRight, "freshAirCanister", "E : 신선한 공기 캔 줍기");

  const basicShoes = makeBasicShoes(startX + 0.18, startZ - 2.5, startFlatY, { x: 0, y: Math.PI * 0.08, z: 0 });
  restPropOnSupport(basicShoes, startStall.top);
  enableDynamicProp(basicShoes, { sleeping: true });
  registerPickupItem(basicShoes, "basicShoes", "E : 기본신발 줍기");

  const shovel = makeShovel(startX + 1.3, startZ - 2.44, startFlatY, { x: Math.PI / 2, y: Math.PI * -0.08, z: 0 });
  restPropOnSupport(shovel, startStall.top);
  enableDynamicProp(shovel, { sleeping: true });
  registerPickupItem(shovel, "shovel", "E : 삽 줍기");

  makeTutorialNpc(startX, startZ - 5.15, 0);
  const forgeStation = buildForgeAnvil(startX - 3.0, startZ + 1.55);
  const refineryStation = buildRefineryStation(forgeStation.position.x + 0.35, forgeStation.position.z + 3.65, startFlatY, Math.PI);
  buildNftExhibitBoard(forgeStation.position.x - 2.85, forgeStation.position.z - 2.45, Math.PI * 0.5);

  const signStartX = startX + 3.9;
  const signStartZ = startZ + 0.8;
  const signTexts = [
    "곡괭이 안전모 착용 필수!!!",
    "E키를 눌러 안전모와 곡괭이를 획득하세요",
    "I키를 눌러 인벤토리를 열고 클릭으로 아이템을 착용하세요",
  ];
  for (let i = 0; i < signTexts.length; i += 1) makeSign(signStartX, signStartZ + 2.25 * i, signTexts[i], -Math.PI / 2);

  const mineGate = buildTravelGate({ scene, x: startX, z: startZ - 51.2, rotationY: Math.PI, startFlatY });
  mineGate.userData.mapId = "광산";
  registerWalkableSurface("광산", mineGate.userData.walkSurface, 0.45);
  const { airPurifierStation } = buildCampTestArea({
    scene, groundSurfaces, registerWalkableSurface, registerCaveDarkMaterial, addCollider,
    buildAirPurifierStation, buildFreshAirCanisterModel, registerPickupItem, startFlatY, campMapX, campMapZ,
  });
  buildCavePollutionField();
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
    ...frontierArea,
  };
}
