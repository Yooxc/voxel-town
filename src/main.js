import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  buildPickaxeModel,
  buildShovelModel,
  buildSafetyHelmetModel,
  buildBasicShoesModel,
  buildSingleBasicShoeModel,
  buildFreshAirCanisterModel,
  buildPurifyPowderModel,
  alignWearableOnHead,
} from "./models/equipmentModels.js";
import {
  createBoardTextTexture,
  createBoardImageTexture,
} from "./world/nftBoard.js";
import {
  createWastelandStructureMesh,
  createWastelandFencePostMesh,
  createWastelandFenceLinkMesh,
  createWastelandPreviewCellMesh,
} from "./world/wastelandModels.js";
import { createFrontierWastelandCoordinator } from "./world/frontierWastelandCoordinator.js";
import { createFrontierParcelCoordinator } from "./world/frontierParcelCoordinator.js";
import { createFrontierSceneController } from "./world/frontierSceneController.js";
import { bootstrapWorld } from "./world/worldBootstrap.js";
import { renderResidenceNoticeBoardTexture } from "./world/residenceNoticeBoard.js";
import { createAirPurifierModel } from "./world/airPurifierModel.js";
import { createRefineryModel } from "./world/refineryModel.js";
import { createTunnelFenceModel } from "./world/tunnelFenceModel.js";
import { createForgeAnvilModel } from "./world/forgeAnvilModel.js";
import { createNftExhibitBoardModel } from "./world/nftExhibitBoardModel.js";
import {
  createHouseModel,
  createSignModel,
  createTutorialNpcModel,
} from "./world/startAreaModels.js";
import { createDynamicPropsRuntime } from "./world/dynamicProps.js";
import { createPlayerGroundingRuntime } from "./world/playerGrounding.js";
import { createMiningParticlesRuntime } from "./world/miningParticles.js";
import {
  findCaveRockSpawnPosition,
  findMineRockSpawnPosition,
  getRockSpawnBounds as getRockSpawnBoundsFromModule,
} from "./world/rockPlacement.js";
import {
  createPickupBasicShoes,
  createPickupPickaxe,
  createPickupSafetyHelmet,
  createPickupShovel,
} from "./world/pickupEquipmentModels.js";
import { createWorldPickupRuntime } from "./systems/worldPickups.js";
import { createTutorialNpcRuntime } from "./systems/tutorialNpcs.js";
import { createColliderRegistry } from "./world/colliderRegistry.js";
import { renderQuestWindowUi } from "./ui/questWindow.js";
import { createGatheringHud, getRockHpHudView } from "./ui/gatheringHud.js";
import {
  buildFrontierBuildingSign as buildFrontierBuildingSignFromModule,
  buildFrontierBoothLabel as buildFrontierBoothLabelFromModule,
  buildFrontierBoothProductVisual as buildFrontierBoothProductVisualFromModule,
  buildFrontierDisplayBoothVisual as buildFrontierDisplayBoothVisualFromModule,
} from "./world/frontierBoothModels.js";
import {
  WASTELAND_DIG_PROGRESS_GAIN,
  getWastelandCellClearProgress,
  syncWastelandCellStateFromProgress,
  applyWastelandCellVisual,
  clearWastelandCellHighlight,
  applyWastelandCellHighlight,
} from "./world/wastelandCells.js";
import {
  WASTELAND_BUILD_PART_DEFS,
  isWastelandBuildPartItemId,
  getWastelandBuildPartDef,
  getWastelandStructureSlotLabel,
  getWastelandStructureSurfaceY,
  getWastelandStructureRotationQuarter,
} from "./systems/wastelandBuilding.js";
import {
  createForgeUpgradeAttemptPlan,
  createForgeUpgradeResultPlan,
} from "./systems/forge.js";
import {
  createNftExhibitUi,
  renderNftExhibitTokenGrid,
  updateNftExhibitUiState,
} from "./ui/nftExhibitUi.js";
import {
  NFT_EXHIBIT_TARGET,
  createNftOwnedTokensCache,
  createNftBoardDefaultSelection,
  createNftBoardClearedSelection,
  normalizeNftBoardSelection,
  isSameNftBoardSelection,
  normalizeIpfsUrl,
  isValidHexAddress,
  isValidChainId,
  isValidTokenId,
  isValidNftImageRef,
  encodeUint256Call,
  encodeAddressCall,
  encodeAddressUintCall,
  encodeSupportsInterfaceCall,
  decodeAbiAddress,
  decodeAbiUint256,
  decodeAbiString,
  fetchErc721Owner,
  fetchErc721Balance,
  fetchErc721TokenOfOwnerByIndex,
  fetchSupportsInterface,
  fetchErc721TokenUri,
  fetchNftMetadata,
  fetchWalletOwnedExhibitTokens as fetchWalletOwnedExhibitTokensFromModule,
} from "./systems/nftExhibit.js";
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
import { createPlayerSaveCoordinator } from "./save/playerSaveCoordinator.js";
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
import { createInventoryRuntime } from "./systems/inventoryRuntime.js";
import { createFrontierRuntime } from "./systems/frontierRuntime.js";
import { createNftExhibitRuntime } from "./systems/nftExhibitRuntime.js";
import { createInventoryController } from "./ui/inventoryController.js";
import { createWorkstationController } from "./ui/workstationController.js";
import { createWastelandController } from "./ui/wastelandController.js";
import {
  createInventoryWindowUi,
  makeInventorySlotElement,
} from "./ui/inventoryWindow.js";
import { createInventoryGameplayController } from "./ui/inventoryGameplayController.js";
import { createInventoryEquipmentPreview } from "./ui/inventoryEquipmentPreview.js";
import { createInteractionController } from "./ui/interactionController.js";
import { createFrontierOperationsController } from "./ui/frontierOperationsController.js";
import { createFrontierWindowsUi } from "./ui/frontierWindowsUi.js";
import { createWorkstationWindowsUi } from "./ui/workstationWindowsUi.js";
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
  updateWastelandHudUi,
  updateWastelandFenceHudUi,
  createWastelandHudActionButtons,
  createWastelandClaimConfirmDialogUi,
  createWastelandClaimCancelDialogUi,
} from "./ui/hud.js";
import {
  getKeyInputCode,
  getLogicalInputKey,
  getFacingDirectionFromYaw,
  getCompassDirection,
  getMovementBasisVectors,
  buildMoveVector,
  isMoveVectorActive,
  normalizeMoveVector,
  getMovementSpeed,
  getMovementDelta,
  getMovementYaw,
  getWalkAnimationSpeed,
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
  syncPreviewPlayerPose,
  applySleepPose,
  applyWalkIdlePose,
  applyMiningSwingPose,
  applyPickupReachPose,
} from "./core/player.js";
import { findNearestByPosition } from "./core/proximity.js";
import { createPlayerGameplayCoordinator } from "./core/playerGameplayCoordinator.js";
import { findNearestInteractable, getInteractableHintText } from "./systems/interactions.js";
import { updateInteractableHighlights } from "./world/interactableHighlights.js";
import {
  setHarvestTreeActive as setHarvestTreeActiveFromModule,
  updateHarvestTrees as updateHarvestTreesFromModule,
  updateRockFadeIns as updateRockFadeInsFromModule,
} from "./world/resourceVisuals.js";
import { createHarvestTreeModel, createMineRockModel } from "./world/resourceModels.js";
import {
  createTreeSpawnPositions,
  createRockSpawnPlans,
  getCaveMasonryRockOptions,
} from "./world/resourceSpawn.js";
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
  createDefaultResidenceNoticeBoardState as createDefaultResidenceNoticeBoardStateFromModule,
  normalizeResidenceNoticeBoardEntry as normalizeResidenceNoticeBoardEntryFromModule,
  normalizeResidenceNoticeBoardState as normalizeResidenceNoticeBoardStateFromModule,
  getMansionRoomEntryPlan,
  getMansionRoomExitPlan,
  getMansionSleepPlan,
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
  createRockMiningPlan,
  createTreeHarvestPlan,
} from "./systems/resourceGathering.js";
import {
  canArchiveTutorialQuestStep,
  getCurrentTutorialQuestStep,
  getTutorialNpcLine as getTutorialNpcLineFromModule,
  getTutorialQuestProgressPlan,
} from "./systems/tutorialQuest.js";
import {
  AIR_GAUGE_MAX,
  AIR_CANISTER_RESTORE_AMOUNT,
  AIR_RECOVERY_PER_SECOND,
  MAP_POLLUTION_CONFIG,
} from "./systems/air.js";
import { createSurvivalWorkstationCoordinator } from "./systems/survivalWorkstationCoordinator.js";
import { createPlayerSaveRuntime } from "./save/playerSaveRuntime.js";
import { createSessionRuntime } from "./auth/sessionRuntime.js";
import { createDevProfileOrchestrator, createSessionController } from "./auth/sessionController.js";
import { createSessionWorkflowController } from "./auth/sessionWorkflowController.js";
import { createWalletSessionUi } from "./ui/walletSessionUi.js";
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
  findTriggeredMapGate as findTriggeredMapGateFromModule,
  getMapGateHintText as getMapGateHintTextFromModule,
  getCurrentMapIdForPlayer,
  buildMinePerimeterCliffs,
  buildTravelGate,
  buildCampTestArea,
  buildFrontierArea as buildFrontierAreaFromMaps,
} from "./systems/maps.js";
import { createMapRuntime } from "./systems/mapRuntime.js";
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
  getFrontierBoothInteractionPlan as getFrontierBoothInteractionPlanFromModule,
  getSellableFrontierShopEntries as getSellableFrontierShopEntriesFromModule,
  getFrontierShopRegistrationAccess as getFrontierShopRegistrationAccessFromModule,
  isFrontierDisplayableEntry as isFrontierDisplayableEntryFromModule,
  getDisplayableFrontierEntries as getDisplayableFrontierEntriesFromModule,
  getFrontierShopPurchaseFeedback as getFrontierShopPurchaseFeedbackFromModule,
  createFrontierShopPurchasePlan as createFrontierShopPurchasePlanFromModule,
  getFrontierShopListingClearPlan as getFrontierShopListingClearPlanFromModule,
  applyFrontierShopListingClearState as applyFrontierShopListingClearStateFromModule,
  getFrontierShopListingRegistrationPlan as getFrontierShopListingRegistrationPlanFromModule,
  applyFrontierShopListingRegistrationState as applyFrontierShopListingRegistrationStateFromModule,
  getFrontierShopSlotUserAssignmentPlan as getFrontierShopSlotUserAssignmentPlanFromModule,
  getFrontierShopSlotUserClearPlan as getFrontierShopSlotUserClearPlanFromModule,
  getFrontierShopListingPriceUpdatePlan as getFrontierShopListingPriceUpdatePlanFromModule,
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
  getWastelandDraftBounds as getWastelandDraftBoundsFromModule,
  isCellInsideWastelandBounds as isCellInsideWastelandBoundsFromModule,
  canLinkWastelandFencePostsByOwner as canLinkWastelandFencePostsByOwnerFromModule,
  findWastelandDraftReservationHit as findWastelandDraftReservationHitFromModule,
  getWastelandDraftPhaseState as getWastelandDraftPhaseStateFromModule,
  validateWastelandDraftRectangle as validateWastelandDraftRectangleFromModule,
  getWastelandClaimProgress as getWastelandClaimProgressFromModule,
  canCompleteWastelandClaimState as canCompleteWastelandClaimStateFromModule,
  canCancelWastelandClaimState as canCancelWastelandClaimStateFromModule,
  getWastelandClaimPhaseState as getWastelandClaimPhaseStateFromModule,
  canBuildOnWastelandCellState as canBuildOnWastelandCellStateFromModule,
  getConflictingWastelandFencePostsForClaim as getConflictingWastelandFencePostsForClaimFromModule,
  rebuildWastelandDraftsFromFencePosts as rebuildWastelandDraftsFromModule,
  partitionExpiredWastelandClaims as partitionExpiredWastelandClaimsFromModule,
  getExpiredWastelandDraftReservations as getExpiredWastelandDraftReservationsFromModule,
  serializeFrontierWastelandServerState as serializeFrontierWastelandServerStateFromModule,
  normalizeFrontierWastelandState as normalizeFrontierWastelandStateFromModule,
} from "./systems/frontier.js";

const LAST_PATCHED_AT = "2026-06-15 17:09:11 KST";

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
const RESIDENCE_NOTICE_BOARD_KEYS = ["boardA", "boardB", "boardC"];
const WASTELAND_LAND_DEED_ITEM_ID = "wastelandLandDeed";

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
const workstationUiController = createWorkstationController();
let mansionSleepWakePoint = { x: 0, z: 0, rotationY: Math.PI };
let wastelandClaimConfirmOverlay = null;
let wastelandClaimConfirmDialog = null;
let wastelandClaimConfirmBody = null;
let wastelandClaimConfirmRect = null;
let wastelandClaimCancelOverlay = null;
let wastelandClaimCancelDialog = null;
let personalStorageOverlay = null;
let personalStorageWin = null;
const inventoryUiController = createInventoryController();
let inventoryGameplayController = null;
let inventoryEquipmentPreview = null;
const wastelandController = createWastelandController();
let frontierParcelCoordinator = null;

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
  wastelandHudWrap,
  wastelandHudTitle,
  wastelandHudValue,
  wastelandHudBarTrack,
  wastelandHudBarFill,
  wastelandHudStatus,
  wastelandFenceHudWrap,
  wastelandFenceHudTitle,
  wastelandFenceHudValue,
  wastelandFenceHudMeta,
  wastelandFenceHudStatus,
  ui,
  mapArrivalBanner,
} = createHudUi({
  uiLayer,
  lastPatchedAt: LAST_PATCHED_AT,
});

const {
  wastelandClaimCompleteBtn,
  wastelandClaimAbortBtn,
} = createWastelandHudActionButtons(wastelandHudWrap);

