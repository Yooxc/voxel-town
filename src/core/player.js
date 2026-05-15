import * as THREE from "three";

export function createPlayerRig() {
  const player = new THREE.Group();
  player.name = "playerRoot";

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.9 });
  const limbMat = new THREE.MeshStandardMaterial({ color: 0xb5b5b5, roughness: 0.95 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.36), bodyMat);
  torso.name = "torso";
  torso.position.y = 1.35;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), bodyMat);
  head.name = "head";
  head.scale.set(0.85, 1.2, 0.82);
  head.position.y = 2.1;

  const leftArmPivot = new THREE.Group();
  leftArmPivot.name = "leftArmPivot";
  leftArmPivot.position.set(-0.47, 1.8, 0);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.name = "rightArmPivot";
  rightArmPivot.position.set(0.47, 1.8, 0);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.22), limbMat);
  leftArm.name = "leftArm";
  leftArm.position.set(0, -0.42, 0);

  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.22), limbMat);
  rightArm.name = "rightArm";
  rightArm.position.set(0, -0.42, 0);

  leftArmPivot.add(leftArm);
  rightArmPivot.add(rightArm);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.name = "leftLegPivot";
  leftLegPivot.position.set(-0.18, 0.9, 0);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.name = "rightLegPivot";
  rightLegPivot.position.set(0.18, 0.9, 0);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.26), limbMat);
  leftLeg.name = "leftLeg";
  leftLeg.position.set(0, -0.45, 0);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.26), limbMat);
  rightLeg.name = "rightLeg";
  rightLeg.position.set(0, -0.45, 0);

  leftLegPivot.add(leftLeg);
  rightLegPivot.add(rightLeg);

  player.add(torso, head, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot);
  player.position.set(0, 0, 0);

  return player;
}

export function getPlayerRigParts(root) {
  return {
    torso: root?.getObjectByName("torso") ?? null,
    head: root?.getObjectByName("head") ?? null,
    leftArmPivot: root?.getObjectByName("leftArmPivot") ?? null,
    rightArmPivot: root?.getObjectByName("rightArmPivot") ?? null,
    leftArm: root?.getObjectByName("leftArm") ?? null,
    rightArm: root?.getObjectByName("rightArm") ?? null,
    leftLegPivot: root?.getObjectByName("leftLegPivot") ?? null,
    rightLegPivot: root?.getObjectByName("rightLegPivot") ?? null,
    leftLeg: root?.getObjectByName("leftLeg") ?? null,
    rightLeg: root?.getObjectByName("rightLeg") ?? null,
    equippedPickaxe: root?.getObjectByName("equippedPickaxe") ?? null,
    equippedSafetyHelmet: root?.getObjectByName("equippedSafetyHelmet") ?? null,
    equippedNftHelmet: root?.getObjectByName("equippedNftHelmet") ?? null,
  };
}

