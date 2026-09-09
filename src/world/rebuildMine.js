import * as THREE from "three";

function createPathSegment(start, end, material) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  const segment = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, length + 0.4), material);
  segment.name = "EXCIT_REBUILD_MINE_PATH";
  segment.position.set((start.x + end.x) * 0.5, start.y + 0.035, (start.z + end.z) * 0.5);
  segment.rotation.y = Math.atan2(dx, dz);
  return segment;
}

function createBoundaryRock(x, y, z, scale, material) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), material);
  rock.name = "EXCIT_REBUILD_MINE_BOUNDARY";
  rock.position.set(x, y + scale * 0.65, z);
  rock.scale.set(scale, scale * 0.8, scale * 0.9);
  rock.rotation.set(0.12, x * 0.17 + z * 0.09, -0.08);
  return rock;
}

function createDirectionSign(position, pointsLeft) {
  const root = new THREE.Group();
  root.name = "EXCIT_REBUILD_MINE_SIGN";
  const wood = new THREE.MeshStandardMaterial({ color: 0x755238, roughness: 1 });
  const marker = new THREE.MeshStandardMaterial({ color: 0xd8c37a, roughness: 0.92 });
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 0.14), wood);
  post.position.y = 0.7;
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.52, 0.12), wood);
  board.position.y = 1.38;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.11, 0.04), marker);
  shaft.position.set(pointsLeft ? -0.08 : 0.08, 1.39, 0.085);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 3), marker);
  head.position.set(pointsLeft ? -0.55 : 0.55, 1.39, 0.085);
  head.rotation.z = pointsLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
  root.add(post, board, shaft, head);
  root.position.set(position.x, position.y, position.z);
  return { root, collider: board };
}

export function createRebuildMine({ scene, groundSurfaces, registerWalkableSurface, addCollider, layout }) {
  const root = new THREE.Group();
  root.name = "EXCIT_REBUILD_GENERAL_MINE";
  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x8b765d, roughness: 1 });
  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x626661, roughness: 1 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x777168, roughness: 1 });
  const pathSegments = [];
  for (let index = 1; index < layout.generalMine.pathPoints.length; index += 1) {
    const segment = createPathSegment(
      layout.generalMine.pathPoints[index - 1],
      layout.generalMine.pathPoints[index],
      pathMaterial,
    );
    pathSegments.push(segment);
    root.add(segment);
    groundSurfaces.push(segment);
    registerWalkableSurface(layout.mapId, segment, 0.2);
  }

  const floor = new THREE.Mesh(new THREE.CircleGeometry(9.4, 20), floorMaterial);
  floor.name = "EXCIT_REBUILD_GENERAL_MINE_FLOOR";
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(layout.generalMine.center.x, layout.generalMine.center.y + 0.045, layout.generalMine.center.z);
  root.add(floor);
  groundSurfaces.push(floor);
  registerWalkableSurface(layout.mapId, floor, 0.35);

  const boundaryRocks = [];
  const center = layout.generalMine.center;
  const boundaryOffsets = [
    [-8.2, -4.8, 1.7], [-5.2, -8.0, 1.5], [-1.5, -9.0, 1.6], [2.5, -8.5, 1.45],
    [6.0, -6.5, 1.7], [8.2, -3.0, 1.55], [8.8, 1.2, 1.5], [6.8, 5.5, 1.65],
    [-7.8, 4.2, 1.55], [-9.0, 0.0, 1.7],
  ];
  for (const [x, z, scale] of boundaryOffsets) {
    const rock = createBoundaryRock(center.x + x, center.y, center.z + z, scale, rockMaterial);
    boundaryRocks.push(rock);
    root.add(rock);
    addCollider(rock, 0.84);
  }

  const entranceSign = createDirectionSign({
    x: layout.generalMine.entrance.x + 0.8,
    y: layout.generalMine.entrance.y,
    z: layout.generalMine.entrance.z + 1.2,
  }, true);
  const returnSign = createDirectionSign({
    x: center.x + 4.7,
    y: center.y,
    z: center.z + 4.3,
  }, false);
  root.add(entranceSign.root, returnSign.root);
  addCollider(entranceSign.collider, 0.9);
  addCollider(returnSign.collider, 0.9);
  scene.add(root);

  return { root, floor, pathSegments, boundaryRocks, entranceSign: entranceSign.root, returnSign: returnSign.root };
}
