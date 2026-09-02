import { resetSerializedDevProfileTestState } from "./playerProfileStateCoordinator.js";

function parseStoredProfile(raw, createDefaultPlayerSave) {
  if (!raw) return createDefaultPlayerSave();
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : createDefaultPlayerSave();
  } catch {
    return createDefaultPlayerSave();
  }
}

export function createDevTestEnvironmentCoordinator(ctx) {
  function createProfileBaselineState(profileId) {
    const normalizedProfileId = ctx.sanitizeProfileId(profileId);
    const defaultSave = ctx.createDefaultPlayerSave();
    const slotCount = typeof ctx.getInventorySlotCount === "function"
      ? ctx.getInventorySlotCount(normalizedProfileId)
      : defaultSave.inventory.slots.length;
    const slots = Array.from({ length: slotCount }, () => null);
    const grants = new Map();
    const grant = (itemId, count = 1) => grants.set(itemId, count);

    grant("pickaxe", 1);
    grant("shovel", 1);
    grant("safetyHelmet", 1);
    grant("fencePost", ctx.inventoryStackLimit);
    for (const itemId of ctx.wastelandBuildPartItemIds) grant(itemId, ctx.inventoryStackLimit);
    for (const itemId of ctx.devBulkGrantItemIds) grant(itemId, ctx.inventoryStackLimit);
    grant("abandonedMineKey", 1);

    if (normalizedProfileId === "dev_user_2") {
      grant("mansionOneRoom102Permit", 1);
    } else {
      for (const label of ctx.frontierParcelLabels) {
        const permitId = ctx.getFrontierParcelAuthorityItemId(label);
        if (permitId) grant(permitId, 1);
      }
      grant("mansionOneRoom101Permit", 1);
    }

    const entries = [
      ...[...grants].map(([itemId, count]) => ctx.createInventorySlotEntry(itemId, count)),
      ...ctx.devMockNftItems.map((entry) => structuredClone(entry)),
    ];
    if (entries.length > slots.length) {
      throw new Error(`Developer baseline inventory exceeds ${slots.length} slots.`);
    }
    for (let index = 0; index < entries.length; index += 1) slots[index] = entries[index];

    return {
      inventory: {
        ...defaultSave.inventory,
        slots,
        pickaxeLevel: normalizedProfileId === "dev_user_2" ? 1 : 5,
        mineKeyIssued: true,
        abandonedMineUnlocked: false,
        equipped: {
          ...defaultSave.inventory.equipped,
          head: ctx.createEquippedItemRef("safetyHelmet"),
          tool: ctx.createEquippedItemRef("pickaxe"),
        },
      },
      personalStorage: structuredClone(defaultSave.personalStorage),
      credits: 500,
    };
  }

  function createResetSave(profileId, rawSave) {
    const baseline = createProfileBaselineState(profileId);
    const start = ctx.getProfileStartPosition(profileId);
    return resetSerializedDevProfileTestState(rawSave, {
      startPosition: { ...start, y: ctx.startY },
      airGaugeMax: ctx.airGaugeMax,
      landDeedItemId: ctx.landDeedItemId,
      baselineInventory: baseline.inventory,
      baselinePersonalStorage: baseline.personalStorage,
      credits: baseline.credits,
    });
  }

  function resetProfiles(activeProfileId) {
    const normalizedActiveProfileId = ctx.sanitizeProfileId(activeProfileId);
    const resetSaves = new Map();

    for (const profileId of ctx.profileIds) {
      const rawSave = profileId === normalizedActiveProfileId
        ? ctx.serializeActiveProfileState()
        : parseStoredProfile(ctx.storage.getItem(ctx.getProfileSaveKey(profileId)), ctx.createDefaultPlayerSave);
      resetSaves.set(profileId, createResetSave(profileId, rawSave));
    }

    for (const profileId of ctx.profileIds) {
      if (profileId === normalizedActiveProfileId) continue;
      ctx.storage.setItem(ctx.getProfileSaveKey(profileId), JSON.stringify(resetSaves.get(profileId)));
    }

    ctx.applyActiveProfileState(resetSaves.get(normalizedActiveProfileId), {
      preserveSharedWorld: true,
    });
    ctx.saveActiveProfileState();

    for (const profileId of ctx.profileIds) {
      ctx.storage.setItem(ctx.getCreditsMigrationKey(profileId), "1");
      ctx.storage.setItem(ctx.getInventorySeedKey(profileId), "1");
    }

    return {
      activeProfileId: normalizedActiveProfileId,
      resetProfileIds: [...ctx.profileIds],
    };
  }

  return {
    createProfileBaselineState,
    resetProfiles,
  };
}
