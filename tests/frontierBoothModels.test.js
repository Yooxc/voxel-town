import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  buildFrontierBuildingSign,
  buildFrontierBoothLabel,
  buildFrontierBoothProductVisual,
  buildFrontierDisplayBoothVisual,
} from "../src/world/frontierBoothModels.js";

const originalDocument = globalThis.document;

function createCanvasContext() {
  return {
    fillRect() {}, clearRect() {}, beginPath() {}, roundRect() {}, fill() {}, fillText() {},
    measureText(text) { return { width: String(text).length * 40 }; },
  };
}

globalThis.document = {
  createElement(tagName) {
    assert.equal(tagName, "canvas");
    return { width: 0, height: 0, getContext: () => createCanvasContext() };
  },
};

test.after(() => {
  globalThis.document = originalDocument;
});

test("creates a building sign and booth label with a board and text face", () => {
  assert.equal(buildFrontierBuildingSign("P6").children.length, 2);
  assert.equal(buildFrontierBoothLabel("상점", "운영 중").children.length, 2);
});

test("creates product visual for model and icon-only items", () => {
  const itemDefs = {
    model: { makeInventoryModel: () => new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1)) },
    icon: { icon: "I" },
  };
  assert.equal(buildFrontierBoothProductVisual("model", 3, { itemDefs }).children.length, 2);
  assert.equal(buildFrontierBoothProductVisual("icon", 3, { itemDefs }).children.length, 2);
  assert.equal(buildFrontierBoothProductVisual("missing", 3, { itemDefs }).children.length, 0);
});

test("creates display visual for regular and NFT inventory entries", () => {
  const dependencies = {
    itemDefs: { tool: { makeInventoryModel: () => new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1)) } },
    normalizeInventorySlotEntry: (entry) => entry,
    isNftInventoryEntry: (entry) => entry.kind === "nft",
    getSlotItemId: (entry) => entry.itemId,
    getInventoryEntryDisplayIcon: (entry) => entry.icon,
    getInventoryEntryDisplayName: (entry) => entry.name,
  };
  assert.equal(buildFrontierDisplayBoothVisual({ itemId: "tool", icon: "T", name: "Tool" }, dependencies).children.length, 3);
  assert.equal(buildFrontierDisplayBoothVisual({ kind: "nft", icon: "N", name: "NFT" }, dependencies).children.length, 2);
  assert.equal(buildFrontierDisplayBoothVisual(null, dependencies).children.length, 0);
});
