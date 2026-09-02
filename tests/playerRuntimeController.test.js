import test from "node:test";
import assert from "node:assert/strict";
import { createPlayerRuntimeController } from "../src/core/playerRuntimeController.js";

function createEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener(type, listener) {
      listeners.set(type, (listeners.get(type) ?? []).filter((entry) => entry !== listener));
    },
    dispatch(type, event = {}) {
      for (const listener of listeners.get(type) ?? []) listener(event);
    },
    count(type) { return (listeners.get(type) ?? []).length; },
  };
}

function createRuntime({ movementOverrides = {} } = {}) {
  const eventTarget = createEventTarget();
  const inputElement = createEventTarget();
  const calls = [];
  const gameplayCoordinator = {
    beginShiftCameraRotation: () => calls.push("rotate-start"),
    endShiftCameraRotation: () => calls.push("rotate-end"),
    rotateShiftCamera: () => calls.push("rotate"),
    updateMovement: (options) => { calls.push("movement"); return options; },
    updateFeedback: () => ({ hitStopped: false }),
    updateResourceVisuals: () => calls.push("resources"),
    updateCameraFollow: () => calls.push("camera"),
    applyCameraShake: () => calls.push("shake"),
    triggerMiningSwing: () => {},
    triggerPickupReach: () => {},
  };
  const noop = () => {};
  const interactionContext = new Proxy({
    getLogicalInputKey: (event) => event.key?.toLowerCase() ?? "",
    canPlayGame: () => true,
    isTextInputActive: () => false,
    isNftExhibitSelectionOpen: () => false,
    isQuickUseAssigning: () => false,
    getQuickUseAssignmentConsumedUntil: () => 0,
    quickUseAllowedKeys: [],
    isWorkUiMovementLocked: () => false,
    getInteractionState: () => ({}),
    setInteractionState: noop,
    now: () => 0,
  }, { get: (target, key) => key in target ? target[key] : noop });
  const frame = new Proxy({
    updateForgeUpgradeState: () => calls.push("forge"),
    updateCurrentMapFromPlayerPosition: () => calls.push("map"),
    updateSceneFogForCurrentMap: noop,
    schedulePlayerSaveSync: noop,
    announceMapChange: noop,
    updateDynamicProps: noop,
    updateAirSystem: noop,
    updateCavePollutionVisuals: noop,
    renderEquipmentPreviewIfOpen: noop,
    updateCompass: noop,
    updateWorldLabels: noop,
    closeDistantWorkstations: noop,
    render: () => calls.push("render"),
  }, { get: (target, key) => key in target ? target[key] : noop });
  const runtime = createPlayerRuntimeController({
    eventTarget,
    inputElement,
    requestFrame: () => 1,
    clock: { getDelta: () => 0.016 },
    gameplayCoordinator,
    interactionContext,
    input: {
      canPlayGame: () => true,
      isWorkUiMovementLocked: () => false,
      isNftExhibitOpen: () => false,
      isQuickUseAssigning: () => false,
      isSleeping: () => false,
      isClaimDialogOpen: () => false,
      isPersonalStorageOpen: () => false,
      getLogicalInputKey: (event) => event.key?.toLowerCase() ?? "",
      shiftCameraSensitivity: 0.01,
    },
    movement: {
      startRing: { startWallOn: false, startX: 0, startZ: 0, startRadius: 10, startRingThickness: 1, openCenter: 0, openRatio: 0.2 },
      startHardClamp: false,
      getWalkableSurfaces: () => [],
      defaultMapBounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
      colliderBoxes: [],
      getPlayerBox: () => ({}),
      pickupReachDuration: 0.22,
      getSwingDuration: () => 0.2,
      getOptions: () => ({}),
      ...movementOverrides,
    },
    frame,
  });
  return { runtime, eventTarget, inputElement, calls };
}

