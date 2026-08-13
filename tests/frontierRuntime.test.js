import test from "node:test";
import assert from "node:assert/strict";
import { createFrontierRuntime } from "../src/systems/frontierRuntime.js";

function createShop() {
  return {
    itemId: "wood",
    quantity: 4,
    price: 10,
    sellerWallet: "seller",
    userWallet: "seller",
    pendingCredits: 0,
    lifetimeCredits: 0,
    statusText: "listed",
  };
}

test("purchases a listing and restores inventory when credit spending fails", () => {
  const runtime = createFrontierRuntime({ clampPlayerCredits: (value) => Math.max(0, Math.floor(value)) });
  const shop = createShop();
  let restored = false;
  const result = runtime.purchaseShopListing({
    parcelLabel: "P1",
    shopState: shop,
    quantity: 2,
    currentWallet: "buyer",
    canAffordPlayerCredits: () => true,
    addEntry: () => true,
    spendCredits: () => false,
    restoreInventory: () => { restored = true; },
    restoreCredits: () => {},
    getStatusText: () => "updated",
  });

  assert.deepEqual(result, { ok: false, reason: "credit-failed" });
  assert.equal(restored, true);
  assert.equal(shop.quantity, 4);
});

test("registers, clears, and assigns shop state through guarded plans", () => {
  const runtime = createFrontierRuntime({ clampPlayerCredits: (value) => Math.max(0, Math.floor(value)) });
  const shop = createShop();
  const registered = runtime.registerShopListing({
    parcelLabel: "P1",
    canRegister: true,
    itemId: "stone",
    quantity: 2,
    price: 7,
    ownedCount: 3,
    shopState: shop,
    sellerWallet: "seller",
    getStatusText: () => "stone listed",
    addItem: () => true,
    consumeItem: () => true,
  });
  assert.equal(registered.ok, true);
  assert.equal(shop.itemId, "stone");

  const blockedAssignment = runtime.assignShopUser({
    canManage: true,
    walletAddress: "buyer",
    shopState: shop,
    normalizeWalletAddress: (value) => value,
  });
  assert.equal(blockedAssignment.ok, false);

  const cleared = runtime.clearShopListing({
    parcelLabel: "P1",
    canEdit: true,
    shopState: shop,
    addItem: () => true,
  });
  assert.equal(cleared.ok, true);

  const assigned = runtime.assignShopUser({
    canManage: true,
    walletAddress: "buyer",
    shopState: shop,
    normalizeWalletAddress: (value) => value,
  });
  assert.equal(assigned.ok, true);
  assert.equal(shop.userWallet, "buyer");
});
