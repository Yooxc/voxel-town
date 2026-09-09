import test from "node:test";
import assert from "node:assert/strict";
import { getRebuildLayout } from "../src/world/rebuildLayout.js";
import { getTourCheckpoints, getTourGuideDefinitions } from "../src/systems/tourPlan.js";

test("shares facility access points between the activity goals and the tour", () => {
  const layout = getRebuildLayout(10, -4, 2);
  const restActivity = layout.activityLocations.find((location) => location.id === "rest-area");
  const workActivity = layout.activityLocations.find((location) => location.id === "work-area");
  const restTour = layout.tour.checkpoints.find((checkpoint) => checkpoint.id === "rest-area");
  const workTour = layout.tour.checkpoints.find((checkpoint) => checkpoint.id === "work-area");

  assert.deepEqual(restActivity.position, restTour.position);
  assert.deepEqual(workActivity.position, workTour.position);
  assert.equal(restActivity.mapId, "광산");
  assert.deepEqual(workActivity.position, { x: 4.3, y: 2, z: -27.2 });
  assert.equal(layout.arrival.spawn.y, 4.4);
  assert.equal(layout.welcomeArea.resident.y, 4.4);
});

test("tour helpers use the same offset layout as world placement", () => {
  const layout = getRebuildLayout(3, 5, 1);
  assert.deepEqual(getTourCheckpoints(3, 5, 1), layout.tour.checkpoints);
  assert.deepEqual(getTourGuideDefinitions(3, 5, 1), layout.tour.guides);
});

test("defines inspectable craft display items for the market conversation", () => {
  const stalls = getRebuildLayout().market.stalls;
  const craftStall = stalls.find((stall) => stall.id === "craft");

  assert.deepEqual(craftStall.displayItems.map((item) => item.name), ["작은 상자", "작업 도구"]);
  assert.ok(craftStall.displayItems.every((item) => item.description && item.interestResponse));
  assert.ok(stalls.every((stall) => stall.displayItems.every((item) => item.name && item.description)));
});

test("places the final tour explanation near the exploration fence", () => {
  const layout = getRebuildLayout();
  const finalPoint = layout.tour.checkpoints.at(-1).position;

  assert.ok(finalPoint.z <= -36);
});

test("places a walkable general mine route beside the rebuild market", () => {
  const layout = getRebuildLayout(10, -5, 2);
  const points = layout.generalMine.pathPoints;
  const routeLength = points.slice(1).reduce((total, point, index) => (
    total + Math.hypot(point.x - points[index].x, point.z - points[index].z)
  ), 0);
  const bounds = layout.generalMine.rockBounds;

  assert.ok(routeLength > 25);
  assert.equal(layout.generalMine.center.y, 2);
  assert.ok(layout.generalMine.initialRocks.every((rock) => (
    rock.x >= bounds.minX && rock.x <= bounds.maxX
      && rock.z >= bounds.minZ && rock.z <= bounds.maxZ
  )));
  assert.deepEqual(layout.miningDemo.rockBounds, {
    minX: 26.5, maxX: 34.5, minZ: -33.5, maxZ: -24.5,
  });
});
