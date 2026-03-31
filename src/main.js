import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
// ===== Atmosphere: Sky / Fog =====
scene.background = new THREE.Color(0xd6d8db); // 밝은 회색 하늘

scene.fog = new THREE.Fog(
  0xd6d8db, // 안개 색 (하늘과 동일)
  15,       // 가까운 곳은 선명
  60        // 멀리만 흐릿
);

// ===== Lighting =====
// 전체 밝기 (부드럽게)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// 방향광 (태양 역할, 그림자 약하게)
const sunLight = new THREE.DirectionalLight(0xffffff, 0.4);
sunLight.position.set(30, 50, 30);
sunLight.castShadow = false; // 강한 그림자 제거
scene.add(sunLight);

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
// === Three.js 캔버스 (바닥 레이어) ===
renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "0";
document.body.appendChild(renderer.domElement);

// === UI 레이어 (항상 화면 위) ===
const uiLayer = document.createElement("div");
uiLayer.id = "uiLayer";
uiLayer.style.position = "fixed";
uiLayer.style.inset = "0";
uiLayer.style.zIndex = "999999";
uiLayer.style.pointerEvents = "none"; // 게임 조작 방해 안 함
document.body.appendChild(uiLayer);

// ===== Compass UI =====
const compassWrap = document.createElement("div");
compassWrap.id = "compassWrap";
compassWrap.style.position = "fixed";
compassWrap.style.left = "12px";
compassWrap.style.top = "12px";
compassWrap.style.width = "126px";
compassWrap.style.padding = "10px 10px 8px";
compassWrap.style.background = "rgba(20,20,20,0.52)";
compassWrap.style.border = "1px solid rgba(255,255,255,0.18)";
compassWrap.style.borderRadius = "12px";
compassWrap.style.backdropFilter = "blur(4px)";
compassWrap.style.color = "white";
compassWrap.style.fontFamily = "system-ui, -apple-system, sans-serif";
compassWrap.style.fontSize = "12px";
compassWrap.style.userSelect = "none";
compassWrap.style.pointerEvents = "none";
compassWrap.style.zIndex = "999999";

const compassTitle = document.createElement("div");
compassTitle.textContent = "나침반";
compassTitle.style.opacity = "0.85";
compassTitle.style.marginBottom = "6px";

const compassFace = document.createElement("div");
compassFace.style.width = "56px";
compassFace.style.height = "56px";
compassFace.style.margin = "0 auto";
compassFace.style.borderRadius = "999px";
compassFace.style.border = "2px solid rgba(255,255,255,0.45)";
compassFace.style.position = "relative";
compassFace.style.background = "rgba(255,255,255,0.08)";

const compassNeedle = document.createElement("div");
compassNeedle.textContent = "▲";
compassNeedle.style.position = "absolute";
compassNeedle.style.left = "50%";
compassNeedle.style.top = "50%";
compassNeedle.style.transform = "translate(-50%, -50%)";
compassNeedle.style.transformOrigin = "50% 50%";
compassNeedle.style.color = "#ffde7a";
compassNeedle.style.fontSize = "18px";
compassNeedle.style.fontWeight = "700";
compassFace.appendChild(compassNeedle);

const compassText = document.createElement("div");
compassText.textContent = "북 0°";
compassText.style.marginTop = "7px";
compassText.style.textAlign = "center";
compassText.style.fontWeight = "700";

compassWrap.appendChild(compassTitle);
compassWrap.appendChild(compassFace);
compassWrap.appendChild(compassText);
uiLayer.appendChild(compassWrap);

// ===== Inventory Window (Tabs + Grid) =====
const invWin = document.createElement("div");
invWin.id = "invWindow";
invWin.style.position = "fixed";
invWin.style.left = "12px";
invWin.style.top = "12px";
invWin.style.width = "320px";
invWin.style.height = "420px";
invWin.style.background = "rgba(235, 235, 235, 0.92)";
invWin.style.border = "1px solid rgba(0,0,0,0.25)";
invWin.style.borderRadius = "10px";
invWin.style.boxShadow = "0 12px 30px rgba(0,0,0,0.25)";
invWin.style.backdropFilter = "blur(6px)";
invWin.style.display = "none"; // I 키로 열기
invWin.style.pointerEvents = "auto"; // 클릭 가능
invWin.style.userSelect = "none";
uiLayer.appendChild(invWin);

// 상단 탭 바
const tabBar = document.createElement("div");
tabBar.style.display = "flex";
tabBar.style.gap = "6px";
tabBar.style.padding = "10px";
tabBar.style.borderBottom = "1px solid rgba(0,0,0,0.15)";
tabBar.style.background = "rgba(255,255,255,0.7)";
tabBar.style.borderTopLeftRadius = "10px";
tabBar.style.borderTopRightRadius = "10px";
invWin.appendChild(tabBar);

const tabs = [
  { id: "equip", label: "장비" },
  { id: "cons", label: "소비" },
  { id: "misc", label: "기타" },
];

let activeTab = "cons";

function makeTabButton(t) {
  const b = document.createElement("button");
  b.textContent = t.label;
  b.style.border = "1px solid rgba(0,0,0,0.2)";
  b.style.borderRadius = "8px";
  b.style.padding = "6px 10px";
  b.style.fontSize = "14px";
  b.style.cursor = "pointer";
  b.style.background = "rgba(255,255,255,0.9)";
  b.style.color = "#222";
  b.addEventListener("click", () => {
    activeTab = t.id;
    renderInventoryWindow();
  });
  return b;
}

const tabButtons = {};
for (const t of tabs) {
  const btn = makeTabButton(t);
  tabButtons[t.id] = btn;
  tabBar.appendChild(btn);
}

// 본문(슬롯 영역)
const invBody = document.createElement("div");
invBody.style.padding = "12px";
invBody.style.height = "calc(100% - 52px)";
invBody.style.boxSizing = "border-box";
invWin.appendChild(invBody);

// 스크롤 영역(슬롯 그리드)
const gridWrap = document.createElement("div");
gridWrap.style.height = "100%";
gridWrap.style.overflowY = "auto";
gridWrap.style.paddingRight = "6px";
invBody.appendChild(gridWrap);

const invgrid = document.createElement("div");
invgrid.style.display = "grid";
invgrid.style.gridTemplateColumns = "repeat(5, 1fr)"; // 5칸 x 여러줄
invgrid.style.gap = "10px";
gridWrap.appendChild(invgrid);

