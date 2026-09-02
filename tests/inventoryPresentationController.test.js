import test from "node:test";
import assert from "node:assert/strict";
import { getInventoryPreviewVariant } from "../src/ui/inventoryPresentationController.js";

test("inventory preview cache variants distinguish pickaxe levels", () => {
  assert.equal(getInventoryPreviewVariant("pickaxe", 3, 1), "lv3");
  assert.equal(getInventoryPreviewVariant("pickaxe", null, 2), "lv2");
  assert.equal(getInventoryPreviewVariant("shovel", 3, 1), "base");
});
