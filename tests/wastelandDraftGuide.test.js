import test from "node:test";
import assert from "node:assert/strict";

import {
  createWastelandDraftGuide,
  createWastelandFenceHudState,
} from "../src/systems/wastelandDraftGuide.js";

function createBorderKeys(minRow, maxRow, minCol, maxCol) {
  const keys = [];
  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      if (row === minRow || row === maxRow || col === minCol || col === maxCol) {
        keys.push(`${row}:${col}`);
      }
    }
  }
  return keys;
}

test("describes a confirmable wasteland draft", () => {
  const guide = createWastelandDraftGuide({
    draft: { postKeys: createBorderKeys(0, 4, 0, 4) },
    bounds: { minRow: 0, maxRow: 4, minCol: 0, maxCol: 4 },
    phase: "confirmable",
    minWidth: 5,
    minHeight: 5,
    confirmablePhase: "confirmable",
  });

  assert.equal(guide.postCount, 16);
  assert.equal(guide.requiredBorderCount, 16);
  assert.equal(guide.missingBorderCount, 0);
  assert.equal(guide.canConfirm, true);
  assert.equal(guide.text, "구역 확정 가능: 5 x 5");
});

test("identifies missing borders and inner fence posts", () => {
  const keys = createBorderKeys(0, 4, 0, 4).filter((key) => key !== "0:2");
  keys.push("2:2");
  const guide = createWastelandDraftGuide({
    draft: { postKeys: keys },
    bounds: { minRow: 0, maxRow: 4, minCol: 0, maxCol: 4 },
    phase: "active",
    minWidth: 5,
    minHeight: 5,
    confirmablePhase: "confirmable",
  });

  assert.equal(guide.innerPostCount, 1);
  assert.equal(guide.missingBorderCount, 1);
  assert.equal(guide.text, "5 x 5 | 내부 기둥 1개 제거 필요");
});

test("creates fence HUD state from the guide data", () => {
  assert.deepEqual(
    createWastelandFenceHudState({
      placementMode: false,
      guide: null,
      reservationText: "예약 대기 중",
      minWidth: 5,
      minHeight: 5,
    }),
    { visible: false }
  );

  const state = createWastelandFenceHudState({
    placementMode: true,
    guide: { postCount: 16, width: 5, height: 5, canConfirm: true, text: "구역 확정 가능: 5 x 5" },
    reservationText: "예약 유지 4:59",
    minWidth: 5,
    minHeight: 5,
  });
  assert.equal(state.visible, true);
  assert.equal(state.sizeText, "현재 테두리 5 x 5 | 최소 5 x 5");
  assert.equal(state.statusText, "예약 유지 4:59 | 구역 확정 가능");
});
