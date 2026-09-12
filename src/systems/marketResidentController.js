export function createMarketResidentController({
  getOnboardingState = () => null,
  completeResidentIntroduction = () => false,
  setMarketItemInterest = () => false,
  firstCraftController = null,
  flowerCrownQuestController = null,
  showChoiceDialog,
  hideDialog,
}) {
  let activeEntry = null;
  let open = false;

  const isMarketResident = (entry) => entry?.role === "market-resident" && entry?.market;

  function clearHighlight() {
    activeEntry?.market?.setHighlightedDisplayItem?.("");
  }

  function close() {
    if (!open) return false;
    clearHighlight();
    open = false;
    activeEntry = null;
    hideDialog();
    return true;
  }

  function showMenu() {
    if (!activeEntry) return false;
    clearHighlight();
    const residentId = activeEntry.market.id;
    const introductions = getOnboardingState()?.firstActivities?.introductions;
    const followups = [];
    if (introductions?.gather?.residentId === residentId && !introductions.gather.conversationCompleted) {
      followups.push({ label: "직접 구한 재료에 대해 물어보기", onSelect: () => showIntroduction("gather") });
    }
    if (introductions?.explore?.residentId === residentId && !introductions.explore.conversationCompleted) {
      followups.push({ label: "마루가 여기 이야기를 해줬어요", onSelect: () => showIntroduction("explore") });
    }
    if (residentId === "craft-resident" && firstCraftController) {
      const craftStatus = firstCraftController.getStatus();
      followups.push({
        label: craftStatus.completed ? "만든 돌 컵에 대해 물어보기" : "돌 컵을 만들어보고 싶어요",
        onSelect: craftStatus.completed ? showCompletedFirstCraft : showFirstCraft,
      });
    }
    if (residentId === "living-resident" && flowerCrownQuestController) {
      const crownStatus = flowerCrownQuestController.getStatus();
      followups.push({
        label: crownStatus.completed
          ? "만든 화관에 대해 물어보기"
          : crownStatus.started
            ? "화관 재료를 가져왔어요"
            : "화관을 만들어보고 싶어요",
        onSelect: crownStatus.completed ? showCompletedFlowerCrown : showFlowerCrownQuest,
      });
    }
    showChoiceDialog("천천히 둘러보세요. 무엇이 궁금한가요?", activeEntry, [
      ...followups,
      { label: "무엇을 하고 있나요?", onSelect: showAbout },
      { label: "다음에 올게요", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function showFirstCraft() {
    if (!activeEntry || !firstCraftController) return false;
    const status = firstCraftController.getStatus();
    const materialText = `돌가루: ${status.owned} / ${status.inputCount}`;
    if (status.missing > 0) {
      const preparationText = status.pickaxeOwned
        ? "가지고 있는 곡괭이를 장착하고 마을 서쪽 일반 광산으로 가면 돼요."
        : "곡괭이가 없다면 마을 작업대의 첫 작업 도구 지원에서 기본 곡괭이를 받을 수 있어요.";
      showChoiceDialog(
        `돌 컵은 돌가루 ${status.inputCount}개면 만들 수 있어요. 직접 재료를 구해보고 싶어요? ${materialText}\n${preparationText}`,
        activeEntry,
        [
          { label: "직접 구해볼게요", onSelect: beginFirstCraftPreparation },
          { label: "나중에 해볼게요", onSelect: showMenu },
        ],
      );
      return true;
    }
    showChoiceDialog(
      `돌 컵은 돌가루 ${status.inputCount}개면 만들 수 있어요. 이미 재료가 충분하니 지금 바로 만들어도 돼요. ${materialText}`,
      activeEntry,
      [
        { label: "돌 컵 만들기", onSelect: craftFirstCup },
        { label: "나중에 만들게요", onSelect: showMenu },
      ],
    );
    return true;
  }

  function beginFirstCraftPreparation() {
    if (!firstCraftController) return false;
    firstCraftController.begin();
    return close();
  }

  function craftFirstCup() {
    if (!activeEntry || !firstCraftController) return false;
    const result = firstCraftController.craft();
    if (result.ok) {
      showChoiceDialog("돌 컵 1개를 만들었어요. 가방의 기타 칸에 보관했어요.", activeEntry, [
        { label: "고마워요", kind: "exit", onSelect: close },
        { label: "돌아가기", onSelect: showMenu },
      ]);
      return true;
    }
    if (result.reason === "inventory-full") {
      showChoiceDialog("가방의 기타 칸에 빈자리가 없어요. 자리를 하나 비운 뒤 다시 만들어봐요.", activeEntry, [
        { label: "돌아가기", onSelect: showMenu },
        { label: "대화 마치기", kind: "exit", onSelect: close },
      ]);
      return true;
    }
    if (result.reason === "already-completed") return showCompletedFirstCraft();
    return showFirstCraft();
  }

  function showCompletedFirstCraft() {
    if (!activeEntry) return false;
    showChoiceDialog("직접 만든 돌 컵은 가방의 기타 칸에 들어 있어요. 잘 보관해 두면 나중에 쓸 일이 생길 거예요.", activeEntry, [
      { label: "이제 뭘 해보면 좋을까요?", onSelect: showFirstCraftNextChoices },
      { label: "돌아가기", onSelect: showMenu },
      { label: "대화 마치기", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function showFlowerCrownQuest() {
    if (!activeEntry || !flowerCrownQuestController) return false;
    const status = flowerCrownQuestController.getStatus();
    if (!status.started) {
      showChoiceDialog(
        "초원에서 난 풀과 꽃을 엮으면 가볍게 쓸 수 있는 화관을 만들 수 있어요. 풀 3개와 꽃 2개를 모아올래요?",
        activeEntry,
        [
          { label: "재료를 모아볼게요", onSelect: beginFlowerCrownQuest },
          { label: "나중에 할게요", onSelect: showMenu },
        ],
      );
      return true;
    }
    const grass = status.materials.find((material) => material.itemId === "wildGrass");
    const flower = status.materials.find((material) => material.itemId === "wildFlower");
    const materialText = `풀 ${grass?.owned ?? 0}/${grass?.count ?? 3}, 꽃 ${flower?.owned ?? 0}/${flower?.count ?? 2}`;
    if (!status.ready) {
      showChoiceDialog(`아직 재료가 조금 부족해요. ${materialText}\n마을의 풀과 꽃 가까이에서 E를 누르면 맨손으로 채집할 수 있어요.`, activeEntry, [
        { label: "계속 모아올게요", kind: "exit", onSelect: close },
        { label: "돌아가기", onSelect: showMenu },
      ]);
      return true;
    }
    showChoiceDialog(`재료를 모두 모았네요. ${materialText}`, activeEntry, [
      { label: "화관 만들기", onSelect: craftFlowerCrown },
      { label: "조금 더 가지고 있을게요", onSelect: showMenu },
    ]);
    return true;
  }

  function beginFlowerCrownQuest() {
    if (!flowerCrownQuestController) return false;
    flowerCrownQuestController.begin();
    return close();
  }

  function craftFlowerCrown() {
    if (!activeEntry || !flowerCrownQuestController) return false;
    const result = flowerCrownQuestController.craft();
    if (result.ok) {
      showChoiceDialog("화관이 완성됐어요. 가방의 장비 칸에서 착용하면 다른 사람에게도 보여요.", activeEntry, [
        { label: "고마워요", kind: "exit", onSelect: close },
        { label: "돌아가기", onSelect: showMenu },
      ]);
      return true;
    }
    if (result.reason === "inventory-full") {
      showChoiceDialog("가방에 화관을 넣을 자리가 없어요. 빈칸을 하나 만든 뒤 다시 이야기해 주세요.", activeEntry, [
        { label: "알겠어요", kind: "exit", onSelect: close },
        { label: "돌아가기", onSelect: showMenu },
      ]);
      return true;
    }
    if (result.reason === "already-completed") return showCompletedFlowerCrown();
    return showFlowerCrownQuest();
  }

  function showCompletedFlowerCrown() {
    if (!activeEntry) return false;
    showChoiceDialog("함께 만든 화관은 가방의 장비 칸에 있어요. 머리 장비로 착용하거나 다시 벗을 수 있어요.", activeEntry, [
      { label: "돌아가기", onSelect: showMenu },
      { label: "대화 마치기", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function showFirstCraftNextChoices() {
    if (!activeEntry) return false;
    showChoiceDialog("직접 만들어보니 어땠어요? 재료를 더 찾아봐도 좋고, 다른 가판의 물건을 구경해도 좋아요. 천천히 정해도 괜찮아요.", activeEntry, [
      { label: "재료를 더 찾아보고 싶어요", onSelect: showMineDirection },
      { label: "다른 물건도 구경하고 싶어요", onSelect: showLivingStallDirection },
      { label: "일단 자유롭게 둘러볼게요", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function showMineDirection() {
    if (!activeEntry) return false;
    showChoiceDialog("일반 광산은 마을에서 이어지는 길을 따라가면 나와요. 재료를 더 찾아보고 싶을 때 가보세요.", activeEntry, [
      { label: "알겠어요", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function showLivingStallDirection() {
    if (!activeEntry) return false;
    showChoiceDialog("라온은 장터 오른쪽의 붉은 지붕 생활 가판에 있어요. 마음에 드는 물건이 있는지 둘러봐도 좋아요.", activeEntry, [
      { label: "알겠어요", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function showIntroduction(activityId) {
    if (!activeEntry) return false;
    const residentId = activeEntry.market.id;
    completeResidentIntroduction(activityId, residentId);
    const text = activityId === "gather"
      ? "돌가루는 다듬고 다른 재료와 조합해 여러 물건의 바탕으로 쓸 수 있어요. 여기 놓인 견본도 재료의 쓰임을 생각해 보려고 만든 거예요."
      : residentId === "living-resident"
        ? "마루에게 이 가판 이야기를 들었군요. 사람마다 편안하다고 느끼는 물건과 공간은 달라요."
        : "마루에게 제 작업 이야기를 들었군요. 재료가 어떤 물건이 될지는 만드는 사람의 선택에 달려 있어요.";
    showChoiceDialog(text, activeEntry, [
      { label: "진열된 물건 보기", onSelect: showDisplay },
      { label: "돌아가기", onSelect: showMenu },
      { label: "대화 마치기", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function showAbout() {
    if (!activeEntry) return false;
    showChoiceDialog(activeEntry.market.aboutText, activeEntry, [
      { label: "진열된 물건 보기", onSelect: showDisplay },
      { label: "돌아가기", onSelect: showMenu },
      { label: "대화 마치기", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function showDisplay() {
    if (!activeEntry) return false;
    clearHighlight();
    const items = activeEntry.market.displayItems ?? [];
    if (items.length > 0) {
      const interestedIds = getOnboardingState()?.marketInterestItemIds ?? [];
      showChoiceDialog(activeEntry.market.displayText, activeEntry, [
        ...items.map((item) => ({
          label: interestedIds.includes(item.id) ? `${item.name} (관심 있음)` : item.name,
          onSelect: () => showDisplayItem(item),
        })),
        { label: "돌아가기", onSelect: showMenu },
        { label: "대화 마치기", kind: "exit", onSelect: close },
      ]);
      return true;
    }
    showChoiceDialog(activeEntry.market.displayText, activeEntry, [
      { label: "무엇을 하고 있나요?", onSelect: showAbout },
      { label: "돌아가기", onSelect: showMenu },
      { label: "대화 마치기", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function showDisplayItem(item) {
    if (!activeEntry || !item?.id) return false;
    activeEntry.market.setHighlightedDisplayItem?.(item.id);
    const interested = (getOnboardingState()?.marketInterestItemIds ?? []).includes(item.id);
    const interestChoice = item.interestResponse
      ? [{
        label: interested ? "관심 표시 취소" : "마음에 들어요",
        onSelect: () => updateInterest(item, !interested),
      }]
      : [];
    showChoiceDialog(item.description, activeEntry, [
      ...interestChoice,
      { label: "다른 물건도 볼게요", onSelect: showDisplay },
      { label: "대화 마치기", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function updateInterest(item, interested) {
    if (!activeEntry) return false;
    setMarketItemInterest(item.id, interested);
    const text = interested
      ? item.interestResponse
      : `${item.name}에 남겨 둔 관심 표시를 지웠어요. 언제든 다시 살펴봐도 좋아요.`;
    showChoiceDialog(text, activeEntry, [
      { label: "다른 물건도 볼게요", onSelect: showDisplay },
      { label: "대화 마치기", kind: "exit", onSelect: close },
    ]);
    return true;
  }

  function interact(entry) {
    if (!isMarketResident(entry)) return { handled: false };
    clearHighlight();
    activeEntry = entry;
    open = true;
    showMenu();
    return { handled: true, action: "open", stallId: entry.market.stallId };
  }

  function updateNearby(entry) {
    if (!open || entry === activeEntry) return false;
    return close();
  }

  return {
    close,
    interact,
    isChoiceOpen: () => open,
    isOpen: () => open,
    updateNearby,
  };
}
