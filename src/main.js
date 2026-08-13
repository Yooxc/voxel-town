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
import { createWastelandSceneRuntime } from "./world/wastelandSceneRuntime.js";
import { createFrontierSceneController } from "./world/frontierSceneController.js";
import { renderResidenceNoticeBoardTexture } from "./world/residenceNoticeBoard.js";
import { createAirPurifierModel } from "./world/airPurifierModel.js";
import { createRefineryModel } from "./world/refineryModel.js";
import { createTunnelFenceModel } from "./world/tunnelFenceModel.js";
import { createPollutionField, updatePollutionFieldPositions } from "./world/pollutionField.js";
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
import { createMiningFeedbackRuntime } from "./world/miningFeedback.js";
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
  REFINERY_RECIPES,
  getDefaultRefineryRecipe as getDefaultRefineryRecipeFromModule,
  getRefineryRecipeEntries as getRefineryRecipeEntriesFromModule,
  getSelectedRefineryRecipe as getSelectedRefineryRecipeFromModule,
  getRefineryRecipeDescription as getRefineryRecipeDescriptionFromModule,
  createRefineryCraftPlan as createRefineryCraftPlanFromModule,
} from "./systems/refinery.js";
import {
  createForgeUpgradeAttemptPlan,
  createForgeUpgradeResultPlan,
} from "./systems/forge.js";
import { createWorkstationRuntime } from "./systems/workstationRuntime.js";
import { createWastelandRuntime } from "./systems/wastelandRuntime.js";
import {
  createWastelandDraftGuide,
  createWastelandFenceHudState,
} from "./systems/wastelandDraftGuide.js";
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
import {
  createPlayerSaveExitPlan,
  createPlayerSaveSchedulePlan,
  hydratePlayerSaveRuntime,
  pushPlayerSaveRuntime,
} from "./save/playerSaveSync.js";
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
import { createInventoryRenderer } from "./ui/inventoryRenderer.js";
import { createInteractionController } from "./ui/interactionController.js";
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
  updateWastelandHudUi,
  updateWastelandFenceHudUi,
  createWastelandHudActionButtons,
  createWastelandClaimConfirmDialogUi,
  createWastelandClaimCancelDialogUi,
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
import { findNearestByPosition } from "./core/proximity.js";
import { findNearestInteractable, getInteractableHintText } from "./systems/interactions.js";
import { updateInteractableHighlights } from "./world/interactableHighlights.js";
import {
  createCameraOcclusionState,
  updateThirdPersonCameraOcclusion as updateThirdPersonCameraOcclusionFromModule,
} from "./world/cameraOcclusion.js";
import {
  setHarvestTreeActive as setHarvestTreeActiveFromModule,
  updateHarvestTrees as updateHarvestTreesFromModule,
  updateRockFadeIns as updateRockFadeInsFromModule,
  triggerRockHitReaction as triggerRockHitReactionFromModule,
  updateRockHitReactions as updateRockHitReactionsFromModule,
} from "./world/resourceVisuals.js";
import { createHarvestTreeModel, createMineRockModel } from "./world/resourceModels.js";
import { updatePlayerMovementRuntime } from "./core/playerMovementRuntime.js";
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
import { createResourceWorldRuntime } from "./systems/resourceWorldRuntime.js";
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
  getMapPollutionConfig as getMapPollutionConfigFromModule,
  isPollutedMap as isPollutedMapFromModule,
  getMapPurificationValue as getMapPurificationValueFromModule,
  setMapPurificationValue as setMapPurificationValueFromModule,
  resetAllMapPurificationValues as resetAllMapPurificationValuesFromModule,
  getCurrentAirDrainPerSecond as getCurrentAirDrainPerSecondFromModule,
  canRecoverAirInMap as canRecoverAirInMapFromModule,
  getMapPollutionVisualStrength as getMapPollutionVisualStrengthFromModule,
  getAirOverlayVisualState,
  getAirPurifierHintText as getAirPurifierHintTextFromModule,
  getNextMapPurificationValue,
  updateAirValueForFrame,
} from "./systems/air.js";
import { createAirRuntime } from "./systems/airRuntime.js";
import { createPlayerSaveRuntime } from "./save/playerSaveRuntime.js";
import { createSessionRuntime } from "./auth/sessionRuntime.js";
import { createSessionController } from "./auth/sessionController.js";
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
const wastelandController = createWastelandController();
const wastelandSceneRuntime = createWastelandSceneRuntime();
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
let playerSaveSyncInFlight = null;
let lastPlayerSaveSnapshot = "";
const playerSaveRuntime = createPlayerSaveRuntime();
let lastPlayerSaveAttemptAt = 0;
let playerSaveSyncPaused = false;
let playerSaveStatusTimer = null;
let lastKnownPlayerSaveUpdatedAt = "";
let playerSaveBaselineState = "unknown";
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

const {
  nftBoardOverlay,
  nftBoardCloseBtn,
  nftBoardStatus,
  nftBoardGrid,
} = createNftExhibitUi(uiLayer);

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
  if (frontierBuildOpen) {
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
    frontierBuildOpen ||
    frontierBoothOpen ||
    frontierShopRegisterOpen ||
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
  return sessionRuntime.validateNickname(raw);
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
  playerSaveRuntime.reset();
  lastPlayerSaveSnapshot = "";
  lastKnownPlayerSaveUpdatedAt = "";
  playerSaveBaselineState = "unknown";
}

function beginPlayerSaveHydration() {
  playerSaveRuntime.beginHydration();
  playerSaveSyncPaused = true;
  playerSaveBaselineState = "pending";
  lastPlayerSaveSnapshot = "";
}

function markPlayerSaveBaselineReady(mode = "hydrated") {
  playerSaveRuntime.markBaselineReady(mode);
  playerSaveBaselineState = mode;
}

function blockPlayerSaveBaseline(message = "") {
  playerSaveRuntime.blockBaseline();
  playerSaveBaselineState = "blocked";
  if (message) {
    walletLoginStatus.textContent = message;
    setPlayerSaveStatus("저장 보호 모드", "error", { persist: true });
  }
}

