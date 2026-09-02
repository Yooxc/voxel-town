import * as THREE from "three";

const MINE_CEILING_BASE_Y = 10.15;
const MINE_CEILING_THICKNESS = 2.8;

function fract(value) {
  return value - Math.floor(value);
}

function seededValue(seed) {
  return fract(Math.sin(seed * 12.9898 + 78.233) * 43758.5453);
}

function getProfileVertexIndex(layer, x, z, segmentsX, segmentsZ) {
  return layer * (segmentsX + 1) * (segmentsZ + 1) + z * (segmentsX + 1) + x;
}

function createRockRingPoints({ halfX, halfZ, scale, offsetX, offsetZ, seed, ringIndex }) {
  const profile = [
    [-1, -1], [0, -1], [1, -1], [1, 0],
    [1, 1], [0, 1], [-1, 1], [-1, 0],
  ];
  return profile.map(([x, z], pointIndex) => {
    const variation = 1.02 + seededValue(seed + ringIndex * 41.7 + pointIndex * 13.1) * 0.14;
    return {
      x: offsetX + x * halfX * scale * variation,
      z: offsetZ + z * halfZ * scale * variation,
    };
  });
}

function createFacetedRockGeometry({ width, depth, rings, seed }) {
  const positions = [];
  const indices = [];
  const sides = 8;

  for (let ringIndex = 0; ringIndex < rings.length; ringIndex++) {
    const ring = rings[ringIndex];
    const points = createRockRingPoints({
      halfX: width * 0.5,
      halfZ: depth * 0.5,
      scale: ring.scale,
      offsetX: ring.offsetX,
      offsetZ: ring.offsetZ,
      seed,
      ringIndex,
    });
    for (const point of points) positions.push(point.x, ring.y, point.z);
  }

  for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex++) {
    for (let side = 0; side < sides; side++) {
      const nextSide = (side + 1) % sides;
      const current = ringIndex * sides + side;
      const currentNext = ringIndex * sides + nextSide;
      const next = (ringIndex + 1) * sides + side;
      const nextNext = (ringIndex + 1) * sides + nextSide;
      indices.push(current, next, nextNext, current, nextNext, currentNext);
    }
  }

  const bottomCenter = positions.length / 3;
  positions.push(0, rings[0].y, 0);
  const topCenter = positions.length / 3;
  positions.push(0, rings.at(-1).y, 0);
  for (let side = 0; side < sides; side++) {
    const nextSide = (side + 1) % sides;
    indices.push(bottomCenter, nextSide, side);
    const topStart = (rings.length - 1) * sides;
    indices.push(topCenter, topStart + side, topStart + nextSide);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function getAbandonedMineCeilingHeight(localX, localZ, {
  baseY = MINE_CEILING_BASE_Y,
} = {}) {
  const broadShape = Math.sin(localX * 0.105 + 0.7) * 0.28
    + Math.cos(localZ * 0.12 - 0.4) * 0.25;
  const diagonalShape = Math.sin((localX + localZ) * 0.075) * 0.16;
  const facetedShape = (seededValue(localX * 17.3 + localZ * 23.9) - 0.5) * 0.18;
  return baseY + broadShape + diagonalShape + facetedShape;
}

export function createAbandonedMineCeilingGeometry({
  width,
  depth,
  segmentsX = 24,
  segmentsZ = 24,
  thickness = MINE_CEILING_THICKNESS,
  getBottomY = getAbandonedMineCeilingHeight,
}) {
  const positions = [];
  const indices = [];
  const halfX = width * 0.5;
  const halfZ = depth * 0.5;

  for (let layer = 0; layer < 2; layer++) {
    for (let z = 0; z <= segmentsZ; z++) {
      for (let x = 0; x <= segmentsX; x++) {
        const localX = -halfX + (x / segmentsX) * width;
        const localZ = -halfZ + (z / segmentsZ) * depth;
        const bottomY = getBottomY(localX, localZ);
        positions.push(localX, layer === 0 ? bottomY : bottomY + thickness, localZ);
      }
    }
  }

  for (let z = 0; z < segmentsZ; z++) {
    for (let x = 0; x < segmentsX; x++) {
      const bottomA = getProfileVertexIndex(0, x, z, segmentsX, segmentsZ);
      const bottomB = getProfileVertexIndex(0, x + 1, z, segmentsX, segmentsZ);
      const bottomC = getProfileVertexIndex(0, x + 1, z + 1, segmentsX, segmentsZ);
      const bottomD = getProfileVertexIndex(0, x, z + 1, segmentsX, segmentsZ);
      indices.push(bottomA, bottomC, bottomB, bottomA, bottomD, bottomC);

      const topA = getProfileVertexIndex(1, x, z, segmentsX, segmentsZ);
      const topB = getProfileVertexIndex(1, x + 1, z, segmentsX, segmentsZ);
      const topC = getProfileVertexIndex(1, x + 1, z + 1, segmentsX, segmentsZ);
      const topD = getProfileVertexIndex(1, x, z + 1, segmentsX, segmentsZ);
      indices.push(topA, topB, topC, topA, topC, topD);
    }
  }

  const addSide = (bottomA, bottomB, topA, topB) => {
    indices.push(bottomA, bottomB, topB, bottomA, topB, topA);
  };
  for (let x = 0; x < segmentsX; x++) {
    addSide(
      getProfileVertexIndex(0, x, 0, segmentsX, segmentsZ),
      getProfileVertexIndex(0, x + 1, 0, segmentsX, segmentsZ),
      getProfileVertexIndex(1, x, 0, segmentsX, segmentsZ),
      getProfileVertexIndex(1, x + 1, 0, segmentsX, segmentsZ)
    );
    addSide(
      getProfileVertexIndex(0, x + 1, segmentsZ, segmentsX, segmentsZ),
      getProfileVertexIndex(0, x, segmentsZ, segmentsX, segmentsZ),
      getProfileVertexIndex(1, x + 1, segmentsZ, segmentsX, segmentsZ),
      getProfileVertexIndex(1, x, segmentsZ, segmentsX, segmentsZ)
    );
  }
  for (let z = 0; z < segmentsZ; z++) {
    addSide(
      getProfileVertexIndex(0, segmentsX, z, segmentsX, segmentsZ),
      getProfileVertexIndex(0, segmentsX, z + 1, segmentsX, segmentsZ),
      getProfileVertexIndex(1, segmentsX, z, segmentsX, segmentsZ),
      getProfileVertexIndex(1, segmentsX, z + 1, segmentsX, segmentsZ)
    );
    addSide(
      getProfileVertexIndex(0, 0, z + 1, segmentsX, segmentsZ),
      getProfileVertexIndex(0, 0, z, segmentsX, segmentsZ),
      getProfileVertexIndex(1, 0, z + 1, segmentsX, segmentsZ),
      getProfileVertexIndex(1, 0, z, segmentsX, segmentsZ)
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createAbandonedMinePillarGeometry({ width, depth, shaftHeight, ceilingHeight, seed }) {
  const topY = Math.max(shaftHeight + 0.72, ceilingHeight + 0.34);
  const shoulderY = shaftHeight + (topY - shaftHeight) * 0.56;
  return createFacetedRockGeometry({
    width,
    depth,
    seed,
    rings: [
      { y: 0, scale: 1.14, offsetX: 0, offsetZ: 0 },
      { y: shaftHeight * 0.48, scale: 1.0, offsetX: 0.08, offsetZ: -0.05 },
      { y: shaftHeight, scale: 1.08, offsetX: -0.05, offsetZ: 0.06 },
      { y: shoulderY, scale: 1.26, offsetX: 0.12, offsetZ: 0.08 },
      { y: topY, scale: 1.48, offsetX: -0.08, offsetZ: -0.04 },
    ],
  });
}

function createAbandonedMineWallGeometry({ width, depth, height, seed }) {
  return createFacetedRockGeometry({
    width,
    depth,
    seed,
    rings: [
      { y: 0, scale: 1.08, offsetX: 0, offsetZ: 0 },
      { y: height * 0.42, scale: 1.0, offsetX: 0.1, offsetZ: -0.06 },
      { y: height * 0.78, scale: 1.06, offsetX: -0.08, offsetZ: 0.08 },
      { y: height, scale: 1.18, offsetX: 0.04, offsetZ: 0.02 },
    ],
  });
}

function addRockWallVisuals({ root, wallDefs, wallBaseY, materials }) {
  for (let wallIndex = 0; wallIndex < wallDefs.length; wallIndex++) {
    const wall = wallDefs[wallIndex];
    const horizontal = wall.sx >= wall.sz;
    const mainLength = horizontal ? wall.sx : wall.sz;
    const segmentCount = Math.max(1, Math.ceil(mainLength / 9));
    const segmentLength = mainLength / segmentCount;
    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
      const offset = -mainLength * 0.5 + segmentLength * (segmentIndex + 0.5);
      const mesh = new THREE.Mesh(
        createAbandonedMineWallGeometry({
          width: horizontal ? segmentLength + 0.42 : wall.sx + 0.42,
          depth: horizontal ? wall.sz + 0.42 : segmentLength + 0.42,
          height: wall.sy,
          seed: wallIndex * 97 + segmentIndex * 17,
        }),
        materials.wall
      );
      mesh.position.set(
        horizontal ? wall.x + offset : wall.x,
        wallBaseY - wall.sy * 0.5,
        horizontal ? wall.z : wall.z + offset
      );
      mesh.rotation.y = wall.ry;
      root.add(mesh);
    }
  }
}

export function createAbandonedMineVisuals({
  scene,
  campMapX,
  campMapZ,
  campSize,
  wallDefs,
  wallBaseY,
  pillarDefs,
  registerCaveDarkMaterial,
}) {
  const root = new THREE.Group();
  root.position.set(campMapX, 0, campMapZ);
  root.name = "abandoned-mine-visuals";

  const materials = {
    ceiling: registerCaveDarkMaterial(new THREE.MeshStandardMaterial({
      color: 0x40372f,
      roughness: 1,
      flatShading: true,
      side: THREE.DoubleSide,
    }), 0.24),
    wall: registerCaveDarkMaterial(new THREE.MeshStandardMaterial({
      color: 0x4a4036,
      roughness: 1,
      flatShading: true,
    }), 0.25),
    pillar: registerCaveDarkMaterial(new THREE.MeshStandardMaterial({
      color: 0x51463b,
      roughness: 1,
      flatShading: true,
    }), 0.27),
  };

  const ceiling = new THREE.Mesh(
    createAbandonedMineCeilingGeometry({ width: campSize + 4, depth: campSize + 4 }),
    materials.ceiling
  );
  ceiling.position.y = 0;
  root.add(ceiling);

  addRockWallVisuals({ root, wallDefs, wallBaseY, materials });

  for (let pillarIndex = 0; pillarIndex < pillarDefs.length; pillarIndex++) {
    const pillar = pillarDefs[pillarIndex];
    const ceilingHeight = getAbandonedMineCeilingHeight(pillar.x, pillar.z);
    const mesh = new THREE.Mesh(
      createAbandonedMinePillarGeometry({
        width: pillar.sx,
        depth: pillar.sz,
        shaftHeight: pillar.sy,
        ceilingHeight,
        seed: pillarIndex * 71 + pillar.x * 3.3 + pillar.z * 5.7,
      }),
      materials.pillar
    );
    mesh.position.set(pillar.x, 0, pillar.z);
    mesh.rotation.y = pillar.ry;
    root.add(mesh);
  }

  scene.add(root);
  return { root, ceiling, materials };
}
