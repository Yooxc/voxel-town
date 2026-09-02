import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createPlayerGroundingRuntime } from "../src/world/playerGrounding.js";
import {
  getPlayerBoxFromPosition,
  PLAYER_COLLIDER_CENTER_Y_OFFSET,
  PLAYER_COLLIDER_SIZE,
} from "../src/core/collisions.js";

function addGround(scene, y = 0) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = y;
  scene.add(ground);
  scene.updateMatrixWorld(true);
  return ground;
}

test("smoothly follows the closest ground surface below the player", () => {
  const scene = new THREE.Scene();
  const runtime = createPlayerGroundingRuntime({
    groundSurfaces: [addGround(scene, 3)],
    footOffset: 1,
  });
  const player = { position: new THREE.Vector3(0, 8, 0) };

  const foundGround = runtime.update(player, 1);

  assert.equal(foundGround, true);
  assert.ok(Math.abs(player.position.y - 4.004) < 0.000001);
});

test("leaves the player position unchanged when there is no ground below", () => {
  const player = { position: new THREE.Vector3(0, 8, 0) };
  const runtime = createPlayerGroundingRuntime({
    groundSurfaces: [],
    footOffset: 1,
  });

  const foundGround = runtime.update(player, 1);

  assert.equal(foundGround, false);
  assert.equal(player.position.y, 8);
});

test("uses a full-height collider that includes equipped headwear", () => {
  const box = getPlayerBoxFromPosition(new THREE.Vector3(0, 0, 0));

  assert.equal(PLAYER_COLLIDER_SIZE.y, 2.65);
  assert.equal(PLAYER_COLLIDER_CENTER_Y_OFFSET, 1.325);
  assert.equal(box.min.y, 0);
  assert.equal(box.max.y, 2.65);
});

test("follows nested walkable steps without snapping through an upper floor", () => {
  const scene = new THREE.Scene();
  const lowerGround = addGround(scene, 0);
  const upperFloor = addGround(scene, 3);
  const stairGroup = new THREE.Group();
  const step = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 2));
  step.position.y = 0.2;
  stairGroup.add(step);
  scene.add(stairGroup);
  scene.updateMatrixWorld(true);
  const runtime = createPlayerGroundingRuntime({
    groundSurfaces: [lowerGround, upperFloor, stairGroup],
    footOffset: 1,
    maxStepUp: 0.5,
  });
  const player = { position: new THREE.Vector3(0, 1, 0) };

  assert.equal(runtime.update(player, 1), true);
  assert.ok(player.position.y > 1.39 && player.position.y < 1.41);
});

test("snaps across consecutive stair steps without falling back to the lower floor", () => {
  const scene = new THREE.Scene();
  const lowerGround = addGround(scene, 0);
  const stepSize = 0.35;
  const steps = [];
  for (let index = 0; index < 8; index += 1) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.4, stepSize * (index + 1), 0.5));
    step.position.set(0, stepSize * (index + 1) * 0.5, 1.75 - index * 0.5);
    scene.add(step);
    steps.push(step);
  }
  scene.updateMatrixWorld(true);
  const runtime = createPlayerGroundingRuntime({
    groundSurfaces: [lowerGround, ...steps],
    footOffset: 0,
    maxStepUp: 0.5,
  });
  const player = { position: new THREE.Vector3(0, 0, 2) };

  for (let index = 0; index < 8; index += 1) {
    player.position.z = 1.75 - index * 0.5;
    runtime.update(player, 1 / 60);
  }

  assert.ok(Math.abs(player.position.y - 2.8) < 0.000001);
});

test("does not raise the player into a registered ceiling", () => {
  const scene = new THREE.Scene();
  const lowerGround = addGround(scene, 0);
  const step = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 2));
  step.position.y = 0.2;
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2));
  ceiling.position.y = 2.5;
  scene.add(step, ceiling);
  scene.updateMatrixWorld(true);
  const runtime = createPlayerGroundingRuntime({
    groundSurfaces: [lowerGround, step],
    ceilingSurfaces: [ceiling],
    footOffset: 1,
    playerHeight: 1.6,
    maxStepUp: 0.5,
  });
  const player = { position: new THREE.Vector3(0, 1, 0) };

  assert.equal(runtime.update(player, 1), false);
  assert.equal(player.position.y, 1);
});
