import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const LAST_PATCHED_AT = "2026-05-11 17:41:44 KST";

const scene = new THREE.Scene();
// ===== Atmosphere: Sky / Fog =====
scene.background = new THREE.Color(0xd6d8db); // 밝은 회색 하늘
const WORLD_FOG_COLOR = 0xd6d8db;
const CAVE_FOG_COLOR = 0x120e0b;
const WORLD_FOG_NEAR = 15;
const WORLD_FOG_FAR = 60;
const CAVE_DARKENING_ENABLED = false;
const CAVE_FOG_EFFECT_ENABLED = false;
scene.fog = new THREE.Fog(WORLD_FOG_COLOR, WORLD_FOG_NEAR, WORLD_FOG_FAR);

const AIR_GAUGE_MAX = 100;
const AIR_CANISTER_RESTORE_AMOUNT = 34;
const AIR_RECOVERY_PER_SECOND = 1.1;
const CAVE_POLLUTION_PARTICLE_COUNT = 360;
const CAVE_POLLUTION_PARTICLE_SWAY = 0.12;
const CAVE_POLLUTION_OVERLAY_MAX_OPACITY = 0.96;
const LOW_AIR_EDGE_BLUR_MAX_PX = 26;
const AIR_HUD_POSITION_KEY = "excit_air_hud_position_v1";
const QUICK_USE_ALLOWED_KEYS = ["1", "2", "3", "4", "5"];
const INVENTORY_STACK_LIMIT = 200;
const SHIFT_CAMERA_ROTATE_SENSITIVITY = 0.0062;
const FRONTIER_PARCEL_BORDER_COLOR = 0xf3b24e;
const FRONTIER_BUILDING_HEIGHT = 4.4;
const FRONTIER_BUILDING_SIGN_MAX_CHARS = 8;
const MAP_POLLUTION_CONFIG = {
  "폐광맵": {
    displayName: "폐광",
    drainPerSecondAtZeroPurify: 2.25,
    purifierPowderCost: 1,
    purifierGain: 12,
  },
  "개척지": {
    displayName: "개척지",
    drainPerSecondAtZeroPurify: 2.5,
    purifierPowderCost: 1,
    purifierGain: 12,
  },
};

const REFINERY_RECIPES = {
  purifyPowder: {
    id: "purifyPowder",
    label: "정화 가루",
    inputItemId: "stoneDust",
    inputCount: 3,
    outputItemId: "purifyPowder",
    outputCount: 1,
  },
  woodPlank: {
    id: "woodPlank",
    label: "목재",
    inputItemId: "woodChip",
    inputCount: 2,
    outputItemId: "woodPlank",
    outputCount: 1,
  },
};

const FRONTIER_BUILD_STAGE_CONFIG = [
  { from: 0, to: 25, wood: 10, stone: 6, label: "기둥 설치" },
  { from: 25, to: 50, wood: 14, stone: 9, label: "하단 벽면 시공" },
  { from: 50, to: 75, wood: 18, stone: 12, label: "상단 골조 보강" },
  { from: 75, to: 100, wood: 24, stone: 16, label: "천장 완성" },
];

// ===== Lighting =====
// 전체 밝기 (부드럽게)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// 방향광 (태양 역할, 그림자 약하게)
const sunLight = new THREE.DirectionalLight(0xffffff, 0.4);
sunLight.position.set(30, 50, 30);
sunLight.castShadow = false; // 강한 그림자 제거
scene.add(sunLight);

const torchLight = new THREE.PointLight(0xffc46b, 0, 14, 2);
torchLight.visible = false;
scene.add(torchLight);

scene.background = new THREE.Color(0xaad7ff);

const caveDarkenableMaterials = [];

function registerCaveDarkMaterial(material, minScalar = 0.28) {
  if (!material || !material.color) return material;
  caveDarkenableMaterials.push({
    material,
    baseColor: material.color.clone(),
    minScalar,
  });
  return material;
}

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

let mansionSleepOverlay = null;
let mansionSleepDialog = null;
let mansionSleepOpen = false;
let mansionSleepPoseActive = false;
let mansionSleepWakePoint = { x: 0, z: 0, rotationY: Math.PI };
let personalStorageOverlay = null;
let personalStorageWin = null;
let personalStorageOpen = false;
let frontierShopRegisterOverlay = null;
let frontierShopRegisterWin = null;
let frontierShopRegisterOpen = false;
let frontierShopRegisterParcelLabel = "";
let frontierShopRegisterSelectedItemId = "";
let frontierShopRegisterSelectedAvailable = 0;

const patchInfoWrap = document.createElement("div");
patchInfoWrap.id = "patchInfoWrap";
patchInfoWrap.style.position = "fixed";
patchInfoWrap.style.right = "12px";
patchInfoWrap.style.top = "12px";
patchInfoWrap.style.padding = "10px 12px";
patchInfoWrap.style.background = "rgba(20,20,20,0.52)";
patchInfoWrap.style.border = "1px solid rgba(255,255,255,0.18)";
patchInfoWrap.style.borderRadius = "12px";
patchInfoWrap.style.backdropFilter = "blur(4px)";
patchInfoWrap.style.color = "white";
patchInfoWrap.style.fontFamily = "system-ui, -apple-system, sans-serif";
patchInfoWrap.style.fontSize = "12px";
patchInfoWrap.style.lineHeight = "1.45";
patchInfoWrap.style.whiteSpace = "pre-line";
patchInfoWrap.style.userSelect = "none";
patchInfoWrap.style.pointerEvents = "none";
patchInfoWrap.style.zIndex = "999999";
patchInfoWrap.style.display = "none";
patchInfoWrap.textContent = `마지막 패치\n${LAST_PATCHED_AT}`;
uiLayer.appendChild(patchInfoWrap);

const WALLET_SESSION_KEY = "voxel-town.wallet-auth.v1";
const DEV_ACTIVE_PROFILE_KEY = "voxel-town.dev-active-profile.v1";
const DEV_PROFILE_SAVE_PREFIX = "voxel-town.dev-profile-save.v1.";
const DEV_SHARED_WORLD_KEY = "voxel-town.dev-shared-world.v1";
const AUTH_API_BASE_URL = "http://localhost:8787";
const NFT_EXHIBIT_TARGET = {
  chainId: "0x1",
  contractAddress: "0x3aAA87FBe562AC659F9e657a8EFe00b411a56273",
  tokenId: "1",
  title: "지갑 NFT 전시",
};
const NFT_BOARD_CANVAS_WIDTH = 1152;
const NFT_BOARD_CANVAS_HEIGHT = 1000;
const walletAuth = {
  authenticated: false,
  address: "",
  signature: "",
  nonce: "",
  issuedAt: "",
  chainId: "",
  token: "",
  sessionType: "",
  providerBound: false,
};
const walletProfile = {
  nickname: "",
};
const PLAYER_SAVE_VERSION = 1;
const PLAYER_SAVE_INTERVAL_MS = 4000;
const DEV_PROFILE_IDS = ["dev_user_1", "dev_user_2"];
let playerSaveSyncInFlight = null;
let lastPlayerSaveSnapshot = "";
let lastPlayerSaveAttemptAt = 0;
let playerSaveSyncPaused = false;
let playerSaveStatusTimer = null;
let lastKnownPlayerSaveUpdatedAt = "";
let playerSaveBaselineState = "unknown";
let activeDevProfileId = DEV_PROFILE_IDS[0];
let nftExhibitBoard = null;
let nftExhibitScreenMaterial = null;
let nftExhibitRefreshToken = 0;
let nftExhibitRefreshTimer = null;
let nftExhibitSelectionOpen = false;
let nftExhibitSelectionLoading = false;
let nftExhibitSelectionStatus = "";
let nftExhibitSelectionTone = "neutral";
let nftExhibitOwnedTokens = [];
let nftExhibitSelectedItem = null;
let nftExhibitSelectionOwnershipMismatch = false;
let nftExhibitSelectionOwnershipMessage = "";
let nftExhibitOwnedTokensCache = {
  walletAddress: "",
  chainId: "",
  contractAddress: "",
  items: [],
  fetchedAt: 0,
};
let quickUseAssignState = null;
let quickUseAssignmentConsumedUntil = 0;

const walletHud = document.createElement("div");
walletHud.id = "walletHud";
walletHud.style.position = "fixed";
walletHud.style.right = "12px";
walletHud.style.top = "72px";
walletHud.style.padding = "10px 12px";
walletHud.style.background = "rgba(20,20,20,0.52)";
walletHud.style.border = "1px solid rgba(255,255,255,0.18)";
walletHud.style.borderRadius = "12px";
walletHud.style.backdropFilter = "blur(4px)";
walletHud.style.color = "white";
walletHud.style.fontFamily = "system-ui, -apple-system, sans-serif";
walletHud.style.fontSize = "12px";
walletHud.style.lineHeight = "1.45";
walletHud.style.userSelect = "none";
walletHud.style.pointerEvents = "auto";
walletHud.style.zIndex = "1000002";
walletHud.style.display = "none";
uiLayer.appendChild(walletHud);

const walletHudTitle = document.createElement("div");
walletHudTitle.textContent = "WALLET";
walletHudTitle.style.fontWeight = "800";
walletHudTitle.style.letterSpacing = "0.06em";
walletHudTitle.style.opacity = "0.82";
walletHudTitle.style.marginBottom = "6px";
walletHud.appendChild(walletHudTitle);

const walletHudAddress = document.createElement("div");
walletHudAddress.style.fontWeight = "700";
walletHud.appendChild(walletHudAddress);

const walletHudChain = document.createElement("div");
walletHudChain.style.marginTop = "4px";
walletHudChain.style.opacity = "0.78";
walletHud.appendChild(walletHudChain);

const walletHudNickname = document.createElement("div");
walletHudNickname.style.marginTop = "6px";
walletHudNickname.style.fontWeight = "700";
walletHudNickname.style.color = "#fff2bf";
walletHud.appendChild(walletHudNickname);

const walletHudLogoutBtn = document.createElement("button");
walletHudLogoutBtn.type = "button";
walletHudLogoutBtn.textContent = "로그아웃";
walletHudLogoutBtn.style.marginTop = "8px";
walletHudLogoutBtn.style.padding = "6px 10px";
walletHudLogoutBtn.style.borderRadius = "999px";
walletHudLogoutBtn.style.border = "1px solid rgba(255,255,255,0.18)";
walletHudLogoutBtn.style.background = "rgba(255,255,255,0.1)";
walletHudLogoutBtn.style.color = "white";
walletHudLogoutBtn.style.cursor = "pointer";
walletHudLogoutBtn.style.fontSize = "12px";
walletHudLogoutBtn.style.fontWeight = "700";
walletHud.appendChild(walletHudLogoutBtn);

let equipProfileAddress = null;
let equipProfileChain = null;
let equipProfileNickname = null;
let equipProfileLogoutBtn = null;
let equipProfileCopyBtn = null;

const airHudWrap = document.createElement("div");
airHudWrap.id = "airHudWrap";
airHudWrap.style.position = "fixed";
airHudWrap.style.left = "16px";
airHudWrap.style.top = "214px";
airHudWrap.style.width = "214px";
airHudWrap.style.padding = "12px 14px";
airHudWrap.style.background = "rgba(20,20,20,0.56)";
airHudWrap.style.border = "1px solid rgba(255,255,255,0.16)";
airHudWrap.style.borderRadius = "14px";
airHudWrap.style.backdropFilter = "blur(4px)";
airHudWrap.style.color = "white";
airHudWrap.style.fontFamily = "system-ui, -apple-system, sans-serif";
airHudWrap.style.fontSize = "12px";
airHudWrap.style.lineHeight = "1.45";
airHudWrap.style.userSelect = "none";
airHudWrap.style.pointerEvents = "auto";
airHudWrap.style.zIndex = "1000001";
airHudWrap.style.display = "none";
uiLayer.appendChild(airHudWrap);

const airHudTitle = document.createElement("div");
airHudTitle.textContent = "AIR SUPPORT";
airHudTitle.style.fontWeight = "800";
airHudTitle.style.letterSpacing = "0.06em";
airHudTitle.style.opacity = "0.84";
airHudTitle.style.marginBottom = "8px";
airHudTitle.style.cursor = "grab";
airHudWrap.appendChild(airHudTitle);

const airHudValue = document.createElement("div");
airHudValue.style.fontWeight = "800";
airHudValue.style.fontSize = "18px";
airHudValue.style.color = "#f4fbff";
airHudWrap.appendChild(airHudValue);

const airHudBarTrack = document.createElement("div");
airHudBarTrack.style.position = "relative";
airHudBarTrack.style.height = "10px";
airHudBarTrack.style.marginTop = "8px";
airHudBarTrack.style.borderRadius = "999px";
airHudBarTrack.style.background = "rgba(255,255,255,0.14)";
airHudBarTrack.style.overflow = "hidden";
airHudWrap.appendChild(airHudBarTrack);

const airHudBarFill = document.createElement("div");
airHudBarFill.style.width = "100%";
airHudBarFill.style.height = "100%";
airHudBarFill.style.background = "linear-gradient(90deg, #5be7ff 0%, #a2fff0 100%)";
airHudBarFill.style.borderRadius = "inherit";
airHudBarTrack.appendChild(airHudBarFill);

const airHudStatus = document.createElement("div");
airHudStatus.style.marginTop = "8px";
airHudStatus.style.opacity = "0.8";
airHudWrap.appendChild(airHudStatus);

const airHudPurify = document.createElement("div");
airHudPurify.style.marginTop = "6px";
airHudPurify.style.fontWeight = "700";
airHudPurify.style.color = "#fff2bf";
airHudWrap.appendChild(airHudPurify);

const playerSaveStatusBadge = document.createElement("div");
playerSaveStatusBadge.id = "playerSaveStatus";
playerSaveStatusBadge.style.position = "fixed";
playerSaveStatusBadge.style.left = "12px";
playerSaveStatusBadge.style.bottom = "12px";
playerSaveStatusBadge.style.padding = "8px 12px";
playerSaveStatusBadge.style.borderRadius = "12px";
playerSaveStatusBadge.style.background = "rgba(20,20,20,0.52)";
playerSaveStatusBadge.style.border = "1px solid rgba(255,255,255,0.18)";
playerSaveStatusBadge.style.backdropFilter = "blur(4px)";
playerSaveStatusBadge.style.color = "white";
playerSaveStatusBadge.style.fontFamily = "system-ui, -apple-system, sans-serif";
playerSaveStatusBadge.style.fontSize = "12px";
playerSaveStatusBadge.style.fontWeight = "700";
playerSaveStatusBadge.style.lineHeight = "1.4";
playerSaveStatusBadge.style.userSelect = "none";
playerSaveStatusBadge.style.pointerEvents = "none";
playerSaveStatusBadge.style.zIndex = "1000002";
playerSaveStatusBadge.style.opacity = "0";
playerSaveStatusBadge.style.transform = "translateY(4px)";
playerSaveStatusBadge.style.transition = "opacity 180ms ease, transform 180ms ease, border-color 180ms ease";
playerSaveStatusBadge.textContent = "";
uiLayer.appendChild(playerSaveStatusBadge);

let airHudDragState = null;

function getAirHudStoredPosition() {
  try {
    const raw = localStorage.getItem(AIR_HUD_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed?.left) || !Number.isFinite(parsed?.top)) return null;
    return {
      left: parsed.left,
      top: parsed.top,
    };
  } catch {
    return null;
  }
}

function clampAirHudPosition(left, top) {
  const width = airHudWrap.offsetWidth || 214;
  const height = airHudWrap.offsetHeight || 120;
  return {
    left: Math.min(Math.max(12, left), Math.max(12, window.innerWidth - width - 12)),
    top: Math.min(Math.max(12, top), Math.max(12, window.innerHeight - height - 12)),
  };
}

function applyAirHudPosition(left, top, { persist = true } = {}) {
  const clamped = clampAirHudPosition(left, top);
  airHudWrap.style.left = `${Math.round(clamped.left)}px`;
  airHudWrap.style.top = `${Math.round(clamped.top)}px`;
  airHudWrap.style.right = "auto";
  airHudWrap.style.bottom = "auto";
  if (!persist) return;
  try {
    localStorage.setItem(AIR_HUD_POSITION_KEY, JSON.stringify(clamped));
  } catch {}
}

function restoreAirHudPosition() {
  const saved = getAirHudStoredPosition();
  if (!saved) return;
  applyAirHudPosition(saved.left, saved.top, { persist: false });
}

function handleAirHudPointerMove(event) {
  if (!airHudDragState) return;
  applyAirHudPosition(
    event.clientX - airHudDragState.offsetX,
    event.clientY - airHudDragState.offsetY
  );
}

function endAirHudDrag() {
  if (!airHudDragState) return;
  airHudDragState = null;
  airHudTitle.style.cursor = "grab";
  window.removeEventListener("pointermove", handleAirHudPointerMove);
  window.removeEventListener("pointerup", endAirHudDrag);
}

airHudTitle.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const rect = airHudWrap.getBoundingClientRect();
  airHudDragState = {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };
  airHudTitle.style.cursor = "grabbing";
  window.addEventListener("pointermove", handleAirHudPointerMove);
  window.addEventListener("pointerup", endAirHudDrag);
  event.preventDefault();
});

window.addEventListener("resize", () => {
  const currentLeft = parseFloat(airHudWrap.style.left) || 16;
  const currentTop = parseFloat(airHudWrap.style.top) || 214;
  applyAirHudPosition(currentLeft, currentTop);
});

restoreAirHudPosition();

const walletLoginOverlay = document.createElement("div");
walletLoginOverlay.id = "walletLoginOverlay";
walletLoginOverlay.style.position = "fixed";
walletLoginOverlay.style.inset = "0";
walletLoginOverlay.style.display = "flex";
walletLoginOverlay.style.alignItems = "center";
walletLoginOverlay.style.justifyContent = "center";
walletLoginOverlay.style.background = "rgba(8,10,14,0.62)";
walletLoginOverlay.style.backdropFilter = "blur(8px)";
walletLoginOverlay.style.pointerEvents = "auto";
walletLoginOverlay.style.zIndex = "1000003";
uiLayer.appendChild(walletLoginOverlay);

const walletLoginCard = document.createElement("div");
walletLoginCard.style.width = "min(460px, calc(100vw - 36px))";
walletLoginCard.style.padding = "24px 24px 20px";
walletLoginCard.style.background = "rgba(245,245,245,0.96)";
walletLoginCard.style.border = "1px solid rgba(0,0,0,0.14)";
walletLoginCard.style.borderRadius = "18px";
walletLoginCard.style.boxShadow = "0 20px 48px rgba(0,0,0,0.28)";
walletLoginCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
walletLoginCard.style.color = "#222";
walletLoginOverlay.appendChild(walletLoginCard);

const walletLoginTitle = document.createElement("div");
walletLoginTitle.textContent = "메타마스크 로그인";
walletLoginTitle.style.fontSize = "26px";
walletLoginTitle.style.fontWeight = "900";
walletLoginTitle.style.letterSpacing = "-0.02em";
walletLoginCard.appendChild(walletLoginTitle);

const walletLoginDesc = document.createElement("div");
walletLoginDesc.textContent = "지갑을 연결하고 서명하면 인증 서버가 nonce 검증을 거쳐 게임 세션을 발급합니다. 메타마스크 없이 먼저 체험하고 싶다면 게스트로 바로 시작할 수도 있습니다.";
walletLoginDesc.style.marginTop = "10px";
walletLoginDesc.style.fontSize = "14px";
walletLoginDesc.style.lineHeight = "1.65";
walletLoginDesc.style.color = "#555";
walletLoginCard.appendChild(walletLoginDesc);

const walletLoginStatus = document.createElement("div");
walletLoginStatus.textContent = "메타마스크 연결을 기다리는 중입니다.";
walletLoginStatus.style.marginTop = "16px";
walletLoginStatus.style.padding = "10px 12px";
walletLoginStatus.style.background = "rgba(0,0,0,0.05)";
walletLoginStatus.style.borderRadius = "12px";
walletLoginStatus.style.fontSize = "13px";
walletLoginStatus.style.lineHeight = "1.6";
walletLoginStatus.style.color = "#444";
walletLoginCard.appendChild(walletLoginStatus);

const walletLoginActions = document.createElement("div");
walletLoginActions.style.display = "flex";
walletLoginActions.style.flexWrap = "wrap";
walletLoginActions.style.gap = "10px";
walletLoginActions.style.marginTop = "18px";
walletLoginCard.appendChild(walletLoginActions);

const walletConnectBtn = document.createElement("button");
walletConnectBtn.type = "button";
walletConnectBtn.textContent = "메타마스크 로그인";
walletConnectBtn.style.padding = "12px 16px";
walletConnectBtn.style.borderRadius = "12px";
walletConnectBtn.style.border = "none";
walletConnectBtn.style.background = "#f6851b";
walletConnectBtn.style.color = "white";
walletConnectBtn.style.fontSize = "14px";
walletConnectBtn.style.fontWeight = "800";
walletConnectBtn.style.cursor = "pointer";
walletConnectBtn.style.pointerEvents = "auto";
walletLoginActions.appendChild(walletConnectBtn);

const walletGuestBtn = document.createElement("button");
walletGuestBtn.type = "button";
walletGuestBtn.textContent = "게스트로 시작";
walletGuestBtn.style.padding = "12px 16px";
walletGuestBtn.style.borderRadius = "12px";
walletGuestBtn.style.border = "1px solid rgba(0,0,0,0.12)";
walletGuestBtn.style.background = "rgba(255,255,255,0.9)";
walletGuestBtn.style.color = "#333";
walletGuestBtn.style.fontSize = "14px";
walletGuestBtn.style.fontWeight = "800";
walletGuestBtn.style.cursor = "pointer";
walletGuestBtn.style.pointerEvents = "auto";
walletLoginActions.appendChild(walletGuestBtn);

const walletDevBypassBtn = document.createElement("button");
walletDevBypassBtn.type = "button";
walletDevBypassBtn.textContent = "개발자 모드로 바로 입장";
walletDevBypassBtn.style.padding = "12px 16px";
walletDevBypassBtn.style.borderRadius = "12px";
walletDevBypassBtn.style.border = "1px solid rgba(0,0,0,0.12)";
walletDevBypassBtn.style.background = "rgba(255,255,255,0.9)";
walletDevBypassBtn.style.color = "#333";
walletDevBypassBtn.style.fontSize = "14px";
walletDevBypassBtn.style.fontWeight = "800";
walletDevBypassBtn.style.cursor = "pointer";
walletDevBypassBtn.style.pointerEvents = "auto";
walletLoginActions.appendChild(walletDevBypassBtn);

const devProfileSwitcher = document.createElement("div");
devProfileSwitcher.style.position = "fixed";
devProfileSwitcher.style.left = "50%";
devProfileSwitcher.style.top = "18px";
devProfileSwitcher.style.transform = "translateX(-50%)";
devProfileSwitcher.style.display = "none";
devProfileSwitcher.style.alignItems = "center";
devProfileSwitcher.style.gap = "8px";
devProfileSwitcher.style.padding = "8px 10px";
devProfileSwitcher.style.borderRadius = "14px";
devProfileSwitcher.style.background = "rgba(26,30,36,0.84)";
devProfileSwitcher.style.border = "1px solid rgba(255,255,255,0.12)";
devProfileSwitcher.style.backdropFilter = "blur(6px)";
devProfileSwitcher.style.boxShadow = "0 10px 28px rgba(0,0,0,0.24)";
devProfileSwitcher.style.zIndex = "1000002";
uiLayer.appendChild(devProfileSwitcher);

const devProfileLabel = document.createElement("div");
devProfileLabel.textContent = "개발자 계정";
devProfileLabel.style.fontFamily = "system-ui, -apple-system, sans-serif";
devProfileLabel.style.fontSize = "12px";
devProfileLabel.style.fontWeight = "800";
devProfileLabel.style.color = "rgba(255,255,255,0.88)";
devProfileSwitcher.appendChild(devProfileLabel);

const devProfileButtons = {};
for (const profileId of DEV_PROFILE_IDS) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = profileId === "dev_user_1" ? "개발자1" : "개발자2";
  btn.style.padding = "8px 12px";
  btn.style.borderRadius = "999px";
  btn.style.border = "1px solid rgba(255,255,255,0.16)";
  btn.style.background = "rgba(255,255,255,0.08)";
  btn.style.color = "white";
  btn.style.fontSize = "12px";
  btn.style.fontWeight = "800";
  btn.style.cursor = "pointer";
  btn.style.pointerEvents = "auto";
  devProfileSwitcher.appendChild(btn);
  devProfileButtons[profileId] = btn;
}

const walletNicknameOverlay = document.createElement("div");
walletNicknameOverlay.id = "walletNicknameOverlay";
walletNicknameOverlay.style.position = "fixed";
walletNicknameOverlay.style.inset = "0";
walletNicknameOverlay.style.display = "none";
walletNicknameOverlay.style.alignItems = "center";
walletNicknameOverlay.style.justifyContent = "center";
walletNicknameOverlay.style.background = "rgba(8,10,14,0.58)";
walletNicknameOverlay.style.backdropFilter = "blur(8px)";
walletNicknameOverlay.style.pointerEvents = "auto";
walletNicknameOverlay.style.zIndex = "1000003";
uiLayer.appendChild(walletNicknameOverlay);

const walletNicknameCard = document.createElement("div");
walletNicknameCard.style.width = "min(420px, calc(100vw - 36px))";
walletNicknameCard.style.padding = "22px";
walletNicknameCard.style.background = "rgba(245,245,245,0.97)";
walletNicknameCard.style.border = "1px solid rgba(0,0,0,0.14)";
walletNicknameCard.style.borderRadius = "18px";
walletNicknameCard.style.boxShadow = "0 20px 48px rgba(0,0,0,0.28)";
walletNicknameCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
walletNicknameCard.style.color = "#222";
walletNicknameOverlay.appendChild(walletNicknameCard);

const walletNicknameTitle = document.createElement("div");
walletNicknameTitle.textContent = "닉네임 설정";
walletNicknameTitle.style.fontSize = "24px";
walletNicknameTitle.style.fontWeight = "900";
walletNicknameCard.appendChild(walletNicknameTitle);

const walletNicknameDesc = document.createElement("div");
walletNicknameDesc.textContent = "게임 안에서 사용할 닉네임을 정해주세요. 로그인 방식에 따라 지갑 계정 또는 로컬 게스트 세션에 저장됩니다.";
walletNicknameDesc.style.marginTop = "10px";
walletNicknameDesc.style.fontSize = "14px";
walletNicknameDesc.style.lineHeight = "1.65";
walletNicknameDesc.style.color = "#555";
walletNicknameCard.appendChild(walletNicknameDesc);

const walletNicknameInput = document.createElement("input");
walletNicknameInput.type = "text";
walletNicknameInput.maxLength = 12;
walletNicknameInput.placeholder = "예: 광부민수";
walletNicknameInput.style.width = "100%";
walletNicknameInput.style.boxSizing = "border-box";
walletNicknameInput.style.marginTop = "16px";
walletNicknameInput.style.padding = "12px 14px";
walletNicknameInput.style.borderRadius = "12px";
walletNicknameInput.style.border = "1px solid rgba(0,0,0,0.18)";
walletNicknameInput.style.fontSize = "15px";
walletNicknameInput.style.fontWeight = "700";
walletNicknameInput.style.outline = "none";
walletNicknameInput.style.pointerEvents = "auto";
walletNicknameCard.appendChild(walletNicknameInput);

const walletNicknameHint = document.createElement("div");
walletNicknameHint.textContent = "2~12자 / 한글, 영문, 숫자, 밑줄 사용 가능";
walletNicknameHint.style.marginTop = "8px";
walletNicknameHint.style.fontSize = "12px";
walletNicknameHint.style.color = "#666";
walletNicknameCard.appendChild(walletNicknameHint);

const walletNicknameStatus = document.createElement("div");
walletNicknameStatus.textContent = "";
walletNicknameStatus.style.marginTop = "12px";
walletNicknameStatus.style.minHeight = "20px";
walletNicknameStatus.style.fontSize = "13px";
walletNicknameStatus.style.lineHeight = "1.5";
walletNicknameStatus.style.color = "#8a2b2b";
walletNicknameCard.appendChild(walletNicknameStatus);

const walletNicknameSaveBtn = document.createElement("button");
walletNicknameSaveBtn.type = "button";
walletNicknameSaveBtn.textContent = "닉네임 저장";
walletNicknameSaveBtn.style.marginTop = "14px";
walletNicknameSaveBtn.style.padding = "12px 16px";
walletNicknameSaveBtn.style.borderRadius = "12px";
walletNicknameSaveBtn.style.border = "none";
walletNicknameSaveBtn.style.background = "#2d6cdf";
walletNicknameSaveBtn.style.color = "white";
walletNicknameSaveBtn.style.fontSize = "14px";
walletNicknameSaveBtn.style.fontWeight = "800";
walletNicknameSaveBtn.style.cursor = "pointer";
walletNicknameSaveBtn.style.pointerEvents = "auto";
walletNicknameCard.appendChild(walletNicknameSaveBtn);

const nftBoardOverlay = document.createElement("div");
nftBoardOverlay.id = "nftBoardOverlay";
nftBoardOverlay.style.position = "fixed";
nftBoardOverlay.style.inset = "0";
nftBoardOverlay.style.display = "none";
nftBoardOverlay.style.alignItems = "center";
nftBoardOverlay.style.justifyContent = "center";
nftBoardOverlay.style.background = "rgba(8,10,14,0.58)";
nftBoardOverlay.style.backdropFilter = "blur(8px)";
nftBoardOverlay.style.pointerEvents = "auto";
nftBoardOverlay.style.zIndex = "1000004";
uiLayer.appendChild(nftBoardOverlay);

const nftBoardCard = document.createElement("div");
nftBoardCard.style.width = "min(760px, calc(100vw - 40px))";
nftBoardCard.style.maxHeight = "min(78vh, 840px)";
nftBoardCard.style.display = "flex";
nftBoardCard.style.flexDirection = "column";
nftBoardCard.style.padding = "22px";
nftBoardCard.style.background = "rgba(245,245,245,0.97)";
nftBoardCard.style.border = "1px solid rgba(0,0,0,0.14)";
nftBoardCard.style.borderRadius = "18px";
nftBoardCard.style.boxShadow = "0 20px 48px rgba(0,0,0,0.28)";
nftBoardCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
nftBoardCard.style.color = "#222";
nftBoardOverlay.appendChild(nftBoardCard);

const nftBoardTitleRow = document.createElement("div");
nftBoardTitleRow.style.display = "flex";
nftBoardTitleRow.style.alignItems = "center";
nftBoardTitleRow.style.justifyContent = "space-between";
nftBoardTitleRow.style.gap = "12px";
nftBoardCard.appendChild(nftBoardTitleRow);

const nftBoardTitle = document.createElement("div");
nftBoardTitle.textContent = "내 NFT 전시 선택";
nftBoardTitle.style.fontSize = "24px";
nftBoardTitle.style.fontWeight = "900";
nftBoardTitleRow.appendChild(nftBoardTitle);

const nftBoardCloseBtn = document.createElement("button");
nftBoardCloseBtn.type = "button";
nftBoardCloseBtn.textContent = "닫기";
nftBoardCloseBtn.style.padding = "10px 14px";
nftBoardCloseBtn.style.borderRadius = "12px";
nftBoardCloseBtn.style.border = "1px solid rgba(0,0,0,0.12)";
nftBoardCloseBtn.style.background = "rgba(255,255,255,0.9)";
nftBoardCloseBtn.style.color = "#333";
nftBoardCloseBtn.style.fontSize = "14px";
nftBoardCloseBtn.style.fontWeight = "800";
nftBoardCloseBtn.style.cursor = "pointer";
nftBoardCloseBtn.style.pointerEvents = "auto";
nftBoardTitleRow.appendChild(nftBoardCloseBtn);

const nftBoardDesc = document.createElement("div");
nftBoardDesc.textContent = "현재 지갑이 보유한 전시 가능 NFT 중 하나를 골라 보드에 전시합니다.";
nftBoardDesc.style.marginTop = "10px";
nftBoardDesc.style.fontSize = "14px";
nftBoardDesc.style.lineHeight = "1.65";
nftBoardDesc.style.color = "#555";
nftBoardCard.appendChild(nftBoardDesc);

const nftBoardStatus = document.createElement("div");
nftBoardStatus.textContent = "지갑 NFT 목록을 준비하는 중입니다.";
nftBoardStatus.style.marginTop = "14px";
nftBoardStatus.style.padding = "10px 12px";
nftBoardStatus.style.background = "rgba(0,0,0,0.05)";
nftBoardStatus.style.borderRadius = "12px";
nftBoardStatus.style.fontSize = "13px";
nftBoardStatus.style.lineHeight = "1.6";
nftBoardStatus.style.color = "#444";
nftBoardCard.appendChild(nftBoardStatus);

const nftBoardGrid = document.createElement("div");
nftBoardGrid.style.marginTop = "16px";
nftBoardGrid.style.display = "grid";
nftBoardGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(168px, 1fr))";
nftBoardGrid.style.gap = "14px";
nftBoardGrid.style.overflowY = "auto";
nftBoardGrid.style.paddingRight = "4px";
nftBoardGrid.style.maxHeight = "52vh";
nftBoardGrid.style.pointerEvents = "auto";
nftBoardCard.appendChild(nftBoardGrid);

function shortenWalletAddress(address) {
  if (!address) return "";
  if (address === "dev_user_1") return "DEV-1";
  if (address === "dev_user_2") return "DEV-2";
  if (address === "dev-mode-local") return "DEV MODE";
  if (address === "guest-local") return "GUEST";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getDevProfileDisplayName(profileId = activeDevProfileId) {
  return profileId === "dev_user_2" ? "개발자2" : "개발자1";
}

function sanitizeDevProfileId(profileId) {
  return DEV_PROFILE_IDS.includes(profileId) ? profileId : DEV_PROFILE_IDS[0];
}

function getKeyInputCode(event) {
  return String(event?.code || "");
}

function getLogicalInputKey(event) {
  const code = getKeyInputCode(event);
  const codeMap = {
    KeyE: "e",
    KeyI: "i",
    KeyQ: "q",
    KeyR: "r",
    KeyT: "t",
    KeyB: "b",
    KeyW: "w",
    KeyA: "a",
    KeyS: "s",
    KeyD: "d",
    ShiftLeft: "shift",
    ShiftRight: "shift",
    Escape: "escape",
    Tab: "tab",
    Digit1: "1",
    Digit2: "2",
    Digit3: "3",
    Digit4: "4",
    Digit5: "5",
  };
  if (codeMap[code]) return codeMap[code];
  return String(event?.key || "").toLowerCase();
}

function isUiEscapeCloseHandled() {
  if (nftExhibitSelectionOpen) {
    closeNftBoardSelectionOverlay();
    return true;
  }
  if (personalStorageTransferState) {
    closePersonalStorageTransferDialog();
    return true;
  }
  if (personalStorageOpen) {
    setPersonalStorageOpen(false);
    return true;
  }
  if (frontierBuildOpen) {
    setFrontierBuildOpen(false);
    return true;
  }
  if (refineryOpen) {
    setRefineryOpen(false);
    return true;
  }
  if (forgeOpen) {
    setForgeOpen(false);
    return true;
  }
  if (discardDialog.style.display !== "none") {
    closeDiscardDialog();
    return true;
  }
  if (invOpen) {
    setInvOpen(false);
    return true;
  }
  if (questOpen) {
    setQuestOpen(false);
    return true;
  }
  return false;
}

function isTextInputActive() {
  const el = document.activeElement;
  if (!el) return false;
  return (el.tagName === "INPUT" || el.tagName === "TEXTAREA") && !el.readOnly && !el.disabled;
}

function getWalletLoginMessage(address, nonce, issuedAt) {
  return [
    "voxel-town 로그인",
    `주소: ${address}`,
    `Nonce: ${nonce}`,
    `시간: ${issuedAt}`,
  ].join("\n");
}

function stripHexPrefix(hex) {
  return String(hex || "").replace(/^0x/i, "");
}

function normalizeIpfsUrl(rawUrl) {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("ipfs://ipfs/")) {
    return `https://ipfs.io/ipfs/${rawUrl.slice("ipfs://ipfs/".length)}`;
  }
  if (rawUrl.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${rawUrl.slice("ipfs://".length)}`;
  }
  return rawUrl;
}

function createBoardTextTexture(title, lines = [], accent = "#d9b24f") {
  const canvas = document.createElement("canvas");
  canvas.width = NFT_BOARD_CANVAS_WIDTH;
  canvas.height = NFT_BOARD_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#18130f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2a211b";
  ctx.fillRect(34, 34, canvas.width - 68, canvas.height - 68);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 14;
  ctx.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);

  ctx.fillStyle = accent;
  ctx.font = "700 54px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width * 0.5, 132);

  ctx.fillStyle = "#f0e7dc";
  ctx.font = "600 34px system-ui";
  let y = 238;
  for (const line of lines) {
    ctx.fillText(line, canvas.width * 0.5, y);
    y += 56;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("NFT 이미지를 불러오지 못했습니다."));
    img.src = src;
  });
}

function createNftBoardDefaultSelection() {
  return {
    chainId: NFT_EXHIBIT_TARGET.chainId,
    contractAddress: NFT_EXHIBIT_TARGET.contractAddress.toLowerCase(),
    tokenId: NFT_EXHIBIT_TARGET.tokenId,
    name: NFT_EXHIBIT_TARGET.title,
    image: "",
    subtitle: "",
  };
}

function createNftBoardClearedSelection() {
  return {
    mode: "none",
  };
}

function isValidHexAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || "").trim());
}

function isValidChainId(value) {
  return /^0x[a-fA-F0-9]+$/.test(String(value || "").trim());
}

function isValidTokenId(value) {
  return /^[0-9]+$/.test(String(value || "").trim());
}

function isValidNftImageRef(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("ipfs://") ||
    raw.startsWith("data:image/")
  );
}

function normalizeNftBoardSelection(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.mode === "none") {
    return { mode: "none" };
  }
  const contractAddress = String(raw.contractAddress || "").trim().toLowerCase();
  const tokenId = raw.tokenId == null ? "" : String(raw.tokenId).trim();
  const chainId = String(raw.chainId || NFT_EXHIBIT_TARGET.chainId || "").trim() || NFT_EXHIBIT_TARGET.chainId;
  if (!isValidHexAddress(contractAddress) || !isValidTokenId(tokenId) || !isValidChainId(chainId)) {
    return null;
  }
  const image = String(raw.image || "").trim();
  return {
    chainId,
    contractAddress,
    tokenId,
    name: String(raw.name || "NFT 작품").trim() || "NFT 작품",
    image: isValidNftImageRef(image) ? image : "",
    subtitle: String(raw.subtitle || "").trim(),
  };
}

function isSameNftBoardSelection(a, b) {
  const left = normalizeNftBoardSelection(a);
  const right = normalizeNftBoardSelection(b);
  if (!left && !right) return true;
  if (!left || !right) return false;
  if (left.mode === "none" || right.mode === "none") {
    return left.mode === right.mode;
  }
  return (
    left.chainId === right.chainId &&
    left.contractAddress === right.contractAddress &&
    left.tokenId === right.tokenId
  );
}

function getActiveNftBoardSelection() {
  const normalized = normalizeNftBoardSelection(nftExhibitSelectedItem);
  if (normalized?.mode === "none") return normalized;
  return normalized ?? createNftBoardDefaultSelection();
}

function updateNftBoardSelectionUi() {
  nftBoardOverlay.style.display = nftExhibitSelectionOpen ? "flex" : "none";
  nftBoardStatus.textContent = nftExhibitSelectionStatus || "지갑 NFT 목록을 준비하는 중입니다.";
  const palette = {
    neutral: {
      bg: "rgba(0,0,0,0.05)",
      color: "#444",
      border: "rgba(0,0,0,0.06)",
    },
    loading: {
      bg: "rgba(246,165,58,0.12)",
      color: "#8f5a00",
      border: "rgba(246,165,58,0.22)",
    },
    success: {
      bg: "rgba(54,179,126,0.12)",
      color: "#1f6a4a",
      border: "rgba(54,179,126,0.22)",
    },
    empty: {
      bg: "rgba(100,116,139,0.1)",
      color: "#475569",
      border: "rgba(100,116,139,0.18)",
    },
    error: {
      bg: "rgba(220,38,38,0.1)",
      color: "#9f1239",
      border: "rgba(220,38,38,0.2)",
    },
  };
  const style = palette[nftExhibitSelectionTone] ?? palette.neutral;
  nftBoardStatus.style.background = style.bg;
  nftBoardStatus.style.color = style.color;
  nftBoardStatus.style.border = `1px solid ${style.border}`;
}

function closeNftBoardSelectionOverlay() {
  nftExhibitSelectionOpen = false;
  updateNftBoardSelectionUi();
}

function setNftBoardSelectionStatus(text, tone = "neutral") {
  nftExhibitSelectionStatus = text;
  nftExhibitSelectionTone = tone;
  updateNftBoardSelectionUi();
}

function clearGameplayKeys() {
  keys.w = false;
  keys.a = false;
  keys.s = false;
  keys.d = false;
  keys.shift = false;
}

function setNftBoardSelection(nextSelection, { save = true } = {}) {
  const normalizedSelection = normalizeNftBoardSelection(nextSelection);
  if (isSameNftBoardSelection(nftExhibitSelectedItem, normalizedSelection)) {
    closeNftBoardSelectionOverlay();
    return false;
  }
  nftExhibitSelectedItem = normalizedSelection;
  closeNftBoardSelectionOverlay();
  scheduleNftExhibitBoardRefresh();
  if (save && isServerBackedWalletSession()) {
    schedulePlayerSaveSync(true);
  }
  return true;
}

function renderNftBoardTokenGrid() {
  nftBoardGrid.innerHTML = "";

  const selected = getActiveNftBoardSelection();

  const renderStateCard = (title, desc, tone = "neutral", { showRetry = false } = {}) => {
    const card = document.createElement("div");
    card.style.gridColumn = "1 / -1";
    card.style.minHeight = "220px";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.justifyContent = "center";
    card.style.padding = "28px 20px";
    card.style.borderRadius = "18px";
    card.style.border = "1px dashed rgba(0,0,0,0.14)";
    card.style.background = "#fbfcfd";
    card.style.textAlign = "center";

    const icon = document.createElement("div");
    icon.textContent =
      tone === "loading" ? "..." :
      tone === "error" ? "!" :
      tone === "empty" ? "0" : "NFT";
    icon.style.width = "54px";
    icon.style.height = "54px";
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";
    icon.style.borderRadius = "999px";
    icon.style.background =
      tone === "loading" ? "rgba(246,165,58,0.14)" :
      tone === "error" ? "rgba(220,38,38,0.12)" :
      tone === "empty" ? "rgba(100,116,139,0.12)" :
      "rgba(59,130,246,0.12)";
    icon.style.color =
      tone === "loading" ? "#8f5a00" :
      tone === "error" ? "#9f1239" :
      tone === "empty" ? "#475569" :
      "#1d4ed8";
    icon.style.fontWeight = "900";
    icon.style.fontSize = "22px";
    card.appendChild(icon);

    const titleEl = document.createElement("div");
    titleEl.textContent = title;
    titleEl.style.marginTop = "14px";
    titleEl.style.fontSize = "16px";
    titleEl.style.fontWeight = "900";
    titleEl.style.color = "#1f2937";
    card.appendChild(titleEl);

    const descEl = document.createElement("div");
    descEl.textContent = desc;
    descEl.style.marginTop = "8px";
    descEl.style.fontSize = "13px";
    descEl.style.lineHeight = "1.6";
    descEl.style.color = "#64748b";
    descEl.style.maxWidth = "360px";
    card.appendChild(descEl);

    if (showRetry) {
      const retryBtn = document.createElement("button");
      retryBtn.type = "button";
      retryBtn.textContent = "다시 시도";
      retryBtn.style.marginTop = "16px";
      retryBtn.style.padding = "10px 14px";
      retryBtn.style.borderRadius = "12px";
      retryBtn.style.border = "1px solid rgba(0,0,0,0.12)";
      retryBtn.style.background = "#ffffff";
      retryBtn.style.color = "#1f2937";
      retryBtn.style.fontSize = "13px";
      retryBtn.style.fontWeight = "800";
      retryBtn.style.cursor = "pointer";
      retryBtn.style.pointerEvents = "auto";
      retryBtn.addEventListener("click", () => {
        void reloadNftBoardSelectionList({ forceRefresh: true });
      });
      card.appendChild(retryBtn);
    }

    nftBoardGrid.appendChild(card);
  };

  if (nftExhibitSelectionLoading) {
    setNftBoardSelectionStatus(
      nftExhibitSelectionStatus || "지갑 NFT 목록을 불러오는 중입니다...",
      "loading"
    );
    renderStateCard(
      "NFT 목록을 불러오는 중",
      "지갑과 체인에서 전시 가능한 NFT를 확인하고 있어요. 잠시만 기다려주세요.",
      "loading"
    );
    return;
  }

  if (nftExhibitOwnedTokens.length === 0) {
    const isError = nftExhibitSelectionTone === "error";
    setNftBoardSelectionStatus(
      nftExhibitSelectionStatus || "전시 가능한 NFT가 없습니다.",
      isError ? "error" : "empty"
    );
    renderStateCard(
      isError ? "NFT를 불러오지 못했습니다" : "전시 가능한 NFT 없음",
      isError
        ? "네트워크 또는 메타데이터 오류가 발생했습니다. 잠시 후 다시 열어보세요."
        : "현재 로그인한 지갑에서 전시 가능한 NFT를 찾지 못했습니다.",
      isError ? "error" : "empty",
      { showRetry: true }
    );
    return;
  }

  setNftBoardSelectionStatus(
    nftExhibitSelectionOwnershipMismatch
      ? nftExhibitSelectionOwnershipMessage || "현재 선택한 NFT를 더 이상 보유하고 있지 않습니다."
      : (nftExhibitSelectionStatus || "전시할 NFT를 하나 선택하세요."),
    nftExhibitSelectionOwnershipMismatch ? "error" : "success"
  );

  if (nftExhibitSelectionOwnershipMismatch) {
    const warningCard = document.createElement("div");
    warningCard.style.gridColumn = "1 / -1";
    warningCard.style.display = "flex";
    warningCard.style.flexDirection = "column";
    warningCard.style.padding = "14px 16px";
    warningCard.style.borderRadius = "14px";
    warningCard.style.background = "rgba(220,38,38,0.08)";
    warningCard.style.border = "1px solid rgba(220,38,38,0.18)";

    const warningTitle = document.createElement("div");
    warningTitle.textContent = "현재 전시 NFT를 더 이상 보유하지 않습니다";
    warningTitle.style.fontSize = "14px";
    warningTitle.style.fontWeight = "900";
    warningTitle.style.color = "#9f1239";
    warningCard.appendChild(warningTitle);

    const warningDesc = document.createElement("div");
    warningDesc.textContent = "아래 목록에서 다시 선택하거나, 전시 해제를 눌러 보드를 비울 수 있습니다.";
    warningDesc.style.marginTop = "6px";
    warningDesc.style.fontSize = "12px";
    warningDesc.style.lineHeight = "1.6";
    warningDesc.style.color = "#7f1d1d";
    warningCard.appendChild(warningDesc);

    nftBoardGrid.appendChild(warningCard);
  }

  const clearCard = document.createElement("button");
  clearCard.type = "button";
  clearCard.style.display = "flex";
  clearCard.style.flexDirection = "column";
  clearCard.style.alignItems = "stretch";
  clearCard.style.padding = "10px";
  clearCard.style.borderRadius = "16px";
  clearCard.style.border = "2px solid rgba(0,0,0,0.08)";
  clearCard.style.background = "#ffffff";
  clearCard.style.cursor = "pointer";
  clearCard.style.textAlign = "left";
  clearCard.style.pointerEvents = "auto";
  clearCard.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
  clearCard.style.transition = "transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease";

  if (selected?.mode === "none") {
    clearCard.style.borderColor = "#f6a53a";
    clearCard.style.boxShadow = "0 10px 24px rgba(246,165,58,0.2)";
  }

  const clearThumb = document.createElement("div");
  clearThumb.style.width = "100%";
  clearThumb.style.aspectRatio = "1 / 1";
  clearThumb.style.borderRadius = "12px";
  clearThumb.style.background = "repeating-linear-gradient(135deg, #eef2f6 0 18px, #ffffff 18px 36px)";
  clearThumb.style.border = "1px solid rgba(0,0,0,0.06)";
  clearThumb.style.display = "flex";
  clearThumb.style.alignItems = "center";
  clearThumb.style.justifyContent = "center";
  clearThumb.style.color = "#64748b";
  clearThumb.style.fontSize = "14px";
  clearThumb.style.fontWeight = "900";
  clearThumb.textContent = "전시 해제";
  clearCard.appendChild(clearThumb);

  const clearName = document.createElement("div");
  clearName.textContent = "NFT 전시 해제";
  clearName.style.marginTop = "10px";
  clearName.style.fontSize = "14px";
  clearName.style.fontWeight = "800";
  clearName.style.lineHeight = "1.4";
  clearCard.appendChild(clearName);

  const clearSub = document.createElement("div");
  clearSub.textContent = "보드를 빈 상태로 둡니다";
  clearSub.style.marginTop = "4px";
  clearSub.style.fontSize = "12px";
  clearSub.style.color = "#64748b";
  clearCard.appendChild(clearSub);

  if (selected?.mode === "none") {
    const clearBadge = document.createElement("div");
    clearBadge.textContent = "현재 적용됨";
    clearBadge.style.marginTop = "8px";
    clearBadge.style.alignSelf = "flex-start";
    clearBadge.style.padding = "4px 8px";
    clearBadge.style.borderRadius = "999px";
    clearBadge.style.background = "rgba(246,165,58,0.16)";
    clearBadge.style.color = "#c16b00";
    clearBadge.style.fontSize = "11px";
    clearBadge.style.fontWeight = "800";
    clearCard.appendChild(clearBadge);
  }

  clearCard.addEventListener("mouseenter", () => {
    clearCard.style.transform = "translateY(-2px)";
  });
  clearCard.addEventListener("mouseleave", () => {
    clearCard.style.transform = "translateY(0)";
  });
  clearCard.addEventListener("click", () => {
    const changed = setNftBoardSelection(createNftBoardClearedSelection());
    if (changed) {
      showUI("NFT 전시 해제", 1000);
      lastMessageUntil = performance.now() + 1000;
    }
  });

  nftBoardGrid.appendChild(clearCard);

  for (const token of nftExhibitOwnedTokens) {
    const card = document.createElement("button");
    card.type = "button";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "stretch";
    card.style.padding = "10px";
    card.style.borderRadius = "16px";
    card.style.border = "2px solid rgba(0,0,0,0.08)";
    card.style.background = "#ffffff";
    card.style.cursor = "pointer";
    card.style.textAlign = "left";
    card.style.pointerEvents = "auto";
    card.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
    card.style.transition = "transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease";

    const isSelected =
      selected.contractAddress === token.contractAddress.toLowerCase() &&
      selected.tokenId === token.tokenId;

    if (isSelected) {
      card.style.borderColor = "#f6a53a";
      card.style.boxShadow = "0 10px 24px rgba(246,165,58,0.2)";
    }

    const thumb = document.createElement("div");
    thumb.style.width = "100%";
    thumb.style.aspectRatio = "1 / 1";
    thumb.style.borderRadius = "12px";
    thumb.style.overflow = "hidden";
    thumb.style.background = "#eef2f6";
    thumb.style.display = "flex";
    thumb.style.alignItems = "center";
    thumb.style.justifyContent = "center";
    thumb.style.border = "1px solid rgba(0,0,0,0.06)";
    card.appendChild(thumb);

    if (token.image) {
      const img = document.createElement("img");
      img.src = normalizeIpfsUrl(token.image);
      img.alt = token.name;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      thumb.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.textContent = "NFT";
      placeholder.style.fontWeight = "900";
      placeholder.style.color = "#475569";
      thumb.appendChild(placeholder);
    }

    const name = document.createElement("div");
    name.textContent = token.name;
    name.style.marginTop = "10px";
    name.style.fontSize = "14px";
    name.style.fontWeight = "800";
    name.style.lineHeight = "1.4";
    card.appendChild(name);

    const sub = document.createElement("div");
    sub.textContent = `Token #${token.tokenId}`;
    sub.style.marginTop = "4px";
    sub.style.fontSize = "12px";
    sub.style.color = "#64748b";
    card.appendChild(sub);

    if (isSelected) {
      const badge = document.createElement("div");
      badge.textContent = "현재 전시 중";
      badge.style.marginTop = "8px";
      badge.style.alignSelf = "flex-start";
      badge.style.padding = "4px 8px";
      badge.style.borderRadius = "999px";
      badge.style.background = "rgba(246,165,58,0.16)";
      badge.style.color = "#c16b00";
      badge.style.fontSize = "11px";
      badge.style.fontWeight = "800";
      card.appendChild(badge);
    }

    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-2px)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
    });
    card.addEventListener("click", () => {
      const changed = setNftBoardSelection({
        chainId: NFT_EXHIBIT_TARGET.chainId,
        contractAddress: token.contractAddress,
        tokenId: token.tokenId,
        name: token.name,
        image: token.image,
        subtitle: token.subtitle || "",
      });
      if (changed) {
        showUI(`${token.name} 전시`, 1000);
        lastMessageUntil = performance.now() + 1000;
      }
    });

    nftBoardGrid.appendChild(card);
  }
}

async function createBoardImageTexture(imageUrl, title, subtitle = "") {
  const img = await loadImageElement(normalizeIpfsUrl(imageUrl));
  const canvas = document.createElement("canvas");
  canvas.width = NFT_BOARD_CANVAS_WIDTH;
  canvas.height = NFT_BOARD_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#f4f6f8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.strokeStyle = "#2a2f37";
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(54, 96, canvas.width - 108, canvas.height - 248);

  const frameX = 52;
  const frameY = 68;
  const frameW = canvas.width - 104;
  const frameH = canvas.height - 190;
  const scale = Math.min(frameW / img.width, frameH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = frameX + (frameW - drawW) * 0.5;
  const drawY = frameY + (frameH - drawH) * 0.5;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.22)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(drawX - 14, drawY - 14, drawW + 28, drawH + 28);
  ctx.restore();
  ctx.save();
  ctx.filter = "brightness(1.42) contrast(1.16) saturate(1.08)";
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();

  ctx.fillStyle = "#eef2f6";
  ctx.fillRect(42, canvas.height - 130, canvas.width - 84, 40);
  ctx.strokeStyle = "#2a2f37";
  ctx.lineWidth = 4;
  ctx.strokeRect(42, canvas.height - 130, canvas.width - 84, 40);

  ctx.fillStyle = "#f7f9fb";
  ctx.fillRect(42, canvas.height - 82, canvas.width - 84, 28);
  ctx.strokeStyle = "rgba(42,47,55,0.42)";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, canvas.height - 82, canvas.width - 84, 28);

  ctx.fillStyle = "#1f2730";
  ctx.textAlign = "center";
  ctx.font = "700 24px system-ui";
  ctx.fillText(title, canvas.width * 0.5, canvas.height - 102);
  if (subtitle) {
    ctx.fillStyle = "#5d6a78";
    ctx.font = "600 15px system-ui";
    ctx.fillText(subtitle, canvas.width * 0.5, canvas.height - 62);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function applyNftBoardTexture(texture) {
  if (!nftExhibitScreenMaterial) return;
  if (nftExhibitScreenMaterial.map && nftExhibitScreenMaterial.map !== texture) {
    nftExhibitScreenMaterial.map.dispose?.();
  }
  nftExhibitScreenMaterial.map = texture;
  nftExhibitScreenMaterial.needsUpdate = true;
}

function setNftBoardMessage(title, lines, accent = "#d9b24f") {
  const texture = createBoardTextTexture(title, lines, accent);
  if (!texture) return;
  applyNftBoardTexture(texture);
}

function encodeUint256Call(selector, value) {
  const encodedValue = BigInt(value).toString(16).padStart(64, "0");
  return `${selector}${encodedValue}`;
}

function encodeAddressCall(selector, address) {
  const encodedAddress = stripHexPrefix(String(address || "")).padStart(64, "0");
  return `${selector}${encodedAddress}`;
}

function encodeAddressUintCall(selector, address, value) {
  const encodedAddress = stripHexPrefix(String(address || "")).padStart(64, "0");
  const encodedValue = BigInt(value).toString(16).padStart(64, "0");
  return `${selector}${encodedAddress}${encodedValue}`;
}

function encodeSupportsInterfaceCall(interfaceIdHex) {
  const encodedInterface = stripHexPrefix(interfaceIdHex).padStart(64, "0");
  return `0x01ffc9a7${encodedInterface}`;
}

function decodeAbiAddress(resultHex) {
  const clean = stripHexPrefix(resultHex);
  if (clean.length < 64) return "";
  return `0x${clean.slice(clean.length - 40)}`.toLowerCase();
}

function decodeAbiUint256(resultHex) {
  const clean = stripHexPrefix(resultHex);
  if (clean.length < 64) return 0n;
  return BigInt(`0x${clean.slice(clean.length - 64)}`);
}

function decodeAbiString(resultHex) {
  const clean = stripHexPrefix(resultHex);
  if (clean.length < 128) return "";
  const offset = Number.parseInt(clean.slice(0, 64), 16) * 2;
  if (!Number.isFinite(offset) || offset < 0 || clean.length < offset + 64) return "";
  const length = Number.parseInt(clean.slice(offset, offset + 64), 16);
  if (!Number.isFinite(length) || length < 0) return "";
  const dataHex = clean.slice(offset + 64, offset + 64 + length * 2);
  const bytes = new Uint8Array(dataHex.match(/.{1,2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
  return new TextDecoder().decode(bytes);
}

async function fetchErc721Owner(contractAddress, tokenId) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: contractAddress,
        data: encodeUint256Call("0x6352211e", tokenId),
      },
      "latest",
    ],
  });
  return decodeAbiAddress(result);
}

async function fetchErc721Balance(contractAddress, ownerAddress) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: contractAddress,
        data: encodeAddressCall("0x70a08231", ownerAddress),
      },
      "latest",
    ],
  });
  return decodeAbiUint256(result);
}

async function fetchErc721TokenOfOwnerByIndex(contractAddress, ownerAddress, index) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: contractAddress,
        data: encodeAddressUintCall("0x2f745c59", ownerAddress, index),
      },
      "latest",
    ],
  });
  return decodeAbiUint256(result).toString();
}

async function fetchSupportsInterface(contractAddress, interfaceIdHex) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: contractAddress,
        data: encodeSupportsInterfaceCall(interfaceIdHex),
      },
      "latest",
    ],
  });
  return decodeAbiUint256(result) !== 0n;
}

async function fetchErc721TokenUri(contractAddress, tokenId) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: contractAddress,
        data: encodeUint256Call("0xc87b56dd", tokenId),
      },
      "latest",
    ],
  });
  return decodeAbiString(result);
}

async function fetchNftMetadata(tokenUri) {
  const normalizedUri = normalizeIpfsUrl(tokenUri);
  if (normalizedUri.startsWith("data:application/json;base64,")) {
    const encoded = normalizedUri.slice("data:application/json;base64,".length);
    return JSON.parse(atob(encoded));
  }
  if (normalizedUri.startsWith("data:application/json,")) {
    return JSON.parse(decodeURIComponent(normalizedUri.slice("data:application/json,".length)));
  }
  const response = await fetch(normalizedUri);
  if (!response.ok) {
    throw new Error("NFT 메타데이터를 불러오지 못했습니다.");
  }
  return response.json();
}

async function fetchWalletOwnedExhibitTokens() {
  if (!walletAuth.address) return [];

  const contractAddress = NFT_EXHIBIT_TARGET.contractAddress.toLowerCase();
  const cacheIsValid =
    nftExhibitOwnedTokensCache.walletAddress === walletAuth.address.toLowerCase() &&
    nftExhibitOwnedTokensCache.chainId === (walletAuth.chainId || "") &&
    nftExhibitOwnedTokensCache.contractAddress === contractAddress &&
    Date.now() - nftExhibitOwnedTokensCache.fetchedAt < 30_000;
  if (cacheIsValid) {
    return nftExhibitOwnedTokensCache.items.map((item) => ({ ...item }));
  }

  const ownedTokens = [];
  const enumerableSupported = await fetchSupportsInterface(contractAddress, "0x780e9d63").catch(() => false);

  if (enumerableSupported) {
    const balance = Number(await fetchErc721Balance(contractAddress, walletAuth.address));
    const cappedBalance = Math.min(balance, 24);
    for (let index = 0; index < cappedBalance; index++) {
      const tokenId = await fetchErc721TokenOfOwnerByIndex(contractAddress, walletAuth.address, index);
      const tokenUri = await fetchErc721TokenUri(contractAddress, tokenId);
      const metadata = await fetchNftMetadata(tokenUri);
      ownedTokens.push({
        chainId: NFT_EXHIBIT_TARGET.chainId,
        contractAddress,
        tokenId,
        name: String(metadata?.name || `NFT #${tokenId}`),
        image: String(metadata?.image || metadata?.image_url || metadata?.imageUrl || ""),
        subtitle: String(metadata?.description || ""),
      });
    }
  } else {
    const owner = await fetchErc721Owner(contractAddress, NFT_EXHIBIT_TARGET.tokenId);
    if (owner.toLowerCase() === walletAuth.address.toLowerCase()) {
      const tokenUri = await fetchErc721TokenUri(contractAddress, NFT_EXHIBIT_TARGET.tokenId);
      const metadata = await fetchNftMetadata(tokenUri);
      ownedTokens.push({
        chainId: NFT_EXHIBIT_TARGET.chainId,
        contractAddress,
        tokenId: NFT_EXHIBIT_TARGET.tokenId,
        name: String(metadata?.name || NFT_EXHIBIT_TARGET.title),
        image: String(metadata?.image || metadata?.image_url || metadata?.imageUrl || ""),
        subtitle: String(metadata?.description || ""),
      });
    }
  }

  nftExhibitOwnedTokensCache = {
    walletAddress: walletAuth.address.toLowerCase(),
    chainId: walletAuth.chainId || "",
    contractAddress,
    items: ownedTokens.map((item) => ({ ...item })),
    fetchedAt: Date.now(),
  };

  return ownedTokens;
}

async function reloadNftBoardSelectionList({ forceRefresh = false } = {}) {
  if (!nftExhibitSelectionOpen) return;
  nftExhibitSelectionLoading = true;
  nftExhibitSelectionStatus = "지갑 NFT 목록을 불러오는 중입니다...";
  nftExhibitSelectionTone = "loading";
  nftExhibitOwnedTokens = [];
  updateNftBoardSelectionUi();
  renderNftBoardTokenGrid();

  try {
    if (forceRefresh) {
      nftExhibitOwnedTokensCache.fetchedAt = 0;
    }
    const tokens = await fetchWalletOwnedExhibitTokens();
    if (!nftExhibitSelectionOpen) return;
    nftExhibitOwnedTokens = tokens;
    const selected = getActiveNftBoardSelection();
    if (selected?.mode !== "none" && selected?.contractAddress && selected?.tokenId) {
      const stillOwned = tokens.some(
        (token) =>
          token.contractAddress.toLowerCase() === selected.contractAddress &&
          token.tokenId === selected.tokenId
      );
      nftExhibitSelectionOwnershipMismatch = !stillOwned;
      nftExhibitSelectionOwnershipMessage = stillOwned
        ? ""
        : "현재 선택한 NFT를 이 지갑이 보유하고 있지 않습니다.";
    } else {
      nftExhibitSelectionOwnershipMismatch = false;
      nftExhibitSelectionOwnershipMessage = "";
    }
    nftExhibitSelectionStatus = tokens.length > 0
      ? "전시할 NFT를 하나 선택하세요."
      : "지갑에서 전시 가능한 NFT를 찾지 못했습니다.";
    nftExhibitSelectionTone = nftExhibitSelectionOwnershipMismatch
      ? "error"
      : (tokens.length > 0 ? "success" : "empty");
  } catch (error) {
    if (!nftExhibitSelectionOpen) return;
    nftExhibitOwnedTokens = [];
    nftExhibitSelectionStatus = error?.message || "NFT 목록을 불러오지 못했습니다.";
    nftExhibitSelectionTone = "error";
  } finally {
    if (!nftExhibitSelectionOpen) return;
    nftExhibitSelectionLoading = false;
    updateNftBoardSelectionUi();
    renderNftBoardTokenGrid();
  }
}

async function openNftBoardSelectionOverlay() {
  if (!isServerBackedWalletSession()) {
    showUI("메타마스크 로그인 후 사용 가능", 1000);
    lastMessageUntil = performance.now() + 1000;
    return;
  }

  if ((walletAuth.chainId || "") !== NFT_EXHIBIT_TARGET.chainId) {
    showUI("Ethereum 메인넷으로 전환 후 이용 가능", 1200);
    lastMessageUntil = performance.now() + 1200;
    return;
  }

  clearGameplayKeys();
  setInvOpen(false);
  setQuestOpen(false);
  setForgeOpen(false);
  nftExhibitSelectionOpen = true;
  await reloadNftBoardSelectionList();
}

function scheduleNftExhibitBoardRefresh() {
  if (nftExhibitRefreshTimer) {
    clearTimeout(nftExhibitRefreshTimer);
    nftExhibitRefreshTimer = null;
  }
  nftExhibitRefreshTimer = setTimeout(() => {
    nftExhibitRefreshTimer = null;
    void refreshNftExhibitBoard();
  }, 40);
}

async function refreshNftExhibitBoard() {
  if (!nftExhibitScreenMaterial) return;
  const refreshToken = ++nftExhibitRefreshToken;
  const selectedNft = getActiveNftBoardSelection();

  nftExhibitSelectionOwnershipMismatch = false;
  nftExhibitSelectionOwnershipMessage = "";

  if (selectedNft?.mode === "none") {
    setNftBoardMessage(
      "지갑 NFT 전시",
      ["현재 선택된 전시 작품이 없습니다.", "선택창에서 원하는 NFT를 골라주세요."],
      "#9dbce0"
    );
    return;
  }

  if (!walletAuth.authenticated || walletAuth.sessionType !== "wallet" || !walletAuth.address) {
    setNftBoardMessage(
      "지갑 NFT 전시",
      ["메타마스크 로그인 후", "보유 NFT를 전시합니다."],
      "#9dbce0"
    );
    return;
  }

  const chainId = walletAuth.chainId || (await window.ethereum?.request?.({ method: "eth_chainId" }).catch(() => ""));
  if (refreshToken !== nftExhibitRefreshToken) return;
  if (chainId !== selectedNft.chainId) {
    setNftBoardMessage(
      "지갑 NFT 전시",
      ["Ethereum 메인넷으로", "전환하면 작품을 불러옵니다."],
      "#d9b24f"
    );
    return;
  }

  setNftBoardMessage(
    "지갑 NFT 전시",
    ["작품 정보를", "불러오는 중입니다..."],
    "#d9b24f"
  );

  try {
    const owner = await fetchErc721Owner(
      selectedNft.contractAddress,
      selectedNft.tokenId
    );
    if (refreshToken !== nftExhibitRefreshToken) return;
    if (owner.toLowerCase() !== walletAuth.address.toLowerCase()) {
      nftExhibitSelectionOwnershipMismatch = true;
      nftExhibitSelectionOwnershipMessage = "현재 선택한 NFT를 이 지갑이 보유하고 있지 않습니다.";
      setNftBoardMessage(
        "지갑 NFT 전시",
        ["현재 선택한 NFT를", "이 지갑이 보유하고 있지 않습니다."],
        "#d97575"
      );
      return;
    }

    const tokenUri = await fetchErc721TokenUri(
      selectedNft.contractAddress,
      selectedNft.tokenId
    );
    if (refreshToken !== nftExhibitRefreshToken) return;
    const metadata = await fetchNftMetadata(tokenUri);
    if (refreshToken !== nftExhibitRefreshToken) return;

    const imageUrl =
      metadata?.image ||
      metadata?.image_url ||
      metadata?.imageUrl ||
      "";

    if (!imageUrl) {
      setNftBoardMessage(
        metadata?.name || "NFT 작품",
        ["이미지 메타데이터가", "비어 있습니다."],
        "#d97575"
      );
      return;
    }

    const ownerDisplayName = walletProfile.nickname?.trim()
      ? walletProfile.nickname.trim()
      : shortenWalletAddress(walletAuth.address);
    const texture = await createBoardImageTexture(
      imageUrl,
      metadata?.name || selectedNft.name || NFT_EXHIBIT_TARGET.title,
      `소유자: ${ownerDisplayName}`
    );
    if (refreshToken !== nftExhibitRefreshToken || !texture) return;
    applyNftBoardTexture(texture);
  } catch (error) {
    if (refreshToken !== nftExhibitRefreshToken) return;
    setNftBoardMessage(
      "지갑 NFT 전시",
      [error?.message || "NFT를 불러오지 못했습니다."],
      "#d97575"
    );
  }
}

function saveWalletSession() {
  if (!walletAuth.authenticated || !walletAuth.address) {
    localStorage.removeItem(WALLET_SESSION_KEY);
    return;
  }
  localStorage.setItem(
    WALLET_SESSION_KEY,
    JSON.stringify({
      authenticated: walletAuth.authenticated,
      address: walletAuth.address,
      signature: walletAuth.signature,
      nonce: walletAuth.nonce,
      issuedAt: walletAuth.issuedAt,
      chainId: walletAuth.chainId,
      token: walletAuth.token,
      sessionType: walletAuth.sessionType,
    })
  );
}

function hasNickname() {
  return walletProfile.nickname.trim().length > 0;
}

function canPlayGame() {
  return isWalletAuthenticated() && hasNickname();
}

function validateNickname(raw) {
  const nickname = raw.trim();
  if (nickname.length < 2 || nickname.length > 12) {
    return "닉네임은 2자 이상 12자 이하로 입력해주세요.";
  }
  if (!/^[A-Za-z0-9가-힣_]+$/.test(nickname)) {
    return "닉네임은 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.";
  }
  return "";
}

async function apiFetchJson(path, options = {}) {
  try {
    const { headers: optionHeaders = {}, ...restOptions } = options;
    const response = await fetch(`${AUTH_API_BASE_URL}${path}`, {
      ...restOptions,
      headers: {
        "Content-Type": "application/json",
        ...optionHeaders,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) {
    return {
      ok: false,
      status: response.status,
      error: data?.error || "인증 서버 요청에 실패했습니다.",
      data,
    };
  }
    return {
      ok: true,
      data,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "인증 서버에 연결하지 못했습니다. server를 먼저 실행해주세요.",
    };
  }
}

function getAuthHeaders() {
  return walletAuth.token
    ? {
        Authorization: `Bearer ${walletAuth.token}`,
      }
    : {};
}

function isGuestSession() {
  return walletAuth.sessionType === "guest" || walletAuth.address === "guest-local";
}

function isDevSession() {
  return walletAuth.sessionType === "dev";
}

function isLocalProfileSession() {
  return isDevSession() || isGuestSession();
}

function isServerBackedWalletSession() {
  return walletAuth.authenticated && walletAuth.sessionType === "wallet" && Boolean(walletAuth.token);
}

function getActivePlayerSaveKey() {
  if (isDevSession()) {
    return `${DEV_PROFILE_SAVE_PREFIX}${sanitizeDevProfileId(activeDevProfileId)}`;
  }
  if (isGuestSession()) {
    return "voxel-town.guest-profile-save.v1";
  }
  return "";
}

function createDefaultSharedWorldSave() {
  return {
    frontierBuild: createDefaultFrontierBuildState(),
  };
}

function serializeSharedWorldState() {
  return {
    frontierBuild: structuredClone(frontierBuildState),
  };
}

function normalizeSharedWorldState(rawWorld) {
  return {
    ...createDefaultSharedWorldSave(),
    ...(rawWorld && typeof rawWorld === "object" ? rawWorld : {}),
    frontierBuild: normalizeFrontierBuildState(rawWorld?.frontierBuild),
  };
}

function applySharedWorldState(rawWorld) {
  const world = normalizeSharedWorldState(rawWorld);
  frontierBuildState = normalizeFrontierBuildState(world.frontierBuild);
  rebuildAllFrontierConstructionVisuals();
}

function saveActiveLocalProfileState() {
  const saveKey = getActivePlayerSaveKey();
  if (!saveKey) return false;
  try {
    const snapshot = serializePlayerSave();
    delete snapshot.frontierBuild;
    localStorage.setItem(saveKey, JSON.stringify(snapshot));
    lastPlayerSaveSnapshot = JSON.stringify(snapshot);
    return true;
  } catch {
    return false;
  }
}

function saveSharedWorldStateToLocal() {
  if (!isDevSession()) return false;
  try {
    localStorage.setItem(DEV_SHARED_WORLD_KEY, JSON.stringify(serializeSharedWorldState()));
    return true;
  } catch {
    return false;
  }
}

function loadSharedWorldStateFromLocal() {
  try {
    const raw = localStorage.getItem(DEV_SHARED_WORLD_KEY);
    if (!raw) return createDefaultSharedWorldSave();
    return normalizeSharedWorldState(JSON.parse(raw));
  } catch {
    return createDefaultSharedWorldSave();
  }
}

function resetPlayerSaveProtectionState() {
  lastPlayerSaveSnapshot = "";
  lastKnownPlayerSaveUpdatedAt = "";
  playerSaveBaselineState = "unknown";
}

function beginPlayerSaveHydration() {
  playerSaveSyncPaused = true;
  playerSaveBaselineState = "pending";
  lastPlayerSaveSnapshot = "";
}

function markPlayerSaveBaselineReady(mode = "hydrated") {
  playerSaveBaselineState = mode;
}

function blockPlayerSaveBaseline(message = "") {
  playerSaveBaselineState = "blocked";
  if (message) {
    walletLoginStatus.textContent = message;
    setPlayerSaveStatus("저장 보호 모드", "error", { persist: true });
  }
}

function hasConfirmedPlayerSaveBaseline() {
  return playerSaveBaselineState === "hydrated" || playerSaveBaselineState === "fresh";
}

function hidePlayerSaveStatus(delay = 1400) {
  if (playerSaveStatusTimer) {
    clearTimeout(playerSaveStatusTimer);
    playerSaveStatusTimer = null;
  }
  playerSaveStatusTimer = setTimeout(() => {
    playerSaveStatusBadge.style.opacity = "0";
    playerSaveStatusBadge.style.transform = "translateY(4px)";
  }, delay);
}

function setPlayerSaveStatus(text, tone = "neutral", { persist = false } = {}) {
  const palette = {
    neutral: {
      border: "rgba(255,255,255,0.18)",
      color: "white",
    },
    saving: {
      border: "rgba(114,179,255,0.5)",
      color: "#dceeff",
    },
    success: {
      border: "rgba(122,209,151,0.5)",
      color: "#dff8e7",
    },
    error: {
      border: "rgba(255,122,122,0.55)",
      color: "#ffe3e3",
    },
  };
  const style = palette[tone] ?? palette.neutral;
  playerSaveStatusBadge.textContent = text;
  playerSaveStatusBadge.style.borderColor = style.border;
  playerSaveStatusBadge.style.color = style.color;
  playerSaveStatusBadge.style.opacity = isServerBackedWalletSession() ? "1" : "0";
  playerSaveStatusBadge.style.transform = isServerBackedWalletSession()
    ? "translateY(0)"
    : "translateY(4px)";
  if (!persist) hidePlayerSaveStatus();
}

let controls = null;

let frontierBuildOverlay = null;
let frontierBuildWin = null;
let frontierBuildOpen = false;


function updateWalletUi() {
  const loggedIn = walletAuth.authenticated;
  walletLoginOverlay.style.display = loggedIn ? "none" : "flex";
  walletHud.style.display = "none";
  walletHudAddress.textContent = loggedIn
    ? `${shortenWalletAddress(walletAuth.address)}`
    : "";
  walletHudChain.textContent = formatWalletChainLabel(walletAuth.chainId);
  walletHudNickname.textContent = hasNickname()
    ? `닉네임: ${walletProfile.nickname}`
    : "닉네임: 설정 필요";
  if (equipProfileAddress) {
    equipProfileAddress.textContent = loggedIn
      ? shortenWalletAddress(walletAuth.address)
      : "로그인 필요";
  }
  if (equipProfileChain) {
    equipProfileChain.textContent = formatWalletChainLabel(walletAuth.chainId);
  }
  if (equipProfileNickname) {
    equipProfileNickname.textContent = hasNickname()
      ? `닉네임: ${walletProfile.nickname}`
      : "닉네임: 설정 필요";
  }
  if (equipProfileLogoutBtn) {
    equipProfileLogoutBtn.style.display = loggedIn ? "inline-flex" : "none";
  }
  if (equipProfileCopyBtn) {
    equipProfileCopyBtn.style.display = loggedIn ? "inline-flex" : "none";
    equipProfileCopyBtn.disabled = !loggedIn;
    if (!loggedIn) equipProfileCopyBtn.textContent = "복사";
  }
  walletNicknameInput.value = walletProfile.nickname;
  walletLoginStatus.textContent = loggedIn
    ? isGuestSession()
      ? "게스트 계정으로 입장했습니다."
      : `${shortenWalletAddress(walletAuth.address)} 주소로 로그인되었습니다.`
    : "메타마스크 연결을 기다리는 중입니다.";
  walletDevBypassBtn.style.display = DEV_PRESET_ENABLED ? "inline-flex" : "none";
  devProfileSwitcher.style.display = isDevSession() ? "flex" : "none";
  for (const profileId of DEV_PROFILE_IDS) {
    const btn = devProfileButtons[profileId];
    if (!btn) continue;
    const active = isDevSession() && sanitizeDevProfileId(activeDevProfileId) === profileId;
    btn.style.background = active ? "rgba(255,183,77,0.92)" : "rgba(255,255,255,0.08)";
    btn.style.borderColor = active ? "rgba(255,214,148,0.88)" : "rgba(255,255,255,0.16)";
    btn.style.color = active ? "#3d2505" : "white";
  }
  walletNicknameOverlay.style.display = loggedIn && !hasNickname() ? "flex" : "none";
  if (!isServerBackedWalletSession()) {
    nftExhibitSelectionOpen = false;
  }
  updateNftBoardSelectionUi();
  playerSaveStatusBadge.style.opacity = isServerBackedWalletSession() ? playerSaveStatusBadge.style.opacity : "0";
  if (typeof controls !== "undefined" && controls) {
    controls.enabled = canPlayGame();
  }
  scheduleNftExhibitBoardRefresh();
}

function getChainDisplayName(chainId) {
  const normalized = typeof chainId === "string" ? chainId.toLowerCase() : "";
  switch (normalized) {
    case "0x1":
      return "Ethereum Mainnet";
    case "0x89":
      return "Polygon Mainnet";
    case "0x2105":
      return "Base";
    case "0x38":
      return "BNB Smart Chain";
    case "0xa":
      return "Optimism";
    case "0xa4b1":
      return "Arbitrum One";
    default:
      return null;
  }
}

function formatWalletChainLabel(chainId) {
  if (!chainId) return "체인: 확인 전";
  const displayName = getChainDisplayName(chainId);
  return displayName ? `체인: ${displayName} (${chainId})` : `체인: ${chainId}`;
}

async function copyWalletAddressToClipboard() {
  if (!walletAuth.address) return;
  try {
    await navigator.clipboard.writeText(walletAuth.address);
    if (equipProfileCopyBtn) {
      equipProfileCopyBtn.textContent = "복사됨";
      window.setTimeout(() => {
        if (equipProfileCopyBtn) equipProfileCopyBtn.textContent = "복사";
      }, 1000);
    }
  } catch {
    showUI("지갑 주소 복사에 실패했습니다.", 1200);
    lastMessageUntil = performance.now() + 1200;
  }
}

function setWalletAuthState(nextState, { persist = true } = {}) {
  walletAuth.authenticated = Boolean(nextState.authenticated);
  walletAuth.address = nextState.address ?? "";
  walletAuth.signature = nextState.signature ?? "";
  walletAuth.nonce = nextState.nonce ?? "";
  walletAuth.issuedAt = nextState.issuedAt ?? "";
  walletAuth.chainId = nextState.chainId ?? "";
  walletAuth.token = nextState.token ?? "";
  walletAuth.sessionType = nextState.sessionType ?? "";
  if (isDevSession()) {
    const profileId = sanitizeDevProfileId(nextState.devProfileId ?? walletAuth.address ?? activeDevProfileId);
    activeDevProfileId = profileId;
    walletAuth.address = profileId;
    walletProfile.nickname = nextState.nickname ?? getDevProfileDisplayName(profileId);
  } else if (isGuestSession()) {
    walletProfile.nickname = nextState.nickname ?? "";
  } else {
    walletProfile.nickname = nextState.nickname ?? "";
  }
  if (persist) saveWalletSession();
  updateWalletUi();
}

function clearWalletSession() {
  setWalletAuthState(
    {
      authenticated: false,
      address: "",
      signature: "",
      nonce: "",
      issuedAt: "",
      chainId: "",
      token: "",
      sessionType: "",
    },
    { persist: true }
  );
  walletProfile.nickname = "";
  playerSaveSyncPaused = false;
  resetPlayerSaveProtectionState();
  if (playerSaveStatusTimer) {
    clearTimeout(playerSaveStatusTimer);
    playerSaveStatusTimer = null;
  }
  playerSaveStatusBadge.style.opacity = "0";
  playerSaveStatusBadge.style.transform = "translateY(4px)";
  nftExhibitSelectionOpen = false;
  nftExhibitSelectionLoading = false;
  nftExhibitSelectionStatus = "";
  nftExhibitOwnedTokens = [];
  nftExhibitOwnedTokensCache = {
    walletAddress: "",
    chainId: "",
    contractAddress: "",
    items: [],
    fetchedAt: 0,
  };
  updateNftBoardSelectionUi();
  updateWalletUi();
}

function isWalletAuthenticated() {
  return walletAuth.authenticated;
}

function shouldResetAuthSessionOnLocalReload() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function restoreWalletSession() {
  try {
    const raw = localStorage.getItem(WALLET_SESSION_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    const isGuestSaved = saved?.sessionType === "guest" || saved?.address === "guest-local";
    if (!saved?.authenticated || !saved?.address || (!saved?.token && !isGuestSaved)) return;
    setWalletAuthState(saved, { persist: false });
    if (saved?.sessionType === "wallet") {
      beginPlayerSaveHydration();
      applyFreshPlayerStartState();
    } else if (isGuestSaved) {
      applyFreshPlayerStartState();
    }
  } catch {
    localStorage.removeItem(WALLET_SESSION_KEY);
  }
}

function loadActiveLocalProfileState() {
  const saveKey = getActivePlayerSaveKey();
  if (!saveKey) return false;
  try {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return false;
    applySerializedPlayerSave(JSON.parse(raw), { preserveSharedWorld: isDevSession() });
    return true;
  } catch {
    localStorage.removeItem(saveKey);
    return false;
  }
}

function initializeDevProfileState(preferredProfileId = "") {
  const rawProfile = localStorage.getItem(DEV_ACTIVE_PROFILE_KEY);
  activeDevProfileId = sanitizeDevProfileId(preferredProfileId || rawProfile || activeDevProfileId);
  resetPlayerSaveProtectionState();
  playerSaveSyncPaused = false;
  setWalletAuthState(
    {
      authenticated: true,
      address: activeDevProfileId,
      signature: "",
      nonce: "",
      issuedAt: new Date().toISOString(),
      chainId: "development",
      token: "",
      sessionType: "dev",
      nickname: getDevProfileDisplayName(activeDevProfileId),
      devProfileId: activeDevProfileId,
    },
    { persist: false }
  );
  const sharedWorld = loadSharedWorldStateFromLocal();
  applySharedWorldState(sharedWorld);
  const loaded = loadActiveLocalProfileState();
  if (!loaded) {
    applyFreshPlayerStartState();
    applySharedWorldState(sharedWorld);
    applyDevPreset();
    saveActiveLocalProfileState();
    saveSharedWorldStateToLocal();
  }
  localStorage.setItem(DEV_ACTIVE_PROFILE_KEY, activeDevProfileId);
  walletLoginStatus.textContent = `${getDevProfileDisplayName(activeDevProfileId)}로 개발자 모드에 입장했습니다.`;
}

function switchDevProfile(profileId) {
  if (!isDevSession()) return;
  const nextProfileId = sanitizeDevProfileId(profileId);
  if (nextProfileId === activeDevProfileId) return;
  saveActiveLocalProfileState();
  saveSharedWorldStateToLocal();
  localStorage.setItem(DEV_ACTIVE_PROFILE_KEY, nextProfileId);
  initializeDevProfileState(nextProfileId);
}

async function hydrateWalletSessionFromServer() {
  if (
    !walletAuth.authenticated ||
    !walletAuth.token ||
    isDevSession() ||
    isGuestSession()
  ) {
    return;
  }

  walletLoginStatus.textContent = "로그인 세션을 확인하는 중입니다...";
  beginPlayerSaveHydration();
  const meResponse = await apiFetchJson("/auth/me", {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!meResponse.ok) {
    blockPlayerSaveBaseline("저장된 세션을 확인하지 못했습니다. 다시 로그인해주세요.");
    clearWalletSession();
    walletLoginStatus.textContent = "저장된 세션이 만료되었습니다. 다시 로그인해주세요.";
    return;
  }

  setWalletAuthState(
    {
      authenticated: true,
      address: meResponse.data.user?.walletAddress ?? walletAuth.address,
      signature: walletAuth.signature,
      nonce: walletAuth.nonce,
      issuedAt: walletAuth.issuedAt,
      chainId: walletAuth.chainId,
      token: walletAuth.token,
      nickname: meResponse.data.user?.nickname ?? "",
    },
    { persist: true }
  );
  applyFreshPlayerStartState();
  await hydratePlayerSaveFromServer();
  playerSaveSyncPaused = !hasConfirmedPlayerSaveBaseline();
}

function bindWalletProviderEvents() {
  if (!window.ethereum || walletAuth.providerBound) return;
  walletAuth.providerBound = true;
  window.ethereum.on?.("accountsChanged", (accounts) => {
    const next = accounts?.[0] ?? "";
    if (!next) {
      clearWalletSession();
      walletLoginStatus.textContent = "지갑 연결이 해제되었습니다. 다시 로그인해주세요.";
      return;
    }
    if (
      walletAuth.authenticated &&
      walletAuth.address &&
      walletAuth.address.toLowerCase() !== next.toLowerCase()
    ) {
      clearWalletSession();
      walletLoginStatus.textContent = "지갑 주소가 변경되었습니다. 새 주소로 다시 로그인해주세요.";
    }
  });
  window.ethereum.on?.("chainChanged", (chainId) => {
    walletAuth.chainId = chainId ?? "";
    saveWalletSession();
    updateWalletUi();
  });
}

async function connectWalletLogin() {
  if (!window.ethereum) {
    walletLoginStatus.textContent = "메타마스크가 설치되어 있지 않습니다. 브라우저 확장 프로그램을 먼저 설치해주세요.";
    return;
  }

  walletConnectBtn.disabled = true;
  walletConnectBtn.style.opacity = "0.65";
  walletLoginStatus.textContent = "지갑 연결과 서명을 요청하는 중입니다...";

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const address = accounts?.[0];
    if (!address) throw new Error("지갑 주소를 불러오지 못했습니다.");

    const nonceResponse = await apiFetchJson("/auth/nonce", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
    if (!nonceResponse.ok) {
      throw new Error(nonceResponse.error);
    }

    const nonce = nonceResponse.data.nonce;
    const issuedAt = nonceResponse.data.issuedAt;
    const message = nonceResponse.data.message || getWalletLoginMessage(address, nonce, issuedAt);
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });
    const chainId = await window.ethereum
      .request({ method: "eth_chainId" })
      .catch(() => "");

    const verifyResponse = await apiFetchJson("/auth/verify", {
      method: "POST",
      body: JSON.stringify({
        address,
        nonce,
        signature,
      }),
    });
    if (!verifyResponse.ok) {
      throw new Error(verifyResponse.error);
    }

    setWalletAuthState({
      authenticated: true,
      address,
      signature,
      nonce,
      issuedAt,
      chainId,
      token: verifyResponse.data.token,
      sessionType: "wallet",
      nickname: verifyResponse.data.user?.nickname ?? "",
    });
    beginPlayerSaveHydration();
    applyFreshPlayerStartState();
    await hydratePlayerSaveFromServer();
    playerSaveSyncPaused = !hasConfirmedPlayerSaveBaseline();
    walletLoginStatus.textContent = `${shortenWalletAddress(address)} 주소로 서명이 완료되었습니다.`;
  } catch (error) {
    blockPlayerSaveBaseline();
    playerSaveSyncPaused = false;
    walletLoginStatus.textContent = `로그인 실패: ${error?.message ?? "사용자 취소 또는 지갑 오류"}`;
  } finally {
    walletConnectBtn.disabled = false;
    walletConnectBtn.style.opacity = "1";
  }
}

walletConnectBtn.addEventListener("click", () => {
  connectWalletLogin();
});

walletGuestBtn.addEventListener("click", () => {
  setWalletAuthState(
    {
      authenticated: true,
      address: "guest-local",
      signature: "",
      nonce: "",
      issuedAt: new Date().toISOString(),
      chainId: "guest",
      token: "",
      sessionType: "guest",
      nickname: "",
    },
    { persist: true }
  );
  applyFreshPlayerStartState();
  walletLoginStatus.textContent = "게스트 계정으로 입장했습니다. 닉네임을 설정해주세요.";
});

walletDevBypassBtn.addEventListener("click", () => {
  initializeDevProfileState();
});

for (const profileId of DEV_PROFILE_IDS) {
  devProfileButtons[profileId]?.addEventListener("click", () => {
    switchDevProfile(profileId);
  });
}

async function commitNickname() {
  const nickname = walletNicknameInput.value.trim();
  const error = validateNickname(nickname);
  if (error) {
    walletNicknameStatus.textContent = error;
    return;
  }

  if (isLocalProfileSession()) {
    walletProfile.nickname = nickname;
    walletNicknameStatus.textContent = "";
    saveWalletSession();
    updateWalletUi();
    showUI(`닉네임 설정 완료: ${nickname}`, 1000);
    lastMessageUntil = performance.now() + 1000;
    return;
  }

  walletNicknameSaveBtn.disabled = true;
  walletNicknameSaveBtn.style.opacity = "0.65";
  walletNicknameStatus.textContent = "닉네임을 서버에 저장하는 중입니다...";

  const response = await apiFetchJson("/auth/nickname", {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ nickname }),
  });

  walletNicknameSaveBtn.disabled = false;
  walletNicknameSaveBtn.style.opacity = "1";

  if (!response.ok) {
    walletNicknameStatus.textContent = response.error;
    return;
  }

  walletProfile.nickname = response.data.user?.nickname ?? nickname;
  walletNicknameStatus.textContent = "";
  saveWalletSession();
  updateWalletUi();
  schedulePlayerSaveSync(true);
  showUI(`닉네임 설정 완료: ${walletProfile.nickname}`, 1000);
  lastMessageUntil = performance.now() + 1000;
}

walletNicknameSaveBtn.addEventListener("click", () => {
  commitNickname();
});

walletNicknameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    commitNickname();
  }
});

nftBoardCloseBtn.addEventListener("click", () => {
  closeNftBoardSelectionOverlay();
});

nftBoardOverlay.addEventListener("click", (e) => {
  if (e.target === nftBoardOverlay) {
    closeNftBoardSelectionOverlay();
  }
});

mansionSleepOverlay = document.createElement("div");
mansionSleepOverlay.style.position = "fixed";
mansionSleepOverlay.style.inset = "0";
mansionSleepOverlay.style.background = "rgba(228,236,244,0.24)";
mansionSleepOverlay.style.backdropFilter = "blur(7px)";
mansionSleepOverlay.style.display = "none";
mansionSleepOverlay.style.pointerEvents = "auto";
mansionSleepOverlay.style.zIndex = "1000005";
uiLayer.appendChild(mansionSleepOverlay);

mansionSleepDialog = document.createElement("div");
mansionSleepDialog.style.position = "fixed";
mansionSleepDialog.style.left = "50%";
mansionSleepDialog.style.top = "50%";
mansionSleepDialog.style.transform = "translate(-50%, -50%)";
mansionSleepDialog.style.width = "min(360px, calc(100vw - 36px))";
mansionSleepDialog.style.background = "rgba(248,248,248,0.97)";
mansionSleepDialog.style.border = "1px solid rgba(0,0,0,0.18)";
mansionSleepDialog.style.borderRadius = "16px";
mansionSleepDialog.style.boxShadow = "0 18px 42px rgba(0,0,0,0.24)";
mansionSleepDialog.style.padding = "18px";
mansionSleepDialog.style.boxSizing = "border-box";
mansionSleepDialog.style.display = "none";
mansionSleepDialog.style.pointerEvents = "auto";
mansionSleepDialog.style.zIndex = "1000006";
uiLayer.appendChild(mansionSleepDialog);

const mansionSleepTitle = document.createElement("div");
mansionSleepTitle.textContent = "로그아웃하시겠습니까?";
mansionSleepTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
mansionSleepTitle.style.fontSize = "19px";
mansionSleepTitle.style.fontWeight = "800";
mansionSleepTitle.style.color = "#222";
mansionSleepDialog.appendChild(mansionSleepTitle);

const mansionSleepBody = document.createElement("div");
mansionSleepBody.textContent = "침대에 누워 쉬는 동안 excit에서 로그아웃합니다.";
mansionSleepBody.style.marginTop = "10px";
mansionSleepBody.style.fontFamily = "system-ui, -apple-system, sans-serif";
mansionSleepBody.style.fontSize = "14px";
mansionSleepBody.style.lineHeight = "1.55";
mansionSleepBody.style.color = "#555";
mansionSleepDialog.appendChild(mansionSleepBody);

const mansionSleepButtons = document.createElement("div");
mansionSleepButtons.style.display = "flex";
mansionSleepButtons.style.justifyContent = "flex-end";
mansionSleepButtons.style.gap = "10px";
mansionSleepButtons.style.marginTop = "18px";
mansionSleepDialog.appendChild(mansionSleepButtons);

const mansionWakeBtn = document.createElement("button");
mansionWakeBtn.textContent = "기상";
mansionWakeBtn.style.minWidth = "84px";
mansionWakeBtn.style.padding = "10px 12px";
mansionWakeBtn.style.borderRadius = "10px";
mansionWakeBtn.style.border = "1px solid rgba(0,0,0,0.18)";
mansionWakeBtn.style.background = "rgba(255,255,255,0.92)";
mansionWakeBtn.style.fontWeight = "700";
mansionWakeBtn.style.cursor = "pointer";
mansionSleepButtons.appendChild(mansionWakeBtn);

const mansionSleepConfirmBtn = document.createElement("button");
mansionSleepConfirmBtn.textContent = "취침";
mansionSleepConfirmBtn.style.minWidth = "88px";
mansionSleepConfirmBtn.style.padding = "10px 12px";
mansionSleepConfirmBtn.style.borderRadius = "10px";
mansionSleepConfirmBtn.style.border = "1px solid rgba(79,116,171,0.24)";
mansionSleepConfirmBtn.style.background = "linear-gradient(180deg, rgba(133,173,230,0.96), rgba(101,143,214,0.96))";
mansionSleepConfirmBtn.style.color = "#fff";
mansionSleepConfirmBtn.style.fontWeight = "800";
mansionSleepConfirmBtn.style.cursor = "pointer";
mansionSleepButtons.appendChild(mansionSleepConfirmBtn);

mansionSleepOverlay.addEventListener("click", closeMansionSleepDialog);
mansionWakeBtn.addEventListener("click", closeMansionSleepDialog);
mansionSleepConfirmBtn.addEventListener("click", () => {
  void confirmMansionSleepLogout();
});

window.addEventListener("keydown", (e) => {
  if (!nftExhibitSelectionOpen) return;
  if (getLogicalInputKey(e) === "escape") {
    e.preventDefault();
    closeNftBoardSelectionOverlay();
  }
});

window.addEventListener("keydown", (e) => {
  if (!quickUseAssignState) return;
  const key = getLogicalInputKey(e);
  if (key === "escape") {
    e.preventDefault();
    cancelQuickUseAssignment();
    return;
  }
  if (!QUICK_USE_ALLOWED_KEYS.includes(key)) return;
  e.preventDefault();
  quickUseAssignmentConsumedUntil = performance.now() + 120;
  commitQuickUseAssignment(key);
});

async function handleWalletLogout() {
  if (isServerBackedWalletSession()) {
    try {
      await pushPlayerSaveToServer();
    } catch {}
  }
  clearWalletSession();
  walletLoginStatus.textContent = "로그아웃되었습니다. 다시 메타마스크로 로그인해주세요.";
}

walletHudLogoutBtn.addEventListener("click", handleWalletLogout);

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
compassNeedle.style.position = "absolute";
compassNeedle.style.left = "50%";
compassNeedle.style.top = "50%";
compassNeedle.style.transform = "translate(-50%, -50%)";
compassNeedle.style.transformOrigin = "50% 72%";
compassNeedle.style.width = "0";
compassNeedle.style.height = "0";
compassNeedle.style.borderLeft = "7px solid transparent";
compassNeedle.style.borderRight = "7px solid transparent";
compassNeedle.style.borderBottom = "18px solid #ffde7a";
compassNeedle.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.35))";
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
invWin.style.height = "500px";
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
equipWin.style.height = "520px";
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

const questWin = document.createElement("div");
questWin.id = "questWindow";
questWin.style.position = "fixed";
questWin.style.right = "12px";
questWin.style.top = "12px";
questWin.style.width = "318px";
questWin.style.height = "420px";
questWin.style.background = "rgba(235, 235, 235, 0.92)";
questWin.style.border = "1px solid rgba(0,0,0,0.25)";
questWin.style.borderRadius = "10px";
questWin.style.boxShadow = "0 12px 30px rgba(0,0,0,0.25)";
questWin.style.backdropFilter = "blur(6px)";
questWin.style.display = "none";
questWin.style.pointerEvents = "auto";
questWin.style.userSelect = "none";
questWin.style.zIndex = "1000001";
questWin.style.overflow = "hidden";
uiLayer.appendChild(questWin);

const questHeader = document.createElement("div");
questHeader.style.padding = "10px";
questHeader.style.display = "flex";
questHeader.style.alignItems = "center";
questHeader.style.justifyContent = "space-between";
questHeader.style.gap = "10px";
questHeader.style.fontFamily = "system-ui, -apple-system, sans-serif";
questHeader.style.fontSize = "14px";
questHeader.style.fontWeight = "700";
questHeader.style.letterSpacing = "0.04em";
questHeader.style.color = "#222";
questHeader.style.borderBottom = "1px solid rgba(0,0,0,0.15)";
questHeader.style.background = "rgba(255,255,255,0.7)";
questHeader.style.cursor = "grab";

const questHeaderTitle = document.createElement("div");
questHeaderTitle.textContent = "QUEST";
questHeader.appendChild(questHeaderTitle);

const questArchiveToggleBtn = document.createElement("button");
questArchiveToggleBtn.type = "button";
questArchiveToggleBtn.textContent = "완료 보기";
questArchiveToggleBtn.style.padding = "6px 10px";
questArchiveToggleBtn.style.borderRadius = "999px";
questArchiveToggleBtn.style.border = "1px solid rgba(0,0,0,0.14)";
questArchiveToggleBtn.style.background = "rgba(255,255,255,0.9)";
questArchiveToggleBtn.style.color = "#444";
questArchiveToggleBtn.style.fontFamily = "system-ui, -apple-system, sans-serif";
questArchiveToggleBtn.style.fontSize = "12px";
questArchiveToggleBtn.style.fontWeight = "700";
questArchiveToggleBtn.style.cursor = "pointer";
questArchiveToggleBtn.style.pointerEvents = "auto";
questHeader.appendChild(questArchiveToggleBtn);

questWin.appendChild(questHeader);

const questBody = document.createElement("div");
questBody.style.padding = "14px";
questBody.style.height = "calc(100% - 44px)";
questBody.style.boxSizing = "border-box";
questBody.style.display = "flex";
questBody.style.flexDirection = "column";
questBody.style.gap = "12px";
questBody.style.overflowY = "auto";
questBody.style.overflowX = "hidden";
questBody.style.scrollbarWidth = "thin";
questBody.style.scrollbarColor = "rgba(140,140,140,0.75) rgba(255,255,255,0.2)";
questWin.appendChild(questBody);

const questTitle = document.createElement("div");
questTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
questTitle.style.fontSize = "18px";
questTitle.style.fontWeight = "800";
questTitle.style.color = "#222";
questBody.appendChild(questTitle);

const questDesc = document.createElement("div");
questDesc.style.padding = "12px";
questDesc.style.borderRadius = "10px";
questDesc.style.background = "rgba(255,255,255,0.92)";
questDesc.style.border = "1px solid rgba(0,0,0,0.12)";
questDesc.style.fontFamily = "system-ui, -apple-system, sans-serif";
questDesc.style.fontSize = "13px";
questDesc.style.lineHeight = "1.55";
questDesc.style.color = "#444";
questBody.appendChild(questDesc);

const questStepList = document.createElement("div");
questStepList.style.display = "grid";
questStepList.style.gap = "8px";
questBody.appendChild(questStepList);

const questFooter = document.createElement("div");
questFooter.style.marginTop = "auto";
questFooter.style.padding = "10px 12px";
questFooter.style.borderRadius = "10px";
questFooter.style.background = "rgba(255,255,255,0.88)";
questFooter.style.border = "1px solid rgba(0,0,0,0.12)";
questFooter.style.fontFamily = "system-ui, -apple-system, sans-serif";
questFooter.style.fontSize = "12px";
questFooter.style.lineHeight = "1.5";
questFooter.style.color = "#555";
questFooter.textContent = "Q 키로 퀘스트를 열고, Space 키로 튜토리얼 NPC와 대화할 수 있습니다.";
questBody.appendChild(questFooter);

const mapFade = document.createElement("div");
mapFade.style.position = "fixed";
mapFade.style.inset = "0";
mapFade.style.background = "rgba(10,12,16,0.0)";
mapFade.style.pointerEvents = "none";
mapFade.style.transition = "background 260ms ease";
mapFade.style.zIndex = "1000003";
uiLayer.appendChild(mapFade);

const pollutionOverlay = document.createElement("div");
pollutionOverlay.id = "pollutionOverlay";
pollutionOverlay.style.position = "fixed";
pollutionOverlay.style.inset = "0";
pollutionOverlay.style.background =
  "radial-gradient(circle at 50% 42%, rgba(255,255,255,0) 18%, rgba(244,246,248,0.22) 46%, rgba(229,234,239,0.58) 70%, rgba(214,220,226,0.94) 100%)";
pollutionOverlay.style.opacity = "0";
pollutionOverlay.style.pointerEvents = "none";
pollutionOverlay.style.transition = "opacity 220ms ease";
pollutionOverlay.style.backdropFilter = "blur(0px)";
pollutionOverlay.style.webkitBackdropFilter = "blur(0px)";
pollutionOverlay.style.maskImage =
  "radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 16%, rgba(0,0,0,0.28) 40%, rgba(0,0,0,0.88) 70%, rgba(0,0,0,1) 100%)";
pollutionOverlay.style.webkitMaskImage =
  "radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 16%, rgba(0,0,0,0.28) 40%, rgba(0,0,0,0.88) 70%, rgba(0,0,0,1) 100%)";
pollutionOverlay.style.zIndex = "999998";
uiLayer.appendChild(pollutionOverlay);

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
equipmentGrid.style.left = "12px";
equipmentGrid.style.right = "12px";
equipmentGrid.style.top = "12px";
equipmentGrid.style.bottom = "154px";
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

const equipProfileCard = document.createElement("div");
equipProfileCard.style.position = "absolute";
equipProfileCard.style.left = "12px";
equipProfileCard.style.right = "12px";
equipProfileCard.style.bottom = "12px";
equipProfileCard.style.minHeight = "118px";
equipProfileCard.style.borderRadius = "10px";
equipProfileCard.style.background = "rgba(255,255,255,0.92)";
equipProfileCard.style.border = "1px solid rgba(0,0,0,0.14)";
equipProfileCard.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
equipProfileCard.style.padding = "10px 12px";
equipProfileCard.style.boxSizing = "border-box";
equipProfileCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
equipProfileCard.style.display = "grid";
equipProfileCard.style.gridTemplateColumns = "1fr auto";
equipProfileCard.style.gap = "8px 12px";
equipProfileCard.style.alignItems = "center";
equipBody.appendChild(equipProfileCard);

const equipProfileTitle = document.createElement("div");
equipProfileTitle.textContent = "WALLET";
equipProfileTitle.style.fontSize = "11px";
equipProfileTitle.style.fontWeight = "800";
equipProfileTitle.style.letterSpacing = "0.06em";
equipProfileTitle.style.color = "rgba(70,70,70,0.88)";
equipProfileCard.appendChild(equipProfileTitle);

equipProfileLogoutBtn = document.createElement("button");
equipProfileLogoutBtn.type = "button";
equipProfileLogoutBtn.textContent = "로그아웃";
equipProfileLogoutBtn.style.justifySelf = "end";
equipProfileLogoutBtn.style.padding = "6px 10px";
equipProfileLogoutBtn.style.borderRadius = "999px";
equipProfileLogoutBtn.style.border = "1px solid rgba(0,0,0,0.14)";
equipProfileLogoutBtn.style.background = "rgba(255,255,255,0.95)";
equipProfileLogoutBtn.style.color = "#333";
equipProfileLogoutBtn.style.cursor = "pointer";
equipProfileLogoutBtn.style.fontSize = "12px";
equipProfileLogoutBtn.style.fontWeight = "700";
equipProfileCard.appendChild(equipProfileLogoutBtn);
equipProfileLogoutBtn.addEventListener("click", handleWalletLogout);

const equipProfileInfo = document.createElement("div");
equipProfileInfo.style.gridColumn = "1 / span 2";
equipProfileInfo.style.display = "grid";
equipProfileInfo.style.gap = "4px";
equipProfileCard.appendChild(equipProfileInfo);

const equipProfileAddressRow = document.createElement("div");
equipProfileAddressRow.style.display = "flex";
equipProfileAddressRow.style.alignItems = "center";
equipProfileAddressRow.style.justifyContent = "space-between";
equipProfileAddressRow.style.gap = "8px";
equipProfileInfo.appendChild(equipProfileAddressRow);

equipProfileAddress = document.createElement("div");
equipProfileAddress.style.fontSize = "14px";
equipProfileAddress.style.fontWeight = "800";
equipProfileAddress.style.color = "#222";
equipProfileAddress.style.minWidth = "0";
equipProfileAddressRow.appendChild(equipProfileAddress);

equipProfileCopyBtn = document.createElement("button");
equipProfileCopyBtn.type = "button";
equipProfileCopyBtn.textContent = "복사";
equipProfileCopyBtn.style.flex = "0 0 auto";
equipProfileCopyBtn.style.padding = "5px 9px";
equipProfileCopyBtn.style.borderRadius = "999px";
equipProfileCopyBtn.style.border = "1px solid rgba(0,0,0,0.14)";
equipProfileCopyBtn.style.background = "rgba(255,255,255,0.95)";
equipProfileCopyBtn.style.color = "#333";
equipProfileCopyBtn.style.cursor = "pointer";
equipProfileCopyBtn.style.fontSize = "11px";
equipProfileCopyBtn.style.fontWeight = "700";
equipProfileAddressRow.appendChild(equipProfileCopyBtn);
equipProfileCopyBtn.addEventListener("click", () => {
  void copyWalletAddressToClipboard();
});

equipProfileChain = document.createElement("div");
equipProfileChain.style.fontSize = "12px";
equipProfileChain.style.color = "rgba(70,70,70,0.82)";
equipProfileInfo.appendChild(equipProfileChain);

equipProfileNickname = document.createElement("div");
equipProfileNickname.style.fontSize = "12px";
equipProfileNickname.style.fontWeight = "700";
equipProfileNickname.style.color = "#8b6b1b";
equipProfileInfo.appendChild(equipProfileNickname);

const forgeOverlay = document.createElement("div");
forgeOverlay.id = "forgeOverlay";
forgeOverlay.style.position = "fixed";
forgeOverlay.style.inset = "0";
forgeOverlay.style.background = "rgba(20, 24, 30, 0.3)";
forgeOverlay.style.backdropFilter = "blur(3px)";
forgeOverlay.style.display = "none";
forgeOverlay.style.pointerEvents = "auto";
forgeOverlay.style.zIndex = "1000001";
uiLayer.appendChild(forgeOverlay);

const forgeWin = document.createElement("div");
forgeWin.id = "forgeWindow";
forgeWin.style.position = "fixed";
forgeWin.style.left = "50%";
forgeWin.style.top = "50%";
forgeWin.style.transform = "translate(-50%, -50%)";
forgeWin.style.width = "min(620px, calc(100vw - 36px))";
forgeWin.style.minHeight = "430px";
forgeWin.style.background = "rgba(235, 235, 235, 0.96)";
forgeWin.style.border = "1px solid rgba(0,0,0,0.25)";
forgeWin.style.borderRadius = "14px";
forgeWin.style.boxShadow = "0 18px 42px rgba(0,0,0,0.28)";
forgeWin.style.backdropFilter = "blur(6px)";
forgeWin.style.boxSizing = "border-box";
forgeWin.style.display = "none";
forgeWin.style.pointerEvents = "auto";
forgeWin.style.userSelect = "none";
forgeWin.style.zIndex = "1000002";
forgeWin.style.overflow = "hidden";
uiLayer.appendChild(forgeWin);

const forgeHeader = document.createElement("div");
forgeHeader.style.display = "flex";
forgeHeader.style.alignItems = "center";
forgeHeader.style.justifyContent = "space-between";
forgeHeader.style.padding = "12px 14px";
forgeHeader.style.borderBottom = "1px solid rgba(0,0,0,0.15)";
forgeHeader.style.background = "rgba(255,255,255,0.7)";
forgeWin.appendChild(forgeHeader);

const forgeTitle = document.createElement("div");
forgeTitle.textContent = "곡괭이 강화";
forgeTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeTitle.style.fontSize = "18px";
forgeTitle.style.fontWeight = "800";
forgeTitle.style.color = "#222";
forgeHeader.appendChild(forgeTitle);

const forgeHeaderNote = document.createElement("div");
forgeHeaderNote.textContent = "대장간 모루";
forgeHeaderNote.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeHeaderNote.style.fontSize = "12px";
forgeHeaderNote.style.fontWeight = "700";
forgeHeaderNote.style.color = "rgba(70,70,70,0.78)";
forgeHeader.appendChild(forgeHeaderNote);

const forgeCloseBtn = document.createElement("button");
forgeCloseBtn.textContent = "닫기";
forgeCloseBtn.style.minWidth = "74px";
forgeCloseBtn.style.border = "1px solid rgba(0,0,0,0.18)";
forgeCloseBtn.style.borderRadius = "10px";
forgeCloseBtn.style.padding = "8px 10px";
forgeCloseBtn.style.fontSize = "13px";
forgeCloseBtn.style.fontWeight = "700";
forgeCloseBtn.style.cursor = "pointer";
forgeCloseBtn.style.background = "rgba(255,255,255,0.92)";
forgeCloseBtn.style.color = "#333";
forgeHeader.appendChild(forgeCloseBtn);

const forgeBody = document.createElement("div");
forgeBody.style.padding = "18px";
forgeBody.style.display = "grid";
forgeBody.style.gridTemplateRows = "auto auto 1fr auto";
forgeBody.style.gap = "14px";
forgeWin.appendChild(forgeBody);

const forgeHero = document.createElement("div");
forgeHero.style.display = "grid";
forgeHero.style.gridTemplateColumns = "1fr 150px 1fr";
forgeHero.style.alignItems = "center";
forgeHero.style.gap = "14px";
forgeBody.appendChild(forgeHero);

const forgeCurrentCard = document.createElement("div");
forgeCurrentCard.style.minHeight = "132px";
forgeCurrentCard.style.borderRadius = "12px";
forgeCurrentCard.style.background = "rgba(255,255,255,0.95)";
forgeCurrentCard.style.border = "1px solid rgba(0,0,0,0.18)";
forgeCurrentCard.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
forgeCurrentCard.style.padding = "14px";
forgeCurrentCard.style.boxSizing = "border-box";
forgeCurrentCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeHero.appendChild(forgeCurrentCard);

const forgeCenterCard = document.createElement("div");
forgeCenterCard.style.minHeight = "132px";
forgeCenterCard.style.borderRadius = "14px";
forgeCenterCard.style.background = "linear-gradient(180deg, rgba(255,194,105,0.22), rgba(255,156,64,0.12))";
forgeCenterCard.style.border = "1px solid rgba(255,162,68,0.38)";
forgeCenterCard.style.boxShadow = "0 0 0 3px rgba(255,186,90,0.14), inset 0 1px 0 rgba(255,255,255,0.7)";
forgeCenterCard.style.display = "flex";
forgeCenterCard.style.flexDirection = "column";
forgeCenterCard.style.alignItems = "center";
forgeCenterCard.style.justifyContent = "center";
forgeCenterCard.style.padding = "10px";
forgeHero.appendChild(forgeCenterCard);

const forgeChanceLabel = document.createElement("div");
forgeChanceLabel.textContent = "강화 실행";
forgeChanceLabel.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeChanceLabel.style.fontSize = "12px";
forgeChanceLabel.style.fontWeight = "700";
forgeChanceLabel.style.color = "rgba(88,66,34,0.76)";
forgeCenterCard.appendChild(forgeChanceLabel);

const forgeChanceValue = document.createElement("button");
forgeChanceValue.type = "button";
forgeChanceValue.style.marginTop = "10px";
forgeChanceValue.style.minWidth = "110px";
forgeChanceValue.style.border = "1px solid rgba(150,90,20,0.35)";
forgeChanceValue.style.borderRadius = "12px";
forgeChanceValue.style.padding = "14px 18px";
forgeChanceValue.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeChanceValue.style.fontSize = "32px";
forgeChanceValue.style.fontWeight = "900";
forgeChanceValue.style.color = "#7a4a12";
forgeChanceValue.style.background = "rgba(255,255,255,0.78)";
forgeChanceValue.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
forgeChanceValue.style.cursor = "pointer";
forgeChanceValue.style.transform = "translateY(0)";
forgeChanceValue.style.transition = "transform 90ms ease, box-shadow 90ms ease, background 90ms ease";
forgeCenterCard.appendChild(forgeChanceValue);

const forgeNextCard = document.createElement("div");
forgeNextCard.style.minHeight = "132px";
forgeNextCard.style.borderRadius = "12px";
forgeNextCard.style.background = "rgba(255,255,255,0.95)";
forgeNextCard.style.border = "1px solid rgba(0,0,0,0.18)";
forgeNextCard.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
forgeNextCard.style.padding = "14px";
forgeNextCard.style.boxSizing = "border-box";
forgeNextCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeHero.appendChild(forgeNextCard);

const forgeInfo = document.createElement("div");
forgeInfo.style.display = "grid";
forgeInfo.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
forgeInfo.style.gap = "10px";
forgeBody.appendChild(forgeInfo);

const forgeNotice = document.createElement("div");
forgeNotice.style.padding = "12px 14px";
forgeNotice.style.borderRadius = "10px";
forgeNotice.style.background = "rgba(255,255,255,0.9)";
forgeNotice.style.border = "1px solid rgba(0,0,0,0.12)";
forgeNotice.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeNotice.style.fontSize = "13px";
forgeNotice.style.lineHeight = "1.5";
forgeNotice.style.color = "#444";
forgeBody.appendChild(forgeNotice);

const refineryOverlay = document.createElement("div");
refineryOverlay.id = "refineryOverlay";
refineryOverlay.style.position = "fixed";
refineryOverlay.style.inset = "0";
refineryOverlay.style.background = "rgba(20, 24, 30, 0.3)";
refineryOverlay.style.backdropFilter = "blur(3px)";
refineryOverlay.style.display = "none";
refineryOverlay.style.pointerEvents = "auto";
refineryOverlay.style.zIndex = "1000001";
uiLayer.appendChild(refineryOverlay);

const refineryWin = document.createElement("div");
refineryWin.id = "refineryWindow";
refineryWin.style.position = "fixed";
refineryWin.style.left = "50%";
refineryWin.style.top = "50%";
refineryWin.style.transform = "translate(-50%, -50%)";
refineryWin.style.width = "min(700px, calc(100vw - 36px))";
refineryWin.style.minHeight = "420px";
refineryWin.style.background = "rgba(235, 235, 235, 0.96)";
refineryWin.style.border = "1px solid rgba(0,0,0,0.25)";
refineryWin.style.borderRadius = "14px";
refineryWin.style.boxShadow = "0 18px 42px rgba(0,0,0,0.28)";
refineryWin.style.backdropFilter = "blur(6px)";
refineryWin.style.boxSizing = "border-box";
refineryWin.style.display = "none";
refineryWin.style.pointerEvents = "auto";
refineryWin.style.userSelect = "none";
refineryWin.style.zIndex = "1000002";
refineryWin.style.overflow = "hidden";
uiLayer.appendChild(refineryWin);

const refineryHeader = document.createElement("div");
refineryHeader.style.display = "flex";
refineryHeader.style.alignItems = "center";
refineryHeader.style.justifyContent = "flex-start";
refineryHeader.style.gap = "12px";
refineryHeader.style.padding = "12px 14px";
refineryHeader.style.borderBottom = "1px solid rgba(0,0,0,0.15)";
refineryHeader.style.background = "rgba(255,255,255,0.7)";
refineryWin.appendChild(refineryHeader);

const refineryTitle = document.createElement("div");
refineryTitle.textContent = "재련소";
refineryTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
refineryTitle.style.fontSize = "18px";
refineryTitle.style.fontWeight = "800";
refineryTitle.style.color = "#222";
refineryTitle.style.marginRight = "auto";
refineryHeader.appendChild(refineryTitle);

const refineryHeaderNote = document.createElement("div");
refineryHeaderNote.textContent = "재료를 가공해 새로운 아이템을 만듭니다";
refineryHeaderNote.style.fontFamily = "system-ui, -apple-system, sans-serif";
refineryHeaderNote.style.fontSize = "12px";
refineryHeaderNote.style.fontWeight = "700";
refineryHeaderNote.style.color = "rgba(70,70,70,0.78)";
refineryHeader.appendChild(refineryHeaderNote);

const refineryCloseBtn = document.createElement("button");
refineryCloseBtn.textContent = "닫기";
refineryCloseBtn.style.minWidth = "74px";
refineryCloseBtn.style.border = "1px solid rgba(0,0,0,0.18)";
refineryCloseBtn.style.borderRadius = "10px";
refineryCloseBtn.style.padding = "8px 10px";
refineryCloseBtn.style.fontSize = "13px";
refineryCloseBtn.style.fontWeight = "700";
refineryCloseBtn.style.cursor = "pointer";
refineryCloseBtn.style.background = "rgba(255,255,255,0.92)";
refineryCloseBtn.style.color = "#333";
refineryHeader.appendChild(refineryCloseBtn);

const refineryBody = document.createElement("div");
refineryBody.style.padding = "18px";
refineryBody.style.display = "grid";
refineryBody.style.gridTemplateColumns = "220px minmax(0, 1fr)";
refineryBody.style.gap = "16px";
refineryWin.appendChild(refineryBody);

const refineryListPanel = document.createElement("div");
refineryListPanel.style.display = "flex";
refineryListPanel.style.flexDirection = "column";
refineryListPanel.style.gap = "10px";
refineryBody.appendChild(refineryListPanel);

const refineryListTitle = document.createElement("div");
refineryListTitle.textContent = "재련 목록";
refineryListTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
refineryListTitle.style.fontSize = "12px";
refineryListTitle.style.fontWeight = "800";
refineryListTitle.style.color = "rgba(70,70,70,0.76)";
refineryListPanel.appendChild(refineryListTitle);

const refineryRecipeList = document.createElement("div");
refineryRecipeList.style.display = "flex";
refineryRecipeList.style.flexDirection = "column";
refineryRecipeList.style.gap = "8px";
refineryListPanel.appendChild(refineryRecipeList);

const refineryDetailPanel = document.createElement("div");
refineryDetailPanel.style.display = "grid";
refineryDetailPanel.style.gridTemplateRows = "auto auto 1fr auto";
refineryDetailPanel.style.gap = "14px";
refineryBody.appendChild(refineryDetailPanel);

const refineryHero = document.createElement("div");
refineryHero.style.display = "grid";
refineryHero.style.gridTemplateColumns = "1fr 120px 1fr";
refineryHero.style.alignItems = "center";
refineryHero.style.gap = "14px";
refineryDetailPanel.appendChild(refineryHero);

const refineryInputCard = document.createElement("div");
const refineryOutputCard = document.createElement("div");
for (const card of [refineryInputCard, refineryOutputCard]) {
  card.style.minHeight = "156px";
  card.style.borderRadius = "12px";
  card.style.background = "rgba(255,255,255,0.95)";
  card.style.border = "1px solid rgba(0,0,0,0.18)";
  card.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
  card.style.padding = "14px";
  card.style.boxSizing = "border-box";
  card.style.fontFamily = "system-ui, -apple-system, sans-serif";
}
refineryHero.appendChild(refineryInputCard);

const refineryArrowCard = document.createElement("div");
refineryArrowCard.style.minHeight = "156px";
refineryArrowCard.style.borderRadius = "14px";
refineryArrowCard.style.background = "linear-gradient(180deg, rgba(255,194,105,0.22), rgba(255,156,64,0.12))";
refineryArrowCard.style.border = "1px solid rgba(255,162,68,0.38)";
refineryArrowCard.style.boxShadow = "0 0 0 3px rgba(255,186,90,0.14), inset 0 1px 0 rgba(255,255,255,0.7)";
refineryArrowCard.style.display = "flex";
refineryArrowCard.style.flexDirection = "column";
refineryArrowCard.style.alignItems = "center";
refineryArrowCard.style.justifyContent = "center";
refineryArrowCard.style.padding = "10px";
refineryHero.appendChild(refineryArrowCard);

const refineryArrowLabel = document.createElement("div");
refineryArrowLabel.textContent = "재련 결과";
refineryArrowLabel.style.fontFamily = "system-ui, -apple-system, sans-serif";
refineryArrowLabel.style.fontSize = "12px";
refineryArrowLabel.style.fontWeight = "700";
refineryArrowLabel.style.color = "rgba(88,66,34,0.76)";
refineryArrowCard.appendChild(refineryArrowLabel);

const refineryArrowValue = document.createElement("button");
refineryArrowValue.type = "button";
refineryArrowValue.textContent = "재련하기";
refineryArrowValue.style.marginTop = "12px";
refineryArrowValue.style.minWidth = "100px";
refineryArrowValue.style.border = "1px solid rgba(150,90,20,0.35)";
refineryArrowValue.style.borderRadius = "12px";
refineryArrowValue.style.padding = "14px 12px";
refineryArrowValue.style.fontFamily = "system-ui, -apple-system, sans-serif";
refineryArrowValue.style.fontSize = "20px";
refineryArrowValue.style.fontWeight = "900";
refineryArrowValue.style.color = "#7a4a12";
refineryArrowValue.style.background = "rgba(255,255,255,0.82)";
refineryArrowValue.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
refineryArrowValue.style.cursor = "pointer";
refineryArrowValue.style.transition = "transform 90ms ease, box-shadow 90ms ease, background 90ms ease";
refineryArrowCard.appendChild(refineryArrowValue);

refineryHero.appendChild(refineryOutputCard);

const refineryInfo = document.createElement("div");
refineryInfo.style.display = "grid";
refineryInfo.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
refineryInfo.style.gap = "10px";
refineryDetailPanel.appendChild(refineryInfo);

const refineryNotice = document.createElement("div");
refineryNotice.style.padding = "12px 14px";
refineryNotice.style.borderRadius = "10px";
refineryNotice.style.background = "rgba(255,255,255,0.9)";
refineryNotice.style.border = "1px solid rgba(0,0,0,0.12)";
refineryNotice.style.fontFamily = "system-ui, -apple-system, sans-serif";
refineryNotice.style.fontSize = "13px";
refineryNotice.style.lineHeight = "1.5";
refineryNotice.style.color = "#444";
refineryDetailPanel.appendChild(refineryNotice);


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
invBody.style.display = "flex";
invBody.style.flexDirection = "column";
invBody.style.gap = "10px";
invWin.appendChild(invBody);

// 스크롤 영역(슬롯 그리드)
const gridWrap = document.createElement("div");
gridWrap.style.flex = "1";
gridWrap.style.minHeight = "0";
gridWrap.style.overflowY = "auto";
gridWrap.style.paddingRight = "6px";
invBody.appendChild(gridWrap);

const invgrid = document.createElement("div");
invgrid.style.display = "grid";
invgrid.style.gridTemplateColumns = "repeat(5, 1fr)"; // 5칸 x 여러줄
invgrid.style.gap = "10px";
gridWrap.appendChild(invgrid);

const inventoryTrashRow = document.createElement("div");
inventoryTrashRow.style.display = "flex";
inventoryTrashRow.style.alignItems = "center";
inventoryTrashRow.style.justifyContent = "center";
inventoryTrashRow.style.minHeight = "64px";
inventoryTrashRow.style.paddingTop = "4px";
invBody.appendChild(inventoryTrashRow);

const inventoryTrashDropZone = document.createElement("div");
inventoryTrashDropZone.style.width = "100%";
inventoryTrashDropZone.style.minHeight = "52px";
inventoryTrashDropZone.style.borderRadius = "12px";
inventoryTrashDropZone.style.border = "2px dashed rgba(120,120,120,0.38)";
inventoryTrashDropZone.style.background = "rgba(255,255,255,0.72)";
inventoryTrashDropZone.style.display = "flex";
inventoryTrashDropZone.style.alignItems = "center";
inventoryTrashDropZone.style.justifyContent = "center";
inventoryTrashDropZone.style.gap = "10px";
inventoryTrashDropZone.style.fontFamily = "system-ui, -apple-system, sans-serif";
inventoryTrashDropZone.style.fontSize = "13px";
inventoryTrashDropZone.style.fontWeight = "800";
inventoryTrashDropZone.style.color = "#555";
inventoryTrashDropZone.style.transition = "background 120ms ease, border-color 120ms ease, transform 120ms ease";
inventoryTrashDropZone.textContent = "🗑️ 아이템을 여기로 드래그해 버리기";
inventoryTrashRow.appendChild(inventoryTrashDropZone);

const discardOverlay = document.createElement("div");
discardOverlay.style.position = "fixed";
discardOverlay.style.inset = "0";
discardOverlay.style.background = "rgba(16,18,22,0.28)";
discardOverlay.style.backdropFilter = "blur(3px)";
discardOverlay.style.display = "none";
discardOverlay.style.pointerEvents = "auto";
discardOverlay.style.zIndex = "1000003";
uiLayer.appendChild(discardOverlay);

const discardDialog = document.createElement("div");
discardDialog.style.position = "fixed";
discardDialog.style.left = "50%";
discardDialog.style.top = "50%";
discardDialog.style.transform = "translate(-50%, -50%)";
discardDialog.style.width = "min(340px, calc(100vw - 36px))";
discardDialog.style.background = "rgba(245,245,245,0.98)";
discardDialog.style.border = "1px solid rgba(0,0,0,0.18)";
discardDialog.style.borderRadius = "14px";
discardDialog.style.boxShadow = "0 18px 42px rgba(0,0,0,0.28)";
discardDialog.style.padding = "16px";
discardDialog.style.display = "none";
discardDialog.style.pointerEvents = "auto";
discardDialog.style.zIndex = "1000004";
discardDialog.style.boxSizing = "border-box";
uiLayer.appendChild(discardDialog);

const discardTitle = document.createElement("div");
discardTitle.textContent = "아이템 버리기";
discardTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
discardTitle.style.fontSize = "18px";
discardTitle.style.fontWeight = "800";
discardTitle.style.color = "#222";
discardDialog.appendChild(discardTitle);

const discardItemLabel = document.createElement("div");
discardItemLabel.style.marginTop = "10px";
discardItemLabel.style.fontFamily = "system-ui, -apple-system, sans-serif";
discardItemLabel.style.fontSize = "15px";
discardItemLabel.style.fontWeight = "700";
discardItemLabel.style.color = "#333";
discardDialog.appendChild(discardItemLabel);

const discardOwnedCount = document.createElement("div");
discardOwnedCount.style.marginTop = "6px";
discardOwnedCount.style.fontFamily = "system-ui, -apple-system, sans-serif";
discardOwnedCount.style.fontSize = "13px";
discardOwnedCount.style.color = "#666";
discardDialog.appendChild(discardOwnedCount);

const discardInputLabel = document.createElement("label");
discardInputLabel.textContent = "버릴 개수";
discardInputLabel.style.display = "block";
discardInputLabel.style.marginTop = "14px";
discardInputLabel.style.fontFamily = "system-ui, -apple-system, sans-serif";
discardInputLabel.style.fontSize = "13px";
discardInputLabel.style.fontWeight = "700";
discardInputLabel.style.color = "#444";
discardDialog.appendChild(discardInputLabel);

const discardCountInput = document.createElement("input");
discardCountInput.type = "number";
discardCountInput.min = "1";
discardCountInput.step = "1";
discardCountInput.style.marginTop = "8px";
discardCountInput.style.width = "100%";
discardCountInput.style.boxSizing = "border-box";
discardCountInput.style.padding = "10px 12px";
discardCountInput.style.borderRadius = "10px";
discardCountInput.style.border = "1px solid rgba(0,0,0,0.18)";
discardCountInput.style.fontFamily = "system-ui, -apple-system, sans-serif";
discardCountInput.style.fontSize = "15px";
discardCountInput.style.background = "rgba(255,255,255,0.96)";
discardDialog.appendChild(discardCountInput);

const discardError = document.createElement("div");
discardError.style.marginTop = "8px";
discardError.style.minHeight = "18px";
discardError.style.fontFamily = "system-ui, -apple-system, sans-serif";
discardError.style.fontSize = "12px";
discardError.style.fontWeight = "700";
discardError.style.color = "#c24c24";
discardDialog.appendChild(discardError);

const discardButtonRow = document.createElement("div");
discardButtonRow.style.display = "flex";
discardButtonRow.style.justifyContent = "flex-end";
discardButtonRow.style.gap = "10px";
discardButtonRow.style.marginTop = "16px";
discardDialog.appendChild(discardButtonRow);

const discardCancelBtn = document.createElement("button");
discardCancelBtn.type = "button";
discardCancelBtn.textContent = "취소";
discardCancelBtn.style.minWidth = "78px";
discardCancelBtn.style.padding = "9px 12px";
discardCancelBtn.style.borderRadius = "10px";
discardCancelBtn.style.border = "1px solid rgba(0,0,0,0.18)";
discardCancelBtn.style.background = "rgba(255,255,255,0.92)";
discardCancelBtn.style.cursor = "pointer";
discardCancelBtn.style.fontWeight = "700";
discardButtonRow.appendChild(discardCancelBtn);

const discardConfirmBtn = document.createElement("button");
discardConfirmBtn.type = "button";
discardConfirmBtn.textContent = "버리기";
discardConfirmBtn.style.minWidth = "86px";
discardConfirmBtn.style.padding = "9px 12px";
discardConfirmBtn.style.borderRadius = "10px";
discardConfirmBtn.style.border = "1px solid rgba(155,58,26,0.28)";
discardConfirmBtn.style.background = "linear-gradient(180deg, rgba(255,161,115,0.95), rgba(240,118,72,0.95))";
discardConfirmBtn.style.color = "white";
discardConfirmBtn.style.cursor = "pointer";
discardConfirmBtn.style.fontWeight = "800";
discardButtonRow.appendChild(discardConfirmBtn);

inventoryTrashDropZone.addEventListener("dragover", (event) => {
  if (!inventoryDraggedEntry) return;
  event.preventDefault();
  inventoryTrashDropZone.style.background = "rgba(255,231,214,0.96)";
  inventoryTrashDropZone.style.borderColor = "rgba(232,120,66,0.9)";
  inventoryTrashDropZone.style.transform = "scale(1.01)";
});

inventoryTrashDropZone.addEventListener("dragleave", () => {
  inventoryTrashDropZone.style.background = "rgba(255,255,255,0.72)";
  inventoryTrashDropZone.style.borderColor = "rgba(120,120,120,0.38)";
  inventoryTrashDropZone.style.transform = "scale(1)";
});

inventoryTrashDropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  inventoryTrashDropZone.style.background = "rgba(255,255,255,0.72)";
  inventoryTrashDropZone.style.borderColor = "rgba(120,120,120,0.38)";
  inventoryTrashDropZone.style.transform = "scale(1)";
  const entry = inventoryDraggedEntry;
  inventoryDraggedEntry = null;
  if (!entry) return;
  openDiscardDialog(entry);
});

discardOverlay.addEventListener("click", closeDiscardDialog);
discardCancelBtn.addEventListener("click", closeDiscardDialog);
discardConfirmBtn.addEventListener("click", commitDiscardDialog);
discardCountInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    commitDiscardDialog();
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeDiscardDialog();
  }
});

personalStorageOverlay = document.createElement("div");
personalStorageOverlay.style.position = "fixed";
personalStorageOverlay.style.inset = "0";
personalStorageOverlay.style.background = "rgba(16,18,22,0.34)";
personalStorageOverlay.style.backdropFilter = "blur(3px)";
personalStorageOverlay.style.display = "none";
personalStorageOverlay.style.pointerEvents = "auto";
personalStorageOverlay.style.zIndex = "1000003";
uiLayer.appendChild(personalStorageOverlay);

personalStorageWin = document.createElement("div");
personalStorageWin.style.position = "fixed";
personalStorageWin.style.left = "50%";
personalStorageWin.style.top = "50%";
personalStorageWin.style.transform = "translate(-50%, -50%)";
personalStorageWin.style.width = "min(860px, calc(100vw - 30px))";
personalStorageWin.style.height = "min(620px, calc(100vh - 40px))";
personalStorageWin.style.background = "rgba(246,246,246,0.98)";
personalStorageWin.style.border = "1px solid rgba(0,0,0,0.18)";
personalStorageWin.style.borderRadius = "18px";
personalStorageWin.style.boxShadow = "0 18px 42px rgba(0,0,0,0.28)";
personalStorageWin.style.display = "none";
personalStorageWin.style.pointerEvents = "auto";
personalStorageWin.style.zIndex = "1000004";
personalStorageWin.style.boxSizing = "border-box";
personalStorageWin.style.padding = "18px";
personalStorageWin.style.fontFamily = "system-ui, -apple-system, sans-serif";
personalStorageWin.style.overflow = "hidden";
uiLayer.appendChild(personalStorageWin);

const personalStorageHeader = document.createElement("div");
personalStorageHeader.style.display = "flex";
personalStorageHeader.style.alignItems = "center";
personalStorageHeader.style.justifyContent = "space-between";
personalStorageHeader.style.gap = "12px";
personalStorageWin.appendChild(personalStorageHeader);

const personalStorageTitle = document.createElement("div");
personalStorageTitle.textContent = "개인 창고";
personalStorageTitle.style.fontSize = "26px";
personalStorageTitle.style.fontWeight = "900";
personalStorageTitle.style.color = "#222";
personalStorageHeader.appendChild(personalStorageTitle);

const personalStorageCloseBtn = document.createElement("button");
personalStorageCloseBtn.type = "button";
personalStorageCloseBtn.textContent = "닫기";
personalStorageCloseBtn.style.padding = "8px 14px";
personalStorageCloseBtn.style.borderRadius = "999px";
personalStorageCloseBtn.style.border = "1px solid rgba(0,0,0,0.18)";
personalStorageCloseBtn.style.background = "rgba(255,255,255,0.9)";
personalStorageCloseBtn.style.fontWeight = "800";
personalStorageCloseBtn.style.cursor = "pointer";
personalStorageHeader.appendChild(personalStorageCloseBtn);

const personalStorageGuide = document.createElement("div");
personalStorageGuide.textContent = "아이템을 드래그해서 인벤토리와 개인 창고 사이로 옮길 수 있습니다.";
personalStorageGuide.style.marginTop = "8px";
personalStorageGuide.style.fontSize = "13px";
personalStorageGuide.style.fontWeight = "700";
personalStorageGuide.style.color = "#6a6a6a";
personalStorageWin.appendChild(personalStorageGuide);

const personalStorageMessage = document.createElement("div");
personalStorageMessage.style.marginTop = "8px";
personalStorageMessage.style.minHeight = "18px";
personalStorageMessage.style.fontSize = "12px";
personalStorageMessage.style.fontWeight = "800";
personalStorageMessage.style.color = "#c24c24";
personalStorageWin.appendChild(personalStorageMessage);

const personalStorageColumns = document.createElement("div");
personalStorageColumns.style.display = "grid";
personalStorageColumns.style.gridTemplateColumns = "1fr 1fr";
personalStorageColumns.style.gap = "16px";
personalStorageColumns.style.marginTop = "14px";
personalStorageColumns.style.height = "calc(100% - 100px)";
personalStorageWin.appendChild(personalStorageColumns);

const personalStorageTransferCurtain = document.createElement("div");
personalStorageTransferCurtain.style.position = "absolute";
personalStorageTransferCurtain.style.inset = "0";
personalStorageTransferCurtain.style.background = "rgba(18,22,28,0.32)";
personalStorageTransferCurtain.style.backdropFilter = "blur(2px)";
personalStorageTransferCurtain.style.display = "none";
personalStorageTransferCurtain.style.zIndex = "5";
personalStorageTransferCurtain.style.borderRadius = "18px";
personalStorageWin.appendChild(personalStorageTransferCurtain);

const personalStorageTransferDialog = document.createElement("div");
personalStorageTransferDialog.style.position = "absolute";
personalStorageTransferDialog.style.left = "50%";
personalStorageTransferDialog.style.top = "50%";
personalStorageTransferDialog.style.transform = "translate(-50%, -50%)";
personalStorageTransferDialog.style.width = "min(340px, calc(100% - 30px))";
personalStorageTransferDialog.style.padding = "18px";
personalStorageTransferDialog.style.borderRadius = "16px";
personalStorageTransferDialog.style.background = "rgba(255,255,255,0.98)";
personalStorageTransferDialog.style.border = "1px solid rgba(0,0,0,0.14)";
personalStorageTransferDialog.style.boxShadow = "0 14px 30px rgba(0,0,0,0.2)";
personalStorageTransferDialog.style.display = "none";
personalStorageTransferDialog.style.zIndex = "6";
personalStorageTransferDialog.style.pointerEvents = "auto";
personalStorageTransferDialog.style.boxSizing = "border-box";
personalStorageWin.appendChild(personalStorageTransferDialog);

const personalStorageTransferTitle = document.createElement("div");
personalStorageTransferTitle.style.fontSize = "22px";
personalStorageTransferTitle.style.fontWeight = "900";
personalStorageTransferTitle.style.color = "#232323";
personalStorageTransferDialog.appendChild(personalStorageTransferTitle);

const personalStorageTransferItemLabel = document.createElement("div");
personalStorageTransferItemLabel.style.marginTop = "8px";
personalStorageTransferItemLabel.style.fontSize = "15px";
personalStorageTransferItemLabel.style.fontWeight = "800";
personalStorageTransferItemLabel.style.color = "#444";
personalStorageTransferDialog.appendChild(personalStorageTransferItemLabel);

const personalStorageTransferOwnedCount = document.createElement("div");
personalStorageTransferOwnedCount.style.marginTop = "4px";
personalStorageTransferOwnedCount.style.fontSize = "12px";
personalStorageTransferOwnedCount.style.fontWeight = "700";
personalStorageTransferOwnedCount.style.color = "#767676";
personalStorageTransferDialog.appendChild(personalStorageTransferOwnedCount);

const personalStorageTransferInputLabel = document.createElement("label");
personalStorageTransferInputLabel.style.display = "block";
personalStorageTransferInputLabel.style.marginTop = "12px";
personalStorageTransferInputLabel.style.fontSize = "12px";
personalStorageTransferInputLabel.style.fontWeight = "800";
personalStorageTransferInputLabel.style.color = "#5f5f5f";
personalStorageTransferInputLabel.textContent = "옮길 개수";
personalStorageTransferDialog.appendChild(personalStorageTransferInputLabel);

const personalStorageTransferCountInput = document.createElement("input");
personalStorageTransferCountInput.type = "number";
personalStorageTransferCountInput.min = "1";
personalStorageTransferCountInput.step = "1";
personalStorageTransferCountInput.style.width = "100%";
personalStorageTransferCountInput.style.marginTop = "6px";
personalStorageTransferCountInput.style.padding = "10px 12px";
personalStorageTransferCountInput.style.borderRadius = "12px";
personalStorageTransferCountInput.style.border = "1px solid rgba(0,0,0,0.18)";
personalStorageTransferCountInput.style.fontSize = "16px";
personalStorageTransferCountInput.style.fontWeight = "800";
personalStorageTransferCountInput.style.boxSizing = "border-box";
personalStorageTransferDialog.appendChild(personalStorageTransferCountInput);

const personalStorageTransferError = document.createElement("div");
personalStorageTransferError.style.marginTop = "8px";
personalStorageTransferError.style.minHeight = "16px";
personalStorageTransferError.style.fontSize = "12px";
personalStorageTransferError.style.fontWeight = "800";
personalStorageTransferError.style.color = "#c24c24";
personalStorageTransferDialog.appendChild(personalStorageTransferError);

const personalStorageTransferActions = document.createElement("div");
personalStorageTransferActions.style.display = "flex";
personalStorageTransferActions.style.justifyContent = "flex-end";
personalStorageTransferActions.style.gap = "10px";
personalStorageTransferActions.style.marginTop = "14px";
personalStorageTransferDialog.appendChild(personalStorageTransferActions);

const personalStorageTransferCancelBtn = document.createElement("button");
personalStorageTransferCancelBtn.type = "button";
personalStorageTransferCancelBtn.textContent = "취소";
personalStorageTransferCancelBtn.style.padding = "10px 14px";
personalStorageTransferCancelBtn.style.borderRadius = "999px";
personalStorageTransferCancelBtn.style.border = "1px solid rgba(0,0,0,0.18)";
personalStorageTransferCancelBtn.style.background = "rgba(255,255,255,0.94)";
personalStorageTransferCancelBtn.style.fontWeight = "800";
personalStorageTransferCancelBtn.style.cursor = "pointer";
personalStorageTransferActions.appendChild(personalStorageTransferCancelBtn);

const personalStorageTransferConfirmBtn = document.createElement("button");
personalStorageTransferConfirmBtn.type = "button";
personalStorageTransferConfirmBtn.textContent = "이동";
personalStorageTransferConfirmBtn.style.padding = "10px 16px";
personalStorageTransferConfirmBtn.style.borderRadius = "999px";
personalStorageTransferConfirmBtn.style.border = "1px solid rgba(204,110,50,0.34)";
personalStorageTransferConfirmBtn.style.background = "rgba(255,166,82,0.96)";
personalStorageTransferConfirmBtn.style.color = "#2a1804";
personalStorageTransferConfirmBtn.style.fontWeight = "900";
personalStorageTransferConfirmBtn.style.cursor = "pointer";
personalStorageTransferActions.appendChild(personalStorageTransferConfirmBtn);

function createPersonalStoragePanel(titleText) {
  const panel = document.createElement("div");
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.minHeight = "0";
  panel.style.padding = "14px";
  panel.style.borderRadius = "16px";
  panel.style.background = "rgba(255,255,255,0.92)";
  panel.style.border = "1px solid rgba(0,0,0,0.12)";

  const title = document.createElement("div");
  title.textContent = titleText;
  title.style.fontSize = "18px";
  title.style.fontWeight = "900";
  title.style.color = "#2b2b2b";
  panel.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.style.marginTop = "4px";
  subtitle.style.fontSize = "12px";
  subtitle.style.fontWeight = "700";
  subtitle.style.color = "#777";
  panel.appendChild(subtitle);

  const wrap = document.createElement("div");
  wrap.style.flex = "1";
  wrap.style.minHeight = "0";
  wrap.style.overflowY = "auto";
  wrap.style.marginTop = "12px";
  panel.appendChild(wrap);

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(5, 1fr)";
  grid.style.gap = "10px";
  wrap.appendChild(grid);

  return { panel, subtitle, grid };
}

const inventoryStoragePanel = createPersonalStoragePanel("인벤토리");
const personalStoragePanel = createPersonalStoragePanel("개인 창고");
personalStorageColumns.appendChild(inventoryStoragePanel.panel);
personalStorageColumns.appendChild(personalStoragePanel.panel);

personalStorageOverlay.addEventListener("click", () => setPersonalStorageOpen(false));
personalStorageCloseBtn.addEventListener("click", () => setPersonalStorageOpen(false));
personalStorageTransferCurtain.addEventListener("click", () => closePersonalStorageTransferDialog());
personalStorageTransferCancelBtn.addEventListener("click", () => closePersonalStorageTransferDialog());
personalStorageTransferConfirmBtn.addEventListener("click", () => commitPersonalStorageTransferDialog());
personalStorageTransferCountInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    commitPersonalStorageTransferDialog();
  } else if (event.key === "Escape") {
    event.preventDefault();
    closePersonalStorageTransferDialog();
  }
});

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

function getRenderedModelPreviewDataUrl(cacheKey, buildModel, size = 40) {
  if (itemPreviewCache.has(cacheKey)) return itemPreviewCache.get(cacheKey);

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

  const model = buildModel();
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

function getItemPreviewDataUrl(itemId, size = 40) {
  const previewVariant = itemId === "pickaxe" ? `lv${inventory?.pickaxeLevel ?? 0}` : "base";
  const cacheKey = `${itemId}:${previewVariant}:${size}`;
  const def = ITEM_DEFS[itemId];
  if (!def?.makeInventoryModel) return null;
  return getRenderedModelPreviewDataUrl(cacheKey, () => def.makeInventoryModel(), size);
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

function getNftPreviewDataUrl(entry, size = 40) {
  if (!isNftInventoryEntry(entry)) return null;

  const cacheKey = `nft:${entry.contractAddress}:${entry.tokenId}:${size}`;
  if (entry.contractAddress === "0xMockHelmetCollection" && String(entry.tokenId) === "1") {
    return getRenderedModelPreviewDataUrl(cacheKey, () => buildSafetyHelmetModel("gold"), size);
  }

  return null;
}

function createInventoryEntryVisualElement(entry, options = {}) {
  if (isNftInventoryEntry(entry)) {
    const size = options.size ?? 40;
    const dataUrl = getNftPreviewDataUrl(entry, size);
    if (dataUrl) {
      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = getInventoryEntryDisplayName(entry);
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
    return createFallbackItemIcon(getInventoryEntryDisplayIcon(entry), Math.max(20, Math.round((options.size ?? 40) * 0.6)));
  }
  return createItemVisualElement(getSlotItemId(entry), options);
}

function createForgeUpgradeVisualElement(itemId, level, size = 54) {
  if (itemId === "pickaxe") {
    const cacheKey = `forge:${itemId}:lv${level}:${size}`;
    const dataUrl = getRenderedModelPreviewDataUrl(cacheKey, () => buildPickaxeModel(level), size);
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = ITEM_DEFS[itemId]?.name ?? itemId;
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

  return createItemVisualElement(itemId, { size });
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

    const category = getInventoryEntryCategory(s);
    if (!category) continue;

    const itemUI = structuredClone(s);

    if (category === "equip") {
      // 장비 탭: 빈 칸에 순서대로 배치
      const idx = inventorySlots.equip.findIndex((x) => x === null);
      if (idx !== -1) inventorySlots.equip[idx] = itemUI;
    } else if (category === "cons") {
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
      slot.draggable = true;
      slot.style.cursor = "grab";
      slot.addEventListener("dragstart", (event) => {
        inventoryDraggedEntry = item;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", getInventoryEntryDisplayName(item));
        }
        slot.style.opacity = "0.5";
      });
      slot.addEventListener("dragend", () => {
        inventoryDraggedEntry = null;
        slot.style.opacity = "1";
        inventoryTrashDropZone.style.background = "rgba(255,255,255,0.72)";
        inventoryTrashDropZone.style.borderColor = "rgba(120,120,120,0.38)";
        inventoryTrashDropZone.style.transform = "scale(1)";
      });

      const icon = createInventoryEntryVisualElement(item, { size: 38 });
      slot.appendChild(icon);

      if (!isNftInventoryEntry(item) && item.count && item.count > 1) {
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
        const itemId = getSlotItemId(item);
        const equipSlot = getInventoryEntryEquipSlot(item);
        const isEquipped = equipSlot
          ? isSameInventoryEntryAsEquipped(item, getEquippedItemRef(equipSlot))
          : false;

        // 장착된 아이템은 테두리 하이라이트
        if (isEquipTab && isEquipped) {
        slot.style.borderColor = "rgba(255,140,0,0.95)";
        slot.style.boxShadow = "0 0 0 3px rgba(255,140,0,0.35), inset 0 1px 0 rgba(255,255,255,0.8)";   
        }

        // 장비 탭에서만 클릭 가능하도록 커서/효과
        if (isEquipTab && equipSlot) {
        slot.style.cursor = "grab";

        slot.addEventListener("dblclick", () => {
        toggleEquipItem(item);
     });
        }   

        if (activeTab === "cons" && itemId === "freshAirCanister") {
        slot.style.cursor = "pointer";
        slot.addEventListener("dblclick", () => {
        useFreshAirCanister();
     });
        }

      if (activeTab === "cons" && isQuickUseAssignableEntry(item)) {
        const assignedKey = getAssignedQuickUseKeyForEntry(item);
        const isAssignPending = isQuickUseAssignPendingForEntry(item);
        const quickBtn = document.createElement("button");
        quickBtn.type = "button";
        quickBtn.textContent = assignedKey || "";
        quickBtn.style.position = "absolute";
        quickBtn.style.left = "4px";
        quickBtn.style.top = "4px";
        quickBtn.style.width = "18px";
        quickBtn.style.height = "18px";
        quickBtn.style.padding = "0";
        quickBtn.style.borderRadius = "999px";
        quickBtn.style.border = isAssignPending || assignedKey
          ? "1px solid rgba(255,160,60,0.95)"
          : "1px solid rgba(0,0,0,0.16)";
        quickBtn.style.background = isAssignPending || assignedKey
          ? "rgba(255,160,60,0.92)"
          : "rgba(255,255,255,0.88)";
        quickBtn.style.color = isAssignPending || assignedKey ? "#2f1700" : "#3f4650";
        quickBtn.style.fontSize = "10px";
        quickBtn.style.fontWeight = "800";
        quickBtn.style.cursor = "pointer";
        quickBtn.style.zIndex = "2";
        quickBtn.title = isAssignPending
          ? "1~5 중 원하는 키를 누르세요"
          : assignedKey
            ? `${assignedKey} 단축 해제`
            : "단축키 지정";
        quickBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          if (assignedKey && !isAssignPending) {
            clearQuickUseAssignmentForEntry(item);
            return;
          }
          beginQuickUseAssignment(item);
        });
        slot.appendChild(quickBtn);
      }

      if (isNftInventoryEntry(item)) {
        const nftBadge = document.createElement("div");
        nftBadge.textContent = "NFT";
        nftBadge.style.position = "absolute";
        nftBadge.style.left = "6px";
        nftBadge.style.top = "4px";
        nftBadge.style.fontSize = "10px";
        nftBadge.style.fontWeight = "800";
        nftBadge.style.padding = "2px 6px";
        nftBadge.style.borderRadius = "999px";
        nftBadge.style.background = "rgba(106, 76, 255, 0.88)";
        nftBadge.style.color = "white";
        nftBadge.style.pointerEvents = "none";
        slot.appendChild(nftBadge);
      }


      // 아주 가벼운 툴팁(hover)
      const tooltipText = getInventoryEntryTooltipText(item);
      slot.addEventListener("pointerenter", (e) => {
        showItemTooltip(tooltipText, e.clientX, e.clientY);
      });
      slot.addEventListener("pointermove", (e) => {
        showItemTooltip(tooltipText, e.clientX, e.clientY);
      });
      slot.addEventListener("pointerleave", () => {
        hideItemTooltip();
      });
     }

        invgrid.appendChild(slot);
     }
}

function setPersonalStorageOpen(v) {
  personalStorageOpen = v;
  if (!personalStorageOverlay || !personalStorageWin) return;
  personalStorageOverlay.style.display = v ? "block" : "none";
  personalStorageWin.style.display = v ? "block" : "none";
  if (!v) {
    closePersonalStorageTransferDialog();
    inventoryDragState = null;
    personalStorageMessage.textContent = "";
    hideItemTooltip();
  } else {
    renderPersonalStorageWindow();
  }
}

function closePersonalStorageTransferDialog() {
  personalStorageTransferState = null;
  if (!personalStorageTransferCurtain || !personalStorageTransferDialog) return;
  personalStorageTransferCurtain.style.display = "none";
  personalStorageTransferDialog.style.display = "none";
  personalStorageTransferError.textContent = "";
}

function openPersonalStorageTransferDialog(config) {
  if (!config || !config.entry) return false;
  const maxCount = Math.max(1, getSlotItemCount(config.entry));
  if (maxCount <= 1) return false;
  personalStorageTransferState = {
    ...config,
    maxCount,
  };
  personalStorageTransferTitle.textContent = config.target === "storage" ? "창고로 옮길 개수" : "인벤토리로 옮길 개수";
  personalStorageTransferItemLabel.textContent = getInventoryEntryDisplayName(config.entry);
  personalStorageTransferOwnedCount.textContent = `현재 개수: ${maxCount}`;
  personalStorageTransferCountInput.max = String(maxCount);
  personalStorageTransferCountInput.value = String(maxCount);
  personalStorageTransferError.textContent = "";
  personalStorageTransferCurtain.style.display = "block";
  personalStorageTransferDialog.style.display = "block";
  setTimeout(() => {
    personalStorageTransferCountInput.focus();
    personalStorageTransferCountInput.select();
  }, 0);
  return true;
}

function commitPersonalStorageTransferDialog() {
  if (!personalStorageTransferState) return false;
  const { target, entry, index, maxCount } = personalStorageTransferState;
  const rawCount = Number.parseInt(personalStorageTransferCountInput.value, 10);
  if (!Number.isFinite(rawCount) || rawCount < 1 || rawCount > maxCount) {
    personalStorageTransferError.textContent = `1 ~ ${maxCount} 사이의 숫자를 입력하세요.`;
    return false;
  }

  const result =
    target === "storage"
      ? moveInventoryEntryToStorage(entry, rawCount)
      : moveStorageEntryToInventory(index, rawCount);

  if (!result.ok) {
    personalStorageTransferError.textContent = result.reason;
    return false;
  }

  closePersonalStorageTransferDialog();
  personalStorageMessage.textContent = "";
  updateInventoryUI();
  schedulePlayerSaveSync(true);
  renderPersonalStorageWindow();
  return true;
}

function renderPersonalStorageWindow() {
  inventoryStoragePanel.subtitle.textContent = `보유 슬롯 ${inventory.slots.filter(Boolean).length}/${inventory.slots.length}`;
  personalStoragePanel.subtitle.textContent = `창고 슬롯 ${personalStorage.slots.filter(Boolean).length}/${personalStorage.slots.length}`;
  inventoryStoragePanel.grid.innerHTML = "";
  personalStoragePanel.grid.innerHTML = "";

  function decorateStorageSlot(slotEl, entry) {
    if (!entry) return;
    const icon = createInventoryEntryVisualElement(entry, { size: 38 });
    slotEl.appendChild(icon);
    if (!isNftInventoryEntry(entry) && getSlotItemCount(entry) > 1) {
      const badge = document.createElement("div");
      badge.textContent = String(getSlotItemCount(entry));
      badge.style.position = "absolute";
      badge.style.right = "6px";
      badge.style.bottom = "4px";
      badge.style.fontSize = "12px";
      badge.style.padding = "1px 6px";
      badge.style.borderRadius = "10px";
      badge.style.background = "rgba(0,0,0,0.65)";
      badge.style.color = "white";
      badge.style.pointerEvents = "none";
      slotEl.appendChild(badge);
    }
    const tooltipText = getInventoryEntryTooltipText(entry);
    slotEl.addEventListener("pointerenter", (e) => showItemTooltip(tooltipText, e.clientX, e.clientY));
    slotEl.addEventListener("pointermove", (e) => showItemTooltip(tooltipText, e.clientX, e.clientY));
    slotEl.addEventListener("pointerleave", hideItemTooltip);
  }

  for (let i = 0; i < inventory.slots.length; i += 1) {
    const slotEl = makeSlot();
    const entry = inventory.slots[i];
    if (entry) {
      slotEl.draggable = true;
      slotEl.style.cursor = "grab";
      slotEl.addEventListener("dragstart", (event) => {
        inventoryDragState = { source: "inventory", entry };
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", getInventoryEntryDisplayName(entry));
        }
        slotEl.style.opacity = "0.5";
      });
      slotEl.addEventListener("dragend", () => {
        inventoryDragState = null;
        slotEl.style.opacity = "1";
      });
      decorateStorageSlot(slotEl, entry);
    }
    inventoryStoragePanel.grid.appendChild(slotEl);
  }

  for (let i = 0; i < personalStorage.slots.length; i += 1) {
    const slotEl = makeSlot();
    const entry = personalStorage.slots[i];
    slotEl.addEventListener("dragover", (event) => {
      if (!inventoryDragState) return;
      event.preventDefault();
      slotEl.style.background = "rgba(255,239,219,0.96)";
      slotEl.style.borderColor = "rgba(232,120,66,0.9)";
    });
    slotEl.addEventListener("dragleave", () => {
      slotEl.style.background = "rgba(255,255,255,0.95)";
      slotEl.style.borderColor = "rgba(0,0,0,0.2)";
    });
    slotEl.addEventListener("drop", (event) => {
      event.preventDefault();
      slotEl.style.background = "rgba(255,255,255,0.95)";
      slotEl.style.borderColor = "rgba(0,0,0,0.2)";
      if (!inventoryDragState) return;
      if (inventoryDragState.source !== "inventory") {
        personalStorageMessage.textContent = "창고 안에서는 빈 인벤토리 칸으로만 다시 옮길 수 있습니다.";
        inventoryDragState = null;
        return;
      }
      const draggedEntry = inventoryDragState.entry;
      inventoryDragState = null;
      if (getSlotItemCount(draggedEntry) > 1) {
        openPersonalStorageTransferDialog({
          source: "inventory",
          target: "storage",
          entry: structuredClone(draggedEntry),
        });
      } else {
        const result = moveInventoryEntryToStorage(draggedEntry);
        personalStorageMessage.textContent = result.ok ? "" : result.reason;
        if (result.ok) {
          updateInventoryUI();
          schedulePlayerSaveSync(true);
        }
      }
      renderPersonalStorageWindow();
    });
    if (entry) {
      slotEl.draggable = true;
      slotEl.style.cursor = "grab";
      slotEl.addEventListener("dragstart", (event) => {
        inventoryDragState = { source: "storage", index: i, entry };
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", getInventoryEntryDisplayName(entry));
        }
        slotEl.style.opacity = "0.5";
      });
      slotEl.addEventListener("dragend", () => {
        inventoryDragState = null;
        slotEl.style.opacity = "1";
      });
      decorateStorageSlot(slotEl, entry);
    }
    personalStoragePanel.grid.appendChild(slotEl);
  }

  for (const child of inventoryStoragePanel.grid.children) {
    child.addEventListener("dragover", (event) => {
      if (!inventoryDragState || inventoryDragState.source !== "storage") return;
      event.preventDefault();
      child.style.background = "rgba(228,241,255,0.98)";
      child.style.borderColor = "rgba(92,145,228,0.86)";
    });
    child.addEventListener("dragleave", () => {
      child.style.background = "rgba(255,255,255,0.95)";
      child.style.borderColor = "rgba(0,0,0,0.2)";
    });
    child.addEventListener("drop", (event) => {
      event.preventDefault();
      child.style.background = "rgba(255,255,255,0.95)";
      child.style.borderColor = "rgba(0,0,0,0.2)";
      if (!inventoryDragState || inventoryDragState.source !== "storage") return;
      const draggedEntry = inventoryDragState.entry;
      const draggedIndex = inventoryDragState.index;
      inventoryDragState = null;
      if (getSlotItemCount(draggedEntry) > 1) {
        openPersonalStorageTransferDialog({
          source: "storage",
          target: "inventory",
          index: draggedIndex,
          entry: structuredClone(draggedEntry),
        });
      } else {
        const result = moveStorageEntryToInventory(draggedIndex);
        personalStorageMessage.textContent = result.ok ? "" : result.reason;
        if (result.ok) {
          updateInventoryUI();
          schedulePlayerSaveSync(true);
        }
      }
      renderPersonalStorageWindow();
    });
  }
}

// I 키로 인벤 열고닫기
let invOpen = false;
function setInvOpen(v) {
  if (v && frontierBuildOpen) {
    setFrontierBuildOpen(false);
  }
  invOpen = v;
  invWin.style.display = invOpen ? "block" : "none";
  equipWin.style.display = invOpen ? "block" : "none";
  if (!invOpen) {
    hideItemTooltip();
    inventoryDraggedEntry = null;
    inventoryDragState = null;
    closeDiscardDialog();
  }
  if (invOpen) renderInventoryWindow();
}

let questOpen = false;
let questDragState = null;
function setQuestOpen(v) {
  if (v && frontierBuildOpen) {
    setFrontierBuildOpen(false);
  }
  questOpen = v;
  questWin.style.display = questOpen ? "block" : "none";
  if (questOpen) renderQuestWindow();
}

questHeader.addEventListener("pointerdown", (e) => {
  if (e.target === questArchiveToggleBtn) return;
  const rect = questWin.getBoundingClientRect();
  questWin.style.left = `${rect.left}px`;
  questWin.style.top = `${rect.top}px`;
  questWin.style.right = "auto";

  questDragState = {
    pointerId: e.pointerId,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
  };
  questHeader.style.cursor = "grabbing";
  questHeader.setPointerCapture(e.pointerId);
});

questHeader.addEventListener("pointermove", (e) => {
  if (!questDragState || questDragState.pointerId !== e.pointerId) return;

  const maxLeft = window.innerWidth - questWin.offsetWidth - 8;
  const maxTop = window.innerHeight - questWin.offsetHeight - 8;
  const nextLeft = Math.max(8, Math.min(e.clientX - questDragState.offsetX, maxLeft));
  const nextTop = Math.max(8, Math.min(e.clientY - questDragState.offsetY, maxTop));

  questWin.style.left = `${nextLeft}px`;
  questWin.style.top = `${nextTop}px`;
});

function endQuestDrag(pointerId = null) {
  if (!questDragState) return;
  if (pointerId !== null && questDragState.pointerId !== pointerId) return;
  questDragState = null;
  questHeader.style.cursor = "grab";
}

questHeader.addEventListener("pointerup", (e) => {
  endQuestDrag(e.pointerId);
});

questHeader.addEventListener("pointercancel", (e) => {
  endQuestDrag(e.pointerId);
});

questArchiveToggleBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  questViewMode = questViewMode === "active" ? "completed" : "active";
  renderQuestWindow();
});

window.addEventListener("keydown", (e) => {
  if (!canPlayGame()) return;
  const logicalKey = getLogicalInputKey(e);
  if (logicalKey === "escape" && isUiEscapeCloseHandled()) {
    e.preventDefault();
    return;
  }
  if (personalStorageOpen) return;
  if (isTextInputActive()) return;
  if (invOpen && logicalKey === "tab") {
    e.preventDefault();
    const order = ["equip", "cons", "misc"];
    const currentIndex = Math.max(0, order.indexOf(activeTab));
    activeTab = order[(currentIndex + 1) % order.length];
    renderInventoryWindow();
    return;
  }
  if (nftExhibitSelectionOpen) return;
  if (quickUseAssignState) return;
  // 입력창 없으니 간단 처리
  const key = logicalKey;
  if (key === "i") {
    e.preventDefault();
    setInvOpen(!invOpen);
  }
  if (key === "q") {
    e.preventDefault();
    setQuestOpen(!questOpen);
  }
});

window.addEventListener("pagehide", () => {
  flushPlayerSaveOnExit();
});

window.addEventListener("beforeunload", () => {
  flushPlayerSaveOnExit();
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

const itemTooltip = document.createElement("div");
itemTooltip.id = "itemTooltip";
itemTooltip.style.position = "fixed";
itemTooltip.style.left = "0";
itemTooltip.style.top = "0";
itemTooltip.style.maxWidth = "180px";
itemTooltip.style.padding = "8px 10px";
itemTooltip.style.background = "rgba(20,20,20,0.9)";
itemTooltip.style.color = "white";
itemTooltip.style.fontFamily = "system-ui, -apple-system, sans-serif";
itemTooltip.style.fontSize = "12px";
itemTooltip.style.lineHeight = "1.45";
itemTooltip.style.borderRadius = "10px";
itemTooltip.style.border = "1px solid rgba(255,255,255,0.14)";
itemTooltip.style.boxShadow = "0 10px 24px rgba(0,0,0,0.22)";
itemTooltip.style.pointerEvents = "none";
itemTooltip.style.whiteSpace = "pre-line";
itemTooltip.style.zIndex = "1000002";
itemTooltip.style.display = "none";
uiLayer.appendChild(itemTooltip);

function showItemTooltip(text, clientX, clientY) {
  itemTooltip.textContent = text;
  itemTooltip.style.display = "block";

  const offset = 14;
  const maxX = window.innerWidth - itemTooltip.offsetWidth - 8;
  const maxY = window.innerHeight - itemTooltip.offsetHeight - 8;
  const x = Math.min(clientX + offset, maxX);
  const y = Math.min(clientY + offset, maxY);
  itemTooltip.style.left = `${Math.max(8, x)}px`;
  itemTooltip.style.top = `${Math.max(8, y)}px`;
}

function hideItemTooltip() {
  itemTooltip.style.display = "none";
}


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

const mapArrivalBanner = document.createElement("div");
mapArrivalBanner.style.position = "fixed";
mapArrivalBanner.style.left = "50%";
mapArrivalBanner.style.top = "36px";
mapArrivalBanner.style.transform = "translateX(-50%) translateY(-10px)";
mapArrivalBanner.style.padding = "12px 22px";
mapArrivalBanner.style.borderRadius = "14px";
mapArrivalBanner.style.background = "rgba(18,22,28,0.62)";
mapArrivalBanner.style.border = "1px solid rgba(255,255,255,0.16)";
mapArrivalBanner.style.backdropFilter = "blur(5px)";
mapArrivalBanner.style.boxShadow = "0 14px 32px rgba(0,0,0,0.22)";
mapArrivalBanner.style.color = "#fff6dc";
mapArrivalBanner.style.fontFamily = "system-ui, -apple-system, sans-serif";
mapArrivalBanner.style.fontSize = "28px";
mapArrivalBanner.style.fontWeight = "900";
mapArrivalBanner.style.letterSpacing = "0.04em";
mapArrivalBanner.style.pointerEvents = "none";
mapArrivalBanner.style.zIndex = "1000002";
mapArrivalBanner.style.opacity = "0";
mapArrivalBanner.style.transition = "opacity 260ms ease, transform 260ms ease";
uiLayer.appendChild(mapArrivalBanner);

let mapArrivalTimer = null;

function showMapArrivalBanner(mapName, ms = 1800) {
  mapArrivalBanner.textContent = mapName;
  mapArrivalBanner.style.opacity = "1";
  mapArrivalBanner.style.transform = "translateX(-50%) translateY(0)";

  if (mapArrivalTimer) {
    clearTimeout(mapArrivalTimer);
    mapArrivalTimer = null;
  }

  mapArrivalTimer = setTimeout(() => {
    mapArrivalBanner.style.opacity = "0";
    mapArrivalBanner.style.transform = "translateX(-50%) translateY(-10px)";
  }, ms);
}

// ===== HUD Messages (short, game-like) =====
const HUD_MSG = {
  NEED_PICKAXE: "⛏️ 필요",
  EQUIP_PICKAXE: "⛏️ 장착 필요",
  PICKAXE_EQUIPPED: "⛏️ 장착",
  PICKAXE_UNEQUIPPED: "⛏️ 해제",
  PICKAXE_GET: "⛏️ 곡괭이 획득!",
  HELMET_GET: "🪖 핼멧 획득!",
  MINE_KEY_GET: "🗝️ 폐광 열쇠 획득!",
  AIR_CAN_GET: "🫧 신선한 공기 캔 획득!",
};

const npcDialog = document.createElement("div");
npcDialog.style.position = "fixed";
npcDialog.style.left = "0";
npcDialog.style.top = "0";
npcDialog.style.transform = "translate(-50%, -100%)";
npcDialog.style.maxWidth = "min(460px, calc(100vw - 32px))";
npcDialog.style.padding = "12px 14px";
npcDialog.style.background = "rgba(255,255,255,0.94)";
npcDialog.style.border = "1px solid rgba(0,0,0,0.16)";
npcDialog.style.borderRadius = "14px";
npcDialog.style.boxShadow = "0 12px 26px rgba(0,0,0,0.18)";
npcDialog.style.fontFamily = "system-ui, -apple-system, sans-serif";
npcDialog.style.fontSize = "13px";
npcDialog.style.lineHeight = "1.6";
npcDialog.style.color = "#333";
npcDialog.style.display = "none";
npcDialog.style.pointerEvents = "none";
npcDialog.style.zIndex = "1000002";
npcDialog.style.willChange = "transform, left, top";
uiLayer.appendChild(npcDialog);

const npcDialogText = document.createElement("div");
npcDialog.appendChild(npcDialogText);

const npcDialogTail = document.createElement("div");
npcDialogTail.style.position = "absolute";
npcDialogTail.style.left = "50%";
npcDialogTail.style.bottom = "-10px";
npcDialogTail.style.width = "0";
npcDialogTail.style.height = "0";
npcDialogTail.style.transform = "translateX(-50%)";
npcDialogTail.style.borderLeft = "10px solid transparent";
npcDialogTail.style.borderRight = "10px solid transparent";
npcDialogTail.style.borderTop = "12px solid rgba(255,255,255,0.94)";
npcDialogTail.style.filter = "drop-shadow(0 2px 1px rgba(0,0,0,0.08))";
npcDialog.appendChild(npcDialogTail);

const tutorialNpcNameTag = document.createElement("div");
tutorialNpcNameTag.style.position = "fixed";
tutorialNpcNameTag.style.left = "0";
tutorialNpcNameTag.style.top = "0";
tutorialNpcNameTag.style.transform = "translate(-50%, -50%)";
tutorialNpcNameTag.style.padding = "5px 10px";
tutorialNpcNameTag.style.borderRadius = "999px";
tutorialNpcNameTag.style.background = "rgba(20,20,20,0.72)";
tutorialNpcNameTag.style.border = "1px solid rgba(255,255,255,0.18)";
tutorialNpcNameTag.style.color = "#fff6d2";
tutorialNpcNameTag.style.fontFamily = "system-ui, -apple-system, sans-serif";
tutorialNpcNameTag.style.fontSize = "12px";
tutorialNpcNameTag.style.fontWeight = "800";
tutorialNpcNameTag.style.letterSpacing = "0.02em";
tutorialNpcNameTag.style.pointerEvents = "none";
tutorialNpcNameTag.style.zIndex = "999998";
tutorialNpcNameTag.style.opacity = "1";
tutorialNpcNameTag.style.transition = "opacity 120ms ease";
tutorialNpcNameTag.style.display = "none";
uiLayer.appendChild(tutorialNpcNameTag);

const playerNameTag = document.createElement("div");
playerNameTag.style.position = "fixed";
playerNameTag.style.left = "0";
playerNameTag.style.top = "0";
playerNameTag.style.transform = "translate(-50%, -50%)";
playerNameTag.style.padding = "5px 10px";
playerNameTag.style.borderRadius = "999px";
playerNameTag.style.background = "rgba(20,20,20,0.72)";
playerNameTag.style.border = "1px solid rgba(255,255,255,0.18)";
playerNameTag.style.color = "#dff7ff";
playerNameTag.style.fontFamily = "system-ui, -apple-system, sans-serif";
playerNameTag.style.fontSize = "12px";
playerNameTag.style.fontWeight = "800";
playerNameTag.style.letterSpacing = "0.02em";
playerNameTag.style.pointerEvents = "none";
playerNameTag.style.zIndex = "999997";
playerNameTag.style.opacity = "1";
playerNameTag.style.transition = "opacity 120ms ease";
playerNameTag.style.display = "none";
uiLayer.appendChild(playerNameTag);

let npcDialogTimer = null;
const npcNameScreenPos = new THREE.Vector3();
const npcDialogScreenPos = new THREE.Vector3();
const playerNameScreenPos = new THREE.Vector3();
let npcDialogTarget = null;

function showNpcDialog(text, ms = 3000) {
  npcDialogText.textContent = text;
  npcDialogTarget = activeTutorialNpc?.obj ?? tutorialNpcs[0]?.obj ?? null;
  npcDialog.style.display = "block";
  updateNpcDialogPosition();
  if (npcDialogTimer) clearTimeout(npcDialogTimer);
  npcDialogTimer = setTimeout(() => {
    npcDialog.style.display = "none";
    npcDialogTarget = null;
  }, ms);
}

function updateNpcDialogPosition() {
  if (npcDialog.style.display === "none" || !npcDialogTarget?.parent) return;

  npcDialogScreenPos.copy(npcDialogTarget.position);
  npcDialogScreenPos.y += 3.45;
  npcDialogScreenPos.project(camera);

  const isVisible = npcDialogScreenPos.z >= -1 && npcDialogScreenPos.z <= 1;
  if (!isVisible) {
    npcDialog.style.display = "none";
    return;
  }

  const x = (npcDialogScreenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-npcDialogScreenPos.y * 0.5 + 0.5) * window.innerHeight;
  npcDialog.style.left = `${x}px`;
  npcDialog.style.top = `${Math.max(28, y)}px`;
}

function updateTutorialNpcNameTag() {
  const npcEntry = tutorialNpcs[0];
  const npcObj = npcEntry?.obj;
  if (!npcObj?.parent || npcDialog.style.display !== "none") {
    tutorialNpcNameTag.style.display = "none";
    return;
  }

  npcNameScreenPos.copy(npcObj.position);
  npcNameScreenPos.y += 2.7;
  npcNameScreenPos.project(camera);

  const isVisible = npcNameScreenPos.z >= -1 && npcNameScreenPos.z <= 1;
  if (!isVisible) {
    tutorialNpcNameTag.style.display = "none";
    return;
  }

  const x = (npcNameScreenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-npcNameScreenPos.y * 0.5 + 0.5) * window.innerHeight;
  const distance = npcObj.position.distanceTo(player.position);
  const fadeStart = 8;
  const fadeEnd = 26;
  const distanceAlpha = THREE.MathUtils.clamp(1 - (distance - fadeStart) / (fadeEnd - fadeStart), 0.12, 1);

  tutorialNpcNameTag.textContent = npcEntry.name;
  tutorialNpcNameTag.style.left = `${x}px`;
  tutorialNpcNameTag.style.top = `${y}px`;
  tutorialNpcNameTag.style.opacity = `${distanceAlpha}`;
  tutorialNpcNameTag.style.display = "block";
}

function updatePlayerNameTag() {
  if (!canPlayGame() || !hasNickname()) {
    playerNameTag.style.display = "none";
    return;
  }

  playerNameScreenPos.copy(player.position);
  playerNameScreenPos.y += 2.7;
  playerNameScreenPos.project(camera);

  const isVisible = playerNameScreenPos.z >= -1 && playerNameScreenPos.z <= 1;
  if (!isVisible) {
    playerNameTag.style.display = "none";
    return;
  }

  const x = (playerNameScreenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-playerNameScreenPos.y * 0.5 + 0.5) * window.innerHeight;

  playerNameTag.textContent = walletProfile.nickname;
  playerNameTag.style.left = `${x}px`;
  playerNameTag.style.top = `${y}px`;
  playerNameTag.style.opacity = "1";
  playerNameTag.style.display = "block";
}

const tutorialQuest = {
  id: "starter_tutorial",
  title: "광산 작업 준비",
  description: "작업 감독관의 안내를 따라 기본 장비를 챙기고 첫 채굴과 강화를 배워보세요.",
  currentStep: 0,
  minedRockCount: 0,
  upgradeCount: 0,
  completed: false,
  archivedSteps: [],
  steps: [
    {
      title: "장비 챙기기",
      description: "가판대에서 곡괭이와 안전모를 모두 획득하세요.",
      check: () => hasItem("pickaxe") && hasItem("safetyHelmet"),
    },
    {
      title: "안전모 착용",
      description: "인벤토리에서 안전모를 장착하세요.",
      check: () => getEquippedItemForSlot("head") === "safetyHelmet",
    },
    {
      title: "곡괭이 장착",
      description: "인벤토리에서 곡괭이를 장착하세요.",
      check: () => getEquippedItemForSlot("tool") === "pickaxe",
    },
    {
      title: "첫 채굴",
      description: "돌을 1개 채굴해서 돌가루를 모으세요.",
      check: () => tutorialQuest.minedRockCount >= 1,
    },
    {
      title: "장비 단련",
      description: "모루에서 착용한 곡괭이를 3회 강화하세요.",
      check: () => tutorialQuest.upgradeCount >= 3,
    },
    {
      title: "폐광 열쇠 수령",
      description: "작업 감독관과 대화하여 폐광 열쇠를 획득하세요.",
      check: () => inventory.mineKeyIssued,
    },
  ],
};

let questViewMode = "active";

function getCurrentQuestStep() {
  if (tutorialQuest.completed) return null;
  return tutorialQuest.steps[tutorialQuest.currentStep] ?? null;
}

function getTutorialNpcLine() {
  const step = getCurrentQuestStep();
  if (!step) {
    if (!inventory.mineKeyIssued) {
      return "좋아, 이제 폐광에 들어갈 자격이 생겼다. 이 열쇠를 가져가서 북쪽 폐광 입구를 열어.";
    }
    if (!inventory.abandonedMineUnlocked) {
      return "북쪽 폐광 입구로 가서 E키로 열쇠를 사용해. 한 번 열어두면 계속 드나들 수 있다.";
    }
    return "좋아, 폐광 통로도 열렸다. 더 깊은 곳으로 들어갈 준비가 됐군.";
  }

  const lines = [
    "가판대에서 곡괭이와 안전모를 챙겨. 작업장에선 장비부터 갖추는 게 우선이야.",
    "좋아. 이제 인벤토리를 열어서 안전모부터 써. 광산에선 보호구가 기본이야.",
    "다음은 곡괭이를 손에 들어. 장비를 갖췄으면 바로 작업할 수 있게 준비해야지.",
    "앞에 있는 돌을 하나 캐봐. 직접 해보는 게 제일 빠르다.",
    "이제 모루로 가서 곡괭이를 세 번 강화해봐. 장비를 충분히 다뤄봐야 폐광 출입을 맡길 수 있어.",
    "좋아, 준비는 끝났다. 나에게 말을 걸면 폐광 열쇠를 넘겨주지.",
  ];
  return lines[tutorialQuest.currentStep] ?? step.description;
}

function refreshQuestProgress() {
  let advanced = false;
  while (!tutorialQuest.completed) {
    const step = getCurrentQuestStep();
    if (!step || !step.check()) break;
    tutorialQuest.currentStep += 1;
    advanced = true;
    if (tutorialQuest.currentStep >= tutorialQuest.steps.length) {
      tutorialQuest.completed = true;
      showUI("튜토리얼 퀘스트 완료!", 1200);
      break;
    }
    showUI(`퀘스트 갱신: ${tutorialQuest.steps[tutorialQuest.currentStep].title}`, 1100);
  }
  if (advanced) schedulePlayerSaveSync(true);
  if (advanced && questOpen) renderQuestWindow();
}

function archiveQuestStep(stepIndex) {
  const isDone = stepIndex < tutorialQuest.currentStep || tutorialQuest.completed;
  if (!isDone) return;
  if (!tutorialQuest.archivedSteps.includes(stepIndex)) {
    tutorialQuest.archivedSteps.push(stepIndex);
    schedulePlayerSaveSync(true);
  }
  if (questOpen) renderQuestWindow();
}

function renderQuestWindow() {
  questArchiveToggleBtn.textContent = questViewMode === "active" ? "완료 보기" : "진행 보기";
  questTitle.textContent = tutorialQuest.title;
  const currentStep = getCurrentQuestStep();
  questDesc.textContent = questViewMode === "completed"
    ? "완료 버튼을 눌러 정리한 단계들이 이곳에 모여 표시됩니다."
    : tutorialQuest.completed
      ? "작업 감독관의 기본 교육을 모두 마쳤습니다. 앞으로 새 기능이 생기면 이 창에서 진행 상황을 확인할 수 있습니다."
      : currentStep?.description ?? tutorialQuest.description;

  questStepList.innerHTML = "";
  const visibleSteps = tutorialQuest.steps
    .map((step, index) => ({ step, index }))
    .filter(({ index }) => {
      const isDone = index < tutorialQuest.currentStep || tutorialQuest.completed;
      const isArchived = tutorialQuest.archivedSteps.includes(index);
      return questViewMode === "completed"
        ? isDone && isArchived
        : !isDone || !isArchived;
    });

  if (visibleSteps.length === 0) {
    const row = document.createElement("div");
    row.style.padding = "10px 12px";
    row.style.borderRadius = "10px";
    row.style.background = "rgba(255,255,255,0.9)";
    row.style.border = "1px solid rgba(0,0,0,0.1)";
    row.style.fontFamily = "system-ui, -apple-system, sans-serif";
    row.textContent = questViewMode === "completed"
      ? "아직 보관한 완료 퀘스트가 없습니다."
      : "진행 중인 퀘스트가 없습니다.";
    questStepList.appendChild(row);
  } else {
    visibleSteps.forEach(({ step, index }) => {
      const row = document.createElement("div");
      const isDone = index < tutorialQuest.currentStep || tutorialQuest.completed;
      const isActive = !tutorialQuest.completed && index === tutorialQuest.currentStep;
      row.style.padding = "10px 12px";
      row.style.borderRadius = "10px";
      row.style.background = isActive ? "rgba(255,199,120,0.2)" : "rgba(255,255,255,0.9)";
      row.style.border = isActive
        ? "1px solid rgba(220,140,40,0.35)"
        : "1px solid rgba(0,0,0,0.1)";
      row.style.fontFamily = "system-ui, -apple-system, sans-serif";

      const top = document.createElement("div");
      top.style.display = "flex";
      top.style.alignItems = "center";
      top.style.justifyContent = "space-between";
      top.style.gap = "8px";

      const title = document.createElement("div");
      title.textContent = step.title;
      title.style.fontSize = "14px";
      title.style.fontWeight = "800";
      title.style.color = "#222";
      top.appendChild(title);

      if (isDone && questViewMode === "active") {
        const archiveBtn = document.createElement("button");
        archiveBtn.type = "button";
        archiveBtn.textContent = "완료";
        archiveBtn.style.padding = "4px 8px";
        archiveBtn.style.borderRadius = "999px";
        archiveBtn.style.border = "1px solid rgba(70,150,70,0.22)";
        archiveBtn.style.background = "rgba(81,181,81,0.16)";
        archiveBtn.style.color = "#2d7c2d";
        archiveBtn.style.fontSize = "12px";
        archiveBtn.style.fontWeight = "700";
        archiveBtn.style.cursor = "pointer";
        archiveBtn.style.pointerEvents = "auto";
        archiveBtn.addEventListener("click", () => {
          archiveQuestStep(index);
        });
        top.appendChild(archiveBtn);
      } else {
        const status = document.createElement("div");
        status.textContent = isDone ? "완료됨" : isActive ? "진행 중" : "대기";
        status.style.fontSize = "12px";
        status.style.fontWeight = "700";
        status.style.color = isDone ? "#2d7c2d" : isActive ? "#9a5c12" : "#888";
        top.appendChild(status);
      }

      const desc = document.createElement("div");
      desc.textContent = step.description;
      desc.style.marginTop = "6px";
      desc.style.fontSize = "12px";
      desc.style.lineHeight = "1.5";
      desc.style.color = "#555";

      row.appendChild(top);
      row.appendChild(desc);
      questStepList.appendChild(row);
    });
  }

  questFooter.textContent = questViewMode === "completed"
    ? "완료 버튼을 눌러 정리한 단계는 여기서 다시 확인할 수 있습니다."
    : "Q 키로 퀘스트를 열고, Space 키로 튜토리얼 NPC와 대화할 수 있습니다.";
}




// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemi.position.set(0, 50, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(10, 20, 10);
scene.add(dir);

// ===== Ground (mine-like bumpy terrain) =====
const GROUND_SIZE = 100;      // 맵 크기(100 x 100)
const FRONTIER_GROUND_SIZE = 50;
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
const CAMP_MAP_X = 0;
const CAMP_MAP_Z = -126;
const FRONTIER_MAP_X = 0;
const FRONTIER_MAP_Z = -218;
const MAP_GATE_RADIUS = 1.15;
const DEV_PRESET_ENABLED = true;
patchInfoWrap.style.display = DEV_PRESET_ENABLED ? "block" : "none";
const DEV_PRESET = {
  startMapId: "폐광맵",
  completeTutorial: true,
  unlockAbandonedMine: true,
  giveStarterGear: true,
  pickaxeLevel: 3,
  stoneDust: 500,
};


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
const groundSurfaces = [ground];
const walkableMapSurfaces = new Map();

function registerWalkableSurface(mapId, mesh, padding = 0.55) {
  if (!mesh) return;
  const entries = walkableMapSurfaces.get(mapId) ?? [];
  entries.push({ mesh, padding });
  walkableMapSurfaces.set(mapId, entries);
}

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
registerWalkableSurface("광산맵", ground, 1.4);


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
const harvestTrees = [];
const connectorTunnelZones = [];
const ROCK_RESPAWN_MS = 10000;
const TREE_HARVEST_RESPAWN_MS = 10000;
const ROCK_COUNT = 50;
const CAVE_STONE_COUNT = 16;
const ROCK_SPAWN_MARGIN = 6;
const ROCK_SAFE_RADIUS = 8;
const ROCK_MIN_GAP = 0.55; // 돌끼리 화면상 붙어 보이지 않게 여유
// ===== Mining particles (stone dust) =====
const particles = [];
const rockHitReactions = [];
let hitStopTime = 0;
let cameraShakeTime = 0;
let cameraShakeStrength = 0;

const HIT_STOP_DURATION = 0.045;
const ROCK_HIT_REACTION_DURATION = 0.12;
const CAMERA_SHAKE_DURATION = 0.11;

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

function findCampStoneSpawnPosition(s, tries = 120) {
  const half = GROUND_SIZE * 0.5 - 8;
  for (let i = 0; i < tries; i += 1) {
    const x = CAMP_MAP_X + randRange(-half, half);
    const z = CAMP_MAP_Z + randRange(-half, half);

    if (Math.abs(x - airPurifierStation?.position?.x ?? x) < 8 && Math.abs(z - (airPurifierStation?.position?.z ?? z)) < 8) continue;
    if (Math.abs(x - campGate?.position?.x ?? x) < 7 && Math.abs(z - (campGate?.position?.z ?? z)) < 8) continue;

    let blocked = false;
    for (const rock of mineRocks) {
      if (!rock || !rock.parent) continue;
      const otherS = rock.userData?.spawnScale ?? 1;
      const minDist = (0.9 * s) + (0.9 * otherS) + 0.8;
      const dx = x - rock.position.x;
      const dz = z - rock.position.z;
      if ((dx * dx + dz * dz) < (minDist * minDist)) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return { x, z };
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
const FRONTIER_PARCEL_LABELS = ["P1", "P2", "P3", "P4", "P5", "P6"];
const FRONTIER_AUTHORITY_ITEM_IDS = {
  P1: "frontierP1Permit",
  P2: "frontierP2Permit",
  P3: "frontierP3Permit",
  P4: "frontierP4Permit",
  P5: "frontierP5Permit",
  P6: "frontierP6Permit",
};

const ITEM_DEFS = {
  pickaxe: {
    name: "곡괭이",
    icon: "⛏️",
    stackMax: 1,
    category: "equip",
    equipSlot: "tool",
    upgradeKey: "pickaxe",
    miningPowerMin: 0.9,
    miningPowerMax: 1.1,
    makeInventoryModel: () => buildPickaxeModel(inventory?.pickaxeLevel ?? 0),
  },
  safetyHelmet: {
    name: "안전모",
    icon: "🪖",
    stackMax: 1,
    category: "equip",
    equipSlot: "head",
    makeInventoryModel: () => buildSafetyHelmetModel(),
  },
  abandonedMineKey: {
    name: "폐광 열쇠",
    icon: "🗝️",
    stackMax: 1,
    category: "misc",
  },
  frontierP1Permit: { name: "개척지 P1 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
  frontierP2Permit: { name: "개척지 P2 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
  frontierP3Permit: { name: "개척지 P3 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
  frontierP4Permit: { name: "개척지 P4 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
  frontierP5Permit: { name: "개척지 P5 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
  frontierP6Permit: { name: "개척지 P6 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
  mansionOneRoom101Permit: {
    name: "Mansion ONE 101호",
    icon: "🪪",
    stackMax: 1,
    category: "misc",
    isAuthorityItem: true,
  },
  freshAirCanister: {
    name: "신선한 공기 캔",
    icon: "🫧",
    stackMax: 200,
    category: "cons",
    makeInventoryModel: () => buildFreshAirCanisterModel(),
  },
  woodChip: {
    name: "나무조각",
    icon: "🪹",
    stackMax: 200,
    category: "misc",
    isMaterial: true,
  },
  woodPlank: {
    name: "목재",
    icon: "🟫",
    stackMax: 200,
    category: "misc",
    isMaterial: true,
  },
  purifyPowder: {
    name: "정화 가루",
    icon: "✨",
    stackMax: 200,
    category: "misc",
    isMaterial: true,
    makeInventoryModel: () => buildPurifyPowderModel(),
  },
  stoneDust: { name: "돌가루", icon: "🪨", stackMax: 200, category: "misc", isMaterial: true },
  masonryStone: { name: "석재", icon: "🧱", stackMax: 200, category: "misc", isMaterial: true },
};

const DEV_MOCK_NFT_ITEMS = [
  {
    kind: "nft",
    contractAddress: "0xMockHelmetCollection",
    tokenId: "1",
    nftType: "head",
    name: "황금 안전모 NFT",
    rarity: "legendary",
    icon: "👑",
  },
];

function getDevMaterialItemIds() {
  return Object.entries(ITEM_DEFS)
    .filter(([, def]) => def?.isMaterial)
    .map(([itemId]) => itemId);
}

let inventoryEntryInstanceSeq = 1;

function createInventoryEntryInstanceId() {
  const seq = inventoryEntryInstanceSeq++;
  return `inv_${Date.now().toString(36)}_${seq.toString(36)}`;
}

function getInventoryStackMax(itemId) {
  const def = ITEM_DEFS[itemId];
  if (!def) return 1;
  const rawStackMax = Math.max(1, def.stackMax ?? 1);
  if (def.category === "cons" || def.category === "misc") {
    return Math.min(rawStackMax, INVENTORY_STACK_LIMIT);
  }
  return rawStackMax;
}

function createInventorySlotEntry(itemId, count = 1, extra = {}) {
  const stackMax = getInventoryStackMax(itemId);
  const instanceId =
    typeof extra.instanceId === "string" && extra.instanceId.trim()
      ? extra.instanceId
      : createInventoryEntryInstanceId();
  return {
    kind: "item",
    itemId,
    count: Math.max(1, Math.min(count, stackMax)),
    instanceId,
    ...extra,
  };
}

function addInventoryEntry(entry) {
  const normalizedEntry = normalizeInventorySlotEntry(entry);
  if (!normalizedEntry) return false;
  const empty = findFirstEmptySlot();
  if (empty === -1) return false;
  inventory.slots[empty] = normalizedEntry;
  return true;
}

function normalizeInventorySlotEntry(rawSlot) {
  if (!rawSlot) return null;
  if (typeof rawSlot === "string") {
    return createInventorySlotEntry(rawSlot, 1);
  }
  if (typeof rawSlot === "object") {
    if (rawSlot.kind === "nft" && rawSlot.contractAddress && rawSlot.tokenId) {
      return {
        ...rawSlot,
        kind: "nft",
        tokenId: String(rawSlot.tokenId),
        count: 1,
      };
    }
    if (rawSlot.kind === "item" && rawSlot.itemId) {
      const stackMax = getInventoryStackMax(rawSlot.itemId);
      return {
        ...rawSlot,
        kind: "item",
        itemId: rawSlot.itemId,
        count: Math.max(1, Math.min(Number.isFinite(rawSlot.count) ? rawSlot.count : 1, stackMax)),
        instanceId:
          typeof rawSlot.instanceId === "string" && rawSlot.instanceId.trim()
            ? rawSlot.instanceId
            : createInventoryEntryInstanceId(),
      };
    }
    if (rawSlot.id) {
      return createInventorySlotEntry(rawSlot.id, Number.isFinite(rawSlot.count) ? rawSlot.count : 1);
    }
  }
  return null;
}

function createEquippedItemRef(itemId, extra = {}) {
  return itemId
    ? {
        kind: "item",
        itemId,
        ...extra,
      }
    : null;
}

function normalizeEquippedItemRef(rawRef) {
  if (!rawRef) return null;
  if (typeof rawRef === "string") {
    return createEquippedItemRef(rawRef);
  }
  if (typeof rawRef === "object") {
    if (rawRef.kind === "nft" && rawRef.contractAddress && rawRef.tokenId) {
      return {
        ...rawRef,
        kind: "nft",
        tokenId: String(rawRef.tokenId),
      };
    }
    if (rawRef.kind === "item" && rawRef.itemId) {
      return {
        ...rawRef,
        kind: "item",
        itemId: rawRef.itemId,
        instanceId:
          typeof rawRef.instanceId === "string" && rawRef.instanceId.trim()
            ? rawRef.instanceId
            : null,
      };
    }
    if (rawRef.itemId) {
      return createEquippedItemRef(rawRef.itemId);
    }
  }
  return null;
}

function getSlotItemId(slot) {
  return slot?.itemId ?? slot?.id ?? null;
}

function getSlotItemCount(slot) {
  return Number.isFinite(slot?.count) ? slot.count : 0;
}

function isNftInventoryEntry(entry) {
  return entry?.kind === "nft";
}

function isSameInventoryEntryAsEquipped(entry, equippedRef) {
  if (!entry || !equippedRef) return false;
  if (isNftInventoryEntry(entry)) {
    return (
      equippedRef.kind === "nft" &&
      equippedRef.contractAddress === entry.contractAddress &&
      String(equippedRef.tokenId) === String(entry.tokenId)
    );
  }

  if (equippedRef.kind !== "item") return false;
  if (entry.instanceId && equippedRef.instanceId) {
    return entry.instanceId === equippedRef.instanceId;
  }
  return equippedRef.itemId === getSlotItemId(entry);
}

function getInventoryEntryCategory(entry) {
  if (!entry) return null;
  if (isNftInventoryEntry(entry)) {
    const nftType = entry.nftType ?? "";
    return ["tool", "head", "body", "shoes"].includes(nftType) ? "equip" : "misc";
  }
  const itemId = getSlotItemId(entry);
  return ITEM_DEFS[itemId]?.category ?? null;
}

function getInventoryEntryEquipSlot(entry) {
  if (!entry) return null;
  if (isNftInventoryEntry(entry)) {
    return entry.nftType ?? null;
  }
  const itemId = getSlotItemId(entry);
  return ITEM_DEFS[itemId]?.equipSlot ?? null;
}

function getInventoryEntryDisplayName(entry) {
  if (!entry) return "";
  if (isNftInventoryEntry(entry)) {
    return entry.name ?? `NFT #${entry.tokenId}`;
  }
  const itemId = getSlotItemId(entry);
  const def = ITEM_DEFS[itemId];
  return def?.name ?? itemId ?? "";
}

function getInventoryEntryDisplayIcon(entry) {
  if (!entry) return "?";
  if (isNftInventoryEntry(entry)) {
    return entry.icon ?? "🧿";
  }
  const itemId = getSlotItemId(entry);
  return ITEM_DEFS[itemId]?.icon ?? "?";
}

function getInventoryEntryTooltipText(entry) {
  if (!entry) return "";
  if (isNftInventoryEntry(entry)) {
    const lines = [
      `이름: ${getInventoryEntryDisplayName(entry)}`,
      "타입: NFT 장비",
    ];
    if (entry.rarity) lines.push(`희귀도: ${entry.rarity}`);
    if (entry.nftType) lines.push(`장착 슬롯: ${entry.nftType}`);
    lines.push(`Token ID: ${entry.tokenId}`);
    return lines.join("\n");
  }
  const lines = [getItemTooltipText(getSlotItemId(entry), getSlotItemCount(entry))];
  if (isQuestCriticalItemBlockedFromDiscard(entry)) {
    lines.push("퀘스트 아이템");
  }
  return lines.join("\n");
}

function createQuickUseBinding(itemId, extra = {}) {
  return itemId
    ? {
        kind: "item",
        itemId,
        ...extra,
      }
    : null;
}

function normalizeQuickUseBinding(rawBinding) {
  if (!rawBinding) return null;
  if (typeof rawBinding === "string") {
    return createQuickUseBinding(rawBinding);
  }
  if (typeof rawBinding === "object" && rawBinding.itemId) {
    return createQuickUseBinding(rawBinding.itemId, rawBinding);
  }
  return null;
}

function getQuickUseBinding(key) {
  return inventory.quickUse[key] ?? null;
}

function getQuickUseItemId(key) {
  return getQuickUseBinding(key)?.itemId ?? null;
}

function isQuickUseAssignableItemId(itemId) {
  return itemId === "freshAirCanister";
}

function isQuickUseAssignableEntry(entry) {
  const itemId = getSlotItemId(entry);
  return getInventoryEntryCategory(entry) === "cons" && isQuickUseAssignableItemId(itemId);
}

function isEntryAssignedToQuickUse(entry, key) {
  return getQuickUseItemId(key) === getSlotItemId(entry);
}

function getAssignedQuickUseKeyForEntry(entry) {
  const itemId = getSlotItemId(entry);
  for (const key of QUICK_USE_ALLOWED_KEYS) {
    if (getQuickUseItemId(key) === itemId) return key;
  }
  return "";
}

function clearQuickUseBindingForItemId(itemId) {
  for (const key of QUICK_USE_ALLOWED_KEYS) {
    if (getQuickUseItemId(key) === itemId) {
      inventory.quickUse[key] = null;
    }
  }
}

function assignQuickUseKeyToItem(itemId, key) {
  if (!itemId || !QUICK_USE_ALLOWED_KEYS.includes(key)) return false;
  clearQuickUseBindingForItemId(itemId);
  inventory.quickUse[key] = createQuickUseBinding(itemId);
  return true;
}

function getQuickUseKeyForItemId(itemId) {
  for (const key of QUICK_USE_ALLOWED_KEYS) {
    if (getQuickUseItemId(key) === itemId) return key;
  }
  return "";
}

function isQuickUseAssignPendingForEntry(entry) {
  return quickUseAssignState?.itemId === getSlotItemId(entry);
}

function pruneQuickUseBindings() {
  for (const key of Object.keys(inventory.quickUse)) {
    const itemId = getQuickUseItemId(key);
    if (itemId && !hasItem(itemId)) {
      inventory.quickUse[key] = null;
    }
  }
  if (quickUseAssignState && !hasItem(quickUseAssignState.itemId)) {
    quickUseAssignState = null;
  }
}

const PICKAXE_UPGRADE_LEVELS = [
  { level: 0, miningPowerMin: 0.9, miningPowerMax: 1.1, bonusDropChance: 0.0, swingDuration: 0.28, cost: 0, successChance: 1.0 },
  { level: 1, miningPowerMin: 1.0, miningPowerMax: 1.15, bonusDropChance: 0.0, swingDuration: 0.265, cost: 3, successChance: 1.0 },
  { level: 2, miningPowerMin: 1.05, miningPowerMax: 1.2, bonusDropChance: 0.05, swingDuration: 0.25, cost: 6, successChance: 0.9 },
  { level: 3, miningPowerMin: 1.15, miningPowerMax: 1.25, bonusDropChance: 0.1, swingDuration: 0.235, cost: 10, successChance: 0.75 },
  { level: 4, miningPowerMin: 1.2, miningPowerMax: 1.35, bonusDropChance: 0.15, swingDuration: 0.22, cost: 15, successChance: 0.55 },
  { level: 5, miningPowerMin: 1.3, miningPowerMax: 1.45, bonusDropChance: 0.2, swingDuration: 0.205, cost: 22, successChance: 0.35 },
];

const ROCK_SIZE_DEFS = [
  { id: "small", label: "작은 돌", scale: 0.8, maxHp: 1, stoneDustDropCount: 1 },
  { id: "medium", label: "중간 돌", scale: 1.05, maxHp: 2, stoneDustDropCount: 2 },
  { id: "large", label: "큰 돌", scale: 1.3, maxHp: 3, stoneDustDropCount: 3 },
];

function getItemTooltipText(itemId, count = null) {
  const def = ITEM_DEFS[itemId];
  if (!def) return itemId;

  const lines = [`이름: ${def.name}`];
  if (itemId === "pickaxe") {
    const stats = getCurrentPickaxeStats();
    lines.push(`강화 단계: Lv.${stats.level}`);
    lines.push(`채굴력: ${stats.miningPowerMin.toFixed(1)} ~ ${stats.miningPowerMax.toFixed(1)}`);
  } else if (itemId === "purifyPowder") {
    lines.push("설명: 돌가루를 재련해 만든 정화용 가공 분말");
    lines.push("용도: 공기 정화탑 가동");
  } else if (typeof def.miningPower === "number") {
    lines.push(`채굴력: ${def.miningPower}`);
  }
  if (count && count > 1) {
    lines.push(`수량: ${count}`);
  }
  return lines.join("\n");
}

function getCurrentPickaxeStats() {
  const level = inventory?.pickaxeLevel ?? 0;
  return PICKAXE_UPGRADE_LEVELS[Math.min(level, PICKAXE_UPGRADE_LEVELS.length - 1)];
}

function getNextPickaxeUpgrade() {
  const nextLevel = (inventory?.pickaxeLevel ?? 0) + 1;
  return PICKAXE_UPGRADE_LEVELS[nextLevel] ?? null;
}

function getForgeTargetItemId() {
  const slotOrder = ["tool", "head", "body", "shoes"];
  for (const slotId of slotOrder) {
    const itemId = getEquippedItemForSlot(slotId);
    if (!itemId) continue;
    if (ITEM_DEFS[itemId]?.upgradeKey) return itemId;
  }
  return null;
}

function getForgeUpgradeState() {
  const itemId = getForgeTargetItemId();
  if (!itemId) return null;

  if (itemId === "pickaxe") {
    return {
      itemId,
      name: ITEM_DEFS[itemId].name,
      level: inventory.pickaxeLevel,
      current: getCurrentPickaxeStats(),
      next: getNextPickaxeUpgrade(),
    };
  }

  return null;
}

function getEquippedMiningPower() {
  const toolId = getEquippedItemForSlot("tool");
  if (toolId === "pickaxe") {
    const stats = getCurrentPickaxeStats();
    return randRange(stats.miningPowerMin, stats.miningPowerMax);
  }
  const def = toolId ? ITEM_DEFS[toolId] : null;
  return def?.miningPower ?? 0;
}

    // 인벤토리 데이터: 슬롯 + 장착 상태
	    const inventory = {
  slots: Array.from({ length: 30 }, () => null), // 30칸(원하면 늘림)
  pickaxeLevel: 1,
  mineKeyIssued: false,
  abandonedMineUnlocked: false,
  quickUse: {
    "1": null,
    "2": null,
    "3": null,
    "4": null,
    "5": null,
  },
  equipped: {
    head: null,
    body: null,
    shoes: null,
    tool: null,
  },
    };

const personalStorage = {
  slots: Array.from({ length: 20 }, () => null),
};

let inventoryDraggedEntry = null;
let inventoryDiscardTargetEntry = null;
let inventoryDragState = null;
let personalStorageTransferState = null;

const ALWAYS_DROP_BLOCKED_ITEM_IDS = new Set(["abandonedMineKey"]);
const TUTORIAL_DROP_BLOCKED_ITEM_IDS = new Set(["pickaxe", "safetyHelmet"]);

function findInventorySlotIndexByEntry(entry) {
  if (!entry) return -1;
  if (isNftInventoryEntry(entry)) {
    return inventory.slots.findIndex((slot) =>
      slot &&
      slot.kind === "nft" &&
      slot.contractAddress === entry.contractAddress &&
      String(slot.tokenId) === String(entry.tokenId)
    );
  }
  if (entry.instanceId) {
    return inventory.slots.findIndex((slot) => slot?.instanceId === entry.instanceId);
  }
  const itemId = getSlotItemId(entry);
  return inventory.slots.findIndex((slot) => slot && getSlotItemId(slot) === itemId);
}

function getInventorySlotEntryByEntry(entry) {
  const idx = findInventorySlotIndexByEntry(entry);
  return idx >= 0 ? inventory.slots[idx] : null;
}

function isQuestCriticalItemBlockedFromDiscard(entry) {
  const itemId = getSlotItemId(entry);
  if (!itemId) return false;
  if (ALWAYS_DROP_BLOCKED_ITEM_IDS.has(itemId)) return true;
  if (!tutorialQuest.completed && TUTORIAL_DROP_BLOCKED_ITEM_IDS.has(itemId)) return true;
  return false;
}

function canDiscardInventoryEntry(entry) {
  if (!entry) {
    return { ok: false, reason: "아이템 정보가 없습니다." };
  }
  if (isNftInventoryEntry(entry)) {
    return { ok: false, reason: "NFT 아이템은 버릴 수 없습니다." };
  }
  const itemId = getSlotItemId(entry);
  if (ITEM_DEFS[itemId]?.isAuthorityItem) {
    return { ok: false, reason: "권한 아이템은 버릴 수 없습니다." };
  }
  const equipSlot = getInventoryEntryEquipSlot(entry);
  if (equipSlot && isSameInventoryEntryAsEquipped(entry, getEquippedItemRef(equipSlot))) {
    return { ok: false, reason: "장착 중인 아이템은 먼저 해제해야 합니다." };
  }
  if (isQuestCriticalItemBlockedFromDiscard(entry)) {
    return { ok: false, reason: "핵심 퀘스트 아이템은 버릴 수 없습니다." };
  }
  const count = getSlotItemCount(entry);
  if (count <= 0) {
    return { ok: false, reason: "버릴 수량이 없습니다." };
  }
  return { ok: true };
}

function canMoveInventoryEntryToPersonalStorage(entry) {
  if (!entry) {
    return { ok: false, reason: "아이템 정보가 없습니다." };
  }
  if (isNftInventoryEntry(entry)) {
    return { ok: false, reason: "NFT 아이템은 창고에 보관할 수 없습니다." };
  }
  const itemId = getSlotItemId(entry);
  if (ITEM_DEFS[itemId]?.isAuthorityItem) {
    return { ok: false, reason: "권한 아이템은 창고에 보관할 수 없습니다." };
  }
  const equipSlot = getInventoryEntryEquipSlot(entry);
  if (equipSlot && isSameInventoryEntryAsEquipped(entry, getEquippedItemRef(equipSlot))) {
    return { ok: false, reason: "장착 중인 아이템은 먼저 해제해야 합니다." };
  }
  if (isQuestCriticalItemBlockedFromDiscard(entry)) {
    return { ok: false, reason: "핵심 퀘스트 아이템은 창고에 보관할 수 없습니다." };
  }
  return { ok: true };
}

function findFirstEmptyStorageSlot() {
  for (let i = 0; i < personalStorage.slots.length; i += 1) {
    if (!personalStorage.slots[i]) return i;
  }
  return -1;
}

function createPartialInventoryEntry(entry, count) {
  const normalizedEntry = normalizeInventorySlotEntry(entry);
  if (!normalizedEntry) return null;
  if (isNftInventoryEntry(normalizedEntry)) return structuredClone(normalizedEntry);
  const safeCount = Math.max(1, Math.min(getSlotItemCount(normalizedEntry), Math.floor(count || 1)));
  const { count: _ignoredCount, itemId, instanceId: _ignoredInstanceId, ...extra } = normalizedEntry;
  return createInventorySlotEntry(itemId, safeCount, extra);
}

function addEntryToStorage(entry, count = getSlotItemCount(entry)) {
  const normalizedEntry = createPartialInventoryEntry(entry, count);
  if (!normalizedEntry) return false;
  const snapshot = personalStorage.slots.map((slot) => (slot ? structuredClone(slot) : null));
  const itemId = getSlotItemId(normalizedEntry);
  const stackMax = getInventoryStackMax(itemId);
  let remaining = getSlotItemCount(normalizedEntry);

  if (stackMax > 1) {
    for (let i = 0; i < personalStorage.slots.length && remaining > 0; i += 1) {
      const slot = personalStorage.slots[i];
      if (!slot || getSlotItemId(slot) !== itemId || isNftInventoryEntry(slot)) continue;
      const currentCount = getSlotItemCount(slot);
      if (currentCount >= stackMax) continue;
      const addedCount = Math.min(stackMax - currentCount, remaining);
      slot.count += addedCount;
      remaining -= addedCount;
    }
  }

  while (remaining > 0) {
    const empty = findFirstEmptyStorageSlot();
    if (empty === -1) {
      for (let i = 0; i < personalStorage.slots.length; i += 1) {
        personalStorage.slots[i] = snapshot[i];
      }
      return false;
    }
    const countToPlace = Math.min(remaining, stackMax);
    const { count: _ignoredCount, itemId: _ignoredItemId, instanceId: _ignoredInstanceId, ...extra } = normalizedEntry;
    personalStorage.slots[empty] = createInventorySlotEntry(itemId, countToPlace, extra);
    remaining -= countToPlace;
  }

  return true;
}

function addEntryToInventory(entry, count = getSlotItemCount(entry)) {
  const normalizedEntry = createPartialInventoryEntry(entry, count);
  if (!normalizedEntry) return false;
  const itemId = getSlotItemId(normalizedEntry);
  const stackMax = getInventoryStackMax(itemId);
  let remaining = getSlotItemCount(normalizedEntry);

  if (stackMax > 1) {
    for (let i = 0; i < inventory.slots.length && remaining > 0; i += 1) {
      const slot = inventory.slots[i];
      if (!slot || getSlotItemId(slot) !== itemId || isNftInventoryEntry(slot)) continue;
      const currentCount = getSlotItemCount(slot);
      if (currentCount >= stackMax) continue;
      const addedCount = Math.min(stackMax - currentCount, remaining);
      slot.count += addedCount;
      remaining -= addedCount;
    }
  }

  while (remaining > 0) {
    const empty = findFirstEmptySlot();
    if (empty === -1) return false;
    const countToPlace = Math.min(remaining, stackMax);
    const { count: _ignoredCount, itemId: _ignoredItemId, instanceId: _ignoredInstanceId, ...extra } = normalizedEntry;
    inventory.slots[empty] = createInventorySlotEntry(itemId, countToPlace, extra);
    remaining -= countToPlace;
  }

  return true;
}

function moveInventoryEntryToStorage(entry, count = getSlotItemCount(entry)) {
  const slotIndex = findInventorySlotIndexByEntry(entry);
  if (slotIndex < 0) return { ok: false, reason: "인벤토리에서 아이템을 찾을 수 없습니다." };
  const liveEntry = inventory.slots[slotIndex];
  const check = canMoveInventoryEntryToPersonalStorage(liveEntry);
  if (!check.ok) return check;
  const moveCount = Math.max(1, Math.min(getSlotItemCount(liveEntry), Math.floor(count || 1)));
  if (!addEntryToStorage(structuredClone(liveEntry), moveCount)) {
    return { ok: false, reason: "개인 창고가 가득 찼습니다." };
  }
  if (getSlotItemCount(liveEntry) <= moveCount) {
    inventory.slots[slotIndex] = null;
  } else {
    liveEntry.count -= moveCount;
  }
  pruneQuickUseBindings();
  return { ok: true };
}

function moveStorageEntryToInventory(storageIndex, count = null) {
  if (storageIndex < 0 || storageIndex >= personalStorage.slots.length) {
    return { ok: false, reason: "창고 슬롯을 찾을 수 없습니다." };
  }
  const liveEntry = personalStorage.slots[storageIndex];
  if (!liveEntry) return { ok: false, reason: "비어 있는 창고 슬롯입니다." };
  const moveCount = Math.max(1, Math.min(getSlotItemCount(liveEntry), Math.floor(count ?? getSlotItemCount(liveEntry))));
  const inventorySnapshot = inventory.slots.map((slot) => (slot ? structuredClone(slot) : null));
  if (!addEntryToInventory(structuredClone(liveEntry), moveCount)) {
    for (let i = 0; i < inventory.slots.length; i += 1) {
      inventory.slots[i] = inventorySnapshot[i];
    }
    return { ok: false, reason: "인벤토리가 가득 찼습니다." };
  }
  if (getSlotItemCount(liveEntry) <= moveCount) {
    personalStorage.slots[storageIndex] = null;
  } else {
    liveEntry.count -= moveCount;
  }
  return { ok: true };
}

function closeDiscardDialog() {
  inventoryDiscardTargetEntry = null;
  discardOverlay.style.display = "none";
  discardDialog.style.display = "none";
  discardError.textContent = "";
}

function openDiscardDialog(entry) {
  const liveEntry = getInventorySlotEntryByEntry(entry);
  const check = canDiscardInventoryEntry(liveEntry ?? entry);
  if (!check.ok) {
    showUI(check.reason, 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }

  inventoryDiscardTargetEntry = liveEntry ?? entry;
  const itemName = getInventoryEntryDisplayName(inventoryDiscardTargetEntry);
  const ownedCount = Math.max(1, getSlotItemCount(inventoryDiscardTargetEntry));
  discardItemLabel.textContent = itemName;
  discardOwnedCount.textContent = `현재 보유 개수: ${ownedCount}`;
  discardCountInput.value = String(ownedCount);
  discardCountInput.max = String(ownedCount);
  discardCountInput.disabled = ownedCount <= 1;
  discardInputLabel.style.opacity = ownedCount <= 1 ? "0.55" : "1";
  discardError.textContent = "";
  discardOverlay.style.display = "block";
  discardDialog.style.display = "block";
  setTimeout(() => {
    discardCountInput.focus();
    discardCountInput.select();
  }, 0);
  return true;
}

function commitDiscardDialog() {
  if (!inventoryDiscardTargetEntry) return false;
  const slotIndex = findInventorySlotIndexByEntry(inventoryDiscardTargetEntry);
  if (slotIndex < 0) {
    discardError.textContent = "아이템을 다시 찾을 수 없습니다.";
    return false;
  }

  const liveEntry = inventory.slots[slotIndex];
  const check = canDiscardInventoryEntry(liveEntry);
  if (!check.ok) {
    discardError.textContent = check.reason;
    return false;
  }

  const ownedCount = Math.max(1, getSlotItemCount(liveEntry));
  const rawCount = Number.parseInt(discardCountInput.value, 10);
  const discardCount = Math.max(1, Math.min(ownedCount, Number.isFinite(rawCount) ? rawCount : ownedCount));
  if (!Number.isFinite(rawCount) || rawCount < 1 || rawCount > ownedCount) {
    discardError.textContent = `1 ~ ${ownedCount} 사이의 숫자를 입력하세요.`;
    return false;
  }

  if (ownedCount <= discardCount) {
    inventory.slots[slotIndex] = null;
  } else {
    liveEntry.count -= discardCount;
  }

  pruneQuickUseBindings();
  const itemName = getInventoryEntryDisplayName(liveEntry);
  closeDiscardDialog();
  updateInventoryUI();
  showUI(`${itemName} ${discardCount}개 버렸습니다.`, 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

	    function findFirstSlotWithItem(id) {
  for (let i = 0; i < inventory.slots.length; i++) {
    const s = inventory.slots[i];
    if (s && getSlotItemId(s) === id) return i;
  }
  return -1;
	    }

    function getItemCount(id) {
  let total = 0;
  for (const slot of inventory.slots) {
    if (!slot || getSlotItemId(slot) !== id) continue;
    total += getSlotItemCount(slot);
  }
  return total;
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
  let remaining = Math.max(0, Math.floor(count));
  if (remaining <= 0) return false;
  const stackMax = getInventoryStackMax(id);

  if (stackMax > 1) {
    for (let i = 0; i < inventory.slots.length && remaining > 0; i += 1) {
      const slot = inventory.slots[i];
      if (!slot || getSlotItemId(slot) !== id || isNftInventoryEntry(slot)) continue;
      const currentCount = getSlotItemCount(slot);
      if (currentCount >= stackMax) continue;
      const addedCount = Math.min(stackMax - currentCount, remaining);
      slot.count += addedCount;
      remaining -= addedCount;
    }
  }

  while (remaining > 0) {
    const empty = findFirstEmptySlot();
    if (empty === -1) return false;

	    inventory.slots[empty] = createInventorySlotEntry(id, Math.min(remaining, stackMax));
    remaining -= Math.min(remaining, stackMax);
  }
	  return true;
	    }

    function consumeItem(id, count = 1) {
  let remaining = Math.max(0, Math.floor(count));
  if (remaining <= 0) return false;
  if (getItemCount(id) < remaining) return false;

  for (let i = 0; i < inventory.slots.length && remaining > 0; i += 1) {
    const slot = inventory.slots[i];
    if (!slot || getSlotItemId(slot) !== id || isNftInventoryEntry(slot)) continue;
    const consumeCount = Math.min(getSlotItemCount(slot), remaining);
    slot.count -= consumeCount;
    remaining -= consumeCount;
    if (slot.count <= 0) inventory.slots[i] = null;
  }
  pruneQuickUseBindings();
  return true;
    }

    function hasEquippedTool(id) {
  return getEquippedItemForSlot("tool") === id;
    }

    function hasItem(id) {
  return getItemCount(id) > 0;
    }

    const equippedPickaxe = new THREE.Group();
    equippedPickaxe.name = "equippedPickaxe";
    equippedPickaxe.scale.setScalar(0.8);
    // 캐릭터 기준 오른손(rightArm) 기준 위치
    equippedPickaxe.position.set(0.01, -0.44, 0.07);
    // +Y(헤드 방향)를 +Z(진행 방향 앞)로 보내기 위해 +90도 회전
    equippedPickaxe.rotation.set(Math.PI * 0.5, Math.PI * 0.03, -Math.PI * 0.08);
    equippedPickaxe.visible = false;
    leftArm.add(equippedPickaxe);

    function syncPickaxeGroupModel(group, level) {
  while (group.children.length) {
    const child = group.children[0];
    disposeObject3D(child);
    group.remove(child);
  }
  group.add(buildPickaxeModel(level));
  group.userData.pickaxeLevel = level;
    }

    function refreshEquippedPickaxeModel() {
  syncPickaxeGroupModel(equippedPickaxe, inventory.pickaxeLevel);
    }

    refreshEquippedPickaxeModel();

    const equippedSafetyHelmet = buildSafetyHelmetModel();
    equippedSafetyHelmet.name = "equippedSafetyHelmet";
    equippedSafetyHelmet.scale.setScalar(0.72);
    equippedSafetyHelmet.visible = false;
    head.add(equippedSafetyHelmet);
    alignWearableOnHead(head, equippedSafetyHelmet, {
  verticalInset: 0.36,
  forwardBias: 0.06,
    });

    const equippedNftHelmet = buildSafetyHelmetModel("gold");
    equippedNftHelmet.name = "equippedNftHelmet";
    equippedNftHelmet.scale.setScalar(0.72);
    equippedNftHelmet.visible = false;
    head.add(equippedNftHelmet);
    alignWearableOnHead(head, equippedNftHelmet, {
  verticalInset: 0.36,
  forwardBias: 0.06,
    });

    function updateEquippedVisual() {
  const headRef = getEquippedItemRef("head");
  const isNftHelmetEquipped =
    headRef?.kind === "nft" &&
    headRef?.contractAddress === "0xMockHelmetCollection" &&
    String(headRef?.tokenId) === "1";
  equippedPickaxe.visible = hasEquippedTool("pickaxe");
  equippedSafetyHelmet.visible = !isNftHelmetEquipped && getEquippedItemForSlot("head") === "safetyHelmet";
  equippedNftHelmet.visible = isNftHelmetEquipped;
    }

    function getEquippedItemRef(slotId) {
  return inventory.equipped[slotId] ?? null;
    }

    function getEquippedItemForSlot(slotId) {
  return getEquippedItemRef(slotId)?.itemId ?? getEquippedItemRef(slotId)?.id ?? null;
    }

    function setEquippedItem(slotId, itemOrRef) {
  inventory.equipped[slotId] = normalizeEquippedItemRef(itemOrRef);
    }

    function equipFirstOwnedInventoryItem(slotId, itemId) {
  const slotIndex = findFirstSlotWithItem(itemId);
  if (slotIndex === -1) {
    setEquippedItem(slotId, itemId);
    return false;
  }
  const entry = normalizeInventorySlotEntry(inventory.slots[slotIndex]);
  if (!entry) {
    setEquippedItem(slotId, itemId);
    return false;
  }
  setEquippedItem(
    slotId,
    createEquippedItemRef(itemId, {
      instanceId: entry.instanceId ?? null,
    })
  );
  return true;
    }

    function toggleEquipItem(itemOrId) {
  const normalizedEntry =
    typeof itemOrId === "string"
      ? createInventorySlotEntry(itemOrId, 1)
      : normalizeInventorySlotEntry(itemOrId);
  if (!normalizedEntry) return;

  const equipSlot = getInventoryEntryEquipSlot(normalizedEntry);
  if (!equipSlot) return;

  const equippedRef = getEquippedItemRef(equipSlot);
  const alreadyEquipped = isSameInventoryEntryAsEquipped(normalizedEntry, equippedRef);

  if (alreadyEquipped) {
    setEquippedItem(equipSlot, null);
  } else if (isNftInventoryEntry(normalizedEntry)) {
    setEquippedItem(equipSlot, {
      kind: "nft",
      contractAddress: normalizedEntry.contractAddress,
      tokenId: normalizedEntry.tokenId,
      nftType: normalizedEntry.nftType,
      name: normalizedEntry.name,
      rarity: normalizedEntry.rarity,
      icon: normalizedEntry.icon,
    });
  } else {
    setEquippedItem(
      equipSlot,
      createEquippedItemRef(getSlotItemId(normalizedEntry), {
        instanceId: normalizedEntry.instanceId ?? null,
      })
    );
  }

  const itemName = getInventoryEntryDisplayName(normalizedEntry);
  showUI(`${itemName} ${alreadyEquipped ? "해제" : "장착"}`);
  lastMessageUntil = performance.now() + 800;

  updateInventoryUI();
  refreshQuestProgress();
    }

function beginQuickUseAssignment(entry) {
  if (!isQuickUseAssignableEntry(entry)) return;
  quickUseAssignState = {
    itemId: getSlotItemId(entry),
  };
  showUI("단축키를 눌러 지정하세요 (1~5, ESC 취소)", 1200);
  lastMessageUntil = performance.now() + 1200;
  updateInventoryUI();
}

function cancelQuickUseAssignment() {
  if (!quickUseAssignState) return;
  quickUseAssignState = null;
  updateInventoryUI();
}

function clearQuickUseAssignmentForEntry(entry) {
  if (!isQuickUseAssignableEntry(entry)) return;
  const itemId = getSlotItemId(entry);
  const assignedKey = getQuickUseKeyForItemId(itemId);
  if (!assignedKey) return;
  inventory.quickUse[assignedKey] = null;
  if (quickUseAssignState?.itemId === itemId) {
    quickUseAssignState = null;
  }
  showUI(`${ITEM_DEFS[itemId]?.name ?? itemId} 단축 해제`, 900);
  lastMessageUntil = performance.now() + 900;
  updateInventoryUI();
}

function commitQuickUseAssignment(key) {
  if (!quickUseAssignState) return false;
  const itemId = quickUseAssignState.itemId;
  if (!QUICK_USE_ALLOWED_KEYS.includes(key) || !hasItem(itemId)) {
    quickUseAssignState = null;
    updateInventoryUI();
    return false;
  }
  assignQuickUseKeyToItem(itemId, key);
  quickUseAssignState = null;
  showUI(`${ITEM_DEFS[itemId]?.name ?? itemId} ${key} 단축 지정`, 900);
  lastMessageUntil = performance.now() + 900;
  updateInventoryUI();
  return true;
}

    function unequipSlot(slotId) {
  const equippedRef = getEquippedItemRef(slotId);
  if (!equippedRef) return;
  toggleEquipItem(equippedRef);
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
  equippedNftHelmet: previewPlayer.getObjectByName("equippedNftHelmet"),
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
    if (previewParts.equippedPickaxe.userData.pickaxeLevel !== inventory.pickaxeLevel) {
      syncPickaxeGroupModel(previewParts.equippedPickaxe, inventory.pickaxeLevel);
    }
    previewParts.equippedPickaxe.visible = equippedPickaxe.visible;
  }
  if (previewParts.equippedSafetyHelmet) {
    previewParts.equippedSafetyHelmet.visible = equippedSafetyHelmet.visible;
  }
  if (previewParts.equippedNftHelmet) {
    previewParts.equippedNftHelmet.visible = equippedNftHelmet.visible;
  }
  equipPreviewRenderer.render(equipPreviewScene, equipPreviewCamera);
    }

    function renderEquipmentWindow() {
  const slotOrder = ["head", "body", "shoes", "tool"];
  for (const slotId of slotOrder) {
    const entry = equipmentSlotEls[slotId];
    const equippedRef = getEquippedItemRef(slotId);
    const itemId = getEquippedItemForSlot(slotId);
    const def = itemId ? ITEM_DEFS[itemId] : null;
    const hasItem = Boolean(equippedRef);

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
      const icon = createInventoryEntryVisualElement(equippedRef, { size: 34 });

      const name = document.createElement("div");
      name.textContent = itemId === "pickaxe"
        ? `${def.name} Lv.${inventory.pickaxeLevel}`
        : getInventoryEntryDisplayName(equippedRef);
      name.style.fontSize = "11px";
      name.style.fontWeight = "700";
      name.style.marginTop = "6px";

      const wrap = document.createElement("div");
      wrap.style.display = "flex";
      wrap.style.flexDirection = "column";
      wrap.style.alignItems = "center";
      wrap.appendChild(icon);
      wrap.appendChild(name);
      if (isNftInventoryEntry(equippedRef)) {
        const nftBadge = document.createElement("div");
        nftBadge.textContent = "NFT";
        nftBadge.style.marginTop = "4px";
        nftBadge.style.fontSize = "10px";
        nftBadge.style.fontWeight = "800";
        nftBadge.style.padding = "2px 6px";
        nftBadge.style.borderRadius = "999px";
        nftBadge.style.background = "rgba(106, 76, 255, 0.88)";
        nftBadge.style.color = "white";
        wrap.appendChild(nftBadge);
      }
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
  pruneQuickUseBindings();
  // (기존 작은 HUD는 숨겼으니 여기서 invEl 텍스트는 안 만듦)
  refreshEquippedPickaxeModel();
  updateEquippedVisual();
  renderEquipmentWindow();
  if (forgeWin.style.display !== "none") renderForgeWindow();
  if (refineryWin.style.display !== "none") renderRefineryWindow();
  if (frontierBuildWin && frontierBuildWin.style.display !== "none") renderFrontierBuildWindow();
  if (personalStorageOpen) renderPersonalStorageWindow();

  // 인벤 창이 열려있으면 슬롯 표시 갱신
  if (typeof invOpen !== "undefined" && invOpen) renderInventoryWindow();
  schedulePlayerSaveSync(true);
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

function formatStatNumber(value) {
  if (Math.abs(value - Math.round(value)) < 1e-6) {
    return String(Math.round(value));
  }
  return value.toFixed(2);
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
  rockHpLabel.textContent = `${rock.userData.hpLabelPrefix ?? "돌 체력"} ${formatStatNumber(hp)}/${formatStatNumber(maxHp)}`;
}

let activeMineRock = null;
let activeHarvestTree = null;
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

function findNearestHarvestTree(radius = 2.2) {
  const r2 = radius * radius;
  let best = null;
  let bestD2 = Infinity;

  for (const tree of harvestTrees) {
    if (!tree || !tree.parent || tree.userData.harvestDisabled) continue;
    const dx = tree.position.x - player.position.x;
    const dz = tree.position.z - player.position.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < r2 && d2 < bestD2) {
      best = tree;
      bestD2 = d2;
    }
  }

  return best;
}

function removeColliderAt(idx) {
  const removed = colliders[idx];
  colliders.splice(idx, 1);
  colliderBoxes.splice(idx, 1);

  if (removed?.userData) {
    removed.userData.colliderIndex = null;
  }

  // 콜라이더 인덱스가 뒤로 밀리니까, 모든 오브젝트의 인덱스를 다시 맞춘다.
  for (let i = 0; i < colliders.length; i++) {
    const colliderObj = colliders[i];
    if (!colliderObj?.userData) continue;
    colliderObj.userData.colliderIndex = i;
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
  obj.userData.colliderIndex = idx;
  return idx;

}

function getTrackedColliderIndex(obj, fallback = null) {
  const tracked = obj?.userData?.colliderIndex;
  if (typeof tracked === "number") return tracked;
  return typeof fallback === "number" ? fallback : null;
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

function restPropOnSupport(obj, supportMesh, clearance = PROP_SURFACE_CLEARANCE) {
  if (!obj || !supportMesh) return;
  obj.updateWorldMatrix(true, true);
  const objBox = new THREE.Box3().setFromObject(obj);
  const supportBox = new THREE.Box3().setFromObject(supportMesh);
  obj.position.y += supportBox.max.y + clearance - objBox.min.y;
  obj.updateWorldMatrix(true, true);
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

  const hits = groundRay.intersectObjects(groundSurfaces, false);
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
const tutorialNpcs = [];
let activeTutorialNpc = null;
let forgeStation = null;
let refineryStation = null;
let airPurifierStation = null;
let frontierAirPurifierStation = null;
let frontierActiveParcelLabel = "P6";
let frontierParcelConstructionGroups = {};
let frontierParcelConstructionRoots = {};
let frontierParcelConstructionColliders = {};
let frontierParcelBoothInteractables = {};
let frontierParcelDefs = [];
let mansionOneEntranceInteractable = null;
let mansionOneExitInteractable = null;
let mansionOneBedInteractable = null;
let mansionOneStorageInteractable = null;
let mansionOneRoomRoot = null;
let mansionOneExteriorReturn = { x: 0, z: 0, rotationY: Math.PI };
let mineGate = null;
let campGate = null;
let frontierCampGate = null;
let frontierGate = null;
let activeForgeStation = null;
const mapGates = [];
let activeMapGate = null;
let currentMapId = "광산맵";
let lastAnnouncedMapId = currentMapId;
let torchEquipped = false;
let playerAirCurrent = AIR_GAUGE_MAX;
let playerAirMax = AIR_GAUGE_MAX;
let airDepletedNoticeUntil = 0;
const mapPollutionFields = {};
const mapPurificationProgress = {
  "폐광맵": 0,
  "개척지": 0,
};
let frontierBuildState = createDefaultFrontierBuildState();

function createDefaultFrontierBuildState() {
  return Object.fromEntries(
    FRONTIER_PARCEL_LABELS.map((label) => [
      label.toLowerCase(),
      createDefaultFrontierParcelBuildEntry(label),
    ])
  );
}

function getFrontierParcelAuthorityItemId(parcelLabel) {
  return FRONTIER_AUTHORITY_ITEM_IDS[parcelLabel] ?? null;
}

function getFrontierParcelAuthorityName(parcelLabel) {
  const itemId = getFrontierParcelAuthorityItemId(parcelLabel);
  return itemId ? ITEM_DEFS[itemId]?.name ?? `${parcelLabel} 개발권` : `${parcelLabel} 개발권`;
}

function hasFrontierParcelAuthority(parcelLabel) {
  const itemId = getFrontierParcelAuthorityItemId(parcelLabel);
  return Boolean(itemId && hasItem(itemId));
}

function hasMansionOneResidenceAuthority() {
  return hasItem("mansionOneRoom101Permit");
}

function hasMansionPersonalStorageAuthority() {
  return hasMansionOneResidenceAuthority();
}

function createDefaultFrontierParcelBuildEntry(label) {
  return {
    stage: 0,
    signText: label,
    operations: createDefaultFrontierParcelOperationsState(),
  };
}

function createDefaultFrontierParcelOperationsState() {
  return {
    shop: createDefaultFrontierShopState(),
    displayA: { statusText: "비어 있음" },
    displayB: { statusText: "비어 있음" },
  };
}

function createDefaultFrontierShopState() {
  return {
    statusText: "비어 있음",
    itemId: "",
    quantity: 0,
    price: 0,
    userWallet: "",
  };
}

function formatFrontierShopStatusText(itemId, quantity, price) {
  if (!itemId || quantity <= 0) return "비어 있음";
  const itemName = ITEM_DEFS[itemId]?.name ?? itemId;
  return `${itemName} x${quantity} / ${price}G`;
}

function normalizeFrontierWalletAddress(rawAddress) {
  return String(rawAddress || "").trim().toLowerCase();
}

function getCurrentFrontierWalletAddress() {
  return normalizeFrontierWalletAddress(walletAuth.address);
}

function normalizeFrontierShopOperationEntry(rawEntry) {
  const source = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
  const itemId =
    typeof source.itemId === "string" && ITEM_DEFS[source.itemId]
      ? source.itemId
      : "";
  const quantity = itemId ? Math.max(0, Math.min(999, Math.floor(Number(source.quantity) || 0))) : 0;
  const price = itemId ? Math.max(0, Math.min(999999, Math.floor(Number(source.price) || 0))) : 0;
  const userWallet = normalizeFrontierWalletAddress(source.userWallet);
  return {
    statusText: formatFrontierShopStatusText(itemId, quantity, price),
    itemId,
    quantity,
    price,
    userWallet,
  };
}

function normalizeFrontierParcelOperationEntry(rawEntry) {
  const source = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
  const statusText = String(source.statusText ?? "비어 있음").trim().slice(0, 40) || "비어 있음";
  return { statusText };
}

function normalizeFrontierParcelOperationsState(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const defaults = createDefaultFrontierParcelOperationsState();
  return {
    shop: normalizeFrontierShopOperationEntry(source.shop ?? defaults.shop),
    displayA: normalizeFrontierParcelOperationEntry(source.displayA ?? defaults.displayA),
    displayB: normalizeFrontierParcelOperationEntry(source.displayB ?? defaults.displayB),
  };
}

function normalizeFrontierParcelBuildEntry(label, rawEntry) {
  const source = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
  const stage = Number(source.stage);
  const normalizedStage = [0, 25, 50, 75, 100].includes(stage) ? stage : 0;
  const signText =
    String(source.signText ?? label).trim().slice(0, FRONTIER_BUILDING_SIGN_MAX_CHARS) || label;
  return {
    stage: normalizedStage,
    signText,
    operations: normalizeFrontierParcelOperationsState(source.operations),
  };
}

function getFrontierShopOperation(parcelLabel = getSelectedFrontierParcelLabel()) {
  return getFrontierBuildState(parcelLabel).operations.shop;
}

function getFrontierShopAssignedWallet(parcelLabel = getSelectedFrontierParcelLabel()) {
  return normalizeFrontierWalletAddress(getFrontierShopOperation(parcelLabel).userWallet);
}

function isFrontierShopSlotUser(parcelLabel = getSelectedFrontierParcelLabel(), walletAddress = getCurrentFrontierWalletAddress()) {
  const currentWallet = normalizeFrontierWalletAddress(walletAddress);
  if (!currentWallet) return false;
  return getFrontierShopAssignedWallet(parcelLabel) === currentWallet;
}

function canManageFrontierShopSlot(parcelLabel = getSelectedFrontierParcelLabel()) {
  return hasFrontierParcelAuthority(parcelLabel);
}

function canUseFrontierShopSlot(parcelLabel = getSelectedFrontierParcelLabel()) {
  return isFrontierShopSlotUser(parcelLabel);
}

function formatFrontierShopUserDisplay(parcelLabel = getSelectedFrontierParcelLabel()) {
  const assignedWallet = getFrontierShopAssignedWallet(parcelLabel);
  return assignedWallet ? shortenWalletAddress(assignedWallet) : "미지정";
}

function getCurrentFrontierParcelLabel() {
  for (const label of FRONTIER_PARCEL_LABELS) {
    if (isPlayerInsideFrontierParcel(label)) return label;
  }
  return "";
}

function getSelectedFrontierParcelLabel() {
  const currentLabel = getCurrentFrontierParcelLabel();
  if (currentLabel) frontierActiveParcelLabel = currentLabel;
  return frontierActiveParcelLabel || "P6";
}

function getFrontierBuildState(parcelLabel = getSelectedFrontierParcelLabel()) {
  const key = String(parcelLabel || "P6").toLowerCase();
  if (!frontierBuildState[key]) {
    frontierBuildState[key] = createDefaultFrontierParcelBuildEntry(parcelLabel || "P6");
  }
  return frontierBuildState[key];
}

function getFrontierConstructionRoot(parcelLabel) {
  return frontierParcelConstructionRoots[parcelLabel] ?? null;
}

function getFrontierConstructionGroup(parcelLabel) {
  return frontierParcelConstructionGroups[parcelLabel] ?? null;
}

function getFrontierConstructionColliders(parcelLabel) {
  if (!frontierParcelConstructionColliders[parcelLabel]) {
    frontierParcelConstructionColliders[parcelLabel] = [];
  }
  return frontierParcelConstructionColliders[parcelLabel];
}

function getFrontierParcelBoothInteractables(parcelLabel) {
  if (!frontierParcelBoothInteractables[parcelLabel]) {
    frontierParcelBoothInteractables[parcelLabel] = [];
  }
  return frontierParcelBoothInteractables[parcelLabel];
}

function getFrontierParcelSafeStandingPoint(parcelLabel) {
  const parcel = frontierParcelDefs.find((entry) => entry.label === parcelLabel);
  if (!parcel) {
    return { x: player.position.x, z: player.position.z, rotationY: player.rotation.y };
  }
  const facesCenterLaneFromLeft = parcel.x < FRONTIER_MAP_X;
  return {
    x: parcel.x + (facesCenterLaneFromLeft ? parcel.width * 0.28 : -parcel.width * 0.28),
    z: parcel.z,
    rotationY: facesCenterLaneFromLeft ? Math.PI * 0.5 : -Math.PI * 0.5,
  };
}

function clearFrontierConstructionColliders(parcelLabel) {
  const colliders = getFrontierConstructionColliders(parcelLabel);
  for (const collider of colliders) {
    const colliderIndex = getTrackedColliderIndex(collider, collider?.userData?.colliderIndex);
    if (typeof colliderIndex === "number") {
      removeColliderAt(colliderIndex);
    }
    if (collider?.parent) collider.removeFromParent();
  }
  frontierParcelConstructionColliders[parcelLabel] = [];
}

function clearFrontierParcelBoothMarkers(parcelLabel) {
  const markers = getFrontierParcelBoothInteractables(parcelLabel);
  for (const marker of markers) {
    const idx = interactables.indexOf(marker);
    if (idx !== -1) interactables.splice(idx, 1);
    if (marker?.obj?.parent) marker.obj.removeFromParent();
  }
  frontierParcelBoothInteractables[parcelLabel] = [];
}

function rebuildAllFrontierConstructionVisuals() {
  for (const label of FRONTIER_PARCEL_LABELS) {
    rebuildFrontierParcelConstructionVisual(label);
  }
}

function normalizeFrontierBuildState(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const normalized = {};
  for (const label of FRONTIER_PARCEL_LABELS) {
    const key = label.toLowerCase();
    const legacyRaw = label === "P6" ? source.p6 : null;
    normalized[key] = normalizeFrontierParcelBuildEntry(label, source[key] ?? legacyRaw);
  }
  return normalized;
}

function getFrontierNextStageConfig(stage = getFrontierBuildState().stage) {
  return FRONTIER_BUILD_STAGE_CONFIG.find((entry) => entry.from === stage) ?? null;
}

function buildFrontierBuildingSign(text) {
  const wrap = new THREE.Group();
  const signWidth = 4.5;
  const signHeight = 0.95;

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(signWidth, signHeight, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x3a2b1f, roughness: 0.9 })
  );
  wrap.add(board);

  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = 1280;
  faceCanvas.height = 320;
  const faceCtx = faceCanvas.getContext("2d");
  faceCtx.fillStyle = "#f4dfa4";
  faceCtx.fillRect(0, 0, faceCanvas.width, faceCanvas.height);
  faceCtx.fillStyle = "#3b2a1e";
  faceCtx.fillRect(14, 14, faceCanvas.width - 28, faceCanvas.height - 28);
  faceCtx.fillStyle = "#f8e6b8";
  faceCtx.fillRect(24, 24, faceCanvas.width - 48, faceCanvas.height - 48);
  const safeText = String(text || "P6").trim() || "P6";
  let fontSize = 168;
  do {
    faceCtx.font = `900 ${fontSize}px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif`;
    if (faceCtx.measureText(safeText).width <= 980 || fontSize <= 60) break;
    fontSize -= 4;
  } while (fontSize > 60);
  faceCtx.fillStyle = "#2c1b0f";
  faceCtx.textAlign = "center";
  faceCtx.textBaseline = "middle";
  faceCtx.fillText(safeText, faceCanvas.width * 0.5, faceCanvas.height * 0.52);

  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(signWidth - 0.32, signHeight - 0.18),
    new THREE.MeshBasicMaterial({ map: faceTex, transparent: false })
  );
  signFace.position.z = 0.078;
  wrap.add(signFace);

  return wrap;
}

function buildFrontierBoothLabel(titleText, statusText) {
  const wrap = new THREE.Group();
  const width = 1.9;
  const height = 0.68;

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x4f3b2d, roughness: 0.88 })
  );
  wrap.add(board);

  const canvas = document.createElement("canvas");
  canvas.width = 820;
  canvas.height = 280;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4ead0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#473528";
  ctx.fillRect(12, 12, canvas.width - 24, canvas.height - 24);
  ctx.fillStyle = "#fbf1d7";
  ctx.fillRect(22, 22, canvas.width - 44, canvas.height - 44);

  const safeTitle = String(titleText || "").trim() || "부스";
  const safeStatus = String(statusText || "").trim() || "비어 있음";
  ctx.fillStyle = "#2b1d14";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 84px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif";
  ctx.fillText(safeTitle, canvas.width * 0.5, 108);

  let statusFont = 56;
  do {
    ctx.font = `800 ${statusFont}px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif`;
    if (ctx.measureText(safeStatus).width <= 650 || statusFont <= 32) break;
    statusFont -= 2;
  } while (statusFont > 32);
  ctx.fillStyle = "#7a6550";
  ctx.fillText(safeStatus, canvas.width * 0.5, 198);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.16, height - 0.14),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  face.position.z = 0.046;
  wrap.add(face);

  return wrap;
}

function buildFrontierBoothProductVisual(itemId, quantity = 0) {
  const wrap = new THREE.Group();
  if (!itemId || !ITEM_DEFS[itemId]) return wrap;

  const def = ITEM_DEFS[itemId];
  if (typeof def.makeInventoryModel === "function") {
    const model = def.makeInventoryModel();
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    model.scale.multiplyScalar(0.72 / maxDim);
    const scaledBox = new THREE.Box3().setFromObject(model);
    const center = scaledBox.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y -= scaledBox.min.y;
    wrap.add(model);
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(246, 235, 210, 0.96)";
    ctx.beginPath();
    ctx.roundRect(28, 28, 244, 244, 28);
    ctx.fill();
    ctx.fillStyle = "#5a4637";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 140px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif";
    ctx.fillText(def.icon ?? "?", canvas.width * 0.5, canvas.height * 0.48);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.88),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    wrap.add(plane);
  }

  const qtyCanvas = document.createElement("canvas");
  qtyCanvas.width = 360;
  qtyCanvas.height = 120;
  const qtyCtx = qtyCanvas.getContext("2d");
  qtyCtx.clearRect(0, 0, qtyCanvas.width, qtyCanvas.height);
  qtyCtx.fillStyle = "rgba(48,36,28,0.88)";
  qtyCtx.beginPath();
  qtyCtx.roundRect(60, 16, 240, 88, 24);
  qtyCtx.fill();
  qtyCtx.fillStyle = "#fbf1d7";
  qtyCtx.textAlign = "center";
  qtyCtx.textBaseline = "middle";
  qtyCtx.font = "800 58px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif";
  qtyCtx.fillText(`x${quantity}`, qtyCanvas.width * 0.5, qtyCanvas.height * 0.52);
  const qtyTex = new THREE.CanvasTexture(qtyCanvas);
  qtyTex.colorSpace = THREE.SRGBColorSpace;
  const qtyTag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.24),
    new THREE.MeshBasicMaterial({ map: qtyTex, transparent: true })
  );
  qtyTag.position.set(0, 0.68, 0.02);
  wrap.add(qtyTag);
  return wrap;
}

function registerFrontierBoothMarker(parcelLabel, type, title, x, y, z, slotKey = "") {
  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.6, 1.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  marker.position.set(x, y, z);
  scene.add(marker);
  const interactable = {
    obj: marker,
    board: marker,
    highlightKind: "none",
    type,
    parcelLabel,
    slotKey,
    boothTitle: title,
    text: `E : ${title}`,
  };
  interactables.push(interactable);
  getFrontierParcelBoothInteractables(parcelLabel).push(interactable);
  return interactable;
}

function rebuildFrontierParcelConstructionVisual(parcelLabel) {
  const root = getFrontierConstructionRoot(parcelLabel);
  if (!root?.parent) return;

  const existingGroup = getFrontierConstructionGroup(parcelLabel);
  if (existingGroup?.parent) {
    existingGroup.removeFromParent();
  }
  clearFrontierConstructionColliders(parcelLabel);
  clearFrontierParcelBoothMarkers(parcelLabel);

  const parcel = frontierParcelDefs.find((entry) => entry.label === parcelLabel);
  if (!parcel) return;

  const buildState = getFrontierBuildState(parcelLabel);
  const stage = buildState.stage;
  if (parcel.signObj) {
    parcel.signObj.visible = stage < 25;
  }

  const buildGroup = new THREE.Group();
  root.add(buildGroup);
  const facesCenterLaneFromLeft = parcel.x < FRONTIER_MAP_X;

  const buildingWidth = Math.max(5.8, parcel.width - 2.6);
  const buildingDepth = Math.max(5.2, parcel.height - 2.4);
  const columnY = FRONTIER_BUILDING_HEIGHT * 0.5;
  const halfW = buildingWidth * 0.5;
  const halfD = buildingDepth * 0.5;
  const lowerWallHeight = FRONTIER_BUILDING_HEIGHT * 0.36;
  const upperWallHeight = FRONTIER_BUILDING_HEIGHT * 0.26;
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x7e6b56, roughness: 0.96 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a493b, roughness: 0.88 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x766553, roughness: 0.92 });
  const markerMat = new THREE.MeshStandardMaterial({
    color: 0xd7ab56,
    roughness: 0.72,
    transparent: true,
    opacity: stage <= 0 ? 0.92 : 0.38,
  });

  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(buildingWidth, 0.05, buildingDepth),
    markerMat
  );
  marker.position.y = 0.03;
  buildGroup.add(marker);

  const frontFaceX = facesCenterLaneFromLeft ? halfW : -halfW;
  const frontBeamX = facesCenterLaneFromLeft ? halfW - 0.14 : -halfW + 0.14;
  const frontSignX = facesCenterLaneFromLeft ? halfW + 0.1 : -halfW - 0.1;
  const frontSignRotationY = facesCenterLaneFromLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
  const backWallX = facesCenterLaneFromLeft ? -halfW + 0.13 : halfW - 0.13;
  const rearTrimX = facesCenterLaneFromLeft ? -halfW + 0.42 : halfW - 0.42;

  const colliderMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
  const registerBuildCollider = (sx, sy, sz, x, y, z) => {
    const collider = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), colliderMat);
    collider.position.set(x, y, z);
    buildGroup.add(collider);
    collider.userData.colliderIndex = addCollider(collider, 1.0);
    getFrontierConstructionColliders(parcelLabel).push(collider);
  };

  if (stage >= 25) {
    const columnGeo = new THREE.BoxGeometry(0.34, FRONTIER_BUILDING_HEIGHT, 0.34);
    const columnOffsets = [
      [-halfW + 0.22, columnY, -halfD + 0.22],
      [halfW - 0.22, columnY, -halfD + 0.22],
      [-halfW + 0.22, columnY, halfD - 0.22],
      [halfW - 0.22, columnY, halfD - 0.22],
    ];
    for (const [x, y, z] of columnOffsets) {
      const column = new THREE.Mesh(columnGeo, frameMat);
      column.position.set(x, y, z);
      buildGroup.add(column);
      registerBuildCollider(0.38, FRONTIER_BUILDING_HEIGHT, 0.38, x, y, z);
    }

    const frontBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.34, buildingDepth - 0.2),
      frameMat
    );
    frontBeam.position.set(frontBeamX, FRONTIER_BUILDING_HEIGHT - 0.32, 0);
    buildGroup.add(frontBeam);
    registerBuildCollider(0.34, 0.4, buildingDepth - 0.12, frontBeamX, FRONTIER_BUILDING_HEIGHT - 0.32, 0);

    const signWrap = buildFrontierBuildingSign(buildState.signText);
    signWrap.position.set(frontSignX, FRONTIER_BUILDING_HEIGHT - 0.12, 0);
    signWrap.rotation.y = frontSignRotationY;
    buildGroup.add(signWrap);
  }

  if (stage >= 50) {
    const sideWallGeo = new THREE.BoxGeometry(buildingWidth, lowerWallHeight, 0.26);
    const sideNorth = new THREE.Mesh(sideWallGeo, bodyMat);
    sideNorth.position.set(0, lowerWallHeight * 0.5, -halfD + 0.13);
    buildGroup.add(sideNorth);
    registerBuildCollider(buildingWidth, lowerWallHeight, 0.3, 0, lowerWallHeight * 0.5, -halfD + 0.13);

    const sideSouth = new THREE.Mesh(sideWallGeo, bodyMat);
    sideSouth.position.set(0, lowerWallHeight * 0.5, halfD - 0.13);
    buildGroup.add(sideSouth);
    registerBuildCollider(buildingWidth, lowerWallHeight, 0.3, 0, lowerWallHeight * 0.5, halfD - 0.13);

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, lowerWallHeight + 0.18, buildingDepth),
      bodyMat
    );
    backWall.position.set(backWallX, (lowerWallHeight + 0.18) * 0.5, 0);
    buildGroup.add(backWall);
    registerBuildCollider(0.3, lowerWallHeight + 0.18, buildingDepth, backWallX, (lowerWallHeight + 0.18) * 0.5, 0);
  }

  if (stage >= 75) {
    const upperNorth = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth, upperWallHeight, 0.18),
      frameMat
    );
    upperNorth.position.set(0, lowerWallHeight + upperWallHeight * 0.5 + 0.08, -halfD + 0.09);
    buildGroup.add(upperNorth);
    registerBuildCollider(buildingWidth, upperWallHeight, 0.22, 0, lowerWallHeight + upperWallHeight * 0.5 + 0.08, -halfD + 0.09);

    const upperSouth = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth, upperWallHeight, 0.18),
      frameMat
    );
    upperSouth.position.set(0, lowerWallHeight + upperWallHeight * 0.5 + 0.08, halfD - 0.09);
    buildGroup.add(upperSouth);
    registerBuildCollider(buildingWidth, upperWallHeight, 0.22, 0, lowerWallHeight + upperWallHeight * 0.5 + 0.08, halfD - 0.09);

    const roofFrame = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth, 0.16, buildingDepth),
      frameMat
    );
    roofFrame.position.set(0, FRONTIER_BUILDING_HEIGHT - 0.08, 0);
    buildGroup.add(roofFrame);
  }

  if (stage >= 100) {
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth, 0.22, buildingDepth),
      roofMat
    );
    roof.position.set(0, FRONTIER_BUILDING_HEIGHT + 0.05, 0);
    buildGroup.add(roof);
    registerBuildCollider(buildingWidth, 0.26, buildingDepth, 0, FRONTIER_BUILDING_HEIGHT + 0.05, 0);

    const rearTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, FRONTIER_BUILDING_HEIGHT * 0.52, buildingDepth - 0.6),
      frameMat
    );
    rearTrim.position.set(rearTrimX, FRONTIER_BUILDING_HEIGHT * 0.42, 0);
    buildGroup.add(rearTrim);

    const boothBaseMat = new THREE.MeshStandardMaterial({ color: 0xc8b494, roughness: 0.95 });
    const boothTopMat = new THREE.MeshStandardMaterial({ color: 0x8d755f, roughness: 0.88 });
    const boothWidth = 1.45;
    const boothDepth = 1.05;
    const boothHeight = 0.86;
    const boothTopHeight = 0.14;
    const boothY = boothHeight * 0.5;
    const boothTopY = boothHeight + boothTopHeight * 0.5;
    const labelY = boothHeight + 0.78;
    const sideLaneZ = halfD - 1.1;
    const displayX = facesCenterLaneFromLeft ? [-0.95, -0.95] : [0.95, 0.95];
    const boothEntries = [
      {
        title: "전시 A",
        status: buildState.operations.displayA.statusText,
        x: displayX[0],
        z: -sideLaneZ,
      },
      {
        title: "전시 B",
        status: buildState.operations.displayB.statusText,
        x: displayX[1],
        z: sideLaneZ,
      },
      {
        title: "상점",
        status: buildState.operations.shop.statusText,
        x: facesCenterLaneFromLeft ? 1.18 : -1.18,
        z: 0,
      },
    ];

    for (const booth of boothEntries) {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(boothWidth, boothHeight, boothDepth),
        boothBaseMat
      );
      base.position.set(booth.x, boothY, booth.z);
      buildGroup.add(base);

      const top = new THREE.Mesh(
        new THREE.BoxGeometry(boothWidth + 0.1, boothTopHeight, boothDepth + 0.14),
        boothTopMat
      );
      top.position.set(booth.x, boothTopY, booth.z);
      buildGroup.add(top);

      const label = buildFrontierBoothLabel(booth.title, booth.status);
      label.position.set(booth.x, labelY, booth.z);
      label.rotation.y = facesCenterLaneFromLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
      buildGroup.add(label);

      if (booth.title === "상점" && buildState.operations.shop.itemId && buildState.operations.shop.quantity > 0) {
        const productWrap = buildFrontierBoothProductVisual(
          buildState.operations.shop.itemId,
          buildState.operations.shop.quantity
        );
        productWrap.position.set(booth.x, boothTopY + 0.08, booth.z);
        productWrap.rotation.y = facesCenterLaneFromLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
        buildGroup.add(productWrap);
      }

      registerBuildCollider(
        boothWidth - 0.16,
        boothHeight + boothTopHeight,
        boothDepth - 0.12,
        booth.x,
        boothHeight * 0.5,
        booth.z
      );

      const boothInteractOffsetX = facesCenterLaneFromLeft ? 0.88 : -0.88;
      const boothWorldPos = buildGroup.localToWorld(
        new THREE.Vector3(booth.x + boothInteractOffsetX, 0.82, booth.z)
      );
      registerFrontierBoothMarker(
        parcelLabel,
        booth.title === "상점" ? "frontierShopBooth" : "frontierDisplayBooth",
        booth.title,
        boothWorldPos.x,
        boothWorldPos.y,
        boothWorldPos.z,
        booth.title === "상점" ? "shop" : booth.title === "전시 A" ? "displayA" : "displayB"
      );
    }
  }

  frontierParcelConstructionGroups[parcelLabel] = buildGroup;
  ensurePlayerNotInsideGeneratedColliders(
    getFrontierConstructionColliders(parcelLabel),
    getFrontierParcelSafeStandingPoint(parcelLabel)
  );
}

function updateSceneFogForCurrentMap() {
  const mineDoorThresholdZ = mineGate.position.z - 0.35;
  const campDoorThresholdZ = campGate.position.z + 0.35;

  let caveBlend = 0;
  if (player.position.z <= campDoorThresholdZ) {
    caveBlend = 1;
  } else if (player.position.z >= mineDoorThresholdZ) {
    caveBlend = 0;
  } else {
    const rawBlend = 1 - ((player.position.z - campDoorThresholdZ) / (mineDoorThresholdZ - campDoorThresholdZ));
    caveBlend = THREE.MathUtils.smoothstep(rawBlend, 0, 1);
  }

  ambientLight.intensity = 0.8;
  sunLight.intensity = 0.4;

  for (const entry of caveDarkenableMaterials) {
    const targetScalar = CAVE_DARKENING_ENABLED ? entry.minScalar : 1;
    const scalar = THREE.MathUtils.lerp(1, targetScalar, caveBlend);
    entry.material.color.copy(entry.baseColor).multiplyScalar(scalar);
  }

  const effectiveCaveBlend = CAVE_FOG_EFFECT_ENABLED ? caveBlend : 0;
  const caveFogNear = torchEquipped ? 5.6 : 1.8;
  const caveFogFar = torchEquipped ? 18.0 : 5.6;
  scene.fog.color.copy(new THREE.Color(WORLD_FOG_COLOR)).lerp(new THREE.Color(CAVE_FOG_COLOR), effectiveCaveBlend);
  scene.fog.near = THREE.MathUtils.lerp(WORLD_FOG_NEAR, caveFogNear, effectiveCaveBlend);
  scene.fog.far = THREE.MathUtils.lerp(WORLD_FOG_FAR, caveFogFar, effectiveCaveBlend);

  torchLight.visible = effectiveCaveBlend > 0.02 && torchEquipped;
  torchLight.intensity = THREE.MathUtils.lerp(0, 1.8, effectiveCaveBlend);
  torchLight.distance = THREE.MathUtils.lerp(14, 24, effectiveCaveBlend);
  torchLight.position.copy(player.position).add(new THREE.Vector3(0, 1.55, 0));
}

function getMapPollutionConfig(mapId = currentMapId) {
  return MAP_POLLUTION_CONFIG[mapId] ?? null;
}

function isPollutedMap(mapId = currentMapId) {
  return Boolean(getMapPollutionConfig(mapId));
}

function getMapPurificationValue(mapId = currentMapId) {
  return Math.max(0, Math.min(100, mapPurificationProgress[mapId] ?? 0));
}

function setMapPurificationValue(mapId, value) {
  if (!getMapPollutionConfig(mapId)) return;
  mapPurificationProgress[mapId] = Math.max(0, Math.min(100, value));
}

function getCurrentAirDrainPerSecond() {
  const effectiveMapId = getEffectiveAirMapId();
  const cfg = getMapPollutionConfig(effectiveMapId);
  if (!cfg) return 0;
  const purifyRatio = getMapPurificationValue(effectiveMapId) / 100;
  return cfg.drainPerSecondAtZeroPurify * Math.pow(1 - purifyRatio, 1.1);
}

function canRecoverAirInMap(mapId = currentMapId) {
  if (mapId == null) return true;
  if (!isPollutedMap(mapId)) return true;
  return getMapPurificationValue(mapId) >= 100;
}

function updateAirHud() {
  if (!canPlayGame()) {
    airHudWrap.style.display = "none";
    return;
  }

  airHudWrap.style.display = "block";
  const airRatio = playerAirMax > 0 ? Math.max(0, Math.min(1, playerAirCurrent / playerAirMax)) : 0;
  airHudValue.textContent = `${Math.round(playerAirCurrent)} / ${playerAirMax}`;
  airHudBarFill.style.width = `${Math.round(airRatio * 100)}%`;
  airHudBarFill.style.background =
    airRatio <= 0.18
      ? "linear-gradient(90deg, #ff6a6a 0%, #ffb066 100%)"
      : airRatio <= 0.45
        ? "linear-gradient(90deg, #ffcf5b 0%, #ffec8a 100%)"
        : "linear-gradient(90deg, #5be7ff 0%, #a2fff0 100%)";

  const effectiveMapId = getEffectiveAirMapId();
  if (effectiveMapId == null) {
    airHudStatus.textContent = `연결통로는 호흡 가능한 구역입니다. 초당 ${AIR_RECOVERY_PER_SECOND.toFixed(1)} 공기 회복`;
    airHudPurify.textContent = "";
    return;
  }

  if (!isPollutedMap(effectiveMapId)) {
    airHudStatus.textContent = `현재 맵은 호흡 가능한 구역입니다. 초당 ${AIR_RECOVERY_PER_SECOND.toFixed(1)} 공기 회복`;
    airHudPurify.textContent = "";
    return;
  }

  const purify = getMapPurificationValue(effectiveMapId);
  const drain = getCurrentAirDrainPerSecond();
  airHudStatus.textContent = purify >= 100
    ? `정화 완료: 초당 ${AIR_RECOVERY_PER_SECOND.toFixed(1)} 공기 회복`
    : `오염 구역: 초당 ${drain.toFixed(2)} 공기 소모`;
  airHudPurify.textContent = `${getMapPollutionConfig(effectiveMapId)?.displayName ?? effectiveMapId} 정화율 ${purify}%`;
}

function buildPollutionFieldForMap(mapId, centerX, centerZ, halfSize) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(CAVE_POLLUTION_PARTICLE_COUNT * 3);
  const phases = new Float32Array(CAVE_POLLUTION_PARTICLE_COUNT);
  const base = new Float32Array(CAVE_POLLUTION_PARTICLE_COUNT * 3);

  for (let i = 0; i < CAVE_POLLUTION_PARTICLE_COUNT; i += 1) {
    const x = centerX + randRange(-halfSize, halfSize);
    const y = randRange(0.55, 6.35);
    const z = centerZ + randRange(-halfSize, halfSize);
    const j = i * 3;
    positions[j] = x;
    positions[j + 1] = y;
    positions[j + 2] = z;
    base[j] = x;
    base[j + 1] = y;
    base[j + 2] = z;
    phases[i] = randRange(0, Math.PI * 2);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleTextureCanvas = document.createElement("canvas");
  particleTextureCanvas.width = 64;
  particleTextureCanvas.height = 64;
  const particleTextureCtx = particleTextureCanvas.getContext("2d");
  const particleGradient = particleTextureCtx.createRadialGradient(32, 32, 6, 32, 32, 32);
  particleGradient.addColorStop(0, "rgba(255, 227, 173, 0.95)");
  particleGradient.addColorStop(0.35, "rgba(230, 197, 131, 0.78)");
  particleGradient.addColorStop(0.72, "rgba(160, 122, 74, 0.32)");
  particleGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  particleTextureCtx.fillStyle = particleGradient;
  particleTextureCtx.fillRect(0, 0, 64, 64);
  const particleTexture = new THREE.CanvasTexture(particleTextureCanvas);
  particleTexture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.PointsMaterial({
    color: 0xd8bb86,
    size: 0.9,
    map: particleTexture,
    alphaMap: particleTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });

  const field = new THREE.Points(geometry, material);
  field.frustumCulled = false;
  field.renderOrder = 4;
  scene.add(field);
  mapPollutionFields[mapId] = {
    field,
    material,
    base,
    phase: phases,
    strength: 0,
  };
}

function buildCavePollutionField() {
  buildPollutionFieldForMap("폐광맵", CAMP_MAP_X, CAMP_MAP_Z, GROUND_SIZE * 0.5 - 6);
  buildPollutionFieldForMap("개척지", FRONTIER_MAP_X, FRONTIER_MAP_Z, FRONTIER_GROUND_SIZE * 0.5 - 4);
}

function getMapPollutionVisualStrength(mapId = currentMapId) {
  if (!isPollutedMap(mapId)) return 0;
  const purifyRatio = getMapPurificationValue(mapId) / 100;
  return Math.pow(1 - purifyRatio, 1.08);
}

function updateCavePollutionVisuals(dt) {
  const localPollutionStrength = getMapPollutionVisualStrength(getEffectiveAirMapId());
  const time = performance.now() * 0.001;

  for (const [mapId, pollutionField] of Object.entries(mapPollutionFields)) {
    if (!pollutionField?.field || !pollutionField.material || !pollutionField.base || !pollutionField.phase) continue;
    const targetStrength = getMapPollutionVisualStrength(mapId);
    pollutionField.strength = THREE.MathUtils.lerp(
      pollutionField.strength,
      targetStrength,
      Math.min(1, dt * 2.4)
    );

    pollutionField.field.visible = pollutionField.strength > 0.02;
    pollutionField.material.opacity = pollutionField.strength * 0.82;

    if (pollutionField.field.visible) {
      const positions = pollutionField.field.geometry.attributes.position.array;
      for (let i = 0; i < CAVE_POLLUTION_PARTICLE_COUNT; i += 1) {
        const j = i * 3;
        const phase = pollutionField.phase[i];
        positions[j] =
          pollutionField.base[j] +
          Math.sin(time * 0.31 + phase) * CAVE_POLLUTION_PARTICLE_SWAY * pollutionField.strength;
        positions[j + 1] =
          pollutionField.base[j + 1] +
          Math.sin(time * 0.48 + phase * 1.7) * 0.08 * pollutionField.strength;
        positions[j + 2] =
          pollutionField.base[j + 2] +
          Math.cos(time * 0.27 + phase * 1.3) * CAVE_POLLUTION_PARTICLE_SWAY * pollutionField.strength;
      }
      pollutionField.field.geometry.attributes.position.needsUpdate = true;
    }
  }

  const airRatio = playerAirMax > 0 ? Math.max(0, Math.min(1, playerAirCurrent / playerAirMax)) : 1;
  let lowAirBlurStrength = 0;
  if (airRatio < 0.5) {
    if (airRatio >= 0.2) {
      lowAirBlurStrength = ((0.5 - airRatio) / 0.3) * 0.6;
    } else {
      const severeFactor = Math.max(0, (0.2 - airRatio) / 0.2);
      lowAirBlurStrength = 0.6 + Math.pow(severeFactor, 1.16) * 1.3;
    }
  }
  const overlayOpacity = Math.min(
    CAVE_POLLUTION_OVERLAY_MAX_OPACITY,
    localPollutionStrength * 0.12 + lowAirBlurStrength * 0.96
  );
  pollutionOverlay.style.opacity = overlayOpacity.toFixed(3);
  const blurPx = Math.min(
    LOW_AIR_EDGE_BLUR_MAX_PX,
    localPollutionStrength * 2.4 + lowAirBlurStrength * LOW_AIR_EDGE_BLUR_MAX_PX
  );
  pollutionOverlay.style.backdropFilter = `blur(${blurPx.toFixed(2)}px)`;
  pollutionOverlay.style.webkitBackdropFilter = `blur(${blurPx.toFixed(2)}px)`;
}

function useFreshAirCanister() {
  if (!hasItem("freshAirCanister")) {
    showUI("신선한 공기 캔이 없습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  if (playerAirCurrent >= playerAirMax) {
    showUI("공기 게이지가 이미 가득 찼습니다.", 900);
    lastMessageUntil = performance.now() + 900;
    return false;
  }
  if (!consumeItem("freshAirCanister", 1)) {
    showUI("신선한 공기 캔을 사용할 수 없습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  playerAirCurrent = Math.min(playerAirMax, playerAirCurrent + AIR_CANISTER_RESTORE_AMOUNT);
  airDepletedNoticeUntil = 0;
  updateInventoryUI();
  updateAirHud();
  schedulePlayerSaveSync(true);
  showUI("신선한 공기를 보충했습니다.", 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function useQuickUseItem(key) {
  const itemId = getQuickUseItemId(key);
  if (!itemId) return false;

  if (itemId === "freshAirCanister") {
    return useFreshAirCanister();
  }

  return false;
}

function getDefaultRefineryRecipe() {
  return REFINERY_RECIPES.purifyPowder;
}

function getRefineryRecipeEntries() {
  return Object.values(REFINERY_RECIPES);
}

function getSelectedRefineryRecipe() {
  return REFINERY_RECIPES[refinerySelectedRecipeId] ?? getDefaultRefineryRecipe();
}

function getRefineryRecipeDescription(recipe) {
  if (!recipe) return "";
  if (recipe.outputItemId === "purifyPowder") {
    return "정화 가루는 공기 정화탑에 사용할 수 있는 정화용 가공 분말입니다.";
  }
  if (recipe.outputItemId === "woodPlank") {
    return "목재는 앞으로 빈 땅에 건축물을 세울 때 사용할 기본 건축 재료입니다.";
  }
  return `${ITEM_DEFS[recipe.outputItemId]?.name ?? recipe.outputItemId} 제작 결과물`;
}

function getRefineryHintText() {
  if (refineryOpen) return "재련대 이용 중";
  return "E : 재련대 사용";
}

function tryUseRefineryRecipe(recipe = getSelectedRefineryRecipe()) {
  if (!recipe) return false;

  const inputName = ITEM_DEFS[recipe.inputItemId]?.name ?? recipe.inputItemId;
  const outputName = ITEM_DEFS[recipe.outputItemId]?.name ?? recipe.outputItemId;

  if (getItemCount(recipe.inputItemId) < recipe.inputCount) {
    showUI(`${inputName} ${recipe.inputCount}개가 필요합니다.`, 1100);
    lastMessageUntil = performance.now() + 1100;
    return true;
  }

  if (!consumeItem(recipe.inputItemId, recipe.inputCount)) {
    showUI("재련 재료를 소모하지 못했습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return true;
  }

  if (!addItem(recipe.outputItemId, recipe.outputCount)) {
    addItem(recipe.inputItemId, recipe.inputCount);
    showUI("인벤토리가 가득 차 재련할 수 없습니다.", 1100);
    lastMessageUntil = performance.now() + 1100;
    return true;
  }

  refinerySuccessMessage = `${outputName} ${recipe.outputCount}개 재련 완료`;
  refinerySuccessUntil = performance.now() + 1000;
  updateInventoryUI();
  schedulePlayerSaveSync(true);
  showUI(refinerySuccessMessage, 1000);
  lastMessageUntil = performance.now() + 1000;
  if (refineryOpen) {
    renderRefineryWindow();
    setTimeout(() => {
      if (refineryOpen) renderRefineryWindow();
    }, 1020);
  }
  return true;
}

function getRefineryDistance() {
  if (!refineryStation?.parent) return Infinity;
  return refineryStation.position.distanceTo(player.position);
}

function getAirPurifierHintText(mapId = "폐광맵") {
  const cfg = getMapPollutionConfig(mapId);
  const purify = getMapPurificationValue(mapId);
  if (!cfg) return "E : 공기 정화탑 가동";
  if (purify >= 100) return `${cfg.displayName} 정화 완료`;
  if (currentMapId !== mapId) return `${cfg.displayName} 정화율 ${purify}%`;
  if (getItemCount("purifyPowder") < cfg.purifierPowderCost) {
    return `정화 가루 ${cfg.purifierPowderCost}개 필요`;
  }
  return `E : 공기 정화탑 가동 (+${cfg.purifierGain}% / 정화 가루 ${cfg.purifierPowderCost})`;
}

function tryUseAirPurifier(mapId = "폐광맵") {
  const cfg = getMapPollutionConfig(mapId);
  if (!cfg) return false;
  const currentPurify = getMapPurificationValue(mapId);
  if (currentPurify >= 100) {
    showUI(`${cfg.displayName} 공기 정화탑 가동이 이미 완료되었습니다.`, 1100);
    lastMessageUntil = performance.now() + 1100;
    return true;
  }
  if (!consumeItem("purifyPowder", cfg.purifierPowderCost)) {
    showUI(`정화 가루 ${cfg.purifierPowderCost}개가 필요합니다.`, 1100);
    lastMessageUntil = performance.now() + 1100;
    return true;
  }
  const nextPurify = Math.min(100, currentPurify + cfg.purifierGain);
  setMapPurificationValue(mapId, nextPurify);
  updateInventoryUI();
  updateAirHud();
  schedulePlayerSaveSync(true);
  if (nextPurify >= 100) {
    showUI(`${cfg.displayName} 공기 정화탑 가동 완료! 이제 공기를 소모하지 않습니다.`, 1400);
    lastMessageUntil = performance.now() + 1400;
  } else {
    showUI(`${cfg.displayName} 정화율 ${nextPurify}%`, 1000);
    lastMessageUntil = performance.now() + 1000;
  }
  return true;
}

function enterMansionOneRoom() {
  if (!mansionOneRoomRoot) return false;
  player.position.set(
    mansionOneRoomRoot.position.x,
    player.position.y,
    mansionOneRoomRoot.position.z + 4.2
  );
  player.rotation.y = Math.PI;
  latestMoveDir.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  snapCameraToPlayer();
  showUI("Mansion ONE 101호 입장", 1000);
  return true;
}

function exitMansionOneRoom() {
  mansionSleepPoseActive = false;
  setMansionSleepOpen(false);
  setPersonalStorageOpen(false);
  player.position.set(
    mansionOneExteriorReturn.x,
    player.position.y,
    mansionOneExteriorReturn.z
  );
  player.rotation.y = mansionOneExteriorReturn.rotationY;
  latestMoveDir.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  snapCameraToPlayer();
  showUI("Mansion ONE 외부로 나왔습니다.", 1000);
  return true;
}

function setMansionSleepOpen(v) {
  mansionSleepOpen = v;
  if (!mansionSleepOverlay || !mansionSleepDialog) return;
  mansionSleepOverlay.style.display = v ? "block" : "none";
  mansionSleepDialog.style.display = v ? "block" : "none";
}

function openMansionSleepDialog() {
  if (!mansionOneBedInteractable) return;
  mansionSleepWakePoint = {
    x: mansionOneBedInteractable.obj.position.x + 1.95,
    z: mansionOneBedInteractable.obj.position.z + 0.2,
    rotationY: Math.PI * -0.5,
  };
  player.position.set(
    mansionOneBedInteractable.obj.position.x - 0.15,
    player.position.y,
    mansionOneBedInteractable.obj.position.z
  );
  player.rotation.y = Math.PI * -0.5;
  latestMoveDir.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  mansionSleepPoseActive = true;
  snapCameraToPlayer();
  setMansionSleepOpen(true);
}

function closeMansionSleepDialog() {
  mansionSleepPoseActive = false;
  setMansionSleepOpen(false);
  player.position.set(
    mansionSleepWakePoint.x,
    player.position.y,
    mansionSleepWakePoint.z
  );
  player.rotation.y = mansionSleepWakePoint.rotationY;
  latestMoveDir.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  snapCameraToPlayer();
}

function openPersonalStorage() {
  if (!hasMansionPersonalStorageAuthority()) {
    showUI("101호 거주권 필요", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  setPersonalStorageOpen(true);
  return true;
}

async function confirmMansionSleepLogout() {
  setMansionSleepOpen(false);
  if (isServerBackedWalletSession()) {
    await handleWalletLogout();
    return;
  }
  clearWalletSession();
  walletLoginStatus.textContent = "로그아웃되었습니다. 다시 로그인해주세요.";
}

function updateAirSystem(dt) {
  if (!canPlayGame()) {
    updateAirHud();
    return;
  }

  const effectiveMapId = getEffectiveAirMapId();
  if (canRecoverAirInMap(effectiveMapId)) {
    playerAirCurrent = Math.min(playerAirMax, playerAirCurrent + AIR_RECOVERY_PER_SECOND * dt);
  } else if (isPollutedMap(effectiveMapId)) {
    const purify = getMapPurificationValue(effectiveMapId);
    if (purify < 100) {
      playerAirCurrent = Math.max(0, playerAirCurrent - getCurrentAirDrainPerSecond() * dt);
      if (playerAirCurrent <= 0 && performance.now() > airDepletedNoticeUntil) {
        showUI("공기가 바닥났습니다. R로 신선한 공기 캔을 사용하세요.", 1200);
        airDepletedNoticeUntil = performance.now() + 2200;
      }
    }
  }

  updateAirHud();
}
let mapTransitionLockUntil = 0;
let mapTransitionPending = null;
let forgeOpen = false;
let refineryOpen = false;
let refinerySelectedRecipeId = "purifyPowder";
let refinerySuccessUntil = 0;
let refinerySuccessMessage = "";
const FORGE_UPGRADE_DELAY_MS = 1050;
let forgePendingUpgrade = null;
let forgeLastResult = null;

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

function registerTutorialNpc(obj, name, hint = "Space : 대화") {
  const entry = { obj, name, hint };
  tutorialNpcs.push(entry);
  return entry;
}

function findNearestTutorialNpc(radius = 2.2) {
  let best = null;
  let bestD2 = radius * radius;
  for (const entry of tutorialNpcs) {
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

function registerMapGate(entry) {
  mapGates.push(entry);
  return entry;
}

function registerConnectorTunnelZone(centerX, minZ, maxZ, halfWidth = 7.2) {
  connectorTunnelZones.push({
    centerX,
    minZ: Math.min(minZ, maxZ),
    maxZ: Math.max(minZ, maxZ),
    halfWidth,
  });
}

function findTriggeredMapGate() {
  if (performance.now() < mapTransitionLockUntil) return null;
  for (const gate of mapGates) {
    if (gate.mapId !== currentMapId) continue;
    const dx = player.position.x - gate.trigger.x;
    const dz = player.position.z - gate.trigger.z;
    if (typeof gate.trigger.width === "number" && typeof gate.trigger.depth === "number") {
      if (
        Math.abs(dx) <= gate.trigger.width * 0.5 &&
        Math.abs(dz) <= gate.trigger.depth * 0.5
      ) {
        return gate;
      }
      continue;
    }
    if (dx * dx + dz * dz <= gate.trigger.radius * gate.trigger.radius) return gate;
  }
  return null;
}

function canUseMapGate(gate) {
  if (!gate) return false;
  if (typeof gate.require === "function") {
    return gate.require();
  }
  return true;
}

function updateCurrentMapFromPlayerPosition() {
  const mineDoorThresholdZ = mineGate.position.z - 0.35;
  const campDoorThresholdZ = campGate.position.z + 0.35;
  const campNorthDoorThresholdZ = frontierCampGate.position.z - 0.35;
  const frontierDoorThresholdZ = frontierGate.position.z + 0.35;

  if (player.position.z <= frontierDoorThresholdZ) {
    currentMapId = "개척지";
    return;
  }

  if (player.position.z <= campDoorThresholdZ && player.position.z > campNorthDoorThresholdZ) {
    currentMapId = "폐광맵";
    return;
  }

  if (player.position.z >= mineDoorThresholdZ) {
    currentMapId = "광산맵";
  }
}

function isPlayerInConnectorTunnel() {
  for (const zone of connectorTunnelZones) {
    if (
      player.position.z < zone.maxZ &&
      player.position.z > zone.minZ &&
      Math.abs(player.position.x - zone.centerX) <= zone.halfWidth
    ) {
      return true;
    }
  }
  return false;
}

function getEffectiveAirMapId() {
  if (isPlayerInConnectorTunnel()) return null;
  return currentMapId;
}

function isPlayerInsideFrontierParcel(parcelLabel) {
  const parcel = frontierParcelDefs.find((entry) => entry.label === parcelLabel);
  if (!parcel || currentMapId !== "개척지") return false;
  return (
    Math.abs(player.position.x - parcel.x) <= parcel.width * 0.5 &&
    Math.abs(player.position.z - parcel.z) <= parcel.height * 0.5
  );
}
function renderFrontierBuildWindow() {
  const parcelLabel = getSelectedFrontierParcelLabel();
  const buildState = getFrontierBuildState(parcelLabel);
  const isCompleted = buildState.stage >= 100;
  const hasAuthority = hasFrontierParcelAuthority(parcelLabel);
  const canManageShop = canManageFrontierShopSlot(parcelLabel);
  const canUseShop = canUseFrontierShopSlot(parcelLabel);
  const assignedWallet = getFrontierShopAssignedWallet(parcelLabel);
  const nextStage = getFrontierNextStageConfig(buildState.stage);
  const woodOwned = getItemCount("woodPlank");
  const stoneOwned = getItemCount("masonryStone");

  frontierBuildTitle.textContent = `${parcelLabel} 건축 진행`;
  frontierBuildHeaderNote.textContent = isCompleted ? "개척지 건축 완료" : "개척지 건축 예정지";
  frontierBuildStageCard.innerHTML = "";
  frontierBuildRequirementCard.innerHTML = "";
  frontierBuildOwnedCard.innerHTML = "";

  const stageTitle = document.createElement("div");
  stageTitle.textContent = `현재 진척도 ${buildState.stage}%`;
  stageTitle.style.fontSize = "24px";
  stageTitle.style.fontWeight = "900";
  stageTitle.style.color = "#222";
  frontierBuildStageCard.appendChild(stageTitle);

  const stageDesc = document.createElement("div");
  stageDesc.style.marginTop = "10px";
  stageDesc.style.fontSize = "13px";
  stageDesc.style.lineHeight = "1.65";
  stageDesc.style.color = "#555";
  stageDesc.textContent =
    isCompleted
      ? "건축이 완료되었습니다. 이 필지의 상점 슬롯 1개와 전시 슬롯 2개의 운영 상태를 여기서 확인할 수 있습니다."
      : nextStage
        ? `${nextStage.label} 단계로 올리려면 목재 ${nextStage.wood}개와 석재 ${nextStage.stone}개가 필요합니다.`
        : "건축 대기 중";
  frontierBuildStageCard.appendChild(stageDesc);

  if (isCompleted) {
    frontierBuildRequirementCard.innerHTML = `
      <div style="font-size:13px;font-weight:800;color:#222;">건축 상태</div>
      <div style="margin-top:10px;font-size:14px;line-height:1.8;color:#444;">
        <div>현재 상태: <strong>건축 완료</strong></div>
        <div>건물 운영은 내부 부스 앞에서 <strong>E</strong>키로 진행할 수 있습니다.</div>
        <div style="margin-top:6px;opacity:0.72;">상점은 판매 관리/보기, 전시는 관리/보기로 분리됩니다.</div>
      </div>
    `;

    frontierBuildOwnedCard.innerHTML = `
      <div style="font-size:13px;font-weight:800;color:#222;">운영 슬롯 요약</div>
      <div style="margin-top:10px;font-size:14px;line-height:1.8;color:#444;">
        <div>상점 슬롯 1: <strong>${buildState.operations.shop.statusText}</strong></div>
        <div>전시 슬롯 A: <strong>${buildState.operations.displayA.statusText}</strong></div>
        <div>전시 슬롯 B: <strong>${buildState.operations.displayB.statusText}</strong></div>
      </div>
    `;
    frontierBuildShopManagerCard.style.display = "none";
  } else {
    frontierBuildRequirementCard.innerHTML = `
      <div style="font-size:13px;font-weight:800;color:#222;">다음 단계 필요 재료</div>
      <div style="margin-top:10px;font-size:14px;line-height:1.8;color:#444;">
        <div>목재: <strong>${nextStage ? nextStage.wood : 0}</strong></div>
        <div>석재: <strong>${nextStage ? nextStage.stone : 0}</strong></div>
      </div>
    `;

    frontierBuildOwnedCard.innerHTML = `
      <div style="font-size:13px;font-weight:800;color:#222;">현재 보유 재료</div>
      <div style="margin-top:10px;font-size:14px;line-height:1.8;color:#444;">
        <div>목재: <strong>${woodOwned}</strong></div>
        <div>석재: <strong>${stoneOwned}</strong></div>
      </div>
    `;
    frontierBuildShopManagerCard.style.display = "none";
  }

  const canAdvance = Boolean(
    nextStage &&
    woodOwned >= nextStage.wood &&
    stoneOwned >= nextStage.stone
  );
  frontierBuildActionBtn.disabled = isCompleted ? true : !nextStage || !canAdvance;
  frontierBuildActionBtn.textContent = isCompleted ? "건축 완료" : nextStage ? "건축 진행" : "완공";
  frontierBuildActionBtn.style.opacity = frontierBuildActionBtn.disabled ? "0.58" : "1";
  frontierBuildActionBtn.style.cursor = frontierBuildActionBtn.disabled ? "default" : "pointer";

  frontierBuildNotice.textContent =
    isCompleted
      ? "건축은 완료되었습니다. 상점/전시 운영은 각 부스 앞에서 E키로 관리하거나 볼 수 있습니다."
      : canAdvance
        ? "재료가 충분합니다. 건축 진행을 누르면 다음 단계로 즉시 상승합니다."
        : "다음 단계를 올리려면 필요한 목재와 석재를 먼저 준비해야 합니다.";

  frontierBuildSignCard.style.display = isCompleted ? "block" : "none";
  frontierBuildSignInput.value = buildState.signText;
  frontierBuildSignInput.disabled = !isCompleted || !hasAuthority;
  frontierBuildSignSaveBtn.disabled = !isCompleted || !hasAuthority;
}

function setFrontierBuildOpen(v) {
  frontierBuildOpen = v;
  if (!v) {
    closeFrontierShopRegisterDialog();
  }
  frontierBuildOverlay.style.display = frontierBuildOpen ? "block" : "none";
  frontierBuildWin.style.display = frontierBuildOpen ? "block" : "none";
  if (frontierBuildOpen) {
    setInvOpen(false);
    setQuestOpen(false);
    setForgeOpen(false);
    setRefineryOpen(false);
    renderFrontierBuildWindow();
  }
}

function isFrontierShopSellableEntry(entry) {
  if (!entry || isNftInventoryEntry(entry)) return { ok: false, reason: "NFT 아이템은 판매 등록할 수 없습니다." };
  const itemId = getSlotItemId(entry);
  const def = ITEM_DEFS[itemId];
  if (!def) return { ok: false, reason: "알 수 없는 아이템입니다." };
  if (getInventoryEntryCategory(entry) === "equip") return { ok: false, reason: "장비 아이템은 판매 등록할 수 없습니다." };
  if (def.isAuthorityItem) return { ok: false, reason: "권한 아이템은 판매 등록할 수 없습니다." };
  if (isQuestCriticalItemBlockedFromDiscard(entry)) return { ok: false, reason: "퀘스트 아이템은 판매 등록할 수 없습니다." };
  if (!["cons", "misc"].includes(def.category)) return { ok: false, reason: "이 아이템은 판매할 수 없습니다." };
  return { ok: true, reason: "" };
}

function getSellableFrontierShopEntries() {
  return inventory.slots
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry)
    .filter(({ entry }) => isFrontierShopSellableEntry(entry).ok);
}

function openFrontierShopRegisterDialog(parcelLabel = getSelectedFrontierParcelLabel()) {
  if (getFrontierBuildState(parcelLabel).stage < 100) {
    showUI("건축 완료 후 상점을 운영할 수 있습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  if (!getFrontierShopAssignedWallet(parcelLabel)) {
    showUI("상점 사용자 지정 필요", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  if (!canUseFrontierShopSlot(parcelLabel)) {
    showUI("상점 운영 권한이 없습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  frontierShopRegisterParcelLabel = parcelLabel;
  frontierShopRegisterSelectedItemId = "";
  frontierShopRegisterSelectedAvailable = 0;
  frontierShopRegisterOpen = true;
  frontierShopRegisterOverlay.style.display = "block";
  frontierShopRegisterWin.style.display = "block";
  closeFrontierBoothDialog();
  renderFrontierShopRegisterDialog();
  return true;
}

function closeFrontierShopRegisterDialog() {
  frontierShopRegisterOpen = false;
  frontierShopRegisterParcelLabel = "";
  frontierShopRegisterSelectedItemId = "";
  frontierShopRegisterSelectedAvailable = 0;
  if (frontierShopRegisterOverlay) frontierShopRegisterOverlay.style.display = "none";
  if (frontierShopRegisterWin) frontierShopRegisterWin.style.display = "none";
}

function clearFrontierShopListing(parcelLabel = frontierShopRegisterParcelLabel) {
  if (!parcelLabel) return false;
  if (!canUseFrontierShopSlot(parcelLabel)) return false;
  const shopState = getFrontierShopOperation(parcelLabel);
  if (!shopState.itemId || shopState.quantity <= 0) {
    showUI("현재 등록된 판매 물품이 없습니다.", 900);
    lastMessageUntil = performance.now() + 900;
    return false;
  }
  if (!addItem(shopState.itemId, shopState.quantity)) {
    showUI("인벤토리가 가득 차 판매 물품을 회수할 수 없습니다.", 1200);
    lastMessageUntil = performance.now() + 1200;
    return false;
  }
  shopState.itemId = "";
  shopState.quantity = 0;
  shopState.price = 0;
  shopState.statusText = "비어 있음";
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  updateInventoryUI();
  schedulePlayerSaveSync(true);
  renderFrontierBuildWindow();
  renderFrontierShopRegisterDialog();
  showUI("판매 물품을 회수했습니다.", 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function commitFrontierShopListing() {
  const parcelLabel = frontierShopRegisterParcelLabel || getSelectedFrontierParcelLabel();
  if (!parcelLabel) return false;
  if (!canUseFrontierShopSlot(parcelLabel)) return false;
  const itemId = frontierShopRegisterSelectedItemId;
  if (!itemId) {
    showUI("판매할 아이템을 먼저 선택하세요.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  const quantity = Math.max(1, Math.floor(Number(frontierShopQuantityInput.value) || 0));
  const price = Math.max(0, Math.floor(Number(frontierShopPriceInput.value) || 0));
  if (getItemCount(itemId) < quantity) {
    showUI("판매 수량만큼 아이템을 보유하고 있지 않습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  const shopState = getFrontierShopOperation(parcelLabel);
  let previousItemId = "";
  let previousQuantity = 0;
  if (shopState.itemId && shopState.quantity > 0) {
    previousItemId = shopState.itemId;
    previousQuantity = shopState.quantity;
    if (!addItem(previousItemId, previousQuantity)) {
      showUI("기존 판매 물품을 회수할 인벤토리 공간이 부족합니다.", 1200);
      lastMessageUntil = performance.now() + 1200;
      return false;
    }
  }
  if (!consumeItem(itemId, quantity)) {
    if (previousItemId && previousQuantity > 0) {
      consumeItem(previousItemId, previousQuantity);
    }
    showUI("판매 물품을 등록하지 못했습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  shopState.itemId = itemId;
  shopState.quantity = quantity;
  shopState.price = price;
  shopState.statusText = formatFrontierShopStatusText(itemId, quantity, price);
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  updateInventoryUI();
  schedulePlayerSaveSync(true);
  renderFrontierBuildWindow();
  renderFrontierShopRegisterDialog();
  showUI("판매 물품을 등록했습니다.", 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function renderFrontierShopRegisterDialog() {
  if (!frontierShopRegisterOpen) return;
  const parcelLabel = frontierShopRegisterParcelLabel || getSelectedFrontierParcelLabel();
  const shopState = getFrontierShopOperation(parcelLabel);
  frontierShopTitle.textContent = `${parcelLabel} 판매 등록`;
  frontierShopCurrentStatus.textContent = `현재 판매 상태: ${shopState.statusText}`;
  frontierShopInventoryGrid.innerHTML = "";

  const sellableEntries = getSellableFrontierShopEntries();
  if (!sellableEntries.length) {
    const empty = document.createElement("div");
    empty.textContent = "판매 등록 가능한 재료/소비 아이템이 없습니다.";
    empty.style.gridColumn = "1 / -1";
    empty.style.padding = "16px 10px";
    empty.style.borderRadius = "12px";
    empty.style.background = "rgba(0,0,0,0.05)";
    empty.style.fontSize = "13px";
    empty.style.color = "#666";
    frontierShopInventoryGrid.appendChild(empty);
  }

  for (const { entry } of sellableEntries) {
    const itemId = getSlotItemId(entry);
    const count = getSlotItemCount(entry);
    const card = document.createElement("button");
    card.type = "button";
    card.style.border = frontierShopRegisterSelectedItemId === itemId
      ? "2px solid rgba(255,145,45,0.95)"
      : "1px solid rgba(0,0,0,0.14)";
    card.style.borderRadius = "12px";
    card.style.background = frontierShopRegisterSelectedItemId === itemId
      ? "rgba(255,235,205,0.88)"
      : "rgba(255,255,255,0.96)";
    card.style.padding = "10px";
    card.style.cursor = "pointer";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.gap = "6px";

    const visual = createInventoryEntryVisualElement(entry, { size: 40 });
    card.appendChild(visual);

    const name = document.createElement("div");
    name.textContent = getInventoryEntryDisplayName(entry);
    name.style.fontSize = "12px";
    name.style.fontWeight = "800";
    name.style.color = "#333";
    name.style.textAlign = "center";
    card.appendChild(name);

    const meta = document.createElement("div");
    meta.textContent = `보유 ${count}개`;
    meta.style.fontSize = "11px";
    meta.style.color = "#7a6550";
    card.appendChild(meta);

    card.addEventListener("click", () => {
      frontierShopRegisterSelectedItemId = itemId;
      frontierShopRegisterSelectedAvailable = count;
      frontierShopQuantityInput.max = String(count);
      frontierShopQuantityInput.value = "1";
      renderFrontierShopRegisterDialog();
    });
    frontierShopInventoryGrid.appendChild(card);
  }

  const selectedItemName = frontierShopRegisterSelectedItemId
    ? ITEM_DEFS[frontierShopRegisterSelectedItemId]?.name ?? frontierShopRegisterSelectedItemId
    : "선택 없음";
  frontierShopSelectedItem.textContent = `선택한 아이템: ${selectedItemName}`;
  frontierShopSelectedOwned.textContent = `보유 수량: ${frontierShopRegisterSelectedAvailable}개`;
  frontierShopQuantityInput.max = String(Math.max(1, frontierShopRegisterSelectedAvailable));
  if (!frontierShopRegisterSelectedItemId) {
    frontierShopQuantityInput.value = "1";
  }
  frontierShopRegisterBtn.disabled = !frontierShopRegisterSelectedItemId;
  frontierShopRegisterBtn.style.opacity = frontierShopRegisterBtn.disabled ? "0.58" : "1";
  frontierShopClearBtn.disabled = !(shopState.itemId && shopState.quantity > 0);
  frontierShopClearBtn.style.opacity = frontierShopClearBtn.disabled ? "0.58" : "1";
}

function assignFrontierShopSlotUser(parcelLabel, walletAddress) {
  if (!canManageFrontierShopSlot(parcelLabel)) return false;
  const normalizedWallet = normalizeFrontierWalletAddress(walletAddress);
  if (!normalizedWallet) {
    showUI("지갑 주소를 입력해주세요.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  const shopState = getFrontierShopOperation(parcelLabel);
  shopState.userWallet = normalizedWallet;
  schedulePlayerSaveSync(true);
  renderFrontierBuildWindow();
  showUI(`상점 사용자를 ${shortenWalletAddress(normalizedWallet)}(으)로 지정했습니다.`, 1100);
  lastMessageUntil = performance.now() + 1100;
  return true;
}

function clearFrontierShopSlotUser(parcelLabel) {
  if (!canManageFrontierShopSlot(parcelLabel)) return false;
  const shopState = getFrontierShopOperation(parcelLabel);
  if (shopState.itemId && shopState.quantity > 0) {
    showUI("판매 물품이 등록된 상태에서는 사용자를 해제할 수 없습니다.", 1200);
    lastMessageUntil = performance.now() + 1200;
    return false;
  }
  shopState.userWallet = "";
  schedulePlayerSaveSync(true);
  renderFrontierBuildWindow();
  showUI("상점 사용자를 해제했습니다.", 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function tryAdvanceFrontierBuildStage() {
  const parcelLabel = getSelectedFrontierParcelLabel();
  if (!hasFrontierParcelAuthority(parcelLabel)) {
    showUI(`${parcelLabel} 개발권 필요`, 1000);
    lastMessageUntil = performance.now() + 1000;
    return true;
  }
  const buildState = getFrontierBuildState(parcelLabel);
  const nextStage = getFrontierNextStageConfig(buildState.stage);
  if (!nextStage) {
    showUI(`${parcelLabel} 건축은 이미 완료되었습니다.`, 1000);
    lastMessageUntil = performance.now() + 1000;
    return true;
  }
  if (getItemCount("woodPlank") < nextStage.wood || getItemCount("masonryStone") < nextStage.stone) {
    showUI("건축 재료가 부족합니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return true;
  }
  if (!consumeItem("woodPlank", nextStage.wood)) {
    showUI("목재를 차감하지 못했습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return true;
  }
  if (!consumeItem("masonryStone", nextStage.stone)) {
    addItem("woodPlank", nextStage.wood);
    showUI("석재를 차감하지 못했습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return true;
  }
  buildState.stage = nextStage.to;
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  updateInventoryUI();
  schedulePlayerSaveSync(true);
  renderFrontierBuildWindow();
  showUI(`${parcelLabel} 건축 진척도 ${buildState.stage}%`, 1100);
  lastMessageUntil = performance.now() + 1100;
  return true;
}

function saveFrontierBuildSignText() {
  const parcelLabel = getSelectedFrontierParcelLabel();
  if (!hasFrontierParcelAuthority(parcelLabel)) return false;
  if (getFrontierBuildState(parcelLabel).stage < 100) return false;
  const text = String(frontierBuildSignInput.value || "").trim().slice(0, FRONTIER_BUILDING_SIGN_MAX_CHARS) || parcelLabel;
  frontierBuildState[parcelLabel.toLowerCase()].signText = text;
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  schedulePlayerSaveSync(true);
  renderFrontierBuildWindow();
  showUI("간판 문구를 저장했습니다.", 900);
  lastMessageUntil = performance.now() + 900;
  return true;
}

function tryUnlockMapGate(gate) {
  if (!gate?.unlockWithItem || !gate.unlockFlag) return false;
  if (inventory[gate.unlockFlag]) return true;
  if (!hasItem(gate.unlockWithItem)) {
    showUI(gate.denyText ?? "필요한 아이템이 없습니다.", 1100);
    return false;
  }
  if (!consumeItem(gate.unlockWithItem, 1)) {
    showUI(gate.denyText ?? "필요한 아이템이 없습니다.", 1100);
    return false;
  }

  inventory[gate.unlockFlag] = true;
  const gateColliderIndex = getTrackedColliderIndex(gate.lockBlocker, gate.lockColliderIndex);
  if (typeof gateColliderIndex === "number") {
    removeColliderAt(gateColliderIndex);
    gate.lockColliderIndex = null;
  }
  if (gate.lockBlocker?.parent) {
    gate.lockBlocker.removeFromParent();
  }
  updateInventoryUI();
  if (questOpen) renderQuestWindow();
  showUI(gate.unlockText ?? "통로가 열렸습니다.", 1200);
  lastMessageUntil = performance.now() + 1200;
  return true;
}

function restoreLockedMapGate(gate) {
  if (!gate?.lockBlocker) return;
  if (!gate.lockBlocker.parent) {
    scene.add(gate.lockBlocker);
  }
  const gateColliderIndex = getTrackedColliderIndex(gate.lockBlocker, gate.lockColliderIndex);
  if (typeof gateColliderIndex !== "number") {
    gate.lockColliderIndex = addCollider(gate.lockBlocker, 1.0);
  }
}

function getForgeDistance() {
  if (!forgeStation?.parent) return Infinity;
  return forgeStation.position.distanceTo(player.position);
}

function setForgeOpen(v) {
  if (v && frontierBuildOpen) {
    setFrontierBuildOpen(false);
  }
  if (v && refineryOpen) {
    setRefineryOpen(false);
  }
  forgeOpen = v;
  forgeOverlay.style.display = forgeOpen ? "block" : "none";
  forgeWin.style.display = forgeOpen ? "block" : "none";
  if (forgeOpen) renderForgeWindow();
}

function renderRefineryItemCard(card, heading, itemId, count, description, accentColor = "#2f1700") {
  card.innerHTML = "";

  const title = document.createElement("div");
  title.textContent = heading;
  title.style.fontSize = "12px";
  title.style.fontWeight = "700";
  title.style.color = "rgba(70,70,70,0.76)";
  title.style.marginBottom = "8px";
  card.appendChild(title);

  const hero = document.createElement("div");
  hero.style.display = "flex";
  hero.style.alignItems = "center";
  hero.style.gap = "12px";
  card.appendChild(hero);

  const visualWrap = document.createElement("div");
  visualWrap.style.width = "64px";
  visualWrap.style.height = "64px";
  visualWrap.style.borderRadius = "12px";
  visualWrap.style.background = "linear-gradient(180deg, rgba(246,246,246,0.96), rgba(224,224,224,0.9))";
  visualWrap.style.border = "1px solid rgba(0,0,0,0.12)";
  visualWrap.style.display = "flex";
  visualWrap.style.alignItems = "center";
  visualWrap.style.justifyContent = "center";
  visualWrap.style.flex = "0 0 auto";
  visualWrap.appendChild(createItemVisualElement(itemId, { size: 50 }));
  hero.appendChild(visualWrap);

  const textWrap = document.createElement("div");
  textWrap.style.minWidth = "0";
  hero.appendChild(textWrap);

  const name = document.createElement("div");
  name.textContent = ITEM_DEFS[itemId]?.name ?? itemId;
  name.style.fontSize = "19px";
  name.style.fontWeight = "900";
  name.style.color = "#222";
  textWrap.appendChild(name);

  const countLabel = document.createElement("div");
  countLabel.textContent = `수량 x${count}`;
  countLabel.style.marginTop = "6px";
  countLabel.style.fontSize = "13px";
  countLabel.style.fontWeight = "800";
  countLabel.style.color = accentColor;
  textWrap.appendChild(countLabel);

  const detail = document.createElement("div");
  detail.style.marginTop = "12px";
  detail.style.fontSize = "13px";
  detail.style.lineHeight = "1.6";
  detail.style.color = "#333";
  detail.textContent = description;
  card.appendChild(detail);
}

function setRefineryOpen(v) {
  if (v && frontierBuildOpen) {
    setFrontierBuildOpen(false);
  }
  if (v && forgeOpen) {
    setForgeOpen(false);
  }
  refineryOpen = v;
  refineryOverlay.style.display = refineryOpen ? "block" : "none";
  refineryWin.style.display = refineryOpen ? "block" : "none";
  if (!refineryOpen) {
    refinerySuccessUntil = 0;
    refinerySuccessMessage = "";
  }
  if (refineryOpen) {
    setInvOpen(false);
    setQuestOpen(false);
    renderRefineryWindow();
  }
}

function renderRefineryWindow() {
  const recipes = getRefineryRecipeEntries();
  const selectedRecipe = getSelectedRefineryRecipe();
  const hasRecipe = Boolean(selectedRecipe);

  refineryRecipeList.innerHTML = "";
  for (const recipe of recipes) {
    const btn = document.createElement("button");
    btn.type = "button";
    const isActive = recipe.id === selectedRecipe?.id;
    const inputName = ITEM_DEFS[recipe.inputItemId]?.name ?? recipe.inputItemId;
    btn.style.width = "100%";
    btn.style.textAlign = "left";
    btn.style.border = isActive ? "1px solid rgba(255,140,0,0.78)" : "1px solid rgba(0,0,0,0.14)";
    btn.style.borderRadius = "12px";
    btn.style.padding = "12px";
    btn.style.background = isActive
      ? "linear-gradient(180deg, rgba(255,222,182,0.92), rgba(255,240,220,0.92))"
      : "rgba(255,255,255,0.94)";
    btn.style.cursor = "pointer";
    btn.innerHTML = `
      <div style="font-size:14px;font-weight:800;color:#222;">${recipe.label}</div>
      <div style="margin-top:6px;font-size:12px;line-height:1.5;color:#555;">${inputName} ${recipe.inputCount}개 → ${ITEM_DEFS[recipe.outputItemId]?.name ?? recipe.outputItemId} ${recipe.outputCount}개</div>
    `;
    btn.addEventListener("click", () => {
      refinerySelectedRecipeId = recipe.id;
      renderRefineryWindow();
    });
    refineryRecipeList.appendChild(btn);
  }

  refineryTitle.textContent = hasRecipe ? `${selectedRecipe.label} 재련` : "재련소";

  if (!hasRecipe) {
    refineryInputCard.textContent = "";
    refineryOutputCard.textContent = "";
    refineryInfo.innerHTML = "";
    refineryNotice.textContent = "아직 사용할 수 있는 재련 레시피가 없습니다.";
    refineryArrowValue.disabled = true;
    refineryArrowValue.style.opacity = "0.55";
    refineryArrowValue.style.cursor = "default";
    refineryArrowValue.style.background = "rgba(235,235,235,0.78)";
    refineryArrowValue.textContent = "재련하기";
    return;
  }

  const inputName = ITEM_DEFS[selectedRecipe.inputItemId]?.name ?? selectedRecipe.inputItemId;
  const outputName = ITEM_DEFS[selectedRecipe.outputItemId]?.name ?? selectedRecipe.outputItemId;
  const inputOwned = getItemCount(selectedRecipe.inputItemId);
  const outputOwned = getItemCount(selectedRecipe.outputItemId);
  const canCraft = inputOwned >= selectedRecipe.inputCount;
  const successActive = refinerySuccessUntil > performance.now();

  renderRefineryItemCard(
    refineryInputCard,
    "넣을 재료",
    selectedRecipe.inputItemId,
    selectedRecipe.inputCount,
    `보유량 ${inputOwned}개 / 필요량 ${selectedRecipe.inputCount}개`,
    canCraft ? "#2f6a1e" : "#8b2f2f"
  );
  renderRefineryItemCard(
    refineryOutputCard,
    "재련 결과",
    selectedRecipe.outputItemId,
    selectedRecipe.outputCount,
    `${getRefineryRecipeDescription(selectedRecipe)} 현재 보유량 ${outputOwned}개`,
    "#7a4a12"
  );

  refineryInfo.innerHTML = "";
  const infoCards = [
    { label: "보유 재료", value: `${inputName} ${inputOwned}개` },
    { label: "필요 재료", value: `${inputName} ${selectedRecipe.inputCount}개` },
    { label: "결과물", value: `${outputName} ${selectedRecipe.outputCount}개` },
    { label: "현재 보유", value: `${outputName} ${outputOwned}개` },
    { label: "재련 가능", value: canCraft ? "가능" : "재료 부족" },
  ];
  for (const entry of infoCards) {
    const card = document.createElement("div");
    card.style.padding = "12px";
    card.style.borderRadius = "10px";
    card.style.background = "rgba(255,255,255,0.92)";
    card.style.border = "1px solid rgba(0,0,0,0.12)";
    card.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:rgba(70,70,70,0.74);margin-bottom:6px;">${entry.label}</div>
      <div style="font-size:18px;font-weight:800;color:#242424;">${entry.value}</div>
    `;
    refineryInfo.appendChild(card);
  }

  if (successActive) {
    refineryNotice.textContent = refinerySuccessMessage;
    refineryNotice.style.background = "rgba(231, 255, 229, 0.92)";
    refineryNotice.style.border = "1px solid rgba(71, 164, 72, 0.34)";
    refineryNotice.style.color = "#24622c";
  } else {
    refineryNotice.textContent = canCraft
      ? `${inputName}을 정제해 ${outputName}로 바꿉니다. ${getRefineryRecipeDescription(selectedRecipe)}`
      : `${inputName} ${selectedRecipe.inputCount}개가 있어야 ${outputName}를 만들 수 있습니다.`;
    refineryNotice.style.background = "rgba(255,255,255,0.9)";
    refineryNotice.style.border = "1px solid rgba(0,0,0,0.12)";
    refineryNotice.style.color = "#444";
  }
  refineryArrowValue.disabled = !canCraft;
  refineryArrowValue.style.opacity = canCraft ? "1" : "0.55";
  refineryArrowValue.style.cursor = canCraft ? "pointer" : "default";
  refineryArrowValue.style.background = canCraft
    ? "rgba(255,255,255,0.88)"
    : "rgba(235,235,235,0.78)";
  refineryArrowValue.textContent = successActive ? "완료!" : "재련하기";
}

function tryCraftSelectedRefineryRecipe() {
  const recipe = getSelectedRefineryRecipe();
  if (!recipe) return;
  tryUseRefineryRecipe(recipe);
}

function renderForgeItemCard(card, heading, itemId, level, stats, emptyText = "") {
  card.innerHTML = "";

  const title = document.createElement("div");
  title.textContent = heading;
  title.style.fontSize = "12px";
  title.style.fontWeight = "700";
  title.style.color = "rgba(70,70,70,0.76)";
  title.style.marginBottom = "8px";
  card.appendChild(title);

  if (!itemId || !stats) {
    const empty = document.createElement("div");
    empty.style.marginTop = "18px";
    empty.style.fontSize = "13px";
    empty.style.lineHeight = "1.6";
    empty.style.color = "#555";
    empty.innerHTML = emptyText;
    card.appendChild(empty);
    return;
  }

  const hero = document.createElement("div");
  hero.style.display = "flex";
  hero.style.alignItems = "center";
  hero.style.gap = "12px";
  card.appendChild(hero);

  const visualWrap = document.createElement("div");
  visualWrap.style.width = "64px";
  visualWrap.style.height = "64px";
  visualWrap.style.borderRadius = "12px";
  visualWrap.style.background = "linear-gradient(180deg, rgba(246,246,246,0.96), rgba(224,224,224,0.9))";
  visualWrap.style.border = "1px solid rgba(0,0,0,0.12)";
  visualWrap.style.display = "flex";
  visualWrap.style.alignItems = "center";
  visualWrap.style.justifyContent = "center";
  visualWrap.style.flex = "0 0 auto";
  visualWrap.appendChild(createForgeUpgradeVisualElement(itemId, level, 50));
  hero.appendChild(visualWrap);

  const textWrap = document.createElement("div");
  textWrap.style.minWidth = "0";
  hero.appendChild(textWrap);

  const name = document.createElement("div");
  name.textContent = `${ITEM_DEFS[itemId]?.name ?? itemId} Lv.${level}`;
  name.style.fontSize = "20px";
  name.style.fontWeight = "900";
  name.style.color = "#222";
  textWrap.appendChild(name);

  const detail = document.createElement("div");
  detail.style.marginTop = "10px";
  detail.style.fontSize = "13px";
  detail.style.lineHeight = "1.6";
  detail.style.color = "#333";
  detail.innerHTML = `
    채굴력 ${stats.miningPowerMin.toFixed(2)} ~ ${stats.miningPowerMax.toFixed(2)}<br>
    추가 드랍 ${Math.round(stats.bonusDropChance * 100)}%<br>
    속도 ${Math.round((0.28 / stats.swingDuration) * 100)}%
  `;
  card.appendChild(detail);
}

function finishPendingForgeUpgrade() {
  if (!forgePendingUpgrade) return;

  const pending = forgePendingUpgrade;
  forgePendingUpgrade = null;
  const success = Math.random() < pending.successChance;

  if (success && pending.itemId === "pickaxe") {
    inventory.pickaxeLevel = pending.targetLevel;
  }

  forgeLastResult = {
    success,
    text: success
      ? `${pending.name} Lv.${pending.targetLevel} 강화 성공!`
      : `${pending.name} 강화 실패...`,
    until: performance.now() + 1600,
  };

  updateInventoryUI();
  if (forgeOpen) renderForgeWindow();
  if (success) {
    tutorialQuest.upgradeCount += 1;
    refreshQuestProgress();
  }
  showUI(forgeLastResult.text, 1100);
  lastMessageUntil = performance.now() + 1100;
}

function renderForgeWindow() {
  const upgradeState = getForgeUpgradeState();
  const stats = upgradeState?.current ?? PICKAXE_UPGRADE_LEVELS[0];
  const next = upgradeState?.next ?? null;
  const stoneDustCount = getItemCount("stoneDust");
  const forgeItemName = upgradeState?.name ?? "장착 장비";
  const isProcessing = Boolean(forgePendingUpgrade);
  const canUpgrade =
    forgeOpen &&
    getForgeDistance() < 2.4 &&
    Boolean(upgradeState) &&
    Boolean(next) &&
    stoneDustCount >= next.cost &&
    !isProcessing;

  forgeTitle.textContent = upgradeState ? `${forgeItemName} 강화` : "장비 강화";
  renderForgeItemCard(
    forgeCurrentCard,
    "현재 장비",
    upgradeState?.itemId ?? null,
    upgradeState?.level ?? 0,
    upgradeState?.current ?? null,
    "현재 착용 중인 강화 가능 장비가 없습니다.<br>장비창에서 곡괭이를 먼저 장착해보세요."
  );

  forgeChanceValue.textContent = isProcessing ? "..." : (next ? "가즈아" : "MAX");
  forgeChanceValue.disabled = !canUpgrade;
  forgeChanceValue.style.opacity = canUpgrade ? "1" : "0.55";
  forgeChanceValue.style.cursor = canUpgrade ? "pointer" : "default";
  forgeChanceValue.style.background = canUpgrade
    ? "rgba(255,255,255,0.82)"
    : "rgba(255,255,255,0.58)";
  forgeChanceValue.title = isProcessing ? "강화 진행 중" : (next ? `Lv.${next.level} 강화` : "최대 강화");
  setForgeButtonPressed(false);

  if (next && upgradeState?.itemId) {
    renderForgeItemCard(forgeNextCard, "다음 강화", upgradeState.itemId, next.level, next);
  } else {
    forgeNextCard.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:rgba(70,70,70,0.76);margin-bottom:8px;">다음 강화</div>
      <div style="font-size:22px;font-weight:900;color:#222;">최대 단계</div>
      <div style="margin-top:12px;font-size:13px;line-height:1.6;color:#333;">
        현재 장비는 더 이상 강화할 수 없습니다.
      </div>
    `;
  }

  forgeInfo.innerHTML = "";
  const infoCards = [
    { label: "보유 돌가루", value: `${stoneDustCount}` },
    { label: "강화 조건", value: upgradeState ? `${forgeItemName} 장착` : "장착 장비 필요" },
    { label: "현재 안정성", value: upgradeState ? `${(stats.miningPowerMax - stats.miningPowerMin).toFixed(2)} 편차` : "-" },
    { label: "강화 성공률", value: next ? `${Math.round((next.successChance ?? 1) * 100)}%` : "MAX" },
    { label: "강화 가능", value: canUpgrade ? "가능" : (next ? "재료 확인" : "최대 단계") },
  ];
  for (const entry of infoCards) {
    const card = document.createElement("div");
    card.style.padding = "12px";
    card.style.borderRadius = "10px";
    card.style.background = "rgba(255,255,255,0.92)";
    card.style.border = "1px solid rgba(0,0,0,0.12)";
    card.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:rgba(70,70,70,0.74);margin-bottom:6px;">${entry.label}</div>
      <div style="font-size:18px;font-weight:800;color:#242424;">${entry.value}</div>
    `;
    forgeInfo.appendChild(card);
  }

  if (isProcessing && forgePendingUpgrade) {
    forgeNotice.textContent = `${forgePendingUpgrade.name} 강화 시도 중... 잠시만 기다려주세요.`;
  } else if (forgeLastResult && forgeLastResult.until > performance.now()) {
    forgeNotice.textContent = forgeLastResult.text;
    forgeNotice.style.color = forgeLastResult.success ? "#2f6a1e" : "#7b2a2a";
    forgeNotice.style.fontWeight = "800";
    return;
  } else if (!upgradeState) {
    forgeNotice.textContent = "모루에서는 현재 착용 중인 강화 가능 장비를 기준으로 강화합니다. 장비창에서 곡괭이를 먼저 장착해보세요.";
  } else if (!next) {
    forgeNotice.textContent = `더 이상 강화할 수 없습니다. 현재 ${forgeItemName}는 최고 단계입니다.`;
  } else if (stoneDustCount < next.cost) {
    forgeNotice.textContent = `강화에는 돌가루 ${next.cost}개가 필요합니다. 광산에서 더 채굴해오세요.`;
  } else {
    forgeNotice.textContent = `모루에서 ${forgeItemName}를 강화하면 성능과 안정성이 함께 올라갑니다. 이번 강화 비용은 돌가루 ${next.cost}개, 성공률은 ${Math.round((next.successChance ?? 1) * 100)}%입니다.`;
  }
  forgeNotice.style.color = "#444";
  forgeNotice.style.fontWeight = "500";

}

function tryUpgradeEquippedItem() {
  if (forgePendingUpgrade) return;
  const upgradeState = getForgeUpgradeState();
  if (!upgradeState) {
    showUI("장착 중인 강화 가능 장비가 필요합니다");
    return;
  }
  const next = upgradeState.next;
  if (!next) {
    showUI(`${upgradeState.name}가 이미 최대 강화입니다`);
    return;
  }
  if (getItemCount("stoneDust") < next.cost) {
    showUI("돌가루가 부족합니다");
    return;
  }
  if (!consumeItem("stoneDust", next.cost)) return;
  forgePendingUpgrade = {
    itemId: upgradeState.itemId,
    name: upgradeState.name,
    targetLevel: next.level,
    successChance: next.successChance ?? 1,
    resolveAt: performance.now() + FORGE_UPGRADE_DELAY_MS,
  };
  forgeLastResult = null;
  renderForgeWindow();
  showUI(`${upgradeState.name} 강화 시도 중...`, 900);
  lastMessageUntil = performance.now() + 900;
}

function setForgeButtonPressed(pressed) {
  if (forgeChanceValue.disabled) {
    forgeChanceValue.style.transform = "translateY(0)";
    forgeChanceValue.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
    return;
  }

  if (pressed) {
    forgeChanceValue.style.transform = "translateY(2px) scale(0.985)";
    forgeChanceValue.style.boxShadow = "inset 0 2px 6px rgba(120,70,15,0.22)";
    forgeChanceValue.style.background = "rgba(246,233,206,0.96)";
  } else {
    forgeChanceValue.style.transform = "translateY(0) scale(1)";
    forgeChanceValue.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
    forgeChanceValue.style.background = forgeChanceValue.disabled
      ? "rgba(255,255,255,0.58)"
      : "rgba(255,255,255,0.82)";
  }
}

forgeChanceValue.addEventListener("click", () => {
  setForgeButtonPressed(false);
  tryUpgradeEquippedItem();
});

forgeChanceValue.addEventListener("pointerdown", () => {
  setForgeButtonPressed(true);
});

forgeChanceValue.addEventListener("pointerup", () => {
  setForgeButtonPressed(false);
});

forgeChanceValue.addEventListener("pointerleave", () => {
  setForgeButtonPressed(false);
});

forgeChanceValue.addEventListener("pointercancel", () => {
  setForgeButtonPressed(false);
});

forgeCloseBtn.addEventListener("click", () => {
  setForgeOpen(false);
});

forgeOverlay.addEventListener("click", () => {
  setForgeOpen(false);
});

refineryArrowValue.addEventListener("click", () => {
  tryCraftSelectedRefineryRecipe();
});

refineryCloseBtn.addEventListener("click", () => {
  setRefineryOpen(false);
});

refineryOverlay.addEventListener("click", () => {
  setRefineryOpen(false);
});

frontierBuildOverlay = document.createElement("div");
frontierBuildOverlay.id = "frontierBuildOverlay";
frontierBuildOverlay.style.position = "fixed";
frontierBuildOverlay.style.inset = "0";
frontierBuildOverlay.style.background = "rgba(20, 24, 30, 0.3)";
frontierBuildOverlay.style.backdropFilter = "blur(3px)";
frontierBuildOverlay.style.display = "none";
frontierBuildOverlay.style.pointerEvents = "auto";
frontierBuildOverlay.style.zIndex = "1000001";
uiLayer.appendChild(frontierBuildOverlay);

frontierBuildWin = document.createElement("div");
frontierBuildWin.id = "frontierBuildWindow";
frontierBuildWin.style.position = "fixed";
frontierBuildWin.style.left = "50%";
frontierBuildWin.style.top = "50%";
frontierBuildWin.style.transform = "translate(-50%, -50%)";
frontierBuildWin.style.width = "min(640px, calc(100vw - 36px))";
frontierBuildWin.style.minHeight = "430px";
frontierBuildWin.style.background = "rgba(235, 235, 235, 0.96)";
frontierBuildWin.style.border = "1px solid rgba(0,0,0,0.25)";
frontierBuildWin.style.borderRadius = "14px";
frontierBuildWin.style.boxShadow = "0 18px 42px rgba(0,0,0,0.28)";
frontierBuildWin.style.backdropFilter = "blur(6px)";
frontierBuildWin.style.boxSizing = "border-box";
frontierBuildWin.style.display = "none";
frontierBuildWin.style.pointerEvents = "auto";
frontierBuildWin.style.userSelect = "none";
frontierBuildWin.style.zIndex = "1000002";
frontierBuildWin.style.overflow = "hidden";
uiLayer.appendChild(frontierBuildWin);

const frontierBuildHeader = document.createElement("div");
frontierBuildHeader.style.display = "flex";
frontierBuildHeader.style.alignItems = "center";
frontierBuildHeader.style.gap = "12px";
frontierBuildHeader.style.padding = "12px 14px";
frontierBuildHeader.style.borderBottom = "1px solid rgba(0,0,0,0.15)";
frontierBuildHeader.style.background = "rgba(255,255,255,0.7)";
frontierBuildWin.appendChild(frontierBuildHeader);

const frontierBuildTitle = document.createElement("div");
frontierBuildTitle.textContent = "P6 건축 진행";
frontierBuildTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildTitle.style.fontSize = "18px";
frontierBuildTitle.style.fontWeight = "800";
frontierBuildTitle.style.color = "#222";
frontierBuildTitle.style.marginRight = "auto";
frontierBuildHeader.appendChild(frontierBuildTitle);

const frontierBuildHeaderNote = document.createElement("div");
frontierBuildHeaderNote.textContent = "개척지 건축 예정지";
frontierBuildHeaderNote.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildHeaderNote.style.fontSize = "12px";
frontierBuildHeaderNote.style.fontWeight = "700";
frontierBuildHeaderNote.style.color = "rgba(70,70,70,0.78)";
frontierBuildHeader.appendChild(frontierBuildHeaderNote);

const frontierBuildCloseBtn = document.createElement("button");
frontierBuildCloseBtn.textContent = "닫기";
frontierBuildCloseBtn.style.minWidth = "74px";
frontierBuildCloseBtn.style.border = "1px solid rgba(0,0,0,0.18)";
frontierBuildCloseBtn.style.borderRadius = "10px";
frontierBuildCloseBtn.style.padding = "8px 10px";
frontierBuildCloseBtn.style.fontSize = "13px";
frontierBuildCloseBtn.style.fontWeight = "700";
frontierBuildCloseBtn.style.cursor = "pointer";
frontierBuildCloseBtn.style.background = "rgba(255,255,255,0.92)";
frontierBuildCloseBtn.style.color = "#333";
frontierBuildHeader.appendChild(frontierBuildCloseBtn);

const frontierBuildBody = document.createElement("div");
frontierBuildBody.style.padding = "18px";
frontierBuildBody.style.display = "grid";
frontierBuildBody.style.gridTemplateRows = "auto auto auto auto auto";
frontierBuildBody.style.gap = "14px";
frontierBuildWin.appendChild(frontierBuildBody);

const frontierBuildStageHero = document.createElement("div");
frontierBuildStageHero.style.display = "grid";
frontierBuildStageHero.style.gridTemplateColumns = "1fr 160px";
frontierBuildStageHero.style.gap = "14px";
frontierBuildBody.appendChild(frontierBuildStageHero);

const frontierBuildStageCard = document.createElement("div");
frontierBuildStageCard.style.minHeight = "120px";
frontierBuildStageCard.style.borderRadius = "12px";
frontierBuildStageCard.style.background = "rgba(255,255,255,0.95)";
frontierBuildStageCard.style.border = "1px solid rgba(0,0,0,0.18)";
frontierBuildStageCard.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
frontierBuildStageCard.style.padding = "14px";
frontierBuildStageCard.style.boxSizing = "border-box";
frontierBuildStageCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildStageHero.appendChild(frontierBuildStageCard);

const frontierBuildActionCard = document.createElement("div");
frontierBuildActionCard.style.minHeight = "120px";
frontierBuildActionCard.style.borderRadius = "14px";
frontierBuildActionCard.style.background = "linear-gradient(180deg, rgba(255,194,105,0.22), rgba(255,156,64,0.12))";
frontierBuildActionCard.style.border = "1px solid rgba(255,162,68,0.38)";
frontierBuildActionCard.style.boxShadow = "0 0 0 3px rgba(255,186,90,0.14), inset 0 1px 0 rgba(255,255,255,0.7)";
frontierBuildActionCard.style.display = "flex";
frontierBuildActionCard.style.flexDirection = "column";
frontierBuildActionCard.style.alignItems = "center";
frontierBuildActionCard.style.justifyContent = "center";
frontierBuildActionCard.style.padding = "10px";
frontierBuildStageHero.appendChild(frontierBuildActionCard);

const frontierBuildActionLabel = document.createElement("div");
frontierBuildActionLabel.textContent = "다음 단계";
frontierBuildActionLabel.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildActionLabel.style.fontSize = "12px";
frontierBuildActionLabel.style.fontWeight = "700";
frontierBuildActionLabel.style.color = "rgba(88,66,34,0.76)";
frontierBuildActionCard.appendChild(frontierBuildActionLabel);

const frontierBuildActionBtn = document.createElement("button");
frontierBuildActionBtn.type = "button";
frontierBuildActionBtn.textContent = "건축 진행";
frontierBuildActionBtn.style.marginTop = "10px";
frontierBuildActionBtn.style.minWidth = "112px";
frontierBuildActionBtn.style.border = "1px solid rgba(150,90,20,0.35)";
frontierBuildActionBtn.style.borderRadius = "12px";
frontierBuildActionBtn.style.padding = "14px 12px";
frontierBuildActionBtn.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildActionBtn.style.fontSize = "18px";
frontierBuildActionBtn.style.fontWeight = "900";
frontierBuildActionBtn.style.color = "#7a4a12";
frontierBuildActionBtn.style.background = "rgba(255,255,255,0.82)";
frontierBuildActionBtn.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
frontierBuildActionBtn.style.cursor = "pointer";
frontierBuildActionCard.appendChild(frontierBuildActionBtn);

const frontierBuildResourceGrid = document.createElement("div");
frontierBuildResourceGrid.style.display = "grid";
frontierBuildResourceGrid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
frontierBuildResourceGrid.style.gap = "12px";
frontierBuildBody.appendChild(frontierBuildResourceGrid);

const frontierBuildRequirementCard = document.createElement("div");
frontierBuildRequirementCard.style.padding = "14px";
frontierBuildRequirementCard.style.borderRadius = "12px";
frontierBuildRequirementCard.style.background = "rgba(255,255,255,0.94)";
frontierBuildRequirementCard.style.border = "1px solid rgba(0,0,0,0.14)";
frontierBuildRequirementCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildResourceGrid.appendChild(frontierBuildRequirementCard);

const frontierBuildOwnedCard = document.createElement("div");
frontierBuildOwnedCard.style.padding = "14px";
frontierBuildOwnedCard.style.borderRadius = "12px";
frontierBuildOwnedCard.style.background = "rgba(255,255,255,0.94)";
frontierBuildOwnedCard.style.border = "1px solid rgba(0,0,0,0.14)";
frontierBuildOwnedCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildResourceGrid.appendChild(frontierBuildOwnedCard);

const frontierBuildNotice = document.createElement("div");
frontierBuildNotice.style.padding = "12px 14px";
frontierBuildNotice.style.borderRadius = "10px";
frontierBuildNotice.style.background = "rgba(255,255,255,0.9)";
frontierBuildNotice.style.border = "1px solid rgba(0,0,0,0.12)";
frontierBuildNotice.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildNotice.style.fontSize = "13px";
frontierBuildNotice.style.lineHeight = "1.5";
frontierBuildNotice.style.color = "#444";
frontierBuildBody.appendChild(frontierBuildNotice);

const frontierBuildSignCard = document.createElement("div");
frontierBuildSignCard.style.padding = "14px";
frontierBuildSignCard.style.borderRadius = "12px";
frontierBuildSignCard.style.background = "rgba(255,255,255,0.94)";
frontierBuildSignCard.style.border = "1px solid rgba(0,0,0,0.14)";
frontierBuildSignCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildSignCard.style.display = "none";
frontierBuildBody.appendChild(frontierBuildSignCard);

const frontierBuildSignTitle = document.createElement("div");
frontierBuildSignTitle.textContent = "간판 텍스트";
frontierBuildSignTitle.style.fontSize = "13px";
frontierBuildSignTitle.style.fontWeight = "800";
frontierBuildSignTitle.style.color = "#222";
frontierBuildSignCard.appendChild(frontierBuildSignTitle);

const frontierBuildSignInput = document.createElement("input");
frontierBuildSignInput.type = "text";
frontierBuildSignInput.maxLength = FRONTIER_BUILDING_SIGN_MAX_CHARS;
frontierBuildSignInput.placeholder = "간판 문구를 입력하세요";
frontierBuildSignInput.style.marginTop = "10px";
frontierBuildSignInput.style.width = "100%";
frontierBuildSignInput.style.boxSizing = "border-box";
frontierBuildSignInput.style.border = "1px solid rgba(0,0,0,0.18)";
frontierBuildSignInput.style.borderRadius = "10px";
frontierBuildSignInput.style.padding = "11px 12px";
frontierBuildSignInput.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildSignInput.style.fontSize = "14px";
frontierBuildSignInput.style.background = "rgba(255,255,255,0.96)";
frontierBuildSignCard.appendChild(frontierBuildSignInput);

const frontierBuildSignSaveBtn = document.createElement("button");
frontierBuildSignSaveBtn.textContent = "간판 저장";
frontierBuildSignSaveBtn.style.marginTop = "10px";
frontierBuildSignSaveBtn.style.minWidth = "90px";
frontierBuildSignSaveBtn.style.border = "1px solid rgba(0,0,0,0.18)";
frontierBuildSignSaveBtn.style.borderRadius = "10px";
frontierBuildSignSaveBtn.style.padding = "9px 12px";
frontierBuildSignSaveBtn.style.fontSize = "13px";
frontierBuildSignSaveBtn.style.fontWeight = "700";
frontierBuildSignSaveBtn.style.cursor = "pointer";
frontierBuildSignSaveBtn.style.background = "rgba(255,255,255,0.92)";
frontierBuildSignSaveBtn.style.color = "#333";
frontierBuildSignCard.appendChild(frontierBuildSignSaveBtn);

const frontierBuildShopManagerCard = document.createElement("div");
frontierBuildShopManagerCard.style.padding = "14px";
frontierBuildShopManagerCard.style.borderRadius = "12px";
frontierBuildShopManagerCard.style.background = "rgba(255,255,255,0.94)";
frontierBuildShopManagerCard.style.border = "1px solid rgba(0,0,0,0.14)";
frontierBuildShopManagerCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildShopManagerCard.style.display = "none";
frontierBuildBody.appendChild(frontierBuildShopManagerCard);

const frontierBuildShopManagerTitle = document.createElement("div");
frontierBuildShopManagerTitle.textContent = "상점 슬롯 사용자 관리";
frontierBuildShopManagerTitle.style.fontSize = "13px";
frontierBuildShopManagerTitle.style.fontWeight = "800";
frontierBuildShopManagerTitle.style.color = "#222";
frontierBuildShopManagerCard.appendChild(frontierBuildShopManagerTitle);

const frontierBuildShopCurrentUser = document.createElement("div");
frontierBuildShopCurrentUser.style.marginTop = "10px";
frontierBuildShopCurrentUser.style.fontSize = "13px";
frontierBuildShopCurrentUser.style.fontWeight = "700";
frontierBuildShopCurrentUser.style.color = "#444";
frontierBuildShopManagerCard.appendChild(frontierBuildShopCurrentUser);

const frontierBuildShopAddressInput = document.createElement("input");
frontierBuildShopAddressInput.type = "text";
frontierBuildShopAddressInput.placeholder = "상점 사용자 지갑 주소 입력";
frontierBuildShopAddressInput.style.marginTop = "10px";
frontierBuildShopAddressInput.style.width = "100%";
frontierBuildShopAddressInput.style.boxSizing = "border-box";
frontierBuildShopAddressInput.style.border = "1px solid rgba(0,0,0,0.18)";
frontierBuildShopAddressInput.style.borderRadius = "10px";
frontierBuildShopAddressInput.style.padding = "11px 12px";
frontierBuildShopAddressInput.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierBuildShopAddressInput.style.fontSize = "14px";
frontierBuildShopAddressInput.style.background = "rgba(255,255,255,0.96)";
frontierBuildShopManagerCard.appendChild(frontierBuildShopAddressInput);

const frontierBuildShopButtonRow = document.createElement("div");
frontierBuildShopButtonRow.style.display = "flex";
frontierBuildShopButtonRow.style.gap = "8px";
frontierBuildShopButtonRow.style.flexWrap = "wrap";
frontierBuildShopButtonRow.style.marginTop = "10px";
frontierBuildShopManagerCard.appendChild(frontierBuildShopButtonRow);

const frontierBuildShopSelfBtn = document.createElement("button");
frontierBuildShopSelfBtn.textContent = "내가 직접 사용";
frontierBuildShopSelfBtn.style.border = "1px solid rgba(0,0,0,0.18)";
frontierBuildShopSelfBtn.style.borderRadius = "10px";
frontierBuildShopSelfBtn.style.padding = "9px 12px";
frontierBuildShopSelfBtn.style.fontSize = "13px";
frontierBuildShopSelfBtn.style.fontWeight = "700";
frontierBuildShopSelfBtn.style.cursor = "pointer";
frontierBuildShopSelfBtn.style.background = "rgba(255,255,255,0.92)";
frontierBuildShopSelfBtn.style.color = "#333";
frontierBuildShopButtonRow.appendChild(frontierBuildShopSelfBtn);

const frontierBuildShopAssignBtn = document.createElement("button");
frontierBuildShopAssignBtn.textContent = "지갑 주소로 지정";
frontierBuildShopAssignBtn.style.border = "1px solid rgba(0,0,0,0.18)";
frontierBuildShopAssignBtn.style.borderRadius = "10px";
frontierBuildShopAssignBtn.style.padding = "9px 12px";
frontierBuildShopAssignBtn.style.fontSize = "13px";
frontierBuildShopAssignBtn.style.fontWeight = "700";
frontierBuildShopAssignBtn.style.cursor = "pointer";
frontierBuildShopAssignBtn.style.background = "rgba(255,255,255,0.92)";
frontierBuildShopAssignBtn.style.color = "#333";
frontierBuildShopButtonRow.appendChild(frontierBuildShopAssignBtn);

const frontierBuildShopClearBtn = document.createElement("button");
frontierBuildShopClearBtn.textContent = "사용자 해제";
frontierBuildShopClearBtn.style.border = "1px solid rgba(0,0,0,0.18)";
frontierBuildShopClearBtn.style.borderRadius = "10px";
frontierBuildShopClearBtn.style.padding = "9px 12px";
frontierBuildShopClearBtn.style.fontSize = "13px";
frontierBuildShopClearBtn.style.fontWeight = "700";
frontierBuildShopClearBtn.style.cursor = "pointer";
frontierBuildShopClearBtn.style.background = "rgba(255,255,255,0.92)";
frontierBuildShopClearBtn.style.color = "#333";
frontierBuildShopButtonRow.appendChild(frontierBuildShopClearBtn);

frontierShopRegisterOverlay = document.createElement("div");
frontierShopRegisterOverlay.style.position = "fixed";
frontierShopRegisterOverlay.style.inset = "0";
frontierShopRegisterOverlay.style.background = "rgba(12, 16, 22, 0.28)";
frontierShopRegisterOverlay.style.display = "none";
frontierShopRegisterOverlay.style.pointerEvents = "auto";
frontierShopRegisterOverlay.style.zIndex = "1000003";
uiLayer.appendChild(frontierShopRegisterOverlay);

frontierShopRegisterWin = document.createElement("div");
frontierShopRegisterWin.style.position = "fixed";
frontierShopRegisterWin.style.left = "50%";
frontierShopRegisterWin.style.top = "50%";
frontierShopRegisterWin.style.transform = "translate(-50%, -50%)";
frontierShopRegisterWin.style.width = "min(620px, calc(100vw - 40px))";
frontierShopRegisterWin.style.maxHeight = "min(76vh, 720px)";
frontierShopRegisterWin.style.background = "rgba(244, 241, 235, 0.98)";
frontierShopRegisterWin.style.border = "1px solid rgba(0,0,0,0.2)";
frontierShopRegisterWin.style.borderRadius = "14px";
frontierShopRegisterWin.style.boxShadow = "0 18px 42px rgba(0,0,0,0.28)";
frontierShopRegisterWin.style.display = "none";
frontierShopRegisterWin.style.pointerEvents = "auto";
frontierShopRegisterWin.style.zIndex = "1000004";
frontierShopRegisterWin.style.overflow = "hidden";
uiLayer.appendChild(frontierShopRegisterWin);

const frontierShopHeader = document.createElement("div");
frontierShopHeader.style.display = "flex";
frontierShopHeader.style.alignItems = "center";
frontierShopHeader.style.gap = "12px";
frontierShopHeader.style.padding = "12px 14px";
frontierShopHeader.style.borderBottom = "1px solid rgba(0,0,0,0.15)";
frontierShopHeader.style.background = "rgba(255,255,255,0.74)";
frontierShopRegisterWin.appendChild(frontierShopHeader);

const frontierShopTitle = document.createElement("div");
frontierShopTitle.textContent = "판매 등록";
frontierShopTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
frontierShopTitle.style.fontSize = "18px";
frontierShopTitle.style.fontWeight = "800";
frontierShopTitle.style.color = "#222";
frontierShopTitle.style.marginRight = "auto";
frontierShopHeader.appendChild(frontierShopTitle);

const frontierShopCloseBtn = document.createElement("button");
frontierShopCloseBtn.type = "button";
frontierShopCloseBtn.textContent = "닫기";
frontierShopCloseBtn.style.minWidth = "74px";
frontierShopCloseBtn.style.border = "1px solid rgba(0,0,0,0.18)";
frontierShopCloseBtn.style.borderRadius = "10px";
frontierShopCloseBtn.style.padding = "8px 10px";
frontierShopCloseBtn.style.fontSize = "13px";
frontierShopCloseBtn.style.fontWeight = "700";
frontierShopCloseBtn.style.cursor = "pointer";
frontierShopCloseBtn.style.background = "rgba(255,255,255,0.92)";
frontierShopCloseBtn.style.color = "#333";
frontierShopHeader.appendChild(frontierShopCloseBtn);

const frontierShopBody = document.createElement("div");
frontierShopBody.style.padding = "16px";
frontierShopBody.style.display = "grid";
frontierShopBody.style.gridTemplateRows = "auto auto auto auto";
frontierShopBody.style.gap = "14px";
frontierShopRegisterWin.appendChild(frontierShopBody);

const frontierShopCurrentStatus = document.createElement("div");
frontierShopCurrentStatus.style.padding = "12px 14px";
frontierShopCurrentStatus.style.borderRadius = "12px";
frontierShopCurrentStatus.style.background = "rgba(255,255,255,0.94)";
frontierShopCurrentStatus.style.border = "1px solid rgba(0,0,0,0.12)";
frontierShopCurrentStatus.style.fontSize = "13px";
frontierShopCurrentStatus.style.fontWeight = "700";
frontierShopCurrentStatus.style.color = "#333";
frontierShopBody.appendChild(frontierShopCurrentStatus);

const frontierShopInventoryGrid = document.createElement("div");
frontierShopInventoryGrid.style.display = "grid";
frontierShopInventoryGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(104px, 1fr))";
frontierShopInventoryGrid.style.gap = "10px";
frontierShopInventoryGrid.style.maxHeight = "240px";
frontierShopInventoryGrid.style.overflowY = "auto";
frontierShopInventoryGrid.style.paddingRight = "4px";
frontierShopBody.appendChild(frontierShopInventoryGrid);

const frontierShopConfigCard = document.createElement("div");
frontierShopConfigCard.style.padding = "14px";
frontierShopConfigCard.style.borderRadius = "12px";
frontierShopConfigCard.style.background = "rgba(255,255,255,0.94)";
frontierShopConfigCard.style.border = "1px solid rgba(0,0,0,0.12)";
frontierShopConfigCard.style.display = "grid";
frontierShopConfigCard.style.gridTemplateColumns = "1fr 1fr";
frontierShopConfigCard.style.gap = "10px 14px";
frontierShopBody.appendChild(frontierShopConfigCard);

const frontierShopSelectedItem = document.createElement("div");
frontierShopSelectedItem.style.gridColumn = "1 / -1";
frontierShopSelectedItem.style.fontSize = "13px";
frontierShopSelectedItem.style.fontWeight = "800";
frontierShopSelectedItem.style.color = "#222";
frontierShopConfigCard.appendChild(frontierShopSelectedItem);

const frontierShopSelectedOwned = document.createElement("div");
frontierShopSelectedOwned.style.gridColumn = "1 / -1";
frontierShopSelectedOwned.style.marginTop = "-4px";
frontierShopSelectedOwned.style.fontSize = "12px";
frontierShopSelectedOwned.style.color = "#6b6053";
frontierShopConfigCard.appendChild(frontierShopSelectedOwned);

const frontierShopQtyLabel = document.createElement("label");
frontierShopQtyLabel.textContent = "판매 수량";
frontierShopQtyLabel.style.fontSize = "12px";
frontierShopQtyLabel.style.fontWeight = "700";
frontierShopQtyLabel.style.color = "#555";
frontierShopConfigCard.appendChild(frontierShopQtyLabel);

const frontierShopPriceLabel = document.createElement("label");
frontierShopPriceLabel.textContent = "가격";
frontierShopPriceLabel.style.fontSize = "12px";
frontierShopPriceLabel.style.fontWeight = "700";
frontierShopPriceLabel.style.color = "#555";
frontierShopConfigCard.appendChild(frontierShopPriceLabel);

const frontierShopQuantityInput = document.createElement("input");
frontierShopQuantityInput.type = "number";
frontierShopQuantityInput.min = "1";
frontierShopQuantityInput.step = "1";
frontierShopQuantityInput.value = "1";
frontierShopQuantityInput.style.border = "1px solid rgba(0,0,0,0.16)";
frontierShopQuantityInput.style.borderRadius = "10px";
frontierShopQuantityInput.style.padding = "10px 12px";
frontierShopQuantityInput.style.fontSize = "14px";
frontierShopQuantityInput.style.background = "rgba(255,255,255,0.96)";
frontierShopConfigCard.appendChild(frontierShopQuantityInput);

const frontierShopPriceInput = document.createElement("input");
frontierShopPriceInput.type = "number";
frontierShopPriceInput.min = "0";
frontierShopPriceInput.step = "1";
frontierShopPriceInput.value = "0";
frontierShopPriceInput.style.border = "1px solid rgba(0,0,0,0.16)";
frontierShopPriceInput.style.borderRadius = "10px";
frontierShopPriceInput.style.padding = "10px 12px";
frontierShopPriceInput.style.fontSize = "14px";
frontierShopPriceInput.style.background = "rgba(255,255,255,0.96)";
frontierShopConfigCard.appendChild(frontierShopPriceInput);

const frontierShopButtonRow = document.createElement("div");
frontierShopButtonRow.style.display = "flex";
frontierShopButtonRow.style.justifyContent = "space-between";
frontierShopButtonRow.style.alignItems = "center";
frontierShopBody.appendChild(frontierShopButtonRow);

const frontierShopClearBtn = document.createElement("button");
frontierShopClearBtn.type = "button";
frontierShopClearBtn.textContent = "판매 해제";
frontierShopClearBtn.style.minWidth = "100px";
frontierShopClearBtn.style.border = "1px solid rgba(0,0,0,0.18)";
frontierShopClearBtn.style.borderRadius = "10px";
frontierShopClearBtn.style.padding = "10px 12px";
frontierShopClearBtn.style.fontSize = "13px";
frontierShopClearBtn.style.fontWeight = "700";
frontierShopClearBtn.style.cursor = "pointer";
frontierShopClearBtn.style.background = "rgba(255,255,255,0.92)";
frontierShopClearBtn.style.color = "#333";
frontierShopButtonRow.appendChild(frontierShopClearBtn);

const frontierShopRegisterBtn = document.createElement("button");
frontierShopRegisterBtn.type = "button";
frontierShopRegisterBtn.textContent = "판매 등록";
frontierShopRegisterBtn.style.minWidth = "112px";
frontierShopRegisterBtn.style.border = "1px solid rgba(150,90,20,0.35)";
frontierShopRegisterBtn.style.borderRadius = "12px";
frontierShopRegisterBtn.style.padding = "12px 14px";
frontierShopRegisterBtn.style.fontSize = "15px";
frontierShopRegisterBtn.style.fontWeight = "900";
frontierShopRegisterBtn.style.cursor = "pointer";
frontierShopRegisterBtn.style.background = "rgba(255,255,255,0.92)";
frontierShopRegisterBtn.style.color = "#7a4a12";
frontierShopButtonRow.appendChild(frontierShopRegisterBtn);

const frontierBoothOverlay = document.createElement("div");
frontierBoothOverlay.style.position = "fixed";
frontierBoothOverlay.style.inset = "0";
frontierBoothOverlay.style.background = "rgba(12, 16, 22, 0.28)";
frontierBoothOverlay.style.display = "none";
frontierBoothOverlay.style.pointerEvents = "auto";
frontierBoothOverlay.style.zIndex = "1000003";
uiLayer.appendChild(frontierBoothOverlay);

const frontierBoothWin = document.createElement("div");
frontierBoothWin.style.position = "fixed";
frontierBoothWin.style.left = "50%";
frontierBoothWin.style.top = "50%";
frontierBoothWin.style.transform = "translate(-50%, -50%)";
frontierBoothWin.style.width = "min(520px, calc(100vw - 40px))";
frontierBoothWin.style.background = "rgba(245,245,245,0.98)";
frontierBoothWin.style.border = "1px solid rgba(0,0,0,0.16)";
frontierBoothWin.style.borderRadius = "18px";
frontierBoothWin.style.boxShadow = "0 18px 42px rgba(0,0,0,0.28)";
frontierBoothWin.style.display = "none";
frontierBoothWin.style.pointerEvents = "auto";
frontierBoothWin.style.zIndex = "1000004";
frontierBoothWin.style.overflow = "hidden";
uiLayer.appendChild(frontierBoothWin);

const frontierBoothHeader = document.createElement("div");
frontierBoothHeader.style.display = "flex";
frontierBoothHeader.style.alignItems = "center";
frontierBoothHeader.style.gap = "12px";
frontierBoothHeader.style.padding = "14px 16px";
frontierBoothHeader.style.borderBottom = "1px solid rgba(0,0,0,0.12)";
frontierBoothHeader.style.background = "rgba(255,255,255,0.72)";
frontierBoothWin.appendChild(frontierBoothHeader);

const frontierBoothTitle = document.createElement("div");
frontierBoothTitle.style.fontSize = "19px";
frontierBoothTitle.style.fontWeight = "900";
frontierBoothTitle.style.color = "#222";
frontierBoothTitle.style.marginRight = "auto";
frontierBoothHeader.appendChild(frontierBoothTitle);

const frontierBoothCloseBtn = document.createElement("button");
frontierBoothCloseBtn.type = "button";
frontierBoothCloseBtn.textContent = "닫기";
frontierBoothCloseBtn.style.padding = "9px 12px";
frontierBoothCloseBtn.style.borderRadius = "10px";
frontierBoothCloseBtn.style.border = "1px solid rgba(0,0,0,0.14)";
frontierBoothCloseBtn.style.background = "rgba(255,255,255,0.92)";
frontierBoothCloseBtn.style.fontSize = "13px";
frontierBoothCloseBtn.style.fontWeight = "800";
frontierBoothCloseBtn.style.cursor = "pointer";
frontierBoothHeader.appendChild(frontierBoothCloseBtn);

const frontierBoothBody = document.createElement("div");
frontierBoothBody.style.padding = "16px";
frontierBoothBody.style.display = "grid";
frontierBoothBody.style.gap = "14px";
frontierBoothWin.appendChild(frontierBoothBody);

const frontierBoothStatus = document.createElement("div");
frontierBoothStatus.style.padding = "12px 14px";
frontierBoothStatus.style.borderRadius = "12px";
frontierBoothStatus.style.background = "rgba(255,255,255,0.94)";
frontierBoothStatus.style.border = "1px solid rgba(0,0,0,0.12)";
frontierBoothStatus.style.fontSize = "13px";
frontierBoothStatus.style.lineHeight = "1.6";
frontierBoothStatus.style.color = "#444";
frontierBoothBody.appendChild(frontierBoothStatus);

const frontierBoothActionArea = document.createElement("div");
frontierBoothActionArea.style.display = "grid";
frontierBoothActionArea.style.gap = "10px";
frontierBoothBody.appendChild(frontierBoothActionArea);

let frontierBoothOpen = false;
let frontierBoothContext = null;

frontierBuildCloseBtn.addEventListener("click", () => {
  setFrontierBuildOpen(false);
});

frontierBuildOverlay.addEventListener("click", () => {
  setFrontierBuildOpen(false);
});

frontierBuildActionBtn.addEventListener("click", () => {
  const parcelLabel = getSelectedFrontierParcelLabel();
  const buildState = getFrontierBuildState(parcelLabel);
  if (buildState.stage >= 100) {
    openFrontierShopRegisterDialog(parcelLabel);
    return;
  }
  tryAdvanceFrontierBuildStage();
});

frontierBuildSignSaveBtn.addEventListener("click", () => {
  saveFrontierBuildSignText();
});

frontierShopCloseBtn.addEventListener("click", () => {
  closeFrontierShopRegisterDialog();
});

frontierShopRegisterOverlay.addEventListener("click", () => {
  closeFrontierShopRegisterDialog();
});

frontierShopRegisterBtn.addEventListener("click", () => {
  commitFrontierShopListing();
});

frontierShopClearBtn.addEventListener("click", () => {
  clearFrontierShopListing();
});

frontierBuildShopSelfBtn.addEventListener("click", () => {
  const parcelLabel = getSelectedFrontierParcelLabel();
  const currentWallet = getCurrentFrontierWalletAddress();
  if (!currentWallet) {
    showUI("로그인 지갑 주소를 확인할 수 없습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return;
  }
  assignFrontierShopSlotUser(parcelLabel, currentWallet);
});

frontierBuildShopAssignBtn.addEventListener("click", () => {
  assignFrontierShopSlotUser(getSelectedFrontierParcelLabel(), frontierBuildShopAddressInput.value);
});

frontierBuildShopClearBtn.addEventListener("click", () => {
  clearFrontierShopSlotUser(getSelectedFrontierParcelLabel());
});

function closeFrontierBoothDialog() {
  frontierBoothOpen = false;
  frontierBoothContext = null;
  frontierBoothOverlay.style.display = "none";
  frontierBoothWin.style.display = "none";
}

function renderFrontierBoothDialog() {
  if (!frontierBoothContext) return;
  const { parcelLabel, slotKey, boothTitle, mode } = frontierBoothContext;
  const buildState = getFrontierBuildState(parcelLabel);
  const slotState = slotKey === "shop" ? buildState.operations.shop : buildState.operations[slotKey];
  frontierBoothTitle.textContent = `${parcelLabel} ${boothTitle} ${mode === "manage" ? "관리" : "보기"}`;
  frontierBoothActionArea.innerHTML = "";

  if (slotKey === "shop") {
    const assignedWallet = getFrontierShopAssignedWallet(parcelLabel);
    frontierBoothStatus.innerHTML = `
      <div>현재 상태: <strong>${slotState.statusText}</strong></div>
      <div style="margin-top:6px;">현재 사용자: <strong>${assignedWallet ? shortenWalletAddress(assignedWallet) : "미지정"}</strong></div>
      <div style="margin-top:6px;opacity:0.78;">${mode === "manage" ? "상점 사용자 지정과 판매 등록을 이곳에서 관리합니다." : "방문자는 등록된 판매 물품 상태를 여기서 확인할 수 있습니다."}</div>
    `;
    if (mode === "manage") {
      if (canManageFrontierShopSlot(parcelLabel)) {
        const controls = document.createElement("div");
        controls.style.display = "grid";
        controls.style.gap = "10px";

        const current = document.createElement("div");
        current.style.fontSize = "13px";
        current.style.fontWeight = "700";
        current.style.color = "#444";
        current.textContent = assignedWallet ? `현재 지정: ${shortenWalletAddress(assignedWallet)}` : "현재 지정: 미지정";
        controls.appendChild(current);

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "상점 사용자 지갑 주소 입력";
        input.value = assignedWallet;
        input.style.border = "1px solid rgba(0,0,0,0.14)";
        input.style.borderRadius = "10px";
        input.style.padding = "10px 12px";
        input.style.fontSize = "14px";
        controls.appendChild(input);

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.flexWrap = "wrap";
        row.style.gap = "8px";
        controls.appendChild(row);

        const makeBtn = (label) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = label;
          btn.style.padding = "10px 12px";
          btn.style.borderRadius = "10px";
          btn.style.border = "1px solid rgba(0,0,0,0.14)";
          btn.style.background = "rgba(255,255,255,0.94)";
          btn.style.fontSize = "13px";
          btn.style.fontWeight = "800";
          btn.style.cursor = "pointer";
          return btn;
        };

        const selfBtn = makeBtn("내가 직접 사용");
        selfBtn.addEventListener("click", () => {
          const currentWallet = getCurrentFrontierWalletAddress();
          if (!currentWallet) {
            showUI("로그인 지갑 주소를 확인할 수 없습니다.", 1000);
            lastMessageUntil = performance.now() + 1000;
            return;
          }
          assignFrontierShopSlotUser(parcelLabel, currentWallet);
          renderFrontierBoothDialog();
        });
        row.appendChild(selfBtn);

        const assignBtn = makeBtn("지갑 주소로 지정");
        assignBtn.addEventListener("click", () => {
          assignFrontierShopSlotUser(parcelLabel, input.value);
          renderFrontierBoothDialog();
        });
        row.appendChild(assignBtn);

        const clearBtn = makeBtn("사용자 해제");
        clearBtn.addEventListener("click", () => {
          clearFrontierShopSlotUser(parcelLabel);
          renderFrontierBoothDialog();
        });
        row.appendChild(clearBtn);

        frontierBoothActionArea.appendChild(controls);
      }

      if (canUseFrontierShopSlot(parcelLabel)) {
        const salesBtn = document.createElement("button");
        salesBtn.type = "button";
        salesBtn.textContent = "판매 등록";
        salesBtn.style.padding = "12px 14px";
        salesBtn.style.borderRadius = "12px";
        salesBtn.style.border = "1px solid rgba(150,90,20,0.35)";
        salesBtn.style.background = "rgba(255,255,255,0.94)";
        salesBtn.style.fontSize = "15px";
        salesBtn.style.fontWeight = "900";
        salesBtn.style.color = "#7a4a12";
        salesBtn.style.cursor = "pointer";
        salesBtn.addEventListener("click", () => {
          openFrontierShopRegisterDialog(parcelLabel);
        });
        frontierBoothActionArea.appendChild(salesBtn);
      } else {
        const note = document.createElement("div");
        note.style.fontSize = "13px";
        note.style.color = "#6b6053";
        note.textContent = assignedWallet
          ? "현재 로그인한 지갑은 상점 사용자로 지정되어 있지 않아 판매 등록을 할 수 없습니다."
          : "상점 사용자를 먼저 지정해야 판매 등록을 할 수 있습니다.";
        frontierBoothActionArea.appendChild(note);
      }
    }
    return;
  }

  frontierBoothStatus.innerHTML = `
    <div>현재 상태: <strong>${slotState.statusText}</strong></div>
    <div style="margin-top:6px;opacity:0.78;">${mode === "manage" ? "전시 권한 구조는 다음 단계에서 연결됩니다. 지금은 상태 확인만 가능합니다." : "전시 부스 상태를 확인할 수 있습니다."}</div>
  `;
}

function openFrontierBoothDialog(parcelLabel, slotKey, boothTitle, mode) {
  frontierBoothContext = { parcelLabel, slotKey, boothTitle, mode };
  frontierBoothOpen = true;
  frontierBoothOverlay.style.display = "block";
  frontierBoothWin.style.display = "block";
  renderFrontierBoothDialog();
}

frontierBoothCloseBtn.addEventListener("click", () => {
  closeFrontierBoothDialog();
});

frontierBoothOverlay.addEventListener("click", () => {
  closeFrontierBoothDialog();
});


// Camera controls
camera.position.set(0, 4, 8);
controls = new OrbitControls(camera, renderer.domElement);controls.enableDamping = true;
controls.target.copy(player.position).add(new THREE.Vector3(0, 1.0, 0));
controls.minDistance = 3;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minPolarAngle = Math.PI * 0.1;
controls.enablePan = false;

let shiftRotatePointerActive = false;
let shiftRotateLastX = 0;
let shiftRotateLastY = 0;

if (shouldResetAuthSessionOnLocalReload()) {
  localStorage.removeItem(WALLET_SESSION_KEY);
}
restoreWalletSession();
bindWalletProviderEvents();
updateWalletUi();
hydrateWalletSessionFromServer();

const followTargetOffset = new THREE.Vector3(0, 1.0, 0);
const lastFollowPlayerPosition = new THREE.Vector3().copy(player.position);
const framePlayerDelta = new THREE.Vector3();

function snapCameraToPlayer() {
  const currentOffset = new THREE.Vector3().copy(camera.position).sub(controls.target);
  controls.target.copy(player.position).add(followTargetOffset);
  camera.position.copy(controls.target).add(currentOffset);
  lastFollowPlayerPosition.copy(player.position);
  controls.update();
}

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

  g.userData.isHarvestTree = true;
  g.userData.harvestItemId = "woodChip";
  g.userData.harvestCount = 1;
  g.userData.harvestCooldownUntil = 0;
  g.userData.harvestDisabled = false;
  g.userData.trunk = trunk;
  g.userData.leaves = leaves;
  harvestTrees.push(g);

  return g;
}

// 캐릭터급 바위 (충돌 포함)
function makeRock(x, z, rockSizeDef = ROCK_SIZE_DEFS[1], fadeIn = false, options = {}) {
  const scale = rockSizeDef.scale;
  const rockColor = options.color ?? 0x6f6f72;
  const defaultResourceCount =
    options.resourceItemId === "stoneDust" || (!options.resourceItemId && !options.resourceCount)
      ? rockSizeDef.stoneDustDropCount ?? 1
      : 1;
  const rockMat = new THREE.MeshStandardMaterial({
    color: rockColor,
    roughness: 1.0,
    transparent: fadeIn,
    opacity: fadeIn ? 0 : 1,
  });
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.9 * scale, options.detail ?? 0),
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
  rock.userData.hp = options.maxHp ?? rockSizeDef.maxHp;
  rock.userData.maxHp = options.maxHp ?? rockSizeDef.maxHp;
  rock.userData.spawn = {
    x,
    z,
    rockSize: rockSizeDef.id,
    mapId: options.mapId ?? "광산맵",
    resourceItemId: options.resourceItemId ?? "stoneDust",
    resourceCount: options.resourceCount ?? defaultResourceCount,
    requiredPickaxeLevel: options.requiredPickaxeLevel ?? 0,
    color: rockColor,
    detail: options.detail ?? 0,
    maxHp: options.maxHp ?? rockSizeDef.maxHp,
  };
  rock.userData.resourceItemId = options.resourceItemId ?? "stoneDust";
  rock.userData.resourceCount = options.resourceCount ?? defaultResourceCount;
  rock.userData.requiredPickaxeLevel = options.requiredPickaxeLevel ?? 0;
  rock.userData.resourceHint = options.hint ?? "Space : 채굴";
  rock.userData.hpLabelPrefix = options.hpLabelPrefix ?? "돌 체력";
  rock.userData.bonusDropEnabled = options.bonusDropEnabled ?? rock.userData.resourceItemId === "stoneDust";
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
    const next = spawn?.mapId === "폐광맵"
      ? findCampStoneSpawnPosition(rockSizeDef.scale, 120)
      : findRockSpawnPosition(rockSizeDef.scale, 120);
    if (!next) return;
    makeRock(next.x, next.z, rockSizeDef, true, {
      mapId: spawn?.mapId,
      resourceItemId: spawn?.resourceItemId,
      requiredPickaxeLevel: spawn?.requiredPickaxeLevel,
      color: spawn?.color,
      detail: spawn?.detail,
      maxHp: spawn?.maxHp,
      bonusDropEnabled: spawn?.resourceItemId === "stoneDust",
      hpLabelPrefix: spawn?.resourceItemId === "masonryStone" ? "석재 돌 체력" : "돌 체력",
    });
  }, ROCK_RESPAWN_MS);
}

function unregisterMineRock(rock) {
  const idx = mineRocks.indexOf(rock);
  if (idx !== -1) mineRocks.splice(idx, 1);

}

function setHarvestTreeActive(tree, active) {
  if (!tree?.userData) return;
  tree.userData.harvestDisabled = !active;
  tree.userData.harvestCooldownUntil = active ? 0 : performance.now() + TREE_HARVEST_RESPAWN_MS;
  const trunk = tree.userData.trunk;
  const leaves = tree.userData.leaves;
  for (const mesh of [trunk, leaves]) {
    if (!mesh?.material) continue;
    mesh.material.transparent = !active;
    mesh.material.opacity = active ? 1 : 0.26;
  }
}

function updateHarvestTrees() {
  const now = performance.now();
  for (const tree of harvestTrees) {
    if (!tree?.parent || !tree.userData.harvestDisabled) continue;
    if (now >= (tree.userData.harvestCooldownUntil ?? 0)) {
      setHarvestTreeActive(tree, true);
    }
  }
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

function triggerHitStop(duration = HIT_STOP_DURATION) {
  hitStopTime = Math.max(hitStopTime, duration);
}

function triggerCameraShake(strength = 0.045, duration = CAMERA_SHAKE_DURATION) {
  cameraShakeTime = Math.max(cameraShakeTime, duration);
  cameraShakeStrength = Math.max(cameraShakeStrength, strength);
}

function triggerRockHitReaction(rock) {
  if (!rock || !rock.parent) return;

  const existing = rock.userData.hitReaction;
  if (existing) {
    existing.elapsed = 0;
    return;
  }

  const reaction = {
    rock,
    elapsed: 0,
    duration: ROCK_HIT_REACTION_DURATION,
    basePosition: rock.position.clone(),
    baseScale: rock.scale.clone(),
    baseRotation: rock.rotation.clone(),
  };
  rock.userData.hitReaction = reaction;
  rockHitReactions.push(reaction);
}

function updateRockHitReactions(dt) {
  for (let i = rockHitReactions.length - 1; i >= 0; i--) {
    const reaction = rockHitReactions[i];
    const rock = reaction.rock;
    if (!rock || !rock.parent) {
      rockHitReactions.splice(i, 1);
      continue;
    }

    reaction.elapsed += dt;
    const t = Math.min(1, reaction.elapsed / reaction.duration);
    const wave = Math.sin(t * Math.PI);

    rock.position.copy(reaction.basePosition);
    rock.position.x += Math.sin(t * 28) * 0.035;
    rock.position.z += Math.cos(t * 22) * 0.025;
    rock.position.y = reaction.basePosition.y - wave * 0.06;

    rock.scale.set(
      reaction.baseScale.x * (1 + wave * 0.08),
      reaction.baseScale.y * (1 - wave * 0.14),
      reaction.baseScale.z * (1 + wave * 0.08)
    );

    rock.rotation.copy(reaction.baseRotation);
    rock.rotation.z += Math.sin(t * Math.PI) * 0.05;

    if (t < 1) continue;

    rock.position.copy(reaction.basePosition);
    rock.scale.copy(reaction.baseScale);
    rock.rotation.copy(reaction.baseRotation);
    delete rock.userData.hitReaction;
    rockHitReactions.splice(i, 1);
  }
}

function applyCameraShake() {
  if (cameraShakeTime <= 0 || cameraShakeStrength <= 0) return;
  const scale = cameraShakeStrength * (cameraShakeTime / CAMERA_SHAKE_DURATION);
  camera.position.x += randRange(-scale, scale);
  camera.position.y += randRange(-scale * 0.8, scale * 0.8);
  camera.position.z += randRange(-scale, scale);
}

// ===== Pickaxe item =====
function buildPickaxeModel(level = 0) {
  const g = new THREE.Group();
  const pickaxeLevel = Math.max(0, Math.min(5, level));
  const steelColors = [0x9aa0a6, 0xa8afb8, 0xb4bcc6, 0x8ea3ba, 0x92a9c2, 0xc9b16d];
  const accentColors = [0x705132, 0x7f5b37, 0x6f4720, 0x55718e, 0xa67a38, 0xd3922f];
  const wrapColors = [0x8b5a2b, 0x8b5a2b, 0x674224, 0x62401f, 0x5d3816, 0x67340f];
  const headWidth = 0.8 + Math.max(0, pickaxeLevel - 2) * 0.08;
  const headHeight = 0.15 + Math.max(0, pickaxeLevel - 1) * 0.015;
  const headDepth = 0.2 + Math.max(0, pickaxeLevel - 3) * 0.03;
  const steelMat = new THREE.MeshStandardMaterial({
    color: steelColors[pickaxeLevel],
    roughness: pickaxeLevel >= 4 ? 0.46 : 0.62,
    metalness: pickaxeLevel >= 3 ? 0.35 : 0.18,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColors[pickaxeLevel],
    roughness: 0.55,
    metalness: pickaxeLevel >= 4 ? 0.4 : 0.15,
  });
  const wrapMat = new THREE.MeshStandardMaterial({
    color: wrapColors[pickaxeLevel],
    roughness: 0.92,
  });

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 })
  );
  handle.position.y = 0.6;

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(headWidth, headHeight, headDepth),
    steelMat
  );
  head.position.y = 1.2;

  g.add(handle, head);

  if (pickaxeLevel >= 1) {
    const endCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.07, 0.09, 8),
      accentMat
    );
    endCap.position.y = 0.035;
    g.add(endCap);
  }

  if (pickaxeLevel >= 2) {
    const wrap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.071, 0.071, 0.24, 10),
      wrapMat
    );
    wrap.position.y = 0.43;
    g.add(wrap);
  }

  if (pickaxeLevel >= 3) {
    const collar = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.2, 0.18),
      accentMat
    );
    collar.position.y = 1.05;
    g.add(collar);

    const wingLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.11, 0.11),
      steelMat
    );
    wingLeft.position.set(-(headWidth * 0.5 + 0.03), 1.2, 0);
    wingLeft.rotation.z = Math.PI * 0.16;
    g.add(wingLeft);

    const wingRight = wingLeft.clone();
    wingRight.position.x *= -1;
    wingRight.rotation.z *= -1;
    g.add(wingRight);
  }

  if (pickaxeLevel >= 4) {
    const upperWrap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.074, 0.074, 0.13, 10),
      accentMat
    );
    upperWrap.position.y = 0.9;
    g.add(upperWrap);

    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(headWidth * 0.55, 0.055, 0.06),
      accentMat
    );
    spine.position.set(0, 1.25, headDepth * 0.5 + 0.03);
    g.add(spine);
  }

  if (pickaxeLevel >= 5) {
    const crest = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.34, 0.08),
      accentMat
    );
    crest.position.set(0, 1.27, 0);
    g.add(crest);

    const sidePlateL = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.18, 0.045),
      accentMat
    );
    sidePlateL.position.set(-headWidth * 0.28, 1.19, headDepth * 0.52);
    sidePlateL.rotation.z = Math.PI * 0.12;
    g.add(sidePlateL);

    const sidePlateR = sidePlateL.clone();
    sidePlateR.position.x *= -1;
    sidePlateR.rotation.z *= -1;
    g.add(sidePlateR);
  }

  return g;
}

function buildSafetyHelmetModel(theme = "default") {
  const g = new THREE.Group();

  const isGoldenTheme = theme === "gold";
  const shellColor = isGoldenTheme ? 0xd9b24f : 0xf7f7f9;
  const ridgeColor = isGoldenTheme ? 0xf3d983 : 0xe8e8ee;
  const trimColor = isGoldenTheme ? 0x8c5f18 : 0xd9d9de;

  const shellMat = new THREE.MeshStandardMaterial({
    color: shellColor,
    roughness: isGoldenTheme ? 0.34 : 0.5,
    metalness: isGoldenTheme ? 0.42 : 0.02,
  });
  const ridgeMat = new THREE.MeshStandardMaterial({
    color: ridgeColor,
    roughness: isGoldenTheme ? 0.28 : 0.42,
    metalness: isGoldenTheme ? 0.55 : 0.03,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    roughness: isGoldenTheme ? 0.4 : 0.72,
    metalness: isGoldenTheme ? 0.3 : 0,
  });

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

function buildFreshAirCanisterModel() {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x8fd7e8,
    roughness: 0.42,
    metalness: 0.18,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xd9eef5,
    roughness: 0.28,
    metalness: 0.34,
  });
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x3f6472,
    roughness: 0.74,
    metalness: 0.04,
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.52, 18),
    shellMat
  );
  body.position.y = 0.26;
  g.add(body);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.08, 16),
    capMat
  );
  top.position.y = 0.56;
  g.add(top);

  const valve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.12, 10),
    capMat
  );
  valve.rotation.z = Math.PI * 0.5;
  valve.position.set(0.09, 0.58, 0);
  g.add(valve);

  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.115, 0.018, 8, 18),
    strapMat
  );
  band.rotation.x = Math.PI * 0.5;
  band.position.y = 0.21;
  g.add(band);

  return g;
}

function buildPurifyPowderModel() {
  const g = new THREE.Group();
  const jarMat = new THREE.MeshStandardMaterial({
    color: 0xe8ecf1,
    roughness: 0.26,
    metalness: 0.12,
    transparent: true,
    opacity: 0.9,
  });
  const powderMat = new THREE.MeshStandardMaterial({
    color: 0xc7f2dd,
    roughness: 0.78,
    metalness: 0.02,
    emissive: 0x3fa57b,
    emissiveIntensity: 0.22,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x5c6773,
    roughness: 0.56,
    metalness: 0.35,
  });

  const jar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.17, 0.3, 18),
    jarMat
  );
  jar.position.y = 0.16;
  g.add(jar);

  const powder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.138, 0.18, 16),
    powderMat
  );
  powder.position.y = 0.11;
  g.add(powder);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.13, 0.08, 16),
    capMat
  );
  cap.position.y = 0.34;
  g.add(cap);

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

function spawnCaveMasonryRocks() {
  for (let i = 0; i < CAVE_STONE_COUNT; i += 1) {
    const rockSizeDef = ROCK_SIZE_DEFS[Math.floor(Math.random() * ROCK_SIZE_DEFS.length)];
    const spawnPos = findCampStoneSpawnPosition(rockSizeDef.scale, 140);
    if (!spawnPos) continue;
    makeRock(spawnPos.x, spawnPos.z, rockSizeDef, false, {
      mapId: "폐광맵",
      resourceItemId: "masonryStone",
      requiredPickaxeLevel: 4,
      hint: "Space : 석재 채굴",
      color: 0x3f372f,
      detail: 1,
      maxHp: rockSizeDef.maxHp + 0.6,
      bonusDropEnabled: false,
      hpLabelPrefix: "석재 돌 체력",
    });
  }
}

spawnTreesAndRocks();
buildMinePerimeterCliffs();
buildStartZoneWall();
const startStall = buildStartStall();
registerSupportSurface(startStall.top);


// ===== Place pickaxe on top of the starting stall =====
const pickaxe = makePickaxe(
  START_X + 0.8,
  START_Z - 2.8,
  START_FLAT_Y,
  {
    x: Math.PI / 2,
    y: Math.PI * 0.04,
    z: 0,
  }
);
restPropOnSupport(pickaxe, startStall.top);
enableDynamicProp(pickaxe, { sleeping: true });
registerPickupItem(pickaxe, "pickaxe", "E : 곡괭이 줍기");

const safetyHelmet = makeSafetyHelmet(
  START_X - 1.15,
  START_Z - 2.62,
  START_FLAT_Y,
  {
    x: 0,
    y: Math.PI * -0.12,
    z: Math.PI * 0.02,
  }
);
restPropOnSupport(safetyHelmet, startStall.top);
enableDynamicProp(safetyHelmet, { sleeping: true });
registerPickupItem(safetyHelmet, "safetyHelmet", "E : 안전모 줍기");

const airCanLeft = buildFreshAirCanisterModel();
airCanLeft.position.set(START_X - 0.18, START_FLAT_Y, START_Z - 2.88);
airCanLeft.rotation.set(0, Math.PI * 0.12, 0.08);
scene.add(airCanLeft);
restPropOnSupport(airCanLeft, startStall.top);
enableDynamicProp(airCanLeft, { sleeping: true });
registerPickupItem(airCanLeft, "freshAirCanister", "E : 신선한 공기 캔 줍기");

const airCanRight = buildFreshAirCanisterModel();
airCanRight.position.set(START_X - 0.52, START_FLAT_Y, START_Z - 2.42);
airCanRight.rotation.set(0, Math.PI * -0.08, -0.05);
scene.add(airCanRight);
restPropOnSupport(airCanRight, startStall.top);
enableDynamicProp(airCanRight, { sleeping: true });
registerPickupItem(airCanRight, "freshAirCanister", "E : 신선한 공기 캔 줍기");

const tutorialNpc = makeTutorialNpc(
  START_X,
  START_Z - 5.15,
  0
);

forgeStation = buildForgeAnvil(START_X - 3.0, START_Z + 1.55);
refineryStation = buildRefineryStation(
  forgeStation.position.x + 0.35,
  forgeStation.position.z + 3.65,
  START_FLAT_Y,
  Math.PI
);
buildNftExhibitBoard(forgeStation.position.x - 2.85, forgeStation.position.z - 2.45, Math.PI * 0.5);

const signStartX = START_X + 3.9;
const signStartZ = START_Z + 0.8;
const signGap = 2.25;
const signTexts = [
  "곡괭이 안전모 착용 필수!!!",
  "E키를 눌러 안전모와 곡괭이를 획득하세요",
  "I키를 눌러 인벤토리를 열고 클릭으로 아이템을 착용하세요",
];

for (let i = 0; i < signTexts.length; i++) {
  makeSign(signStartX, signStartZ + signGap * i, signTexts[i], -Math.PI / 2);
}

mineGate = buildTravelGate(START_X, START_Z - 51.2, Math.PI, "폐광 입구");
mineGate.userData.mapId = "광산맵";
registerWalkableSurface("광산맵", mineGate.userData.walkSurface, 0.45);
buildCampTestArea();
buildCavePollutionField();
spawnCaveMasonryRocks();
campGate = buildTravelGate(CAMP_MAP_X, CAMP_MAP_Z + GROUND_SIZE * 0.5 + 1.25, 0, "광산 복귀");
campGate.userData.mapId = "폐광맵";
registerWalkableSurface("폐광맵", campGate.userData.walkSurface, 0.45);
buildMapConnectorTunnel(mineGate, campGate);
buildFrontierArea();
frontierCampGate = buildTravelGate(
  CAMP_MAP_X,
  CAMP_MAP_Z - GROUND_SIZE * 0.5 - 1.25,
  Math.PI,
  "개척지 입구"
);
frontierCampGate.userData.mapId = "폐광맵";
registerWalkableSurface("폐광맵", frontierCampGate.userData.walkSurface, 0.45);
frontierGate = buildTravelGate(
  FRONTIER_MAP_X,
  FRONTIER_MAP_Z + FRONTIER_GROUND_SIZE * 0.5 + 1.25,
  0,
  "폐광 복귀"
);
frontierGate.userData.mapId = "개척지";
registerWalkableSurface("개척지", frontierGate.userData.walkSurface, 0.45);
buildMapConnectorTunnel(frontierCampGate, frontierGate);

const abandonedMineGate = registerMapGate({
  mapId: "광산맵",
  targetMapId: "폐광맵",
  require: () => inventory.abandonedMineUnlocked,
  unlockWithItem: "abandonedMineKey",
  unlockFlag: "abandonedMineUnlocked",
  unlockText: "폐광 입구의 잠금이 해제되었습니다.",
  denyText: "감독관에게서 폐광 열쇠를 받아야 합니다.",
  trigger: {
    x: mineGate.position.x,
    z: mineGate.position.z + 0.95,
    width: 10.6,
    depth: 2.4,
  },
  hint: "북쪽 갱도로 들어가면 폐광맵으로 이어집니다",
});

const mineGateFence = buildTunnelFence(
  mineGate.position.x,
  mineGate.position.z + 0.95,
  10.2,
  0
);
abandonedMineGate.lockBlocker = mineGateFence;
abandonedMineGate.lockColliderIndex = addCollider(mineGateFence, 1.0);

registerMapGate({
  mapId: "폐광맵",
  targetMapId: "개척지",
  trigger: {
    x: frontierCampGate.position.x,
    z: frontierCampGate.position.z - 1.2,
    width: 10.6,
    depth: 2.6,
  },
  hint: "북쪽 통로를 지나면 개척지로 이어집니다",
});

registerMapGate({
  mapId: "개척지",
  targetMapId: "폐광맵",
  trigger: {
    x: frontierGate.position.x,
    z: frontierGate.position.z + 1.2,
    width: 10.6,
    depth: 2.6,
  },
  hint: "남쪽 통로를 지나면 폐광으로 돌아갑니다",
});

function applyDevPreset() {
  if (!DEV_PRESET_ENABLED) return;

  for (let i = 0; i < inventory.slots.length; i++) {
    inventory.slots[i] = null;
  }

  inventory.pickaxeLevel = Math.max(0, Math.min(DEV_PRESET.pickaxeLevel ?? 0, PICKAXE_UPGRADE_LEVELS.length - 1));
  inventory.mineKeyIssued = Boolean(DEV_PRESET.unlockAbandonedMine);
  inventory.abandonedMineUnlocked = Boolean(DEV_PRESET.unlockAbandonedMine);
  for (const key of QUICK_USE_ALLOWED_KEYS) inventory.quickUse[key] = null;
  inventory.equipped.head = null;
  inventory.equipped.body = null;
  inventory.equipped.shoes = null;
  inventory.equipped.tool = null;

  tutorialQuest.minedRockCount = DEV_PRESET.completeTutorial ? 1 : 0;
  tutorialQuest.upgradeCount = DEV_PRESET.completeTutorial ? 3 : 0;
  tutorialQuest.archivedSteps = [];
  tutorialQuest.currentStep = DEV_PRESET.completeTutorial ? tutorialQuest.steps.length : 0;
  tutorialQuest.completed = Boolean(DEV_PRESET.completeTutorial);

  if (DEV_PRESET.giveStarterGear) {
    addItem("pickaxe", 1);
    addItem("safetyHelmet", 1);
    equipFirstOwnedInventoryItem("tool", "pickaxe");
    equipFirstOwnedInventoryItem("head", "safetyHelmet");
  }

  addItem("freshAirCanister", 2);
  for (const itemId of getDevMaterialItemIds()) {
    addItem(itemId, INVENTORY_STACK_LIMIT);
  }
  for (const label of FRONTIER_PARCEL_LABELS) {
    const permitId = getFrontierParcelAuthorityItemId(label);
    if (permitId) addItem(permitId, 1);
  }
  addItem("mansionOneRoom101Permit", 1);

  playerAirCurrent = AIR_GAUGE_MAX;
  playerAirMax = AIR_GAUGE_MAX;
  setMapPurificationValue("폐광맵", 0);

  for (const nftEntry of DEV_MOCK_NFT_ITEMS) {
    addInventoryEntry(nftEntry);
  }

  if (inventory.mineKeyIssued) {
    addItem("abandonedMineKey", 1);
  }
  if (inventory.abandonedMineUnlocked) {
    const gateColliderIndex = getTrackedColliderIndex(
      abandonedMineGate.lockBlocker,
      abandonedMineGate.lockColliderIndex
    );
    if (typeof gateColliderIndex === "number") {
      removeColliderAt(gateColliderIndex);
      abandonedMineGate.lockColliderIndex = null;
    }
    if (abandonedMineGate.lockBlocker?.parent) {
      abandonedMineGate.lockBlocker.removeFromParent();
    }
  }

  currentMapId = DEV_PRESET.startMapId ?? "광산맵";
  updateSceneFogForCurrentMap();
  const startSpawn = currentMapId === "폐광맵"
    ? {
        x: campGate.position.x,
        z: campGate.position.z - 2.45,
        rotationY: Math.PI,
      }
    : {
        x: START_X,
        z: START_Z,
        rotationY: 0,
      };

  player.position.set(startSpawn.x, player.position.y, startSpawn.z);
  player.rotation.y = startSpawn.rotationY;
  latestMoveDir.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  snapCameraToPlayer();
  updateInventoryUI();
}

function applyFreshPlayerStartState() {
  nftExhibitSelectedItem = null;
  for (let i = 0; i < inventory.slots.length; i++) {
    inventory.slots[i] = null;
  }
  for (let i = 0; i < personalStorage.slots.length; i++) {
    personalStorage.slots[i] = null;
  }

  inventory.pickaxeLevel = 1;
  inventory.mineKeyIssued = false;
  inventory.abandonedMineUnlocked = false;
  for (const key of QUICK_USE_ALLOWED_KEYS) inventory.quickUse[key] = null;
  inventory.equipped.head = null;
  inventory.equipped.body = null;
  inventory.equipped.shoes = null;
  inventory.equipped.tool = null;

  tutorialQuest.currentStep = 0;
  tutorialQuest.minedRockCount = 0;
  tutorialQuest.upgradeCount = 0;
  tutorialQuest.completed = false;
  tutorialQuest.archivedSteps = [];
  playerAirCurrent = AIR_GAUGE_MAX;
  playerAirMax = AIR_GAUGE_MAX;
  setMapPurificationValue("폐광맵", 0);

  restoreLockedMapGate(abandonedMineGate);

  currentMapId = "광산맵";
  updateSceneFogForCurrentMap();
  player.position.set(START_X, player.position.y, START_Z);
  player.rotation.y = 0;
  latestMoveDir.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  snapCameraToPlayer();
  setPersonalStorageOpen(false);
  updateInventoryUI();
  if (questOpen) renderQuestWindow();
}

function createDefaultPlayerSave() {
  return {
    version: PLAYER_SAVE_VERSION,
    mapId: "광산맵",
    position: {
      x: START_X,
      y: player.position.y,
      z: START_Z,
    },
    rotationY: 0,
    inventory: {
      slots: Array.from({ length: inventory.slots.length }, () => null),
      pickaxeLevel: 1,
      mineKeyIssued: false,
      abandonedMineUnlocked: false,
      quickUse: {
        "1": null,
        "2": null,
        "3": null,
        "4": null,
        "5": null,
      },
      equipped: {
        head: null,
        body: null,
        shoes: null,
        tool: null,
      },
    },
    tutorial: {
      currentStep: 0,
      minedRockCount: 0,
      upgradeCount: 0,
      completed: false,
      archivedSteps: [],
    },
    airSystem: {
      current: AIR_GAUGE_MAX,
      max: AIR_GAUGE_MAX,
      mapPurification: {
        "폐광맵": 0,
        "개척지": 0,
      },
    },
    personalStorage: {
      slots: Array.from({ length: personalStorage.slots.length }, () => null),
    },
    frontierBuild: createDefaultFrontierBuildState(),
    displayBoard: null,
  };
}

function serializePlayerSave() {
  return {
    version: PLAYER_SAVE_VERSION,
    mapId: currentMapId,
    position: {
      x: Number(player.position.x.toFixed(3)),
      y: Number(player.position.y.toFixed(3)),
      z: Number(player.position.z.toFixed(3)),
    },
    rotationY: Number(player.rotation.y.toFixed(4)),
    inventory: {
      slots: inventory.slots.map((slot) => (slot ? structuredClone(slot) : null)),
      pickaxeLevel: inventory.pickaxeLevel,
      mineKeyIssued: inventory.mineKeyIssued,
      abandonedMineUnlocked: inventory.abandonedMineUnlocked,
      quickUse: Object.fromEntries(
        QUICK_USE_ALLOWED_KEYS.map((key) => [
          key,
          inventory.quickUse[key] ? structuredClone(inventory.quickUse[key]) : null,
        ])
      ),
      equipped: {
        head: inventory.equipped.head ? structuredClone(inventory.equipped.head) : null,
        body: inventory.equipped.body ? structuredClone(inventory.equipped.body) : null,
        shoes: inventory.equipped.shoes ? structuredClone(inventory.equipped.shoes) : null,
        tool: inventory.equipped.tool ? structuredClone(inventory.equipped.tool) : null,
      },
    },
    tutorial: {
      currentStep: tutorialQuest.currentStep,
      minedRockCount: tutorialQuest.minedRockCount,
      upgradeCount: tutorialQuest.upgradeCount,
      completed: tutorialQuest.completed,
      archivedSteps: [...tutorialQuest.archivedSteps],
    },
    airSystem: {
      current: Number(playerAirCurrent.toFixed(2)),
      max: playerAirMax,
      mapPurification: {
        "폐광맵": getMapPurificationValue("폐광맵"),
        "개척지": getMapPurificationValue("개척지"),
      },
    },
    personalStorage: {
      slots: personalStorage.slots.map((slot) => (slot ? structuredClone(slot) : null)),
    },
    frontierBuild: structuredClone(frontierBuildState),
    displayBoard: nftExhibitSelectedItem ? structuredClone(nftExhibitSelectedItem) : null,
  };
}

function applySerializedPlayerSave(rawSave, { preserveSharedWorld = false } = {}) {
  const save = rawSave && typeof rawSave === "object" ? rawSave : createDefaultPlayerSave();
  const source = {
    ...createDefaultPlayerSave(),
    ...save,
    inventory: {
      ...createDefaultPlayerSave().inventory,
      ...(save.inventory ?? {}),
      quickUse: {
        ...createDefaultPlayerSave().inventory.quickUse,
        ...(save.inventory?.quickUse ?? {}),
      },
      equipped: {
        ...createDefaultPlayerSave().inventory.equipped,
        ...(save.inventory?.equipped ?? {}),
      },
    },
    tutorial: {
      ...createDefaultPlayerSave().tutorial,
      ...(save.tutorial ?? {}),
    },
    airSystem: {
      ...createDefaultPlayerSave().airSystem,
      ...(save.airSystem ?? {}),
      mapPurification: {
        ...createDefaultPlayerSave().airSystem.mapPurification,
        ...(save.airSystem?.mapPurification ?? {}),
      },
    },
    personalStorage: {
      ...createDefaultPlayerSave().personalStorage,
      ...(save.personalStorage ?? {}),
    },
    frontierBuild: preserveSharedWorld
      ? normalizeFrontierBuildState(frontierBuildState)
      : normalizeFrontierBuildState(save.frontierBuild),
    displayBoard: save.displayBoard ?? null,
  };

  for (let i = 0; i < inventory.slots.length; i++) {
    const slot = source.inventory.slots[i] ?? null;
    inventory.slots[i] = normalizeInventorySlotEntry(slot);
  }

  inventory.pickaxeLevel = Math.max(
    0,
    Math.min(source.inventory.pickaxeLevel ?? 0, PICKAXE_UPGRADE_LEVELS.length - 1)
  );
  inventory.mineKeyIssued = Boolean(source.inventory.mineKeyIssued);
  inventory.abandonedMineUnlocked = Boolean(source.inventory.abandonedMineUnlocked);
  for (const key of QUICK_USE_ALLOWED_KEYS) {
    inventory.quickUse[key] = normalizeQuickUseBinding(source.inventory.quickUse[key]);
  }
  inventory.equipped.head = normalizeEquippedItemRef(source.inventory.equipped.head);
  inventory.equipped.body = normalizeEquippedItemRef(source.inventory.equipped.body);
  inventory.equipped.shoes = normalizeEquippedItemRef(source.inventory.equipped.shoes);
  inventory.equipped.tool = normalizeEquippedItemRef(source.inventory.equipped.tool);
  pruneQuickUseBindings();

  tutorialQuest.currentStep = Math.max(0, Math.min(source.tutorial.currentStep ?? 0, tutorialQuest.steps.length));
  tutorialQuest.minedRockCount = Math.max(0, source.tutorial.minedRockCount ?? 0);
  tutorialQuest.upgradeCount = Math.max(0, source.tutorial.upgradeCount ?? 0);
  tutorialQuest.completed = Boolean(source.tutorial.completed);
  tutorialQuest.archivedSteps = Array.isArray(source.tutorial.archivedSteps)
    ? [...source.tutorial.archivedSteps]
    : [];
  playerAirMax = Math.max(1, Number(source.airSystem.max) || AIR_GAUGE_MAX);
  playerAirCurrent = Math.max(0, Math.min(playerAirMax, Number(source.airSystem.current) || AIR_GAUGE_MAX));
  setMapPurificationValue("폐광맵", Number(source.airSystem.mapPurification?.["폐광맵"]) || 0);
  setMapPurificationValue("개척지", Number(source.airSystem.mapPurification?.["개척지"]) || 0);
  for (let i = 0; i < personalStorage.slots.length; i += 1) {
    const slot = source.personalStorage.slots?.[i] ?? null;
    personalStorage.slots[i] = normalizeInventorySlotEntry(slot);
  }
  if (!preserveSharedWorld) {
    frontierBuildState = normalizeFrontierBuildState(source.frontierBuild);
  }
  nftExhibitSelectedItem = normalizeNftBoardSelection(source.displayBoard);

  if (inventory.abandonedMineUnlocked) {
    const gateColliderIndex = getTrackedColliderIndex(
      abandonedMineGate.lockBlocker,
      abandonedMineGate.lockColliderIndex
    );
    if (typeof gateColliderIndex === "number") {
      removeColliderAt(gateColliderIndex);
      abandonedMineGate.lockColliderIndex = null;
    }
    if (abandonedMineGate.lockBlocker?.parent) {
      abandonedMineGate.lockBlocker.removeFromParent();
    }
  } else {
    restoreLockedMapGate(abandonedMineGate);
  }

  currentMapId = ["광산맵", "폐광맵", "개척지"].includes(source.mapId) ? source.mapId : "광산맵";
  updateSceneFogForCurrentMap();
  player.position.set(
    Number.isFinite(source.position?.x) ? source.position.x : START_X,
    Number.isFinite(source.position?.y) ? source.position.y : player.position.y,
    Number.isFinite(source.position?.z) ? source.position.z : START_Z
  );
  player.rotation.y = Number.isFinite(source.rotationY) ? source.rotationY : 0;
  latestMoveDir.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  snapCameraToPlayer();
  updateInventoryUI();
  rebuildAllFrontierConstructionVisuals();
  scheduleNftExhibitBoardRefresh();
  refreshQuestProgress();
  if (questOpen) renderQuestWindow();
  lastPlayerSaveSnapshot = JSON.stringify(serializePlayerSave());
}

async function hydratePlayerSaveFromServer() {
  if (!isServerBackedWalletSession()) return false;

  setPlayerSaveStatus("저장 불러오는 중...", "saving", { persist: true });
  const saveResponse = await apiFetchJson("/auth/save", {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!saveResponse.ok) {
    blockPlayerSaveBaseline(`저장 데이터 확인 실패: ${saveResponse.error}`);
    return false;
  }

  const serverSaveEntry = saveResponse.data.save ?? null;
  const serverSave = serverSaveEntry?.data ?? null;
  if (!serverSave) {
    lastKnownPlayerSaveUpdatedAt = "";
    lastPlayerSaveSnapshot = JSON.stringify(serializePlayerSave());
    markPlayerSaveBaselineReady("fresh");
    setPlayerSaveStatus("새로운 저장 데이터", "success");
    return false;
  }

  applySerializedPlayerSave(serverSave);
  lastKnownPlayerSaveUpdatedAt = serverSaveEntry.updatedAt ?? "";
  markPlayerSaveBaselineReady("hydrated");
  walletLoginStatus.textContent = "이전 플레이 기록을 불러왔습니다.";
  setPlayerSaveStatus("저장 불러오기 완료", "success");
  return true;
}

async function pushPlayerSaveToServer() {
  if (!isServerBackedWalletSession()) return false;
  if (!hasConfirmedPlayerSaveBaseline()) {
    setPlayerSaveStatus("세이브 기준선 확인 전이라 저장 대기 중", "error");
    return false;
  }
  const snapshot = JSON.stringify(serializePlayerSave());
  if (snapshot === lastPlayerSaveSnapshot) return true;

  setPlayerSaveStatus("저장 중...", "saving", { persist: true });

  const response = await apiFetchJson("/auth/save", {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      save: JSON.parse(snapshot),
      knownUpdatedAt: lastKnownPlayerSaveUpdatedAt,
    }),
  });
  if (!response.ok) {
    if (response.status === 409 && response.data?.save?.data) {
      applySerializedPlayerSave(response.data.save.data);
      lastKnownPlayerSaveUpdatedAt = response.data.save.updatedAt ?? "";
      walletLoginStatus.textContent = "다른 탭의 더 최신 저장 기록을 불러왔습니다.";
      setPlayerSaveStatus("다른 창의 최신 저장으로 동기화됨", "error");
      return false;
    }
    setPlayerSaveStatus("저장 실패", "error");
    return false;
  }
  lastPlayerSaveSnapshot = snapshot;
  lastKnownPlayerSaveUpdatedAt = response.data.save?.updatedAt ?? lastKnownPlayerSaveUpdatedAt;
  setPlayerSaveStatus("저장됨", "success");
  return true;
}

function flushPlayerSaveOnExit() {
  if (isDevSession()) {
    saveActiveLocalProfileState();
    saveSharedWorldStateToLocal();
    return;
  }
  if (!isServerBackedWalletSession()) return;
  if (playerSaveSyncPaused || !hasConfirmedPlayerSaveBaseline()) return;

  const snapshot = JSON.stringify(serializePlayerSave());
  if (snapshot === lastPlayerSaveSnapshot) return;

  try {
    fetch(`${AUTH_API_BASE_URL}/auth/save`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${walletAuth.token}`,
      },
      body: JSON.stringify({
        save: JSON.parse(snapshot),
        knownUpdatedAt: lastKnownPlayerSaveUpdatedAt,
      }),
      keepalive: true,
    });
    lastPlayerSaveSnapshot = snapshot;
  } catch {}
}

function schedulePlayerSaveSync(force = false) {
  if (isDevSession()) {
    saveActiveLocalProfileState();
    saveSharedWorldStateToLocal();
    return;
  }
  if (!isServerBackedWalletSession()) return;
  if (playerSaveSyncPaused || !hasConfirmedPlayerSaveBaseline()) return;
  const now = performance.now();
  if (!force && now - lastPlayerSaveAttemptAt < PLAYER_SAVE_INTERVAL_MS) return;
  if (playerSaveSyncInFlight) return;

  lastPlayerSaveAttemptAt = now;
  playerSaveSyncInFlight = pushPlayerSaveToServer().finally(() => {
    playerSaveSyncInFlight = null;
  });
}

applyDevPreset();


function makeSign(x, z, text, rotationY = 0) {
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

  const signCollider = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 1.75, 0.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  signCollider.position.set(0, 0.88, 0);

  g.add(pole, board, signCollider);
  g.position.set(x, 0, z);
  g.rotation.y = rotationY;
  scene.add(g);
  g.userData.colliderIndex = addCollider(signCollider, 1.0);
  console.log("SIGN CREATED:", text, "pos=", g.position.x, g.position.z);

  // 상호작용 대상 등록(텍스트 포함)
  interactables.push({ obj: g, text, board });
  return g;
}

function makeTutorialNpc(x, z, rotationY = 0) {
  const g = new THREE.Group();

  const clothMat = new THREE.MeshStandardMaterial({ color: 0x7b6a58, roughness: 0.95 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0efe9, roughness: 0.92 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x324d73, roughness: 0.88 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.05, 0.42), clothMat);
  torso.position.y = 1.2;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), skinMat);
  head.scale.set(0.95, 1.08, 0.95);
  head.position.y = 1.95;
  g.add(head);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.18), clothMat);
  leftArm.position.set(-0.48, 1.15, 0);
  g.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x *= -1;
  g.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 0.22), accentMat);
  leftLeg.position.set(-0.16, 0.45, 0);
  g.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x *= -1;
  g.add(rightLeg);

  const npcCollider = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 2.15, 0.95),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  npcCollider.position.set(0, 1.08, 0);
  g.add(npcCollider);

  const hardHat = buildSafetyHelmetModel();
  hardHat.scale.setScalar(0.78);
  hardHat.rotation.y = Math.PI * 0.04;
  head.add(hardHat);
  alignWearableOnHead(head, hardHat, {
    verticalInset: 0.38,
    forwardBias: 0.06,
  });

  g.position.set(x, START_FLAT_Y, z);
  g.rotation.y = rotationY;
  scene.add(g);
  g.userData.colliderIndex = addCollider(npcCollider, 1.0);
  registerTutorialNpc(g, "작업 감독관");
  return g;
}

function buildForgeAnvil(x, z) {
  const g = new THREE.Group();

  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.55, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x67584a, roughness: 1.0 })
  );
  stand.position.y = 0.28;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.24, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x4d5661, roughness: 0.9 })
  );
  body.position.y = 0.78;

  const horn = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.18, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x59636f, roughness: 0.85 })
  );
  horn.position.set(0.54, 0.81, 0);
  horn.scale.set(1.2, 1, 0.7);

  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x717a87, roughness: 0.82 })
  );
  topPlate.position.set(-0.1, 0.94, 0);

  g.add(stand, body, horn, topPlate);
  g.position.set(x, START_FLAT_Y, z);
  scene.add(g);
  addCollider(g, 0.95);
  return g;
}

function buildNftExhibitBoard(x, z, rotationY = Math.PI * 0.5) {
  const g = new THREE.Group();
  const boardWidth = 4.02;
  const boardHeight = 3.52;
  const boardHalfWidth = boardWidth * 0.5;
  const frameThickness = 0.12;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x2d3138,
    roughness: 0.55,
    metalness: 0.45,
  });
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.92,
    metalness: 0.03,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1d1f24,
    roughness: 0.72,
    metalness: 0.25,
  });

  const leftPost = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 3.55, 0.12),
    frameMat
  );
  leftPost.position.set(-boardHalfWidth - 0.12, 1.78, -0.12);
  g.add(leftPost);

  const rightPost = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 3.55, 0.12),
    frameMat
  );
  rightPost.position.set(boardHalfWidth + 0.12, 1.78, -0.12);
  g.add(rightPost);

  const bottomBeam = new THREE.Mesh(
    new THREE.BoxGeometry(boardWidth + 0.18, 0.1, 0.1),
    frameMat
  );
  bottomBeam.position.set(0, 0.42, -0.12);
  g.add(bottomBeam);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(boardWidth + frameThickness, boardHeight + frameThickness, 0.08),
    frameMat
  );
  frame.position.set(0, 2.66, -0.02);
  g.add(frame);

  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(boardWidth, boardHeight, 0.04),
    panelMat
  );
  backPanel.position.set(0, 2.66, 0.03);
  g.add(backPanel);

  const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(boardWidth - 0.16, boardHeight - 0.16),
    screenMat
  );
  screen.position.set(0, 2.66, 0.055);
  g.add(screen);

  const leftFoot = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.08, 0.18),
    frameMat
  );
  leftFoot.position.set(-boardHalfWidth + 0.42, 0.08, -0.12);
  g.add(leftFoot);

  const rightFoot = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.08, 0.18),
    frameMat
  );
  rightFoot.position.set(boardHalfWidth - 0.42, 0.08, -0.12);
  g.add(rightFoot);

  const wheelOffsets = [
    [-boardHalfWidth - 0.08, 0.02, -0.08],
    [-boardHalfWidth + 0.78, 0.02, 0.08],
    [boardHalfWidth - 0.78, 0.02, -0.08],
    [boardHalfWidth + 0.08, 0.02, 0.08],
  ];
  for (const [wx, wy, wz] of wheelOffsets) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16),
      wheelMat
    );
    wheel.rotation.z = Math.PI * 0.5;
    wheel.position.set(wx, wy, wz);
    g.add(wheel);
  }

  g.position.set(x, START_FLAT_Y + 0.22, z);
  g.rotation.y = rotationY;
  scene.add(g);
  addCollider(g, 0.88);
  interactables.push({ obj: g, text: "E : NFT 전시", board: frame, type: "nftBoard" });

  nftExhibitBoard = g;
  nftExhibitScreenMaterial = screenMat;
  setNftBoardMessage(
    "지갑 NFT 전시",
    ["메타마스크 로그인 후", "작품을 불러옵니다."],
    "#9dbce0"
  );
  scheduleNftExhibitBoardRefresh();
  return g;
}

function buildAirPurifierStation(x, z, rotationY = Math.PI, mapId = "폐광맵") {
  const g = new THREE.Group();

  const bodyMat = registerCaveDarkMaterial(
    new THREE.MeshStandardMaterial({
      color: 0x45505b,
      roughness: 0.8,
      metalness: 0.18,
    }),
    0.2
  );
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x7ae2cb,
    emissive: 0x2ebf96,
    roughness: 0.38,
    metalness: 0.08,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x8398aa,
    roughness: 0.54,
    metalness: 0.12,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.1, 1.08), bodyMat);
  base.position.y = 0.56;
  g.add(base);

  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.08, 18), glowMat);
  chamber.position.set(0, 1.18, 0);
  g.add(chamber);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.72), accentMat);
  cap.position.set(0, 1.78, 0);
  g.add(cap);

  const pipeLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 12), accentMat);
  pipeLeft.rotation.z = Math.PI * 0.5;
  pipeLeft.position.set(-0.36, 1.16, 0);
  g.add(pipeLeft);

  const pipeRight = pipeLeft.clone();
  pipeRight.position.x *= -1;
  g.add(pipeRight);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.3, 0.05), glowMat);
  screen.position.set(0, 1.05, 0.57);
  g.add(screen);

  g.position.set(x, START_FLAT_Y, z);
  g.rotation.y = rotationY;
  scene.add(g);
  addCollider(g, 0.92);
  interactables.push({
    obj: g,
    text: "E : 공기 정화탑 가동",
    board: chamber,
    type: "airPurifier",
    purifierMapId: mapId,
  });
  return g;
}

function buildRefineryStation(x, z, y = START_FLAT_Y, rotationY = 0) {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x48515c,
    roughness: 0.72,
    metalness: 0.28,
  });
  const chamberMat = new THREE.MeshStandardMaterial({
    color: 0xa6ddc8,
    roughness: 0.38,
    metalness: 0.1,
    emissive: 0x3f9372,
    emissiveIntensity: 0.16,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xc7ced8,
    roughness: 0.28,
    metalness: 0.44,
  });
  const trayMat = new THREE.MeshStandardMaterial({
    color: 0x72543c,
    roughness: 0.84,
    metalness: 0.08,
  });
  const gaugeMat = new THREE.MeshStandardMaterial({
    color: 0xf0f2f5,
    roughness: 0.22,
    metalness: 0.06,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x2d3238,
    roughness: 0.88,
    metalness: 0.18,
  });

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.16, 1.16),
    frameMat
  );
  platform.position.y = 0.08;
  g.add(platform);

  const legOffsets = [
    [-0.76, 0.56, -0.42],
    [0.76, 0.56, -0.42],
    [-0.76, 0.56, 0.42],
    [0.76, 0.56, 0.42],
  ];
  for (const [lx, ly, lz] of legOffsets) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.96, 0.12),
      darkMat
    );
    leg.position.set(lx, ly, lz);
    g.add(leg);
  }

  const supportDeck = new THREE.Mesh(
    new THREE.BoxGeometry(1.58, 0.12, 0.88),
    frameMat
  );
  supportDeck.position.y = 0.64;
  g.add(supportDeck);

  const grinderCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.68, 0.6),
    frameMat
  );
  grinderCore.position.set(-0.22, 1.06, 0);
  g.add(grinderCore);

  const grinderHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.3, 0.4),
    accentMat
  );
  grinderHead.position.set(-0.22, 1.5, 0);
  g.add(grinderHead);

  const hopper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.34, 0.42, 22),
    accentMat
  );
  hopper.position.set(-0.22, 1.86, 0);
  g.add(hopper);

  const chamber = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.84, 20),
    chamberMat
  );
  chamber.position.set(0.56, 1.18, 0);
  g.add(chamber);

  const chamberCapTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.14, 18),
    accentMat
  );
  chamberCapTop.position.set(0.56, 1.66, 0);
  g.add(chamberCapTop);

  const chamberCapBottom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.19, 0.14, 18),
    accentMat
  );
  chamberCapBottom.position.set(0.56, 0.7, 0);
  g.add(chamberCapBottom);

  const conduit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.96, 14),
    accentMat
  );
  conduit.rotation.z = Math.PI * 0.5;
  conduit.position.set(0.17, 1.26, 0);
  g.add(conduit);

  const dischargeTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.065, 0.54, 14),
    accentMat
  );
  dischargeTube.rotation.z = Math.PI * 0.34;
  dischargeTube.position.set(0.84, 0.82, 0);
  g.add(dischargeTube);

  const dischargeTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.08, 0.34),
    trayMat
  );
  dischargeTray.position.set(0.98, 0.5, 0);
  g.add(dischargeTray);

  const powderJar = buildPurifyPowderModel();
  powderJar.scale.setScalar(0.9);
  powderJar.position.set(0.95, 0.62, 0.12);
  g.add(powderJar);

  const gaugeBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.04, 20),
    gaugeMat
  );
  gaugeBody.rotation.x = Math.PI * 0.5;
  gaugeBody.position.set(-0.63, 1.08, 0.34);
  g.add(gaugeBody);

  const gaugeNeedle = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.01, 0.018),
    darkMat
  );
  gaugeNeedle.rotation.z = -0.58;
  gaugeNeedle.position.set(-0.61, 1.08, 0.37);
  g.add(gaugeNeedle);

  const leverBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.05, 0.08, 16),
    darkMat
  );
  leverBase.position.set(-0.72, 0.82, -0.32);
  g.add(leverBase);

  const leverHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.34, 12),
    accentMat
  );
  leverHandle.rotation.z = Math.PI * -0.22;
  leverHandle.position.set(-0.78, 1.02, -0.32);
  g.add(leverHandle);

  const intakeLabel = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.08, 0.02),
    gaugeMat
  );
  intakeLabel.position.set(-0.22, 2.12, 0);
  g.add(intakeLabel);

  const collider = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 2.26, 1.1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  collider.position.set(0.1, 1.13, 0);
  g.add(collider);

  g.position.set(x, y, z);
  g.rotation.y = rotationY;
  scene.add(g);
  addCollider(collider, 1.0);
  interactables.push({
    obj: g,
    text: "E : 재련소 사용",
    board: grinderCore,
    highlightKind: "none",
    type: "refinery",
  });
  return g;
}

function buildTunnelFence(x, z, width, rotationY = 0) {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6f5138,
    roughness: 0.98,
  });

  const railThickness = 0.2;
  const postSize = 0.24;
  const postHeight = 1.7;
  const railInset = 0.28;

  const topRail = new THREE.Mesh(
    new THREE.BoxGeometry(width, railThickness, railThickness),
    woodMat
  );
  topRail.position.set(0, 1.38, 0);
  g.add(topRail);

  const midRail = new THREE.Mesh(
    new THREE.BoxGeometry(width, railThickness, railThickness),
    woodMat
  );
  midRail.position.set(0, 0.8, 0);
  g.add(midRail);

  const postCount = 6;
  for (let i = 0; i < postCount; i += 1) {
    const t = postCount === 1 ? 0.5 : i / (postCount - 1);
    const px = THREE.MathUtils.lerp(-width * 0.5 + railInset, width * 0.5 - railInset, t);
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(postSize, postHeight, postSize),
      woodMat
    );
    post.position.set(px, postHeight * 0.5, 0);
    g.add(post);
  }

  const braceOffsets = [-width * 0.28, 0, width * 0.28];
  for (const bx of braceOffsets) {
    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.35, 0.18),
      woodMat
    );
    brace.position.set(bx, 0.72, 0);
    brace.rotation.z = bx < 0 ? Math.PI * 0.18 : bx > 0 ? -Math.PI * 0.18 : 0;
    g.add(brace);
  }

  g.position.set(x, START_FLAT_Y, z);
  g.rotation.y = rotationY;
  scene.add(g);
  return g;
}

function buildMinePerimeterCliffs() {
  const half = GROUND_SIZE * 0.5;
  const cliffMat = new THREE.MeshStandardMaterial({
    color: 0x6d5e4f,
    roughness: 0.98,
  });
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x726b65,
    roughness: 1.0,
  });

  const segments = [
    { x: 0, z: half + 2.3, sx: 108, sy: 6.4, sz: 6.2, rx: 0, rz: 0 },
    { x: -half - 2.2, z: 0, sx: 6.0, sy: 6.8, sz: 108, rx: 0, rz: 0 },
    { x: half + 2.2, z: 0, sx: 6.0, sy: 6.2, sz: 108, rx: 0, rz: 0 },
    { x: -half * 0.52, z: -half - 2.1, sx: 39, sy: 6.2, sz: 5.8, rx: 0, rz: 0 },
    { x: half * 0.52, z: -half - 2.1, sx: 39, sy: 6.6, sz: 5.8, rx: 0, rz: 0 },
    { x: -half - 1.4, z: -half - 1.5, sx: 10.0, sy: 6.4, sz: 10.0, rx: 0, rz: 0 },
  ];

  function createBermGeometry(bottomX, bottomZ, topX, topZ, height) {
    const bx = bottomX * 0.5;
    const bz = bottomZ * 0.5;
    const tx = topX * 0.5;
    const tz = topZ * 0.5;
    const y0 = -height * 0.5;
    const y1 = height * 0.5;
    const vertices = [
      -bx, y0, -bz,
       bx, y0, -bz,
       bx, y0,  bz,
      -bx, y0,  bz,
      -tx, y1, -tz,
       tx, y1, -tz,
       tx, y1,  tz,
      -tx, y1,  tz,
    ];
    const indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  for (const seg of segments) {
    const topX = Math.max(seg.sx * 0.78, seg.sx - 2.4);
    const topZ = Math.max(seg.sz * 0.46, seg.sz - 3.6);
    const berm = new THREE.Mesh(
      createBermGeometry(seg.sx, seg.sz, topX, topZ, seg.sy),
      cliffMat
    );
    berm.position.set(START_X + seg.x, seg.sy * 0.5 - 0.35, START_Z + seg.z);
    berm.rotation.set(seg.rx, 0, seg.rz);
    scene.add(berm);
    addCollider(berm, 1.0);
  }

  const rockDefs = [
    { x: -41, z: -50.6, sx: 8.4, sy: 6.8, sz: 6.6, ry: 0.28 },
    { x: -27, z: -51.0, sx: 7.4, sy: 5.4, sz: 5.8, ry: -0.18 },
    { x: 29, z: -50.9, sx: 7.8, sy: 5.8, sz: 6.0, ry: 0.22 },
    { x: 42, z: -50.4, sx: 8.8, sy: 6.5, sz: 6.8, ry: -0.25 },
    { x: -52.0, z: -30, sx: 6.2, sy: 5.2, sz: 8.2, ry: 0.16 },
    { x: -52.2, z: 18, sx: 7.4, sy: 5.8, sz: 9.2, ry: -0.22 },
    { x: 52.1, z: -16, sx: 7.1, sy: 5.2, sz: 8.8, ry: 0.2 },
    { x: 52.4, z: 28, sx: 8.2, sy: 6.0, sz: 9.6, ry: -0.18 },
    { x: -34, z: 51.2, sx: 7.8, sy: 5.8, sz: 5.6, ry: 0.14 },
    { x: 33, z: 51.0, sx: 8.0, sy: 6.2, sz: 5.8, ry: -0.15 },
  ];

  for (const rock of rockDefs) {
    const chunk = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      rockMat
    );
    chunk.scale.set(rock.sx, rock.sy, rock.sz);
    chunk.position.set(START_X + rock.x, rock.sy * 0.5 + 0.5, START_Z + rock.z);
    chunk.rotation.set(
      THREE.MathUtils.degToRad(rock.x * 0.6),
      rock.ry,
      THREE.MathUtils.degToRad(rock.z * 0.35)
    );
    scene.add(chunk);

    const colliderMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const colliderLayers = [
      {
        sx: rock.sx * 0.72,
        sy: Math.max(2.2, rock.sy * 0.42),
        sz: rock.sz * 0.72,
        y: Math.max(1.2, rock.sy * 0.22 + 0.35),
      },
      {
        sx: rock.sx * 0.54,
        sy: Math.max(1.4, rock.sy * 0.24),
        sz: rock.sz * 0.54,
        y: Math.max(2.35, rock.sy * 0.5 + 0.15),
      },
      {
        sx: rock.sx * 0.34,
        sy: Math.max(1.0, rock.sy * 0.16),
        sz: rock.sz * 0.34,
        y: Math.max(3.25, rock.sy * 0.73 + 0.12),
      },
    ];

    for (const layer of colliderLayers) {
      const rockCollider = new THREE.Mesh(
        new THREE.BoxGeometry(layer.sx, layer.sy, layer.sz),
        colliderMat
      );
      rockCollider.position.set(
        chunk.position.x,
        layer.y,
        chunk.position.z
      );
      rockCollider.rotation.y = chunk.rotation.y;
      scene.add(rockCollider);
      addCollider(rockCollider, 1.0);
    }
  }
}

function buildTravelGate(x, z, rotationY = 0, label = "") {
  const g = new THREE.Group();

  const floorPlate = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.12, 2.1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  floorPlate.position.set(0, 0.06, -0.28);
  g.add(floorPlate);
  g.userData.walkSurface = floorPlate;

  g.position.set(x, START_FLAT_Y, z);
  g.rotation.y = rotationY;
  scene.add(g);

  return g;
}

function buildCampTestArea() {
  const campSize = GROUND_SIZE;
  const pillarMat = registerCaveDarkMaterial(new THREE.MeshStandardMaterial({
    color: 0x4a4037,
    roughness: 1.0,
  }), 0.18);
  const wallMat = registerCaveDarkMaterial(new THREE.MeshStandardMaterial({
    color: 0x2d251f,
    roughness: 1.0,
  }), 0.14);
  const ceilingMat = registerCaveDarkMaterial(new THREE.MeshStandardMaterial({
    color: 0x211b17,
    roughness: 1.0,
    side: THREE.DoubleSide,
  }), 0.1);

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(campSize, 0.18, campSize),
    registerCaveDarkMaterial(new THREE.MeshStandardMaterial({
      color: 0x342a22,
      roughness: 0.98,
    }), 0.22)
  );
  pad.position.set(CAMP_MAP_X, 0.09, CAMP_MAP_Z);
  scene.add(pad);
  groundSurfaces.push(pad);
  registerWalkableSurface("폐광맵", pad, 0.45);

  const campHalf = campSize * 0.5;
  const wallThickness = 4.8;
  const wallHeight = 13.44;
  const southOpeningWidth = 18;
  const northOpeningWidth = 14;
  const wallBaseY = wallHeight * 0.5 - 0.55;

  const wallDefs = [
    { x: -(campSize - northOpeningWidth) * 0.25 - northOpeningWidth * 0.5, z: -campHalf - wallThickness * 0.22, sx: (campSize - northOpeningWidth) * 0.5 + 4, sy: wallHeight, sz: wallThickness, ry: 0.02 }, // north-west
    { x: (campSize - northOpeningWidth) * 0.25 + northOpeningWidth * 0.5, z: -campHalf - wallThickness * 0.22, sx: (campSize - northOpeningWidth) * 0.5 + 4, sy: wallHeight, sz: wallThickness, ry: 0.02 }, // north-east
    { x: -campHalf - wallThickness * 0.28, z: 0, sx: wallThickness, sy: wallHeight + 0.4, sz: campSize + 5, ry: -0.03 }, // west
    { x: campHalf + wallThickness * 0.28, z: 0, sx: wallThickness, sy: wallHeight - 0.2, sz: campSize + 7, ry: 0.025 }, // east
    { x: -(campSize - southOpeningWidth) * 0.25 - southOpeningWidth * 0.5, z: campHalf + wallThickness * 0.24, sx: (campSize - southOpeningWidth) * 0.5 + 4, sy: wallHeight - 0.3, sz: wallThickness, ry: -0.01 }, // south-west
    { x: (campSize - southOpeningWidth) * 0.25 + southOpeningWidth * 0.5, z: campHalf + wallThickness * 0.24, sx: (campSize - southOpeningWidth) * 0.5 + 4, sy: wallHeight + 0.2, sz: wallThickness, ry: 0.015 }, // south-east
  ];

  for (const wall of wallDefs) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wall.sx, wall.sy, wall.sz),
      wallMat
    );
    mesh.position.set(CAMP_MAP_X + wall.x, wallBaseY, CAMP_MAP_Z + wall.z);
    mesh.rotation.y = wall.ry;
    scene.add(mesh);
    addCollider(mesh, 1.0);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(wall.sx * 0.86, 1.4, wall.sz * 0.88),
      wallMat
    );
    cap.position.set(
      mesh.position.x + Math.sin(wall.ry) * 0.35,
      mesh.position.y + wall.sy * 0.5 - 0.15,
      mesh.position.z + Math.cos(wall.ry) * 0.25
    );
    cap.rotation.y = wall.ry * 1.2;
    scene.add(cap);
  }

  const pillarDefs = [
    { x: -28, z: -36, sx: 4.6, sz: 9.6, sy: 6.72, ry: 0.14 },
    { x: -8, z: -40, sx: 2.4, sz: 2.0, sy: 6.24, ry: -0.08 },
    { x: 20, z: -34, sx: 3.8, sz: 7.8, sy: 6.56, ry: 0.18 },
    { x: -18, z: -22, sx: 2.8, sz: 3.7, sy: 6.4, ry: -0.12 },
    { x: 12, z: -24, sx: 4.2, sz: 2.4, sy: 6.8, ry: 0.09 },
    { x: -34, z: -8, sx: 3.2, sz: 4.4, sy: 6.96, ry: 0.22 },
    { x: -4, z: -10, sx: 1.9, sz: 9.9, sy: 8.08, ry: -0.16 },
    { x: 28, z: -12, sx: 3.6, sz: 3.1, sy: 6.48, ry: 0.13 },
    { x: -20, z: 2, sx: 2.5, sz: 2.1, sy: 6.32, ry: -0.06 },
    { x: 10, z: 0, sx: 3.9, sz: 15.3, sy: 8.96, ry: 0.28 },
    { x: -32, z: 14, sx: 3.1, sz: 2.7, sy: 6.4, ry: 0.11 },
    { x: -2, z: 16, sx: 1.8, sz: 15.0, sy: 8.64, ry: -0.24 },
    { x: 24, z: 12, sx: 3.9, sz: 2.2, sy: 6.24, ry: 0.07 },
    { x: -16, z: 26, sx: 3.4, sz: 4.8, sy: 8.48, ry: -0.2 },
    { x: 14, z: 28, sx: 2.6, sz: 2.9, sy: 6.08, ry: 0.16 },
    { x: -30, z: 36, sx: 3.4, sz: 13.8, sy: 6.8, ry: 0.21 },
    { x: 2, z: 38, sx: 1.7, sz: 2.8, sy: 7.92, ry: -0.15 },
    { x: 30, z: 36, sx: 4.4, sz: 9.0, sy: 6.72, ry: 0.12 },
    { x: -12, z: 44, sx: 2.8, sz: 3.6, sy: 6.4, ry: -0.14 },
    { x: 18, z: 46, sx: 3.7, sz: 2.4, sy: 6.56, ry: 0.1 },
  ];

  const pillarMeshes = [];

  for (const pillar of pillarDefs) {
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(pillar.sx, pillar.sy, pillar.sz),
      pillarMat
    );
    column.position.set(CAMP_MAP_X + pillar.x, pillar.sy * 0.5, CAMP_MAP_Z + pillar.z);
    column.rotation.set(
      THREE.MathUtils.degToRad((pillar.x + pillar.z) * 0.08),
      pillar.ry,
      THREE.MathUtils.degToRad((pillar.x - pillar.z) * 0.05)
    );
    scene.add(column);
    addCollider(column, 0.96);
    pillarMeshes.push(column);
  }

  const ceilingSlabs = [
    { x: 0, z: -34, sx: 104, sy: 3.0, sz: 30, rx: 0.05, rz: -0.03, topY: 10.24 },
    { x: 0, z: -8, sx: 104, sy: 3.4, sz: 28, rx: -0.04, rz: 0.02, topY: 9.92 },
    { x: 0, z: 18, sx: 104, sy: 3.2, sz: 28, rx: 0.03, rz: -0.04, topY: 10.08 },
    { x: -18, z: 42, sx: 70, sy: 3.1, sz: 22, rx: -0.05, rz: 0.03, topY: 9.76 },
    { x: 22, z: 42, sx: 68, sy: 2.9, sz: 22, rx: 0.04, rz: -0.02, topY: 9.96 },
  ];

  function getCeilingBottomY(localX, localZ) {
    for (const slab of ceilingSlabs) {
      const halfX = slab.sx * 0.5;
      const halfZ = slab.sz * 0.5;
      if (
        localX >= slab.x - halfX &&
        localX <= slab.x + halfX &&
        localZ >= slab.z - halfZ &&
        localZ <= slab.z + halfZ
      ) {
        return slab.topY;
      }
    }
    return 10.08;
  }

  for (const slab of ceilingSlabs) {
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(slab.sx, slab.sy, slab.sz),
      ceilingMat
    );
    roof.position.set(
      CAMP_MAP_X + slab.x,
      slab.topY + slab.sy * 0.5,
      CAMP_MAP_Z + slab.z
    );
    roof.rotation.set(slab.rx, 0, slab.rz);
    scene.add(roof);
  }

  function createTaperedConnectorGeometry(bottomX, bottomZ, topX, topZ, height) {
    const hx0 = bottomX * 0.5;
    const hz0 = bottomZ * 0.5;
    const hx1 = topX * 0.5;
    const hz1 = topZ * 0.5;
    const y0 = -height * 0.5;
    const y1 = height * 0.5;
    const vertices = [
      // bottom
      -hx0, y0, -hz0,
       hx0, y0, -hz0,
       hx0, y0,  hz0,
      -hx0, y0,  hz0,
      // top
      -hx1, y1, -hz1,
       hx1, y1, -hz1,
       hx1, y1,  hz1,
      -hx1, y1,  hz1,
    ];
    const indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  for (let i = 0; i < pillarDefs.length; i += 1) {
    const pillar = pillarDefs[i];
    const localBottomY = getCeilingBottomY(pillar.x, pillar.z);
    const connectorHeight = Math.max(0.45, localBottomY - pillar.sy);
    const bottomX = pillar.sx;
    const bottomZ = pillar.sz;
    const topX = Math.max(bottomX + 4.2, pillar.sx + 5.0);
    const topZ = Math.max(bottomZ + 4.2, pillar.sz + 5.0);
    const connector = new THREE.Mesh(
      createTaperedConnectorGeometry(bottomX, bottomZ, topX, topZ, connectorHeight),
      ceilingMat
    );
    connector.position.set(
      CAMP_MAP_X + pillar.x,
      pillar.sy + connectorHeight * 0.5,
      CAMP_MAP_Z + pillar.z
    );
    connector.rotation.set(0, pillar.ry * 0.65, 0);
    scene.add(connector);
  }

  airPurifierStation = buildAirPurifierStation(
    CAMP_MAP_X + 15.5,
    CAMP_MAP_Z + campHalf - 8.8,
    Math.PI
  );

  const caveAirCan = buildFreshAirCanisterModel();
  caveAirCan.position.set(CAMP_MAP_X + 11.8, START_FLAT_Y, CAMP_MAP_Z + campHalf - 10.2);
  caveAirCan.rotation.set(0, Math.PI * 0.22, 0.04);
  scene.add(caveAirCan);
  registerPickupItem(caveAirCan, "freshAirCanister", "E : 신선한 공기 캔 줍기");
}

function buildFrontierArea() {
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(FRONTIER_GROUND_SIZE, 0.18, FRONTIER_GROUND_SIZE),
    new THREE.MeshStandardMaterial({
      color: 0x8a775f,
      roughness: 0.98,
    })
  );
  pad.position.set(FRONTIER_MAP_X, 0.09, FRONTIER_MAP_Z);
  scene.add(pad);
  groundSurfaces.push(pad);
  registerWalkableSurface("개척지", pad, 0.45);

  const bermMat = new THREE.MeshStandardMaterial({
    color: 0x6f624f,
    roughness: 1.0,
  });
  const parcelBorderMat = new THREE.MeshStandardMaterial({
    color: FRONTIER_PARCEL_BORDER_COLOR,
    roughness: 0.64,
    metalness: 0.08,
    emissive: 0x7a3b00,
    emissiveIntensity: 0.12,
  });
  const half = FRONTIER_GROUND_SIZE * 0.5;
  const wallThickness = 3.4;
  const wallHeight = 5.8;
  const southOpeningWidth = 12.5;
  const westHousingOpeningWidth = 13.5;
  const wallDefs = [
    { x: 0, z: -half - wallThickness * 0.2, sx: FRONTIER_GROUND_SIZE + 4, sz: wallThickness },
    { x: half + wallThickness * 0.2, z: 0, sx: wallThickness, sz: FRONTIER_GROUND_SIZE + 4 },
    { x: -(FRONTIER_GROUND_SIZE - southOpeningWidth) * 0.25 - southOpeningWidth * 0.5, z: half + wallThickness * 0.2, sx: (FRONTIER_GROUND_SIZE - southOpeningWidth) * 0.5 + 2.2, sz: wallThickness },
    { x: (FRONTIER_GROUND_SIZE - southOpeningWidth) * 0.25 + southOpeningWidth * 0.5, z: half + wallThickness * 0.2, sx: (FRONTIER_GROUND_SIZE - southOpeningWidth) * 0.5 + 2.2, sz: wallThickness },
    { x: -half - wallThickness * 0.2, z: -(FRONTIER_GROUND_SIZE - westHousingOpeningWidth) * 0.25 - westHousingOpeningWidth * 0.5, sx: wallThickness, sz: (FRONTIER_GROUND_SIZE - westHousingOpeningWidth) * 0.5 + 2.2 },
    { x: -half - wallThickness * 0.2, z: (FRONTIER_GROUND_SIZE - westHousingOpeningWidth) * 0.25 + westHousingOpeningWidth * 0.5, sx: wallThickness, sz: (FRONTIER_GROUND_SIZE - westHousingOpeningWidth) * 0.5 + 2.2 },
  ];

  for (const wall of wallDefs) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wall.sx, wallHeight, wall.sz),
      bermMat
    );
    mesh.position.set(FRONTIER_MAP_X + wall.x, wallHeight * 0.5 - 0.3, FRONTIER_MAP_Z + wall.z);
    scene.add(mesh);
    addCollider(mesh, 1.0);
  }

  const parcelInset = 5.5;
  const parcelInnerWidth = FRONTIER_GROUND_SIZE - parcelInset * 2;
  const parcelInnerHeight = FRONTIER_GROUND_SIZE - parcelInset * 2;
  const centerLaneWidth = 4.8;
  const crossLaneWidth = 4.8;
  const parcelWidth = (parcelInnerWidth - centerLaneWidth) * 0.5;
  const parcelHeight = (parcelInnerHeight - crossLaneWidth * 2) / 3;
  const borderThickness = 0.34;
  const borderHeight = 0.06;
  const topY = 0.19;

  function addParcelBorder(x, z, sx, sz) {
    const north = new THREE.Mesh(
      new THREE.BoxGeometry(sx, borderHeight, borderThickness),
      parcelBorderMat
    );
    north.position.set(x, topY, z - sz * 0.5);
    scene.add(north);

    const south = new THREE.Mesh(
      new THREE.BoxGeometry(sx, borderHeight, borderThickness),
      parcelBorderMat
    );
    south.position.set(x, topY, z + sz * 0.5);
    scene.add(south);

    const west = new THREE.Mesh(
      new THREE.BoxGeometry(borderThickness, borderHeight, sz),
      parcelBorderMat
    );
    west.position.set(x - sx * 0.5, topY, z);
    scene.add(west);

    const east = new THREE.Mesh(
      new THREE.BoxGeometry(borderThickness, borderHeight, sz),
      parcelBorderMat
    );
    east.position.set(x + sx * 0.5, topY, z);
    scene.add(east);
  }

  const leftCenterX = FRONTIER_MAP_X - (centerLaneWidth * 0.5 + parcelWidth * 0.5);
  const rightCenterX = FRONTIER_MAP_X + (centerLaneWidth * 0.5 + parcelWidth * 0.5);
  const topCenterZ = FRONTIER_MAP_Z - (crossLaneWidth + parcelHeight);
  const midCenterZ = FRONTIER_MAP_Z;
  const bottomCenterZ = FRONTIER_MAP_Z + (crossLaneWidth + parcelHeight);
  frontierParcelDefs = [
    { label: "P1", x: leftCenterX, z: topCenterZ, signZ: topCenterZ + parcelHeight * 0.5 - 1.1, width: parcelWidth, height: parcelHeight },
    { label: "P2", x: rightCenterX, z: topCenterZ, signZ: topCenterZ + parcelHeight * 0.5 - 1.1, width: parcelWidth, height: parcelHeight },
    { label: "P3", x: leftCenterX, z: midCenterZ, signZ: midCenterZ + parcelHeight * 0.5 - 1.1, width: parcelWidth, height: parcelHeight },
    { label: "P4", x: rightCenterX, z: midCenterZ, signZ: midCenterZ + parcelHeight * 0.5 - 1.1, width: parcelWidth, height: parcelHeight },
    { label: "P5", x: leftCenterX, z: bottomCenterZ, signZ: bottomCenterZ - parcelHeight * 0.5 + 1.1, width: parcelWidth, height: parcelHeight },
    { label: "P6", x: rightCenterX, z: bottomCenterZ, signZ: bottomCenterZ - parcelHeight * 0.5 + 1.1, width: parcelWidth, height: parcelHeight },
  ];

  for (const parcel of frontierParcelDefs) {
    addParcelBorder(parcel.x, parcel.z, parcelWidth, parcelHeight);
    parcel.signObj = makeSign(parcel.x, parcel.signZ, parcel.label, 0);
  }

  frontierParcelConstructionRoots = {};
  frontierParcelConstructionGroups = {};
  frontierParcelConstructionColliders = {};
  for (const parcel of frontierParcelDefs) {
    const root = new THREE.Group();
    root.position.set(parcel.x, 0, parcel.z);
    scene.add(root);
    frontierParcelConstructionRoots[parcel.label] = root;
    rebuildFrontierParcelConstructionVisual(parcel.label);
  }

  frontierAirPurifierStation = buildAirPurifierStation(
    FRONTIER_MAP_X + southOpeningWidth * 0.5 + 2.1,
    FRONTIER_MAP_Z + half - 2.3,
    Math.PI,
    "개척지"
  );

  const housingLinkLength = 16;
  const housingLinkWidth = 11.5;
  const housingDistrictWidth = 52;
  const housingDistrictDepth = 42;
  const housingPlazaDepth = 18;
  const housingTowerWidth = 24;
  const housingTowerDepth = 11;
  const housingTowerHeight = 16.8;
  const housingWestCenterX =
    FRONTIER_MAP_X - half - housingLinkLength - housingDistrictWidth * 0.5 - 3.8;
  const housingCenterZ = FRONTIER_MAP_Z;

  const housingLink = new THREE.Mesh(
    new THREE.BoxGeometry(housingLinkLength, 0.14, housingLinkWidth),
    new THREE.MeshStandardMaterial({
      color: 0x8f816d,
      roughness: 0.97,
    })
  );
  housingLink.position.set(
    FRONTIER_MAP_X - half - housingLinkLength * 0.5,
    0.07,
    housingCenterZ
  );
  scene.add(housingLink);
  groundSurfaces.push(housingLink);
  registerWalkableSurface("개척지", housingLink, 0.42);

  const housingLinkWestEdgeX = housingLink.position.x - housingLinkLength * 0.5;
  const housingDistrictEastEdgeX = housingWestCenterX + housingDistrictWidth * 0.5;
  const housingJoinLength = Math.max(0.8, housingLinkWestEdgeX - housingDistrictEastEdgeX);
  const housingJoin = new THREE.Mesh(
    new THREE.BoxGeometry(housingJoinLength, 0.145, housingLinkWidth),
    new THREE.MeshStandardMaterial({
      color: 0x93826f,
      roughness: 0.97,
    })
  );
  housingJoin.position.set(
    housingDistrictEastEdgeX + housingJoinLength * 0.5,
    0.072,
    housingCenterZ
  );
  scene.add(housingJoin);
  groundSurfaces.push(housingJoin);
  registerWalkableSurface("개척지", housingJoin, 0.42);

  const housingDistrict = new THREE.Mesh(
    new THREE.BoxGeometry(housingDistrictWidth, 0.16, housingDistrictDepth),
    new THREE.MeshStandardMaterial({
      color: 0x92816b,
      roughness: 0.98,
    })
  );
  housingDistrict.position.set(housingWestCenterX, 0.08, housingCenterZ + 0.4);
  scene.add(housingDistrict);
  groundSurfaces.push(housingDistrict);
  registerWalkableSurface("개척지", housingDistrict, 0.42);

  const buildHousingNoticeBoard = (x, z, rotationY = 0, title = "게시판") => {
    const g = new THREE.Group();
    const boardWidth = 4.02;
    const boardHeight = 3.52;
    const boardHalfWidth = boardWidth * 0.5;
    const frameThickness = 0.12;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2d3138,
      roughness: 0.55,
      metalness: 0.45,
    });
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.92,
      metalness: 0.03,
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x1d1f24,
      roughness: 0.72,
      metalness: 0.25,
    });

    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.55, 0.12), frameMat);
    leftPost.position.set(-boardHalfWidth - 0.12, 1.78, -0.12);
    g.add(leftPost);

    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.55, 0.12), frameMat);
    rightPost.position.set(boardHalfWidth + 0.12, 1.78, -0.12);
    g.add(rightPost);

    const bottomBeam = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth + 0.18, 0.1, 0.1),
      frameMat
    );
    bottomBeam.position.set(0, 0.42, -0.12);
    g.add(bottomBeam);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth + frameThickness, boardHeight + frameThickness, 0.08),
      frameMat
    );
    frame.position.set(0, 2.66, -0.02);
    g.add(frame);

    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth, boardHeight, 0.04),
      panelMat
    );
    backPanel.position.set(0, 2.66, 0.03);
    g.add(backPanel);

    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 760;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1f2933";
      ctx.font = "bold 54px Arial";
      ctx.textAlign = "center";
      ctx.fillText(title, canvas.width * 0.5, 92);
      ctx.strokeStyle = "#d1d8e0";
      ctx.lineWidth = 6;
      ctx.strokeRect(58, 132, canvas.width - 116, canvas.height - 190);
      ctx.fillStyle = "#7c8793";
      ctx.font = "600 34px Arial";
      ctx.fillText("공용 알림과 안내가 표시될 예정입니다.", canvas.width * 0.5, canvas.height - 70);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(boardWidth - 0.16, boardHeight - 0.16),
      new THREE.MeshBasicMaterial({ map: texture })
    );
    screen.position.set(0, 2.66, 0.055);
    g.add(screen);

    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.18), frameMat);
    leftFoot.position.set(-boardHalfWidth + 0.42, 0.08, -0.12);
    g.add(leftFoot);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.18), frameMat);
    rightFoot.position.set(boardHalfWidth - 0.42, 0.08, -0.12);
    g.add(rightFoot);

    const wheelOffsets = [
      [-boardHalfWidth - 0.08, 0.02, -0.08],
      [-boardHalfWidth + 0.78, 0.02, 0.08],
      [boardHalfWidth - 0.78, 0.02, -0.08],
      [boardHalfWidth + 0.08, 0.02, 0.08],
    ];
    for (const [wx, wy, wz] of wheelOffsets) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16),
        wheelMat
      );
      wheel.rotation.z = Math.PI * 0.5;
      wheel.position.set(wx, wy, wz);
      g.add(wheel);
    }

    g.position.set(x, START_FLAT_Y + 0.22, z);
    g.rotation.y = rotationY;
    scene.add(g);
    addCollider(g, 0.88);
  };

  buildHousingNoticeBoard(
    housingWestCenterX + 13.4,
    housingCenterZ + housingPlazaDepth * 0.5 - 2.2,
    Math.PI,
    "게시판 A"
  );
  buildHousingNoticeBoard(
    housingWestCenterX,
    housingCenterZ + housingPlazaDepth * 0.5 - 1.8,
    Math.PI,
    "게시판 B"
  );
  buildHousingNoticeBoard(
    housingWestCenterX - 13.4,
    housingCenterZ + housingPlazaDepth * 0.5 - 2.2,
    Math.PI,
    "게시판 C"
  );

  const fenceMat = new THREE.MeshStandardMaterial({
    color: 0x6e6257,
    roughness: 0.92,
  });
  const fenceHeight = 1.45;
  const fenceY = fenceHeight * 0.5;
  const addHousingFence = (sx, sz, x, z) => {
    const fence = new THREE.Mesh(
      new THREE.BoxGeometry(sx, fenceHeight, sz),
      fenceMat
    );
    fence.position.set(x, fenceY, z);
    scene.add(fence);
    addCollider(fence, 1.0);
  };

  const districtHalfW = housingDistrictWidth * 0.5;
  const districtHalfD = housingDistrictDepth * 0.5;
  const linkHalfW = housingLinkWidth * 0.5;
  const districtCenterZ = housingDistrict.position.z;
  const districtNorthZ = districtCenterZ - districtHalfD;
  const districtSouthZ = districtCenterZ + districtHalfD;
  const districtWestX = housingWestCenterX - districtHalfW;
  const districtEastX = housingWestCenterX + districtHalfW;
  const corridorStartX = districtEastX;
  const corridorEndX = housingLink.position.x + housingLinkLength * 0.5;
  const corridorLength = Math.max(1.2, corridorEndX - corridorStartX);
  const corridorCenterX = corridorStartX + corridorLength * 0.5;
  const corridorNorthZ = housingCenterZ - linkHalfW + 0.17;
  const corridorSouthZ = housingCenterZ + linkHalfW - 0.17;
  const eastOpeningMinZ = housingCenterZ - linkHalfW - 0.45;
  const eastOpeningMaxZ = housingCenterZ + linkHalfW + 0.45;
  const eastNorthDepth = Math.max(0, eastOpeningMinZ - districtNorthZ);
  const eastSouthDepth = Math.max(0, districtSouthZ - eastOpeningMaxZ);

  addHousingFence(housingDistrictWidth + 0.4, 0.34, housingWestCenterX, districtNorthZ + 0.17);
  addHousingFence(housingDistrictWidth + 0.4, 0.34, housingWestCenterX, districtSouthZ - 0.17);
  addHousingFence(0.34, housingDistrictDepth + 0.4, districtWestX + 0.17, districtCenterZ);
  if (eastNorthDepth > 0.6) {
    addHousingFence(
      0.34,
      eastNorthDepth,
      districtEastX - 0.17,
      districtNorthZ + eastNorthDepth * 0.5
    );
  }
  if (eastSouthDepth > 0.6) {
    addHousingFence(
      0.34,
      eastSouthDepth,
      districtEastX - 0.17,
      eastOpeningMaxZ + eastSouthDepth * 0.5
    );
  }
  addHousingFence(corridorLength, 0.34, corridorCenterX, corridorNorthZ);
  addHousingFence(corridorLength, 0.34, corridorCenterX, corridorSouthZ);

  const housingTower = new THREE.Group();
  housingTower.position.set(housingWestCenterX, 0, housingCenterZ - 9.2);
  scene.add(housingTower);

  const towerBodyMat = new THREE.MeshStandardMaterial({
    color: 0xd3cec6,
    roughness: 0.94,
  });
  const towerTrimMat = new THREE.MeshStandardMaterial({
    color: 0x6f6359,
    roughness: 0.84,
  });
  const towerWindowMat = new THREE.MeshStandardMaterial({
    color: 0x8ea0ad,
    roughness: 0.42,
    metalness: 0.12,
  });

  const towerBody = new THREE.Mesh(
    new THREE.BoxGeometry(housingTowerWidth, housingTowerHeight, housingTowerDepth),
    towerBodyMat
  );
  towerBody.position.set(0, housingTowerHeight * 0.5, 0);
  housingTower.add(towerBody);
  addCollider(towerBody, 1.0);

  const towerRoof = new THREE.Mesh(
    new THREE.BoxGeometry(housingTowerWidth + 1.2, 0.55, housingTowerDepth + 1.1),
    towerTrimMat
  );
  towerRoof.position.set(0, housingTowerHeight + 0.28, 0);
  housingTower.add(towerRoof);
  addCollider(towerRoof, 1.0);

  const entryAwning = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 0.28, 1.6),
    towerTrimMat
  );
  entryAwning.position.set(0, 3.1, housingTowerDepth * 0.5 + 0.74);
  housingTower.add(entryAwning);
  addCollider(entryAwning, 1.0);

  const entryLeftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 4.6, 0.34),
    towerTrimMat
  );
  entryLeftFrame.position.set(-1.24, 2.3, housingTowerDepth * 0.5 + 0.18);
  housingTower.add(entryLeftFrame);
  addCollider(entryLeftFrame, 1.0);

  const entryRightFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 4.6, 0.34),
    towerTrimMat
  );
  entryRightFrame.position.set(1.24, 2.3, housingTowerDepth * 0.5 + 0.18);
  housingTower.add(entryRightFrame);
  addCollider(entryRightFrame, 1.0);

  const entryCut = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 3.5, 0.42),
    towerBodyMat
  );
  entryCut.position.set(0, 1.75, housingTowerDepth * 0.5 + 0.24);
  housingTower.add(entryCut);

  const windowGeo = new THREE.BoxGeometry(2.15, 1.55, 0.14);
  const floorYs = [4.2, 7.0, 9.8, 12.6, 15.4];
  const windowXs = [-7.2, -2.4, 2.4, 7.2];
  for (const y of floorYs) {
    for (const x of windowXs) {
      const windowPane = new THREE.Mesh(windowGeo, towerWindowMat);
      windowPane.position.set(x, y, housingTowerDepth * 0.5 + 0.09);
      housingTower.add(windowPane);
    }
  }

  const sideWindowGeo = new THREE.BoxGeometry(0.14, 1.45, 1.95);
  const sideWindowZs = [-3.2, 0, 3.2];
  for (const y of floorYs) {
    for (const z of sideWindowZs) {
      const westWindow = new THREE.Mesh(sideWindowGeo, towerWindowMat);
      westWindow.position.set(-housingTowerWidth * 0.5 - 0.08, y, z);
      housingTower.add(westWindow);
      const eastWindow = westWindow.clone();
      eastWindow.position.x = housingTowerWidth * 0.5 + 0.08;
      housingTower.add(eastWindow);
    }
  }

  const housingSign = buildFrontierBuildingSign("Mansion ONE");
  housingSign.position.set(7.2, 4.2, housingTowerDepth * 0.5 + 0.5);
  housingTower.add(housingSign);

  const mansionEntryMarker = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.8, 1.1),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  mansionEntryMarker.position.set(
    housingTower.position.x,
    START_FLAT_Y + 1.4,
    housingTower.position.z + housingTowerDepth * 0.5 + 1.9
  );
  scene.add(mansionEntryMarker);
  mansionOneEntranceInteractable = {
    obj: mansionEntryMarker,
    board: mansionEntryMarker,
    highlightKind: "none",
    type: "mansionEntry",
  };
  interactables.push(mansionOneEntranceInteractable);

  mansionOneExteriorReturn = {
    x: housingTower.position.x,
    z: housingTower.position.z + housingTowerDepth * 0.5 + 3.1,
    rotationY: Math.PI,
  };

  const roomRoot = new THREE.Group();
  roomRoot.position.set(housingWestCenterX - 96, START_FLAT_Y, housingCenterZ - 4);
  scene.add(roomRoot);
  mansionOneRoomRoot = roomRoot;

  const roomFloor = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.16, 10),
    new THREE.MeshStandardMaterial({ color: 0xa79a89, roughness: 0.96 })
  );
  roomFloor.position.set(0, 0.08, 0);
  roomRoot.add(roomFloor);
  groundSurfaces.push(roomFloor);
  registerWalkableSurface("개척지", roomFloor, 0.42);

  const roomWallMat = new THREE.MeshStandardMaterial({ color: 0xd9d1c8, roughness: 0.94 });
  const roomTrimMat = new THREE.MeshStandardMaterial({ color: 0x7a6d61, roughness: 0.88 });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 3.8, 0.28), roomWallMat);
  backWall.position.set(0, 1.9, -5.0);
  roomRoot.add(backWall);
  addCollider(backWall, 1.0);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.8, 10), roomWallMat);
  leftWall.position.set(-6.0, 1.9, 0);
  roomRoot.add(leftWall);
  addCollider(leftWall, 1.0);

  const rightWall = leftWall.clone();
  rightWall.position.x = 6.0;
  roomRoot.add(rightWall);
  addCollider(rightWall, 1.0);

  const frontLeftWall = new THREE.Mesh(new THREE.BoxGeometry(4.35, 3.8, 0.28), roomWallMat);
  frontLeftWall.position.set(-3.83, 1.9, 5.0);
  roomRoot.add(frontLeftWall);
  addCollider(frontLeftWall, 1.0);

  const frontRightWall = frontLeftWall.clone();
  frontRightWall.position.x = 3.83;
  roomRoot.add(frontRightWall);
  addCollider(frontRightWall, 1.0);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(12, 0.18, 10), roomTrimMat);
  ceiling.position.set(0, 3.9, 0);
  roomRoot.add(ceiling);
  addCollider(ceiling, 1.0);

  const roomDoorFrameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.7, 0.2), roomTrimMat);
  roomDoorFrameLeft.position.set(-1.2, 1.35, 4.92);
  roomRoot.add(roomDoorFrameLeft);
  addCollider(roomDoorFrameLeft, 1.0);

  const roomDoorFrameRight = roomDoorFrameLeft.clone();
  roomDoorFrameRight.position.x = 1.2;
  roomRoot.add(roomDoorFrameRight);
  addCollider(roomDoorFrameRight, 1.0);

  const roomDoorTop = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.2, 0.2), roomTrimMat);
  roomDoorTop.position.set(0, 2.7, 4.92);
  roomRoot.add(roomDoorTop);
  addCollider(roomDoorTop, 1.0);

  const roomDoorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 2.35, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x8f7a67, roughness: 0.9 })
  );
  roomDoorPanel.position.set(0, 1.18, 4.88);
  roomRoot.add(roomDoorPanel);
  addCollider(roomDoorPanel, 1.0);

  const roomBedBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.38, 1.35),
    new THREE.MeshStandardMaterial({ color: 0x6a5d51, roughness: 0.92 })
  );
  roomBedBase.position.set(-3.1, 0.38, -2.2);
  roomRoot.add(roomBedBase);
  addCollider(roomBedBase, 1.0);

  const roomMattress = new THREE.Mesh(
    new THREE.BoxGeometry(2.28, 0.22, 1.12),
    new THREE.MeshStandardMaterial({ color: 0xe9e5df, roughness: 0.98 })
  );
  roomMattress.position.set(-3.1, 0.68, -2.2);
  roomRoot.add(roomMattress);

  const roomPillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.18, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xf7f5f2, roughness: 1.0 })
  );
  roomPillow.position.set(-3.8, 0.88, -2.2);
  roomRoot.add(roomPillow);

  const roomBedMarker = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.5, 1.8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  roomBedMarker.position.set(
    roomRoot.position.x - 3.1,
    START_FLAT_Y + 1.0,
    roomRoot.position.z - 2.2
  );
  scene.add(roomBedMarker);
  mansionOneBedInteractable = {
    obj: roomBedMarker,
    board: roomBedMarker,
    highlightKind: "none",
    type: "mansionBed",
  };
  interactables.push(mansionOneBedInteractable);

  const roomChest = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.88, 0.78),
    new THREE.MeshStandardMaterial({ color: 0x8a6a46, roughness: 0.94 })
  );
  roomChest.position.set(3.2, 0.44, -2.6);
  roomRoot.add(roomChest);
  addCollider(roomChest, 1.0);

  const roomChestLid = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 0.14, 0.86),
    new THREE.MeshStandardMaterial({ color: 0x9a7850, roughness: 0.9 })
  );
  roomChestLid.position.set(3.2, 0.95, -2.6);
  roomRoot.add(roomChestLid);

  const roomStorageMarker = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.6, 1.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  roomStorageMarker.position.set(
    roomRoot.position.x + 3.2,
    START_FLAT_Y + 0.9,
    roomRoot.position.z - 2.6
  );
  scene.add(roomStorageMarker);
  mansionOneStorageInteractable = {
    obj: roomStorageMarker,
    board: roomStorageMarker,
    highlightKind: "none",
    type: "mansionStorage",
  };
  interactables.push(mansionOneStorageInteractable);

  const roomExitMarker = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.8, 1.0),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  roomExitMarker.position.set(
    roomRoot.position.x,
    START_FLAT_Y + 1.4,
    roomRoot.position.z + 3.8
  );
  scene.add(roomExitMarker);
  mansionOneExitInteractable = {
    obj: roomExitMarker,
    board: roomExitMarker,
    highlightKind: "none",
    type: "mansionExit",
  };
  interactables.push(mansionOneExitInteractable);

  ensurePlayerNotInsideGeneratedColliders(
    [roomDoorPanel, roomBedBase, roomChest],
    {
      x: roomRoot.position.x,
      z: roomRoot.position.z + 3.35,
      rotationY: Math.PI,
    },
    ""
  );
}

function buildMapConnectorTunnel(startGate, endGate) {
  const centerX = (startGate.position.x + endGate.position.x) * 0.5;
  const minZ = Math.min(startGate.position.z, endGate.position.z) - 1.2;
  const maxZ = Math.max(startGate.position.z, endGate.position.z) + 1.2;
  const length = maxZ - minZ;
  const centerZ = (minZ + maxZ) * 0.5;
  const tunnelWidth = 10.8;
  const curbWidth = 0.24;
  const curbOffset = tunnelWidth * 0.5 - curbWidth * 0.5;
  const sideBermWidth = 4.6;
  const sideBermHeight = 6.4;
  const sideBermCenterOffset = tunnelWidth * 0.5 + sideBermWidth * 0.42;
  const sideBermLength = length;
  const sideBermCenterZ = centerZ;

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(tunnelWidth, 0.14, length),
    new THREE.MeshStandardMaterial({
      color: 0x706455,
      roughness: 0.98,
    })
  );
  floor.position.set(centerX, 0.07, centerZ);
  scene.add(floor);
  groundSurfaces.push(floor);
  registerWalkableSurface(startGate.userData.mapId, floor, 0.38);
  registerWalkableSurface(endGate.userData.mapId, floor, 0.38);

  const mineTransition = new THREE.Mesh(
    new THREE.BoxGeometry(tunnelWidth + 0.9, 0.12, 3.2),
    new THREE.MeshStandardMaterial({
      color: 0x7b6f63,
      roughness: 0.98,
    })
  );
  mineTransition.position.set(startGate.position.x, 0.06, startGate.position.z + 1.55);
  scene.add(mineTransition);
  groundSurfaces.push(mineTransition);
  registerWalkableSurface(startGate.userData.mapId, mineTransition, 0.4);

  const campTransition = new THREE.Mesh(
    new THREE.BoxGeometry(tunnelWidth + 0.9, 0.12, 3.4),
    new THREE.MeshStandardMaterial({
      color: 0x342a22,
      roughness: 0.99,
    })
  );
  campTransition.position.set(endGate.position.x, 0.06, endGate.position.z - 1.6);
  scene.add(campTransition);
  groundSurfaces.push(campTransition);
  registerWalkableSurface(endGate.userData.mapId, campTransition, 0.4);

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x4e4032,
    roughness: 0.98,
  });
  const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, length), curbMat);
  leftCurb.position.set(centerX - curbOffset, 0.18, centerZ);
  scene.add(leftCurb);

  const rightCurb = leftCurb.clone();
  rightCurb.position.x = centerX + curbOffset;
  scene.add(rightCurb);

  function createBermGeometry(bottomX, bottomZ, topX, topZ, height) {
    const bx = bottomX * 0.5;
    const bz = bottomZ * 0.5;
    const tx = topX * 0.5;
    const tz = topZ * 0.5;
    const y0 = -height * 0.5;
    const y1 = height * 0.5;
    const vertices = [
      -bx, y0, -bz,
       bx, y0, -bz,
       bx, y0,  bz,
      -bx, y0,  bz,
      -tx, y1, -tz,
       tx, y1, -tz,
       tx, y1,  tz,
      -tx, y1,  tz,
    ];
    const indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  const sideBermMat = new THREE.MeshStandardMaterial({
    color: 0x6d5e4f,
    roughness: 0.98,
  });
  const sideBermGeometry = createBermGeometry(
    sideBermWidth,
    sideBermLength,
    Math.max(1.8, sideBermWidth * 0.48),
    Math.max(6, sideBermLength - 1.2),
    sideBermHeight
  );

  const leftBerm = new THREE.Mesh(sideBermGeometry, sideBermMat);
  leftBerm.position.set(centerX - sideBermCenterOffset, sideBermHeight * 0.5 - 0.4, sideBermCenterZ);
  scene.add(leftBerm);
  addCollider(leftBerm, 1.0);

  const rightBerm = leftBerm.clone();
  rightBerm.position.x = centerX + sideBermCenterOffset;
  scene.add(rightBerm);
  addCollider(rightBerm, 1.0);

  registerConnectorTunnelZone(centerX, minZ, maxZ, 7.2);

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

renderer.domElement.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  if (!canPlayGame() || !keys.shift) return;
  shiftRotatePointerActive = true;
  shiftRotateLastX = e.clientX;
  shiftRotateLastY = e.clientY;
  controls.enabled = false;
});

window.addEventListener("pointerup", () => {
  shiftRotatePointerActive = false;
  controls.enabled = canPlayGame();
});

window.addEventListener("pointercancel", () => {
  shiftRotatePointerActive = false;
  controls.enabled = canPlayGame();
});

window.addEventListener("pointermove", (e) => {
  if (!shiftRotatePointerActive || !keys.shift || !canPlayGame()) return;

  const deltaX = e.clientX - shiftRotateLastX;
  const deltaY = e.clientY - shiftRotateLastY;
  shiftRotateLastX = e.clientX;
  shiftRotateLastY = e.clientY;

  const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  spherical.theta -= deltaX * SHIFT_CAMERA_ROTATE_SENSITIVITY;
  spherical.phi = THREE.MathUtils.clamp(
    spherical.phi + deltaY * SHIFT_CAMERA_ROTATE_SENSITIVITY,
    controls.minPolarAngle + 0.02,
    controls.maxPolarAngle - 0.02
  );
  offset.setFromSpherical(spherical);
  camera.position.copy(controls.target).add(offset);
  controls.update();
});

window.addEventListener("keydown", (e) => {
  if (!canPlayGame()) return;
  if (getLogicalInputKey(e) !== "escape" && isTextInputActive()) return;
  if (nftExhibitSelectionOpen) return;
  if (quickUseAssignState) return;
  const k = getLogicalInputKey(e);
  if (performance.now() < quickUseAssignmentConsumedUntil && QUICK_USE_ALLOWED_KEYS.includes(k)) {
    e.preventDefault();
    return;
  }
  console.log("KEYDOWN:", k);

  // ===== E : 월드 아이템 줍기 =====
  if (k === "e") {
  const pickup = findNearestPickupItem(2.0);
  if (pickup) {
    triggerPickupReach(pickup.obj);
    const added = addItem(pickup.itemId, 1);
    if (added) {
      updateInventoryUI();
      refreshQuestProgress();
      const def = ITEM_DEFS[pickup.itemId];
      const msg =
        pickup.itemId === "pickaxe" ? HUD_MSG.PICKAXE_GET :
        pickup.itemId === "safetyHelmet" ? HUD_MSG.HELMET_GET :
        pickup.itemId === "freshAirCanister" ? HUD_MSG.AIR_CAN_GET :
        `${def?.name ?? pickup.itemId} 획득!`;
      showUI(msg);
      lastMessageUntil = performance.now() + 900;

      unregisterDynamicProp(pickup.obj);
      unregisterPickupItem(pickup.obj);
      pickup.obj.removeFromParent();
    }
    return;
  }

  if (activeMapGate && !canUseMapGate(activeMapGate)) {
    if (tryUnlockMapGate(activeMapGate)) {
      return;
    }
    return;
  }

  if (forgeStation?.parent && getForgeDistance() < 2.4) {
    setForgeOpen(!forgeOpen);
    return;
  }

  if (activeInteractable?.type === "nftBoard") {
    void openNftBoardSelectionOverlay();
    return;
  }

  if (activeInteractable?.type === "frontierShopBooth") {
    const parcelLabel = activeInteractable.parcelLabel ?? getSelectedFrontierParcelLabel();
    const mode = canManageFrontierShopSlot(parcelLabel) || canUseFrontierShopSlot(parcelLabel) ? "manage" : "view";
    openFrontierBoothDialog(parcelLabel, "shop", activeInteractable.boothTitle ?? "상점", mode);
    return;
  }

  if (activeInteractable?.type === "frontierDisplayBooth") {
    const parcelLabel = activeInteractable.parcelLabel ?? getSelectedFrontierParcelLabel();
    const mode = hasFrontierParcelAuthority(parcelLabel) ? "manage" : "view";
    openFrontierBoothDialog(parcelLabel, activeInteractable.slotKey ?? "displayA", activeInteractable.boothTitle ?? "전시", mode);
    return;
  }

  if (activeInteractable?.type === "mansionEntry") {
    if (!hasMansionOneResidenceAuthority()) {
      showUI("101호 거주권 필요", 1000);
      return;
    }
    if (enterMansionOneRoom()) return;
  }

  if (activeInteractable?.type === "mansionExit") {
    if (exitMansionOneRoom()) return;
  }

  if (activeInteractable?.type === "refinery") {
    setRefineryOpen(!refineryOpen);
    return;
  }

  if (activeInteractable?.type === "airPurifier") {
    if (tryUseAirPurifier(activeInteractable.purifierMapId ?? "폐광맵")) {
      return;
    }
  }
  }

  if (k === "t" && DEV_PRESET_ENABLED) {
    torchEquipped = !torchEquipped;
    showUI(torchEquipped ? "횃불 점화" : "횃불 소등", 900);
    lastMessageUntil = performance.now() + 900;
    return;
  }

  if (QUICK_USE_ALLOWED_KEYS.includes(k)) {
    if (useQuickUseItem(k)) {
      return;
    }
  }

  if (k === "b") {
    const frontierParcelLabel = getCurrentFrontierParcelLabel();
    if (frontierParcelLabel) {
      e.preventDefault();
      frontierActiveParcelLabel = frontierParcelLabel;
      const buildState = getFrontierBuildState(frontierParcelLabel);
      if (!hasFrontierParcelAuthority(frontierParcelLabel)) {
        showUI(`${frontierParcelLabel} 개발권 필요`, 1000);
        lastMessageUntil = performance.now() + 1000;
        return;
      }
      setFrontierBuildOpen(!frontierBuildOpen);
      return;
    }
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
  const k = getLogicalInputKey(e);
  if (!canPlayGame()) {
    if (k in keys) keys[k] = false;
    if (k === "shift") {
      keys.shift = false;
      shiftRotatePointerActive = false;
      controls.enabled = canPlayGame();
    }
    return;
  }
  if (nftExhibitSelectionOpen) {
    if (k in keys) keys[k] = false;
    if (k === "shift") {
      keys.shift = false;
      shiftRotatePointerActive = false;
      controls.enabled = canPlayGame();
    }
    return;
  }
  if (quickUseAssignState) {
    if (k in keys) keys[k] = false;
    if (k === "shift") {
      keys.shift = false;
      shiftRotatePointerActive = false;
      controls.enabled = canPlayGame();
    }
    return;
  }
  if (k in keys) keys[k] = false;
  if (k === "shift") {
    keys.shift = false;
    shiftRotatePointerActive = false;
    controls.enabled = canPlayGame();
  }
});

// Collision helpers
function getPlayerBox() {
  const size = new THREE.Vector3(0.8, 2.0, 0.8);
  const center = player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
  const box = new THREE.Box3();
  box.setFromCenterAndSize(center, size);
  return box;
}

function ensurePlayerNotInsideGeneratedColliders(colliderObjects = [], fallback = null, message = "구조물 생성으로 위치를 조정했습니다.") {
  if (!Array.isArray(colliderObjects) || !colliderObjects.length || !fallback) return false;
  const playerBox = getPlayerBox();
  const overlaps = colliderObjects.some((obj) => {
    const colliderIndex = getTrackedColliderIndex(obj, obj?.userData?.colliderIndex);
    return typeof colliderIndex === "number" && colliderBoxes[colliderIndex] && playerBox.intersectsBox(colliderBoxes[colliderIndex]);
  });
  if (!overlaps) return false;

  player.position.set(
    Number.isFinite(fallback.x) ? fallback.x : player.position.x,
    Number.isFinite(fallback.y) ? fallback.y : player.position.y,
    Number.isFinite(fallback.z) ? fallback.z : player.position.z
  );
  if (Number.isFinite(fallback.rotationY)) {
    player.rotation.y = fallback.rotationY;
    latestMoveDir.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  }
  snapCameraToPlayer();
  if (message) {
    showUI(message, 950);
    lastMessageUntil = performance.now() + 950;
  }
  return true;
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

function getCurrentMapBounds() {
  const entries = walkableMapSurfaces.get(currentMapId) ?? [];
  if (entries.length === 0) {
    return {
      minX: -GROUND_SIZE * 0.5 + 1.4,
      maxX: GROUND_SIZE * 0.5 - 1.4,
      minZ: -GROUND_SIZE * 0.5 + 1.4,
      maxZ: GROUND_SIZE * 0.5 - 1.4,
    };
  }

  const union = new THREE.Box3();
  let seeded = false;

  for (const entry of entries) {
    const mesh = entry.mesh;
    if (!mesh?.parent) continue;
    mesh.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(mesh);
    box.min.x -= entry.padding;
    box.max.x += entry.padding;
    box.min.z -= entry.padding;
    box.max.z += entry.padding;
    if (!seeded) {
      union.copy(box);
      seeded = true;
    } else {
      union.union(box);
    }
  }

  if (!seeded) {
    return {
      minX: -GROUND_SIZE * 0.5 + 1.4,
      maxX: GROUND_SIZE * 0.5 - 1.4,
      minZ: -GROUND_SIZE * 0.5 + 1.4,
      maxZ: GROUND_SIZE * 0.5 - 1.4,
    };
  }

  return {
    minX: union.min.x,
    maxX: union.max.x,
    minZ: union.min.z,
    maxZ: union.max.z,
  };
}

function isInsideCurrentMapBounds(x, z) {
  const entries = walkableMapSurfaces.get(currentMapId) ?? [];
  if (entries.length === 0) {
    const bounds = getCurrentMapBounds();
    return (
      x >= bounds.minX &&
      x <= bounds.maxX &&
      z >= bounds.minZ &&
      z <= bounds.maxZ
    );
  }

  for (const entry of entries) {
    const mesh = entry.mesh;
    if (!mesh?.parent) continue;
    mesh.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(mesh);
    box.min.x -= entry.padding;
    box.max.x += entry.padding;
    box.min.z -= entry.padding;
    box.max.z += entry.padding;
    if (x >= box.min.x && x <= box.max.x && z >= box.min.z && z <= box.max.z) {
      return true;
    }
  }

  return false;
}


// Movement
const clock = new THREE.Clock();
const MINING_SWING_DURATION = 0.28;
const PICKUP_REACH_DURATION = 0.22;
let miningSwingTime = 0;
let pickupReachTime = 0;
let currentMiningSwingDuration = MINING_SWING_DURATION;

function triggerMiningSwing(target = null) {
  currentMiningSwingDuration = getCurrentPickaxeStats().swingDuration;
  miningSwingTime = currentMiningSwingDuration;
  if (!target) return;

  const dx = target.position.x - player.position.x;
  const dz = target.position.z - player.position.z;
  if (Math.abs(dx) > 1e-4 || Math.abs(dz) > 1e-4) {
    player.rotation.y = Math.atan2(dx, dz);
  }
}

function triggerPickupReach(target = null) {
  pickupReachTime = PICKUP_REACH_DURATION;
  if (!target) return;

  const dx = target.position.x - player.position.x;
  const dz = target.position.z - player.position.z;
  if (Math.abs(dx) > 1e-4 || Math.abs(dz) > 1e-4) {
    player.rotation.y = Math.atan2(dx, dz);
  }
}

function updateMovement(dt) {
  if (!canPlayGame()) {
    for (const key of Object.keys(keys)) keys[key] = false;
    updatePlayerGroundY(dt);
    return;
  }

  if (mansionSleepOpen || mansionSleepPoseActive) {
    for (const key of Object.keys(keys)) keys[key] = false;
    updatePlayerGroundY(dt);
    leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, -1.18, 0.22);
    rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, -1.18, 0.22);
    leftLegPivot.rotation.x = THREE.MathUtils.lerp(leftLegPivot.rotation.x, 0.12, 0.18);
    rightLegPivot.rotation.x = THREE.MathUtils.lerp(rightLegPivot.rotation.x, 0.08, 0.18);
    torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, 0, 0.16);
    torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, 0, 0.16);
    torso.rotation.z = THREE.MathUtils.lerp(torso.rotation.z, -Math.PI * 0.48, 0.16);
    torso.position.y = THREE.MathUtils.lerp(torso.position.y, 1.02, 0.18);
    torso.position.z = THREE.MathUtils.lerp(torso.position.z, 0.08, 0.18);
    head.position.y = THREE.MathUtils.lerp(head.position.y, 1.78, 0.18);
    head.position.z = THREE.MathUtils.lerp(head.position.z, 0.15, 0.18);
    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.04, 0.18);
    leftArmPivot.rotation.z = THREE.MathUtils.lerp(leftArmPivot.rotation.z, -0.18, 0.18);
    rightArmPivot.rotation.z = THREE.MathUtils.lerp(rightArmPivot.rotation.z, 0.18, 0.18);
    return;
  }

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
    const devSpeedMultiplier = DEV_PRESET_ENABLED ? 3 : 1;
    const airMoveScalar =
      isPollutedMap(currentMapId) && getMapPurificationValue(currentMapId) < 100 && playerAirCurrent <= 0
        ? 0.12
        : 1;
    const speed = (keys.shift ? 7.0 : 4.0) * devSpeedMultiplier * airMoveScalar;
     
    const prevPos = player.position.clone();
    const delta = move.clone().multiplyScalar(speed * dt);

    // 1) X축 이동만 먼저 시도
    player.position.x = prevPos.x + delta.x;
    if (
      !isInsideCurrentMapBounds(player.position.x, player.position.z) ||
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
      !isInsideCurrentMapBounds(player.position.x, player.position.z) ||
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
  const torsoBaseY = 1.35;
  const torsoBaseZ = 0;
  const headBaseY = 2.1;
  const headBaseZ = 0;
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

  torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, 0, 0.18);
  torso.rotation.z = THREE.MathUtils.lerp(torso.rotation.z, 0, 0.18);
  torso.position.y = THREE.MathUtils.lerp(torso.position.y, torsoBaseY, 0.18);
  torso.position.z = THREE.MathUtils.lerp(torso.position.z, torsoBaseZ, 0.18);
  head.position.y = THREE.MathUtils.lerp(head.position.y, headBaseY, 0.18);
  head.position.z = THREE.MathUtils.lerp(head.position.z, headBaseZ, 0.18);
  head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0, 0.18);
  leftArmPivot.rotation.z = THREE.MathUtils.lerp(leftArmPivot.rotation.z, 0, 0.22);
  rightArmPivot.rotation.z = THREE.MathUtils.lerp(rightArmPivot.rotation.z, 0, 0.22);

  if (miningSwingTime > 0) {
    miningSwingTime = Math.max(0, miningSwingTime - dt);
    const phase = 1 - (miningSwingTime / currentMiningSwingDuration);

    let mainSwing = 0;
    let supportSwing = 0;
    let torsoBend = 0;
    let torsoTwist = 0;
    let torsoTilt = 0;
    let torsoDrop = 0;
    let torsoDrive = 0;
    let headDrop = 0;
    let headNod = 0;
    let leadLeg = 0;
    let trailLeg = 0;
    let mainArmRoll = 0;
    let supportArmRoll = 0;

    if (phase < 0.32) {
      const t = phase / 0.32;
      mainSwing = THREE.MathUtils.lerp(0.25, -1.7, t);
      supportSwing = THREE.MathUtils.lerp(-0.08, -0.65, t);
      torsoBend = THREE.MathUtils.lerp(0.02, -0.22, t);
      torsoTwist = THREE.MathUtils.lerp(-0.04, -0.2, t);
      torsoTilt = THREE.MathUtils.lerp(0.02, 0.12, t);
      torsoDrop = THREE.MathUtils.lerp(-0.02, -0.09, t);
      torsoDrive = THREE.MathUtils.lerp(-0.01, -0.06, t);
      headDrop = THREE.MathUtils.lerp(-0.01, -0.05, t);
      headNod = THREE.MathUtils.lerp(-0.02, -0.08, t);
      leadLeg = THREE.MathUtils.lerp(0.02, 0.14, t);
      trailLeg = THREE.MathUtils.lerp(-0.01, 0.08, t);
      mainArmRoll = THREE.MathUtils.lerp(0.02, 0.16, t);
      supportArmRoll = THREE.MathUtils.lerp(-0.02, -0.08, t);
    } else if (phase < 0.74) {
      const t = (phase - 0.32) / 0.42;
      mainSwing = THREE.MathUtils.lerp(-1.7, 1.85, t);
      supportSwing = THREE.MathUtils.lerp(-0.65, 0.48, t);
      torsoBend = THREE.MathUtils.lerp(-0.22, 0.34, t);
      torsoTwist = THREE.MathUtils.lerp(-0.2, 0.18, t);
      torsoTilt = THREE.MathUtils.lerp(0.12, -0.08, t);
      torsoDrop = THREE.MathUtils.lerp(-0.09, -0.17, t);
      torsoDrive = THREE.MathUtils.lerp(-0.06, 0.12, t);
      headDrop = THREE.MathUtils.lerp(-0.05, -0.12, t);
      headNod = THREE.MathUtils.lerp(-0.08, 0.2, t);
      leadLeg = THREE.MathUtils.lerp(0.14, -0.08, t);
      trailLeg = THREE.MathUtils.lerp(0.08, 0.26, t);
      mainArmRoll = THREE.MathUtils.lerp(0.16, -0.12, t);
      supportArmRoll = THREE.MathUtils.lerp(-0.08, -0.18, t);
    } else {
      const t = (phase - 0.74) / 0.26;
      mainSwing = THREE.MathUtils.lerp(1.85, 0.82, t);
      supportSwing = THREE.MathUtils.lerp(0.48, 0.08, t);
      torsoBend = THREE.MathUtils.lerp(0.34, 0.08, t);
      torsoTwist = THREE.MathUtils.lerp(0.18, 0.04, t);
      torsoTilt = THREE.MathUtils.lerp(-0.08, -0.02, t);
      torsoDrop = THREE.MathUtils.lerp(-0.17, -0.04, t);
      torsoDrive = THREE.MathUtils.lerp(0.12, 0.03, t);
      headDrop = THREE.MathUtils.lerp(-0.12, -0.03, t);
      headNod = THREE.MathUtils.lerp(0.2, 0.05, t);
      leadLeg = THREE.MathUtils.lerp(-0.08, 0.03, t);
      trailLeg = THREE.MathUtils.lerp(0.26, 0.06, t);
      mainArmRoll = THREE.MathUtils.lerp(-0.12, -0.02, t);
      supportArmRoll = THREE.MathUtils.lerp(-0.18, -0.04, t);
    }

    leftArmPivot.rotation.x = mainSwing;
    rightArmPivot.rotation.x = supportSwing;
    leftArmPivot.rotation.z = mainArmRoll;
    rightArmPivot.rotation.z = supportArmRoll;
    torso.rotation.x = torsoBend;
    torso.rotation.y = torsoTwist;
    torso.rotation.z = torsoTilt;
    torso.position.y = torsoBaseY + torsoDrop;
    torso.position.z = torsoBaseZ + torsoDrive;
    head.position.y = headBaseY + headDrop;
    head.position.z = headBaseZ + torsoDrive * 0.5;
    head.rotation.x = headNod;
    leftLegPivot.rotation.x = leadLeg;
    rightLegPivot.rotation.x = trailLeg;
  }

  if (pickupReachTime > 0 && miningSwingTime <= 0) {
    pickupReachTime = Math.max(0, pickupReachTime - dt);
    const phase = 1 - (pickupReachTime / PICKUP_REACH_DURATION);
    const reach = Math.sin(phase * Math.PI);

    leftArmPivot.rotation.x = THREE.MathUtils.lerp(0.12, -0.95, reach);
    rightArmPivot.rotation.x = THREE.MathUtils.lerp(-0.08, -0.35, reach * 0.85);
    torso.rotation.x = THREE.MathUtils.lerp(0, 0.18, reach);
    leftLegPivot.rotation.x *= 0.7;
    rightLegPivot.rotation.x *= 0.7;
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
  if (!canPlayGame()) return;
  if (nftExhibitSelectionOpen) return;
  if (quickUseAssignState) return;
  if (mansionSleepOpen) return;
  if (personalStorageOpen) return;
  if (e.code !== "Space") return;
  if (activeInteractable?.type === "mansionStorage") {
    e.preventDefault();
    openPersonalStorage();
    return;
  }
  if (activeInteractable?.type === "mansionBed") {
    e.preventDefault();
    openMansionSleepDialog();
    return;
  }
  if (activeTutorialNpc) {
    const currentStep = getCurrentQuestStep();
    if (currentStep?.title === "폐광 열쇠 수령" && !inventory.mineKeyIssued) {
      inventory.mineKeyIssued = true;
      addItem("abandonedMineKey", 1);
      updateInventoryUI();
      showUI(HUD_MSG.MINE_KEY_GET, 1200);
      lastMessageUntil = performance.now() + 1200;
      showNpcDialog("좋아, 이제 폐광에 들어갈 자격이 생겼다. 이 폐광 열쇠를 가져가서 북쪽 폐광 입구를 열어.", 3000);
      refreshQuestProgress();
      if (questOpen) renderQuestWindow();
      return;
    }
    showNpcDialog(getTutorialNpcLine());
    refreshQuestProgress();
    if (questOpen) renderQuestWindow();
    return;
  }
  if (activeHarvestTree) {
    if (addItem(activeHarvestTree.userData.harvestItemId, activeHarvestTree.userData.harvestCount ?? 1)) {
      setHarvestTreeActive(activeHarvestTree, false);
      updateInventoryUI();
      showUI(`${ITEM_DEFS[activeHarvestTree.userData.harvestItemId]?.name ?? "자원"} 획득!`, 900);
      lastMessageUntil = performance.now() + 900;
    }
    return;
  }
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
  const requiredPickaxeLevel = minedRock.userData.requiredPickaxeLevel ?? 0;
  if (inventory.pickaxeLevel < requiredPickaxeLevel) {
    showUI(`곡괭이 Lv.${requiredPickaxeLevel} 이상 필요`, 1000);
    lastMessageUntil = performance.now() + 1000;
    return;
  }
  const miningPower = getEquippedMiningPower();
  if (miningPower <= 0) return;

  minedRock.userData.hp = Math.max(0, (minedRock.userData.hp ?? 1) - miningPower);
  if (
    (minedRock.userData.maxHp ?? 1) <= 1 &&
    (minedRock.userData.hp ?? 0) <= 0.15
  ) {
    minedRock.userData.hp = 0;
  }
  const remainingHp = minedRock.userData.hp ?? 0;

  triggerHitStop();
  triggerRockHitReaction(minedRock);
  triggerCameraShake(remainingHp > 0 ? 0.035 : 0.06);

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
  if (minedRock.userData.resourceItemId === "stoneDust") {
    tutorialQuest.minedRockCount += 1;
  }
  addItem(minedRock.userData.resourceItemId ?? "stoneDust", minedRock.userData.resourceCount ?? 1);
  if (minedRock.userData.bonusDropEnabled) {
    const pickaxeStats = getCurrentPickaxeStats();
    if (Math.random() < pickaxeStats.bonusDropChance) {
      addItem("stoneDust", 1);
      showUI("보너스 돌가루 획득!");
      lastMessageUntil = performance.now() + 800;
    }
  } else {
    showUI(`${ITEM_DEFS[minedRock.userData.resourceItemId]?.name ?? "자원"} 획득!`, 800);
    lastMessageUntil = performance.now() + 800;
  }
  updateInventoryUI();
  refreshQuestProgress();

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
  const rawDt = Math.min(clock.getDelta(), 0.033);
  if (forgePendingUpgrade && performance.now() >= forgePendingUpgrade.resolveAt) {
    finishPendingForgeUpgrade();
  }
  if (forgeLastResult && forgeLastResult.until <= performance.now()) {
    forgeLastResult = null;
  }
  hitStopTime = Math.max(0, hitStopTime - rawDt);
  cameraShakeTime = Math.max(0, cameraShakeTime - rawDt);
  if (cameraShakeTime <= 0) cameraShakeStrength = 0;

  const dt = hitStopTime > 0 ? 0 : rawDt;

  updateMovement(dt);
  updateCurrentMapFromPlayerPosition();
  updateSceneFogForCurrentMap();
  schedulePlayerSaveSync();
  if (currentMapId !== lastAnnouncedMapId) {
    showMapArrivalBanner(currentMapId);
    lastAnnouncedMapId = currentMapId;
  }
  updateDynamicProps(dt);
  updateAirSystem(rawDt);
  updateCavePollutionVisuals(rawDt);
  updateParticles(dt);
  updateHarvestTrees();
  updateRockHitReactions(rawDt);
  updateRockFadeIns(dt);
  if (invOpen) renderEquipmentPreview();
  if (latestMoveDir.lengthSq() > 1e-6) {
    updateCompassFromDirection(latestMoveDir);
  } else {
    updateCompassFromDirection(new THREE.Vector3(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y)));
  }

  // ===== 상호작용 대상 탐색 =====
    activeInteractable = null;
    activeForgeStation = null;
    activeHarvestTree = null;
    activeTutorialNpc = findNearestTutorialNpc(2.2);
    activeMapGate = findTriggeredMapGate();

    if (forgeStation?.parent && getForgeDistance() < 2.4) {
  activeForgeStation = forgeStation;
    }

    let bestDist = Infinity;
    for (const it of interactables) {
  if (it.obj.visible === false) continue;
  const d = it.obj.position.distanceTo(player.position);
  if (d < 2.0 && d < bestDist) {
    bestDist = d;
    activeInteractable = it;
  }
    }

    // ===== 하이라이트 처리 =====
    for (const it of interactables) {
  if (it.highlightKind === "line") {
    for (const child of it.board.children) {
      child.material.opacity = 0;
    }
  } else if (it.highlightKind === "none") {
    // no-op
  } else {
    it.board.material.emissive.set(0x000000); // 기본: 발광 끔
  }
    }

    if (activeInteractable) {
  if (activeInteractable.highlightKind === "line") {
    for (const child of activeInteractable.board.children) {
      child.material.opacity = 0.9;
    }
  } else if (activeInteractable.highlightKind === "none") {
    // no-op
  } else {
    activeInteractable.board.material.emissive.set(0xffaa00); // 하이라이트 ON
  }
    }

  framePlayerDelta.copy(player.position).sub(lastFollowPlayerPosition);
  if (framePlayerDelta.lengthSq() > 0) {
    camera.position.add(framePlayerDelta);
    controls.target.add(framePlayerDelta);
    lastFollowPlayerPosition.copy(player.position);
  }
  controls.update();
  updateNpcDialogPosition();
  updateTutorialNpcNameTag();
  updatePlayerNameTag();
  applyCameraShake();
  if (forgeOpen) {
    if (getForgeDistance() >= 2.8) {
      setForgeOpen(false);
    }
  }
  if (refineryOpen) {
    if (getRefineryDistance() >= 2.8) {
      setRefineryOpen(false);
    }
  }

 // ===== 힌트(가까이 가면 뜨는 안내) =====
// 우선순위: 1) 곡괭이 줍기 2) 모루 3) 돌 채집 4) 표지판 조사 5) 아무것도 없으면 숨김
let hintText = "";

// 1) 월드 장비 줍기 힌트
activePickupItem = findNearestPickupItem(2.0);
if (activePickupItem) {
  hintText = activePickupItem.text;
}

// 2) 모루 강화 힌트
if (!hintText && activeTutorialNpc) {
  hintText = activeTutorialNpc.hint;
}

// 3) 모루 강화 힌트
  if (!hintText && activeForgeStation) {
    hintText = forgeOpen ? "대장간 이용 중" : "E : 장비 강화";
}

// 4) 나무 채집 힌트
if (!hintText) {
  activeHarvestTree = findNearestHarvestTree(2.2);
  if (activeHarvestTree) {
    hintText = "Space : 나무 채집";
  }
}

// 5) 돌 채집 힌트
if (!hintText) {
  activeMineRock = findNearestMineRock(2.2);
  if (activeMineRock) {
    hintText = activeMineRock.userData.requiredPickaxeLevel > (inventory.pickaxeLevel ?? 0)
      ? `Space : 채굴 (곡괭이 Lv.${activeMineRock.userData.requiredPickaxeLevel} 이상 필요)`
      : (activeMineRock.userData.resourceHint ?? "Space : 채굴");
  }
}

// 6) 개척지 필지 건축 힌트
const activeFrontierParcelLabel = getCurrentFrontierParcelLabel();
if (!hintText && activeFrontierParcelLabel) {
  const activeBuildState = getFrontierBuildState(activeFrontierParcelLabel);
  if (activeBuildState.stage >= 100) {
    if (hasFrontierParcelAuthority(activeFrontierParcelLabel)) {
      hintText = "B : 건축 관리";
    } else {
      hintText = `${activeFrontierParcelLabel} 개발권 필요`;
    }
  } else if (hasFrontierParcelAuthority(activeFrontierParcelLabel)) {
    hintText = "B : 건축 진행";
  } else {
    hintText = `${activeFrontierParcelLabel} 개발권 필요`;
  }
}

// 7) 표지판 근접 문구 (위 힌트가 없을 때만)
if (!hintText && activeInteractable) {
  hintText = activeInteractable.type === "airPurifier"
    ? getAirPurifierHintText(activeInteractable.purifierMapId ?? "폐광맵")
    : activeInteractable.type === "frontierShopBooth"
      ? ((canManageFrontierShopSlot(activeInteractable.parcelLabel) || canUseFrontierShopSlot(activeInteractable.parcelLabel)) ? "E : 판매 관리" : "E : 판매 보기")
    : activeInteractable.type === "frontierDisplayBooth"
      ? (hasFrontierParcelAuthority(activeInteractable.parcelLabel) ? "E : 전시 관리" : "E : 전시 보기")
    : activeInteractable.type === "mansionEntry"
      ? (hasMansionOneResidenceAuthority() ? "E : 거주 공간 입장" : "101호 거주권 필요")
    : activeInteractable.type === "mansionBed"
      ? "Space : 취침"
    : activeInteractable.type === "mansionStorage"
      ? "Space : 창고 열기"
    : activeInteractable.type === "mansionExit"
      ? "E : 외부로 나가기"
    : activeInteractable.type === "refinery"
      ? getRefineryHintText()
      : activeInteractable.text;
}

if (!hintText && activeMapGate && !mapTransitionPending) {
  if (!canUseMapGate(activeMapGate)) {
    hintText = activeMapGate.unlockWithItem && hasItem(activeMapGate.unlockWithItem)
      ? `E : ${ITEM_DEFS[activeMapGate.unlockWithItem]?.name ?? "열쇠"} 사용`
      : (activeMapGate.denyText ?? "잠겨 있습니다");
  } else {
    hintText = activeMapGate.hint ?? "";
  }
}

if (
  !hintText &&
  getQuickUseKeyForItemId("freshAirCanister") &&
  hasItem("freshAirCanister") &&
  playerAirCurrent < playerAirMax
) {
  hintText = `${getQuickUseKeyForItemId("freshAirCanister")} : 신선한 공기 캔 사용`;
}

// 6) 최종 출력
if (hintText) showHint(hintText);
else hideHint();

if (
  activeMineRock &&
  hasItem("pickaxe") &&
  hasEquippedTool("pickaxe") &&
  inventory.pickaxeLevel >= (activeMineRock.userData.requiredPickaxeLevel ?? 0)
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
