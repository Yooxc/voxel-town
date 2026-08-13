export async function hydratePlayerSaveRuntime({
  isServerBackedSession,
  setStatus,
  apiFetchJson,
  getAuthHeaders,
  blockBaseline,
  serializeSave,
  setKnownUpdatedAt,
  setSnapshot,
  markBaselineReady,
  applySave,
  setWalletLoginStatus,
}) {
  if (!isServerBackedSession()) return false;

  setStatus("loading", "saving", { persist: true });
  const response = await apiFetchJson("/auth/save", {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    blockBaseline(response.error);
    return false;
  }

  const saveEntry = response.data.save ?? null;
  const save = saveEntry?.data ?? null;
  if (!save) {
    setKnownUpdatedAt("");
    setSnapshot(JSON.stringify(serializeSave()));
    markBaselineReady("fresh");
    setStatus("fresh", "success");
    return false;
  }

  applySave(save);
  setKnownUpdatedAt(saveEntry.updatedAt ?? "");
  markBaselineReady("hydrated");
  setWalletLoginStatus("restored");
  setStatus("loaded", "success");
  return true;
}

export async function pushPlayerSaveRuntime({
  isServerBackedSession,
  hasConfirmedBaseline,
  setStatus,
  serializeSave,
  getSnapshot,
  getKnownUpdatedAt,
  apiFetchJson,
  getAuthHeaders,
  applySave,
  setKnownUpdatedAt,
  setSnapshot,
  setWalletLoginStatus,
}) {
  if (!isServerBackedSession()) return false;
  if (!hasConfirmedBaseline()) {
    setStatus("baseline-pending", "error");
    return false;
  }

  const snapshot = JSON.stringify(serializeSave());
  if (snapshot === getSnapshot()) return true;

  setStatus("saving", "saving", { persist: true });
  const response = await apiFetchJson("/auth/save", {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      save: JSON.parse(snapshot),
      knownUpdatedAt: getKnownUpdatedAt(),
    }),
  });
  if (!response.ok) {
    if (response.status === 409 && response.data?.save?.data) {
      applySave(response.data.save.data);
      setKnownUpdatedAt(response.data.save.updatedAt ?? "");
      setWalletLoginStatus("conflict");
      setStatus("conflict", "error");
    } else {
      setStatus("failed", "error");
    }
    return false;
  }

  setSnapshot(snapshot);
  setKnownUpdatedAt(response.data.save?.updatedAt ?? getKnownUpdatedAt());
  setStatus("saved", "success");
  return true;
}

export function createPlayerSaveExitPlan({
  isDevSession,
  isServerBackedSession,
  syncPaused,
  hasConfirmedBaseline,
  snapshot,
  previousSnapshot,
}) {
  if (isDevSession) return { type: "local" };
  if (!isServerBackedSession || syncPaused || !hasConfirmedBaseline || snapshot === previousSnapshot) {
    return { type: "skip" };
  }
  return { type: "remote", snapshot };
}

export function createPlayerSaveSchedulePlan({
  isDevSession,
  isServerBackedSession,
  syncPaused,
  hasConfirmedBaseline,
  force,
  now,
  lastAttemptAt,
  inFlight,
  intervalMs,
}) {
  if (isDevSession) return { type: "local" };
  if (!isServerBackedSession || syncPaused || !hasConfirmedBaseline || inFlight) {
    return { type: "skip" };
  }
  if (!force && now - lastAttemptAt < intervalMs) return { type: "skip" };
  return { type: "sync", attemptedAt: now };
}
