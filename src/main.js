import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  QUICK_USE_ALLOWED_KEYS,
  INVENTORY_STACK_LIMIT,
  FRONTIER_PARCEL_LABELS,
  FRONTIER_AUTHORITY_ITEM_IDS,
  DEV_MOCK_NFT_ITEMS,
  createItemDefs,
  getDevMaterialItemIds as getDevMaterialItemIdsFromDefs,
  getDevBulkGrantItemIds as getDevBulkGrantItemIdsFromDefs,
  createInventoryEntryInstanceId as createInventoryEntryInstanceIdFromItems,
  getInventoryStackMax as getInventoryStackMaxFromItems,
  createInventorySlotEntry as createInventorySlotEntryFromItems,
  normalizeInventorySlotEntry as normalizeInventorySlotEntryFromItems,
  createEquippedItemRef as createEquippedItemRefFromItems,
  normalizeEquippedItemRef as normalizeEquippedItemRefFromItems,
  getSlotItemId,
  getSlotItemCount,
  isNftInventoryEntry,
  isSameInventoryEntryAsEquipped,
  getInventoryEntryCategory as getInventoryEntryCategoryFromItems,
  getInventoryEntryEquipSlot as getInventoryEntryEquipSlotFromItems,
  getInventoryEntryDisplayName as getInventoryEntryDisplayNameFromItems,
  getInventoryEntryDisplayIcon as getInventoryEntryDisplayIconFromItems,
  getInventoryEntryTooltipData as getInventoryEntryTooltipDataFromItems,
} from "./systems/items.js";
import {
  createDefaultSharedWorldSave as createDefaultSharedWorldSaveFromModule,
  serializeSharedWorldStateData,
  normalizeSharedWorldStateData,
  createDefaultPlayerSave as createDefaultPlayerSaveFromModule,
  serializePlayerSaveData,
  buildNormalizedPlayerSaveSource,
} from "./save/playerSave.js";
import {
  createInitialWalletAuthState,
  createInitialWalletProfile,
  shortenWalletAddress as shortenWalletAddressFromModule,
  sanitizeDevProfileId as sanitizeDevProfileIdFromWallet,
  getDevProfileDisplayName as getDevProfileDisplayNameFromWallet,
  serializeWalletSession as serializeWalletSessionFromModule,
  parseStoredWalletSession,
  isGuestSessionState,
  isDevSessionState,
  isWalletAuthenticatedState,
  isServerBackedWalletSessionState,
  formatWalletChainLabel,
} from "./auth/wallet.js";
import {
  createInitialInventoryState as createInitialInventoryStateFromModule,
  createInitialPersonalStorageState as createInitialPersonalStorageStateFromModule,
  createQuickUseBinding as createQuickUseBindingFromModule,
  normalizeQuickUseBinding as normalizeQuickUseBindingFromModule,
  getQuickUseBinding as getQuickUseBindingFromModule,
  getQuickUseItemId as getQuickUseItemIdFromModule,
  clearQuickUseBindingForItemId as clearQuickUseBindingForItemIdFromModule,
  assignQuickUseKeyToItem as assignQuickUseKeyToItemFromModule,
  getQuickUseKeyForItemId as getQuickUseKeyForItemIdFromModule,
  findInventorySlotIndexByEntry as findInventorySlotIndexByEntryFromModule,
  getInventorySlotEntryByEntry as getInventorySlotEntryByEntryFromModule,
  findFirstEmptySlot as findFirstEmptySlotFromModule,
  findFirstSlotWithItem as findFirstSlotWithItemFromModule,
  getItemCount as getItemCountFromModule,
  createPartialInventoryEntry as createPartialInventoryEntryFromModule,
  addEntryToStorage as addEntryToStorageFromModule,
  addEntryToInventory as addEntryToInventoryFromModule,
  moveInventoryEntryToStorage as moveInventoryEntryToStorageFromModule,
  moveStorageEntryToInventory as moveStorageEntryToInventoryFromModule,
  addItem as addItemFromModule,
  consumeItem as consumeItemFromModule,
  hasItem as hasItemFromModule,
  getEquippedItemRef as getEquippedItemRefFromModule,
  getEquippedItemForSlot as getEquippedItemForSlotFromModule,
  setEquippedItem as setEquippedItemFromModule,
  equipFirstOwnedInventoryItem as equipFirstOwnedInventoryItemFromModule,
} from "./systems/inventory.js";
import {
  createInventoryWindowUi,
  makeInventorySlotElement,
} from "./ui/inventoryWindow.js";
import {
  renderFrontierBuildWindowUi,
  renderFrontierBoothDialogUi,
} from "./ui/frontierUi.js";
import {
  createHudUi,
  updatePlayerSaveStatusBadgeUi,
  hidePlayerSaveStatusBadgeUi,
  showHudMessageUi,
  hideHudMessageUi,
  showMapArrivalBannerUi,
  hideMapArrivalBannerUi,
  updateCompassUi,
  updateAirHudUi,
} from "./ui/hud.js";
import {
  getKeyInputCode,
  getLogicalInputKey,
  getMovementSpeed,
  getWalkAnimationSpeed,
  buildMoveVector,
  isMoveVectorActive,
  normalizeMoveVector,
  updateLatestMoveDirection,
  getMovementDelta,
  getMovementYaw,
  getMovementBasisVectors,
  getFacingDirectionFromYaw,
  getCompassDirection,
} from "./core/movement.js";
import {
  getPlayerBoxFromPosition,
  intersectsAnyColliderBox,
  hasPlayerOverlapWithColliderObjects,
  getCurrentMapBoundsFromSurfaces,
  isInsideMapBoundsFromSurfaces,
  applyMovementCollisionStep,
  applyMovementPostCollisionCorrections,
} from "./core/collisions.js";
import {
  createPlayerRig,
  getPlayerRigParts,
  createPlayerEquipmentVisuals,
  updatePlayerEquipmentVisualsVisibility,
  applySleepPose,
  applyWalkIdlePose,
  applyMiningSwingPose,
  applyPickupReachPose,
  syncPreviewPlayerPose,
} from "./core/player.js";
import {
  createMainScene,
  applyMainSceneAtmosphere,
  createMainLights,
  createMainCamera,
  createMainRenderer,
  createMainGridHelper,
  createMainCameraViewportState,
  syncMainViewport,
  syncMainCameraAspect,
} from "./core/scene.js";
import {
  hasMansionOneResidenceAuthority as hasMansionOneResidenceAuthorityFromModule,
  hasMansionPersonalStorageAuthority as hasMansionPersonalStorageAuthorityFromModule,
  getOwnedMansionRoomKey as getOwnedMansionRoomKeyFromModule,
  getOwnedMansionRoomPermitName as getOwnedMansionRoomPermitNameFromModule,
  destroyMansionRoomInstance as destroyMansionRoomInstanceFromModule,
  createMansionRoomInstance as createMansionRoomInstanceFromModule,
} from "./systems/residence.js";
import {
  TREE_HARVEST_RESPAWN_MS,
  PICKAXE_UPGRADE_LEVELS,
  ROCK_SIZE_DEFS,
  clampPickaxeLevel,
  getCurrentPickaxeStats as getCurrentPickaxeStatsFromModule,
  getNextPickaxeUpgrade as getNextPickaxeUpgradeFromModule,
  getForgeUpgradeStateData,
  getMiningPowerForTool,
  getRockSizeDefById,
  getRockDefaultResourceCount,
  getHarvestTreeCooldownUntil,
  isHarvestTreeReady,
  getHarvestTreeRegrowthProgress,
  getHarvestTreeShakeRotation,
} from "./systems/mining.js";
import {
  AIR_GAUGE_MAX,
  AIR_CANISTER_RESTORE_AMOUNT,
  AIR_RECOVERY_PER_SECOND,
  MAP_POLLUTION_CONFIG,
  getMapPollutionConfig as getMapPollutionConfigFromModule,
  isPollutedMap as isPollutedMapFromModule,
  getMapPurificationValue as getMapPurificationValueFromModule,
  setMapPurificationValue as setMapPurificationValueFromModule,
  resetAllMapPurificationValues as resetAllMapPurificationValuesFromModule,
  getCurrentAirDrainPerSecond as getCurrentAirDrainPerSecondFromModule,
  canRecoverAirInMap as canRecoverAirInMapFromModule,
  getMapPollutionVisualStrength as getMapPollutionVisualStrengthFromModule,
  getAirOverlayVisualState,
  updateAirValueForFrame,
} from "./systems/air.js";
import {
  RESIDENCE_MAP_ID,
  GROUND_SIZE,
  FRONTIER_GROUND_SIZE,
  START_X,
  START_Z,
  START_RING_OPEN_RATIO,
  START_RING_OPEN_CENTER,
  START_RING_THICKNESS,
  CAMP_MAP_X,
  CAMP_MAP_Z,
  FRONTIER_MAP_X,
  FRONTIER_MAP_Z,
  MAP_GATE_RADIUS,
  createStartRingRuleHelpers,
  isPlayerPositionInConnectorTunnel,
  getEffectiveAirMapIdForPlayer,
  getCurrentMapIdForPlayer,
  buildMinePerimeterCliffs,
  buildTravelGate,
  buildCampTestArea,
  buildFrontierArea as buildFrontierAreaFromMaps,
} from "./systems/maps.js";
import {
  FRONTIER_BUILDING_HEIGHT,
  FRONTIER_BUILDING_SIGN_MAX_CHARS,
  FRONTIER_BUILD_STAGE_CONFIG,
  getFrontierParcelAuthorityItemId as getFrontierParcelAuthorityItemIdFromModule,
  createDefaultFrontierBuildState as createDefaultFrontierBuildStateFromModule,
  createDefaultFrontierParcelBuildEntry as createDefaultFrontierParcelBuildEntryFromModule,
  createDefaultFrontierParcelOperationsState as createDefaultFrontierParcelOperationsStateFromModule,
  createDefaultFrontierShopState as createDefaultFrontierShopStateFromModule,
  createDefaultFrontierDisplayState as createDefaultFrontierDisplayStateFromModule,
  normalizeFrontierWalletAddress as normalizeFrontierWalletAddressFromModule,
  formatFrontierShopStatusText as formatFrontierShopStatusTextFromModule,
  formatFrontierDisplayStatusText as formatFrontierDisplayStatusTextFromModule,
  getFrontierDisplaySummary as getFrontierDisplaySummaryFromModule,
  getFrontierShopListingSummary as getFrontierShopListingSummaryFromModule,
  normalizeFrontierBuildState as normalizeFrontierBuildStateFromModule,
  getFrontierNextStageConfig as getFrontierNextStageConfigFromModule,
  isFrontierShopSlotUser as isFrontierShopSlotUserFromModule,
  isFrontierShopSeller as isFrontierShopSellerFromModule,
  canManageFrontierShopSellerTools as canManageFrontierShopSellerToolsFromModule,
  canRegisterFrontierShopListing as canRegisterFrontierShopListingFromModule,
  canCollectFrontierShopSettlement as canCollectFrontierShopSettlementFromModule,
  isFrontierDisplaySlotUser as isFrontierDisplaySlotUserFromModule,
  getFrontierCurrentParcelLabel as getFrontierCurrentParcelLabelFromModule,
  getFrontierSelectedParcelLabel as getFrontierSelectedParcelLabelFromModule,
  getFrontierBuildStateEntry as getFrontierBuildStateEntryFromModule,
  getFrontierShopOperation as getFrontierShopOperationFromModule,
  getFrontierDisplayOperation as getFrontierDisplayOperationFromModule,
  getFrontierShopAssignedWallet as getFrontierShopAssignedWalletFromModule,
  getFrontierShopSellerWallet as getFrontierShopSellerWalletFromModule,
  getFrontierDisplayAssignedWallet as getFrontierDisplayAssignedWalletFromModule,
  canManageFrontierShopSlot as canManageFrontierShopSlotFromModule,
  canUseFrontierShopSlot as canUseFrontierShopSlotFromModule,
  canEditFrontierShopListing as canEditFrontierShopListingFromModule,
  canManageFrontierDisplaySlot as canManageFrontierDisplaySlotFromModule,
  canUseFrontierDisplaySlot as canUseFrontierDisplaySlotFromModule,
  isFrontierDisplayableEntry as isFrontierDisplayableEntryFromModule,
  getDisplayableFrontierEntries as getDisplayableFrontierEntriesFromModule,
  getFrontierShopPurchaseFeedback as getFrontierShopPurchaseFeedbackFromModule,
  formatFrontierShopUserDisplay as formatFrontierShopUserDisplayFromModule,
  canAssignFrontierDisplayEntryState as canAssignFrontierDisplayEntryStateFromModule,
  assignFrontierDisplayEntryState as assignFrontierDisplayEntryStateFromModule,
  canClearFrontierDisplayEntryState as canClearFrontierDisplayEntryStateFromModule,
  clearFrontierDisplayEntryState as clearFrontierDisplayEntryStateFromModule,
  canAssignFrontierDisplaySlotUserState as canAssignFrontierDisplaySlotUserStateFromModule,
  assignFrontierDisplaySlotUserState as assignFrontierDisplaySlotUserStateFromModule,
  canClearFrontierDisplaySlotUserState as canClearFrontierDisplaySlotUserStateFromModule,
  clearFrontierDisplaySlotUserState as clearFrontierDisplaySlotUserStateFromModule,
  getCollectFrontierShopSettlementState as getCollectFrontierShopSettlementStateFromModule,
  applyCollectedFrontierShopSettlementState as applyCollectedFrontierShopSettlementStateFromModule,
  getFrontierParcelSafeStandingPoint as getFrontierParcelSafeStandingPointFromModule,
} from "./systems/frontier.js";

const LAST_PATCHED_AT = "2026-05-27 18:00:24 KST";

const scene = createMainScene();
// ===== Atmosphere: Sky / Fog =====
const WORLD_FOG_COLOR = 0xd6d8db;
const CAVE_FOG_COLOR = 0x120e0b;
const WORLD_FOG_NEAR = 15;
const WORLD_FOG_FAR = 60;
const CAVE_DARKENING_ENABLED = false;
const CAVE_FOG_EFFECT_ENABLED = false;
applyMainSceneAtmosphere(scene, {
  initialBackgroundColor: 0xd6d8db,
  fogColor: WORLD_FOG_COLOR,
  fogNear: WORLD_FOG_NEAR,
  fogFar: WORLD_FOG_FAR,
  finalBackgroundColor: 0xaad7ff,
});

const CAVE_POLLUTION_PARTICLE_COUNT = 360;
const CAVE_POLLUTION_PARTICLE_SWAY = 0.12;
const CAVE_POLLUTION_OVERLAY_MAX_OPACITY = 0.96;
const LOW_AIR_EDGE_BLUR_MAX_PX = 26;
const AIR_HUD_POSITION_KEY = "excit_air_hud_position_v1";
const SHIFT_CAMERA_ROTATE_SENSITIVITY = 0.0062;
const FRONTIER_PARCEL_BORDER_COLOR = 0xf3b24e;
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

const RESIDENCE_NOTICE_BOARD_KEYS = ["boardA", "boardB", "boardC"];

// ===== Lighting =====
const { ambientLight, sunLight, torchLight } = createMainLights(scene);

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

const camera = createMainCamera();
const renderer = createMainRenderer();
document.body.style.margin = "0";
// === Three.js 캔버스 (바닥 레이어) ===
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

const {
  patchInfoWrap,
  airHudWrap,
  airHudTitle,
  airHudValue,
  airHudBarTrack,
  airHudBarFill,
  airHudStatus,
  airHudPurify,
  playerSaveStatusBadge,
  compassWrap,
  compassTitle,
  compassFace,
  compassNeedle,
  compassText,
  ui,
  mapArrivalBanner,
} = createHudUi({
  uiLayer,
  lastPatchedAt: LAST_PATCHED_AT,
});

