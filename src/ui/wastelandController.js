export function createWastelandController() {
  let fencePlacementMode = false;
  let selectedStructureItemId = "";
  let claimConfirmOpen = false;
  let claimCancelOpen = false;

  function isFencePlacementMode() {
    return fencePlacementMode;
  }

  function getSelectedStructureItemId() {
    return selectedStructureItemId;
  }

  function isClaimConfirmOpen() {
    return claimConfirmOpen;
  }

  function isClaimCancelOpen() {
    return claimCancelOpen;
  }

  function resetPlacementMode() {
    fencePlacementMode = false;
    selectedStructureItemId = "";
  }

  function toggleFencePlacementMode() {
    fencePlacementMode = !fencePlacementMode;
    if (fencePlacementMode) selectedStructureItemId = "";
    return fencePlacementMode;
  }

  function toggleStructurePlacement(itemId) {
    selectedStructureItemId = selectedStructureItemId === itemId ? "" : itemId;
    if (selectedStructureItemId) fencePlacementMode = false;
    return selectedStructureItemId;
  }

  function clearFencePlacementMode() {
    fencePlacementMode = false;
  }

  function openClaimConfirm() {
    claimConfirmOpen = true;
  }

  function closeClaimConfirm() {
    claimConfirmOpen = false;
  }

  function openClaimCancel() {
    claimCancelOpen = true;
  }

  function closeClaimCancel() {
    claimCancelOpen = false;
  }

  return {
    isFencePlacementMode,
    getSelectedStructureItemId,
    isClaimConfirmOpen,
    isClaimCancelOpen,
    resetPlacementMode,
    toggleFencePlacementMode,
    toggleStructurePlacement,
    clearFencePlacementMode,
    openClaimConfirm,
    closeClaimConfirm,
    openClaimCancel,
    closeClaimCancel,
  };
}
