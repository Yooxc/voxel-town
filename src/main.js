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
  createWastelandStructurePreviewMesh,
  getWastelandStructureOccupancyBounds,
  createWastelandFencePostMesh,
  createWastelandFenceLinkMesh,
  createWastelandPreviewCellMesh,
  createWastelandFoundationMesh,
} from "./world/wastelandModels.js";
import { createFrontierWastelandCoordinator } from "./world/frontierWastelandCoordinator.js";
import { createWastelandWorldClient } from "./network/wastelandWorldClient.js";
import { createFrontierParcelCoordinator } from "./world/frontierParcelCoordinator.js";
import { createFrontierFeatureCoordinator } from "./world/frontierFeatureCoordinator.js";
import { createFrontierSceneController } from "./world/frontierSceneController.js";
import { createMapGateProgressionCoordinator } from "./world/mapGateProgressionCoordinator.js";
import { createResidenceSceneController } from "./world/residenceSceneController.js";
import { createMapEnvironmentController } from "./world/mapEnvironmentController.js";
import { createWorldFeatureCoordinator } from "./world/worldFeatureCoordinator.js";
import { createWorldRuntimeIntegration } from "./world/worldRuntimeIntegration.js";
import { createDeformableTerrainMap, TERRAIN_LAB_MAP_ID } from "./world/deformableTerrainMap.js";
import { renderResidenceNoticeBoardTexture } from "./world/residenceNoticeBoard.js";
import { createDynamicPropsRuntime } from "./world/dynamicProps.js";
import { createPlayerGroundingRuntime } from "./world/playerGrounding.js";
import { createMiningParticlesRuntime } from "./world/miningParticles.js";
import {
  findCaveRockSpawnPosition,
  findMineRockSpawnPosition,
  getRockSpawnBounds as getRockSpawnBoundsFromModule,
} from "./world/rockPlacement.js";
import { createWorldPickupRuntime } from "./systems/worldPickups.js";
import { createTutorialNpcRuntime } from "./systems/tutorialNpcs.js";
import { createColliderRegistry } from "./world/colliderRegistry.js";
import { createQuestWindowUi, renderQuestWindowUi } from "./ui/questWindow.js";
import { createMansionSleepDialogUi, createMapEffectOverlays } from "./ui/gameOverlayUi.js";
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
  getWastelandBuildPalettePartDefs,
  getWastelandStructurePlacementKey,
  getWastelandStructureSlotLabel,
  getWastelandStructureSurfaceY,
  getWastelandStructureRotationQuarter,
  getWastelandBuildModeEligibility,
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
import { createGameSessionCoordinator } from "./auth/gameSessionCoordinator.js";
import { bindGameSessionIntegration, createPlayerSaveStatusPresenter } from "./auth/gameSessionIntegration.js";
import {
  createPlayerProfileStateCoordinator,
} from "./save/playerProfileStateCoordinator.js";
import { createDevTestEnvironmentCoordinator } from "./save/devTestEnvironmentCoordinator.js";
import { createSharedWorldStateCoordinator } from "./save/sharedWorldStateCoordinator.js";
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
  PLAYER_INVENTORY_SLOT_COUNT as PLAYER_INVENTORY_SLOT_COUNT_FROM_MODULE,
  DEVELOPER_INVENTORY_SLOT_COUNT as DEVELOPER_INVENTORY_SLOT_COUNT_FROM_MODULE,
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
import { createInventoryFacade } from "./systems/inventoryFacade.js";
import { createInventoryFeatureCoordinator } from "./systems/inventoryFeatureCoordinator.js";
import { createFrontierRuntime } from "./systems/frontierRuntime.js";
import { createNftExhibitRuntime } from "./systems/nftExhibitRuntime.js";
import { createInventoryController } from "./ui/inventoryController.js";
import { createWorkstationController } from "./ui/workstationController.js";
import { createWastelandController } from "./ui/wastelandController.js";
import { createNftExhibitController } from "./ui/nftExhibitController.js";
import { createQuestUiController } from "./ui/questUiController.js";
import {
  createInventoryWindowUi,
  makeInventorySlotElement,
} from "./ui/inventoryWindow.js";
import { createInventoryGameplayController } from "./ui/inventoryGameplayController.js";
import { createInventoryEquipmentPreview } from "./ui/inventoryEquipmentPreview.js";
import { createInventoryPresentationController } from "./ui/inventoryPresentationController.js";
import { createInventoryIntegrationController } from "./ui/inventoryIntegrationController.js";
import { createGameHudController } from "./ui/gameHudController.js";
import { createGameplayHintController } from "./ui/gameplayHintController.js";
import { createDevTerrainLabController } from "./ui/devTerrainLabController.js";
import { createTerrainDiggingController } from "./systems/terrainDiggingController.js";
import { createFrontierOperationsController } from "./ui/frontierOperationsController.js";
import { createFrontierWindowsUi } from "./ui/frontierWindowsUi.js";
import { createWorkstationWindowsUi } from "./ui/workstationWindowsUi.js";
import {
  createHudUi,
  createGameHudOverlays,
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
  createWastelandBuildModeUi,
  createWastelandClaimConfirmDialogUi,
  createWastelandClaimCancelDialogUi,
} from "./ui/hud.js";
import {
  getKeyInputCode,
  getLogicalInputKey,
  getFacingDirectionFromYaw,
  getCompassDirection,
} from "./core/movement.js";
import {
  getPlayerBoxFromPosition,
  PLAYER_COLLIDER_SIZE,
  hasPlayerOverlapWithColliderObjects,
  getPlayerColliderPenetrationDepth,
  resolvePlayerColliderPenetration,
  getCurrentMapBoundsFromSurfaces,
  isInsideMapBoundsFromSurfaces,
} from "./core/collisions.js";
import {
  createPlayerRig,
  getPlayerRigParts,
  createPlayerEquipmentVisuals,
  updatePlayerEquipmentVisualsVisibility,
  syncPreviewPlayerPose,
} from "./core/player.js";
import { findNearestByPosition } from "./core/proximity.js";
import { createPlayerGameplayCoordinator } from "./core/playerGameplayCoordinator.js";
import { createPlayerRuntimeIntegration } from "./core/playerRuntimeIntegration.js";
import { findNearestInteractable, getInteractableHintText } from "./systems/interactions.js";
import { updateInteractableHighlights } from "./world/interactableHighlights.js";
import {
  setHarvestTreeActive as setHarvestTreeActiveFromModule,
  updateHarvestTrees as updateHarvestTreesFromModule,
  updateRockFadeIns as updateRockFadeInsFromModule,
} from "./world/resourceVisuals.js";
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
import { createSessionController } from "./auth/sessionController.js";
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
let frontierFeatureCoordinator = null;
let survivalWorkstationCoordinator = null;
const worldFeatureCoordinator = createWorldFeatureCoordinator({
  getFrontier: () => frontierParcelCoordinator,
  getSurvival: () => survivalWorkstationCoordinator,
  getQuickUseItemId: (...args) => getQuickUseItemId(...args),
});
const {
  getFrontierShopPurchaseFeedback, getFrontierShopOperation, getFrontierDisplayOperation,
  assignFrontierDisplayEntry, clearFrontierDisplayEntry, getFrontierShopAssignedWallet,
  getFrontierShopSellerWallet, isFrontierShopSeller, canManageFrontierShopSlot,
  canUseFrontierShopSlot, canEditFrontierShopListing, canManageFrontierShopSellerTools,
  canRegisterFrontierShopListing, canCollectFrontierShopSettlement,
  getFrontierDisplayAssignedWallet, canManageFrontierDisplaySlot, canUseFrontierDisplaySlot,
  getFrontierBoothInteractionPlan, collectFrontierShopSettlement,
  assignFrontierDisplaySlotUser, clearFrontierDisplaySlotUser, getCurrentFrontierParcelLabel,
  getSelectedFrontierParcelLabel, getFrontierBuildState, getFrontierParcelSafeStandingPoint,
  rebuildAllFrontierConstructionVisuals, getFrontierNextStageConfig,
  rebuildFrontierParcelConstructionVisual, renderFrontierBuildWindow, setFrontierBuildOpen,
  openFrontierShopRegisterDialog, closeFrontierShopRegisterDialog, clearFrontierShopListing,
  tryPurchaseFrontierShopListing, commitFrontierShopListing, renderFrontierShopRegisterDialog,
  assignFrontierShopSlotUser, clearFrontierShopSlotUser, updateFrontierShopListingPrice,
  tryAdvanceFrontierBuildStage, saveFrontierBuildSignText, closeFrontierBoothDialog,
  renderFrontierBoothDialog, openFrontierBoothDialog, setForgeOpen, setRefineryOpen,
  renderRefineryWindow, tryCraftSelectedRefineryRecipe, renderForgeWindow,
  tryUpgradeEquippedItem,
} = worldFeatureCoordinator;

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
  wastelandBuildModeBtn,
} = createWastelandHudActionButtons(wastelandHudWrap);
const wastelandBuildModeUi = createWastelandBuildModeUi({
  uiLayer,
  parts: getWastelandBuildPalettePartDefs(),
});

const WALLET_SESSION_KEY = "voxel-town.wallet-auth.v1";
const DEV_ACTIVE_PROFILE_KEY = "voxel-town.dev-active-profile.v1";
const DEV_PROFILE_SAVE_PREFIX = "voxel-town.dev-profile-save.v1.";
const DEV_CREDITS_MIGRATION_PREFIX = "voxel-town.dev-credits-migrated.v1.";
const DEV_INVENTORY_SEED_PREFIX = "voxel-town.dev-inventory-seed.v3.";
const DEV_PROFILE_FAILED_LOAD_PREFIX = "voxel-town.dev-profile-load-error.v1.";
const DEV_SHARED_WORLD_KEY = "voxel-town.dev-shared-world.v1";
const AUTH_API_BASE_URL = "http://localhost:8787";
const walletAuth = createInitialWalletAuthState();
const walletProfile = createInitialWalletProfile();
const wastelandWorldClient = createWastelandWorldClient({
  apiBaseUrl: AUTH_API_BASE_URL,
  getToken: () => walletAuth.token,
});
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
let terrainLabMap = null;
let terrainDiggingController = null;
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

