import test from "node:test";
import assert from "node:assert/strict";
import { createInventoryFacade } from "../src/systems/inventoryFacade.js";

test("inventory facade resolves equipped pickaxe data from the live slot", () => {
  const inventory = { slots: [{ itemId: "pickaxe", instanceId: "p1", pickaxeLevel: 4 }], pickaxeLevel: 1 };
  const runtime = {
    getEquippedRef: () => ({ itemId: "pickaxe", instanceId: "p1" }),
    getEquippedItem: () => "pickaxe",
  };
  const facade = createInventoryFacade({
    inventory, personalStorage: { slots: [] }, itemDefs: { pickaxe: { upgradeKey: "pickaxe" } }, runtime,
    isNftEntry: () => false, isSameAsEquipped: (a, b) => a.instanceId === b.instanceId,
    getSlotItemId: (entry) => entry?.itemId, clampPickaxeLevel: (level) => level,
    getEntryTooltipData: () => null, isQuestCritical: () => false,
  });
  assert.equal(facade.getEquippedPickaxeLevel(), 4);
  assert.equal(facade.resolveDisplayEntry({ itemId: "pickaxe", instanceId: "p1" }).pickaxeLevel, 4);
});
