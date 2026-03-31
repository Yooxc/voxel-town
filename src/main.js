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
invWin.style.zIndex = "1000000";
uiLayer.appendChild(invWin);

const equipWin = document.createElement("div");
equipWin.id = "equipWindow";
equipWin.style.position = "fixed";
equipWin.style.left = "348px";
equipWin.style.top = "12px";
equipWin.style.width = "288px";
equipWin.style.height = "420px";
equipWin.style.background = "rgba(235, 235, 235, 0.92)";
equipWin.style.border = "1px solid rgba(0,0,0,0.25)";
equipWin.style.borderRadius = "10px";
equipWin.style.boxShadow = "0 12px 30px rgba(0,0,0,0.25)";
equipWin.style.backdropFilter = "blur(6px)";
equipWin.style.display = "none";
equipWin.style.pointerEvents = "auto";
equipWin.style.userSelect = "none";
equipWin.style.zIndex = "1000001";
equipWin.style.overflow = "hidden";
uiLayer.appendChild(equipWin);

const equipHeader = document.createElement("div");
equipHeader.textContent = "EQUIPMENT";
equipHeader.style.padding = "10px";
equipHeader.style.fontFamily = "system-ui, -apple-system, sans-serif";
equipHeader.style.fontSize = "14px";
equipHeader.style.fontWeight = "700";
equipHeader.style.letterSpacing = "0.04em";
equipHeader.style.color = "#222";
equipHeader.style.borderBottom = "1px solid rgba(0,0,0,0.15)";
equipHeader.style.background = "rgba(255,255,255,0.7)";
equipWin.appendChild(equipHeader);

const equipBody = document.createElement("div");
equipBody.style.padding = "12px";
equipBody.style.height = "calc(100% - 44px)";
equipBody.style.position = "relative";
equipBody.style.boxSizing = "border-box";
equipWin.appendChild(equipBody);

const equipmentGrid = document.createElement("div");
equipmentGrid.style.position = "absolute";
equipmentGrid.style.inset = "12px";
equipmentGrid.style.display = "grid";
equipmentGrid.style.gridTemplateColumns = "64px minmax(0, 1.45fr) 64px";
equipmentGrid.style.gridTemplateRows = "76px 1fr 76px";
equipmentGrid.style.gap = "10px";
equipBody.appendChild(equipmentGrid);

const previewWrap = document.createElement("div");
previewWrap.style.gridColumn = "2";
previewWrap.style.gridRow = "1 / span 3";
previewWrap.style.borderRadius = "10px";
previewWrap.style.background = "rgba(255,255,255,0.95)";
previewWrap.style.border = "1px solid rgba(0,0,0,0.2)";
previewWrap.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
previewWrap.style.position = "relative";
previewWrap.style.overflow = "hidden";
equipmentGrid.appendChild(previewWrap);

const previewLabel = document.createElement("div");
previewLabel.textContent = "장착 미리보기";
previewLabel.style.position = "absolute";
previewLabel.style.left = "12px";
previewLabel.style.top = "10px";
previewLabel.style.fontFamily = "system-ui, -apple-system, sans-serif";
previewLabel.style.fontSize = "12px";
previewLabel.style.fontWeight = "700";
previewLabel.style.color = "rgba(34,34,34,0.78)";
previewWrap.appendChild(previewLabel);

const previewCanvasWrap = document.createElement("div");
previewCanvasWrap.style.position = "absolute";
previewCanvasWrap.style.inset = "34px 8px 10px";
previewWrap.appendChild(previewCanvasWrap);

const equipmentSlotEls = {};

function createEquipmentSlot(slotId, label, gridColumn, gridRow) {
  const slot = document.createElement("div");
  slot.style.gridColumn = String(gridColumn);
  slot.style.gridRow = String(gridRow);
  slot.style.borderRadius = "8px";
  slot.style.background = "rgba(255,255,255,0.95)";
  slot.style.border = "1px solid rgba(0,0,0,0.2)";
  slot.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
  slot.style.padding = "8px";
  slot.style.boxSizing = "border-box";
  slot.style.display = "flex";
  slot.style.flexDirection = "column";
  slot.style.justifyContent = "space-between";

  const title = document.createElement("div");
  title.textContent = label;
  title.style.fontFamily = "system-ui, -apple-system, sans-serif";
  title.style.fontSize = "11px";
  title.style.fontWeight = "800";
  title.style.letterSpacing = "0.04em";
  title.style.color = "rgba(70,70,70,0.92)";

  const content = document.createElement("div");
  content.style.flex = "1";
  content.style.display = "flex";
  content.style.alignItems = "center";
  content.style.justifyContent = "center";
  content.style.textAlign = "center";
  content.style.fontFamily = "system-ui, -apple-system, sans-serif";
  content.style.color = "rgba(48,56,66,0.82)";

  slot.appendChild(title);
  slot.appendChild(content);
  equipmentGrid.appendChild(slot);
  equipmentSlotEls[slotId] = { slot, content, label };
}

createEquipmentSlot("head", "모자", 1, 1);
createEquipmentSlot("body", "상의", 1, 2);
createEquipmentSlot("shoes", "신발", 1, 3);
createEquipmentSlot("tool", "무기", 3, 2);

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

const itemPreviewCache = new Map();

function disposeObject3D(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        for (const mat of obj.material) mat.dispose();
      } else {
        obj.material.dispose();
      }
    }
  });
}

