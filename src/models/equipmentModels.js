import * as THREE from "three";

export function buildPickaxeModel(level = 0) {
  const g = new THREE.Group();
  const pickaxeLevel = Math.max(0, Math.min(5, level));
  const steelColors = [0x9aa0a6, 0xa8afb8, 0xb4bcc6, 0x8ea3ba, 0x92a9c2, 0xc9b16d];
  const accentColors = [0x705132, 0x7f5b37, 0x6f4720, 0x55718e, 0xa67a38, 0xd3922f];
  const wrapColors = [0x8b5a2b, 0x8b5a2b, 0x674224, 0x62401f, 0x5d3816, 0x67340f];
  const headWidth = 0.8 + Math.max(0, pickaxeLevel - 2) * 0.08;
  const headHeight = 0.15 + Math.max(0, pickaxeLevel - 1) * 0.015;
  const headDepth = 0.2 + Math.max(0, pickaxeLevel - 3) * 0.03;
  const steelMat = new THREE.MeshStandardMaterial({
    color: steelColors[pickaxeLevel],
    roughness: pickaxeLevel >= 4 ? 0.46 : 0.62,
    metalness: pickaxeLevel >= 3 ? 0.35 : 0.18,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColors[pickaxeLevel],
    roughness: 0.55,
    metalness: pickaxeLevel >= 4 ? 0.4 : 0.15,
  });
  const wrapMat = new THREE.MeshStandardMaterial({
    color: wrapColors[pickaxeLevel],
    roughness: 0.92,
  });

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 })
  );
  handle.position.y = 0.6;

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(headWidth, headHeight, headDepth),
    steelMat
  );
  head.position.y = 1.2;

  g.add(handle, head);

  if (pickaxeLevel >= 1) {
    const endCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.07, 0.09, 8),
      accentMat
    );
    endCap.position.y = 0.035;
    g.add(endCap);
  }

  if (pickaxeLevel >= 2) {
    const wrap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.071, 0.071, 0.24, 10),
      wrapMat
    );
    wrap.position.y = 0.43;
    g.add(wrap);
  }

  if (pickaxeLevel >= 3) {
    const collar = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.2, 0.18),
      accentMat
    );
    collar.position.y = 1.05;
    g.add(collar);

    const wingLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.11, 0.11),
      steelMat
    );
    wingLeft.position.set(-(headWidth * 0.5 + 0.03), 1.2, 0);
    wingLeft.rotation.z = Math.PI * 0.16;
    g.add(wingLeft);

    const wingRight = wingLeft.clone();
    wingRight.position.x *= -1;
    wingRight.rotation.z *= -1;
    g.add(wingRight);
  }

  if (pickaxeLevel >= 4) {
    const upperWrap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.074, 0.074, 0.13, 10),
      accentMat
    );
    upperWrap.position.y = 0.9;
    g.add(upperWrap);

    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(headWidth * 0.55, 0.055, 0.06),
      accentMat
    );
    spine.position.set(0, 1.25, headDepth * 0.5 + 0.03);
    g.add(spine);
  }

  if (pickaxeLevel >= 5) {
    const crest = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.34, 0.08),
      accentMat
    );
    crest.position.set(0, 1.27, 0);
    g.add(crest);

    const sidePlateL = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.18, 0.045),
      accentMat
    );
    sidePlateL.position.set(-headWidth * 0.28, 1.19, headDepth * 0.52);
    sidePlateL.rotation.z = Math.PI * 0.12;
    g.add(sidePlateL);

    const sidePlateR = sidePlateL.clone();
    sidePlateR.position.x *= -1;
    sidePlateR.rotation.z *= -1;
    g.add(sidePlateR);
  }

  return g;
}

export function buildShovelModel() {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x84572e, roughness: 0.92 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x5f3d22, roughness: 0.9 });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xa1a8b0,
    roughness: 0.56,
    metalness: 0.24,
  });

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 1.18, 8),
    woodMat
  );
  handle.position.y = 0.58;

  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.16, 10),
    gripMat
  );
  grip.position.y = 0.18;

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.42, 0.08),
    metalMat
  );
  blade.position.set(0, 1.08, 0);
  blade.rotation.z = Math.PI * 0.06;

  const bladeTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.22, 4),
    metalMat
  );
  bladeTip.position.set(0, 0.82, 0);
  bladeTip.rotation.z = Math.PI;
  bladeTip.rotation.y = Math.PI * 0.25;

  const topGrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.08, 0.1),
    woodMat
  );
  topGrip.position.set(0, 1.2, 0);

  g.add(handle, grip, blade, bladeTip, topGrip);
  return g;
}

