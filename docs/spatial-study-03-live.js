import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { getRebuildLayout, getRebuildTerrainHeight } from "../src/world/rebuildLayout.js";
import { createRebuildBlockout } from "../src/world/rebuildBlockout.js";
import { createRebuildMine } from "../src/world/rebuildMine.js";
import { createWelcomeArea } from "../src/world/welcomeArea.js";
import { createPlayerRig } from "../src/core/player.js";
import { createPlayerGroundingRuntime } from "../src/world/playerGrounding.js";
import { createRebuildTraversal } from "../src/world/rebuildTraversal.js";
import { getRebuildFogSettings } from "../src/world/rebuildSettings.js";
import { createColliderRegistry } from "../src/world/colliderRegistry.js";
import { applyMovementCollisionStep, intersectsAnyColliderBox } from "../src/core/collisions.js";
import { createMineRockModel } from "../src/world/resourceModels.js";
import { ROCK_SIZE_DEFS } from "../src/systems/mining.js";
import { findMineRockSpawnPosition } from "../src/world/rockPlacement.js";

const viewport = document.querySelector("#viewport");
const status = document.querySelector("#status");
const progress = document.querySelector("#progress");
const layout = getRebuildLayout();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaad7ff);
const fogSettings = getRebuildFogSettings();
scene.fog = new THREE.Fog(0xb9d6e4, fogSettings.near, fogSettings.far);
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
const sun = new THREE.DirectionalLight(0xffffff, 0.4);
sun.position.set(30, 50, 30);
scene.add(sun);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
viewport.prepend(renderer.domElement);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 800);
const topCamera = new THREE.OrthographicCamera(-100, 100, 60, -60, 0.1, 800);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.maxDistance = 220;
const groundSurfaces = [];
const colliderRegistry = createColliderRegistry();
const colliders = colliderRegistry.boxes;
const addCollider = (mesh, options = 1) => colliderRegistry.add(mesh, options);
const args = { scene, groundSurfaces, addCollider, registerWalkableSurface() {}, layout };
const blockout = createRebuildBlockout(args);
createRebuildMine(args);
let seed = 42;
const randomRange = (min, max) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return min + (max - min) * seed / 4294967296;
};
const sampleRocks = [];
for (const definition of layout.generalMine.initialRocks) {
  const size = ROCK_SIZE_DEFS[definition.sizeIndex];
  const p = findMineRockSpawnPosition({ scale: size.scale, tries: 120, ...layout.generalMine.resourceArea,
    rocks: sampleRocks, safeRadius: 0, minGap: 0.7, randomRange });
  if (!p) continue;
  const rock = createMineRockModel(p.x, p.z, size, false, {}, { defaultResourceCount: 1, randomRange });
  rock.position.y += layout.generalMine.floorHeight;
  scene.add(rock); sampleRocks.push(rock); addCollider(rock, 0.85);
}
createWelcomeArea({ scene, addCollider, registerNpc: () => null, layout: layout.welcomeArea });
const player = createPlayerRig();
scene.add(player);
const grounding = createPlayerGroundingRuntime({ groundSurfaces, footOffset: 0 });
const traversal = createRebuildTraversal(layout);
let mixer;
let idle;
let walk;
let activeView = "map";
let distance = 0;
let walking = false;
const route = layout.generalMine.pathPoints;
const lengths = route.slice(1).map((b, i) => Math.hypot(b.x - route[i].x, b.z - route[i].z));
const routeLength = lengths.reduce((a, b) => a + b, 0);
const labels = [
  ["도착 언덕 +6", layout.arrival.spawn], ["마을 ±0", { x: 0, y: 0, z: -12 }],
  ["차폐 능선", { x: -60, y: 13, z: -12 }], ["야외 채석장", layout.generalMine.center],
  ["F1", layout.expansionAnchors.f1], ["F2", layout.expansionAnchors.f2],
].map(([text, position]) => {
  const element = document.createElement("span");
  element.className = "label";
  element.textContent = text;
  document.querySelector("#labels").append(element);
  return { element, position: new THREE.Vector3(position.x, position.y + 1, position.z) };
});

