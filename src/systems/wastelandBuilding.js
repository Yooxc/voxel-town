export const WASTELAND_STORY_HEIGHT = 3.2;
export const WASTELAND_WALL_THICKNESS = 0.18;
export const WASTELAND_DOOR_OPENING_HEIGHT = 2.7;
export const WASTELAND_DOOR_HEADER_HEIGHT = WASTELAND_STORY_HEIGHT - WASTELAND_DOOR_OPENING_HEIGHT;
export const WASTELAND_WINDOW_SILL_HEIGHT = 1.15;
export const WASTELAND_WINDOW_OPENING_HEIGHT = 1.35;
export const WASTELAND_WINDOW_HEADER_HEIGHT = WASTELAND_STORY_HEIGHT
  - WASTELAND_WINDOW_SILL_HEIGHT
  - WASTELAND_WINDOW_OPENING_HEIGHT;
export const WASTELAND_MAX_BUILD_LEVEL = 1;
export const WASTELAND_ROOF_MAX_SPAN = 2;

export function normalizeWastelandBuildLevel(level = 0) {
  const value = Number(level);
  return Number.isInteger(value) && value >= 0 && value <= WASTELAND_MAX_BUILD_LEVEL ? value : null;
}

export function getWastelandStructureLevelOffset(level = 0) {
  return (normalizeWastelandBuildLevel(level) ?? 0) * WASTELAND_STORY_HEIGHT;
}

export const WASTELAND_BUILD_PART_DEFS = Object.freeze({
  woodFloor: { itemId: "woodFloor", slot: "floor", label: "목재 바닥", inputItemId: "woodPlank", inputCount: 2, walkable: true },
  woodWall: { itemId: "woodWall", slot: "wall", label: "목재 벽", inputItemId: "woodPlank", inputCount: 3, blocksMovement: true },
  woodDoor: { itemId: "woodDoor", slot: "wall", structureKind: "door", label: "목재 문", inputItemId: "woodPlank", inputCount: 4, blocksMovement: true },
  woodWindow: { itemId: "woodWindow", slot: "wall", structureKind: "window", label: "목재 창문", inputItemId: "woodPlank", inputCount: 3, blocksMovement: true },
  woodStairs: { itemId: "woodStairs", slot: "stairs", structureKind: "stairs", label: "목재 계단", inputItemId: "woodPlank", inputCount: 8, walkable: true },
  woodRoof: { itemId: "woodRoof", slot: "roof", structureKind: "roof", label: "목재 지붕", inputItemId: "woodPlank", inputCount: 5 },
  woodPillar: { itemId: "woodPillar", slot: "pillar", label: "목재 기둥", inputItemId: "woodPlank", inputCount: 2, manualPlacement: false },
  stoneFloor: { itemId: "stoneFloor", slot: "floor", label: "석재 바닥", inputItemId: "masonryStone", inputCount: 2, walkable: true },
  stoneWall: { itemId: "stoneWall", slot: "wall", label: "석재 벽", inputItemId: "masonryStone", inputCount: 3, blocksMovement: true },
  stoneDoor: { itemId: "stoneDoor", slot: "wall", structureKind: "door", label: "석재 문", inputItemId: "masonryStone", inputCount: 4, blocksMovement: true },
  stoneWindow: { itemId: "stoneWindow", slot: "wall", structureKind: "window", label: "석재 창문", inputItemId: "masonryStone", inputCount: 3, blocksMovement: true },
  stoneStairs: { itemId: "stoneStairs", slot: "stairs", structureKind: "stairs", label: "석재 계단", inputItemId: "masonryStone", inputCount: 8, walkable: true },
  stoneRoof: { itemId: "stoneRoof", slot: "roof", structureKind: "roof", label: "석재 지붕", inputItemId: "masonryStone", inputCount: 5 },
  stonePillar: { itemId: "stonePillar", slot: "pillar", label: "석재 기둥", inputItemId: "masonryStone", inputCount: 2, manualPlacement: false },
});

const WASTELAND_STRUCTURE_SLOT_LABELS = Object.freeze({
  floor: "바닥",
  wall: "벽",
  stairs: "계단",
  roof: "지붕",
  pillar: "기둥",
});

export function isWastelandBuildPartItemId(itemId) {
  return Boolean(itemId && WASTELAND_BUILD_PART_DEFS[itemId]);
}

export function getWastelandBuildPartDef(itemId) {
  return WASTELAND_BUILD_PART_DEFS[itemId] ?? null;
}

