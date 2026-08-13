import * as THREE from "three";

export function createPollutionField({
  centerX,
  centerZ,
  halfSize,
  particleCount,
  random,
}) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const phase = new Float32Array(particleCount);
  const base = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    const x = centerX + random(-halfSize, halfSize);
    const y = random(0.55, 6.35);
    const z = centerZ + random(-halfSize, halfSize);
    const offset = index * 3;
    positions[offset] = base[offset] = x;
    positions[offset + 1] = base[offset + 1] = y;
    positions[offset + 2] = base[offset + 2] = z;
    phase[index] = random(0, Math.PI * 2);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 6, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 227, 173, 0.95)");
  gradient.addColorStop(0.35, "rgba(230, 197, 131, 0.78)");
  gradient.addColorStop(0.72, "rgba(160, 122, 74, 0.32)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.PointsMaterial({ color: 0xd8bb86, size: 0.9, map: texture, alphaMap: texture, transparent: true, opacity: 0, depthWrite: false, depthTest: true, sizeAttenuation: true, blending: THREE.AdditiveBlending });
  const field = new THREE.Points(geometry, material);
  field.frustumCulled = false;
  field.renderOrder = 4;
  return { field, material, base, phase, strength: 0 };
}

export function updatePollutionFieldPositions({ positions, base, phase, time, strength, particleSway }) {
  for (let index = 0; index < phase.length; index += 1) {
    const offset = index * 3;
    const particlePhase = phase[index];
    positions[offset] = base[offset] + Math.sin(time * 0.31 + particlePhase) * particleSway * strength;
    positions[offset + 1] = base[offset + 1] + Math.sin(time * 0.48 + particlePhase * 1.7) * 0.08 * strength;
    positions[offset + 2] = base[offset + 2] + Math.cos(time * 0.27 + particlePhase * 1.3) * particleSway * strength;
  }
}
