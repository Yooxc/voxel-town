import test from "node:test";
import assert from "node:assert/strict";
import { createMiningFeedbackRuntime } from "../src/world/miningFeedback.js";

test("keeps the longest active hit-stop and camera shake values", () => {
  const runtime = createMiningFeedbackRuntime();
  runtime.triggerHitStop(0.04);
  runtime.triggerHitStop(0.02);
  runtime.triggerCameraShake(0.02, 0.1);
  runtime.triggerCameraShake(0.05, 0.05);
  assert.deepEqual(runtime.update(0.01), { hitStopped: true });
});

test("returns a bounded camera shake offset and clears it after expiry", () => {
  const runtime = createMiningFeedbackRuntime({ randomRange: (min, max) => max });
  runtime.triggerCameraShake(0.05, 0.1);
  runtime.update(0.05);
  assert.deepEqual(runtime.getCameraShakeOffset(), {
    x: 0.02272727272727273,
    y: 0.018181818181818184,
    z: 0.02272727272727273,
  });
  runtime.update(0.05);
  assert.equal(runtime.getCameraShakeOffset(), null);
  assert.deepEqual(runtime.update(1), { hitStopped: false });
});