// 슬롯 크기/스타일
function makeSlot() {
  const s = document.createElement("div");
  s.style.width = "52px";
  s.style.height = "52px";
  s.style.background = "rgba(255,255,255,0.95)";
  s.style.border = "1px solid rgba(0,0,0,0.2)";
  s.style.borderRadius = "8px";
  s.style.display = "flex";
  s.style.alignItems = "center";
  s.style.justifyContent = "center";
  s.style.position = "relative";
  s.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
  return s;
}

function setTabStyles() {
  for (const t of tabs) {
    const btn = tabButtons[t.id];
    const isActive = t.id === activeTab;
    btn.style.background = isActive ? "rgba(255,180,70,0.95)" : "rgba(255,255,255,0.9)";
    btn.style.borderColor = isActive ? "rgba(200,120,30,0.9)" : "rgba(0,0,0,0.2)";
    btn.style.fontWeight = isActive ? "700" : "500";
  }
}

// ===== Inventory Data (simple) =====
// 앞으로 아이템이 늘어날 걸 대비해 "탭별 슬롯 배열" 형태로 준비
const inventorySlots = {
  equip: Array.from({ length: 25 }, () => null),
  cons: Array.from({ length: 25 }, () => null),
  misc: Array.from({ length: 25 }, () => null),
};

// 지금 있는 두 아이템을 슬롯에 "고정 배치" (원하면 나중에 드래그로 바꿀 수 있음)
// - 곡괭이: 장비 탭 0번
// - 돌가루: 소비 탭 0번
function syncGameStateToSlots() {
  // 탭별 UI 슬롯 배열을 매번 초기화
  inventorySlots.equip.fill(null);
  inventorySlots.cons.fill(null);
  inventorySlots.misc.fill(null);

  // 실제 인벤 슬롯을 탭별로 옮겨 담기
  for (const s of inventory.slots) {
    if (!s) continue;

    const def = ITEM_DEFS[s.id];
    if (!def) continue;

    const itemUI = { id: s.id, icon: def.icon, name: def.name, count: s.count };

    if (def.category === "equip") {
      // 장비 탭: 빈 칸에 순서대로 배치
      const idx = inventorySlots.equip.findIndex((x) => x === null);
      if (idx !== -1) inventorySlots.equip[idx] = itemUI;
    } else if (def.category === "cons") {
      const idx = inventorySlots.cons.findIndex((x) => x === null);
      if (idx !== -1) inventorySlots.cons[idx] = itemUI;
    } else {
      const idx = inventorySlots.misc.findIndex((x) => x === null);
      if (idx !== -1) inventorySlots.misc[idx] = itemUI;
    }
  }
    }


function renderInventoryWindow() {
  syncGameStateToSlots();
  setTabStyles();

  // grid 초기화
  invgrid.innerHTML = "";

  const slots = inventorySlots[activeTab];
  for (let i = 0; i < slots.length; i++) {
    const slot = makeSlot();
    const item = slots[i];

    if (item) {
      const icon = document.createElement("div");
      icon.textContent = item.icon;
      icon.style.fontSize = "24px";
      icon.style.transform = "translateY(-1px)";
      slot.appendChild(icon);

      if (item.count && item.count > 1) {
        const badge = document.createElement("div");
        badge.textContent = String(item.count);
        badge.style.position = "absolute";
        badge.style.right = "6px";
        badge.style.bottom = "4px";
        badge.style.fontSize = "12px";
        badge.style.padding = "1px 6px";
        badge.style.borderRadius = "10px";
        badge.style.background = "rgba(0,0,0,0.65)";
        badge.style.color = "white";
        badge.style.pointerEvents = "none";
        slot.appendChild(badge);
      }

      // ===== Equip toggle (double click) =====
        const isEquipTab = activeTab === "equip";
        const isPickaxe = item.id === "pickaxe";
        const isEquipped = inventory.equipped.tool === item.id;

        // 장착된 아이템은 테두리 하이라이트
        if (isEquipTab && isEquipped) {
        slot.style.borderColor = "rgba(255,140,0,0.95)";
        slot.style.boxShadow = "0 0 0 3px rgba(255,140,0,0.35), inset 0 1px 0 rgba(255,255,255,0.8)";   
        }

        // 장비 탭에서만 클릭 가능하도록 커서/효과
        if (isEquipTab && isPickaxe) {
        slot.style.cursor = "pointer";
        slot.title = "더블클릭: 장착/해제";

        slot.addEventListener("dblclick", () => {
        // 토글
        if (inventory.equipped.tool === "pickaxe") {
      inventory.equipped.tool = null;
      showUI(HUD_MSG.PICKAXE_UNEQUIPPED);
        lastMessageUntil = performance.now() + 800;

        } else {
      inventory.equipped.tool = "pickaxe";
      showUI(HUD_MSG.PICKAXE_EQUIPPED);
        lastMessageUntil = performance.now() + 800;

        }

        updateInventoryUI();      // 규칙/UI 반영
     });
        }   


      // 아주 가벼운 툴팁(hover)
      slot.title = `${item.name}${item.count ? ` x ${item.count}` : ""}`;
        }

        invgrid.appendChild(slot);
     }
}

// I 키로 인벤 열고닫기
let invOpen = false;
function setInvOpen(v) {
  invOpen = v;
  invWin.style.display = invOpen ? "block" : "none";
  if (invOpen) renderInventoryWindow();
}

window.addEventListener("keydown", (e) => {
  // 입력창 없으니 간단 처리
  if (e.key.toLowerCase() === "i") {
    setInvOpen(!invOpen);
  }
});


// ===== UI (간단 텍스트) =====
const ui = document.createElement("div");
ui.style.position = "fixed";
ui.style.left = "50%";
ui.style.bottom = "56px";  // 하단 중앙
ui.style.transform = "translateX(-50%) translateY(8px)";
ui.style.padding = "8px 10px";
ui.style.background = "rgba(0,0,0,0.62)";
ui.style.color = "white";
ui.style.fontFamily = "system-ui, -apple-system, sans-serif";
ui.style.fontSize = "13px";
ui.style.borderRadius = "10px";
ui.style.pointerEvents = "none";
uiLayer.appendChild(ui);

// 페이드/툭 애니메이션
ui.style.opacity = "0";
ui.style.transition = "opacity 160ms ease, transform 160ms ease";
ui.style.willChange = "opacity, transform";

// display는 이제 항상 block로 두고, opacity로만 숨김/표시
ui.style.display = "block";


let hudTimer = null;

