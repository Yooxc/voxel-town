import test from "node:test";
import assert from "node:assert/strict";
import { createWastelandSceneRuntime } from "../src/world/wastelandSceneRuntime.js";

test("creates fence link and structure scene plans from game state", () => {
  const runtime = createWastelandSceneRuntime();
  const posts = new Map([
    ["0:0", { row: 0, col: 0, x: 0, z: 0, ownerId: "owner" }],
    ["0:1", { row: 0, col: 1, x: 2, z: 0, ownerId: "owner" }],
    ["1:0", { row: 1, col: 0, x: 0, z: 2, ownerId: "other" }],
  ]);
  const links = runtime.getFenceLinkPlans({
    fencePosts: posts,
    cellSize: 2,
    canLinkPosts: (first, second) => first?.ownerId === second?.ownerId,
  });
  assert.deepEqual(links, [{ horizontal: true, length: 2, x: 1, z: 0 }]);

  const structure = { row: 1, col: 2, type: "woodFloor" };
  assert.deepEqual(runtime.getStructureScenePlans({
    structures: [structure],
    getCellByGrid: () => ({ x: 4, z: -2 }),
    getSurfaceY: () => 0.3,
  }), [{ structure, position: { x: 4, y: 0.3, z: -2 } }]);
});

test("creates preview overlays and validation markers", () => {
  const runtime = createWastelandSceneRuntime();
  const plans = runtime.getClaimPreviewPlans({
    cells: [{ row: 0, col: 0, x: 0, z: 0, size: 2 }, { row: 0, col: 1, x: 2, z: 0, size: 2 }],
    draftEntries: [["owner", { postKeys: ["0:0"] }]],
    currentOwnerId: "owner",
    isFencePlacementMode: true,
    getDraftBounds: () => ({ minRow: 0, maxRow: 0, minCol: 0, maxCol: 1 }),
    getDraftFencePosts: () => [],
    getDraftGuide: () => ({ canConfirm: false, missingBorderCount: 1, innerPostCount: 0 }),
  });
  assert.equal(plans.length, 3);
  assert.equal(plans[0].color, 0xff5b4a);
  assert.equal(plans[2].color, 0xff2f2f);
  assert.equal(plans[2].scale, 0.54);
});

test("registers wall colliders and removes them during rebuild and reset", () => {
  const runtime = createWastelandSceneRuntime();
  const createRoot = () => ({
    children: [],
    add(child) { this.children.push(child); child.parent = this; },
    remove(child) {
      this.children.splice(this.children.indexOf(child), 1);
      child.parent = null;
    },
  });
  const oldWall = { id: "old-wall", userData: { colliderIndex: 0 } };
  const structureRoot = createRoot();
  structureRoot.add(oldWall);
  const plot = {
    cells: [],
    fenceRoot: createRoot(),
    fenceLinkRoot: createRoot(),
    claimPreviewRoot: createRoot(),
    structureRoot,
    foundationRoot: createRoot(),
    structures: [
      { key: "wall", type: "woodWall", row: 0, col: 0 },
      { key: "floor", type: "woodFloor", row: 0, col: 0 },
    ],
  };
  const registered = [];
  const unregistered = [];
  const registeredSurfaces = [];
  const unregisteredSurfaces = [];
  const meshes = new Map();
  const unregisterCollider = (mesh) => {
    if (typeof mesh.userData?.colliderIndex !== "number") return;
    unregistered.push(mesh.id);
    mesh.userData.colliderIndex = null;
  };

  runtime.rebuildStructures({
    plot,
    disposeObject: () => {},
    getCellByGrid: () => ({ x: 1, z: 2, size: 2 }),
    getSurfaceY: () => 0.3,
    getPartDef: (type) => ({
      slot: type.endsWith("Wall") ? "wall" : "floor",
      blocksMovement: type.endsWith("Wall"),
      walkable: type.endsWith("Floor"),
    }),
    createMesh: (structure) => {
      const mesh = { id: structure.key, userData: {} };
      meshes.set(structure.key, mesh);
      return mesh;
    },
    registerCollider: (mesh) => {
      mesh.userData.colliderIndex = registered.length;
      registered.push(mesh.id);
    },
    unregisterCollider,
    registerSurface: (mesh) => registeredSurfaces.push(mesh.id),
    unregisterSurface: (mesh) => unregisteredSurfaces.push(mesh.id),
  });

  assert.deepEqual(registered, ["wall"]);
  assert.deepEqual(unregistered, ["old-wall"]);
  assert.deepEqual(registeredSurfaces, ["floor"]);
  assert.equal(meshes.get("floor").userData.colliderIndex, undefined);

  runtime.resetState({
    plot,
    resetPlan: {
      fencePosts: [],
      drafts: [],
      claims: [],
      structures: [],
      foundations: [],
      cellProgressById: new Map(),
    },
    disposeObject: () => {},
    unregisterStructureCollider: unregisterCollider,
    unregisterStructureSurface: (mesh) => unregisteredSurfaces.push(mesh.id),
    resetPlacementMode: () => {},
    closeConfirm: () => {},
    closeCancel: () => {},
    setCellState: () => {},
    updateClaimActions: () => {},
  });

  assert.deepEqual(unregistered, ["old-wall", "wall"]);
  assert.deepEqual(unregisteredSurfaces, ["old-wall", "wall", "floor"]);
  assert.equal(plot.structureRoot.children.length, 0);
});

