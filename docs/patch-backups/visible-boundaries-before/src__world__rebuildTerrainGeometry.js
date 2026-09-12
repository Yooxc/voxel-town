import * as THREE from "three";
import { getRebuildTerrainHeight } from "./rebuildLayout.js";

export function expandPolygon(polygon, distance) {
  const center = polygon.reduce((p, q) => ({ x: p.x + q.x / polygon.length, z: p.z + q.z / polygon.length }), { x: 0, z: 0 });
  return polygon.map((p) => {
    const length = Math.hypot(p.x - center.x, p.z - center.z);
    return { x: p.x + (p.x - center.x) / length * distance, z: p.z + (p.z - center.z) / length * distance };
  });
}

export function createPolygonBand(inner, outer, innerY, outerY, material, skipEdge = -1) {
  const vertices = [];
  const indices = [];
  for (let i = 0; i < inner.length; i += 1) {
    if (i === skipEdge) continue;
    const j = (i + 1) % inner.length;
    const offset = vertices.length / 3;
    const height = (value, p) => typeof value === "function" ? value(p) : value;
    vertices.push(inner[i].x, height(innerY, inner[i]), inner[i].z, inner[j].x, height(innerY, inner[j]), inner[j].z,
      outer[i].x, height(outerY, outer[i]), outer[i].z, outer[j].x, height(outerY, outer[j]), outer[j].z);
    indices.push(offset, offset + 2, offset + 1, offset + 1, offset + 2, offset + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

export function createGroundedPath(points, width, origin, material, lift = 0.06) {
  const samples = [];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.5));
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      samples.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t,
        width: (a.width ?? width) + ((b.width ?? width) - (a.width ?? width)) * t });
    }
  }
  samples.push({ ...points.at(-1), width: points.at(-1).width ?? width });
  const vertices = [];
  const indices = [];
  samples.forEach((p, i) => {
    const a = samples[Math.max(0, i - 1)];
    const b = samples[Math.min(samples.length - 1, i + 1)];
    const length = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    for (const side of [1, -1]) {
      const x = p.x - (b.z - a.z) / length * p.width * 0.5 * side;
      const z = p.z + (b.x - a.x) / length * p.width * 0.5 * side;
      vertices.push(x, getRebuildTerrainHeight(x, z, origin) + lift, z);
    }
    if (i) {
      const n = i * 2;
      indices.push(n - 2, n - 1, n, n - 1, n + 1, n);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}