function showUI(text, ms = 900) {
  ui.textContent = text;

  // 기존 타이머 취소
  if (hudTimer) {
    clearTimeout(hudTimer);
    hudTimer = null;
  }

  // 즉시 보이기(툭 올라오면서)
  ui.style.opacity = "1";
  ui.style.transform = "translateX(-50%) translateY(0px)";

  // ms 후 자동으로 사라짐
  hudTimer = setTimeout(() => {
    hideUI();
  }, ms);
}

function hideUI() {
  ui.style.opacity = "0";
  ui.style.transform = "translateX(-50%) translateY(8px)";
}

// ===== HUD Messages (short, game-like) =====
const HUD_MSG = {
  NEED_PICKAXE: "⛏️ 필요",
  EQUIP_PICKAXE: "⛏️ 장착 필요",
  PICKAXE_EQUIPPED: "⛏️ 장착",
  PICKAXE_UNEQUIPPED: "⛏️ 해제",
  PICKAXE_GET: "⛏️ 획득!",
};




// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemi.position.set(0, 50, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(10, 20, 10);
scene.add(dir);

// ===== Ground (mine-like bumpy terrain) =====
const GROUND_SIZE = 100;      // 맵 크기(100 x 100)
const GROUND_SEG = 80;       // 세그먼트가 많을수록 울퉁불퉁이 자연스러움
const HEIGHT = 0.8;          // 울퉁불퉁 강도 (너무 크면 걸을 때 어색해짐)

// ===== Starting Zone =====
const START_X = 0;
const START_Z = 0;
const START_RADIUS = 5.0;     // 네가 말한 반경 5m
const START_SMOOTH = 1.8;     // 경계 부드럽게 이어지는 폭(1~3 추천)
const START_FLAT_Y = 0.0;     // 스타팅 존 바닥 높이
const START_WALL_ON = false;  // start ring 비활성화
const START_WALL_VISIBLE = true; // 띠를 실제로 보이게
const START_HARD_CLAMP = false; // 하드 클램프는 끄고 벽 충돌로만 제어
const START_RING_OPEN_RATIO = 0.20; // 20% 개방
const START_RING_OPEN_CENTER = Math.PI / 2; // +Z 방향에 개방 구간 중심
const START_RING_SEG = 36;
const START_RING_HEIGHT = 1.1; // 허리춤 정도
const START_RING_THICKNESS = 1.275; // 기존 대비 50% 두껍게


const groundGeo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, GROUND_SEG, GROUND_SEG);

// 정점 높이 랜덤으로 울퉁불퉁 만들기
const pos = groundGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const y = pos.getY(i);

  // 중심부는 조금 덜, 가장자리는 조금 더 (자연스럽게)
  const edge = Math.min(1, (Math.abs(x) + Math.abs(y)) / (GROUND_SIZE * 0.9));
  const amp = HEIGHT * (0.6 + 0.6 * edge);

  const h = (Math.random() - 0.5) * 2 * amp;
    // ===== Starting Zone flatten (inside radius) =====
  const dx0 = x - START_X;
  const dz0 = y - START_Z; // PlaneGeometry에서 getY는 실제 z축 역할(회전 전)
  const dist = Math.hypot(dx0, dz0);

  // 1) 완전 내부: 평탄
  if (dist <= START_RADIUS) {
    pos.setZ(i, START_FLAT_Y);
    continue;
  }

  // 2) 경계 바깥으로 자연스럽게 이어지기(부드러운 블렌딩)
  if (dist <= START_RADIUS + START_SMOOTH) {
    const t = (dist - START_RADIUS) / START_SMOOTH; // 0~1
    const smooth = t * t * (3 - 2 * t);            // smoothstep
    const blended = START_FLAT_Y * (1 - smooth) + h * smooth;
    pos.setZ(i, blended);
    continue;
  }

  pos.setZ(i, h);
}
pos.needsUpdate = true;
groundGeo.computeVertexNormals(); // 조명이 자연스럽게 먹게 함

const groundMat = new THREE.MeshStandardMaterial({
  color: 0x7b6f63,      // 회갈색
  roughness: 0.95,      // 무광/거친 느낌
  metalness: 0.0,
});

const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = false; // STEP 1에서 그림자 약하게 했으니 유지
scene.add(ground);

// ===== Starting Zone flat floor overlay (visual fix) =====
const startFloorGeo = new THREE.CircleGeometry(START_RADIUS, 64);
const startFloorMat = new THREE.MeshStandardMaterial({
  color: 0x7b6f63,   // groundMat 색이랑 맞춰도 되고
  roughness: 0.95,
  metalness: 0.0,
});
const startFloor = new THREE.Mesh(startFloorGeo, startFloorMat);
startFloor.rotation.x = -Math.PI / 2;
startFloor.position.set(START_X, START_FLAT_Y + 0.03, START_Z); // 살짝 위로
scene.add(startFloor);


const gridHelper = new THREE.GridHelper(200, 200);
gridHelper.material.opacity = 0.25;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// Player
const player = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.9 });
const limbMat = new THREE.MeshStandardMaterial({ color: 0xb5b5b5, roughness: 0.95 });

const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.36), bodyMat);
torso.position.y = 1.35;

// 얼굴은 타원형 1개만 사용
const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), bodyMat);
head.scale.set(0.85, 1.2, 0.82);
head.position.y = 2.1;

// 어깨 피벗(회전축)
const leftArmPivot = new THREE.Group();
leftArmPivot.position.set(-0.47, 1.8, 0);
const rightArmPivot = new THREE.Group();
rightArmPivot.position.set(0.47, 1.8, 0);

const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.22), limbMat);
leftArm.position.set(0, -0.42, 0);
const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.22), limbMat);
rightArm.position.set(0, -0.42, 0);
leftArmPivot.add(leftArm);
rightArmPivot.add(rightArm);

// 허벅지(힙) 피벗
const leftLegPivot = new THREE.Group();
leftLegPivot.position.set(-0.18, 0.9, 0);
const rightLegPivot = new THREE.Group();
rightLegPivot.position.set(0.18, 0.9, 0);

const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.26), limbMat);
leftLeg.position.set(0, -0.45, 0);
const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.26), limbMat);
rightLeg.position.set(0, -0.45, 0);
leftLegPivot.add(leftLeg);
rightLegPivot.add(rightLeg);

player.add(torso, head, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot);
player.position.set(0, 0, 0);
scene.add(player);


// 바닥에 깔리는 원형 표시 (시각용)
const startCircle = new THREE.Mesh(
  new THREE.CircleGeometry(START_RADIUS, 48),
  new THREE.MeshStandardMaterial({
    color: 0x9fb3c8,
    transparent: true,
    opacity: 0.25,
  })
);
startCircle.rotation.x = -Math.PI / 2;
startCircle.position.y = 0.02; // 바닥 위로 살짝
scene.add(startCircle);

