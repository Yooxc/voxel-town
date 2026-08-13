import * as THREE from "three";

export function hasMansionOneResidenceAuthority(hasItem) {
  return hasItem("mansionOneRoom101Permit") || hasItem("mansionOneRoom102Permit");
}

export function hasMansionPersonalStorageAuthority(hasItem) {
  return hasMansionOneResidenceAuthority(hasItem);
}

export function getOwnedMansionRoomKey(hasItem) {
  if (hasItem("mansionOneRoom101Permit")) return "101";
  if (hasItem("mansionOneRoom102Permit")) return "102";
  return "";
}

export function getOwnedMansionRoomPermitName(hasItem, itemDefs) {
  const roomKey = getOwnedMansionRoomKey(hasItem);
  if (roomKey === "101") return itemDefs.mansionOneRoom101Permit.name;
  if (roomKey === "102") return itemDefs.mansionOneRoom102Permit.name;
  return "거주권";
}

export function createDefaultResidenceNoticeBoardEntry(key) {
  const titleMap = {
    boardA: "게시판 A",
    boardB: "게시판 B",
    boardC: "게시판 C",
  };
  return {
    title: titleMap[key] ?? "게시판",
    lines: ["공용 알림과 안내가", "표시될 예정입니다."],
  };
}

export function createDefaultResidenceNoticeBoardState(boardKeys) {
  return Object.fromEntries(
    boardKeys.map((key) => [key, createDefaultResidenceNoticeBoardEntry(key)])
  );
}

export function normalizeResidenceNoticeBoardEntry(key, rawEntry) {
  const defaults = createDefaultResidenceNoticeBoardEntry(key);
  const source = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
  const rawLines = Array.isArray(source.lines) ? source.lines : defaults.lines;
  const lines = rawLines
    .map((line) => String(line ?? "").trim().slice(0, 36))
    .filter(Boolean)
    .slice(0, 4);
  return {
    title: String(source.title ?? defaults.title).trim().slice(0, 24) || defaults.title,
    lines: lines.length > 0 ? lines : defaults.lines,
  };
}

export function normalizeResidenceNoticeBoardState(boardKeys, rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  return Object.fromEntries(
    boardKeys.map((key) => [key, normalizeResidenceNoticeBoardEntry(key, source[key])])
  );
}

function normalizeMansionRoomKey(roomKey) {
  return roomKey === "102" ? "102" : "101";
}

export function getMansionRoomEntryPlan(roomKey, roomPosition, playerY) {
  const activeRoomKey = normalizeMansionRoomKey(roomKey);
  return {
    activeRoomKey,
    roomToDestroy: activeRoomKey === "102" ? "101" : "102",
    position: { x: roomPosition.x, y: playerY, z: roomPosition.z + 4.2 },
    rotationY: Math.PI,
  };
}

export function getMansionRoomExitPlan(activeRoomKey, exteriorReturn, playerY) {
  return {
    roomToDestroy: normalizeMansionRoomKey(activeRoomKey),
    position: { x: exteriorReturn.x, y: playerY, z: exteriorReturn.z },
    rotationY: exteriorReturn.rotationY,
  };
}

export function getMansionSleepPlan(bedPosition, playerY) {
  return {
    sleepPosition: { x: bedPosition.x - 0.15, y: playerY, z: bedPosition.z },
    wakePoint: { x: bedPosition.x + 1.95, z: bedPosition.z + 0.2, rotationY: Math.PI * -0.5 },
    rotationY: Math.PI * -0.5,
  };
}

export function destroyMansionRoomInstance({
  roomKey,
  mansionOneRoomInstances,
  getTrackedColliderIndex,
  removeColliderAt,
  removeInteractableEntry,
  removeGroundSurface,
  unregisterWalkableSurface,
  unregisterResidenceMapZone,
  residenceMapId,
  mansionOneRoomRoot,
  mansionOneRoom102Root,
}) {
  const normalizedRoomKey = normalizeMansionRoomKey(roomKey);
  const instance = mansionOneRoomInstances[normalizedRoomKey];
  if (!instance) {
    return {
      mansionOneRoomRoot,
      mansionOneRoom102Root,
      mansionOneBedInteractable: null,
      mansionOneStorageInteractable: null,
      mansionOneExitInteractable: null,
    };
  }

  for (let i = instance.colliderObjects.length - 1; i >= 0; i -= 1) {
    const colliderObj = instance.colliderObjects[i];
    const colliderIndex = getTrackedColliderIndex(
      colliderObj,
      colliderObj?.userData?.colliderIndex
    );
    if (typeof colliderIndex === "number") {
      removeColliderAt(colliderIndex);
    }
  }
  for (const interactable of instance.interactables) {
    removeInteractableEntry(interactable);
  }
  for (const mesh of instance.groundMeshes) {
    removeGroundSurface(mesh);
  }
  for (const walkableEntry of instance.walkableEntries) {
    unregisterWalkableSurface(residenceMapId, walkableEntry);
  }
  for (const zone of instance.residenceZones) {
    unregisterResidenceMapZone(zone);
  }

  instance.root.removeFromParent();
  mansionOneRoomInstances[normalizedRoomKey] = null;

  return {
    mansionOneRoomRoot:
      normalizedRoomKey === "101" ? null : mansionOneRoomRoot,
    mansionOneRoom102Root:
      normalizedRoomKey === "102" ? null : mansionOneRoom102Root,
    mansionOneBedInteractable: null,
    mansionOneStorageInteractable: null,
    mansionOneExitInteractable: null,
  };
}

