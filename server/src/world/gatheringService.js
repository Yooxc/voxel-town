const REQUEST_CACHE_MS = 60_000;
const POSITION_ATTEMPTS = 120;

function randomBetween(min, max, random) {
  return min + (max - min) * random();
}

function distance2d(left, right) {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function isBlocked(position, obstacles, padding = 0.7) {
  return obstacles.some((obstacle) => {
    if (obstacle.type === "circle") {
      return Math.hypot(position.x - obstacle.x, position.z - obstacle.z) <= obstacle.radius + padding;
    }
    return Math.abs(position.x - obstacle.x) <= obstacle.halfWidth + padding
      && Math.abs(position.z - obstacle.z) <= obstacle.halfDepth + padding;
  });
}

function createSnapshot(resource) {
  return {
    id: resource.id,
    kind: resource.kind,
    itemId: resource.itemId,
    x: resource.position.x,
    y: resource.position.y,
    z: resource.position.z,
  };
}

export function createGatheringService({
  config,
  obstacles = [],
  heightAt = (_x, _z, fallback = 0) => fallback,
  now = () => Date.now(),
  random = Math.random,
} = {}) {
  const resources = new Map();
  const requestResults = new Map();
  let revision = 1;

  function findPosition(excludedId = "") {
    const active = [...resources.values()].filter((entry) => entry.active && entry.id !== excludedId);
    for (let attempt = 0; attempt < POSITION_ATTEMPTS; attempt += 1) {
      const zone = config.zones[Math.min(config.zones.length - 1, Math.floor(random() * config.zones.length))];
      const position = {
        x: randomBetween(zone.minX, zone.maxX, random),
        z: randomBetween(zone.minZ, zone.maxZ, random),
      };
      if (isBlocked(position, obstacles)) continue;
      if (active.some((entry) => distance2d(position, entry.position) < config.minSpacing)) continue;
      return { ...position, y: heightAt(position.x, position.z, 0) };
    }
    return null;
  }

  function spawn(resource) {
    const position = findPosition(resource.id);
    if (!position) return false;
    resource.position = position;
    resource.active = true;
    resource.respawnAt = 0;
    revision += 1;
    return true;
  }

  for (const type of config.types) {
    for (let index = 0; index < type.count; index += 1) {
      const resource = {
        id: `${type.kind}-${index + 1}`,
        kind: type.kind,
        itemId: type.itemId,
        active: false,
        position: { x: 0, y: 0, z: 0 },
        respawnAt: 0,
        respawnMinMs: type.respawnMinMs,
        respawnMaxMs: type.respawnMaxMs,
      };
      resources.set(resource.id, resource);
      spawn(resource);
    }
  }

  function pruneRequestResults(time) {
    for (const [key, entry] of requestResults) {
      if (time - entry.createdAt > REQUEST_CACHE_MS) requestResults.delete(key);
    }
  }

  function update(time = now()) {
    pruneRequestResults(time);
    for (const resource of resources.values()) {
      if (!resource.active && resource.respawnAt > 0 && resource.respawnAt <= time) spawn(resource);
    }
  }

  function getSnapshot(time = now()) {
    update(time);
    return {
      revision,
      plants: [...resources.values()].filter((entry) => entry.active).map(createSnapshot),
    };
  }

  function gather({ identity, resourceId, requestId, player, time = now() }) {
    update(time);
    const safeRequestId = String(requestId ?? "").slice(0, 96);
    const cacheKey = `${identity}:${safeRequestId}`;
    if (safeRequestId && requestResults.has(cacheKey)) return requestResults.get(cacheKey).result;

    const resource = resources.get(String(resourceId ?? ""));
    let result;
    if (!safeRequestId) {
      result = { ok: false, error: "채집 요청 정보가 올바르지 않습니다." };
    } else if (!player || player.mapId !== config.mapId) {
      result = { ok: false, error: "이곳에서는 해당 식물을 채집할 수 없습니다." };
    } else if (!resource?.active) {
      result = { ok: false, error: "이미 다른 사람이 채집한 식물입니다." };
    } else if (distance2d(player, resource.position) > config.interactionRadius + 0.35) {
      result = { ok: false, error: "식물에서 너무 멀리 떨어져 있습니다." };
    } else {
      resource.active = false;
      resource.respawnAt = time + randomBetween(resource.respawnMinMs, resource.respawnMaxMs, random);
      revision += 1;
      result = {
        ok: true,
        requestId: safeRequestId,
        resourceId: resource.id,
        itemId: resource.itemId,
        count: 1,
        gathering: getSnapshot(time),
      };
    }
    requestResults.set(cacheKey, { createdAt: time, result });
    return result;
  }

  return {
    gather,
    getSnapshot,
    getResources: () => [...resources.values()].map((entry) => ({ ...entry, position: { ...entry.position } })),
    update,
  };
}
