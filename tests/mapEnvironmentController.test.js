import assert from "node:assert/strict";
import test from "node:test";
import { createMapEnvironmentController } from "../src/world/mapEnvironmentController.js";

test("enables cave fog and torch while the player is beyond the camp door", () => {
  const color = { copy() { return this; }, lerp() { return this; } };
  const torch = { position: { copy() { return { add() {} }; } } };
  const controller = createMapEnvironmentController({
    getState: () => ({ player: { position: { z: 0 } }, mineGate: { position: { z: 10 } }, campGate: { position: { z: 2 } }, ambientLight: {}, sunLight: {}, torchLight: torch, torchEquipped: true }),
    MathUtils: { smoothstep: (v) => v, lerp: (_a, b) => b }, createColor: () => color, createVector3: () => ({}),
    scene: { fog: { color } }, caveDarkMaterials: [], darkeningEnabled: true, fogEnabled: true,
    worldFogColor: 0, caveFogColor: 1, worldFogNear: 1, worldFogFar: 10,
  });
  controller.update();
  assert.equal(torch.visible, true);
  assert.equal(torch.intensity, 1.8);
});
