import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createPlayerGroundingRuntime } from "../src/world/playerGrounding.js";

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