test("binds and releases player input as one runtime", () => {
  const { runtime, eventTarget, inputElement, calls } = createRuntime();
  runtime.start();
  eventTarget.dispatch("keydown", { key: "w", code: "KeyW" });
  assert.equal(runtime.getKeys().w, true);
  eventTarget.dispatch("keyup", { key: "w" });
  assert.equal(runtime.getKeys().w, false);

  runtime.getKeys().shift = true;
  inputElement.dispatch("pointerdown", { button: 0 });
  assert.ok(calls.includes("rotate-start"));
  runtime.stop();
  assert.equal(eventTarget.count("keydown"), 0);
  assert.deepEqual(runtime.getKeys(), { w: false, a: false, s: false, d: false, shift: false });
});

test("runs movement before interaction-facing frame work and rendering", () => {
  const { runtime, calls } = createRuntime();
  runtime.runFrame(0.016);
  assert.ok(calls.indexOf("movement") < calls.indexOf("map"));
  assert.ok(calls.indexOf("resources") < calls.indexOf("camera"));
  assert.ok(calls.indexOf("camera") < calls.indexOf("render"));
});

test("resolves a player overlap before movement can trap the player in a wall", () => {
  let penetration = 0.3;
  let resolveCalls = 0;
  const player = {
    position: {
      x: 0,
      y: 2,
      z: 0,
      set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      },
    },
    rotation: { y: 0 },
  };
  const { runtime } = createRuntime({
    movementOverrides: {
      getPlayer: () => player,
      getColliderPenetration: () => penetration,
      resolvePlayerPenetration: () => {
        resolveCalls += 1;
        player.position.x = 0.42;
        penetration = 0;
      },
    },
  });

  runtime.runFrame(0.016);

  assert.equal(resolveCalls, 1);
  assert.equal(player.position.x, 0.42);
});

test("uses the latest safe position from the current map for an immediate recovery", () => {
  let penetration = 0;
  const player = {
    position: {
      x: 3,
      y: 2,
      z: 4,
      set(x, y, z) { this.x = x; this.y = y; this.z = z; },
    },
    rotation: { y: 0.5 },
  };
  const recoveries = [];
  const { runtime } = createRuntime({
    movementOverrides: {
      getPlayer: () => player,
      getCurrentMapId: () => "개척지",
      getColliderPenetration: () => penetration,
      resolvePlayerPenetration: () => {},
      getSafePositionFallback: () => ({ x: 99, y: 2, z: 99 }),
      isSafePosition: (position) => position.x !== 99,
      onPlayerCollisionRecovery: (details) => recoveries.push(details),
    },
  });

  runtime.runFrame(0.016);
  player.position.x = 3.2;
  runtime.runFrame(0.016);
  penetration = 0.4;

  assert.equal(runtime.requestCollisionRecovery({ source: "build", immediate: true }), true);
  assert.equal(player.position.x, 3.2);
  assert.equal(player.position.z, 4);
  assert.equal(recoveries.at(-1).mapId, "개척지");
  assert.equal(recoveries.at(-1).source, "build");
});

test("never reuses a safe position from another map", () => {
  let mapId = "광산";
  let penetration = 0;
  const player = {
    position: {
      x: 1,
      y: 2,
      z: 1,
      set(x, y, z) { this.x = x; this.y = y; this.z = z; },
    },
    rotation: { y: 0 },
  };
  const { runtime } = createRuntime({
    movementOverrides: {
      getPlayer: () => player,
      getCurrentMapId: () => mapId,
      getColliderPenetration: () => penetration,
      resolvePlayerPenetration: () => {},
      isSafePosition: () => true,
      getSafePositionFallback: (id) => id === "개척지" ? { x: 20, y: 2, z: -20, rotationY: 1 } : null,
    },
  });

  runtime.runFrame(0.016);
  mapId = "개척지";
  player.position.set(0, 2, 0);
  penetration = 0.5;

  assert.equal(runtime.requestCollisionRecovery({ immediate: true }), true);
  assert.deepEqual(
    { x: player.position.x, y: player.position.y, z: player.position.z, rotationY: player.rotation.y },
    { x: 20, y: 2, z: -20, rotationY: 1 },
  );
});
