import * as THREE from "three";
import { getGuideArrivalPath } from "../systems/tourPlan.js";
import { getRebuildLayout } from "./rebuildLayout.js";

function createGuideModel(coatColor) {
  const root = new THREE.Group();
  root.name = "EXCIT_TOUR_GUIDE";

  const coat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.92 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x46515f, roughness: 0.94 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe6cbb4, roughness: 0.92 });
  const marker = new THREE.MeshStandardMaterial({ color: 0xb8d8c0, roughness: 0.78 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.31, 0.62, 4, 10), coat);
  torso.position.y = 1.3;
  torso.scale.z = 0.74;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), skin);
  head.position.y = 2.04;
  head.scale.set(0.96, 1.08, 0.96);

  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.035), marker);
  badge.position.set(0.18, 1.48, 0.29);

  const limb = (geometry, material, x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -0.35;
    pivot.add(mesh);
    root.add(pivot);
    return pivot;
  };
  const armGeometry = new THREE.CapsuleGeometry(0.085, 0.58, 3, 8);
  const legGeometry = new THREE.CapsuleGeometry(0.105, 0.66, 3, 8);
  const leftArm = limb(armGeometry, coat, -0.4, 1.55);
  const rightArm = limb(armGeometry, coat, 0.4, 1.55);
  const leftLeg = limb(legGeometry, trousers, -0.15, 0.83);
  const rightLeg = limb(legGeometry, trousers, 0.15, 0.83);
  root.add(torso, head, badge);

  return { root, leftArm, rightArm, leftLeg, rightLeg };
}

function createGuideStation(origin) {
  const station = new THREE.Group();
  station.name = "EXCIT_GUIDE_STATION";
  const wood = new THREE.MeshStandardMaterial({ color: 0x75614d, roughness: 0.96 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x73907b, roughness: 0.9 });
  const postGeometry = new THREE.CylinderGeometry(0.09, 0.11, 2.25, 8);
  const leftPost = new THREE.Mesh(postGeometry, wood);
  leftPost.position.set(-0.8, 1.12, 0);
  const rightPost = leftPost.clone();
  rightPost.position.x = 0.8;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.16, 1.25), roofMaterial);
  roof.position.set(0, 2.28, 0);
  roof.rotation.z = -0.04;
  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 0.08), wood);
  marker.position.set(0, 1.78, 0.52);
  station.add(leftPost, rightPost, roof, marker);
  station.position.set(origin.x + 0.6, origin.y, origin.z - 0.75);
  return { station, posts: [leftPost, rightPost] };
}

export function createTourGuide({ scene, registerNpc, addCollider = null, guideDefinition, checkpoints }) {
  const model = createGuideModel(guideDefinition.coatColor);
  const origin = { ...guideDefinition.origin };
  const { station, posts } = createGuideStation(origin);
  model.root.position.set(origin.x, origin.y, origin.z);
  model.root.rotation.y = Math.PI * -0.35;
  scene.add(station, model.root);
  if (addCollider) {
    for (const post of posts) addCollider(post, 0.7);
  }

  const entry = registerNpc(model.root, guideDefinition.name, "안내소에서 대기 중", {
    role: "tour-guide",
    guideId: guideDefinition.id,
  });
  const arrivalPath = getGuideArrivalPath(guideDefinition, checkpoints);

  return { ...model, id: guideDefinition.id, entry, origin, arrivalPath, checkpoints, station };
}

export function createTourGuides({ scene, registerNpc, addCollider = null, startX, startZ, startFlatY = 0, layout = null }) {
  const tour = layout?.tour ?? getRebuildLayout(startX, startZ, startFlatY).tour;
  return tour.guides.map((guideDefinition) => createTourGuide({
    scene,
    registerNpc,
    addCollider,
    guideDefinition,
    checkpoints: tour.checkpoints,
  }));
}
