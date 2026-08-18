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

  function closeClaimConfirmDialog({ overlay, dialog, clearRect }) {
    closeClaimConfirm();
    clearRect();
    if (overlay) overlay.style.display = "none";
    if (dialog) dialog.style.display = "none";
  }

  function closeClaimCancelDialog({ overlay, dialog }) {
    closeClaimCancel();
    if (overlay) overlay.style.display = "none";
    if (dialog) dialog.style.display = "none";
  }

  function openClaimCancelDialog({ claim, completedPhase, getClaimPhase, notify, overlay, dialog }) {
    if (!claim || getClaimPhase({ claim, readyToComplete: false }) === completedPhase || claim.rewardIssuedAt) {
      notify("취소할 수 있는 확정 구역이 없습니다.");
      return false;
    }
    openClaimCancel();
    if (overlay) overlay.style.display = "block";
    if (dialog) dialog.style.display = "block";
    return true;
  }

  function openClaimConfirmDialog({ rect, overlay, dialog, body, setRect, documentRef = document }) {
    if (!rect || !overlay || !dialog || !body) return false;
    setRect(rect);
    openClaimConfirm();
    body.innerHTML = "";

    const sizeLine = documentRef.createElement("div");
    sizeLine.textContent = `${rect.width} x ${rect.height} 구역, 총 ${rect.cellIds.length}셀`;
    sizeLine.style.fontWeight = "900";
    sizeLine.style.color = "#2f261b";
    body.appendChild(sizeLine);

    const guideLine = documentRef.createElement("div");
    guideLine.textContent = "확정하면 7일 안에 내부 셀을 모두 개간해야 토지 권한을 획득할 수 있습니다.";
    guideLine.style.marginTop = "8px";
    body.appendChild(guideLine);

    const ownerLine = documentRef.createElement("div");
    ownerLine.textContent = "현재 단계에서는 확정한 소유주만 이 구역을 개간할 수 있게 이어갈 예정입니다.";
    ownerLine.style.marginTop = "6px";
    ownerLine.style.opacity = "0.82";
    body.appendChild(ownerLine);

    overlay.style.display = "block";
    dialog.style.display = "block";
    return true;
  }

  function updateClaimActionUi({ progress, completeButton, abortButton, canComplete, canCancel, onNoClaim }) {
    if (completeButton) completeButton.style.display = canComplete(progress) ? "block" : "none";
    if (abortButton) abortButton.style.display = canCancel(progress) ? "block" : "none";
    if (!progress?.claim) onNoClaim();
  }

  function toggleFencePlacement({ ownerId, hasFencePost, hasClaim, notify, clearPreview, updateInventory, updatePrompt }) {
    if (!ownerId) {
      notify("울타리 기둥 설치는 지갑 로그인이 필요합니다.");
      return false;
    }
    if (!hasFencePost) {
      notify("울타리 기둥이 없습니다.");
      return false;
    }
    if (hasClaim) {
      notify("이미 확정된 개간 구역이 있습니다.");
      return false;
    }
    const enabled = toggleFencePlacementMode();
    if (!enabled) clearPreview();
    notify(enabled ? "울타리 기둥 설치 모드" : "울타리 기둥 설치 모드 해제");
    updateInventory();
    if (enabled) updatePrompt();
    return enabled;
  }

  function getClaimHudStatusText({ progress, phase, phases, formatRemaining, now = Date.now() }) {
    if (phase === phases.completed) return "개간 완료 | 토지권 지급 완료";
    if (phase === phases.rewardPending) {
      return `완료 가능 | 남은 시간 ${formatRemaining(progress.claim.expiresAt - now)}`;
    }
    if (phase === phases.failed) return "개간 실패 | 기한 만료";
    return `개간률 ${progress.percent.toFixed(1)}% | 남은 시간 ${formatRemaining(progress.claim.expiresAt - now)}`;
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
    closeClaimConfirmDialog,
    closeClaimCancelDialog,
    openClaimCancelDialog,
    openClaimConfirmDialog,
    updateClaimActionUi,
    toggleFencePlacement,
    getClaimHudStatusText,
  };
}
