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
