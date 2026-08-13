import test from "node:test";
import assert from "node:assert/strict";
import {
  createRockMiningPlan,
  createTreeHarvestPlan,
} from "../src/systems/resourceGathering.js";

test("creates a tree harvest plan with the current shake window", () => {
  assert.deepEqual(createTreeHarvestPlan({ itemId: "wood", count: 2, now: 100 }), {
    itemId: "wood",
    count: 2,
    shakeStartedAt: 100,
    shakeUntil: 480,
  });
});

test("reports the existing pickaxe equipment restrictions", () => {
  assert.deepEqual(createRockMiningPlan({
    isPickaxeEquipped: false,
    hasOwnedPickaxe: true,
  }), { status: "blocked", reason: "equip-pickaxe" });

  assert.deepEqual(createRockMiningPlan({
    isPickaxeEquipped: true,
    miningPower: 1,
    equippedPickaxeLevel: 1,
    requiredPickaxeLevel: 2,
  }), { status: "blocked", reason: "pickaxe-level-required" });
});

test("returns partial damage and destroys low-health rocks with the current threshold", () => {
  assert.deepEqual(createRockMiningPlan({
    hp: 3,
    maxHp: 3,
    miningPower: 1,
    isPickaxeEquipped: true,
  }), { status: "damaged", remainingHp: 2 });

  assert.deepEqual(createRockMiningPlan({
    hp: 1,
    maxHp: 1,
    miningPower: 0.9,
    isPickaxeEquipped: true,
  }), { status: "destroyed", remainingHp: 0 });
});
