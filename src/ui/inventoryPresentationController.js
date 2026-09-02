export function createInventoryPresentationController(ctx) {
  const previewCache = new Map();

  function disposeObject(root) {
    root.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) {
        for (const material of object.material) material.dispose?.();
      } else {
        object.material?.dispose?.();
      }
    });
  }

  function createFallbackIcon(text, size = 24) {
    const icon = document.createElement("div");
    icon.textContent = text;
    Object.assign(icon.style, { fontSize: `${size}px`, lineHeight: "1", transform: "translateY(-1px)" });
    return icon;
  }

  function getRenderedModelPreviewDataUrl(cacheKey, buildModel, size = 40) {
    if (previewCache.has(cacheKey)) return previewCache.get(cacheKey);
    const renderer = new ctx.THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(size, size, false);
    const scene = new ctx.THREE.Scene();
    const camera = new ctx.THREE.PerspectiveCamera(32, 1, 0.1, 50);
    scene.add(new ctx.THREE.AmbientLight(0xffffff, 1.35));
    const keyLight = new ctx.THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(2.5, 3.5, 4.5);
    scene.add(keyLight);
    const fillLight = new ctx.THREE.DirectionalLight(0xcfd7e6, 0.35);
    fillLight.position.set(-2, 1.5, -2);
    scene.add(fillLight);
    const model = buildModel();
    scene.add(model);
    model.rotation.set(-0.3, 0.68, 0.1);
    const box = new ctx.THREE.Box3().setFromObject(model);
    const center = box.getCenter(new ctx.THREE.Vector3());
    const sizeVector = box.getSize(new ctx.THREE.Vector3());
    model.position.sub(center);
    model.position.y -= box.min.y * 0.15;
    const radius = Math.max(sizeVector.x, sizeVector.y, sizeVector.z) * 0.5 || 1;
    camera.position.set(radius * 1.45, radius * 1.15, radius * 2.3);
    camera.lookAt(0, radius * 0.18, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL("image/png");
    previewCache.set(cacheKey, dataUrl);
    disposeObject(model);
    renderer.dispose();
    return dataUrl;
  }

  function createImage(dataUrl, alt, size) {
    const image = document.createElement("img");
    image.src = dataUrl;
    image.alt = alt;
    image.width = size;
    image.height = size;
    image.draggable = false;
    Object.assign(image.style, { display: "block", width: `${size}px`, height: `${size}px`, objectFit: "contain", pointerEvents: "none" });
    return image;
  }

  function getItemPreviewDataUrl(itemId, size = 40, variantLevel = null) {
    const variant = itemId === "pickaxe" ? `lv${Number.isFinite(variantLevel) ? variantLevel : ctx.getPickaxeLevel()}` : "base";
    const definition = ctx.itemDefs[itemId];
    if (!definition?.makeInventoryModel) return null;
    return getRenderedModelPreviewDataUrl(`${itemId}:${variant}:${size}`, () => (
      itemId === "pickaxe" && Number.isFinite(variantLevel)
        ? ctx.buildPickaxeModel(variantLevel)
        : definition.makeInventoryModel()
    ), size);
  }

  function createItemVisual(itemId, options = {}) {
    const size = options.size ?? 40;
    const definition = ctx.itemDefs[itemId];
    const dataUrl = getItemPreviewDataUrl(itemId, size, options.variantLevel ?? null);
    return dataUrl
      ? createImage(dataUrl, definition?.name ?? itemId, size)
      : createFallbackIcon(definition?.icon ?? "?", Math.max(20, Math.round(size * 0.6)));
  }

  function createEntryVisual(entry, options = {}) {
    if (!ctx.isNftEntry(entry)) {
      const itemId = ctx.getSlotItemId(entry);
      return createItemVisual(itemId, {
        ...options,
        variantLevel: itemId === "pickaxe" && Number.isFinite(entry?.pickaxeLevel)
          ? entry.pickaxeLevel
          : options.variantLevel ?? null,
      });
    }
    const size = options.size ?? 40;
    const cacheKey = `nft:${entry.contractAddress}:${entry.tokenId}:${size}`;
    const dataUrl = entry.contractAddress === "0xMockHelmetCollection" && String(entry.tokenId) === "1"
      ? getRenderedModelPreviewDataUrl(cacheKey, () => ctx.buildSafetyHelmetModel("gold"), size)
      : null;
    return dataUrl
      ? createImage(dataUrl, ctx.getEntryName(entry), size)
      : createFallbackIcon(ctx.getEntryIcon(entry), Math.max(20, Math.round(size * 0.6)));
  }

  function createForgeUpgradeVisual(itemId, level, size = 54) {
    if (itemId !== "pickaxe") return createItemVisual(itemId, { size });
    const dataUrl = getRenderedModelPreviewDataUrl(`forge:${itemId}:lv${level}:${size}`, () => ctx.buildPickaxeModel(level), size);
    return createImage(dataUrl, ctx.itemDefs[itemId]?.name ?? itemId, size);
  }

  return { disposeObject, createItemVisual, createEntryVisual, createForgeUpgradeVisual };
}

export function getInventoryPreviewVariant(itemId, variantLevel, fallbackLevel = 0) {
  return itemId === "pickaxe" ? `lv${Number.isFinite(variantLevel) ? variantLevel : fallbackLevel}` : "base";
}