function createFallbackItemIcon(text, size = 24) {
  const icon = document.createElement("div");
  icon.textContent = text;
  icon.style.fontSize = `${size}px`;
  icon.style.lineHeight = "1";
  icon.style.transform = "translateY(-1px)";
  return icon;
}

function getItemPreviewDataUrl(itemId, size = 40) {
  const cacheKey = `${itemId}:${size}`;
  if (itemPreviewCache.has(cacheKey)) return itemPreviewCache.get(cacheKey);

  const def = ITEM_DEFS[itemId];
  if (!def?.makeInventoryModel) return null;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);

  const previewScene = new THREE.Scene();
  const previewCamera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  previewScene.add(new THREE.AmbientLight(0xffffff, 1.35));

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(2.5, 3.5, 4.5);
  previewScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xcfd7e6, 0.35);
  fillLight.position.set(-2, 1.5, -2);
  previewScene.add(fillLight);

  const model = def.makeInventoryModel();
  previewScene.add(model);
  model.rotation.set(-0.3, 0.68, 0.1);

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const boxSize = box.getSize(new THREE.Vector3());
  model.position.sub(center);
  model.position.y -= box.min.y * 0.15;

  const radius = Math.max(boxSize.x, boxSize.y, boxSize.z) * 0.5 || 1;
  previewCamera.position.set(radius * 1.45, radius * 1.15, radius * 2.3);
  previewCamera.lookAt(0, radius * 0.18, 0);
  previewCamera.updateProjectionMatrix();

  renderer.render(previewScene, previewCamera);
  const dataUrl = renderer.domElement.toDataURL("image/png");
  itemPreviewCache.set(cacheKey, dataUrl);

  disposeObject3D(model);
  renderer.dispose();
  return dataUrl;
}

function createItemVisualElement(itemId, options = {}) {
  const def = ITEM_DEFS[itemId];
  const size = options.size ?? 40;
  const dataUrl = getItemPreviewDataUrl(itemId, size);
  if (dataUrl) {
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = def?.name ?? itemId;
    img.width = size;
    img.height = size;
    img.draggable = false;
    img.style.display = "block";
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.objectFit = "contain";
    img.style.pointerEvents = "none";
    return img;
  }

  return createFallbackItemIcon(def?.icon ?? "?", Math.max(20, Math.round(size * 0.6)));
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

    const itemUI = { id: s.id, name: def.name, count: s.count };

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
      const icon = createItemVisualElement(item.id, { size: 38 });
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
        const def = ITEM_DEFS[item.id];
        const equipSlot = def?.equipSlot ?? null;
        const isEquipped = equipSlot ? inventory.equipped[equipSlot] === item.id : false;

        // 장착된 아이템은 테두리 하이라이트
        if (isEquipTab && isEquipped) {
        slot.style.borderColor = "rgba(255,140,0,0.95)";
        slot.style.boxShadow = "0 0 0 3px rgba(255,140,0,0.35), inset 0 1px 0 rgba(255,255,255,0.8)";   
        }

        // 장비 탭에서만 클릭 가능하도록 커서/효과
        if (isEquipTab && equipSlot) {
        slot.style.cursor = "pointer";
        slot.title = "더블클릭: 장착/해제";

        slot.addEventListener("dblclick", () => {
        toggleEquipItem(item.id);
     });
        }   


      // 아주 가벼운 툴팁(hover)
      slot.title = getItemTooltipText(item.id, item.count);
        }

        invgrid.appendChild(slot);
     }
}

// I 키로 인벤 열고닫기
let invOpen = false;
function setInvOpen(v) {
  invOpen = v;
  invWin.style.display = invOpen ? "block" : "none";
  equipWin.style.display = invOpen ? "block" : "none";
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
  HELMET_GET: "🪖 획득!",
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
player.name = "playerRoot";
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.9 });
const limbMat = new THREE.MeshStandardMaterial({ color: 0xb5b5b5, roughness: 0.95 });

const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.36), bodyMat);
torso.name = "torso";
torso.position.y = 1.35;

// 얼굴은 타원형 1개만 사용
const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), bodyMat);
head.name = "head";
head.scale.set(0.85, 1.2, 0.82);
head.position.y = 2.1;

// 어깨 피벗(회전축)
const leftArmPivot = new THREE.Group();
leftArmPivot.name = "leftArmPivot";
leftArmPivot.position.set(-0.47, 1.8, 0);
const rightArmPivot = new THREE.Group();
rightArmPivot.name = "rightArmPivot";
rightArmPivot.position.set(0.47, 1.8, 0);

const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.22), limbMat);
leftArm.name = "leftArm";
leftArm.position.set(0, -0.42, 0);
const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.22), limbMat);
rightArm.name = "rightArm";
rightArm.position.set(0, -0.42, 0);
leftArmPivot.add(leftArm);
rightArmPivot.add(rightArm);

// 허벅지(힙) 피벗
const leftLegPivot = new THREE.Group();
leftLegPivot.name = "leftLegPivot";
leftLegPivot.position.set(-0.18, 0.9, 0);
const rightLegPivot = new THREE.Group();
rightLegPivot.name = "rightLegPivot";
rightLegPivot.position.set(0.18, 0.9, 0);