test("keeps open doors passable and replaces door interactables during rebuild", () => {
  const runtime = createWastelandSceneRuntime();
  const createRoot = () => ({
    children: [],
    add(child) { this.children.push(child); child.parent = this; },
    remove(child) { this.children.splice(this.children.indexOf(child), 1); child.parent = null; },
  });
  const plot = {
    structureRoot: createRoot(),
    structures: [
      { key: "closed-door", type: "woodDoor", row: 0, col: 0, isOpen: false },
      { key: "open-door", type: "woodDoor", row: 0, col: 1, isOpen: true },
      { key: "window", type: "stoneWindow", row: 0, col: 2 },
    ],
  };
  const colliders = [];
  const interactables = [];
  const removedInteractables = [];
  const getPartDef = (type) => type.endsWith("Door")
    ? { slot: "wall", structureKind: "door", blocksMovement: true }
    : { slot: "wall", structureKind: "window", blocksMovement: true };

  runtime.rebuildStructures({
    plot,
    disposeObject: () => {},
    getCellByGrid: (_, col) => ({ x: col * 2, z: 0, size: 2 }),
    getSurfaceY: () => 0,
    getPartDef,
    createMesh: (structure) => ({ id: structure.key, userData: {} }),
    registerCollider: (mesh) => colliders.push(mesh.id),
    unregisterCollider: () => {},
    registerInteractable: (mesh) => { mesh.userData.interactable = true; interactables.push(mesh.id); },
    unregisterInteractable: (mesh) => { if (mesh.userData.interactable) removedInteractables.push(mesh.id); },
  });

  assert.deepEqual(colliders, ["closed-door", "window"]);
  assert.deepEqual(interactables, ["closed-door", "open-door"]);

  plot.structures = [];
  runtime.rebuildStructures({
    plot,
    disposeObject: () => {},
    getCellByGrid: () => null,
    getSurfaceY: () => 0,
    getPartDef,
    createMesh: () => null,
    unregisterCollider: () => {},
    unregisterInteractable: (mesh) => { if (mesh.userData.interactable) removedInteractables.push(mesh.id); },
  });
  assert.deepEqual(removedInteractables, ["closed-door", "open-door"]);
});

test("registers stair side and rear colliders without registering the stair group as a solid block", () => {
  const runtime = createWastelandSceneRuntime();
  const createRoot = () => ({
    children: [],
    add(child) { this.children.push(child); child.parent = this; },
    remove(child) { this.children.splice(this.children.indexOf(child), 1); child.parent = null; },
  });
  const stairSide = { userData: { isWastelandStairSideCollider: true } };
  const stairRear = { userData: { isWastelandStairRearCollider: true } };
  const stairMesh = {
    id: "stairs",
    userData: {},
    children: [stairSide, stairRear],
    traverse(callback) { callback(this); callback(stairSide); callback(stairRear); },
  };
  stairSide.parent = stairMesh;
  const plot = { structureRoot: createRoot(), structures: [{ key: "stairs", type: "woodStairs", row: 0, col: 0 }] };
  const colliders = [];

  runtime.rebuildStructures({
    plot,
    disposeObject: () => {},
    getCellByGrid: () => ({ x: 0, z: 0, size: 2 }),
    getSurfaceY: () => 0,
    getPartDef: () => ({ slot: "stairs", structureKind: "stairs", walkable: true }),
    createMesh: () => stairMesh,
    registerCollider: (mesh) => colliders.push(mesh.id ?? "side"),
    registerSurface: () => {},
  });

  assert.deepEqual(colliders, ["side", "side"]);
});
