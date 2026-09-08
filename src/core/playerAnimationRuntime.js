import * as THREE from "three";

export const PLAYER_ANIMATION_NAMES = Object.freeze({
  idle: "EXCIT_IDLE",
  walk: "EXCIT_WALK",
  run: "EXCIT_RUN",
  mining: "EXCIT_MINING",
});

export const EXCIT_MINING_IMPACT_PROGRESS = 0.4;

const LOOP_STATES = new Set(["idle", "walk", "run"]);

export function resolvePlayerAnimationState({
  isMoving = false,
  isSprinting = false,
  isMining = false,
} = {}) {
  if (isMining) return "mining";
  if (!isMoving) return "idle";
  return isSprinting ? "run" : "walk";
}

export function getMiningAnimationTimeScale(clipDuration, swingDuration) {
  if (!(clipDuration > 0) || !(swingDuration > 0)) return 1;
  return clipDuration / swingDuration;
}

export function createPlayerAnimationRuntime(player, options = {}) {
  const actionNames = options.actionNames ?? PLAYER_ANIMATION_NAMES;
  const createMixer = options.createMixer ?? ((root) => new THREE.AnimationMixer(root));
  const loopRepeat = options.loopRepeat ?? THREE.LoopRepeat;
  const loopOnce = options.loopOnce ?? THREE.LoopOnce;
  const crossFadeDuration = options.crossFadeDuration ?? 0.12;
  let mixer = null;
  let actions = new Map();
  let currentState = null;
  let activeMiningSwingId = null;
  let pendingState = { state: "idle", miningDuration: null, miningSwingId: null };

  function initialize({ model, animations }) {
    mixer = createMixer(model);
    actions = new Map();
    for (const [state, clipName] of Object.entries(actionNames)) {
      const clip = animations.find((entry) => entry.name === clipName);
      if (!clip) continue;
      actions.set(state, mixer.clipAction(clip));
    }
    transitionTo(
      pendingState.state,
      pendingState.miningDuration,
      pendingState.miningSwingId,
      true,
    );
  }

  function transitionTo(state, miningDuration, miningSwingId, immediate = false) {
    pendingState = { state, miningDuration, miningSwingId };
    if (!mixer) return;
    const next = actions.get(state) ?? actions.get("idle");
    if (!next) return;

    if (state === "mining") {
      next.setLoop(loopOnce, 1);
      next.clampWhenFinished = true;
      next.timeScale = getMiningAnimationTimeScale(next.getClip().duration, miningDuration);
    } else {
      next.setLoop(loopRepeat, Infinity);
      next.clampWhenFinished = false;
      next.timeScale = 1;
    }

    const startsNewMiningSwing = state === "mining" && miningSwingId !== activeMiningSwingId;
    if (state === currentState && !startsNewMiningSwing) return;
    const previous = currentState ? actions.get(currentState) : null;
    next.reset().setEffectiveWeight(1).play();
    if (previous && previous !== next && !immediate) {
      previous.fadeOut(crossFadeDuration);
      next.fadeIn(crossFadeDuration);
    }
    currentState = state;
    activeMiningSwingId = state === "mining" ? miningSwingId : null;
  }

  function update(dt, state = {}) {
    const nextState = resolvePlayerAnimationState(state);
    transitionTo(nextState, state.miningDuration, state.miningSwingId);
    mixer?.update(Math.max(0, dt));
    return nextState;
  }

  const ready = player.userData.assetReady?.then(initialize);

  return {
    ready,
    update,
    getCurrentState: () => currentState,
    isReady: () => Boolean(mixer),
  };
}
