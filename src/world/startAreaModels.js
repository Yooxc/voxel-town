import * as THREE from "three";
import {
  alignWearableOnHead,
  buildSafetyHelmetModel,
} from "../models/equipmentModels.js";

export function createHouseModel(x, z) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2, 3),
    new THREE.MeshStandardMaterial({ color: 0xf5f6fa })
  );
  base.position.y = 1;

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 1.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xeb3b5a })
  );
  roof.position.y = 2.6;
  roof.rotation.y = Math.PI / 4;

  group.add(base, roof);
  group.position.set(x, 0, z);
  return { group, collider: base };
}

export function createSignModel() {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 1.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
  );
  pole.position.y = 0.6;

  const boardMaterial = new THREE.MeshStandardMaterial({ color: 0xfff3b0 });
  boardMaterial.emissive.set(0x000000);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.1), boardMaterial);
  board.position.set(0, 1.2, 0);

  const collider = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 1.75, 0.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  collider.position.set(0, 0.88, 0);

  group.add(pole, board, collider);
  return { group, board, collider };
}

export function createTutorialNpcModel() {
  const group = new THREE.Group();
  const clothMaterial = new THREE.MeshStandardMaterial({ color: 0x7b6a58, roughness: 0.95 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xf0efe9, roughness: 0.92 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: 0x324d73, roughness: 0.88 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.05, 0.42), clothMaterial);
  torso.position.y = 1.2;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), skinMaterial);
  head.scale.set(0.95, 1.08, 0.95);
  head.position.y = 1.95;
  group.add(head);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.18), clothMaterial);
  leftArm.position.set(-0.48, 1.15, 0);
  group.add(leftArm);
  const rightArm = leftArm.clone();
  rightArm.position.x *= -1;
  group.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1, 0.22), accentMaterial);
  leftLeg.position.set(-0.16, 0.45, 0);
  group.add(leftLeg);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x *= -1;
  group.add(rightLeg);

  const collider = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 2.15, 0.95),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  collider.position.set(0, 1.08, 0);
  group.add(collider);

  const hardHat = buildSafetyHelmetModel();
  hardHat.scale.setScalar(0.78);
  hardHat.rotation.y = Math.PI * 0.04;
  head.add(hardHat);
  alignWearableOnHead(head, hardHat, {
    verticalInset: 0.38,
    forwardBias: 0.06,
  });

  return { group, collider };
}
