export function createResourceWorldRuntime({
  getPlayerPosition,
  findNearestByPosition,
  setHarvestTreeActive,
  updateHarvestTrees,
  updateRockFadeIns,
  schedule = setTimeout,
  rockRespawnMs,
  rockRespawnRetryMs = 2_000,
  createRespawnRock,
}) {
  const mineRocks = [];
  const harvestTrees = [];

  function registerMineRock(rock) {
    mineRocks.push(rock);
    return rock;
  }

  function unregisterMineRock(rock) {
    const index = mineRocks.indexOf(rock);
    if (index !== -1) mineRocks.splice(index, 1);
  }

  function registerHarvestTree(tree) {
    harvestTrees.push(tree);
    return tree;
  }

  function findNearestMineRock(radius = 2.2) {
    return findNearestByPosition({
      entries: mineRocks,
      playerPosition: getPlayerPosition(),
      radius,
      isEligible: (rock) => Boolean(rock?.parent),
    });
  }

  function findNearestHarvestTree(radius = 2.2) {
    return findNearestByPosition({
      entries: harvestTrees,
      playerPosition: getPlayerPosition(),
      radius,
      isEligible: (tree) => Boolean(tree?.parent) && !tree.userData.harvestDisabled,
    });
  }

  function deactivateHarvestTree(tree) {
    setHarvestTreeActive(tree, false);
  }

  function updateHarvestTreeStates() {
    updateHarvestTrees(harvestTrees);
  }

  function updateRockFadeStates(dt) {
    updateRockFadeIns(mineRocks, dt);
  }

  function scheduleRockRespawn(spawn) {
    const tryRespawn = () => {
      const result = createRespawnRock(spawn);
      if (result === null) schedule(tryRespawn, rockRespawnRetryMs);
    };
    schedule(tryRespawn, rockRespawnMs);
  }

  return {
    mineRocks,
    harvestTrees,
    registerMineRock,
    unregisterMineRock,
    registerHarvestTree,
    findNearestMineRock,
    findNearestHarvestTree,
    deactivateHarvestTree,
    updateHarvestTreeStates,
    updateRockFadeStates,
    scheduleRockRespawn,
  };
}
