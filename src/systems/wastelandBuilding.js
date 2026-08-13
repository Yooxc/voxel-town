export const WASTELAND_BUILD_PART_DEFS = Object.freeze({
  woodFloor: { itemId: "woodFloor", slot: "floor", label: "목재 바닥", inputItemId: "woodPlank", inputCount: 2 },
  woodWall: { itemId: "woodWall", slot: "wall", label: "목재 벽", inputItemId: "woodPlank", inputCount: 3 },
  woodPillar: { itemId: "woodPillar", slot: "pillar", label: "목재 기둥", inputItemId: "woodPlank", inputCount: 2 },
  stoneFloor: { itemId: "stoneFloor", slot: "floor", label: "석재 바닥", inputItemId: "masonryStone", inputCount: 2 },
  stoneWall: { itemId: "stoneWall", slot: "wall", label: "석재 벽", inputItemId: "masonryStone", inputCount: 3 },
  stonePillar: { itemId: "stonePillar", slot: "pillar", label: "석재 기둥", inputItemId: "masonryStone", inputCount: 2 },
});

const WASTELAND_STRUCTURE_SLOT_LABELS = Object.freeze({
  floor: "바닥",
  wall: "벽",
  pillar: "기둥",
});

export function isWastelandBuildPartItemId(itemId) {
  return Boolean(itemId && WASTELAND_BUILD_PART_DEFS[itemId]);
}

export function getWastelandBuildPartDef(itemId) {
  return WASTELAND_BUILD_PART_DEFS[itemId] ?? null;
}

export function getWastelandStructureSlotLabel(slot) {
  return WASTELAND_STRUCTURE_SLOT_LABELS[slot] ?? "건축";
}

export function getWastelandStructureSurfaceY(cell) {
  const baseY = Number(cell?.baseMesh?.position?.y);
  if (Number.isFinite(baseY)) return Math.max(0.22, baseY + 0.14);
  const coverY = Number(cell?.coverMesh?.position?.y ?? cell?.mesh?.position?.y);
  if (Number.isFinite(coverY)) return Math.max(0.22, coverY + 0.1);
  return 0.22;
}

export function getWastelandStructureRotationQuarter(yaw) {
  const normalizedYaw = ((Number(yaw) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.round(normalizedYaw / (Math.PI * 0.5)) % 4;
}
