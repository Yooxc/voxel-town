function setLineHighlightOpacity(interactable, opacity) {
  for (const child of interactable.board.children) {
    child.material.opacity = opacity;
  }
}

function setInteractableHighlight(interactable, isActive) {
  if (interactable.highlightKind === "line") {
    setLineHighlightOpacity(interactable, isActive ? 0.9 : 0);
  } else if (interactable.highlightKind !== "none") {
    interactable.board.material.emissive.set(isActive ? 0xffaa00 : 0x000000);
  }
}

export function updateInteractableHighlights(interactables, activeInteractable) {
  for (const interactable of interactables) {
    setInteractableHighlight(interactable, false);
  }
  if (activeInteractable) {
    setInteractableHighlight(activeInteractable, true);
  }
}
