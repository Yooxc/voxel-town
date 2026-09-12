import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createDialogueCameraController } from "../src/core/dialogueCameraController.js";

function createFixture(overrides = {}) {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 5, 10);
  const controls = {
    target: new THREE.Vector3(0, 1, 0),
    enabled: true,
    update() {
      camera.lookAt(this.target);
      camera.updateMatrixWorld();
    },
  };
  const scene = new THREE.Scene();
  const player = new THREE.Group();
  const npc = new THREE.Group();
  player.position.set(-1, 0, 0);
  npc.position.set(1, 0, 0);
  scene.add(player, npc);
  const controller = createDialogueCameraController({
    camera, controls, player, colliders: [], ...overrides,
  });
  return { camera, controls, player, npc, controller };
}

test("smoothly frames a dialogue and restores the previous camera", () => {
  const { camera, controls, player, npc, controller } = createFixture({
    getViewportState: () => ({ width: 1200, height: 800, dialogHeight: 240 }),
  });
  const originalPosition = camera.position.clone();
  const originalTarget = controls.target.clone();

  assert.equal(controller.enter(npc), true);
  assert.equal(controller.getPhase(), "entering");
  assert.equal(controller.isTarget(npc), true);
  assert.equal(controls.enabled, false);
  controller.update(0.5);
  assert.equal(controller.getPhase(), "active");
  assert.equal(camera.position.distanceTo(controls.target) < originalPosition.distanceTo(originalTarget), true);
  const playerScreen = player.position.clone().project(camera);
  const npcScreen = npc.position.clone().project(camera);
  assert.equal(playerScreen.x < npcScreen.x, true);
  assert.equal(Math.abs(player.rotation.y - Math.PI / 2) < 1e-6, true);
  assert.equal(Math.abs(npc.rotation.y + Math.PI / 2) < 1e-6, true);

  assert.equal(controller.exit(), true);
  controller.update(0.4);
  assert.equal(controller.getPhase(), "idle");
  assert.equal(controller.isTarget(npc), false);
  assert.deepEqual(camera.position.toArray(), originalPosition.toArray());
  assert.deepEqual(controls.target.toArray(), originalTarget.toArray());
  assert.equal(controls.enabled, true);
  assert.equal(player.rotation.y, 0);
  assert.equal(npc.rotation.y, 0);
});

test("does not restart framing for the same speaker and restores from a partial entrance", () => {
  const { player, npc, controller } = createFixture();
  assert.equal(controller.enter(npc), true);
  controller.update(0.2);
  const partialYaw = player.rotation.y;
  assert.equal(controller.enter(npc), true);
  assert.equal(player.rotation.y, partialYaw);
  assert.equal(controller.exit(), true);
  controller.update(0.4);
  assert.equal(player.rotation.y, 0);
  assert.equal(npc.rotation.y, 0);
});

test("rejects detached targets and restores controls when cancelled without repositioning", () => {
  const { controls, npc, controller } = createFixture();
  npc.removeFromParent();
  assert.equal(controller.enter(npc), false);

  const attached = new THREE.Group();
  const parent = new THREE.Group();
  parent.add(attached);
  assert.equal(controller.enter(attached), true);
  assert.equal(controller.cancel({ restore: false }), true);
  assert.equal(controls.enabled, true);
  assert.equal(controller.isActive(), false);
});

test("orbits around the pair instead of cutting through them from the opposite side", () => {
  const { camera, controls, player, npc, controller } = createFixture();
  player.position.x = 1;
  npc.position.x = -1;
  const originalPosition = camera.position.clone();
  const originalTarget = controls.target.clone();
  let controlUpdates = 0;
  const updateControls = controls.update.bind(controls);
  controls.update = () => { controlUpdates += 1; updateControls(); };
  controller.enter(npc);
  controller.update(0.5);
  assert.equal(controller.getPhase(), "entering");
  for (let i = 0; i < 100; i += 1) {
    controller.update(1 / 60);
    assert.ok(camera.position.distanceTo(controls.target) >= 3.6);
    assert.ok(camera.position.distanceTo(player.position) > 2);
    assert.ok(camera.position.distanceTo(npc.position) > 2);
  }
  assert.equal(controller.getPhase(), "active");
  assert.equal(controlUpdates, 0);
  assert.ok(player.position.clone().project(camera).x < npc.position.clone().project(camera).x);
  controller.exit();
  for (let i = 0; i < 100; i += 1) {
    controller.update(1 / 60);
    assert.ok(camera.position.distanceTo(controls.target) >= 3.6);
  }
  assert.equal(controller.getPhase(), "idle");
  assert.deepEqual(camera.position.toArray(), originalPosition.toArray());
  assert.deepEqual(controls.target.toArray(), originalTarget.toArray());
  assert.equal(controls.enabled, true);
});

test("chooses a clear orbit direction when the shortest path crosses a wall", () => {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(6, 12, 2),
    new THREE.MeshBasicMaterial(),
  );
  wall.position.set(6, 2, 0);
  wall.updateMatrixWorld(true);
  const blockedVolume = new THREE.Box3().setFromObject(wall).expandByScalar(0.27);
  const { camera, controls, player, npc, controller } = createFixture({ colliders: [wall] });
  player.position.x = 1;
  npc.position.x = -1;
  const originalPosition = camera.position.clone();

  assert.equal(controller.enter(npc), true);
  for (let index = 0; index < 150; index += 1) {
    controller.update(1 / 60);
    assert.equal(blockedVolume.containsPoint(camera.position), false);
  }
  assert.equal(controller.getPhase(), "active");
  assert.ok(player.position.clone().project(camera).x < npc.position.clone().project(camera).x);

  assert.equal(controller.exit(), true);
  for (let index = 0; index < 150; index += 1) {
    controller.update(1 / 60);
    assert.equal(blockedVolume.containsPoint(camera.position), false);
  }
  assert.equal(controller.getPhase(), "idle");
  assert.deepEqual(camera.position.toArray(), originalPosition.toArray());
  assert.equal(controls.enabled, true);
});

test("smoothly reframes an active dialogue after its reserved screen height changes", () => {
  const viewport = { width: 1200, height: 800, dialogHeight: 100 };
  const { camera, controls, npc, controller } = createFixture({
    getViewportState: () => viewport,
  });
  const originalPosition = camera.position.clone();

  assert.equal(controller.enter(npc), true);
  controller.update(0.5);
  assert.equal(controller.getPhase(), "active");
  const previousPosition = camera.position.clone();

  viewport.dialogHeight = 340;
  assert.equal(controller.refresh(), true);
  assert.equal(controller.getPhase(), "entering");
  assert.deepEqual(camera.position.toArray(), previousPosition.toArray());
  controller.update(0.1);
  assert.ok(camera.position.distanceTo(previousPosition) > 0);
  controller.update(0.5);
  assert.equal(controller.getPhase(), "active");

  assert.equal(controller.exit(), true);
  controller.update(0.5);
  assert.equal(controller.getPhase(), "idle");
  assert.deepEqual(camera.position.toArray(), originalPosition.toArray());
  assert.equal(controls.enabled, true);
});