const WALLET_SESSION_KEY = "voxel-town.wallet-auth.v1";
const DEV_ACTIVE_PROFILE_KEY = "voxel-town.dev-active-profile.v1";
const DEV_PROFILE_SAVE_PREFIX = "voxel-town.dev-profile-save.v1.";
const DEV_CREDITS_MIGRATION_PREFIX = "voxel-town.dev-credits-migrated.v1.";
const DEV_PROFILE_FAILED_LOAD_PREFIX = "voxel-town.dev-profile-load-error.v1.";
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
const walletAuth = createInitialWalletAuthState();
const walletProfile = createInitialWalletProfile();
const PLAYER_CURRENCY_NAME = "개척 코인";
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
let residenceNoticeBoardState = createDefaultResidenceNoticeBoardState();
const residenceNoticeBoardVisuals = {};
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
let equipProfileCredits = null;
let equipProfileLogoutBtn = null;
let equipProfileCopyBtn = null;

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

const devResetButton = document.createElement("button");
devResetButton.type = "button";
devResetButton.textContent = "테스트 초기화";
devResetButton.style.padding = "8px 12px";
devResetButton.style.borderRadius = "999px";
devResetButton.style.border = "1px solid rgba(255,255,255,0.16)";
devResetButton.style.background = "rgba(255,255,255,0.08)";
devResetButton.style.color = "white";
devResetButton.style.fontSize = "12px";
devResetButton.style.fontWeight = "800";
devResetButton.style.cursor = "pointer";
devResetButton.style.pointerEvents = "auto";
devProfileSwitcher.appendChild(devResetButton);

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
  return shortenWalletAddressFromModule(address);
}

function getDevProfileDisplayName(profileId = activeDevProfileId) {
  return getDevProfileDisplayNameFromWallet(profileId, DEV_PROFILE_IDS, DEV_PROFILE_IDS[0]);
}

