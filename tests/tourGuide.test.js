import test from "node:test";
import assert from "node:assert/strict";
import { createTourGuide, createTourGuides } from "../src/world/tourGuide.js";
import { getTourCheckpoints, getTourGuideDefinitions } from "../src/systems/tourPlan.js";

test("creates a visible guide at the office with an arrival path and tour checkpoints", () => {
  const sceneObjects = [];
  const registrations = [];
  const colliders = [];
  const guide = createTourGuide({
    scene: { add: (...objects) => sceneObjects.push(...objects) },
    registerNpc: (object, name, hint, metadata) => {
      const entry = { obj: object, name, hint, ...metadata };
      registrations.push(entry);
      return entry;
    },
    addCollider: (object) => colliders.push(object),
    guideDefinition: getTourGuideDefinitions()[0],
    checkpoints: getTourCheckpoints(),
  });

  assert.ok(sceneObjects.includes(guide.root));
  assert.ok(sceneObjects.includes(guide.station));
  assert.equal(guide.station.name, "EXCIT_GUIDE_STATION");
  assert.equal(colliders.length, 2);
  assert.equal(guide.root.visible, true);
  assert.equal(guide.root.position.x, guide.origin.x);
  assert.equal(registrations[0].role, "tour-guide");
  assert.ok(guide.arrivalPath.length >= 2);
  assert.deepEqual(guide.arrivalPath.at(-1), guide.checkpoints[0].position);
  assert.deepEqual(guide.checkpoints.map((point) => point.id), [
    "guide-intro", "rest-area", "work-area", "exploration-path",
  ]);
});

test("creates separate guide stations for simultaneous visitors", () => {
  const guides = createTourGuides({
    scene: { add() {} },
    registerNpc: (object, name, hint, metadata) => ({ obj: object, name, hint, ...metadata }),
    addCollider: () => {},
    startX: 0,
    startZ: 0,
    startFlatY: 0,
  });

  assert.equal(guides.length, 4);
  assert.equal(new Set(guides.map((guide) => guide.id)).size, 4);
  assert.equal(new Set(guides.map((guide) => guide.entry.guideId)).size, 4);
});
