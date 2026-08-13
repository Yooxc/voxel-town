import test from "node:test";
import assert from "node:assert/strict";
import { formatGatheringStatNumber, getRockHpHudView } from "../src/ui/gatheringHud.js";

test("formats gathering values and clamps the health ratio", () => {
  assert.equal(formatGatheringStatNumber(2), "2");
  assert.equal(formatGatheringStatNumber(1.234), "1.23");
  const view = getRockHpHudView({
    hp: 8, maxHp: 4, labelPrefix: "석재 체력", projectedPosition: { x: 0, y: 0, z: 0 }, viewport: { width: 100, height: 80 },
  });
  assert.deepEqual(view, { x: 50, y: 40, ratio: 1, label: "석재 체력 8/4" });
});

test("hides rock health bars when the projected target is outside the viewport", () => {
  assert.equal(getRockHpHudView({
    hp: 1, maxHp: 2, projectedPosition: { x: 1.2, y: 0, z: 0 }, viewport: { width: 100, height: 80 },
  }), null);
});