export function createMansionRoomInstance({
  roomKey,
  scene,
  interactables,
  groundSurfaces,
  addCollider,
  registerWalkableSurface,
  registerResidenceMapZone,
  ensurePlayerNotInsideGeneratedColliders,
  residenceMapId,
  startFlatY,
  mansionRoomInstanceOrigins,
  mansionOneRoomInstances,
}) {
  const normalizedRoomKey = normalizeMansionRoomKey(roomKey);
  const existing = mansionOneRoomInstances[normalizedRoomKey];
  if (existing) {
    return {
      instance: existing,
      mansionOneRoomRoot:
        normalizedRoomKey === "101" ? existing.root : null,
      mansionOneRoom102Root:
        normalizedRoomKey === "102" ? existing.root : null,
      mansionOneBedInteractable: existing.interactables.find((entry) => entry.type === "mansionBed") ?? null,
      mansionOneStorageInteractable: existing.interactables.find((entry) => entry.type === "mansionStorage") ?? null,
      mansionOneExitInteractable: existing.interactables.find((entry) => entry.type === "mansionExit") ?? null,
    };
  }

  const origin =
    mansionRoomInstanceOrigins[normalizedRoomKey] ??
    mansionRoomInstanceOrigins["101"];
  const roomRoot = new THREE.Group();
  roomRoot.position.set(origin.x, startFlatY, origin.z);
  scene.add(roomRoot);

  const instance = {
    roomKey: normalizedRoomKey,
    root: roomRoot,
    colliderObjects: [],
    interactables: [],
    groundMeshes: [],
    walkableEntries: [],
    residenceZones: [],
  };

  const roomWallMat = new THREE.MeshStandardMaterial({ color: 0xd9d1c8, roughness: 0.94 });
  const roomTrimMat = new THREE.MeshStandardMaterial({ color: 0x7a6d61, roughness: 0.88 });

  function trackCollider(obj, shrink = 1.0) {
    addCollider(obj, shrink);
    instance.colliderObjects.push(obj);
    return obj;
  }

  function trackMarker(marker, interactableData) {
    scene.add(marker);
    const interactable = {
      obj: marker,
      board: marker,
      highlightKind: "none",
      roomKey: normalizedRoomKey,
      ...interactableData,
    };
    interactables.push(interactable);
    instance.interactables.push(interactable);
    return interactable;
  }

  const roomFloor = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.16, 10),
    new THREE.MeshStandardMaterial({ color: 0xa79a89, roughness: 0.96 })
  );
  roomFloor.position.set(0, 0.08, 0);
  roomRoot.add(roomFloor);
  groundSurfaces.push(roomFloor);
  instance.groundMeshes.push(roomFloor);
  instance.walkableEntries.push(registerWalkableSurface(residenceMapId, roomFloor, 0.42));
  instance.residenceZones.push(registerResidenceMapZone(roomRoot.position.x, roomRoot.position.z, 12, 10));

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 3.8, 0.28), roomWallMat);
  backWall.position.set(0, 1.9, -5.0);
  roomRoot.add(backWall);
  trackCollider(backWall, 1.0);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.8, 10), roomWallMat);
  leftWall.position.set(-6.0, 1.9, 0);
  roomRoot.add(leftWall);
  trackCollider(leftWall, 1.0);

  const rightWall = leftWall.clone();
  rightWall.position.x = 6.0;
  roomRoot.add(rightWall);
  trackCollider(rightWall, 1.0);

  const frontLeftWall = new THREE.Mesh(new THREE.BoxGeometry(4.35, 3.8, 0.28), roomWallMat);
  frontLeftWall.position.set(-3.83, 1.9, 5.0);
  roomRoot.add(frontLeftWall);
  trackCollider(frontLeftWall, 1.0);

  const frontRightWall = frontLeftWall.clone();
  frontRightWall.position.x = 3.83;
  roomRoot.add(frontRightWall);
  trackCollider(frontRightWall, 1.0);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(12, 0.18, 10), roomTrimMat);
  ceiling.position.set(0, 3.9, 0);
  roomRoot.add(ceiling);
  trackCollider(ceiling, 1.0);

  const roomDoorFrameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.7, 0.2), roomTrimMat);
  roomDoorFrameLeft.position.set(-1.2, 1.35, 4.92);
  roomRoot.add(roomDoorFrameLeft);
  trackCollider(roomDoorFrameLeft, 1.0);

  const roomDoorFrameRight = roomDoorFrameLeft.clone();
  roomDoorFrameRight.position.x = 1.2;
  roomRoot.add(roomDoorFrameRight);
  trackCollider(roomDoorFrameRight, 1.0);

  const roomDoorTop = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.2, 0.2), roomTrimMat);
  roomDoorTop.position.set(0, 2.7, 4.92);
  roomRoot.add(roomDoorTop);
  trackCollider(roomDoorTop, 1.0);

  const roomDoorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 2.35, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x8f7a67, roughness: 0.9 })
  );
  roomDoorPanel.position.set(0, 1.18, 4.88);
  roomRoot.add(roomDoorPanel);
  trackCollider(roomDoorPanel, 1.0);

  const roomBedBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.38, 1.35),
    new THREE.MeshStandardMaterial({ color: 0x6a5d51, roughness: 0.92 })
  );
  roomBedBase.position.set(-3.1, 0.38, -2.2);
  roomRoot.add(roomBedBase);
  trackCollider(roomBedBase, 1.0);

  const roomMattress = new THREE.Mesh(
    new THREE.BoxGeometry(2.28, 0.22, 1.12),
    new THREE.MeshStandardMaterial({ color: 0xe9e5df, roughness: 0.98 })
  );
  roomMattress.position.set(-3.1, 0.68, -2.2);
  roomRoot.add(roomMattress);

  const roomPillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.18, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xf7f5f2, roughness: 1.0 })
  );
  roomPillow.position.set(-3.8, 0.88, -2.2);
  roomRoot.add(roomPillow);

  const roomBedMarker = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.5, 1.8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  roomBedMarker.position.set(roomRoot.position.x - 3.1, startFlatY + 1.0, roomRoot.position.z - 2.2);
  const bedInteractable = trackMarker(roomBedMarker, { type: "mansionBed" });

  const roomChest = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.88, 0.78),
    new THREE.MeshStandardMaterial({ color: 0x8a6a46, roughness: 0.94 })
  );
  roomChest.position.set(3.2, 0.44, -2.6);
  roomRoot.add(roomChest);
  trackCollider(roomChest, 1.0);

  const roomChestLid = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 0.14, 0.86),
    new THREE.MeshStandardMaterial({ color: 0x9a7850, roughness: 0.9 })
  );
  roomChestLid.position.set(3.2, 0.95, -2.6);
  roomRoot.add(roomChestLid);

  const roomStorageMarker = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.6, 1.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  roomStorageMarker.position.set(roomRoot.position.x + 3.2, startFlatY + 0.9, roomRoot.position.z - 2.6);
  const storageInteractable = trackMarker(roomStorageMarker, { type: "mansionStorage" });

  const roomExitMarker = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.8, 1.0),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  roomExitMarker.position.set(roomRoot.position.x, startFlatY + 1.4, roomRoot.position.z + 3.8);
  const exitInteractable = trackMarker(roomExitMarker, { type: "mansionExit" });

  ensurePlayerNotInsideGeneratedColliders(
    [roomDoorPanel, roomBedBase, roomChest],
    {
      x: roomRoot.position.x,
      z: roomRoot.position.z + 3.35,
      rotationY: Math.PI,
    },
    ""
  );

  mansionOneRoomInstances[normalizedRoomKey] = instance;
  return {
    instance,
    mansionOneRoomRoot: normalizedRoomKey === "101" ? roomRoot : null,
    mansionOneRoom102Root: normalizedRoomKey === "102" ? roomRoot : null,
    mansionOneBedInteractable: bedInteractable,
    mansionOneStorageInteractable: storageInteractable,
    mansionOneExitInteractable: exitInteractable,
  };
}
