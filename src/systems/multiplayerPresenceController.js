export function createMultiplayerPresenceController({
  client,
  getEnabled,
  getIdentity,
  getDisplayName,
  getPlayerState,
  onSnapshot,
  onInactive,
  now = () => performance.now(),
  intervalMs = 200,
}) {
  let lastSyncAt = -Infinity;
  let syncInFlight = false;
  let pendingCommand = null;
  let activeIdentity = "";
  let lastPosition = null;

  function queueCommand(type, checkpointId = "") {
    if (!getEnabled()) return false;
    pendingCommand = { type, checkpointId: String(checkpointId ?? "").slice(0, 64) };
    return true;
  }

  function buildPlayerState() {
    const current = getPlayerState();
    const moving = lastPosition
      ? Math.hypot(current.x - lastPosition.x, current.z - lastPosition.z) > 0.015
      : false;
    lastPosition = { x: current.x, z: current.z };
    return { ...current, moving };
  }

  async function leave(identity = activeIdentity) {
    if (!identity) return;
    activeIdentity = "";
    pendingCommand = null;
    lastPosition = null;
    await client.leave({ clientId: identity, displayName: getDisplayName() });
  }

  function update() {
    const enabled = getEnabled();
    const identity = enabled ? getIdentity() : "";
    if (!identity) {
      if (activeIdentity) void leave(activeIdentity);
      onInactive?.();
      return;
    }
    if (activeIdentity && activeIdentity !== identity) void leave(activeIdentity);
    activeIdentity = identity;
    const time = now();
    if (syncInFlight || time - lastSyncAt < intervalMs) return;
    lastSyncAt = time;
    syncInFlight = true;
    const command = pendingCommand;
    void client.sync({
      clientId: identity,
      displayName: getDisplayName(),
      player: buildPlayerState(),
      command,
    }).then((result) => {
      if (result.ok) {
        if (command === pendingCommand) pendingCommand = null;
        onSnapshot?.(result);
      }
    }).finally(() => { syncInFlight = false; });
  }

  return {
    update,
    leave,
    gather: (resourceId, requestId) => {
      if (!getEnabled()) return Promise.resolve({ ok: false, error: "채집 서버에 연결되어 있지 않습니다." });
      return client.gather({
        clientId: getIdentity(),
        displayName: getDisplayName(),
        resourceId,
        requestId,
      });
    },
    requestTour: (checkpointId) => queueCommand("tour.request", checkpointId),
    advanceTour: () => queueCommand("tour.advance"),
    cancelTour: () => queueCommand("tour.cancel"),
  };
}
