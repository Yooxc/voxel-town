import test from "node:test";
import assert from "node:assert/strict";
import {
  createPlayerFrameRuntime,
  createPlayerMovementRuntime,
  createPlayerRuntimeIntegration,
} from "../src/core/playerRuntimeIntegration.js";

test("assembles movement and frame behavior inside the runtime integration", () => {
  const calls = [];
  const movement = createPlayerMovementRuntime({
    player: {}, camera: {}, controls: {}, rig: {},
    latestMoveDirection: { copy: () => calls.push("direction") },
    canPlayGame: () => true,
    isWorkUiMovementLocked: () => false,
    isSleeping: () => false,
    isDevSession: () => false,
    hasShoesEquipped: () => false,
    getAirMoveScalar: () => 1,
    updatePlayerGroundY: () => {},
    now: () => 123,
  });
  const options = movement.getOptions();
  assert.equal(options.now, 123);
  assert.equal(typeof options.applyMovementCollisionStep, "function");
  options.updateLatestMoveDirection({});
  assert.deepEqual(calls, ["direction"]);

  let lastMapId = "start";
  const frame = createPlayerFrameRuntime({
    getCurrentMapId: () => "frontier",
    getLastAnnouncedMapId: () => lastMapId,
    setLastAnnouncedMapId: (mapId) => { lastMapId = mapId; },
    showMapArrivalBanner: (mapId) => calls.push(mapId),
    isInventoryOpen: () => true,
    renderEquipmentPreview: () => calls.push("preview"),
    getCompassDirection: () => "north",
    latestMoveDirection: {},
    getPlayerYaw: () => 0,
    updateCompassFromDirection: (direction) => calls.push(direction),
    updateNpcDialogPosition: () => calls.push("dialog"),
    updateTutorialNpcNameTag: () => calls.push("npc"),
    updatePlayerNameTag: () => calls.push("player"),
    isForgeOpen: () => false,
    getForgeDistance: () => 0,
    setForgeOpen: () => {},
    isRefineryOpen: () => false,
    getRefineryDistance: () => 0,
    setRefineryOpen: () => {},
  });
  frame.announceMapChange();
  frame.renderEquipmentPreviewIfOpen();
  frame.updateCompass();
  frame.updateWorldLabels();
  assert.equal(lastMapId, "frontier");
  assert.deepEqual(calls.slice(1), ["frontier", "preview", "north", "dialog", "npc", "player"]);
});

test("builds mining plans and completes mined rock rewards through injected services", () => {
  const calls = [];
  const rock = {
    userData: { hp: 1, maxHp: 2, resourceItemId: "stoneDust", resourceCount: 2, colliderIndex: 3 },
    removeFromParent: () => calls.push("removed"),
  };
  const runtime = createPlayerRuntimeIntegration({
    runtime: {
      eventTarget: { addEventListener() {}, removeEventListener() {} },
      inputElement: { addEventListener() {}, removeEventListener() {} },
      requestFrame: () => 1, clock: { getDelta: () => 0 },
      gameplayCoordinator: {}, input: {}, movement: { startRing: {} }, frame: {},
    },
    interaction: {},
    interactionState: { get: () => ({}), set: () => {} },
    mining: {
      createPlan: (state) => state, hasEquippedPickaxe: () => true,
      getEquippedMiningPower: () => 3, hasOwnedPickaxe: () => true,
      getEquippedPickaxeLevel: () => 2, spawnBreakBurst: () => calls.push("burst"),
      incrementTutorialRockCount: () => calls.push("quest"), addItem: (...args) => calls.push(args),
      random: () => 1, getBonusDropChance: () => 0, notify: () => {},
      getItemName: () => "돌가루", updateInventoryUi: () => {}, refreshQuestProgress: () => {},
      removeCollider: (index) => calls.push(index), unregisterRock: () => {},
      scheduleRespawn: () => calls.push("respawn"),
    },
  });
  const plan = runtime.interactionContext.createRockMiningPlan(rock);
  assert.equal(plan.miningPower, 3);
  runtime.interactionContext.finishRockMining(rock, {});
  assert.deepEqual(calls.slice(0, 3), ["burst", "quest", ["stoneDust", 2]]);
});
