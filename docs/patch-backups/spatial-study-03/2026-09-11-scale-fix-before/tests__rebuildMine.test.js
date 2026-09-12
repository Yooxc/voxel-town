import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createRebuildMine } from "../src/world/rebuildMine.js";
import { getRebuildLayout } from "../src/world/rebuildLayout.js";

test("creates a connected outdoor quarry with terraces, rubble, facilities, and signs", () => {
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
  assert.equal(mine.routeShoulders.length, layout.generalMine.pathPoints.length - 1);
  assert.ok(groundSurfaces.includes(mine.floor));
  assert.ok(mine.pathSegments.every((segment) => groundSurfaces.includes(segment)));
  assert.ok(mine.routeShoulders.every((shoulder) => groundSurfaces.includes(shoulder)));
  assert.ok(walkable.every((entry) => entry.mapId === "광산"));
  assert.equal(mine.terraces.length, 4);
  assert.equal(mine.rubbleClusters.length, 4);
  assert.equal(mine.boundaryRocks.length, 24);
  assert.ok(mine.boundaryRocks.every((rock) => rock.userData.isQuarryRubble && !rock.userData.isMineRock));
  assert.equal(colliders.length, 31);
  assert.equal(mine.entranceSign.name, "EXCIT_REBUILD_QUARRY_SIGN");
  assert.equal(mine.returnSign.name, "EXCIT_REBUILD_QUARRY_SIGN");
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

  assert.equal(mine.floor.position.y, 6.045);
  assert.ok(mine.boundaryRocks.every((rock) => rock.position.y > 6));
  assert.ok(mine.terraces.every((terrace) => terrace.position.y > 6));
});
