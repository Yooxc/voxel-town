export function createWastelandSceneRuntime() {
  function clearRoot(root, disposeObject) {
    if (!root) return;
    while (root.children.length) {
      const child = root.children[0];
      disposeObject(child);
      root.remove(child);
    }
  }

  function ensureState({ plot, createGroup }) {
    if (!plot) return null;
    for (const key of ["fenceRoot", "fenceLinkRoot", "claimPreviewRoot", "structureRoot"]) {
      if (plot[key]) continue;
      plot[key] = createGroup();
      plot.root.add(plot[key]);
    }
    if (!plot.fencePosts) plot.fencePosts = new Map();
    if (!plot.claimDrafts) plot.claimDrafts = new Map();
    if (!plot.claims) plot.claims = [];
    if (!plot.structures) plot.structures = [];
    return plot;
  }

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

  function rebuildStructures({ plot, disposeObject, getCellByGrid, getSurfaceY, createMesh, getPartDef }) {
    if (!plot) return;
    clearRoot(plot.structureRoot, disposeObject);
    const plans = getStructureScenePlans({ structures: plot.structures, getCellByGrid, getSurfaceY });
    for (const { structure, position } of plans) {
      Object.assign(structure, position);
      const mesh = createMesh(structure, getPartDef);
      if (!mesh) continue;
      structure.mesh = mesh;
      plot.structureRoot.add(mesh);
    }
  }

  function rebuildFenceLinks({ plot, disposeObject, canLinkPosts, createMesh }) {
    if (!plot?.fenceLinkRoot) return;
    clearRoot(plot.fenceLinkRoot, disposeObject);
    const plans = getFenceLinkPlans({
      fencePosts: plot.fencePosts,
      cellSize: plot.cellSize,
      canLinkPosts,
    });
    for (const plan of plans) {
      const mesh = createMesh(plan.length, plan.horizontal);
      mesh.position.x = plan.x;
      mesh.position.z = plan.z;
      plot.fenceLinkRoot.add(mesh);
    }
  }

  function clearClaimPreview({ plot, disposeObject }) {
    clearRoot(plot?.claimPreviewRoot, disposeObject);
  }

  function updateClaimPreview({
    plot,
    disposeObject,
    currentOwnerId,
    isFencePlacementMode,
    getDraftBounds,
    getDraftFencePosts,
    getDraftGuide,
    createMesh,
  }) {
    clearClaimPreview({ plot, disposeObject });
    if (!plot?.claimPreviewRoot) return;
    const plans = getClaimPreviewPlans({
      cells: plot.cells,
      draftEntries: plot.claimDrafts,
      currentOwnerId,
      isFencePlacementMode,
      getDraftBounds,
      getDraftFencePosts,
      getDraftGuide,
    });
    for (const plan of plans) {
      const mesh = createMesh(plan.cell, plan.color, plan.opacity, plan.height);
      mesh.scale.set(plan.scale, 1, plan.scale);
      mesh.position.y = plan.y;
      plot.claimPreviewRoot.add(mesh);
    }
  }

  function resetState({ plot, resetPlan, disposeObject, resetPlacementMode, closeConfirm, closeCancel, setCellState, updateClaimActions }) {
    if (!plot) return;
    for (const root of [plot.fenceRoot, plot.fenceLinkRoot, plot.claimPreviewRoot, plot.structureRoot]) {
      clearRoot(root, disposeObject);
    }
    plot.fencePosts = new Map(resetPlan.fencePosts.map((post) => [post.key, post]));
    plot.claimDrafts = new Map(resetPlan.drafts.map((draft) => [draft.ownerId, draft]));
    plot.claims = resetPlan.claims;
    plot.structures = resetPlan.structures;
    resetPlacementMode();
    closeConfirm();
    closeCancel();
    for (const cell of plot.cells ?? []) {
      cell.clearProgress = resetPlan.cellProgressById.get(cell.id) ?? 0;
      setCellState(cell, "idle");
    }
    updateClaimActions(null);
  }

  function applyState({
    plot,
    restorePlan,
    disposeObject,
    syncCellState,
    applyCellVisual,
    createFencePostMesh,
    resetPlacementMode,
    closeConfirm,
    closeCancel,
    rebuildDrafts,
    rebuildLinks,
    rebuildStructures: rebuildStructureVisuals,
    updateClaimActions,
  }) {
    if (!plot) return;
    for (const root of [plot.fenceRoot, plot.fenceLinkRoot, plot.claimPreviewRoot, plot.structureRoot]) {
      clearRoot(root, disposeObject);
    }
    for (const cell of plot.cells ?? []) {
      cell.clearProgress = restorePlan.cellProgressById.get(cell.id) ?? 0;
      syncCellState(cell);
      applyCellVisual(cell);
    }
    plot.fencePosts = new Map();
    for (const savedPost of restorePlan.fencePosts) {
      const mesh = createFencePostMesh();
      mesh.position.set(savedPost.x, 0.02, savedPost.z);
      plot.fenceRoot.add(mesh);
      plot.fencePosts.set(savedPost.key, { ...savedPost, mesh });
    }
    plot.claimDrafts = new Map(restorePlan.drafts.map((draft) => [draft.ownerId, draft]));
    plot.claims = restorePlan.claims;
    plot.structures = restorePlan.structures;
    resetPlacementMode();
    closeConfirm();
    closeCancel();
    rebuildDrafts();
    rebuildLinks();
    rebuildStructureVisuals();
    clearClaimPreview({ plot, disposeObject });
    updateClaimActions(null);
  }

  function removeClaimFences({ plot, claim, disposeObject, rebuildLinks }) {
    if (!plot || !claim) return;
    for (const key of claim.postKeys ?? []) {
      const post = plot.fencePosts.get(key);
      if (!post) continue;
      if (post.mesh?.parent) {
        disposeObject(post.mesh);
        post.mesh.parent.remove(post.mesh);
      }
      plot.fencePosts.delete(key);
    }
    rebuildLinks();
    clearClaimPreview({ plot, disposeObject });
  }

  return {
    ensureState,
    getFenceLinkPlans,
    getStructureScenePlans,
    getClaimPreviewPlans,
    rebuildStructures,
    rebuildFenceLinks,
    clearClaimPreview,
    updateClaimPreview,
    resetState,
    applyState,
    removeClaimFences,
  };
}
