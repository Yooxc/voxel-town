import test from "node:test";
import assert from "node:assert/strict";
import {
  REFINERY_RECIPES,
  getDefaultRefineryRecipe,
  getRefineryRecipeEntries,
  getSelectedRefineryRecipe,
  getRefineryRecipeDescription,
  createRefineryCraftPlan,
} from "../src/systems/refinery.js";

test("provides default, selected, and listed refinery recipes", () => {
  assert.equal(getDefaultRefineryRecipe().id, "purifyPowder");
  assert.equal(getRefineryRecipeEntries().length, 8);
  assert.equal(getSelectedRefineryRecipe("stoneWall").inputCount, 3);
  assert.equal(getSelectedRefineryRecipe("missing"), REFINERY_RECIPES.purifyPowder);
});

test("describes refinery outputs using supplied dependencies", () => {
  assert.match(getRefineryRecipeDescription(REFINERY_RECIPES.purifyPowder), /공기 정화탑/);
  assert.match(getRefineryRecipeDescription(REFINERY_RECIPES.woodFloor, { isBuildPartItemId: () => true }), /건축용/);
  assert.equal(
    getRefineryRecipeDescription({ outputItemId: "custom" }, { itemDefs: { custom: { name: "맞춤 재료" } } }),
    "맞춤 재료 제작 결과물"
  );
});

test("creates refinery plans for insufficient and sufficient materials", () => {
  const recipe = { inputItemId: "stoneDust", inputCount: 3, outputItemId: "purifyPowder", outputCount: 1 };
  const getItemName = (itemId) => ({ stoneDust: "돌가루", purifyPowder: "정화 가루" })[itemId];
  assert.equal(createRefineryCraftPlan(recipe, { inputOwned: 2, getItemName }).reason, "돌가루 3개가 필요합니다.");
  assert.deepEqual(
    createRefineryCraftPlan(recipe, { inputOwned: 3, getItemName }),
    {
      ok: true,
      inputItemId: "stoneDust",
      inputCount: 3,
      outputItemId: "purifyPowder",
      outputCount: 1,
      successMessage: "정화 가루 1개 재련 완료",
    }
  );
});
