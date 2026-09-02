export function createGameplayHintController(uiLayer) {
  const element = document.createElement("div");
  element.id = "hintUI";
  Object.assign(element.style, {
    position: "fixed", left: "50%", bottom: "110px", transform: "translateX(-50%)",
    padding: "8px 10px", background: "rgba(0,0,0,0.45)", color: "white",
    fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "13px", borderRadius: "10px",
    pointerEvents: "none", opacity: "0", transition: "opacity 120ms ease", userSelect: "none",
  });
  uiLayer.appendChild(element);
  return {
    show: (text) => { element.textContent = text; element.style.opacity = "1"; },
    hide: () => { element.style.opacity = "0"; },
  };
}
