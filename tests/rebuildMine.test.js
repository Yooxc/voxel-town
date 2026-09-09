import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createRebuildMine } from "../src/world/rebuildMine.js";
import { getRebuildLayout } from "../src/world/rebuildLayout.js";

test("creates a connected general mine floor, route, boundaries, and direction signs", () => {
  const scene = new THREE.Scene();
  const groundSurfaces = [];
  const walkable = [];
  const colliders = [];
  const layout = getRebuildLayout();
  const mine = createRebuildMine({
    scene,
    groundSurfaces,
    registerWalkableSurface: (mapId, object) => walkable.push({ mapId, object }),
    addCollider: (object) => { colliders.push(object); return colliders.length - 1; },
    layout,
  });

  assert.equal(mine.root.parent, scene);
  assert.equal(mine.pathSegments.length, layout.generalMine.pathPoints.length - 1);
  assert.ok(groundSurfaces.includes(mine.floor));
  assert.ok(mine.pathSegments.every((segment) => groundSurfaces.includes(segment)));
  assert.ok(walkable.every((entry) => entry.mapId === "광산"));
  assert.equal(mine.boundaryRocks.length, 10);
  assert.equal(colliders.length, 12);
  assert.equal(mine.entranceSign.name, "EXCIT_REBUILD_MINE_SIGN");
  assert.equal(mine.returnSign.name, "EXCIT_REBUILD_MINE_SIGN");
});

test("keeps elevated rebuild mine props aligned with the configured world height", () => {
  const layout = getRebuildLayout(0, 0, 3);
  const mine = createRebuildMine({
    scene: new THREE.Scene(),
    groundSurfaces: [],
    registerWalkableSurface: () => {},
    addCollider: () => 0,
    layout,
  });

  assert.equal(mine.floor.position.y, 3.045);
  assert.ok(mine.boundaryRocks.every((rock) => rock.position.y > 3));
});