export function buildSafetyHelmetModel(theme = "default") {
  const g = new THREE.Group();

  const isGoldenTheme = theme === "gold";
  const shellColor = isGoldenTheme ? 0xd9b24f : 0xf7f7f9;
  const ridgeColor = isGoldenTheme ? 0xf3d983 : 0xe8e8ee;
  const trimColor = isGoldenTheme ? 0x8c5f18 : 0xd9d9de;

  const shellMat = new THREE.MeshStandardMaterial({
    color: shellColor,
    roughness: isGoldenTheme ? 0.34 : 0.5,
    metalness: isGoldenTheme ? 0.42 : 0.02,
  });
  const ridgeMat = new THREE.MeshStandardMaterial({
    color: ridgeColor,
    roughness: isGoldenTheme ? 0.28 : 0.42,
    metalness: isGoldenTheme ? 0.55 : 0.03,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    roughness: isGoldenTheme ? 0.4 : 0.72,
    metalness: isGoldenTheme ? 0.3 : 0,
  });

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.37, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.64),
    shellMat
  );
  shell.scale.set(1.03, 0.82, 1.14);
  shell.position.y = 0.18;

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.37, 0.43, 0.045, 28),
    shellMat
  );
  brim.scale.set(1.03, 1, 1.26);
  brim.position.y = -0.02;

  const frontLip = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.035, 0.42, 4, 10),
    ridgeMat
  );
  frontLip.rotation.z = Math.PI / 2;
  frontLip.position.set(0, 0.02, 0.38);

  const shellBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.03, 8, 28),
    trimMat
  );
  shellBand.rotation.x = Math.PI / 2;
  shellBand.scale.set(1.02, 1, 1.12);
  shellBand.position.y = 0.02;

  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.34, 0.14),
    ridgeMat
  );
  ridge.position.set(0, 0.36, -0.01);
  ridge.rotation.x = Math.PI * 0.08;

  const rearRidge = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.16, 0.12),
    ridgeMat
  );
  rearRidge.position.set(0, 0.44, -0.08);
  rearRidge.rotation.x = Math.PI * -0.08;

  const brimEdge = new THREE.Mesh(
    new THREE.TorusGeometry(0.33, 0.018, 8, 28),
    trimMat
  );
  brimEdge.rotation.x = Math.PI / 2;
  brimEdge.scale.set(1.04, 1, 1.22);
  brimEdge.position.y = -0.005;

  const frontBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.045, 0.05),
    trimMat
  );
  frontBadge.position.set(0, -0.01, 0.39);

  g.userData.headSeatOffsetY = -0.01;
  g.userData.headSeatForwardZ = 0.04;

  g.add(shell, brim, frontLip, shellBand, ridge, rearRidge, brimEdge, frontBadge);
  return g;
}

export function buildBasicShoesModel() {
  const g = new THREE.Group();
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0xc49a6c,
    roughness: 0.94,
    metalness: 0.02,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0x7d6247,
    roughness: 0.98,
    metalness: 0.01,
  });

  const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.44), soleMat);
  leftSole.position.set(-0.18, 0.04, 0.02);
  g.add(leftSole);
  const leftUpper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.34), shoeMat);
  leftUpper.position.set(-0.18, 0.12, 0.02);
  g.add(leftUpper);

  const rightSole = leftSole.clone();
  rightSole.position.x = 0.18;
  g.add(rightSole);
  const rightUpper = leftUpper.clone();
  rightUpper.position.x = 0.18;
  g.add(rightUpper);

  return g;
}

export function buildSingleBasicShoeModel() {
  const g = new THREE.Group();
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0xc49a6c,
    roughness: 0.94,
    metalness: 0.02,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0x7d6247,
    roughness: 0.98,
    metalness: 0.01,
  });

  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.44), soleMat);
  sole.position.set(0, 0.04, 0.07);
  g.add(sole);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.34), shoeMat);
  upper.position.set(0, 0.11, 0.06);
  g.add(upper);

  return g;
}

export function buildFreshAirCanisterModel() {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x8fd7e8,
    roughness: 0.42,
    metalness: 0.18,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xd9eef5,
    roughness: 0.28,
    metalness: 0.34,
  });
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x3f6472,
    roughness: 0.74,
    metalness: 0.04,
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.52, 18),
    shellMat
  );
  body.position.y = 0.26;
  g.add(body);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.08, 16),
    capMat
  );
  top.position.y = 0.56;
  g.add(top);

  const valve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.12, 10),
    capMat
  );
  valve.rotation.z = Math.PI * 0.5;
  valve.position.set(0.09, 0.58, 0);
  g.add(valve);

  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.115, 0.018, 8, 18),
    strapMat
  );
  band.rotation.x = Math.PI * 0.5;
  band.position.y = 0.21;
  g.add(band);

  return g;
}

export function buildPurifyPowderModel() {
  const g = new THREE.Group();
  const jarMat = new THREE.MeshStandardMaterial({
    color: 0xe8ecf1,
    roughness: 0.26,
    metalness: 0.12,
    transparent: true,
    opacity: 0.9,
  });
  const powderMat = new THREE.MeshStandardMaterial({
    color: 0xc7f2dd,
    roughness: 0.78,
    metalness: 0.02,
    emissive: 0x3fa57b,
    emissiveIntensity: 0.22,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x5c6773,
    roughness: 0.56,
    metalness: 0.35,
  });

  const jar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.17, 0.3, 18),
    jarMat
  );
  jar.position.y = 0.16;
  g.add(jar);

  const powder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.138, 0.18, 16),
    powderMat
  );
  powder.position.y = 0.11;
  g.add(powder);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.13, 0.08, 16),
    capMat
  );
  cap.position.y = 0.34;
  g.add(cap);

  return g;
}

export function alignWearableOnHead(headMesh, wearable, options = {}) {
  if (!headMesh?.geometry || !wearable) return;

  if (!headMesh.geometry.boundingBox) {
    headMesh.geometry.computeBoundingBox();
  }

  const headBox = headMesh.geometry.boundingBox;
  const headHeight = headBox.max.y - headBox.min.y;
  const headDepth = headBox.max.z - headBox.min.z;
  const seatY = wearable.userData.headSeatOffsetY ?? 0;
  const seatForwardZ = wearable.userData.headSeatForwardZ ?? 0;
  const verticalInset = options.verticalInset ?? 0.26;
  const forwardBias = options.forwardBias ?? 0.12;

  const targetSeatY = headBox.max.y - headHeight * verticalInset;
  const targetZ = (headBox.min.z + headBox.max.z) * 0.5 + headDepth * forwardBias;

  wearable.position.x = 0;
  wearable.position.y = targetSeatY - seatY;
  wearable.position.z = targetZ - seatForwardZ;
}
