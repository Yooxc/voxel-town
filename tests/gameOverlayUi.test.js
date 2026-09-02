import test from "node:test";
import assert from "node:assert/strict";
import { createMansionSleepDialogUi, createMapEffectOverlays } from "../src/ui/gameOverlayUi.js";

function createDocumentStub() {
  return {
    createElement(tagName) {
      const handlers = new Map();
      return {
        tagName,
        style: {},
        children: [],
        appendChild(child) { this.children.push(child); },
        append(...children) { this.children.push(...children); },
        addEventListener(type, handler) { handlers.set(type, handler); },
        dispatch(type) { handlers.get(type)?.({}); },
      };
    },
  };
}

test("creates the mansion sleep dialog and connects its actions", () => {
  const documentRef = createDocumentStub();
  const uiLayer = { children: [], appendChild(child) { this.children.push(child); } };
  let closed = 0;
  let confirmed = 0;
  const { overlay, dialog } = createMansionSleepDialogUi({
    uiLayer, documentRef,
    onClose: () => { closed += 1; },
    onConfirm: () => { confirmed += 1; },
  });
  overlay.dispatch("click");
  dialog.children[2].children[0].dispatch("click");
  dialog.children[2].children[1].dispatch("click");
  assert.equal(uiLayer.children.length, 2);
  assert.equal(closed, 2);
  assert.equal(confirmed, 1);
});

test("creates map fade and pollution overlays", () => {
  const documentRef = createDocumentStub();
  const uiLayer = { children: [], appendChild(child) { this.children.push(child); } };
  const { mapFade, pollutionOverlay } = createMapEffectOverlays({ uiLayer, documentRef });
  assert.equal(uiLayer.children.length, 2);
  assert.equal(mapFade.style.pointerEvents, "none");
  assert.equal(pollutionOverlay.id, "pollutionOverlay");
});
