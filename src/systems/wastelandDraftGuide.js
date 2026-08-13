export function createWastelandDraftGuide({
  draft,
  bounds,
  phase,
  minWidth,
  minHeight,
  confirmablePhase,
}) {
  const postCount = draft?.postKeys?.length ?? 0;
  const requirementText = `${minWidth} x ${minHeight} 이상 테두리 필요`;
  if (!draft || postCount <= 0 || !bounds) {
    return { postCount, text: requirementText };
  }

  const width = bounds.maxCol - bounds.minCol + 1;
  const height = bounds.maxRow - bounds.minRow + 1;
  const minSizeOk = Math.max(width, height) >= minWidth && Math.min(width, height) >= minHeight;
  const keySet = new Set(draft.postKeys);
  let requiredBorderCount = 0;
  let currentBorderCount = 0;
  let innerPostCount = 0;
  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
      const isBorder =
        row === bounds.minRow ||
        row === bounds.maxRow ||
        col === bounds.minCol ||
        col === bounds.maxCol;
      const hasPost = keySet.has(`${row}:${col}`);
      if (isBorder) {
        requiredBorderCount += 1;
        if (hasPost) currentBorderCount += 1;
      } else if (hasPost) {
        innerPostCount += 1;
      }
    }
  }

  const missingBorderCount = Math.max(0, requiredBorderCount - currentBorderCount);
  const canConfirm = phase === confirmablePhase;
  const sizeText = `${width} x ${height}`;
  let text = `${sizeText} | ${minWidth} x ${minHeight} 이상 필요`;
  if (!minSizeOk) {
    text = `${sizeText} | 최소 ${minWidth} x ${minHeight} 필요`;
  } else if (innerPostCount > 0) {
    text = `${sizeText} | 내부 기둥 ${innerPostCount}개 제거 필요`;
  } else if (missingBorderCount > 0) {
    text = `${sizeText} | 테두리 ${missingBorderCount}칸 부족`;
  } else if (canConfirm) {
    text = `구역 확정 가능: ${sizeText}`;
  }
  return {
    phase,
    postCount,
    width,
    height,
    requiredBorderCount,
    currentBorderCount,
    missingBorderCount,
    innerPostCount,
    canConfirm,
    text,
  };
}

export function createWastelandFenceHudState({
  placementMode,
  guide,
  reservationText,
  minWidth,
  minHeight,
}) {
  if (!placementMode) return { visible: false };
  const hasRect = Number.isFinite(guide?.width) && Number.isFinite(guide?.height);
  const requirementText = `${minWidth} x ${minHeight} 이상 테두리 필요`;
  return {
    visible: true,
    postCount: guide?.postCount ?? 0,
    sizeText: hasRect
      ? `현재 테두리 ${guide.width} x ${guide.height} | 최소 ${minWidth} x ${minHeight}`
      : `최소 ${minWidth} x ${minHeight} 테두리 필요`,
    requirementText,
    statusText: `${reservationText} | ${guide?.canConfirm ? "구역 확정 가능" : guide?.text ?? requirementText}`,
  };
}
