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
  rebuildWastelandDraftsFromFencePosts,
  partitionExpiredWastelandClaims,
  getExpiredWastelandDraftReservations,
  getFrontierBoothInteractionPlan,
  getFrontierShopSellability,
  getSellableFrontierShopEntries,
  getFrontierShopRegistrationAccess,
  createFrontierShopPurchasePlan,
  getFrontierShopListingClearPlan,
  getFrontierShopListingRegistrationPlan,
  getFrontierShopSlotUserAssignmentPlan,
  getFrontierShopSlotUserClearPlan,
  getFrontierShopListingPriceUpdatePlan,
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

test("frontier booth interaction plan resolves defaults and access mode", () => {
  const dependencies = {
    canManageShopSlot: (parcelLabel) => parcelLabel === "P1",
    canUseShopSlot: () => false,
    canManageDisplaySlot: () => false,
    canUseDisplaySlot: (parcelLabel, slotKey) => parcelLabel === "P2" && slotKey === "displayB",
  };
  assert.deepEqual(
    getFrontierBoothInteractionPlan({ type: "frontierShopBooth", parcelLabel: "P1" }, "P9", dependencies),
    { parcelLabel: "P1", slotKey: "shop", boothTitle: "상점", mode: "manage", hintText: "E : 판매 관리" }
  );
  assert.deepEqual(
    getFrontierBoothInteractionPlan({ type: "frontierDisplayBooth", parcelLabel: "P2", slotKey: "displayB" }, "P9", dependencies),
    { parcelLabel: "P2", slotKey: "displayB", boothTitle: "전시", mode: "manage", hintText: "E : 전시 관리" }
  );
  assert.equal(getFrontierBoothInteractionPlan({ type: "airPurifier" }, "P9", dependencies), null);
});

test("frontier shop candidates exclude restricted inventory entries", () => {
  const dependencies = {
    isNftInventoryEntry: (entry) => entry.kind === "nft",
    getSlotItemId: (entry) => entry.itemId,
    itemDefs: {
      wood: { category: "misc" },
      tool: { category: "misc" },
      permit: { category: "misc", isAuthorityItem: true },
    },
    getInventoryEntryCategory: (entry) => entry.category,
    isQuestCriticalItemBlockedFromDiscard: (entry) => entry.itemId === "quest",
  };
  assert.deepEqual(getFrontierShopSellability({ itemId: "wood", category: "misc" }, dependencies), { ok: true, reason: "" });
  assert.equal(getFrontierShopSellability({ itemId: "tool", category: "equip" }, dependencies).ok, false);
  assert.equal(getFrontierShopSellability({ itemId: "permit", category: "misc" }, dependencies).ok, false);
  assert.deepEqual(
    getSellableFrontierShopEntries([
      { itemId: "wood", category: "misc" },
      { itemId: "tool", category: "equip" },
      null,
    ], dependencies),
    [{ entry: { itemId: "wood", category: "misc" }, index: 0 }]
  );
});

test("frontier shop registration access requires completion, assignment, and permission", () => {
  assert.equal(getFrontierShopRegistrationAccess({ buildState: { stage: 99 }, assignedWallet: "0x1", canUse: true }).ok, false);
  assert.equal(getFrontierShopRegistrationAccess({ buildState: { stage: 100 }, assignedWallet: "", canUse: true }).reason, "상점 사용자 지정 필요");
  assert.equal(getFrontierShopRegistrationAccess({ buildState: { stage: 100 }, assignedWallet: "0x1", canUse: false }).reason, "상점 운영 권한이 없습니다.");
  assert.deepEqual(
    getFrontierShopRegistrationAccess({ buildState: { stage: 100 }, assignedWallet: "0x1", canUse: true }),
    { ok: true, reason: "" }
  );
});

test("frontier shop purchase plan validates stock, buyer, and credits", () => {
  const base = {
    shopState: { itemId: "wood", quantity: 5, price: 12, sellerWallet: "0xSeller" },
    quantity: 2,
    currentWallet: "0xBuyer",
    canAffordPlayerCredits: (amount) => amount <= 30,
    clampPlayerCredits: (amount) => amount,
  };
  assert.equal(createFrontierShopPurchasePlan({ ...base, parcelLabel: "" }).reason, "상점 정보를 찾을 수 없습니다.");
  assert.equal(createFrontierShopPurchasePlan({ ...base, parcelLabel: "P1", quantity: 6 }).reason, "재고가 부족합니다.");
  assert.equal(createFrontierShopPurchasePlan({ ...base, parcelLabel: "P1", currentWallet: "0xseller" }).reason, "자신이 등록한 상품은 구매할 수 없습니다.");
  assert.equal(createFrontierShopPurchasePlan({ ...base, parcelLabel: "P1", quantity: 3 }).reason, "개척 코인이 부족합니다.");
  assert.deepEqual(
    createFrontierShopPurchasePlan({ ...base, parcelLabel: "P1" }),
    { ok: true, purchaseQty: 2, totalPrice: 24, purchasedItemId: "wood", sellerWallet: "0xseller" }
  );
});

