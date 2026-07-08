import test from "node:test";
import assert from "node:assert/strict";

import {
  getWastelandDraftBounds,
  isCellInsideWastelandBounds,
  canLinkWastelandFencePostsByOwner,
  findWastelandDraftReservationHit,
  getWastelandDraftPhaseState,
  validateWastelandDraftRectangle,
  getWastelandClaimProgress,
  canCompleteWastelandClaimState,
  canCancelWastelandClaimState,
  getWastelandClaimPhaseState,
  canBuildOnWastelandCellState,
  getConflictingWastelandFencePostsForClaim,
  normalizeFrontierWastelandState,
  serializeFrontierWastelandServerState,
} from "../src/systems/frontier.js";

function createFencePosts(keys, ownerId = "dev_user_1") {
  const posts = new Map();
  for (const key of keys) {
    const [rowText, colText] = key.split(":");
    posts.set(key, {
      key,
      row: Number(rowText),
      col: Number(colText),
      ownerId,
    });
  }
  return posts;
}

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

test("5x5 테두리는 직사각형 확정 판정을 통과한다", () => {
  const postKeys = createBorderKeys(0, 4, 0, 4);
  const draft = { postKeys };
  const fencePosts = createFencePosts(postKeys);
  const cells = Array.from({ length: 25 }, (_, index) => ({
    id: `cell-${index}`,
    row: Math.floor(index / 5),
    col: index % 5,
  }));

  const bounds = getWastelandDraftBounds(draft, fencePosts);
  assert.deepEqual(bounds, { minRow: 0, maxRow: 4, minCol: 0, maxCol: 4 });

  const rect = validateWastelandDraftRectangle({
    draft,
    fencePosts,
    cells,
    minWidth: 5,
    minHeight: 5,
  });

  assert.equal(rect.width, 5);
  assert.equal(rect.height, 5);
  assert.equal(rect.requiredPostKeys.length, 16);
  assert.equal(rect.cellIds.length, 25);
});

test("테두리가 비면 직사각형 확정 판정을 통과하지 못한다", () => {
  const postKeys = createBorderKeys(0, 4, 0, 4).filter((key) => key !== "0:2");
  const draft = { postKeys };
  const fencePosts = createFencePosts(postKeys);

  const rect = validateWastelandDraftRectangle({
    draft,
    fencePosts,
    cells: [],
    minWidth: 5,
    minHeight: 5,
  });

  assert.equal(rect, null);
});

test("claim 완료 가능/취소 가능 판정이 owner와 상태를 반영한다", () => {
  const claim = {
    ownerId: "dev_user_1",
    cellIds: ["a", "b", "c", "d"],
    status: "active",
  };
  const cells = new Map([
    ["a", { state: "dug3" }],
    ["b", { state: "dug3" }],
    ["c", { state: "dug3" }],
    ["d", { state: "dug3" }],
  ]);
  const progress = getWastelandClaimProgress(claim, (id) => cells.get(id));

  assert.equal(progress.completed, 4);
  assert.equal(progress.readyToComplete, true);
  assert.equal(canCompleteWastelandClaimState(progress, "dev_user_1"), true);
  assert.equal(canCancelWastelandClaimState(progress, "dev_user_1"), true);
  assert.equal(canCompleteWastelandClaimState(progress, "dev_user_2"), false);
  assert.equal(
    canCancelWastelandClaimState(
      { ...progress, claim: { ...claim, status: "completed" } },
      "dev_user_1"
    ),
    false
  );
});

test("건축 가능 판정은 토지권/개간/간격 규칙을 확인한다", () => {
  const claim = {
    ownerId: "dev_user_1",
    minRow: 10,
    maxRow: 14,
    minCol: 20,
    maxCol: 24,
  };
  const targetCell = {
    row: 12,
    col: 22,
    clearProgress: 100,
  };

  const blockedBySpacing = canBuildOnWastelandCellState({
    cell: targetCell,
    claim,
    hasLandDeed: true,
    currentOwnerId: "dev_user_1",
    structures: [{ row: 11, col: 21 }],
    minSpacing: 2,
  });
  assert.equal(blockedBySpacing.ok, false);

  const allowed = canBuildOnWastelandCellState({
    cell: targetCell,
    claim,
    hasLandDeed: true,
    currentOwnerId: "dev_user_1",
    structures: [{ row: 8, col: 18 }],
    minSpacing: 2,
  });
  assert.equal(allowed.ok, true);

  const blockedByDeed = canBuildOnWastelandCellState({
    cell: targetCell,
    claim,
    hasLandDeed: false,
    currentOwnerId: "dev_user_1",
    structures: [],
    minSpacing: 2,
  });
  assert.equal(blockedByDeed.ok, false);
});

