import * as THREE from "three";

export function createTunnelFenceModel(width) {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6f5138, roughness: 0.98 });
  const railThickness = 0.2;
  const postSize = 0.24;
  const postHeight = 1.7;
  const railInset = 0.28;
  for (const y of [1.38, 0.8]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(width, railThickness, railThickness), woodMat);
    rail.position.set(0, y, 0);
    group.add(rail);
  }
  const postCount = 6;
  for (let index = 0; index < postCount; index += 1) {
    const t = postCount === 1 ? 0.5 : index / (postCount - 1);
    const post = new THREE.Mesh(new THREE.BoxGeometry(postSize, postHeight, postSize), woodMat);
    post.position.set(THREE.MathUtils.lerp(-width * 0.5 + railInset, width * 0.5 - railInset, t), postHeight * 0.5, 0);
    group.add(post);
  }
  for (const x of [-width * 0.28, 0, width * 0.28]) {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.35, 0.18), woodMat);
    brace.position.set(x, 0.72, 0);
    brace.rotation.z = x < 0 ? Math.PI * 0.18 : x > 0 ? -Math.PI * 0.18 : 0;
    group.add(brace);
  }
  return group;
}
