function applyWorldTransform(model, x, z, y, rotation) {
  model.position.set(x, y, z);
  if (rotation) model.rotation.set(rotation.x, rotation.y, rotation.z);
  return model;
}

export function createPickupPickaxe({ buildPickaxeModel, x, z, y = 0, rotation = null, level = 1 }) {
  const model = applyWorldTransform(buildPickaxeModel(level), x, z, y, rotation);
  if (!rotation) model.rotation.z = Math.PI * 0.15;
  model.userData.isPickaxe = true;
  model.userData.pickaxeLevel = level;
  return model;
}

export function createPickupShovel({ buildShovelModel, x, z, y = 0, rotation = null }) {
  const model = applyWorldTransform(buildShovelModel(), x, z, y, rotation);
  if (!rotation) model.rotation.z = Math.PI * 0.12;
  model.userData.isShovel = true;
  return model;
}

export function createPickupSafetyHelmet({ buildSafetyHelmetModel, x, z, y = 0, rotation = null }) {
  const model = applyWorldTransform(buildSafetyHelmetModel(), x, z, y, rotation);
  model.userData.isSafetyHelmet = true;
  return model;
}

export function createPickupBasicShoes({ buildBasicShoesModel, x, z, y = 0, rotation = null }) {
  const model = applyWorldTransform(buildBasicShoesModel(), x, z, y, rotation);
  model.userData.isBasicShoes = true;
  return model;
}