export function createPlayerEquipmentVisuals(
  parts,
  { buildSafetyHelmetModel, buildSingleBasicShoeModel, alignWearableOnHead }
) {
  const equippedPickaxe = new THREE.Group();
  equippedPickaxe.name = "equippedPickaxe";
  equippedPickaxe.scale.setScalar(0.8);
  equippedPickaxe.position.set(0.01, -0.44, 0.07);
  equippedPickaxe.rotation.set(Math.PI * 0.5, Math.PI * 0.03, -Math.PI * 0.08);
  equippedPickaxe.visible = false;
  parts.leftArm?.add(equippedPickaxe);

  const equippedSafetyHelmet = buildSafetyHelmetModel();
  equippedSafetyHelmet.name = "equippedSafetyHelmet";
  equippedSafetyHelmet.scale.setScalar(0.72);
  equippedSafetyHelmet.visible = false;
  parts.head?.add(equippedSafetyHelmet);
  alignWearableOnHead(parts.head, equippedSafetyHelmet, {
    verticalInset: 0.36,
    forwardBias: 0.06,
  });

  const equippedNftHelmet = buildSafetyHelmetModel("gold");
  equippedNftHelmet.name = "equippedNftHelmet";
  equippedNftHelmet.scale.setScalar(0.72);
  equippedNftHelmet.visible = false;
  parts.head?.add(equippedNftHelmet);
  alignWearableOnHead(parts.head, equippedNftHelmet, {
    verticalInset: 0.36,
    forwardBias: 0.06,
  });

  const leftFootAnchor = new THREE.Group();
  leftFootAnchor.name = "leftFootAnchor";
  leftFootAnchor.position.set(0, -0.9, 0.05);
  parts.leftLegPivot?.add(leftFootAnchor);

  const rightFootAnchor = new THREE.Group();
  rightFootAnchor.name = "rightFootAnchor";
  rightFootAnchor.position.set(0, -0.9, 0.05);
  parts.rightLegPivot?.add(rightFootAnchor);

  const equippedLeftShoe = buildSingleBasicShoeModel();
  equippedLeftShoe.name = "equippedBasicShoeLeft";
  equippedLeftShoe.scale.setScalar(0.96);
  equippedLeftShoe.visible = false;
  equippedLeftShoe.position.set(0, 0, 0);
  leftFootAnchor.add(equippedLeftShoe);

  const equippedRightShoe = buildSingleBasicShoeModel();
  equippedRightShoe.name = "equippedBasicShoeRight";
  equippedRightShoe.scale.setScalar(0.96);
  equippedRightShoe.visible = false;
  equippedRightShoe.position.set(0, 0, 0);
  rightFootAnchor.add(equippedRightShoe);

  return {
    equippedPickaxe,
    equippedSafetyHelmet,
    equippedNftHelmet,
    equippedLeftShoe,
    equippedRightShoe,
    leftFootAnchor,
    rightFootAnchor,
  };
}

export function updatePlayerEquipmentVisualsVisibility(visuals, state) {
  visuals.equippedPickaxe.visible = state.hasPickaxeEquipped;
  visuals.equippedSafetyHelmet.visible = state.isSafetyHelmetEquipped;
  visuals.equippedNftHelmet.visible = state.isNftHelmetEquipped;
  visuals.equippedLeftShoe.visible = state.shoesVisible;
  visuals.equippedRightShoe.visible = state.shoesVisible;
}

export function applySleepPose(parts) {
  parts.leftArmPivot.rotation.x = THREE.MathUtils.lerp(parts.leftArmPivot.rotation.x, -1.18, 0.22);
  parts.rightArmPivot.rotation.x = THREE.MathUtils.lerp(parts.rightArmPivot.rotation.x, -1.18, 0.22);
  parts.leftLegPivot.rotation.x = THREE.MathUtils.lerp(parts.leftLegPivot.rotation.x, 0.12, 0.18);
  parts.rightLegPivot.rotation.x = THREE.MathUtils.lerp(parts.rightLegPivot.rotation.x, 0.08, 0.18);
  parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, 0, 0.16);
  parts.torso.rotation.y = THREE.MathUtils.lerp(parts.torso.rotation.y, 0, 0.16);
  parts.torso.rotation.z = THREE.MathUtils.lerp(parts.torso.rotation.z, -Math.PI * 0.48, 0.16);
  parts.torso.position.y = THREE.MathUtils.lerp(parts.torso.position.y, 1.02, 0.18);
  parts.torso.position.z = THREE.MathUtils.lerp(parts.torso.position.z, 0.08, 0.18);
  parts.head.position.y = THREE.MathUtils.lerp(parts.head.position.y, 1.78, 0.18);
  parts.head.position.z = THREE.MathUtils.lerp(parts.head.position.z, 0.15, 0.18);
  parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, 0.04, 0.18);
  parts.leftArmPivot.rotation.z = THREE.MathUtils.lerp(parts.leftArmPivot.rotation.z, -0.18, 0.18);
  parts.rightArmPivot.rotation.z = THREE.MathUtils.lerp(parts.rightArmPivot.rotation.z, 0.18, 0.18);
}

