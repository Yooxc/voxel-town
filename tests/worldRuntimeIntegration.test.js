import test from "node:test";
import assert from "node:assert/strict";
import { createWorldRuntimeIntegration } from "../src/world/worldRuntimeIntegration.js";

test("creates scene objects before bootstrapping the world", () => {
  const calls = [];
  const result = createWorldRuntimeIntegration({
    sceneFactoryOptions: {
      scene: { add() {} },
      groundSurfaces: [],
      interactables: [],
      addCollider: () => {},
      registerWalkableSurface: () => {},
      registerConnectorTunnelZone: () => {},
      registerTutorialNpc: () => {},
      registerHarvestTree: () => {},
      registerMineRock: () => {},
      registerCaveDarkMaterial: () => {},
      setNftScreenMaterial: () => {},
      refreshNftExhibitBoard: () => {},
      scheduleNftExhibitBoardRefresh: () => {},
      buildPickaxeModel: () => {}, buildShovelModel: () => {}, buildSafetyHelmetModel: () => {},
      buildBasicShoesModel: () => {}, buildPurifyPowderModel: () => {},
      getRockDefaultResourceCount: () => 1, getRockSizeDefById: () => ({}), rockSizeDefs: [],
      findMineRockSpawnPosition: () => null, findCaveRockSpawnPosition: () => null,
      randomRange: () => 0, startZone: {}, startFlatY: 0,
    },
    sceneObjectFactoryFactory: () => ({ makeTree() {}, makeRock() {} }),
    worldBootstrapFactory: (options) => ({ sceneFactory: calls.push(options) }),
    createWorldBootstrapOptions: (factory) => {
      calls.push(factory);
      return {
        scene: { add() {} }, groundSurfaces: [], interactables: [], addCollider: () => {},
        registerWalkableSurface: () => {}, registerSupportSurface: () => {}, registerCaveDarkMaterial: () => {},
        registerResidenceMapZone: () => {}, registerMapGate: () => {},
        makeTree: () => {}, makeRock: () => {}, makePickaxe: () => {}, makeSafetyHelmet: () => {},
        makeBasicShoes: () => {}, makeShovel: () => {}, makeTutorialNpc: () => {}, makeSign: () => {},
        buildStartZoneWall: () => {}, buildStartStall: () => {}, buildMinePerimeterCliffs: () => {},
        buildForgeAnvil: () => {}, buildRefineryStation: () => {}, buildNftExhibitBoard: () => {},
        buildFreshAirCanisterModel: () => {}, buildAirPurifierStation: () => {}, buildTravelGate: () => {},
        buildCampTestArea: () => {}, buildCavePollutionField: () => {}, buildMapConnectorTunnel: () => {},
        buildTunnelFence: () => {}, buildFrontierArea: () => {}, buildFrontierBuildingSign: () => {},
        rebuildFrontierParcelConstructionVisual: () => {}, renderResidenceNoticeBoard: () => {},
        registerPickupItem: () => {}, restPropOnSupport: () => {}, enableDynamicProp: () => {},
        createTreeSpawnPositions: () => [], createRockSpawnPlans: () => [], findRockSpawnPosition: () => null,
        findCampStoneSpawnPosition: () => null, getCaveMasonryRockOptions: () => ({}), randomRange: () => 0,
        rockCount: 0, caveStoneCount: 0, rockSizeDefs: [], groundSize: 10, frontierGroundSize: 10,
        startX: 0, startZ: 0, startFlatY: 0, campMapX: 0, campMapZ: 0, frontierMapX: 0,
        frontierMapZ: 0, frontierParcelBorderColor: "#fff", residenceNoticeBoardVisuals: {}, inventory: {},
      };
    },
  });
  assert.equal(calls.length, 2);
  assert.ok(result.sceneObjectFactory);
  assert.ok(result.worldBootstrap);
  assert.equal(typeof result.factory.makeTree, "function");
  assert.equal(result.state.forgeStation, undefined);
});
