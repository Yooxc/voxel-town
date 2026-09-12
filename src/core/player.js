import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";

const PLAYER_MODEL_URL = "/models/excit-character.glb";
const playerAssets = new WeakMap();
const PLAYER_SOCKET_NAMES = Object.freeze({
  head: "EXCIT_SOCKET_HEAD",
  leftHand: "EXCIT_SOCKET_HAND_L",
  rightHand: "EXCIT_SOCKET_HAND_R",
  leftFoot: "EXCIT_SOCKET_FOOT_L",
  rightFoot: "EXCIT_SOCKET_FOOT_R",
});

const PLAYER_AUTHORED_SOCKET_NAMES = Object.freeze({
  rightHand: "EXCIT_SOCKET_TOOL_R",
});

const PLAYER_BONE_NAMES = Object.freeze({
  head: "EXCIT_HEAD",
  leftHand: "EXCIT_HAND.L",
  rightHand: "EXCIT_HAND.R",
  leftFoot: "EXCIT_FOOT.L",
  rightFoot: "EXCIT_FOOT.R",
});

function createPlayerSocket(name) {
  const socket = new THREE.Group();
  socket.name = name;
  return socket;
}

function bindPlayerSockets(player, model) {
  const bindings = {};
  for (const key of Object.keys(PLAYER_SOCKET_NAMES)) {
    const socket = player.getObjectByName(PLAYER_SOCKET_NAMES[key]);
    const authoredSocketName = PLAYER_AUTHORED_SOCKET_NAMES[key];
    const authoredSocket = authoredSocketName ? model.getObjectByName(authoredSocketName) : null;
    const bone = model.getObjectByName(PLAYER_BONE_NAMES[key]);
    const target = authoredSocket ?? bone;
    if (!socket || !target) {
      bindings[key] = { source: "missing", targetName: null };
      continue;
    }
    target.add(socket);
    socket.position.set(0, 0, 0);
    socket.rotation.set(0, 0, 0);
    socket.scale.set(1, 1, 1);
    socket.userData.bindingSource = authoredSocket ? "authored-socket" : "bone-fallback";
    socket.userData.bindingTarget = target.name;
    bindings[key] = { source: socket.userData.bindingSource, targetName: target.name };
  }
  return bindings;
}

export function createPlayerRig({ modelUrl = PLAYER_MODEL_URL, loader = new GLTFLoader() } = {}) {
  const player = new THREE.Group();
  player.name = "playerRoot";
  player.add(...Object.values(PLAYER_SOCKET_NAMES).map(createPlayerSocket));
  player.position.set(0, 0, 0);

  player.userData.assetReady = loader.loadAsync(modelUrl).then((gltf) => {
    const model = gltf.scene;
    model.name = "EXCIT_CHARACTER_MODEL";
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    player.add(model);
    const socketBindings = bindPlayerSockets(player, model);
    const asset = { model, animations: gltf.animations, socketBindings };
    playerAssets.set(player, asset);
    player.dispatchEvent({ type: "player-model-ready", asset });
    return asset;
  });

  return player;
}

export function clonePlayerRig(player) {
  const clone = cloneSkeleton(player);
  const sourceAsset = playerAssets.get(player);
  const animations = sourceAsset?.animations ?? [];
  clone.userData.assetReady = Promise.resolve({
    model: clone.getObjectByName("EXCIT_CHARACTER_MODEL") ?? clone,
    animations,
  });
  playerAssets.set(clone, { model: clone.getObjectByName("EXCIT_CHARACTER_MODEL") ?? clone, animations });
  return clone;
}