function placePlayer(p) {
  player.position.set(p.x, getRebuildTerrainHeight(p.x, p.z) + 0.08, p.z);
  player.rotation.y = Math.PI;
}
function selectView(view) {
  walking = false;
  document.querySelector("#walk").textContent = "접근로 걷기";
  walk?.stop(); idle?.play();
  activeView = view;
  document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
  controls.enabled = !["map", "quarry"].includes(view);
  if (view === "map" || view === "quarry") {
    const center = view === "map" ? new THREE.Vector3(-59, 0, -15) : new THREE.Vector3(-121, 3, -42);
    topCamera.up.set(0, 0, -1);
    topCamera.position.copy(center).add(new THREE.Vector3(0, 250, 0));
    topCamera.lookAt(center);
    placePlayer(route.at(-1));
  } else {
    const presets = {
      arrival: { p: layout.arrival.spawn, camera: [5, 13, 42], target: [0, 4, -2] },
      descent: { p: { x: -1, z: 9 }, camera: [6, 11, 18], target: [0, 1, -12] },
      entry: { p: route.at(-1), camera: [-77, 9, -38], target: [-120, 4, -43] },
    };
    const preset = presets[view];
    placePlayer(preset.p);
    camera.position.set(...preset.camera);
    controls.target.set(...preset.target);
    controls.update();
  }
  resize();
}
function resize() {
  const width = viewport.clientWidth, height = viewport.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const extent = activeView === "quarry" ? { width: 88, height: 66 } : { width: 252, height: 168 };
  const halfHeight = Math.max(extent.height / 2, extent.width / 2 / camera.aspect);
  topCamera.left = -halfHeight * camera.aspect;
  topCamera.right = halfHeight * camera.aspect;
  topCamera.top = halfHeight;
  topCamera.bottom = -halfHeight;
  topCamera.updateProjectionMatrix();
}
document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => selectView(b.dataset.view)));
document.querySelector("#backdrop").addEventListener("change", (e) => { blockout.replaceableBackdrop.visible = e.target.checked; });
document.querySelector("#walk").addEventListener("click", () => {
  if (walking) { walking = false; walk?.stop(); idle?.play(); document.querySelector("#walk").textContent = "접근로 걷기"; return; }
  selectView("entry");
  walking = true; distance = 0;
  placePlayer(route[0]);
  idle?.stop(); walk?.reset().play();
  document.querySelector("#walk").textContent = "정지";
});
new ResizeObserver(resize).observe(viewport);
player.userData.assetReady.then((asset) => {
  mixer = new THREE.AnimationMixer(asset.model);
  const idleClip = asset.animations.find((clip) => /idle/i.test(clip.name));
  const walkClip = asset.animations.find((clip) => /walk/i.test(clip.name));
  if (idleClip) idle = mixer.clipAction(idleClip).play();
  if (walkClip) walk = mixer.clipAction(walkClip);
  status.textContent = "캐릭터 2.65 · 채석장 65 × 46";
}).catch((error) => { status.textContent = `모델 오류: ${error.message}`; });
selectView("map");
const clock = new THREE.Clock();
const outdoorFog = scene.fog;
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (walking) {
    const nextDistance = Math.min(routeLength, distance + 4 * dt);
    let remainder = nextDistance;
    let index = 0;
    while (index < lengths.length - 1 && remainder > lengths[index]) remainder -= lengths[index++];
    const a = route[index], b = route[index + 1], t = remainder / lengths[index];
    const target = new THREE.Vector3(a.x + (b.x - a.x) * t, player.position.y, a.z + (b.z - a.z) * t);
    const previous = player.position.clone();
    const delta = target.clone().sub(previous);
    const box = () => new THREE.Box3(new THREE.Vector3(player.position.x - 0.4, player.position.y + 0.1, player.position.z - 0.4),
      new THREE.Vector3(player.position.x + 0.4, player.position.y + 2.65, player.position.z + 0.4));
    for (const axis of ["x", "z"]) applyMovementCollisionStep({ axis, position: player.position, prevPos: previous, delta,
      isInsideBounds: traversal.isInside, intersectsAnyCollider: () => intersectsAnyColliderBox(box(), colliders),
      isStartRingTransitionBlocked: () => false, isCrossingBlockedStartRing: () => false });
    grounding.update(player, dt);
    if (Math.hypot(player.position.x - target.x, player.position.z - target.z) > 0.03) {
      walking = false; status.textContent = "통행 검사: 장애물 발견";
    } else distance = nextDistance;
    player.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    controls.target.copy(player.position).add(new THREE.Vector3(0, 1.5, 0));
    camera.position.copy(player.position).add(new THREE.Vector3(10, 8, 12));
    progress.textContent = `${distance.toFixed(1)} / ${routeLength.toFixed(1)} · ${(distance / 4).toFixed(1)}초`;
    if (distance >= routeLength) {
      walking = false; walk?.stop(); idle?.play();
      status.textContent = "접근로 통행 완료 · 20초";
      document.querySelector("#walk").textContent = "접근로 걷기";
    }
  }
  mixer?.update(dt);
  controls.update();
  const top = activeView === "map" || activeView === "quarry";
  scene.fog = !top && document.querySelector("#fog").checked ? outdoorFog : null;
  const activeCamera = top ? topCamera : camera;
  labels.forEach(({ element, position }) => {
    const p = position.clone().project(activeCamera);
    element.hidden = !top || Math.abs(p.x) > 0.95 || Math.abs(p.y) > 0.95;
    element.style.left = `${(p.x + 1) * viewport.clientWidth / 2}px`;
    element.style.top = `${(1 - p.y) * viewport.clientHeight / 2}px`;
  });
  renderer.render(scene, activeCamera);
  requestAnimationFrame(animate);
}
animate();