// ===== Auto foot offset (based on player mesh bounds) =====
const playerBounds = new THREE.Box3().setFromObject(player);
const PLAYER_FOOT_OFFSET = -playerBounds.min.y; // 플레이어 원점에서 "바닥"까지 거리

// Colliders
const colliders = [];
const colliderBoxes = []; // 콜라이더 박스 캐시(정적 오브젝트용)

const mineRocks = []; // 채집 가능한 돌 목록
const ROCK_RESPAWN_MS = 10000;
const ROCK_COUNT = 50;
const ROCK_SPAWN_MARGIN = 6;
const ROCK_SAFE_RADIUS = 8;
const ROCK_MIN_GAP = 0.55; // 돌끼리 화면상 붙어 보이지 않게 여유
// ===== Mining particles (stone dust) =====
const particles = [];

function getRockSpawnBounds() {
  const half = GROUND_SIZE / 2;
  return {
    minX: -half + ROCK_SPAWN_MARGIN,
    maxX: half - ROCK_SPAWN_MARGIN,
    minZ: -half + ROCK_SPAWN_MARGIN,
    maxZ: half - ROCK_SPAWN_MARGIN,
  };
}

function isRockSpawnValid(x, z, s) {
  // 시작 지점 주변은 비워둠
  if ((x * x + z * z) < ROCK_SAFE_RADIUS * ROCK_SAFE_RADIUS) return false;

  // 기존 돌과의 간격 확보
  for (const rock of mineRocks) {
    if (!rock || !rock.parent) continue;
    const otherS = rock.userData?.spawn?.s ?? 1;
    const minDist = (0.9 * s) + (0.9 * otherS) + ROCK_MIN_GAP;
    const dx = x - rock.position.x;
    const dz = z - rock.position.z;
    if ((dx * dx + dz * dz) < (minDist * minDist)) return false;
  }

  return true;
}

function findRockSpawnPosition(s, tries = 80) {
  const b = getRockSpawnBounds();
  for (let i = 0; i < tries; i++) {
    const x = randRange(b.minX, b.maxX);
    const z = randRange(b.minZ, b.maxZ);
    if (isRockSpawnValid(x, z, s)) return { x, z };
  }
  return null;
}

function spawnDustBurst(pos, count = 16) {
  // 작은 큐브 파티클(가벼움)
  const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
  const mat = new THREE.MeshStandardMaterial({ color: 0xd6d0c6, roughness: 1.0 });

  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat);

    // 시작 위치(돌 근처)
    m.position.copy(pos);
    m.position.y += 0.6 + Math.random() * 0.6;

    // 속도(위로 + 랜덤)
    const v = new THREE.Vector3(
      (Math.random() - 0.5) * 2.2,
      2.2 + Math.random() * 2.2,
      (Math.random() - 0.5) * 2.2
    );

    // 수명
    m.userData.v = v;
    m.userData.life = 0.6 + Math.random() * 0.5;

    scene.add(m);
    particles.push(m);
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.userData.life -= dt;

    // 중력
    p.userData.v.y -= 7.5 * dt;

    // 이동
    p.position.addScaledVector(p.userData.v, dt);

    // 바닥에 닿으면 살짝 감속
    if (p.position.y < 0.05) {
      p.position.y = 0.05;
      p.userData.v.multiplyScalar(0.35);
    }

    // 수명 끝나면 제거
    if (p.userData.life <= 0) {
      p.removeFromParent();
      particles.splice(i, 1);
    }
  }
}


// ===== Inventory (slot-based) =====
// 아이템 정의(나중에 계속 늘릴 예정)
const ITEM_DEFS = {
  pickaxe: { name: "곡괭이", icon: "⛏️", stackMax: 1, category: "equip" },
  stoneDust: { name: "돌가루", icon: "🪨", stackMax: 999, category: "misc" },
    };

    // 인벤토리 데이터: 슬롯 + 장착 상태
    const inventory = {
  slots: Array.from({ length: 30 }, () => null), // 30칸(원하면 늘림)
  equipped: {
    tool: null, // "pickaxe" 같은 아이템 id
  },
    };

    function findFirstSlotWithItem(id) {
  for (let i = 0; i < inventory.slots.length; i++) {
    const s = inventory.slots[i];
    if (s && s.id === id) return i;
  }
  return -1;
    }

    function findFirstEmptySlot() {
  for (let i = 0; i < inventory.slots.length; i++) {
    if (!inventory.slots[i]) return i;
  }
  return -1;
    }

    function addItem(id, count = 1) {
  const def = ITEM_DEFS[id];
  if (!def) return false;

  // 1) 스택 가능한 경우: 기존 스택에 더하기
  if (def.stackMax > 1) {
    const idx = findFirstSlotWithItem(id);
    if (idx !== -1) {
      inventory.slots[idx].count += count;
      return true;
    }
  }

  // 2) 빈 슬롯에 넣기
  const empty = findFirstEmptySlot();
  if (empty === -1) return false;

  inventory.slots[empty] = { id, count: Math.min(count, def.stackMax) };
  return true;
    }

    function hasEquippedTool(id) {
  return inventory.equipped.tool === id;
    }

    function hasItem(id) {
  return findFirstSlotWithItem(id) !== -1;
    }

    const equippedPickaxe = new THREE.Group();
    const equippedHandle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.045, 0.95, 8),
  new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 })
    );
    // 그룹 원점(0,0,0)을 손잡이 하단 쥐는 지점으로 사용
    equippedHandle.position.y = 0.38;

    const equippedHead = new THREE.Mesh(
  new THREE.BoxGeometry(0.62, 0.12, 0.18),
  new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.8 })
    );
    // 금속 헤드는 손잡이 반대편(위쪽) 끝
    equippedHead.position.y = 0.9;

    equippedPickaxe.add(equippedHandle, equippedHead);
    // 캐릭터 기준 오른손(rightArm) 기준 위치
    equippedPickaxe.position.set(0.01, -0.44, 0.07);
    // +Y(헤드 방향)를 +Z(진행 방향 앞)로 보내기 위해 +90도 회전
    equippedPickaxe.rotation.set(Math.PI * 0.5, Math.PI * 0.03, -Math.PI * 0.08);
    equippedPickaxe.visible = false;
    leftArm.add(equippedPickaxe);

    function updateEquippedVisual() {
  equippedPickaxe.visible = hasEquippedTool("pickaxe");
    }



  const invEl = document.createElement("div");
  invEl.style.position = "fixed";
  invEl.style.left = "12px";
  invEl.style.top = "12px";
  invEl.style.padding = "8px 10px";
  invEl.style.background = "rgba(0,0,0,0.35)";
  invEl.style.color = "white";
  invEl.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  invEl.style.fontSize = "14px";
  invEl.style.borderRadius = "10px";
  invEl.style.backdropFilter = "blur(4px)";
  invEl.style.userSelect = "none";
  invEl.style.zIndex = "9999";
  uiLayer.appendChild(invEl);
  invEl.style.display = "none";
  function updateInventoryUI() {
  // (기존 작은 HUD는 숨겼으니 여기서 invEl 텍스트는 안 만듦)
  updateEquippedVisual();

  // 인벤 창이 열려있으면 슬롯 표시 갱신
  if (typeof invOpen !== "undefined" && invOpen) renderInventoryWindow();
    }

    updateInventoryUI(); // 처음 한번 표시

  invEl.style.zIndex = "999999";


