import * as THREE from "three";

export function createFrontierSceneController({ interactables, scene, getMarkers, setMarkers, getColliders, setColliders, getTrackedColliderIndex, removeColliderAt }) {
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

  return { clearColliders, clearMarkers, registerBoothMarker };
}
