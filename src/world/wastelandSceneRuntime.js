export function createWastelandSceneRuntime() {
  function getFenceLinkPlans({ fencePosts, cellSize, canLinkPosts }) {
    const plans = [];
    for (const post of fencePosts?.values?.() ?? []) {
      const right = fencePosts.get(`${post.row}:${post.col + 1}`);
      if (canLinkPosts(post, right)) {
        plans.push({
          horizontal: true,
          length: cellSize,
          x: (post.x + right.x) * 0.5,
          z: post.z,
        });
      }
      const down = fencePosts.get(`${post.row + 1}:${post.col}`);
      if (canLinkPosts(post, down)) {
        plans.push({
          horizontal: false,
          length: cellSize,
          x: post.x,
          z: (post.z + down.z) * 0.5,
        });
      }
    }
    return plans;
  }

  function getStructureScenePlans({ structures, getCellByGrid, getSurfaceY }) {
    return (structures ?? []).flatMap((structure) => {
      const cell = getCellByGrid(structure.row, structure.col);
      if (!cell) return [];
      return [{
        structure,
        position: { x: cell.x, y: getSurfaceY(cell), z: cell.z },
      }];
    });
  }

  function getClaimPreviewPlans({
    cells,
    draftEntries,
    currentOwnerId,
    isFencePlacementMode,
    getDraftBounds,
    getDraftFencePosts,
    getDraftGuide,
  }) {
    const plans = [];
    for (const [draftOwnerId, draft] of draftEntries ?? []) {
      if (!draft?.postKeys?.length) continue;
      const bounds = getDraftBounds(draft, getDraftFencePosts(draft, draftOwnerId));
      if (!bounds) continue;
      const isCurrentDraft = draftOwnerId === currentOwnerId;
      if (isCurrentDraft && !isFencePlacementMode) continue;
      const guide = isCurrentDraft ? getDraftGuide() : null;
      const color = isCurrentDraft
        ? guide?.canConfirm
          ? 0x35d66f
          : guide?.innerPostCount > 0 || guide?.missingBorderCount > 0
            ? 0xff5b4a
            : 0xf2b84b
        : 0xff5b4a;
      const overlayOpacity = isCurrentDraft ? (guide?.canConfirm ? 0.22 : 0.16) : 0.12;
      const markerOpacity = isCurrentDraft ? 0.62 : 0.46;
      const keySet = new Set(draft.postKeys);
      for (const cell of cells ?? []) {
        const inside =
          cell.row >= bounds.minRow && cell.row <= bounds.maxRow &&
          cell.col >= bounds.minCol && cell.col <= bounds.maxCol;
        if (!inside) continue;
        const isBorder =
          cell.row === bounds.minRow || cell.row === bounds.maxRow ||
          cell.col === bounds.minCol || cell.col === bounds.maxCol;
        const hasPost = keySet.has(`${cell.row}:${cell.col}`);
        plans.push({ cell, color, opacity: overlayOpacity, height: 0.018, scale: 1, y: 0.19 });
        const needsMarker =
          (isCurrentDraft && ((isBorder && !hasPost) || (!isBorder && hasPost))) ||
          (!isCurrentDraft && isBorder);
        if (needsMarker) {
          plans.push({
            cell,
            color: 0xff2f2f,
            opacity: markerOpacity,
            height: 0.032,
            scale: isCurrentDraft ? 0.54 : 0.82,
            y: 0.215,
          });
        }
      }
    }
    return plans;
  }

  return {
    getFenceLinkPlans,
    getStructureScenePlans,
    getClaimPreviewPlans,
  };
}
