import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  createPickupBasicShoes,
  createPickupPickaxe,
  createPickupSafetyHelmet,
  createPickupShovel,
} from "../src/world/pickupEquipmentModels.js";

function buildModel() {
  return new THREE.Group();
}

test("creates pickup equipment with positions and default tool rotations", () => {
  const pickaxe = createPickupPickaxe({ buildPickaxeModel: buildModel, x: 1, y: 2, z: 3, level: 4 });
  const shovel = createPickupShovel({ buildShovelModel: buildModel, x: -1, y: 0, z: 2 });
  assert.deepEqual(pickaxe.position.toArray(), [1, 2, 3]);
  assert.equal(pickaxe.userData.pickaxeLevel, 4);
  assert.equal(pickaxe.rotation.z, Math.PI * 0.15);
  assert.equal(shovel.userData.isShovel, true);
  assert.equal(shovel.rotation.z, Math.PI * 0.12);
});

test("keeps supplied rotations and identifies wearable pickups", () => {
  const rotation = { x: 0.1, y: 0.2, z: 0.3 };
  const helmet = createPickupSafetyHelmet({ buildSafetyHelmetModel: buildModel, x: 0, z: 0, rotation });
  const shoes = createPickupBasicShoes({ buildBasicShoesModel: buildModel, x: 2, z: -2, rotation });
  assert.deepEqual(helmet.rotation.toArray(), [0.1, 0.2, 0.3, "XYZ"]);
  assert.equal(helmet.userData.isSafetyHelmet, true);
  assert.equal(shoes.userData.isBasicShoes, true);
});
