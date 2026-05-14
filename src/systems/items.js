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

export function createItemDefs({
  buildPickaxeModel,
  buildSafetyHelmetModel,
  buildBasicShoesModel,
  buildFreshAirCanisterModel,
  buildPurifyPowderModel,
  getPickaxeLevel,
}) {
  return {
    pickaxe: {
      name: "곡괭이",
      icon: "⛏️",
      stackMax: 1,
      category: "equip",
      equipSlot: "tool",
      upgradeKey: "pickaxe",
      miningPowerMin: 0.9,
      miningPowerMax: 1.1,
      makeInventoryModel: () => buildPickaxeModel(getPickaxeLevel()),
    },
    safetyHelmet: {
      name: "안전모",
      icon: "🪖",
      stackMax: 1,
      category: "equip",
      equipSlot: "head",
      makeInventoryModel: () => buildSafetyHelmetModel(),
    },
    basicShoes: {
      name: "기본신발",
      icon: "👞",
      stackMax: 1,
      category: "equip",
      equipSlot: "shoes",
      makeInventoryModel: () => buildBasicShoesModel(),
    },
    abandonedMineKey: {
      name: "폐광 열쇠",
      icon: "🗝️",
      stackMax: 1,
      category: "misc",
    },
    frontierP1Permit: { name: "개척지 P1 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
    frontierP2Permit: { name: "개척지 P2 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
    frontierP3Permit: { name: "개척지 P3 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
    frontierP4Permit: { name: "개척지 P4 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
    frontierP5Permit: { name: "개척지 P5 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
    frontierP6Permit: { name: "개척지 P6 개발권", icon: "📜", stackMax: 1, category: "misc", isAuthorityItem: true },
    mansionOneRoom101Permit: {
      name: "Mansion ONE 101호",
      icon: "🪪",
      stackMax: 1,
      category: "misc",
      isAuthorityItem: true,
    },
    mansionOneRoom102Permit: {
      name: "Mansion ONE 102호",
      icon: "🪪",
      stackMax: 1,
      category: "misc",
      isAuthorityItem: true,
    },
    freshAirCanister: {
      name: "신선한 공기 캔",
      icon: "🫧",
      stackMax: 200,
      category: "cons",
      makeInventoryModel: () => buildFreshAirCanisterModel(),
    },
    woodChip: {
      name: "나무조각",
      icon: "🪹",
      stackMax: 200,
      category: "misc",
      isMaterial: true,
    },
    woodPlank: {
      name: "목재",
      icon: "🟫",
      stackMax: 200,
      category: "misc",
      isMaterial: true,
    },
    purifyPowder: {
      name: "정화 가루",
      icon: "✨",
      stackMax: 200,
      category: "misc",
      isMaterial: true,
      makeInventoryModel: () => buildPurifyPowderModel(),
    },
    stoneDust: { name: "돌가루", icon: "🪨", stackMax: 200, category: "misc", isMaterial: true },
    masonryStone: { name: "석재", icon: "🧱", stackMax: 200, category: "misc", isMaterial: true },
  };
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
