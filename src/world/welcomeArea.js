import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const BENCH_MODEL_URL = "/models/excit-bench-test.glb";

function loadBenchModel(bench, fallbackMeshes, loader, onError) {
  bench.userData.assetStatus = "loading";
  return Promise.resolve().then(() => loader.loadAsync(BENCH_MODEL_URL)).then((gltf) => {
    const model = gltf?.scene;
    let meshCount = 0;
    if (model?.isObject3D) model.traverse((object) => {
      if (!object.isMesh) return;
      meshCount += 1;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    if (!meshCount) throw new Error("Bench asset contains no meshes");
    model.name = "EXCIT_WELCOME_BENCH_MODEL";
    bench.add(model);
    // Keep the original seat/back objects registered as the matching collision proxies.
    for (const object of fallbackMeshes) object.visible = false;
    bench.userData.assetStatus = "ready";
    return model;
  }).catch((error) => {
    bench.userData.assetStatus = "fallback";
    onError(error);
    return null;
  });
}

function createWelcomeResidentModel() {
  const group = new THREE.Group();
  const clothing = new THREE.MeshStandardMaterial({ color: 0x5f7868, roughness: 0.94 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x4f5864, roughness: 0.94 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe7d2bd, roughness: 0.92 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.58, 4, 10), clothing);
  torso.position.y = 1.28;
  torso.scale.z = 0.72;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 14), skin);
  head.position.y = 2.03;
  head.scale.set(0.96, 1.08, 0.96);

  const armGeometry = new THREE.CapsuleGeometry(0.09, 0.64, 3, 8);
  const leftArm = new THREE.Mesh(armGeometry, clothing);
  leftArm.position.set(-0.43, 1.28, 0);
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.43;

  const legGeometry = new THREE.CapsuleGeometry(0.11, 0.7, 3, 8);
  const leftLeg = new THREE.Mesh(legGeometry, trousers);
  leftLeg.position.set(-0.16, 0.46, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.16;

  const collider = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 2.25, 0.9),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  collider.position.y = 1.12;
  group.add(torso, head, leftArm, rightArm, leftLeg, rightLeg, collider);
  return { group, collider };
}

export function createWelcomeArea({
  scene,
  addCollider,
  registerNpc,
  x,
  y = 0,
  z,
  layout = null,
  benchLoader = new GLTFLoader(),
  onBenchLoadError = (error) => console.warn("[EXCIT] Bench model unavailable; keeping the original bench.", error),
}) {
  const root = new THREE.Group();
  root.name = "EXCIT_WELCOME_AREA";

  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x76543a, roughness: 1 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x66885b, roughness: 0.95 });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x98704d, roughness: 0.96 });
  const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x4e5559, roughness: 0.82 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 2.7, 9), trunkMaterial);
  const positions = layout ?? {
    anchor: { x, y, z },
    tree: { x: x + 1.25, y: y + 1.35, z },
    bench: { x: x - 0.55, y, z },
    resident: { x: x - 0.85, y, z: z + 1.5 },
  };
  trunk.position.set(positions.tree.x, positions.tree.y, positions.tree.z);
  const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 1), leafMaterial);
  canopy.position.set(positions.tree.x, positions.tree.y + 1.8, positions.tree.z);
  canopy.scale.set(1.12, 0.88, 1.05);
  root.add(trunk, canopy);

  const bench = new THREE.Group();
  bench.name = "EXCIT_WELCOME_BENCH";
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.55), woodMaterial);
  seat.position.y = 0.62;
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.12), woodMaterial);
  back.position.set(0, 0.96, 0.25);
  const legGeometry = new THREE.BoxGeometry(0.12, 0.55, 0.38);
  const leftLeg = new THREE.Mesh(legGeometry, metalMaterial);
  leftLeg.position.set(-0.65, 0.3, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.65;
  bench.add(seat, back, leftLeg, rightLeg);
  bench.position.set(positions.bench.x, positions.bench.y, positions.bench.z);
  bench.rotation.y = -0.12;
  root.add(bench);

  const { group: resident, collider: residentCollider } = createWelcomeResidentModel();
  resident.name = "EXCIT_WELCOME_RESIDENT";
  resident.position.set(positions.resident.x, positions.resident.y, positions.resident.z);
  resident.rotation.y = Math.PI * 0.82;
  root.add(resident);

  scene.add(root);
  addCollider(trunk, 0.85);
  addCollider(seat, 1);
  addCollider(back, 1);
  resident.userData.colliderIndex = addCollider(residentCollider, 1);
  const residentEntry = registerNpc(resident, "마루", "Space : 인사하기", { role: "welcome" });

  bench.userData.assetReady = loadBenchModel(bench, [seat, back, leftLeg, rightLeg], benchLoader, onBenchLoadError);

  return { root, resident, residentEntry, bench, tree: trunk };
}