// ===== Pickup hint UI =====
const pickupEl = document.createElement("div");
  pickupEl.id = "pickupHint";
  // ===== Persistent Hint (separate from toast) =====
    const hintEl = document.createElement("div");
    hintEl.id = "hintUI";
    hintEl.style.position = "fixed";
    hintEl.style.left = "50%";
    hintEl.style.bottom = "110px"; // 토스트(56px)보다 살짝 위
    hintEl.style.transform = "translateX(-50%)";
    hintEl.style.padding = "8px 10px";
    hintEl.style.background = "rgba(0,0,0,0.45)";
    hintEl.style.color = "white";
    hintEl.style.fontFamily = "system-ui, -apple-system, sans-serif";
    hintEl.style.fontSize = "13px";
    hintEl.style.borderRadius = "10px";
    hintEl.style.pointerEvents = "none";
    hintEl.style.opacity = "0";
    hintEl.style.transition = "opacity 120ms ease";
    hintEl.style.userSelect = "none";
    uiLayer.appendChild(hintEl);

    function showHint(text) {
  hintEl.textContent = text;
  hintEl.style.opacity = "1";
    }
    function hideHint() {
  hintEl.style.opacity = "0";
    }

    let hintUntil = 0;


  pickupEl.style.position = "fixed";
  pickupEl.style.left = "50%";
  pickupEl.style.bottom = "22%";
  pickupEl.style.transform = "translateX(-50%)";
  pickupEl.style.padding = "14px 20px";
  pickupEl.style.background = "rgba(0,0,0,0.60)";
  pickupEl.style.color = "white";
  pickupEl.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  pickupEl.style.fontSize = "20px";
  pickupEl.style.borderRadius = "14px";
  pickupEl.style.backdropFilter = "blur(4px)";
  pickupEl.style.boxShadow = "0 10px 25px rgba(0,0,0,0.35)";
  pickupEl.style.border = "1px solid rgba(255,255,255,0.25)";
  pickupEl.style.letterSpacing = "0.2px";
  pickupEl.style.userSelect = "none";
  pickupEl.style.zIndex = "9999";
  pickupEl.style.display = "none";
  uiLayer.appendChild(pickupEl);
  pickupEl.style.zIndex = "999999";

  function showPickupHint(text) {
  pickupEl.textContent = text;
  pickupEl.style.display = "block";
}
function hidePickupHint() {
  pickupEl.style.display = "none";
}

let activeMineRock = null;
const latestMoveDir = new THREE.Vector3(0, 0, -1); // 월드 기준: -Z = 북, +X = 동

function updateCompassFromDirection(dir) {
  const d = dir.clone();
  d.y = 0;
  if (d.lengthSq() < 1e-6) return;
  d.normalize();

  // 기준: -Z = North, +X = East
  const deg = (Math.atan2(d.x, -d.z) * 180) / Math.PI;
  const heading = (deg + 360) % 360;
  const labels = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  const idx = Math.round(heading / 45) % 8;

  compassNeedle.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
  compassText.textContent = `${labels[idx]} ${Math.round(heading)}°`;
}

function findNearestMineRock(radius = 2.2) {
  const r2 = radius * radius;
  let best = null;
  let bestD2 = Infinity;

  for (const rock of mineRocks) {
    if (!rock || !rock.parent) continue; // 이미 제거된 것 제외
    const dx = rock.position.x - player.position.x;
    const dz = rock.position.z - player.position.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < r2 && d2 < bestD2) {
      bestD2 = d2;
      best = rock;
    }
  }
  return best;
}

function removeColliderAt(idx) {
  colliders.splice(idx, 1);
  colliderBoxes.splice(idx, 1);

  // 콜라이더 인덱스가 뒤로 밀리니까, 돌들의 인덱스를 보정
  for (const rock of mineRocks) {
    if (!rock || !rock.userData) continue;
    const ci = rock.userData.colliderIndex;
    if (typeof ci === "number" && ci > idx) {
      rock.userData.colliderIndex = ci - 1;
    }
  }
}


// 콜라이더를 등록하면서 Box3를 한 번만 계산해 캐시해둠
function addCollider(obj, shrink = 1.0) {
  obj.userData.colliderShrink = shrink;

  obj.updateWorldMatrix(true, true); // ✅ 월드 좌표 반영
  const box = new THREE.Box3().setFromObject(obj);

  if (shrink !== 1.0) {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).multiplyScalar(shrink);
    box.setFromCenterAndSize(center, size);
  }

  const idx = colliders.length;
  colliders.push(obj);
  colliderBoxes.push(box);
  return idx;

}

// ===== Starting Zone collision wall (optional) =====
function buildStartZoneWall() {
  if (!START_WALL_ON) return;

  const wallH = START_RING_HEIGHT;
  const wallT = START_RING_THICKNESS;
  const mat = START_WALL_VISIBLE
    ? new THREE.MeshStandardMaterial({
      color: 0xbec3c8,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.82,
    })
    : new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.0 });

  const openAngle = Math.PI * 2 * START_RING_OPEN_RATIO;
  const solidStart = START_RING_OPEN_CENTER + openAngle * 0.5;
  const solidEnd = solidStart + (Math.PI * 2 - openAngle);
  const outerR = START_RADIUS + wallT * 0.5;
  const innerR = Math.max(0.2, START_RADIUS - wallT * 0.5);

  // 시작 구역 띠를 조각이 아닌 단일 메쉬로 생성 (깜빡임/우글거림 방지)
  const ringShape = new THREE.Shape();
  ringShape.moveTo(Math.cos(solidStart) * outerR, Math.sin(solidStart) * outerR);
  ringShape.absarc(0, 0, outerR, solidStart, solidEnd, false);
  ringShape.lineTo(Math.cos(solidEnd) * innerR, Math.sin(solidEnd) * innerR);
  ringShape.absarc(0, 0, innerR, solidEnd, solidStart, true);
  ringShape.closePath();

  const ringGeo = new THREE.ExtrudeGeometry(ringShape, {
    depth: wallH,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 72,
  });
  ringGeo.rotateX(-Math.PI / 2); // extrude 축을 Y(높이)로 변환

  const ringMesh = new THREE.Mesh(ringGeo, mat);
  ringMesh.position.set(START_X, START_FLAT_Y + 0.05, START_Z);
  scene.add(ringMesh);
}

