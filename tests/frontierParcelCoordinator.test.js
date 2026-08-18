import assert from "node:assert/strict";
import test from "node:test";
import { createFrontierParcelCoordinator } from "../src/world/frontierParcelCoordinator.js";

function createCoordinator() {
  return createFrontierParcelCoordinator({
    parcelLabels: ["P6"],
    authorityItemIds: { P6: "p6Permit" },
    defaultParcelLabel: "P6",
    buildStageConfig: [],
    itemDefs: { woodPlank: { name: "Wood" } },
    getBuildStateData: () => ({}),
    getActiveParcelLabel: () => "P6",
    setActiveParcelLabel: () => {},
    getWalletAddress: () => "",
    hasItem: () => false,
    isPlayerInsideParcel: () => false,
    normalizeInventorySlotEntry: (entry) => entry ?? null,
    getEntryName: (entry) => entry?.itemId ?? "",
    clampCredits: (value) => Math.max(0, Math.floor(Number(value) || 0)),
  });
}

test("normalizes persisted parcel construction and booth operation state", () => {
  const coordinator = createCoordinator();
  const state = coordinator.normalizeBuildState({
    p6: {
      stage: 100,
      signText: "  My Parcel  ",
      operations: {
        shop: { itemId: "woodPlank", quantity: 3, price: 45, userWallet: "0xabc" },
        displayA: { entry: { itemId: "woodPlank", count: 1 }, userWallet: "0xdef" },
      },
    },
  });

  assert.equal(state.p6.stage, 100);
  assert.equal(state.p6.signText, "My Parce");
  assert.equal(state.p6.operations.shop.statusText, "Wood x3 / 45원");
  assert.equal(state.p6.operations.shop.sellerWallet, "0xabc");
  assert.equal(state.p6.operations.displayA.statusText, "woodPlank 전시 중");
  assert.equal(state.p6.operations.displayB.statusText, "비어 있음");
});
