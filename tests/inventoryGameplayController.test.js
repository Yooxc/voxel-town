import test from "node:test";
import assert from "node:assert/strict";
import { createInventoryGameplayController } from "../src/ui/inventoryGameplayController.js";

function createUi() {
  const field = () => ({ style: {}, textContent: "", value: "", max: "", disabled: false, focus() {}, select() {} });
  return {
    invWin: field(), equipWin: field(), invgrid: field(), inventoryTrashDropZone: field(),
    discardOverlay: field(), discardDialog: field(), discardItemLabel: field(), discardOwnedCount: field(),
    discardInputLabel: field(), discardCountInput: field(), discardError: field(),
    personalStorageOverlay: field(), personalStorageWin: field(), personalStorageMessage: field(),
    personalStorageTransferCurtain: field(), personalStorageTransferDialog: field(),
    personalStorageTransferTitle: field(), personalStorageTransferItemLabel: field(),
    personalStorageTransferOwnedCount: field(), personalStorageTransferCountInput: field(), personalStorageTransferError: field(),
    inventoryStoragePanel: { subtitle: field(), grid: field() },
    personalStoragePanel: { subtitle: field(), grid: field() },
  };
}

function createController() {
  const inventory = { slots: [{ itemId: "freshAirCanister", count: 2 }], quickUse: { 1: null }, equipped: { tool: null } };
  let assignment = null;
  return {
    inventory,
    controller: createInventoryGameplayController({
      inventory,
      personalStorage: { slots: [null] },
      inventoryRuntime: {
        hasOwnedItem: (itemId) => inventory.slots.some((entry) => entry?.itemId === itemId),
        pruneQuickUseBindings() {}, getInventorySlotEntry: (entry) => entry,
        canDiscard: () => ({ ok: true }), findInventorySlotIndex: () => 0,
        moveToStorage: () => ({ ok: true }), moveToInventory: () => ({ ok: true }),
      },
      inventoryUiController: { beginDrag() {}, clearDrag() {}, getDragState() { return null; }, setInventoryOpen: (open) => open, setPersonalStorageOpen: (open) => open, closeTransfer() {}, openTransfer() { return null; }, getTransferCommitPlan() { return { ok: false }; } },
      quickUseAllowedKeys: ["1"], itemDefs: { freshAirCanister: { name: "공기 캔" }, pickaxe: { name: "곡괭이" } }, ui: createUi(),
      getSlotItemId: (entry) => entry?.itemId, getSlotItemCount: (entry) => entry?.count ?? 0,
      getEntryCategory: (entry) => entry?.itemId === "freshAirCanister" ? "cons" : "equip",
      getEntryName: (entry) => entry?.itemId ?? "", getEntryTooltipData: () => null, getEntryEquipSlot: (entry) => entry?.itemId === "pickaxe" ? "tool" : null,
      getEntryVisual: () => ({}), getDisplayResolvedEntry: (entry) => entry,
      normalizeInventorySlotEntry: (entry) => entry ? { ...entry } : null, createInventorySlotEntry: (itemId) => ({ itemId }), createEquippedItemRef: (itemId, extra) => ({ itemId, ...extra }),
      getEquippedItemRef: (slotId) => inventory.equipped[slotId], getEquippedItem: (slotId) => inventory.equipped[slotId]?.itemId ?? null,
      setEquippedItem: (slotId, entry) => { inventory.equipped[slotId] = entry; }, isNftEntry: () => false,
      isSameAsEquipped: (entry, equipped) => entry?.itemId === equipped?.itemId, isQuickUseAssignableItemId: (itemId) => itemId === "freshAirCanister",
      getQuickUseItemId: (key) => inventory.quickUse[key]?.itemId ?? null, getQuickUseKeyForItemId: () => "",
      assignQuickUseKeyToItem: (itemId, key) => { inventory.quickUse[key] = { itemId }; }, getQuickUseAssignState: () => assignment, setQuickUseAssignState: (next) => { assignment = next; },
      isBuildPartItemId: () => false, isFencePlacementMode: () => false, getSelectedStructureItemId: () => null, makeSlot: () => ({}), setTabStyles() {}, showTooltip() {}, hideTooltip() {}, showMessage() {}, updateInventoryUi() {}, refreshQuestProgress() {}, schedulePlayerSave() {}, closeFrontierBuild() {}, useFreshAirCanister() {}, toggleFencePlacementMode() {}, toggleStructurePlacement() {}, setLastMessageUntil() {},
    }),
  };
}

test("quick-use assignment preserves the binding save shape", () => {
  const { inventory, controller } = createController();
  controller.beginQuickUseAssignment(inventory.slots[0]);
  assert.equal(controller.commitQuickUseAssignment("1"), true);
  assert.deepEqual(inventory.quickUse, { 1: { itemId: "freshAirCanister" } });
});

test("equipment toggle stores an item reference and toggles it off", () => {
  const { inventory, controller } = createController();
  controller.toggleEquipItem("pickaxe");
  assert.deepEqual(inventory.equipped.tool, { itemId: "pickaxe", instanceId: null, pickaxeLevel: null });
  controller.toggleEquipItem("pickaxe");
  assert.equal(inventory.equipped.tool, null);
});
