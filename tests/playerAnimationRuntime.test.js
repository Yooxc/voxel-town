import test from "node:test";
import assert from "node:assert/strict";
import {
  createPlayerAnimationRuntime,
  getMiningAnimationTimeScale,
  resolvePlayerAnimationState,
} from "../src/core/playerAnimationRuntime.js";

function createAction(clip) {
  return {
    clip,
    clampWhenFinished: false,
    timeScale: 1,
    played: 0,
    getClip: () => clip,
    setLoop() { return this; },
    reset() { return this; },
    setEffectiveWeight() { return this; },
    play() { this.played += 1; return this; },
    fadeIn() { return this; },
    fadeOut() { return this; },
  };
}

test("resolves locomotion and mining animation priority", () => {
  assert.equal(resolvePlayerAnimationState(), "idle");
  assert.equal(resolvePlayerAnimationState({ isMoving: true }), "walk");
  assert.equal(resolvePlayerAnimationState({ isMoving: true, isSprinting: true }), "run");
  assert.equal(resolvePlayerAnimationState({ isMoving: true, isSprinting: true, isMining: true }), "mining");
});

test("fits the complete mining clip into the current equipment swing duration", () => {
  assert.equal(getMiningAnimationTimeScale(2.2666666667, 1.1).toFixed(3), "2.061");
  assert.equal(getMiningAnimationTimeScale(2.2666666667, 0.68).toFixed(3), "3.333");
});

test("loads exact EXCIT actions and transitions between them", async () => {
  const clips = [
    { name: "EXCIT_IDLE", duration: 2 },
    { name: "EXCIT_WALK", duration: 0.8 },
    { name: "EXCIT_RUN", duration: 0.633 },
    { name: "EXCIT_MINING", duration: 2.266 },
  ];
  const actionByClip = new Map(clips.map((clip) => [clip, createAction(clip)]));
  const updates = [];
  const mixer = {
    clipAction: (clip) => actionByClip.get(clip),
    update: (dt) => updates.push(dt),
  };
  const player = {
    userData: { assetReady: Promise.resolve({ model: {}, animations: clips }) },
  };
  const runtime = createPlayerAnimationRuntime(player, {
    createMixer: () => mixer,
    loopRepeat: "repeat",
    loopOnce: "once",
  });
  await runtime.ready;

  runtime.update(0.016, { isMoving: true, isSprinting: true });
  runtime.update(0.016, { isMining: true, miningDuration: 0.68, miningSwingId: 1 });
  runtime.update(0.016, { isMining: true, miningDuration: 0.68, miningSwingId: 1 });
  runtime.update(0.016, { isMining: true, miningDuration: 0.68, miningSwingId: 2 });

  assert.equal(runtime.getCurrentState(), "mining");
  assert.equal(actionByClip.get(clips[3]).timeScale.toFixed(3), "3.332");
  assert.equal(actionByClip.get(clips[3]).played, 2);
  assert.deepEqual(updates, [0.016, 0.016, 0.016, 0.016]);
});
