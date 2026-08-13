import test from "node:test";
import assert from "node:assert/strict";
import { createWorldPickupRuntime } from "../src/systems/worldPickups.js";

function object(x, z, attached = true) {
  return { position: { x, z }, parent: attached ? {} : null, userData: {} };
}

test("registers pickup metadata with a default hint", () => {
  const runtime = createWorldPickupRuntime({ getItemName: (itemId) => ({ wood: "목재" })[itemId] });
  const obj = object(1, 1);
  const entry = runtime.register(obj, "wood");
  assert.equal(entry.text, "E : 목재 줍기");
  assert.equal(obj.userData.pickupItemId, "wood");
});

test("finds only the nearest attached pickup and unregisters it", () => {
  const runtime = createWorldPickupRuntime();
  const nearest = object(1, 0);
  const removed = object(0.2, 0, false);
  runtime.register(nearest, "wood");
  runtime.register(removed, "stoneDust");
  assert.equal(runtime.findNearest({ x: 0, z: 0 }, 2).obj, nearest);
  runtime.unregister(nearest);
  assert.equal(runtime.entries.length, 1);
  assert.equal(nearest.userData.pickupItemId, undefined);
});
