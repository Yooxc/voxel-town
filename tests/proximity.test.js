import test from "node:test";
import assert from "node:assert/strict";
import { findNearestByPosition } from "../src/core/proximity.js";

test("finds the nearest eligible entry inside the radius", () => {
  const entries = [
    { id: "far", position: { x: 3, z: 0 } },
    { id: "disabled", position: { x: 1, z: 0 }, disabled: true },
    { id: "near", position: { x: 1.5, z: 0 } },
  ];
  const nearest = findNearestByPosition({
    entries,
    playerPosition: { x: 0, z: 0 },
    radius: 2,
    isEligible: (entry) => !entry.disabled,
  });
  assert.equal(nearest.id, "near");
});

test("returns null for entries on or outside the search radius", () => {
  assert.equal(
    findNearestByPosition({
      entries: [{ position: { x: 2, z: 0 } }],
      playerPosition: { x: 0, z: 0 },
      radius: 2,
    }),
    null
  );
});

test("accepts a custom position accessor for wasteland-style cells", () => {
  const cell = { id: "cell-1", x: 1.2, z: 0 };
  assert.equal(
    findNearestByPosition({
      entries: [cell],
      playerPosition: { x: 0, z: 0 },
      radius: 2,
      getPosition: (entry) => entry,
    }),
    cell
  );
});
