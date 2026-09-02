import test from "node:test";
import assert from "node:assert/strict";
import { createFrontierFeatureCoordinator } from "../src/world/frontierFeatureCoordinator.js";

test("credits the active seller directly and persists another development seller", () => {
  const stored = new Map();
  let activeCredits = 0;
  const feature = createFrontierFeatureCoordinator({
    getWalletAddress: () => "dev_user_1",
    clampCredits: (value) => Math.max(0, Math.floor(Number(value) || 0)),
    grantCredits: (value) => { activeCredits += value; },
    devProfileIds: ["dev_user_1", "dev_user_2"],
    getDevProfileSaveKey: (profileId) => `profile:${profileId}`,
    createDefaultPlayerSave: () => ({ economy: { credits: 0 } }),
    storage: { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) },
    normalizeBuildStateOptions: () => ({ parcelLabels: [], itemDefs: {}, clampPlayerCredits: (value) => value }),
  });

  assert.equal(feature.grantOfflineSellerCredits("dev_user_1", 25), true);
  assert.equal(activeCredits, 25);
  assert.equal(feature.grantOfflineSellerCredits("dev_user_2", 40), true);
  assert.equal(JSON.parse(stored.get("profile:dev_user_2")).economy.credits, 40);
  assert.equal(feature.grantOfflineSellerCredits("unknown", 10), false);
});

test("delegates build operations after the parcel coordinator is set", () => {
  const feature = createFrontierFeatureCoordinator({
    getWalletAddress: () => "dev_user_1", clampCredits: (value) => value, grantCredits() {}, devProfileIds: [],
    getDevProfileSaveKey: () => "", createDefaultPlayerSave: () => ({ economy: { credits: 0 } }),
    storage: { getItem: () => null, setItem() {} }, normalizeBuildStateOptions: () => ({}),
  });
  const coordinator = {
    getSelectedParcelLabel: () => "P6",
    tryAdvanceBuildStage: () => true,
    setBuildOpen: (open) => `open:${open}`,
  };
  feature.setParcelCoordinator(coordinator);
  assert.equal(feature.getSelectedParcelLabel(), "P6");
  assert.equal(feature.tryAdvanceBuildStage(), true);
  assert.equal(feature.setBuildOpen(false), "open:false");
});