const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.26), limbMat);
leftLeg.name = "leftLeg";
leftLeg.position.set(0, -0.45, 0);
const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.26), limbMat);
rightLeg.name = "rightLeg";
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
    m.userData.maxLife = m.userData.life;
    m.userData.kind = "dust";

    scene.add(m);
    particles.push(m);
  }
}

function spawnRockBreakBurst(rock) {
  const rockScale = rock.userData.spawnScale ?? 1;
  const chunkCount = Math.round(6 + rockScale * 3);
  const baseColor = rock.material?.color?.getHex() ?? 0x6f6f72;

  for (let i = 0; i < chunkCount; i++) {
    const size = randRange(0.09, 0.18) * rockScale;
    const chunk = new THREE.Mesh(
      new THREE.DodecahedronGeometry(size, 0),
      new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 1.0,
        transparent: true,
        opacity: 1,
      })
    );

    chunk.position.copy(rock.position);
    chunk.position.add(new THREE.Vector3(
      randRange(-0.08, 0.08),
      randRange(0.15, 0.55) * rockScale,
      randRange(-0.08, 0.08)
    ));
    chunk.rotation.set(randRange(0, Math.PI), randRange(0, Math.PI), randRange(0, Math.PI));

    chunk.userData.v = new THREE.Vector3(
      randRange(-1.7, 1.7) * rockScale,
      randRange(1.2, 2.6) * rockScale,
      randRange(-1.7, 1.7) * rockScale
    );
    chunk.userData.spin = new THREE.Vector3(
      randRange(-7, 7),
      randRange(-7, 7),
      randRange(-7, 7)
    );
    chunk.userData.life = 0.42 + Math.random() * 0.22;
    chunk.userData.maxLife = chunk.userData.life;
    chunk.userData.kind = "rockChunk";

    scene.add(chunk);
    particles.push(chunk);
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
    if (p.userData.spin) {
      p.rotation.x += p.userData.spin.x * dt;
      p.rotation.y += p.userData.spin.y * dt;
      p.rotation.z += p.userData.spin.z * dt;
    }

    // 바닥에 닿으면 살짝 감속
    if (p.position.y < 0.05) {
      p.position.y = 0.05;
      p.userData.v.x *= 0.45;
      p.userData.v.z *= 0.45;
      p.userData.v.y *= p.userData.kind === "rockChunk" ? -0.18 : 0.1;
    }

    if (p.material?.transparent && typeof p.userData.maxLife === "number" && p.userData.maxLife > 0) {
      p.material.opacity = Math.max(0, p.userData.life / p.userData.maxLife);
    }

    // 수명 끝나면 제거
    if (p.userData.life <= 0) {
      if (p.geometry) p.geometry.dispose();
      if (p.material) p.material.dispose();
      p.removeFromParent();
      particles.splice(i, 1);
    }
  }
}


// ===== Inventory (slot-based) =====
// 아이템 정의(나중에 계속 늘릴 예정)
const ITEM_DEFS = {
  pickaxe: {
    name: "곡괭이",
    icon: "⛏️",
    stackMax: 1,
    category: "equip",
    equipSlot: "tool",
    miningPower: 1,
    makeInventoryModel: () => buildPickaxeModel(),
  },
  safetyHelmet: {
    name: "안전모",
    icon: "🪖",
    stackMax: 1,
    category: "equip",
    equipSlot: "head",
    makeInventoryModel: () => buildSafetyHelmetModel(),
  },
  stoneDust: { name: "돌가루", icon: "🪨", stackMax: 999, category: "misc" },
    };

const ROCK_SIZE_DEFS = [
  { id: "small", label: "작은 돌", scale: 0.8, maxHp: 1 },
  { id: "medium", label: "중간 돌", scale: 1.05, maxHp: 2 },
  { id: "large", label: "큰 돌", scale: 1.3, maxHp: 3 },
];

function getItemTooltipText(itemId, count = null) {
  const def = ITEM_DEFS[itemId];
  if (!def) return itemId;

  const lines = [`이름: ${def.name}`];
  if (typeof def.miningPower === "number") {
    lines.push(`채굴력: ${def.miningPower}`);
  }
  if (count && count > 1) {
    lines.push(`수량: ${count}`);
  }
  return lines.join("\n");
}

