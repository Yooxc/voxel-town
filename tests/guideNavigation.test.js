import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGuideNavigationPath,
  findGuidePath,
  isGuideSegmentClear,
} from "../src/systems/guideNavigation.js";

test("routes a guide around a fixed obstacle", () => {
  const start = { x: 0, z: 0 };
  const end = { x: 6, z: 0 };
  const obstacles = [{ type: "circle", x: 3, z: 0, radius: 0.8 }];
  const path = findGuidePath(start, end, { obstacles });

  assert.ok(path.length >= 2);
  let previous = start;
  for (const point of path) {
    assert.equal(isGuideSegmentClear(previous, point, obstacles), true);
    previous = point;
  }
  assert.deepEqual(path.at(-1), end);
});

test("grounds generated detours with the supplied terrain height", () => {
  const path = buildGuideNavigationPath(
    { x: 0, y: 0, z: 0 },
    [{ x: 6, y: 0, z: 0 }],
    {
      obstacles: [{ type: "box", x: 3, z: 0, halfWidth: 0.8, halfDepth: 0.8 }],
      heightAt: (x, z) => x * 0.1 + z * 0.05,
    },
  );

  assert.ok(path.length >= 2);
  for (const point of path) assert.equal(point.y, point.x * 0.1 + point.z * 0.05);
});
