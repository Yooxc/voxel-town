import test from "node:test";
import assert from "node:assert/strict";

import {
  createDefaultResidenceNoticeBoardEntry,
  createDefaultResidenceNoticeBoardState,
  normalizeResidenceNoticeBoardEntry,
  normalizeResidenceNoticeBoardState,
  getMansionRoomEntryPlan,
  getMansionRoomExitPlan,
  getMansionSleepPlan,
} from "../src/systems/residence.js";
import { renderResidenceNoticeBoardTexture } from "../src/world/residenceNoticeBoard.js";

const boardKeys = ["boardA", "boardB", "boardC"];

test("creates default residence notice board entries", () => {
  assert.deepEqual(createDefaultResidenceNoticeBoardEntry("boardB"), {
    title: "게시판 B",
    lines: ["공용 알림과 안내가", "표시될 예정입니다."],
  });
  assert.equal(Object.keys(createDefaultResidenceNoticeBoardState(boardKeys)).length, 3);
});

test("normalizes residence notice board text limits and defaults", () => {
  const entry = normalizeResidenceNoticeBoardEntry("boardA", {
    title: ` ${"A".repeat(30)} `,
    lines: [" first ", "", null, "second", "third", "fourth", "fifth"],
  });
  assert.equal(entry.title, "A".repeat(24));
  assert.deepEqual(entry.lines, ["first", "second", "third", "fourth"]);

  const state = normalizeResidenceNoticeBoardState(boardKeys, {
    boardC: { title: "", lines: [] },
  });
  assert.equal(state.boardA.title, "게시판 A");
  assert.equal(state.boardC.title, "게시판 C");
  assert.deepEqual(state.boardC.lines, ["공용 알림과 안내가", "표시될 예정입니다."]);
});

test("renders a normalized residence notice board into its canvas texture", () => {
  const calls = [];
  const ctx = {
    clearRect: (...args) => calls.push(["clearRect", ...args]),
    fillRect: (...args) => calls.push(["fillRect", ...args]),
    fillText: (...args) => calls.push(["fillText", ...args]),
    strokeRect: (...args) => calls.push(["strokeRect", ...args]),
  };
  const canvas = { width: 800, height: 480, getContext: () => ctx };
  const texture = { needsUpdate: false };
  const rendered = renderResidenceNoticeBoardTexture({
    canvas,
    texture,
    entry: { title: "공지", lines: ["첫 번째", "두 번째"] },
  });

  assert.equal(rendered, true);
  assert.equal(texture.needsUpdate, true);
  assert.deepEqual(calls, [
    ["clearRect", 0, 0, 800, 480],
    ["fillRect", 0, 0, 800, 480],
    ["fillText", "공지", 400, 92],
    ["strokeRect", 58, 132, 684, 290],
    ["fillText", "첫 번째", 400, 252],
    ["fillText", "두 번째", 400, 326],
  ]);
  assert.equal(renderResidenceNoticeBoardTexture({}), false);
});

test("calculates mansion entry, exit, and sleep movement plans", () => {
  const entryPlan = getMansionRoomEntryPlan("102", { x: 10, z: -4 }, 1);
  assert.equal(entryPlan.activeRoomKey, "102");
  assert.equal(entryPlan.roomToDestroy, "101");
  assert.equal(entryPlan.position.x, 10);
  assert.equal(entryPlan.position.y, 1);
  assert.ok(Math.abs(entryPlan.position.z - 0.2) < 0.000001);
  assert.equal(entryPlan.rotationY, Math.PI);
  assert.deepEqual(getMansionRoomExitPlan("102", { x: 3, z: 5, rotationY: 0.5 }, 2), {
    roomToDestroy: "102",
    position: { x: 3, y: 2, z: 5 },
    rotationY: 0.5,
  });
  assert.deepEqual(getMansionSleepPlan({ x: 8, z: 9 }, 1), {
    sleepPosition: { x: 7.85, y: 1, z: 9 },
    wakePoint: { x: 9.95, z: 9.2, rotationY: Math.PI * -0.5 },
    rotationY: Math.PI * -0.5,
  });
});
