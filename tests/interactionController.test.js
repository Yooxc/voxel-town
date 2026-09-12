import test from "node:test";
import assert from "node:assert/strict";
import { createInteractionController } from "../src/ui/interactionController.js";

function createRockContext({ accepted = true } = {}) {
  const rock = { position: { x: 1, y: 0, z: 0 }, userData: { hp: 2 } };
  const calls = { plan: 0, swing: 0, hitStop: 0, dust: 0, swingOptions: null };
  const context = {
    isWastelandBuildModeActive: () => false,
    getInteractionState: () => ({ activeMineRock: rock }),
    setInteractionState: () => {},
    tryDigTerrain: () => ({ ok: false, reason: "no-target" }),
    isMiningLocked: () => false,
    createRockMiningPlan: () => {
      calls.plan += 1;
      return { status: "damaged", remainingHp: 1 };
    },
    triggerMiningSwing: (_rock, options) => {
      calls.swing += 1;
      calls.swingOptions = options;
      return accepted;
    },
    triggerHitStop: () => { calls.hitStop += 1; },
    triggerRockHitReaction: () => {},
    triggerCameraShake: () => {},
    spawnDustBurst: () => { calls.dust += 1; },
    updateRockHpBar: () => {},
    showUI: () => {},
    setLastMessageUntil: () => {},
    now: () => 0,
    hudMessages: {},
  };
  return { controller: createInteractionController(context), rock, calls };
}

test("does not damage or emit mining feedback when a swing is locked", () => {
  const { controller, rock, calls } = createRockContext({ accepted: false });
  controller.handleWorldSpaceInteraction({ repeat: false });

  assert.equal(calls.plan, 1);
  assert.equal(calls.swing, 1);
  assert.equal(calls.hitStop, 0);
  assert.equal(calls.dust, 0);
  assert.equal(rock.userData.hp, 2);
});

test("applies rock damage only from the mining impact callback", () => {
  const { controller, rock, calls } = createRockContext();
  controller.handleWorldSpaceInteraction({ repeat: false });

  assert.equal(rock.userData.hp, 2);
  assert.equal(calls.hitStop, 0);
  calls.swingOptions.onImpact();
  assert.equal(rock.userData.hp, 1);
  assert.equal(calls.hitStop, 1);
  assert.equal(calls.dust, 1);
});

test("ignores repeated Space keydown before it creates a mining plan", () => {
  const { controller, calls } = createRockContext();
  controller.handleWorldSpaceInteraction({ repeat: true });

  assert.equal(calls.plan, 0);
  assert.equal(calls.swing, 0);
});

test("routes welcome resident dialogue before legacy tutorial interaction", () => {
  const resident = { role: "welcome" };
  let welcomeInteractions = 0;
  let legacyInteractions = 0;
  const controller = createInteractionController({
    isWastelandBuildModeActive: () => false,
    getInteractionState: () => ({ activeTutorialNpc: resident }),
    interactWithWelcomeNpc: (entry) => {
      welcomeInteractions += 1;
      return entry === resident;
    },
    getCurrentQuestStep: () => { legacyInteractions += 1; return null; },
  });
  let prevented = false;

  controller.handleWorldSpaceInteraction({ repeat: false, preventDefault: () => { prevented = true; } });

  assert.equal(welcomeInteractions, 1);
  assert.equal(legacyInteractions, 0);
  assert.equal(prevented, true);
});

test("routes tour guide dialogue before legacy tutorial interaction", () => {
  const guide = { role: "tour-guide" };
  let guideInteractions = 0;
  let legacyInteractions = 0;
  const controller = createInteractionController({
    isWastelandBuildModeActive: () => false,
    getInteractionState: () => ({ activeTutorialNpc: guide }),
    interactWithWelcomeNpc: () => false,
    interactWithTourGuide: (entry) => {
      guideInteractions += 1;
      return entry === guide;
    },
    getCurrentQuestStep: () => { legacyInteractions += 1; return null; },
  });

  controller.handleWorldSpaceInteraction({ repeat: false, preventDefault() {} });

  assert.equal(guideInteractions, 1);
  assert.equal(legacyInteractions, 0);
});

test("routes market resident dialogue before legacy tutorial interaction", () => {
  const resident = { role: "market-resident" };
  let marketInteractions = 0;
  let legacyInteractions = 0;
  const controller = createInteractionController({
    isWastelandBuildModeActive: () => false,
    getInteractionState: () => ({ activeTutorialNpc: resident }),
    interactWithWelcomeNpc: () => false,
    interactWithTourGuide: () => false,
    interactWithMarketResident: (entry) => {
      marketInteractions += 1;
      return entry === resident;
    },
    getCurrentQuestStep: () => { legacyInteractions += 1; return null; },
  });

  controller.handleWorldSpaceInteraction({ repeat: false, preventDefault() {} });

  assert.equal(marketInteractions, 1);
  assert.equal(legacyInteractions, 0);
});

test("does not pass Space to world interaction while an activity choice is open", () => {
  const controller = createInteractionController({
    isWastelandBuildModeActive: () => false,
    isActivityHelpOpen: () => true,
    getInteractionState: () => { throw new Error("world interaction should not run"); },
  });
  let prevented = false;

  controller.handleWorldSpaceInteraction({ preventDefault: () => { prevented = true; } });

  assert.equal(prevented, true);
});

