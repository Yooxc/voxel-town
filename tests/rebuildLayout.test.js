import test from "node:test";
import assert from "node:assert/strict";
import { getRebuildLayout, isPointInPolygon } from "../src/world/rebuildLayout.js";
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
  assert.deepEqual(workActivity.position, { x: -0.5, y: 2, z: -17.5 });
  assert.equal(layout.arrival.spawn.y, 8);
  assert.equal(layout.welcomeArea.resident.y, 8);
});

test("tour helpers use the same offset layout as world placement", () => {
  const layout = getRebuildLayout(3, 5, 1);
  assert.deepEqual(getTourCheckpoints(3, 5, 1), layout.tour.checkpoints);
  assert.deepEqual(getTourGuideDefinitions(3, 5, 1), layout.tour.guides);
  assert.deepEqual(layout.tour.guides.map((guide) => guide.name), ["다온"]);
});

test("market relocation keeps pickups and guide avoidance aligned with visible objects", () => {
  for (const origin of [[0, 0, 0], [10, -4, 2]]) {
    const layout = getRebuildLayout(...origin);
    const materials = layout.market.stalls.find((stall) => stall.id === "materials");
    assert.deepEqual(layout.workArea.stall, { x: materials.x, y: materials.y, z: materials.z });
    for (const [kind, objects] of [["stall", layout.market.stalls], ["resident", layout.market.residents]]) {
      objects.forEach((object, index) => {
        const matches = layout.navigationObstacles.filter((obstacle) => obstacle.id === `market-${kind}-${index + 1}`);
        assert.equal(matches.length, 1);
        assert.equal(matches[0].x, object.x);
        assert.equal(matches[0].z, object.z);
      });
    }
  }
});

test("defines inspectable craft display items for the market conversation", () => {
  const stalls = getRebuildLayout().market.stalls;
  const craftStall = stalls.find((stall) => stall.id === "craft");

  assert.deepEqual(craftStall.displayItems.map((item) => item.name), ["작은 상자", "작업 도구"]);
  assert.ok(craftStall.displayItems.every((item) => item.description && item.interestResponse));
  assert.ok(stalls.every((stall) => stall.displayItems.every((item) => item.name && item.description)));
});

test("places the final tour explanation at the quarry route gate", () => {
  const layout = getRebuildLayout();
  const finalPoint = layout.tour.checkpoints.at(-1).position;

  assert.deepEqual(finalPoint, layout.explorationPath);
  assert.ok(Math.hypot(
    finalPoint.x - layout.generalMine.entrance.x,
    finalPoint.z - layout.generalMine.entrance.z,
  ) < 6);
});

test("defines an 80-unit route and an outdoor quarry with reserved expansion anchors", () => {
  const layout = getRebuildLayout(10, -5, 2);
  const points = layout.generalMine.pathPoints;
  const routeLength = points.slice(1).reduce((total, point, index) => (
    total + Math.hypot(point.x - points[index].x, point.z - points[index].z)
  ), 0);
  const bounds = layout.generalMine.rockBounds;

  assert.ok(Math.abs(routeLength - 80) < 0.0001);
  assert.equal(layout.generalMine.center.y, 5);
  assert.ok(layout.generalMine.initialRocks.every((rock) => (
    rock.x >= bounds.minX && rock.x <= bounds.maxX
      && rock.z >= bounds.minZ && rock.z <= bounds.maxZ
      && isPointInPolygon(rock.x, rock.z, layout.generalMine.resourceArea.polygon)
  )));
  assert.deepEqual(layout.miningDemo.rockBounds, {
    minX: 30.5, maxX: 38.5, minZ: -31.5, maxZ: -22.5,
  });
  assert.equal(layout.generalMine.rubbleClusters.filter((cluster) => cluster.id.startsWith("central")).length, 2);
  assert.ok(layout.expansionAnchors.f1.x > layout.market.stalls[2].x);
  assert.ok(layout.expansionAnchors.f2.z < layout.generalMine.center.z);
});
