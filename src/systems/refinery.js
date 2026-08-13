export const REFINERY_RECIPES = Object.freeze({
  purifyPowder: { id: "purifyPowder", label: "정화 가루", inputItemId: "stoneDust", inputCount: 3, outputItemId: "purifyPowder", outputCount: 1 },
  woodPlank: { id: "woodPlank", label: "목재", inputItemId: "woodChip", inputCount: 2, outputItemId: "woodPlank", outputCount: 1 },
  woodFloor: { id: "woodFloor", label: "목재 바닥", inputItemId: "woodPlank", inputCount: 2, outputItemId: "woodFloor", outputCount: 1 },
  woodWall: { id: "woodWall", label: "목재 벽", inputItemId: "woodPlank", inputCount: 3, outputItemId: "woodWall", outputCount: 1 },
  woodPillar: { id: "woodPillar", label: "목재 기둥", inputItemId: "woodPlank", inputCount: 2, outputItemId: "woodPillar", outputCount: 1 },
  stoneFloor: { id: "stoneFloor", label: "석재 바닥", inputItemId: "masonryStone", inputCount: 2, outputItemId: "stoneFloor", outputCount: 1 },
  stoneWall: { id: "stoneWall", label: "석재 벽", inputItemId: "masonryStone", inputCount: 3, outputItemId: "stoneWall", outputCount: 1 },
  stonePillar: { id: "stonePillar", label: "석재 기둥", inputItemId: "masonryStone", inputCount: 2, outputItemId: "stonePillar", outputCount: 1 },
});

export function getDefaultRefineryRecipe(recipes = REFINERY_RECIPES) {
  return recipes.purifyPowder;
}

export function getRefineryRecipeEntries(recipes = REFINERY_RECIPES) {
  return Object.values(recipes);
}

export function getSelectedRefineryRecipe(recipeId, recipes = REFINERY_RECIPES) {
  return recipes[recipeId] ?? getDefaultRefineryRecipe(recipes);
}

export function createRefineryCraftPlan(recipe, { inputOwned, getItemName }) {
  if (!recipe) return { ok: false, reason: "" };
  if (inputOwned < recipe.inputCount) {
    const inputName = getItemName(recipe.inputItemId) ?? recipe.inputItemId;
    return { ok: false, reason: `${inputName} ${recipe.inputCount}개가 필요합니다.`, duration: 1100 };
  }
  return {
    ok: true,
    inputItemId: recipe.inputItemId,
    inputCount: recipe.inputCount,
    outputItemId: recipe.outputItemId,
    outputCount: recipe.outputCount,
    successMessage: `${getItemName(recipe.outputItemId) ?? recipe.outputItemId} ${recipe.outputCount}개 재련 완료`,
  };
}

export function getRefineryRecipeDescription(recipe, { isBuildPartItemId, itemDefs } = {}) {
  if (!recipe) return "";
  if (recipe.outputItemId === "purifyPowder") return "정화 가루는 공기 정화탑에 사용할 수 있는 정화용 가공 분말입니다.";
  if (recipe.outputItemId === "woodPlank") return "목재는 앞으로 빈 땅에 건축물을 세울 때 사용할 기본 건축 재료입니다.";
  if (isBuildPartItemId?.(recipe.outputItemId)) return "재련대에서 제작하는 자유 건축용 기본 부품입니다.";
  return `${itemDefs?.[recipe.outputItemId]?.name ?? recipe.outputItemId} 제작 결과물`;
}