const {
  nftBoardOverlay,
  nftBoardCloseBtn,
  nftBoardStatus,
  nftBoardGrid,
} = createNftExhibitUi(uiLayer);

const nftExhibitController = createNftExhibitController({
  ui: { overlay: nftBoardOverlay, closeButton: nftBoardCloseBtn, status: nftBoardStatus, grid: nftBoardGrid },
  runtime: nftExhibitRuntime,
  target: NFT_EXHIBIT_TARGET,
  createTokensCache: createNftOwnedTokensCache,
  createDefaultSelection: createNftBoardDefaultSelection,
  createClearedSelection: createNftBoardClearedSelection,
  normalizeSelection: normalizeNftBoardSelection,
  normalizeImageUrl: normalizeIpfsUrl,
  updateUiState: updateNftExhibitUiState,
  renderTokenGrid: renderNftExhibitTokenGrid,
  createTextTexture: createBoardTextTexture,
  createImageTexture: createBoardImageTexture,
  fetchTokens: async (cache) => fetchWalletOwnedExhibitTokensFromModule({ walletAuth, cache }),
  fetchOwner: fetchErc721Owner,
  fetchTokenUri: fetchErc721TokenUri,
  fetchMetadata: fetchNftMetadata,
  getWalletAuth: () => walletAuth,
  getWalletProfile: () => walletProfile,
  shortenAddress: shortenWalletAddress,
  isServerBackedWalletSession: () => isServerBackedWalletSession(),
  closeOtherWindows: () => { clearGameplayKeys(); setInvOpen(false); setQuestOpen(false); setForgeOpen(false); },
  scheduleSave: () => schedulePlayerSaveSync(true),
  notify: (message, duration) => { showUI(message, duration); lastMessageUntil = performance.now() + duration; },
});

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
    wasteland.closeClaimCancelDialog();
    return true;
  }
  if (wastelandController.isClaimConfirmOpen()) {
    wasteland.closeClaimConfirmDialog();
    return true;
  }
  if (nftExhibitController.isOpen()) {
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
    wastelandController.isBuildModeActive() ||
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
  return nftExhibitController.getSelectedItem();
}

function closeNftBoardSelectionOverlay() {
  return nftExhibitController.close();
}

let playerRuntimeController = null;

function clearGameplayKeys() {
  playerRuntimeController?.clearKeys();
}

function setNftBoardSelection(nextSelection, { save = true } = {}) {
  return nftExhibitController.setSelectedItem(nextSelection, { save });
}

async function openNftBoardSelectionOverlay() {
  return nftExhibitController.openSelection();
}

function scheduleNftExhibitBoardRefresh() {
  return nftExhibitController.scheduleRefresh();
}

async function refreshNftExhibitBoard() {
  return nftExhibitController.refreshBoard();
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
  return sharedWorldStateCoordinator?.createDefaultSharedWorldSave() ?? null;
}

function serializeSharedWorldState() {
  return sharedWorldStateCoordinator?.serializeSharedWorldState() ?? null;
}

function normalizeSharedWorldState(rawWorld) {
  return sharedWorldStateCoordinator?.normalizeSharedWorldState(rawWorld) ?? rawWorld;
}

function applySharedWorldState(rawWorld) {
  return sharedWorldStateCoordinator?.applySharedWorldState(rawWorld) ?? null;
}

function saveSharedWorldStateToLocal() {
  return sharedWorldStateCoordinator?.saveToLocal() ?? false;
}

function loadSharedWorldStateFromLocal() {
  return sharedWorldStateCoordinator?.loadFromLocal() ?? createDefaultSharedWorldSave();
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

function getPlayerCredits() {
  return inventoryFeatureCoordinator.getPlayerCredits();
}

function setPlayerCredits(value) {
  inventoryFeatureCoordinator.setPlayerCredits(value);
}

function closeDiscardDialog() {
  inventoryFeatureCoordinator.closeDiscardDialog();
}

function openDiscardDialog(entry) {
  return inventoryFeatureCoordinator.openDiscardDialog(entry);
}

function commitDiscardDialog() {
  return inventoryFeatureCoordinator.commitDiscardDialog();
}

const playerSaveStatusPresenter = createPlayerSaveStatusPresenter({
  badge: playerSaveStatusBadge,
  isServerBackedSession: () => isServerBackedWalletSession(),
  updateBadge: updatePlayerSaveStatusBadgeUi,
  hideBadge: hidePlayerSaveStatusBadgeUi,
});
let devTerrainLabController = null;

const gameSessionCoordinator = createGameSessionCoordinator({
  getProvider: () => window.ethereum,
  devCreditsMigrationPrefix: DEV_CREDITS_MIGRATION_PREFIX,
  devInventorySeedPrefix: DEV_INVENTORY_SEED_PREFIX,
  sanitizeProfileId: sanitizeDevProfileId,
  getActiveProfileId: () => activeDevProfileId,
  sessionController,
  setPlayerStartPosition: (start) => {
    player.position.set(start.x, player.position.y, start.z);
    player.rotation.y = 0;
    latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
    snapCameraToPlayer();
  },
  playerSave: {
    runtime: playerSaveRuntime, storage: localStorage, authApiBaseUrl: AUTH_API_BASE_URL,
    intervalMs: PLAYER_SAVE_INTERVAL_MS, getSaveKey: getActivePlayerSaveKey,
    getFailedLoadKey: (profileId) => `${DEV_PROFILE_FAILED_LOAD_PREFIX}${sanitizeDevProfileId(profileId)}`,
    getAuthToken: () => walletAuth.token, isDevSession: () => isDevSession(),
    isServerBackedSession: () => isServerBackedWalletSession(), serializeSave: serializePlayerSave,
    applySave: applySerializedPlayerSave, getActiveProfileId: () => activeDevProfileId,
    getTransport: () => ({ apiFetchJson, getAuthHeaders }),
    setPlayerCredits, setLoginStatus: (text) => { walletLoginStatus.textContent = text; },
    setStatus: playerSaveStatusPresenter.setStatus,
    hideStatus: playerSaveStatusPresenter.hideStatus,
    saveSharedWorldState: saveSharedWorldStateToLocal,
  },
  workflow: {
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
    if (!isServerBackedWalletSession()) nftExhibitController.close();
    nftExhibitController.refreshUi();
    playerSaveStatusBadge.style.opacity = isServerBackedWalletSession() ? playerSaveStatusBadge.style.opacity : "0";
    if (controls) controls.enabled = canPlayGame();
    devTerrainLabController?.refresh();
    scheduleNftExhibitBoardRefresh();
  },
  onSessionCleared: () => {
    playerSaveStatusBadge.style.opacity = "0";
    playerSaveStatusBadge.style.transform = "translateY(4px)";
    nftExhibitController.resetSession();
    nftExhibitController.refreshUi();
  },
  applyFreshPlayerStartState,
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
  },
  devProfile: {
  profileIds: DEV_PROFILE_IDS,
  activeProfileKey: DEV_ACTIVE_PROFILE_KEY,
  sharedWorldKey: DEV_SHARED_WORLD_KEY,
  storage: localStorage,
  sessionController,
  getActiveProfileId: () => activeDevProfileId,
  setActiveProfileId: (profileId) => { activeDevProfileId = profileId; },
  getDisplayName: getDevProfileDisplayName,
  getPlayerCredits,
  setPlayerCredits,
  setWalletLoginStatus: (text) => { walletLoginStatus.textContent = text; },
  loadSharedWorldState: loadSharedWorldStateFromLocal,
  applySharedWorldState,
  applyFreshPlayerStartState,
  applyDevPreset,
  saveSharedWorldState: saveSharedWorldStateToLocal,
  applyDevProfileRoleOverrides,
  restoreMissingLandDeeds: () => wasteland.restoreMissingDeeds({ saveProfile: true }),
  resetWastelandDraftUiState: () => wasteland.resetDraftUiState(),
  refreshWastelandDraftUiState: () => wasteland.refreshDraftUiState(),
  createDefaultSharedWorldSave,
  resetFrontierWastelandRuntimeState: () => wasteland.resetState(),
  resetTerrainLabState: () => terrainDiggingController?.reset(),
  resetDevTestProfiles: (currentProfileId) => {
    clearGameplayKeys();
    return devTestEnvironmentCoordinator.resetProfiles(currentProfileId);
  },
  notify: (message, duration) => {
    showUI(message, duration);
    lastMessageUntil = performance.now() + duration;
  },
  },
});

const {
  playerSaveCoordinator, canPlayGame, clearWalletSession, handleWalletLogout, hasNickname,
  isDevSession, isGuestSession, isServerBackedWalletSession, isWalletAuthenticated,
  restoreWalletSession, saveWalletSession, setWalletAuthState, updateWalletUi,
  bindWalletProviderEvents, connectWalletLogin, startGuestSession, commitNickname,
  hydrateWalletSessionFromServer, getDevCreditsMigrationKey, applyDevProfileStartPosition,
  initializeDevProfileState, switchDevProfile, resetDevTestingEnvironment,
  hydratePlayerSaveFromServer, pushPlayerSaveToServer, schedulePlayerSaveSync,
} = gameSessionCoordinator;

const {
  beginHydration: beginPlayerSaveHydration, blockBaseline: blockPlayerSaveBaseline,
  flushOnExit: flushPlayerSaveOnExit, hasConfirmedBaseline: hasConfirmedPlayerSaveBaseline,
  loadActiveLocalProfileState, resetProtectionState: resetPlayerSaveProtectionState,
  saveActiveLocalProfileState,
} = playerSaveCoordinator;

({ overlay: mansionSleepOverlay, dialog: mansionSleepDialog } = createMansionSleepDialogUi({
  uiLayer,
  onClose: () => closeMansionSleepDialog(),
  onConfirm: () => confirmMansionSleepLogout(),
}));