function buildStartStall() {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.95 });

  // 상판
  const top = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.25, 1.8), woodMat);
  top.position.y = 1.05;
  g.add(top);

  // 다리 4개
  const legGeo = new THREE.BoxGeometry(0.18, 1.0, 0.18);
  const legOffsets = [
    [-3.0, 0.5, -0.75],
    [3.0, 0.5, -0.75],
    [-3.0, 0.5, 0.75],
    [3.0, 0.5, 0.75],
  ];
  for (const [x, y, z] of legOffsets) {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(x, y, z);
    g.add(leg);
  }

  // 시작 위치 근처 배치 (플레이어 스폰 위치는 피해서)
  g.position.set(START_X, START_FLAT_Y, START_Z - 2.3);
  scene.add(g);
  addCollider(g, 1.0);
}


// ===== Ground follow (raycast) =====
const groundRay = new THREE.Raycaster();
const rayOrigin = new THREE.Vector3();
const rayDir = new THREE.Vector3(0, -1, 0);

// 플레이어 발이 지면에 닿는 기준 오프셋(캡슐 크기에 맞게 조절)
// const PLAYER_FOOT_OFFSET = 0.2; // 너무 뜨면 0.8, 파묻히면 1.2

function updatePlayerGroundY(dt) {
  // player 위에서 아래로 레이를 쏴서 지면 높이 측정
  rayOrigin.set(player.position.x, player.position.y + 20, player.position.z);
  groundRay.set(rayOrigin, rayDir);
  groundRay.far = 50;

  const hits = groundRay.intersectObject(ground, false);
  if (hits.length > 0) {
    const targetY = hits[0].point.y + PLAYER_FOOT_OFFSET;

    // 갑자기 튀지 않게 부드럽게 따라가기
    const follow = 1 - Math.pow(0.001, dt); // dt 기반 부드러운 보간
    player.position.y = player.position.y + (targetY - player.position.y) * follow;
  }
}


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
  addCollider(base, 1.0);

}

/* HOUSES OFF
for (let i = 0; i < 6; i++) makeHouse(-10 + i * 5, -12);
for (let i = 0; i < 4; i++) makeHouse(-8 + i * 6, 10);
HOUSES OFF */

// ===== Nature: Trees & Rocks =====
function randRange(min, max) {
  return min + Math.random() * (max - min);
}

// 간단한 나무 (충돌은 일단 없음: 바위가 메인 장애물)
function makeTree(x, z) {
  const g = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.35, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 1.0 })
  );
  trunk.position.y = 1.1;

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x3f6b3a, roughness: 1.0 })
  );
  leaves.position.y = 2.6;

  g.add(trunk, leaves);
  g.position.set(x, 0, z);
  scene.add(g);
  // ✅ 나무 충돌(트렁크만): 너무 빡빡하지 않게 약간 줄임
  trunk.updateWorldMatrix(true, true);
  addCollider(trunk, 0.75);

}

// 캐릭터급 바위 (충돌 포함)
function makeRock(x, z, s = 1, fadeIn = false) {
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x6f6f72,
    roughness: 1.0,
    transparent: fadeIn,
    opacity: fadeIn ? 0 : 1,
  });
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.9 * s, 0),
    rockMat
  );
  rock.position.set(x, 0.9 * s, z);

  // 약간 울퉁불퉁한 느낌
  rock.rotation.set(randRange(0, Math.PI), randRange(0, Math.PI), randRange(0, Math.PI));

  scene.add(rock);
  // ✅ 충돌 등록(조금 더 타이트하게)
  rock.userData.colliderShrink = 0.85; // 1보다 작을수록 더 타이트(0.8~0.9 추천)
  mineRocks.push(rock);

  const colliderIndex = addCollider(rock, 0.85);
  rock.userData.isMineRock = true;
  rock.userData.colliderIndex = colliderIndex;
  rock.userData.spawn = { x, z, s };
  if (fadeIn) {
    rock.userData.fadeInElapsed = 0;
    rock.userData.fadeInDuration = 1.0;
  }

  return rock;
}

function scheduleRockRespawn(spawn) {
  setTimeout(() => {
    const s = spawn?.s ?? randRange(0.8, 1.3);
    const next = findRockSpawnPosition(s, 120);
    if (!next) return;
    makeRock(next.x, next.z, s, true);
  }, ROCK_RESPAWN_MS);
}

function unregisterMineRock(rock) {
  const idx = mineRocks.indexOf(rock);
  if (idx !== -1) mineRocks.splice(idx, 1);

}

function updateRockFadeIns(dt) {
  for (const rock of mineRocks) {
    if (!rock || !rock.parent) continue;
    const dur = rock.userData.fadeInDuration;
    if (!dur) continue;

    rock.userData.fadeInElapsed += dt;
    const t = Math.min(1, rock.userData.fadeInElapsed / dur);
    rock.material.opacity = t;

    if (t >= 1) {
      rock.material.transparent = false;
      delete rock.userData.fadeInElapsed;
      delete rock.userData.fadeInDuration;
    }
  }
}

// ===== Pickaxe item =====
function makePickaxe(x, z) {
  const g = new THREE.Group();

  // 손잡이
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
  );
  handle.position.y = 0.6;

  // 헤드
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.15, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x9aa0a6 })
  );
  head.position.y = 1.2;

  g.add(handle, head);
  g.position.set(x, 0, z);

  // 살짝 누워있는 느낌
  g.rotation.z = Math.PI * 0.15;

  // 아이템 정보
  g.userData.isPickaxe = true;

  scene.add(g);
  return g;
}


