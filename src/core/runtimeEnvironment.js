const LEGACY_STORAGE_KEYS = Object.freeze({
  airHudPositionKey: "excit_air_hud_position_v1",
  walletSessionKey: "voxel-town.wallet-auth.v1",
  devActiveProfileKey: "voxel-town.dev-active-profile.v1",
  devProfileSavePrefix: "voxel-town.dev-profile-save.v1.",
  devCreditsMigrationPrefix: "voxel-town.dev-credits-migrated.v1.",
  devInventorySeedPrefix: "voxel-town.dev-inventory-seed.v3.",
  devProfileFailedLoadPrefix: "voxel-town.dev-profile-load-error.v1.",
  devSharedWorldKey: "voxel-town.dev-shared-world.v1",
  guestSaveKey: "voxel-town.guest-profile-save.v1",
});

export const REBUILD_STORAGE_PREFIX = "excit.rebuild.v1.";

export function createRuntimeEnvironment(mode = "development") {
  const isRebuild = mode === "rebuild";
  const namespaceKey = (key) => isRebuild ? `${REBUILD_STORAGE_PREFIX}${key}` : key;

  return Object.freeze({
    mode: isRebuild ? "rebuild" : "legacy",
    isRebuild,
    authApiBaseUrl: isRebuild ? "http://localhost:8788" : "http://localhost:8787",
    airHudPositionKey: namespaceKey(LEGACY_STORAGE_KEYS.airHudPositionKey),
    walletSessionKey: namespaceKey(LEGACY_STORAGE_KEYS.walletSessionKey),
    devActiveProfileKey: namespaceKey(LEGACY_STORAGE_KEYS.devActiveProfileKey),
    devProfileSavePrefix: namespaceKey(LEGACY_STORAGE_KEYS.devProfileSavePrefix),
    devCreditsMigrationPrefix: namespaceKey(LEGACY_STORAGE_KEYS.devCreditsMigrationPrefix),
    devInventorySeedPrefix: namespaceKey(LEGACY_STORAGE_KEYS.devInventorySeedPrefix),
    devProfileFailedLoadPrefix: namespaceKey(LEGACY_STORAGE_KEYS.devProfileFailedLoadPrefix),
    devSharedWorldKey: namespaceKey(LEGACY_STORAGE_KEYS.devSharedWorldKey),
    guestSaveKey: namespaceKey(LEGACY_STORAGE_KEYS.guestSaveKey),
  });
}