export function getPlayerRigParts(root) {
  return {
    torso: root?.getObjectByName("EXCIT_BLOCKOUT_TORSO") ?? null,
    head: root?.getObjectByName(PLAYER_SOCKET_NAMES.head) ?? null,
    leftArmPivot: root?.getObjectByName("EXCIT_UPPER_ARM.L") ?? null,
    rightArmPivot: root?.getObjectByName("EXCIT_UPPER_ARM.R") ?? null,
    leftArm: root?.getObjectByName(PLAYER_SOCKET_NAMES.leftHand) ?? null,
    rightArm: root?.getObjectByName(PLAYER_SOCKET_NAMES.rightHand) ?? null,
    leftLegPivot: root?.getObjectByName("EXCIT_THIGH.L") ?? null,
    rightLegPivot: root?.getObjectByName("EXCIT_THIGH.R") ?? null,
    leftLeg: root?.getObjectByName(PLAYER_SOCKET_NAMES.leftFoot) ?? null,
    rightLeg: root?.getObjectByName(PLAYER_SOCKET_NAMES.rightFoot) ?? null,
    equippedPickaxe: root?.getObjectByName("equippedPickaxe") ?? null,
    equippedSafetyHelmet: root?.getObjectByName("equippedSafetyHelmet") ?? null,
    equippedNftHelmet: root?.getObjectByName("equippedNftHelmet") ?? null,
    equippedFlowerCrown: root?.getObjectByName("equippedFlowerCrown") ?? null,
  };
}

export function createPlayerEquipmentVisuals(
  parts,
  { buildSafetyHelmetModel, buildFlowerCrownModel, buildSingleBasicShoeModel, alignWearableOnHead }
) {
  const equippedPickaxe = new THREE.Group();
  equippedPickaxe.name = "equippedPickaxe";
  equippedPickaxe.visible = false;
  parts.rightArm?.add(equippedPickaxe);

  const equippedSafetyHelmet = buildSafetyHelmetModel();
  equippedSafetyHelmet.name = "equippedSafetyHelmet";
  equippedSafetyHelmet.scale.setScalar(0.72);
  equippedSafetyHelmet.visible = false;
  parts.head?.add(equippedSafetyHelmet);
  equippedSafetyHelmet.position.set(0, 0.32, 0.015);

  const equippedNftHelmet = buildSafetyHelmetModel("gold");
  equippedNftHelmet.name = "equippedNftHelmet";
  equippedNftHelmet.scale.setScalar(0.72);
  equippedNftHelmet.visible = false;
  parts.head?.add(equippedNftHelmet);
  equippedNftHelmet.position.copy(equippedSafetyHelmet.position);

  const equippedFlowerCrown = buildFlowerCrownModel();
  equippedFlowerCrown.name = "equippedFlowerCrown";
  equippedFlowerCrown.visible = false;
  parts.head?.add(equippedFlowerCrown);
  equippedFlowerCrown.position.set(0, 0.31, 0.015);

  const leftFootAnchor = new THREE.Group();
  leftFootAnchor.name = "leftFootAnchor";
  parts.leftLeg?.add(leftFootAnchor);

  const rightFootAnchor = new THREE.Group();
  rightFootAnchor.name = "rightFootAnchor";
  parts.rightLeg?.add(rightFootAnchor);

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
    equippedFlowerCrown,
    equippedLeftShoe,
    equippedRightShoe,
    leftFootAnchor,
    rightFootAnchor,
  };
}

export function updatePlayerEquipmentVisualsVisibility(visuals, state) {
  visuals.equippedPickaxe.visible = state.hasToolEquipped ?? state.hasPickaxeEquipped;
  visuals.equippedSafetyHelmet.visible = state.isSafetyHelmetEquipped;
  visuals.equippedNftHelmet.visible = state.isNftHelmetEquipped;
  visuals.equippedFlowerCrown.visible = state.isFlowerCrownEquipped;
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
  player.traverse((source) => {
    if (!source.isBone) return;
    const target = previewPlayer.getObjectByName(source.name);
    if (!target?.isBone) return;
    target.position.copy(source.position);
    target.quaternion.copy(source.quaternion);
    target.scale.copy(source.scale);
  });
  if (previewParts.equippedPickaxe) {
    previewParts.equippedPickaxe.visible = equipmentVisibility.equippedPickaxeVisible;
  }
  if (previewParts.equippedSafetyHelmet) {
    previewParts.equippedSafetyHelmet.visible = equipmentVisibility.equippedSafetyHelmetVisible;
  }
  if (previewParts.equippedNftHelmet) {
    previewParts.equippedNftHelmet.visible = equipmentVisibility.equippedNftHelmetVisible;
  }
  if (previewParts.equippedFlowerCrown) {
    previewParts.equippedFlowerCrown.visible = equipmentVisibility.equippedFlowerCrownVisible;
  }
}