export function applyWalkIdlePose(parts, { isMoving, walkT, walkAnimSpeed }) {
  const torsoBaseY = 1.35;
  const torsoBaseZ = 0;
  const headBaseY = 2.1;
  const headBaseZ = 0;

  if (isMoving) {
    const walkPhase = walkT * (typeof walkAnimSpeed === "number" ? walkAnimSpeed : 1.0);
    const armSwing = Math.sin(walkPhase) * (typeof walkAnimSpeed === "number" && walkAnimSpeed > 1 ? 0.76 : 0.65);
    const legSwing = Math.sin(walkPhase) * (typeof walkAnimSpeed === "number" && walkAnimSpeed > 1 ? 0.88 : 0.75);
    parts.leftArmPivot.rotation.x = armSwing;
    parts.rightArmPivot.rotation.x = -armSwing;
    parts.leftLegPivot.rotation.x = -legSwing;
    parts.rightLegPivot.rotation.x = legSwing;
    parts.torso.rotation.x = Math.sin(walkPhase * 2) * 0.04;
  } else {
    parts.leftArmPivot.rotation.x *= 0.8;
    parts.rightArmPivot.rotation.x *= 0.8;
    parts.leftLegPivot.rotation.x *= 0.8;
    parts.rightLegPivot.rotation.x *= 0.8;
    parts.torso.rotation.x *= 0.8;
  }

  parts.torso.rotation.y = THREE.MathUtils.lerp(parts.torso.rotation.y, 0, 0.18);
  parts.torso.rotation.z = THREE.MathUtils.lerp(parts.torso.rotation.z, 0, 0.18);
  parts.torso.position.y = THREE.MathUtils.lerp(parts.torso.position.y, torsoBaseY, 0.18);
  parts.torso.position.z = THREE.MathUtils.lerp(parts.torso.position.z, torsoBaseZ, 0.18);
  parts.head.position.y = THREE.MathUtils.lerp(parts.head.position.y, headBaseY, 0.18);
  parts.head.position.z = THREE.MathUtils.lerp(parts.head.position.z, headBaseZ, 0.18);
  parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, 0, 0.18);
  parts.leftArmPivot.rotation.z = THREE.MathUtils.lerp(parts.leftArmPivot.rotation.z, 0, 0.22);
  parts.rightArmPivot.rotation.z = THREE.MathUtils.lerp(parts.rightArmPivot.rotation.z, 0, 0.22);

  return { torsoBaseY, torsoBaseZ, headBaseY, headBaseZ };
}

