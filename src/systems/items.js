export const QUICK_USE_ALLOWED_KEYS = ["1", "2", "3", "4", "5"];
export const INVENTORY_STACK_LIMIT = 200;

export const FRONTIER_PARCEL_LABELS = ["P1", "P2", "P3", "P4", "P5", "P6"];
export const FRONTIER_AUTHORITY_ITEM_IDS = {
  P1: "frontierP1Permit",
  P2: "frontierP2Permit",
  P3: "frontierP3Permit",
  P4: "frontierP4Permit",
  P5: "frontierP5Permit",
  P6: "frontierP6Permit",
};

export const DEV_BULK_GRANT_ITEM_IDS = [
  "freshAirCanister",
  "woodChip",
  "woodPlank",
  "purifyPowder",
  "stoneDust",
  "masonryStone",
];

export const DEV_MOCK_NFT_ITEMS = [
  {
    kind: "nft",
    contractAddress: "0xMockHelmetCollection",
    tokenId: "1",
    nftType: "head",
    name: "황금 안전모 NFT",
    rarity: "legendary",
    icon: "👑",
  },
];

const EQUIP_SLOT_LABELS = {
  head: "모자",
  body: "상체",
  shoes: "신발",
  tool: "도구",
};

export function createItemDefs({
  buildPickaxeModel,
  buildShovelModel,
  buildSafetyHelmetModel,
  buildBasicShoesModel,
  buildFreshAirCanisterModel,
  buildPurifyPowderModel,
  getPickaxeLevel,
}) {
  return {
    // Equipment
    pickaxe: {
      category: "equip",
      name: "곡괭이",
      icon: "⛏️",
      stackMax: 1,
      equipSlot: "tool",
      equipSlotLabel: "도구",
      rarityLabel: "일반",
      typeLabel: "채굴 도구",
      upgradeKey: "pickaxe",
      miningPowerMin: 0.9,
      miningPowerMax: 1.1,
      makeInventoryModel: () => buildPickaxeModel(getPickaxeLevel()),
    },
    shovel: {
      category: "equip",
      name: "삽",
      icon: "🪏",
      stackMax: 1,
      equipSlot: "tool",
      equipSlotLabel: "도구",
      rarityLabel: "일반",
      typeLabel: "개간 도구",
      makeInventoryModel: () => buildShovelModel(),
    },
    safetyHelmet: {
      category: "equip",
      name: "안전모",
      icon: "🪖",
      stackMax: 1,
      equipSlot: "head",
      equipSlotLabel: "모자",
      rarityLabel: "일반",
      typeLabel: "보호 장비",
      makeInventoryModel: () => buildSafetyHelmetModel(),
    },
    basicShoes: {
      category: "equip",
      name: "기본신발",
      icon: "👞",
      stackMax: 1,
      equipSlot: "shoes",
      equipSlotLabel: "신발",
      rarityLabel: "일반",
      typeLabel: "이동 장비",
      makeInventoryModel: () => buildBasicShoesModel(),
    },

    // Consumables
    freshAirCanister: {
      category: "cons",
      name: "신선한 공기 캔",
      icon: "🫧",
      stackMax: 200,
      effectText: "사용하면 공기를 회복한다",
      makeInventoryModel: () => buildFreshAirCanisterModel(),
    },

    // Misc: access / authority
    abandonedMineKey: {
      category: "misc",
      name: "폐광 열쇠",
      icon: "🗝️",
      stackMax: 1,
      purposeText: "폐광 출입에 사용된다",
    },
    frontierP1Permit: {
      category: "misc",
      name: "개척지 P1 개발권",
      icon: "📜",
      stackMax: 1,
      isAuthorityItem: true,
      purposeText: "개척지 P1 필지 운영과 건축에 사용된다",
    },
    frontierP2Permit: {
      category: "misc",
      name: "개척지 P2 개발권",
      icon: "📜",
      stackMax: 1,
      isAuthorityItem: true,
      purposeText: "개척지 P2 필지 운영과 건축에 사용된다",
    },
    frontierP3Permit: {
      category: "misc",
      name: "개척지 P3 개발권",
      icon: "📜",
      stackMax: 1,
      isAuthorityItem: true,
      purposeText: "개척지 P3 필지 운영과 건축에 사용된다",
    },
    frontierP4Permit: {
      category: "misc",
      name: "개척지 P4 개발권",
      icon: "📜",
      stackMax: 1,
      isAuthorityItem: true,
      purposeText: "개척지 P4 필지 운영과 건축에 사용된다",
    },
    frontierP5Permit: {
      category: "misc",
      name: "개척지 P5 개발권",
      icon: "📜",
      stackMax: 1,
      isAuthorityItem: true,
      purposeText: "개척지 P5 필지 운영과 건축에 사용된다",
    },
    frontierP6Permit: {
      category: "misc",
      name: "개척지 P6 개발권",
      icon: "📜",
      stackMax: 1,
      isAuthorityItem: true,
      purposeText: "개척지 P6 필지 운영과 건축에 사용된다",
    },
    mansionOneRoom101Permit: {
      category: "misc",
      name: "Mansion ONE 101호",
      icon: "🪪",
      stackMax: 1,
      isAuthorityItem: true,
      purposeText: "Mansion ONE 101호 거주와 출입에 사용된다",
    },
    mansionOneRoom102Permit: {
      category: "misc",
      name: "Mansion ONE 102호",
      icon: "🪪",
      stackMax: 1,
      isAuthorityItem: true,
      purposeText: "Mansion ONE 102호 거주와 출입에 사용된다",
    },
    fencePost: {
      category: "misc",
      name: "울타리 기둥",
      icon: "🪵",
      stackMax: 200,
      purposeText: "황무지에서 개간 구역을 선언하는 울타리 설치에 사용된다",
    },

    // Misc: materials
    woodChip: {
      category: "misc",
      name: "나무조각",
      icon: "🪹",
      stackMax: 200,
      isMaterial: true,
      purposeText: "목재 가공과 제작 재료로 사용된다",
    },
    woodPlank: {
      category: "misc",
      name: "목재",
      icon: "🟫",
      stackMax: 200,
      isMaterial: true,
      purposeText: "건축과 제작 재료로 사용된다",
    },
    purifyPowder: {
      category: "misc",
      name: "정화 가루",
      icon: "✨",
      stackMax: 200,
      isMaterial: true,
      purposeText: "공기 정화탑 가동에 사용된다",
      makeInventoryModel: () => buildPurifyPowderModel(),
    },
    stoneDust: {
      category: "misc",
      name: "돌가루",
      icon: "🪨",
      stackMax: 200,
      isMaterial: true,
      purposeText: "정제와 제작 재료로 사용된다",
    },
    masonryStone: {
      category: "misc",
      name: "석재",
      icon: "🧱",
      stackMax: 200,
      isMaterial: true,
      purposeText: "건축과 제작 재료로 사용된다",
    },
  };
}