// 배치 실행 (맵 크기에 맞춰 랜덤 배치)
function spawnTreesAndRocks() {
  const half = (typeof GROUND_SIZE !== "undefined" ? GROUND_SIZE : 120) / 2;
  const margin = 6; // 가장자리 여백
  const minX = -half + margin;
  const maxX = half - margin;
  const minZ = -half + margin;
  const maxZ = half - margin;

  // 시작 지점(플레이어 초기 위치 근처) 비우기
  const safeRadius = 8;

  // 나무/바위 개수 (원하면 여기 숫자만 조절)
  const TREE_COUNT = 20;

  // 나무
  for (let i = 0; i < TREE_COUNT; i++) {
    let x = 0, z = 0;
    let tries = 0;

    do {
      x = randRange(minX, maxX);
      z = randRange(minZ, maxZ);
      tries++;
    } while ((x * x + z * z) < safeRadius * safeRadius && tries < 30);

    makeTree(x, z);
  }

  // 바위 (크기 조금씩 다르게)
  for (let i = 0; i < ROCK_COUNT; i++) {
    const s = randRange(0.8, 1.3); // 캐릭터급 크기 변주
    const spawnPos = findRockSpawnPosition(s, 120);
    if (!spawnPos) continue;
    makeRock(spawnPos.x, spawnPos.z, s);
  }
}

spawnTreesAndRocks();
buildStartZoneWall();
buildStartStall();


// ===== Place pickaxe in starting area =====
const pickaxe = makePickaxe(2.5, 0); // 시작 원 안쪽



makeSign(0, 3, "광산 안내판: 중앙 작업장 →");
makeSign(-6, -2, "광산 안내판: 낙석 주의.");
makeSign(8, -4, "광산 안내판: 바람이 강한 구간. 시야 흐림 주의.");


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
// scene.add(road);

// Input
const keys = { w: false, a: false, s: false, d: false, shift: false };

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  console.log("KEYDOWN:", k);

  // ===== E : 곡괭이 줍기 (획득만, 장착은 인벤 더블클릭) =====
  if (k === "e" && pickaxe && pickaxe.parent) {
  const dx = pickaxe.position.x - player.position.x;
  const dz = pickaxe.position.z - player.position.z;
  const d = Math.hypot(dx, dz); // ✅ 수평 거리만

  if (d < 2.0) {
    if (!hasItem("pickaxe")) addItem("pickaxe", 1);

    updateInventoryUI();
    showUI(HUD_MSG.PICKAXE_GET);
    lastMessageUntil = performance.now() + 900;

    pickaxe.removeFromParent();
    return;
  }
  }


    // E 키로 상호작용
  if (k === "e" && activeInteractable) {
    showUI(activeInteractable.text);
    lastMessageUntil = performance.now() + 2000; // 2초 표시
  }

   // if (k === "p") {
   // inventory.hasPickaxe = true;
   // showUI("곡괭이를 얻었다!");
   // lastMessageUntil = performance.now() + 1200;
   // updateInventoryUI();
  // }

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
  for (let i = 0; i < colliderBoxes.length; i++) {
    if (playerBox.intersectsBox(colliderBoxes[i])) return true;
  }
  return false;
}

function isBlockedByStartRing(x, z) {
  if (!START_WALL_ON) return false;

  const dx = x - START_X;
  const dz = z - START_Z;
  const dist = Math.hypot(dx, dz);
  const playerRadius = 0.55;
  const inner = START_RADIUS - START_RING_THICKNESS * 0.5 - playerRadius;
  const outer = START_RADIUS + START_RING_THICKNESS * 0.5 + playerRadius;

  if (dist < inner || dist > outer) return false;

  const angle = Math.atan2(dz, dx);
  const d = Math.atan2(
    Math.sin(angle - START_RING_OPEN_CENTER),
    Math.cos(angle - START_RING_OPEN_CENTER)
  );
  const openHalf = Math.PI * START_RING_OPEN_RATIO;
  const inOpening = Math.abs(d) <= openHalf;
  return !inOpening;
}

function isInStartRingOpening(angle) {
  const d = Math.atan2(
    Math.sin(angle - START_RING_OPEN_CENTER),
    Math.cos(angle - START_RING_OPEN_CENTER)
  );
  const openHalf = Math.PI * START_RING_OPEN_RATIO;
  return Math.abs(d) <= openHalf;
}

function isCrossingBlockedStartRing(prevX, prevZ, nextX, nextZ) {
  if (!START_WALL_ON) return false;

  const pdx = prevX - START_X;
  const pdz = prevZ - START_Z;
  const ndx = nextX - START_X;
  const ndz = nextZ - START_Z;
  const prevDist = Math.hypot(pdx, pdz);
  const nextDist = Math.hypot(ndx, ndz);

  const wasInside = prevDist < START_RADIUS;
  const isInside = nextDist < START_RADIUS;
  if (wasInside === isInside) return false;

  // 반경 경계 교차 지점(선형 보간)에서 개방 구간 여부 판정
  const denom = nextDist - prevDist;
  let t = 0.5;
  if (Math.abs(denom) > 1e-6) {
    t = (START_RADIUS - prevDist) / denom;
    t = Math.max(0, Math.min(1, t));
  }
  const cx = prevX + (nextX - prevX) * t;
  const cz = prevZ + (nextZ - prevZ) * t;
  const crossingAngle = Math.atan2(cz - START_Z, cx - START_X);

  return !isInStartRingOpening(crossingAngle);
}

function resolveStartRingPenetration(currentPos, prevPos = null) {
  if (!START_WALL_ON) return;

  const dx = currentPos.x - START_X;
  const dz = currentPos.z - START_Z;
  const dist = Math.hypot(dx, dz);
  const playerRadius = 0.55;
  const inner = START_RADIUS - START_RING_THICKNESS * 0.5 - playerRadius;
  const outer = START_RADIUS + START_RING_THICKNESS * 0.5 + playerRadius;
  if (dist < inner || dist > outer) return;

  const angle = Math.atan2(dz, dx);
  const d = Math.atan2(
    Math.sin(angle - START_RING_OPEN_CENTER),
    Math.cos(angle - START_RING_OPEN_CENTER)
  );
  const openHalf = Math.PI * START_RING_OPEN_RATIO;
  const inOpening = Math.abs(d) <= openHalf;
  if (inOpening) return;

  const eps = 0.02;
  const nx = dist > 1e-5 ? dx / dist : 1;
  const nz = dist > 1e-5 ? dz / dist : 0;

  // 이전 위치 기준으로 안쪽/바깥쪽 중 원래 있던 쪽으로 되돌린다.
  const prevDist = prevPos
    ? Math.hypot(prevPos.x - START_X, prevPos.z - START_Z)
    : dist;

  if (prevDist <= START_RADIUS) {
    currentPos.x = START_X + nx * (inner - eps);
    currentPos.z = START_Z + nz * (inner - eps);
  } else {
    currentPos.x = START_X + nx * (outer + eps);
    currentPos.z = START_Z + nz * (outer + eps);
  }
}

