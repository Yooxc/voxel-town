function createButton(text) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  Object.assign(button.style, {
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(95,175,125,0.92)",
    color: "#102315",
    cursor: "pointer",
    pointerEvents: "auto",
    fontSize: "12px",
    fontWeight: "800",
  });
  return button;
}

export function createDevTerrainLabController({ parent, isDevSession, enter, leave, reset }) {
  const travelButton = createButton("지형 실험장");
  const resetButton = createButton("지형 초기화");
  resetButton.style.background = "rgba(255,183,77,0.92)";
  parent.append(travelButton, resetButton);

  let inside = false;
  function refresh() {
    const visible = Boolean(isDevSession());
    travelButton.style.display = visible ? "inline-flex" : "none";
    resetButton.style.display = visible && inside ? "inline-flex" : "none";
    travelButton.textContent = inside ? "원래 위치로 복귀" : "지형 실험장";
  }

  travelButton.addEventListener("click", () => {
    if (!isDevSession()) return;
    if (inside) {
      leave();
      inside = false;
    } else {
      enter();
      inside = true;
    }
    refresh();
  });
  resetButton.addEventListener("click", () => reset());
  refresh();

  return { refresh, isInside: () => inside, setInside: (value) => { inside = Boolean(value); refresh(); } };
}
