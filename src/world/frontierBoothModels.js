import * as THREE from "three";

export function buildFrontierBuildingSign(text) {
  const wrap = new THREE.Group();
  const signWidth = 4.5;
  const signHeight = 0.95;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(signWidth, signHeight, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x3a2b1f, roughness: 0.9 })
  );
  wrap.add(board);

  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = 1280;
  faceCanvas.height = 320;
  const faceCtx = faceCanvas.getContext("2d");
  faceCtx.fillStyle = "#f4dfa4";
  faceCtx.fillRect(0, 0, faceCanvas.width, faceCanvas.height);
  faceCtx.fillStyle = "#3b2a1e";
  faceCtx.fillRect(14, 14, faceCanvas.width - 28, faceCanvas.height - 28);
  faceCtx.fillStyle = "#f8e6b8";
  faceCtx.fillRect(24, 24, faceCanvas.width - 48, faceCanvas.height - 48);
  const safeText = String(text || "P6").trim() || "P6";
  let fontSize = 168;
  do {
    faceCtx.font = `900 ${fontSize}px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif`;
    if (faceCtx.measureText(safeText).width <= 980 || fontSize <= 60) break;
    fontSize -= 4;
  } while (fontSize > 60);
  faceCtx.fillStyle = "#2c1b0f";
  faceCtx.textAlign = "center";
  faceCtx.textBaseline = "middle";
  faceCtx.fillText(safeText, faceCanvas.width * 0.5, faceCanvas.height * 0.52);

  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(signWidth - 0.32, signHeight - 0.18),
    new THREE.MeshBasicMaterial({ map: faceTex, transparent: false })
  );
  signFace.position.z = 0.078;
  wrap.add(signFace);
  return wrap;
}

export function buildFrontierBoothLabel(titleText, statusText) {
  const wrap = new THREE.Group();
  const width = 1.9;
  const height = 0.68;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x4f3b2d, roughness: 0.88 })
  );
  wrap.add(board);

  const canvas = document.createElement("canvas");
  canvas.width = 820;
  canvas.height = 280;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4ead0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#473528";
  ctx.fillRect(12, 12, canvas.width - 24, canvas.height - 24);
  ctx.fillStyle = "#fbf1d7";
  ctx.fillRect(22, 22, canvas.width - 44, canvas.height - 44);
  const safeTitle = String(titleText || "").trim() || "부스";
  const safeStatus = String(statusText || "").trim() || "비어 있음";
  ctx.fillStyle = "#2b1d14";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 84px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif";
  ctx.fillText(safeTitle, canvas.width * 0.5, 108);
  let statusFont = 56;
  do {
    ctx.font = `800 ${statusFont}px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif`;
    if (ctx.measureText(safeStatus).width <= 650 || statusFont <= 32) break;
    statusFont -= 2;
  } while (statusFont > 32);
  ctx.fillStyle = "#7a6550";
  ctx.fillText(safeStatus, canvas.width * 0.5, 198);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.16, height - 0.14),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  face.position.z = 0.046;
  wrap.add(face);
  return wrap;
}

function normalizeModel(model, targetSize) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  model.scale.multiplyScalar(targetSize / maxDim);
  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = scaledBox.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.position.y -= scaledBox.min.y;
}

function createIconPlane(icon, size, { canvasSize = 300, inset = 28, fontSize = 140, textY = 0.48 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(246, 235, 210, 0.96)";
  ctx.beginPath();
  ctx.roundRect(inset, inset, canvasSize - inset * 2, canvasSize - inset * 2, inset);
  ctx.fill();
  ctx.fillStyle = "#5a4637";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fontSize}px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif`;
  ctx.fillText(icon ?? "?", canvas.width * 0.5, canvas.height * textY);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
}

function createTextTag(text, {
  width, height, canvasWidth, canvasHeight, fontSize, minFontSize, maxTextWidth, y,
  insetX = 24, insetY = 16, textY = 0.55,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(48,36,28,0.88)";
  ctx.beginPath();
  ctx.roundRect(insetX, insetY, canvas.width - insetX * 2, canvas.height - insetY * 2, 24);
  ctx.fill();
  ctx.fillStyle = "#fbf1d7";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let resolvedFontSize = fontSize;
  do {
    ctx.font = `800 ${resolvedFontSize}px Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxTextWidth || resolvedFontSize <= minFontSize) break;
    resolvedFontSize -= 2;
  } while (resolvedFontSize > minFontSize);
  ctx.fillText(text, canvas.width * 0.5, canvas.height * textY);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const tag = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  tag.position.set(0, y, 0.02);
  return tag;
}

export function buildFrontierBoothProductVisual(itemId, quantity = 0, { itemDefs }) {
  const wrap = new THREE.Group();
  if (!itemId || !itemDefs[itemId]) return wrap;
  const def = itemDefs[itemId];
  if (typeof def.makeInventoryModel === "function") {
    const model = def.makeInventoryModel();
    normalizeModel(model, 0.72);
    wrap.add(model);
  } else {
    wrap.add(createIconPlane(def.icon, 0.88));
  }
  wrap.add(createTextTag(`x${quantity}`, {
    width: 0.72, height: 0.24, canvasWidth: 360, canvasHeight: 120,
    fontSize: 58, minFontSize: 58, maxTextWidth: Infinity, y: 0.68,
    insetX: 60, textY: 0.52,
  }));
  return wrap;
}

export function buildFrontierDisplayBoothVisual(entry, {
  itemDefs,
  normalizeInventorySlotEntry,
  isNftInventoryEntry,
  getSlotItemId,
  getInventoryEntryDisplayIcon,
  getInventoryEntryDisplayName,
}) {
  const wrap = new THREE.Group();
  const normalizedEntry = normalizeInventorySlotEntry(entry);
  if (!normalizedEntry) return wrap;
  if (!isNftInventoryEntry(normalizedEntry)) {
    const def = itemDefs[getSlotItemId(normalizedEntry)];
    if (def && typeof def.makeInventoryModel === "function") {
      const model = def.makeInventoryModel();
      normalizeModel(model, 0.64);
      wrap.add(model);
    }
  }
  const plane = createIconPlane(getInventoryEntryDisplayIcon(normalizedEntry), 0.86, {
    canvasSize: 360, inset: 30, fontSize: 144, textY: 0.46,
  });
  plane.position.y = wrap.children.length === 0 ? 0.12 : 0.74;
  if (wrap.children.length > 0) plane.scale.setScalar(0.52);
  wrap.add(plane);
  wrap.add(createTextTag(getInventoryEntryDisplayName(normalizedEntry), {
    width: 1.02, height: 0.22, canvasWidth: 560, canvasHeight: 120,
    fontSize: 44, minFontSize: 24, maxTextWidth: 460, y: 0.88,
  }));
  return wrap;
}
