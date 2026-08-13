export function createMiningFeedbackRuntime({
  hitStopDuration = 0.045,
  cameraShakeDuration = 0.11,
  randomRange = (min, max) => min + Math.random() * (max - min),
} = {}) {
  let hitStopTime = 0;
  let cameraShakeTime = 0;
  let cameraShakeStrength = 0;

  function triggerHitStop(duration = hitStopDuration) {
    hitStopTime = Math.max(hitStopTime, duration);
  }

  function triggerCameraShake(strength = 0.045, duration = cameraShakeDuration) {
    cameraShakeTime = Math.max(cameraShakeTime, duration);
    cameraShakeStrength = Math.max(cameraShakeStrength, strength);
  }

  function update(dt) {
    hitStopTime = Math.max(0, hitStopTime - dt);
    cameraShakeTime = Math.max(0, cameraShakeTime - dt);
    if (cameraShakeTime <= 0) cameraShakeStrength = 0;
    return { hitStopped: hitStopTime > 0 };
  }

  function getCameraShakeOffset() {
    if (cameraShakeTime <= 0 || cameraShakeStrength <= 0) return null;
    const scale = cameraShakeStrength * (cameraShakeTime / cameraShakeDuration);
    return {
      x: randomRange(-scale, scale),
      y: randomRange(-scale * 0.8, scale * 0.8),
      z: randomRange(-scale, scale),
    };
  }

  return { triggerHitStop, triggerCameraShake, update, getCameraShakeOffset };
}
