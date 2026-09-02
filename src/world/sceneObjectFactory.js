import * as THREE from "three";
import { createAirPurifierModel } from "./airPurifierModel.js";
import { createForgeAnvilModel } from "./forgeAnvilModel.js";
import { createNftExhibitBoardModel } from "./nftExhibitBoardModel.js";
import { createPickupBasicShoes, createPickupPickaxe, createPickupSafetyHelmet, createPickupShovel } from "./pickupEquipmentModels.js";
import { createMineRockModel, createHarvestTreeModel } from "./resourceModels.js";
import { createRefineryModel } from "./refineryModel.js";
import { createHouseModel, createSignModel, createTutorialNpcModel } from "./startAreaModels.js";
import { createTunnelFenceModel } from "./tunnelFenceModel.js";

export function createSceneObjectFactory({
  scene,
  groundSurfaces,
  interactables,
  addCollider,
  registerWalkableSurface,
  registerConnectorTunnelZone,
  registerTutorialNpc,
  registerHarvestTree,
  registerMineRock,
  registerCaveDarkMaterial,
  setNftScreenMaterial,
  refreshNftExhibitBoard,
  scheduleNftExhibitBoardRefresh,
  buildPickaxeModel,
  buildShovelModel,
  buildSafetyHelmetModel,
  buildBasicShoesModel,
  buildPurifyPowderModel,
  getRockDefaultResourceCount,
  getRockSizeDefById,
  rockSizeDefs,
  findMineRockSpawnPosition,
  findCaveRockSpawnPosition,
  randomRange,
  startZone,
  startFlatY,
}) {
  const buildStartZoneWall = () => {
    if (!startZone.wallOn) return;
    const material = startZone.wallVisible
      ? new THREE.MeshStandardMaterial({ color: 0xbec3c8, roughness: 0.9, metalness: 0, transparent: true, opacity: 0.82 })
      : new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    const openAngle = Math.PI * 2 * startZone.openRatio;
    const solidStart = startZone.openCenter + openAngle * 0.5;
    const solidEnd = solidStart + (Math.PI * 2 - openAngle);
    const outerRadius = startZone.radius + startZone.thickness * 0.5;
    const innerRadius = Math.max(0.2, startZone.radius - startZone.thickness * 0.5);
    const shape = new THREE.Shape();
    shape.moveTo(Math.cos(solidStart) * outerRadius, Math.sin(solidStart) * outerRadius);
    shape.absarc(0, 0, outerRadius, solidStart, solidEnd, false);
    shape.lineTo(Math.cos(solidEnd) * innerRadius, Math.sin(solidEnd) * innerRadius);
    shape.absarc(0, 0, innerRadius, solidEnd, solidStart, true);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: startZone.height, steps: 1, bevelEnabled: false, curveSegments: 72 });
    geometry.rotateX(-Math.PI / 2);
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(startZone.x, startFlatY + 0.05, startZone.z);
    scene.add(wall);
    return wall;
  };

  const buildStartStall = () => {
    const group = new THREE.Group();
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.95 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.25, 1.8), woodMaterial);
    top.position.y = 1.05;
    group.add(top);
    const legGeometry = new THREE.BoxGeometry(0.18, 1, 0.18);
    for (const [x, y, z] of [[-3, 0.5, -0.75], [3, 0.5, -0.75], [-3, 0.5, 0.75], [3, 0.5, 0.75]]) {
      const leg = new THREE.Mesh(legGeometry, woodMaterial);
      leg.position.set(x, y, z);
      group.add(leg);
    }
    group.position.set(startZone.x, startFlatY, startZone.z - 2.3);
    scene.add(group);
    addCollider(group, 1);
    return { group, top };
  };

  const makeHouse = (x, z) => {
    const { group, collider } = createHouseModel(x, z);
    scene.add(group);
    addCollider(collider, 1);
    return group;
  };

  const makeTree = (x, z) => {
    const { tree, trunk } = createHarvestTreeModel(x, z);
    scene.add(tree);
    trunk.updateWorldMatrix(true, true);
    addCollider(trunk, 0.75);
    return registerHarvestTree(tree);
  };

  const makeRock = (x, z, rockSizeDef = rockSizeDefs[1], fadeIn = false, options = {}) => {
    const defaultResourceCount = getRockDefaultResourceCount(rockSizeDef, options);
    const rock = createMineRockModel(x, z, rockSizeDef, fadeIn, options, { defaultResourceCount, randomRange });
    scene.add(rock);
    rock.userData.colliderIndex = addCollider(rock, 0.85);
    return registerMineRock(rock);
  };

  const createRespawnRockFromSpawn = (spawn) => {
    const rockSizeDef = getRockSizeDefById(spawn?.rockSize, rockSizeDefs)
      ?? rockSizeDefs[Math.floor(Math.random() * rockSizeDefs.length)];
    const position = spawn?.mapId === "폐광"
      ? findCaveRockSpawnPosition(rockSizeDef.scale, 120)
      : findMineRockSpawnPosition(rockSizeDef.scale, 120);
    if (!position) return null;
    return makeRock(position.x, position.z, rockSizeDef, true, {
      mapId: spawn?.mapId,
      resourceItemId: spawn?.resourceItemId,
      requiredPickaxeLevel: spawn?.requiredPickaxeLevel,
      color: spawn?.color,
      detail: spawn?.detail,
      maxHp: spawn?.maxHp,
      bonusDropEnabled: spawn?.resourceItemId === "stoneDust",
      hpLabelPrefix: spawn?.resourceItemId === "masonryStone" ? "석재 돌 체력" : "돌 체력",
    });
  };

  const makePickaxe = (x, z, y = 0, rotation = null, level = 1) => addToScene(createPickupPickaxe({ buildPickaxeModel, x, z, y, rotation, level }));
  const makeShovel = (x, z, y = 0, rotation = null) => addToScene(createPickupShovel({ buildShovelModel, x, z, y, rotation }));
  const makeSafetyHelmet = (x, z, y = 0, rotation = null) => addToScene(createPickupSafetyHelmet({ buildSafetyHelmetModel, x, z, y, rotation }));
  const makeBasicShoes = (x, z, y = 0, rotation = null) => addToScene(createPickupBasicShoes({ buildBasicShoesModel, x, z, y, rotation }));

  const makeSign = (x, z, text, rotationY = 0) => {
    const { group, board, collider } = createSignModel();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;
    scene.add(group);
    group.userData.colliderIndex = addCollider(collider, 1);
    interactables.push({ obj: group, text, board });
    return group;
  };

  const makeTutorialNpc = (x, z, rotationY = 0) => {
    const { group, collider } = createTutorialNpcModel();
    group.position.set(x, startFlatY, z);
    group.rotation.y = rotationY;
    scene.add(group);
    group.userData.colliderIndex = addCollider(collider, 1);
    registerTutorialNpc(group, "작업 감독관");
    return group;
  };

  const buildForgeAnvil = (x, z) => addToSceneAt(createForgeAnvilModel(), x, startFlatY, z, 0, 0.95);

  const buildNftExhibitBoard = (x, z, rotationY = Math.PI * 0.5) => {
    const { group, frame, screenMaterial } = createNftExhibitBoardModel();
    group.position.set(x, startFlatY + 0.22, z);
    group.rotation.y = rotationY;
    scene.add(group);
    addCollider(group, 0.88);
    interactables.push({ obj: group, text: "E : NFT 전시", board: frame, type: "nftBoard" });
    setNftScreenMaterial(screenMaterial);
    void refreshNftExhibitBoard();
    scheduleNftExhibitBoardRefresh();
    return group;
  };

  const buildAirPurifierStation = (x, z, rotationY = Math.PI, mapId = "폐광") => {
    const { group, chamber } = createAirPurifierModel(registerCaveDarkMaterial);
    group.position.set(x, startFlatY, z);
    group.rotation.y = rotationY;
    scene.add(group);
    addCollider(group, 0.92);
    interactables.push({ obj: group, text: "E : 공기 정화탑 가동", board: chamber, type: "airPurifier", purifierMapId: mapId });
    return group;
  };

  const buildRefineryStation = (x, z, y = startFlatY, rotationY = 0) => {
    const { group, collider, grinderCore } = createRefineryModel(buildPurifyPowderModel);
    group.position.set(x, y, z);
    group.rotation.y = rotationY;
    scene.add(group);
    addCollider(collider, 1);
    interactables.push({ obj: group, text: "E : 재련소 사용", board: grinderCore, highlightKind: "none", type: "refinery" });
    return group;
  };

  const buildTunnelFence = (x, z, width, rotationY = 0) => addToSceneAt(createTunnelFenceModel(width), x, startFlatY, z, rotationY);

  const buildMapConnectorTunnel = (startGate, endGate) => {
    const centerX = (startGate.position.x + endGate.position.x) * 0.5;
    const minZ = Math.min(startGate.position.z, endGate.position.z) - 1.2;
    const maxZ = Math.max(startGate.position.z, endGate.position.z) + 1.2;
    const length = maxZ - minZ;
    const centerZ = (minZ + maxZ) * 0.5;
    const tunnelWidth = 10.8;
    const curbOffset = tunnelWidth * 0.5 - 0.12;
    const addSurface = (surface, mapId, clearance) => {
      scene.add(surface);
      groundSurfaces.push(surface);
      registerWalkableSurface(mapId, surface, clearance);
    };
    const floor = new THREE.Mesh(new THREE.BoxGeometry(tunnelWidth, 0.14, length), new THREE.MeshStandardMaterial({ color: 0x706455, roughness: 0.98 }));
    floor.position.set(centerX, 0.07, centerZ);
    addSurface(floor, startGate.userData.mapId, 0.38);
    registerWalkableSurface(endGate.userData.mapId, floor, 0.38);
    const mineTransition = new THREE.Mesh(new THREE.BoxGeometry(tunnelWidth + 0.9, 0.12, 3.2), new THREE.MeshStandardMaterial({ color: 0x7b6f63, roughness: 0.98 }));
    mineTransition.position.set(startGate.position.x, 0.06, startGate.position.z + 1.55);
    addSurface(mineTransition, startGate.userData.mapId, 0.4);
    const campTransition = new THREE.Mesh(new THREE.BoxGeometry(tunnelWidth + 0.9, 0.12, 3.4), new THREE.MeshStandardMaterial({ color: 0x342a22, roughness: 0.99 }));
    campTransition.position.set(endGate.position.x, 0.06, endGate.position.z - 1.6);
    addSurface(campTransition, endGate.userData.mapId, 0.4);
    const curbMaterial = new THREE.MeshStandardMaterial({ color: 0x4e4032, roughness: 0.98 });
    const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, length), curbMaterial);
    leftCurb.position.set(centerX - curbOffset, 0.18, centerZ);
    scene.add(leftCurb);
    const rightCurb = leftCurb.clone();
    rightCurb.position.x = centerX + curbOffset;
    scene.add(rightCurb);
    const sideBermHeight = 6.4;
    const bermGeometry = createBermGeometry(4.6, length, Math.max(1.8, 4.6 * 0.48), Math.max(6, length - 1.2), sideBermHeight);
    const bermMaterial = new THREE.MeshStandardMaterial({ color: 0x6d5e4f, roughness: 0.98 });
    const leftBerm = new THREE.Mesh(bermGeometry, bermMaterial);
    leftBerm.position.set(centerX - (tunnelWidth * 0.5 + 4.6 * 0.42), sideBermHeight * 0.5 - 0.4, centerZ);
    scene.add(leftBerm);
    addCollider(leftBerm, 1);
    const rightBerm = leftBerm.clone();
    rightBerm.position.x = centerX + (tunnelWidth * 0.5 + 4.6 * 0.42);
    scene.add(rightBerm);
    addCollider(rightBerm, 1);
    registerConnectorTunnelZone(centerX, minZ, maxZ, 7.2);
  };

  function addToScene(object) {
    scene.add(object);
    return object;
  }

  function addToSceneAt(object, x, y, z, rotationY = 0, colliderShrink = null) {
    object.position.set(x, y, z);
    object.rotation.y = rotationY;
    scene.add(object);
    if (colliderShrink != null) addCollider(object, colliderShrink);
    return object;
  }

  return {
    buildStartZoneWall,
    buildStartStall,
    makeHouse,
    makeTree,
    makeRock,
    createRespawnRockFromSpawn,
    makePickaxe,
    makeShovel,
    makeSafetyHelmet,
    makeBasicShoes,
    makeSign,
    makeTutorialNpc,
    buildForgeAnvil,
    buildNftExhibitBoard,
    buildAirPurifierStation,
    buildRefineryStation,
    buildTunnelFence,
    buildMapConnectorTunnel,
  };
}

function createBermGeometry(bottomX, bottomZ, topX, topZ, height) {
  const bx = bottomX * 0.5;
  const bz = bottomZ * 0.5;
  const tx = topX * 0.5;
  const tz = topZ * 0.5;
  const y0 = -height * 0.5;
  const y1 = height * 0.5;
  const vertices = [-bx, y0, -bz, bx, y0, -bz, bx, y0, bz, -bx, y0, bz, -tx, y1, -tz, tx, y1, -tz, tx, y1, tz, -tx, y1, tz];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0]);
  geometry.computeVertexNormals();
  return geometry;
}