function getEquippedMiningPower() {
  const toolId = inventory.equipped.tool;
  const def = toolId ? ITEM_DEFS[toolId] : null;
  return def?.miningPower ?? 0;
}

    // 인벤토리 데이터: 슬롯 + 장착 상태
    const inventory = {
  slots: Array.from({ length: 30 }, () => null), // 30칸(원하면 늘림)
  equipped: {
    head: null,
    body: null,
    shoes: null,
    tool: null,
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

    const equippedPickaxe = buildPickaxeModel();
    equippedPickaxe.name = "equippedPickaxe";
    equippedPickaxe.scale.setScalar(0.8);
    // 캐릭터 기준 오른손(rightArm) 기준 위치
    equippedPickaxe.position.set(0.01, -0.44, 0.07);
    // +Y(헤드 방향)를 +Z(진행 방향 앞)로 보내기 위해 +90도 회전
    equippedPickaxe.rotation.set(Math.PI * 0.5, Math.PI * 0.03, -Math.PI * 0.08);
    equippedPickaxe.visible = false;
    leftArm.add(equippedPickaxe);

    const equippedSafetyHelmet = buildSafetyHelmetModel();
    equippedSafetyHelmet.name = "equippedSafetyHelmet";
    equippedSafetyHelmet.scale.setScalar(0.72);
    equippedSafetyHelmet.visible = false;
    head.add(equippedSafetyHelmet);
    alignWearableOnHead(head, equippedSafetyHelmet, {
  verticalInset: 0.36,
  forwardBias: 0.06,
    });

    function updateEquippedVisual() {
  equippedPickaxe.visible = hasEquippedTool("pickaxe");
  equippedSafetyHelmet.visible = getEquippedItemForSlot("head") === "safetyHelmet";
    }

    function getEquippedItemForSlot(slotId) {
  return inventory.equipped[slotId] ?? null;
    }

    function setEquippedItem(slotId, itemId) {
  inventory.equipped[slotId] = itemId;
    }

    function toggleEquipItem(itemId) {
  const def = ITEM_DEFS[itemId];
  if (!def || def.category !== "equip" || !def.equipSlot) return;

  const slotId = def.equipSlot;
  const alreadyEquipped = getEquippedItemForSlot(slotId) === itemId;
  setEquippedItem(slotId, alreadyEquipped ? null : itemId);

  const itemName = def.name;
  showUI(`${itemName} ${alreadyEquipped ? "해제" : "장착"}`);
  lastMessageUntil = performance.now() + 800;

  updateInventoryUI();
    }

    function unequipSlot(slotId) {
  const itemId = getEquippedItemForSlot(slotId);
  if (!itemId) return;
  toggleEquipItem(itemId);
    }

    const equipPreviewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    equipPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    equipPreviewRenderer.domElement.style.width = "100%";
    equipPreviewRenderer.domElement.style.height = "100%";
    equipPreviewRenderer.domElement.style.display = "block";
    previewCanvasWrap.appendChild(equipPreviewRenderer.domElement);

    const equipPreviewScene = new THREE.Scene();
    const equipPreviewCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    equipPreviewCamera.position.set(0, 1.55, 5.3);

    const equipPreviewAmbient = new THREE.AmbientLight(0xffffff, 1.4);
    equipPreviewScene.add(equipPreviewAmbient);

    const equipPreviewDir = new THREE.DirectionalLight(0xffffff, 0.9);
    equipPreviewDir.position.set(2, 4, 5);
    equipPreviewScene.add(equipPreviewDir);

    const equipPreviewFill = new THREE.DirectionalLight(0xbfd7ff, 0.35);
    equipPreviewFill.position.set(-3, 2, -2);
    equipPreviewScene.add(equipPreviewFill);

    const previewPlayer = player.clone(true);
    previewPlayer.position.set(0, -0.12, 0);
    previewPlayer.rotation.y = Math.PI * 0.08;
    equipPreviewScene.add(previewPlayer);

    const previewParts = {
  torso: previewPlayer.getObjectByName("torso"),
  head: previewPlayer.getObjectByName("head"),
  leftArmPivot: previewPlayer.getObjectByName("leftArmPivot"),
  rightArmPivot: previewPlayer.getObjectByName("rightArmPivot"),
  leftLegPivot: previewPlayer.getObjectByName("leftLegPivot"),
  rightLegPivot: previewPlayer.getObjectByName("rightLegPivot"),
  equippedPickaxe: previewPlayer.getObjectByName("equippedPickaxe"),
  equippedSafetyHelmet: previewPlayer.getObjectByName("equippedSafetyHelmet"),
    };

    function resizeEquipmentPreview() {
  const width = Math.max(1, previewCanvasWrap.clientWidth);
  const height = Math.max(1, previewCanvasWrap.clientHeight);
  equipPreviewRenderer.setSize(width, height, false);
  equipPreviewCamera.aspect = width / height;
  equipPreviewCamera.updateProjectionMatrix();
    }

    function renderEquipmentPreview() {
  previewPlayer.rotation.y = player.rotation.y;
  previewParts.torso.rotation.x = torso.rotation.x;
  previewParts.leftArmPivot.rotation.x = leftArmPivot.rotation.x;
  previewParts.rightArmPivot.rotation.x = rightArmPivot.rotation.x;
  previewParts.leftLegPivot.rotation.x = leftLegPivot.rotation.x;
  previewParts.rightLegPivot.rotation.x = rightLegPivot.rotation.x;
  if (previewParts.equippedPickaxe) {
    previewParts.equippedPickaxe.visible = equippedPickaxe.visible;
  }
  if (previewParts.equippedSafetyHelmet) {
    previewParts.equippedSafetyHelmet.visible = equippedSafetyHelmet.visible;
  }
  equipPreviewRenderer.render(equipPreviewScene, equipPreviewCamera);
    }

    function renderEquipmentWindow() {
  const slotOrder = ["head", "body", "shoes", "tool"];
  for (const slotId of slotOrder) {
    const entry = equipmentSlotEls[slotId];
    const itemId = inventory.equipped[slotId];
    const def = itemId ? ITEM_DEFS[itemId] : null;
    const hasItem = Boolean(def);

    entry.slot.style.background = "rgba(255,255,255,0.95)";
    entry.slot.style.borderColor = hasItem ? "rgba(255,140,0,0.95)" : "rgba(0,0,0,0.2)";
    entry.slot.style.boxShadow = hasItem
      ? "0 0 0 3px rgba(255,140,0,0.35), inset 0 1px 0 rgba(255,255,255,0.8)"
      : "inset 0 1px 0 rgba(255,255,255,0.8)";
    entry.slot.style.cursor = hasItem ? "pointer" : "default";
    entry.slot.title = hasItem ? "더블클릭: 장착 해제" : `${entry.label} 슬롯`;
    entry.slot.ondblclick = hasItem ? () => unequipSlot(slotId) : null;

    if (hasItem) {
      entry.content.innerHTML = "";
      entry.content.style.opacity = "1";
      const icon = createItemVisualElement(itemId, { size: 34 });

      const name = document.createElement("div");
      name.textContent = def.name;
      name.style.fontSize = "11px";
      name.style.fontWeight = "700";
      name.style.marginTop = "6px";

      const wrap = document.createElement("div");
      wrap.style.display = "flex";
      wrap.style.flexDirection = "column";
      wrap.style.alignItems = "center";
      wrap.appendChild(icon);
      wrap.appendChild(name);
      entry.content.appendChild(wrap);
    } else {
      entry.content.textContent = "비어 있음";
      entry.content.style.fontSize = "12px";
      entry.content.style.fontWeight = "700";
      entry.content.style.opacity = "0.72";
    }
  }

  resizeEquipmentPreview();
  renderEquipmentPreview();
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
  renderEquipmentWindow();

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

const rockHpWrap = document.createElement("div");
rockHpWrap.id = "rockHpBar";
rockHpWrap.style.position = "fixed";
rockHpWrap.style.left = "0";
rockHpWrap.style.top = "0";
rockHpWrap.style.width = "84px";
rockHpWrap.style.padding = "6px 7px 7px";
rockHpWrap.style.background = "rgba(20,20,20,0.64)";
rockHpWrap.style.border = "1px solid rgba(255,255,255,0.22)";
rockHpWrap.style.borderRadius = "10px";
rockHpWrap.style.backdropFilter = "blur(4px)";
rockHpWrap.style.pointerEvents = "none";
rockHpWrap.style.display = "none";
rockHpWrap.style.transform = "translate(-50%, -100%)";
rockHpWrap.style.zIndex = "999999";

const rockHpLabel = document.createElement("div");
rockHpLabel.textContent = "채굴 대상";
rockHpLabel.style.color = "white";
rockHpLabel.style.fontFamily = "system-ui, -apple-system, sans-serif";
rockHpLabel.style.fontSize = "11px";
rockHpLabel.style.fontWeight = "700";
rockHpLabel.style.marginBottom = "5px";
rockHpLabel.style.textAlign = "center";

const rockHpTrack = document.createElement("div");
rockHpTrack.style.width = "100%";
rockHpTrack.style.height = "8px";
rockHpTrack.style.background = "rgba(255,255,255,0.14)";
rockHpTrack.style.borderRadius = "999px";
rockHpTrack.style.overflow = "hidden";
rockHpTrack.style.boxShadow = "inset 0 1px 1px rgba(0,0,0,0.25)";

const rockHpFill = document.createElement("div");
rockHpFill.style.width = "100%";
rockHpFill.style.height = "6px";
rockHpFill.style.margin = "1px";
rockHpFill.style.background = "linear-gradient(90deg, #ff8a4b, #ffd166)";
rockHpFill.style.borderRadius = "999px";
rockHpFill.style.transition = "width 120ms ease";

rockHpTrack.appendChild(rockHpFill);
rockHpWrap.appendChild(rockHpLabel);
rockHpWrap.appendChild(rockHpTrack);
uiLayer.appendChild(rockHpWrap);

function hideRockHpBar() {
  rockHpWrap.style.display = "none";
}

function updateRockHpBar(rock) {
  if (!rock || !rock.parent) {
    hideRockHpBar();
    return;
  }

  const hp = Math.max(0, rock.userData.hp ?? 0);
  const maxHp = Math.max(1, rock.userData.maxHp ?? 1);
  const ratio = hp / maxHp;
  const screenPos = rock.position.clone();
  screenPos.y += 0.7 + (rock.userData.spawnScale ?? 1) * 0.55;
  screenPos.project(camera);

  const isVisible =
    screenPos.z > -1 &&
    screenPos.z < 1 &&
    screenPos.x >= -1.15 &&
    screenPos.x <= 1.15 &&
    screenPos.y >= -1.15 &&
    screenPos.y <= 1.15;

  if (!isVisible) {
    hideRockHpBar();
    return;
  }

  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
  rockHpWrap.style.display = "block";
  rockHpWrap.style.left = `${x}px`;
  rockHpWrap.style.top = `${y}px`;
  rockHpFill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  rockHpLabel.textContent = `돌 체력 ${hp}/${maxHp}`;
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

  return { group: g, top };
}

const PROP_GRAVITY = 18;
const PROP_SLEEP_VELOCITY = 0.08;
const PROP_SURFACE_CLEARANCE = 0.01;
const PROP_GROUND_RAY = new THREE.Raycaster();
const dynamicProps = [];
const supportSurfaces = [];

function registerSupportSurface(mesh) {
  supportSurfaces.push(mesh);
  return mesh;
}

function enableDynamicProp(obj, options = {}) {
  const body = {
    obj,
    velocityY: options.velocityY ?? 0,
    sleeping: options.sleeping ?? false,
    clearance: options.clearance ?? PROP_SURFACE_CLEARANCE,
  };
  dynamicProps.push(body);
  obj.userData.dynamicPropBody = body;
  return body;
}

function unregisterDynamicProp(obj) {
  const body = obj?.userData?.dynamicPropBody;
  if (!body) return;

  const idx = dynamicProps.indexOf(body);
  if (idx !== -1) dynamicProps.splice(idx, 1);
  delete obj.userData.dynamicPropBody;
}

function getGroundYAt(x, z) {
  PROP_GROUND_RAY.set(new THREE.Vector3(x, 40, z), new THREE.Vector3(0, -1, 0));
  PROP_GROUND_RAY.far = 80;
  const hits = PROP_GROUND_RAY.intersectObject(ground, false);
  return hits.length > 0 ? hits[0].point.y : null;
}

function getHighestSupportY(box, excludeObj = null) {
  let bestY = null;
  const centerX = (box.min.x + box.max.x) * 0.5;
  const centerZ = (box.min.z + box.max.z) * 0.5;
  const groundY = getGroundYAt(centerX, centerZ);
  if (groundY !== null) bestY = groundY;

  for (const mesh of supportSurfaces) {
    if (!mesh || mesh === excludeObj || !mesh.parent) continue;
    const supportBox = new THREE.Box3().setFromObject(mesh);
    const overlapsXZ =
      box.max.x > supportBox.min.x &&
      box.min.x < supportBox.max.x &&
      box.max.z > supportBox.min.z &&
      box.min.z < supportBox.max.z;

    if (!overlapsXZ) continue;
    if (supportBox.max.y > box.max.y) continue;
    if (bestY === null || supportBox.max.y > bestY) bestY = supportBox.max.y;
  }

  for (const body of dynamicProps) {
    const other = body.obj;
    if (!other || other === excludeObj || !other.parent || !body.sleeping) continue;
    const supportBox = new THREE.Box3().setFromObject(other);
    const overlapsXZ =
      box.max.x > supportBox.min.x &&
      box.min.x < supportBox.max.x &&
      box.max.z > supportBox.min.z &&
      box.min.z < supportBox.max.z;

    if (!overlapsXZ) continue;
    if (supportBox.max.y > box.max.y) continue;
    if (bestY === null || supportBox.max.y > bestY) bestY = supportBox.max.y;
  }

  return bestY;
}

function updateDynamicProps(dt) {
  for (const body of dynamicProps) {
    const obj = body.obj;
    if (!obj || !obj.parent || body.sleeping) continue;

    obj.updateWorldMatrix(true, true);
    const prevBox = new THREE.Box3().setFromObject(obj);
    const prevMinY = prevBox.min.y;

    body.velocityY -= PROP_GRAVITY * dt;
    obj.position.y += body.velocityY * dt;
    obj.updateWorldMatrix(true, true);

    const nextBox = new THREE.Box3().setFromObject(obj);
    const supportY = getHighestSupportY(nextBox, obj);
    if (supportY === null) continue;

    const crossedSupport =
      body.velocityY <= 0 &&
      prevMinY >= supportY - body.clearance &&
      nextBox.min.y <= supportY + body.clearance;

    if (!crossedSupport) continue;

    obj.position.y += supportY + body.clearance - nextBox.min.y;
    body.velocityY = 0;
    if (Math.abs(body.velocityY) <= PROP_SLEEP_VELOCITY) {
      body.sleeping = true;
    }
    obj.updateWorldMatrix(true, true);
  }
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
const pickupItems = [];
let activePickupItem = null;

function registerPickupItem(obj, itemId, text = null) {
  const def = ITEM_DEFS[itemId];
  const entry = {
    obj,
    itemId,
    text: text ?? `E : ${def?.name ?? itemId} 줍기`,
  };
  pickupItems.push(entry);
  obj.userData.pickupItemId = itemId;
  return entry;
}

function unregisterPickupItem(obj) {
  const idx = pickupItems.findIndex((entry) => entry.obj === obj);
  if (idx !== -1) pickupItems.splice(idx, 1);
  delete obj.userData.pickupItemId;
}

function findNearestPickupItem(radius = 2.0) {
  let best = null;
  let bestD2 = radius * radius;
  for (const entry of pickupItems) {
    const obj = entry.obj;
    if (!obj || !obj.parent) continue;
    const dx = obj.position.x - player.position.x;
    const dz = obj.position.z - player.position.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestD2) {
      best = entry;
      bestD2 = d2;
    }
  }
  return best;
}


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
function makeRock(x, z, rockSizeDef = ROCK_SIZE_DEFS[1], fadeIn = false) {
  const scale = rockSizeDef.scale;
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x6f6f72,
    roughness: 1.0,
    transparent: fadeIn,
    opacity: fadeIn ? 0 : 1,
  });
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.9 * scale, 0),
    rockMat
  );
  rock.position.set(x, 0.9 * scale, z);

  // 약간 울퉁불퉁한 느낌
  rock.rotation.set(randRange(0, Math.PI), randRange(0, Math.PI), randRange(0, Math.PI));

  scene.add(rock);
  // ✅ 충돌 등록(조금 더 타이트하게)
  rock.userData.colliderShrink = 0.85; // 1보다 작을수록 더 타이트(0.8~0.9 추천)
  mineRocks.push(rock);

  const colliderIndex = addCollider(rock, 0.85);
  rock.userData.isMineRock = true;
  rock.userData.colliderIndex = colliderIndex;
  rock.userData.rockSize = rockSizeDef.id;
  rock.userData.spawnScale = scale;
  rock.userData.hp = rockSizeDef.maxHp;
  rock.userData.maxHp = rockSizeDef.maxHp;
  rock.userData.spawn = { x, z, rockSize: rockSizeDef.id };
  if (fadeIn) {
    rock.userData.fadeInElapsed = 0;
    rock.userData.fadeInDuration = 1.0;
  }

  return rock;
}