function hasConfirmedPlayerSaveBaseline() {
  return playerSaveRuntime.hasConfirmedBaseline();
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
  nftExhibitOwnedTokensCache = createNftOwnedTokensCache();
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

function getDevProfileStartPosition(profileId = activeDevProfileId) {
  return sessionController.getDevProfileStartPosition(profileId);
}

function applyDevProfileStartPosition(profileId = activeDevProfileId) {
  const start = getDevProfileStartPosition(profileId);
  player.position.set(start.x, player.position.y, start.z);
  player.rotation.y = 0;
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
  snapCameraToPlayer();
}

function initializeDevProfileState(preferredProfileId = "") {
  const initialization = sessionController.getDevProfileInitializationPlan({
    preferredProfileId,
    storedProfileId: localStorage.getItem(DEV_ACTIVE_PROFILE_KEY),
    activeProfileId: activeDevProfileId,
  });
  activeDevProfileId = initialization.profileId;
  resetPlayerSaveProtectionState();
  playerSaveSyncPaused = false;
  setWalletAuthState(
    sessionController.createDevSessionState(
      activeDevProfileId,
      getDevProfileDisplayName,
      new Date().toISOString()
    ),
    { persist: false }
  );
  const sharedWorld = loadSharedWorldStateFromLocal();
  applySharedWorldState(sharedWorld);
  const loadState = loadActiveLocalProfileState();
  if (loadState === "apply_error") {
    applyFreshPlayerStartState();
    applyDevProfileStartPosition(activeDevProfileId);
    applySharedWorldState(sharedWorld);
    applyDevPreset();
    walletLoginStatus.textContent = `${getDevProfileDisplayName(activeDevProfileId)} 저장본 적용 중 오류가 발생해 임시 프리셋으로 입장했습니다.`;
    showUI("개발자 저장본 복원 중 오류가 발생했습니다.", 1300);
    lastMessageUntil = performance.now() + 1300;
  } else if (loadState !== "loaded") {
    applyFreshPlayerStartState();
    applyDevProfileStartPosition(activeDevProfileId);
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
  restoreMissingOwnedWastelandLandDeeds({ saveProfile: true });
  resetWastelandDraftUiState();
  refreshCurrentWastelandDraftUiState();
  saveActiveLocalProfileState();
  localStorage.setItem(initialization.activeProfileKey, activeDevProfileId);
  walletLoginStatus.textContent = `${getDevProfileDisplayName(activeDevProfileId)}로 개발자 모드에 입장했습니다.`;
}

function switchDevProfile(profileId) {
  if (!isDevSession()) return;
  const nextProfileId = sanitizeDevProfileId(profileId);
  if (nextProfileId === activeDevProfileId) return;
  resetWastelandDraftUiState();
  saveActiveLocalProfileState();
  saveSharedWorldStateToLocal();
  localStorage.setItem(DEV_ACTIVE_PROFILE_KEY, nextProfileId);
  initializeDevProfileState(nextProfileId);
  showUI(`${getDevProfileDisplayName(nextProfileId)} 위치를 복원했습니다.`, 900);
  lastMessageUntil = performance.now() + 900;
}

function writeDevProfilePresetSnapshot(profileId) {
  const targetProfileId = sanitizeDevProfileId(profileId);
  activeDevProfileId = targetProfileId;
  setWalletAuthState(
    sessionController.createDevSessionState(
      targetProfileId,
      getDevProfileDisplayName,
      new Date().toISOString()
    ),
    { persist: false }
  );
  applyFreshPlayerStartState();
  applyDevProfileStartPosition(targetProfileId);
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
  resetFrontierWastelandRuntimeState();
  saveSharedWorldStateToLocal();
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

({
  wastelandClaimConfirmOverlay,
  wastelandClaimConfirmDialog,
  wastelandClaimConfirmBody,
} = createWastelandClaimConfirmDialogUi({
  uiLayer,
  onClose: closeWastelandClaimConfirmDialog,
  onConfirm: commitCurrentWastelandDraft,
}));

({
  wastelandClaimCancelOverlay,
  wastelandClaimCancelDialog,
} = createWastelandClaimCancelDialogUi({
  uiLayer,
  onClose: closeWastelandClaimCancelDialog,
  onConfirm: cancelCurrentWastelandClaim,
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
forgeWin.style.width = "min(1056px, calc(100vw - 36px))";
forgeWin.style.height = "min(688px, calc(100vh - 36px))";
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
forgeTitle.textContent = "장비 강화";
forgeTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeTitle.style.fontSize = "20px";
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
forgeBody.style.padding = "14px";
forgeBody.style.display = "grid";
forgeBody.style.gridTemplateColumns = "220px minmax(0, 1fr)";
forgeBody.style.gap = "20px";
forgeBody.style.height = "100%";
forgeBody.style.boxSizing = "border-box";
forgeBody.style.overflow = "hidden";
forgeWin.appendChild(forgeBody);

const forgeListPanel = document.createElement("div");
forgeListPanel.style.display = "flex";
forgeListPanel.style.flexDirection = "column";
forgeListPanel.style.gap = "8px";
forgeBody.appendChild(forgeListPanel);

const forgeListTitle = document.createElement("div");
forgeListTitle.textContent = "강화 목록";
forgeListTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeListTitle.style.fontSize = "12px";
forgeListTitle.style.fontWeight = "800";
forgeListTitle.style.color = "rgba(70,70,70,0.76)";
forgeListPanel.appendChild(forgeListTitle);

const forgeTargetList = document.createElement("div");
forgeTargetList.style.display = "flex";
forgeTargetList.style.flexDirection = "column";
forgeTargetList.style.gap = "8px";
forgeTargetList.style.overflow = "auto";
forgeListPanel.appendChild(forgeTargetList);

const forgeDetailPanel = document.createElement("div");
forgeDetailPanel.style.display = "grid";
forgeDetailPanel.style.gridTemplateRows = "308px 88px 88px 124px";
forgeDetailPanel.style.gap = "12px";
forgeDetailPanel.style.minWidth = "0";
forgeDetailPanel.style.height = "100%";
forgeDetailPanel.style.overflow = "hidden";
forgeBody.appendChild(forgeDetailPanel);

const forgeHero = document.createElement("div");
forgeHero.style.display = "grid";
forgeHero.style.gridTemplateColumns = "210px 1fr 210px";
forgeHero.style.alignItems = "center";
forgeHero.style.gap = "16px";
forgeDetailPanel.appendChild(forgeHero);

const forgeCurrentCard = document.createElement("div");
forgeCurrentCard.style.height = "308px";
forgeCurrentCard.style.borderRadius = "12px";
forgeCurrentCard.style.background = "rgba(255,255,255,0.95)";
forgeCurrentCard.style.border = "1px solid rgba(0,0,0,0.18)";
forgeCurrentCard.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
forgeCurrentCard.style.padding = "16px";
forgeCurrentCard.style.boxSizing = "border-box";
forgeCurrentCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeHero.appendChild(forgeCurrentCard);

const forgeCenterCard = document.createElement("div");
forgeCenterCard.style.height = "224px";
forgeCenterCard.style.borderRadius = "14px";
forgeCenterCard.style.background = "linear-gradient(180deg, rgba(255,194,105,0.22), rgba(255,156,64,0.12))";
forgeCenterCard.style.border = "1px solid rgba(255,162,68,0.38)";
forgeCenterCard.style.boxShadow = "0 0 0 3px rgba(255,186,90,0.14), inset 0 1px 0 rgba(255,255,255,0.7)";
forgeCenterCard.style.display = "flex";
forgeCenterCard.style.flexDirection = "column";
forgeCenterCard.style.alignItems = "center";
forgeCenterCard.style.justifyContent = "center";
forgeCenterCard.style.padding = "8px";
forgeHero.appendChild(forgeCenterCard);

const forgeChanceLabel = document.createElement("div");
forgeChanceLabel.textContent = "강화 실행";
forgeChanceLabel.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeChanceLabel.style.fontSize = "14px";
forgeChanceLabel.style.fontWeight = "700";
forgeChanceLabel.style.color = "rgba(88,66,34,0.76)";
forgeCenterCard.appendChild(forgeChanceLabel);

const forgeChanceValue = document.createElement("button");
forgeChanceValue.type = "button";
forgeChanceValue.style.marginTop = "10px";
forgeChanceValue.style.minWidth = "146px";
forgeChanceValue.style.border = "1px solid rgba(150,90,20,0.35)";
forgeChanceValue.style.borderRadius = "12px";
forgeChanceValue.style.padding = "16px 18px";
forgeChanceValue.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeChanceValue.style.fontSize = "22px";
forgeChanceValue.style.fontWeight = "900";
forgeChanceValue.style.color = "#7a4a12";
forgeChanceValue.style.background = "rgba(255,255,255,0.78)";
forgeChanceValue.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
forgeChanceValue.style.cursor = "pointer";
forgeChanceValue.style.transform = "translateY(0)";
forgeChanceValue.style.transition = "transform 90ms ease, box-shadow 90ms ease, background 90ms ease";
forgeCenterCard.appendChild(forgeChanceValue);

const forgeNextCard = document.createElement("div");
forgeNextCard.style.height = "308px";
forgeNextCard.style.borderRadius = "12px";
forgeNextCard.style.background = "rgba(255,255,255,0.95)";
forgeNextCard.style.border = "1px solid rgba(0,0,0,0.18)";
forgeNextCard.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
forgeNextCard.style.padding = "16px";
forgeNextCard.style.boxSizing = "border-box";
forgeNextCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeHero.appendChild(forgeNextCard);

const forgeStatCompare = document.createElement("div");
forgeStatCompare.style.display = "grid";
forgeStatCompare.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
forgeStatCompare.style.gap = "12px";
forgeDetailPanel.appendChild(forgeStatCompare);

const forgeInfo = document.createElement("div");
forgeInfo.style.display = "grid";
forgeInfo.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
forgeInfo.style.gap = "12px";
forgeDetailPanel.appendChild(forgeInfo);

const forgeNotice = document.createElement("div");
forgeNotice.style.padding = "10px 12px";
forgeNotice.style.borderRadius = "10px";
forgeNotice.style.background = "rgba(255,255,255,0.9)";
forgeNotice.style.border = "1px solid rgba(0,0,0,0.12)";
forgeNotice.style.fontFamily = "system-ui, -apple-system, sans-serif";
forgeNotice.style.fontSize = "13px";
forgeNotice.style.lineHeight = "1.45";
forgeNotice.style.color = "#444";
forgeNotice.style.height = "80px";
forgeNotice.style.boxSizing = "border-box";
forgeDetailPanel.appendChild(forgeNotice);

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
refineryWin.style.width = "min(1056px, calc(100vw - 36px))";
refineryWin.style.height = "min(688px, calc(100vh - 36px))";
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
refineryWin.style.gridTemplateRows = "96px minmax(0, 1fr)";
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
refineryTitle.textContent = "작업대";
refineryTitle.style.fontFamily = "system-ui, -apple-system, sans-serif";
refineryTitle.style.fontSize = "20px";
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
refineryBody.style.padding = "14px";
refineryBody.style.display = "grid";
refineryBody.style.gridTemplateColumns = "230px minmax(0, 1fr)";
refineryBody.style.gap = "20px";
refineryBody.style.boxSizing = "border-box";
refineryBody.style.height = "100%";
refineryBody.style.overflow = "hidden";
refineryWin.appendChild(refineryBody);

const refineryListPanel = document.createElement("div");
refineryListPanel.style.display = "flex";
refineryListPanel.style.flexDirection = "column";
refineryListPanel.style.gap = "8px";
refineryListPanel.style.minWidth = "0";
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
refineryRecipeList.style.gap = "6px";
refineryRecipeList.style.overflow = "auto";
refineryListPanel.appendChild(refineryRecipeList);

const refineryDetailPanel = document.createElement("div");
refineryDetailPanel.style.display = "grid";
refineryDetailPanel.style.gridTemplateRows = "360px 88px 124px";
refineryDetailPanel.style.gap = "14px";
refineryDetailPanel.style.minWidth = "0";
refineryDetailPanel.style.height = "100%";
refineryDetailPanel.style.overflow = "hidden";
refineryBody.appendChild(refineryDetailPanel);

const refineryHero = document.createElement("div");
refineryHero.style.display = "grid";
refineryHero.style.gridTemplateColumns = "210px 1fr 210px";
refineryHero.style.alignItems = "center";
refineryHero.style.gap = "18px";
refineryDetailPanel.appendChild(refineryHero);

const refineryInputCard = document.createElement("div");
const refineryOutputCard = document.createElement("div");
for (const card of [refineryInputCard, refineryOutputCard]) {
  card.style.height = "360px";
  card.style.borderRadius = "12px";
  card.style.background = "rgba(255,255,255,0.95)";
  card.style.border = "1px solid rgba(0,0,0,0.18)";
  card.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8)";
  card.style.padding = "16px 14px";
  card.style.boxSizing = "border-box";
  card.style.fontFamily = "system-ui, -apple-system, sans-serif";
  card.style.overflow = "hidden";
}
refineryHero.appendChild(refineryInputCard);

const refineryArrowCard = document.createElement("div");
refineryArrowCard.style.height = "268px";
refineryArrowCard.style.borderRadius = "14px";
refineryArrowCard.style.background = "linear-gradient(180deg, rgba(255,194,105,0.22), rgba(255,156,64,0.12))";
refineryArrowCard.style.border = "1px solid rgba(255,162,68,0.38)";
refineryArrowCard.style.boxShadow = "0 0 0 3px rgba(255,186,90,0.14), inset 0 1px 0 rgba(255,255,255,0.7)";
refineryArrowCard.style.display = "flex";
refineryArrowCard.style.flexDirection = "column";
refineryArrowCard.style.alignItems = "center";
refineryArrowCard.style.justifyContent = "center";
refineryArrowCard.style.padding = "10px";
refineryArrowCard.style.boxSizing = "border-box";
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
refineryArrowValue.style.minWidth = "150px";
refineryArrowValue.style.border = "1px solid rgba(150,90,20,0.35)";
refineryArrowValue.style.borderRadius = "12px";
refineryArrowValue.style.padding = "14px 16px";
refineryArrowValue.style.fontFamily = "system-ui, -apple-system, sans-serif";
refineryArrowValue.style.fontSize = "22px";
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
refineryInfo.style.gap = "14px";
refineryDetailPanel.appendChild(refineryInfo);

const refineryNotice = document.createElement("div");
refineryNotice.style.padding = "14px 16px";
refineryNotice.style.borderRadius = "10px";
refineryNotice.style.background = "rgba(255,255,255,0.9)";
refineryNotice.style.border = "1px solid rgba(0,0,0,0.12)";
refineryNotice.style.fontFamily = "system-ui, -apple-system, sans-serif";
refineryNotice.style.fontSize = "14px";
refineryNotice.style.lineHeight = "1.55";
refineryNotice.style.color = "#444";
refineryNotice.style.boxSizing = "border-box";
refineryNotice.style.height = "124px";
refineryNotice.style.overflow = "hidden";
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

function setTabStyles() {
  for (const t of tabs) {
    const btn = tabButtons[t.id];
    const isActive = t.id === activeTab;
    btn.style.background = isActive ? "rgba(255,180,70,0.95)" : "rgba(255,255,255,0.9)";
    btn.style.borderColor = isActive ? "rgba(200,120,30,0.9)" : "rgba(0,0,0,0.2)";
    btn.style.fontWeight = isActive ? "700" : "500";
  }
}

function renderInventoryWindow() {
  inventoryRenderer.renderInventoryWindow();
}

function setPersonalStorageOpen(v) {
  const open = inventoryUiController.setPersonalStorageOpen(v);
  if (!personalStorageOverlay || !personalStorageWin) return;
  personalStorageOverlay.style.display = open ? "block" : "none";
  personalStorageWin.style.display = open ? "block" : "none";
  if (!open) {
    closePersonalStorageTransferDialog();
    personalStorageMessage.textContent = "";
    hideItemTooltip();
  } else {
    renderPersonalStorageWindow();
  }
}

function closePersonalStorageTransferDialog() {
  inventoryUiController.closeTransfer();
  if (!personalStorageTransferCurtain || !personalStorageTransferDialog) return;
  personalStorageTransferCurtain.style.display = "none";
  personalStorageTransferDialog.style.display = "none";
  personalStorageTransferError.textContent = "";
}

function openPersonalStorageTransferDialog(config) {
  const transferState = inventoryUiController.openTransfer(config, getSlotItemCount);
  if (!transferState) return false;
  const { maxCount } = transferState;
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
  const transferPlan = inventoryUiController.getTransferCommitPlan(personalStorageTransferCountInput.value);
  if (!transferPlan.ok) {
    if (transferPlan.reason === "invalid-count") {
      personalStorageTransferError.textContent = `1 ~ ${transferPlan.maxCount} 사이의 숫자를 입력하세요.`;
    }
    return false;
  }
  const { target, entry, index, count } = transferPlan;

  const result =
    target === "storage"
      ? moveInventoryEntryToStorage(entry, count)
      : moveStorageEntryToInventory(index, count);

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
  inventoryRenderer.renderPersonalStorageWindow();
}

// I 키로 인벤 열고닫기
function setInvOpen(v) {
  if (v && frontierBuildOpen) {
    setFrontierBuildOpen(false);
  }
  const invOpen = inventoryUiController.setInventoryOpen(v);
  invWin.style.display = invOpen ? "block" : "none";
  equipWin.style.display = invOpen ? "block" : "none";
  if (!invOpen) {
    hideItemTooltip();
    inventoryDraggedEntry = null;
    closeDiscardDialog();
  }
  if (invOpen) renderInventoryWindow();
}

const inventoryRenderer = createInventoryRenderer({
  invgrid,
  inventoryStoragePanel,
  personalStoragePanel,
  getInventory: () => inventory,
  getStorage: () => personalStorage,
  getActiveTab: () => activeTab,
  getEntryCategory: getInventoryEntryCategory,
  getEntryName: getInventoryEntryDisplayName,
  getEntryCount: getSlotItemCount,
  getEntryVisual: createInventoryEntryVisualElement,
  createEntryVisual: createInventoryEntryVisualElement,
  getTooltipData: getInventoryEntryTooltipData,
  getItemId: getSlotItemId,
  getEquipSlot: getInventoryEntryEquipSlot,
  getEquippedItem: getEquippedItemRef,
  isSameAsEquipped: isSameInventoryEntryAsEquipped,
  isNftEntry: isNftInventoryEntry,
  isBuildPartItemId: isWastelandBuildPartItemId,
  isFencePlacementMode: () => wastelandController.isFencePlacementMode(),
  getSelectedStructureItemId: () => wastelandController.getSelectedStructureItemId(),
  isQuickUseAssignable: isQuickUseAssignableEntry,
  getAssignedQuickUseKey: getAssignedQuickUseKeyForEntry,
  isQuickUsePending: isQuickUseAssignPendingForEntry,
  makeSlot,
  setTabStyles,
  showTooltip: showItemTooltip,
  hideTooltip: hideItemTooltip,
  toggleEquip: toggleEquipItem,
  useFreshAirCanister,
  toggleFencePlacementMode: toggleWastelandFencePlacementMode,
  toggleStructurePlacement: toggleWastelandStructurePlacementItem,
  clearQuickUse: clearQuickUseAssignmentForEntry,
  beginQuickUse: beginQuickUseAssignment,
  setInventoryDrag: (entry) => { inventoryDraggedEntry = entry; },
  clearInventoryDrag: () => { inventoryDraggedEntry = null; },
  resetTrashDropZone: () => {
    inventoryTrashDropZone.style.background = "rgba(255,255,255,0.72)";
    inventoryTrashDropZone.style.borderColor = "rgba(120,120,120,0.38)";
    inventoryTrashDropZone.style.transform = "scale(1)";
  },
  highlightSlot: (slot, kind) => {
    slot.style.borderColor = kind === "build" ? "rgba(80,160,255,0.95)" : "rgba(255,140,0,0.95)";
    slot.style.boxShadow = kind === "build"
      ? "0 0 0 3px rgba(80,160,255,0.28), inset 0 1px 0 rgba(255,255,255,0.8)"
      : "0 0 0 3px rgba(255,140,0,0.35), inset 0 1px 0 rgba(255,255,255,0.8)";
  },
  beginStorageDrag: (state) => inventoryUiController.beginDrag(state),
  clearStorageDrag: () => inventoryUiController.clearDrag(),
  getStorageDrag: () => inventoryUiController.getDragState(),
  highlightStorageDrop: (slot, active) => {
    slot.style.background = active ? "rgba(255,239,219,0.96)" : "rgba(255,255,255,0.95)";
    slot.style.borderColor = active ? "rgba(232,120,66,0.9)" : "rgba(0,0,0,0.2)";
  },
  highlightInventoryDrop: (slot, active) => {
    slot.style.background = active ? "rgba(228,241,255,0.98)" : "rgba(255,255,255,0.95)";
    slot.style.borderColor = active ? "rgba(92,145,228,0.86)" : "rgba(0,0,0,0.2)";
  },
  setStorageMessage: (message) => { personalStorageMessage.textContent = message; },
  moveEntry: ({ source, target, entry, index }) => {
    if (getSlotItemCount(entry) > 1) {
      openPersonalStorageTransferDialog({ source, target, entry: structuredClone(entry), ...(index == null ? {} : { index }) });
      return;
    }
    const result = target === "storage"
      ? moveInventoryEntryToStorage(entry)
      : moveStorageEntryToInventory(index);
    personalStorageMessage.textContent = result.ok ? "" : result.reason;
    if (result.ok) {
      updateInventoryUI();
      schedulePlayerSaveSync(true);
    }
    inventoryRenderer.renderPersonalStorageWindow();
  },
});

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
  if (inventoryUiController.isPersonalStorageOpen()) return;
  if (isTextInputActive()) return;
  if (inventoryUiController.isInventoryOpen() && logicalKey === "tab") {
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
const rockHitReactions = [];
const resourceWorldRuntime = createResourceWorldRuntime({
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
});
const { mineRocks, harvestTrees } = resourceWorldRuntime;

const HIT_STOP_DURATION = 0.045;
const ROCK_HIT_REACTION_DURATION = 0.12;
const CAMERA_SHAKE_DURATION = 0.11;
const miningFeedback = createMiningFeedbackRuntime({
  hitStopDuration: HIT_STOP_DURATION,
  cameraShakeDuration: CAMERA_SHAKE_DURATION,
  randomRange: randRange,
});

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
  miningParticles.spawnDustBurst(pos, count);
}

function spawnRockBreakBurst(rock) {
  miningParticles.spawnRockBreakBurst(rock);
}

function updateParticles(dt) {
  miningParticles.update(dt);
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

let inventoryDraggedEntry = null;
let inventoryDiscardTargetEntry = null;

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
        pickaxeLevel: normalizedEntry.pickaxeLevel ?? null,
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
    const equippedPickaxeLevel = getEquippedPickaxeLevel();
    if (
      previewParts.equippedPickaxe.userData.pickaxeLevel !== equippedPickaxeLevel ||
      previewParts.equippedPickaxe.userData.toolItemId !== getEquippedToolId()
    ) {
      syncEquippedToolGroupModel(
        previewParts.equippedPickaxe,
        getEquippedToolId(),
        equippedPickaxeLevel
      );
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
      const resolvedEquippedEntry = getDisplayResolvedInventoryEntry(equippedRef);
      const icon = createInventoryEntryVisualElement(resolvedEquippedEntry, { size: 34 });

      const name = document.createElement("div");
      name.textContent = getInventoryEntryDisplayName(resolvedEquippedEntry);
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
const WASTELAND_FENCE_MIN_WIDTH = 5;
const WASTELAND_FENCE_MIN_HEIGHT = 5;
const WASTELAND_CLAIM_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const WASTELAND_DRAFT_RESERVATION_MS = 5 * 60 * 1000;
const WASTELAND_DRAFT_PHASE = Object.freeze({
  NONE: "draft_none",
  ACTIVE: "draft_active",
  CONFIRMABLE: "draft_confirmable",
  EXPIRED: "draft_expired",
});
const WASTELAND_CLAIM_STATUS = Object.freeze({
  ACTIVE: "active",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
});
const WASTELAND_CLAIM_PHASE = Object.freeze({
  NONE: "claim_none",
  ACTIVE: "claim_active",
  REWARD_PENDING: "claim_reward_pending",
  COMPLETED: "claim_completed",
  FAILED: "claim_failed",
});
const wastelandRuntime = createWastelandRuntime({
  getPlot: () => frontierWastelandPlot,
  getOwnerId: () => getCurrentWastelandOwnerId(),
  landDeedItemId: WASTELAND_LAND_DEED_ITEM_ID,
});
const latestMoveDir = new THREE.Vector3(0, 0, -1); // 월드 기준: -Z = 북, +X = 동

function updateCompassFromDirection(dir) {
  updateCompassUi(compassNeedle, compassText, dir);
}

function findNearestMineRock(radius = 2.2) {
  return resourceWorldRuntime.findNearestMineRock(radius);
}

function findNearestHarvestTree(radius = 2.2) {
  return resourceWorldRuntime.findNearestHarvestTree(radius);
}

function setWastelandCellState(cell, state) {
  if (!cell?.mesh) return;
  cell.clearProgress = state === "dug3" ? 100 : state === "dug2" ? 50 : state === "dug1" ? 25 : 0;
  syncWastelandCellStateFromProgress(cell);
  applyWastelandCellVisual(cell);
}

function findActiveFrontierWastelandCell(radius = 2.4) {
  return findNearestByPosition({
    entries: frontierWastelandPlot?.cells,
    playerPosition: player.position,
    radius,
    getPosition: (cell) => cell,
  });
}

function getFrontierWastelandProgress() {
  const cells = frontierWastelandPlot?.cells ?? [];
  const total = cells.length;
  let completed = 0;
  for (const cell of cells) {
    if (cell.state === "dug3") completed += 1;
  }
  return {
    completed,
    total,
    percent: total > 0 ? (completed / total) * 100 : 0,
  };
}

function shouldShowFrontierWastelandHud() {
  return Boolean(getCurrentFrontierWastelandClaim());
}

function getCurrentWastelandOwnerId() {
  return getCurrentFrontierWalletAddress();
}

function ensureFrontierWastelandRuntimeState() {
  if (!frontierWastelandPlot) return null;
  if (!frontierWastelandPlot.fenceRoot) {
    frontierWastelandPlot.fenceRoot = new THREE.Group();
    frontierWastelandPlot.root.add(frontierWastelandPlot.fenceRoot);
  }
  if (!frontierWastelandPlot.fenceLinkRoot) {
    frontierWastelandPlot.fenceLinkRoot = new THREE.Group();
    frontierWastelandPlot.root.add(frontierWastelandPlot.fenceLinkRoot);
  }
  if (!frontierWastelandPlot.claimPreviewRoot) {
    frontierWastelandPlot.claimPreviewRoot = new THREE.Group();
    frontierWastelandPlot.root.add(frontierWastelandPlot.claimPreviewRoot);
  }
  if (!frontierWastelandPlot.structureRoot) {
    frontierWastelandPlot.structureRoot = new THREE.Group();
    frontierWastelandPlot.root.add(frontierWastelandPlot.structureRoot);
  }
  if (!frontierWastelandPlot.fencePosts) {
    frontierWastelandPlot.fencePosts = new Map();
  }
  if (!frontierWastelandPlot.claimDrafts) {
    frontierWastelandPlot.claimDrafts = new Map();
  }
  if (!frontierWastelandPlot.claims) {
    frontierWastelandPlot.claims = [];
  }
  if (!frontierWastelandPlot.structures) {
    frontierWastelandPlot.structures = [];
  }
  return frontierWastelandPlot;
}

function resetFrontierWastelandRuntimeState() {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot) return;
  const resetPlan = wastelandRuntime.createResetStatePlan(plot.cells);
  for (const root of [plot.fenceRoot, plot.fenceLinkRoot, plot.claimPreviewRoot, plot.structureRoot]) {
    if (!root) continue;
    while (root.children.length) {
      disposeObject3D(root.children[0]);
      root.remove(root.children[0]);
    }
  }
  plot.fencePosts = new Map(resetPlan.fencePosts.map((post) => [post.key, post]));
  plot.claimDrafts = new Map(resetPlan.drafts.map((draft) => [draft.ownerId, draft]));
  plot.claims = resetPlan.claims;
  plot.structures = resetPlan.structures;
  wastelandController.resetPlacementMode();
  closeWastelandClaimConfirmDialog();
  for (const cell of plot.cells ?? []) {
    cell.clearProgress = resetPlan.cellProgressById.get(cell.id) ?? 0;
    setWastelandCellState(cell, "idle");
  }
  updateWastelandClaimActionUi(null);
}

function resetWastelandDraftUiState({ clearPlacementMode = true } = {}) {
  activeWastelandCell = null;
  if (clearPlacementMode) {
    wastelandController.clearFencePlacementMode();
  }
  clearWastelandClaimPreview();
  closeWastelandClaimConfirmDialog();
  closeWastelandClaimCancelDialog();
}

function rebuildAllWastelandDraftsFromFencePosts() {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot?.claimDrafts) return null;
  const nextDrafts = rebuildWastelandDraftsFromModule({
    fencePosts: plot.fencePosts,
    claims: plot.claims,
    previousDrafts: plot.claimDrafts,
    now: Date.now(),
    reservationMs: WASTELAND_DRAFT_RESERVATION_MS,
    activePhase: WASTELAND_DRAFT_PHASE.ACTIVE,
  });
  plot.claimDrafts = nextDrafts;
  return nextDrafts;
}

function rebuildCurrentWastelandDraftFromOwnedFencePosts() {
  const ownerId = getCurrentWastelandOwnerId();
  if (!ownerId) return null;
  const drafts = rebuildAllWastelandDraftsFromFencePosts();
  return drafts?.get(ownerId) ?? null;
}

function refreshCurrentWastelandDraftUiState({
  rebuildOwnedDraft = true,
  closeConfirm = false,
  closeCancel = false,
} = {}) {
  if (rebuildOwnedDraft) {
    rebuildCurrentWastelandDraftFromOwnedFencePosts();
  }
  clearWastelandClaimPreview();
  if (closeConfirm) closeWastelandClaimConfirmDialog();
  if (closeCancel) closeWastelandClaimCancelDialog();
  updateWastelandClaimActionUi(getCurrentWastelandClaimProgress());
  if (wastelandController.isFencePlacementMode()) {
    updateFrontierWastelandDraftPrompt();
    updateWastelandClaimPreview();
  }
}

function finalizeWastelandStateTransition({
  rebuildDrafts = false,
  rebuildOwnedDraft = false,
  rebuildLinks = false,
  clearPlacementMode = false,
  closeConfirm = false,
  closeCancel = false,
  refreshDraftUi = false,
  updateClaimUi = false,
  updateInventory = false,
  save = false,
} = {}) {
  if (rebuildDrafts) rebuildAllWastelandDraftsFromFencePosts();
  if (rebuildLinks) rebuildFrontierWastelandFenceLinks();
  if (clearPlacementMode) {
    wastelandController.clearFencePlacementMode();
  }
  if (refreshDraftUi) {
    refreshCurrentWastelandDraftUiState({
      rebuildOwnedDraft,
      closeConfirm,
      closeCancel,
    });
  } else {
    if (closeConfirm) closeWastelandClaimConfirmDialog();
    if (closeCancel) closeWastelandClaimCancelDialog();
    if (updateClaimUi) {
      updateWastelandClaimActionUi(getCurrentWastelandClaimProgress());
    }
  }
  if (updateInventory) updateInventoryUI();
  if (save) saveSharedWorldStateToLocal();
}

function getCurrentFrontierWastelandDraft() {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot) return null;
  return plot.claimDrafts.get(getCurrentWastelandOwnerId()) ?? null;
}

function touchWastelandDraftReservation(draft, now = Date.now()) {
  if (!draft) return null;
  const update = wastelandRuntime.createDraftReservationUpdate({
    draft,
    ownerId: draft.ownerId,
    postKey: draft.postKeys?.[0],
    now,
    reservationMs: WASTELAND_DRAFT_RESERVATION_MS,
  });
  if (!update) return null;
  Object.assign(draft, update);
  syncWastelandDraftPhase(draft);
  return draft;
}

function getScopedWastelandDraftFencePosts(draft, ownerId = getCurrentWastelandOwnerId()) {
  const plot = ensureFrontierWastelandRuntimeState();
  const scoped = new Map();
  if (!plot?.fencePosts || !draft?.postKeys?.length || !ownerId) return scoped;
  for (const key of draft.postKeys) {
    const post = plot.fencePosts.get(key);
    if (!post || post.ownerId !== ownerId) continue;
    scoped.set(key, post);
  }
  return scoped;
}

function getCurrentFrontierWastelandClaim() {
  ensureFrontierWastelandRuntimeState();
  return wastelandRuntime.getCurrentClaim();
}

function getFrontierWastelandClaimByCell(cell) {
  ensureFrontierWastelandRuntimeState();
  return wastelandRuntime.getClaimForCell(cell);
}

function formatWastelandClaimRemaining(ms) {
  const clamped = Math.max(0, ms);
  const totalMinutes = Math.ceil(clamped / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

function getWastelandDraftReservationHit(cell, buffer = 0) {
  const plot = ensureFrontierWastelandRuntimeState();
  const ownerId = getCurrentWastelandOwnerId();
  return findWastelandDraftReservationHitFromModule({
    cell,
    claimDrafts: plot?.claimDrafts,
    currentOwnerId: ownerId,
    getFencePostsByOwner: (draft, draftOwnerId) =>
      getScopedWastelandDraftFencePosts(draft, draftOwnerId),
    buffer,
  });
}

function getWastelandCellById(cellId) {
  return wastelandRuntime.getCellById(cellId);
}

function buildWastelandClaimLandMeta(rect) {
  return wastelandRuntime.buildLandMeta(rect);
}

function findIssuedWastelandLandDeed(landId) {
  if (!landId) return null;
  return (
    inventory.slots.find(
      (entry) =>
        entry &&
        !isNftInventoryEntry(entry) &&
        getSlotItemId(entry) === WASTELAND_LAND_DEED_ITEM_ID &&
        entry.landId === landId
    ) ?? null
  );
}

function findOwnedWastelandLandDeed(landId) {
  if (!getCurrentWastelandOwnerId() || !landId) return null;
  return findIssuedWastelandLandDeed(landId);
}

function createWastelandLandDeedEntry(claim) {
  const deedData = wastelandRuntime.createLandDeedData(claim);
  if (!deedData) return null;
  const { itemId, ...extra } = deedData;
  return createInventorySlotEntry(itemId, 1, extra);
}

function getWastelandLandDeedInventoryEntries() {
  return inventory.slots.filter(
    (entry) =>
      entry &&
      !isNftInventoryEntry(entry) &&
      getSlotItemId(entry) === WASTELAND_LAND_DEED_ITEM_ID &&
      entry.landId
  );
}

function restorePreservedWastelandLandDeeds(entries) {
  if (!Array.isArray(entries) || !entries.length) return 0;
  let restored = 0;
  for (const entry of entries) {
    if (!entry?.landId || findIssuedWastelandLandDeed(entry.landId)) continue;
    if (addInventoryEntry(structuredClone(entry))) restored += 1;
  }
  return restored;
}

function restoreMissingOwnedWastelandLandDeeds({ showMessage = false, saveProfile = false } = {}) {
  const plot = ensureFrontierWastelandRuntimeState();
  const ownerId = getCurrentWastelandOwnerId();
  if (!plot || !ownerId) return 0;
  let restored = 0;
  let blocked = false;
  const missingClaims = wastelandRuntime.getMissingLandDeedClaims({
    claims: plot.claims,
    ownerId,
    completedStatus: WASTELAND_CLAIM_STATUS.COMPLETED,
    hasLandDeed: (landId) => Boolean(findIssuedWastelandLandDeed(landId)),
  });
  for (const claim of missingClaims) {
    const deedEntry = createWastelandLandDeedEntry(claim);
    if (!deedEntry || !addInventoryEntry(deedEntry)) {
      blocked = true;
      continue;
    }
    restored += 1;
  }
  if (restored > 0) {
    updateInventoryUI();
    if (saveProfile) saveActiveLocalProfileState();
    if (showMessage) {
      showUI(`누락된 황무지 토지권 ${restored}개를 복구했습니다.`, 1300);
      lastMessageUntil = performance.now() + 1300;
    }
  } else if (blocked && showMessage) {
    showUI("기타 아이템 슬롯을 비우면 누락된 황무지 토지권을 복구할 수 있습니다.", 1400);
    lastMessageUntil = performance.now() + 1400;
  }
  return restored;
}

function findWastelandStructureSlotConflict(cell, slot) {
  ensureFrontierWastelandRuntimeState();
  return wastelandRuntime.getStructureConflict(cell, slot);
}

function getWastelandBuildCheck(cell, itemId = wastelandController.getSelectedStructureItemId()) {
  const partDef = getWastelandBuildPartDef(itemId);
  const claim = getFrontierWastelandClaimByCell(cell);
  return canBuildOnWastelandCellStateFromModule({
    cell,
    claim,
    hasLandDeed: Boolean(claim?.landId && findOwnedWastelandLandDeed(claim.landId)),
    currentOwnerId: getCurrentWastelandOwnerId(),
    structures: ensureFrontierWastelandRuntimeState()?.structures ?? [],
    structureSlot: partDef?.slot ?? "",
    minSpacing: 0,
  });
}

function rebuildFrontierWastelandStructures() {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot) return;
  if (!plot.structureRoot) {
    plot.structureRoot = new THREE.Group();
    plot.root.add(plot.structureRoot);
  }
  while (plot.structureRoot.children.length) {
    disposeObject3D(plot.structureRoot.children[0]);
    plot.structureRoot.remove(plot.structureRoot.children[0]);
  }
  const plans = wastelandSceneRuntime.getStructureScenePlans({
    structures: plot.structures,
    getCellByGrid: getFrontierWastelandCellByGrid,
    getSurfaceY: getWastelandStructureSurfaceY,
  });
  for (const { structure, position } of plans) {
    Object.assign(structure, position);
    const mesh = createWastelandStructureMesh(structure, getWastelandBuildPartDef);
    if (!mesh) continue;
    structure.mesh = mesh;
    plot.structureRoot.add(mesh);
  }
}

function toggleWastelandStructurePlacementItem(itemId) {
  if (!isWastelandBuildPartItemId(itemId)) return false;
  const selectedStructureItemId = wastelandController.toggleStructurePlacement(itemId);
  updateInventoryUI();
  showUI(
    selectedStructureItemId
      ? `${ITEM_DEFS[selectedStructureItemId]?.name ?? itemId} 배치 모드`
      : "건축 부품 배치 모드 해제",
    1000
  );
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function placeWastelandStructure(cell, itemId = wastelandController.getSelectedStructureItemId()) {
  const plot = ensureFrontierWastelandRuntimeState();
  const partDef = getWastelandBuildPartDef(itemId);
  if (!plot || !cell || !partDef) return false;
  const buildCheck = getWastelandBuildCheck(cell, itemId);
  if (!buildCheck.ok) {
    const conflict = findWastelandStructureSlotConflict(cell, partDef.slot);
    const reason = conflict
      ? `이미 이 셀에 ${getWastelandStructureSlotLabel(partDef.slot)} 부품이 있습니다.`
      : buildCheck.reason;
    showUI(reason, 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  if (!consumeItem(itemId, 1)) {
    showUI("건축 부품을 소모하지 못했습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  const claim = getFrontierWastelandClaimByCell(cell);
  const structure = wastelandRuntime.createStructureRecord({
    key: `wasteland_structure_${Date.now().toString(36)}_${cell.row}_${cell.col}`,
    claim,
    ownerId: getCurrentWastelandOwnerId(),
    itemId,
    slot: partDef.slot,
    cell,
    surfaceY: getWastelandStructureSurfaceY(cell),
    rotationQuarter: getWastelandStructureRotationQuarter(player.rotation.y),
  });
  if (!structure) return false;
  plot.structures.push(structure);
  rebuildFrontierWastelandStructures();
  updateInventoryUI();
  saveSharedWorldStateToLocal();
  showUI(`${ITEM_DEFS[itemId]?.name ?? itemId} 설치 완료`, 900);
  lastMessageUntil = performance.now() + 900;
  return true;
}

function serializeFrontierWastelandState() {
  ensureFrontierWastelandRuntimeState();
  const state = wastelandRuntime.serializeState(getWastelandCellClearProgress);
  return state
    ? serializeFrontierWastelandServerStateFromModule(state)
    : normalizeFrontierWastelandStateFromModule(null);
}

function applyFrontierWastelandState(rawState) {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot) return;
  const state = normalizeFrontierWastelandStateFromModule(rawState);
  const restorePlan = wastelandRuntime.createRestoreStatePlan(state);
  for (const root of [plot.fenceRoot, plot.fenceLinkRoot, plot.claimPreviewRoot, plot.structureRoot]) {
    if (!root) continue;
    while (root.children.length) {
      disposeObject3D(root.children[0]);
      root.remove(root.children[0]);
    }
  }
  for (const cell of plot.cells ?? []) {
    cell.clearProgress = restorePlan.cellProgressById.get(cell.id) ?? 0;
    syncWastelandCellStateFromProgress(cell);
    applyWastelandCellVisual(cell);
  }
  plot.fencePosts = new Map();
  for (const savedPost of restorePlan.fencePosts) {
    const mesh = createWastelandFencePostMesh();
    mesh.position.set(savedPost.x, 0.02, savedPost.z);
    plot.fenceRoot.add(mesh);
    plot.fencePosts.set(savedPost.key, {
      ...savedPost,
      mesh,
    });
  }
  plot.claimDrafts = new Map(restorePlan.drafts.map((draft) => [draft.ownerId, draft]));
  plot.claims = restorePlan.claims;
  plot.structures = restorePlan.structures;
  wastelandController.resetPlacementMode();
  closeWastelandClaimConfirmDialog();
  closeWastelandClaimCancelDialog();
  rebuildAllWastelandDraftsFromFencePosts();
  rebuildFrontierWastelandFenceLinks();
  rebuildFrontierWastelandStructures();
  clearWastelandClaimPreview();
  updateWastelandClaimActionUi(null);
}

function rebuildFrontierWastelandFenceLinks() {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot?.fenceLinkRoot) return;
  while (plot.fenceLinkRoot.children.length) {
    disposeObject3D(plot.fenceLinkRoot.children[0]);
    plot.fenceLinkRoot.remove(plot.fenceLinkRoot.children[0]);
  }
  const plans = wastelandSceneRuntime.getFenceLinkPlans({
    fencePosts: plot.fencePosts,
    cellSize: plot.cellSize,
    canLinkPosts: canLinkWastelandFencePostsByOwnerFromModule,
  });
  for (const plan of plans) {
    const mesh = createWastelandFenceLinkMesh(plan.length, plan.horizontal);
    mesh.position.x = plan.x;
    mesh.position.z = plan.z;
    plot.fenceLinkRoot.add(mesh);
  }
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

function reclaimConflictingWastelandFencePostsForClaim(claim, buffer = 2) {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot?.fencePosts || !claim) return 0;
  const reclaimedByOwner = new Map();
  const conflictingPosts = getConflictingWastelandFencePostsForClaimFromModule({
    fencePosts: plot.fencePosts,
    claim,
    buffer,
  });
  for (const post of conflictingPosts) {
    const key = post.key ?? `${post.row}:${post.col}`;
    if (post.mesh?.parent) {
      disposeObject3D(post.mesh);
      post.mesh.parent.remove(post.mesh);
    }
    plot.fencePosts.delete(key);
    reclaimedByOwner.set(post.ownerId, (reclaimedByOwner.get(post.ownerId) ?? 0) + 1);
  }
  if (!reclaimedByOwner.size) return 0;
  let totalReclaimed = 0;
  for (const [ownerId, count] of reclaimedByOwner.entries()) {
    if (grantLocalProfileItem(ownerId, "fencePost", count)) {
      totalReclaimed += count;
    }
  }
  rebuildAllWastelandDraftsFromFencePosts();
  rebuildFrontierWastelandFenceLinks();
  clearWastelandClaimPreview();
  return totalReclaimed;
}

function isCellInsideConfirmedWastelandClaim(cell) {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot || !cell) return false;
  return plot.claims.some(
    (claim) =>
      cell.row >= claim.minRow &&
      cell.row <= claim.maxRow &&
      cell.col >= claim.minCol &&
      cell.col <= claim.maxCol
  );
}

function getConfirmedWastelandClaimBufferHit(cell, buffer = 2) {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot || !cell) return null;
  return (
    plot.claims.find(
      (claim) => isCellInsideWastelandBoundsFromModule(cell, claim, buffer)
    ) ?? null
  );
}

function getWastelandClaimForCell(cell) {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot || !cell) return null;
  return plot.claims.find(
    (claim) =>
      cell.row >= claim.minRow &&
      cell.row <= claim.maxRow &&
      cell.col >= claim.minCol &&
      cell.col <= claim.maxCol
  ) ?? null;
}

function canClearWastelandCell(cell) {
  const claim = getWastelandClaimForCell(cell);
  const permission = wastelandRuntime.getCellClearPermission({
    cell,
    claim,
    ownerId: getCurrentWastelandOwnerId(),
    activeStatus: WASTELAND_CLAIM_STATUS.ACTIVE,
  });
  const reasonByCode = {
    "claim-required": "울타리 구역을 먼저 확정해야 개간할 수 있습니다.",
    "owner-required": "개간은 지갑 로그인이 필요합니다.",
    "owner-mismatch": "이 구역의 소유자만 개간할 수 있습니다.",
    "claim-inactive": "진행 중인 개간 구역이 아닙니다.",
  };
  return permission.ok ? permission : { ok: false, reason: reasonByCode[permission.reason] };
}

function canPlaceWastelandFencePost(cell) {
  const plot = ensureFrontierWastelandRuntimeState();
  const ownerId = getCurrentWastelandOwnerId();
  const reservationHit = getWastelandDraftReservationHit(cell, 2);
  const decision = wastelandRuntime.getFencePostPlacementDecision({
    cell,
    ownerId,
    hasCurrentClaim: Boolean(getCurrentFrontierWastelandClaim()),
    hasExistingPost: Boolean(plot?.fencePosts?.has(`${cell?.row}:${cell?.col}`)),
    isInsideConfirmedClaim: isCellInsideConfirmedWastelandClaim(cell),
    hasConfirmedClaimBuffer: Boolean(getConfirmedWastelandClaimBufferHit(cell, 2)),
    reservationHit,
    hasFencePostItem: hasItem("fencePost"),
  });
  const reasonByCode = {
    "missing-cell": "설치할 셀을 찾을 수 없습니다.",
    "owner-required": "울타리 기둥 설치는 지갑 로그인이 필요합니다.",
    "current-claim-exists": "이미 확정된 개간 구역이 있습니다.",
    "post-exists": "이미 울타리 기둥이 설치된 셀입니다.",
    "confirmed-claim-overlap": "확정된 개간 구역과 겹치는 셀에는 설치할 수 없습니다.",
    "confirmed-claim-buffer": "확정된 개간 구역 주변 2셀 안에는 설치할 수 없습니다.",
    "draft-reservation-buffer": "다른 플레이어가 예약한 토지 선언 구역 주변 2셀 안에는 설치할 수 없습니다.",
    "draft-reservation-overlap": "다른 플레이어가 예약한 토지 선언 구역입니다.",
    "fence-post-required": "울타리 기둥이 없습니다.",
  };
  if (!decision.ok) return { ok: false, reason: reasonByCode[decision.reason] };
  return decision;
}

function removeWastelandDraftFencePost(cell) {
  const plot = ensureFrontierWastelandRuntimeState();
  const ownerId = getCurrentWastelandOwnerId();
  if (!plot || !cell || !ownerId) return false;
  const key = `${cell.row}:${cell.col}`;
  const post = plot.fencePosts.get(key);
  const draft = plot.claimDrafts.get(ownerId);
  if (!post || post.ownerId !== ownerId || !draft?.postKeys?.includes(key)) return false;
  if (post.mesh?.parent) {
    disposeObject3D(post.mesh);
    post.mesh.parent.remove(post.mesh);
  }
  plot.fencePosts.delete(key);
  draft.postKeys = draft.postKeys.filter((postKey) => postKey !== key);
  draft.lastPromptSignature = "";
  if (draft.postKeys.length <= 0) {
    plot.claimDrafts.delete(ownerId);
  } else {
    touchWastelandDraftReservation(draft);
  }
  addItem("fencePost", 1);
  finalizeWastelandStateTransition({
    rebuildLinks: true,
    closeConfirm: true,
    refreshDraftUi: true,
    updateInventory: true,
    save: true,
  });
  showUI("울타리 기둥을 회수했습니다.", 900);
  lastMessageUntil = performance.now() + 900;
  return true;
}

function placeWastelandFencePost(cell) {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot || !cell) return false;
  if (removeWastelandDraftFencePost(cell)) return true;
  const canPlace = canPlaceWastelandFencePost(cell);
  if (!canPlace.ok) {
    showUI(canPlace.reason, 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  if (!consumeItem("fencePost", 1)) {
    showUI("울타리 기둥을 소모하지 못했습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  const ownerId = getCurrentWastelandOwnerId();
  if (!ownerId) {
    showUI("울타리 기둥 설치는 지갑 로그인이 필요합니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  const postData = wastelandRuntime.createFencePostRecord(cell, ownerId);
  if (!postData) return false;
  const { key } = postData;
  const mesh = createWastelandFencePostMesh();
  mesh.position.set(cell.x, 0.02, cell.z);
  plot.fenceRoot.add(mesh);
  plot.fencePosts.set(key, { ...postData, mesh });
  const now = Date.now();
  const draft = plot.claimDrafts.get(ownerId);
  const draftUpdate = wastelandRuntime.createDraftReservationUpdate({
    draft,
    ownerId,
    postKey: key,
    now,
    reservationMs: WASTELAND_DRAFT_RESERVATION_MS,
  });
  if (!draftUpdate) return false;
  if (draft) {
    Object.assign(draft, draftUpdate);
    syncWastelandDraftPhase(draft);
  } else {
    plot.claimDrafts.set(ownerId, { ...draftUpdate, phase: WASTELAND_DRAFT_PHASE.ACTIVE });
  }
  finalizeWastelandStateTransition({
    rebuildLinks: true,
    refreshDraftUi: true,
    updateInventory: true,
    save: true,
  });
  return true;
}

function getWastelandDraftBounds(draft) {
  return getWastelandDraftBoundsFromModule(draft, getScopedWastelandDraftFencePosts(draft));
}

function isValidWastelandDraftRectangle(draft) {
  return validateWastelandDraftRectangleFromModule({
    draft,
    fencePosts: getScopedWastelandDraftFencePosts(draft),
    cells: frontierWastelandPlot?.cells,
    minWidth: WASTELAND_FENCE_MIN_WIDTH,
    minHeight: WASTELAND_FENCE_MIN_HEIGHT,
  });
}

function getWastelandDraftPhase(draft = getCurrentFrontierWastelandDraft()) {
  return getWastelandDraftPhaseStateFromModule({
    draft,
    isConfirmable: Boolean(isValidWastelandDraftRectangle(draft)),
    phases: WASTELAND_DRAFT_PHASE,
  });
}

function syncWastelandDraftPhase(draft) {
  if (!draft) return WASTELAND_DRAFT_PHASE.NONE;
  draft.phase = getWastelandDraftPhase(draft);
  return draft.phase;
}

function getWastelandDraftGuide() {
  const draft = getCurrentFrontierWastelandDraft();
  const bounds = getWastelandDraftBounds(draft);
  return createWastelandDraftGuide({
    draft,
    bounds,
    phase: getWastelandDraftPhase(draft),
    minWidth: WASTELAND_FENCE_MIN_WIDTH,
    minHeight: WASTELAND_FENCE_MIN_HEIGHT,
    confirmablePhase: WASTELAND_DRAFT_PHASE.CONFIRMABLE,
  });
}

function getWastelandFenceHudState() {
  const guide = getWastelandDraftGuide();
  const draft = getCurrentFrontierWastelandDraft();
  const reservationText =
    draft?.expiresAt != null
      ? `예약 유지 ${formatWastelandClaimRemaining(draft.expiresAt - Date.now())}`
      : "예약 대기 중";
  return createWastelandFenceHudState({
    placementMode: wastelandController.isFencePlacementMode(),
    guide,
    reservationText,
    minWidth: WASTELAND_FENCE_MIN_WIDTH,
    minHeight: WASTELAND_FENCE_MIN_HEIGHT,
  });
}

function clearWastelandClaimPreview() {
  const plot = ensureFrontierWastelandRuntimeState();
  const root = plot?.claimPreviewRoot;
  if (!root) return;
  while (root.children.length) {
    disposeObject3D(root.children[0]);
    root.remove(root.children[0]);
  }
}

function updateWastelandClaimPreview() {
  const plot = ensureFrontierWastelandRuntimeState();
  clearWastelandClaimPreview();
  if (!plot?.claimPreviewRoot) return;
  const plans = wastelandSceneRuntime.getClaimPreviewPlans({
    cells: plot.cells,
    draftEntries: plot.claimDrafts,
    currentOwnerId: getCurrentWastelandOwnerId(),
    isFencePlacementMode: wastelandController.isFencePlacementMode(),
    getDraftBounds: getWastelandDraftBoundsFromModule,
    getDraftFencePosts: getScopedWastelandDraftFencePosts,
    getDraftGuide: getWastelandDraftGuide,
  });
  for (const plan of plans) {
    const mesh = createWastelandPreviewCellMesh(plan.cell, plan.color, plan.opacity, plan.height);
    mesh.scale.set(plan.scale, 1, plan.scale);
    mesh.position.y = plan.y;
    plot.claimPreviewRoot.add(mesh);
  }
}

function removeWastelandClaimFences(claim) {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot || !claim) return;
  for (const key of claim.postKeys ?? []) {
    const post = plot.fencePosts.get(key);
    if (!post) continue;
    if (post.mesh?.parent) {
      disposeObject3D(post.mesh);
      post.mesh.parent.remove(post.mesh);
    }
    plot.fencePosts.delete(key);
  }
  rebuildFrontierWastelandFenceLinks();
  clearWastelandClaimPreview();
}

function closeWastelandClaimConfirmDialog() {
  wastelandController.closeClaimConfirm();
  wastelandClaimConfirmRect = null;
  if (wastelandClaimConfirmOverlay) wastelandClaimConfirmOverlay.style.display = "none";
  if (wastelandClaimConfirmDialog) wastelandClaimConfirmDialog.style.display = "none";
}

function closeWastelandClaimCancelDialog() {
  wastelandController.closeClaimCancel();
  if (wastelandClaimCancelOverlay) wastelandClaimCancelOverlay.style.display = "none";
  if (wastelandClaimCancelDialog) wastelandClaimCancelDialog.style.display = "none";
}

function openWastelandClaimCancelDialog() {
  const claim = getCurrentFrontierWastelandClaim();
  if (!claim || getWastelandClaimPhase({ claim, readyToComplete: false }) === WASTELAND_CLAIM_PHASE.COMPLETED || claim.rewardIssuedAt) {
    showUI("취소할 수 있는 확정 구역이 없습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  wastelandController.openClaimCancel();
  if (wastelandClaimCancelOverlay) wastelandClaimCancelOverlay.style.display = "block";
  if (wastelandClaimCancelDialog) wastelandClaimCancelDialog.style.display = "block";
  return true;
}

function openWastelandClaimConfirmDialog(rect) {
  if (!rect || !wastelandClaimConfirmOverlay || !wastelandClaimConfirmDialog) return false;
  wastelandClaimConfirmRect = rect;
  wastelandController.openClaimConfirm();
  wastelandClaimConfirmBody.innerHTML = "";
  const sizeLine = document.createElement("div");
  sizeLine.textContent = `${rect.width} x ${rect.height} 구역, 총 ${rect.cellIds.length}셀`;
  sizeLine.style.fontWeight = "900";
  sizeLine.style.color = "#2f261b";
  wastelandClaimConfirmBody.appendChild(sizeLine);

  const guideLine = document.createElement("div");
  guideLine.textContent = "확정하면 7일 안에 내부 셀을 모두 개간해야 토지 권한을 획득할 수 있습니다.";
  guideLine.style.marginTop = "8px";
  wastelandClaimConfirmBody.appendChild(guideLine);

  const ownerLine = document.createElement("div");
  ownerLine.textContent = "현재 단계에서는 확정한 소유주만 이 구역을 개간할 수 있게 이어갈 예정입니다.";
  ownerLine.style.marginTop = "6px";
  ownerLine.style.opacity = "0.82";
  wastelandClaimConfirmBody.appendChild(ownerLine);

  wastelandClaimConfirmOverlay.style.display = "block";
  wastelandClaimConfirmDialog.style.display = "block";
  return true;
}

function commitCurrentWastelandDraft() {
  const plot = ensureFrontierWastelandRuntimeState();
  const ownerId = getCurrentWastelandOwnerId();
  const draft = plot?.claimDrafts?.get(ownerId);
  if (!ownerId) {
    showUI("개간 구역 확정은 지갑 로그인이 필요합니다.", 1100);
    lastMessageUntil = performance.now() + 1100;
    closeWastelandClaimConfirmDialog();
    return false;
  }
  if (!plot || !draft) return false;
  const rect = isValidWastelandDraftRectangle(draft);
  if (!rect) return false;
  const hasOverlap = wastelandRuntime.hasClaimOverlap(rect, plot.claims);
  if (hasOverlap) {
    showUI("다른 확정 구역과 겹치는 직사각형은 확정할 수 없습니다.", 1100);
    lastMessageUntil = performance.now() + 1100;
    return false;
  }
  const landMeta = buildWastelandClaimLandMeta(rect);
  const claim = wastelandRuntime.createClaimRecord({
    ownerId,
    rect,
    draft,
    landMeta,
    now: Date.now(),
    durationMs: WASTELAND_CLAIM_DURATION_MS,
    activeStatus: WASTELAND_CLAIM_STATUS.ACTIVE,
  });
  if (!claim) return false;
  plot.claims.push(claim);
  plot.claimDrafts.delete(ownerId);
  const reclaimedCount = reclaimConflictingWastelandFencePostsForClaim(claim, 2);
  finalizeWastelandStateTransition({
    clearPlacementMode: true,
    closeConfirm: true,
    refreshDraftUi: true,
    updateInventory: true,
    save: true,
  });
  showUI(
    reclaimedCount > 0
      ? `개간 구역을 확정했습니다. 충돌 울타리 ${reclaimedCount}개를 자동 회수했습니다.`
      : "개간 구역을 확정했습니다.",
    1300
  );
  lastMessageUntil = performance.now() + 1300;
  return true;
}

function confirmCurrentWastelandDraft() {
  const plot = ensureFrontierWastelandRuntimeState();
  const ownerId = getCurrentWastelandOwnerId();
  const draft = plot?.claimDrafts?.get(ownerId);
  if (!ownerId || !plot || !draft) return false;
  const rect = isValidWastelandDraftRectangle(draft);
  if (!rect) return false;
  const hasOverlap = wastelandRuntime.hasClaimOverlap(rect, plot.claims);
  if (hasOverlap) {
    showUI("다른 확정 구역과 겹치는 직사각형은 확정할 수 없습니다.", 1100);
    lastMessageUntil = performance.now() + 1100;
    return false;
  }
  if (wastelandController.isClaimConfirmOpen()) return true;
  return openWastelandClaimConfirmDialog(rect);
}

function updateFrontierWastelandDraftPrompt() {
  const draft = getCurrentFrontierWastelandDraft();
  if (!draft || getCurrentFrontierWastelandClaim()) return;
  const rect = isValidWastelandDraftRectangle(draft);
  if (!rect) return;
  const signature = `${rect.minRow}:${rect.maxRow}:${rect.minCol}:${rect.maxCol}:${draft.postKeys.length}`;
  if (draft.lastPromptSignature === signature) return;
  draft.lastPromptSignature = signature;
  confirmCurrentWastelandDraft();
}

function expireOverdueFrontierWastelandClaims() {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot?.claims?.length) return;
  const now = Date.now();
  const expirationPlan = wastelandRuntime.createClaimExpirationPlan({
    claims: plot.claims,
    now,
    partitionExpiredClaims: partitionExpiredWastelandClaimsFromModule,
    failedStatus: WASTELAND_CLAIM_STATUS.FAILED,
  });
  if (!expirationPlan.expired.length) return;
  const currentOwnerId = getCurrentWastelandOwnerId();
  for (const { claim, patch } of expirationPlan.expired) {
    setWastelandClaimStatus(claim, patch);
  }
  plot.claims = expirationPlan.active;
  for (const { claim } of expirationPlan.expired) {
    removeWastelandClaimFences(claim);
    if (claim.ownerId === currentOwnerId) {
      showUI("개간 기한이 만료되어 울타리 기둥이 철거되었습니다.", 1300);
      lastMessageUntil = performance.now() + 1300;
    }
  }
  finalizeWastelandStateTransition({
    closeCancel: true,
    updateClaimUi: true,
    save: true,
  });
}

function expireOverdueWastelandDraftReservations() {
  const plot = ensureFrontierWastelandRuntimeState();
  if (!plot?.claimDrafts?.size) return;
  const now = Date.now();
  const currentOwnerId = getCurrentWastelandOwnerId();
  const expiredDrafts = getExpiredWastelandDraftReservationsFromModule(plot.claimDrafts, now);
  let changed = false;
  for (const [ownerId, draft] of expiredDrafts) {
    draft.phase = WASTELAND_DRAFT_PHASE.EXPIRED;
    for (const key of draft.postKeys) {
      const post = plot.fencePosts.get(key);
      if (post?.mesh?.parent) {
        disposeObject3D(post.mesh);
        post.mesh.parent.remove(post.mesh);
      }
      plot.fencePosts.delete(key);
    }
    plot.claimDrafts.delete(ownerId);
    changed = true;
    if (ownerId === currentOwnerId) {
      showUI("토지 선언 예약이 만료되어 울타리 기둥이 해제되었습니다.", 1300);
      lastMessageUntil = performance.now() + 1300;
    }
  }
  if (!changed) return;
  finalizeWastelandStateTransition({
    rebuildLinks: true,
    closeConfirm: true,
    refreshDraftUi: true,
    updateInventory: true,
    save: true,
  });
}

function getCurrentWastelandClaimProgress() {
  const claim = getCurrentFrontierWastelandClaim();
  return getWastelandClaimProgressFromModule(claim, getWastelandCellById);
}

function getWastelandClaimPhase(progress = getCurrentWastelandClaimProgress()) {
  return getWastelandClaimPhaseStateFromModule({
    progress,
    claimStatuses: WASTELAND_CLAIM_STATUS,
    claimPhases: WASTELAND_CLAIM_PHASE,
  });
}

function setWastelandClaimStatus(claim, patch) {
  if (!claim) return null;
  Object.assign(claim, patch);
  return claim;
}

function canCompleteWastelandClaim(progress) {
  return canCompleteWastelandClaimStateFromModule(progress, getCurrentWastelandOwnerId());
}

function completeCurrentWastelandClaim() {
  const progress = getCurrentWastelandClaimProgress();
  const claim = progress?.claim;
  const issuedEntry = claim ? findIssuedWastelandLandDeed(claim.landId) : null;
  const rewardPlan = wastelandRuntime.getClaimCompletionRewardPlan({
    canComplete: canCompleteWastelandClaim(progress),
    hasIssuedDeed: Boolean(issuedEntry),
  });
  if (!rewardPlan.ok) {
    showUI("아직 완료할 수 없습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  const rewardIssuedAt = Date.now();
  if (rewardPlan.action === "confirm-issued") {
    setWastelandClaimStatus(claim, wastelandRuntime.createClaimStatusPatch(
      WASTELAND_CLAIM_STATUS.COMPLETED,
      "",
      rewardIssuedAt,
      {
      completedAt: claim.completedAt || rewardIssuedAt,
      rewardItemId: WASTELAND_LAND_DEED_ITEM_ID,
      rewardIssuedAt: claim.rewardIssuedAt || rewardIssuedAt,
      }
    ));
    removeWastelandClaimFences(claim);
    finalizeWastelandStateTransition({
      updateClaimUi: true,
      updateInventory: true,
      save: true,
    });
    saveActiveLocalProfileState();
    showUI("이미 지급된 토지권을 확인했습니다.", 1400);
    lastMessageUntil = performance.now() + 1400;
    return true;
  }
  const deedEntry = createWastelandLandDeedEntry(claim);
  if (!addInventoryEntry(deedEntry)) {
    finalizeWastelandStateTransition({
      updateClaimUi: true,
      updateInventory: true,
    });
    showUI("기타 아이템 슬롯을 한 칸 비워주세요.", 1400);
    lastMessageUntil = performance.now() + 1400;
    return false;
  }
  setWastelandClaimStatus(claim, wastelandRuntime.createClaimStatusPatch(
    WASTELAND_CLAIM_STATUS.COMPLETED,
    "completedAt",
    rewardIssuedAt,
    {
      rewardItemId: WASTELAND_LAND_DEED_ITEM_ID,
      rewardIssuedAt,
    }
  ));
  removeWastelandClaimFences(claim);
  finalizeWastelandStateTransition({
    updateClaimUi: true,
    updateInventory: true,
    save: true,
  });
  saveActiveLocalProfileState();
  showUI(`개간 완료! ${deedEntry.displayName} 토지권을 획득했습니다.`, 1400);
  lastMessageUntil = performance.now() + 1400;
  return true;
}

function canCancelWastelandClaim(progress) {
  return canCancelWastelandClaimStateFromModule(progress, getCurrentWastelandOwnerId());
}

function cancelCurrentWastelandClaim() {
  const plot = ensureFrontierWastelandRuntimeState();
  const claim = getCurrentFrontierWastelandClaim();
  const cancellationPlan = wastelandRuntime.getClaimCancellationPlan({
    claim: plot ? claim : null,
    completedStatus: WASTELAND_CLAIM_STATUS.COMPLETED,
  });
  if (!cancellationPlan.ok) {
    closeWastelandClaimCancelDialog();
    showUI("취소할 수 있는 확정 구역이 없습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  setWastelandClaimStatus(cancellationPlan.claim, wastelandRuntime.createClaimStatusPatch(
    WASTELAND_CLAIM_STATUS.CANCELLED,
    "cancelledAt",
    Date.now()
  ));
  removeWastelandClaimFences(cancellationPlan.claim);
  plot.claims = plot.claims.filter((entry) => entry !== cancellationPlan.claim);
  finalizeWastelandStateTransition({
    closeCancel: true,
    updateClaimUi: true,
    save: true,
  });
  showUI("개간 구역 확정을 취소했습니다.", 1100);
  lastMessageUntil = performance.now() + 1100;
  return true;
}

function updateWastelandClaimCompleteButton(progress) {
  if (!wastelandClaimCompleteBtn) return;
  wastelandClaimCompleteBtn.style.display = canCompleteWastelandClaim(progress) ? "block" : "none";
}

function updateWastelandClaimCancelButton(progress) {
  if (!wastelandClaimAbortBtn) return;
  wastelandClaimAbortBtn.style.display = canCancelWastelandClaim(progress) ? "block" : "none";
}

function updateWastelandClaimActionUi(progress = getCurrentWastelandClaimProgress()) {
  updateWastelandClaimCompleteButton(progress);
  updateWastelandClaimCancelButton(progress);
  if (!progress?.claim) {
    closeWastelandClaimCancelDialog();
  }
}

wastelandClaimCompleteBtn.addEventListener("click", () => {
  completeCurrentWastelandClaim();
});

wastelandClaimAbortBtn.addEventListener("click", () => {
  openWastelandClaimCancelDialog();
});

function toggleWastelandFencePlacementMode() {
  if (!getCurrentWastelandOwnerId()) {
    showUI("울타리 기둥 설치는 지갑 로그인이 필요합니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return;
  }
  if (!hasItem("fencePost")) {
    showUI("울타리 기둥이 없습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return;
  }
  if (getCurrentFrontierWastelandClaim()) {
    showUI("이미 확정된 개간 구역이 있습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return;
  }
  const fencePlacementMode = wastelandController.toggleFencePlacementMode();
  if (!fencePlacementMode) {
    clearWastelandClaimPreview();
  }
  showUI(
    fencePlacementMode ? "울타리 기둥 설치 모드" : "울타리 기둥 설치 모드 해제",
    1000
  );
  lastMessageUntil = performance.now() + 1000;
  updateInventoryUI();
  if (fencePlacementMode) {
    updateFrontierWastelandDraftPrompt();
  }
}

function removeColliderAt(idx) {
  colliderRegistry.removeAt(idx);
}

function getWastelandClaimHudStatusText(progress) {
  const claimPhase = getWastelandClaimPhase(progress);
  if (claimPhase === WASTELAND_CLAIM_PHASE.COMPLETED) return "개간 완료 | 토지권 지급 완료";
  if (claimPhase === WASTELAND_CLAIM_PHASE.REWARD_PENDING) {
    return `완료 가능 | 남은 시간 ${formatWastelandClaimRemaining(progress.claim.expiresAt - Date.now())}`;
  }
  if (claimPhase === WASTELAND_CLAIM_PHASE.FAILED) return "개간 실패 | 기한 만료";
  return `개간률 ${progress.percent.toFixed(1)}% | 남은 시간 ${formatWastelandClaimRemaining(progress.claim.expiresAt - Date.now())}`;
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
let airDepletedNoticeUntil = 0;
const mapPollutionFields = {};
const mapPurificationProgress = {
  "폐광": 0,
  "개척지": 0,
};
const airRuntime = createAirRuntime({
  initialAir: playerAirCurrent,
  maxAir: playerAirMax,
  mapPurificationProgress,
  mapPollutionConfig: MAP_POLLUTION_CONFIG,
  hasItem,
  consumeItem,
  getItemCount,
  onAirChanged: (nextAir) => { playerAirCurrent = nextAir; },
});
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

function createDefaultResidenceNoticeBoardState() {
  return createDefaultResidenceNoticeBoardStateFromModule(RESIDENCE_NOTICE_BOARD_KEYS);
}

function normalizeResidenceNoticeBoardEntry(key, rawEntry) {
  return normalizeResidenceNoticeBoardEntryFromModule(key, rawEntry);
}

function normalizeResidenceNoticeBoardState(rawState) {
  return normalizeResidenceNoticeBoardStateFromModule(RESIDENCE_NOTICE_BOARD_KEYS, rawState);
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

function getFrontierBoothInteractionPlan(interactable) {
  return getFrontierBoothInteractionPlanFromModule(interactable, getSelectedFrontierParcelLabel(), {
    canManageShopSlot: canManageFrontierShopSlot,
    canUseShopSlot: canUseFrontierShopSlot,
    canManageDisplaySlot: canManageFrontierDisplaySlot,
    canUseDisplaySlot: canUseFrontierDisplaySlot,
  });
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

const frontierSceneController = createFrontierSceneController({
  interactables,
  scene,
  getMarkers: getFrontierParcelBoothInteractables,
  setMarkers: (parcelLabel, markers) => { frontierParcelBoothInteractables[parcelLabel] = markers; },
  getColliders: getFrontierConstructionColliders,
  setColliders: (parcelLabel, colliders) => { frontierParcelConstructionColliders[parcelLabel] = colliders; },
  getTrackedColliderIndex,
  removeColliderAt,
});

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
  frontierSceneController.clearColliders(parcelLabel);
}

function clearFrontierParcelBoothMarkers(parcelLabel) {
  frontierSceneController.clearMarkers(parcelLabel);
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
  return buildFrontierBuildingSignFromModule(text);
}

function buildFrontierBoothLabel(titleText, statusText) {
  return buildFrontierBoothLabelFromModule(titleText, statusText);
}

function buildFrontierBoothProductVisual(itemId, quantity = 0) {
  return buildFrontierBoothProductVisualFromModule(itemId, quantity, { itemDefs: ITEM_DEFS });
}

function buildFrontierDisplayBoothVisual(entry) {
  return buildFrontierDisplayBoothVisualFromModule(entry, {
    itemDefs: ITEM_DEFS,
    normalizeInventorySlotEntry,
    isNftInventoryEntry,
    getSlotItemId,
    getInventoryEntryDisplayIcon,
    getInventoryEntryDisplayName,
  });
}

function registerFrontierBoothMarker(parcelLabel, type, title, x, y, z, slotKey = "") {
  return frontierSceneController.registerBoothMarker({ parcelLabel, type, title, x, y, z, slotKey });
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
  return airRuntime.getPollutionConfig(mapId);
}

function isPollutedMap(mapId = currentMapId) {
  return airRuntime.isPollutedMap(mapId);
}

function getMapPurificationValue(mapId = currentMapId) {
  return airRuntime.getPurification(mapId);
}

function setMapPurificationValue(mapId, value) {
  airRuntime.setPurification(mapId, value);
}

function resetAllMapPurificationValues() {
  resetAllMapPurificationValuesFromModule(mapPurificationProgress, MAP_POLLUTION_CONFIG);
}

function getCurrentAirDrainPerSecond() {
  return airRuntime.getHudState(getEffectiveAirMapId()).drainPerSecond;
}

function canRecoverAirInMap(mapId = currentMapId) {
  return airRuntime.getHudState(mapId).recoverable;
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
  const pollutionField = createPollutionField({
    centerX,
    centerZ,
    halfSize,
    particleCount: CAVE_POLLUTION_PARTICLE_COUNT,
    random: randRange,
  });
  const { field } = pollutionField;
  scene.add(field);
  mapPollutionFields[mapId] = pollutionField;
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
      updatePollutionFieldPositions({
        positions,
        base: pollutionField.base,
        phase: pollutionField.phase,
        time,
        strength: pollutionField.strength,
        particleSway: CAVE_POLLUTION_PARTICLE_SWAY,
      });
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
  const result = airRuntime.useAirCanister();
  if (!result.ok && result.reason === "missing-canister") {
    showUI("신선한 공기 캔이 없습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
  if (!result.ok && result.reason === "air-full") {
    showUI("공기 게이지가 이미 가득 찼습니다.", 900);
    lastMessageUntil = performance.now() + 900;
    return false;
  }
  if (!result.ok) {
    showUI("신선한 공기 캔을 사용할 수 없습니다.", 1000);
    lastMessageUntil = performance.now() + 1000;
    return false;
  }
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
  return getDefaultRefineryRecipeFromModule();
}

function getRefineryRecipeEntries() {
  return getRefineryRecipeEntriesFromModule();
}

function getSelectedRefineryRecipe() {
  return getSelectedRefineryRecipeFromModule(refinerySelectedRecipeId);
}

function getRefineryRecipeDescription(recipe) {
  return getRefineryRecipeDescriptionFromModule(recipe, {
    isBuildPartItemId: isWastelandBuildPartItemId,
    itemDefs: ITEM_DEFS,
  });
}

function getRefineryHintText() {
  if (workstationUiController.isRefineryOpen()) return "재련대 이용 중";
  return "E : 작업대 사용";
}

function tryUseRefineryRecipe(recipe = getSelectedRefineryRecipe()) {
  const result = workstationRuntime.craftRefineryRecipe(recipe);
  if (!result.ok) {
    if (result.kind === "plan" && result.plan.reason) {
      showUI(result.plan.reason, result.plan.duration);
      lastMessageUntil = performance.now() + result.plan.duration;
    } else if (result.kind === "consume") {
      showUI("재련 재료를 소모하지 못했습니다.", 1000);
      lastMessageUntil = performance.now() + 1000;
    } else if (result.kind === "inventory-full") {
      showUI("인벤토리가 가득 차 재련할 수 없습니다.", 1100);
      lastMessageUntil = performance.now() + 1100;
    }
    return true;
  }
  refinerySuccessMessage = result.success.message;
  refinerySuccessUntil = result.success.until;
  updateInventoryUI();
  schedulePlayerSaveSync(true);
  showUI(refinerySuccessMessage, 1000);
  lastMessageUntil = performance.now() + 1000;
  if (workstationUiController.isRefineryOpen()) {
    renderRefineryWindow();
    setTimeout(() => {
      if (workstationUiController.isRefineryOpen()) renderRefineryWindow();
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
  return getAirPurifierHintTextFromModule({
    config: cfg,
    purification: purify,
    currentMapId,
    mapId,
    powderCount: getItemCount("purifyPowder"),
  });
}

function tryUseAirPurifier(mapId = "폐광") {
  const result = airRuntime.usePurifier(mapId);
  if (!result.ok && result.reason === "missing-config") return false;
  const cfg = result.config;
  if (!result.ok && result.reason === "already-purified") {
    showUI(`${cfg.displayName} 공기 정화탑 가동이 이미 완료되었습니다.`, 1100);
    lastMessageUntil = performance.now() + 1100;
    return true;
  }
  if (!result.ok && result.reason === "missing-powder") {
    showUI(`정화 가루 ${cfg.purifierPowderCost}개가 필요합니다.`, 1100);
    lastMessageUntil = performance.now() + 1100;
    return true;
  }
  const nextPurify = result.purification;
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
  const entryPlan = getMansionRoomEntryPlan(roomKey, { x: 0, z: 0 }, player.position.y);
  destroyMansionRoomInstance(entryPlan.roomToDestroy);
  const instance = createMansionRoomInstance(entryPlan.activeRoomKey);
  const targetRoomRoot = instance?.root;
  if (!targetRoomRoot) return false;
  const targetPlan = getMansionRoomEntryPlan(roomKey, targetRoomRoot.position, player.position.y);
  mansionOneActiveRoomKey = targetPlan.activeRoomKey;
  player.position.set(targetPlan.position.x, targetPlan.position.y, targetPlan.position.z);
  player.rotation.y = targetPlan.rotationY;
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
  snapCameraToPlayer();
  showUI(`Mansion ONE ${mansionOneActiveRoomKey}호 입장`, 1000);
  return true;
}

function exitMansionOneRoom() {
  const exitPlan = getMansionRoomExitPlan(mansionOneActiveRoomKey, mansionOneExteriorReturn, player.position.y);
  workstationUiController.closeSleep();
  setMansionSleepOpen(false);
  setPersonalStorageOpen(false);
  player.position.set(exitPlan.position.x, exitPlan.position.y, exitPlan.position.z);
  player.rotation.y = exitPlan.rotationY;
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
  snapCameraToPlayer();
  destroyMansionRoomInstance(exitPlan.roomToDestroy);
  showUI("Mansion ONE 외부로 나왔습니다.", 1000);
  return true;
}

function setMansionSleepOpen(v) {
  const sleepState = workstationUiController.setSleepOpen(v);
  if (!mansionSleepOverlay || !mansionSleepDialog) return;
  mansionSleepOverlay.style.display = sleepState.sleepOpen ? "block" : "none";
  mansionSleepDialog.style.display = sleepState.sleepOpen ? "block" : "none";
}

function openMansionSleepDialog() {
  const bedInteractable =
    activeInteractable?.type === "mansionBed" ? activeInteractable : mansionOneBedInteractable;
  if (!bedInteractable) return;
  const sleepPlan = getMansionSleepPlan(bedInteractable.obj.position, player.position.y);
  mansionSleepWakePoint = sleepPlan.wakePoint;
  player.position.set(sleepPlan.sleepPosition.x, sleepPlan.sleepPosition.y, sleepPlan.sleepPosition.z);
  player.rotation.y = sleepPlan.rotationY;
  latestMoveDir.copy(getFacingDirectionFromYaw(player.rotation.y));
  workstationUiController.openSleepDialog();
  snapCameraToPlayer();
  setMansionSleepOpen(true);
}

function closeMansionSleepDialog() {
  workstationUiController.closeSleep();
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
  const { depletedThisFrame } = airRuntime.updateFrame(dt, effectiveMapId);
  if (depletedThisFrame && performance.now() > airDepletedNoticeUntil) {
    showUI("공기가 바닥났습니다. R로 신선한 공기 캔을 사용하세요.", 1200);
    airDepletedNoticeUntil = performance.now() + 2200;
  }

  updateAirHud();
}
let mapTransitionLockUntil = 0;
let mapTransitionPending = null;
let refinerySelectedRecipeId = "purifyPowder";
let refinerySuccessUntil = 0;
let refinerySuccessMessage = "";
const FORGE_UPGRADE_DELAY_MS = 1050;
let forgePendingUpgrade = null;
let forgeLastResult = null;
const workstationRuntime = createWorkstationRuntime({
  createRefineryCraftPlan: createRefineryCraftPlanFromModule,
  createForgeUpgradeAttemptPlan,
  createForgeUpgradeResultPlan,
  consumeItem,
  addItem,
  getItemCount,
  getItemName: (itemId) => ITEM_DEFS[itemId]?.name,
});

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
  const access = getFrontierShopRegistrationAccessFromModule({
    buildState: getFrontierBuildState(parcelLabel),
    assignedWallet: getFrontierShopAssignedWallet(parcelLabel),
    canUse: canUseFrontierShopSlot(parcelLabel),
  });
  if (!access.ok) {
    showUI(access.reason, 1000);
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
  const shopState = getFrontierShopOperation(parcelLabel);
  const result = frontierRuntime.clearShopListing({
    parcelLabel,
    canEdit: canEditFrontierShopListing(parcelLabel),
    shopState,
    addItem,
  });
  if (!result.ok) {
    if (result.reason === "inventory-full") {
      showUI("인벤토리가 가득 차 판매 물품을 회수할 수 없습니다.", 1200);
      lastMessageUntil = performance.now() + 1200;
    } else if (result.reason) {
      showUI(result.reason, result.duration);
      lastMessageUntil = performance.now() + result.duration;
    }
    return false;
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
  const shopState = getFrontierShopOperation(parcelLabel);
  const inventorySnapshot = inventory.slots.map((slot) => (slot ? structuredClone(slot) : null));
  const purchase = frontierRuntime.purchaseShopListing({
    parcelLabel,
    shopState,
    quantity,
    currentWallet: getCurrentFrontierWalletAddress(),
    canAffordPlayerCredits,
    addEntry: (itemId, count) => addEntryToInventory(createInventorySlotEntry(itemId, count), count),
    spendCredits: spendPlayerCredits,
    restoreInventory: () => {
      for (let i = 0; i < inventory.slots.length; i += 1) inventory.slots[i] = inventorySnapshot[i];
    },
    restoreCredits: grantPlayerCredits,
    getStatusText: formatFrontierShopStatusText,
  });
  if (!purchase.ok) {
    const messages = {
      "inventory-full": "인벤토리 공간이 부족합니다.",
      "credit-failed": "개척 코인을 차감하지 못했습니다.",
      "seller-missing": "판매자 정보를 찾을 수 없습니다.",
    };
    return { ...purchase, reason: messages[purchase.reason] ?? purchase.reason };
  }
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  updateInventoryUI();
  schedulePlayerSaveSync(true);
  if (frontierBuildOpen) renderFrontierBuildWindow();
  return {
    ok: true,
    itemName: ITEM_DEFS[purchase.plan.purchasedItemId]?.name ?? purchase.plan.purchasedItemId,
    totalPrice: purchase.plan.totalPrice,
  };
}

function commitFrontierShopListing() {
  const parcelLabel = frontierShopRegisterParcelLabel || getSelectedFrontierParcelLabel();
  const shopState = getFrontierShopOperation(parcelLabel);
  const listing = frontierRuntime.registerShopListing({
    parcelLabel,
    canRegister: canRegisterFrontierShopListing(parcelLabel),
    itemId: frontierShopRegisterSelectedItemId,
    quantity: frontierShopQuantityInput.value,
    price: frontierShopPriceInput.value,
    ownedCount: getItemCount(frontierShopRegisterSelectedItemId),
    shopState,
    sellerWallet: getCurrentFrontierWalletAddress(),
    getStatusText: formatFrontierShopStatusText,
    addItem,
    consumeItem,
  });
  if (!listing.ok) {
    const fallbackMessages = {
      "inventory-full-previous": "기존 판매 물품을 회수할 인벤토리 공간이 부족합니다.",
      "consume-failed": "판매 물품을 등록하지 못했습니다.",
    };
    const message = fallbackMessages[listing.reason] ?? listing.reason;
    if (message) {
      showUI(message, listing.duration ?? 1000);
      lastMessageUntil = performance.now() + (listing.duration ?? 1000);
    }
    return false;
  }
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
  const shopState = getFrontierShopOperation(parcelLabel);
  const assignment = frontierRuntime.assignShopUser({
    canManage: canManageFrontierShopSlot(parcelLabel),
    walletAddress,
    shopState,
    normalizeWalletAddress: normalizeFrontierWalletAddress,
  });
  if (!assignment.ok) {
    if (assignment.reason) {
      showUI(assignment.reason, assignment.duration);
      lastMessageUntil = performance.now() + assignment.duration;
    }
    return false;
  }
  schedulePlayerSaveSync(true);
  renderFrontierBuildWindow();
  showUI(`상점 사용자를 ${shortenWalletAddress(assignment.plan.walletAddress)}(으)로 지정했습니다.`, 1100);
  lastMessageUntil = performance.now() + 1100;
  return true;
}

function clearFrontierShopSlotUser(parcelLabel) {
  const shopState = getFrontierShopOperation(parcelLabel);
  const cleared = frontierRuntime.clearShopUser({
    canManage: canManageFrontierShopSlot(parcelLabel),
    shopState,
  });
  if (!cleared.ok) {
    if (cleared.reason) {
      showUI(cleared.reason, cleared.duration);
      lastMessageUntil = performance.now() + cleared.duration;
    }
    return false;
  }
  schedulePlayerSaveSync(true);
  renderFrontierBuildWindow();
  showUI("상점 사용자를 해제했습니다.", 1000);
  lastMessageUntil = performance.now() + 1000;
  return true;
}

function updateFrontierShopListingPrice(parcelLabel, nextPrice) {
  const shopState = getFrontierShopOperation(parcelLabel);
  const priceUpdate = frontierRuntime.updateShopPrice({
    parcelLabel,
    canEdit: canEditFrontierShopListing(parcelLabel),
    shopState,
    nextPrice,
    getStatusText: formatFrontierShopStatusText,
  });
  if (!priceUpdate.ok) return false;
  rebuildFrontierParcelConstructionVisual(parcelLabel);
  schedulePlayerSaveSync(true);
  renderFrontierBoothDialog();
  if (frontierBuildOpen) renderFrontierBuildWindow();
  showUI(`판매 가격을 ${priceUpdate.plan.price}원으로 수정했습니다.`, 1000);
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
  if (v && workstationUiController.isRefineryOpen()) {
    setRefineryOpen(false);
  }
  const forgeOpen = workstationUiController.setForgeOpen(v).forgeOpen;
  forgeOverlay.style.display = forgeOpen ? "block" : "none";
  forgeWin.style.display = forgeOpen ? "block" : "none";
  if (workstationUiController.isForgeOpen()) renderForgeWindow();
}

function renderRefineryItemCard(card, heading, itemId, count, description, accentColor = "#2f1700") {
  card.innerHTML = "";
  card.style.display = "grid";
  card.style.gridTemplateRows = "auto 124px auto 1fr";
  card.style.justifyItems = "center";
  card.style.alignItems = "start";

  const title = document.createElement("div");
  title.textContent = heading;
  title.style.fontSize = "22px";
  title.style.fontWeight = "800";
  title.style.color = "rgba(70,70,70,0.88)";
  title.style.marginBottom = "10px";
  title.style.textAlign = "center";
  card.appendChild(title);

  const visualWrap = document.createElement("div");
  visualWrap.style.width = "124px";
  visualWrap.style.height = "124px";
  visualWrap.style.borderRadius = "22px";
  visualWrap.style.background = "linear-gradient(180deg, rgba(246,246,246,0.96), rgba(224,224,224,0.9))";
  visualWrap.style.border = "1px solid rgba(0,0,0,0.12)";
  visualWrap.style.display = "flex";
  visualWrap.style.alignItems = "center";
  visualWrap.style.justifyContent = "center";
  visualWrap.style.flex = "0 0 auto";
  visualWrap.appendChild(createItemVisualElement(itemId, { size: 96 }));
  card.appendChild(visualWrap);

  const name = document.createElement("div");
  name.textContent = ITEM_DEFS[itemId]?.name ?? itemId;
  name.style.marginTop = "14px";
  name.style.fontSize = "20px";
  name.style.fontWeight = "900";
  name.style.color = "#222";
  name.style.textAlign = "center";
  card.appendChild(name);

  const countLabel = document.createElement("div");
  countLabel.textContent = `${count}`;
  countLabel.style.marginTop = "12px";
  countLabel.style.fontSize = "68px";
  countLabel.style.lineHeight = "0.95";
  countLabel.style.fontWeight = "900";
  countLabel.style.color = accentColor;
  card.appendChild(countLabel);

  if (description) {
    const detail = document.createElement("div");
    detail.style.alignSelf = "end";
    detail.style.justifySelf = "stretch";
    detail.style.marginTop = "14px";
    detail.style.fontSize = "12px";
    detail.style.lineHeight = "1.45";
    detail.style.color = "#555";
    detail.style.textAlign = "center";
    detail.textContent = description;
    card.appendChild(detail);
  }
}

function setRefineryOpen(v) {
  if (v && frontierBuildOpen) {
    setFrontierBuildOpen(false);
  }
  if (v && workstationUiController.isForgeOpen()) {
    setForgeOpen(false);
  }
  const refineryOpen = workstationUiController.setRefineryOpen(v).refineryOpen;
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
    btn.style.padding = "10px";
    btn.style.background = isActive
      ? "linear-gradient(180deg, rgba(255,222,182,0.92), rgba(255,240,220,0.92))"
      : "rgba(255,255,255,0.94)";
    btn.style.cursor = "pointer";
    btn.innerHTML = `
      <div style="font-size:13px;font-weight:800;color:#222;">${recipe.label}</div>
      <div style="margin-top:5px;font-size:11px;line-height:1.45;color:#555;">${inputName} ${recipe.inputCount}개 → ${ITEM_DEFS[recipe.outputItemId]?.name ?? recipe.outputItemId} ${recipe.outputCount}개</div>
    `;
    btn.addEventListener("click", () => {
      refinerySelectedRecipeId = recipe.id;
      renderRefineryWindow();
    });
    refineryRecipeList.appendChild(btn);
  }

  refineryTitle.textContent = "작업대";

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
    "재료",
    selectedRecipe.inputItemId,
    selectedRecipe.inputCount,
    "",
    canCraft ? "#2f6a1e" : "#8b2f2f"
  );
  renderRefineryItemCard(
    refineryOutputCard,
    "결과",
    selectedRecipe.outputItemId,
    selectedRecipe.outputCount,
    "",
    "#7a4a12"
  );

  refineryInfo.innerHTML = "";
  const infoCards = [
    { label: "보유 재료", value: `${inputName} ${inputOwned}개` },
    { label: "현재 보유", value: `${outputName} ${outputOwned}개` },
  ];
  for (const entry of infoCards) {
    const card = document.createElement("div");
    card.style.padding = "12px 14px";
    card.style.borderRadius = "10px";
    card.style.background = "rgba(255,255,255,0.92)";
    card.style.border = "1px solid rgba(0,0,0,0.12)";
    card.style.height = "88px";
    card.style.boxSizing = "border-box";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.justifyContent = "center";
    card.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:rgba(70,70,70,0.74);margin-bottom:6px;">${entry.label}</div>
      <div style="font-size:24px;font-weight:900;color:#242424;line-height:1.1;">${entry.value}</div>
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
      ? getRefineryRecipeDescription(selectedRecipe)
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
  card.style.display = "grid";
  card.style.gridTemplateRows = "auto 1fr";
  card.style.justifyItems = "center";
  card.style.alignItems = "stretch";

  const title = document.createElement("div");
  title.textContent = heading;
  title.style.fontSize = "14px";
  title.style.fontWeight = "700";
  title.style.color = "rgba(70,70,70,0.76)";
  title.style.marginBottom = "10px";
  title.style.textAlign = "center";
  card.appendChild(title);

  if (!itemId || !stats) {
    const empty = document.createElement("div");
    empty.style.display = "flex";
    empty.style.alignItems = "center";
    empty.style.justifyContent = "center";
    empty.style.height = "100%";
    empty.style.fontSize = "13px";
    empty.style.lineHeight = "1.6";
    empty.style.color = "#555";
    empty.style.textAlign = "center";
    empty.innerHTML = emptyText;
    card.appendChild(empty);
    return;
  }

  const content = document.createElement("div");
  content.style.display = "flex";
  content.style.flexDirection = "column";
  content.style.alignItems = "center";
  content.style.justifyContent = "center";
  content.style.gap = "12px";
  content.style.height = "100%";
  card.appendChild(content);

  const visualWrap = document.createElement("div");
  visualWrap.style.width = "104px";
  visualWrap.style.height = "104px";
  visualWrap.style.borderRadius = "22px";
  visualWrap.style.background = "linear-gradient(180deg, rgba(246,246,246,0.96), rgba(224,224,224,0.9))";
  visualWrap.style.border = "1px solid rgba(0,0,0,0.12)";
  visualWrap.style.display = "flex";
  visualWrap.style.alignItems = "center";
  visualWrap.style.justifyContent = "center";
  visualWrap.style.flex = "0 0 auto";
  visualWrap.appendChild(createForgeUpgradeVisualElement(itemId, level, 80));
  content.appendChild(visualWrap);

  const name = document.createElement("div");
  name.textContent = `${ITEM_DEFS[itemId]?.name ?? itemId} Lv.${level}`;
  name.style.fontSize = "24px";
  name.style.fontWeight = "900";
  name.style.color = "#222";
  name.style.textAlign = "center";
  content.appendChild(name);
}

function formatForgeMiningPower(stats) {
  if (!stats) return "-";
  return `${stats.miningPowerMin.toFixed(2)}~${stats.miningPowerMax.toFixed(2)}`;
}

function formatForgeBonusDropChance(stats) {
  if (!stats) return "-";
  return `${Math.round((stats.bonusDropChance ?? 0) * 100)}%`;
}

function formatForgeSwingDuration(stats) {
  if (!stats) return "-";
  return `${stats.swingDuration.toFixed(3)}초`;
}

function finishPendingForgeUpgrade() {
  const completed = workstationRuntime.finishForgeUpgrade();
  if (!completed) return;
  const { pending, resultPlan } = completed;
  forgePendingUpgrade = workstationRuntime.pendingForgeUpgrade;
  const success = resultPlan.success;

  if (success && pending.itemId === "pickaxe") {
    const equippedPickaxeEntry = getEquippedInventoryEntry("tool");
    if (equippedPickaxeEntry && getSlotItemId(equippedPickaxeEntry) === "pickaxe") {
      equippedPickaxeEntry.pickaxeLevel = pending.targetLevel;
      if (!Number.isFinite(inventory.pickaxeLevel) || inventory.pickaxeLevel < pending.targetLevel) {
        inventory.pickaxeLevel = pending.targetLevel;
      }
    } else {
      inventory.pickaxeLevel = pending.targetLevel;
    }
  }

  forgeLastResult = completed.result;

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
    workstationUiController.isForgeOpen() &&
    getForgeDistance() < 2.4 &&
    Boolean(upgradeState) &&
    Boolean(next) &&
    stoneDustCount >= next.cost &&
    !isProcessing;

  forgeTitle.textContent = "장비 강화";
  forgeTargetList.innerHTML = "";
  const forgeTargets = [
    {
      itemId: "pickaxe",
      label: ITEM_DEFS.pickaxe?.name ?? "곡괭이",
      summary: "돌가루로 채굴 장비를 강화합니다.",
      active: getForgeTargetItemId() === "pickaxe",
    },
  ];
  for (const target of forgeTargets) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.style.width = "100%";
    btn.style.textAlign = "left";
    btn.style.border = target.active ? "1px solid rgba(255,140,0,0.78)" : "1px solid rgba(0,0,0,0.14)";
    btn.style.borderRadius = "12px";
    btn.style.padding = "12px";
    btn.style.background = target.active
      ? "linear-gradient(180deg, rgba(255,222,182,0.92), rgba(255,240,220,0.92))"
      : "rgba(255,255,255,0.94)";
    btn.style.cursor = "pointer";
    btn.innerHTML = `
      <div style="font-size:14px;font-weight:800;color:#222;">${target.label}</div>
      <div style="margin-top:6px;font-size:12px;line-height:1.5;color:#555;">${target.summary}</div>
    `;
    btn.addEventListener("click", () => {
      renderForgeWindow();
    });
    forgeTargetList.appendChild(btn);
  }

  renderForgeItemCard(
    forgeCurrentCard,
    "현재 장비",
    upgradeState?.itemId ?? null,
    upgradeState?.level ?? 0,
    upgradeState?.current ?? null,
    "현재 착용 중인 강화 가능 장비가 없습니다.<br>장비창에서 곡괭이를 먼저 장착해보세요."
  );

  forgeChanceValue.textContent = isProcessing ? "진행 중" : (next ? "강화 실행" : "최대 단계");
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

  forgeStatCompare.innerHTML = "";
  const statRows = next
    ? [
        { label: "채굴력", current: formatForgeMiningPower(stats), next: formatForgeMiningPower(next) },
        { label: "추가 드랍 확률", current: formatForgeBonusDropChance(stats), next: formatForgeBonusDropChance(next) },
        { label: "속도", current: formatForgeSwingDuration(stats), next: formatForgeSwingDuration(next) },
      ]
    : [
        { label: "채굴력", current: formatForgeMiningPower(stats), next: "MAX" },
        { label: "추가 드랍 확률", current: formatForgeBonusDropChance(stats), next: "MAX" },
        { label: "속도", current: formatForgeSwingDuration(stats), next: "MAX" },
      ];
  for (const row of statRows) {
    const card = document.createElement("div");
    card.style.padding = "14px 16px";
    card.style.borderRadius = "10px";
    card.style.background = "rgba(255,255,255,0.92)";
    card.style.border = "1px solid rgba(0,0,0,0.12)";
    card.style.boxSizing = "border-box";
    card.style.height = "88px";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.justifyContent = "center";
    card.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:rgba(70,70,70,0.74);margin-bottom:6px;">${row.label}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;font-size:22px;font-weight:900;color:#242424;line-height:1.1;">
        <span>${row.current}</span>
        <span style="color:#9b6f2b;">&gt;</span>
        <span style="color:#9b6f2b;">${row.next}</span>
      </div>
    `;
    forgeStatCompare.appendChild(card);
  }

  forgeInfo.innerHTML = "";
  const infoCards = [
    { label: "보유 돌가루", value: `${stoneDustCount}` },
    { label: "필요 돌가루", value: next ? `${next.cost}` : "0" },
    { label: "강화 성공 확률", value: next ? `${Math.round((next.successChance ?? 1) * 100)}%` : "MAX" },
  ];
  for (const entry of infoCards) {
    const card = document.createElement("div");
    card.style.padding = "12px 14px";
    card.style.borderRadius = "10px";
    card.style.background = "rgba(255,255,255,0.92)";
    card.style.border = "1px solid rgba(0,0,0,0.12)";
    card.style.height = "88px";
    card.style.boxSizing = "border-box";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.justifyContent = "center";
    card.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:rgba(70,70,70,0.74);margin-bottom:6px;">${entry.label}</div>
      <div style="font-size:24px;font-weight:900;color:#242424;">${entry.value}</div>
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
    forgeNotice.textContent = "현재 착용 중인 강화 가능 장비가 없습니다. 장비창에서 곡괭이를 먼저 장착해보세요.";
  } else if (!next) {
    forgeNotice.textContent = `더 이상 강화할 수 없습니다. 현재 ${forgeItemName}는 최고 단계입니다.`;
  } else if (stoneDustCount < next.cost) {
    forgeNotice.textContent = `강화에는 돌가루 ${next.cost}개가 필요합니다. 광산에서 더 채굴해오세요.`;
  } else {
    forgeNotice.textContent = `${forgeItemName}를 강화하면 채굴력, 추가 드랍 확률, 속도가 함께 상승합니다. 이번 강화 비용은 돌가루 ${next.cost}개입니다.`;
  }
  forgeNotice.style.color = "#444";
  forgeNotice.style.fontWeight = "500";

}

function tryUpgradeEquippedItem() {
  const upgradeState = getForgeUpgradeState();
  const result = workstationRuntime.beginForgeUpgrade(upgradeState, FORGE_UPGRADE_DELAY_MS);
  if (!result.ok) {
    if (result.plan.reason) showUI(result.plan.reason);
    return;
  }
  forgePendingUpgrade = result.pending;
  forgeLastResult = workstationRuntime.forgeLastResult;
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
const cameraOcclusionState = createCameraOcclusionState(camera.position.distanceTo(controls.target));

function snapCameraToPlayer() {
  const currentOffset = new THREE.Vector3().copy(camera.position).sub(controls.target);
  controls.target.copy(player.position).add(followTargetOffset);
  camera.position.copy(controls.target).add(currentOffset);
  lastFollowPlayerPosition.copy(player.position);
  controls.update();
}

function updateThirdPersonCameraOcclusion(dt) {
  updateThirdPersonCameraOcclusionFromModule({
    camera,
    controls,
    colliders,
    scene,
    state: cameraOcclusionState,
    dt,
    config: {
      margin: CAMERA_OCCLUSION_MARGIN,
      minDistance: CAMERA_OCCLUSION_MIN_DISTANCE,
      fadeDistance: CAMERA_OCCLUSION_FADE_DISTANCE,
      fadeOpacity: CAMERA_OCCLUSION_FADE_OPACITY,
      returnSpeed: CAMERA_OCCLUSION_RETURN_SPEED,
    },
  });
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
  return resourceWorldRuntime.registerHarvestTree(tree);
}

// 캐릭터급 바위 (충돌 포함)
function makeRock(x, z, rockSizeDef = ROCK_SIZE_DEFS[1], fadeIn = false, options = {}) {
  const defaultResourceCount = getRockDefaultResourceCount(rockSizeDef, options);
  const rock = createMineRockModel(x, z, rockSizeDef, fadeIn, options, { defaultResourceCount, randomRange: randRange });
  scene.add(rock);
  rock.userData.colliderIndex = addCollider(rock, 0.85);
  return resourceWorldRuntime.registerMineRock(rock);
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
  resourceWorldRuntime.scheduleRockRespawn(spawn);
}

function unregisterMineRock(rock) {
  resourceWorldRuntime.unregisterMineRock(rock);
}

function setHarvestTreeActive(tree, active) {
  if (active) {
    setHarvestTreeActiveFromModule(tree, true, {
      now: performance.now(),
      respawnMs: TREE_HARVEST_RESPAWN_MS,
      getCooldownUntil: getHarvestTreeCooldownUntil,
    });
    return;
  }
  resourceWorldRuntime.deactivateHarvestTree(tree);
}

function updateHarvestTrees() {
  resourceWorldRuntime.updateHarvestTreeStates();
}

function updateRockFadeIns(dt) {
  resourceWorldRuntime.updateRockFadeStates(dt);
}

function triggerHitStop(duration = HIT_STOP_DURATION) {
  miningFeedback.triggerHitStop(duration);
}

function triggerCameraShake(strength = 0.045, duration = CAMERA_SHAKE_DURATION) {
  miningFeedback.triggerCameraShake(strength, duration);
}

function triggerRockHitReaction(rock) {
  triggerRockHitReactionFromModule(rock, rockHitReactions, ROCK_HIT_REACTION_DURATION);
}

function updateRockHitReactions(dt) {
  updateRockHitReactionsFromModule(rockHitReactions, dt);
}

function applyCameraShake() {
  const offset = miningFeedback.getCameraShakeOffset();
  if (!offset) return;
  camera.position.x += offset.x;
  camera.position.y += offset.y;
  camera.position.z += offset.z;
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

  for (const position of createTreeSpawnPositions({
    count: TREE_COUNT, minX, maxX, minZ, maxZ, safeRadius, maxAttempts: 30, randomRange: randRange,
  })) makeTree(position.x, position.z);

  for (const rockSizeDef of createRockSpawnPlans(ROCK_COUNT, ROCK_SIZE_DEFS, Math.random)) {
    const spawnPos = findRockSpawnPosition(rockSizeDef.scale, 120);
    if (!spawnPos) continue;
    makeRock(spawnPos.x, spawnPos.z, rockSizeDef);
  }
}

function spawnCaveMasonryRocks() {
  for (const rockSizeDef of createRockSpawnPlans(CAVE_STONE_COUNT, ROCK_SIZE_DEFS, Math.random)) {
    const spawnPos = findCampStoneSpawnPosition(rockSizeDef.scale, 140);
    if (!spawnPos) continue;
    makeRock(spawnPos.x, spawnPos.z, rockSizeDef, false, getCaveMasonryRockOptions(rockSizeDef));
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
  },
  1
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

const shovel = makeShovel(
  START_X + 1.3,
  START_Z - 2.44,
  START_FLAT_Y,
  {
    x: Math.PI / 2,
    y: Math.PI * -0.08,
    z: 0,
  }
);
restPropOnSupport(shovel, startStall.top);
enableDynamicProp(shovel, { sleeping: true });
registerPickupItem(shovel, "shovel", "E : 삽 줍기");

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
frontierWastelandPlot = frontierAreaBuildData.frontierWastelandPlot;
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

  playerAirMax = AIR_GAUGE_MAX;
  airRuntime.setMaxAir(playerAirMax);
  airRuntime.setCurrentAir(AIR_GAUGE_MAX);
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
  playerAirMax = AIR_GAUGE_MAX;
  airRuntime.setMaxAir(playerAirMax);
  airRuntime.setCurrentAir(AIR_GAUGE_MAX);
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
  airRuntime.setMaxAir(playerAirMax);
  airRuntime.setCurrentAir(Number(source.airSystem.current) || AIR_GAUGE_MAX);
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
  return hydratePlayerSaveRuntime({
    isServerBackedSession: isServerBackedWalletSession,
    setStatus: (status, tone, options) => {
      const messages = {
        loading: "저장 불러오는 중...",
        fresh: "새로운 저장 데이터",
        loaded: "저장 불러오기 완료",
      };
      setPlayerSaveStatus(messages[status], tone, options);
    },
    apiFetchJson,
    getAuthHeaders,
    blockBaseline: (error) => blockPlayerSaveBaseline(`저장 데이터 확인 실패: ${error}`),
    serializeSave: serializePlayerSave,
    setKnownUpdatedAt: (value) => { lastKnownPlayerSaveUpdatedAt = value; },
    setSnapshot: (value) => { lastPlayerSaveSnapshot = value; },
    markBaselineReady: markPlayerSaveBaselineReady,
    applySave: applySerializedPlayerSave,
    setWalletLoginStatus: () => { walletLoginStatus.textContent = "이전 플레이 기록을 불러왔습니다."; },
  });
}

async function pushPlayerSaveToServer() {
  return pushPlayerSaveRuntime({
    isServerBackedSession: isServerBackedWalletSession,
    hasConfirmedBaseline: hasConfirmedPlayerSaveBaseline,
    setStatus: (status, tone, options) => {
      const messages = {
        "baseline-pending": "세이브 기준선 확인 전이라 저장 대기 중",
        saving: "저장 중...",
        conflict: "다른 창의 최신 저장으로 동기화됨",
        failed: "저장 실패",
        saved: "저장됨",
      };
      setPlayerSaveStatus(messages[status], tone, options);
    },
    serializeSave: serializePlayerSave,
    getSnapshot: () => lastPlayerSaveSnapshot,
    getKnownUpdatedAt: () => lastKnownPlayerSaveUpdatedAt,
    apiFetchJson,
    getAuthHeaders,
    applySave: applySerializedPlayerSave,
    setKnownUpdatedAt: (value) => { lastKnownPlayerSaveUpdatedAt = value; },
    setSnapshot: (value) => { lastPlayerSaveSnapshot = value; },
    setWalletLoginStatus: () => { walletLoginStatus.textContent = "다른 탭의 더 최신 저장 기록을 불러왔습니다."; },
  });
}

function flushPlayerSaveOnExit() {
  const plan = createPlayerSaveExitPlan({
    isDevSession: isDevSession(),
    isServerBackedSession: isServerBackedWalletSession(),
    syncPaused: playerSaveSyncPaused,
    hasConfirmedBaseline: hasConfirmedPlayerSaveBaseline(),
    snapshot: JSON.stringify(serializePlayerSave()),
    previousSnapshot: lastPlayerSaveSnapshot,
  });
  if (plan.type === "local") {
    saveActiveLocalProfileState();
    saveSharedWorldStateToLocal();
    return;
  }
  if (plan.type !== "remote") return;

  try {
    fetch(`${AUTH_API_BASE_URL}/auth/save`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${walletAuth.token}`,
      },
      body: JSON.stringify({
        save: JSON.parse(plan.snapshot),
        knownUpdatedAt: lastKnownPlayerSaveUpdatedAt,
      }),
      keepalive: true,
    });
    lastPlayerSaveSnapshot = plan.snapshot;
  } catch {}
}

function schedulePlayerSaveSync(force = false) {
  const plan = createPlayerSaveSchedulePlan({
    isDevSession: isDevSession(),
    isServerBackedSession: isServerBackedWalletSession(),
    syncPaused: playerSaveSyncPaused,
    hasConfirmedBaseline: hasConfirmedPlayerSaveBaseline(),
    force,
    now: performance.now(),
    lastAttemptAt: lastPlayerSaveAttemptAt,
    inFlight: Boolean(playerSaveSyncInFlight),
    intervalMs: PLAYER_SAVE_INTERVAL_MS,
  });
  if (plan.type === "local") {
    saveActiveLocalProfileState();
    saveSharedWorldStateToLocal();
    return;
  }
  if (plan.type !== "sync") return;

  lastPlayerSaveAttemptAt = plan.attemptedAt;
  playerSaveSyncInFlight = pushPlayerSaveToServer().finally(() => {
    playerSaveSyncInFlight = null;
  });
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
  interactionController.handleKeyDown(e);
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
  const state = updatePlayerMovementRuntime({
    dt,
    keys,
    player,
    camera,
    controls,
    state: {
      miningSwingTime,
      pickupReachTime,
      currentMiningSwingDuration,
      pickupReachDuration: PICKUP_REACH_DURATION,
    },
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
    onWorkUiLocked: () => { shiftRotatePointerActive = false; },
    now: performance.now(),
  });
  miningSwingTime = state.miningSwingTime;
  pickupReachTime = state.pickupReachTime;
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
    shiftRotatePointerActive = false;
    controls.enabled = canPlayGame() && !isWorkUiMovementLocked();
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
  createWastelandClearPlan: (cell) => wastelandRuntime.createCellClearProgressPlan({
    currentProgress: getWastelandCellClearProgress(cell),
    gain: WASTELAND_DIG_PROGRESS_GAIN,
  }),
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
  isFrontierBuildOpen: () => frontierBuildOpen,
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
  if (forgePendingUpgrade && performance.now() >= forgePendingUpgrade.resolveAt) {
    finishPendingForgeUpgrade();
  }
  if (forgeLastResult && forgeLastResult.until <= performance.now()) {
    forgeLastResult = null;
  }
  const feedbackState = miningFeedback.update(rawDt);
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
  updateParticles(dt);
  updateHarvestTrees();
  updateRockHitReactions(rawDt);
  updateRockFadeIns(dt);
  if (inventoryUiController.isInventoryOpen()) renderEquipmentPreview();
  updateCompassFromDirection(getCompassDirection(latestMoveDir, player.rotation.y));

  interactionController.updateFrame();

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
