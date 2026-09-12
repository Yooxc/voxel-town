import test from "node:test";
import assert from "node:assert/strict";
import {
  getGuideArrivalPath,
  getGuideReturnPath,
  getTourCheckpoints,
  getTourGuideDefinitions,
  getTourLegPath,
} from "../src/systems/tourPlan.js";
import { getRebuildTerrainHeight } from "../src/world/rebuildLayout.js";

test("keeps the guide route on the rebuild terrain and follows the downhill path", () => {
  const checkpoints = getTourCheckpoints(12, -7, 3);
  const guide = getTourGuideDefinitions(12, -7, 3)[0];
  const origin = { x: 12, y: 3, z: -7 };
  const arrival = getGuideArrivalPath(guide, checkpoints);
  const downhill = getTourLegPath(checkpoints, "rest-area", "work-area");

  assert.ok(arrival.length >= 6);
  assert.ok(downhill.length >= 6);
  assert.deepEqual(arrival.at(-1), checkpoints[0].position);
  assert.ok(arrival.every((point) => point.x > 5));
  assert.deepEqual(downhill.at(-1), checkpoints.find((checkpoint) => checkpoint.id === "work-area").position);
  for (const point of [...arrival, ...downhill]) {
    assert.ok(Math.abs(point.y - getRebuildTerrainHeight(point.x, point.z, origin)) < 0.0001);
  }
});

test("returns from exploration through the market route instead of a direct line", () => {
  const checkpoints = getTourCheckpoints();
  const guide = getTourGuideDefinitions()[0];
  const path = getGuideReturnPath(guide, checkpoints, "exploration-path");

  assert.ok(path.length >= 6);
  assert.deepEqual(path.at(-1), guide.origin);
  assert.ok(path.some((point) => point.x < -15 && point.z < -11));
  assert.ok(path.some((point) => point.x >= 7 && point.z >= -5));
});