function scheduleRockRespawn(spawn) {
  setTimeout(() => {
    const rockSizeDef =
      ROCK_SIZE_DEFS.find((entry) => entry.id === spawn?.rockSize) ??
      ROCK_SIZE_DEFS[Math.floor(Math.random() * ROCK_SIZE_DEFS.length)];
    const next = findRockSpawnPosition(rockSizeDef.scale, 120);
    if (!next) return;
    makeRock(next.x, next.z, rockSizeDef, true);
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
function buildPickaxeModel() {
  const g = new THREE.Group();

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 })
  );
  handle.position.y = 0.6;

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.15, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.8 })
  );
  head.position.y = 1.2;

  g.add(handle, head);
  return g;
}

function buildSafetyHelmetModel() {
  const g = new THREE.Group();

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xf7f7f9,
    roughness: 0.5,
    metalness: 0.02,
  });
  const ridgeMat = new THREE.MeshStandardMaterial({
    color: 0xe8e8ee,
    roughness: 0.42,
    metalness: 0.03,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd9d9de, roughness: 0.72 });

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.37, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.64),
    shellMat
  );
  shell.scale.set(1.03, 0.82, 1.14);
  shell.position.y = 0.18;

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.37, 0.43, 0.045, 28),
    shellMat
  );
  brim.scale.set(1.03, 1, 1.26);
  brim.position.y = -0.02;

  const frontLip = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.035, 0.42, 4, 10),
    ridgeMat
  );
  frontLip.rotation.z = Math.PI / 2;
  frontLip.position.set(0, 0.02, 0.38);

  const shellBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.03, 8, 28),
    trimMat
  );
  shellBand.rotation.x = Math.PI / 2;
  shellBand.scale.set(1.02, 1, 1.12);
  shellBand.position.y = 0.02;

  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.34, 0.14),
    ridgeMat
  );
  ridge.position.set(0, 0.36, -0.01);
  ridge.rotation.x = Math.PI * 0.08;

  const rearRidge = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.16, 0.12),
    ridgeMat
  );
  rearRidge.position.set(0, 0.44, -0.08);
  rearRidge.rotation.x = Math.PI * -0.08;

  const brimEdge = new THREE.Mesh(
    new THREE.TorusGeometry(0.33, 0.018, 8, 28),
    trimMat
  );
  brimEdge.rotation.x = Math.PI / 2;
  brimEdge.scale.set(1.04, 1, 1.22);
  brimEdge.position.y = -0.005;

  const frontBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.045, 0.05),
    trimMat
  );
  frontBadge.position.set(0, -0.01, 0.39);

  g.userData.headSeatOffsetY = -0.01;
  g.userData.headSeatForwardZ = 0.04;

  g.add(shell, brim, frontLip, shellBand, ridge, rearRidge, brimEdge, frontBadge);
  return g;
}

