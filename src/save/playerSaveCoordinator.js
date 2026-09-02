import {
  createPlayerSaveExitPlan,
  createPlayerSaveSchedulePlan,
  hydratePlayerSaveRuntime,
  pushPlayerSaveRuntime,
} from "./playerSaveSync.js";

const STATUS_MESSAGES = {
  loading: "저장 불러오는 중...",
  fresh: "새로운 저장 데이터",
  loaded: "저장 불러오기 완료",
  "baseline-pending": "세이브 기준선 확인 전이라 저장 대기 중",
  saving: "저장 중...",
  conflict: "다른 창의 최신 저장으로 동기화됨",
  failed: "저장 실패",
  saved: "저장됨",
};

export function createPlayerSaveCoordinator({
  runtime,
  storage,
  authApiBaseUrl,
  intervalMs,
  getSaveKey,
  getFailedLoadKey,
  getAuthToken,
  isDevSession,
  isServerBackedSession,
  serializeSave,
  applySave,
  getActiveProfileId,
  setPlayerCredits,
  setLoginStatus,
  setStatus,
  hideStatus,
  saveSharedWorldState,
  now = () => performance.now(),
  nowIso = () => new Date().toISOString(),
  fetchFn = fetch,
}) {
  let syncInFlight = null;
  let lastAttemptAt = 0;
  let syncPaused = false;
  let statusTimer = null;

  function setSaveStatus(status, tone, options) {
    updateStatus(STATUS_MESSAGES[status] ?? status, tone, options);
  }

  function resetProtectionState() {
    runtime.reset();
  }

  function beginHydration() {
    runtime.beginHydration();
    syncPaused = true;
  }

  function markBaselineReady(mode = "hydrated") {
    runtime.markBaselineReady(mode);
  }

  function blockBaseline(message = "") {
    runtime.blockBaseline();
    if (message) {
      setLoginStatus(message);
      updateStatus("저장 보호 모드", "error", { persist: true });
    }
  }

  function hasConfirmedBaseline() {
    return runtime.hasConfirmedBaseline();
  }

  function setSyncPaused(value) {
    syncPaused = Boolean(value);
  }

  function getSyncPaused() {
    return syncPaused;
  }

  function clearStatusTimer() {
    if (statusTimer) {
      clearTimeout(statusTimer);
      statusTimer = null;
    }
  }

  function scheduleStatusHide(delay = 1400) {
    clearStatusTimer();
    statusTimer = setTimeout(() => {
      hideStatus();
      statusTimer = null;
    }, delay);
  }

  function updateStatus(text, tone = "neutral", { persist = false } = {}) {
    setStatus(text, tone, { persist });
    if (!persist) scheduleStatusHide();
  }

  function saveActiveLocalProfileState() {
    const saveKey = getSaveKey();
    if (!saveKey) return false;
    try {
      const snapshot = serializeSave();
      delete snapshot.frontierBuild;
      if (isDevSession()) {
        delete snapshot.displayBoard;
        if (snapshot.airSystem) delete snapshot.airSystem.mapPurification;
        if (snapshot.inventory) delete snapshot.inventory.abandonedMineUnlocked;
      }
      const serialized = JSON.stringify(snapshot);
      storage.setItem(saveKey, serialized);
      runtime.lastSnapshot = serialized;
      return true;
    } catch {
      return false;
    }
  }

  function loadActiveLocalProfileState() {
    const saveKey = getSaveKey();
    if (!saveKey) return false;
    const failedLoadKey = getFailedLoadKey(getActiveProfileId());
    const raw = storage.getItem(saveKey);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      try {
        applySave(parsed, { preserveSharedWorld: isDevSession() });
      } catch (error) {
        storage.setItem(failedLoadKey, JSON.stringify({
          failedAt: nowIso(), saveKey, raw, reason: String(error?.message ?? error ?? "unknown"),
        }));
        console.error("DEV PROFILE LOAD APPLY FAILED:", error);
        return "apply_error";
      }
      storage.removeItem(failedLoadKey);
      if (isDevSession() && !Number.isFinite(parsed?.economy?.credits)) setPlayerCredits(500);
      return "loaded";
    } catch {
      storage.setItem(failedLoadKey, JSON.stringify({
        failedAt: nowIso(), saveKey, raw, reason: "parse_error",
      }));
      storage.removeItem(saveKey);
      return "parse_error";
    }
  }

  async function hydrateFromServer({ apiFetchJson, getAuthHeaders }) {
    return hydratePlayerSaveRuntime({
      isServerBackedSession,
      setStatus: setSaveStatus,
      apiFetchJson,
      getAuthHeaders,
      blockBaseline: (error) => blockBaseline(`저장 데이터 확인 실패: ${error}`),
      serializeSave,
      setKnownUpdatedAt: (value) => { runtime.lastKnownUpdatedAt = value; },
      setSnapshot: (value) => { runtime.lastSnapshot = value; },
      markBaselineReady,
      applySave,
      setWalletLoginStatus: () => setLoginStatus("이전 플레이 기록을 불러왔습니다."),
    });
  }

  async function pushToServer({ apiFetchJson, getAuthHeaders }) {
    return pushPlayerSaveRuntime({
      isServerBackedSession,
      hasConfirmedBaseline,
      setStatus: setSaveStatus,
      serializeSave,
      getSnapshot: () => runtime.lastSnapshot,
      getKnownUpdatedAt: () => runtime.lastKnownUpdatedAt,
      apiFetchJson,
      getAuthHeaders,
      applySave,
      setKnownUpdatedAt: (value) => { runtime.lastKnownUpdatedAt = value; },
      setSnapshot: (value) => { runtime.lastSnapshot = value; },
      setWalletLoginStatus: () => setLoginStatus("다른 탭의 더 최신 저장 기록을 불러왔습니다."),
    });
  }

  function flushOnExit() {
    const plan = createPlayerSaveExitPlan({
      isDevSession: isDevSession(),
      isServerBackedSession: isServerBackedSession(),
      syncPaused,
      hasConfirmedBaseline: hasConfirmedBaseline(),
      snapshot: JSON.stringify(serializeSave()),
      previousSnapshot: runtime.lastSnapshot,
    });
    if (plan.type === "local") {
      saveActiveLocalProfileState();
      saveSharedWorldState();
      return;
    }
    if (plan.type !== "remote") return;
    try {
      fetchFn(`${authApiBaseUrl}/auth/save`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ save: JSON.parse(plan.snapshot), knownUpdatedAt: runtime.lastKnownUpdatedAt }),
        keepalive: true,
      });
      runtime.lastSnapshot = plan.snapshot;
    } catch {}
  }

  function scheduleSync(force, { apiFetchJson, getAuthHeaders }) {
    const plan = createPlayerSaveSchedulePlan({
      isDevSession: isDevSession(), isServerBackedSession: isServerBackedSession(), syncPaused,
      hasConfirmedBaseline: hasConfirmedBaseline(), force, now: now(), lastAttemptAt,
      inFlight: Boolean(syncInFlight), intervalMs,
    });
    if (plan.type === "local") {
      saveActiveLocalProfileState();
      saveSharedWorldState();
      return;
    }
    if (plan.type !== "sync") return;
    lastAttemptAt = plan.attemptedAt;
    syncInFlight = pushToServer({ apiFetchJson, getAuthHeaders }).finally(() => { syncInFlight = null; });
  }

  return {
    beginHydration, blockBaseline, clearStatusTimer, flushOnExit, getSyncPaused,
    hasConfirmedBaseline, hydrateFromServer, loadActiveLocalProfileState, markBaselineReady,
    pushToServer, resetProtectionState, saveActiveLocalProfileState, scheduleSync,
    setSyncPaused, updateStatus,
  };
}
