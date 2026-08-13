import test from "node:test";
import assert from "node:assert/strict";
import { resolveCameraOcclusionDistance } from "../src/world/cameraOcclusion.js";

const base = {
  currentDistance: 8,
  preferredDistance: 8,
  previousResolvedDistance: 8,
  wasOccludedLastFrame: false,
  dt: 0.1,
  maxDistance: 20,
  margin: 0.18,
  minDistance: 4.2,
  returnSpeed: 7.5,
};

test("resolves occluded camera distance with a minimum clamp", () => {
  assert.deepEqual(resolveCameraOcclusionDistance({ ...base, hitDistance: 3 }), {
    preferredDistance: 8,
    resolvedDistance: 4.2,
    wasOccluded: true,
  });
});

test("returns toward the preferred camera distance when unoccluded", () => {
  const result = resolveCameraOcclusionDistance({
    ...base,
    currentDistance: 5,
    preferredDistance: 8,
    previousResolvedDistance: 5,
    wasOccludedLastFrame: true,
    hitDistance: undefined,
  });
  assert.equal(result.preferredDistance, 8);
  assert.equal(result.resolvedDistance, 7.25);
  assert.equal(result.wasOccluded, false);
});
