import * as THREE from "three";

function randomRange(random, min, max) {
  return min + random() * (max - min);
}

export function createMiningParticlesRuntime(scene, { random = Math.random } = {}) {
  const particles = [];

  function spawnDustBurst(position, count = 16) {
    const geometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const material = new THREE.MeshStandardMaterial({ color: 0xd6d0c6, roughness: 1 });
    for (let index = 0; index < count; index += 1) {
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.position.y += 0.6 + random() * 0.6;
      particle.userData.v = new THREE.Vector3(
        (random() - 0.5) * 2.2,
        2.2 + random() * 2.2,
        (random() - 0.5) * 2.2
      );
      particle.userData.life = 0.6 + random() * 0.5;
      particle.userData.maxLife = particle.userData.life;
      particle.userData.kind = "dust";
      scene.add(particle);
      particles.push(particle);
    }
  }

  function spawnRockBreakBurst(rock) {
    const rockScale = rock.userData.spawnScale ?? 1;
    const chunkCount = Math.round(6 + rockScale * 3);
    const baseColor = rock.material?.color?.getHex() ?? 0x6f6f72;
    for (let index = 0; index < chunkCount; index += 1) {
      const size = randomRange(random, 0.09, 0.18) * rockScale;
      const chunk = new THREE.Mesh(
        new THREE.DodecahedronGeometry(size, 0),
        new THREE.MeshStandardMaterial({ color: baseColor, roughness: 1, transparent: true, opacity: 1 })
      );
      chunk.position.copy(rock.position);
      chunk.position.add(new THREE.Vector3(
        randomRange(random, -0.08, 0.08),
        randomRange(random, 0.15, 0.55) * rockScale,
        randomRange(random, -0.08, 0.08)
      ));
      chunk.rotation.set(randomRange(random, 0, Math.PI), randomRange(random, 0, Math.PI), randomRange(random, 0, Math.PI));
      chunk.userData.v = new THREE.Vector3(
        randomRange(random, -1.7, 1.7) * rockScale,
        randomRange(random, 1.2, 2.6) * rockScale,
        randomRange(random, -1.7, 1.7) * rockScale
      );
      chunk.userData.spin = new THREE.Vector3(
        randomRange(random, -7, 7),
        randomRange(random, -7, 7),
        randomRange(random, -7, 7)
      );
      chunk.userData.life = 0.42 + random() * 0.22;
      chunk.userData.maxLife = chunk.userData.life;
      chunk.userData.kind = "rockChunk";
      scene.add(chunk);
      particles.push(chunk);
    }
  }

  function update(dt) {
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.userData.life -= dt;
      particle.userData.v.y -= 7.5 * dt;
      particle.position.addScaledVector(particle.userData.v, dt);
      if (particle.userData.spin) {
        particle.rotation.x += particle.userData.spin.x * dt;
        particle.rotation.y += particle.userData.spin.y * dt;
        particle.rotation.z += particle.userData.spin.z * dt;
      }
      if (particle.position.y < 0.05) {
        particle.position.y = 0.05;
        particle.userData.v.x *= 0.45;
        particle.userData.v.z *= 0.45;
        particle.userData.v.y *= particle.userData.kind === "rockChunk" ? -0.18 : 0.1;
      }
      if (particle.material?.transparent && particle.userData.maxLife > 0) {
        particle.material.opacity = Math.max(0, particle.userData.life / particle.userData.maxLife);
      }
      if (particle.userData.life <= 0) {
        particle.geometry?.dispose();
        particle.material?.dispose();
        particle.removeFromParent();
        particles.splice(index, 1);
      }
    }
  }

  return { particles, spawnDustBurst, spawnRockBreakBurst, update };
}