function sanitizeDevProfileId(profileId) {
  return sanitizeDevProfileIdFromWallet(profileId, DEV_PROFILE_IDS, DEV_PROFILE_IDS[0]);
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

function isWorkUiMovementLocked() {
  return (
    personalStorageOpen ||
    !!personalStorageTransferState ||
    frontierBuildOpen ||
    frontierBoothOpen ||
    frontierShopRegisterOpen ||
    refineryOpen ||
    forgeOpen
  );
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
  if (save) {
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
  const serialized = serializeWalletSessionFromModule(walletAuth);
  if (!serialized) {
    localStorage.removeItem(WALLET_SESSION_KEY);
    return;
  }
  localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify(serialized));
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
  return isGuestSessionState(walletAuth);
}

function isDevSession() {
  return isDevSessionState(walletAuth);
}

function isLocalProfileSession() {
  return isDevSession() || isGuestSession();
}

function isServerBackedWalletSession() {
  return isServerBackedWalletSessionState(walletAuth);
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
  return createDefaultSharedWorldSaveFromModule({
    createDefaultFrontierBuildState,
    mapPollutionConfig: MAP_POLLUTION_CONFIG,
    createDefaultResidenceNoticeBoardState,
  });
}

function serializeSharedWorldState() {
  return serializeSharedWorldStateData({
    frontierBuildState,
    abandonedMineUnlocked: inventory.abandonedMineUnlocked,
    mapPollutionConfig: MAP_POLLUTION_CONFIG,
    getMapPurificationValue,
    nftExhibitSelectedItem,
    residenceNoticeBoardState,
  });
}

function normalizeSharedWorldState(rawWorld) {
  return normalizeSharedWorldStateData(rawWorld, {
    createDefaultSharedWorldSave,
    normalizeFrontierBuildState,
    normalizeNftBoardSelection,
    normalizeResidenceNoticeBoardState,
  });
}

function applySharedWorldState(rawWorld) {
  const world = normalizeSharedWorldState(rawWorld);
  frontierBuildState = normalizeFrontierBuildState(world.frontierBuild);
  inventory.abandonedMineUnlocked = Boolean(world.abandonedMineUnlocked);
  for (const mapId of Object.keys(MAP_POLLUTION_CONFIG)) {
    setMapPurificationValue(mapId, Number(world.mapPurification?.[mapId]) || 0);
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
  } else {
    restoreLockedMapGate(abandonedMineGate);
  }
  nftExhibitSelectedItem = normalizeNftBoardSelection(world.displayBoard);
  residenceNoticeBoardState = normalizeResidenceNoticeBoardState(world.residenceNoticeBoards);
  rebuildAllFrontierConstructionVisuals();
  renderResidenceNoticeBoards();
  scheduleNftExhibitBoardRefresh();
}

function saveActiveLocalProfileState() {
  const saveKey = getActivePlayerSaveKey();
  if (!saveKey) return false;
  try {
    const snapshot = serializePlayerSave();
    delete snapshot.frontierBuild;
    if (isDevSession()) {
      delete snapshot.displayBoard;
    }
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
    hidePlayerSaveStatusBadgeUi(playerSaveStatusBadge);
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
  updatePlayerSaveStatusBadgeUi(playerSaveStatusBadge, {
    text,
    borderColor: style.border,
    color: style.color,
    visible: isServerBackedWalletSession(),
  });
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
  if (equipProfileCredits) {
    equipProfileCredits.textContent = formatPlayerCreditsLabel();
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
  return isWalletAuthenticatedState(walletAuth);
}

function shouldResetAuthSessionOnLocalReload() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function restoreWalletSession() {
  const raw = localStorage.getItem(WALLET_SESSION_KEY);
  const saved = parseStoredWalletSession(raw);
  if (!saved) {
    if (raw) {
      localStorage.removeItem(WALLET_SESSION_KEY);
    }
    return;
  }
  try {
    setWalletAuthState(saved, { persist: false });
    if (saved?.sessionType === "wallet") {
      beginPlayerSaveHydration();
      applyFreshPlayerStartState();
    } else if (saved?.sessionType === "guest" || saved?.address === "guest-local") {
      applyFreshPlayerStartState();
    }
  } catch {
    localStorage.removeItem(WALLET_SESSION_KEY);
  }
}

function loadActiveLocalProfileState() {
  const saveKey = getActivePlayerSaveKey();
  if (!saveKey) return false;
  const failedLoadKey = `${DEV_PROFILE_FAILED_LOAD_PREFIX}${sanitizeDevProfileId(activeDevProfileId)}`;
  const raw = localStorage.getItem(saveKey);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    try {
      applySerializedPlayerSave(parsed, { preserveSharedWorld: isDevSession() });
    } catch (error) {
      localStorage.setItem(
        failedLoadKey,
        JSON.stringify({
          failedAt: new Date().toISOString(),
          saveKey,
          raw,
          reason: String(error?.message ?? error ?? "unknown"),
        })
      );
      console.error("DEV PROFILE LOAD APPLY FAILED:", error);
      return "apply_error";
    }
    localStorage.removeItem(failedLoadKey);
    if (isDevSession() && !Number.isFinite(parsed?.economy?.credits)) {
      setPlayerCredits(500);
    }
    return "loaded";
  } catch {
    localStorage.setItem(
      failedLoadKey,
      JSON.stringify({
        failedAt: new Date().toISOString(),
        saveKey,
        raw,
        reason: "parse_error",
      })
    );
    localStorage.removeItem(saveKey);
    return "parse_error";
  }
}

function getDevCreditsMigrationKey(profileId = activeDevProfileId) {
  return `${DEV_CREDITS_MIGRATION_PREFIX}${sanitizeDevProfileId(profileId)}`;
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
  const loadState = loadActiveLocalProfileState();
  if (loadState === "apply_error") {
    applyFreshPlayerStartState();
    applySharedWorldState(sharedWorld);
    applyDevPreset();
    walletLoginStatus.textContent = `${getDevProfileDisplayName(activeDevProfileId)} 저장본 적용 중 오류가 발생해 임시 프리셋으로 입장했습니다.`;
    showUI("개발자 저장본 복원 중 오류가 발생했습니다.", 1300);
    lastMessageUntil = performance.now() + 1300;
  } else if (loadState !== "loaded") {
    applyFreshPlayerStartState();
    applySharedWorldState(sharedWorld);
    applyDevPreset();
    saveActiveLocalProfileState();
    saveSharedWorldStateToLocal();
  }
  const creditsMigrationKey = getDevCreditsMigrationKey(activeDevProfileId);
  if (isDevSession() && !localStorage.getItem(creditsMigrationKey) && getPlayerCredits() === 0) {
    setPlayerCredits(500);
    saveActiveLocalProfileState();
  }
  localStorage.setItem(creditsMigrationKey, "1");
  applyDevProfileRoleOverrides();
  saveActiveLocalProfileState();
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

function writeDevProfilePresetSnapshot(profileId) {
  const targetProfileId = sanitizeDevProfileId(profileId);
  activeDevProfileId = targetProfileId;
  setWalletAuthState(
    {
      authenticated: true,
      address: targetProfileId,
      signature: "",
      nonce: "",
      issuedAt: new Date().toISOString(),
      chainId: "development",
      token: "",
      sessionType: "dev",
      nickname: getDevProfileDisplayName(targetProfileId),
      devProfileId: targetProfileId,
    },
    { persist: false }
  );
  applyFreshPlayerStartState();
  applySharedWorldState(createDefaultSharedWorldSave());
  applyDevPreset();
  applyDevProfileRoleOverrides();
  saveActiveLocalProfileState();
  localStorage.setItem(getDevCreditsMigrationKey(targetProfileId), "1");
}

function resetDevTestingEnvironment() {
  if (!isDevSession()) return false;
  const currentProfileId = sanitizeDevProfileId(activeDevProfileId);
  const blankWorld = createDefaultSharedWorldSave();
  for (const profileId of DEV_PROFILE_IDS) {
    writeDevProfilePresetSnapshot(profileId);
  }
  localStorage.setItem(DEV_SHARED_WORLD_KEY, JSON.stringify(blankWorld));
  localStorage.setItem(DEV_ACTIVE_PROFILE_KEY, currentProfileId);
  initializeDevProfileState(currentProfileId);
  showUI("개발자 테스트 환경을 초기화했습니다.", 1200);
  lastMessageUntil = performance.now() + 1200;
  return true;
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

devResetButton.addEventListener("click", () => {
  if (!isDevSession()) return;
  const confirmed = window.confirm(
    "개발자 테스트 월드를 초기화할까요?\n개발자1/개발자2 상태와 개척지 월드 상태가 초기값으로 돌아갑니다."
  );
  if (!confirmed) return;
  resetDevTestingEnvironment();
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

// ===== Inventory Window (Tabs + Grid) =====
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

let activeTab = "cons";
const {
  invWin,
  equipWin,
  previewCanvasWrap,
  equipmentSlotEls,
  equipProfileLogoutBtn: builtEquipProfileLogoutBtn,
  equipProfileCopyBtn: builtEquipProfileCopyBtn,
  equipProfileAddress: builtEquipProfileAddress,
  equipProfileChain: builtEquipProfileChain,
  equipProfileNickname: builtEquipProfileNickname,
  equipProfileCredits: builtEquipProfileCredits,
  tabButtons,
  tabs,
  invgrid,
  inventoryTrashDropZone,
  discardOverlay,
  discardDialog,
  discardItemLabel,
  discardOwnedCount,
  discardInputLabel,
  discardCountInput,
  discardError,
  personalStorageOverlay: builtPersonalStorageOverlay,
  personalStorageWin: builtPersonalStorageWin,
  personalStorageMessage,
  personalStorageTransferCurtain,
  personalStorageTransferDialog,
  personalStorageTransferTitle,
  personalStorageTransferItemLabel,
  personalStorageTransferOwnedCount,
  personalStorageTransferCountInput,
  personalStorageTransferError,
  inventoryStoragePanel,
  personalStoragePanel,
} = createInventoryWindowUi({
  uiLayer,
  onWalletLogout: handleWalletLogout,
  onWalletCopy: () => {
    void copyWalletAddressToClipboard();
  },
  onTabChange: (tabId) => {
    activeTab = tabId;
    renderInventoryWindow();
  },
  onTrashDragOver: (event) => {
    if (!inventoryDraggedEntry) return;
    event.preventDefault();
    inventoryTrashDropZone.style.background = "rgba(255,231,214,0.96)";
    inventoryTrashDropZone.style.borderColor = "rgba(232,120,66,0.9)";
    inventoryTrashDropZone.style.transform = "scale(1.01)";
  },
  onTrashDragLeave: () => {
    inventoryTrashDropZone.style.background = "rgba(255,255,255,0.72)";
    inventoryTrashDropZone.style.borderColor = "rgba(120,120,120,0.38)";
    inventoryTrashDropZone.style.transform = "scale(1)";
  },
  onTrashDrop: (event) => {
    event.preventDefault();
    inventoryTrashDropZone.style.background = "rgba(255,255,255,0.72)";
    inventoryTrashDropZone.style.borderColor = "rgba(120,120,120,0.38)";
    inventoryTrashDropZone.style.transform = "scale(1)";
    const entry = inventoryDraggedEntry;
    inventoryDraggedEntry = null;
    if (!entry) return;
    openDiscardDialog(entry);
  },
  onDiscardOverlayClick: closeDiscardDialog,
  onDiscardCancel: closeDiscardDialog,
  onDiscardConfirm: commitDiscardDialog,
  onDiscardKeyDown: (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDiscardDialog();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeDiscardDialog();
    }
  },
  onPersonalStorageOverlayClick: () => setPersonalStorageOpen(false),
  onPersonalStorageClose: () => setPersonalStorageOpen(false),
  onPersonalStorageCurtainClick: () => closePersonalStorageTransferDialog(),
  onPersonalStorageTransferCancel: () => closePersonalStorageTransferDialog(),
  onPersonalStorageTransferConfirm: () => commitPersonalStorageTransferDialog(),
  onPersonalStorageTransferKeyDown: (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitPersonalStorageTransferDialog();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closePersonalStorageTransferDialog();
    }
  },
});
equipProfileLogoutBtn = builtEquipProfileLogoutBtn;
equipProfileCopyBtn = builtEquipProfileCopyBtn;
equipProfileAddress = builtEquipProfileAddress;
equipProfileChain = builtEquipProfileChain;
equipProfileNickname = builtEquipProfileNickname;
equipProfileCredits = builtEquipProfileCredits;
personalStorageOverlay = builtPersonalStorageOverlay;
personalStorageWin = builtPersonalStorageWin;

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


function makeSlot() {
  return makeInventorySlotElement();
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
      const tooltipData = getInventoryEntryTooltipData(item);
      slot.addEventListener("pointerenter", (e) => {
        showItemTooltip(tooltipData, e.clientX, e.clientY);
      });
      slot.addEventListener("pointermove", (e) => {
        showItemTooltip(tooltipData, e.clientX, e.clientY);
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
    const tooltipData = getInventoryEntryTooltipData(entry);
    slotEl.addEventListener("pointerenter", (e) => showItemTooltip(tooltipData, e.clientX, e.clientY));
    slotEl.addEventListener("pointermove", (e) => showItemTooltip(tooltipData, e.clientX, e.clientY));
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
itemTooltip.style.zIndex = "1000002";
itemTooltip.style.display = "none";

const itemTooltipTitle = document.createElement("div");
Object.assign(itemTooltipTitle.style, {
  fontSize: "13px",
  fontWeight: "900",
  color: "#ffd27a",
  marginBottom: "6px",
});
itemTooltip.appendChild(itemTooltipTitle);

const itemTooltipBody = document.createElement("div");
Object.assign(itemTooltipBody.style, {
  whiteSpace: "pre-line",
});
itemTooltip.appendChild(itemTooltipBody);

uiLayer.appendChild(itemTooltip);

function showItemTooltip(data, clientX, clientY) {
  if (!data) return;
  itemTooltipTitle.textContent = data.title || "";
  itemTooltipBody.textContent = Array.isArray(data.lines) ? data.lines.join("\n") : "";
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
  // 기존 타이머 취소
  if (hudTimer) {
    clearTimeout(hudTimer);
    hudTimer = null;
  }

  // 즉시 보이기(툭 올라오면서)
  showHudMessageUi(ui, text);

  // ms 후 자동으로 사라짐
  hudTimer = setTimeout(() => {
    hideUI();
  }, ms);
}

function hideUI() {
  hideHudMessageUi(ui);
}

let mapArrivalTimer = null;

function showMapArrivalBanner(mapName, ms = 1800) {
  showMapArrivalBannerUi(mapArrivalBanner, mapName);

  if (mapArrivalTimer) {
    clearTimeout(mapArrivalTimer);
    mapArrivalTimer = null;
  }

  mapArrivalTimer = setTimeout(() => {
    hideMapArrivalBannerUi(mapArrivalBanner);
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
const GROUND_SEG = 80;       // 세그먼트가 많을수록 울퉁불퉁이 자연스러움
const HEIGHT = 0.8;          // 울퉁불퉁 강도 (너무 크면 걸을 때 어색해짐)

// ===== Starting Zone =====
const START_RADIUS = 5.0;     // 네가 말한 반경 5m
const START_SMOOTH = 1.8;     // 경계 부드럽게 이어지는 폭(1~3 추천)
const START_FLAT_Y = 0.0;     // 스타팅 존 바닥 높이
const START_WALL_ON = false;  // start ring 비활성화
const START_WALL_VISIBLE = true; // 띠를 실제로 보이게
const START_HARD_CLAMP = false; // 하드 클램프는 끄고 벽 충돌로만 제어
const START_RING_SEG = 36;
const START_RING_HEIGHT = 1.1; // 허리춤 정도
const DEV_PRESET_ENABLED = true;
patchInfoWrap.style.display = DEV_PRESET_ENABLED ? "block" : "none";
const DEV_PRESET = {
  startMapId: "폐광",
  completeTutorial: true,
  unlockAbandonedMine: true,
  giveStarterGear: true,
  pickaxeLevel: 5,
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
const residenceMapZones = [];

function registerWalkableSurface(mapId, mesh, padding = 0.55) {
  if (!mesh) return;
  const entries = walkableMapSurfaces.get(mapId) ?? [];
  const entry = { mesh, padding };
  entries.push(entry);
  walkableMapSurfaces.set(mapId, entries);
  return entry;
}

function registerResidenceMapZone(centerX, centerZ, width, depth) {
  const zone = {
    minX: centerX - width * 0.5,
    maxX: centerX + width * 0.5,
    minZ: centerZ - depth * 0.5,
    maxZ: centerZ + depth * 0.5,
  };
  residenceMapZones.push(zone);
  return zone;
}

function isPlayerInResidenceMapZone() {
  return residenceMapZones.some((zone) =>
    player.position.x >= zone.minX &&
    player.position.x <= zone.maxX &&
    player.position.z >= zone.minZ &&
    player.position.z <= zone.maxZ
  );
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
registerWalkableSurface("광산", ground, 1.4);


const gridHelper = createMainGridHelper();
scene.add(gridHelper);

// Player
const player = createPlayerRig();
const {
  torso,
  head,
  leftArmPivot,
  rightArmPivot,
  leftArm,
  rightArm,
  leftLegPivot,
  rightLegPivot,
  leftLeg,
  rightLeg,
} = getPlayerRigParts(player);
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
const ITEM_DEFS = createItemDefs({
  buildPickaxeModel,
  buildSafetyHelmetModel,
  buildBasicShoesModel,
  buildFreshAirCanisterModel,
  buildPurifyPowderModel,
  getPickaxeLevel: () => inventory?.pickaxeLevel ?? 0,
});

function getDevMaterialItemIds() {
  return getDevMaterialItemIdsFromDefs(ITEM_DEFS);
}

function getDevBulkGrantItemIds() {
  return getDevBulkGrantItemIdsFromDefs(ITEM_DEFS, INVENTORY_STACK_LIMIT);
}

function createInventoryEntryInstanceId() {
  return createInventoryEntryInstanceIdFromItems();
}

function getInventoryStackMax(itemId) {
  return getInventoryStackMaxFromItems(ITEM_DEFS, itemId, INVENTORY_STACK_LIMIT);
}

function createInventorySlotEntry(itemId, count = 1, extra = {}) {
  return createInventorySlotEntryFromItems(ITEM_DEFS, itemId, count, extra);
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
  return normalizeInventorySlotEntryFromItems(ITEM_DEFS, rawSlot);
}

function createEquippedItemRef(itemId, extra = {}) {
  return createEquippedItemRefFromItems(itemId, extra);
}

function normalizeEquippedItemRef(rawRef) {
  return normalizeEquippedItemRefFromItems(rawRef);
}

function getInventoryEntryCategory(entry) {
  return getInventoryEntryCategoryFromItems(ITEM_DEFS, entry);
}

function getInventoryEntryEquipSlot(entry) {
  return getInventoryEntryEquipSlotFromItems(ITEM_DEFS, entry);
}

function getInventoryEntryDisplayName(entry) {
  return getInventoryEntryDisplayNameFromItems(ITEM_DEFS, entry);
}

function getInventoryEntryDisplayIcon(entry) {
  return getInventoryEntryDisplayIconFromItems(ITEM_DEFS, entry);
}

function getInventoryEntryTooltipData(entry) {
  const tooltip = getInventoryEntryTooltipDataFromItems(ITEM_DEFS, entry);
  if (!tooltip) return null;
  if (isQuestCriticalItemBlockedFromDiscard(entry)) {
    return {
      ...tooltip,
      lines: [...tooltip.lines, "퀘스트 아이템"],
    };
  }
  return tooltip;
}

function createQuickUseBinding(itemId, extra = {}) {
  return createQuickUseBindingFromModule(itemId, extra);
}

function normalizeQuickUseBinding(rawBinding) {
  return normalizeQuickUseBindingFromModule(rawBinding);
}

function getQuickUseBinding(key) {
  return getQuickUseBindingFromModule(inventory, key);
}

function getQuickUseItemId(key) {
  return getQuickUseItemIdFromModule(inventory, key);
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
  clearQuickUseBindingForItemIdFromModule(inventory, itemId, QUICK_USE_ALLOWED_KEYS);
}

function assignQuickUseKeyToItem(itemId, key) {
  return assignQuickUseKeyToItemFromModule(inventory, itemId, key, QUICK_USE_ALLOWED_KEYS);
}

function getQuickUseKeyForItemId(itemId) {
  return getQuickUseKeyForItemIdFromModule(inventory, itemId, QUICK_USE_ALLOWED_KEYS);
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

function getCurrentPickaxeStats() {
  return getCurrentPickaxeStatsFromModule(inventory?.pickaxeLevel ?? 0, PICKAXE_UPGRADE_LEVELS);
}

function getNextPickaxeUpgrade() {
  return getNextPickaxeUpgradeFromModule(inventory?.pickaxeLevel ?? 0, PICKAXE_UPGRADE_LEVELS);
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
    return getForgeUpgradeStateData({
      targetItemId: itemId,
      pickaxeLevel: inventory.pickaxeLevel,
      itemDefs: ITEM_DEFS,
    });
  }

  return null;
}

function getEquippedMiningPower() {
  return getMiningPowerForTool({
    toolId: getEquippedItemForSlot("tool"),
    pickaxeLevel: inventory.pickaxeLevel,
    itemDefs: ITEM_DEFS,
    randRange,
  });
}

    // 인벤토리 데이터: 슬롯 + 장착 상태
	    const inventory = createInitialInventoryStateFromModule();
let playerCredits = 0;

const personalStorage = createInitialPersonalStorageStateFromModule();

let inventoryDraggedEntry = null;
let inventoryDiscardTargetEntry = null;
let inventoryDragState = null;
let personalStorageTransferState = null;

const ALWAYS_DROP_BLOCKED_ITEM_IDS = new Set(["abandonedMineKey"]);
const TUTORIAL_DROP_BLOCKED_ITEM_IDS = new Set(["pickaxe", "safetyHelmet"]);

function findInventorySlotIndexByEntry(entry) {
  return findInventorySlotIndexByEntryFromModule(inventory.slots, entry, {
    isNftInventoryEntry,
    getSlotItemId,
  });
}

function getInventorySlotEntryByEntry(entry) {
  return getInventorySlotEntryByEntryFromModule(inventory.slots, entry, {
    isNftInventoryEntry,
    getSlotItemId,
  });
}

function clampPlayerCredits(value) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function getPlayerCredits() {
  return playerCredits;
}

function setPlayerCredits(value) {
  playerCredits = clampPlayerCredits(value);
  updateWalletUi();
}

function grantPlayerCredits(amount) {
  setPlayerCredits(playerCredits + amount);
}

function canAffordPlayerCredits(amount) {
  return playerCredits >= clampPlayerCredits(amount);
}

function spendPlayerCredits(amount) {
  const normalized = clampPlayerCredits(amount);
  if (playerCredits < normalized) return false;
  setPlayerCredits(playerCredits - normalized);
  return true;
}

function formatPlayerCreditsLabel(value = playerCredits) {
  return `${PLAYER_CURRENCY_NAME}: ${clampPlayerCredits(value)}원`;
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
  return findFirstEmptySlotFromModule(personalStorage.slots);
}

function createPartialInventoryEntry(entry, count) {
  return createPartialInventoryEntryFromModule(entry, count, {
    normalizeInventorySlotEntry,
    isNftInventoryEntry,
    getSlotItemCount,
    createInventorySlotEntry,
  });
}

function addEntryToStorage(entry, count = getSlotItemCount(entry)) {
  return addEntryToStorageFromModule(personalStorage.slots, entry, count, {
    createPartialInventoryEntry,
    getSlotItemId,
    getInventoryStackMax,
    getSlotItemCount,
    isNftInventoryEntry,
    createInventorySlotEntry,
  });
}

function addEntryToInventory(entry, count = getSlotItemCount(entry)) {
  return addEntryToInventoryFromModule(inventory.slots, entry, count, {
    createPartialInventoryEntry,
    getSlotItemId,
    getInventoryStackMax,
    getSlotItemCount,
    isNftInventoryEntry,
    createInventorySlotEntry,
  });
}

function moveInventoryEntryToStorage(entry, count = getSlotItemCount(entry)) {
  return moveInventoryEntryToStorageFromModule(inventory.slots, personalStorage.slots, entry, count, {
    findInventorySlotIndexByEntry,
    canMoveInventoryEntryToPersonalStorage,
    addEntryToStorage,
    getSlotItemCount,
    pruneQuickUseBindings,
  });
}

function moveStorageEntryToInventory(storageIndex, count = null) {
  return moveStorageEntryToInventoryFromModule(
    inventory.slots,
    personalStorage.slots,
    storageIndex,
    count,
    {
      addEntryToInventory,
      getSlotItemCount,
    }
  );
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
  return findFirstSlotWithItemFromModule(inventory.slots, id, { getSlotItemId });
	    }

    function getItemCount(id) {
  return getItemCountFromModule(inventory.slots, id, { getSlotItemId, getSlotItemCount });
    }

	    function findFirstEmptySlot() {
  return findFirstEmptySlotFromModule(inventory.slots);
    }

    function addItem(id, count = 1) {
  return addItemFromModule(inventory.slots, ITEM_DEFS, id, count, {
    getSlotItemId,
    getInventoryStackMax,
    isNftInventoryEntry,
    getSlotItemCount,
    createInventorySlotEntry,
  });
	    }

    function consumeItem(id, count = 1) {
  return consumeItemFromModule(inventory.slots, id, count, {
    getItemCount,
    getSlotItemId,
    isNftInventoryEntry,
    getSlotItemCount,
    pruneQuickUseBindings,
  });
    }

    function hasEquippedTool(id) {
  return getEquippedItemForSlot("tool") === id;
    }

    function hasItem(id) {
  return hasItemFromModule(inventory.slots, id, { getItemCount });
    }

    const {
  equippedPickaxe,
  equippedSafetyHelmet,
  equippedNftHelmet,
  equippedLeftShoe,
  equippedRightShoe,
    } = createPlayerEquipmentVisuals(
  {
    head,
    leftArm,
    leftLegPivot,
    rightLegPivot,
  },
  {
    buildSafetyHelmetModel,
    buildSingleBasicShoeModel,
    alignWearableOnHead,
  }
    );

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

    function updateEquippedVisual() {
  const headRef = getEquippedItemRef("head");
  const isNftHelmetEquipped =
    headRef?.kind === "nft" &&
    headRef?.contractAddress === "0xMockHelmetCollection" &&
    String(headRef?.tokenId) === "1";
  updatePlayerEquipmentVisualsVisibility(
    {
      equippedPickaxe,
      equippedSafetyHelmet,
      equippedNftHelmet,
      equippedLeftShoe,
      equippedRightShoe,
    },
    {
      hasPickaxeEquipped: hasEquippedTool("pickaxe"),
      isSafetyHelmetEquipped:
        !isNftHelmetEquipped && getEquippedItemForSlot("head") === "safetyHelmet",
      isNftHelmetEquipped,
      shoesVisible: getEquippedItemForSlot("shoes") === "basicShoes",
    }
  );
    }

    function getEquippedItemRef(slotId) {
  return getEquippedItemRefFromModule(inventory.equipped, slotId);
    }

    function getEquippedItemForSlot(slotId) {
  return getEquippedItemForSlotFromModule(inventory.equipped, slotId);
    }

    function setEquippedItem(slotId, itemOrRef) {
  setEquippedItemFromModule(inventory.equipped, slotId, itemOrRef, normalizeEquippedItemRef);
    }

    function equipFirstOwnedInventoryItem(slotId, itemId) {
  return equipFirstOwnedInventoryItemFromModule(inventory, slotId, itemId, {
    findFirstSlotWithItem,
    normalizeInventorySlotEntry,
    setEquippedItem,
    createEquippedItemRef,
  });
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

    const previewParts = getPlayerRigParts(previewPlayer);

    function resizeEquipmentPreview() {
  const width = Math.max(1, previewCanvasWrap.clientWidth);
  const height = Math.max(1, previewCanvasWrap.clientHeight);
  equipPreviewRenderer.setSize(width, height, false);
  equipPreviewCamera.aspect = width / height;
  equipPreviewCamera.updateProjectionMatrix();
    }

    function renderEquipmentPreview() {
  syncPreviewPlayerPose({
    previewPlayer,
    previewParts,
    player,
    sourceParts: {
      torso,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
    },
    equipmentVisibility: {
      equippedPickaxeVisible: equippedPickaxe.visible,
      equippedSafetyHelmetVisible: equippedSafetyHelmet.visible,
      equippedNftHelmetVisible: equippedNftHelmet.visible,
    },
  });
  if (previewParts.equippedPickaxe) {
    if (previewParts.equippedPickaxe.userData.pickaxeLevel !== inventory.pickaxeLevel) {
      syncPickaxeGroupModel(previewParts.equippedPickaxe, inventory.pickaxeLevel);
    }
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
  updateCompassUi(compassNeedle, compassText, dir);
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
let mansionOneRoom102Root = null;
const mansionOneRoomInstances = {
  "101": null,
  "102": null,
};
const MANSION_ONE_ROOM_INSTANCE_ORIGINS = {
  "101": { x: -4800, z: -4800 },
  "102": { x: -4820, z: -4800 },
};
let mansionOneActiveRoomKey = "101";
let mansionOneExteriorReturn = { x: 0, z: 0, rotationY: Math.PI };
let mineGate = null;
let campGate = null;
let frontierCampGate = null;
let frontierGate = null;
let activeForgeStation = null;
const mapGates = [];
let activeMapGate = null;
let currentMapId = "광산";
let lastAnnouncedMapId = currentMapId;
let torchEquipped = false;
let playerAirCurrent = AIR_GAUGE_MAX;
let playerAirMax = AIR_GAUGE_MAX;
let airDepletedNoticeUntil = 0;
const mapPollutionFields = {};
const mapPurificationProgress = {
  "폐광": 0,
  "개척지": 0,
};
let frontierBuildState = createDefaultFrontierBuildState();

function createDefaultFrontierBuildState() {
  return createDefaultFrontierBuildStateFromModule(FRONTIER_PARCEL_LABELS);
}

function getFrontierParcelAuthorityItemId(parcelLabel) {
  return getFrontierParcelAuthorityItemIdFromModule(parcelLabel, FRONTIER_AUTHORITY_ITEM_IDS);
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
  return hasMansionOneResidenceAuthorityFromModule(hasItem);
}

function hasMansionPersonalStorageAuthority() {
  return hasMansionPersonalStorageAuthorityFromModule(hasItem);
}

function getOwnedMansionRoomKey() {
  return getOwnedMansionRoomKeyFromModule(hasItem);
}

function getOwnedMansionRoomPermitName() {
  return getOwnedMansionRoomPermitNameFromModule(hasItem, ITEM_DEFS);
}

function removeGroundSurface(mesh) {
  const idx = groundSurfaces.indexOf(mesh);
  if (idx !== -1) groundSurfaces.splice(idx, 1);
}

function unregisterWalkableSurface(mapId, entry) {
  if (!entry) return;
  const entries = walkableMapSurfaces.get(mapId);
  if (!entries) return;
  const idx = entries.indexOf(entry);
  if (idx !== -1) entries.splice(idx, 1);
}

function unregisterResidenceMapZone(zone) {
  if (!zone) return;
  const idx = residenceMapZones.indexOf(zone);
  if (idx !== -1) residenceMapZones.splice(idx, 1);
}

function removeInteractableEntry(interactable) {
  if (!interactable) return;
  const idx = interactables.indexOf(interactable);
  if (idx !== -1) interactables.splice(idx, 1);
  if (activeInteractable === interactable) {
    activeInteractable = null;
  }
  interactable.obj?.removeFromParent?.();
}

function destroyMansionRoomInstance(roomKey) {
  const result = destroyMansionRoomInstanceFromModule({
    roomKey,
    mansionOneRoomInstances,
    getTrackedColliderIndex,
    removeColliderAt,
    removeInteractableEntry,
    removeGroundSurface,
    unregisterWalkableSurface,
    unregisterResidenceMapZone,
    residenceMapId: RESIDENCE_MAP_ID,
    mansionOneRoomRoot,
    mansionOneRoom102Root,
  });
  mansionOneRoomRoot = result.mansionOneRoomRoot;
  mansionOneRoom102Root = result.mansionOneRoom102Root;
  mansionOneBedInteractable = result.mansionOneBedInteractable;
  mansionOneStorageInteractable = result.mansionOneStorageInteractable;
  mansionOneExitInteractable = result.mansionOneExitInteractable;
}

function createMansionRoomInstance(roomKey) {
  const result = createMansionRoomInstanceFromModule({
    roomKey,
    scene,
    interactables,
    groundSurfaces,
    addCollider,
    registerWalkableSurface,
    registerResidenceMapZone,
    ensurePlayerNotInsideGeneratedColliders,
    residenceMapId: RESIDENCE_MAP_ID,
    startFlatY: START_FLAT_Y,
    mansionRoomInstanceOrigins: MANSION_ONE_ROOM_INSTANCE_ORIGINS,
    mansionOneRoomInstances,
  });
  mansionOneRoomRoot = result.mansionOneRoomRoot;
  mansionOneRoom102Root = result.mansionOneRoom102Root;
  mansionOneBedInteractable = result.mansionOneBedInteractable;
  mansionOneStorageInteractable = result.mansionOneStorageInteractable;
  mansionOneExitInteractable = result.mansionOneExitInteractable;
  return result.instance;
}

function applyDevProfileRoleOverrides() {
  if (!isDevSession()) return;
  const isBuyerProfile = activeDevProfileId === "dev_user_2";
  for (const label of FRONTIER_PARCEL_LABELS) {
    const permitId = getFrontierParcelAuthorityItemId(label);
    if (!permitId) continue;
    if (isBuyerProfile) {
      removeAllItemsById(permitId);
    } else {
      ensureExactOwnedItemCount(permitId, 1);
    }
  }
  if (isBuyerProfile) {
    removeAllItemsById("mansionOneRoom101Permit");
    ensureExactOwnedItemCount("mansionOneRoom102Permit", 1);
  } else {
    removeAllItemsById("mansionOneRoom102Permit");
    ensureExactOwnedItemCount("mansionOneRoom101Permit", 1);
  }
}

function createDefaultFrontierParcelBuildEntry(label) {
  return createDefaultFrontierParcelBuildEntryFromModule(label);
}

function createDefaultFrontierParcelOperationsState() {
  return createDefaultFrontierParcelOperationsStateFromModule();
}

function createDefaultFrontierShopState() {
  return createDefaultFrontierShopStateFromModule();
}

function createDefaultFrontierDisplayState() {
  return createDefaultFrontierDisplayStateFromModule();
}

function createDefaultResidenceNoticeBoardEntry(key) {
  const titleMap = {
    boardA: "게시판 A",
    boardB: "게시판 B",
    boardC: "게시판 C",
  };
  return {
    title: titleMap[key] ?? "게시판",
    lines: ["공용 알림과 안내가", "표시될 예정입니다."],
  };
}

function createDefaultResidenceNoticeBoardState() {
  return Object.fromEntries(
    RESIDENCE_NOTICE_BOARD_KEYS.map((key) => [key, createDefaultResidenceNoticeBoardEntry(key)])
  );
}

function normalizeResidenceNoticeBoardEntry(key, rawEntry) {
  const defaults = createDefaultResidenceNoticeBoardEntry(key);
  const source = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
  const rawLines = Array.isArray(source.lines) ? source.lines : defaults.lines;
  const lines = rawLines
    .map((line) => String(line ?? "").trim().slice(0, 36))
    .filter(Boolean)
    .slice(0, 4);
  return {
    title: String(source.title ?? defaults.title).trim().slice(0, 24) || defaults.title,
    lines: lines.length > 0 ? lines : defaults.lines,
  };
}

function normalizeResidenceNoticeBoardState(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  return Object.fromEntries(
    RESIDENCE_NOTICE_BOARD_KEYS.map((key) => [key, normalizeResidenceNoticeBoardEntry(key, source[key])])
  );
}

function formatFrontierShopStatusText(itemId, quantity, price) {
  return formatFrontierShopStatusTextFromModule(itemId, quantity, price, ITEM_DEFS);
}

function formatFrontierDisplayStatusText(entry) {
  return formatFrontierDisplayStatusTextFromModule(entry, getInventoryEntryDisplayName);
}

function getFrontierDisplaySummary(displayState) {
  return getFrontierDisplaySummaryFromModule(displayState, {
    normalizeInventorySlotEntry,
    getInventoryEntryDisplayName,
  });
}

function getFrontierShopListingSummary(shopState) {
  return getFrontierShopListingSummaryFromModule(shopState, {
    itemDefs: ITEM_DEFS,
    clampPlayerCredits,
  });
}

function getFrontierShopPurchaseFeedback(parcelLabel, quantity) {
  const shopState = getFrontierShopOperation(parcelLabel);
  return getFrontierShopPurchaseFeedbackFromModule({
    parcelLabel,
    shopState,
    quantity,
    currentWallet: getCurrentFrontierWalletAddress(),
    canAffordPlayerCredits,
    clampPlayerCredits,
    validateInventorySpace: () => {
      const inventorySnapshot = inventory.slots.map((slot) => (slot ? structuredClone(slot) : null));
      const canAdd = addEntryToInventory(createInventorySlotEntry(shopState.itemId, Math.max(1, Math.floor(Number(quantity) || 0))), Math.max(1, Math.floor(Number(quantity) || 0)));
      for (let i = 0; i < inventory.slots.length; i += 1) {
        inventory.slots[i] = inventorySnapshot[i];
      }
      return canAdd;
    },
  });
}

function normalizeFrontierWalletAddress(rawAddress) {
  return normalizeFrontierWalletAddressFromModule(rawAddress);
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
  const sellerWallet = normalizeFrontierWalletAddress(source.sellerWallet || userWallet);
  const pendingCredits = clampPlayerCredits(source.pendingCredits || 0);
  const lifetimeCredits = clampPlayerCredits(source.lifetimeCredits || 0);
  return {
    statusText: formatFrontierShopStatusText(itemId, quantity, price),
    itemId,
    quantity,
    price,
    userWallet,
    sellerWallet,
    pendingCredits,
    lifetimeCredits,
  };
}

function normalizeFrontierDisplayOperationEntry(rawEntry) {
  const source = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
  const entry = normalizeInventorySlotEntry(source.entry);
  return {
    statusText: formatFrontierDisplayStatusText(entry),
    entry,
    userWallet: normalizeFrontierWalletAddress(source.userWallet),
  };
}

function normalizeFrontierParcelOperationsState(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const defaults = createDefaultFrontierParcelOperationsState();
  return {
    shop: normalizeFrontierShopOperationEntry(source.shop ?? defaults.shop),
    displayA: normalizeFrontierDisplayOperationEntry(source.displayA ?? defaults.displayA),
    displayB: normalizeFrontierDisplayOperationEntry(source.displayB ?? defaults.displayB),
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
  return getFrontierShopOperationFromModule(
    frontierBuildState,
    parcelLabel,
    createDefaultFrontierParcelBuildEntry
  );
}

function getFrontierDisplayOperation(parcelLabel = getSelectedFrontierParcelLabel(), slotKey = "displayA") {
  return getFrontierDisplayOperationFromModule(
    frontierBuildState,
    parcelLabel,
    slotKey,
    createDefaultFrontierParcelBuildEntry
  );
}

function isFrontierDisplayableEntry(entry) {
  return isFrontierDisplayableEntryFromModule(entry, isQuestCriticalItemBlockedFromDiscard);
}

function getDisplayableFrontierEntries() {
  return getDisplayableFrontierEntriesFromModule(
    inventory.slots,
    isQuestCriticalItemBlockedFromDiscard
  );
}

function assignFrontierDisplayEntry(parcelLabel, slotKey, entry) {
  const validation = isFrontierDisplayableEntry(entry);
  const canAssign = canAssignFrontierDisplayEntryStateFromModule(
    slotKey,
    Boolean(parcelLabel) && canUseFrontierDisplaySlot(parcelLabel, slotKey),
    validation
  );
  if (!canAssign.ok) {
    if (canAssign.reason) showUI(canAssign.reason, 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  const displayState = getFrontierDisplayOperation(parcelLabel, slotKey);
  assignFrontierDisplayEntryStateFromModule(displayState, entry, {
    normalizeInventorySlotEntry,
    getInventoryEntryDisplayName,
  });
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  schedulePlayerSaveSync(true);
  renderFrontierBoothDialog();
  if (frontierBuildOpen) renderFrontierBuildWindow();
  showUI(`${getInventoryEntryDisplayName(entry)} 전시`, 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function clearFrontierDisplayEntry(parcelLabel, slotKey) {
  const displayState = getFrontierDisplayOperation(parcelLabel, slotKey);
  const canClear = canClearFrontierDisplayEntryStateFromModule(
    slotKey,
    Boolean(parcelLabel) && canUseFrontierDisplaySlot(parcelLabel, slotKey),
    displayState
  );
  if (!canClear.ok) {
    if (canClear.reason) showUI(canClear.reason, 900);
    lastMessageUntil = performance.now() + 900;
    return false;
  }
  clearFrontierDisplayEntryStateFromModule(displayState);
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  schedulePlayerSaveSync(true);
  renderFrontierBoothDialog();
  if (frontierBuildOpen) renderFrontierBuildWindow();
  showUI("전시를 해제했습니다.", 900);
  lastMessageUntil = performance.now() + 900;
  return true;
}

function getFrontierShopAssignedWallet(parcelLabel = getSelectedFrontierParcelLabel()) {
  return getFrontierShopAssignedWalletFromModule(getFrontierShopOperation(parcelLabel));
}

function getFrontierShopSellerWallet(parcelLabel = getSelectedFrontierParcelLabel()) {
  return getFrontierShopSellerWalletFromModule(getFrontierShopOperation(parcelLabel));
}

function isFrontierShopSlotUser(parcelLabel = getSelectedFrontierParcelLabel(), walletAddress = getCurrentFrontierWalletAddress()) {
  return isFrontierShopSlotUserFromModule(
    getFrontierShopAssignedWallet(parcelLabel),
    walletAddress
  );
}

function isFrontierShopSeller(parcelLabel = getSelectedFrontierParcelLabel(), walletAddress = getCurrentFrontierWalletAddress()) {
  return isFrontierShopSellerFromModule(
    getFrontierShopSellerWallet(parcelLabel),
    walletAddress
  );
}

function canManageFrontierShopSlot(parcelLabel = getSelectedFrontierParcelLabel()) {
  return canManageFrontierShopSlotFromModule(hasFrontierParcelAuthority, parcelLabel);
}

function canUseFrontierShopSlot(parcelLabel = getSelectedFrontierParcelLabel()) {
  return canUseFrontierShopSlotFromModule(
    getFrontierShopOperation(parcelLabel),
    getCurrentFrontierWalletAddress()
  );
}

function canEditFrontierShopListing(parcelLabel = getSelectedFrontierParcelLabel()) {
  return canEditFrontierShopListingFromModule(
    getFrontierShopOperation(parcelLabel),
    getCurrentFrontierWalletAddress()
  );
}

function canManageFrontierShopSellerTools(parcelLabel = getSelectedFrontierParcelLabel()) {
  return canManageFrontierShopSellerToolsFromModule(
    getFrontierShopOperation(parcelLabel),
    getCurrentFrontierWalletAddress(),
    clampPlayerCredits
  );
}

function canRegisterFrontierShopListing(parcelLabel = getSelectedFrontierParcelLabel()) {
  return canRegisterFrontierShopListingFromModule(
    getFrontierShopOperation(parcelLabel),
    getFrontierShopAssignedWallet(parcelLabel),
    getCurrentFrontierWalletAddress()
  );
}

function canCollectFrontierShopSettlement(parcelLabel = getSelectedFrontierParcelLabel()) {
  return canCollectFrontierShopSettlementFromModule(
    getFrontierShopOperation(parcelLabel),
    getCurrentFrontierWalletAddress(),
    clampPlayerCredits
  );
}

function getFrontierDisplayAssignedWallet(parcelLabel = getSelectedFrontierParcelLabel(), slotKey = "displayA") {
  return getFrontierDisplayAssignedWalletFromModule(
    getFrontierDisplayOperation(parcelLabel, slotKey)
  );
}

function isFrontierDisplaySlotUser(parcelLabel = getSelectedFrontierParcelLabel(), slotKey = "displayA", walletAddress = getCurrentFrontierWalletAddress()) {
  return isFrontierDisplaySlotUserFromModule(
    getFrontierDisplayAssignedWallet(parcelLabel, slotKey),
    walletAddress
  );
}

function canManageFrontierDisplaySlot(parcelLabel = getSelectedFrontierParcelLabel(), slotKey = "displayA") {
  return canManageFrontierDisplaySlotFromModule(hasFrontierParcelAuthority, parcelLabel);
}

function canUseFrontierDisplaySlot(parcelLabel = getSelectedFrontierParcelLabel(), slotKey = "displayA") {
  return canUseFrontierDisplaySlotFromModule(
    getFrontierDisplayOperation(parcelLabel, slotKey),
    getCurrentFrontierWalletAddress()
  );
}

function getDevProfileSaveKey(profileId) {
  return `${DEV_PROFILE_SAVE_PREFIX}${sanitizeDevProfileId(profileId)}`;
}

function grantFrontierShopSellerCredits(walletAddress, amount) {
  const normalizedWallet = normalizeFrontierWalletAddress(walletAddress);
  const safeAmount = clampPlayerCredits(amount);
  if (!normalizedWallet || safeAmount <= 0) return false;
  if (normalizedWallet === getCurrentFrontierWalletAddress()) {
    grantPlayerCredits(safeAmount);
    return true;
  }
  if (!DEV_PROFILE_IDS.includes(normalizedWallet)) {
    return false;
  }
  const saveKey = getDevProfileSaveKey(normalizedWallet);
  let parsed = createDefaultPlayerSave();
  try {
    const raw = localStorage.getItem(saveKey);
    if (raw) {
      parsed = {
        ...parsed,
        ...JSON.parse(raw),
        economy: {
          ...parsed.economy,
          ...(JSON.parse(raw).economy ?? {}),
        },
      };
    }
  } catch {
    parsed = createDefaultPlayerSave();
  }
  parsed.economy = {
    ...createDefaultPlayerSave().economy,
    ...(parsed.economy ?? {}),
  };
  parsed.economy.credits = clampPlayerCredits((Number(parsed.economy.credits) || 0) + safeAmount);
  try {
    localStorage.setItem(saveKey, JSON.stringify(parsed));
    return true;
  } catch {
    return false;
  }
}

function collectFrontierShopSettlement(parcelLabel = getSelectedFrontierParcelLabel()) {
  if (!parcelLabel) return false;
  if (!canCollectFrontierShopSettlement(parcelLabel)) {
    showUI("회수할 정산금이 없거나 판매자 권한이 없습니다.", 1100);
    lastMessageUntil = performance.now() + 1100;
    return false;
  }
  const shopState = getFrontierShopOperation(parcelLabel);
  const settlement = getCollectFrontierShopSettlementStateFromModule(shopState, clampPlayerCredits);
  if (!settlement.canCollect) return false;
  const amount = settlement.amount;
  const sellerWallet = settlement.sellerWallet;
  if (!grantFrontierShopSellerCredits(sellerWallet, amount)) {
    showUI("정산금 회수에 실패했습니다.", 1100);
    lastMessageUntil = performance.now() + 1100;
    return false;
  }
  applyCollectedFrontierShopSettlementStateFromModule(shopState);
  schedulePlayerSaveSync(true);
  renderFrontierBoothDialog();
  if (frontierBuildOpen) renderFrontierBuildWindow();
  updateInventoryUI();
  showUI(`정산금 ${amount}원을 회수했습니다.`, 1100);
  lastMessageUntil = performance.now() + 1100;
  return true;
}

function assignFrontierDisplaySlotUser(parcelLabel, slotKey, walletAddress) {
  const displayState = getFrontierDisplayOperation(parcelLabel, slotKey);
  const assignment = canAssignFrontierDisplaySlotUserStateFromModule(
    slotKey,
    Boolean(parcelLabel) && canManageFrontierDisplaySlot(parcelLabel, slotKey),
    displayState,
    walletAddress
  );
  if (!assignment.ok) {
    const duration = assignment.reason && assignment.reason.includes("입력") ? 1000 : 1100;
    if (assignment.reason) showUI(assignment.reason, duration);
    lastMessageUntil = performance.now() + duration;
    return false;
  }
  assignFrontierDisplaySlotUserStateFromModule(displayState, assignment.wallet);
  schedulePlayerSaveSync(true);
  if (frontierBuildOpen) renderFrontierBuildWindow();
  showUI(`${slotKey === "displayA" ? "전시 A" : "전시 B"} 사용자를 ${shortenWalletAddress(assignment.wallet)}(으)로 지정했습니다.`, 1100);
  lastMessageUntil = performance.now() + 1100;
  return true;
}

function clearFrontierDisplaySlotUser(parcelLabel, slotKey) {
  const displayState = getFrontierDisplayOperation(parcelLabel, slotKey);
  const canClear = canClearFrontierDisplaySlotUserStateFromModule(
    slotKey,
    Boolean(parcelLabel) && canManageFrontierDisplaySlot(parcelLabel, slotKey),
    displayState
  );
  if (!canClear.ok) {
    if (canClear.reason) showUI(canClear.reason, 1100);
    lastMessageUntil = performance.now() + 1100;
    return false;
  }
  clearFrontierDisplaySlotUserStateFromModule(displayState);
  schedulePlayerSaveSync(true);
  if (frontierBuildOpen) renderFrontierBuildWindow();
  showUI(`${slotKey === "displayA" ? "전시 A" : "전시 B"} 사용자를 해제했습니다.`, 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function formatFrontierShopUserDisplay(parcelLabel = getSelectedFrontierParcelLabel()) {
  return formatFrontierShopUserDisplayFromModule(
    getFrontierShopAssignedWallet(parcelLabel),
    shortenWalletAddress
  );
}

function getCurrentFrontierParcelLabel() {
  return getFrontierCurrentParcelLabelFromModule(
    FRONTIER_PARCEL_LABELS,
    isPlayerInsideFrontierParcel
  );
}

function getSelectedFrontierParcelLabel() {
  const currentLabel = getCurrentFrontierParcelLabel();
  if (currentLabel) frontierActiveParcelLabel = currentLabel;
  return getFrontierSelectedParcelLabelFromModule(currentLabel, frontierActiveParcelLabel, "P6");
}

function getFrontierBuildState(parcelLabel = getSelectedFrontierParcelLabel()) {
  return getFrontierBuildStateEntryFromModule(
    frontierBuildState,
    parcelLabel,
    createDefaultFrontierParcelBuildEntry
  );
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
  return getFrontierParcelSafeStandingPointFromModule(parcel, FRONTIER_MAP_X, {
    x: player.position.x,
    z: player.position.z,
    rotationY: player.rotation.y,
  });
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
  return normalizeFrontierBuildStateFromModule(rawState, {
    parcelLabels: FRONTIER_PARCEL_LABELS,
    normalizeInventorySlotEntry,
    getInventoryEntryDisplayName,
    itemDefs: ITEM_DEFS,
    clampPlayerCredits,
  });
}

function getFrontierNextStageConfig(stage = getFrontierBuildState().stage) {
  return getFrontierNextStageConfigFromModule(stage, FRONTIER_BUILD_STAGE_CONFIG);
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

function buildFrontierDisplayBoothVisual(entry) {
  const wrap = new THREE.Group();
  const normalizedEntry = normalizeInventorySlotEntry(entry);
  if (!normalizedEntry) return wrap;

  if (!isNftInventoryEntry(normalizedEntry)) {
    const itemId = getSlotItemId(normalizedEntry);
    const def = ITEM_DEFS[itemId];
    if (def && typeof def.makeInventoryModel === "function") {
      const model = def.makeInventoryModel();
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      model.scale.multiplyScalar(0.64 / maxDim);
      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = scaledBox.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.position.y -= scaledBox.min.y;
      wrap.add(model);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(246, 235, 210, 0.96)";
  ctx.beginPath();
  ctx.roundRect(30, 30, 300, 300, 30);
  ctx.fill();
  ctx.fillStyle = "#5a4637";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 144px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif";
  ctx.fillText(getInventoryEntryDisplayIcon(normalizedEntry), canvas.width * 0.5, canvas.height * 0.46);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.86),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  plane.position.y = 0.12;
  if (wrap.children.length === 0) {
    wrap.add(plane);
  } else {
    plane.position.y = 0.74;
    plane.scale.setScalar(0.52);
    wrap.add(plane);
  }

  const nameCanvas = document.createElement("canvas");
  nameCanvas.width = 560;
  nameCanvas.height = 120;
  const nameCtx = nameCanvas.getContext("2d");
  nameCtx.clearRect(0, 0, nameCanvas.width, nameCanvas.height);
  nameCtx.fillStyle = "rgba(48,36,28,0.88)";
  nameCtx.beginPath();
  nameCtx.roundRect(24, 16, 512, 88, 24);
  nameCtx.fill();
  nameCtx.fillStyle = "#fbf1d7";
  nameCtx.textAlign = "center";
  nameCtx.textBaseline = "middle";
  let fontSize = 44;
  const safeName = getInventoryEntryDisplayName(normalizedEntry);
  do {
    nameCtx.font = `800 ${fontSize}px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif`;
    if (nameCtx.measureText(safeName).width <= 460 || fontSize <= 24) break;
    fontSize -= 2;
  } while (fontSize > 24);
  nameCtx.fillText(safeName, nameCanvas.width * 0.5, nameCanvas.height * 0.55);
  const nameTex = new THREE.CanvasTexture(nameCanvas);
  nameTex.colorSpace = THREE.SRGBColorSpace;
  const nameTag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.02, 0.22),
    new THREE.MeshBasicMaterial({ map: nameTex, transparent: true })
  );
  nameTag.position.set(0, 0.88, 0.02);
  wrap.add(nameTag);
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
      } else if (booth.title !== "상점") {
        const displayState =
          booth.title === "전시 A" ? buildState.operations.displayA : buildState.operations.displayB;
        if (displayState.entry) {
          const displayWrap = buildFrontierDisplayBoothVisual(displayState.entry);
          displayWrap.position.set(booth.x, boothTopY + 0.08, booth.z);
          displayWrap.rotation.y = facesCenterLaneFromLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
          buildGroup.add(displayWrap);
        }
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
  return getMapPollutionConfigFromModule(mapId, MAP_POLLUTION_CONFIG);
}

function isPollutedMap(mapId = currentMapId) {
  return isPollutedMapFromModule(mapId, MAP_POLLUTION_CONFIG);
}

function getMapPurificationValue(mapId = currentMapId) {
  return getMapPurificationValueFromModule(mapId, mapPurificationProgress, MAP_POLLUTION_CONFIG);
}

function setMapPurificationValue(mapId, value) {
  setMapPurificationValueFromModule(mapId, value, mapPurificationProgress, MAP_POLLUTION_CONFIG);
}

function resetAllMapPurificationValues() {
  resetAllMapPurificationValuesFromModule(mapPurificationProgress, MAP_POLLUTION_CONFIG);
}

function getCurrentAirDrainPerSecond() {
  const effectiveMapId = getEffectiveAirMapId();
  return getCurrentAirDrainPerSecondFromModule(
    effectiveMapId,
    mapPurificationProgress,
    MAP_POLLUTION_CONFIG
  );
}

function canRecoverAirInMap(mapId = currentMapId) {
  return canRecoverAirInMapFromModule(mapId, mapPurificationProgress, MAP_POLLUTION_CONFIG);
}

function updateAirHud() {
  const canShowHud = canPlayGame();
  const effectiveMapId = getEffectiveAirMapId();
  if (effectiveMapId == null) {
    updateAirHudUi({
      airHudWrap,
      airHudValue,
      airHudBarFill,
      airHudStatus,
      airHudPurify,
      visible: canShowHud,
      currentAir: playerAirCurrent,
      maxAir: playerAirMax,
      statusText: `연결통로는 호흡 가능한 구역입니다. 초당 ${AIR_RECOVERY_PER_SECOND.toFixed(1)} 공기 회복`,
      purifyText: "",
    });
    return;
  }

  if (!isPollutedMap(effectiveMapId)) {
    updateAirHudUi({
      airHudWrap,
      airHudValue,
      airHudBarFill,
      airHudStatus,
      airHudPurify,
      visible: canShowHud,
      currentAir: playerAirCurrent,
      maxAir: playerAirMax,
      statusText: `현재 맵은 호흡 가능한 구역입니다. 초당 ${AIR_RECOVERY_PER_SECOND.toFixed(1)} 공기 회복`,
      purifyText: "",
    });
    return;
  }

  const purify = getMapPurificationValue(effectiveMapId);
  const drain = getCurrentAirDrainPerSecond();
  updateAirHudUi({
    airHudWrap,
    airHudValue,
    airHudBarFill,
    airHudStatus,
    airHudPurify,
    visible: canShowHud,
    currentAir: playerAirCurrent,
    maxAir: playerAirMax,
    statusText:
      purify >= 100
        ? `정화 완료: 초당 ${AIR_RECOVERY_PER_SECOND.toFixed(1)} 공기 회복`
        : `오염 구역: 초당 ${drain.toFixed(2)} 공기 소모`,
    purifyText: `${getMapPollutionConfig(effectiveMapId)?.displayName ?? effectiveMapId} 정화율 ${purify}%`,
  });
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
  buildPollutionFieldForMap("폐광", CAMP_MAP_X, CAMP_MAP_Z, GROUND_SIZE * 0.5 - 6);
  buildPollutionFieldForMap("개척지", FRONTIER_MAP_X, FRONTIER_MAP_Z, FRONTIER_GROUND_SIZE * 0.5 - 4);
}

function getMapPollutionVisualStrength(mapId = currentMapId) {
  return getMapPollutionVisualStrengthFromModule(
    mapId,
    mapPurificationProgress,
    MAP_POLLUTION_CONFIG
  );
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

  const { overlayOpacity, blurPx } = getAirOverlayVisualState({
    localPollutionStrength,
    playerAirCurrent,
    playerAirMax,
    overlayMaxOpacity: CAVE_POLLUTION_OVERLAY_MAX_OPACITY,
    lowAirEdgeBlurMaxPx: LOW_AIR_EDGE_BLUR_MAX_PX,
  });
  pollutionOverlay.style.opacity = overlayOpacity.toFixed(3);
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

function getAirPurifierHintText(mapId = "폐광") {
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

function tryUseAirPurifier(mapId = "폐광") {
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

function enterMansionOneRoom(roomKey = getOwnedMansionRoomKey()) {
  const normalizedRoomKey = roomKey === "102" ? "102" : "101";
  destroyMansionRoomInstance(normalizedRoomKey === "102" ? "101" : "102");
  const instance = createMansionRoomInstance(normalizedRoomKey);
  const targetRoomRoot = instance?.root;
  if (!targetRoomRoot) return false;
  mansionOneActiveRoomKey = normalizedRoomKey;
  player.position.set(
    targetRoomRoot.position.x,
    player.position.y,
    targetRoomRoot.position.z + 4.2
  );
  player.rotation.y = Math.PI;
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
  snapCameraToPlayer();
  showUI(`Mansion ONE ${mansionOneActiveRoomKey}호 입장`, 1000);
  return true;
}

function exitMansionOneRoom() {
  const activeRoomKey = mansionOneActiveRoomKey === "102" ? "102" : "101";
  mansionSleepPoseActive = false;
  setMansionSleepOpen(false);
  setPersonalStorageOpen(false);
  player.position.set(
    mansionOneExteriorReturn.x,
    player.position.y,
    mansionOneExteriorReturn.z
  );
  player.rotation.y = mansionOneExteriorReturn.rotationY;
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
  snapCameraToPlayer();
  destroyMansionRoomInstance(activeRoomKey);
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
  const bedInteractable =
    activeInteractable?.type === "mansionBed" ? activeInteractable : mansionOneBedInteractable;
  if (!bedInteractable) return;
  mansionSleepWakePoint = {
    x: bedInteractable.obj.position.x + 1.95,
    z: bedInteractable.obj.position.z + 0.2,
    rotationY: Math.PI * -0.5,
  };
  player.position.set(
    bedInteractable.obj.position.x - 0.15,
    player.position.y,
    bedInteractable.obj.position.z
  );
  player.rotation.y = Math.PI * -0.5;
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
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
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
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
  const { nextAir, depletedThisFrame } = updateAirValueForFrame({
    currentAir: playerAirCurrent,
    maxAir: playerAirMax,
    dt,
    effectiveMapId,
    mapPurificationProgress,
    mapPollutionConfig: MAP_POLLUTION_CONFIG,
    recoveryPerSecond: AIR_RECOVERY_PER_SECOND,
  });
  playerAirCurrent = nextAir;
  if (depletedThisFrame && performance.now() > airDepletedNoticeUntil) {
    showUI("공기가 바닥났습니다. R로 신선한 공기 캔을 사용하세요.", 1200);
    airDepletedNoticeUntil = performance.now() + 2200;
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
  currentMapId = getCurrentMapIdForPlayer({
    playerPosition: player.position,
    isInResidenceZone: isPlayerInResidenceMapZone(),
    mineDoorThresholdZ,
    campDoorThresholdZ,
    campNorthDoorThresholdZ,
    frontierDoorThresholdZ,
    currentMapId,
    residenceMapId: RESIDENCE_MAP_ID,
  });
}

function isPlayerInConnectorTunnel() {
  return isPlayerPositionInConnectorTunnel(player.position, connectorTunnelZones);
}

function getEffectiveAirMapId() {
  return getEffectiveAirMapIdForPlayer(currentMapId, player.position, connectorTunnelZones);
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
  const nextStage = getFrontierNextStageConfig(buildState.stage);
  const woodOwned = getItemCount("woodPlank");
  const stoneOwned = getItemCount("masonryStone");
  renderFrontierBuildWindowUi({
    parcelLabel,
    buildState,
    isCompleted,
    hasAuthority,
    nextStage,
    woodOwned,
    stoneOwned,
    getShopStatusText: () => buildState.operations.shop.statusText,
    getDisplayStatusText: (slotKey) => buildState.operations[slotKey].statusText,
  }, {
    title: frontierBuildTitle,
    headerNote: frontierBuildHeaderNote,
    stageCard: frontierBuildStageCard,
    requirementCard: frontierBuildRequirementCard,
    ownedCard: frontierBuildOwnedCard,
    shopManagerCard: frontierBuildShopManagerCard,
    actionBtn: frontierBuildActionBtn,
    notice: frontierBuildNotice,
    signCard: frontierBuildSignCard,
    signInput: frontierBuildSignInput,
    signSaveBtn: frontierBuildSignSaveBtn,
  });
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

function removeAllItemsById(itemId) {
  let removed = false;
  for (let i = 0; i < inventory.slots.length; i += 1) {
    const slot = inventory.slots[i];
    if (!slot) continue;
    if (getSlotItemId(slot) !== itemId) continue;
    inventory.slots[i] = null;
    removed = true;
  }
  if (removed) {
    pruneQuickUseBindings();
    for (const slotId of Object.keys(inventory.equipped)) {
      const equipped = getEquippedItemRef(slotId);
      if (!equipped) continue;
      if (equipped.itemId === itemId) {
        inventory.equipped[slotId] = null;
      }
    }
  }
  return removed;
}

function ensureExactOwnedItemCount(itemId, count = 1) {
  removeAllItemsById(itemId);
  const safeCount = Math.max(0, Math.floor(count || 0));
  if (safeCount > 0) {
    addItem(itemId, safeCount);
  }
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
  if (!canEditFrontierShopListing(parcelLabel)) return false;
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
  if (clampPlayerCredits(shopState.pendingCredits || 0) <= 0) {
    shopState.sellerWallet = "";
  }
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  updateInventoryUI();
  schedulePlayerSaveSync(true);
  renderFrontierBuildWindow();
  renderFrontierShopRegisterDialog();
  showUI("판매 물품을 회수했습니다.", 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function tryPurchaseFrontierShopListing(parcelLabel, quantity) {
  if (!parcelLabel) return { ok: false, reason: "상점 정보를 찾을 수 없습니다." };
  const shopState = getFrontierShopOperation(parcelLabel);
  if (!shopState.itemId || shopState.quantity <= 0) {
    return { ok: false, reason: "등록된 판매 물품이 없습니다." };
  }
  const purchaseQty = Math.max(1, Math.floor(Number(quantity) || 0));
  if (purchaseQty <= 0) {
    return { ok: false, reason: "구매 수량을 확인해주세요." };
  }
  if (purchaseQty > shopState.quantity) {
    return { ok: false, reason: "재고가 부족합니다." };
  }
  const sellerWallet = normalizeFrontierWalletAddress(shopState.sellerWallet || shopState.userWallet);
  const currentWallet = getCurrentFrontierWalletAddress();
  if (sellerWallet && sellerWallet === currentWallet) {
    return { ok: false, reason: "자신이 등록한 상품은 구매할 수 없습니다." };
  }
  const totalPrice = clampPlayerCredits(shopState.price * purchaseQty);
  const purchasedItemId = shopState.itemId;
  const purchasedItemName = ITEM_DEFS[purchasedItemId]?.name ?? purchasedItemId;
  if (!canAffordPlayerCredits(totalPrice)) {
    return { ok: false, reason: "개척 코인이 부족합니다." };
  }
  const inventorySnapshot = inventory.slots.map((slot) => (slot ? structuredClone(slot) : null));
  if (!addEntryToInventory(createInventorySlotEntry(purchasedItemId, purchaseQty), purchaseQty)) {
    return { ok: false, reason: "인벤토리 공간이 부족합니다." };
  }
  if (!spendPlayerCredits(totalPrice)) {
    for (let i = 0; i < inventory.slots.length; i += 1) inventory.slots[i] = inventorySnapshot[i];
    return { ok: false, reason: "개척 코인을 차감하지 못했습니다." };
  }
  if (!sellerWallet) {
    for (let i = 0; i < inventory.slots.length; i += 1) inventory.slots[i] = inventorySnapshot[i];
    setPlayerCredits(getPlayerCredits() + totalPrice);
    return { ok: false, reason: "판매자 정보를 찾을 수 없습니다." };
  }
  shopState.pendingCredits = clampPlayerCredits((shopState.pendingCredits || 0) + totalPrice);
  shopState.lifetimeCredits = clampPlayerCredits((shopState.lifetimeCredits || 0) + totalPrice);
  shopState.quantity -= purchaseQty;
  if (shopState.quantity <= 0) {
    shopState.itemId = "";
    shopState.quantity = 0;
    shopState.price = 0;
    shopState.statusText = "비어 있음";
  } else {
    shopState.statusText = formatFrontierShopStatusText(shopState.itemId, shopState.quantity, shopState.price);
  }
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  updateInventoryUI();
  schedulePlayerSaveSync(true);
  if (frontierBuildOpen) renderFrontierBuildWindow();
  return {
    ok: true,
    itemName: purchasedItemName,
    totalPrice,
  };
}

function commitFrontierShopListing() {
  const parcelLabel = frontierShopRegisterParcelLabel || getSelectedFrontierParcelLabel();
  if (!parcelLabel) return false;
  if (!canRegisterFrontierShopListing(parcelLabel)) return false;
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
  shopState.sellerWallet = getCurrentFrontierWalletAddress();
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
  const listingSummary = getFrontierShopListingSummary(shopState);
  const assignedWallet = getFrontierShopAssignedWallet(parcelLabel);
  frontierShopTitle.textContent = `${parcelLabel} 판매 등록`;
  frontierShopCurrentStatus.innerHTML = listingSummary.active
    ? `현재 판매 상태: <strong>${listingSummary.statusText}</strong><br><span style="font-weight:600;color:#6b6053;">상품 ${listingSummary.itemName} / 재고 ${listingSummary.quantity}개 / 개당 ${listingSummary.price}원 / 상점 사용자 ${assignedWallet ? shortenWalletAddress(assignedWallet) : "미지정"}</span>`
    : `현재 판매 상태: <strong>비어 있음</strong><br><span style="font-weight:600;color:#6b6053;">상점 사용자 ${assignedWallet ? shortenWalletAddress(assignedWallet) : "미지정"} / 판매 중인 상품 없음</span>`;
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
  frontierShopSelectedOwned.textContent = frontierShopRegisterSelectedItemId
    ? `보유 수량: ${frontierShopRegisterSelectedAvailable}개 / 등록 시 기존 상품은 회수 후 새 상품으로 교체됩니다.`
    : "보유 수량: 0개 / 판매할 아이템을 먼저 고르세요.";
  frontierShopQuantityInput.max = String(Math.max(1, frontierShopRegisterSelectedAvailable));
  if (!frontierShopRegisterSelectedItemId) {
    frontierShopQuantityInput.value = "1";
  }
  frontierShopRegisterBtn.disabled = !frontierShopRegisterSelectedItemId;
  frontierShopRegisterBtn.style.opacity = frontierShopRegisterBtn.disabled ? "0.58" : "1";
  frontierShopClearBtn.disabled = !canEditFrontierShopListing(parcelLabel);
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
  if ((shopState.itemId && shopState.quantity > 0) || clampPlayerCredits(shopState.pendingCredits || 0) > 0) {
    showUI("판매 물품 또는 정산금이 남아 있을 때는 상점 사용자를 변경할 수 없습니다.", 1200);
    lastMessageUntil = performance.now() + 1200;
    return false;
  }
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
  if ((shopState.itemId && shopState.quantity > 0) || clampPlayerCredits(shopState.pendingCredits || 0) > 0) {
    showUI("판매 물품 또는 정산금이 남아 있을 때는 사용자를 해제할 수 없습니다.", 1200);
    lastMessageUntil = performance.now() + 1200;
    return false;
  }
  shopState.userWallet = "";
  shopState.sellerWallet = "";
  schedulePlayerSaveSync(true);
  renderFrontierBuildWindow();
  showUI("상점 사용자를 해제했습니다.", 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function updateFrontierShopListingPrice(parcelLabel, nextPrice) {
  if (!parcelLabel) return false;
  if (!canEditFrontierShopListing(parcelLabel)) return false;
  const shopState = getFrontierShopOperation(parcelLabel);
  if (!shopState.itemId || shopState.quantity <= 0) return false;
  const price = Math.max(0, Math.min(999999, Math.floor(Number(nextPrice) || 0)));
  shopState.price = price;
  shopState.statusText = formatFrontierShopStatusText(shopState.itemId, shopState.quantity, price);
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  schedulePlayerSaveSync(true);
  renderFrontierBoothDialog();
  if (frontierBuildOpen) renderFrontierBuildWindow();
  showUI(`판매 가격을 ${price}원으로 수정했습니다.`, 1000);
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
  schedulePlayerSaveSync(true);
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
frontierBoothWin.dataset.defaultWidth = "min(520px, calc(100vw - 40px))";
frontierBoothWin.style.background = "rgba(245,245,245,0.98)";
frontierBoothWin.style.border = "1px solid rgba(0,0,0,0.16)";
frontierBoothWin.style.borderRadius = "18px";
frontierBoothWin.style.boxShadow = "0 18px 42px rgba(0,0,0,0.28)";
frontierBoothWin.style.display = "none";
frontierBoothWin.style.pointerEvents = "auto";
frontierBoothWin.style.zIndex = "1000004";
frontierBoothWin.style.overflow = "hidden";
frontierBoothWin.style.maxHeight = "calc(100vh - 48px)";
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
frontierBoothBody.style.maxHeight = "calc(100vh - 132px)";
frontierBoothBody.style.overflow = "hidden";
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
  renderFrontierBoothDialogUi({
    parcelLabel,
    slotKey,
    boothTitle,
    mode,
    buildState,
    slotState,
    getShopAssignedWallet: getFrontierShopAssignedWallet,
    getShopListingSummary: getFrontierShopListingSummary,
    getShopSellerWallet: getFrontierShopSellerWallet,
    canManageShopSlot: canManageFrontierShopSlot,
    isShopSeller: isFrontierShopSeller,
    canUseShopSlot: canUseFrontierShopSlot,
    shortenWalletAddress,
    itemDefs: ITEM_DEFS,
    formatPlayerCreditsLabel,
    clampPlayerCredits,
    getShopPurchaseFeedback: getFrontierShopPurchaseFeedback,
    tryPurchaseShopListing: tryPurchaseFrontierShopListing,
    showUi: showUI,
    setLastMessageUntil: (duration) => {
      lastMessageUntil = performance.now() + duration;
    },
    openShopRegisterDialog: openFrontierShopRegisterDialog,
    canRegisterShopListing: canRegisterFrontierShopListing,
    canManageShopSellerTools: canManageFrontierShopSellerTools,
    canEditShopListing: canEditFrontierShopListing,
    updateShopListingPrice: updateFrontierShopListingPrice,
    clearShopListing: clearFrontierShopListing,
    canCollectShopSettlement: canCollectFrontierShopSettlement,
    collectShopSettlement: collectFrontierShopSettlement,
    assignShopSlotUser: assignFrontierShopSlotUser,
    clearShopSlotUser: clearFrontierShopSlotUser,
    getDisplaySummary: getFrontierDisplaySummary,
    getDisplayAssignedWallet: getFrontierDisplayAssignedWallet,
    canManageDisplaySlot: canManageFrontierDisplaySlot,
    canUseDisplaySlot: canUseFrontierDisplaySlot,
    getCurrentWallet: getCurrentFrontierWalletAddress,
    assignDisplaySlotUser: assignFrontierDisplaySlotUser,
    clearDisplaySlotUser: clearFrontierDisplaySlotUser,
    clearDisplayEntry: clearFrontierDisplayEntry,
    getDisplayableEntries: getDisplayableFrontierEntries,
    createInventoryEntryVisualElement,
    getInventoryEntryDisplayName,
    isNftInventoryEntry,
    getSlotItemCount,
    assignDisplayEntry: assignFrontierDisplayEntry,
    rerender: renderFrontierBoothDialog,
  }, {
    win: frontierBoothWin,
    title: frontierBoothTitle,
    status: frontierBoothStatus,
    actionArea: frontierBoothActionArea,
  });
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
const CAMERA_OCCLUSION_MARGIN = 0.18;
const CAMERA_OCCLUSION_MIN_DISTANCE = 4.2;
const CAMERA_OCCLUSION_FADE_DISTANCE = 5.0;
const CAMERA_OCCLUSION_FADE_OPACITY = 0.68;
const CAMERA_OCCLUSION_RETURN_SPEED = 7.5;
const cameraOcclusionRay = new THREE.Raycaster();
const cameraOcclusionTarget = new THREE.Vector3();
const cameraOcclusionDir = new THREE.Vector3();
const cameraOcclusionResolvedPos = new THREE.Vector3();
let cameraPreferredDistance = camera.position.distanceTo(controls.target);
let cameraResolvedDistance = cameraPreferredDistance;
let cameraWasOccludedLastFrame = false;
const cameraOcclusionFadedMeshes = new Set();

function snapCameraToPlayer() {
  const currentOffset = new THREE.Vector3().copy(camera.position).sub(controls.target);
  controls.target.copy(player.position).add(followTargetOffset);
  camera.position.copy(controls.target).add(currentOffset);
  lastFollowPlayerPosition.copy(player.position);
  controls.update();
}

function clearCameraOcclusionFades() {
  if (!cameraOcclusionFadedMeshes.size) return;
  for (const mesh of cameraOcclusionFadedMeshes) {
    if (!mesh?.material || !mesh.userData?.cameraFadeOriginal) continue;
    const original = mesh.userData.cameraFadeOriginal;
    if (Array.isArray(mesh.material)) {
      for (const mat of mesh.material) {
        mat.transparent = original.transparent;
        mat.opacity = original.opacity;
      }
    } else {
      mesh.material.transparent = original.transparent;
      mesh.material.opacity = original.opacity;
    }
  }
  cameraOcclusionFadedMeshes.clear();
}

function markCameraOcclusionFade(root, opacity = CAMERA_OCCLUSION_FADE_OPACITY) {
  if (!root) return;
  root.traverse((child) => {
    if (!child?.isMesh || !child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    if (!materials.some((mat) => (mat?.opacity ?? 1) > 0.05)) return;
    if (!child.userData.cameraFadeOriginal) {
      child.userData.cameraFadeOriginal = {
        transparent: materials[0].transparent,
        opacity: materials[0].opacity,
      };
    }
    for (const mat of materials) {
      mat.transparent = true;
      mat.opacity = Math.min(mat.opacity, opacity);
    }
    cameraOcclusionFadedMeshes.add(child);
  });
}

function getCameraFadeRootFromHit(hitObject) {
  if (!hitObject) return null;
  const hitMaterial = hitObject.material;
  const hitOpacity = Array.isArray(hitMaterial) ? (hitMaterial[0]?.opacity ?? 1) : (hitMaterial?.opacity ?? 1);
  if (hitObject.isMesh && hitOpacity > 0.05) return hitObject;

  let node = hitObject.parent;
  while (node && node !== scene) {
    if (node.isMesh || node.type === "Group") return node;
    node = node.parent;
  }
  return hitObject.parent && hitObject.parent !== scene ? hitObject.parent : null;
}

function updateThirdPersonCameraOcclusion(dt) {
  clearCameraOcclusionFades();

  cameraOcclusionTarget.copy(controls.target).addScalar(0);
  cameraOcclusionTarget.y += 0.22;

  const currentOffset = new THREE.Vector3().copy(camera.position).sub(controls.target);
  let currentDistance = currentOffset.length();
  if (currentDistance < 0.001) return;

  cameraOcclusionDir.copy(currentOffset).normalize();

  if (!cameraWasOccludedLastFrame || currentDistance > cameraResolvedDistance + 0.2) {
    cameraPreferredDistance = THREE.MathUtils.clamp(currentDistance, CAMERA_OCCLUSION_MIN_DISTANCE, controls.maxDistance);
  }

  let desiredDistance = cameraPreferredDistance;
  let resolvedDistance = desiredDistance;
  cameraOcclusionRay.far = desiredDistance;
  cameraOcclusionRay.set(cameraOcclusionTarget, cameraOcclusionDir);
  const hits = cameraOcclusionRay.intersectObjects(colliders, false);

  let fadeRoot = null;
  if (hits.length) {
    const hit = hits[0];
    resolvedDistance = Math.max(CAMERA_OCCLUSION_MIN_DISTANCE, hit.distance - CAMERA_OCCLUSION_MARGIN);
    cameraWasOccludedLastFrame = true;
    if (resolvedDistance <= CAMERA_OCCLUSION_FADE_DISTANCE) {
      fadeRoot = getCameraFadeRootFromHit(hit.object);
    }
  } else {
    cameraWasOccludedLastFrame = false;
    resolvedDistance = THREE.MathUtils.lerp(currentDistance, desiredDistance, Math.min(1, dt * CAMERA_OCCLUSION_RETURN_SPEED));
  }

  cameraResolvedDistance = resolvedDistance;
  if (fadeRoot) {
    markCameraOcclusionFade(fadeRoot);
  }

  cameraOcclusionResolvedPos.copy(controls.target).addScaledVector(cameraOcclusionDir, resolvedDistance);
  camera.position.copy(cameraOcclusionResolvedPos);
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

  const stump = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.38, 0.44, 8),
    new THREE.MeshStandardMaterial({ color: 0x5f4633, roughness: 1.0, transparent: true, opacity: 0 })
  );
  stump.position.y = 0.22;
  stump.visible = false;

  const sproutStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.05, 0.38, 6),
    new THREE.MeshStandardMaterial({ color: 0x5b8a47, roughness: 1.0, transparent: true, opacity: 0 })
  );
  sproutStem.position.y = 0.38;

  const sproutLeafLeft = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x73a95c, roughness: 1.0, transparent: true, opacity: 0 })
  );
  sproutLeafLeft.position.set(-0.08, 0.6, 0);
  sproutLeafLeft.scale.set(1.1, 0.6, 0.9);
  sproutLeafLeft.rotation.z = -0.4;

  const sproutLeafRight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x7cb563, roughness: 1.0, transparent: true, opacity: 0 })
  );
  sproutLeafRight.position.set(0.08, 0.62, 0);
  sproutLeafRight.scale.set(1.05, 0.55, 0.85);
  sproutLeafRight.rotation.z = 0.42;

  const sprout = new THREE.Group();
  sprout.add(sproutStem, sproutLeafLeft, sproutLeafRight);
  sprout.visible = false;

  g.add(trunk, leaves, stump, sprout);
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
  g.userData.stump = stump;
  g.userData.sprout = sprout;
  g.userData.trunkBaseY = trunk.position.y;
  g.userData.leavesBaseY = leaves.position.y;
  g.userData.baseRotationZ = 0;
  g.userData.harvestShakeUntil = 0;
  g.userData.harvestShakeStartedAt = 0;
  harvestTrees.push(g);

  return g;
}

// 캐릭터급 바위 (충돌 포함)
function makeRock(x, z, rockSizeDef = ROCK_SIZE_DEFS[1], fadeIn = false, options = {}) {
  const scale = rockSizeDef.scale;
  const rockColor = options.color ?? 0x6f6f72;
  const defaultResourceCount = getRockDefaultResourceCount(rockSizeDef, options);
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
    mapId: options.mapId ?? "광산",
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
      getRockSizeDefById(spawn?.rockSize, ROCK_SIZE_DEFS) ??
      ROCK_SIZE_DEFS[Math.floor(Math.random() * ROCK_SIZE_DEFS.length)];
    const next = spawn?.mapId === "폐광"
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
  tree.userData.harvestCooldownUntil = active ? 0 : getHarvestTreeCooldownUntil(performance.now(), TREE_HARVEST_RESPAWN_MS);
  updateHarvestTreeVisualState(tree, active, active ? 1 : 0);
}

function updateHarvestTreeVisualState(tree, active, regrowthProgress = 1) {
  if (!tree?.userData) return;
  const trunk = tree.userData.trunk;
  const leaves = tree.userData.leaves;
  const stump = tree.userData.stump;
  const sprout = tree.userData.sprout;
  const progress = THREE.MathUtils.clamp(regrowthProgress, 0, 1);
  const trunkBaseY = tree.userData.trunkBaseY ?? 1.1;
  const leavesBaseY = tree.userData.leavesBaseY ?? 2.6;

  if (active) {
    if (trunk?.material) {
      trunk.visible = true;
      trunk.scale.y = 1;
      trunk.position.y = trunkBaseY;
      trunk.material.transparent = false;
      trunk.material.opacity = 1;
    }
    if (leaves?.material) {
      leaves.visible = true;
      leaves.scale.setScalar(1);
      leaves.position.y = leavesBaseY;
      leaves.material.transparent = false;
      leaves.material.opacity = 1;
    }
    if (stump?.material) {
      stump.visible = false;
      stump.material.opacity = 0;
    }
    if (sprout) {
      sprout.visible = false;
      sprout.scale.setScalar(0.2);
      for (const child of sprout.children) {
        if (child.material) child.material.opacity = 0;
      }
    }
    return;
  }

  const trunkScaleY = THREE.MathUtils.lerp(0.22, 1, progress);
  const leavesScale = THREE.MathUtils.lerp(0.12, 1, progress);
  const leavesOpacity = THREE.MathUtils.lerp(0.08, 0.92, progress);
  const stumpOpacity = THREE.MathUtils.lerp(0.95, 0.18, progress);
  const sproutOpacity = THREE.MathUtils.clamp(progress * 1.15, 0, 0.92);
  const sproutScale = THREE.MathUtils.lerp(0.25, 1.05, progress);

  if (trunk?.material) {
    trunk.visible = true;
    trunk.scale.y = trunkScaleY;
    trunk.position.y = trunkBaseY * trunkScaleY;
    trunk.material.transparent = true;
    trunk.material.opacity = THREE.MathUtils.lerp(0.32, 0.9, progress);
  }
  if (leaves?.material) {
    leaves.visible = true;
    leaves.scale.setScalar(leavesScale);
    leaves.position.y = THREE.MathUtils.lerp(0.95, leavesBaseY, progress);
    leaves.material.transparent = true;
    leaves.material.opacity = leavesOpacity;
  }
  if (stump?.material) {
    stump.visible = true;
    stump.material.transparent = true;
    stump.material.opacity = stumpOpacity;
  }
  if (sprout) {
    sprout.visible = true;
    sprout.scale.setScalar(sproutScale);
    for (const child of sprout.children) {
      if (child.material) {
        child.material.transparent = true;
        child.material.opacity = sproutOpacity;
      }
    }
  }
}

function updateHarvestTrees() {
  const now = performance.now();
  for (const tree of harvestTrees) {
    if (!tree?.parent) continue;
    const shakeUntil = tree.userData.harvestShakeUntil ?? 0;
    if (shakeUntil > now) {
      const startedAt = tree.userData.harvestShakeStartedAt ?? now;
      tree.rotation.z = getHarvestTreeShakeRotation(
        now,
        startedAt,
        shakeUntil,
        tree.userData.baseRotationZ ?? 0,
        THREE.MathUtils
      );
    } else {
      tree.rotation.z = THREE.MathUtils.lerp(tree.rotation.z, tree.userData.baseRotationZ ?? 0, 0.24);
    }

    if (!tree.userData.harvestDisabled) continue;
    updateHarvestTreeVisualState(
      tree,
      false,
      getHarvestTreeRegrowthProgress(now, tree.userData.harvestCooldownUntil ?? 0, TREE_HARVEST_RESPAWN_MS, THREE.MathUtils)
    );
    if (isHarvestTreeReady(now, tree.userData.harvestCooldownUntil ?? 0)) {
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

function buildBasicShoesModel() {
  const g = new THREE.Group();
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0xc49a6c,
    roughness: 0.94,
    metalness: 0.02,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0x7d6247,
    roughness: 0.98,
    metalness: 0.01,
  });

  const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.44), soleMat);
  leftSole.position.set(-0.18, 0.04, 0.02);
  g.add(leftSole);
  const leftUpper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.34), shoeMat);
  leftUpper.position.set(-0.18, 0.12, 0.02);
  g.add(leftUpper);

  const rightSole = leftSole.clone();
  rightSole.position.x = 0.18;
  g.add(rightSole);
  const rightUpper = leftUpper.clone();
  rightUpper.position.x = 0.18;
  g.add(rightUpper);

  return g;
}

function buildSingleBasicShoeModel() {
  const g = new THREE.Group();
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0xc49a6c,
    roughness: 0.94,
    metalness: 0.02,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0x7d6247,
    roughness: 0.98,
    metalness: 0.01,
  });

  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.44), soleMat);
  sole.position.set(0, 0.04, 0.07);
  g.add(sole);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.34), shoeMat);
  upper.position.set(0, 0.11, 0.06);
  g.add(upper);

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

function makeBasicShoes(x, z, y = 0, rotation = null) {
  const g = buildBasicShoesModel();
  g.position.set(x, y, z);

  if (rotation) {
    g.rotation.set(rotation.x, rotation.y, rotation.z);
  }

  g.userData.isBasicShoes = true;
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
      mapId: "폐광",
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
buildMinePerimeterCliffs({
  scene,
  addCollider,
  startX: START_X,
  startZ: START_Z,
});
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

const basicShoes = makeBasicShoes(
  START_X + 0.18,
  START_Z - 2.5,
  START_FLAT_Y,
  {
    x: 0,
    y: Math.PI * 0.08,
    z: 0,
  }
);
restPropOnSupport(basicShoes, startStall.top);
enableDynamicProp(basicShoes, { sleeping: true });
registerPickupItem(basicShoes, "basicShoes", "E : 기본신발 줍기");

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

mineGate = buildTravelGate({
  scene,
  x: START_X,
  z: START_Z - 51.2,
  rotationY: Math.PI,
  startFlatY: START_FLAT_Y,
});
mineGate.userData.mapId = "광산";
registerWalkableSurface("광산", mineGate.userData.walkSurface, 0.45);
({ airPurifierStation } = buildCampTestArea({
  scene,
  groundSurfaces,
  registerWalkableSurface,
  registerCaveDarkMaterial,
  addCollider,
  buildAirPurifierStation,
  buildFreshAirCanisterModel,
  registerPickupItem,
  startFlatY: START_FLAT_Y,
  campMapX: CAMP_MAP_X,
  campMapZ: CAMP_MAP_Z,
}));
buildCavePollutionField();
spawnCaveMasonryRocks();
campGate = buildTravelGate({
  scene,
  x: CAMP_MAP_X,
  z: CAMP_MAP_Z + GROUND_SIZE * 0.5 + 1.25,
  rotationY: 0,
  startFlatY: START_FLAT_Y,
});
campGate.userData.mapId = "폐광";
registerWalkableSurface("폐광", campGate.userData.walkSurface, 0.45);
buildMapConnectorTunnel(mineGate, campGate);
const frontierAreaBuildData = buildFrontierAreaFromMaps({
  scene,
  groundSurfaces,
  interactables,
  registerWalkableSurface,
  addCollider,
  makeSign,
  rebuildFrontierParcelConstructionVisual,
  buildAirPurifierStation,
  buildFrontierBuildingSign,
  registerResidenceMapZone,
  renderResidenceNoticeBoard,
  residenceNoticeBoardVisuals,
  frontierParcelBorderColor: FRONTIER_PARCEL_BORDER_COLOR,
  startFlatY: START_FLAT_Y,
  frontierMapX: FRONTIER_MAP_X,
  frontierMapZ: FRONTIER_MAP_Z,
});
frontierParcelDefs = frontierAreaBuildData.frontierParcelDefs;
frontierParcelConstructionRoots = frontierAreaBuildData.frontierParcelConstructionRoots;
frontierParcelConstructionGroups = frontierAreaBuildData.frontierParcelConstructionGroups;
frontierParcelConstructionColliders = frontierAreaBuildData.frontierParcelConstructionColliders;
frontierAirPurifierStation = frontierAreaBuildData.frontierAirPurifierStation;
mansionOneEntranceInteractable = frontierAreaBuildData.mansionOneEntranceInteractable;
mansionOneExteriorReturn = frontierAreaBuildData.mansionOneExteriorReturn;
mansionOneRoomRoot = frontierAreaBuildData.mansionOneRoomRoot;
mansionOneRoom102Root = frontierAreaBuildData.mansionOneRoom102Root;
mansionOneRoomInstances["101"] = frontierAreaBuildData.mansionOneRoomInstances["101"];
mansionOneRoomInstances["102"] = frontierAreaBuildData.mansionOneRoomInstances["102"];
for (const parcel of frontierParcelDefs) {
  rebuildFrontierParcelConstructionVisual(parcel.label);
}
frontierCampGate = buildTravelGate({
  scene,
  x: CAMP_MAP_X,
  z: CAMP_MAP_Z - GROUND_SIZE * 0.5 - 1.25,
  rotationY: Math.PI,
  startFlatY: START_FLAT_Y,
});
frontierCampGate.userData.mapId = "폐광";
registerWalkableSurface("폐광", frontierCampGate.userData.walkSurface, 0.45);
frontierGate = buildTravelGate({
  scene,
  x: FRONTIER_MAP_X,
  z: FRONTIER_MAP_Z + FRONTIER_GROUND_SIZE * 0.5 + 1.25,
  rotationY: 0,
  startFlatY: START_FLAT_Y,
});
frontierGate.userData.mapId = "개척지";
registerWalkableSurface("개척지", frontierGate.userData.walkSurface, 0.45);
buildMapConnectorTunnel(frontierCampGate, frontierGate);

const abandonedMineGate = registerMapGate({
  mapId: "광산",
  targetMapId: "폐광",
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
  hint: "북쪽 갱도로 들어가면 폐광으로 이어집니다",
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
  mapId: "폐광",
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
  targetMapId: "폐광",
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
  const isBuyerProfile = activeDevProfileId === "dev_user_2";

  for (let i = 0; i < inventory.slots.length; i++) {
    inventory.slots[i] = null;
  }
  for (let i = 0; i < personalStorage.slots.length; i += 1) {
    personalStorage.slots[i] = null;
  }

  inventory.pickaxeLevel = Math.max(
    0,
    clampPickaxeLevel(isBuyerProfile ? 1 : 5, PICKAXE_UPGRADE_LEVELS)
  );
  inventory.mineKeyIssued = Boolean(DEV_PRESET.unlockAbandonedMine);
  inventory.abandonedMineUnlocked = Boolean(DEV_PRESET.unlockAbandonedMine);
  for (const key of QUICK_USE_ALLOWED_KEYS) inventory.quickUse[key] = null;
  inventory.equipped.head = null;
  inventory.equipped.body = null;
  inventory.equipped.shoes = null;
  inventory.equipped.tool = null;
  setPlayerCredits(0);

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

  setPlayerCredits(500);
  if (isBuyerProfile) {
    addItem("freshAirCanister", 2);
    ensureExactOwnedItemCount("mansionOneRoom102Permit", 1);
  } else {
    for (const itemId of getDevBulkGrantItemIds()) {
      addItem(itemId, INVENTORY_STACK_LIMIT);
    }
    for (const label of FRONTIER_PARCEL_LABELS) {
      const permitId = getFrontierParcelAuthorityItemId(label);
      if (permitId) ensureExactOwnedItemCount(permitId, 1);
    }
    ensureExactOwnedItemCount("mansionOneRoom101Permit", 1);
  }

  playerAirCurrent = AIR_GAUGE_MAX;
  playerAirMax = AIR_GAUGE_MAX;
  resetAllMapPurificationValues();

  for (const nftEntry of DEV_MOCK_NFT_ITEMS) {
    addInventoryEntry(nftEntry);
  }

  if (inventory.mineKeyIssued) {
    ensureExactOwnedItemCount("abandonedMineKey", 1);
  } else {
    removeAllItemsById("abandonedMineKey");
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

  currentMapId = DEV_PRESET.startMapId ?? "광산";
  updateSceneFogForCurrentMap();
  const startSpawn = currentMapId === "폐광"
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
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
  snapCameraToPlayer();
  updateInventoryUI();
}

function applyFreshPlayerStartState() {
  nftExhibitSelectedItem = null;
  destroyMansionRoomInstance("101");
  destroyMansionRoomInstance("102");
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
  resetAllMapPurificationValues();

  restoreLockedMapGate(abandonedMineGate);

  currentMapId = "광산";
  updateSceneFogForCurrentMap();
  player.position.set(START_X, player.position.y, START_Z);
  player.rotation.y = 0;
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
  snapCameraToPlayer();
  setPersonalStorageOpen(false);
  updateInventoryUI();
  if (questOpen) renderQuestWindow();
}

function createDefaultPlayerSave() {
  return createDefaultPlayerSaveFromModule({
    playerSaveVersion: PLAYER_SAVE_VERSION,
    startX: START_X,
    startY: player.position.y,
    startZ: START_Z,
    airGaugeMax: AIR_GAUGE_MAX,
    inventorySlotCount: inventory.slots.length,
    personalStorageSlotCount: personalStorage.slots.length,
    createDefaultFrontierBuildState,
  });
}

function serializePlayerSave() {
  return serializePlayerSaveData({
    playerSaveVersion: PLAYER_SAVE_VERSION,
    currentMapId,
    playerPosition: player.position,
    playerRotationY: player.rotation.y,
    clampPlayerCredits,
    playerCredits,
    inventory,
    tutorialQuest,
    playerAirCurrent,
    playerAirMax,
    getMapPurificationValue,
    personalStorage,
    mansionOneActiveRoomKey,
    frontierBuildState,
    nftExhibitSelectedItem,
    quickUseAllowedKeys: QUICK_USE_ALLOWED_KEYS,
  });
}

function applySerializedPlayerSave(rawSave, { preserveSharedWorld = false } = {}) {
  const source = buildNormalizedPlayerSaveSource(rawSave, {
    createDefaultPlayerSave,
    normalizeFrontierBuildState,
    normalizeNftBoardSelection,
  });
  if (preserveSharedWorld) {
    source.frontierBuild = normalizeFrontierBuildState(frontierBuildState);
  }

  for (let i = 0; i < inventory.slots.length; i++) {
    const slot = source.inventory.slots[i] ?? null;
    inventory.slots[i] = normalizeInventorySlotEntry(slot);
  }

  inventory.pickaxeLevel = Math.max(
    0,
    clampPickaxeLevel(source.inventory.pickaxeLevel ?? 0, PICKAXE_UPGRADE_LEVELS)
  );
  inventory.mineKeyIssued = Boolean(source.inventory.mineKeyIssued);
  inventory.abandonedMineUnlocked = preserveSharedWorld
    ? Boolean(inventory.abandonedMineUnlocked)
    : Boolean(source.inventory.abandonedMineUnlocked);
  for (const key of QUICK_USE_ALLOWED_KEYS) {
    inventory.quickUse[key] = normalizeQuickUseBinding(source.inventory.quickUse[key]);
  }
  inventory.equipped.head = normalizeEquippedItemRef(source.inventory.equipped.head);
  inventory.equipped.body = normalizeEquippedItemRef(source.inventory.equipped.body);
  inventory.equipped.shoes = normalizeEquippedItemRef(source.inventory.equipped.shoes);
  inventory.equipped.tool = normalizeEquippedItemRef(source.inventory.equipped.tool);
  setPlayerCredits(source.economy.credits);
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
  if (!preserveSharedWorld) {
    for (const mapId of Object.keys(MAP_POLLUTION_CONFIG)) {
      setMapPurificationValue(mapId, Number(source.airSystem.mapPurification?.[mapId]) || 0);
    }
  }
  for (let i = 0; i < personalStorage.slots.length; i += 1) {
    const slot = source.personalStorage.slots?.[i] ?? null;
    personalStorage.slots[i] = normalizeInventorySlotEntry(slot);
  }
  if (!preserveSharedWorld) {
    frontierBuildState = normalizeFrontierBuildState(source.frontierBuild);
  }
  if (!preserveSharedWorld) {
    nftExhibitSelectedItem = normalizeNftBoardSelection(source.displayBoard);
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
  } else {
    restoreLockedMapGate(abandonedMineGate);
  }

  currentMapId = ["광산", "폐광", "개척지", RESIDENCE_MAP_ID].includes(source.mapId)
    ? source.mapId
    : "광산";
  const restoredResidenceRoomKey = source.residence?.activeRoomKey === "102" ? "102" : "101";
  mansionOneActiveRoomKey = restoredResidenceRoomKey;
  if (currentMapId === RESIDENCE_MAP_ID) {
    createMansionRoomInstance(restoredResidenceRoomKey);
    destroyMansionRoomInstance(restoredResidenceRoomKey === "102" ? "101" : "102");
  } else {
    destroyMansionRoomInstance("101");
    destroyMansionRoomInstance("102");
  }
  updateSceneFogForCurrentMap();
  player.position.set(
    Number.isFinite(source.position?.x) ? source.position.x : START_X,
    Number.isFinite(source.position?.y) ? source.position.y : player.position.y,
    Number.isFinite(source.position?.z) ? source.position.z : START_Z
  );
  player.rotation.y = Number.isFinite(source.rotationY) ? source.rotationY : 0;
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
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

function renderResidenceNoticeBoard(boardKey) {
  const visual = residenceNoticeBoardVisuals[boardKey];
  if (!visual?.canvas || !visual?.texture) return;
  const entry = normalizeResidenceNoticeBoardEntry(boardKey, residenceNoticeBoardState[boardKey]);
  const ctx = visual.canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, visual.canvas.width, visual.canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, visual.canvas.width, visual.canvas.height);
  ctx.fillStyle = "#1f2933";
  ctx.font = "bold 54px Arial";
  ctx.textAlign = "center";
  ctx.fillText(entry.title, visual.canvas.width * 0.5, 92);
  ctx.strokeStyle = "#d1d8e0";
  ctx.lineWidth = 6;
  ctx.strokeRect(58, 132, visual.canvas.width - 116, visual.canvas.height - 190);
  ctx.fillStyle = "#425466";
  ctx.font = "700 34px Arial";
  entry.lines.forEach((line, index) => {
    ctx.fillText(line, visual.canvas.width * 0.5, 252 + index * 74);
  });
  visual.texture.needsUpdate = true;
}

function renderResidenceNoticeBoards() {
  for (const key of RESIDENCE_NOTICE_BOARD_KEYS) {
    renderResidenceNoticeBoard(key);
  }
}

function buildAirPurifierStation(x, z, rotationY = Math.PI, mapId = "폐광") {
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
  if (!canPlayGame() || isWorkUiMovementLocked() || !keys.shift) return;
  shiftRotatePointerActive = true;
  shiftRotateLastX = e.clientX;
  shiftRotateLastY = e.clientY;
  controls.enabled = false;
});

window.addEventListener("pointerup", () => {
  shiftRotatePointerActive = false;
  controls.enabled = canPlayGame() && !isWorkUiMovementLocked();
});

window.addEventListener("pointercancel", () => {
  shiftRotatePointerActive = false;
  controls.enabled = canPlayGame() && !isWorkUiMovementLocked();
});

window.addEventListener("pointermove", (e) => {
  if (!shiftRotatePointerActive || !keys.shift || !canPlayGame() || isWorkUiMovementLocked()) return;

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

  if (isWorkUiMovementLocked() && (k in keys || k === "shift")) {
    if (k in keys) keys[k] = false;
    if (k === "shift") {
      keys.shift = false;
      shiftRotatePointerActive = false;
      controls.enabled = canPlayGame() && !isWorkUiMovementLocked();
    }
    return;
  }

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
    const slotKey = activeInteractable.slotKey ?? "displayA";
    const mode = canManageFrontierDisplaySlot(parcelLabel, slotKey) || canUseFrontierDisplaySlot(parcelLabel, slotKey) ? "manage" : "view";
    openFrontierBoothDialog(parcelLabel, activeInteractable.slotKey ?? "displayA", activeInteractable.boothTitle ?? "전시", mode);
    return;
  }

  if (activeInteractable?.type === "mansionEntry") {
    if (!hasMansionOneResidenceAuthority()) {
      showUI("거주권 필요", 1000);
      return;
    }
    if (enterMansionOneRoom(getOwnedMansionRoomKey())) return;
  }

  if (activeInteractable?.type === "mansionExit") {
    if (exitMansionOneRoom()) return;
  }

  if (activeInteractable?.type === "refinery") {
    setRefineryOpen(!refineryOpen);
    return;
  }

  if (activeInteractable?.type === "airPurifier") {
    if (tryUseAirPurifier(activeInteractable.purifierMapId ?? "폐광")) {
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
  if (isWorkUiMovementLocked()) {
    if (k in keys) keys[k] = false;
    if (k === "shift") {
      keys.shift = false;
      shiftRotatePointerActive = false;
      controls.enabled = canPlayGame() && !isWorkUiMovementLocked();
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
  return getPlayerBoxFromPosition(player.position);
}

function ensurePlayerNotInsideGeneratedColliders(colliderObjects = [], fallback = null, message = "구조물 생성으로 위치를 조정했습니다.") {
  if (!Array.isArray(colliderObjects) || !colliderObjects.length || !fallback) return false;
  const playerBox = getPlayerBox();
  const overlaps = hasPlayerOverlapWithColliderObjects({
    playerBox,
    colliderObjects,
    getTrackedColliderIndex,
    colliderBoxes,
  });
  if (!overlaps) return false;

  player.position.set(
    Number.isFinite(fallback.x) ? fallback.x : player.position.x,
    Number.isFinite(fallback.y) ? fallback.y : player.position.y,
    Number.isFinite(fallback.z) ? fallback.z : player.position.z
  );
  if (Number.isFinite(fallback.rotationY)) {
    player.rotation.y = fallback.rotationY;
    latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
  }
  snapCameraToPlayer();
  if (message) {
    showUI(message, 950);
    lastMessageUntil = performance.now() + 950;
  }
  return true;
}

function intersectsAnyCollider(playerBox) {
  return intersectsAnyColliderBox(playerBox, colliderBoxes);
}

const {
  isBlockedByStartRing,
  isInStartRingOpening,
  isCrossingBlockedStartRing,
  resolveStartRingPenetration,
  isStartRingTransitionBlocked,
} = createStartRingRuleHelpers({
  startWallOn: START_WALL_ON,
  startX: START_X,
  startZ: START_Z,
  startRadius: START_RADIUS,
  startRingThickness: START_RING_THICKNESS,
  openCenter: START_RING_OPEN_CENTER,
  openRatio: START_RING_OPEN_RATIO,
});

function getCurrentMapBounds() {
  const entries = walkableMapSurfaces.get(currentMapId) ?? [];
  return getCurrentMapBoundsFromSurfaces(entries, {
    minX: -GROUND_SIZE * 0.5 + 1.4,
    maxX: GROUND_SIZE * 0.5 - 1.4,
    minZ: -GROUND_SIZE * 0.5 + 1.4,
    maxZ: GROUND_SIZE * 0.5 - 1.4,
  });
}

function isInsideCurrentMapBounds(x, z) {
  const entries = walkableMapSurfaces.get(currentMapId) ?? [];
  return isInsideMapBoundsFromSurfaces(
    x,
    z,
    entries,
    getCurrentMapBounds()
  );
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

  if (isWorkUiMovementLocked()) {
    for (const key of Object.keys(keys)) keys[key] = false;
    shiftRotatePointerActive = false;
    controls.enabled = canPlayGame() && !isWorkUiMovementLocked();
    updatePlayerGroundY(dt);
    return;
  }

  if (mansionSleepOpen || mansionSleepPoseActive) {
    for (const key of Object.keys(keys)) keys[key] = false;
    updatePlayerGroundY(dt);
    applySleepPose({
      torso,
      head,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
    });
    return;
  }

  const { forward, right } = getMovementBasisVectors(camera);

  const move = buildMoveVector(keys, forward, right);
  const isMoving = isMoveVectorActive(move);

  if (isMoving) {
    normalizeMoveVector(move);
    updateLatestMoveDirection(latestMoveDir, move);
    const isDevMovementMode = isDevSession();
    const hasShoesEquipped = getEquippedItemForSlot("shoes") === "basicShoes";
    const airMoveScalar =
      isPollutedMap(currentMapId) && getMapPurificationValue(currentMapId) < 100 && playerAirCurrent <= 0
        ? 0.12
        : 1;
    // ===== 이동속도 튜닝값 =====
    // 값 수정은 src/core/movement.js 에서 진행하면 됩니다.
    const { speed } = getMovementSpeed({
      isDevMovementMode,
      hasShoesEquipped,
      shiftPressed: keys.shift,
      airMoveScalar,
    });
     
    const prevPos = player.position.clone();
    const delta = getMovementDelta(move, speed, dt);

    // 1) X축 이동만 먼저 시도
    const { afterX } = applyMovementCollisionStep({
      axis: "x",
      position: player.position,
      prevPos,
      delta,
      isInsideBounds: isInsideCurrentMapBounds,
      intersectsAnyCollider: () => intersectsAnyCollider(getPlayerBox()),
      isStartRingTransitionBlocked,
      isCrossingBlockedStartRing,
    });

    // 2) Z축 이동만 시도
    applyMovementCollisionStep({
      axis: "z",
      position: player.position,
      prevPos: { ...prevPos, x: afterX },
      delta,
      isInsideBounds: isInsideCurrentMapBounds,
      intersectsAnyCollider: () => intersectsAnyCollider(getPlayerBox()),
      isStartRingTransitionBlocked,
      isCrossingBlockedStartRing,
    });

    applyMovementPostCollisionCorrections({
      position: player.position,
      prevPos,
      resolveStartRingPenetration,
      startWallOn: START_WALL_ON,
      startHardClamp: START_HARD_CLAMP,
      startX: START_X,
      startZ: START_Z,
      startRadius: START_RADIUS,
    });

    const targetYaw = getMovementYaw(move);
    player.rotation.y = targetYaw;
  }

  // 간단 보행 모션
  const walkT = performance.now() * 0.015;
  const walkAnimSpeed = getWalkAnimationSpeed({
    isMoving,
    shiftPressed: keys.shift,
    isDevSession: isDevSession(),
    hasShoesEquipped: getEquippedItemForSlot("shoes") === "basicShoes",
  });
  const basePose = applyWalkIdlePose(
    {
      torso,
      head,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
    },
    { isMoving, walkT, walkAnimSpeed }
  );

  if (miningSwingTime > 0) {
    miningSwingTime = Math.max(0, miningSwingTime - dt);
    const phase = 1 - (miningSwingTime / currentMiningSwingDuration);

    applyMiningSwingPose(
      {
        torso,
        head,
        leftArmPivot,
        rightArmPivot,
        leftLegPivot,
        rightLegPivot,
      },
      phase,
      basePose
    );
  }

  if (pickupReachTime > 0 && miningSwingTime <= 0) {
    pickupReachTime = Math.max(0, pickupReachTime - dt);
    const phase = 1 - (pickupReachTime / PICKUP_REACH_DURATION);
    const reach = Math.sin(phase * Math.PI);

    applyPickupReachPose(
      {
        torso,
        leftArmPivot,
        rightArmPivot,
        leftLegPivot,
        rightLegPivot,
      },
      reach
    );
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
    triggerMiningSwing(activeHarvestTree);
    activeHarvestTree.userData.harvestShakeStartedAt = performance.now();
    activeHarvestTree.userData.harvestShakeUntil = activeHarvestTree.userData.harvestShakeStartedAt + 380;
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
  updateCompassFromDirection(getCompassDirection(latestMoveDir, player.rotation.y));

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
    }
  } else if (hasFrontierParcelAuthority(activeFrontierParcelLabel)) {
    hintText = "B : 건축 진행";
  }
}

// 7) 표지판 근접 문구 (위 힌트가 없을 때만)
if (!hintText && activeInteractable) {
  hintText = activeInteractable.type === "airPurifier"
    ? getAirPurifierHintText(activeInteractable.purifierMapId ?? "폐광")
    : activeInteractable.type === "frontierShopBooth"
      ? ((canManageFrontierShopSlot(activeInteractable.parcelLabel) || canUseFrontierShopSlot(activeInteractable.parcelLabel)) ? "E : 판매 관리" : "E : 판매 보기")
    : activeInteractable.type === "frontierDisplayBooth"
      ? ((canManageFrontierDisplaySlot(activeInteractable.parcelLabel, activeInteractable.slotKey ?? "displayA") || canUseFrontierDisplaySlot(activeInteractable.parcelLabel, activeInteractable.slotKey ?? "displayA")) ? "E : 전시 관리" : "E : 전시 보기")
      : activeInteractable.type === "mansionEntry"
      ? (hasMansionOneResidenceAuthority() ? `E : ${getOwnedMansionRoomPermitName()} 입장` : "")
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
  const viewportState = createMainCameraViewportState();
  syncMainCameraAspect(camera, viewportState);
  syncMainViewport(renderer, viewportState);
  resizeEquipmentPreview();
});
