import { createSceneObjectFactory } from "./sceneObjectFactory.js";
import { bootstrapWorld } from "./worldBootstrap.js";

const FACTORY_METHOD_NAMES = [
  "buildStartZoneWall",
  "buildStartStall",
  "makeTree",
  "makeRock",
  "makePickaxe",
  "makeShovel",
  "makeSafetyHelmet",
  "makeBasicShoes",
  "makeSign",
  "makeTutorialNpc",
  "buildForgeAnvil",
  "buildNftExhibitBoard",
  "buildAirPurifierStation",
  "buildRefineryStation",
  "buildTunnelFence",
  "buildMapConnectorTunnel",
];

const WORLD_STATE_NAMES = [
  "forgeStation",
  "refineryStation",
  "airPurifierStation",
  "mineGate",
  "campGate",
  "frontierCampGate",
  "frontierGate",
  "abandonedMineGate",
  "frontierParcelDefs",
  "frontierParcelConstructionRoots",
  "frontierParcelConstructionGroups",
  "frontierParcelConstructionColliders",
  "frontierAirPurifierStation",
  "frontierWastelandPlot",
  "mansionOneEntranceInteractable",
  "mansionOneExteriorReturn",
  "mansionOneRoomRoot",
  "mansionOneRoom102Root",
  "mansionOneRoomInstances",
];

function pickProperties(source, names) {
  return Object.fromEntries(names.map((name) => [name, source[name]]));
}

export function createWorldRuntimeIntegration({
  sceneFactoryOptions,
  createWorldBootstrapOptions,
  sceneObjectFactoryFactory = createSceneObjectFactory,
  worldBootstrapFactory = bootstrapWorld,
}) {
  const sceneObjectFactory = sceneObjectFactoryFactory(sceneFactoryOptions);
  const worldBootstrap = worldBootstrapFactory(createWorldBootstrapOptions(sceneObjectFactory));

  return {
    sceneObjectFactory,
    worldBootstrap,
    factory: pickProperties(sceneObjectFactory, FACTORY_METHOD_NAMES),
    state: pickProperties(worldBootstrap, WORLD_STATE_NAMES),
  };
}
