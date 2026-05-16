import * as THREE from "three";

export const RESIDENCE_MAP_ID = "거주구역";

export const GROUND_SIZE = 100;
export const FRONTIER_GROUND_SIZE = 50;
export const START_X = 0;
export const START_Z = 0;
export const START_RADIUS = 5.0;
export const START_RING_OPEN_RATIO = 0.20;
export const START_RING_OPEN_CENTER = Math.PI / 2;
export const START_RING_THICKNESS = 1.275;
export const CAMP_MAP_X = 0;
export const CAMP_MAP_Z = -126;
export const FRONTIER_MAP_X = 0;
export const FRONTIER_MAP_Z = -218;
export const MAP_GATE_RADIUS = 1.15;

export function isInStartRingOpening(
  angle,
  openCenter = START_RING_OPEN_CENTER,
  openRatio = START_RING_OPEN_RATIO
) {
  const d = Math.atan2(Math.sin(angle - openCenter), Math.cos(angle - openCenter));
  const openHalf = Math.PI * openRatio;
  return Math.abs(d) <= openHalf;
}

export function isBlockedByStartRingPosition({
  x,
  z,
  startWallOn,
  startX = START_X,
  startZ = START_Z,
  startRadius = START_RADIUS,
  startRingThickness = START_RING_THICKNESS,
  openCenter = START_RING_OPEN_CENTER,
  openRatio = START_RING_OPEN_RATIO,
  playerRadius = 0.55,
}) {
  if (!startWallOn) return false;

  const dx = x - startX;
  const dz = z - startZ;
  const dist = Math.hypot(dx, dz);
  const inner = startRadius - startRingThickness * 0.5 - playerRadius;
  const outer = startRadius + startRingThickness * 0.5 + playerRadius;

  if (dist < inner || dist > outer) return false;

  const angle = Math.atan2(dz, dx);
  return !isInStartRingOpening(angle, openCenter, openRatio);
}

export function isCrossingBlockedStartRingPosition({
  prevX,
  prevZ,
  nextX,
  nextZ,
  startWallOn,
  startX = START_X,
  startZ = START_Z,
  startRadius = START_RADIUS,
  openCenter = START_RING_OPEN_CENTER,
  openRatio = START_RING_OPEN_RATIO,
}) {
  if (!startWallOn) return false;

  const pdx = prevX - startX;
  const pdz = prevZ - startZ;
  const ndx = nextX - startX;
  const ndz = nextZ - startZ;
  const prevDist = Math.hypot(pdx, pdz);
  const nextDist = Math.hypot(ndx, ndz);

  const wasInside = prevDist < startRadius;
  const isInside = nextDist < startRadius;
  if (wasInside === isInside) return false;

  const denom = nextDist - prevDist;
  let t = 0.5;
  if (Math.abs(denom) > 1e-6) {
    t = (startRadius - prevDist) / denom;
    t = Math.max(0, Math.min(1, t));
  }
  const cx = prevX + (nextX - prevX) * t;
  const cz = prevZ + (nextZ - prevZ) * t;
  const crossingAngle = Math.atan2(cz - startZ, cx - startX);

  return !isInStartRingOpening(crossingAngle, openCenter, openRatio);
}

export function resolveStartRingPenetrationPosition({
  currentPos,
  prevPos = null,
  startWallOn,
  startX = START_X,
  startZ = START_Z,
  startRadius = START_RADIUS,
  startRingThickness = START_RING_THICKNESS,
  openCenter = START_RING_OPEN_CENTER,
  openRatio = START_RING_OPEN_RATIO,
}) {
  if (!startWallOn) return;

  const dx = currentPos.x - startX;
  const dz = currentPos.z - startZ;
  const dist = Math.hypot(dx, dz);
  const playerRadius = 0.55;
  const inner = startRadius - startRingThickness * 0.5 - playerRadius;
  const outer = startRadius + startRingThickness * 0.5 + playerRadius;
  if (dist < inner || dist > outer) return;

  const angle = Math.atan2(dz, dx);
  if (isInStartRingOpening(angle, openCenter, openRatio)) return;

  const eps = 0.02;
  const nx = dist > 1e-5 ? dx / dist : 1;
  const nz = dist > 1e-5 ? dz / dist : 0;
  const prevDist = prevPos ? Math.hypot(prevPos.x - startX, prevPos.z - startZ) : dist;

  if (prevDist <= startRadius) {
    currentPos.x = startX + nx * (inner - eps);
    currentPos.z = startZ + nz * (inner - eps);
  } else {
    currentPos.x = startX + nx * (outer + eps);
    currentPos.z = startZ + nz * (outer + eps);
  }
}

export function isStartRingTransitionBlocked({
  x0,
  z0,
  x1,
  z1,
  startWallOn,
  startX = START_X,
  startZ = START_Z,
  startRadius = START_RADIUS,
  startRingThickness = START_RING_THICKNESS,
  openCenter = START_RING_OPEN_CENTER,
  openRatio = START_RING_OPEN_RATIO,
}) {
  if (!startWallOn) return false;

  const dist = Math.hypot(x1 - x0, z1 - z0);
  const steps = Math.max(2, Math.ceil(dist / 0.08));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    if (
      isBlockedByStartRingPosition({
        x,
        z,
        startWallOn,
        startX,
        startZ,
        startRadius,
        startRingThickness,
        openCenter,
        openRatio,
      })
    ) {
      return true;
    }
  }
  return false;
}

export function isPositionInConnectorTunnel(x, z, connectorTunnelZones) {
  for (const zone of connectorTunnelZones) {
    if (
      z < zone.maxZ &&
      z > zone.minZ &&
      Math.abs(x - zone.centerX) <= zone.halfWidth
    ) {
      return true;
    }
  }
  return false;
}