export function applyMiningSwingPose(parts, phase, basePose) {
  let mainSwing = 0;
  let supportSwing = 0;
  let torsoBend = 0;
  let torsoTwist = 0;
  let torsoTilt = 0;
  let torsoDrop = 0;
  let torsoDrive = 0;
  let headDrop = 0;
  let headNod = 0;
  let leadLeg = 0;
  let trailLeg = 0;
  let mainArmRoll = 0;
  let supportArmRoll = 0;

  if (phase < 0.32) {
    const t = phase / 0.32;
    mainSwing = THREE.MathUtils.lerp(0.25, -1.7, t);
    supportSwing = THREE.MathUtils.lerp(-0.08, -0.65, t);
    torsoBend = THREE.MathUtils.lerp(0.02, -0.22, t);
    torsoTwist = THREE.MathUtils.lerp(-0.04, -0.2, t);
    torsoTilt = THREE.MathUtils.lerp(0.02, 0.12, t);
    torsoDrop = THREE.MathUtils.lerp(-0.02, -0.09, t);
    torsoDrive = THREE.MathUtils.lerp(-0.01, -0.06, t);
    headDrop = THREE.MathUtils.lerp(-0.01, -0.05, t);
    headNod = THREE.MathUtils.lerp(-0.02, -0.08, t);
    leadLeg = THREE.MathUtils.lerp(0.02, 0.14, t);
    trailLeg = THREE.MathUtils.lerp(-0.01, 0.08, t);
    mainArmRoll = THREE.MathUtils.lerp(0.02, 0.16, t);
    supportArmRoll = THREE.MathUtils.lerp(-0.02, -0.08, t);
  } else if (phase < 0.74) {
    const t = (phase - 0.32) / 0.42;
    mainSwing = THREE.MathUtils.lerp(-1.7, 1.85, t);
    supportSwing = THREE.MathUtils.lerp(-0.65, 0.48, t);
    torsoBend = THREE.MathUtils.lerp(-0.22, 0.34, t);
    torsoTwist = THREE.MathUtils.lerp(-0.2, 0.18, t);
    torsoTilt = THREE.MathUtils.lerp(0.12, -0.08, t);
    torsoDrop = THREE.MathUtils.lerp(-0.09, -0.17, t);
    torsoDrive = THREE.MathUtils.lerp(-0.06, 0.12, t);
    headDrop = THREE.MathUtils.lerp(-0.05, -0.12, t);
    headNod = THREE.MathUtils.lerp(-0.08, 0.2, t);
    leadLeg = THREE.MathUtils.lerp(0.14, -0.08, t);
    trailLeg = THREE.MathUtils.lerp(0.08, 0.26, t);
    mainArmRoll = THREE.MathUtils.lerp(0.16, -0.12, t);
    supportArmRoll = THREE.MathUtils.lerp(-0.08, -0.18, t);
  } else {
    const t = (phase - 0.74) / 0.26;
    mainSwing = THREE.MathUtils.lerp(1.85, 0.82, t);
    supportSwing = THREE.MathUtils.lerp(0.48, 0.08, t);
    torsoBend = THREE.MathUtils.lerp(0.34, 0.08, t);
    torsoTwist = THREE.MathUtils.lerp(0.18, 0.04, t);
    torsoTilt = THREE.MathUtils.lerp(-0.08, -0.02, t);
    torsoDrop = THREE.MathUtils.lerp(-0.17, -0.04, t);
    torsoDrive = THREE.MathUtils.lerp(0.12, 0.03, t);
    headDrop = THREE.MathUtils.lerp(-0.12, -0.03, t);
    headNod = THREE.MathUtils.lerp(0.2, 0.05, t);
    leadLeg = THREE.MathUtils.lerp(-0.08, 0.03, t);
    trailLeg = THREE.MathUtils.lerp(0.26, 0.06, t);
    mainArmRoll = THREE.MathUtils.lerp(-0.12, -0.02, t);
    supportArmRoll = THREE.MathUtils.lerp(-0.18, -0.04, t);
  }

  parts.leftArmPivot.rotation.x = mainSwing;
  parts.rightArmPivot.rotation.x = supportSwing;
  parts.leftArmPivot.rotation.z = mainArmRoll;
  parts.rightArmPivot.rotation.z = supportArmRoll;
  parts.torso.rotation.x = torsoBend;
  parts.torso.rotation.y = torsoTwist;
  parts.torso.rotation.z = torsoTilt;
  parts.torso.position.y = basePose.torsoBaseY + torsoDrop;
  parts.torso.position.z = basePose.torsoBaseZ + torsoDrive;
  parts.head.position.y = basePose.headBaseY + headDrop;
  parts.head.position.z = basePose.headBaseZ + torsoDrive * 0.5;
  parts.head.rotation.x = headNod;
  parts.leftLegPivot.rotation.x = leadLeg;
  parts.rightLegPivot.rotation.x = trailLeg;
}

export function applyPickupReachPose(parts, reach) {
  parts.leftArmPivot.rotation.x = THREE.MathUtils.lerp(0.12, -0.95, reach);
  parts.rightArmPivot.rotation.x = THREE.MathUtils.lerp(-0.08, -0.35, reach * 0.85);
  parts.torso.rotation.x = THREE.MathUtils.lerp(0, 0.18, reach);
  parts.leftLegPivot.rotation.x *= 0.7;
  parts.rightLegPivot.rotation.x *= 0.7;
}

export function syncPreviewPlayerPose({ previewPlayer, previewParts, player, sourceParts, equipmentVisibility }) {
  previewPlayer.rotation.y = player.rotation.y;
  previewParts.torso.rotation.x = sourceParts.torso.rotation.x;
  previewParts.leftArmPivot.rotation.x = sourceParts.leftArmPivot.rotation.x;
  previewParts.rightArmPivot.rotation.x = sourceParts.rightArmPivot.rotation.x;
  previewParts.leftLegPivot.rotation.x = sourceParts.leftLegPivot.rotation.x;
  previewParts.rightLegPivot.rotation.x = sourceParts.rightLegPivot.rotation.x;
  if (previewParts.equippedPickaxe) {
    previewParts.equippedPickaxe.visible = equipmentVisibility.equippedPickaxeVisible;
  }
  if (previewParts.equippedSafetyHelmet) {
    previewParts.equippedSafetyHelmet.visible = equipmentVisibility.equippedSafetyHelmetVisible;
  }
  if (previewParts.equippedNftHelmet) {
    previewParts.equippedNftHelmet.visible = equipmentVisibility.equippedNftHelmetVisible;
  }
}
