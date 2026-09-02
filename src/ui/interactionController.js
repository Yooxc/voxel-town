export function createInteractionController(ctx) {
  function showTimedMessage(message, duration = 900) {
    ctx.showUI(message, duration);
    ctx.setLastMessageUntil(ctx.now() + duration);
  }

  function handleKeyDown(event) {
    if (!ctx.canPlayGame()) return;
    if (ctx.getLogicalInputKey(event) !== "escape" && ctx.isTextInputActive()) return;
    if (ctx.isNftExhibitSelectionOpen() || ctx.isQuickUseAssigning()) return;

    const key = ctx.getLogicalInputKey(event);
    if (ctx.now() < ctx.getQuickUseAssignmentConsumedUntil() && ctx.quickUseAllowedKeys.includes(key)) {
      event.preventDefault();
      return;
    }

    if (ctx.isWastelandBuildModeActive()) {
      if (key === "escape") {
        event.preventDefault();
        ctx.exitWastelandBuildMode();
        return;
      }
      if (key === "r") {
        event.preventDefault();
        ctx.rotateWastelandBuildPart();
        return;
      }
      const keys = ctx.getKeys();
      if (key in keys) keys[key] = false;
      if (key === "shift") ctx.resetShiftRotation(false);
      return;
    }

    const keys = ctx.getKeys();
    if (ctx.isWorkUiMovementLocked() && (key in keys || key === "shift")) {
      if (key in keys) keys[key] = false;
      if (key === "shift") ctx.resetShiftRotation();
      return;
    }

    const state = ctx.getInteractionState();
    if (key === "e") {
      const pickup = ctx.findNearestPickupItem(2.0);
      if (pickup) {
        ctx.triggerPickupReach(pickup.obj);
        const added = pickup.itemId === "pickaxe" && Number.isFinite(pickup.obj?.userData?.pickaxeLevel)
          ? ctx.addInventoryEntry(ctx.createInventorySlotEntry("pickaxe", 1, { pickaxeLevel: pickup.obj.userData.pickaxeLevel }))
          : ctx.addItem(pickup.itemId, 1);
        if (added) {
          ctx.updateInventoryUI();
          ctx.refreshQuestProgress();
          const def = ctx.getItemDef(pickup.itemId);
          const message = pickup.itemId === "pickaxe" ? ctx.hudMessages.PICKAXE_GET
            : pickup.itemId === "shovel" ? "삽 획득!"
              : pickup.itemId === "safetyHelmet" ? ctx.hudMessages.HELMET_GET
                : pickup.itemId === "freshAirCanister" ? ctx.hudMessages.AIR_CAN_GET
                  : `${def?.name ?? pickup.itemId} 획득!`;
          showTimedMessage(message);
          ctx.unregisterDynamicProp(pickup.obj);
          ctx.unregisterPickupItem(pickup.obj);
          pickup.obj.removeFromParent();
        }
        return;
      }

      if (state.activeMapGate && !ctx.canUseMapGate(state.activeMapGate)) {
        ctx.tryUnlockMapGate(state.activeMapGate);
        return;
      }
      if (ctx.hasNearbyForgeStation()) {
        ctx.setForgeOpen(!ctx.isForgeOpen());
        return;
      }
      if (state.activeInteractable?.type === "nftBoard") {
        void ctx.openNftBoardSelectionOverlay();
        return;
      }
      if (state.activeInteractable?.type === "wastelandDoor") {
        if (event.repeat) return;
        void ctx.toggleWastelandDoor(state.activeInteractable.structureKey);
        return;
      }
      const boothPlan = ctx.getFrontierBoothInteractionPlan(state.activeInteractable);
      if (boothPlan) {
        ctx.openFrontierBoothDialog(boothPlan.parcelLabel, boothPlan.slotKey, boothPlan.boothTitle, boothPlan.mode);
        return;
      }
      if (state.activeInteractable?.type === "mansionEntry") {
        if (!ctx.hasMansionOneResidenceAuthority()) {
          ctx.showUI("거주권 필요", 1000);
          return;
        }
        if (ctx.enterMansionOneRoom(ctx.getOwnedMansionRoomKey())) return;
      }
      if (state.activeInteractable?.type === "mansionExit" && ctx.exitMansionOneRoom()) return;
      if (state.activeInteractable?.type === "refinery") {
        ctx.setRefineryOpen(!ctx.isRefineryOpen());
        return;
      }
      if (state.activeInteractable?.type === "airPurifier") {
        ctx.tryUseAirPurifier(state.activeInteractable.purifierMapId ?? "폐광");
        return;
      }
    }

    if (key === "t" && ctx.isDevPresetEnabled()) {
      const equipped = !ctx.isTorchEquipped();
      ctx.setTorchEquipped(equipped);
      showTimedMessage(equipped ? "횃불 점화" : "횃불 소등");
      return;
    }
    if (ctx.quickUseAllowedKeys.includes(key) && ctx.useQuickUseItem(key)) return;

    if (key === "b") {
      const parcelLabel = ctx.getCurrentFrontierParcelLabel();
      if (parcelLabel) {
        event.preventDefault();
        ctx.setFrontierActiveParcelLabel(parcelLabel);
        if (!ctx.hasFrontierParcelAuthority(parcelLabel)) {
          showTimedMessage(`${parcelLabel} 개발권 필요`, 1000);
          return;
        }
        ctx.setFrontierBuildOpen(!ctx.isFrontierBuildOpen());
        return;
      }
    }
    if (key in keys) keys[key] = true;
    if (key === "shift") keys.shift = true;
  }

  function handleWorldSpaceInteraction(event) {
    if (ctx.isWastelandBuildModeActive()) return;
    const state = ctx.getInteractionState();
    if (state.activeInteractable?.type === "mansionStorage") {
      event.preventDefault();
      ctx.openPersonalStorage();
      return;
    }
    if (state.activeInteractable?.type === "mansionBed") {
      event.preventDefault();
      ctx.openMansionSleepDialog();
      return;
    }
    if (state.activeTutorialNpc) {
      const currentStep = ctx.getCurrentQuestStep();
      if (currentStep?.title === "폐광 열쇠 수령" && !ctx.isMineKeyIssued()) {
        ctx.setMineKeyIssued();
        ctx.addItem("abandonedMineKey", 1);
        ctx.updateInventoryUI();
        showTimedMessage(ctx.hudMessages.MINE_KEY_GET, 1200);
        ctx.showNpcDialog("좋아, 이제 폐광에 들어갈 자격이 생겼다. 이 폐광 열쇠를 가져가서 북쪽 폐광 입구를 열어.", 3000);
        ctx.refreshQuestProgress();
        ctx.renderQuestWindowIfOpen();
        return;
      }
      ctx.showNpcDialog(ctx.getTutorialNpcLine());
      ctx.refreshQuestProgress();
      ctx.renderQuestWindowIfOpen();
      return;
    }
    if (state.activeHarvestTree) {
      ctx.triggerMiningSwing(state.activeHarvestTree);
      const plan = ctx.createTreeHarvestPlan({
        itemId: state.activeHarvestTree.userData.harvestItemId,
        count: state.activeHarvestTree.userData.harvestCount ?? 1,
        now: ctx.now(),
      });
      state.activeHarvestTree.userData.harvestShakeStartedAt = plan.shakeStartedAt;
      state.activeHarvestTree.userData.harvestShakeUntil = plan.shakeUntil;
      if (ctx.addItem(plan.itemId, plan.count)) {
        ctx.setHarvestTreeActive(state.activeHarvestTree, false);
        ctx.updateInventoryUI();
        showTimedMessage(`${ctx.getItemDef(plan.itemId)?.name ?? "자원"} 획득!`);
      }
      return;
    }
    if (state.activeWastelandCell) {
      if (event.repeat) return;
      if (ctx.isFencePlacementMode()) {
        if (ctx.placeWastelandFencePost(state.activeWastelandCell) && ctx.hasWastelandFencePost(state.activeWastelandCell)) {
          showTimedMessage("울타리 기둥을 설치했습니다.");
        }
        return;
      }
      const structureItemId = ctx.getSelectedStructureItemId();
      if (structureItemId) {
        ctx.placeWastelandStructure(state.activeWastelandCell, structureItemId);
        return;
      }
      ctx.triggerMiningSwing(state.activeWastelandCell.mesh);
      if (!ctx.hasEquippedTool("shovel")) {
        showTimedMessage(ctx.hasOwnedTool("shovel") ? ctx.hudMessages.EQUIP_SHOVEL : ctx.hudMessages.NEED_SHOVEL);
        return;
      }
      const result = ctx.tryDigWastelandTerrain?.();
      if (!result?.ok) {
        showTimedMessage(result?.reason ?? "이 구역은 파낼 수 없습니다.", 1000);
        return;
      }
      showTimedMessage(`황무지 개간 ${Math.round(result.progress?.percent ?? 0)}%`, 800);
      return;
    }
    const terrainDigResult = ctx.tryDigTerrain?.();
    if (terrainDigResult?.ok) {
      ctx.triggerMiningSwing(terrainDigResult.target.mesh);
      showTimedMessage("땅을 팠습니다.", 600);
      return;
    }
    if (terrainDigResult?.reason === "need-shovel") {
      showTimedMessage(ctx.hasOwnedTool("shovel") ? ctx.hudMessages.EQUIP_SHOVEL : ctx.hudMessages.NEED_SHOVEL);
      return;
    }
    if (terrainDigResult?.reason === "blocked") {
      showTimedMessage("이 구역은 파낼 수 없습니다.");
      return;
    }
    if (terrainDigResult?.reason === "max-depth") {
      showTimedMessage("더 이상 깊게 팔 수 없습니다.");
      return;
    }
    if (!state.activeMineRock) return;
    ctx.triggerMiningSwing(state.activeMineRock);
    const minedRock = state.activeMineRock;
    const plan = ctx.createRockMiningPlan(minedRock);
    if (plan.status === "blocked") {
      if (plan.reason === "equip-pickaxe") showTimedMessage(ctx.hudMessages.EQUIP_PICKAXE);
      else if (plan.reason === "need-pickaxe") showTimedMessage(ctx.hudMessages.NEED_PICKAXE);
      else if (plan.reason === "pickaxe-level-required") showTimedMessage(`곡괭이 Lv.${minedRock.userData.requiredPickaxeLevel ?? 0} 이상 필요`, 1000);
      return;
    }
    minedRock.userData.hp = plan.remainingHp;
    ctx.triggerHitStop();
    ctx.triggerRockHitReaction(minedRock);
    ctx.triggerCameraShake(plan.remainingHp > 0 ? 0.035 : 0.06);
    ctx.spawnDustBurst(minedRock.position, plan.remainingHp > 0 ? 8 : 10);
    if (plan.remainingHp > 0) {
      ctx.updateRockHpBar(minedRock);
      showTimedMessage("채굴 중...", 700);
      return;
    }
    const spawn = minedRock.userData.spawn ? { ...minedRock.userData.spawn } : {
      x: minedRock.position.x, z: minedRock.position.z, rockSize: "small",
    };
    ctx.finishRockMining(minedRock, spawn);
    state.activeMineRock = null;
    ctx.hideRockHpBar();
    ctx.hidePickupHint();
    ctx.setInteractionState(state);
  }

  function updateFrame() {
    const state = ctx.getInteractionState();
    state.activeInteractable = null;
    state.activeForgeStation = null;
    state.activeHarvestTree = null;
    state.activeWastelandCell = null;
    state.activeTutorialNpc = ctx.findNearestTutorialNpc(2.2);
    state.activeMapGate = ctx.findTriggeredMapGate();
    if (ctx.isWastelandBuildModeActive()) {
      ctx.hideHint();
      ctx.clearWastelandHighlights();
      ctx.updateWastelandBuildModeUi();
      ctx.setInteractionState(state);
      return;
    }
    if (ctx.hasNearbyForgeStation()) state.activeForgeStation = ctx.getForgeStation();
    state.activeInteractable = ctx.findNearestInteractable(2.0);
    ctx.updateInteractableHighlights(state.activeInteractable);

    let hintText = "";
    const boothPlan = ctx.getFrontierBoothInteractionPlan(state.activeInteractable);
    state.activePickupItem = ctx.findNearestPickupItem(2.0);
    if (state.activePickupItem) hintText = state.activePickupItem.text;
    if (!hintText && state.activeTutorialNpc) hintText = state.activeTutorialNpc.hint;
    if (!hintText && state.activeForgeStation) hintText = ctx.isForgeOpen() ? "대장간 이용 중" : "E : 장비 강화";
    if (!hintText) {
      state.activeHarvestTree = ctx.findNearestHarvestTree(2.2);
      if (state.activeHarvestTree) hintText = "Space : 나무 채집";
    }
    if (!hintText) {
      hintText = ctx.getTerrainDigHint?.() ?? "";
    }
    if (!hintText) {
      state.activeMineRock = ctx.findNearestMineRock(2.2);
      if (state.activeMineRock) {
        const requiredLevel = state.activeMineRock.userData.requiredPickaxeLevel;
        hintText = requiredLevel > ctx.getEquippedPickaxeLevel()
          ? `Space : 채굴 (곡괭이 Lv.${requiredLevel} 이상 필요)`
          : (state.activeMineRock.userData.resourceHint ?? "Space : 채굴");
      }
    }
    if (!hintText) {
      state.activeWastelandCell = ctx.findActiveFrontierWastelandCell(2.4);
      if (state.activeWastelandCell) {
        if (ctx.isFencePlacementMode()) {
          hintText = "";
        } else if (ctx.getSelectedStructureItemId()) {
          const itemId = ctx.getSelectedStructureItemId();
          const partDef = ctx.getWastelandBuildPartDef(itemId);
          const buildCheck = ctx.getWastelandBuildCheck(state.activeWastelandCell, itemId);
          hintText = `Space : ${partDef?.label ?? "건축 부품"} 설치`;
          hintText += buildCheck.ok ? " | 건축 가능" : ` | ${buildCheck.reason}`;
        } else {
          hintText = ctx.hasEquippedTool("shovel") ? "Space : 땅 파기" : "Space : 개간 (삽 장착 필요)";
          if (state.activeWastelandCell.clearProgress >= 100 || ctx.getFrontierWastelandClaimByCell(state.activeWastelandCell)) {
            const buildCheck = ctx.getWastelandBuildCheck(state.activeWastelandCell);
            hintText += buildCheck.ok ? " | 건축 가능" : ` | ${buildCheck.reason}`;
          }
        }
      }
    }
    const parcelLabel = ctx.getCurrentFrontierParcelLabel();
    if (!hintText && parcelLabel && ctx.hasFrontierParcelAuthority(parcelLabel)) {
      hintText = ctx.getFrontierBuildState(parcelLabel).stage >= 100 ? "B : 건축 관리" : "B : 건축 진행";
    }
    if (!hintText && state.activeInteractable) {
      hintText = ctx.getInteractableHintText(state.activeInteractable, boothPlan);
    }
    if (!hintText && state.activeMapGate && !ctx.isMapTransitionPending()) {
      hintText = ctx.getMapGateHintText(state.activeMapGate);
    }
    if (!hintText && ctx.canShowAirCanisterHint()) hintText = ctx.getAirCanisterHintText();
    if (hintText) ctx.showHint(hintText);
    else ctx.hideHint();

    ctx.clearWastelandHighlights();
    if (state.activeWastelandCell) ctx.applyWastelandCellHighlight(state.activeWastelandCell);
    ctx.updateWastelandClaimPreview();
    ctx.updateWastelandHud();
    if (state.activeMineRock) ctx.updateRockHpBar(state.activeMineRock, { dimmed: !ctx.hasEquippedTool("pickaxe") });
    else ctx.hideRockHpBar();
    ctx.setInteractionState(state);
  }

  return { handleKeyDown, handleWorldSpaceInteraction, updateFrame };
}