test("frontier shop operation plans preserve listing and user safeguards", () => {
  const listedShop = { itemId: "wood", quantity: 3, price: 10, pendingCredits: 0 };
  const clamp = (amount) => amount;
  assert.deepEqual(
    getFrontierShopListingClearPlan({ parcelLabel: "P1", canEdit: true, shopState: listedShop, clampPlayerCredits: clamp }),
    { ok: true, itemId: "wood", quantity: 3, clearSellerWallet: true }
  );
  assert.equal(
    getFrontierShopListingRegistrationPlan({
      parcelLabel: "P1", canRegister: true, itemId: "wood", quantity: 4, price: 7, ownedCount: 3, shopState: listedShop,
    }).reason,
    "판매 수량만큼 아이템을 보유하고 있지 않습니다."
  );
  assert.deepEqual(
    getFrontierShopListingRegistrationPlan({
      parcelLabel: "P1", canRegister: true, itemId: "wood", quantity: 2, price: 7, ownedCount: 3, shopState: listedShop,
    }),
    { ok: true, itemId: "wood", quantity: 2, price: 7, previousItemId: "wood", previousQuantity: 3 }
  );
  assert.equal(
    getFrontierShopSlotUserAssignmentPlan({
      canManage: true, walletAddress: "", shopState: {}, normalizeWalletAddress: (value) => value, clampPlayerCredits: clamp,
    }).reason,
    "지갑 주소를 입력해주세요."
  );
  assert.equal(
    getFrontierShopSlotUserClearPlan({ canManage: true, shopState: listedShop, clampPlayerCredits: clamp }).ok,
    false
  );
  assert.deepEqual(
    getFrontierShopListingPriceUpdatePlan({ parcelLabel: "P1", canEdit: true, shopState: listedShop, nextPrice: 1200000 }),
    { ok: true, price: 999999 }
  );
});

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

test("울타리 기둥에서 소유자별 토지 선언 초안을 재구성한다", () => {
  const fencePosts = new Map([
    ["1:2", { key: "1:2", ownerId: "dev_1" }],
    ["1:1", { key: "1:1", ownerId: "dev_1" }],
    ["3:3", { key: "3:3", ownerId: "dev_2" }],
    ["9:9", { key: "9:9", ownerId: "dev_1" }],
  ]);
  const previousDrafts = new Map([
    [
      "dev_1",
      {
        lastPromptSignature: "preserved",
        reservedAt: 10,
        updatedAt: 20,
        expiresAt: 30,
        phase: "draft_active",
      },
    ],
  ]);
  const drafts = rebuildWastelandDraftsFromFencePosts({
    fencePosts,
    claims: [{ postKeys: ["9:9"] }],
    previousDrafts,
    now: 100,
    reservationMs: 500,
    activePhase: "draft_active",
  });

  assert.deepEqual(drafts.get("dev_1"), {
    ownerId: "dev_1",
    postKeys: ["1:1", "1:2"],
    lastPromptSignature: "preserved",
    reservedAt: 10,
    updatedAt: 20,
    expiresAt: 30,
    phase: "draft_active",
  });
  assert.deepEqual(drafts.get("dev_2"), {
    ownerId: "dev_2",
    postKeys: ["3:3"],
    lastPromptSignature: "",
    reservedAt: 100,
    updatedAt: 100,
    expiresAt: 600,
    phase: "draft_active",
  });
});

test("만료된 claim과 울타리 예약 초안만 선별한다", () => {
  const expiredClaim = { ownerId: "dev_1", expiresAt: 100 };
  const activeClaim = { ownerId: "dev_2", expiresAt: 101 };
  const partitioned = partitionExpiredWastelandClaims(
    [expiredClaim, activeClaim, { ownerId: "dev_3" }],
    100
  );
  assert.deepEqual(partitioned.expired, [expiredClaim]);
  assert.deepEqual(partitioned.active, [activeClaim, { ownerId: "dev_3" }]);

  const expiredDraft = { postKeys: ["1:1"], expiresAt: 100 };
  const drafts = new Map([
    ["expired", expiredDraft],
    ["active", { postKeys: ["2:2"], expiresAt: 101 }],
    ["empty", { postKeys: [], expiresAt: 100 }],
  ]);
  assert.deepEqual(getExpiredWastelandDraftReservations(drafts, 100), [
    ["expired", expiredDraft],
  ]);
});
