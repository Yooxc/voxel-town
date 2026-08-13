import * as THREE from "three";

export function createHarvestTreeModel(x, z) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.35, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 1.0 })
  );
  trunk.position.y = 1.1;
  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x3f6b3a, roughness: 1.0 })
  );
  leaves.position.y = 2.6;
  const stump = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.38, 0.44, 8),
    new THREE.MeshStandardMaterial({ color: 0x5f4633, roughness: 1.0, transparent: true, opacity: 0 })
  );
  stump.position.y = 0.22;
  stump.visible = false;
  const sproutStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.05, 0.38, 6),
    new THREE.MeshStandardMaterial({ color: 0x5b8a47, roughness: 1.0, transparent: true, opacity: 0 })
  );
  sproutStem.position.y = 0.38;
  const sproutLeafLeft = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x73a95c, roughness: 1.0, transparent: true, opacity: 0 })
  );
  sproutLeafLeft.position.set(-0.08, 0.6, 0);
  sproutLeafLeft.scale.set(1.1, 0.6, 0.9);
  sproutLeafLeft.rotation.z = -0.4;
  const sproutLeafRight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x7cb563, roughness: 1.0, transparent: true, opacity: 0 })
  );
  sproutLeafRight.position.set(0.08, 0.62, 0);
  sproutLeafRight.scale.set(1.05, 0.55, 0.85);
  sproutLeafRight.rotation.z = 0.42;
  const sprout = new THREE.Group();
  sprout.add(sproutStem, sproutLeafLeft, sproutLeafRight);
  sprout.visible = false;
  tree.add(trunk, leaves, stump, sprout);
  tree.position.set(x, 0, z);
  tree.userData = {
    isHarvestTree: true,
    harvestItemId: "woodChip",
    harvestCount: 1,
    harvestCooldownUntil: 0,
    harvestDisabled: false,
    trunk,
    leaves,
    stump,
    sprout,
    trunkBaseY: trunk.position.y,
    leavesBaseY: leaves.position.y,
    baseRotationZ: 0,
    harvestShakeUntil: 0,
    harvestShakeStartedAt: 0,
  };
  return { tree, trunk };
}

export function createMineRockModel(x, z, rockSizeDef, fadeIn, options, { defaultResourceCount, randomRange }) {
  const scale = rockSizeDef.scale;
  const color = options.color ?? 0x6f6f72;
  const resourceItemId = options.resourceItemId ?? "stoneDust";
  const resourceCount = options.resourceCount ?? defaultResourceCount;
  const maxHp = options.maxHp ?? rockSizeDef.maxHp;
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.9 * scale, options.detail ?? 0),
    new THREE.MeshStandardMaterial({ color, roughness: 1.0, transparent: fadeIn, opacity: fadeIn ? 0 : 1 })
  );
  rock.position.set(x, 0.9 * scale, z);
  rock.rotation.set(randomRange(0, Math.PI), randomRange(0, Math.PI), randomRange(0, Math.PI));
  rock.userData = {
    colliderShrink: 0.85,
    isMineRock: true,
    rockSize: rockSizeDef.id,
    spawnScale: scale,
    hp: maxHp,
    maxHp,
    spawn: {
      x, z, rockSize: rockSizeDef.id, mapId: options.mapId ?? "광산", resourceItemId, resourceCount,
      requiredPickaxeLevel: options.requiredPickaxeLevel ?? 0, color, detail: options.detail ?? 0, maxHp,
    },
    resourceItemId,
    resourceCount,
    requiredPickaxeLevel: options.requiredPickaxeLevel ?? 0,
    resourceHint: options.hint ?? "Space : 채굴",
    hpLabelPrefix: options.hpLabelPrefix ?? "돌 체력",
    bonusDropEnabled: options.bonusDropEnabled ?? resourceItemId === "stoneDust",
  };
  if (fadeIn) {
    rock.userData.fadeInElapsed = 0;
    rock.userData.fadeInDuration = 1.0;
  }
  return rock;
}
