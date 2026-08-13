import test from "node:test";
import assert from "node:assert/strict";
import { updatePollutionFieldPositions } from "../src/world/pollutionField.js";

test("updates pollution particle positions from their base points and phases", () => {
  const positions = new Float32Array(3);
  const base = new Float32Array([10, 2, -4]);
  const phase = new Float32Array([0]);
  updatePollutionFieldPositions({ positions, base, phase, time: 0, strength: 0.5, particleSway: 0.12 });
  assert.equal(positions[0], 10);
  assert.equal(positions[1], 2);
  assert.ok(Math.abs(positions[2] - -3.94) < 0.00001);
});
