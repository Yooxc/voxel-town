import assert from "node:assert/strict";
import test from "node:test";
import { REBUILD_STORAGE_PREFIX, createRuntimeEnvironment } from "../src/core/runtimeEnvironment.js";

test("legacy runtime environment preserves every existing storage key and API address", () => {
  const environment = createRuntimeEnvironment("development");

  assert.equal(environment.mode, "legacy");
  assert.equal(environment.authApiBaseUrl, "http://localhost:8787");
  assert.equal(environment.airHudPositionKey, "excit_air_hud_position_v1");
  assert.equal(environment.walletSessionKey, "voxel-town.wallet-auth.v1");
  assert.equal(environment.devActiveProfileKey, "voxel-town.dev-active-profile.v1");
  assert.equal(environment.devProfileSavePrefix, "voxel-town.dev-profile-save.v1.");
  assert.equal(environment.devCreditsMigrationPrefix, "voxel-town.dev-credits-migrated.v1.");
  assert.equal(environment.devInventorySeedPrefix, "voxel-town.dev-inventory-seed.v3.");
  assert.equal(environment.devProfileFailedLoadPrefix, "voxel-town.dev-profile-load-error.v1.");
  assert.equal(environment.devSharedWorldKey, "voxel-town.dev-shared-world.v1");
  assert.equal(environment.guestSaveKey, "voxel-town.guest-profile-save.v1");
});

test("rebuild runtime environment isolates every persistent key and uses its own API", () => {
  const legacy = createRuntimeEnvironment("development");
  const rebuild = createRuntimeEnvironment("rebuild");

  assert.equal(rebuild.mode, "rebuild");
  assert.equal(rebuild.authApiBaseUrl, "http://localhost:8788");
  for (const [name, value] of Object.entries(rebuild)) {
    if (!name.endsWith("Key") && !name.endsWith("Prefix")) continue;
    assert.ok(value.startsWith(REBUILD_STORAGE_PREFIX), `${name} must be namespaced`);
    assert.notEqual(value, legacy[name]);
  }
});