export function getEffectiveAirMapIdForPosition(currentMapId, x, z, connectorTunnelZones) {
  return isPositionInConnectorTunnel(x, z, connectorTunnelZones) ? null : currentMapId;
}

export function getCurrentMapIdFromPosition({
  playerZ,
  isInResidenceZone = false,
  mineDoorThresholdZ,
  campDoorThresholdZ,
  campNorthDoorThresholdZ,
  frontierDoorThresholdZ,
  currentMapId = "광산맵",
  residenceMapId = RESIDENCE_MAP_ID,
}) {
  if (isInResidenceZone) return residenceMapId;
  if (playerZ <= frontierDoorThresholdZ) return "개척지";
  if (playerZ <= campDoorThresholdZ && playerZ > campNorthDoorThresholdZ) return "폐광맵";
  if (playerZ >= mineDoorThresholdZ) return "광산맵";
  return currentMapId;
}

export function createStartRingRuleHelpers(config) {
  return {
    isBlockedByStartRing(x, z) {
      return isBlockedByStartRingPosition({
        x,
        z,
        ...config,
      });
    },
    isInStartRingOpening(angle) {
      return isInStartRingOpening(angle, config.openCenter, config.openRatio);
    },
    isCrossingBlockedStartRing(prevX, prevZ, nextX, nextZ) {
      return isCrossingBlockedStartRingPosition({
        prevX,
        prevZ,
        nextX,
        nextZ,
        ...config,
      });
    },
    resolveStartRingPenetration(currentPos, prevPos = null) {
      resolveStartRingPenetrationPosition({
        currentPos,
        prevPos,
        ...config,
      });
    },
    isStartRingTransitionBlocked(x0, z0, x1, z1) {
      return isStartRingTransitionBlocked({
        x0,
        z0,
        x1,
        z1,
        ...config,
      });
    },
  };
}

export function isPlayerPositionInConnectorTunnel(playerPosition, connectorTunnelZones) {
  return isPositionInConnectorTunnel(playerPosition.x, playerPosition.z, connectorTunnelZones);
}

export function getEffectiveAirMapIdForPlayer(currentMapId, playerPosition, connectorTunnelZones) {
  return getEffectiveAirMapIdForPosition(
    currentMapId,
    playerPosition.x,
    playerPosition.z,
    connectorTunnelZones
  );
}

export function getCurrentMapIdForPlayer({
  playerPosition,
  isInResidenceZone = false,
  mineDoorThresholdZ,
  campDoorThresholdZ,
  campNorthDoorThresholdZ,
  frontierDoorThresholdZ,
  currentMapId = "광산맵",
  residenceMapId = RESIDENCE_MAP_ID,
}) {
  return getCurrentMapIdFromPosition({
    playerZ: playerPosition.z,
    isInResidenceZone,
    mineDoorThresholdZ,
    campDoorThresholdZ,
    campNorthDoorThresholdZ,
    frontierDoorThresholdZ,
    currentMapId,
    residenceMapId,
  });
}

export function buildMinePerimeterCliffs({
  scene,
  addCollider,
  startX = START_X,
  startZ = START_Z,
}) {
  const half = GROUND_SIZE * 0.5;
  const cliffMat = new THREE.MeshStandardMaterial({
    color: 0x6d5e4f,
    roughness: 0.98,
  });
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x726b65,
    roughness: 1.0,
  });

  const segments = [
    { x: 0, z: half + 2.3, sx: 108, sy: 6.4, sz: 6.2, rx: 0, rz: 0 },
    { x: -half - 2.2, z: 0, sx: 6.0, sy: 6.8, sz: 108, rx: 0, rz: 0 },
    { x: half + 2.2, z: 0, sx: 6.0, sy: 6.2, sz: 108, rx: 0, rz: 0 },
    { x: -half * 0.52, z: -half - 2.1, sx: 39, sy: 6.2, sz: 5.8, rx: 0, rz: 0 },
    { x: half * 0.52, z: -half - 2.1, sx: 39, sy: 6.6, sz: 5.8, rx: 0, rz: 0 },
    { x: -half - 1.4, z: -half - 1.5, sx: 10.0, sy: 6.4, sz: 10.0, rx: 0, rz: 0 },
  ];

  function createBermGeometry(bottomX, bottomZ, topX, topZ, height) {
    const bx = bottomX * 0.5;
    const bz = bottomZ * 0.5;
    const tx = topX * 0.5;
    const tz = topZ * 0.5;
    const y0 = -height * 0.5;
    const y1 = height * 0.5;
    const vertices = [
      -bx, y0, -bz,
       bx, y0, -bz,
       bx, y0,  bz,
      -bx, y0,  bz,
      -tx, y1, -tz,
       tx, y1, -tz,
       tx, y1,  tz,
      -tx, y1,  tz,
    ];
    const indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  for (const seg of segments) {
    const topX = Math.max(seg.sx * 0.78, seg.sx - 2.4);
    const topZ = Math.max(seg.sz * 0.46, seg.sz - 3.6);
    const berm = new THREE.Mesh(
      createBermGeometry(seg.sx, seg.sz, topX, topZ, seg.sy),
      cliffMat
    );
    berm.position.set(startX + seg.x, seg.sy * 0.5 - 0.35, startZ + seg.z);
    berm.rotation.set(seg.rx, 0, seg.rz);
    scene.add(berm);
    addCollider(berm, 1.0);
  }

  const rockDefs = [
    { x: -41, z: -50.6, sx: 8.4, sy: 6.8, sz: 6.6, ry: 0.28 },
    { x: -27, z: -51.0, sx: 7.4, sy: 5.4, sz: 5.8, ry: -0.18 },
    { x: 29, z: -50.9, sx: 7.8, sy: 5.8, sz: 6.0, ry: 0.22 },
    { x: 42, z: -50.4, sx: 8.8, sy: 6.5, sz: 6.8, ry: -0.25 },
    { x: -52.0, z: -30, sx: 6.2, sy: 5.2, sz: 8.2, ry: 0.16 },
    { x: -52.2, z: 18, sx: 7.4, sy: 5.8, sz: 9.2, ry: -0.22 },
    { x: 52.1, z: -16, sx: 7.1, sy: 5.2, sz: 8.8, ry: 0.2 },
    { x: 52.4, z: 28, sx: 8.2, sy: 6.0, sz: 9.6, ry: -0.18 },
    { x: -34, z: 51.2, sx: 7.8, sy: 5.8, sz: 5.6, ry: 0.14 },
    { x: 33, z: 51.0, sx: 8.0, sy: 6.2, sz: 5.8, ry: -0.15 },
  ];

  for (const rock of rockDefs) {
    const chunk = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      rockMat
    );
    chunk.scale.set(rock.sx, rock.sy, rock.sz);
    chunk.position.set(startX + rock.x, rock.sy * 0.5 + 0.5, startZ + rock.z);
    chunk.rotation.set(
      THREE.MathUtils.degToRad(rock.x * 0.6),
      rock.ry,
      THREE.MathUtils.degToRad(rock.z * 0.35)
    );
    scene.add(chunk);

    const colliderMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const colliderLayers = [
      {
        sx: rock.sx * 0.72,
        sy: Math.max(2.2, rock.sy * 0.42),
        sz: rock.sz * 0.72,
        y: Math.max(1.2, rock.sy * 0.22 + 0.35),
      },
      {
        sx: rock.sx * 0.54,
        sy: Math.max(1.4, rock.sy * 0.24),
        sz: rock.sz * 0.54,
        y: Math.max(2.35, rock.sy * 0.5 + 0.15),
      },
      {
        sx: rock.sx * 0.34,
        sy: Math.max(1.0, rock.sy * 0.16),
        sz: rock.sz * 0.34,
        y: Math.max(3.25, rock.sy * 0.73 + 0.12),
      },
    ];

    for (const layer of colliderLayers) {
      const rockCollider = new THREE.Mesh(
        new THREE.BoxGeometry(layer.sx, layer.sy, layer.sz),
        colliderMat
      );
      rockCollider.position.set(chunk.position.x, layer.y, chunk.position.z);
      rockCollider.rotation.y = chunk.rotation.y;
      scene.add(rockCollider);
      addCollider(rockCollider, 1.0);
    }
  }
}

