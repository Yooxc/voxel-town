import test from "node:test";
import assert from "node:assert/strict";
import { createWelcomeArea } from "../src/world/welcomeArea.js";

test("creates a shared welcome landmark and registers its resident", () => {
  const sceneObjects = [];
  const colliders = [];
  let registration = null;
  const area = createWelcomeArea({
    scene: { add: (object) => sceneObjects.push(object) },
    addCollider: (object) => { colliders.push(object); return colliders.length - 1; },
    registerNpc: (obj, name, hint, metadata) => {
      registration = { obj, name, hint, metadata };
      return registration;
    },
    x: 6,
    y: 0,
    z: -4,
  });

  assert.equal(sceneObjects[0], area.root);
  assert.equal(area.root.name, "EXCIT_WELCOME_AREA");
  assert.equal(area.resident.name, "EXCIT_WELCOME_RESIDENT");
  assert.equal(registration.obj, area.resident);
  assert.equal(registration.name, "마루");
  assert.equal(registration.metadata.role, "welcome");
  assert.equal(colliders.length, 4);
});
