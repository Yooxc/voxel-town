export function createInventoryEquipmentPreview({
  THREE,
  previewCanvasWrap,
  equipmentSlotEls,
  player,
  getPlayerRigParts,
  syncPreviewPlayerPose,
  getSourceParts,
  getEquipmentVisibility,
  getEquippedItemRef,
  getEquippedItem,
  getDisplayResolvedEntry,
  getEntryName,
  getEntryVisual,
  isNftEntry,
  getEquippedToolId,
  getEquippedPickaxeLevel,
  syncEquippedToolGroupModel,
  unequipSlot,
}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  previewCanvasWrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 1.55, 5.3);
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
  directionalLight.position.set(2, 4, 5);
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0xbfd7ff, 0.35);
  fillLight.position.set(-3, 2, -2);
  scene.add(fillLight);

  const previewPlayer = player.clone(true);
  previewPlayer.position.set(0, -0.12, 0);
  previewPlayer.rotation.y = Math.PI * 0.08;
  scene.add(previewPlayer);
  const previewParts = getPlayerRigParts(previewPlayer);

  function resize() {
    const width = Math.max(1, previewCanvasWrap.clientWidth);
    const height = Math.max(1, previewCanvasWrap.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function renderPreview() {
    syncPreviewPlayerPose({
      previewPlayer,
      previewParts,
      player,
      sourceParts: getSourceParts(),
      equipmentVisibility: getEquipmentVisibility(),
    });
    if (previewParts.equippedPickaxe) {
      const level = getEquippedPickaxeLevel();
      const toolId = getEquippedToolId();
      if (
        previewParts.equippedPickaxe.userData.pickaxeLevel !== level ||
        previewParts.equippedPickaxe.userData.toolItemId !== toolId
      ) {
        syncEquippedToolGroupModel(previewParts.equippedPickaxe, toolId, level);
      }
    }
    renderer.render(scene, camera);
  }

  function renderWindow() {
    for (const slotId of ["head", "body", "shoes", "tool"]) {
      const entry = equipmentSlotEls[slotId];
      const equippedRef = getEquippedItemRef(slotId);
      const itemId = getEquippedItem(slotId);
      const hasItem = Boolean(equippedRef);
      entry.slot.style.background = "rgba(255,255,255,0.95)";
      entry.slot.style.borderColor = hasItem ? "rgba(255,140,0,0.95)" : "rgba(0,0,0,0.2)";
      entry.slot.style.boxShadow = hasItem
        ? "0 0 0 3px rgba(255,140,0,0.35), inset 0 1px 0 rgba(255,255,255,0.8)"
        : "inset 0 1px 0 rgba(255,255,255,0.8)";
      entry.slot.style.cursor = hasItem ? "pointer" : "default";
      entry.slot.title = hasItem ? "더블클릭: 장착 해제" : `${entry.label} 슬롯`;
      entry.slot.ondblclick = hasItem ? () => unequipSlot(slotId) : null;

      if (hasItem) {
        const resolvedEntry = getDisplayResolvedEntry(equippedRef);
        entry.content.innerHTML = "";
        entry.content.style.opacity = "1";
        const icon = getEntryVisual(resolvedEntry, { size: 34 });
        const name = document.createElement("div");
        name.textContent = getEntryName(resolvedEntry);
        name.style.fontSize = "11px";
        name.style.fontWeight = "700";
        name.style.marginTop = "6px";
        const wrap = document.createElement("div");
        wrap.style.display = "flex";
        wrap.style.flexDirection = "column";
        wrap.style.alignItems = "center";
        wrap.appendChild(icon);
        wrap.appendChild(name);
        if (isNftEntry(equippedRef)) {
          const badge = document.createElement("div");
          badge.textContent = "NFT";
          badge.style.marginTop = "4px";
          badge.style.fontSize = "10px";
          badge.style.fontWeight = "800";
          badge.style.padding = "2px 6px";
          badge.style.borderRadius = "999px";
          badge.style.background = "rgba(106, 76, 255, 0.88)";
          badge.style.color = "white";
          wrap.appendChild(badge);
        }
        entry.content.appendChild(wrap);
      } else {
        entry.content.textContent = "비어 있음";
        entry.content.style.fontSize = "12px";
        entry.content.style.fontWeight = "700";
        entry.content.style.opacity = "0.72";
      }
    }
    resize();
    renderPreview();
  }

  return { resize, renderPreview, renderWindow };
}
