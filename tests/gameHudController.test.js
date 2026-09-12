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

test("keeps a welcome dialogue visible until it is explicitly closed", () => {
  const title = createEventTarget();
  title.style = {};
  const viewport = createEventTarget();
  viewport.innerWidth = 800;
  viewport.innerHeight = 600;
  class Vector3 {
    copy(value) { Object.assign(this, value); return this; }
    project() { this.z = 0; return this; }
  }
  const dialog = { style: { display: "none" } };
  const dialogText = {};
  const target = { parent: {}, position: { x: 0, y: 0, z: 0 } };
  const controller = createGameHudController({
    Vector3, MathUtils: { clamp: (value) => value }, dialog, dialogText, tooltip: null,
    npcNameTag: { style: {} }, playerNameTag: { style: {} },
    showMessageUi: () => {}, hideMessageUi: () => {}, showMapArrivalUi: () => {}, hideMapArrivalUi: () => {},
    getCamera: () => ({}), getPlayer: () => ({}), getTutorialNpcs: () => [], getActiveNpc: () => null,
    canPlayGame: () => true, hasNickname: () => false, getNickname: () => "",
    airHud: {
      wrap: { style: {}, offsetWidth: 214, offsetHeight: 120 }, title,
      storage: { getItem: () => null, setItem: () => {} }, storageKey: "air-hud", viewport,
    },
  });

  controller.showNpcDialog("환영합니다", null, target);
  assert.equal(dialog.style.display, "block");
  assert.equal(dialogText.textContent, "환영합니다");
  controller.hideNpcDialog();
  assert.equal(dialog.style.display, "none");
});

test("renders named NPC dialogue choices with stable highlighting and viewport bounds", () => {
  const previousDocument = globalThis.document;
  function createElement() {
    const listeners = new Map();
    return {
      style: {}, children: [], listeners, textContent: "",
      append(...children) { this.children.push(...children); },
      appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children = []; },
      addEventListener(type, listener) { listeners.set(type, listener); },
    };
  }
  globalThis.document = { createElement };

  try {
    const title = createEventTarget();
    title.style = {};
    const viewport = createEventTarget();
    viewport.innerWidth = 800;
    viewport.innerHeight = 600;
    class Vector3 {
      copy(value) { Object.assign(this, value); return this; }
      project() { this.z = 0; return this; }
    }
    const dialog = { style: { display: "none" }, offsetWidth: 390, offsetHeight: 220 };
    const dialogPanel = { style: {} };
    const dialogName = { style: {}, textContent: "" };
    const dialogText = { style: {}, textContent: "" };
    const dialogChoices = createElement();
    const dialogTail = { style: {} };
    const target = { parent: {}, position: { x: -1, y: 0, z: 0 } };
    const controller = createGameHudController({
      Vector3, MathUtils: { clamp: (value) => value },
      dialog, dialogPanel, dialogName, dialogText, dialogChoices, dialogTail, tooltip: null,
      npcNameTag: { style: {} }, playerNameTag: { style: {} },
      showMessageUi: () => {}, hideMessageUi: () => {}, showMapArrivalUi: () => {}, hideMapArrivalUi: () => {},
      getCamera: () => ({}), getPlayer: () => ({}),
      getTutorialNpcs: () => [{ obj: target, name: "세아" }], getActiveNpc: () => null,
      canPlayGame: () => true, hasNickname: () => false, getNickname: () => "",
      airHud: {
        wrap: { style: {}, offsetWidth: 214, offsetHeight: 120 }, title,
        storage: { getItem: () => null, setItem: () => {} }, storageKey: "air-hud", viewport,
      },
    });

    controller.showNpcDialog("아주 긴 이야기도 정해진 너비 안에서 표시됩니다.", null, target, {
      choices: [
        { label: "계속 이야기하기", onSelect: () => {} },
        { label: "대화 마치기", kind: "exit", onSelect: () => {} },
      ],
    });

    assert.equal(dialogName.textContent, "세아");
    assert.equal(dialog.style.width, "min(620px, calc(100vw - 32px))");
    assert.equal(dialog.style.left, "211px");
    assert.equal(dialogTail.style.left, "24px");
    assert.equal(dialogChoices.children.length, 2);
    const firstButton = dialogChoices.children[0];
    const marker = firstButton.children[0];
    firstButton.listeners.get("pointerenter")();
    assert.equal(marker.textContent, "›");
    firstButton.listeners.get("pointerleave")();
    assert.equal(marker.textContent, "");
    assert.match(dialogChoices.children[1].style.boxShadow, /inset/);

    controller.showNpcDialog("저를 따라와주세요.", null, target, { variant: "compact" });
    assert.equal(dialog.style.width, "min(300px, calc(100vw - 32px))");
    assert.equal(dialogText.style.fontSize, "14px");
  } finally {
    globalThis.document = previousDocument;
  }
});