export function getEquipSlotDisplayLabel(equipSlot) {
  return EQUIP_SLOT_LABELS[equipSlot] ?? equipSlot ?? "";
}

export function getDevMaterialItemIds(itemDefs) {
  return Object.entries(itemDefs)
    .filter(([, def]) => def?.isMaterial)
    .map(([itemId]) => itemId);
}

export function getInventoryStackMax(itemDefs, itemId, inventoryStackLimit = INVENTORY_STACK_LIMIT) {
  const def = itemDefs[itemId];
  if (!def) return 1;
  const rawStackMax = Math.max(1, def.stackMax ?? 1);
  if (def.category === "cons" || def.category === "misc") {
    return Math.min(rawStackMax, inventoryStackLimit);
  }
  return rawStackMax;
}

export function getDevBulkGrantItemIds(itemDefs, inventoryStackLimit = INVENTORY_STACK_LIMIT) {
  return DEV_BULK_GRANT_ITEM_IDS.filter((itemId) => {
    const def = itemDefs[itemId];
    return (
      def &&
      (def.category === "cons" || def.category === "misc") &&
      !def.isAuthorityItem &&
      getInventoryStackMax(itemDefs, itemId, inventoryStackLimit) > 1
    );
  });
}

let inventoryEntryInstanceSeq = 1;

export function createInventoryEntryInstanceId() {
  const seq = inventoryEntryInstanceSeq++;
  return `inv_${Date.now().toString(36)}_${seq.toString(36)}`;
}

export function createInventorySlotEntry(itemDefs, itemId, count = 1, extra = {}) {
  const stackMax = getInventoryStackMax(itemDefs, itemId);
  const instanceId =
    typeof extra.instanceId === "string" && extra.instanceId.trim()
      ? extra.instanceId
      : createInventoryEntryInstanceId();
  return {
    kind: "item",
    itemId,
    count: Math.max(1, Math.min(count, stackMax)),
    instanceId,
    ...extra,
  };
}

export function normalizeInventorySlotEntry(itemDefs, rawSlot) {
  if (!rawSlot) return null;
  if (typeof rawSlot === "string") {
    return createInventorySlotEntry(itemDefs, rawSlot, 1);
  }
  if (typeof rawSlot === "object") {
    if (rawSlot.kind === "nft" && rawSlot.contractAddress && rawSlot.tokenId) {
      return {
        ...rawSlot,
        kind: "nft",
        tokenId: String(rawSlot.tokenId),
        count: 1,
      };
    }
    if (rawSlot.kind === "item" && rawSlot.itemId) {
      const stackMax = getInventoryStackMax(itemDefs, rawSlot.itemId);
      return {
        ...rawSlot,
        kind: "item",
        itemId: rawSlot.itemId,
        count: Math.max(1, Math.min(Number.isFinite(rawSlot.count) ? rawSlot.count : 1, stackMax)),
        instanceId:
          typeof rawSlot.instanceId === "string" && rawSlot.instanceId.trim()
            ? rawSlot.instanceId
            : createInventoryEntryInstanceId(),
      };
    }
    if (rawSlot.id) {
      return createInventorySlotEntry(itemDefs, rawSlot.id, Number.isFinite(rawSlot.count) ? rawSlot.count : 1);
    }
  }
  return null;
}