({
  wastelandClaimConfirmOverlay,
  wastelandClaimConfirmDialog,
  wastelandClaimConfirmBody,
} = createWastelandClaimConfirmDialogUi({
  uiLayer,
  onClose: () => wasteland.closeClaimConfirmDialog(),
  onConfirm: () => wasteland.commitDraft(),
}));

({
  wastelandClaimCancelOverlay,
  wastelandClaimCancelDialog,
} = createWastelandClaimCancelDialogUi({
  uiLayer,
  onClose: () => wasteland.closeClaimCancelDialog(),
  onConfirm: () => wasteland.cancelClaim(),
}));

bindGameSessionIntegration({
  eventTarget: window, nftCloseButton: nftBoardCloseBtn, nftOverlay: nftBoardOverlay,
  closeNftSelection: closeNftBoardSelectionOverlay, isNftSelectionOpen: () => nftExhibitController.isOpen(),
  getInputKey: getLogicalInputKey, isQuickUseAssigning: () => Boolean(quickUseAssignState),
  quickUseAllowedKeys: QUICK_USE_ALLOWED_KEYS,
  setQuickUseAssignmentConsumedUntil: (value) => { quickUseAssignmentConsumedUntil = value; },
  cancelQuickUseAssignment: () => cancelQuickUseAssignment(),
  commitQuickUseAssignment: (key) => commitQuickUseAssignment(key),
  now: () => performance.now(), walletSessionUi,
  walletEvents: { onConnect: connectWalletLogin, onGuest: startGuestSession, onDevBypass: initializeDevProfileState,
    onSwitchDevProfile: switchDevProfile, canResetDev: isDevSession, onResetDev: resetDevTestingEnvironment,
    onNicknameSave: commitNickname, onLogout: handleWalletLogout },
});

const {
  window: questWin,
  header: questHeader,
  archiveToggleButton: questArchiveToggleBtn,
  title: questTitle,
  description: questDesc,
  stepList: questStepList,
  footer: questFooter,
} = createQuestWindowUi({ uiLayer });