export function buildTravelGate({
  scene,
  x,
  z,
  rotationY = 0,
  startFlatY = 0,
}) {
  const g = new THREE.Group();

  const floorPlate = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.12, 2.1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  floorPlate.position.set(0, 0.06, -0.28);
  g.add(floorPlate);
  g.userData.walkSurface = floorPlate;

  g.position.set(x, startFlatY, z);
  g.rotation.y = rotationY;
  scene.add(g);

  return g;
}

export function buildCampTestArea({
  scene,
  groundSurfaces,
  registerWalkableSurface,
  registerCaveDarkMaterial,
  addCollider,
  buildAirPurifierStation,
  buildFreshAirCanisterModel,
  registerPickupItem,
  startFlatY = 0,
  campMapX = CAMP_MAP_X,
  campMapZ = CAMP_MAP_Z,
}) {
  const campSize = GROUND_SIZE;
  const pillarMat = registerCaveDarkMaterial(
    new THREE.MeshStandardMaterial({
      color: 0x4a4037,
      roughness: 1.0,
    }),
    0.18
  );
  const wallMat = registerCaveDarkMaterial(
    new THREE.MeshStandardMaterial({
      color: 0x2d251f,
      roughness: 1.0,
    }),
    0.14
  );
  const ceilingMat = registerCaveDarkMaterial(
    new THREE.MeshStandardMaterial({
      color: 0x211b17,
      roughness: 1.0,
      side: THREE.DoubleSide,
    }),
    0.1
  );

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(campSize, 0.18, campSize),
    registerCaveDarkMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x342a22,
        roughness: 0.98,
      }),
      0.22
    )
  );
  pad.position.set(campMapX, 0.09, campMapZ);
  scene.add(pad);
  groundSurfaces.push(pad);
  registerWalkableSurface("폐광맵", pad, 0.45);

  const campHalf = campSize * 0.5;
  const wallThickness = 4.8;
  const wallHeight = 13.44;
  const southOpeningWidth = 18;
  const northOpeningWidth = 14;
  const wallBaseY = wallHeight * 0.5 - 0.55;

  const wallDefs = [
    { x: -(campSize - northOpeningWidth) * 0.25 - northOpeningWidth * 0.5, z: -campHalf - wallThickness * 0.22, sx: (campSize - northOpeningWidth) * 0.5 + 4, sy: wallHeight, sz: wallThickness, ry: 0.02 },
    { x: (campSize - northOpeningWidth) * 0.25 + northOpeningWidth * 0.5, z: -campHalf - wallThickness * 0.22, sx: (campSize - northOpeningWidth) * 0.5 + 4, sy: wallHeight, sz: wallThickness, ry: 0.02 },
    { x: -campHalf - wallThickness * 0.28, z: 0, sx: wallThickness, sy: wallHeight + 0.4, sz: campSize + 5, ry: -0.03 },
    { x: campHalf + wallThickness * 0.28, z: 0, sx: wallThickness, sy: wallHeight - 0.2, sz: campSize + 7, ry: 0.025 },
    { x: -(campSize - southOpeningWidth) * 0.25 - southOpeningWidth * 0.5, z: campHalf + wallThickness * 0.24, sx: (campSize - southOpeningWidth) * 0.5 + 4, sy: wallHeight - 0.3, sz: wallThickness, ry: -0.01 },
    { x: (campSize - southOpeningWidth) * 0.25 + southOpeningWidth * 0.5, z: campHalf + wallThickness * 0.24, sx: (campSize - southOpeningWidth) * 0.5 + 4, sy: wallHeight + 0.2, sz: wallThickness, ry: 0.015 },
  ];

  for (const wall of wallDefs) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wall.sx, wall.sy, wall.sz),
      wallMat
    );
    mesh.position.set(campMapX + wall.x, wallBaseY, campMapZ + wall.z);
    mesh.rotation.y = wall.ry;
    scene.add(mesh);
    addCollider(mesh, 1.0);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(wall.sx * 0.86, 1.4, wall.sz * 0.88),
      wallMat
    );
    cap.position.set(
      mesh.position.x + Math.sin(wall.ry) * 0.35,
      mesh.position.y + wall.sy * 0.5 - 0.15,
      mesh.position.z + Math.cos(wall.ry) * 0.25
    );
    cap.rotation.y = wall.ry * 1.2;
    scene.add(cap);
  }

  const pillarDefs = [
    { x: -28, z: -36, sx: 4.6, sz: 9.6, sy: 6.72, ry: 0.14 },
    { x: -8, z: -40, sx: 2.4, sz: 2.0, sy: 6.24, ry: -0.08 },
    { x: 20, z: -34, sx: 3.8, sz: 7.8, sy: 6.56, ry: 0.18 },
    { x: -18, z: -22, sx: 2.8, sz: 3.7, sy: 6.4, ry: -0.12 },
    { x: 12, z: -24, sx: 4.2, sz: 2.4, sy: 6.8, ry: 0.09 },
    { x: -34, z: -8, sx: 3.2, sz: 4.4, sy: 6.96, ry: 0.22 },
    { x: -4, z: -10, sx: 1.9, sz: 9.9, sy: 8.08, ry: -0.16 },
    { x: 28, z: -12, sx: 3.6, sz: 3.1, sy: 6.48, ry: 0.13 },
    { x: -20, z: 2, sx: 2.5, sz: 2.1, sy: 6.32, ry: -0.06 },
    { x: 10, z: 0, sx: 3.9, sz: 15.3, sy: 8.96, ry: 0.28 },
    { x: -32, z: 14, sx: 3.1, sz: 2.7, sy: 6.4, ry: 0.11 },
    { x: -2, z: 16, sx: 1.8, sz: 15.0, sy: 8.64, ry: -0.24 },
    { x: 24, z: 12, sx: 3.9, sz: 2.2, sy: 6.24, ry: 0.07 },
    { x: -16, z: 26, sx: 3.4, sz: 4.8, sy: 8.48, ry: -0.2 },
    { x: 14, z: 28, sx: 2.6, sz: 2.9, sy: 6.08, ry: 0.16 },
    { x: -30, z: 36, sx: 3.4, sz: 13.8, sy: 6.8, ry: 0.21 },
    { x: 2, z: 38, sx: 1.7, sz: 2.8, sy: 7.92, ry: -0.15 },
    { x: 30, z: 36, sx: 4.4, sz: 9.0, sy: 6.72, ry: 0.12 },
    { x: -12, z: 44, sx: 2.8, sz: 3.6, sy: 6.4, ry: -0.14 },
    { x: 18, z: 46, sx: 3.7, sz: 2.4, sy: 6.56, ry: 0.1 },
  ];

  for (const pillar of pillarDefs) {
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(pillar.sx, pillar.sy, pillar.sz),
      pillarMat
    );
    column.position.set(campMapX + pillar.x, pillar.sy * 0.5, campMapZ + pillar.z);
    column.rotation.set(
      THREE.MathUtils.degToRad((pillar.x + pillar.z) * 0.08),
      pillar.ry,
      THREE.MathUtils.degToRad((pillar.x - pillar.z) * 0.05)
    );
    scene.add(column);
    addCollider(column, 0.96);
  }

  const ceilingSlabs = [
    { x: 0, z: -34, sx: 104, sy: 3.0, sz: 30, rx: 0.05, rz: -0.03, topY: 10.24 },
    { x: 0, z: -8, sx: 104, sy: 3.4, sz: 28, rx: -0.04, rz: 0.02, topY: 9.92 },
    { x: 0, z: 18, sx: 104, sy: 3.2, sz: 28, rx: 0.03, rz: -0.04, topY: 10.08 },
    { x: -18, z: 42, sx: 70, sy: 3.1, sz: 22, rx: -0.05, rz: 0.03, topY: 9.76 },
    { x: 22, z: 42, sx: 68, sy: 2.9, sz: 22, rx: 0.04, rz: -0.02, topY: 9.96 },
  ];

  function getCeilingBottomY(localX, localZ) {
    for (const slab of ceilingSlabs) {
      const halfX = slab.sx * 0.5;
      const halfZ = slab.sz * 0.5;
      if (
        localX >= slab.x - halfX &&
        localX <= slab.x + halfX &&
        localZ >= slab.z - halfZ &&
        localZ <= slab.z + halfZ
      ) {
        return slab.topY;
      }
    }
    return 10.08;
  }

  for (const slab of ceilingSlabs) {
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(slab.sx, slab.sy, slab.sz),
      ceilingMat
    );
    roof.position.set(
      campMapX + slab.x,
      slab.topY + slab.sy * 0.5,
      campMapZ + slab.z
    );
    roof.rotation.set(slab.rx, 0, slab.rz);
    scene.add(roof);
  }

  function createTaperedConnectorGeometry(bottomX, bottomZ, topX, topZ, height) {
    const hx0 = bottomX * 0.5;
    const hz0 = bottomZ * 0.5;
    const hx1 = topX * 0.5;
    const hz1 = topZ * 0.5;
    const y0 = -height * 0.5;
    const y1 = height * 0.5;
    const vertices = [
      -hx0, y0, -hz0,
       hx0, y0, -hz0,
       hx0, y0,  hz0,
      -hx0, y0,  hz0,
      -hx1, y1, -hz1,
       hx1, y1, -hz1,
       hx1, y1,  hz1,
      -hx1, y1,  hz1,
    ];
    const indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  for (const pillar of pillarDefs) {
    const localBottomY = getCeilingBottomY(pillar.x, pillar.z);
    const connectorHeight = Math.max(0.45, localBottomY - pillar.sy);
    const bottomX = pillar.sx;
    const bottomZ = pillar.sz;
    const topX = Math.max(bottomX + 4.2, pillar.sx + 5.0);
    const topZ = Math.max(bottomZ + 4.2, pillar.sz + 5.0);
    const connector = new THREE.Mesh(
      createTaperedConnectorGeometry(bottomX, bottomZ, topX, topZ, connectorHeight),
      ceilingMat
    );
    connector.position.set(
      campMapX + pillar.x,
      pillar.sy + connectorHeight * 0.5,
      campMapZ + pillar.z
    );
    connector.rotation.set(0, pillar.ry * 0.65, 0);
    scene.add(connector);
  }

  const airPurifierStation = buildAirPurifierStation(
    campMapX + 15.5,
    campMapZ + campHalf - 8.8,
    Math.PI
  );

  const caveAirCan = buildFreshAirCanisterModel();
  caveAirCan.position.set(campMapX + 11.8, startFlatY, campMapZ + campHalf - 10.2);
  caveAirCan.rotation.set(0, Math.PI * 0.22, 0.04);
  scene.add(caveAirCan);
  registerPickupItem(caveAirCan, "freshAirCanister", "E : 신선한 공기 캔 줍기");

  return {
    airPurifierStation,
  };
}

