export function createSessionController({
  authApiBaseUrl,
  devActiveProfileKey,
  devProfileIds,
  devProfileStartOffsets,
  fallbackProfileId,
  startX,
}) {
  const sanitizeDevProfileId = (profileId) => (
    devProfileIds.includes(profileId) ? profileId : fallbackProfileId
  );

  function getDevProfileStartPosition(profileId) {
    const normalizedProfileId = sanitizeDevProfileId(profileId);
    const offset = devProfileStartOffsets[normalizedProfileId]
      ?? devProfileStartOffsets[fallbackProfileId];
    return {
      x: startX + (offset?.x ?? 0),
      z: offset?.z ?? 0,
    };
  }

  function createDevSessionState(profileId, nickname, issuedAt) {
    const normalizedProfileId = sanitizeDevProfileId(profileId);
    return {
      authenticated: true,
      address: normalizedProfileId,
      signature: "",
      nonce: "",
      issuedAt,
      chainId: "development",
      token: "",
      sessionType: "dev",
      nickname: nickname(normalizedProfileId),
      devProfileId: normalizedProfileId,
    };
  }

  function getDevProfileInitializationPlan({ preferredProfileId, storedProfileId, activeProfileId }) {
    return {
      profileId: sanitizeDevProfileId(preferredProfileId || storedProfileId || activeProfileId),
      activeProfileKey: devActiveProfileKey,
    };
  }

  function createGuestSessionState(issuedAt) {
    return {
      authenticated: true,
      address: "guest-local",
      signature: "",
      nonce: "",
      issuedAt,
      chainId: "guest",
      token: "",
      sessionType: "guest",
      nickname: "",
    };
  }

  async function connectWallet({ provider, apiFetchJson, getLoginMessage }) {
    if (!provider) {
      return {
        ok: false,
        error: "메타마스크가 설치되어 있지 않습니다. 브라우저 확장 프로그램을 먼저 설치해주세요.",
        missingProvider: true,
      };
    }
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const address = accounts?.[0];
      if (!address) throw new Error("지갑 주소를 불러오지 못했습니다.");
      const nonceResponse = await apiFetchJson("/auth/nonce", {
        method: "POST",
        body: JSON.stringify({ address }),
      });
      if (!nonceResponse.ok) throw new Error(nonceResponse.error);
      const nonce = nonceResponse.data.nonce;
      const issuedAt = nonceResponse.data.issuedAt;
      const message = nonceResponse.data.message || getLoginMessage(address, nonce, issuedAt);
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, address],
      });
      const chainId = await provider.request({ method: "eth_chainId" }).catch(() => "");
      const verifyResponse = await apiFetchJson("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ address, nonce, signature }),
      });
      if (!verifyResponse.ok) throw new Error(verifyResponse.error);
      return {
        ok: true,
        address,
        state: {
          authenticated: true,
          address,
          signature,
          nonce,
          issuedAt,
          chainId,
          token: verifyResponse.data.token,
          sessionType: "wallet",
          nickname: verifyResponse.data.user?.nickname ?? "",
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: `로그인 실패: ${error?.message ?? "사용자 취소 또는 지갑 오류"}`,
      };
    }
  }

  async function hydrateWalletSession({ auth, apiFetchJson, headers }) {
    const response = await apiFetchJson("/auth/me", { method: "GET", headers });
    if (!response.ok) return { ok: false, response };
    return {
      ok: true,
      state: {
        authenticated: true,
        address: response.data.user?.walletAddress ?? auth.address,
        signature: auth.signature,
        nonce: auth.nonce,
        issuedAt: auth.issuedAt,
        chainId: auth.chainId,
        token: auth.token,
        sessionType: "wallet",
        nickname: response.data.user?.nickname ?? "",
      },
    };
  }

  async function saveNickname({ nickname, local, apiFetchJson, headers }) {
    if (local) return { ok: true, nickname, local: true };
    const response = await apiFetchJson("/auth/nickname", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ nickname }),
    });
    if (!response.ok) return response;
    return {
      ok: true,
      nickname: response.data.user?.nickname ?? nickname,
      local: false,
    };
  }

  function bindWalletProviderEvents({ provider, auth, onDisconnect, onAccountChanged, onChainChanged }) {
    if (!provider || auth.providerBound) return false;
    auth.providerBound = true;
    provider.on?.("accountsChanged", (accounts) => {
      const nextAddress = accounts?.[0] ?? "";
      if (!nextAddress) {
        onDisconnect();
      } else if (
        auth.authenticated
        && auth.address
        && auth.address.toLowerCase() !== nextAddress.toLowerCase()
      ) {
        onAccountChanged(nextAddress);
      }
    });
    provider.on?.("chainChanged", onChainChanged);
    return true;
  }

  async function apiFetchJson(path, options = {}, fetchFn = fetch) {
    try {
      const { headers: optionHeaders = {}, ...restOptions } = options;
      const response = await fetchFn(`${authApiBaseUrl}${path}`, {
        ...restOptions,
        headers: {
          "Content-Type": "application/json",
          ...optionHeaders,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) {
        return {
          ok: false,
          status: response.status,
          error: data?.error || "Authentication server request failed.",
          data,
        };
      }
      return { ok: true, data };
    } catch {
      return {
        ok: false,
        status: 0,
        error: "Could not connect to the authentication server.",
      };
    }
  }

  return {
    apiFetchJson,
    bindWalletProviderEvents,
    connectWallet,
    createGuestSessionState,
    createDevSessionState,
    getDevProfileInitializationPlan,
    getDevProfileStartPosition,
    hydrateWalletSession,
    saveNickname,
    sanitizeDevProfileId,
  };
}

export function createDevProfileOrchestrator({
  profileIds,
  activeProfileKey,
  sharedWorldKey,
  storage,
  sessionController,
  getActiveProfileId,
  setActiveProfileId,
  getDisplayName,
  getCreditsMigrationKey,
  getPlayerCredits,
  setPlayerCredits,
  isDevSession,
  setWalletAuthState,
  setWalletLoginStatus,
  resetPlayerSaveProtectionState,
  setPlayerSaveSyncPaused,
  loadSharedWorldState,
  applySharedWorldState,
  loadActiveLocalProfileState,
  applyFreshPlayerStartState,
  applyDevProfileStartPosition,
  applyDevPreset,
  saveActiveLocalProfileState,
  saveSharedWorldState,
  applyDevProfileRoleOverrides,
  restoreMissingLandDeeds,
  resetWastelandDraftUiState,
  refreshWastelandDraftUiState,
  createDefaultSharedWorldSave,
  resetFrontierWastelandRuntimeState,
  notify,
  now = () => new Date().toISOString(),
}) {
  function initialize(preferredProfileId = "") {
    const initialization = sessionController.getDevProfileInitializationPlan({
      preferredProfileId,
      storedProfileId: storage.getItem(activeProfileKey),
      activeProfileId: getActiveProfileId(),
    });
    setActiveProfileId(initialization.profileId);
    resetPlayerSaveProtectionState();
    setPlayerSaveSyncPaused(false);
    setWalletAuthState(
      sessionController.createDevSessionState(initialization.profileId, getDisplayName, now()),
      { persist: false }
    );
    const sharedWorld = loadSharedWorldState();
    applySharedWorldState(sharedWorld);
    const loadState = loadActiveLocalProfileState();
    if (loadState === "apply_error") {
      applyFreshPlayerStartState();
      applyDevProfileStartPosition(initialization.profileId);
      applySharedWorldState(sharedWorld);
      applyDevPreset();
      setWalletLoginStatus(
        `${getDisplayName(initialization.profileId)} 저장본 적용 중 오류가 발생해 임시 프리셋으로 입장했습니다.`
      );
      notify("개발자 저장본 복원 중 오류가 발생했습니다.", 1300);
    } else if (loadState !== "loaded") {
      applyFreshPlayerStartState();
      applyDevProfileStartPosition(initialization.profileId);
      applySharedWorldState(sharedWorld);
      applyDevPreset();
      saveActiveLocalProfileState();
      saveSharedWorldState();
    }
    const creditsMigrationKey = getCreditsMigrationKey(initialization.profileId);
    if (isDevSession() && !storage.getItem(creditsMigrationKey) && getPlayerCredits() === 0) {
      setPlayerCredits(500);
      saveActiveLocalProfileState();
    }
    storage.setItem(creditsMigrationKey, "1");
    applyDevProfileRoleOverrides();
    restoreMissingLandDeeds();
    resetWastelandDraftUiState();
    refreshWastelandDraftUiState();
    saveActiveLocalProfileState();
    storage.setItem(initialization.activeProfileKey, initialization.profileId);
    setWalletLoginStatus(`${getDisplayName(initialization.profileId)}로 개발자 모드에 입장했습니다.`);
  }

  function switchProfile(profileId) {
    if (!isDevSession()) return;
    const nextProfileId = sessionController.sanitizeDevProfileId(profileId);
    if (nextProfileId === getActiveProfileId()) return;
    resetWastelandDraftUiState();
    saveActiveLocalProfileState();
    saveSharedWorldState();
    storage.setItem(activeProfileKey, nextProfileId);
    initialize(nextProfileId);
    notify(`${getDisplayName(nextProfileId)} 위치를 복원했습니다.`, 900);
  }

  function writePresetSnapshot(profileId) {
    const targetProfileId = sessionController.sanitizeDevProfileId(profileId);
    setActiveProfileId(targetProfileId);
    setWalletAuthState(
      sessionController.createDevSessionState(targetProfileId, getDisplayName, now()),
      { persist: false }
    );
    applyFreshPlayerStartState();
    applyDevProfileStartPosition(targetProfileId);
    applySharedWorldState(createDefaultSharedWorldSave());
    applyDevPreset();
    applyDevProfileRoleOverrides();
    saveActiveLocalProfileState();
    storage.setItem(getCreditsMigrationKey(targetProfileId), "1");
  }

  function resetTestingEnvironment() {
    if (!isDevSession()) return false;
    const currentProfileId = sessionController.sanitizeDevProfileId(getActiveProfileId());
    const blankWorld = createDefaultSharedWorldSave();
    for (const profileId of profileIds) writePresetSnapshot(profileId);
    storage.setItem(sharedWorldKey, JSON.stringify(blankWorld));
    storage.setItem(activeProfileKey, currentProfileId);
    initialize(currentProfileId);
    resetFrontierWastelandRuntimeState();
    saveSharedWorldState();
    notify("개발자 테스트 환경을 초기화했습니다.", 1200);
    return true;
  }

  return { initialize, resetTestingEnvironment, switchProfile, writePresetSnapshot };
}
