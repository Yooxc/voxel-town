import test from "node:test";
import assert from "node:assert/strict";
import { createGameHudController } from "../src/ui/gameHudController.js";

function createEventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type) => listeners.delete(type),
  };
}

test("restores, drags, and persists the air HUD position through the HUD controller", () => {
  const title = createEventTarget();
  title.style = {};
  const wrap = { style: {}, offsetWidth: 214, offsetHeight: 120, getBoundingClientRect: () => ({ left: 30, top: 40 }) };
  const viewport = createEventTarget();
  viewport.innerWidth = 800;
  viewport.innerHeight = 600;
  const storage = {
    value: JSON.stringify({ left: 30, top: 40 }),
    getItem: () => storage.value,
    setItem: (_key, value) => { storage.value = value; },
  };
  class Vector3 {}
  createGameHudController({
    Vector3, MathUtils: { clamp: (value) => value },
    dialog: { style: { display: "none" } }, dialogText: {}, tooltip: null,
    npcNameTag: { style: {} }, playerNameTag: { style: {} },
    showMessageUi: () => {}, hideMessageUi: () => {}, showMapArrivalUi: () => {}, hideMapArrivalUi: () => {},
    getCamera: () => ({}), getPlayer: () => ({}), getTutorialNpcs: () => [], getActiveNpc: () => null,
    canPlayGame: () => true, hasNickname: () => false, getNickname: () => "",
    airHud: { wrap, title, storage, storageKey: "air-hud", viewport },
  });

  assert.equal(wrap.style.left, "30px");
  title.listeners.get("pointerdown")({ button: 0, clientX: 40, clientY: 50, preventDefault() {} });
  viewport.listeners.get("pointermove")({ clientX: 160, clientY: 180 });
  assert.equal(wrap.style.left, "150px");
  assert.equal(wrap.style.top, "170px");
  assert.deepEqual(JSON.parse(storage.value), { left: 150, top: 170 });
  viewport.listeners.get("pointerup")();
  assert.equal(title.style.cursor, "grab");
});
