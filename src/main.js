import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaad7ff);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);
// ===== UI (간단 텍스트) =====
const ui = document.createElement("div");
ui.style.position = "fixed";
ui.style.left = "50%";
ui.style.bottom = "40px";
ui.style.transform = "translateX(-50%)";
ui.style.padding = "10px 14px";
ui.style.background = "rgba(0,0,0,0.55)";
ui.style.color = "white";
ui.style.fontFamily = "system-ui, -apple-system, sans-serif";
ui.style.fontSize = "14px";
ui.style.borderRadius = "10px";
ui.style.display = "none";
ui.style.pointerEvents = "none";
document.body.appendChild(ui);

function showUI(text) {
  ui.textContent = text;
  ui.style.display = "block";
}
function hideUI() {
  ui.style.display = "none";
}



// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemi.position.set(0, 50, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(10, 20, 10);
scene.add(dir);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x88cc88 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const grid = new THREE.GridHelper(200, 200);
grid.material.opacity = 0.25;
grid.material.transparent = true;
scene.add(grid);

// Player
const player = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4b7bec });

const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 16), bodyMat);
cyl.position.y = 1.0;

const top = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), bodyMat);
top.position.y = 1.5;

const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), bodyMat);
bottom.position.y = 0.5;

player.add(cyl, top, bottom);
player.position.set(0, 0, 0);
scene.add(player);

const nose = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.2, 0.4),
  new THREE.MeshStandardMaterial({ color: 0xffdd59 })
);
nose.position.set(0, 1.0, 0.55);
player.add(nose);

// Colliders
const colliders = [];
const interactables = []; // 상호작용 가능한 오브젝트 목록
let activeInteractable = null; // 현재 가까운 대상
let lastMessageUntil = 0; // 메시지 표시용 타이머


// Camera controls
camera.position.set(0, 4, 8);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(player.position).add(new THREE.Vector3(0, 1.0, 0));
controls.minDistance = 3;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minPolarAngle = Math.PI * 0.1;

// Houses
function makeHouse(x, z) {
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2, 3),
    new THREE.MeshStandardMaterial({ color: 0xf5f6fa })
  );
  base.position.y = 1.0;

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 1.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xeb3b5a })
  );
  roof.position.y = 2.6;
  roof.rotation.y = Math.PI / 4;

  g.add(base, roof);
  g.position.set(x, 0, z);

  scene.add(g);
  colliders.push(base);
}

for (let i = 0; i < 6; i++) makeHouse(-10 + i * 5, -12);
for (let i = 0; i < 4; i++) makeHouse(-8 + i * 6, 10);

makeSign(0, 3, "표지판: 광장으로 가는 길이다.");
makeSign(-6, -2, "표지판: 이 동네는 조용하다.");
makeSign(8, -4, "표지판: 바람이 많이 분다.");


function makeSign(x, z, text) {
  const g = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 1.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
  );
  pole.position.y = 0.6;

  const boardMat = new THREE.MeshStandardMaterial({ color: 0xfff3b0 });
    boardMat.emissive.set(0x000000); // 기본은 발광 없음

    const board = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.6, 0.1),
  boardMat
);

  board.position.set(0, 1.2, 0);

  g.add(pole, board);
  g.position.set(x, 0, z);
  scene.add(g);
  console.log("SIGN CREATED:", text, "pos=", g.position.x, g.position.z);

  // 상호작용 대상 등록(텍스트 포함)
  interactables.push({ obj: g, text, board });
}


// Road
const road = new THREE.Mesh(
  new THREE.BoxGeometry(60, 0.1, 6),
  new THREE.MeshStandardMaterial({ color: 0x6c757d })
);
road.position.set(0, 0.05, 0);
scene.add(road);

// Input
const keys = { w: false, a: false, s: false, d: false, shift: false };

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
    // E 키로 상호작용
  if (k === "e" && activeInteractable) {
    showUI(activeInteractable.text);
    lastMessageUntil = performance.now() + 2000; // 2초 표시
  }

  if (k in keys) keys[k] = true;
  if (k === "shift") keys.shift = true;
});

window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = false;
  if (k === "shift") keys.shift = false;
});

// Collision helpers
function getPlayerBox() {
  const size = new THREE.Vector3(0.8, 2.0, 0.8);
  const center = player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
  const box = new THREE.Box3();
  box.setFromCenterAndSize(center, size);
  return box;
}

function intersectsAnyCollider(playerBox) {
  for (const obj of colliders) {
    const objBox = new THREE.Box3().setFromObject(obj);
    if (playerBox.intersectsBox(objBox)) return true;
  }
  return false;
}

// Movement
const clock = new THREE.Clock();

function updateMovement(dt) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3()
    .crossVectors(forward, new THREE.Vector3(0, 1, 0))
    .normalize()

  const move = new THREE.Vector3();
  if (keys.w) move.add(forward);
  if (keys.s) move.sub(forward);
  if (keys.d) move.add(right);
  if (keys.a) move.sub(right);

  if (move.lengthSq() > 0) {
    move.normalize();
    const speed = keys.shift ? 7.0 : 4.0;
     
    const prevPos = player.position.clone();
    const delta = move.clone().multiplyScalar(speed * dt);

    // 1) X축 이동만 먼저 시도
    player.position.x = prevPos.x + delta.x;
    if (intersectsAnyCollider(getPlayerBox())) {
  player.position.x = prevPos.x; // X 이동 취소
    }

    // 2) Z축 이동만 시도
    player.position.z = prevPos.z + delta.z;
    if (intersectsAnyCollider(getPlayerBox())) {
  player.position.z = prevPos.z; // Z 이동 취소
    }

    const targetYaw = Math.atan2(move.x, move.z);
    player.rotation.y = targetYaw;
  }

  player.position.y = 0;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);

  updateMovement(dt);

  // ===== 상호작용 대상 탐색 =====
    activeInteractable = null;

    let bestDist = Infinity;
    for (const it of interactables) {
  const d = it.obj.position.distanceTo(player.position);
  if (d < 2.0 && d < bestDist) {
    bestDist = d;
    activeInteractable = it;
  }
    }

    // ===== 하이라이트 처리 =====
    for (const it of interactables) {
  it.board.material.emissive.set(0x000000); // 기본: 발광 끔
    }

    if (activeInteractable) {
  activeInteractable.board.material.emissive.set(0xffaa00); // 하이라이트 ON
    }



  // UI 표시 규칙:
  // - E로 눌러서 나온 메시지가 2초 유지되는 중이면 그걸 우선
  const now = performance.now();
  if (now < lastMessageUntil) {
    // 메시지 유지 중: 그대로 둠
  } else if (activeInteractable) {
    showUI("E : 조사하기");
  } else {
    hideUI();
  }


  controls.target.copy(player.position).add(new THREE.Vector3(0, 1.0, 0));
  controls.update();

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
