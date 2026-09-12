import * as THREE from "three";
import { createGroundedPath, createPolygonBand, expandPolygon } from "./rebuildTerrainGeometry.js";


function createPolygonFloor(polygon, height, material) {
  const shape = new THREE.Shape();
  polygon.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, point.z);
    else shape.lineTo(point.x, point.z);
  });
  shape.closePath();
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  floor.name = "EXCIT_REBUILD_OUTDOOR_QUARRY_FLOOR";
  floor.rotation.x = Math.PI / 2;
  floor.position.y = height + 0.045;
  return floor;
}

function createRubbleRock(x, y, z, scale, material, seed) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), material);
  rock.name = "EXCIT_REBUILD_NON_MINEABLE_RUBBLE";
  rock.position.set(x, y + scale * 0.58, z);
  rock.scale.set(scale, scale * (0.62 + (seed % 3) * 0.08), scale * (0.78 + (seed % 2) * 0.12));
  rock.rotation.set(0.08 * (seed % 4), seed * 0.73, -0.05 * (seed % 3));
  rock.userData.isQuarryRubble = true;
  return rock;
}

function createRubbleCluster(definition, floorHeight, material) {
  const group = new THREE.Group();
  group.name = `EXCIT_REBUILD_RUBBLE_${definition.id}`;
  const rocks = [];
  for (let index = 0; index < definition.count; index += 1) {
    const angle = index * 2.399963 + definition.x * 0.03;
    const radius = definition.radius * Math.sqrt((index + 0.45) / definition.count);
    const scale = definition.scale * (0.72 + (index % 4) * 0.12);
    const rock = createRubbleRock(
      definition.x + Math.cos(angle) * radius,
      floorHeight,
      definition.z + Math.sin(angle) * radius,
      scale,
      material,
      index,
    );
    rocks.push(rock);
    group.add(rock);
  }
  return { group, rocks };
}

function createTerrace(definition, mine, material, index) {
  const terrace = new THREE.Group();
  terrace.name = `EXCIT_REBUILD_QUARRY_TERRACE_${index + 1}`;
  const inner = expandPolygon(mine.floorPolygon, definition.inset);
  const outer = expandPolygon(mine.floorPolygon, definition.outset);
  const previousHeight = index ? mine.terraces[index - 1].height : 0;
  const entryX = mine.floorPolygon[mine.terraceOpeningEdge].x;
  const taper = (height) => (p) => height * Math.max(0.12, Math.min(1, (entryX - p.x) / 13));
  terrace.add(createPolygonBand(inner, inner, taper(previousHeight), taper(definition.height), material, mine.terraceOpeningEdge));
  terrace.add(createPolygonBand(inner, outer, taper(definition.height), taper(definition.height), material, mine.terraceOpeningEdge));
  terrace.add(createPolygonBand(outer, outer, taper(definition.height), -1, material, mine.terraceOpeningEdge));
  terrace.position.y = mine.floorHeight;
  return terrace;
}

function createDirectionSign(position, pointsLeft) {
  const root = new THREE.Group();
  root.name = "EXCIT_REBUILD_QUARRY_SIGN";
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

function createQuarryFacility(position) {
  const root = new THREE.Group();
  root.name = "EXCIT_REBUILD_QUARRY_FACILITY";
  const wood = new THREE.MeshStandardMaterial({ color: 0x806346, roughness: 1 });
  const canvas = new THREE.MeshStandardMaterial({ color: 0xc7b986, roughness: 0.95 });
  const platform = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 2.7), wood);
  platform.position.y = 0.09;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.16, 2.9), canvas);
  roof.position.y = 2.25;
  for (const x of [-2.25, 2.25]) for (const z of [-1.05, 1.05]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.13, 2.2, 0.13), wood);
    post.position.set(x, 1.1, z);
    root.add(post);
  }
  root.add(platform, roof);
  root.position.set(position.x, position.y, position.z);
  return { root, collider: platform };
}

export function createRebuildMine({ scene, groundSurfaces, registerWalkableSurface, addCollider, layout }) {
  const root = new THREE.Group();
  root.name = "EXCIT_REBUILD_OUTDOOR_QUARRY";
  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x91806a, roughness: 1, side: THREE.DoubleSide });
  const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0x6f745f, roughness: 1, side: THREE.DoubleSide });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xb3b2a8, roughness: 1, side: THREE.DoubleSide });
  const rubbleMaterial = new THREE.MeshStandardMaterial({ color: 0x696d68, roughness: 1 });
  const cliffMaterial = new THREE.MeshStandardMaterial({ color: 0x929991, roughness: 1, side: THREE.DoubleSide });

  const pathSegments = [];
  const routeShoulders = [];
  {
    const points = layout.generalMine.pathPoints;
    const shoulder = createGroundedPath(points, 7.4, layout.origin, shoulderMaterial, 0.04);
    const segment = createGroundedPath([...points, ...layout.generalMine.workPath.slice(1)], 4.4, layout.origin, pathMaterial, 0.08);
    shoulder.name = "EXCIT_REBUILD_QUARRY_ROUTE_SHOULDER";
    segment.name = "EXCIT_REBUILD_QUARRY_ROUTE";
    routeShoulders.push(shoulder);
    pathSegments.push(segment);
    root.add(shoulder, segment);
    groundSurfaces.push(shoulder, segment);
    registerWalkableSurface(layout.mapId, shoulder, 0.24);
    registerWalkableSurface(layout.mapId, segment, 0.2);
  }

  const floor = createPolygonFloor(
    layout.generalMine.floorPolygon,
    layout.generalMine.floorHeight,
    floorMaterial,
  );
  root.add(floor);
  groundSurfaces.push(floor);
  registerWalkableSurface(layout.mapId, floor, 0.35);

  const terraces = layout.generalMine.terraces.map((definition, index) => (
    createTerrace(definition, layout.generalMine, cliffMaterial, index)
  ));
  for (const terrace of terraces) {
    root.add(terrace);
    // Traversal uses the floor polygon. A box around the ring would block its entire interior.
  }

  const rubbleClusters = [];
  const boundaryRocks = [];
  for (const definition of layout.generalMine.rubbleClusters) {
    const cluster = createRubbleCluster(definition, layout.generalMine.floorHeight, rubbleMaterial);
    rubbleClusters.push(cluster.group);
    boundaryRocks.push(...cluster.rocks);
    root.add(cluster.group);
    for (const rock of cluster.rocks) addCollider(rock, 0.86);
  }

  const facility = createQuarryFacility(layout.generalMine.facility);
  root.add(facility.root);
  addCollider(facility.collider, 0.95);

  const entranceSign = createDirectionSign({
    x: layout.generalMine.entrance.x + 1.1,
    y: layout.generalMine.entrance.y,
    z: layout.generalMine.entrance.z + 3.3,
  }, true);
  const returnSign = createDirectionSign({
    x: layout.generalMine.pathPoints.at(-1).x - 1.73565500529092,
    y: layout.generalMine.floorHeight,
    z: layout.generalMine.pathPoints.at(-1).z + 6,
  }, false);
  root.add(entranceSign.root, returnSign.root);
  addCollider(entranceSign.collider, 0.9);
  addCollider(returnSign.collider, 0.9);
  scene.add(root);

  return {
    root,
    floor,
    pathSegments,
    routeShoulders,
    terraces,
    rubbleClusters,
    boundaryRocks,
    facility: facility.root,
    entranceSign: entranceSign.root,
    returnSign: returnSign.root,
  };
}