test("pins focused dialogue to the viewport and restores world anchoring afterward", () => {
  const title = createEventTarget();
  title.style = {};
  const viewport = createEventTarget();
  viewport.innerWidth = 1000;
  viewport.innerHeight = 700;
  class Vector3 {
    copy(value) { Object.assign(this, value); return this; }
    project() { this.z = 0; return this; }
  }
  const dialog = { style: { display: "none" }, offsetWidth: 390, offsetHeight: 180 };
  const dialogTail = { style: {} };
  const target = { parent: {}, position: { x: 0, y: 0, z: 0 } };
  let focused = true;
  let hiddenCalls = 0;
  let compactCalls = 0;
  const controller = createGameHudController({
    Vector3, MathUtils: { clamp: (value) => value },
    dialog, dialogText: { style: {} }, dialogTail, tooltip: null,
    npcNameTag: { style: {} }, playerNameTag: { style: {} },
    showMessageUi: () => {}, hideMessageUi: () => {}, showMapArrivalUi: () => {}, hideMapArrivalUi: () => {},
    getCamera: () => ({}), getPlayer: () => ({}), getTutorialNpcs: () => [], getActiveNpc: () => null,
    isDialogueCameraFocused: () => focused,
    onNpcDialogHidden: () => { hiddenCalls += 1; },
    onNpcDialogCompact: () => { compactCalls += 1; },
    canPlayGame: () => true, hasNickname: () => false, getNickname: () => "",
    airHud: {
      wrap: { style: {}, offsetWidth: 214, offsetHeight: 120 }, title,
      storage: { getItem: () => null, setItem: () => {} }, storageKey: "air-hud", viewport,
    },
  });

  controller.showNpcDialog("대화 중", null, target);
  assert.equal(dialog.style.width, "min(620px, calc(100vw - 32px))");
  assert.equal(dialog.style.left, "50%");
  assert.equal(dialog.style.top, "auto");
  assert.equal(dialog.style.bottom, "24px");
  assert.equal(dialog.style.transform, "translateX(-50%)");
  assert.equal(dialogTail.style.display, "none");

  viewport.innerWidth = 600;
  controller.updateNpcDialogPosition();
  assert.equal(dialog.style.bottom, "16px");

  focused = false;
  controller.showNpcDialog("따라와 주세요", null, target, { variant: "compact" });
  assert.equal(dialog.style.transform, "translate(-50%, -100%)");
  assert.equal(dialogTail.style.display, "block");
  assert.equal(compactCalls, 1);
  controller.hideNpcDialog();
  assert.equal(hiddenCalls, 1);
});

test("uses one bounded scroll area and reports focused dialogue height changes", () => {
  const title = createEventTarget();
  title.style = {};
  const viewport = createEventTarget();
  viewport.innerWidth = 900;
  viewport.innerHeight = 700;
  class Vector3 {
    copy(value) { Object.assign(this, value); return this; }
    project() { this.z = 0; return this; }
  }
  const dialog = { style: { display: "none" }, offsetWidth: 620, offsetHeight: 280 };
  const dialogPanel = { style: {}, scrollTop: 64 };
  const dialogChoices = { style: {}, replaceChildren() {} };
  const target = { parent: {}, position: { x: 0, y: 0, z: 0 } };
  let layoutChanges = 0;
  const controller = createGameHudController({
    Vector3, MathUtils: { clamp: (value) => value },
    dialog, dialogPanel, dialogText: { style: {} }, dialogChoices, tooltip: null,
    npcNameTag: { style: {} }, playerNameTag: { style: {} },
    showMessageUi: () => {}, hideMessageUi: () => {}, showMapArrivalUi: () => {}, hideMapArrivalUi: () => {},
    getCamera: () => ({}), getPlayer: () => ({}), getTutorialNpcs: () => [], getActiveNpc: () => null,
    isDialogueCameraFocused: () => true,
    onNpcDialogLayoutChange: () => { layoutChanges += 1; },
    canPlayGame: () => true, hasNickname: () => false, getNickname: () => "",
    airHud: {
      wrap: { style: {}, offsetWidth: 214, offsetHeight: 120 }, title,
      storage: { getItem: () => null, setItem: () => {} }, storageKey: "air-hud", viewport,
    },
  });

  controller.showNpcDialog("긴 대화", null, target);
  assert.equal(dialogPanel.style.maxHeight, "308px");
  assert.equal(dialogPanel.style.overflowY, "auto");
  assert.equal(dialogPanel.scrollTop, 0);
  assert.equal(dialogChoices.style.maxHeight, "none");
  assert.equal(dialogChoices.style.overflowY, "visible");
  assert.equal(layoutChanges, 1);

  dialogPanel.scrollTop = 48;
  viewport.innerHeight = 400;
  viewport.listeners.get("resize")();
  assert.equal(dialogPanel.style.maxHeight, "176px");
  assert.equal(dialogPanel.scrollTop, 48);
});
