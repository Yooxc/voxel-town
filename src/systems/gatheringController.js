const DEFAULT_DURATION_MS = 1000;
const DEFAULT_CANCEL_DISTANCE = 0.3;

function copyPosition(position) {
  return { x: position.x, y: position.y, z: position.z };
}

export function createGatheringController({
  getPlayerPosition,
  getCurrentMapId,
  findNearestPlant,
  isPlantActive,
  canReceiveItem,
  claimPlant,
  addItem,
  applySnapshot = () => {},
  deactivatePlant = () => {},
  updateInventoryUi = () => {},
  refreshQuestProgress = () => {},
  notify = () => {},
  now = () => performance.now(),
  durationMs = DEFAULT_DURATION_MS,
  cancelDistance = DEFAULT_CANCEL_DISTANCE,
  createRequestId = () => globalThis.crypto?.randomUUID?.() ?? `gather-${Date.now()}-${Math.random()}`,
}) {
  let active = null;

  function getPlantName(plant) {
    return plant?.kind === "flower" ? "꽃" : "풀";
  }

  function cancel(message = "") {
    if (!active) return false;
    active = null;
    if (message) notify(message, 900);
    return true;
  }

  function begin() {
    if (active) return true;
    const plant = findNearestPlant();
    if (!plant) return false;
    if (!canReceiveItem(plant.itemId, 1)) {
      notify("인벤토리에 빈 공간이 필요합니다.", 1100);
      return true;
    }
    active = {
      plantId: plant.id,
      itemId: plant.itemId,
      kind: plant.kind,
      requestId: createRequestId(),
      startedAt: now(),
      startPosition: copyPosition(getPlayerPosition()),
      mapId: getCurrentMapId(),
      claiming: false,
    };
    notify(`${getPlantName(plant)} 채집 중...`, durationMs);
    return true;
  }

  function finish(attempt) {
    attempt.claiming = true;
    void claimPlant(attempt.plantId, attempt.requestId).then((result) => {
      if (active !== attempt) return;
      active = null;
      if (!result?.ok) {
        notify(result?.error ?? "채집에 실패했습니다.", 1100);
        return;
      }
      if (result.gathering) applySnapshot(result.gathering);
      else deactivatePlant(result.resourceId);
      if (!addItem(result.itemId, result.count ?? 1)) {
        notify("인벤토리에 아이템을 담지 못했습니다.", 1100);
        return;
      }
      updateInventoryUi();
      refreshQuestProgress();
      notify(`${getPlantName(attempt)} 1개 획득!`, 900);
    });
  }

  function update() {
    if (!active || active.claiming) return;
    const position = getPlayerPosition();
    const moved = Math.hypot(position.x - active.startPosition.x, position.z - active.startPosition.z);
    if (getCurrentMapId() !== active.mapId || moved > cancelDistance) {
      cancel("이동해서 채집이 취소되었습니다.");
      return;
    }
    if (!isPlantActive(active.plantId)) {
      cancel("다른 사람이 먼저 채집했습니다.");
      return;
    }
    if (now() - active.startedAt >= durationMs) finish(active);
  }

  function getHint() {
    if (active) return active.claiming ? "채집 확인 중..." : `${getPlantName(active)} 채집 중...`;
    const plant = findNearestPlant();
    return plant ? `E : ${getPlantName(plant)} 채집` : "";
  }

  return {
    begin,
    cancel,
    getHint,
    isActive: () => Boolean(active),
    update,
  };
}