const { mapFade, pollutionOverlay } = createMapEffectOverlays({ uiLayer });

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
  bindEvents: bindInventoryWindowEvents,
} = createInventoryWindowUi({
  uiLayer,
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

let inventoryPresentationController = null;
let inventoryFacade = null;
let playerProfileStateCoordinator = null;
let sharedWorldStateCoordinator = null;
let devTestEnvironmentCoordinator = null;

function disposeObject3D(root) {
  return inventoryPresentationController.disposeObject(root);
}

function createItemVisualElement(itemId, options = {}) {
  return inventoryPresentationController.createItemVisual(itemId, options);
}

function createInventoryEntryVisualElement(entry, options = {}) {
  return inventoryPresentationController.createEntryVisual(entry, options);
}

function createForgeUpgradeVisualElement(itemId, level, size = 54) {
  return inventoryPresentationController.createForgeUpgradeVisual(itemId, level, size);
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
let questUiController = null;
function setQuestOpen(v) {
  if (v && frontierParcelCoordinator?.isBuildOpen()) {
    setFrontierBuildOpen(false);
  }
  questOpen = v;
  questWin.style.display = questOpen ? "block" : "none";
  if (questOpen) questUiController?.render();
}

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
  if (nftExhibitController.isOpen()) return;
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
  gameHudController.showTooltip(data, clientX, clientY);
}

function hideItemTooltip() {
  gameHudController.hideTooltip();
}


let hudTimer = null;

function showUI(text, ms = 900) {
  gameHudController.showMessage(text, ms);
}

function hideUI() {
  gameHudController.hideMessage();
}

let mapArrivalTimer = null;

function showMapArrivalBanner(mapName, ms = 1800) {
  gameHudController.showMapArrival(mapName, ms);
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

const { npcDialog, npcDialogText, tutorialNpcNameTag, playerNameTag } = createGameHudOverlays({ uiLayer });
const gameHudController = createGameHudController({
  Vector3: THREE.Vector3,
  MathUtils: THREE.MathUtils,
  dialog: npcDialog,
  dialogText: npcDialogText,
  tooltip: { element: itemTooltip, title: itemTooltipTitle, body: itemTooltipBody },
  npcNameTag: tutorialNpcNameTag,
  playerNameTag,
  showMessageUi: (text) => showHudMessageUi(ui, text),
  hideMessageUi: () => hideHudMessageUi(ui),
  showMapArrivalUi: (mapName) => showMapArrivalBannerUi(mapArrivalBanner, mapName),
  hideMapArrivalUi: () => hideMapArrivalBannerUi(mapArrivalBanner),
  getCamera: () => camera,
  getPlayer: () => player,
  getTutorialNpcs: () => tutorialNpcs,
  getActiveNpc: () => activeTutorialNpc,
  canPlayGame,
  hasNickname,
  getNickname: () => walletProfile.nickname,
  airHud: { wrap: airHudWrap, title: airHudTitle, storage: localStorage, storageKey: AIR_HUD_POSITION_KEY, viewport: window },
});

function showNpcDialog(text, ms = 3000) {
  gameHudController.showNpcDialog(text, ms);
}

function updateNpcDialogPosition() {
  gameHudController.updateNpcDialogPosition();
}

function updateTutorialNpcNameTag() {
  gameHudController.updateTutorialNpcNameTag();
}

function updatePlayerNameTag() {
  gameHudController.updatePlayerNameTag();
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
  questUiController.refreshProgress();
}

function archiveQuestStep(stepIndex) {
  questUiController.archiveStep(stepIndex);
}

function renderQuestWindow() {
  questUiController.render();
}

questUiController = createQuestUiController({
  getQuest: () => tutorialQuest,
  isOpen: () => questOpen,
  getCurrentStep: getCurrentQuestStep,
  canArchive: canArchiveTutorialQuestStep,
  getProgress: getTutorialQuestProgressPlan,
  scheduleSave: () => schedulePlayerSaveSync(true),
  notify: (message, duration) => showUI(message, duration),
  renderWindow: renderQuestWindowUi,
  elements: {
    window: questWin,
    header: questHeader,
    archiveToggleButton: questArchiveToggleBtn,
    title: questTitle,
    description: questDesc,
    stepList: questStepList,
    footer: questFooter,
  },
});




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
const ceilingSurfaces = [];
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
let sceneObjectFactory = null;
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
  createRespawnRock: (spawn) => sceneObjectFactory?.createRespawnRockFromSpawn(spawn),
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


// ===== Inventory feature =====
const inventoryFeatureCoordinator = createInventoryFeatureCoordinator({
  THREE,
  currencyName: PLAYER_CURRENCY_NAME,
  itemModelBuilders: {
    buildPickaxeModel,
    buildShovelModel,
    buildSafetyHelmetModel,
    buildBasicShoesModel,
    buildFreshAirCanisterModel,
    buildPurifyPowderModel,
  },
  isTutorialComplete: () => tutorialQuest.completed,
  getQuickUseAssignState: () => quickUseAssignState,
  setQuickUseAssignState: (nextState) => { quickUseAssignState = nextState; },
  onCreditsChanged: () => updateWalletUi(),
  randomRange: randRange,
  inventoryUiController,
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
  isBuildPartItemId: isWastelandBuildPartItemId,
  isFencePlacementMode: () => wastelandController.isFencePlacementMode(),
  getSelectedStructureItemId: () => wastelandController.getSelectedStructureItemId(),
  makeSlot,
  setTabStyles,
  showTooltip: showItemTooltip,
  hideTooltip: hideItemTooltip,
  showMessage: showUI,
  refreshQuestProgress,
  schedulePlayerSave: schedulePlayerSaveSync,
  closeFrontierBuild: () => {
    if (frontierParcelCoordinator?.isBuildOpen()) setFrontierBuildOpen(false);
  },
  useFreshAirCanister,
  toggleFencePlacementMode: () => wasteland.toggleFencePlacementMode(),
  toggleStructurePlacement: (itemId) => toggleWastelandStructurePlacementItem(itemId),
  setLastMessageUntil: (value) => { lastMessageUntil = value; },
  integration: {
    createEquipmentVisuals: createPlayerEquipmentVisuals,
    rigParts: { head, leftArm, leftLegPivot, rightLegPivot },
    equipmentBuilders: { buildSafetyHelmetModel, buildSingleBasicShoeModel, alignWearableOnHead },
    buildShovelModel,
    buildPickaxeModel,
    updateEquipmentVisibility: updatePlayerEquipmentVisualsVisibility,
    createEquipmentPreview: createInventoryEquipmentPreview,
    nftHelmetContract: "0xMockHelmetCollection",
    nftHelmetTokenId: "1",
    isForgeOpen: () => workstationUiController.isForgeOpen(),
    isRefineryOpen: () => workstationUiController.isRefineryOpen(),
    isFrontierBuildVisible: () => frontierParcelCoordinator?.isBuildVisible() ?? false,
    isPersonalStorageOpen: () => inventoryUiController.isPersonalStorageOpen(),
    isInventoryOpen: () => inventoryUiController.isInventoryOpen(),
    renderForgeWindow,
    renderRefineryWindow,
    renderFrontierBuildWindow,
    scheduleSave: schedulePlayerSaveSync,
    bindWindowEvents: bindInventoryWindowEvents,
    onWalletLogout: handleWalletLogout,
    onWalletCopy: () => { void copyWalletAddressToClipboard(); },
    setActiveTab: (tabId) => inventoryGameplayController?.setActiveTab(tabId),
    handleTrashDragOver: (event) => inventoryGameplayController?.handleTrashDragOver(event),
    handleTrashDragLeave: () => inventoryGameplayController?.handleTrashDragLeave(),
    handleTrashDrop: (event) => inventoryGameplayController?.handleTrashDrop(event),
    closeDiscardDialog: () => closeDiscardDialog(),
    commitDiscardDialog: () => commitDiscardDialog(),
    closePersonalStorage: () => setPersonalStorageOpen(false),
    closePersonalStorageTransferDialog: () => closePersonalStorageTransferDialog(),
    commitPersonalStorageTransferDialog: () => commitPersonalStorageTransferDialog(),
  },
  preview: {
    THREE,
    previewCanvasWrap,
    equipmentSlotEls,
    player,
    getPlayerRigParts,
    syncPreviewPlayerPose,
    getSourceParts: () => ({ torso, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot }),
  },
});

const {
  inventory,
  personalStorage,
  itemDefs: ITEM_DEFS,
  runtime: inventoryRuntime,
  facade: initializedInventoryFacade,
  presentationController: initializedInventoryPresentationController,
  gameplayController: initializedInventoryGameplayController,
  integrationController: inventoryIntegrationController,
  equipmentPreview: initializedInventoryEquipmentPreview,
  equipment: {
    equippedPickaxe,
    equippedSafetyHelmet,
    equippedNftHelmet,
    equippedLeftShoe,
    equippedRightShoe,
  },
  getDevMaterialItemIds,
  getDevBulkGrantItemIds,
  createInventoryEntryInstanceId,
  getInventoryStackMax,
  createInventorySlotEntry,
  addInventoryEntry,
  normalizeInventorySlotEntry,
  createEquippedItemRef,
  normalizeEquippedItemRef,
  getInventoryEntryCategory,
  getInventoryEntryEquipSlot,
  getEquippedInventoryEntry,
  getDisplayResolvedInventoryEntry,
  getResolvedPickaxeLevel,
  getEquippedPickaxeLevel,
  getInventoryEntryDisplayName,
  getInventoryEntryDisplayIcon,
  getInventoryEntryTooltipData,
  createQuickUseBinding,
  normalizeQuickUseBinding,
  getQuickUseBinding,
  getQuickUseItemId,
  getQuickUseKeyForItemId,
  pruneQuickUseBindings,
  getCurrentPickaxeStats,
  getEquippedToolId,
  getNextPickaxeUpgrade,
  getForgeTargetItemId,
  getForgeUpgradeState,
  getEquippedMiningPower,
  findInventorySlotIndexByEntry,
  getInventorySlotEntryByEntry,
  clampPlayerCredits,
  grantPlayerCredits,
  canAffordPlayerCredits,
  spendPlayerCredits,
  formatPlayerCreditsLabel,
  isQuestCriticalItemBlockedFromDiscard,
  canDiscardInventoryEntry,
  canMoveInventoryEntryToPersonalStorage,
  findFirstEmptyStorageSlot,
  addEntryToStorage,
  addEntryToInventory,
  moveInventoryEntryToStorage,
  moveStorageEntryToInventory,
  findFirstSlotWithItem,
  getItemCount,
  findFirstEmptySlot,
  addItem,
  consumeItem,
  hasEquippedTool,
  hasItem,
  syncEquippedToolGroupModel,
  refreshEquippedPickaxeModel,
  updateEquippedVisual,
  getEquippedItemRef,
  getEquippedItemForSlot,
  setEquippedItem,
  equipFirstOwnedInventoryItem,
  toggleEquipItem,
  beginQuickUseAssignment,
  cancelQuickUseAssignment,
  clearQuickUseAssignmentForEntry,
  commitQuickUseAssignment,
  unequipSlot,
  resizeEquipmentPreview,
  renderEquipmentPreview,
  renderEquipmentWindow,
} = inventoryFeatureCoordinator;

inventoryFacade = initializedInventoryFacade;
inventoryPresentationController = initializedInventoryPresentationController;
inventoryGameplayController = initializedInventoryGameplayController;
inventoryEquipmentPreview = initializedInventoryEquipmentPreview;

const frontierRuntime = createFrontierRuntime({ clampPlayerCredits });
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
  inventoryIntegrationController.updateInventoryUi();
}

  updateInventoryUI(); // 처음 한번 표시

  invEl.style.zIndex = "999999";


const gameplayHintController = createGameplayHintController(uiLayer);
function showHint(text) { gameplayHintController.show(text); }
function hideHint() { gameplayHintController.hide(); }


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
  isDevSession: () => isDevSession(),
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
  getBuildModeUi: () => ({
    ...wastelandBuildModeUi,
    enterButton: wastelandBuildModeBtn,
  }),
  setActiveCell: (cell) => { activeWastelandCell = cell; },
  getDraftBounds: getWastelandDraftBoundsFromModule,
  validateDraftRectangle: validateWastelandDraftRectangleFromModule,
  getDraftPhaseState: getWastelandDraftPhaseStateFromModule,
  findDraftReservationHit: findWastelandDraftReservationHitFromModule,
  isCellInsideBounds: isCellInsideWastelandBoundsFromModule,
  canBuildOnCell: canBuildOnWastelandCellStateFromModule,
  getBuildOccupancyError: ({ cell, itemId, rotationQuarter, level }) => {
    const foundation = frontierWastelandPlot?.foundations?.find((entry) => (
      entry?.status === "completed"
      && cell.row >= entry.bounds.minRow && cell.row <= entry.bounds.maxRow
      && cell.col >= entry.bounds.minCol && cell.col <= entry.bounds.maxCol
    ));
    const bounds = getWastelandStructureOccupancyBounds({
      type: itemId,
      x: cell?.x,
      y: foundation ? -0.2 : (frontierWastelandPlot?.terrainRuntime?.getSurfaceY?.(cell) ?? getWastelandStructureSurfaceY(cell)),
      z: cell?.z,
      cellSize: cell?.size,
      rotationQuarter,
      level,
    }, getWastelandBuildPartDef);
    if (!bounds) return "";
    const playerBox = getPlayerBox();
    const overlaps = playerBox.max.x > bounds.minX
      && playerBox.min.x < bounds.maxX
      && playerBox.max.y > bounds.minY
      && playerBox.min.y < bounds.maxY
      && playerBox.max.z > bounds.minZ
      && playerBox.min.z < bounds.maxZ;
    return overlaps ? "플레이어가 있는 공간에는 건축할 수 없습니다." : "";
  },
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
  getBuildPartEntries: getWastelandBuildPalettePartDefs,
  isBuildPartItemId: isWastelandBuildPartItemId,
  getBuildModeEligibility: getWastelandBuildModeEligibility,
  getStructureSlotLabel: getWastelandStructureSlotLabel,
  getStructureSurfaceY: (cell) => {
    const foundation = frontierWastelandPlot?.foundations?.find((entry) => (
      entry?.status === "completed"
      && cell.row >= entry.bounds.minRow && cell.row <= entry.bounds.maxRow
      && cell.col >= entry.bounds.minCol && cell.col <= entry.bounds.maxCol
    ));
    if (foundation) return -0.2;
    return frontierWastelandPlot?.terrainRuntime?.getSurfaceY?.(cell)
      ?? getWastelandStructureSurfaceY(cell);
  },
  getStructureRotationQuarter: () => getWastelandStructureRotationQuarter(player.rotation.y),
  getStructurePlacementKey: (cell, slot, rotationQuarter, level = 0) => getWastelandStructurePlacementKey({ cell, slot, rotationQuarter, level }),
  getBuildLevel: () => wastelandController.getBuildLevel?.() ?? 0,
  usesRemoteStructureWorld: () => isServerBackedWalletSession(),
  loadStructureWorld: () => wastelandWorldClient.load(),
  dispatchStructureAction: (request) => wastelandWorldClient.dispatch(request),
  getItemName: (itemId) => ITEM_DEFS[itemId]?.name ?? itemId,
  createStructureMesh: createWastelandStructureMesh,
  createStructurePreviewMesh: createWastelandStructurePreviewMesh,
  createFencePostMesh: createWastelandFencePostMesh,
  createFenceLinkMesh: createWastelandFenceLinkMesh,
  createPreviewCellMesh: createWastelandPreviewCellMesh,
  createFoundationMesh: createWastelandFoundationMesh,
  registerStructureCollider: (mesh) => addCollider(mesh, 1),
  unregisterStructureCollider: (mesh) => {
    const colliderIndex = getTrackedColliderIndex(mesh);
    if (typeof colliderIndex === "number") removeColliderAt(colliderIndex);
  },
  registerStructureInteractable: registerWastelandStructureInteractable,
  unregisterStructureInteractable: unregisterWastelandStructureInteractable,
  registerStructureSurface: (mesh) => groundSurfaces.push(mesh),
  unregisterStructureSurface: removeGroundSurface,
  registerStructureCeiling: (mesh) => ceilingSurfaces.push(mesh),
  unregisterStructureCeiling: removeCeilingSurface,
  registerFoundationSurface: (mesh) => groundSurfaces.push(mesh),
  unregisterFoundationSurface: removeGroundSurface,
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
  getItemCount,
  getCamera: () => camera,
  getCanvas: () => renderer.domElement,
  requestPlayerCollisionRecovery: (options) => playerRuntimeController?.requestCollisionRecovery?.(options),
  enterBuildCamera: (view) => playerGameplayCoordinator.enterBuildCamera(view),
  exitBuildCamera: () => playerGameplayCoordinator.exitBuildCamera(),
});
const { runtime: wastelandRuntime, api: wasteland } = frontierWastelandCoordinator;
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
  ceilingSurfaces,
  footOffset: PLAYER_FOOT_OFFSET,
  playerHeight: PLAYER_COLLIDER_SIZE.y,
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
const isolatedMapZones = [];
let activeMapGate = null;
let currentMapId = "광산";
let lastAnnouncedMapId = currentMapId;
const mapRuntime = createMapRuntime({
  mapGates,
  connectorTunnelZones,
  isolatedMapZones,
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
worldFeatureCoordinator.setMapRuntime(mapRuntime);
let torchEquipped = false;
let playerAirCurrent = AIR_GAUGE_MAX;
let playerAirMax = AIR_GAUGE_MAX;
const mapPurificationProgress = {
  "폐광": 0,
  "개척지": 0,
};
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

function removeCeilingSurface(mesh) {
  const idx = ceilingSurfaces.indexOf(mesh);
  if (idx !== -1) ceilingSurfaces.splice(idx, 1);
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

function registerWastelandStructureInteractable(mesh, structure) {
  if (!mesh || !structure) return null;
  const interactable = {
    obj: mesh,
    board: mesh,
    highlightKind: "none",
    type: "wastelandDoor",
    structureKey: structure.key,
    ownerId: structure.ownerId,
    text: structure.isOpen ? "E : 문 닫기" : "E : 문 열기",
  };
  interactables.push(interactable);
  mesh.userData.wastelandStructureInteractable = interactable;
  return interactable;
}

function unregisterWastelandStructureInteractable(mesh) {
  const interactable = mesh?.userData?.wastelandStructureInteractable;
  if (!interactable) return false;
  const index = interactables.indexOf(interactable);
  if (index !== -1) interactables.splice(index, 1);
  if (activeInteractable === interactable) activeInteractable = null;
  delete mesh.userData.wastelandStructureInteractable;
  return true;
}

const residenceSceneController = createResidenceSceneController({
  getState: () => ({
    mansionOneRoomInstances, scene, interactables, groundSurfaces,
    getTrackedColliderIndex, removeColliderAt, removeInteractableEntry,
    removeGroundSurface, unregisterWalkableSurface, unregisterResidenceMapZone,
    addCollider, registerWalkableSurface, registerResidenceMapZone,
    ensurePlayerNotInsideGeneratedColliders, residenceMapId: RESIDENCE_MAP_ID,
    startFlatY: START_FLAT_Y, mansionRoomInstanceOrigins: MANSION_ONE_ROOM_INSTANCE_ORIGINS,
    mansionOneRoomRoot, mansionOneRoom102Root,
  }),
  setState: (result) => {
    mansionOneRoomRoot = result.mansionOneRoomRoot;
    mansionOneRoom102Root = result.mansionOneRoom102Root;
    mansionOneBedInteractable = result.mansionOneBedInteractable;
    mansionOneStorageInteractable = result.mansionOneStorageInteractable;
    mansionOneExitInteractable = result.mansionOneExitInteractable;
  },
  destroyRoomInstance: destroyMansionRoomInstanceFromModule,
  createRoomInstance: createMansionRoomInstanceFromModule,
});

function destroyMansionRoomInstance(roomKey) {
  residenceSceneController.destroyRoom(roomKey);
}

function createMansionRoomInstance(roomKey) {
  return residenceSceneController.createRoom(roomKey);
}

function applyDevProfileRoleOverrides() {
  if (!isDevSession()) return;
  playerProfileStateCoordinator.ensureDevTestInventory();
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

function normalizeFrontierWalletAddress(rawAddress) {
  return normalizeFrontierWalletAddressFromModule(rawAddress);
}

function getCurrentFrontierWalletAddress() {
  return frontierParcelCoordinator?.getCurrentWallet()
    ?? normalizeFrontierWalletAddress(walletAuth.address);
}

function getDevProfileSaveKey(profileId) {
  return `${DEV_PROFILE_SAVE_PREFIX}${sanitizeDevProfileId(profileId)}`;
}

function grantFrontierShopSellerCredits(walletAddress, amount) {
  return frontierFeatureCoordinator.grantOfflineSellerCredits(walletAddress, amount);
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

const mapEnvironmentController = createMapEnvironmentController({
  getState: () => ({ player, mineGate, campGate, ambientLight, sunLight, torchLight, torchEquipped }),
  MathUtils: THREE.MathUtils,
  createColor: (value) => new THREE.Color(value),
  createVector3: (x, y, z) => new THREE.Vector3(x, y, z),
  scene,
  caveDarkMaterials: caveDarkenableMaterials,
  darkeningEnabled: CAVE_DARKENING_ENABLED,
  fogEnabled: CAVE_FOG_EFFECT_ENABLED,
  worldFogColor: WORLD_FOG_COLOR,
  caveFogColor: CAVE_FOG_COLOR,
  worldFogNear: WORLD_FOG_NEAR,
  worldFogFar: WORLD_FOG_FAR,
});

function updateSceneFogForCurrentMap() {
  mapEnvironmentController.update();
}

function getMapPollutionConfig(mapId = currentMapId) { return worldFeatureCoordinator.survival.getMapPollutionConfig(mapId); }
function isPollutedMap(mapId = currentMapId) { return worldFeatureCoordinator.survival.isPollutedMap(mapId); }
function getMapPurificationValue(mapId = currentMapId) { return worldFeatureCoordinator.survival.getMapPurificationValue(mapId); }
function setMapPurificationValue(mapId, value) { return worldFeatureCoordinator.survival.setMapPurificationValue(mapId, value); }
function resetAllMapPurificationValues() { return worldFeatureCoordinator.survival.resetAllMapPurificationValues(); }
function getCurrentAirDrainPerSecond() { return worldFeatureCoordinator.survival.getCurrentAirDrainPerSecond(); }
function canRecoverAirInMap(mapId = currentMapId) { return worldFeatureCoordinator.survival.canRecoverAirInMap(mapId); }
function updateAirHud() { return worldFeatureCoordinator.survival.updateAirHud(); }
function buildCavePollutionField() { return worldFeatureCoordinator.survival.buildCavePollutionField(); }
function updateCavePollutionVisuals(dt) { return worldFeatureCoordinator.survival.updateCavePollutionVisuals(dt); }
function useFreshAirCanister() { return worldFeatureCoordinator.survival.useFreshAirCanister(); }
function useQuickUseItem(key) { return worldFeatureCoordinator.survival.useQuickUseItem(key, getQuickUseItemId); }
function getDefaultRefineryRecipe() { return worldFeatureCoordinator.survival.getDefaultRefineryRecipe(); }
function getRefineryRecipeEntries() { return worldFeatureCoordinator.survival.getRefineryRecipeEntries(); }
function getSelectedRefineryRecipe() { return worldFeatureCoordinator.survival.getSelectedRefineryRecipe(); }
function getRefineryHintText() { return worldFeatureCoordinator.survival.getRefineryHintText(); }
function tryUseRefineryRecipe(recipe = getSelectedRefineryRecipe()) { return worldFeatureCoordinator.survival.tryUseRefineryRecipe(recipe); }
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

function registerMapGate(entry) { return worldFeatureCoordinator.map.registerGate(entry); }

function registerConnectorTunnelZone(centerX, minZ, maxZ, halfWidth = 7.2) {
  return worldFeatureCoordinator.map.registerConnectorTunnel(centerX, minZ, maxZ, halfWidth);
}

function findTriggeredMapGate() { return worldFeatureCoordinator.map.findTriggeredGate(); }

function canUseMapGate(gate) {
  if (!gate) return false;
  if (typeof gate.require === "function") {
    return gate.require();
  }
  return true;
}

function updateCurrentMapFromPlayerPosition() { return worldFeatureCoordinator.map.updateCurrentMap(); }

function isPlayerInConnectorTunnel() { return worldFeatureCoordinator.map.isInConnectorTunnel(); }

function getEffectiveAirMapId() { return worldFeatureCoordinator.map.getEffectiveAirMapId(); }

function isPlayerInsideFrontierParcel(parcelLabel) {
  const parcel = frontierParcelDefs.find((entry) => entry.label === parcelLabel);
  if (!parcel || currentMapId !== "개척지") return false;
  return (
    Math.abs(player.position.x - parcel.x) <= parcel.width * 0.5 &&
    Math.abs(player.position.z - parcel.z) <= parcel.height * 0.5
  );
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

const mapGateProgressionCoordinator = createMapGateProgressionCoordinator({
  getInventory: () => inventory, hasItem, consumeItem,
  getColliderIndex: getTrackedColliderIndex, removeCollider: removeColliderAt, addCollider,
  addToScene: (object) => scene.add(object), updateInventoryUi: updateInventoryUI,
  renderQuestIfOpen: () => { if (questOpen) renderQuestWindow(); },
  scheduleSave: () => schedulePlayerSaveSync(true), showUi: showUI,
  setLastMessageUntil: (value) => { lastMessageUntil = value; }, now: () => performance.now(),
});

function tryUnlockMapGate(gate) { return mapGateProgressionCoordinator.unlock(gate); }
function restoreLockedMapGate(gate) { return mapGateProgressionCoordinator.restore(gate); }

function getForgeDistance() {
  if (!forgeStation?.parent) return Infinity;
  return forgeStation.position.distanceTo(player.position);
}

frontierFeatureCoordinator = createFrontierFeatureCoordinator({
  getWalletAddress: () => walletAuth.address,
  clampCredits: clampPlayerCredits,
  grantCredits: grantPlayerCredits,
  devProfileIds: DEV_PROFILE_IDS,
  getDevProfileSaveKey,
  createDefaultPlayerSave,
  storage: localStorage,
  normalizeBuildStateOptions: () => ({
    parcelLabels: FRONTIER_PARCEL_LABELS,
    normalizeInventorySlotEntry,
    getInventoryEntryDisplayName,
    itemDefs: ITEM_DEFS,
    clampPlayerCredits,
  }),
});

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
frontierFeatureCoordinator.setParcelCoordinator(frontierParcelCoordinator);


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

// ===== Nature: Trees & Rocks =====
function randRange(min, max) {
  return min + Math.random() * (max - min);
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

const worldRuntimeIntegration = createWorldRuntimeIntegration({
  sceneFactoryOptions: {
  scene, groundSurfaces, interactables, addCollider, registerWalkableSurface, registerConnectorTunnelZone,
  registerTutorialNpc, registerHarvestTree: (tree) => playerGameplayCoordinator.registerHarvestTree(tree),
  registerMineRock: (rock) => playerGameplayCoordinator.registerMineRock(rock), registerCaveDarkMaterial,
  setNftScreenMaterial: (material) => nftExhibitController.setScreenMaterial(material),
  refreshNftExhibitBoard, scheduleNftExhibitBoardRefresh,
  buildPickaxeModel, buildShovelModel, buildSafetyHelmetModel, buildBasicShoesModel, buildPurifyPowderModel,
  getRockDefaultResourceCount, getRockSizeDefById, rockSizeDefs: ROCK_SIZE_DEFS,
  findMineRockSpawnPosition: findRockSpawnPosition, findCaveRockSpawnPosition: findCampStoneSpawnPosition,
  randomRange: randRange,
  startZone: { wallOn: START_WALL_ON, wallVisible: START_WALL_VISIBLE, openRatio: START_RING_OPEN_RATIO, openCenter: START_RING_OPEN_CENTER, radius: START_RADIUS, thickness: START_RING_THICKNESS, height: START_RING_HEIGHT, x: START_X, z: START_Z },
  startFlatY: START_FLAT_Y,
  },
  createWorldBootstrapOptions: (sceneObjectFactory) => {
    const {
      buildStartZoneWall, buildStartStall, makeTree, makeRock, makePickaxe, makeShovel, makeSafetyHelmet, makeBasicShoes,
      makeSign, makeTutorialNpc, buildForgeAnvil, buildNftExhibitBoard, buildAirPurifierStation, buildRefineryStation,
      buildTunnelFence, buildMapConnectorTunnel,
    } = sceneObjectFactory;
    return {
      scene, groundSurfaces, interactables, addCollider, registerWalkableSurface, registerSupportSurface,
      registerCaveDarkMaterial, registerResidenceMapZone, registerMapGate, makeTree, makeRock, makePickaxe,
      makeSafetyHelmet, makeBasicShoes, makeShovel, makeTutorialNpc, makeSign, buildStartZoneWall, buildStartStall,
      buildMinePerimeterCliffs, buildForgeAnvil, buildRefineryStation, buildNftExhibitBoard, buildFreshAirCanisterModel,
      buildAirPurifierStation, buildTravelGate, buildCampTestArea, buildCavePollutionField, buildMapConnectorTunnel,
      buildTunnelFence, buildFrontierArea: buildFrontierAreaFromMaps, buildFrontierBuildingSign,
      rebuildFrontierParcelConstructionVisual, renderResidenceNoticeBoard, registerPickupItem, restPropOnSupport,
      enableDynamicProp, createTreeSpawnPositions, createRockSpawnPlans, findRockSpawnPosition, findCampStoneSpawnPosition,
      getCaveMasonryRockOptions, randomRange: randRange, rockCount: ROCK_COUNT, caveStoneCount: CAVE_STONE_COUNT,
      rockSizeDefs: ROCK_SIZE_DEFS, groundSize: GROUND_SIZE, frontierGroundSize: FRONTIER_GROUND_SIZE,
      startX: START_X, startZ: START_Z, startFlatY: START_FLAT_Y, campMapX: CAMP_MAP_X, campMapZ: CAMP_MAP_Z,
      frontierMapX: FRONTIER_MAP_X, frontierMapZ: FRONTIER_MAP_Z,
      frontierParcelBorderColor: FRONTIER_PARCEL_BORDER_COLOR, residenceNoticeBoardVisuals, inventory,
    };
  },
});
const {
  sceneObjectFactory: initializedSceneObjectFactory,
  factory: worldFactory,
  state: bootstrappedWorldState,
} = worldRuntimeIntegration;
sceneObjectFactory = initializedSceneObjectFactory;
const {
  buildStartZoneWall, buildStartStall, makeTree, makeRock, makePickaxe, makeShovel, makeSafetyHelmet, makeBasicShoes,
  makeSign, makeTutorialNpc, buildForgeAnvil, buildNftExhibitBoard, buildAirPurifierStation, buildRefineryStation,
  buildTunnelFence, buildMapConnectorTunnel,
} = worldFactory;

({
  forgeStation,
  refineryStation,
  airPurifierStation,
  mineGate,
  campGate,
  frontierCampGate,
  frontierGate,
  frontierParcelDefs,
  frontierParcelConstructionRoots,
  frontierParcelConstructionGroups,
  frontierParcelConstructionColliders,
  frontierAirPurifierStation,
  frontierWastelandPlot,
  mansionOneEntranceInteractable,
  mansionOneExteriorReturn,
  mansionOneRoomRoot,
  mansionOneRoom102Root,
} = bootstrappedWorldState);
const { abandonedMineGate } = bootstrappedWorldState;
mansionOneRoomInstances["101"] = bootstrappedWorldState.mansionOneRoomInstances["101"];
mansionOneRoomInstances["102"] = bootstrappedWorldState.mansionOneRoomInstances["102"];

terrainLabMap = createDeformableTerrainMap({
  scene,
  registerWalkableSurface,
  registerGroundSurface: (surface) => groundSurfaces.push(surface),
  registerIsolatedMapZone: (zone) => mapRuntime.registerIsolatedMapZone(zone),
});
terrainDiggingController = createTerrainDiggingController({
  terrainMap: terrainLabMap,
  getCurrentMapId: () => currentMapId,
  getPlayer: () => player,
  getEquippedToolId: () => getEquippedItemForSlot("tool"),
});

function syncTerrainLabPlayerPosition(position) {
  player.position.set(position.x, position.y, position.z);
  player.rotation.y = position.rotationY;
  clearGameplayKeys();
  updateCurrentMapFromPlayerPosition();
  updateSceneFogForCurrentMap();
  snapCameraToPlayer();
}

function enterTerrainLab() {
  if (!isDevSession() || !terrainLabMap) return false;
  syncTerrainLabPlayerPosition(terrainLabMap.spawn);
  return true;
}

function leaveTerrainLab() {
  syncTerrainLabPlayerPosition({
    x: START_X,
    y: START_FLAT_Y,
    z: START_Z,
    rotationY: Math.PI,
  });
  return true;
}

devTerrainLabController = createDevTerrainLabController({
  parent: walletSessionUi.devProfileSwitcher,
  isDevSession,
  enter: enterTerrainLab,
  leave: leaveTerrainLab,
  reset: () => terrainDiggingController?.reset(),
});

sharedWorldStateCoordinator = createSharedWorldStateCoordinator({
  storage: localStorage,
  storageKey: DEV_SHARED_WORLD_KEY,
  inventory,
  mapPollutionConfig: MAP_POLLUTION_CONFIG,
  isDevSession,
  createDefaultFrontierBuildState,
  normalizeFrontierBuildState,
  normalizeNftBoardSelection,
  createDefaultResidenceNoticeBoardState,
  normalizeResidenceNoticeBoardState,
  normalizeFrontierWastelandState: normalizeFrontierWastelandStateFromModule,
  getFrontierBuildState: () => frontierBuildState,
  setFrontierBuildState: (state) => { frontierBuildState = state; },
  getMapPurificationValue,
  setMapPurificationValue,
  getSelectedNftBoardItem: () => nftExhibitController.getSelectedItem(),
  setSelectedNftBoardItem: (item) => nftExhibitController.setSelectedItem(item),
  getResidenceNoticeBoardState: () => residenceNoticeBoardState,
  setResidenceNoticeBoardState: (state) => { residenceNoticeBoardState = state; },
  serializeFrontierWastelandState: wasteland.serializeState,
  applyFrontierWastelandState: wasteland.applyState,
  getAbandonedMineGate: () => abandonedMineGate,
  getTrackedColliderIndex,
  removeColliderAt,
  restoreLockedMapGate,
  rebuildAllFrontierConstructionVisuals,
  renderResidenceNoticeBoards,
  scheduleNftExhibitBoardRefresh,
});

playerProfileStateCoordinator = createPlayerProfileStateCoordinator({
  playerSaveVersion: PLAYER_SAVE_VERSION,
  startPosition: { x: START_X, z: START_Z },
  airGaugeMax: AIR_GAUGE_MAX,
  inventoryStackLimit: INVENTORY_STACK_LIMIT,
  quickUseAllowedKeys: QUICK_USE_ALLOWED_KEYS,
  frontierParcelLabels: FRONTIER_PARCEL_LABELS,
  devPresetEnabled: DEV_PRESET_ENABLED,
  devPreset: DEV_PRESET,
  devMockNftItems: DEV_MOCK_NFT_ITEMS,
  residenceMapId: RESIDENCE_MAP_ID,
  validMapIds: ["광산", "폐광", "개척지", RESIDENCE_MAP_ID],
  mapPollutionMapIds: Object.keys(MAP_POLLUTION_CONFIG),
  inventory,
  personalStorage,
  tutorialQuest,
  getPlayer: () => player,
  getActiveProfileId: () => activeDevProfileId,
  getInventorySlotCount: (profileId) => (
    DEV_PROFILE_IDS.includes(profileId)
      ? DEVELOPER_INVENTORY_SLOT_COUNT_FROM_MODULE
      : PLAYER_INVENTORY_SLOT_COUNT_FROM_MODULE
  ),
  getDevProfileBaselineState: (profileId) => (
    devTestEnvironmentCoordinator.createProfileBaselineState(profileId)
  ),
  getWastelandLandDeedEntries: wasteland.getLandDeedEntries,
  restorePreservedWastelandLandDeeds: wasteland.restorePreservedLandDeeds,
  getWastelandBuildPartItemIds: () => getWastelandBuildPalettePartDefs().map((part) => part.itemId),
  getDevBulkGrantItemIds,
  getFrontierParcelAuthorityItemId,
  addItem,
  addInventoryEntry,
  removeAllItemsById,
  ensureExactOwnedItemCount,
  equipFirstOwnedItem: equipFirstOwnedInventoryItem,
  clampPickaxeLevel: (level) => clampPickaxeLevel(level, PICKAXE_UPGRADE_LEVELS),
  setPlayerCredits,
  getPlayerCredits,
  clampPlayerCredits,
  setAirState: (state) => survivalWorkstationCoordinator.setAirState(state),
  getAirState: () => ({ current: playerAirCurrent, max: playerAirMax }),
  resetMapPurificationValues: resetAllMapPurificationValues,
  getMapPurificationValue,
  setMapPurificationValue,
  normalizeInventorySlotEntry,
  normalizeQuickUseBinding,
  normalizeEquippedItemRef,
  normalizeFrontierBuildState,
  normalizeNftBoardSelection,
  pruneQuickUseBindings,
  getFrontierBuildStateData: () => frontierBuildState,
  setFrontierBuildState: (state) => { frontierBuildState = state; },
  createDefaultFrontierBuildState,
  getSelectedNftBoardItem: () => nftExhibitController.getSelectedItem(),
  setSelectedNftBoardItem: (item) => nftExhibitController.setSelectedItem(item),
  getAbandonedMineGate: () => abandonedMineGate,
  getTrackedColliderIndex,
  removeColliderAt,
  restoreLockedMapGate,
  getCurrentMapId: () => currentMapId,
  setCurrentMapId: (mapId) => { currentMapId = mapId; },
  getMansionActiveRoomKey: () => mansionOneActiveRoomKey,
  setMansionActiveRoomKey: (roomKey) => { mansionOneActiveRoomKey = roomKey; },
  createMansionRoomInstance,
  destroyMansionRoomInstance,
  updateSceneFogForCurrentMap,
  updateLatestMoveDirection: (rotationY) => latestMoveDir.copy(getFacingDirectionFromYaw(rotationY)),
  snapCameraToPlayer,
  getCampSpawn: () => ({ x: campGate.position.x, z: campGate.position.z - 2.45, rotationY: Math.PI }),
  setPersonalStorageOpen,
  updateInventoryUi: updateInventoryUI,
  rebuildAllFrontierConstructionVisuals,
  scheduleNftExhibitBoardRefresh,
  refreshQuestProgress,
  renderQuestIfOpen: () => { if (questOpen) renderQuestWindow(); },
  setLastSnapshot: (snapshot) => { playerSaveRuntime.lastSnapshot = snapshot; },
});

devTestEnvironmentCoordinator = createDevTestEnvironmentCoordinator({
  profileIds: DEV_PROFILE_IDS,
  storage: localStorage,
  sanitizeProfileId: sanitizeDevProfileId,
  getInventorySlotCount: (profileId) => (
    DEV_PROFILE_IDS.includes(profileId)
      ? DEVELOPER_INVENTORY_SLOT_COUNT_FROM_MODULE
      : PLAYER_INVENTORY_SLOT_COUNT_FROM_MODULE
  ),
  createDefaultPlayerSave: () => playerProfileStateCoordinator.createDefaultPlayerSave(),
  serializeActiveProfileState: () => playerProfileStateCoordinator.serializePlayerSave(),
  applyActiveProfileState: (save, options) => (
    playerProfileStateCoordinator.applySerializedPlayerSave(save, options)
  ),
  saveActiveProfileState: saveActiveLocalProfileState,
  getProfileSaveKey: getDevProfileSaveKey,
  getCreditsMigrationKey: getDevCreditsMigrationKey,
  getInventorySeedKey: (profileId) => (
    `${DEV_INVENTORY_SEED_PREFIX}${sanitizeDevProfileId(profileId)}`
  ),
  getProfileStartPosition: (profileId) => sessionController.getDevProfileStartPosition(profileId),
  startY: START_FLAT_Y,
  airGaugeMax: AIR_GAUGE_MAX,
  landDeedItemId: WASTELAND_LAND_DEED_ITEM_ID,
  inventoryStackLimit: INVENTORY_STACK_LIMIT,
  wastelandBuildPartItemIds: getWastelandBuildPalettePartDefs().map((part) => part.itemId),
  devBulkGrantItemIds: getDevBulkGrantItemIds(),
  frontierParcelLabels: FRONTIER_PARCEL_LABELS,
  getFrontierParcelAuthorityItemId,
  devMockNftItems: DEV_MOCK_NFT_ITEMS,
  createInventorySlotEntry,
  createEquippedItemRef,
});

function applyDevPreset() {
  return playerProfileStateCoordinator.applyDevPreset();
}

function applyFreshPlayerStartState() {
  return playerProfileStateCoordinator.applyFreshPlayerStartState();
}

function createDefaultPlayerSave() {
  return playerProfileStateCoordinator.createDefaultPlayerSave();
}

function serializePlayerSave() {
  return playerProfileStateCoordinator?.serializePlayerSave() ?? null;
}

function applySerializedPlayerSave(rawSave, { preserveSharedWorld = false } = {}) {
  return playerProfileStateCoordinator.applySerializedPlayerSave(rawSave, { preserveSharedWorld });
}

applyDevPreset();


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

// Road
const road = new THREE.Mesh(
  new THREE.BoxGeometry(60, 0.1, 6),
  new THREE.MeshStandardMaterial({ color: 0x6c757d })
);
road.position.set(0, 0.05, 0);
// scene.add(road);

// Collision helpers
function getPlayerBox() {
  return getPlayerBoxFromPosition(player.position);
}

function isPlayerRecoveryPositionSafe(position, mapId = currentMapId) {
  const surfaces = walkableMapSurfaces.get(mapId) ?? [];
  const defaultBounds = {
    minX: -GROUND_SIZE * 0.5 + 1.4,
    maxX: GROUND_SIZE * 0.5 - 1.4,
    minZ: -GROUND_SIZE * 0.5 + 1.4,
    maxZ: GROUND_SIZE * 0.5 - 1.4,
  };
  const bounds = getCurrentMapBoundsFromSurfaces(surfaces, defaultBounds);
  if (!isInsideMapBoundsFromSurfaces(position.x, position.z, surfaces, bounds)) return false;
  const candidateBox = getPlayerBoxFromPosition(new THREE.Vector3(position.x, position.y, position.z));
  return getPlayerColliderPenetrationDepth(candidateBox, colliderBoxes) <= 0.0001;
}

function findNearestSafePlayerPosition({ mapId = currentMapId, origin }) {
  const source = origin ?? player.position;
  const directions = [
    [1, 0], [0, 1], [-1, 0], [0, -1],
    [0.707, 0.707], [-0.707, 0.707], [-0.707, -0.707], [0.707, -0.707],
  ];
  for (const radius of [0.55, 1.1, 1.7, 2.4, 3.2]) {
    for (const [dx, dz] of directions) {
      const candidate = {
        x: source.x + dx * radius,
        y: source.y,
        z: source.z + dz * radius,
        rotationY: source.rotationY ?? player.rotation.y,
      };
      if (isPlayerRecoveryPositionSafe(candidate, mapId)) return candidate;
    }
  }
  return null;
}

function getCurrentMapSafeFallback(mapId = currentMapId) {
  if (mapId === TERRAIN_LAB_MAP_ID && terrainLabMap?.spawn) return terrainLabMap.spawn;
  if (mapId === "폐광") return { x: CAMP_MAP_X, y: START_FLAT_Y, z: CAMP_MAP_Z, rotationY: Math.PI };
  if (mapId === "개척지") return { x: FRONTIER_MAP_X, y: START_FLAT_Y, z: FRONTIER_MAP_Z, rotationY: Math.PI };
  if (mapId === "광산") return { x: START_X, y: START_FLAT_Y, z: START_Z, rotationY: 0 };
  return null;
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

  const recovered = playerRuntimeController?.requestCollisionRecovery?.({
    source: "structure-generation",
    immediate: true,
    preferredFallback: fallback,
  });
  if (recovered) return true;

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

// Movement
const clock = new THREE.Clock();
const PICKUP_REACH_DURATION = 0.22;

function triggerMiningSwing(target = null) {
  playerRuntimeController.triggerMiningSwing(target);
}

function triggerPickupReach(target = null) {
  playerRuntimeController.triggerPickupReach(target);
}

const playerInteractionContext = {
  now: () => performance.now(),
  hudMessages: HUD_MSG, quickUseAllowedKeys: QUICK_USE_ALLOWED_KEYS,
  getLogicalInputKey, isTextInputActive, canPlayGame, isWorkUiMovementLocked,
  isNftExhibitSelectionOpen: () => nftExhibitController.isOpen(),
  isQuickUseAssigning: () => Boolean(quickUseAssignState),
  getQuickUseAssignmentConsumedUntil: () => quickUseAssignmentConsumedUntil,
  showUI,
  setLastMessageUntil: (until) => { lastMessageUntil = until; },
  findNearestPickupItem, triggerPickupReach, addInventoryEntry, createInventorySlotEntry,
  addItem, updateInventoryUI, refreshQuestProgress,
  getItemDef: (itemId) => ITEM_DEFS[itemId],
  unregisterDynamicProp, unregisterPickupItem, canUseMapGate, tryUnlockMapGate,
  hasNearbyForgeStation: () => forgeStation?.parent && getForgeDistance() < 2.4,
  getForgeStation: () => forgeStation,
  isForgeOpen: () => workstationUiController.isForgeOpen(),
  setForgeOpen, openNftBoardSelectionOverlay, getFrontierBoothInteractionPlan,
  openFrontierBoothDialog, hasMansionOneResidenceAuthority, getOwnedMansionRoomKey,
  enterMansionOneRoom, exitMansionOneRoom,
  isRefineryOpen: () => workstationUiController.isRefineryOpen(),
  setRefineryOpen, tryUseAirPurifier,
  isDevPresetEnabled: () => DEV_PRESET_ENABLED,
  isTorchEquipped: () => torchEquipped,
  setTorchEquipped: (equipped) => { torchEquipped = equipped; },
  useQuickUseItem, openPersonalStorage, openMansionSleepDialog, getCurrentQuestStep,
  isMineKeyIssued: () => inventory.mineKeyIssued,
  setMineKeyIssued: () => { inventory.mineKeyIssued = true; },
  showNpcDialog, getTutorialNpcLine,
  renderQuestWindowIfOpen: () => { if (questOpen) renderQuestWindow(); },
  getTerrainDigHint: () => terrainDiggingController?.getHint() ?? "",
  tryDigTerrain: () => terrainDiggingController?.dig() ?? null,
  triggerMiningSwing, createTreeHarvestPlan, setHarvestTreeActive, placeWastelandFencePost: wasteland.placeFencePost,
  hasWastelandFencePost: (cell) => frontierWastelandPlot?.fencePosts?.has(`${cell.row}:${cell.col}`),
  placeWastelandStructure: wasteland.placeStructure,
  toggleWastelandDoor: wasteland.toggleDoor,
  hasOwnedTool: (itemId) => findFirstSlotWithItem(itemId) !== -1,
  canClearWastelandCell: wasteland.canClearCell, createWastelandClearPlan: wasteland.createCellClearPlan,
  tryDigWastelandTerrain: () => wasteland.digTerrain({
    x: player.position.x + Math.sin(player.rotation.y) * 1.6,
    z: player.position.z + Math.cos(player.rotation.y) * 1.6,
  }),
  syncWastelandCellState: syncWastelandCellStateFromProgress,
  applyWastelandCellVisual, saveSharedWorldStateToLocal, triggerHitStop,
  triggerRockHitReaction, triggerCameraShake, spawnDustBurst, hidePickupHint,
  getCurrentFrontierParcelLabel,
  setFrontierActiveParcelLabel: (label) => { frontierActiveParcelLabel = label; },
  hasFrontierParcelAuthority,
  isFrontierBuildOpen: () => frontierParcelCoordinator?.isBuildOpen() ?? false,
  setFrontierBuildOpen, findNearestTutorialNpc, findTriggeredMapGate,
  findNearestInteractable: (radius) => findNearestInteractable(interactables, player.position, radius),
  updateInteractableHighlights: (target) => updateInteractableHighlights(interactables, target),
  findNearestHarvestTree, findNearestMineRock, getEquippedPickaxeLevel,
  findActiveFrontierWastelandCell: wasteland.findActiveCell,
  isFencePlacementMode: () => wastelandController.isFencePlacementMode(),
  getSelectedStructureItemId: () => wastelandController.getSelectedStructureItemId(),
  isWastelandBuildModeActive: () => wasteland.isBuildModeActive(),
  exitWastelandBuildMode: () => wasteland.exitBuildMode(),
  rotateWastelandBuildPart: () => wasteland.rotateBuildPart(),
  updateWastelandBuildModeUi: () => wasteland.updateBuildModeUi(),
  getWastelandBuildPartDef, getWastelandBuildCheck: wasteland.getBuildCheck, hasEquippedTool,
  getFrontierWastelandClaimByCell: wasteland.getClaimByCell, getFrontierBuildState,
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
  showHint, hideHint,
  clearWastelandHighlights: () => {
    for (const cell of frontierWastelandPlot?.cells ?? []) clearWastelandCellHighlight(cell);
  },
  applyWastelandCellHighlight, updateWastelandClaimPreview: wasteland.updateClaimPreview,
  updateWastelandHud: () => {
    wasteland.expireDrafts();
    wasteland.expireClaims();
    const progress = wasteland.getCurrentClaimProgress();
    updateWastelandHudUi(wastelandHudWrap, wastelandHudValue, wastelandHudBarFill, wastelandHudStatus, {
      visible: wasteland.shouldShowHud(),
      completed: progress?.completed ?? 0,
      total: progress?.total ?? 0,
      percent: progress?.percent ?? 0,
      statusText: progress?.claim ? wasteland.getClaimHudStatusText(progress) : "",
    });
    updateWastelandFenceHudUi(wastelandFenceHudWrap, wastelandFenceHudValue, wastelandFenceHudMeta, wastelandFenceHudStatus, wasteland.getFenceHudState());
    wasteland.updateClaimActionUi(progress);
    wasteland.updateBuildModeUi();
  },
  updateRockHpBar, hideRockHpBar,
};

playerRuntimeController = createPlayerRuntimeIntegration({
  interaction: playerInteractionContext,
  interactionState: {
    get: () => ({
      activeInteractable, activeForgeStation, activeHarvestTree, activeWastelandCell,
      activeTutorialNpc, activeMapGate, activePickupItem, activeMineRock,
    }),
    set: (state) => {
      ({ activeInteractable, activeForgeStation, activeHarvestTree, activeWastelandCell,
        activeTutorialNpc, activeMapGate, activePickupItem, activeMineRock } = state);
    },
  },
  mining: {
    createPlan: createRockMiningPlan,
    hasEquippedPickaxe: () => hasEquippedTool("pickaxe"),
    getEquippedMiningPower,
    hasOwnedPickaxe: () => findFirstSlotWithItem("pickaxe") !== -1,
    getEquippedPickaxeLevel,
    spawnBreakBurst: spawnRockBreakBurst,
    incrementTutorialRockCount: () => { tutorialQuest.minedRockCount += 1; },
    addItem,
    random: Math.random,
    getBonusDropChance: () => getCurrentPickaxeStats().bonusDropChance,
    notify: (message, duration) => { showUI(message, duration); lastMessageUntil = performance.now() + duration; },
    getItemName: (itemId) => ITEM_DEFS[itemId]?.name,
    updateInventoryUi: updateInventoryUI,
    refreshQuestProgress,
    removeCollider: removeColliderAt,
    unregisterRock: unregisterMineRock,
    scheduleRespawn: scheduleRockRespawn,
  },
  platform: {
    eventTarget: window,
    inputElement: renderer.domElement,
    requestFrame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (requestId) => cancelAnimationFrame(requestId),
    clock,
  },
  gameplayCoordinator: playerGameplayCoordinator,
  input: {
    canPlayGame,
    isWorkUiMovementLocked,
    isNftExhibitOpen: () => nftExhibitController.isOpen(),
    isQuickUseAssigning: () => Boolean(quickUseAssignState),
    isSleeping: () => workstationUiController.isSleepOpen(),
    isClaimDialogOpen: () => wastelandController.isClaimCancelOpen() || wastelandController.isClaimConfirmOpen(),
    isPersonalStorageOpen: () => inventoryUiController.isPersonalStorageOpen(),
    getLogicalInputKey,
    shiftCameraSensitivity: SHIFT_CAMERA_ROTATE_SENSITIVITY,
  },
  movement: {
    player,
    camera,
    controls,
    rig: { torso, head, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot },
    latestMoveDirection: latestMoveDir,
    startRing: {
      startWallOn: START_WALL_ON,
      startX: START_X,
      startZ: START_Z,
      startRadius: START_RADIUS,
      startRingThickness: START_RING_THICKNESS,
      openCenter: START_RING_OPEN_CENTER,
      openRatio: START_RING_OPEN_RATIO,
    },
    startHardClamp: START_HARD_CLAMP,
    getWalkableSurfaces: () => walkableMapSurfaces.get(currentMapId) ?? [],
    defaultMapBounds: {
      minX: -GROUND_SIZE * 0.5 + 1.4,
      maxX: GROUND_SIZE * 0.5 - 1.4,
      minZ: -GROUND_SIZE * 0.5 + 1.4,
      maxZ: GROUND_SIZE * 0.5 - 1.4,
    },
    colliderBoxes,
    getPlayerBox,
    getColliderPenetration: () => getPlayerColliderPenetrationDepth(getPlayerBox(), colliderBoxes),
    resolvePlayerPenetration: () => resolvePlayerColliderPenetration({
      position: player.position,
      getPlayerBox,
      colliderBoxes,
    }),
    getCurrentMapId: () => currentMapId,
    isSafePosition: isPlayerRecoveryPositionSafe,
    findNearestSafePosition: findNearestSafePlayerPosition,
    getSafePositionFallback: getCurrentMapSafeFallback,
    onPlayerCollisionRecovery: ({ source } = {}) => {
      snapCameraToPlayer();
      latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
      const message = source === "build"
        ? "건축물 충돌로 안전한 위치로 복구했습니다."
        : "벽 충돌로 안전한 위치로 복구했습니다.";
      showUI(message, 1200);
      lastMessageUntil = performance.now() + 1200;
    },
    pickupReachDuration: PICKUP_REACH_DURATION,
    getSwingDuration: () => getCurrentPickaxeStats().swingDuration,
    canPlayGame,
    isWorkUiMovementLocked,
    isSleeping: () => workstationUiController.isSleepOpen() || workstationUiController.isSleepPoseActive(),
    isDevSession,
    hasShoesEquipped: () => getEquippedItemForSlot("shoes") === "basicShoes",
    getAirMoveScalar: () => (
      isPollutedMap(currentMapId) && getMapPurificationValue(currentMapId) < 100 && playerAirCurrent <= 0 ? 0.12 : 1
    ),
    updatePlayerGroundY,
    now: () => performance.now(),
  },
  frame: {
    updateForgeUpgradeState: () => survivalWorkstationCoordinator.updateForgeUpgradeState(),
    updateCurrentMapFromPlayerPosition,
    updateSceneFogForCurrentMap,
    schedulePlayerSaveSync: () => {
      if (currentMapId !== TERRAIN_LAB_MAP_ID) schedulePlayerSaveSync();
    },
    getCurrentMapId: () => currentMapId,
    getLastAnnouncedMapId: () => lastAnnouncedMapId,
    setLastAnnouncedMapId: (mapId) => { lastAnnouncedMapId = mapId; },
    showMapArrivalBanner,
    updateDynamicProps,
    updateAirSystem,
    updateCavePollutionVisuals,
    isInventoryOpen: () => inventoryUiController.isInventoryOpen(),
    renderEquipmentPreview,
    getCompassDirection,
    latestMoveDirection: latestMoveDir,
    getPlayerYaw: () => player.rotation.y,
    updateCompassFromDirection,
    updateNpcDialogPosition,
    updateTutorialNpcNameTag,
    updatePlayerNameTag,
    isForgeOpen: () => workstationUiController.isForgeOpen(),
    getForgeDistance,
    setForgeOpen,
    isRefineryOpen: () => workstationUiController.isRefineryOpen(),
    getRefineryDistance,
    setRefineryOpen,
    render: () => renderer.render(scene, camera),
  },
});

playerRuntimeController.start();

window.addEventListener("resize", () => {
  const viewportState = createMainCameraViewportState();
  syncMainCameraAspect(camera, viewportState);
  syncMainViewport(renderer, viewportState);
  resizeEquipmentPreview();
});