test("starts nearby plant gathering from the E key", () => {
  let starts = 0;
  let prevented = false;
  const controller = createInteractionController({
    canPlayGame: () => true,
    getLogicalInputKey: () => "e",
    isTextInputActive: () => false,
    isNftExhibitSelectionOpen: () => false,
    isQuickUseAssigning: () => false,
    getQuickUseAssignmentConsumedUntil: () => 0,
    now: () => 1,
    isWastelandBuildModeActive: () => false,
    isWorkUiMovementLocked: () => false,
    getKeys: () => ({}),
    getInteractionState: () => ({}),
    findNearestPickupItem: () => null,
    tryStartGathering: () => { starts += 1; return true; },
  });

  controller.handleKeyDown({ preventDefault: () => { prevented = true; } });

  assert.equal(starts, 1);
  assert.equal(prevented, true);
});

test("blocks world action keys while dialogue camera is active", () => {
  for (const key of ["e", "b", "t", "1"]) {
    let prevented = false;
    const controller = createInteractionController({
      canPlayGame: () => true,
      getLogicalInputKey: () => key,
      isTextInputActive: () => false,
      isNftExhibitSelectionOpen: () => false,
      isQuickUseAssigning: () => false,
      getQuickUseAssignmentConsumedUntil: () => 0,
      quickUseAllowedKeys: ["1"],
      now: () => 1,
      isWastelandBuildModeActive: () => false,
      isWorkUiMovementLocked: () => false,
      isDialogueCameraActive: () => true,
      getKeys: () => ({}),
      getInteractionState: () => { throw new Error("world action should not run during dialogue"); },
    });

    controller.handleKeyDown({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true, `${key} should be consumed`);
  }
});

test("blocks Space while the dialogue camera is returning", () => {
  let prevented = false;
  const controller = createInteractionController({
    isWastelandBuildModeActive: () => false,
    isDialogueCameraActive: () => true,
    isDialogueCameraFocused: () => false,
    getInteractionState: () => { throw new Error("returning dialogue should not reach world interaction"); },
  });

  controller.handleWorldSpaceInteraction({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
});

test("allows Space to continue only the current focused NPC dialogue", () => {
  const resident = { role: "welcome", obj: {} };
  let interactions = 0;
  const controller = createInteractionController({
    isWastelandBuildModeActive: () => false,
    isDialogueCameraActive: () => true,
    isDialogueCameraFocused: () => true,
    isDialogueCameraTarget: (target) => target === resident.obj,
    isGatheringActive: () => false,
    isActivityHelpOpen: () => false,
    isNpcChoiceOpen: () => false,
    getInteractionState: () => ({ activeTutorialNpc: resident }),
    interactWithWelcomeNpc: () => { interactions += 1; return true; },
  });

  controller.handleWorldSpaceInteraction({ repeat: false, preventDefault() {} });
  assert.equal(interactions, 1);
});

function createStarterPickaxeContext({ claimed = false, ownsPickaxe = false, addSucceeds = true } = {}) {
  const pickup = {
    kind: "starter-pickaxe",
    persistent: true,
    itemId: "pickaxe",
    obj: { userData: { pickaxeLevel: 1 } },
  };
  const calls = { add: 0, claim: 0, remove: 0, update: 0, refresh: 0, messages: [] };
  const context = {
    canPlayGame: () => true,
    getLogicalInputKey: () => "e",
    isTextInputActive: () => false,
    isNftExhibitSelectionOpen: () => false,
    isQuickUseAssigning: () => false,
    getQuickUseAssignmentConsumedUntil: () => 0,
    now: () => 1,
    isWastelandBuildModeActive: () => false,
    isWorkUiMovementLocked: () => false,
    getKeys: () => ({}),
    getInteractionState: () => ({}),
    findNearestPickupItem: () => pickup,
    isStarterPickaxeClaimed: () => claimed,
    hasItem: () => ownsPickaxe,
    triggerPickupReach: () => {},
    createInventorySlotEntry: (itemId, count, metadata) => ({ itemId, count, ...metadata }),
    addInventoryEntry: () => { calls.add += 1; return addSucceeds; },
    claimStarterPickaxe: () => { calls.claim += 1; return true; },
    updateInventoryUI: () => { calls.update += 1; },
    refreshQuestProgress: () => { calls.refresh += 1; },
    unregisterDynamicProp: () => { calls.remove += 1; },
    unregisterPickupItem: () => { calls.remove += 1; },
    showUI: (message) => { calls.messages.push(message); },
    setLastMessageUntil: () => {},
  };
  return { controller: createInteractionController(context), calls };
}

test("grants a persistent starter pickaxe once without removing its world display", () => {
  const { controller, calls } = createStarterPickaxeContext();
  controller.handleKeyDown({ repeat: false, preventDefault() {} });

  assert.equal(calls.add, 1);
  assert.equal(calls.claim, 1);
  assert.equal(calls.update, 1);
  assert.equal(calls.refresh, 1);
  assert.equal(calls.remove, 0);
  assert.match(calls.messages.at(-1), /기본 곡괭이를 받았어요/);
});

test("does not claim the starter pickaxe when inventory insertion fails", () => {
  const { controller, calls } = createStarterPickaxeContext({ addSucceeds: false });
  controller.handleKeyDown({ repeat: false, preventDefault() {} });

  assert.equal(calls.add, 1);
  assert.equal(calls.claim, 0);
  assert.equal(calls.update, 0);
  assert.match(calls.messages.at(-1), /빈자리가 없어요/);
});

test("blocks a starter pickaxe that was already claimed", () => {
  const { controller, calls } = createStarterPickaxeContext({ claimed: true });
  controller.handleKeyDown({ repeat: false, preventDefault() {} });

  assert.equal(calls.add, 0);
  assert.equal(calls.claim, 0);
  assert.match(calls.messages.at(-1), /한 번만/);
});