const WALLET_SESSION_KEY = "voxel-town.wallet-auth.v1";
const DEV_ACTIVE_PROFILE_KEY = "voxel-town.dev-active-profile.v1";
const DEV_PROFILE_SAVE_PREFIX = "voxel-town.dev-profile-save.v1.";
const DEV_CREDITS_MIGRATION_PREFIX = "voxel-town.dev-credits-migrated.v1.";
const DEV_PROFILE_FAILED_LOAD_PREFIX = "voxel-town.dev-profile-load-error.v1.";
const DEV_SHARED_WORLD_KEY = "voxel-town.dev-shared-world.v1";
const AUTH_API_BASE_URL = "http://localhost:8787";
const walletAuth = createInitialWalletAuthState();
const walletProfile = createInitialWalletProfile();
const PLAYER_CURRENCY_NAME = "개척 코인";
const PLAYER_SAVE_VERSION = 1;
const PLAYER_SAVE_INTERVAL_MS = 4000;
const DEV_PROFILE_IDS = ["dev_user_1", "dev_user_2"];
const DEV_PROFILE_START_OFFSETS = Object.freeze({
  dev_user_1: { x: -1.2, z: 0 },
  dev_user_2: { x: 1.2, z: 0 },
});
const sessionRuntime = createSessionRuntime({
  devProfileIds: DEV_PROFILE_IDS,
  fallbackProfileId: DEV_PROFILE_IDS[0],
  devProfileSavePrefix: DEV_PROFILE_SAVE_PREFIX,
  guestSaveKey: "voxel-town.guest-profile-save.v1",
});
const sessionController = createSessionController({
  authApiBaseUrl: AUTH_API_BASE_URL,
  devActiveProfileKey: DEV_ACTIVE_PROFILE_KEY,
  devProfileIds: DEV_PROFILE_IDS,
  devProfileStartOffsets: DEV_PROFILE_START_OFFSETS,
  fallbackProfileId: DEV_PROFILE_IDS[0],
  startX: START_X,
});
const playerSaveRuntime = createPlayerSaveRuntime();
let activeDevProfileId = DEV_PROFILE_IDS[0];
let nftExhibitBoard = null;
let nftExhibitScreenMaterial = null;
let nftExhibitRefreshTimer = null;
let nftExhibitSelectionOpen = false;
let nftExhibitSelectionLoading = false;
let nftExhibitSelectionStatus = "";
let nftExhibitSelectionTone = "neutral";
let nftExhibitOwnedTokens = [];
let nftExhibitSelectedItem = null;
let nftExhibitSelectionOwnershipMismatch = false;
let nftExhibitSelectionOwnershipMessage = "";
let nftExhibitOwnedTokensCache = createNftOwnedTokensCache();
const nftExhibitRuntime = createNftExhibitRuntime({
  normalizeSelection: normalizeNftBoardSelection,
  isSameSelection: isSameNftBoardSelection,
});
let residenceNoticeBoardState = createDefaultResidenceNoticeBoardState();
const residenceNoticeBoardVisuals = {};
let quickUseAssignState = null;
let quickUseAssignmentConsumedUntil = 0;

const walletSessionUi = createWalletSessionUi({
  uiLayer,
  devProfileIds: DEV_PROFILE_IDS,
});
const {
  walletLoginStatus,
  walletNicknameInput,
  walletNicknameStatus,
} = walletSessionUi;

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

const {
  nftBoardOverlay,
  nftBoardCloseBtn,
  nftBoardStatus,
  nftBoardGrid,
} = createNftExhibitUi(uiLayer);

function shortenWalletAddress(address) {
  return sessionRuntime.shortenWalletAddress(address, shortenWalletAddressFromModule);
}

function getDevProfileDisplayName(profileId = activeDevProfileId) {
  return getDevProfileDisplayNameFromWallet(profileId, DEV_PROFILE_IDS, DEV_PROFILE_IDS[0]);
}

function sanitizeDevProfileId(profileId) {
  return sessionRuntime.sanitizeDevProfileId(profileId);
}

function isUiEscapeCloseHandled() {
  if (wastelandController.isClaimCancelOpen()) {
    closeWastelandClaimCancelDialog();
    return true;
  }
  if (wastelandController.isClaimConfirmOpen()) {
    closeWastelandClaimConfirmDialog();
    return true;
  }
  if (nftExhibitSelectionOpen) {
    closeNftBoardSelectionOverlay();
    return true;
  }
  if (inventoryUiController.getTransferState()) {
    closePersonalStorageTransferDialog();
    return true;
  }
  if (inventoryUiController.isPersonalStorageOpen()) {
    setPersonalStorageOpen(false);
    return true;
  }
  if (frontierParcelCoordinator?.isBuildOpen()) {
    setFrontierBuildOpen(false);
    return true;
  }
  if (workstationUiController.isRefineryOpen()) {
    setRefineryOpen(false);
    return true;
  }
  if (workstationUiController.isForgeOpen()) {
    setForgeOpen(false);
    return true;
  }
  if (discardDialog.style.display !== "none") {
    closeDiscardDialog();
    return true;
  }
  if (inventoryUiController.isInventoryOpen()) {
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
    inventoryUiController.isPersonalStorageOpen() ||
    !!inventoryUiController.getTransferState() ||
    frontierParcelCoordinator?.isBuildOpen() ||
    frontierParcelCoordinator?.isBoothOpen() ||
    frontierParcelCoordinator?.isShopRegisterOpen() ||
    wastelandController.isClaimCancelOpen() ||
    wastelandController.isClaimConfirmOpen() ||
    workstationUiController.isRefineryOpen() ||
    workstationUiController.isForgeOpen()
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

function getActiveNftBoardSelection() {
  const normalized = normalizeNftBoardSelection(nftExhibitSelectedItem);
  if (normalized?.mode === "none") return normalized;
  return normalized ?? createNftBoardDefaultSelection();
}

function updateNftBoardSelectionUi() {
  updateNftExhibitUiState({
    overlay: nftBoardOverlay,
    statusElement: nftBoardStatus,
    open: nftExhibitSelectionOpen,
    status: nftExhibitSelectionStatus,
    tone: nftExhibitSelectionTone,
  });
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
  const selectionPlan = nftExhibitRuntime.getSelectionPlan(nftExhibitSelectedItem, nextSelection);
  if (!selectionPlan.changed) {
    closeNftBoardSelectionOverlay();
    return false;
  }
  nftExhibitSelectedItem = selectionPlan.selection;
  closeNftBoardSelectionOverlay();
  scheduleNftExhibitBoardRefresh();
  if (save) {
    schedulePlayerSaveSync(true);
  }
  return true;
}

function renderNftBoardTokenGrid() {
  renderNftExhibitTokenGrid({
    grid: nftBoardGrid,
    selected: getActiveNftBoardSelection(),
    tokens: nftExhibitOwnedTokens,
    loading: nftExhibitSelectionLoading,
    status: nftExhibitSelectionStatus,
    tone: nftExhibitSelectionTone,
    ownershipMismatch: nftExhibitSelectionOwnershipMismatch,
    ownershipMessage: nftExhibitSelectionOwnershipMessage,
    setStatus: setNftBoardSelectionStatus,
    normalizeImageUrl: normalizeIpfsUrl,
    onRetry: () => { void reloadNftBoardSelectionList({ forceRefresh: true }); },
    onClear: () => {
      const changed = setNftBoardSelection(createNftBoardClearedSelection());
      if (changed) {
        showUI("NFT 전시 해제", 1000);
        lastMessageUntil = performance.now() + 1000;
      }
    },
    onSelect: (token) => {
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
    },
  });
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

async function fetchWalletOwnedExhibitTokens() {
  const result = await fetchWalletOwnedExhibitTokensFromModule({
    walletAuth,
    cache: nftExhibitOwnedTokensCache,
  });
  nftExhibitOwnedTokensCache = result.cache;
  return result.items;
}

async function reloadNftBoardSelectionList({ forceRefresh = false } = {}) {
  if (!nftExhibitSelectionOpen) return;
  const requestToken = nftExhibitRuntime.beginListRequest();
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
    if (!nftExhibitSelectionOpen || !nftExhibitRuntime.isCurrentListRequest(requestToken)) return;
    const listState = nftExhibitRuntime.getListResultState({
      tokens,
      selected: getActiveNftBoardSelection(),
    });
    nftExhibitOwnedTokens = listState.tokens;
    nftExhibitSelectionOwnershipMismatch = listState.ownershipMismatch;
    nftExhibitSelectionOwnershipMessage = listState.ownershipMessage;
    nftExhibitSelectionStatus = listState.status;
    nftExhibitSelectionTone = listState.tone;
  } catch (error) {
    if (!nftExhibitSelectionOpen || !nftExhibitRuntime.isCurrentListRequest(requestToken)) return;
    nftExhibitOwnedTokens = [];
    nftExhibitSelectionStatus = error?.message || "NFT 목록을 불러오지 못했습니다.";
    nftExhibitSelectionTone = "error";
  } finally {
    if (!nftExhibitSelectionOpen || !nftExhibitRuntime.isCurrentListRequest(requestToken)) return;
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
  const refreshToken = nftExhibitRuntime.beginBoardRefresh();
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
  if (!nftExhibitRuntime.isCurrentBoardRefresh(refreshToken)) return;
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
    if (!nftExhibitRuntime.isCurrentBoardRefresh(refreshToken)) return;
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
    if (!nftExhibitRuntime.isCurrentBoardRefresh(refreshToken)) return;
    const metadata = await fetchNftMetadata(tokenUri);
    if (!nftExhibitRuntime.isCurrentBoardRefresh(refreshToken)) return;

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
    if (!nftExhibitRuntime.isCurrentBoardRefresh(refreshToken) || !texture) return;
    applyNftBoardTexture(texture);
  } catch (error) {
    if (!nftExhibitRuntime.isCurrentBoardRefresh(refreshToken)) return;
    setNftBoardMessage(
      "지갑 NFT 전시",
      [error?.message || "NFT를 불러오지 못했습니다."],
      "#d97575"
    );
  }
}

async function apiFetchJson(path, options = {}) {
  const result = await sessionController.apiFetchJson(path, options);
  if (result.status === 0) {
    return { ...result, error: "인증 서버에 연결하지 못했습니다. server를 먼저 실행해주세요." };
  }
  if (!result.ok && !result.data?.error) {
    return { ...result, error: "인증 서버 요청에 실패했습니다." };
  }
  return result;
}

function getAuthHeaders() {
  return walletAuth.token
    ? {
        Authorization: `Bearer ${walletAuth.token}`,
      }
    : {};
}

function getActivePlayerSaveKey() {
  return sessionRuntime.getPlayerSaveKey(walletAuth, activeDevProfileId);
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
    frontierWastelandState: serializeFrontierWastelandState(),
  });
}

