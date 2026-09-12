import test from "node:test";
import assert from "node:assert/strict";
import { createRemotePlayerRuntime } from "../src/world/remotePlayers.js";

function createElement() {
  return {
    style: {},
    textContent: "",
    removeCalled: false,
    remove() { this.removeCalled = true; },
  };
}

test("shows only other connected players and removes them when their presence ends", () => {
  const originalDocument = globalThis.document;
  const labels = [];
  globalThis.document = { createElement: () => {
    const label = createElement();
    labels.push(label);
    return label;
  } };
  const roots = [];
  try {
    const runtime = createRemotePlayerRuntime({
      scene: { add: (root) => roots.push(root) },
      uiLayer: { appendChild() {} },
      camera: {},
      createPlayerRig: () => ({
        name: "",
        userData: {},
        position: { set() {} },
        rotation: { y: 0 },
        removeFromParent() {},
      }),
    });
    runtime.applySnapshot([
      { id: "self", name: "나", x: 0, y: 0, z: 0, rotationY: 0, mapId: "광산" },
      { id: "other", name: "다른 사람", x: 1, y: 0, z: 1, rotationY: 0, mapId: "광산" },
    ], "self");

    assert.equal(runtime.size(), 1);
    assert.equal(roots.length, 1);
    runtime.applySnapshot([], "self");
    assert.equal(runtime.size(), 0);
    assert.equal(labels[0].removeCalled, true);
  } finally {
    globalThis.document = originalDocument;
  }
});

test("shows a remote flower crown from the shared equipment state", () => {
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => createElement() };
  const headSocket = { add(child) { this.child = child; } };
  const crown = { name: "", visible: false, position: { set() {} } };
  try {
    const runtime = createRemotePlayerRuntime({
      scene: { add() {} },
      uiLayer: { appendChild() {} },
      camera: {},
      buildFlowerCrownModel: () => crown,
      createPlayerRig: () => ({
        name: "", userData: {}, position: { set() {} }, rotation: { y: 0 },
        getObjectByName: (name) => name === "EXCIT_SOCKET_HEAD" ? headSocket : null,
        removeFromParent() {},
      }),
    });

    runtime.applySnapshot([
      { id: "other", name: "다른 사람", x: 1, y: 0, z: 1, rotationY: 0, mapId: "광산", headItemId: "flowerCrown" },
    ], "self");
    assert.equal(headSocket.child, crown);
    assert.equal(crown.visible, true);

    runtime.applySnapshot([
      { id: "other", name: "다른 사람", x: 1, y: 0, z: 1, rotationY: 0, mapId: "광산", headItemId: "" },
    ], "self");
    assert.equal(crown.visible, false);
  } finally {
    globalThis.document = originalDocument;
  }
});