function isStartRingTransitionBlocked(x0, z0, x1, z1) {
  if (!START_WALL_ON) return false;

  const dist = Math.hypot(x1 - x0, z1 - z0);
  const steps = Math.max(2, Math.ceil(dist / 0.08));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    if (isBlockedByStartRing(x, z)) return true;
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
  const isMoving = move.lengthSq() > 0;

  if (isMoving) {
    move.normalize();
    latestMoveDir.copy(move);
    const speed = keys.shift ? 7.0 : 4.0;
     
    const prevPos = player.position.clone();
    const delta = move.clone().multiplyScalar(speed * dt);

    // 1) X축 이동만 먼저 시도
    player.position.x = prevPos.x + delta.x;
    if (
      intersectsAnyCollider(getPlayerBox()) ||
      isStartRingTransitionBlocked(prevPos.x, prevPos.z, player.position.x, player.position.z) ||
      isCrossingBlockedStartRing(prevPos.x, prevPos.z, player.position.x, player.position.z)
    ) {
  player.position.x = prevPos.x; // X 이동 취소
    }

    // 2) Z축 이동만 시도
    const afterX = player.position.x;
    player.position.z = prevPos.z + delta.z;
    if (
      intersectsAnyCollider(getPlayerBox()) ||
      isStartRingTransitionBlocked(afterX, prevPos.z, player.position.x, player.position.z) ||
      isCrossingBlockedStartRing(afterX, prevPos.z, player.position.x, player.position.z)
    ) {
  player.position.z = prevPos.z; // Z 이동 취소
    }

    // 혹시 남은 미세 침투를 정리해 벽 관통을 완전히 차단
    resolveStartRingPenetration(player.position, prevPos);

    const targetYaw = Math.atan2(move.x, move.z);
    player.rotation.y = targetYaw;
  }

  // 간단 보행 모션
  const walkT = performance.now() * 0.015;
  if (isMoving) {
    const armSwing = Math.sin(walkT) * 0.65;
    const legSwing = Math.sin(walkT) * 0.75;
    leftArmPivot.rotation.x = armSwing;
    rightArmPivot.rotation.x = -armSwing;
    leftLegPivot.rotation.x = -legSwing;
    rightLegPivot.rotation.x = legSwing;
    torso.rotation.x = Math.sin(walkT * 2) * 0.04;
  } else {
    leftArmPivot.rotation.x *= 0.8;
    rightArmPivot.rotation.x *= 0.8;
    leftLegPivot.rotation.x *= 0.8;
    rightLegPivot.rotation.x *= 0.8;
    torso.rotation.x *= 0.8;
  }

  // ===== Starting Zone clamp (hard boundary) =====
  if (START_WALL_ON && START_HARD_CLAMP) {
    const dx = player.position.x - START_X;
    const dz = player.position.z - START_Z;
    const dist = Math.hypot(dx, dz);

    // 원 밖이면, 원 둘레로 되돌려놓기
    const margin = 0.6; // 캐릭터 반지름 여유(0.5~0.8 추천)
    const limit = START_RADIUS - margin;

    if (dist > limit && dist > 0.0001) {
      const nx = dx / dist;
      const nz = dz / dist;
      player.position.x = START_X + nx * limit;
      player.position.z = START_Z + nz * limit;
    }
  }

  updatePlayerGroundY(dt);
}

window.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  if (!activeMineRock) return;
  if (!hasEquippedTool("pickaxe")) {
  // 곡괭이를 '가지고는' 있는데 장착이 안 된 상태면
  if (findFirstSlotWithItem("pickaxe") !== -1) {
    showUI(HUD_MSG.EQUIP_PICKAXE);
  } else {
    showUI(HUD_MSG.NEED_PICKAXE);
  }
  lastMessageUntil = performance.now() + 900;
  return;
}


  // 채집!
  const minedRock = activeMineRock;
  const spawn = minedRock.userData.spawn
    ? { ...minedRock.userData.spawn }
    : { x: minedRock.position.x, z: minedRock.position.z, s: 1 };

  spawnDustBurst(minedRock.position, 18);
  addItem("stoneDust", 1);
  updateInventoryUI();

  // 콜라이더 제거
  const idx = minedRock.userData.colliderIndex;
  if (typeof idx === "number") removeColliderAt(idx);

  // 목록/씬에서 제거
  unregisterMineRock(minedRock);

  // 씬에서 제거
  minedRock.removeFromParent();
  scheduleRockRespawn(spawn);

  // 힌트 숨기기
  activeMineRock = null;
  hidePickupHint();
});


function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);

  updateMovement(dt);
  updateParticles(dt);
  updateRockFadeIns(dt);
  if (latestMoveDir.lengthSq() > 1e-6) {
    updateCompassFromDirection(latestMoveDir);
  } else {
    updateCompassFromDirection(new THREE.Vector3(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y)));
  }

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




  controls.target.copy(player.position).add(new THREE.Vector3(0, 1.0, 0));
  controls.update();

 // ===== 힌트(가까이 가면 뜨는 안내) =====
// 우선순위: 1) 곡괭이 줍기 2) 돌 채집 3) 표지판 조사 4) 아무것도 없으면 숨김
let hintText = "";

// 1) 곡괭이 줍기 힌트
if (pickaxe && pickaxe.parent) {
  const dx = pickaxe.position.x - player.position.x;
  const dz = pickaxe.position.z - player.position.z;
  const d = Math.hypot(dx, dz);
  if (d < 2.0) hintText = "E : 곡괭이 줍기";
}

// 2) 돌 채집 힌트 (곡괭이가 줍기 힌트가 없을 때만)
if (!hintText) {
  activeMineRock = findNearestMineRock(2.2);
  if (activeMineRock) {
    // 곡괭이 필요/장착 필요/채집 가능 문구 분기
    if (!hasItem("pickaxe")) hintText = "⛏️ 필요";
    else if (!hasEquippedTool("pickaxe")) hintText = "⛏️ 장착 필요";
    else hintText = "Space : 돌가루 채집";
  }
}

// 3) 표지판 조사 힌트 (위 힌트가 없을 때만)
if (!hintText && activeInteractable) {
  hintText = "E : 조사하기";
}

// 4) 최종 출력
if (hintText) showHint(hintText);
else hideHint();

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
