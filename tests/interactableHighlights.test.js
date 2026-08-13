import test from "node:test";
import assert from "node:assert/strict";
import { updateInteractableHighlights } from "../src/world/interactableHighlights.js";

function createLineInteractable() {
  return {
    highlightKind: "line",
    board: { children: [{ material: { opacity: 1 } }, { material: { opacity: 1 } }] },
  };
}

function createEmissiveInteractable(highlightKind) {
  const colors = [];
  return {
    highlightKind,
    board: { material: { emissive: { set: (color) => colors.push(color) } } },
    colors,
  };
}

test("updates line highlight opacity for active and inactive entries", () => {
  const inactive = createLineInteractable();
  const active = createLineInteractable();
  updateInteractableHighlights([inactive, active], active);
  assert.deepEqual(inactive.board.children.map((child) => child.material.opacity), [0, 0]);
  assert.deepEqual(active.board.children.map((child) => child.material.opacity), [0.9, 0.9]);
});

test("updates emissive highlights and leaves none entries unchanged", () => {
  const inactive = createEmissiveInteractable();
  const active = createEmissiveInteractable();
  const none = createEmissiveInteractable("none");
  updateInteractableHighlights([inactive, active, none], active);
  assert.deepEqual(inactive.colors, [0x000000]);
  assert.deepEqual(active.colors, [0x000000, 0xffaa00]);
  assert.deepEqual(none.colors, []);
});