export function getWastelandBuildPalettePartDefs() {
  return Object.values(WASTELAND_BUILD_PART_DEFS).filter((part) => part.manualPlacement !== false);
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

export function getWastelandWallEdge(rotationQuarter = 0) {
  const edges = ["north", "east", "south", "west"];
  const normalizedRotation = ((Math.round(Number(rotationQuarter) || 0) % edges.length) + edges.length) % edges.length;
  return edges[normalizedRotation] ?? "north";
}

export function getWastelandWallEdgeKey(cell, rotationQuarter = 0) {
  if (!cell || !Number.isFinite(Number(cell.row)) || !Number.isFinite(Number(cell.col))) return "";
  const row = Number(cell.row);
  const col = Number(cell.col);
  switch (getWastelandWallEdge(rotationQuarter)) {
    case "east": return `wall:v:${row}:${col + 1}`;
    case "south": return `wall:h:${row + 1}:${col}`;
    case "west": return `wall:v:${row}:${col}`;
    default: return `wall:h:${row}:${col}`;
  }
}

export function getWastelandStructurePlacementKey({ cell, slot, rotationQuarter = 0, level = 0 }) {
  if (!cell || !slot) return "";
  const normalizedLevel = normalizeWastelandBuildLevel(level) ?? 0;
  const legacyKey = slot === "wall"
    ? getWastelandWallEdgeKey(cell, rotationQuarter)
    : slot === "stairs"
      ? `stairs:${Number(cell.row)}:${Number(cell.col)}:${((Math.round(Number(rotationQuarter) || 0) % 4) + 4) % 4}`
    : `${slot}:${Number(cell.row)}:${Number(cell.col)}`;
  return normalizedLevel === 0 ? legacyKey : legacyKey.replace(`${slot}:`, `${slot}:${normalizedLevel}:`);
}

export function getWastelandStructureFootprintCells(cell, slot, rotationQuarter = 0) {
  if (!cell) return [];
  if (slot !== "stairs") return [{ row: Number(cell.row), col: Number(cell.col) }];
  const delta = getWastelandStairDirectionDelta(rotationQuarter);
  return [
    { row: Number(cell.row), col: Number(cell.col) },
    { row: Number(cell.row) + delta.row, col: Number(cell.col) + delta.col },
  ];
}

function getWastelandStairDirectionDelta(rotationQuarter = 0) {
  const direction = ((Math.round(Number(rotationQuarter) || 0) % 4) + 4) % 4;
  return direction === 1 ? { row: 0, col: 1 }
    : direction === 2 ? { row: 1, col: 0 }
      : direction === 3 ? { row: 0, col: -1 }
        : { row: -1, col: 0 };
}

export function getWastelandStairLandingCell(cell, rotationQuarter = 0) {
  if (!cell) return null;
  const delta = getWastelandStairDirectionDelta(rotationQuarter);
  return {
    row: Number(cell.row) + delta.row * 2,
    col: Number(cell.col) + delta.col * 2,
  };
}

export function getWastelandStairVisualRotation(rotationQuarter = 0) {
  const direction = ((Math.round(Number(rotationQuarter) || 0) % 4) + 4) % 4;
  return direction === 0 ? 0 : -direction * Math.PI * 0.5;
}

function isStructureInsideFoundation(structure, foundation) {
  const bounds = foundation?.bounds;
  return Boolean(
    bounds
    && Number(structure.row) >= Number(bounds.minRow)
    && Number(structure.row) <= Number(bounds.maxRow)
    && Number(structure.col) >= Number(bounds.minCol)
    && Number(structure.col) <= Number(bounds.maxCol)
  );
}

function getStructureFoundation(structure, foundations) {
  return (foundations ?? []).find((foundation) => (
    foundation?.status === "completed"
    && foundation?.ownerId === structure.ownerId
    && (!structure.landId || String(foundation.landId ?? "") === structure.landId)
    && isStructureInsideFoundation(structure, foundation)
  )) ?? null;
}

function normalizeWastelandStructureRecord(rawStructure) {
  const part = getWastelandBuildPartDef(rawStructure?.type);
  const row = Number(rawStructure?.row);
  const col = Number(rawStructure?.col);
  const level = normalizeWastelandBuildLevel(rawStructure?.level ?? 0);
  const key = typeof rawStructure?.key === "string" ? rawStructure.key.trim() : "";
  const ownerId = typeof rawStructure?.ownerId === "string" ? rawStructure.ownerId.trim() : "";
  if (!part || !key || !ownerId || !Number.isInteger(row) || !Number.isInteger(col) || level === null) return null;

  const rotationQuarter = part.slot === "wall" || part.slot === "stairs"
    ? ((Math.round(Number(rawStructure.rotationQuarter) || 0) % 4) + 4) % 4
    : 0;
  const normalized = {
    ...rawStructure,
    key,
    ownerId,
    landId: typeof rawStructure.landId === "string" ? rawStructure.landId : "",
    type: part.itemId,
    slot: part.slot,
    structureKind: part.structureKind ?? part.slot,
    row,
    col,
    level,
    rotationQuarter,
    edge: part.slot === "wall" ? getWastelandWallEdge(rotationQuarter) : "",
    placementKey: getWastelandStructurePlacementKey({
      cell: { row, col },
      slot: part.slot,
      rotationQuarter,
      level,
    }),
    cellSize: Math.max(0, Number(rawStructure.cellSize) || 0),
  };
  if (part.slot === "stairs") {
    normalized.footprintCells = getWastelandStructureFootprintCells(normalized, part.slot, rotationQuarter);
  } else {
    delete normalized.footprintCells;
  }
  if (part.structureKind === "door") normalized.isOpen = Boolean(rawStructure.isOpen);
  else delete normalized.isOpen;
  if (!Number.isFinite(Number(rawStructure.createdAt))) delete normalized.createdAt;
  return normalized;
}

export function normalizeWastelandStructureCollection({ structures = [], foundations = [] } = {}) {
  const dropped = [];
  const seenKeys = new Set();
  const seenPlacementKeys = new Set();
  const candidates = [];

  for (const rawStructure of Array.isArray(structures) ? structures : []) {
    const structure = normalizeWastelandStructureRecord(rawStructure);
    if (!structure) {
      dropped.push({ key: rawStructure?.key ?? "", reason: "invalid-record" });
      continue;
    }
    if (seenKeys.has(structure.key)) {
      dropped.push({ key: structure.key, reason: "duplicate-key" });
      continue;
    }
    if (seenPlacementKeys.has(structure.placementKey)) {
      dropped.push({ key: structure.key, reason: "duplicate-placement" });
      continue;
    }
    const foundation = getStructureFoundation(structure, foundations);
    if (!foundation) {
      dropped.push({ key: structure.key, reason: "foundation-required" });
      continue;
    }
    const stairCells = structure.slot === "stairs"
      ? [...structure.footprintCells, getWastelandStairLandingCell(structure, structure.rotationQuarter)]
      : [];
    if (stairCells.some((cell) => !isStructureInsideFoundation(cell, foundation))) {
      dropped.push({ key: structure.key, reason: "stairs-outside-foundation" });
      continue;
    }
    structure.landId = String(foundation.landId ?? structure.landId ?? "");
    seenKeys.add(structure.key);
    seenPlacementKeys.add(structure.placementKey);
    candidates.push(structure);
  }

  let validated = candidates;
  let removed = true;
  while (removed) {
    removed = false;
    const next = validated.filter((structure) => {
      const dependencyError = getWastelandStructureDependencyError({
        structures: validated,
        row: structure.row,
        col: structure.col,
        itemId: structure.type,
        level: structure.level,
        rotationQuarter: structure.rotationQuarter,
      });
      if (!dependencyError) return true;
      dropped.push({ key: structure.key, reason: "dependency-invalid" });
      removed = true;
      return false;
    });
    validated = next;
  }

  return { structures: validated, dropped };
}

function hasStructureAtCell(structures, row, col, level, slot = "") {
  return (structures ?? []).some((structure) => (
    Number(structure?.row) === row
    && Number(structure?.col) === col
    && (normalizeWastelandBuildLevel(structure?.level) ?? 0) === level
    && (!slot || structure?.slot === slot)
  ));
}

function getStructureLevel(structure) {
  return normalizeWastelandBuildLevel(structure?.level) ?? 0;
}

function isSameCell(structure, row, col) {
  return Number(structure?.row) === Number(row) && Number(structure?.col) === Number(col);
}

function isStairLandingOnCell(structure, row, col) {
  if (structure?.slot !== "stairs") return false;
  const landing = getWastelandStairLandingCell(structure, structure?.rotationQuarter);
  return Number(landing?.row) === Number(row) && Number(landing?.col) === Number(col);
}

function getRoofSupportDistance(structures, row, col, level) {
  const roofCells = new Set(
    (structures ?? [])
      .filter((structure) => structure?.slot === "roof" && getStructureLevel(structure) === level)
      .map((structure) => `${structure.row}:${structure.col}`),
  );
  roofCells.add(`${row}:${col}`);
  const queue = [{ row: Number(row), col: Number(col), distance: 0 }];
  const visited = new Set();
  while (queue.length) {
    const current = queue.shift();
    const key = `${current.row}:${current.col}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (hasStructureAtCell(structures, current.row, current.col, level, "wall")) return current.distance;
    if (current.distance >= WASTELAND_ROOF_MAX_SPAN) continue;
    for (const offset of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nextRow = current.row + offset[0];
      const nextCol = current.col + offset[1];
      if (roofCells.has(`${nextRow}:${nextCol}`)) {
        queue.push({ row: nextRow, col: nextCol, distance: current.distance + 1 });
      }
    }
  }
  return null;
}

function hasFootprintConflict(structures, footprint, level) {
  return footprint.some((cell) => (structures ?? []).some((structure) => (
    Number(structure?.row) === cell.row
    && Number(structure?.col) === cell.col
    && (normalizeWastelandBuildLevel(structure?.level) ?? 0) === level
    && structure?.slot === "stairs"
  )));
}

function getStairClearanceError(structures, row, col, rotationQuarter) {
  const footprint = getWastelandStructureFootprintCells({ row, col }, "stairs", rotationQuarter);
  const [start, upper] = footprint;
  const direction = ((Math.round(Number(rotationQuarter) || 0) % 4) + 4) % 4;
  const entryDirection = (direction + 2) % 4;

  if (footprint.some((cell) => hasStructureAtCell(structures, cell.row, cell.col, 0, "roof"))) {
    return "계단 위 천장 공간이 부족합니다.";
  }
  if (hasWallOnEdge(structures, start.row, start.col, 0, entryDirection)) {
    return "계단 입구가 벽으로 막혀 있습니다.";
  }
  if (
    hasWallOnEdge(structures, start.row, start.col, 0, direction)
    || hasWallOnEdge(structures, start.row, start.col, 1, direction)
  ) {
    return "계단 진행 경로가 벽으로 막혀 있습니다.";
  }
  if (hasWallOnEdge(structures, upper.row, upper.col, 1, direction)) {
    return "계단 2층 출구가 벽으로 막혀 있습니다.";
  }
  return "";
}

export function getWastelandStructureDependencyError({ structures = [], row, col, itemId, level = 0, rotationQuarter = 0 }) {
  const normalizedLevel = normalizeWastelandBuildLevel(level);
  const part = getWastelandBuildPartDef(itemId);
  if (normalizedLevel === null || !part) return "지원하지 않는 건축 층입니다.";
  if (part.slot === "roof") {
    if (!hasStructureAtCell(structures, row, col, normalizedLevel, "floor")) {
      return `${normalizedLevel + 1}층 지붕은 같은 셀의 바닥 위에만 설치할 수 있습니다.`;
    }
    if (normalizedLevel === 0 && hasStructureAtCell(structures, row, col, 1, "floor")) {
      return "2층 바닥이 있는 셀에는 1층 지붕을 설치할 수 없습니다.";
    }
    if (getRoofSupportDistance(structures, row, col, normalizedLevel) === null) {
      return `지붕은 벽에서 ${WASTELAND_ROOF_MAX_SPAN}셀 이내로 연결되어야 합니다.`;
    }
    return "";
  }
  if (part.slot === "stairs") {
    if (normalizedLevel !== 0) return "계단은 1층에서만 설치할 수 있습니다.";
    const footprint = getWastelandStructureFootprintCells({ row, col }, part.slot, rotationQuarter);
    const upper = footprint[1];
    const landing = getWastelandStairLandingCell({ row, col }, rotationQuarter);
    if (!hasStructureAtCell(structures, row, col, 0, "floor")) return "계단 시작점에 1층 바닥이 필요합니다.";
    if (hasStructureAtCell(structures, row, col, 1, "floor")) return "계단 시작점 위의 2층 바닥을 먼저 철거해야 합니다.";
    if (hasStructureAtCell(structures, upper.row, upper.col, 1, "floor")) return "계단 상부를 덮는 2층 바닥을 먼저 철거해야 합니다.";
    if (!hasStructureAtCell(structures, landing.row, landing.col, 1, "floor")) return "계단 도착점에 2층 바닥이 필요합니다.";
    const clearanceError = getStairClearanceError(structures, row, col, rotationQuarter);
    if (clearanceError) return clearanceError;
    return "";
  }
  if (normalizedLevel === 0) {
    if (part.slot !== "floor" && !hasStructureAtCell(structures, row, col, 0, "floor")) {
      return "1층 벽과 개구부는 먼저 1층 바닥을 설치해야 합니다.";
    }
    return "";
  }
  if (part.slot === "floor" && !hasStructureAtCell(structures, row, col, 0, "floor")) {
    return "2층 바닥은 같은 셀의 1층 바닥 위에만 설치할 수 있습니다.";
  }
  if (part.slot !== "floor" && !hasStructureAtCell(structures, row, col, normalizedLevel, "floor")) {
    return "2층 벽과 개구부는 먼저 2층 바닥을 설치해야 합니다.";
  }
  return "";
}

export function getWastelandStructureRemovalDependencyError({ structures = [], structureKey }) {
  const structure = (structures ?? []).find((entry) => entry?.key === structureKey);
  if (!structure) return "";
  if (structure.slot === "floor") {
    const level = getStructureLevel(structure);
    const dependent = (structures ?? []).find((candidate) => {
      if (!candidate || candidate.key === structureKey) return false;
      if (candidate.slot === "stairs") {
        return level === 0
          ? getStructureLevel(candidate) === 0 && isSameCell(candidate, structure.row, structure.col)
          : level === 1 && getStructureLevel(candidate) === 0 && isStairLandingOnCell(candidate, structure.row, structure.col);
      }
      if (candidate.slot === "floor") {
        return level === 0 && getStructureLevel(candidate) === 1 && isSameCell(candidate, structure.row, structure.col);
      }
      return getStructureLevel(candidate) === level && isSameCell(candidate, structure.row, structure.col);
    });
    if (dependent) return "상부 또는 연결된 건축물을 지지하고 있어 철거할 수 없습니다.";
  }
  const remaining = (structures ?? []).filter((candidate) => candidate?.key !== structureKey);
  const unsupportedRoof = remaining.find((candidate) => candidate?.slot === "roof" && getWastelandStructureDependencyError({
    structures: remaining,
    row: candidate.row,
    col: candidate.col,
    itemId: candidate.type,
    level: candidate.level,
    rotationQuarter: candidate.rotationQuarter,
  }));
  return unsupportedRoof ? "지붕을 지지하고 있어 철거할 수 없습니다." : "";
}

function hasWallOnEdge(structures, row, col, level, rotationQuarter) {
  const expectedKey = getWastelandStructurePlacementKey({
    cell: { row, col },
    slot: "wall",
    rotationQuarter,
    level,
  });
  return (structures ?? []).some((structure) => {
    if (structure?.slot !== "wall" || getStructureLevel(structure) !== level) return false;
    const key = structure.placementKey || getWastelandStructurePlacementKey({
      cell: structure,
      slot: structure.slot,
      rotationQuarter: structure.rotationQuarter,
      level: structure.level,
    });
    return key === expectedKey;
  });
}

export function getWastelandBuildingInspection({ structures = [], ownerId, foundation }) {
  const owned = (structures ?? []).filter((structure) => (
    structure?.ownerId === ownerId
    && (!foundation?.bounds || (
      Number(structure.row) >= Number(foundation.bounds.minRow)
      && Number(structure.row) <= Number(foundation.bounds.maxRow)
      && Number(structure.col) >= Number(foundation.bounds.minCol)
      && Number(structure.col) <= Number(foundation.bounds.maxCol)
    ))
  ));
  const floors = owned.filter((structure) => structure.slot === "floor");
  if (!floors.length) return { ok: false, reason: "바닥을 하나 이상 설치해야 건축물을 점검할 수 있습니다." };
  for (const roof of owned.filter((structure) => structure.slot === "roof")) {
    const error = getWastelandStructureDependencyError({
      structures: owned,
      row: roof.row,
      col: roof.col,
      itemId: roof.type,
      level: roof.level,
      rotationQuarter: roof.rotationQuarter,
    });
    if (error) return { ok: false, reason: error };
  }
  for (const floor of floors) {
    const level = getStructureLevel(floor);
    const hasUpperFloor = hasStructureAtCell(owned, floor.row, floor.col, level + 1, "floor");
    if (!hasUpperFloor && !hasStructureAtCell(owned, floor.row, floor.col, level, "roof")) {
      return { ok: false, reason: `${level + 1}층 바닥 위에 지붕이 필요합니다.` };
    }
    for (let rotationQuarter = 0; rotationQuarter < 4; rotationQuarter += 1) {
      const offset = rotationQuarter === 0 ? { row: -1, col: 0 }
        : rotationQuarter === 1 ? { row: 0, col: 1 }
          : rotationQuarter === 2 ? { row: 1, col: 0 }
            : { row: 0, col: -1 };
      if (hasStructureAtCell(owned, floor.row + offset.row, floor.col + offset.col, level, "floor")) continue;
      if (!hasWallOnEdge(owned, floor.row, floor.col, level, rotationQuarter)) {
        return { ok: false, reason: `${level + 1}층 외벽이 열려 있습니다.` };
      }
    }
  }
  if (!owned.some((structure) => getWastelandBuildPartDef(structure.type)?.structureKind === "door")) {
    return { ok: false, reason: "출입 가능한 문이 하나 이상 필요합니다." };
  }
  if (floors.some((floor) => getStructureLevel(floor) === 1) && !owned.some((structure) => structure.slot === "stairs")) {
    return { ok: false, reason: "2층으로 연결되는 계단이 필요합니다." };
  }
  return { ok: true, reason: "건축물이 완성되었습니다.", floors: floors.length };
}

export function getWastelandWallOffset(cellSize, rotationQuarter = 0) {
  const half = Math.max(0, Number(cellSize) || 0) * 0.5;
  switch (getWastelandWallEdge(rotationQuarter)) {
    case "east": return { x: half, z: 0 };
    case "south": return { x: 0, z: half };
    case "west": return { x: -half, z: 0 };
    default: return { x: 0, z: -half };
  }
}

function getOwnedCompletedFoundation(world, wastelandState, ownerId, action) {
  return [
    ...(world?.foundations ?? []),
    ...(wastelandState?.foundations ?? []),
  ].find((foundation) => (
    foundation?.ownerId === ownerId
    && foundation?.status === "completed"
    && (!action.foundationId || foundation.id === action.foundationId)
    && Number(action.row) >= Number(foundation.bounds?.minRow)
    && Number(action.row) <= Number(foundation.bounds?.maxRow)
    && Number(action.col) >= Number(foundation.bounds?.minCol)
    && Number(action.col) <= Number(foundation.bounds?.maxCol)
  )) ?? null;
}

export function placeWastelandStructureInWorld({
  world,
  ownerId,
  action,
  wastelandState,
  createId = () => Date.now().toString(36),
  now = Date.now,
}) {
  if (!world || !ownerId) return { ok: false, status: 403, error: "건축 소유자를 확인할 수 없습니다." };
  if (!Array.isArray(world.structures)) world.structures = [];
  const part = getWastelandBuildPartDef(action?.itemId);
  const row = Number(action?.row);
  const col = Number(action?.col);
  const level = normalizeWastelandBuildLevel(action?.level ?? 0);
  if (!part || part.manualPlacement === false || !Number.isInteger(row) || !Number.isInteger(col) || level === null) {
    return { ok: false, status: 400, error: "지원하지 않는 건축 부품 또는 위치입니다." };
  }
  const foundation = getOwnedCompletedFoundation(world, wastelandState, ownerId, action);
  if (!foundation) return { ok: false, status: 403, error: "완료된 내 건축 기초 위에서만 설치할 수 있습니다." };
  const rotationQuarter = part.slot === "wall" || part.slot === "stairs"
    ? ((Math.round(Number(action.rotationQuarter) || 0) % 4) + 4) % 4
    : 0;
  const dependencyError = getWastelandStructureDependencyError({
    structures: world.structures,
    row,
    col,
    itemId: part.itemId,
    level,
    rotationQuarter,
  });
  if (dependencyError) return { ok: false, status: 400, error: dependencyError };
  const footprint = getWastelandStructureFootprintCells({ row, col }, part.slot, rotationQuarter);
  const stairCells = part.slot === "stairs"
    ? [...footprint, getWastelandStairLandingCell({ row, col }, rotationQuarter)]
    : footprint;
  if (part.slot === "stairs" && stairCells.some((cell) => (
    cell.row < Number(foundation.bounds?.minRow) || cell.row > Number(foundation.bounds?.maxRow)
    || cell.col < Number(foundation.bounds?.minCol) || cell.col > Number(foundation.bounds?.maxCol)
  ))) return { ok: false, status: 400, error: "계단이 건축 기초 영역을 벗어납니다." };
  if (part.slot === "stairs" && hasFootprintConflict(world.structures, footprint, 0)) {
    return { ok: false, status: 409, error: "계단이 다른 구조물과 겹칩니다." };
  }
  const placementKey = getWastelandStructurePlacementKey({ cell: { row, col }, slot: part.slot, rotationQuarter, level });
  if (world.structures.some((structure) => {
    const existingPlacementKey = structure?.placementKey || getWastelandStructurePlacementKey({
      cell: structure,
      slot: structure?.slot,
      rotationQuarter: structure?.rotationQuarter,
      level: structure?.level,
    });
    return existingPlacementKey === placementKey;
  })) {
    return { ok: false, status: 409, error: "해당 위치에는 이미 건축물이 있습니다." };
  }
  const structure = {
    key: `wasteland_structure_${createId()}`,
    landId: String(foundation.landId ?? action.landId ?? ""),
    ownerId,
    type: part.itemId,
    slot: part.slot,
    structureKind: part.structureKind ?? part.slot,
    row,
    col,
    level,
    ...(part.slot === "stairs" ? { footprintCells: footprint } : {}),
    rotationQuarter,
    edge: part.slot === "wall" ? getWastelandWallEdge(rotationQuarter) : "",
    placementKey,
    cellSize: Math.max(0, Number(action.cellSize) || 0),
    ...(part.structureKind === "door" ? { isOpen: false } : {}),
    createdAt: now(),
  };
  world.structures.push(structure);
  return { ok: true, structure };
}

export function removeWastelandStructureFromWorld({ world, ownerId, action }) {
  if (!world || !ownerId) return { ok: false, status: 403, error: "건축 소유자를 확인할 수 없습니다." };
  if (!Array.isArray(world.structures)) world.structures = [];
  const index = world.structures.findIndex((structure) => structure?.key === action?.structureKey);
  if (index < 0) return { ok: false, status: 409, error: "이미 철거되었거나 존재하지 않는 건축물입니다." };
  const structure = world.structures[index];
  if (structure.ownerId !== ownerId) return { ok: false, status: 403, error: "자신이 설치한 건축물만 철거할 수 있습니다." };
  const dependencyError = getWastelandStructureRemovalDependencyError({
    structures: world.structures,
    structureKey: structure.key,
  });
  if (dependencyError) return { ok: false, status: 409, error: dependencyError };
  world.structures.splice(index, 1);
  return { ok: true, structure };
}

export function toggleWastelandDoorInWorld({ world, ownerId, action }) {
  if (!world || !ownerId) return { ok: false, status: 403, error: "문 소유자를 확인할 수 없습니다." };
  if (!Array.isArray(world.structures)) world.structures = [];
  const structure = world.structures.find((entry) => entry?.key === action?.structureKey);
  if (!structure) return { ok: false, status: 409, error: "존재하지 않는 문입니다." };
  if (structure.ownerId !== ownerId) return { ok: false, status: 403, error: "자신이 설치한 문만 사용할 수 있습니다." };
  const part = getWastelandBuildPartDef(structure.type);
  if (part?.structureKind !== "door") return { ok: false, status: 400, error: "열거나 닫을 수 있는 문이 아닙니다." };
  structure.structureKind = "door";
  structure.isOpen = !Boolean(structure.isOpen);
  return { ok: true, structure };
}

export function getWastelandBuildModeEligibility({
  ownerId,
  claim,
  foundation,
  hasLandDeed,
}) {
  if (!ownerId) return { ok: false, reason: "건축은 지갑 로그인이 필요합니다." };
  if (!claim || claim.ownerId !== ownerId || claim.status !== "completed") {
    return { ok: false, reason: "개간이 완료된 내 구역에서만 건축할 수 있습니다." };
  }
  if (!foundation || foundation.ownerId !== ownerId || foundation.status !== "completed") {
    return { ok: false, reason: "완성된 콘크리트 기초가 필요합니다." };
  }
  if (!hasLandDeed) return { ok: false, reason: "해당 토지권을 보유해야 건축할 수 있습니다." };
  return { ok: true, reason: "" };
}