export function buildFrontierArea({
  scene,
  groundSurfaces,
  interactables,
  registerWalkableSurface,
  addCollider,
  makeSign,
  rebuildFrontierParcelConstructionVisual,
  buildAirPurifierStation,
  buildFrontierBuildingSign,
  registerResidenceMapZone,
  renderResidenceNoticeBoard,
  residenceNoticeBoardVisuals,
  frontierParcelBorderColor,
  startFlatY = 0,
  frontierMapX = FRONTIER_MAP_X,
  frontierMapZ = FRONTIER_MAP_Z,
}) {
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(FRONTIER_GROUND_SIZE, 0.18, FRONTIER_GROUND_SIZE),
    new THREE.MeshStandardMaterial({
      color: 0x8a775f,
      roughness: 0.98,
    })
  );
  pad.position.set(frontierMapX, 0.09, frontierMapZ);
  scene.add(pad);
  groundSurfaces.push(pad);
  registerWalkableSurface("개척지", pad, 0.45);

  const bermMat = new THREE.MeshStandardMaterial({
    color: 0x6f624f,
    roughness: 1.0,
  });
  const parcelBorderMat = new THREE.MeshStandardMaterial({
    color: frontierParcelBorderColor,
    roughness: 0.64,
    metalness: 0.08,
    emissive: 0x7a3b00,
    emissiveIntensity: 0.12,
  });
  const half = FRONTIER_GROUND_SIZE * 0.5;
  const wallThickness = 3.4;
  const wallHeight = 5.8;
  const southOpeningWidth = 12.5;
  const westHousingOpeningWidth = 13.5;
  const wallDefs = [
    { x: 0, z: -half - wallThickness * 0.2, sx: FRONTIER_GROUND_SIZE + 4, sz: wallThickness },
    { x: half + wallThickness * 0.2, z: 0, sx: wallThickness, sz: FRONTIER_GROUND_SIZE + 4 },
    { x: -(FRONTIER_GROUND_SIZE - southOpeningWidth) * 0.25 - southOpeningWidth * 0.5, z: half + wallThickness * 0.2, sx: (FRONTIER_GROUND_SIZE - southOpeningWidth) * 0.5 + 2.2, sz: wallThickness },
    { x: (FRONTIER_GROUND_SIZE - southOpeningWidth) * 0.25 + southOpeningWidth * 0.5, z: half + wallThickness * 0.2, sx: (FRONTIER_GROUND_SIZE - southOpeningWidth) * 0.5 + 2.2, sz: wallThickness },
    { x: -half - wallThickness * 0.2, z: -(FRONTIER_GROUND_SIZE - westHousingOpeningWidth) * 0.25 - westHousingOpeningWidth * 0.5, sx: wallThickness, sz: (FRONTIER_GROUND_SIZE - westHousingOpeningWidth) * 0.5 + 2.2 },
    { x: -half - wallThickness * 0.2, z: (FRONTIER_GROUND_SIZE - westHousingOpeningWidth) * 0.25 + westHousingOpeningWidth * 0.5, sx: wallThickness, sz: (FRONTIER_GROUND_SIZE - westHousingOpeningWidth) * 0.5 + 2.2 },
  ];

  for (const wall of wallDefs) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wall.sx, wallHeight, wall.sz),
      bermMat
    );
    mesh.position.set(frontierMapX + wall.x, wallHeight * 0.5 - 0.3, frontierMapZ + wall.z);
    scene.add(mesh);
    addCollider(mesh, 1.0);
  }

  const parcelInset = 5.5;
  const parcelInnerWidth = FRONTIER_GROUND_SIZE - parcelInset * 2;
  const parcelInnerHeight = FRONTIER_GROUND_SIZE - parcelInset * 2;
  const centerLaneWidth = 4.8;
  const crossLaneWidth = 4.8;
  const parcelWidth = (parcelInnerWidth - centerLaneWidth) * 0.5;
  const parcelHeight = (parcelInnerHeight - crossLaneWidth * 2) / 3;
  const borderThickness = 0.34;
  const borderHeight = 0.06;
  const topY = 0.19;

  function addParcelBorder(x, z, sx, sz) {
    const north = new THREE.Mesh(
      new THREE.BoxGeometry(sx, borderHeight, borderThickness),
      parcelBorderMat
    );
    north.position.set(x, topY, z - sz * 0.5);
    scene.add(north);

    const south = new THREE.Mesh(
      new THREE.BoxGeometry(sx, borderHeight, borderThickness),
      parcelBorderMat
    );
    south.position.set(x, topY, z + sz * 0.5);
    scene.add(south);

    const west = new THREE.Mesh(
      new THREE.BoxGeometry(borderThickness, borderHeight, sz),
      parcelBorderMat
    );
    west.position.set(x - sx * 0.5, topY, z);
    scene.add(west);

    const east = new THREE.Mesh(
      new THREE.BoxGeometry(borderThickness, borderHeight, sz),
      parcelBorderMat
    );
    east.position.set(x + sx * 0.5, topY, z);
    scene.add(east);
  }

  const leftCenterX = frontierMapX - (centerLaneWidth * 0.5 + parcelWidth * 0.5);
  const rightCenterX = frontierMapX + (centerLaneWidth * 0.5 + parcelWidth * 0.5);
  const topCenterZ = frontierMapZ - (crossLaneWidth + parcelHeight);
  const midCenterZ = frontierMapZ;
  const bottomCenterZ = frontierMapZ + (crossLaneWidth + parcelHeight);
  const frontierParcelDefs = [
    { label: "P1", x: leftCenterX, z: topCenterZ, signZ: topCenterZ + parcelHeight * 0.5 - 1.1, width: parcelWidth, height: parcelHeight },
    { label: "P2", x: rightCenterX, z: topCenterZ, signZ: topCenterZ + parcelHeight * 0.5 - 1.1, width: parcelWidth, height: parcelHeight },
    { label: "P3", x: leftCenterX, z: midCenterZ, signZ: midCenterZ + parcelHeight * 0.5 - 1.1, width: parcelWidth, height: parcelHeight },
    { label: "P4", x: rightCenterX, z: midCenterZ, signZ: midCenterZ + parcelHeight * 0.5 - 1.1, width: parcelWidth, height: parcelHeight },
    { label: "P5", x: leftCenterX, z: bottomCenterZ, signZ: bottomCenterZ - parcelHeight * 0.5 + 1.1, width: parcelWidth, height: parcelHeight },
    { label: "P6", x: rightCenterX, z: bottomCenterZ, signZ: bottomCenterZ - parcelHeight * 0.5 + 1.1, width: parcelWidth, height: parcelHeight },
  ];

  for (const parcel of frontierParcelDefs) {
    addParcelBorder(parcel.x, parcel.z, parcelWidth, parcelHeight);
    parcel.signObj = makeSign(parcel.x, parcel.signZ, parcel.label, 0);
  }

  const frontierParcelConstructionRoots = {};
  const frontierParcelConstructionGroups = {};
  const frontierParcelConstructionColliders = {};
  for (const parcel of frontierParcelDefs) {
    const root = new THREE.Group();
    root.position.set(parcel.x, 0, parcel.z);
    scene.add(root);
    frontierParcelConstructionRoots[parcel.label] = root;
  }

  const frontierAirPurifierStation = buildAirPurifierStation(
    frontierMapX + southOpeningWidth * 0.5 + 2.1,
    frontierMapZ + half - 2.3,
    Math.PI,
    "개척지"
  );

  const housingLinkLength = 16;
  const housingLinkWidth = 11.5;
  const housingDistrictWidth = 52;
  const housingDistrictDepth = 42;
  const housingPlazaDepth = 18;
  const housingTowerWidth = 24;
  const housingTowerDepth = 11;
  const housingTowerHeight = 16.8;
  const housingWestCenterX =
    frontierMapX - half - housingLinkLength - housingDistrictWidth * 0.5 - 3.8;
  const housingCenterZ = frontierMapZ;

  const housingLink = new THREE.Mesh(
    new THREE.BoxGeometry(housingLinkLength, 0.14, housingLinkWidth),
    new THREE.MeshStandardMaterial({
      color: 0x8f816d,
      roughness: 0.97,
    })
  );
  housingLink.position.set(
    frontierMapX - half - housingLinkLength * 0.5,
    0.07,
    housingCenterZ
  );
  scene.add(housingLink);
  groundSurfaces.push(housingLink);
  registerWalkableSurface(RESIDENCE_MAP_ID, housingLink, 0.42);

  const housingLinkWestEdgeX = housingLink.position.x - housingLinkLength * 0.5;
  const housingDistrictEastEdgeX = housingWestCenterX + housingDistrictWidth * 0.5;
  const housingJoinLength = Math.max(0.8, housingLinkWestEdgeX - housingDistrictEastEdgeX);
  const housingJoin = new THREE.Mesh(
    new THREE.BoxGeometry(housingJoinLength, 0.145, housingLinkWidth),
    new THREE.MeshStandardMaterial({
      color: 0x93826f,
      roughness: 0.97,
    })
  );
  housingJoin.position.set(
    housingDistrictEastEdgeX + housingJoinLength * 0.5,
    0.072,
    housingCenterZ
  );
  scene.add(housingJoin);
  groundSurfaces.push(housingJoin);
  registerWalkableSurface(RESIDENCE_MAP_ID, housingJoin, 0.42);

  const housingDistrict = new THREE.Mesh(
    new THREE.BoxGeometry(housingDistrictWidth, 0.16, housingDistrictDepth),
    new THREE.MeshStandardMaterial({
      color: 0x92816b,
      roughness: 0.98,
    })
  );
  housingDistrict.position.set(housingWestCenterX, 0.08, housingCenterZ + 0.4);
  scene.add(housingDistrict);
  groundSurfaces.push(housingDistrict);
  registerWalkableSurface(RESIDENCE_MAP_ID, housingDistrict, 0.42);
  registerResidenceMapZone(housingLink.position.x, housingLink.position.z, housingLinkLength, housingLinkWidth);
  registerResidenceMapZone(housingJoin.position.x, housingJoin.position.z, housingJoinLength, housingLinkWidth);
  registerResidenceMapZone(housingDistrict.position.x, housingDistrict.position.z, housingDistrictWidth, housingDistrictDepth);

  const buildHousingNoticeBoard = (boardKey, x, z, rotationY = 0) => {
    const g = new THREE.Group();
    const boardWidth = 4.02;
    const boardHeight = 3.52;
    const boardHalfWidth = boardWidth * 0.5;
    const frameThickness = 0.12;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2d3138,
      roughness: 0.55,
      metalness: 0.45,
    });
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.92,
      metalness: 0.03,
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x1d1f24,
      roughness: 0.72,
      metalness: 0.25,
    });

    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.55, 0.12), frameMat);
    leftPost.position.set(-boardHalfWidth - 0.12, 1.78, -0.12);
    g.add(leftPost);

    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.55, 0.12), frameMat);
    rightPost.position.set(boardHalfWidth + 0.12, 1.78, -0.12);
    g.add(rightPost);

    const bottomBeam = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth + 0.18, 0.1, 0.1),
      frameMat
    );
    bottomBeam.position.set(0, 0.42, -0.12);
    g.add(bottomBeam);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth + frameThickness, boardHeight + frameThickness, 0.08),
      frameMat
    );
    frame.position.set(0, 2.66, -0.02);
    g.add(frame);

    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth, boardHeight, 0.04),
      panelMat
    );
    backPanel.position.set(0, 2.66, 0.03);
    g.add(backPanel);

    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 760;
    const texture = new THREE.CanvasTexture(canvas);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(boardWidth - 0.16, boardHeight - 0.16),
      new THREE.MeshBasicMaterial({ map: texture })
    );
    screen.position.set(0, 2.66, 0.055);
    g.add(screen);

    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.18), frameMat);
    leftFoot.position.set(-boardHalfWidth + 0.42, 0.08, -0.12);
    g.add(leftFoot);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.18), frameMat);
    rightFoot.position.set(boardHalfWidth - 0.42, 0.08, -0.12);
    g.add(rightFoot);

    const wheelOffsets = [
      [-boardHalfWidth - 0.08, 0.02, -0.08],
      [-boardHalfWidth + 0.78, 0.02, 0.08],
      [boardHalfWidth - 0.78, 0.02, -0.08],
      [boardHalfWidth + 0.08, 0.02, 0.08],
    ];
    for (const [wx, wy, wz] of wheelOffsets) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16),
        wheelMat
      );
      wheel.rotation.z = Math.PI * 0.5;
      wheel.position.set(wx, wy, wz);
      g.add(wheel);
    }

    g.position.set(x, startFlatY + 0.22, z);
    g.rotation.y = rotationY;
    scene.add(g);
    addCollider(g, 0.88);
    residenceNoticeBoardVisuals[boardKey] = { canvas, texture, group: g, screen };
    renderResidenceNoticeBoard(boardKey);
  };

  buildHousingNoticeBoard(
    "boardA",
    housingWestCenterX + 13.4,
    housingCenterZ + housingPlazaDepth * 0.5 - 2.2,
    Math.PI
  );
  buildHousingNoticeBoard(
    "boardB",
    housingWestCenterX,
    housingCenterZ + housingPlazaDepth * 0.5 - 1.8,
    Math.PI
  );
  buildHousingNoticeBoard(
    "boardC",
    housingWestCenterX - 13.4,
    housingCenterZ + housingPlazaDepth * 0.5 - 2.2,
    Math.PI
  );

  const fenceMat = new THREE.MeshStandardMaterial({
    color: 0x6e6257,
    roughness: 0.92,
  });
  const fenceHeight = 1.45;
  const fenceY = fenceHeight * 0.5;
  const addHousingFence = (sx, sz, x, z) => {
    const fence = new THREE.Mesh(
      new THREE.BoxGeometry(sx, fenceHeight, sz),
      fenceMat
    );
    fence.position.set(x, fenceY, z);
    scene.add(fence);
    addCollider(fence, 1.0);
  };

  const districtHalfW = housingDistrictWidth * 0.5;
  const districtHalfD = housingDistrictDepth * 0.5;
  const linkHalfW = housingLinkWidth * 0.5;
  const districtCenterZ = housingDistrict.position.z;
  const districtNorthZ = districtCenterZ - districtHalfD;
  const districtSouthZ = districtCenterZ + districtHalfD;
  const districtWestX = housingWestCenterX - districtHalfW;
  const districtEastX = housingWestCenterX + districtHalfW;
  const corridorStartX = districtEastX;
  const corridorEndX = housingLink.position.x + housingLinkLength * 0.5;
  const corridorLength = Math.max(1.2, corridorEndX - corridorStartX);
  const corridorCenterX = corridorStartX + corridorLength * 0.5;
  const corridorNorthZ = housingCenterZ - linkHalfW + 0.17;
  const corridorSouthZ = housingCenterZ + linkHalfW - 0.17;
  const eastOpeningMinZ = housingCenterZ - linkHalfW - 0.45;
  const eastOpeningMaxZ = housingCenterZ + linkHalfW + 0.45;
  const eastNorthDepth = Math.max(0, eastOpeningMinZ - districtNorthZ);
  const eastSouthDepth = Math.max(0, districtSouthZ - eastOpeningMaxZ);

  addHousingFence(housingDistrictWidth + 0.4, 0.34, housingWestCenterX, districtNorthZ + 0.17);
  addHousingFence(housingDistrictWidth + 0.4, 0.34, housingWestCenterX, districtSouthZ - 0.17);
  addHousingFence(0.34, housingDistrictDepth + 0.4, districtWestX + 0.17, districtCenterZ);
  if (eastNorthDepth > 0.6) {
    addHousingFence(0.34, eastNorthDepth, districtEastX - 0.17, districtNorthZ + eastNorthDepth * 0.5);
  }
  if (eastSouthDepth > 0.6) {
    addHousingFence(0.34, eastSouthDepth, districtEastX - 0.17, eastOpeningMaxZ + eastSouthDepth * 0.5);
  }
  addHousingFence(corridorLength, 0.34, corridorCenterX, corridorNorthZ);
  addHousingFence(corridorLength, 0.34, corridorCenterX, corridorSouthZ);

  const housingTower = new THREE.Group();
  housingTower.position.set(housingWestCenterX, 0, housingCenterZ - 9.2);
  scene.add(housingTower);

  const towerBodyMat = new THREE.MeshStandardMaterial({
    color: 0xd3cec6,
    roughness: 0.94,
  });
  const towerTrimMat = new THREE.MeshStandardMaterial({
    color: 0x6f6359,
    roughness: 0.84,
  });
  const towerWindowMat = new THREE.MeshStandardMaterial({
    color: 0x8ea0ad,
    roughness: 0.42,
    metalness: 0.12,
  });

  const towerBody = new THREE.Mesh(
    new THREE.BoxGeometry(housingTowerWidth, housingTowerHeight, housingTowerDepth),
    towerBodyMat
  );
  towerBody.position.set(0, housingTowerHeight * 0.5, 0);
  housingTower.add(towerBody);
  addCollider(towerBody, 1.0);

  const towerRoof = new THREE.Mesh(
    new THREE.BoxGeometry(housingTowerWidth + 1.2, 0.55, housingTowerDepth + 1.1),
    towerTrimMat
  );
  towerRoof.position.set(0, housingTowerHeight + 0.28, 0);
  housingTower.add(towerRoof);
  addCollider(towerRoof, 1.0);

  const entryAwning = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 0.28, 1.6),
    towerTrimMat
  );
  entryAwning.position.set(0, 3.1, housingTowerDepth * 0.5 + 0.74);
  housingTower.add(entryAwning);
  addCollider(entryAwning, 1.0);

  const entryLeftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 4.6, 0.34),
    towerTrimMat
  );
  entryLeftFrame.position.set(-1.24, 2.3, housingTowerDepth * 0.5 + 0.18);
  housingTower.add(entryLeftFrame);
  addCollider(entryLeftFrame, 1.0);

  const entryRightFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 4.6, 0.34),
    towerTrimMat
  );
  entryRightFrame.position.set(1.24, 2.3, housingTowerDepth * 0.5 + 0.18);
  housingTower.add(entryRightFrame);
  addCollider(entryRightFrame, 1.0);

  const entryCut = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 3.5, 0.42),
    towerBodyMat
  );
  entryCut.position.set(0, 1.75, housingTowerDepth * 0.5 + 0.24);
  housingTower.add(entryCut);

  const windowGeo = new THREE.BoxGeometry(2.15, 1.55, 0.14);
  const floorYs = [4.2, 7.0, 9.8, 12.6, 15.4];
  const windowXs = [-7.2, -2.4, 2.4, 7.2];
  for (const y of floorYs) {
    for (const x of windowXs) {
      const windowPane = new THREE.Mesh(windowGeo, towerWindowMat);
      windowPane.position.set(x, y, housingTowerDepth * 0.5 + 0.09);
      housingTower.add(windowPane);
    }
  }

  const sideWindowGeo = new THREE.BoxGeometry(0.14, 1.45, 1.95);
  const sideWindowZs = [-3.2, 0, 3.2];
  for (const y of floorYs) {
    for (const z of sideWindowZs) {
      const westWindow = new THREE.Mesh(sideWindowGeo, towerWindowMat);
      westWindow.position.set(-housingTowerWidth * 0.5 - 0.08, y, z);
      housingTower.add(westWindow);
      const eastWindow = westWindow.clone();
      eastWindow.position.x = housingTowerWidth * 0.5 + 0.08;
      housingTower.add(eastWindow);
    }
  }

  const housingSign = buildFrontierBuildingSign("Mansion ONE");
  housingSign.position.set(7.2, 4.2, housingTowerDepth * 0.5 + 0.5);
  housingTower.add(housingSign);

  const mansionEntryMarker = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.8, 1.1),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  mansionEntryMarker.position.set(
    housingTower.position.x,
    startFlatY + 1.4,
    housingTower.position.z + housingTowerDepth * 0.5 + 1.9
  );
  scene.add(mansionEntryMarker);
  const mansionOneEntranceInteractable = {
    obj: mansionEntryMarker,
    board: mansionEntryMarker,
    highlightKind: "none",
    type: "mansionEntry",
  };
  interactables.push(mansionOneEntranceInteractable);

  const mansionOneExteriorReturn = {
    x: housingTower.position.x,
    z: housingTower.position.z + housingTowerDepth * 0.5 + 3.1,
    rotationY: Math.PI,
  };

  return {
    frontierParcelDefs,
    frontierParcelConstructionRoots,
    frontierParcelConstructionGroups,
    frontierParcelConstructionColliders,
    frontierAirPurifierStation,
    mansionOneEntranceInteractable,
    mansionOneExteriorReturn,
    mansionOneRoomRoot: null,
    mansionOneRoom102Root: null,
    mansionOneRoomInstances: { "101": null, "102": null },
  };
}
