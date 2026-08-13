import test from "node:test";
import assert from "node:assert/strict";
import { createInventoryRuntime } from "../src/systems/inventoryRuntime.js";

function createRuntime() {
  const inventory = {
    slots: [null, null, null],
    quickUse: { 1: null, 2: null },
    equipped: { tool: null },
  };
  const personalStorage = { slots: [null, null] };
  let pendingQuickUse = null;
  const entry = (itemId, count = 1, extra = {}) => ({ itemId, count, ...extra });

  return {
    inventory,
    personalStorage,
    runtime: createInventoryRuntime({
      inventory,
      personalStorage,
      itemDefs: {
        stone: { stackMax: 10 },
        pickaxe: { stackMax: 1, equipSlot: "tool" },
        deed: { stackMax: 1, isAuthorityItem: true },
      },
      getSlotItemId: (value) => value?.itemId ?? null,
      getSlotItemCount: (value) => value?.count ?? 0,
      isNftInventoryEntry: (value) => value?.kind === "nft",
      normalizeInventorySlotEntry: (value) => (value?.itemId ? { ...value } : null),
      normalizeEquippedItemRef: (value) => (value?.itemId ? { ...value } : null),
      createInventorySlotEntry: entry,
      createEquippedItemRef: (itemId, extra) => entry(itemId, 1, extra),
      getInventoryStackMax: (itemId) => ({ stone: 10, pickaxe: 1, deed: 1 }[itemId] ?? 1),
      getInventoryEntryEquipSlot: (value) => (value?.itemId === "pickaxe" ? "tool" : null),
      isSameInventoryEntryAsEquipped: (value, equipped) => value?.itemId === equipped?.itemId,
      isQuestCriticalItemBlockedFromDiscard: () => false,
      getQuickUseAssignState: () => pendingQuickUse,
      setQuickUseAssignState: (value) => { pendingQuickUse = value; },
    }),
  };
}

test("moves stackable items between inventory and personal storage", () => {
  const { inventory, personalStorage, runtime } = createRuntime();
  assert.equal(runtime.addItemToInventory("stone", 12), true);
  assert.equal(inventory.slots[0].count, 10);
  assert.equal(inventory.slots[1].count, 2);

  assert.deepEqual(runtime.moveToStorage(inventory.slots[0], 4), { ok: true });
  assert.equal(inventory.slots[0].count, 6);
  assert.equal(personalStorage.slots[0].count, 4);
  assert.deepEqual(runtime.moveToInventory(0), { ok: true });
  assert.equal(inventory.slots[0].count, 10);
  assert.equal(inventory.slots[1].count, 2);
});

test("protects equipped and authority items from discard and storage", () => {
  const { inventory, runtime } = createRuntime();
  runtime.addItemToInventory("pickaxe");
  runtime.addItemToInventory("deed");
  runtime.setEquippedRef("tool", { itemId: "pickaxe" });

  assert.equal(runtime.canDiscard(inventory.slots[0]).ok, false);
  assert.equal(runtime.canStore(inventory.slots[0]).ok, false);
  assert.equal(runtime.canDiscard(inventory.slots[1]).ok, false);
});

test("tracks credits without allowing negative balances", () => {
  const { runtime } = createRuntime();
  runtime.setCredits(12.8);
  assert.equal(runtime.getCredits(), 12);
  assert.equal(runtime.spendCredits(7), true);
  assert.equal(runtime.getCredits(), 5);
  assert.equal(runtime.spendCredits(6), false);
  assert.equal(runtime.getCredits(), 5);
});
