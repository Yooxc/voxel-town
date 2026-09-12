import test from "node:test";
import assert from "node:assert/strict";
import { createGatheringPlantsRuntime } from "../src/world/gatheringPlants.js";

test("shows shared plants, hides gathered entries, and reuses them on respawn", () => {
  const added = [];
  const runtime = createGatheringPlantsRuntime({ scene: { add: (object) => added.push(object) }, mapId: "광산" });
  runtime.applySnapshot({
    plants: [
      { id: "grass-1", kind: "grass", itemId: "wildGrass", x: 1, y: 0, z: 1 },
      { id: "flower-1", kind: "flower", itemId: "wildFlower", x: 5, y: 0, z: 5 },
    ],
  });

  assert.equal(added.length, 2);
  assert.equal(runtime.findNearest({ x: 1, z: 1 }, "광산", 2)?.id, "grass-1");
  assert.equal(runtime.findNearest({ x: 1, z: 1 }, "폐광", 2), null);

  runtime.applySnapshot({ plants: [{ id: "flower-1", kind: "flower", itemId: "wildFlower", x: 5, y: 0, z: 5 }] });
  assert.equal(runtime.getEntry("grass-1").root.visible, false);

  runtime.applySnapshot({ plants: [{ id: "grass-1", kind: "grass", itemId: "wildGrass", x: -3, y: 0, z: 2 }] });
  assert.equal(added.length, 2);
  assert.equal(runtime.getEntry("grass-1").root.position.x, -3);
  assert.equal(runtime.getEntry("grass-1").root.visible, true);
});
