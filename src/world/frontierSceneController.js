import * as THREE from "three";

export function createFrontierSceneController({
  interactables,
  scene,
  getMarkers,
  setMarkers,
  getColliders,
  setColliders,
  getTrackedColliderIndex,
  removeColliderAt,
  getConstructionRoot,
  getConstructionGroup,
  setConstructionGroup,
  getParcel,
  getBuildState,
  frontierMapX,
  buildingHeight,
  addCollider,
  buildBuildingSign,
  buildBoothLabel,
  buildBoothProductVisual,
  buildDisplayBoothVisual,
  ensurePlayerNotInsideGeneratedColliders,
  getSafeStandingPoint,
}) {
  function clearColliders(parcelLabel) {
    for (const collider of getColliders(parcelLabel)) {
      const index = getTrackedColliderIndex(collider, collider?.userData?.colliderIndex);
      if (typeof index === "number") removeColliderAt(index);
      collider?.removeFromParent?.();
    }
    setColliders(parcelLabel, []);
  }

  function clearMarkers(parcelLabel) {
    for (const marker of getMarkers(parcelLabel)) {
      const index = interactables.indexOf(marker);
      if (index !== -1) interactables.splice(index, 1);
      marker?.obj?.removeFromParent?.();
    }
    setMarkers(parcelLabel, []);
  }

  function registerBoothMarker({ parcelLabel, type, title, x, y, z, slotKey }) {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.2), new THREE.MeshBasicMaterial({ visible: false }));
    marker.position.set(x, y, z);
    scene.add(marker);
    const interactable = { obj: marker, board: marker, highlightKind: "none", type, parcelLabel, slotKey, boothTitle: title, text: `E : ${title}` };
    interactables.push(interactable);
    getMarkers(parcelLabel).push(interactable);
    return interactable;
  }

  function rebuildParcelConstructionVisual(parcelLabel) {
    const root = getConstructionRoot(parcelLabel);
    if (!root?.parent) return;

    const existingGroup = getConstructionGroup(parcelLabel);
    if (existingGroup?.parent) existingGroup.removeFromParent();
    clearColliders(parcelLabel);
    clearMarkers(parcelLabel);

    const parcel = getParcel(parcelLabel);
    if (!parcel) return;

    const buildState = getBuildState(parcelLabel);
    const stage = buildState.stage;
    if (parcel.signObj) parcel.signObj.visible = stage < 25;

    const buildGroup = new THREE.Group();
    root.add(buildGroup);
    const facesCenterLaneFromLeft = parcel.x < frontierMapX;
    const buildingWidth = Math.max(5.8, parcel.width - 2.6);
    const buildingDepth = Math.max(5.2, parcel.height - 2.4);
    const columnY = buildingHeight * 0.5;
    const halfW = buildingWidth * 0.5;
    const halfD = buildingDepth * 0.5;
    const lowerWallHeight = buildingHeight * 0.36;
    const upperWallHeight = buildingHeight * 0.26;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x7e6b56, roughness: 0.96 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a493b, roughness: 0.88 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x766553, roughness: 0.92 });
    const markerMat = new THREE.MeshStandardMaterial({ color: 0xd7ab56, roughness: 0.72, transparent: true, opacity: stage <= 0 ? 0.92 : 0.38 });
    const marker = new THREE.Mesh(new THREE.BoxGeometry(buildingWidth, 0.05, buildingDepth), markerMat);
    marker.position.y = 0.03;
    buildGroup.add(marker);

    const frontBeamX = facesCenterLaneFromLeft ? halfW - 0.14 : -halfW + 0.14;
    const frontSignX = facesCenterLaneFromLeft ? halfW + 0.1 : -halfW - 0.1;
    const frontSignRotationY = facesCenterLaneFromLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
    const backWallX = facesCenterLaneFromLeft ? -halfW + 0.13 : halfW - 0.13;
    const rearTrimX = facesCenterLaneFromLeft ? -halfW + 0.42 : halfW - 0.42;
    const colliderMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const registerBuildCollider = (sx, sy, sz, x, y, z) => {
      const collider = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), colliderMat);
      collider.position.set(x, y, z);
      buildGroup.add(collider);
      collider.userData.colliderIndex = addCollider(collider, 1.0);
      getColliders(parcelLabel).push(collider);
    };

    if (stage >= 25) {
      const columnGeo = new THREE.BoxGeometry(0.34, buildingHeight, 0.34);
      for (const [x, y, z] of [[-halfW + 0.22, columnY, -halfD + 0.22], [halfW - 0.22, columnY, -halfD + 0.22], [-halfW + 0.22, columnY, halfD - 0.22], [halfW - 0.22, columnY, halfD - 0.22]]) {
        const column = new THREE.Mesh(columnGeo, frameMat);
        column.position.set(x, y, z);
        buildGroup.add(column);
        registerBuildCollider(0.38, buildingHeight, 0.38, x, y, z);
      }
      const frontBeam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, buildingDepth - 0.2), frameMat);
      frontBeam.position.set(frontBeamX, buildingHeight - 0.32, 0);
      buildGroup.add(frontBeam);
      registerBuildCollider(0.34, 0.4, buildingDepth - 0.12, frontBeamX, buildingHeight - 0.32, 0);
      const signWrap = buildBuildingSign(buildState.signText);
      signWrap.position.set(frontSignX, buildingHeight - 0.12, 0);
      signWrap.rotation.y = frontSignRotationY;
      buildGroup.add(signWrap);
    }

    if (stage >= 50) {
      const sideWallGeo = new THREE.BoxGeometry(buildingWidth, lowerWallHeight, 0.26);
      for (const z of [-halfD + 0.13, halfD - 0.13]) {
        const sideWall = new THREE.Mesh(sideWallGeo, bodyMat);
        sideWall.position.set(0, lowerWallHeight * 0.5, z);
        buildGroup.add(sideWall);
        registerBuildCollider(buildingWidth, lowerWallHeight, 0.3, 0, lowerWallHeight * 0.5, z);
      }
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.26, lowerWallHeight + 0.18, buildingDepth), bodyMat);
      backWall.position.set(backWallX, (lowerWallHeight + 0.18) * 0.5, 0);
      buildGroup.add(backWall);
      registerBuildCollider(0.3, lowerWallHeight + 0.18, buildingDepth, backWallX, (lowerWallHeight + 0.18) * 0.5, 0);
    }

    if (stage >= 75) {
      for (const z of [-halfD + 0.09, halfD - 0.09]) {
        const upperWall = new THREE.Mesh(new THREE.BoxGeometry(buildingWidth, upperWallHeight, 0.18), frameMat);
        upperWall.position.set(0, lowerWallHeight + upperWallHeight * 0.5 + 0.08, z);
        buildGroup.add(upperWall);
        registerBuildCollider(buildingWidth, upperWallHeight, 0.22, 0, lowerWallHeight + upperWallHeight * 0.5 + 0.08, z);
      }
      const roofFrame = new THREE.Mesh(new THREE.BoxGeometry(buildingWidth, 0.16, buildingDepth), frameMat);
      roofFrame.position.set(0, buildingHeight - 0.08, 0);
      buildGroup.add(roofFrame);
    }

    if (stage >= 100) {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(buildingWidth, 0.22, buildingDepth), roofMat);
      roof.position.set(0, buildingHeight + 0.05, 0);
      buildGroup.add(roof);
      registerBuildCollider(buildingWidth, 0.26, buildingDepth, 0, buildingHeight + 0.05, 0);
      const rearTrim = new THREE.Mesh(new THREE.BoxGeometry(0.14, buildingHeight * 0.52, buildingDepth - 0.6), frameMat);
      rearTrim.position.set(rearTrimX, buildingHeight * 0.42, 0);
      buildGroup.add(rearTrim);

      const boothBaseMat = new THREE.MeshStandardMaterial({ color: 0xc8b494, roughness: 0.95 });
      const boothTopMat = new THREE.MeshStandardMaterial({ color: 0x8d755f, roughness: 0.88 });
      const boothWidth = 1.45;
      const boothDepth = 1.05;
      const boothHeight = 0.86;
      const boothTopHeight = 0.14;
      const boothTopY = boothHeight + boothTopHeight * 0.5;
      const labelY = boothHeight + 0.78;
      const sideLaneZ = halfD - 1.1;
      const displayX = facesCenterLaneFromLeft ? -0.95 : 0.95;
      const boothEntries = [
        { title: "전시 A", status: buildState.operations.displayA.statusText, x: displayX, z: -sideLaneZ },
        { title: "전시 B", status: buildState.operations.displayB.statusText, x: displayX, z: sideLaneZ },
        { title: "상점", status: buildState.operations.shop.statusText, x: facesCenterLaneFromLeft ? 1.18 : -1.18, z: 0 },
      ];
      for (const booth of boothEntries) {
        const base = new THREE.Mesh(new THREE.BoxGeometry(boothWidth, boothHeight, boothDepth), boothBaseMat);
        base.position.set(booth.x, boothHeight * 0.5, booth.z);
        buildGroup.add(base);
        const top = new THREE.Mesh(new THREE.BoxGeometry(boothWidth + 0.1, boothTopHeight, boothDepth + 0.14), boothTopMat);
        top.position.set(booth.x, boothTopY, booth.z);
        buildGroup.add(top);
        const label = buildBoothLabel(booth.title, booth.status);
        label.position.set(booth.x, labelY, booth.z);
        label.rotation.y = facesCenterLaneFromLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
        buildGroup.add(label);
        if (booth.title === "상점" && buildState.operations.shop.itemId && buildState.operations.shop.quantity > 0) {
          const productWrap = buildBoothProductVisual(buildState.operations.shop.itemId, buildState.operations.shop.quantity);
          productWrap.position.set(booth.x, boothTopY + 0.08, booth.z);
          productWrap.rotation.y = facesCenterLaneFromLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
          buildGroup.add(productWrap);
        } else if (booth.title !== "상점") {
          const displayState = booth.title === "전시 A" ? buildState.operations.displayA : buildState.operations.displayB;
          if (displayState.entry) {
            const displayWrap = buildDisplayBoothVisual(displayState.entry);
            displayWrap.position.set(booth.x, boothTopY + 0.08, booth.z);
            displayWrap.rotation.y = facesCenterLaneFromLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
            buildGroup.add(displayWrap);
          }
        }
        registerBuildCollider(boothWidth - 0.16, boothHeight + boothTopHeight, boothDepth - 0.12, booth.x, boothHeight * 0.5, booth.z);
        const boothWorldPos = buildGroup.localToWorld(new THREE.Vector3(booth.x + (facesCenterLaneFromLeft ? 0.88 : -0.88), 0.82, booth.z));
        registerBoothMarker({ parcelLabel, type: booth.title === "상점" ? "frontierShopBooth" : "frontierDisplayBooth", title: booth.title, x: boothWorldPos.x, y: boothWorldPos.y, z: boothWorldPos.z, slotKey: booth.title === "상점" ? "shop" : booth.title === "전시 A" ? "displayA" : "displayB" });
      }
    }

    setConstructionGroup(parcelLabel, buildGroup);
    ensurePlayerNotInsideGeneratedColliders(getColliders(parcelLabel), getSafeStandingPoint(parcelLabel));
  }

  return { clearColliders, clearMarkers, registerBoothMarker, rebuildParcelConstructionVisual };
}
