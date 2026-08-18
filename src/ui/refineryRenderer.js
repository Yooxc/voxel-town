function applyStyles(element, styles) {
  Object.assign(element.style, styles);
}

export function createRefineryRenderer({ elements, itemDefs, createItemVisual, getRecipes, getSelectedRecipe, selectRecipe, getItemCount, getRecipeDescription, getSuccessState, now }) {
  function renderItemCard(card, heading, itemId, count, accentColor = "#2f1700") {
    card.replaceChildren();
    applyStyles(card, { display: "grid", gridTemplateRows: "auto 124px auto 1fr", justifyItems: "center", alignItems: "start" });
    const title = document.createElement("div");
    title.textContent = heading;
    applyStyles(title, { fontSize: "22px", fontWeight: "800", color: "rgba(70,70,70,0.88)", marginBottom: "10px", textAlign: "center" });
    card.appendChild(title);
    const visualWrap = document.createElement("div");
    applyStyles(visualWrap, { width: "124px", height: "124px", borderRadius: "22px", background: "linear-gradient(180deg, rgba(246,246,246,0.96), rgba(224,224,224,0.9))", border: "1px solid rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" });
    visualWrap.appendChild(createItemVisual(itemId, { size: 96 }));
    card.appendChild(visualWrap);
    const name = document.createElement("div");
    name.textContent = itemDefs[itemId]?.name ?? itemId;
    applyStyles(name, { marginTop: "14px", fontSize: "20px", fontWeight: "900", color: "#222", textAlign: "center" });
    card.appendChild(name);
    const countLabel = document.createElement("div");
    countLabel.textContent = `${count}`;
    applyStyles(countLabel, { marginTop: "12px", fontSize: "68px", lineHeight: "0.95", fontWeight: "900", color: accentColor });
    card.appendChild(countLabel);
  }

  function render() {
    const recipes = getRecipes();
    const selectedRecipe = getSelectedRecipe();
    elements.recipeList.replaceChildren();
    for (const recipe of recipes) {
      const button = document.createElement("button");
      button.type = "button";
      const active = recipe.id === selectedRecipe?.id;
      applyStyles(button, { width: "100%", textAlign: "left", border: active ? "1px solid rgba(255,140,0,0.78)" : "1px solid rgba(0,0,0,0.14)", borderRadius: "12px", padding: "10px", background: active ? "linear-gradient(180deg, rgba(255,222,182,0.92), rgba(255,240,220,0.92))" : "rgba(255,255,255,0.94)", cursor: "pointer" });
      button.innerHTML = `<div style="font-size:13px;font-weight:800;color:#222;">${recipe.label}</div><div style="margin-top:5px;font-size:11px;line-height:1.45;color:#555;">${itemDefs[recipe.inputItemId]?.name ?? recipe.inputItemId} ${recipe.inputCount}개 → ${itemDefs[recipe.outputItemId]?.name ?? recipe.outputItemId} ${recipe.outputCount}개</div>`;
      button.addEventListener("click", () => { selectRecipe(recipe.id); render(); });
      elements.recipeList.appendChild(button);
    }
    elements.title.textContent = "작업대";
    if (!selectedRecipe) {
      elements.inputCard.replaceChildren();
      elements.outputCard.replaceChildren();
      elements.info.replaceChildren();
      elements.notice.textContent = "아직 사용할 수 있는 재련 레시피가 없습니다.";
      Object.assign(elements.action, { disabled: true, textContent: "재련하기" });
      applyStyles(elements.action, { opacity: "0.55", cursor: "default", background: "rgba(235,235,235,0.78)" });
      return;
    }
    const inputName = itemDefs[selectedRecipe.inputItemId]?.name ?? selectedRecipe.inputItemId;
    const outputName = itemDefs[selectedRecipe.outputItemId]?.name ?? selectedRecipe.outputItemId;
    const inputOwned = getItemCount(selectedRecipe.inputItemId);
    const outputOwned = getItemCount(selectedRecipe.outputItemId);
    const canCraft = inputOwned >= selectedRecipe.inputCount;
    const success = getSuccessState();
    const successActive = success.until > now();
    renderItemCard(elements.inputCard, "재료", selectedRecipe.inputItemId, selectedRecipe.inputCount, canCraft ? "#2f6a1e" : "#8b2f2f");
    renderItemCard(elements.outputCard, "결과", selectedRecipe.outputItemId, selectedRecipe.outputCount, "#7a4a12");
    elements.info.replaceChildren();
    for (const entry of [{ label: "보유 재료", value: `${inputName} ${inputOwned}개` }, { label: "현재 보유", value: `${outputName} ${outputOwned}개` }]) {
      const card = document.createElement("div");
      applyStyles(card, { padding: "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.12)", height: "88px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" });
      card.innerHTML = `<div style="font-size:12px;font-weight:700;color:rgba(70,70,70,0.74);margin-bottom:6px;">${entry.label}</div><div style="font-size:24px;font-weight:900;color:#242424;line-height:1.1;">${entry.value}</div>`;
      elements.info.appendChild(card);
    }
    if (successActive) {
      elements.notice.textContent = success.message;
      applyStyles(elements.notice, { background: "rgba(231, 255, 229, 0.92)", border: "1px solid rgba(71, 164, 72, 0.34)", color: "#24622c" });
    } else {
      elements.notice.textContent = canCraft ? getRecipeDescription(selectedRecipe) : `${inputName} ${selectedRecipe.inputCount}개가 있어야 ${outputName}를 만들 수 있습니다.`;
      applyStyles(elements.notice, { background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.12)", color: "#444" });
    }
    elements.action.disabled = !canCraft;
    elements.action.textContent = successActive ? "완료!" : "재련하기";
    applyStyles(elements.action, { opacity: canCraft ? "1" : "0.55", cursor: canCraft ? "pointer" : "default", background: canCraft ? "rgba(255,255,255,0.88)" : "rgba(235,235,235,0.78)" });
  }

  return { render };
}
