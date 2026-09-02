import assert from "node:assert/strict";
import test from "node:test";
import { createInventoryIntegrationController } from "../src/ui/inventoryIntegrationController.js";

function createGroup() {
  return {
    children: [],
    userData: {},
    add(child) { this.children.push(child); },
    remove(child) { this.children = this.children.filter((entry) => entry !== child); },
    visible: false,
  };
}

test("synchronizes equipped tool model and refreshes visible inventory windows", () => {
  const calls = [];
  const equipment = {
    equippedPickaxe: createGroup(), equippedSafetyHelmet: createGroup(), equippedNftHelmet: createGroup(),
    equippedLeftShoe: createGroup(), equippedRightShoe: createGroup(),
  };
  const controller = createInventoryIntegrationController({
    createEquipmentVisuals: () => equipment,
    rigParts: {}, equipmentBuilders: {},
    buildShovelModel: () => ({ type: "shovel" }),
    buildPickaxeModel: (level) => ({ type: "pickaxe", level }),
    disposeObject: () => calls.push("dispose"),
    updateEquipmentVisibility: (_equipment, state) => calls.push(`visibility:${state.hasToolEquipped}`),
    createEquipmentPreview: () => ({ renderWindow: () => calls.push("equipment"), resize() {}, renderPreview() {} }),
    getEquippedItemRef: () => null,
    getEquippedItem: () => null,
    getEquippedToolId: () => "pickaxe",
    getEquippedPickaxeLevel: () => 3,
    nftHelmetContract: "contract", nftHelmetTokenId: "1",
    pruneQuickUseBindings: () => calls.push("prune"),
    isForgeOpen: () => true, isRefineryOpen: () => false,
    isFrontierBuildVisible: () => false, isPersonalStorageOpen: () => true, isInventoryOpen: () => true,
    renderForgeWindow: () => calls.push("forge"), renderRefineryWindow: () => calls.push("refinery"),
    renderFrontierBuildWindow: () => calls.push("frontier"), renderPersonalStorageWindow: () => calls.push("storage"),
    renderInventoryWindow: () => calls.push("inventory"), scheduleSave: () => calls.push("save"),
  });
  controller.initializePreview({});
  controller.updateInventoryUi();

  assert.equal(equipment.equippedPickaxe.children[0].type, "pickaxe");
  assert.equal(equipment.equippedPickaxe.children[0].level, 3);
  assert.ok(calls.includes("forge"));
  assert.ok(calls.includes("storage"));
  assert.ok(calls.includes("inventory"));
  assert.ok(!calls.includes("refinery"));
  assert.equal(calls.at(-1), "save");
});

test("binds inventory window actions through the integration controller", () => {
  let handlers;
  const calls = [];
  createInventoryIntegrationController({
    createEquipmentVisuals: () => ({
      equippedPickaxe: createGroup(), equippedSafetyHelmet: createGroup(), equippedNftHelmet: createGroup(),
      equippedLeftShoe: createGroup(), equippedRightShoe: createGroup(),
    }),
    rigParts: {}, equipmentBuilders: {},
    buildShovelModel: () => ({}), buildPickaxeModel: () => ({}), disposeObject() {},
    updateEquipmentVisibility() {}, getEquippedItemRef: () => null, getEquippedItem: () => null,
    getEquippedToolId: () => null, getEquippedPickaxeLevel: () => 1,
    nftHelmetContract: "contract", nftHelmetTokenId: "1",
    bindWindowEvents: (nextHandlers) => { handlers = nextHandlers; },
    onWalletLogout: () => calls.push("logout"), onWalletCopy: () => calls.push("copy"),
    setActiveTab: (tabId) => calls.push(`tab:${tabId}`),
    handleTrashDragOver: () => calls.push("dragover"), handleTrashDragLeave: () => calls.push("dragleave"),
    handleTrashDrop: () => calls.push("drop"),
    closeDiscardDialog: () => calls.push("discard-close"), commitDiscardDialog: () => calls.push("discard-confirm"),
    closePersonalStorage: () => calls.push("storage-close"),
    closePersonalStorageTransferDialog: () => calls.push("transfer-close"),
    commitPersonalStorageTransferDialog: () => calls.push("transfer-confirm"),
  });

  handlers.onWalletLogout();
  handlers.onTabChange("misc");
  handlers.onDiscardKeyDown({ key: "Enter", preventDefault: () => calls.push("prevent") });
  handlers.onPersonalStorageTransferKeyDown({ key: "Escape", preventDefault: () => calls.push("prevent") });

  assert.deepEqual(calls, ["logout", "tab:misc", "prevent", "discard-confirm", "prevent", "transfer-close"]);
});
