import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { getRebuildBlockoutHeight } from "../src/world/rebuildBlockout.js";
import { createRebuildBlockout } from "../src/world/rebuildBlockout.js";
import { getRebuildLayout } from "../src/world/rebuildLayout.js";

test("keeps the arrival hill above the market and creates a downhill transition", () => {
  const layout = getRebuildLayout();
  const hillHeight = getRebuildBlockoutHeight(0, 10, layout.origin);
  const middleHeight = getRebuildBlockoutHeight(0, -5, layout.origin);
  const marketHeight = getRebuildBlockoutHeight(0, -24, layout.origin);

  assert.equal(hillHeight, 2.4);
  assert.ok(middleHeight > marketHeight);
  assert.equal(marketHeight, 0);
  assert.equal(layout.arrival.spawn.y, hillHeight);
});

test("places the rendered terrain under the door, spawn, and market elevations", () => {
  const layout = getRebuildLayout();
  const scene = new THREE.Scene();
  const groundSurfaces = [];
  const blockout = createRebuildBlockout({
    scene,
    groundSurfaces,
    registerWalkableSurface: () => {},
    addCollider: () => 0,
    layout,
  });
  scene.updateMatrixWorld(true);
  const raycaster = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  const sample = (position) => {
    raycaster.set(new THREE.Vector3(position.x, 20, position.z), down);
    return raycaster.intersectObject(blockout.terrain)[0]?.point.y;
  };

  assert.ok(Math.abs(sample(layout.arrival.door) - (layout.arrival.door.y + 0.015)) < 0.03);
  assert.ok(Math.abs(sample(layout.arrival.spawn) - (layout.arrival.spawn.y + 0.015)) < 0.03);
  assert.ok(Math.abs(sample(layout.market.stalls[0]) - 0.015) < 0.03);
  assert.ok(groundSurfaces.includes(blockout.path));
});

test("creates three interactive market residents and visible display samples", () => {
  const layout = getRebuildLayout();
  const registrations = [];
  const blockout = createRebuildBlockout({
    scene: new THREE.Scene(),
    groundSurfaces: [],
    registerWalkableSurface: () => {},
    addCollider: () => 0,
    registerNpc: (obj, name, hint, metadata) => {
      const entry = { obj, name, hint, ...metadata };
      registrations.push(entry);
      return entry;
    },
    layout,
  });

  assert.equal(blockout.marketStalls.length, 3);
  assert.ok(blockout.marketStalls.every((stall) => stall.displayItems.length === 2));
  assert.equal(blockout.marketResidents.length, 3);
  assert.deepEqual(registrations.map((entry) => entry.role), [
    "market-resident", "market-resident", "market-resident",
  ]);
  assert.deepEqual(registrations.map((entry) => entry.market.stallId), ["materials", "craft", "living"]);
  const craftEntry = registrations.find((entry) => entry.market.id === "craft-resident");
  assert.deepEqual(craftEntry.market.displayItems.map((item) => item.name), ["작은 상자", "작업 도구"]);
  const craftStall = blockout.marketStalls[1];
  craftEntry.market.setHighlightedDisplayItem("crafted-box");
  assert.equal(craftStall.displayItems[0].scale.x, 1.16);
  assert.equal(craftStall.displayItems[1].scale.x, 1);
  craftEntry.market.setHighlightedDisplayItem("");
  assert.equal(craftStall.displayItems[0].scale.x, 1);
});


