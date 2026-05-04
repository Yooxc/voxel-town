import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const LAST_PATCHED_AT = "2026-05-04 20:26:34 KST";

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
const MAP_POLLUTION_CONFIG = {
  "폐광맵": {
    displayName: "폐광",
    drainPerSecondAtZeroPurify: 2.25,
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
};

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
let playerSaveSyncInFlight = null;
let lastPlayerSaveSnapshot = "";
let lastPlayerSaveAttemptAt = 0;
let playerSaveSyncPaused = false;
let playerSaveStatusTimer = null;
let lastKnownPlayerSaveUpdatedAt = "";
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
airHudWrap.style.pointerEvents = "none";
airHudWrap.style.zIndex = "1000001";
airHudWrap.style.display = "none";
uiLayer.appendChild(airHudWrap);

const airHudTitle = document.createElement("div");
airHudTitle.textContent = "AIR SUPPORT";
airHudTitle.style.fontWeight = "800";
airHudTitle.style.letterSpacing = "0.06em";
airHudTitle.style.opacity = "0.84";
airHudTitle.style.marginBottom = "8px";
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
  if (address === "dev-mode-local") return "DEV MODE";
  if (address === "guest-local") return "GUEST";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
  ctx.fillRect(42, canvas.height - 114, canvas.width - 84, 54);
  ctx.strokeStyle = "#2a2f37";
  ctx.lineWidth = 4;
  ctx.strokeRect(42, canvas.height - 114, canvas.width - 84, 54);

  ctx.fillStyle = "#1f2730";
  ctx.textAlign = "center";
  ctx.font = "700 28px system-ui";
  ctx.fillText(title, canvas.width * 0.5, canvas.height - 78);
  if (subtitle) {
    ctx.fillStyle = "#5d6a78";
    ctx.font = "600 14px system-ui";
    ctx.fillText(subtitle, canvas.width * 0.5, canvas.height - 58);
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

    const texture = await createBoardImageTexture(
      imageUrl,
      metadata?.name || selectedNft.name || NFT_EXHIBIT_TARGET.title,
      `#${selectedNft.tokenId} · 소유자 확인 완료`
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

function isLocalProfileSession() {
  return walletAuth.address === "dev-mode-local" || isGuestSession();
}

function isServerBackedWalletSession() {
  return walletAuth.authenticated && walletAuth.sessionType === "wallet" && Boolean(walletAuth.token);
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

function updateWalletUi() {
  const loggedIn = walletAuth.authenticated;
  walletLoginOverlay.style.display = loggedIn ? "none" : "flex";
  walletHud.style.display = loggedIn ? "block" : "none";
  walletHudAddress.textContent = loggedIn
    ? `${shortenWalletAddress(walletAuth.address)}`
    : "";
  walletHudChain.textContent = walletAuth.chainId
    ? `체인: ${walletAuth.chainId}`
    : "체인: 확인 전";
  walletHudNickname.textContent = hasNickname()
    ? `닉네임: ${walletProfile.nickname}`
    : "닉네임: 설정 필요";
  walletNicknameInput.value = walletProfile.nickname;
  walletLoginStatus.textContent = loggedIn
    ? isGuestSession()
      ? "게스트 계정으로 입장했습니다."
      : `${shortenWalletAddress(walletAuth.address)} 주소로 로그인되었습니다.`
    : "메타마스크 연결을 기다리는 중입니다.";
  walletDevBypassBtn.style.display = DEV_PRESET_ENABLED ? "inline-flex" : "none";
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

function setWalletAuthState(nextState, { persist = true } = {}) {
  walletAuth.authenticated = Boolean(nextState.authenticated);
  walletAuth.address = nextState.address ?? "";
  walletAuth.signature = nextState.signature ?? "";
  walletAuth.nonce = nextState.nonce ?? "";
  walletAuth.issuedAt = nextState.issuedAt ?? "";
  walletAuth.chainId = nextState.chainId ?? "";
  walletAuth.token = nextState.token ?? "";
  walletAuth.sessionType = nextState.sessionType ?? "";
  if (walletAuth.address === "dev-mode-local") {
    walletProfile.nickname = nextState.nickname ?? "개발자";
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
  lastPlayerSaveSnapshot = "";
  playerSaveSyncPaused = false;
  lastKnownPlayerSaveUpdatedAt = "";
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
      playerSaveSyncPaused = true;
      applyFreshPlayerStartState();
    } else if (isGuestSaved) {
      applyFreshPlayerStartState();
    }
  } catch {
    localStorage.removeItem(WALLET_SESSION_KEY);
  }
}

async function hydrateWalletSessionFromServer() {
  if (
    !walletAuth.authenticated ||
    !walletAuth.token ||
    walletAuth.address === "dev-mode-local" ||
    isGuestSession()
  ) {
    return;
  }

  walletLoginStatus.textContent = "로그인 세션을 확인하는 중입니다...";
  playerSaveSyncPaused = true;
  const meResponse = await apiFetchJson("/auth/me", {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!meResponse.ok) {
    playerSaveSyncPaused = false;
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
  playerSaveSyncPaused = false;
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
    playerSaveSyncPaused = true;
    applyFreshPlayerStartState();
    await hydratePlayerSaveFromServer();
    playerSaveSyncPaused = false;
    walletLoginStatus.textContent = `${shortenWalletAddress(address)} 주소로 서명이 완료되었습니다.`;
  } catch (error) {
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
  setWalletAuthState(
    {
      authenticated: true,
      address: "dev-mode-local",
      signature: "",
      nonce: "",
      issuedAt: new Date().toISOString(),
      chainId: "development",
      sessionType: "dev",
    },
    { persist: false }
  );
});

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

window.addEventListener("keydown", (e) => {
  if (!nftExhibitSelectionOpen) return;
  if (e.key === "Escape") {
    closeNftBoardSelectionOverlay();
  }
});

walletHudLogoutBtn.addEventListener("click", async () => {
  if (isServerBackedWalletSession()) {
    try {
      await pushPlayerSaveToServer();
    } catch {}
  }
  clearWalletSession();
  walletLoginStatus.textContent = "로그아웃되었습니다. 다시 메타마스크로 로그인해주세요.";
});

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

const forgeActions = document.createElement("div");
forgeActions.style.display = "flex";
forgeActions.style.justifyContent = "flex-end";
forgeActions.style.gap = "8px";
forgeBody.appendChild(forgeActions);

const forgeCloseBtn = document.createElement("button");
forgeCloseBtn.textContent = "닫기";
forgeCloseBtn.style.minWidth = "96px";
forgeCloseBtn.style.border = "1px solid rgba(0,0,0,0.18)";
forgeCloseBtn.style.borderRadius = "10px";
forgeCloseBtn.style.padding = "10px 12px";
forgeCloseBtn.style.fontSize = "14px";
forgeCloseBtn.style.cursor = "pointer";
forgeCloseBtn.style.background = "rgba(255,255,255,0.9)";
forgeCloseBtn.style.color = "#333";
forgeActions.appendChild(forgeCloseBtn);

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
        slot.style.cursor = "pointer";

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

// I 키로 인벤 열고닫기
let invOpen = false;
function setInvOpen(v) {
  invOpen = v;
  invWin.style.display = invOpen ? "block" : "none";
  equipWin.style.display = invOpen ? "block" : "none";
  if (!invOpen) hideItemTooltip();
  if (invOpen) renderInventoryWindow();
}

let questOpen = false;
let questDragState = null;
function setQuestOpen(v) {
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
  if (nftExhibitSelectionOpen) return;
  // 입력창 없으니 간단 처리
  const key = e.key.toLowerCase();
  if (key === "i") {
    setInvOpen(!invOpen);
  }
  if (key === "q") {
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
const ROCK_RESPAWN_MS = 10000;
const ROCK_COUNT = 50;
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
  freshAirCanister: {
    name: "신선한 공기 캔",
    icon: "🫧",
    stackMax: 99,
    category: "cons",
    makeInventoryModel: () => buildFreshAirCanisterModel(),
  },
  purifyPowder: {
    name: "정화 가루",
    icon: "✨",
    stackMax: 999,
    category: "misc",
    makeInventoryModel: () => buildPurifyPowderModel(),
  },
  stoneDust: { name: "돌가루", icon: "🪨", stackMax: 999, category: "misc" },
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

let inventoryEntryInstanceSeq = 1;

function createInventoryEntryInstanceId() {
  const seq = inventoryEntryInstanceSeq++;
  return `inv_${Date.now().toString(36)}_${seq.toString(36)}`;
}

function createInventorySlotEntry(itemId, count = 1, extra = {}) {
  const instanceId =
    typeof extra.instanceId === "string" && extra.instanceId.trim()
      ? extra.instanceId
      : createInventoryEntryInstanceId();
  return {
    kind: "item",
    itemId,
    count,
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
      return {
        ...rawSlot,
        kind: "item",
        itemId: rawSlot.itemId,
        count: Number.isFinite(rawSlot.count) ? rawSlot.count : 1,
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
  return getItemTooltipText(getSlotItemId(entry), getSlotItemCount(entry));
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
  { id: "small", label: "작은 돌", scale: 0.8, maxHp: 1 },
  { id: "medium", label: "중간 돌", scale: 1.05, maxHp: 2 },
  { id: "large", label: "큰 돌", scale: 1.3, maxHp: 3 },
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
  pickaxeLevel: 0,
  mineKeyIssued: false,
  abandonedMineUnlocked: false,
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
    if (s && getSlotItemId(s) === id) return i;
  }
  return -1;
	    }

    function getItemCount(id) {
  const idx = findFirstSlotWithItem(id);
  if (idx === -1) return 0;
  return getSlotItemCount(inventory.slots[idx]);
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

	  inventory.slots[empty] = createInventorySlotEntry(id, Math.min(count, def.stackMax));
	  return true;
	    }

    function consumeItem(id, count = 1) {
  const idx = findFirstSlotWithItem(id);
  if (idx === -1) return false;
  const slot = inventory.slots[idx];
  if (!slot || slot.count < count) return false;

  slot.count -= count;
  if (slot.count <= 0) inventory.slots[idx] = null;
  return true;
    }

    function hasEquippedTool(id) {
  return getEquippedItemForSlot("tool") === id;
    }

    function hasItem(id) {
  return findFirstSlotWithItem(id) !== -1;
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
  // (기존 작은 HUD는 숨겼으니 여기서 invEl 텍스트는 안 만듦)
  refreshEquippedPickaxeModel();
  updateEquippedVisual();
  renderEquipmentWindow();
  if (forgeWin.style.display !== "none") renderForgeWindow();

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
  rockHpLabel.textContent = `돌 체력 ${formatStatNumber(hp)}/${formatStatNumber(maxHp)}`;
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
let activeForgeStation = null;
const mapGates = [];
let activeMapGate = null;
let currentMapId = "광산맵";
let lastAnnouncedMapId = currentMapId;
let torchEquipped = false;
let playerAirCurrent = AIR_GAUGE_MAX;
let playerAirMax = AIR_GAUGE_MAX;
let airDepletedNoticeUntil = 0;
const mapPurificationProgress = {
  "폐광맵": 0,
};

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
  const cfg = getMapPollutionConfig(currentMapId);
  if (!cfg) return 0;
  const purifyRatio = getMapPurificationValue(currentMapId) / 100;
  return cfg.drainPerSecondAtZeroPurify * Math.pow(1 - purifyRatio, 1.1);
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

  if (!isPollutedMap()) {
    airHudStatus.textContent = "현재 맵은 호흡 가능한 구역입니다.";
    airHudPurify.textContent = "";
    return;
  }

  const purify = getMapPurificationValue(currentMapId);
  const drain = getCurrentAirDrainPerSecond();
  airHudStatus.textContent = purify >= 100
    ? "정화 완료: 공기 소모 없음"
    : `오염 구역: 초당 ${drain.toFixed(2)} 공기 소모`;
  airHudPurify.textContent = `${getMapPollutionConfig(currentMapId)?.displayName ?? currentMapId} 정화율 ${purify}%`;
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

function getDefaultRefineryRecipe() {
  return REFINERY_RECIPES.purifyPowder;
}

function getRefineryHintText() {
  const recipe = getDefaultRefineryRecipe();
  if (!recipe) return "E : 재련";
  const inputName = ITEM_DEFS[recipe.inputItemId]?.name ?? recipe.inputItemId;
  if (getItemCount(recipe.inputItemId) < recipe.inputCount) {
    return `${inputName} ${recipe.inputCount}개 필요`;
  }
  return `E : ${recipe.label} 재련 (${inputName} ${recipe.inputCount}개)`;
}

function tryUseRefinery() {
  const recipe = getDefaultRefineryRecipe();
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

  updateInventoryUI();
  schedulePlayerSaveSync(true);
  showUI(`${outputName} ${recipe.outputCount}개 재련 완료`, 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function getAirPurifierHintText() {
  const cfg = getMapPollutionConfig("폐광맵");
  const purify = getMapPurificationValue("폐광맵");
  if (!cfg) return "E : 공기 정화탑 가동";
  if (purify >= 100) return `${cfg.displayName} 정화 완료`;
  if (currentMapId !== "폐광맵") return `${cfg.displayName} 정화율 ${purify}%`;
  if (getItemCount("purifyPowder") < cfg.purifierPowderCost) {
    return `정화 가루 ${cfg.purifierPowderCost}개 필요`;
  }
  return `E : 공기 정화탑 가동 (+${cfg.purifierGain}% / 정화 가루 ${cfg.purifierPowderCost})`;
}

function tryUseAirPurifier() {
  const cfg = getMapPollutionConfig("폐광맵");
  if (!cfg) return false;
  const currentPurify = getMapPurificationValue("폐광맵");
  if (currentPurify >= 100) {
    showUI("폐광 공기 정화탑 가동이 이미 완료되었습니다.", 1100);
    lastMessageUntil = performance.now() + 1100;
    return true;
  }
  if (!consumeItem("purifyPowder", cfg.purifierPowderCost)) {
    showUI(`정화 가루 ${cfg.purifierPowderCost}개가 필요합니다.`, 1100);
    lastMessageUntil = performance.now() + 1100;
    return true;
  }
  const nextPurify = Math.min(100, currentPurify + cfg.purifierGain);
  setMapPurificationValue("폐광맵", nextPurify);
  updateInventoryUI();
  updateAirHud();
  schedulePlayerSaveSync(true);
  if (nextPurify >= 100) {
    showUI("폐광 공기 정화탑 가동 완료! 이제 공기를 소모하지 않습니다.", 1400);
    lastMessageUntil = performance.now() + 1400;
  } else {
    showUI(`폐광 정화율 ${nextPurify}%`, 1000);
    lastMessageUntil = performance.now() + 1000;
  }
  return true;
}

function updateAirSystem(dt) {
  if (!canPlayGame()) {
    updateAirHud();
    return;
  }

  if (isPollutedMap(currentMapId)) {
    const purify = getMapPurificationValue(currentMapId);
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

  if (player.position.z <= campDoorThresholdZ) {
    currentMapId = "폐광맵";
    return;
  }

  if (player.position.z >= mineDoorThresholdZ) {
    currentMapId = "광산맵";
  }
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
  if (typeof gate.lockColliderIndex === "number") {
    removeColliderAt(gate.lockColliderIndex);
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
  if (typeof gate.lockColliderIndex !== "number") {
    gate.lockColliderIndex = addCollider(gate.lockBlocker, 1.0);
  }
}

function getForgeDistance() {
  if (!forgeStation?.parent) return Infinity;
  return forgeStation.position.distanceTo(player.position);
}

function setForgeOpen(v) {
  forgeOpen = v;
  forgeOverlay.style.display = forgeOpen ? "block" : "none";
  forgeWin.style.display = forgeOpen ? "block" : "none";
  if (forgeOpen) renderForgeWindow();
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


// Camera controls
camera.position.set(0, 4, 8);
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(player.position).add(new THREE.Vector3(0, 1.0, 0));
controls.minDistance = 3;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minPolarAngle = Math.PI * 0.1;
controls.enablePan = false;

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

refineryStation = buildRefineryStation(
  START_X + 2.18,
  START_Z - 2.32,
  START_FLAT_Y,
  Math.PI * -0.5
);
restPropOnSupport(refineryStation, startStall.top);

const tutorialNpc = makeTutorialNpc(
  START_X,
  START_Z - 5.15,
  0
);

forgeStation = buildForgeAnvil(START_X - 3.0, START_Z + 1.55);
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

const mineGate = buildTravelGate(START_X, START_Z - 51.2, Math.PI, "폐광 입구");
registerWalkableSurface("광산맵", mineGate.userData.walkSurface, 0.45);
buildCampTestArea();
const campGate = buildTravelGate(CAMP_MAP_X, CAMP_MAP_Z + GROUND_SIZE * 0.5 + 1.25, 0, "광산 복귀");
registerWalkableSurface("폐광맵", campGate.userData.walkSurface, 0.45);
buildMapConnectorTunnel(mineGate, campGate);

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

function applyDevPreset() {
  if (!DEV_PRESET_ENABLED) return;

  for (let i = 0; i < inventory.slots.length; i++) {
    inventory.slots[i] = null;
  }

  inventory.pickaxeLevel = Math.max(0, Math.min(DEV_PRESET.pickaxeLevel ?? 0, PICKAXE_UPGRADE_LEVELS.length - 1));
  inventory.mineKeyIssued = Boolean(DEV_PRESET.unlockAbandonedMine);
  inventory.abandonedMineUnlocked = Boolean(DEV_PRESET.unlockAbandonedMine);
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
    setEquippedItem("tool", "pickaxe");
    setEquippedItem("head", "safetyHelmet");
  }

  addItem("freshAirCanister", 2);

  if (typeof DEV_PRESET.stoneDust === "number" && DEV_PRESET.stoneDust > 0) {
    addItem("stoneDust", DEV_PRESET.stoneDust);
  }

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
    if (typeof abandonedMineGate.lockColliderIndex === "number") {
      removeColliderAt(abandonedMineGate.lockColliderIndex);
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

  inventory.pickaxeLevel = 0;
  inventory.mineKeyIssued = false;
  inventory.abandonedMineUnlocked = false;
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
      pickaxeLevel: 0,
      mineKeyIssued: false,
      abandonedMineUnlocked: false,
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
      },
    },
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
      },
    },
    displayBoard: nftExhibitSelectedItem ? structuredClone(nftExhibitSelectedItem) : null,
  };
}

function applySerializedPlayerSave(rawSave) {
  const save = rawSave && typeof rawSave === "object" ? rawSave : createDefaultPlayerSave();
  const source = {
    ...createDefaultPlayerSave(),
    ...save,
    inventory: {
      ...createDefaultPlayerSave().inventory,
      ...(save.inventory ?? {}),
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
  inventory.equipped.head = normalizeEquippedItemRef(source.inventory.equipped.head);
  inventory.equipped.body = normalizeEquippedItemRef(source.inventory.equipped.body);
  inventory.equipped.shoes = normalizeEquippedItemRef(source.inventory.equipped.shoes);
  inventory.equipped.tool = normalizeEquippedItemRef(source.inventory.equipped.tool);

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
  nftExhibitSelectedItem = normalizeNftBoardSelection(source.displayBoard);

  if (inventory.abandonedMineUnlocked) {
    if (typeof abandonedMineGate.lockColliderIndex === "number") {
      removeColliderAt(abandonedMineGate.lockColliderIndex);
      abandonedMineGate.lockColliderIndex = null;
    }
    if (abandonedMineGate.lockBlocker?.parent) {
      abandonedMineGate.lockBlocker.removeFromParent();
    }
  } else {
    restoreLockedMapGate(abandonedMineGate);
  }

  currentMapId = source.mapId === "폐광맵" ? "폐광맵" : "광산맵";
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
    walletLoginStatus.textContent = `저장 데이터 확인 실패: ${saveResponse.error}`;
    setPlayerSaveStatus("저장 불러오기 실패", "error");
    return false;
  }

  const serverSaveEntry = saveResponse.data.save ?? null;
  const serverSave = serverSaveEntry?.data ?? null;
  if (!serverSave) {
    lastKnownPlayerSaveUpdatedAt = "";
    lastPlayerSaveSnapshot = JSON.stringify(serializePlayerSave());
    setPlayerSaveStatus("새로운 저장 데이터", "success");
    return false;
  }

  applySerializedPlayerSave(serverSave);
  lastKnownPlayerSaveUpdatedAt = serverSaveEntry.updatedAt ?? "";
  walletLoginStatus.textContent = "이전 플레이 기록을 불러왔습니다.";
  setPlayerSaveStatus("저장 불러오기 완료", "success");
  return true;
}

async function pushPlayerSaveToServer() {
  if (!isServerBackedWalletSession()) return false;
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
  if (!isServerBackedWalletSession()) return;
  if (playerSaveSyncPaused) return;

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
  if (!isServerBackedWalletSession()) return;
  if (playerSaveSyncPaused) return;
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

function buildAirPurifierStation(x, z, rotationY = Math.PI) {
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
  });
  return g;
}

function buildRefineryStation(x, z, y = START_FLAT_Y, rotationY = 0) {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x59636f,
    roughness: 0.78,
    metalness: 0.22,
  });
  const chamberMat = new THREE.MeshStandardMaterial({
    color: 0x9fd6c3,
    roughness: 0.48,
    metalness: 0.08,
    emissive: 0x3a8b6a,
    emissiveIntensity: 0.18,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xc6ccd6,
    roughness: 0.32,
    metalness: 0.36,
  });

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.28, 0.64),
    frameMat
  );
  base.position.y = 0.14;
  g.add(base);

  const chamber = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.52, 18),
    chamberMat
  );
  chamber.position.set(-0.18, 0.48, 0);
  g.add(chamber);

  const funnel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.18, 0.24, 16),
    accentMat
  );
  funnel.position.set(-0.18, 0.86, 0);
  g.add(funnel);

  const grinder = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.36, 0.28),
    accentMat
  );
  grinder.position.set(0.2, 0.4, 0);
  g.add(grinder);

  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.48, 12),
    accentMat
  );
  pipe.rotation.z = Math.PI * 0.5;
  pipe.position.set(0.02, 0.57, 0);
  g.add(pipe);

  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.05, 0.24),
    frameMat
  );
  tray.position.set(0.22, 0.14, 0);
  g.add(tray);

  const powderJar = buildPurifyPowderModel();
  powderJar.scale.setScalar(0.72);
  powderJar.position.set(0.24, 0.28, 0.14);
  g.add(powderJar);

  g.position.set(x, y, z);
  g.rotation.y = rotationY;
  scene.add(g);
  interactables.push({
    obj: g,
    text: "E : 재련소 사용",
    board: chamber,
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
  const wallBaseY = wallHeight * 0.5 - 0.55;

  const wallDefs = [
    { x: 0, z: -campHalf - wallThickness * 0.22, sx: campSize + 6, sy: wallHeight, sz: wallThickness, ry: 0.02 }, // north
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
  registerWalkableSurface("광산맵", floor, 0.38);
  registerWalkableSurface("폐광맵", floor, 0.38);

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
  registerWalkableSurface("광산맵", mineTransition, 0.4);

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
  registerWalkableSurface("폐광맵", campTransition, 0.4);

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
  if (!canPlayGame()) return;
  if (nftExhibitSelectionOpen) return;
  const k = e.key.toLowerCase();
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

  if (activeInteractable?.type === "refinery") {
    if (tryUseRefinery()) {
      return;
    }
  }

  if (activeInteractable?.type === "airPurifier") {
    if (tryUseAirPurifier()) {
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

  if (k === "r") {
    if (useFreshAirCanister()) {
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
  const k = e.key.toLowerCase();
  if (!canPlayGame()) {
    if (k in keys) keys[k] = false;
    if (k === "shift") keys.shift = false;
    return;
  }
  if (nftExhibitSelectionOpen) {
    if (k in keys) keys[k] = false;
    if (k === "shift") keys.shift = false;
    return;
  }
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
  if (e.code !== "Space") return;
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
  tutorialQuest.minedRockCount += 1;
  addItem("stoneDust", 1);
  const pickaxeStats = getCurrentPickaxeStats();
  if (Math.random() < pickaxeStats.bonusDropChance) {
    addItem("stoneDust", 1);
    showUI("보너스 돌가루 획득!");
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
  updateParticles(dt);
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
    activeTutorialNpc = findNearestTutorialNpc(2.2);
    activeMapGate = findTriggeredMapGate();

    if (forgeStation?.parent && getForgeDistance() < 2.4) {
  activeForgeStation = forgeStation;
    }

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

// 4) 돌 채집 힌트 (아이템 줍기 힌트가 없을 때만)
if (!hintText) {
  activeMineRock = findNearestMineRock(2.2);
  if (activeMineRock) {
    hintText = "Space : 채굴";
  }
}

// 5) 표지판 근접 문구 (위 힌트가 없을 때만)
if (!hintText && activeInteractable) {
  hintText = activeInteractable.type === "airPurifier"
    ? getAirPurifierHintText()
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

if (!hintText && isPollutedMap(currentMapId) && hasItem("freshAirCanister") && playerAirCurrent < playerAirMax) {
  hintText = "R : 신선한 공기 캔 사용";
}

// 6) 최종 출력
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
