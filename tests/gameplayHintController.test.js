import test from "node:test";
import assert from "node:assert/strict";
import { createGameplayHintController } from "../src/ui/gameplayHintController.js";

test("shows and hides the gameplay hint", () => {
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => ({ id: "", style: {}, textContent: "" }) };
  const layer = { appendChild() {} };
  const hint = createGameplayHintController(layer);
  hint.show("Space : 대화");
  hint.hide();
  assert.ok(hint);
  globalThis.document = originalDocument;
});
