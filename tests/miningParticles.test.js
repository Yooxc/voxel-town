import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createMiningParticlesRuntime } from "../src/world/miningParticles.js";

test("creates dust and scaled rock chunk particles", () => {
  const scene = new THREE.Scene();
  const runtime = createMiningParticlesRuntime(scene, { random: () => 0.5 });
  runtime.spawnDustBurst(new THREE.Vector3(1, 0, 2), 2);
  runtime.spawnRockBreakBurst({
    position: new THREE.Vector3(),
    userData: { spawnScale: 2 },
    material: new THREE.MeshStandardMaterial({ color: 0x112233 }),
  });
  assert.equal(runtime.particles.length, 14);
  assert.equal(runtime.particles[0].userData.kind, "dust");
  assert.equal(runtime.particles.at(-1).userData.kind, "rockChunk");
});

test("updates spin and removes expired particles from the scene", () => {
  const scene = new THREE.Scene();
  const runtime = createMiningParticlesRuntime(scene, { random: () => 0.6 });
  runtime.spawnRockBreakBurst({
    position: new THREE.Vector3(),
    userData: { spawnScale: 1 },
    material: new THREE.MeshStandardMaterial(),
  });
  const particle = runtime.particles[0];
  const rotationBefore = particle.rotation.x;
  runtime.update(0.1);
  assert.notEqual(particle.rotation.x, rotationBefore);
  runtime.update(1);
  assert.equal(runtime.particles.length, 0);
  assert.equal(particle.parent, null);
});