function normalizeSharedWorldState(rawWorld) {
  return normalizeSharedWorldStateData(rawWorld, {
    createDefaultSharedWorldSave,
    normalizeFrontierBuildState,
    normalizeNftBoardSelection,
    normalizeResidenceNoticeBoardState,
    normalizeFrontierWastelandState: normalizeFrontierWastelandStateFromModule,
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
  applyFrontierWastelandState(world.frontierWasteland);
  rebuildAllFrontierConstructionVisuals();
  renderResidenceNoticeBoards();
  scheduleNftExhibitBoardRefresh();
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

let controls = null;

async function copyWalletAddressToClipboard() {
  if (!walletAuth.address) return;
  try {
    await walletSessionUi.copyAddress(walletAuth.address, equipProfileCopyBtn);
  } catch {
    showUI("지갑 주소 복사에 실패했습니다.", 1200);
    lastMessageUntil = performance.now() + 1200;
  }
}


function shouldResetAuthSessionOnLocalReload() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

const playerSaveCoordinator = createPlayerSaveCoordinator({
  runtime: playerSaveRuntime,
  storage: localStorage,
  authApiBaseUrl: AUTH_API_BASE_URL,
  intervalMs: PLAYER_SAVE_INTERVAL_MS,
  getSaveKey: getActivePlayerSaveKey,
  getFailedLoadKey: (profileId) => `${DEV_PROFILE_FAILED_LOAD_PREFIX}${sanitizeDevProfileId(profileId)}`,
  getAuthToken: () => walletAuth.token,
  isDevSession: () => isDevSession(),
  isServerBackedSession: () => isServerBackedWalletSession(),
  serializeSave: serializePlayerSave,
  applySave: applySerializedPlayerSave,
  getActiveProfileId: () => activeDevProfileId,
  setPlayerCredits,
  setLoginStatus: (text) => { walletLoginStatus.textContent = text; },
  setStatus: (text, tone, { persist = false } = {}) => {
    const palette = {
      neutral: { border: "rgba(255,255,255,0.18)", color: "white" },
      saving: { border: "rgba(114,179,255,0.5)", color: "#dceeff" },
      success: { border: "rgba(122,209,151,0.5)", color: "#dff8e7" },
      error: { border: "rgba(255,122,122,0.55)", color: "#ffe3e3" },
    };
    const style = palette[tone] ?? palette.neutral;
    updatePlayerSaveStatusBadgeUi(playerSaveStatusBadge, {
      text, borderColor: style.border, color: style.color,
      visible: isServerBackedWalletSession(),
    });
  },
  hideStatus: () => hidePlayerSaveStatusBadgeUi(playerSaveStatusBadge),
  saveSharedWorldState: saveSharedWorldStateToLocal,
});

const {
  beginHydration: beginPlayerSaveHydration,
  blockBaseline: blockPlayerSaveBaseline,
  flushOnExit: flushPlayerSaveOnExit,
  hasConfirmedBaseline: hasConfirmedPlayerSaveBaseline,
  loadActiveLocalProfileState,
  resetProtectionState: resetPlayerSaveProtectionState,
  saveActiveLocalProfileState,
} = playerSaveCoordinator;

function hydratePlayerSaveFromServer() {
  return playerSaveCoordinator.hydrateFromServer({ apiFetchJson, getAuthHeaders });
}

function pushPlayerSaveToServer() {
  return playerSaveCoordinator.pushToServer({ apiFetchJson, getAuthHeaders });
}

function schedulePlayerSaveSync(force = false) {
  return playerSaveCoordinator.scheduleSync(force, { apiFetchJson, getAuthHeaders });
}

const sessionWorkflow = createSessionWorkflowController({
  auth: walletAuth,
  profile: walletProfile,
  storage: localStorage,
  walletSessionKey: WALLET_SESSION_KEY,
  sessionRuntime,
  sessionController,
  serializeSession: serializeWalletSessionFromModule,
  parseStoredSession: parseStoredWalletSession,
  isGuestSessionState,
  isDevSessionState,
  isWalletAuthenticatedState,
  isServerBackedWalletSessionState,
  getActiveDevProfileId: () => activeDevProfileId,
  setActiveDevProfileId: (profileId) => { activeDevProfileId = profileId; },
  getDevProfileDisplayName,
  getAddressLabel: shortenWalletAddress,
  getChainLabel: formatWalletChainLabel,
  getUiState: () => ({
    devPresetEnabled: DEV_PRESET_ENABLED,
    creditsLabel: formatPlayerCreditsLabel(),
    equipmentProfile: {
      address: equipProfileAddress, chain: equipProfileChain, nickname: equipProfileNickname,
      credits: equipProfileCredits, logoutButton: equipProfileLogoutBtn, copyButton: equipProfileCopyBtn,
    },
  }),
  renderUi: (state) => {
    walletSessionUi.render(state);
    if (!isServerBackedWalletSession()) nftExhibitSelectionOpen = false;
    updateNftBoardSelectionUi();
    playerSaveStatusBadge.style.opacity = isServerBackedWalletSession() ? playerSaveStatusBadge.style.opacity : "0";
    if (controls) controls.enabled = canPlayGame();
    scheduleNftExhibitBoardRefresh();
  },
  onSessionCleared: () => {
    playerSaveStatusBadge.style.opacity = "0";
    playerSaveStatusBadge.style.transform = "translateY(4px)";
    nftExhibitSelectionOpen = false;
    nftExhibitSelectionLoading = false;
    nftExhibitSelectionStatus = "";
    nftExhibitOwnedTokens = [];
    nftExhibitOwnedTokensCache = createNftOwnedTokensCache();
    updateNftBoardSelectionUi();
  },
  applyFreshPlayerStartState,
  saveCoordinator: playerSaveCoordinator,
  getApiFetchJson: () => apiFetchJson,
  getAuthHeaders,
  getLoginMessage: getWalletLoginMessage,
  getNicknameInput: () => walletNicknameInput.value,
  setNicknameStatus: (text) => { walletNicknameStatus.textContent = text; },
  setLoginStatus: (text) => { walletLoginStatus.textContent = text; },
  setLoginBusy: (busy) => walletSessionUi.setLoginBusy(busy),
  setNicknameBusy: (busy) => walletSessionUi.setNicknameBusy(busy),
  notify: (message, duration) => {
    showUI(message, duration);
    lastMessageUntil = performance.now() + duration;
  },
});

const {
  canPlayGame,
  clearWalletSession,
  handleWalletLogout,
  hasNickname,
  isDevSession,
  isGuestSession,
  isServerBackedWalletSession,
  isWalletAuthenticated,
  restoreWalletSession,
  saveWalletSession,
  setWalletAuthState,
  updateWalletUi,
} = sessionWorkflow;

function bindWalletProviderEvents() {
  sessionWorkflow.bindWalletProviderEvents(window.ethereum);
}

function connectWalletLogin() {
  return sessionWorkflow.connectWalletLogin(window.ethereum);
}

function startGuestSession() {
  return sessionWorkflow.startGuestSession();
}

function commitNickname() {
  return sessionWorkflow.commitNickname(schedulePlayerSaveSync);
}

function hydrateWalletSessionFromServer() {
  return sessionWorkflow.hydrateWalletSessionFromServer();
}

function getDevCreditsMigrationKey(profileId = activeDevProfileId) {
  return `${DEV_CREDITS_MIGRATION_PREFIX}${sanitizeDevProfileId(profileId)}`;
}

function applyDevProfileStartPosition(profileId = activeDevProfileId) {
  const start = sessionController.getDevProfileStartPosition(profileId);
  player.position.set(start.x, player.position.y, start.z);
  player.rotation.y = 0;
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
  snapCameraToPlayer();
}

const devProfileOrchestrator = createDevProfileOrchestrator({
  profileIds: DEV_PROFILE_IDS,
  activeProfileKey: DEV_ACTIVE_PROFILE_KEY,
  sharedWorldKey: DEV_SHARED_WORLD_KEY,
  storage: localStorage,
  sessionController,
  getActiveProfileId: () => activeDevProfileId,
  setActiveProfileId: (profileId) => { activeDevProfileId = profileId; },
  getDisplayName: getDevProfileDisplayName,
  getCreditsMigrationKey: getDevCreditsMigrationKey,
  getPlayerCredits,
  setPlayerCredits,
  isDevSession,
  setWalletAuthState,
  setWalletLoginStatus: (text) => { walletLoginStatus.textContent = text; },
  resetPlayerSaveProtectionState,
  setPlayerSaveSyncPaused: playerSaveCoordinator.setSyncPaused,
  loadSharedWorldState: loadSharedWorldStateFromLocal,
  applySharedWorldState,
  loadActiveLocalProfileState,
  applyFreshPlayerStartState,
  applyDevProfileStartPosition,
  applyDevPreset,
  saveActiveLocalProfileState,
  saveSharedWorldState: saveSharedWorldStateToLocal,
  applyDevProfileRoleOverrides,
  restoreMissingLandDeeds: () => restoreMissingOwnedWastelandLandDeeds({ saveProfile: true }),
  resetWastelandDraftUiState: () => resetWastelandDraftUiState(),
  refreshWastelandDraftUiState: () => refreshCurrentWastelandDraftUiState(),
  createDefaultSharedWorldSave,
  resetFrontierWastelandRuntimeState: () => resetFrontierWastelandRuntimeState(),
  notify: (message, duration) => {
    showUI(message, duration);
    lastMessageUntil = performance.now() + duration;
  },
});

function initializeDevProfileState(preferredProfileId = "") {
  return devProfileOrchestrator.initialize(preferredProfileId);
}

function switchDevProfile(profileId) {
  return devProfileOrchestrator.switchProfile(profileId);
}

function resetDevTestingEnvironment() {
  return devProfileOrchestrator.resetTestingEnvironment();
}

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

({
  wastelandClaimConfirmOverlay,
  wastelandClaimConfirmDialog,
  wastelandClaimConfirmBody,
} = createWastelandClaimConfirmDialogUi({
  uiLayer,
  onClose: () => closeWastelandClaimConfirmDialog(),
  onConfirm: () => commitCurrentWastelandDraft(),
}));

({
  wastelandClaimCancelOverlay,
  wastelandClaimCancelDialog,
} = createWastelandClaimCancelDialogUi({
  uiLayer,
  onClose: () => closeWastelandClaimCancelDialog(),
  onConfirm: () => cancelCurrentWastelandClaim(),
}));

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

walletSessionUi.bindEvents({
  onConnect: connectWalletLogin,
  onGuest: startGuestSession,
  onDevBypass: initializeDevProfileState,
  onSwitchDevProfile: switchDevProfile,
  canResetDev: isDevSession,
  onResetDev: resetDevTestingEnvironment,
  onNicknameSave: commitNickname,
  onLogout: handleWalletLogout,
});

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
    inventoryGameplayController?.setActiveTab(tabId);
  },
  onTrashDragOver: (event) => inventoryGameplayController?.handleTrashDragOver(event),
  onTrashDragLeave: () => inventoryGameplayController?.handleTrashDragLeave(),
  onTrashDrop: (event) => inventoryGameplayController?.handleTrashDrop(event),
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
const workstationWindowsUi = createWorkstationWindowsUi({
  uiLayer,
  onForgeAction: () => tryUpgradeEquippedItem(),
  onForgeButtonPressed: (pressed) => survivalWorkstationCoordinator?.setForgeButtonPressed(pressed),
  onForgeClose: () => setForgeOpen(false),
  onRefineryAction: () => tryCraftSelectedRefineryRecipe(),
  onRefineryClose: () => setRefineryOpen(false),
});

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

function getItemPreviewDataUrl(itemId, size = 40, variantLevel = null) {
  const previewVariant =
    itemId === "pickaxe"
      ? `lv${Number.isFinite(variantLevel) ? variantLevel : inventory?.pickaxeLevel ?? 0}`
      : "base";
  const cacheKey = `${itemId}:${previewVariant}:${size}`;
  const def = ITEM_DEFS[itemId];
  if (!def?.makeInventoryModel) return null;
  return getRenderedModelPreviewDataUrl(
    cacheKey,
    () => (itemId === "pickaxe" && Number.isFinite(variantLevel)
      ? buildPickaxeModel(variantLevel)
      : def.makeInventoryModel()),
    size
  );
}

function createItemVisualElement(itemId, options = {}) {
  const def = ITEM_DEFS[itemId];
  const size = options.size ?? 40;
  const dataUrl = getItemPreviewDataUrl(itemId, size, options.variantLevel ?? null);
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
  return createItemVisualElement(getSlotItemId(entry), {
    ...options,
    variantLevel: getSlotItemId(entry) === "pickaxe" && Number.isFinite(entry?.pickaxeLevel)
      ? entry.pickaxeLevel
      : options.variantLevel ?? null,
  });
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

function setTabStyles(activeTab = inventoryGameplayController?.getActiveTab() ?? "cons") {
  for (const t of tabs) {
    const btn = tabButtons[t.id];
    const isActive = t.id === activeTab;
    btn.style.background = isActive ? "rgba(255,180,70,0.95)" : "rgba(255,255,255,0.9)";
    btn.style.borderColor = isActive ? "rgba(200,120,30,0.9)" : "rgba(0,0,0,0.2)";
    btn.style.fontWeight = isActive ? "700" : "500";
  }
}

function renderInventoryWindow() {
  inventoryGameplayController?.renderInventoryWindow();
}

function setPersonalStorageOpen(v) {
  inventoryGameplayController?.setPersonalStorageOpen(v);
}

function closePersonalStorageTransferDialog() {
  inventoryGameplayController?.closePersonalStorageTransferDialog();
}

function openPersonalStorageTransferDialog(config) {
  return inventoryGameplayController?.openPersonalStorageTransferDialog(config) ?? false;
}

function commitPersonalStorageTransferDialog() {
  return inventoryGameplayController?.commitPersonalStorageTransferDialog() ?? false;
}

function renderPersonalStorageWindow() {
  inventoryGameplayController?.renderPersonalStorageWindow();
}

// I 키로 인벤 열고닫기
function setInvOpen(v) {
  inventoryGameplayController?.setInventoryOpen(v);
}

let questOpen = false;
let questDragState = null;
function setQuestOpen(v) {
  if (v && frontierParcelCoordinator?.isBuildOpen()) {
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
  if (inventoryUiController.isPersonalStorageOpen()) return;
  if (isTextInputActive()) return;
  if (inventoryUiController.isInventoryOpen() && logicalKey === "tab") {
    e.preventDefault();
    inventoryGameplayController?.cycleActiveTab();
    return;
  }
  if (nftExhibitSelectionOpen) return;
  if (quickUseAssignState) return;
  // 입력창 없으니 간단 처리
  const key = logicalKey;
  if (key === "i") {
    e.preventDefault();
    setInvOpen(!inventoryUiController.isInventoryOpen());
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
  NEED_SHOVEL: "🪏 필요",
  EQUIP_SHOVEL: "🪏 장착 필요",
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
  return getCurrentTutorialQuestStep(tutorialQuest, tutorialQuest.steps);
}

function getTutorialNpcLine() {
  return getTutorialNpcLineFromModule({
    state: tutorialQuest,
    steps: tutorialQuest.steps,
    mineKeyIssued: inventory.mineKeyIssued,
    abandonedMineUnlocked: inventory.abandonedMineUnlocked,
  });
}

function refreshQuestProgress() {
  const progress = getTutorialQuestProgressPlan({ state: tutorialQuest, steps: tutorialQuest.steps });
  tutorialQuest.currentStep = progress.currentStep;
  tutorialQuest.completed = progress.completed;
  for (const event of progress.events) {
    if (event.type === "completed") {
      showUI("튜토리얼 퀘스트 완료!", 1200);
    } else {
      showUI(`퀘스트 갱신: ${event.step.title}`, 1100);
    }
  }
  if (progress.advanced) schedulePlayerSaveSync(true);
  if (progress.advanced && questOpen) renderQuestWindow();
}

function archiveQuestStep(stepIndex) {
  if (canArchiveTutorialQuestStep({
    stepIndex,
    currentStep: tutorialQuest.currentStep,
    completed: tutorialQuest.completed,
    archivedSteps: tutorialQuest.archivedSteps,
  })) {
    tutorialQuest.archivedSteps.push(stepIndex);
    schedulePlayerSaveSync(true);
  }
  if (questOpen) renderQuestWindow();
}

function renderQuestWindow() {
  renderQuestWindowUi({
    quest: tutorialQuest,
    viewMode: questViewMode,
    currentStep: getCurrentQuestStep(),
    onArchive: archiveQuestStep,
  }, {
    archiveToggleButton: questArchiveToggleBtn,
    title: questTitle,
    description: questDesc,
    stepList: questStepList,
    footer: questFooter,
  });
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
const colliderRegistry = createColliderRegistry();
const colliders = colliderRegistry.colliders;
const colliderBoxes = colliderRegistry.boxes;

const connectorTunnelZones = [];
const ROCK_RESPAWN_MS = 10000;
const ROCK_COUNT = 50;
const CAVE_STONE_COUNT = 16;
const ROCK_SPAWN_MARGIN = 6;
const ROCK_SAFE_RADIUS = 8;
const ROCK_MIN_GAP = 0.55; // 돌끼리 화면상 붙어 보이지 않게 여유
const miningParticles = createMiningParticlesRuntime(scene);
const HIT_STOP_DURATION = 0.045;
const ROCK_HIT_REACTION_DURATION = 0.12;
const CAMERA_SHAKE_DURATION = 0.11;
const playerGameplayCoordinator = createPlayerGameplayCoordinator({
  player,
  getPlayerPosition: () => player.position,
  findNearestByPosition,
  setHarvestTreeActive: (tree, active) => setHarvestTreeActiveFromModule(tree, active, {
    now: performance.now(),
    respawnMs: TREE_HARVEST_RESPAWN_MS,
    getCooldownUntil: getHarvestTreeCooldownUntil,
  }),
  updateHarvestTrees: (trees) => updateHarvestTreesFromModule(trees, {
    now: performance.now(),
    respawnMs: TREE_HARVEST_RESPAWN_MS,
    getShakeRotation: getHarvestTreeShakeRotation,
    getRegrowthProgress: getHarvestTreeRegrowthProgress,
    isReady: isHarvestTreeReady,
    getCooldownUntil: getHarvestTreeCooldownUntil,
  }),
  updateRockFadeIns: updateRockFadeInsFromModule,
  rockRespawnMs: ROCK_RESPAWN_MS,
  createRespawnRock: (spawn) => createRespawnRockFromSpawn(spawn),
  miningParticles,
  randomRange: randRange,
  hitStopDuration: HIT_STOP_DURATION,
  cameraShakeDuration: CAMERA_SHAKE_DURATION,
  rockHitReactionDuration: ROCK_HIT_REACTION_DURATION,
});
const { mineRocks, harvestTrees } = playerGameplayCoordinator;

function getRockSpawnBounds() {
  return getRockSpawnBoundsFromModule(GROUND_SIZE, ROCK_SPAWN_MARGIN);
}

function findRockSpawnPosition(s, tries = 80) {
  return findMineRockSpawnPosition({
    scale: s,
    tries,
    bounds: getRockSpawnBounds(),
    rocks: mineRocks,
    safeRadius: ROCK_SAFE_RADIUS,
    minGap: ROCK_MIN_GAP,
    randomRange: randRange,
  });
}

function findCampStoneSpawnPosition(s, tries = 120) {
  return findCaveRockSpawnPosition({
    scale: s,
    tries,
    groundSize: GROUND_SIZE,
    centerX: CAMP_MAP_X,
    centerZ: CAMP_MAP_Z,
    rocks: mineRocks,
    airPurifierPosition: airPurifierStation?.position,
    gatePosition: campGate?.position,
    randomRange: randRange,
  });
}

function spawnDustBurst(pos, count = 16) {
  playerGameplayCoordinator.spawnDustBurst(pos, count);
}

function spawnRockBreakBurst(rock) {
  playerGameplayCoordinator.spawnRockBreakBurst(rock);
}


// ===== Inventory (slot-based) =====
// 아이템 정의(나중에 계속 늘릴 예정)
const ITEM_DEFS = createItemDefs({
  buildPickaxeModel,
  buildShovelModel,
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

function getEquippedInventoryEntry(slotId) {
  const equippedRef = getEquippedItemRef(slotId);
  if (!equippedRef) return null;
  if (isNftInventoryEntry(equippedRef)) return equippedRef;
  const matched = inventory.slots.find(
    (slot) => slot && isSameInventoryEntryAsEquipped(slot, equippedRef)
  );
  return matched ?? equippedRef;
}

function getDisplayResolvedInventoryEntry(entry) {
  if (
    entry &&
    !isNftInventoryEntry(entry) &&
    typeof entry.instanceId === "string" &&
    entry.instanceId.trim()
  ) {
    const matched = inventory.slots.find(
      (slot) =>
        slot &&
        !isNftInventoryEntry(slot) &&
        slot.instanceId === entry.instanceId
    );
    if (matched) {
      return { ...entry, ...matched };
    }
  }
  if (
    entry &&
    !isNftInventoryEntry(entry) &&
    getSlotItemId(entry) === "pickaxe" &&
    !Number.isFinite(entry.pickaxeLevel)
  ) {
    return {
      ...entry,
      pickaxeLevel: inventory.pickaxeLevel,
    };
  }
  return entry;
}

function getResolvedPickaxeLevel(entry, fallbackLevel = inventory?.pickaxeLevel ?? 0) {
  const rawLevel = Number.isFinite(entry?.pickaxeLevel) ? entry.pickaxeLevel : fallbackLevel;
  return clampPickaxeLevel(rawLevel, PICKAXE_UPGRADE_LEVELS);
}

function getEquippedPickaxeLevel() {
  const equippedPickaxeEntry = getEquippedInventoryEntry("tool");
  if (!equippedPickaxeEntry || getSlotItemId(equippedPickaxeEntry) !== "pickaxe") {
    return 0;
  }
  return getResolvedPickaxeLevel(equippedPickaxeEntry);
}

function getInventoryEntryDisplayName(entry) {
  return getInventoryEntryDisplayNameFromItems(ITEM_DEFS, getDisplayResolvedInventoryEntry(entry));
}

function getInventoryEntryDisplayIcon(entry) {
  return getInventoryEntryDisplayIconFromItems(ITEM_DEFS, entry);
}

function getInventoryEntryTooltipData(entry) {
  const tooltip = getInventoryEntryTooltipDataFromItems(
    ITEM_DEFS,
    getDisplayResolvedInventoryEntry(entry)
  );
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

function getQuickUseKeyForItemId(itemId) {
  return getQuickUseKeyForItemIdFromModule(inventory, itemId, QUICK_USE_ALLOWED_KEYS);
}

function pruneQuickUseBindings() {
  inventoryGameplayController?.pruneQuickUseBindings();
}

function getCurrentPickaxeStats() {
  return getCurrentPickaxeStatsFromModule(getEquippedPickaxeLevel(), PICKAXE_UPGRADE_LEVELS);
}

function getEquippedToolId() {
  return getEquippedItemForSlot("tool");
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
      pickaxeLevel: getEquippedPickaxeLevel(),
      itemDefs: ITEM_DEFS,
    });
  }

  return null;
}

function getEquippedMiningPower() {
  return getMiningPowerForTool({
    toolId: getEquippedItemForSlot("tool"),
    pickaxeLevel: getEquippedPickaxeLevel(),
    itemDefs: ITEM_DEFS,
    randRange,
  });
}

    // 인벤토리 데이터: 슬롯 + 장착 상태
	    const inventory = createInitialInventoryStateFromModule();
let playerCredits = 0;

const personalStorage = createInitialPersonalStorageStateFromModule();
const inventoryRuntime = createInventoryRuntime({
  inventory,
  personalStorage,
  itemDefs: ITEM_DEFS,
  getSlotItemId,
  getSlotItemCount,
  isNftInventoryEntry,
  normalizeInventorySlotEntry,
  normalizeEquippedItemRef,
  createInventorySlotEntry,
  createEquippedItemRef,
  getInventoryStackMax,
  getInventoryEntryEquipSlot,
  isSameInventoryEntryAsEquipped,
  isQuestCriticalItemBlockedFromDiscard,
  getQuickUseAssignState: () => quickUseAssignState,
  setQuickUseAssignState: (nextState) => { quickUseAssignState = nextState; },
  onCreditsChanged: () => updateWalletUi(),
});
const frontierRuntime = createFrontierRuntime({ clampPlayerCredits });

inventoryGameplayController = createInventoryGameplayController({
  inventory,
  personalStorage,
  inventoryRuntime,
  inventoryUiController,
  quickUseAllowedKeys: QUICK_USE_ALLOWED_KEYS,
  itemDefs: ITEM_DEFS,
  ui: {
    invWin,
    equipWin,
    invgrid,
    inventoryTrashDropZone,
    discardOverlay,
    discardDialog,
    discardItemLabel,
    discardOwnedCount,
    discardInputLabel,
    discardCountInput,
    discardError,
    personalStorageOverlay,
    personalStorageWin,
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
  },
  getSlotItemId,
  getSlotItemCount,
  getEntryCategory: getInventoryEntryCategory,
  getEntryName: getInventoryEntryDisplayName,
  getEntryTooltipData: getInventoryEntryTooltipData,
  getEntryEquipSlot: getInventoryEntryEquipSlot,
  getEntryVisual: createInventoryEntryVisualElement,
  getDisplayResolvedEntry: getDisplayResolvedInventoryEntry,
  normalizeInventorySlotEntry,
  createInventorySlotEntry,
  createEquippedItemRef,
  getEquippedItemRef,
  getEquippedItemForSlot,
  setEquippedItem,
  isNftEntry: isNftInventoryEntry,
  isSameAsEquipped: isSameInventoryEntryAsEquipped,
  isQuickUseAssignableItemId: (itemId) => itemId === "freshAirCanister",
  getQuickUseItemId,
  getQuickUseKeyForItemId,
  assignQuickUseKeyToItem: (itemId, key) => assignQuickUseKeyToItemFromModule(inventory, itemId, key, QUICK_USE_ALLOWED_KEYS),
  getQuickUseAssignState: () => quickUseAssignState,
  setQuickUseAssignState: (nextState) => { quickUseAssignState = nextState; },
  isBuildPartItemId: isWastelandBuildPartItemId,
  isFencePlacementMode: () => wastelandController.isFencePlacementMode(),
  getSelectedStructureItemId: () => wastelandController.getSelectedStructureItemId(),
  makeSlot,
  setTabStyles,
  showTooltip: showItemTooltip,
  hideTooltip: hideItemTooltip,
  showMessage: showUI,
  updateInventoryUi: updateInventoryUI,
  refreshQuestProgress,
  schedulePlayerSave: schedulePlayerSaveSync,
  closeFrontierBuild: () => {
  if (frontierParcelCoordinator?.isBuildOpen()) setFrontierBuildOpen(false);
  },
  useFreshAirCanister,
  toggleFencePlacementMode: () => toggleWastelandFencePlacementMode(),
  toggleStructurePlacement: (itemId) => toggleWastelandStructurePlacementItem(itemId),
  setLastMessageUntil: (value) => { lastMessageUntil = value; },
});

const ALWAYS_DROP_BLOCKED_ITEM_IDS = new Set(["abandonedMineKey"]);
const TUTORIAL_DROP_BLOCKED_ITEM_IDS = new Set(["pickaxe", "safetyHelmet"]);

function findInventorySlotIndexByEntry(entry) {
  return inventoryRuntime.findInventorySlotIndex(entry);
}

function getInventorySlotEntryByEntry(entry) {
  return inventoryRuntime.getInventorySlotEntry(entry);
}

function clampPlayerCredits(value) {
  return inventoryRuntime.clampCredits(value);
}

function getPlayerCredits() {
  return inventoryRuntime.getCredits();
}

function setPlayerCredits(value) {
  inventoryRuntime.setCredits(value);
  playerCredits = inventoryRuntime.getCredits();
}

function grantPlayerCredits(amount) {
  inventoryRuntime.grantCredits(amount);
  playerCredits = inventoryRuntime.getCredits();
}

function canAffordPlayerCredits(amount) {
  return inventoryRuntime.canAffordCredits(amount);
}

function spendPlayerCredits(amount) {
  const spent = inventoryRuntime.spendCredits(amount);
  playerCredits = inventoryRuntime.getCredits();
  return spent;
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
  return inventoryRuntime.canDiscard(entry);
}

function canMoveInventoryEntryToPersonalStorage(entry) {
  return inventoryRuntime.canStore(entry);
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
  return inventoryRuntime.addEntryToPersonalStorage(entry, count);
}

function addEntryToInventory(entry, count = getSlotItemCount(entry)) {
  return inventoryRuntime.addEntryToPlayerInventory(entry, count);
}

function moveInventoryEntryToStorage(entry, count = getSlotItemCount(entry)) {
  return inventoryRuntime.moveToStorage(entry, count);
}

function moveStorageEntryToInventory(storageIndex, count = null) {
  return inventoryRuntime.moveToInventory(storageIndex, count);
}

function closeDiscardDialog() {
  inventoryGameplayController.closeDiscardDialog();
}

function openDiscardDialog(entry) {
  return inventoryGameplayController.openDiscardDialog(entry);
}

function commitDiscardDialog() {
  return inventoryGameplayController.commitDiscardDialog();
}

function findFirstSlotWithItem(id) {
  return inventoryRuntime.findFirstInventorySlotWithItem(id);
	    }

function getItemCount(id) {
  return inventoryRuntime.getOwnedItemCount(id);
    }

function findFirstEmptySlot() {
  return inventoryRuntime.findFirstEmptyInventorySlot();
    }

function addItem(id, count = 1) {
  return inventoryRuntime.addItemToInventory(id, count);
	    }

function consumeItem(id, count = 1) {
  return inventoryRuntime.consumeInventoryItem(id, count);
    }

    function hasEquippedTool(id) {
  return getEquippedItemForSlot("tool") === id;
    }

function hasItem(id) {
  return inventoryRuntime.hasOwnedItem(id);
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

    function syncEquippedToolGroupModel(group, itemId, level) {
  while (group.children.length) {
    const child = group.children[0];
    disposeObject3D(child);
    group.remove(child);
  }
  if (itemId === "shovel") {
    group.add(buildShovelModel());
  } else if (itemId === "pickaxe") {
    group.add(buildPickaxeModel(level));
  }
  group.userData.toolItemId = itemId ?? null;
  group.userData.pickaxeLevel = level;
    }

    function refreshEquippedPickaxeModel() {
  syncEquippedToolGroupModel(
    equippedPickaxe,
    getEquippedToolId(),
    getEquippedPickaxeLevel()
  );
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
      hasToolEquipped: Boolean(getEquippedToolId()),
      isSafetyHelmetEquipped:
        !isNftHelmetEquipped && getEquippedItemForSlot("head") === "safetyHelmet",
      isNftHelmetEquipped,
      shoesVisible: getEquippedItemForSlot("shoes") === "basicShoes",
    }
  );
    }

function getEquippedItemRef(slotId) {
  return inventoryRuntime.getEquippedRef(slotId);
    }

function getEquippedItemForSlot(slotId) {
  return inventoryRuntime.getEquippedItem(slotId);
    }

function setEquippedItem(slotId, itemOrRef) {
  inventoryRuntime.setEquippedRef(slotId, itemOrRef);
    }

function equipFirstOwnedInventoryItem(slotId, itemId) {
  return inventoryRuntime.equipFirstOwnedItem(slotId, itemId);
    }

function toggleEquipItem(itemOrId) {
  inventoryGameplayController.toggleEquipItem(itemOrId);
}

function beginQuickUseAssignment(entry) {
  inventoryGameplayController.beginQuickUseAssignment(entry);
}

function cancelQuickUseAssignment() {
  inventoryGameplayController.cancelQuickUseAssignment();
}

function clearQuickUseAssignmentForEntry(entry) {
  inventoryGameplayController.clearQuickUseAssignmentForEntry(entry);
}

function commitQuickUseAssignment(key) {
  return inventoryGameplayController.commitQuickUseAssignment(key);
}

function unequipSlot(slotId) {
  inventoryGameplayController.unequipSlot(slotId);
}

inventoryEquipmentPreview = createInventoryEquipmentPreview({
  THREE,
  previewCanvasWrap,
  equipmentSlotEls,
  player,
  getPlayerRigParts,
  syncPreviewPlayerPose,
  getSourceParts: () => ({ torso, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot }),
  getEquipmentVisibility: () => ({
    equippedPickaxeVisible: equippedPickaxe.visible,
    equippedSafetyHelmetVisible: equippedSafetyHelmet.visible,
    equippedNftHelmetVisible: equippedNftHelmet.visible,
  }),
  getEquippedItemRef,
  getEquippedItem: getEquippedItemForSlot,
  getDisplayResolvedEntry: getDisplayResolvedInventoryEntry,
  getEntryName: getInventoryEntryDisplayName,
  getEntryVisual: createInventoryEntryVisualElement,
  isNftEntry: isNftInventoryEntry,
  getEquippedToolId,
  getEquippedPickaxeLevel,
  syncEquippedToolGroupModel,
  unequipSlot,
});

function resizeEquipmentPreview() {
  inventoryEquipmentPreview?.resize();
}

function renderEquipmentPreview() {
  inventoryEquipmentPreview?.renderPreview();
}

function renderEquipmentWindow() {
  inventoryEquipmentPreview?.renderWindow();
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
  if (workstationUiController.isForgeOpen()) renderForgeWindow();
  if (workstationUiController.isRefineryOpen()) renderRefineryWindow();
  if (frontierParcelCoordinator?.isBuildVisible()) renderFrontierBuildWindow();
  if (inventoryUiController.isPersonalStorageOpen()) renderPersonalStorageWindow();

  // 인벤 창이 열려있으면 슬롯 표시 갱신
  if (inventoryUiController.isInventoryOpen()) renderInventoryWindow();
  schedulePlayerSaveSync(true);
    }

  updateInventoryUI(); // 처음 한번 표시

  invEl.style.zIndex = "999999";


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


const gatheringHud = createGatheringHud(uiLayer);

function showPickupHint(text) { gatheringHud.showPickup(text); }
function hidePickupHint() { gatheringHud.hidePickup(); }
function hideRockHpBar() { gatheringHud.hideRockHp(); }

function updateRockHpBar(rock, options = {}) {
  if (!rock || !rock.parent) {
    hideRockHpBar();
    return;
  }

  const screenPos = rock.position.clone();
  screenPos.y += 0.7 + (rock.userData.spawnScale ?? 1) * 0.55;
  screenPos.project(camera);
  gatheringHud.updateRockHp(getRockHpHudView({
    hp: rock.userData.hp,
    maxHp: rock.userData.maxHp,
    labelPrefix: rock.userData.hpLabelPrefix ?? "돌 체력",
    projectedPosition: screenPos,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  }), options);
}

let activeMineRock = null;
let activeHarvestTree = null;
let activeWastelandCell = null;
const frontierWastelandCoordinator = createFrontierWastelandCoordinator({
  getPlot: () => frontierWastelandPlot,
  getOwnerId: getCurrentFrontierWalletAddress,
  landDeedItemId: WASTELAND_LAND_DEED_ITEM_ID,
  controller: wastelandController,
  now: () => performance.now(),
  dateNow: () => Date.now(),
  showUI,
  setLastMessageUntil: (until) => { lastMessageUntil = until; },
  createGroup: () => new THREE.Group(),
  disposeObject: disposeObject3D,
  getClaimDialogElements: () => ({
    confirmOverlay: wastelandClaimConfirmOverlay,
    confirmDialog: wastelandClaimConfirmDialog,
    confirmBody: wastelandClaimConfirmBody,
    cancelOverlay: wastelandClaimCancelOverlay,
    cancelDialog: wastelandClaimCancelDialog,
  }),
  setClaimConfirmRect: (rect) => { wastelandClaimConfirmRect = rect; },
  getClaimActionButtons: () => ({
    completeButton: wastelandClaimCompleteBtn,
    abortButton: wastelandClaimAbortBtn,
  }),
  setActiveCell: (cell) => { activeWastelandCell = cell; },
  getDraftBounds: getWastelandDraftBoundsFromModule,
  validateDraftRectangle: validateWastelandDraftRectangleFromModule,
  getDraftPhaseState: getWastelandDraftPhaseStateFromModule,
  findDraftReservationHit: findWastelandDraftReservationHitFromModule,
  isCellInsideBounds: isCellInsideWastelandBoundsFromModule,
  canBuildOnCell: canBuildOnWastelandCellStateFromModule,
  getClaimProgress: getWastelandClaimProgressFromModule,
  getClaimPhaseState: getWastelandClaimPhaseStateFromModule,
  canCompleteClaimState: canCompleteWastelandClaimStateFromModule,
  canCancelClaimState: canCancelWastelandClaimStateFromModule,
  rebuildDrafts: rebuildWastelandDraftsFromModule,
  canLinkFencePosts: canLinkWastelandFencePostsByOwnerFromModule,
  getConflictingFencePosts: getConflictingWastelandFencePostsForClaimFromModule,
  partitionExpiredClaims: partitionExpiredWastelandClaimsFromModule,
  getExpiredDrafts: getExpiredWastelandDraftReservationsFromModule,
  getInventorySlots: () => inventory.slots,
  isNftInventoryEntry,
  getSlotItemId,
  createInventorySlotEntry,
  hasItem,
  addItem,
  consumeItem,
  addInventoryEntry,
  updateInventoryUI,
  saveWorld: saveSharedWorldStateToLocal,
  saveProfile: saveActiveLocalProfileState,
  getBuildPart: getWastelandBuildPartDef,
  isBuildPartItemId: isWastelandBuildPartItemId,
  getStructureSlotLabel: getWastelandStructureSlotLabel,
  getStructureSurfaceY: getWastelandStructureSurfaceY,
  getStructureRotationQuarter: () => getWastelandStructureRotationQuarter(player.rotation.y),
  getItemName: (itemId) => ITEM_DEFS[itemId]?.name ?? itemId,
  createStructureMesh: createWastelandStructureMesh,
  createFencePostMesh: createWastelandFencePostMesh,
  createFenceLinkMesh: createWastelandFenceLinkMesh,
  createPreviewCellMesh: createWastelandPreviewCellMesh,
  getCellClearProgress: getWastelandCellClearProgress,
  cellClearProgressGain: WASTELAND_DIG_PROGRESS_GAIN,
  syncCellState: syncWastelandCellStateFromProgress,
  applyCellVisual: applyWastelandCellVisual,
  normalizeState: normalizeFrontierWastelandStateFromModule,
  serializeServerState: serializeFrontierWastelandServerStateFromModule,
  grantLocalProfileItem,
  findNearestCell: ({ entries, radius }) => findNearestByPosition({
    entries,
    playerPosition: player.position,
    radius,
    getPosition: (cell) => cell,
  }),
});
const {
  runtime: wastelandRuntime,
  ensureState: ensureFrontierWastelandRuntimeState,
  resetState: resetFrontierWastelandRuntimeState,
  resetDraftUiState: resetWastelandDraftUiState,
  refreshDraftUiState: refreshCurrentWastelandDraftUiState,
  finalizeStateTransition: finalizeWastelandStateTransition,
  getCurrentDraft: getCurrentFrontierWastelandDraft,
  getCurrentClaim: getCurrentFrontierWastelandClaim,
  getClaimByCell: getFrontierWastelandClaimByCell,
  getLandDeedEntries: getWastelandLandDeedInventoryEntries,
  restorePreservedLandDeeds: restorePreservedWastelandLandDeeds,
  restoreMissingDeeds: restoreMissingOwnedWastelandLandDeeds,
  findIssuedLandDeed: findIssuedWastelandLandDeed,
  findOwnedLandDeed: findOwnedWastelandLandDeed,
  createLandDeedEntry: createWastelandLandDeedEntry,
  getBuildCheck: getWastelandBuildCheck,
  toggleStructurePlacementItem: toggleWastelandStructurePlacementItem,
  placeStructure: placeWastelandStructure,
  serializeState: serializeFrontierWastelandState,
  applyState: applyFrontierWastelandState,
  rebuildStructures: rebuildFrontierWastelandStructures,
  rebuildFenceLinks: rebuildFrontierWastelandFenceLinks,
  canClearCell: canClearWastelandCell,
  canPlaceFencePost: canPlaceWastelandFencePost,
  placeFencePost: placeWastelandFencePost,
  removeDraftFencePost: removeWastelandDraftFencePost,
  validateDraft: isValidWastelandDraftRectangle,
  getDraftGuide: getWastelandDraftGuide,
  getFenceHudState: getWastelandFenceHudState,
  clearClaimPreview: clearWastelandClaimPreview,
  updateClaimPreview: updateWastelandClaimPreview,
  closeClaimConfirmDialog: closeWastelandClaimConfirmDialog,
  closeClaimCancelDialog: closeWastelandClaimCancelDialog,
  openClaimCancelDialog: openWastelandClaimCancelDialog,
  commitDraft: commitCurrentWastelandDraft,
  confirmDraft: confirmCurrentWastelandDraft,
  expireClaims: expireOverdueFrontierWastelandClaims,
  expireDrafts: expireOverdueWastelandDraftReservations,
  getCurrentClaimProgress: getCurrentWastelandClaimProgress,
  getClaimPhase: getWastelandClaimPhase,
  canCompleteClaim: canCompleteWastelandClaim,
  completeClaim: completeCurrentWastelandClaim,
  canCancelClaim: canCancelWastelandClaim,
  cancelClaim: cancelCurrentWastelandClaim,
  updateClaimActionUi: updateWastelandClaimActionUi,
  toggleFencePlacementMode: toggleWastelandFencePlacementMode,
  findActiveCell: findActiveFrontierWastelandCell,
  getProgress: getFrontierWastelandProgress,
  shouldShowHud: shouldShowFrontierWastelandHud,
  getClaimHudStatusText: getWastelandClaimHudStatusText,
  createCellClearPlan: createWastelandClearPlan,
} = frontierWastelandCoordinator;
const latestMoveDir = new THREE.Vector3(0, 0, -1); // 월드 기준: -Z = 북, +X = 동

function updateCompassFromDirection(dir) {
  updateCompassUi(compassNeedle, compassText, dir);
}

function findNearestMineRock(radius = 2.2) {
  return playerGameplayCoordinator.findNearestMineRock(radius);
}

function findNearestHarvestTree(radius = 2.2) {
  return playerGameplayCoordinator.findNearestHarvestTree(radius);
}

function grantLocalProfileItem(walletAddress, itemId, count = 1) {
  const safeCount = Math.max(0, Math.floor(count || 0));
  if (!walletAddress || !itemId || safeCount <= 0) return false;
  if (walletAddress === getCurrentFrontierWalletAddress()) {
    return addItem(itemId, safeCount);
  }
  if (!DEV_PROFILE_IDS.includes(walletAddress)) {
    return false;
  }
  const saveKey = getDevProfileSaveKey(walletAddress);
  let parsed = createDefaultPlayerSave();
  try {
    const raw = localStorage.getItem(saveKey);
    if (raw) {
      parsed = {
        ...parsed,
        ...JSON.parse(raw),
      };
    }
  } catch {
    parsed = createDefaultPlayerSave();
  }
  const slots = Array.isArray(parsed.inventory?.slots)
    ? parsed.inventory.slots.map((slot) => normalizeInventorySlotEntry(slot))
    : createDefaultPlayerSave().inventory.slots;
  const added = addEntryToInventoryFromModule(
    slots,
    createInventorySlotEntry(itemId, safeCount),
    safeCount,
    {
      createPartialInventoryEntry,
      getSlotItemId,
      getInventoryStackMax,
      getSlotItemCount,
      isNftInventoryEntry,
      createInventorySlotEntry,
    }
  );
  if (!added) return false;
  parsed.inventory = parsed.inventory || {};
  parsed.inventory.slots = slots;
  localStorage.setItem(saveKey, JSON.stringify(parsed));
  return true;
}

function removeColliderAt(idx) {
  colliderRegistry.removeAt(idx);
}

// 콜라이더를 등록하면서 Box3를 한 번만 계산해 캐시해둠
function addCollider(obj, shrink = 1.0) {
  return colliderRegistry.add(obj, shrink);
}

function getTrackedColliderIndex(obj, fallback = null) {
  return colliderRegistry.getTrackedIndex(obj, fallback);
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
const dynamicPropsRuntime = createDynamicPropsRuntime({
  ground,
  gravity: PROP_GRAVITY,
  sleepVelocity: PROP_SLEEP_VELOCITY,
  clearance: PROP_SURFACE_CLEARANCE,
});
const { registerSupportSurface, enableDynamicProp, unregisterDynamicProp, restPropOnSupport } = dynamicPropsRuntime;

function updateDynamicProps(dt) {
  dynamicPropsRuntime.update(dt);
}


// ===== Ground follow (raycast) =====
const playerGroundingRuntime = createPlayerGroundingRuntime({
  groundSurfaces,
  footOffset: PLAYER_FOOT_OFFSET,
});

function updatePlayerGroundY(dt) {
  playerGroundingRuntime.update(player, dt);
}


const interactables = []; // 상호작용 가능한 오브젝트 목록
let activeInteractable = null; // 현재 가까운 대상
let lastMessageUntil = 0; // 메시지 표시용 타이머
const worldPickups = createWorldPickupRuntime({
  getItemName: (itemId) => ITEM_DEFS[itemId]?.name ?? itemId,
});
let activePickupItem = null;
const tutorialNpcRuntime = createTutorialNpcRuntime();
const tutorialNpcs = tutorialNpcRuntime.entries;
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
let frontierWastelandPlot = null;
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
const mapRuntime = createMapRuntime({
  mapGates,
  connectorTunnelZones,
  getPlayerPosition: () => player.position,
  getCurrentMapId: () => currentMapId,
  setCurrentMapId: (mapId) => { currentMapId = mapId; },
  getMapThresholds: () => ({
    mineDoorThresholdZ: mineGate.position.z - 0.35,
    campDoorThresholdZ: campGate.position.z + 0.35,
    campNorthDoorThresholdZ: frontierCampGate.position.z - 0.35,
    frontierDoorThresholdZ: frontierGate.position.z + 0.35,
  }),
  isInResidenceZone: () => isPlayerInResidenceMapZone(),
  residenceMapId: RESIDENCE_MAP_ID,
});
let torchEquipped = false;
let playerAirCurrent = AIR_GAUGE_MAX;
let playerAirMax = AIR_GAUGE_MAX;
const mapPurificationProgress = {
  "폐광": 0,
  "개척지": 0,
};
let survivalWorkstationCoordinator = null;
let airRuntime = null;
let frontierBuildState = createDefaultFrontierBuildStateFromModule(FRONTIER_PARCEL_LABELS);

function createDefaultFrontierBuildState() {
  return frontierParcelCoordinator?.createDefaultBuildState()
    ?? createDefaultFrontierBuildStateFromModule(FRONTIER_PARCEL_LABELS);
}

function getFrontierParcelAuthorityItemId(parcelLabel) {
  return frontierParcelCoordinator?.getAuthorityItemId(parcelLabel)
    ?? getFrontierParcelAuthorityItemIdFromModule(parcelLabel, FRONTIER_AUTHORITY_ITEM_IDS);
}

function getFrontierParcelAuthorityName(parcelLabel) {
  const itemId = getFrontierParcelAuthorityItemId(parcelLabel);
  return itemId ? ITEM_DEFS[itemId]?.name ?? `${parcelLabel} 개발권` : `${parcelLabel} 개발권`;
}

function hasFrontierParcelAuthority(parcelLabel) {
  return frontierParcelCoordinator?.hasAuthority(parcelLabel)
    ?? Boolean(getFrontierParcelAuthorityItemId(parcelLabel) && hasItem(getFrontierParcelAuthorityItemId(parcelLabel)));
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
  return frontierParcelCoordinator?.createDefaultBuildEntry(label)
    ?? createDefaultFrontierParcelBuildEntryFromModule(label);
}

function createDefaultFrontierParcelOperationsState() {
  return frontierParcelCoordinator?.createDefaultParcelOperationsState()
    ?? createDefaultFrontierParcelOperationsStateFromModule();
}

function createDefaultResidenceNoticeBoardState() {
  return createDefaultResidenceNoticeBoardStateFromModule(RESIDENCE_NOTICE_BOARD_KEYS);
}

function normalizeResidenceNoticeBoardEntry(key, rawEntry) {
  return normalizeResidenceNoticeBoardEntryFromModule(key, rawEntry);
}

function normalizeResidenceNoticeBoardState(rawState) {
  return normalizeResidenceNoticeBoardStateFromModule(RESIDENCE_NOTICE_BOARD_KEYS, rawState);
}

function getFrontierShopPurchaseFeedback(parcelLabel, quantity) {
  return frontierParcelCoordinator.getShopPurchaseFeedback(parcelLabel, quantity);
}

function normalizeFrontierWalletAddress(rawAddress) {
  return normalizeFrontierWalletAddressFromModule(rawAddress);
}

function getCurrentFrontierWalletAddress() {
  return frontierParcelCoordinator?.getCurrentWallet()
    ?? normalizeFrontierWalletAddress(walletAuth.address);
}

function getFrontierShopOperation(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.getShopOperation(parcelLabel);
}

function getFrontierDisplayOperation(parcelLabel = getSelectedFrontierParcelLabel(), slotKey = "displayA") {
  return frontierParcelCoordinator.getDisplayOperation(parcelLabel, slotKey);
}

function assignFrontierDisplayEntry(parcelLabel, slotKey, entry) {
  return frontierParcelCoordinator.assignDisplayEntry(parcelLabel, slotKey, entry);
}

function clearFrontierDisplayEntry(parcelLabel, slotKey) {
  return frontierParcelCoordinator.clearDisplayEntry(parcelLabel, slotKey);
}

function getFrontierShopAssignedWallet(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.getShopAssignedWallet(parcelLabel);
}

function getFrontierShopSellerWallet(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.getShopSellerWallet(parcelLabel);
}

function isFrontierShopSeller(parcelLabel = getSelectedFrontierParcelLabel(), walletAddress = getCurrentFrontierWalletAddress()) {
  return frontierParcelCoordinator.isShopSeller(parcelLabel, walletAddress);
}

function canManageFrontierShopSlot(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.canManageShopSlot(parcelLabel);
}

function canUseFrontierShopSlot(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.canUseShopSlot(parcelLabel);
}

function canEditFrontierShopListing(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.canEditShopListing(parcelLabel);
}

function canManageFrontierShopSellerTools(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.canManageShopSellerTools(parcelLabel);
}

function canRegisterFrontierShopListing(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.canRegisterShopListing(parcelLabel);
}

function canCollectFrontierShopSettlement(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.canCollectShopSettlement(parcelLabel);
}

function getFrontierDisplayAssignedWallet(parcelLabel = getSelectedFrontierParcelLabel(), slotKey = "displayA") {
  return frontierParcelCoordinator.getDisplayAssignedWallet(parcelLabel, slotKey);
}

function canManageFrontierDisplaySlot(parcelLabel = getSelectedFrontierParcelLabel(), slotKey = "displayA") {
  return frontierParcelCoordinator.canManageDisplaySlot(parcelLabel, slotKey);
}

function canUseFrontierDisplaySlot(parcelLabel = getSelectedFrontierParcelLabel(), slotKey = "displayA") {
  return frontierParcelCoordinator.canUseDisplaySlot(parcelLabel, slotKey);
}

function getFrontierBoothInteractionPlan(interactable) {
  return frontierParcelCoordinator.getBoothInteractionPlan(interactable);
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
  return frontierParcelCoordinator.collectShopSettlement(parcelLabel);
}

function assignFrontierDisplaySlotUser(parcelLabel, slotKey, walletAddress) {
  return frontierParcelCoordinator.assignDisplaySlotUser(parcelLabel, slotKey, walletAddress);
}

function clearFrontierDisplaySlotUser(parcelLabel, slotKey) {
  return frontierParcelCoordinator.clearDisplaySlotUser(parcelLabel, slotKey);
}

function getCurrentFrontierParcelLabel() {
  return frontierParcelCoordinator.getCurrentParcelLabel();
}

function getSelectedFrontierParcelLabel() {
  return frontierParcelCoordinator.getSelectedParcelLabel();
}

function getFrontierBuildState(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.getBuildState(parcelLabel);
}

function getFrontierConstructionRoot(parcelLabel) {
  return frontierParcelConstructionRoots[parcelLabel] ?? null;
}

function buildFrontierBuildingSign(text) {
  return buildFrontierBuildingSignFromModule(text);
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
  return frontierParcelCoordinator.getSafeStandingPoint(parcelLabel);
}

function rebuildAllFrontierConstructionVisuals() {
  frontierParcelCoordinator.rebuildAllConstructionVisuals();
}

function normalizeFrontierBuildState(rawState) {
  return frontierParcelCoordinator?.normalizeBuildState(rawState)
    ?? normalizeFrontierBuildStateFromModule(rawState, {
      parcelLabels: FRONTIER_PARCEL_LABELS,
      normalizeInventorySlotEntry,
      getInventoryEntryDisplayName,
      itemDefs: ITEM_DEFS,
      clampPlayerCredits,
    });
}

function getFrontierNextStageConfig(stage = getFrontierBuildState().stage) {
  return frontierParcelCoordinator.getNextStageConfig(stage);
}

function rebuildFrontierParcelConstructionVisual(parcelLabel) {
  frontierParcelCoordinator.rebuildParcelConstructionVisual(parcelLabel);
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

function getMapPollutionConfig(mapId = currentMapId) { return survivalWorkstationCoordinator.getMapPollutionConfig(mapId); }
function isPollutedMap(mapId = currentMapId) { return survivalWorkstationCoordinator.isPollutedMap(mapId); }
function getMapPurificationValue(mapId = currentMapId) { return survivalWorkstationCoordinator.getMapPurificationValue(mapId); }
function setMapPurificationValue(mapId, value) { return survivalWorkstationCoordinator.setMapPurificationValue(mapId, value); }
function resetAllMapPurificationValues() { return survivalWorkstationCoordinator.resetAllMapPurificationValues(); }
function getCurrentAirDrainPerSecond() { return survivalWorkstationCoordinator.getCurrentAirDrainPerSecond(); }
function canRecoverAirInMap(mapId = currentMapId) { return survivalWorkstationCoordinator.canRecoverAirInMap(mapId); }
function updateAirHud() { return survivalWorkstationCoordinator.updateAirHud(); }
function buildCavePollutionField() { return survivalWorkstationCoordinator.buildCavePollutionField(); }
function updateCavePollutionVisuals(dt) { return survivalWorkstationCoordinator.updateCavePollutionVisuals(dt); }
function useFreshAirCanister() { return survivalWorkstationCoordinator.useFreshAirCanister(); }
function useQuickUseItem(key) { return survivalWorkstationCoordinator.useQuickUseItem(key, getQuickUseItemId); }
function getDefaultRefineryRecipe() { return survivalWorkstationCoordinator.getDefaultRefineryRecipe(); }
function getRefineryRecipeEntries() { return survivalWorkstationCoordinator.getRefineryRecipeEntries(); }
function getSelectedRefineryRecipe() { return survivalWorkstationCoordinator.getSelectedRefineryRecipe(); }
function getRefineryHintText() { return survivalWorkstationCoordinator.getRefineryHintText(); }
function tryUseRefineryRecipe(recipe = getSelectedRefineryRecipe()) { return survivalWorkstationCoordinator.tryUseRefineryRecipe(recipe); }
function getRefineryDistance() { return !refineryStation?.parent ? Infinity : refineryStation.position.distanceTo(player.position); }
function getAirPurifierHintText(mapId = "폐광") { return survivalWorkstationCoordinator.getAirPurifierHintText(mapId); }
function tryUseAirPurifier(mapId = "폐광") { return survivalWorkstationCoordinator.tryUseAirPurifier(mapId); }
function enterMansionOneRoom(roomKey = getOwnedMansionRoomKey()) { return survivalWorkstationCoordinator.enterMansionOneRoom(roomKey); }
function exitMansionOneRoom() { return survivalWorkstationCoordinator.exitMansionOneRoom(); }
function setMansionSleepOpen(v) { return survivalWorkstationCoordinator.setMansionSleepOpen(v); }
function openMansionSleepDialog() { return survivalWorkstationCoordinator.openMansionSleepDialog(); }
function closeMansionSleepDialog() { return survivalWorkstationCoordinator.closeMansionSleepDialog(); }
function openPersonalStorage() { return survivalWorkstationCoordinator.openPersonalStorage(); }
async function confirmMansionSleepLogout() { return survivalWorkstationCoordinator.confirmMansionSleepLogout(); }
function updateAirSystem(dt) { return survivalWorkstationCoordinator.updateAirSystem(dt); }
let mapTransitionLockUntil = 0;
let mapTransitionPending = null;
survivalWorkstationCoordinator = createSurvivalWorkstationCoordinator({
  airGaugeMax: AIR_GAUGE_MAX,
  airRecoveryPerSecond: AIR_RECOVERY_PER_SECOND,
  mapPurificationProgress,
  mapPollutionConfig: MAP_POLLUTION_CONFIG,
  getPlayerAirState: () => ({ current: playerAirCurrent, max: playerAirMax }),
  setPlayerAirCurrent: (value) => { playerAirCurrent = value; },
  setPlayerAirMax: (value) => { playerAirMax = value; },
  getCurrentMapId: () => currentMapId,
  getEffectiveAirMapId,
  canPlayGame,
  hasItem,
  consumeItem,
  getItemCount,
  addItem,
  getItemName: (itemId) => ITEM_DEFS[itemId]?.name,
  itemDefs: ITEM_DEFS,
  isBuildPartItemId: isWastelandBuildPartItemId,
  createForgeUpgradeAttemptPlan,
  createForgeUpgradeResultPlan,
  workstationUiController,
  workstationWindowsUi,
  createItemVisual: createItemVisualElement,
  createForgeUpgradeVisual: createForgeUpgradeVisualElement,
  getForgeUpgradeState,
  getForgeTargetItemId,
  getForgeDistance,
  getRefineryDistance,
  getDefaultForgeStats: PICKAXE_UPGRADE_LEVELS[0],
  setInventoryOpen: setInvOpen,
  setQuestOpen,
  closeFrontierBuild: () => {
    if (frontierParcelCoordinator?.isBuildOpen()) setFrontierBuildOpen(false);
  },
  updateInventoryUi: updateInventoryUI,
  schedulePlayerSaveSync,
  showUi: showUI,
  setLastMessageUntil: (until) => { lastMessageUntil = until; },
  onForgeUpgradeSucceeded: () => {
    tutorialQuest.upgradeCount += 1;
    refreshQuestProgress();
  },
  applyForgeUpgrade: (pending) => {
    if (pending.itemId !== "pickaxe") return;
    const equippedPickaxeEntry = getEquippedInventoryEntry("tool");
    if (equippedPickaxeEntry && getSlotItemId(equippedPickaxeEntry) === "pickaxe") {
      equippedPickaxeEntry.pickaxeLevel = pending.targetLevel;
      if (!Number.isFinite(inventory.pickaxeLevel) || inventory.pickaxeLevel < pending.targetLevel) {
        inventory.pickaxeLevel = pending.targetLevel;
      }
      return;
    }
    inventory.pickaxeLevel = pending.targetLevel;
  },
  airHudElements: { airHudWrap, airHudValue, airHudBarFill, airHudStatus, airHudPurify },
  updateAirHudUi,
  pollutionOverlay,
  scene,
  three: THREE,
  randomRange: randRange,
  pollutionVisualConfig: {
    particleCount: CAVE_POLLUTION_PARTICLE_COUNT,
    particleSway: CAVE_POLLUTION_PARTICLE_SWAY,
    overlayMaxOpacity: CAVE_POLLUTION_OVERLAY_MAX_OPACITY,
    lowAirEdgeBlurMaxPx: LOW_AIR_EDGE_BLUR_MAX_PX,
    campMapX: CAMP_MAP_X,
    campMapZ: CAMP_MAP_Z,
    frontierMapX: FRONTIER_MAP_X,
    frontierMapZ: FRONTIER_MAP_Z,
    groundSize: GROUND_SIZE,
    frontierGroundSize: FRONTIER_GROUND_SIZE,
  },
  getPlayer: () => player,
  getActiveInteractable: () => activeInteractable,
  getMansionBedInteractable: () => mansionOneBedInteractable,
  getMansionActiveRoomKey: () => mansionOneActiveRoomKey,
  setMansionActiveRoomKey: (roomKey) => { mansionOneActiveRoomKey = roomKey; },
  getMansionExteriorReturn: () => mansionOneExteriorReturn,
  destroyMansionRoomInstance,
  createMansionRoomInstance,
  getFacingDirectionFromYaw,
  latestMoveDir,
  snapCameraToPlayer,
  mansionSleepOverlay,
  mansionSleepDialog,
  setPersonalStorageOpen,
  hasMansionPersonalStorageAuthority,
  isServerBackedWalletSession,
  handleWalletLogout,
  clearWalletSession,
  setWalletLogoutStatus: () => { walletLoginStatus.textContent = "로그아웃되었습니다. 다시 로그인해주세요."; },
});
airRuntime = survivalWorkstationCoordinator.airRuntime;

function registerPickupItem(obj, itemId, text = null) {
  return worldPickups.register(obj, itemId, text);
}

function unregisterPickupItem(obj) {
  worldPickups.unregister(obj);
}

function findNearestPickupItem(radius = 2.0) {
  return worldPickups.findNearest(player.position, radius);
}

function registerTutorialNpc(obj, name, hint = "Space : 대화") {
  return tutorialNpcRuntime.register(obj, name, hint);
}

function findNearestTutorialNpc(radius = 2.2) {
  return tutorialNpcRuntime.findNearest(player.position, radius);
}

function registerMapGate(entry) {
  return mapRuntime.registerMapGate(entry);
}

function registerConnectorTunnelZone(centerX, minZ, maxZ, halfWidth = 7.2) {
  return mapRuntime.registerConnectorTunnelZone(centerX, minZ, maxZ, halfWidth);
}

function findTriggeredMapGate() {
  return mapRuntime.findTriggeredGate();
}

function canUseMapGate(gate) {
  if (!gate) return false;
  if (typeof gate.require === "function") {
    return gate.require();
  }
  return true;
}

function updateCurrentMapFromPlayerPosition() {
  return mapRuntime.updateCurrentMap();
}

function isPlayerInConnectorTunnel() {
  return mapRuntime.isInConnectorTunnel();
}

function getEffectiveAirMapId() {
  return mapRuntime.getEffectiveAirMapId();
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
  frontierParcelCoordinator.renderBuildWindow();
}

function setFrontierBuildOpen(v) {
  frontierParcelCoordinator.setBuildOpen(v);
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
  return getSellableFrontierShopEntriesFromModule(inventory.slots, {
    isNftInventoryEntry,
    getSlotItemId,
    itemDefs: ITEM_DEFS,
    getInventoryEntryCategory,
    isQuestCriticalItemBlockedFromDiscard,
  });
}

function openFrontierShopRegisterDialog(parcelLabel = getSelectedFrontierParcelLabel()) {
  return frontierParcelCoordinator.openShopRegisterDialog(parcelLabel);
}

function closeFrontierShopRegisterDialog() {
  frontierParcelCoordinator.closeShopRegisterDialog();
}

function clearFrontierShopListing(parcelLabel) {
  return frontierParcelCoordinator.clearShopListing(parcelLabel);
}

function tryPurchaseFrontierShopListing(parcelLabel, quantity) {
  return frontierParcelCoordinator.purchaseShopListing(parcelLabel, quantity);
}

function commitFrontierShopListing() {
  return frontierParcelCoordinator.commitShopListing();
}

function renderFrontierShopRegisterDialog() {
  frontierParcelCoordinator.renderShopRegisterDialog();
}

function assignFrontierShopSlotUser(parcelLabel, walletAddress) {
  return frontierParcelCoordinator.assignShopSlotUser(parcelLabel, walletAddress);
}

function clearFrontierShopSlotUser(parcelLabel) {
  return frontierParcelCoordinator.clearShopSlotUser(parcelLabel);
}

function updateFrontierShopListingPrice(parcelLabel, nextPrice) {
  return frontierParcelCoordinator.updateShopListingPrice(parcelLabel, nextPrice);
}

function tryAdvanceFrontierBuildStage() {
  return frontierParcelCoordinator.tryAdvanceBuildStage();
}

function saveFrontierBuildSignText() {
  return frontierParcelCoordinator.saveBuildSignText();
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

function setForgeOpen(v) { return survivalWorkstationCoordinator.setForgeOpen(v); }
function setRefineryOpen(v) { return survivalWorkstationCoordinator.setRefineryOpen(v); }
function renderRefineryWindow() { return survivalWorkstationCoordinator.renderRefineryWindow(); }
function tryCraftSelectedRefineryRecipe() { return survivalWorkstationCoordinator.tryCraftSelectedRefineryRecipe(); }
function renderForgeWindow() { return survivalWorkstationCoordinator.renderForgeWindow(); }
function tryUpgradeEquippedItem() { return survivalWorkstationCoordinator.tryUpgradeEquippedItem(); }

frontierParcelCoordinator = createFrontierParcelCoordinator({
  parcelLabels: FRONTIER_PARCEL_LABELS,
  authorityItemIds: FRONTIER_AUTHORITY_ITEM_IDS,
  defaultParcelLabel: "P6",
  buildStageConfig: FRONTIER_BUILD_STAGE_CONFIG,
  maxSignChars: FRONTIER_BUILDING_SIGN_MAX_CHARS,
  frontierMapX: FRONTIER_MAP_X,
  buildingHeight: FRONTIER_BUILDING_HEIGHT,
  itemDefs: ITEM_DEFS,
  interactables,
  scene,
  uiLayer,
  runtime: frontierRuntime,
  getBuildStateData: () => frontierBuildState,
  getActiveParcelLabel: () => frontierActiveParcelLabel,
  setActiveParcelLabel: (label) => { frontierActiveParcelLabel = label; },
  getWalletAddress: () => walletAuth.address,
  hasItem,
  getItemCount,
  addItem,
  consumeItem,
  getInventorySlots: () => inventory.slots,
  getEntryItemId: getSlotItemId,
  getEntryCount: getSlotItemCount,
  getEntryName: getInventoryEntryDisplayName,
  getEntryCategory: getInventoryEntryCategory,
  normalizeInventorySlotEntry,
  isNftInventoryEntry,
  isQuestCriticalItemBlocked: isQuestCriticalItemBlockedFromDiscard,
  createEntryVisual: createInventoryEntryVisualElement,
  getItemName: (itemId) => ITEM_DEFS[itemId]?.name ?? itemId,
  clampCredits: clampPlayerCredits,
  canAffordCredits: canAffordPlayerCredits,
  spendCredits: spendPlayerCredits,
  grantCredits: grantPlayerCredits,
  addPurchasedEntry: (itemId, count) => addEntryToInventory(createInventorySlotEntry(itemId, count), count),
  snapshotInventory: () => inventory.slots.map((slot) => (slot ? structuredClone(slot) : null)),
  restoreInventory: (snapshot) => {
    for (let i = 0; i < inventory.slots.length; i += 1) inventory.slots[i] = snapshot[i];
  },
  validateShopInventorySpace: (itemId, quantity) => {
    const snapshot = inventory.slots.map((slot) => (slot ? structuredClone(slot) : null));
    const count = Math.max(1, Math.floor(Number(quantity) || 0));
    const canAdd = addEntryToInventory(createInventorySlotEntry(itemId, count), count);
    for (let i = 0; i < inventory.slots.length; i += 1) inventory.slots[i] = snapshot[i];
    return canAdd;
  },
  getParcel: (label) => frontierParcelDefs.find((entry) => entry.label === label),
  isPlayerInsideParcel: isPlayerInsideFrontierParcel,
  getPlayerStandingPoint: () => ({ x: player.position.x, z: player.position.z, rotationY: player.rotation.y }),
  getBoothMarkers: getFrontierParcelBoothInteractables,
  setBoothMarkers: (label, markers) => { frontierParcelBoothInteractables[label] = markers; },
  getConstructionColliders: getFrontierConstructionColliders,
  setConstructionColliders: (label, colliders) => { frontierParcelConstructionColliders[label] = colliders; },
  getTrackedColliderIndex,
  removeColliderAt,
  getConstructionRoot: getFrontierConstructionRoot,
  getConstructionGroup: (label) => frontierParcelConstructionGroups[label] ?? null,
  setConstructionGroup: (label, group) => { frontierParcelConstructionGroups[label] = group; },
  addCollider,
  buildBuildingSign: buildFrontierBuildingSign,
  buildBoothLabel: (title, status) => buildFrontierBoothLabelFromModule(title, status),
  buildBoothProductVisual: (itemId, quantity) => buildFrontierBoothProductVisualFromModule(itemId, quantity, { itemDefs: ITEM_DEFS }),
  buildDisplayBoothVisual: (entry) => buildFrontierDisplayBoothVisualFromModule(entry, { itemDefs: ITEM_DEFS, normalizeInventorySlotEntry, isNftInventoryEntry, getSlotItemId, getInventoryEntryDisplayIcon, getInventoryEntryDisplayName }),
  ensurePlayerNotInsideGeneratedColliders,
  shortenWallet: shortenWalletAddress,
  formatCreditsLabel: formatPlayerCreditsLabel,
  grantOfflineSellerCredits: grantFrontierShopSellerCredits,
  now: () => performance.now(),
  showUI,
  notify: (message, duration) => {
    showUI(message, duration);
    lastMessageUntil = performance.now() + duration;
  },
  setLastMessageUntil: (until) => { lastMessageUntil = until; },
  setLastMessageFromDuration: (duration) => { lastMessageUntil = performance.now() + duration; },
  updateInventoryUi: updateInventoryUI,
  scheduleSave: schedulePlayerSaveSync,
  onBuildOpened: () => {
    setInvOpen(false);
    setQuestOpen(false);
    setForgeOpen(false);
    setRefineryOpen(false);
  },
});
frontierParcelCoordinator.initializeUi();

function closeFrontierBoothDialog() {
  frontierParcelCoordinator.closeBoothDialog();
}

function renderFrontierBoothDialog() {
  frontierParcelCoordinator.renderBoothDialog();
}

function openFrontierBoothDialog(parcelLabel, slotKey, boothTitle, mode) {
  frontierParcelCoordinator.openBoothDialog({ parcelLabel, slotKey, boothTitle, mode });
}


// Camera controls
camera.position.set(0, 4, 8);
controls = new OrbitControls(camera, renderer.domElement);controls.enableDamping = true;
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

const CAMERA_OCCLUSION_MARGIN = 0.18;
const CAMERA_OCCLUSION_MIN_DISTANCE = 4.2;
const CAMERA_OCCLUSION_FADE_DISTANCE = 5.0;
const CAMERA_OCCLUSION_FADE_OPACITY = 0.68;
const CAMERA_OCCLUSION_RETURN_SPEED = 7.5;
playerGameplayCoordinator.initializeCamera({
  camera,
  controls,
  colliders,
  scene,
  config: {
    margin: CAMERA_OCCLUSION_MARGIN,
    minDistance: CAMERA_OCCLUSION_MIN_DISTANCE,
    fadeDistance: CAMERA_OCCLUSION_FADE_DISTANCE,
    fadeOpacity: CAMERA_OCCLUSION_FADE_OPACITY,
    returnSpeed: CAMERA_OCCLUSION_RETURN_SPEED,
  },
});

function snapCameraToPlayer() {
  playerGameplayCoordinator.snapCameraToPlayer();
}

function updateThirdPersonCameraOcclusion(dt) {
  playerGameplayCoordinator.updateCameraOcclusion(dt);
}

// Houses
function makeHouse(x, z) {
  const { group, collider } = createHouseModel(x, z);
  scene.add(group);
  addCollider(collider, 1.0);
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
  const { tree, trunk } = createHarvestTreeModel(x, z);
  scene.add(tree);
  trunk.updateWorldMatrix(true, true);
  addCollider(trunk, 0.75);
  return playerGameplayCoordinator.registerHarvestTree(tree);
}

// 캐릭터급 바위 (충돌 포함)
function makeRock(x, z, rockSizeDef = ROCK_SIZE_DEFS[1], fadeIn = false, options = {}) {
  const defaultResourceCount = getRockDefaultResourceCount(rockSizeDef, options);
  const rock = createMineRockModel(x, z, rockSizeDef, fadeIn, options, { defaultResourceCount, randomRange: randRange });
  scene.add(rock);
  rock.userData.colliderIndex = addCollider(rock, 0.85);
  return playerGameplayCoordinator.registerMineRock(rock);
}

function createRespawnRockFromSpawn(spawn) {
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
}

function scheduleRockRespawn(spawn) {
  playerGameplayCoordinator.scheduleRockRespawn(spawn);
}

function unregisterMineRock(rock) {
  playerGameplayCoordinator.unregisterMineRock(rock);
}

function setHarvestTreeActive(tree, active) {
  playerGameplayCoordinator.setHarvestTreeActive(tree, active);
}

function triggerHitStop(duration = HIT_STOP_DURATION) {
  playerGameplayCoordinator.triggerHitStop(duration);
}

function triggerCameraShake(strength = 0.045, duration = CAMERA_SHAKE_DURATION) {
  playerGameplayCoordinator.triggerCameraShake(strength, duration);
}

function triggerRockHitReaction(rock) {
  playerGameplayCoordinator.triggerRockHitReaction(rock);
}

function makePickaxe(x, z, y = 0, rotation = null, level = 1) {
  const g = createPickupPickaxe({ buildPickaxeModel, x, z, y, rotation, level });
  scene.add(g);
  return g;
}

function makeShovel(x, z, y = 0, rotation = null) {
  const g = createPickupShovel({ buildShovelModel, x, z, y, rotation });
  scene.add(g);
  return g;
}

function makeSafetyHelmet(x, z, y = 0, rotation = null) {
  const g = createPickupSafetyHelmet({ buildSafetyHelmetModel, x, z, y, rotation });
  scene.add(g);
  return g;
}

function makeBasicShoes(x, z, y = 0, rotation = null) {
  const g = createPickupBasicShoes({ buildBasicShoesModel, x, z, y, rotation });
  scene.add(g);
  return g;
}

const worldBootstrap = bootstrapWorld({
  scene,
  groundSurfaces,
  interactables,
  addCollider,
  registerWalkableSurface,
  registerSupportSurface,
  registerCaveDarkMaterial,
  registerResidenceMapZone,
  registerMapGate,
  makeTree,
  makeRock,
  makePickaxe,
  makeSafetyHelmet,
  makeBasicShoes,
  makeShovel,
  makeTutorialNpc,
  makeSign,
  buildStartZoneWall,
  buildStartStall,
  buildMinePerimeterCliffs,
  buildForgeAnvil,
  buildRefineryStation,
  buildNftExhibitBoard,
  buildFreshAirCanisterModel,
  buildAirPurifierStation,
  buildTravelGate,
  buildCampTestArea,
  buildCavePollutionField,
  buildMapConnectorTunnel,
  buildTunnelFence,
  buildFrontierArea: buildFrontierAreaFromMaps,
  buildFrontierBuildingSign,
  rebuildFrontierParcelConstructionVisual,
  renderResidenceNoticeBoard,
  registerPickupItem,
  restPropOnSupport,
  enableDynamicProp,
  createTreeSpawnPositions,
  createRockSpawnPlans,
  findRockSpawnPosition,
  findCampStoneSpawnPosition,
  getCaveMasonryRockOptions,
  randomRange: randRange,
  rockCount: ROCK_COUNT,
  caveStoneCount: CAVE_STONE_COUNT,
  rockSizeDefs: ROCK_SIZE_DEFS,
  groundSize: GROUND_SIZE,
  frontierGroundSize: FRONTIER_GROUND_SIZE,
  startX: START_X,
  startZ: START_Z,
  startFlatY: START_FLAT_Y,
  campMapX: CAMP_MAP_X,
  campMapZ: CAMP_MAP_Z,
  frontierMapX: FRONTIER_MAP_X,
  frontierMapZ: FRONTIER_MAP_Z,
  frontierParcelBorderColor: FRONTIER_PARCEL_BORDER_COLOR,
  residenceNoticeBoardVisuals,
  inventory,
});
forgeStation = worldBootstrap.forgeStation;
refineryStation = worldBootstrap.refineryStation;
airPurifierStation = worldBootstrap.airPurifierStation;
mineGate = worldBootstrap.mineGate;
campGate = worldBootstrap.campGate;
frontierCampGate = worldBootstrap.frontierCampGate;
frontierGate = worldBootstrap.frontierGate;
const abandonedMineGate = worldBootstrap.abandonedMineGate;
frontierParcelDefs = worldBootstrap.frontierParcelDefs;
frontierParcelConstructionRoots = worldBootstrap.frontierParcelConstructionRoots;
frontierParcelConstructionGroups = worldBootstrap.frontierParcelConstructionGroups;
frontierParcelConstructionColliders = worldBootstrap.frontierParcelConstructionColliders;
frontierAirPurifierStation = worldBootstrap.frontierAirPurifierStation;
frontierWastelandPlot = worldBootstrap.frontierWastelandPlot;
mansionOneEntranceInteractable = worldBootstrap.mansionOneEntranceInteractable;
mansionOneExteriorReturn = worldBootstrap.mansionOneExteriorReturn;
mansionOneRoomRoot = worldBootstrap.mansionOneRoomRoot;
mansionOneRoom102Root = worldBootstrap.mansionOneRoom102Root;
mansionOneRoomInstances["101"] = worldBootstrap.mansionOneRoomInstances["101"];
mansionOneRoomInstances["102"] = worldBootstrap.mansionOneRoomInstances["102"];

function applyDevPreset() {
  if (!DEV_PRESET_ENABLED) return;
  const isBuyerProfile = activeDevProfileId === "dev_user_2";
  const preservedLandDeeds = getWastelandLandDeedInventoryEntries().map((entry) => structuredClone(entry));

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
  restorePreservedWastelandLandDeeds(preservedLandDeeds);

  tutorialQuest.minedRockCount = DEV_PRESET.completeTutorial ? 1 : 0;
  tutorialQuest.upgradeCount = DEV_PRESET.completeTutorial ? 3 : 0;
  tutorialQuest.archivedSteps = [];
  tutorialQuest.currentStep = DEV_PRESET.completeTutorial ? tutorialQuest.steps.length : 0;
  tutorialQuest.completed = Boolean(DEV_PRESET.completeTutorial);

  if (DEV_PRESET.giveStarterGear) {
    addItem("pickaxe", 1);
    addItem("shovel", 1);
    addItem("safetyHelmet", 1);
    addItem("fencePost", 200);
    for (const itemId of Object.keys(WASTELAND_BUILD_PART_DEFS)) {
      addItem(itemId, 200);
    }
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

  survivalWorkstationCoordinator.setAirState({ max: AIR_GAUGE_MAX, current: AIR_GAUGE_MAX });
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
  survivalWorkstationCoordinator.setAirState({ max: AIR_GAUGE_MAX, current: AIR_GAUGE_MAX });
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
  survivalWorkstationCoordinator.setAirState({
    max: Math.max(1, Number(source.airSystem.max) || AIR_GAUGE_MAX),
    current: Number(source.airSystem.current) || AIR_GAUGE_MAX,
  });
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

applyDevPreset();


function makeSign(x, z, text, rotationY = 0) {
  const { group, board, collider } = createSignModel();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  scene.add(group);
  group.userData.colliderIndex = addCollider(collider, 1.0);
  const g = group;
  console.log("SIGN CREATED:", text, "pos=", g.position.x, g.position.z);

  // 상호작용 대상 등록(텍스트 포함)
  interactables.push({ obj: g, text, board });
  return g;
}

function makeTutorialNpc(x, z, rotationY = 0) {
  const { group: g, collider } = createTutorialNpcModel();
  g.position.set(x, START_FLAT_Y, z);
  g.rotation.y = rotationY;
  scene.add(g);
  g.userData.colliderIndex = addCollider(collider, 1.0);
  registerTutorialNpc(g, "작업 감독관");
  return g;
}

function buildForgeAnvil(x, z) {
  const g = createForgeAnvilModel();
  g.position.set(x, START_FLAT_Y, z);
  scene.add(g);
  addCollider(g, 0.95);
  return g;
}

function buildNftExhibitBoard(x, z, rotationY = Math.PI * 0.5) {
  const { group: g, frame, screenMaterial } = createNftExhibitBoardModel();

  g.position.set(x, START_FLAT_Y + 0.22, z);
  g.rotation.y = rotationY;
  scene.add(g);
  addCollider(g, 0.88);
  interactables.push({ obj: g, text: "E : NFT 전시", board: frame, type: "nftBoard" });

  nftExhibitBoard = g;
  nftExhibitScreenMaterial = screenMaterial;
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
  renderResidenceNoticeBoardTexture({
    canvas: visual.canvas,
    texture: visual.texture,
    entry,
  });
}

function renderResidenceNoticeBoards() {
  for (const key of RESIDENCE_NOTICE_BOARD_KEYS) {
    renderResidenceNoticeBoard(key);
  }
}

function buildAirPurifierStation(x, z, rotationY = Math.PI, mapId = "폐광") {
  const { group: g, chamber } = createAirPurifierModel(registerCaveDarkMaterial);

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
  const { group: g, collider, grinderCore } = createRefineryModel(buildPurifyPowderModel);

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
  const g = createTunnelFenceModel(width);

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
  playerGameplayCoordinator.beginShiftCameraRotation(e);
});

window.addEventListener("pointerup", () => {
  playerGameplayCoordinator.endShiftCameraRotation({
    controlsEnabled: canPlayGame() && !isWorkUiMovementLocked(),
  });
});

window.addEventListener("pointercancel", () => {
  playerGameplayCoordinator.endShiftCameraRotation({
    controlsEnabled: canPlayGame() && !isWorkUiMovementLocked(),
  });
});

window.addEventListener("pointermove", (e) => {
  if (!keys.shift || !canPlayGame() || isWorkUiMovementLocked()) return;
  playerGameplayCoordinator.rotateShiftCamera({
    ...e,
    sensitivity: SHIFT_CAMERA_ROTATE_SENSITIVITY,
  });
});

window.addEventListener("keydown", (e) => {
  interactionController.handleKeyDown(e);
});

window.addEventListener("keyup", (e) => {
  const k = getLogicalInputKey(e);
  if (!canPlayGame()) {
    if (k in keys) keys[k] = false;
    if (k === "shift") {
      keys.shift = false;
      playerGameplayCoordinator.endShiftCameraRotation({ controlsEnabled: canPlayGame() });
    }
    return;
  }
  if (nftExhibitSelectionOpen) {
    if (k in keys) keys[k] = false;
    if (k === "shift") {
      keys.shift = false;
      playerGameplayCoordinator.endShiftCameraRotation({ controlsEnabled: canPlayGame() });
    }
    return;
  }
  if (quickUseAssignState) {
    if (k in keys) keys[k] = false;
    if (k === "shift") {
      keys.shift = false;
      playerGameplayCoordinator.endShiftCameraRotation({ controlsEnabled: canPlayGame() });
    }
    return;
  }
  if (isWorkUiMovementLocked()) {
    if (k in keys) keys[k] = false;
    if (k === "shift") {
      keys.shift = false;
      playerGameplayCoordinator.endShiftCameraRotation({
        controlsEnabled: canPlayGame() && !isWorkUiMovementLocked(),
      });
    }
    return;
  }
  if (k in keys) keys[k] = false;
  if (k === "shift") {
    keys.shift = false;
    playerGameplayCoordinator.endShiftCameraRotation({ controlsEnabled: canPlayGame() });
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
const PICKUP_REACH_DURATION = 0.22;

function triggerMiningSwing(target = null) {
  playerGameplayCoordinator.triggerMiningSwing(target, () => getCurrentPickaxeStats().swingDuration);
}

function triggerPickupReach(target = null) {
  playerGameplayCoordinator.triggerPickupReach(target, PICKUP_REACH_DURATION);
}

function updateMovement(dt) {
  playerGameplayCoordinator.updateMovement({
    dt,
    keys,
    camera,
    controls,
    pickupReachDuration: PICKUP_REACH_DURATION,
    rig: { torso, head, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot },
    canPlayGame,
    isWorkUiMovementLocked,
    isSleeping: () => workstationUiController.isSleepOpen() || workstationUiController.isSleepPoseActive(),
    isDevSession,
    hasShoesEquipped: () => getEquippedItemForSlot("shoes") === "basicShoes",
    getAirMoveScalar: () => (
      isPollutedMap(currentMapId) && getMapPurificationValue(currentMapId) < 100 && playerAirCurrent <= 0 ? 0.12 : 1
    ),
    getMovementBasisVectors,
    buildMoveVector,
    isMoveVectorActive,
    normalizeMoveVector,
    updateLatestMoveDirection: (move) => updateLatestMoveDirection(latestMoveDir, move),
    getMovementSpeed,
    getMovementDelta,
    applyMovementCollisionStep,
    isInsideBounds: isInsideCurrentMapBounds,
    intersectsAnyCollider: () => intersectsAnyCollider(getPlayerBox()),
    isStartRingTransitionBlocked,
    isCrossingBlockedStartRing,
    applyMovementPostCollisionCorrections,
    getPostCollisionOptions: () => ({
      resolveStartRingPenetration,
      startWallOn: START_WALL_ON,
      startHardClamp: START_HARD_CLAMP,
      startX: START_X,
      startZ: START_Z,
      startRadius: START_RADIUS,
    }),
    getMovementYaw,
    getWalkAnimationSpeed,
    applyWalkIdlePose,
    applyMiningSwingPose,
    applyPickupReachPose,
    applySleepPose,
    updatePlayerGroundY,
    onWorkUiLocked: () => playerGameplayCoordinator.endShiftCameraRotation(),
    now: performance.now(),
  });
}

const interactionController = createInteractionController({
  now: () => performance.now(),
  hudMessages: HUD_MSG,
  quickUseAllowedKeys: QUICK_USE_ALLOWED_KEYS,
  getLogicalInputKey,
  isTextInputActive,
  canPlayGame,
  isNftExhibitSelectionOpen: () => nftExhibitSelectionOpen,
  isQuickUseAssigning: () => Boolean(quickUseAssignState),
  getQuickUseAssignmentConsumedUntil: () => quickUseAssignmentConsumedUntil,
  getKeys: () => keys,
  isWorkUiMovementLocked,
  resetShiftRotation: () => {
    keys.shift = false;
    playerGameplayCoordinator.endShiftCameraRotation({
      controlsEnabled: canPlayGame() && !isWorkUiMovementLocked(),
    });
  },
  getInteractionState: () => ({
    activeInteractable,
    activeForgeStation,
    activeHarvestTree,
    activeWastelandCell,
    activeTutorialNpc,
    activeMapGate,
    activePickupItem,
    activeMineRock,
  }),
  setInteractionState: (state) => {
    activeInteractable = state.activeInteractable;
    activeForgeStation = state.activeForgeStation;
    activeHarvestTree = state.activeHarvestTree;
    activeWastelandCell = state.activeWastelandCell;
    activeTutorialNpc = state.activeTutorialNpc;
    activeMapGate = state.activeMapGate;
    activePickupItem = state.activePickupItem;
    activeMineRock = state.activeMineRock;
  },
  showUI,
  setLastMessageUntil: (until) => { lastMessageUntil = until; },
  findNearestPickupItem,
  triggerPickupReach,
  addInventoryEntry,
  createInventorySlotEntry,
  addItem,
  updateInventoryUI,
  refreshQuestProgress,
  getItemDef: (itemId) => ITEM_DEFS[itemId],
  unregisterDynamicProp,
  unregisterPickupItem,
  canUseMapGate,
  tryUnlockMapGate,
  hasNearbyForgeStation: () => forgeStation?.parent && getForgeDistance() < 2.4,
  getForgeStation: () => forgeStation,
  isForgeOpen: () => workstationUiController.isForgeOpen(),
  setForgeOpen,
  openNftBoardSelectionOverlay,
  getFrontierBoothInteractionPlan,
  openFrontierBoothDialog,
  hasMansionOneResidenceAuthority,
  getOwnedMansionRoomKey,
  enterMansionOneRoom,
  exitMansionOneRoom,
  isRefineryOpen: () => workstationUiController.isRefineryOpen(),
  setRefineryOpen,
  tryUseAirPurifier,
  isDevPresetEnabled: () => DEV_PRESET_ENABLED,
  isTorchEquipped: () => torchEquipped,
  setTorchEquipped: (equipped) => { torchEquipped = equipped; },
  useQuickUseItem,
  openPersonalStorage,
  openMansionSleepDialog,
  getCurrentQuestStep,
  isMineKeyIssued: () => inventory.mineKeyIssued,
  setMineKeyIssued: () => { inventory.mineKeyIssued = true; },
  showNpcDialog,
  getTutorialNpcLine,
  renderQuestWindowIfOpen: () => { if (questOpen) renderQuestWindow(); },
  triggerMiningSwing,
  createTreeHarvestPlan,
  setHarvestTreeActive,
  placeWastelandFencePost,
  hasWastelandFencePost: (cell) => frontierWastelandPlot?.fencePosts?.has(`${cell.row}:${cell.col}`),
  placeWastelandStructure,
  hasOwnedTool: (itemId) => findFirstSlotWithItem(itemId) !== -1,
  canClearWastelandCell,
  createWastelandClearPlan,
  syncWastelandCellState: syncWastelandCellStateFromProgress,
  applyWastelandCellVisual,
  saveSharedWorldStateToLocal,
  createRockMiningPlan: (rock) => createRockMiningPlan({
    hp: rock.userData.hp,
    maxHp: rock.userData.maxHp ?? 1,
    miningPower: hasEquippedTool("pickaxe") ? getEquippedMiningPower() : 0,
    isPickaxeEquipped: hasEquippedTool("pickaxe"),
    hasOwnedPickaxe: findFirstSlotWithItem("pickaxe") !== -1,
    equippedPickaxeLevel: getEquippedPickaxeLevel(),
    requiredPickaxeLevel: rock.userData.requiredPickaxeLevel ?? 0,
  }),
  triggerHitStop,
  triggerRockHitReaction,
  triggerCameraShake,
  spawnDustBurst,
  finishRockMining: (rock, spawn) => {
    spawnRockBreakBurst(rock);
    if (rock.userData.resourceItemId === "stoneDust") tutorialQuest.minedRockCount += 1;
    addItem(rock.userData.resourceItemId ?? "stoneDust", rock.userData.resourceCount ?? 1);
    if (rock.userData.bonusDropEnabled) {
      if (Math.random() < getCurrentPickaxeStats().bonusDropChance) {
        addItem("stoneDust", 1);
        showUI("보너스 돌가루 획득!", 800);
        lastMessageUntil = performance.now() + 800;
      }
    } else {
      showUI(`${ITEM_DEFS[rock.userData.resourceItemId]?.name ?? "자원"} 획득!`, 800);
      lastMessageUntil = performance.now() + 800;
    }
    updateInventoryUI();
    refreshQuestProgress();
    if (typeof rock.userData.colliderIndex === "number") removeColliderAt(rock.userData.colliderIndex);
    unregisterMineRock(rock);
    rock.removeFromParent();
    scheduleRockRespawn(spawn);
  },
  hidePickupHint,
  getCurrentFrontierParcelLabel,
  setFrontierActiveParcelLabel: (label) => { frontierActiveParcelLabel = label; },
  hasFrontierParcelAuthority,
  isFrontierBuildOpen: () => frontierParcelCoordinator?.isBuildOpen() ?? false,
  setFrontierBuildOpen,
  findNearestTutorialNpc,
  findTriggeredMapGate,
  findNearestInteractable: (radius) => findNearestInteractable(interactables, player.position, radius),
  updateInteractableHighlights: (target) => updateInteractableHighlights(interactables, target),
  findNearestHarvestTree,
  findNearestMineRock,
  getEquippedPickaxeLevel,
  findActiveFrontierWastelandCell,
  isFencePlacementMode: () => wastelandController.isFencePlacementMode(),
  getSelectedStructureItemId: () => wastelandController.getSelectedStructureItemId(),
  getWastelandBuildPartDef,
  getWastelandBuildCheck,
  hasEquippedTool,
  getFrontierWastelandClaimByCell,
  getFrontierBuildState,
  getInteractableHintText: (target, boothPlan) => getInteractableHintText(target, {
    frontierBoothPlan: boothPlan,
    getAirPurifierHintText,
    hasMansionOneResidenceAuthority,
    getOwnedMansionRoomPermitName,
    getRefineryHintText,
  }),
  isMapTransitionPending: () => mapTransitionPending,
  getMapGateHintText: (gate) => getMapGateHintTextFromModule(gate, {
    canUseMapGate,
    hasItem,
    getItemName: (itemId) => ITEM_DEFS[itemId]?.name,
  }),
  canShowAirCanisterHint: () => Boolean(getQuickUseKeyForItemId("freshAirCanister") && hasItem("freshAirCanister") && playerAirCurrent < playerAirMax),
  getAirCanisterHintText: () => `${getQuickUseKeyForItemId("freshAirCanister")} : 신선한 공기 캔 사용`,
  showHint,
  hideHint,
  clearWastelandHighlights: () => {
    for (const cell of frontierWastelandPlot?.cells ?? []) clearWastelandCellHighlight(cell);
  },
  applyWastelandCellHighlight,
  updateWastelandClaimPreview,
  updateWastelandHud: () => {
    expireOverdueWastelandDraftReservations();
    expireOverdueFrontierWastelandClaims();
    const progress = getCurrentWastelandClaimProgress();
    updateWastelandHudUi(wastelandHudWrap, wastelandHudValue, wastelandHudBarFill, wastelandHudStatus, {
      visible: shouldShowFrontierWastelandHud(),
      completed: progress?.completed ?? 0,
      total: progress?.total ?? 0,
      percent: progress?.percent ?? 0,
      statusText: progress?.claim ? getWastelandClaimHudStatusText(progress) : "",
    });
    updateWastelandFenceHudUi(wastelandFenceHudWrap, wastelandFenceHudValue, wastelandFenceHudMeta, wastelandFenceHudStatus, getWastelandFenceHudState());
    updateWastelandClaimActionUi(progress);
  },
  updateRockHpBar,
  hideRockHpBar,
});

window.addEventListener("keydown", (e) => {
  if (!canPlayGame()) return;
  if (nftExhibitSelectionOpen || quickUseAssignState) return;
  if (workstationUiController.isSleepOpen()) return;
  if (wastelandController.isClaimCancelOpen() || wastelandController.isClaimConfirmOpen()) return;
  if (inventoryUiController.isPersonalStorageOpen() || e.code !== "Space") return;
  interactionController.handleWorldSpaceInteraction(e);
});


function animate() {
  requestAnimationFrame(animate);
  const rawDt = Math.min(clock.getDelta(), 0.033);
  survivalWorkstationCoordinator.updateForgeUpgradeState();
  const feedbackState = playerGameplayCoordinator.updateFeedback(rawDt);
  const dt = feedbackState.hitStopped ? 0 : rawDt;

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
  playerGameplayCoordinator.updateResourceVisuals({ dt, reactionDt: rawDt });
  if (inventoryUiController.isInventoryOpen()) renderEquipmentPreview();
  updateCompassFromDirection(getCompassDirection(latestMoveDir, player.rotation.y));

  interactionController.updateFrame();

  playerGameplayCoordinator.updateCameraFollow();
  updateNpcDialogPosition();
  updateTutorialNpcNameTag();
  updatePlayerNameTag();
  playerGameplayCoordinator.applyCameraShake();
  if (workstationUiController.isForgeOpen()) {
    if (getForgeDistance() >= 2.8) {
      setForgeOpen(false);
    }
  }
  if (workstationUiController.isRefineryOpen()) {
    if (getRefineryDistance() >= 2.8) {
      setRefineryOpen(false);
    }
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
