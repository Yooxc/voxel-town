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
  getInventorySeedKey,
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
  resetTerrainLabState,
  resetDevTestProfiles,
  notify,
  now = () => new Date().toISOString(),
}) {
  function runNonBlockingStep(label, task) {
    try {
      task();
      return true;
    } catch (error) {
      console.error(`Developer profile ${label} failed.`, error);
      return undefined;
    }
  }

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
    runNonBlockingStep("shared world apply", () => applySharedWorldState(sharedWorld));
    const loadState = loadActiveLocalProfileState();
    const usingRecoveryPreset = loadState === "apply_error";
    if (loadState === "apply_error") {
      applyFreshPlayerStartState();
      applyDevProfileStartPosition(initialization.profileId);
      runNonBlockingStep("shared world recovery", () => applySharedWorldState(sharedWorld));
      applyDevPreset();
      setWalletLoginStatus(
        `${getDisplayName(initialization.profileId)} 저장본 오류로 임시 개발자 상태로 입장했습니다. 기존 저장본은 유지됩니다.`
      );
      notify("개발자 저장본 오류: 임시 상태로 입장했습니다.", 1500);
    } else if (loadState !== "loaded") {
      applyFreshPlayerStartState();
      applyDevProfileStartPosition(initialization.profileId);
      runNonBlockingStep("shared world recovery", () => applySharedWorldState(sharedWorld));
      applyDevPreset();
      saveActiveLocalProfileState();
      runNonBlockingStep("shared world save", saveSharedWorldState);
    }
    const creditsMigrationKey = getCreditsMigrationKey(initialization.profileId);
    if (isDevSession() && !storage.getItem(creditsMigrationKey) && getPlayerCredits() === 0) {
      setPlayerCredits(500);
      if (!usingRecoveryPreset) saveActiveLocalProfileState();
    }
    storage.setItem(creditsMigrationKey, "1");
    const inventorySeedKey = getInventorySeedKey(initialization.profileId);
    if (!usingRecoveryPreset && !storage.getItem(inventorySeedKey)) {
      const seeded = runNonBlockingStep("profile inventory seed", applyDevProfileRoleOverrides);
      if (seeded) {
        saveActiveLocalProfileState();
        storage.setItem(inventorySeedKey, "1");
      }
    } else if (usingRecoveryPreset) {
      runNonBlockingStep("recovery profile role setup", applyDevProfileRoleOverrides);
    }
    if (!usingRecoveryPreset) {
      runNonBlockingStep("land deed recovery", restoreMissingLandDeeds);
    }
    runNonBlockingStep("wasteland UI reset", resetWastelandDraftUiState);
    runNonBlockingStep("wasteland UI refresh", refreshWastelandDraftUiState);
    if (!usingRecoveryPreset) saveActiveLocalProfileState();
    storage.setItem(initialization.activeProfileKey, initialization.profileId);
    if (!usingRecoveryPreset) {
      setWalletLoginStatus(`${getDisplayName(initialization.profileId)}로 개발자 모드에 입장했습니다.`);
    }
    return true;
  }

  function seedActiveProfileInventory(profileId) {
    const inventorySeedKey = getInventorySeedKey(profileId);
    if (storage.getItem(inventorySeedKey)) return false;
    const seeded = runNonBlockingStep("profile inventory seed", applyDevProfileRoleOverrides);
    if (!seeded) return false;
    saveActiveLocalProfileState();
    storage.setItem(inventorySeedKey, "1");
    return true;
  }

  function switchProfile(profileId) {
    if (!isDevSession()) return;
    const nextProfileId = sessionController.sanitizeDevProfileId(profileId);
    if (nextProfileId === getActiveProfileId()) {
      const seeded = seedActiveProfileInventory(nextProfileId);
      notify(
        seeded
          ? `${getDisplayName(nextProfileId)} 기본 아이템을 지급했습니다.`
          : `${getDisplayName(nextProfileId)} 계정이 이미 선택되어 있습니다.`,
        900,
      );
      return true;
    }
    const previousProfileId = getActiveProfileId();
    try {
      runNonBlockingStep("wasteland UI reset", resetWastelandDraftUiState);
      saveActiveLocalProfileState();
      runNonBlockingStep("shared world save", saveSharedWorldState);
      storage.setItem(activeProfileKey, nextProfileId);
      initialize(nextProfileId);
      notify(`${getDisplayName(nextProfileId)} 위치를 복원했습니다.`, 900);
      return true;
    } catch (error) {
      console.error("Developer profile switch failed.", error);
      storage.setItem(activeProfileKey, previousProfileId);
      const restored = initialize(previousProfileId);
      if (!restored) {
        setWalletLoginStatus("개발자 프로필 전환에 실패했습니다. 저장본은 유지됩니다.");
      }
      notify(`${getDisplayName(nextProfileId)} 전환에 실패해 이전 프로필로 복원했습니다.`, 1600);
      return false;
    }
  }

  function resetTestingEnvironment() {
    if (!isDevSession()) return false;
    const currentProfileId = sessionController.sanitizeDevProfileId(getActiveProfileId());
    const blankWorld = createDefaultSharedWorldSave();
    setPlayerSaveSyncPaused(true);
    try {
      resetWastelandDraftUiState();
      storage.setItem(sharedWorldKey, JSON.stringify(blankWorld));
      storage.setItem(activeProfileKey, currentProfileId);
      applySharedWorldState(blankWorld);
      resetFrontierWastelandRuntimeState();
      resetTerrainLabState();
      resetDevTestProfiles(currentProfileId);
      refreshWastelandDraftUiState();
      saveSharedWorldState();
      notify("공용 맵과 두 개발자 테스트 상태를 초기화했습니다.", 1500);
      return true;
    } catch (error) {
      console.error("Developer test environment reset failed.", error);
      notify("테스트 초기화에 실패했습니다. 기존 저장 상태를 확인해주세요.", 1800);
      return false;
    } finally {
      setPlayerSaveSyncPaused(false);
    }
  }

  return { initialize, resetTestingEnvironment, switchProfile };
}
