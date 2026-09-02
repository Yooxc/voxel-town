import assert from "node:assert/strict";
import test from "node:test";
import { createPlayerSaveStatusPresenter } from "../src/auth/gameSessionIntegration.js";

test("maps save states to the player save badge", () => {
  const calls = [];
  const presenter = createPlayerSaveStatusPresenter({
    badge: "badge",
    isServerBackedSession: () => true,
    updateBadge: (...args) => calls.push(args),
    hideBadge: (badge) => calls.push(["hide", badge]),
  });

  presenter.setStatus("저장됨", "success");
  presenter.hideStatus();

  assert.deepEqual(calls, [
    ["badge", { text: "저장됨", borderColor: "rgba(122,209,151,0.5)", color: "#dff8e7", visible: true }],
    ["hide", "badge"],
  ]);
});
