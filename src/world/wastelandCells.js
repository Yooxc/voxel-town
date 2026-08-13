export const WASTELAND_DIG_PROGRESS_GAIN = 25;

const WASTELAND_CELL_VISUAL_STOPS = [
  { progress: 0, color: 0xd8d8d8, opacity: 0.78, y: 0.125, scaleY: 1, visible: true },
  { progress: 25, color: 0xa6a6a6, opacity: 0.95, y: 0.104, scaleY: 0.72, visible: true },
  { progress: 50, color: 0x696969, opacity: 1, y: 0.083, scaleY: 0.46, visible: true },
  { progress: 75, color: 0x303030, opacity: 1, y: 0.063, scaleY: 0.22, visible: true },
  { progress: 100, color: 0x181818, opacity: 0, y: 0.052, scaleY: 0.04, visible: false },
];

export function clampWastelandClearProgress(value) {
  return Math.max(0, Math.min(100, Math.floor(Number(value) || 0)));
}

export function getWastelandStateForProgress(progress) {
  if (progress >= 100) return { state: "dug3", digStage: 3 };
  if (progress >= 50) return { state: "dug2", digStage: 2 };
  if (progress > 0) return { state: "dug1", digStage: 1 };
  return { state: "idle", digStage: 0 };
}

export function getFallbackWastelandProgressFromState(cell) {
  if (cell?.state === "dug3") return 100;
  if (cell?.state === "dug2") return 50;
  if (cell?.state === "dug1") return 25;
  return 0;
}

export function getWastelandCellClearProgress(cell) {
  return clampWastelandClearProgress(cell?.clearProgress ?? getFallbackWastelandProgressFromState(cell));
}

export function syncWastelandCellStateFromProgress(cell) {
  if (!cell) return;
  cell.clearProgress = getWastelandCellClearProgress(cell);
  const synced = getWastelandStateForProgress(cell.clearProgress);
  cell.state = synced.state;
  cell.digStage = synced.digStage;
}

function lerpNumber(a, b, t) {
  return a + (b - a) * t;
}

function lerpHexColor(a, b, t) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return (
    (Math.round(lerpNumber(ar, br, t)) << 16) |
    (Math.round(lerpNumber(ag, bg, t)) << 8) |
    Math.round(lerpNumber(ab, bb, t))
  );
}

export function getWastelandCellVisualForProgress(progress) {
  const clamped = clampWastelandClearProgress(progress);
  for (let i = 0; i < WASTELAND_CELL_VISUAL_STOPS.length - 1; i += 1) {
    const from = WASTELAND_CELL_VISUAL_STOPS[i];
    const to = WASTELAND_CELL_VISUAL_STOPS[i + 1];
    if (clamped <= to.progress) {
      const t = (clamped - from.progress) / (to.progress - from.progress || 1);
      return {
        color: lerpHexColor(from.color, to.color, t),
        opacity: lerpNumber(from.opacity, to.opacity, t),
        y: lerpNumber(from.y, to.y, t),
        scaleY: lerpNumber(from.scaleY, to.scaleY, t),
        visible: clamped >= 100 ? false : to.visible,
      };
    }
  }
  return WASTELAND_CELL_VISUAL_STOPS[WASTELAND_CELL_VISUAL_STOPS.length - 1];
}

export function applyWastelandCellVisual(cell) {
  const coverMesh = cell?.coverMesh ?? cell?.mesh;
  const baseMesh = cell?.baseMesh;
  if (!coverMesh?.material) return;
  syncWastelandCellStateFromProgress(cell);
  const visual = getWastelandCellVisualForProgress(cell.clearProgress);
  if (baseMesh) baseMesh.visible = true;
  coverMesh.visible = visual.visible;
  coverMesh.position.y = visual.y;
  coverMesh.scale.y = visual.scaleY;
  coverMesh.material.color.set(visual.color);
  coverMesh.material.opacity = visual.opacity;
  coverMesh.material.transparent = visual.opacity < 1;
  coverMesh.material.needsUpdate = true;
}

export function clearWastelandCellHighlight(cell) {
  const coverMesh = cell?.coverMesh ?? cell?.mesh;
  if (!coverMesh?.material) return;
  coverMesh.material.emissive?.set?.(0x000000);
  coverMesh.material.emissiveIntensity = 0;
  applyWastelandCellVisual(cell);
}

export function applyWastelandCellHighlight(cell) {
  const coverMesh = cell?.coverMesh ?? cell?.mesh;
  if (!coverMesh?.material) return;
  applyWastelandCellVisual(cell);
  if (!coverMesh.visible) return;
  coverMesh.material.emissive?.set?.(0xffb13d);
  coverMesh.material.emissiveIntensity = 0.28;
}
