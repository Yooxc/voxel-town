import test from "node:test";
import assert from "node:assert/strict";
import { createInventoryFeatureCoordinator } from "../src/systems/inventoryFeatureCoordinator.js";

function createElementStub() {
  return {
    style: {},
    textContent: "",
    value: "",
    children: [],
    appendChild(child) { this.children.push(child); },
    replaceChildren(...children) { this.children = children; },
  };
}

function createGroup() {
  return {
    children: [],
    userData: {},
    visible: false,
    add(child) { this.children.push(child); },
    remove(child) { this.children = this.children.filter((entry) => entry !== child); },
  };
}

test("composes inventory state, credits, equipment, and gameplay APIs", () => {
  const uiKeys = [
    "invWin", "equipWin", "invgrid", "inventoryTrashDropZone", "discardOverlay", "discardDialog",
    "discardItemLabel", "discardOwnedCount", "discardInputLabel", "discardCountInput", "discardError",
    "personalStorageOverlay", "personalStorageWin", "personalStorageMessage", "personalStorageTransferCurtain",
    "personalStorageTransferDialog", "personalStorageTransferTitle", "personalStorageTransferItemLabel",
    "personalStorageTransferOwnedCount", "personalStorageTransferCountInput", "personalStorageTransferError",
    "inventoryStoragePanel", "personalStoragePanel",
  ];
  const ui = Object.fromEntries(uiKeys.map((key) => [key, createElementStub()]));
  const equipment = {
    equippedPickaxe: createGroup(),
    equippedSafetyHelmet: createGroup(),
    equippedNftHelmet: createGroup(),
    equippedLeftShoe: createGroup(),
    equippedRightShoe: createGroup(),
  };
  let quickUseState = null;
  const feature = createInventoryFeatureCoordinator({
    THREE: {},
    currencyName: "코인",
    itemModelBuilders: {
      buildPickaxeModel: () => ({}), buildShovelModel: () => ({}), buildSafetyHelmetModel: () => ({}),
      buildBasicShoesModel: () => ({}), buildFreshAirCanisterModel: () => ({}), buildPurifyPowderModel: () => ({}),
    },
    isTutorialComplete: () => false,
    getQuickUseAssignState: () => quickUseState,
    setQuickUseAssignState: (state) => { quickUseState = state; },
    onCreditsChanged() {},
    randomRange: (min) => min,
    inventoryUiController: {
      beginDrag() {}, clearDrag() {}, getDragState: () => null,
      setInventoryOpen: (open) => open, setPersonalStorageOpen: (open) => open,
    },
    ui,
    isBuildPartItemId: () => false,
    isFencePlacementMode: () => false,
    getSelectedStructureItemId: () => null,
    makeSlot: () => createElementStub(),
    setTabStyles() {}, showTooltip() {}, hideTooltip() {}, showMessage() {}, refreshQuestProgress() {},
    schedulePlayerSave() {}, closeFrontierBuild() {}, useFreshAirCanister() {}, toggleFencePlacementMode() {},
    toggleStructurePlacement() {}, setLastMessageUntil() {},
    integration: {
      createEquipmentVisuals: () => equipment,
      rigParts: {}, equipmentBuilders: {}, buildShovelModel: () => ({}), buildPickaxeModel: () => ({}),
      updateEquipmentVisibility() {},
      createEquipmentPreview: () => ({ resize() {}, renderPreview() {}, renderWindow() {} }),
      nftHelmetContract: "contract", nftHelmetTokenId: "1",
      isForgeOpen: () => false, isRefineryOpen: () => false, isFrontierBuildVisible: () => false,
      isPersonalStorageOpen: () => false, isInventoryOpen: () => false,
      renderForgeWindow() {}, renderRefineryWindow() {}, renderFrontierBuildWindow() {}, scheduleSave() {},
    },
    preview: {},
  });

  assert.equal(feature.addItem("freshAirCanister", 2), true);
  assert.equal(feature.getItemCount("freshAirCanister"), 2);
  feature.setPlayerCredits(125);
  assert.equal(feature.getPlayerCredits(), 125);
  assert.equal(feature.formatPlayerCreditsLabel(), "코인: 125원");
  assert.equal(feature.equipment, equipment);
});