function alignWearableOnHead(headMesh, wearable, options = {}) {
  if (!headMesh?.geometry || !wearable) return;

  if (!headMesh.geometry.boundingBox) {
    headMesh.geometry.computeBoundingBox();
  }

  const headBox = headMesh.geometry.boundingBox;
  const headHeight = headBox.max.y - headBox.min.y;
  const headDepth = headBox.max.z - headBox.min.z;
  const seatY = wearable.userData.headSeatOffsetY ?? 0;
  const seatForwardZ = wearable.userData.headSeatForwardZ ?? 0;
  const verticalInset = options.verticalInset ?? 0.26;
  const forwardBias = options.forwardBias ?? 0.12;

  const targetSeatY = headBox.max.y - headHeight * verticalInset;
  const targetZ = (headBox.min.z + headBox.max.z) * 0.5 + headDepth * forwardBias;

  wearable.position.x = 0;
  wearable.position.y = targetSeatY - seatY;
  wearable.position.z = targetZ - seatForwardZ;
}

function makePickaxe(x, z, y = 0, rotation = null) {
  const g = buildPickaxeModel();
  g.position.set(x, y, z);

  if (rotation) {
    g.rotation.set(rotation.x, rotation.y, rotation.z);
  } else {
    // 기본값은 바닥에 떨어진 듯한 기울기
    g.rotation.z = Math.PI * 0.15;
  }

  // 아이템 정보
  g.userData.isPickaxe = true;

  scene.add(g);
  return g;
}