test("같은 셀이라도 부품 슬롯이 다르면 함께 배치할 수 있다", () => {
  const claim = {
    ownerId: "dev_user_1",
    minRow: 10,
    maxRow: 14,
    minCol: 20,
    maxCol: 24,
  };
  const targetCell = {
    row: 12,
    col: 22,
    clearProgress: 100,
  };

  const sameSlotBlocked = canBuildOnWastelandCellState({
    cell: targetCell,
    claim,
    hasLandDeed: true,
    currentOwnerId: "dev_user_1",
    structures: [{ row: 12, col: 22, slot: "floor" }],
    structureSlot: "floor",
    minSpacing: 0,
  });
  assert.equal(sameSlotBlocked.ok, false);

  const differentSlotAllowed = canBuildOnWastelandCellState({
    cell: targetCell,
    claim,
    hasLandDeed: true,
    currentOwnerId: "dev_user_1",
    structures: [{ row: 12, col: 22, slot: "floor" }],
    structureSlot: "wall",
    minSpacing: 0,
  });
  assert.equal(differentSlotAllowed.ok, true);
});

test("bounds 완충 판정은 2셀 안쪽만 true를 반환한다", () => {
  const bounds = { minRow: 10, maxRow: 14, minCol: 20, maxCol: 24 };

  assert.equal(isCellInsideWastelandBounds({ row: 12, col: 22 }, bounds, 0), true);
  assert.equal(isCellInsideWastelandBounds({ row: 9, col: 22 }, bounds, 0), false);
  assert.equal(isCellInsideWastelandBounds({ row: 8, col: 22 }, bounds, 2), true);
  assert.equal(isCellInsideWastelandBounds({ row: 7, col: 22 }, bounds, 2), false);
});

test("draft/claim phase와 예약 충돌 판정은 순수 함수로 계산된다", () => {
  const draftPhases = {
    NONE: "draft_none",
    ACTIVE: "draft_active",
    CONFIRMABLE: "draft_confirmable",
    EXPIRED: "draft_expired",
  };
  assert.equal(
    getWastelandDraftPhaseState({
      draft: { postKeys: ["0:0"] },
      isConfirmable: false,
      phases: draftPhases,
    }),
    draftPhases.ACTIVE
  );
  assert.equal(
    getWastelandDraftPhaseState({
      draft: { postKeys: createBorderKeys(0, 4, 0, 4), phase: draftPhases.EXPIRED },
      isConfirmable: true,
      phases: draftPhases,
    }),
    draftPhases.EXPIRED
  );

  const claimPhases = {
    NONE: "claim_none",
    ACTIVE: "claim_active",
    REWARD_PENDING: "claim_reward_pending",
    COMPLETED: "claim_completed",
    FAILED: "claim_failed",
  };
  const claimStatuses = {
    ACTIVE: "active",
    COMPLETED: "completed",
    FAILED: "failed",
  };
  assert.equal(
    getWastelandClaimPhaseState({
      progress: { claim: { status: "active" }, readyToComplete: true },
      claimStatuses,
      claimPhases,
    }),
    claimPhases.REWARD_PENDING
  );

  const claimDrafts = new Map([
    ["dev_1", { postKeys: createBorderKeys(0, 4, 0, 4), expiresAt: 12345 }],
  ]);
  const hit = findWastelandDraftReservationHit({
    cell: { row: 2, col: 2 },
    claimDrafts,
    currentOwnerId: "dev_2",
    getFencePostsByOwner: (draft) => createFencePosts(draft.postKeys, "dev_1"),
    buffer: 0,
  });
  assert.equal(hit?.ownerId, "dev_1");
});

test("충돌 기둥 선별과 owner 기반 울타리 연결 판정이 동작한다", () => {
  const fencePosts = new Map([
    ["10:10", { key: "10:10", row: 10, col: 10, ownerId: "dev_1" }],
    ["12:12", { key: "12:12", row: 12, col: 12, ownerId: "dev_2" }],
    ["20:20", { key: "20:20", row: 20, col: 20, ownerId: "dev_2" }],
  ]);
  const conflicts = getConflictingWastelandFencePostsForClaim({
    fencePosts,
    claim: { ownerId: "dev_1", minRow: 10, maxRow: 14, minCol: 10, maxCol: 14 },
    buffer: 2,
  });
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].key, "12:12");
  assert.equal(
    canLinkWastelandFencePostsByOwner({ ownerId: "dev_1" }, { ownerId: "dev_1" }),
    true
  );
  assert.equal(
    canLinkWastelandFencePostsByOwner({ ownerId: "dev_1" }, { ownerId: "dev_2" }),
    false
  );
});

test("황무지 서버 대상 상태는 drafts와 claim status를 정규화한다", () => {
  const state = serializeFrontierWastelandServerState({
    cells: [{ id: "cell-1", clearProgress: 45 }],
    drafts: [
      {
        ownerId: "dev_1",
        postKeys: ["1:1", "1:2"],
        reservedAt: 100,
        updatedAt: 120,
        expiresAt: 300,
        phase: "draft_active",
        lastPromptSignature: "runtime-only",
      },
    ],
    fencePosts: [],
    claims: [
      {
        ownerId: "dev_1",
        status: "failed",
        minRow: 1,
        maxRow: 5,
        minCol: 1,
        maxCol: 5,
      },
    ],
    structures: [],
  });

  const normalized = normalizeFrontierWastelandState(state);
  assert.equal(normalized.drafts.length, 1);
  assert.equal(normalized.drafts[0].ownerId, "dev_1");
  assert.equal("lastPromptSignature" in normalized.drafts[0], false);
  assert.equal(normalized.claims[0].status, "failed");
});