export function createEquippedItemRef(itemId, extra = {}) {
  return itemId
    ? {
        kind: "item",
        itemId,
        ...extra,
      }
    : null;
}

export function normalizeEquippedItemRef(rawRef) {
  if (!rawRef) return null;
  if (typeof rawRef === "string") {
    return createEquippedItemRef(rawRef);
  }
  if (typeof rawRef === "object") {
    if (rawRef.kind === "nft" && rawRef.contractAddress && rawRef.tokenId) {
      return {
        ...rawRef,
        kind: "nft",
        tokenId: String(rawRef.tokenId),
      };
    }
    if (rawRef.kind === "item" && rawRef.itemId) {
      return {
        ...rawRef,
        kind: "item",
        itemId: rawRef.itemId,
        instanceId:
          typeof rawRef.instanceId === "string" && rawRef.instanceId.trim()
            ? rawRef.instanceId
            : null,
      };
    }
    if (rawRef.itemId) {
      return createEquippedItemRef(rawRef.itemId);
    }
  }
  return null;
}

export function getSlotItemId(slot) {
  return slot?.itemId ?? slot?.id ?? null;
}

export function getSlotItemCount(slot) {
  return Number.isFinite(slot?.count) ? slot.count : 0;
}

export function isNftInventoryEntry(entry) {
  return entry?.kind === "nft";
}

export function isSameInventoryEntryAsEquipped(entry, equippedRef) {
  if (!entry || !equippedRef) return false;
  if (isNftInventoryEntry(entry)) {
    return (
      equippedRef.kind === "nft" &&
      equippedRef.contractAddress === entry.contractAddress &&
      String(equippedRef.tokenId) === String(entry.tokenId)
    );
  }

  if (equippedRef.kind !== "item") return false;
  if (entry.instanceId && equippedRef.instanceId) {
    return entry.instanceId === equippedRef.instanceId;
  }
  return equippedRef.itemId === getSlotItemId(entry);
}

export function getInventoryEntryCategory(itemDefs, entry) {
  if (!entry) return null;
  if (isNftInventoryEntry(entry)) {
    const nftType = entry.nftType ?? "";
    return ["tool", "head", "body", "shoes"].includes(nftType) ? "equip" : "misc";
  }
  const itemId = getSlotItemId(entry);
  return itemDefs[itemId]?.category ?? null;
}

export function getInventoryEntryEquipSlot(itemDefs, entry) {
  if (!entry) return null;
  if (isNftInventoryEntry(entry)) {
    return entry.nftType ?? null;
  }
  const itemId = getSlotItemId(entry);
  return itemDefs[itemId]?.equipSlot ?? null;
}

export function getInventoryEntryDisplayName(itemDefs, entry) {
  if (!entry) return "";
  if (isNftInventoryEntry(entry)) {
    return entry.name ?? `NFT #${entry.tokenId}`;
  }
  const itemId = getSlotItemId(entry);
  const def = itemDefs[itemId];
  if (itemId === "pickaxe" && Number.isFinite(entry?.pickaxeLevel)) {
    return `${def?.name ?? itemId} Lv.${entry.pickaxeLevel}`;
  }
  return def?.name ?? itemId ?? "";
}

export function getInventoryEntryDisplayIcon(itemDefs, entry) {
  if (!entry) return "?";
  if (isNftInventoryEntry(entry)) {
    return entry.icon ?? "🧿";
  }
  const itemId = getSlotItemId(entry);
  return itemDefs[itemId]?.icon ?? "?";
}

export function getInventoryEntryTooltipData(itemDefs, entry) {
  if (!entry) return null;
  if (isNftInventoryEntry(entry)) {
    return {
      title: entry.name ?? `NFT #${entry.tokenId}`,
      lines: [
        `장착 슬롯: ${getEquipSlotDisplayLabel(entry.nftType) || "NFT"}`,
        `희귀도: ${entry.rarity || "고유"}`,
        "타입: NFT 장비",
      ],
    };
  }

  const itemId = getSlotItemId(entry);
  const def = itemDefs[itemId];
  if (!def) {
    return {
      title: itemId ?? "알 수 없는 아이템",
      lines: [],
    };
  }

  if (def.category === "equip") {
    return {
      title:
        itemId === "pickaxe" && Number.isFinite(entry?.pickaxeLevel)
          ? `${def.name} Lv.${entry.pickaxeLevel}`
          : def.name,
      lines: [
        `장착 슬롯: ${def.equipSlotLabel || getEquipSlotDisplayLabel(def.equipSlot)}`,
        `희귀도: ${def.rarityLabel || "일반"}`,
        `타입: ${def.typeLabel || "장비"}`,
      ],
    };
  }

  if (def.category === "cons") {
    return {
      title: def.name,
      lines: [`효과: ${def.effectText || "사용 효과가 설정되지 않았다"}`],
    };
  }

  return {
    title: def.name,
    lines: [`용도: ${def.purposeText || "용도가 설정되지 않았다"}`],
  };
}