function makeSafetyHelmet(x, z, y = 0, rotation = null) {
  const g = buildSafetyHelmetModel();
  g.position.set(x, y, z);

  if (rotation) {
    g.rotation.set(rotation.x, rotation.y, rotation.z);
  }

  g.userData.isSafetyHelmet = true;
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
    const rockSizeDef = ROCK_SIZE_DEFS[Math.floor(Math.random() * ROCK_SIZE_DEFS.length)];
    const spawnPos = findRockSpawnPosition(rockSizeDef.scale, 120);
    if (!spawnPos) continue;
    makeRock(spawnPos.x, spawnPos.z, rockSizeDef);
  }
}

spawnTreesAndRocks();
buildStartZoneWall();
const startStall = buildStartStall();
registerSupportSurface(startStall.top);


// ===== Place pickaxe on top of the starting stall =====
const pickaxe = makePickaxe(
  START_X + 0.8,
  START_Z - 2.8,
  START_FLAT_Y + 2.4,
  {
    x: Math.PI / 2,
    y: Math.PI * 0.04,
    z: 0,
  }
);
enableDynamicProp(pickaxe);
registerPickupItem(pickaxe, "pickaxe", "E : 곡괭이 줍기");

const safetyHelmet = makeSafetyHelmet(
  START_X - 1.15,
  START_Z - 2.62,
  START_FLAT_Y + 2.45,
  {
    x: 0,
    y: Math.PI * -0.12,
    z: Math.PI * 0.02,
  }
);
enableDynamicProp(safetyHelmet);
registerPickupItem(safetyHelmet, "safetyHelmet", "E : 안전모 줍기");



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

  // ===== E : 월드 아이템 줍기 =====
  if (k === "e") {
  const pickup = findNearestPickupItem(2.0);
  if (pickup) {
    const added = addItem(pickup.itemId, 1);
    if (added) {
      updateInventoryUI();
      const def = ITEM_DEFS[pickup.itemId];
      const msg =
        pickup.itemId === "pickaxe" ? HUD_MSG.PICKAXE_GET :
        pickup.itemId === "safetyHelmet" ? HUD_MSG.HELMET_GET :
        `${def?.name ?? pickup.itemId} 획득!`;
      showUI(msg);
      lastMessageUntil = performance.now() + 900;

      unregisterDynamicProp(pickup.obj);
      unregisterPickupItem(pickup.obj);
      pickup.obj.removeFromParent();
    }
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
const MINING_SWING_DURATION = 0.28;
let miningSwingTime = 0;

function triggerMiningSwing(target = null) {
  miningSwingTime = MINING_SWING_DURATION;
  if (!target) return;

  const dx = target.position.x - player.position.x;
  const dz = target.position.z - player.position.z;
  if (Math.abs(dx) > 1e-4 || Math.abs(dz) > 1e-4) {
    player.rotation.y = Math.atan2(dx, dz);
  }
}

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

  if (miningSwingTime > 0) {
    miningSwingTime = Math.max(0, miningSwingTime - dt);
    const phase = 1 - (miningSwingTime / MINING_SWING_DURATION);

    let mainSwing = 0;
    if (phase < 0.35) {
      mainSwing = THREE.MathUtils.lerp(-1.05, -0.1, phase / 0.35);
    } else {
      mainSwing = THREE.MathUtils.lerp(-0.1, 1.3, (phase - 0.35) / 0.65);
    }

    const supportSwing = THREE.MathUtils.lerp(0.15, 0.65, Math.sin(Math.min(phase, 1) * Math.PI));
    leftArmPivot.rotation.x = mainSwing;
    rightArmPivot.rotation.x = -supportSwing * 0.65;
    torso.rotation.x = THREE.MathUtils.lerp(-0.08, 0.22, Math.sin(phase * Math.PI));
    leftLegPivot.rotation.x *= 0.55;
    rightLegPivot.rotation.x *= 0.55;
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
  triggerMiningSwing(activeMineRock);
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

  const minedRock = activeMineRock;
  const miningPower = getEquippedMiningPower();
  if (miningPower <= 0) return;

  minedRock.userData.hp = Math.max(0, (minedRock.userData.hp ?? 1) - miningPower);
  const remainingHp = minedRock.userData.hp ?? 0;

  spawnDustBurst(minedRock.position, remainingHp > 0 ? 8 : 10);

  if (remainingHp > 0) {
    updateRockHpBar(minedRock);
    showUI("채굴 중...");
    lastMessageUntil = performance.now() + 700;
    return;
  }

  const spawn = minedRock.userData.spawn
    ? { ...minedRock.userData.spawn }
    : { x: minedRock.position.x, z: minedRock.position.z, rockSize: "small" };

  spawnRockBreakBurst(minedRock);
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
  hideRockHpBar();
  hidePickupHint();
});


function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);

  updateMovement(dt);
  updateDynamicProps(dt);
  updateParticles(dt);
  updateRockFadeIns(dt);
  if (invOpen) renderEquipmentPreview();
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

// 1) 월드 장비 줍기 힌트
activePickupItem = findNearestPickupItem(2.0);
if (activePickupItem) {
  hintText = activePickupItem.text;
}

// 2) 돌 채집 힌트 (아이템 줍기 힌트가 없을 때만)
if (!hintText) {
  activeMineRock = findNearestMineRock(2.2);
  if (activeMineRock) {
    // 곡괭이 필요/장착 필요/채집 가능 문구 분기
    if (!hasItem("pickaxe")) hintText = "⛏️ 필요";
    else if (!hasEquippedTool("pickaxe")) hintText = "⛏️ 장착 필요";
    else hintText = "Space : 채굴";
  }
}

// 3) 표지판 조사 힌트 (위 힌트가 없을 때만)
if (!hintText && activeInteractable) {
  hintText = "E : 조사하기";
}

// 4) 최종 출력
if (hintText) showHint(hintText);
else hideHint();

if (
  activeMineRock &&
  hasItem("pickaxe") &&
  hasEquippedTool("pickaxe")
) {
  updateRockHpBar(activeMineRock);
} else {
  hideRockHpBar();
}

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizeEquipmentPreview();
});
