import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createPlayerRig, getPlayerRigParts } from "../src/core/player.js";

function createModel({ withAuthoredToolSocket }) {
  const model = new THREE.Group();
  const head = new THREE.Bone();
  head.name = "EXCIT_HEAD";
  const leftHand = new THREE.Bone();
  leftHand.name = "EXCIT_HAND.L";
  const rightHand = new THREE.Bone();
  rightHand.name = "EXCIT_HAND.R";
  const leftFoot = new THREE.Bone();
  leftFoot.name = "EXCIT_FOOT.L";
  const rightFoot = new THREE.Bone();
  rightFoot.name = "EXCIT_FOOT.R";
  model.add(head, leftHand, rightHand, leftFoot, rightFoot);

  let authoredToolSocket = null;
  if (withAuthoredToolSocket) {
    authoredToolSocket = new THREE.Group();
    authoredToolSocket.name = "EXCIT_SOCKET_TOOL_R";
    rightHand.add(authoredToolSocket);
  }
  return { model, rightHand, authoredToolSocket };
}

function createLoader(model) {
  return { loadAsync: async () => ({ scene: model, animations: [] }) };
}

test("binds the stable right-hand anchor to the authored Blender tool socket", async () => {
  const { model, authoredToolSocket } = createModel({ withAuthoredToolSocket: true });
  const player = createPlayerRig({ loader: createLoader(model) });
  const rightArm = getPlayerRigParts(player).rightArm;

  const asset = await player.userData.assetReady;

  assert.equal(rightArm.parent, authoredToolSocket);
  assert.deepEqual(rightArm.position.toArray(), [0, 0, 0]);
  assert.equal(asset.socketBindings.rightHand.source, "authored-socket");
  assert.equal(asset.socketBindings.rightHand.targetName, "EXCIT_SOCKET_TOOL_R");
});

test("falls back to the exact right-hand bone when the Blender socket is absent", async () => {
  const { model, rightHand } = createModel({ withAuthoredToolSocket: false });
  const player = createPlayerRig({ loader: createLoader(model) });
  const rightArm = getPlayerRigParts(player).rightArm;

  const asset = await player.userData.assetReady;

  assert.equal(rightArm.parent, rightHand);
  assert.equal(asset.socketBindings.rightHand.source, "bone-fallback");
  assert.equal(asset.socketBindings.rightHand.targetName, "EXCIT_HAND.R");
});
