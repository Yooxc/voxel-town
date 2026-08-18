export function createSessionWorkflowController({
  auth,
  profile,
  storage,
  walletSessionKey,
  sessionRuntime,
  sessionController,
  serializeSession,
  parseStoredSession,
  isGuestSessionState,
  isDevSessionState,
  isWalletAuthenticatedState,
  isServerBackedWalletSessionState,
  getActiveDevProfileId,
  setActiveDevProfileId,
  getDevProfileDisplayName,
  getAddressLabel,
  getChainLabel,
  getUiState,
  renderUi,
  onSessionCleared,
  applyFreshPlayerStartState,
  saveCoordinator,
  getApiFetchJson,
  getAuthHeaders,
  getLoginMessage,
  getNicknameInput,
  setNicknameStatus,
  setLoginStatus,
  setLoginBusy,
  setNicknameBusy,
  notify,
  now = () => new Date().toISOString(),
}) {
  function saveWalletSession() {
    const serialized = serializeSession(auth);
    if (!serialized) storage.removeItem(walletSessionKey);
    else storage.setItem(walletSessionKey, JSON.stringify(serialized));
  }

  function hasNickname() { return profile.nickname.trim().length > 0; }
  function isGuestSession() { return isGuestSessionState(auth); }
  function isDevSession() { return isDevSessionState(auth); }
  function isServerBackedWalletSession() { return isServerBackedWalletSessionState(auth); }
  function isWalletAuthenticated() { return isWalletAuthenticatedState(auth); }
  function canPlayGame() { return isWalletAuthenticated() && hasNickname(); }

  function updateWalletUi() {
    renderUi({
      loggedIn: auth.authenticated,
      addressLabel: getAddressLabel(auth.address),
      chainLabel: getChainLabel(auth.chainId),
      nickname: profile.nickname,
      hasNickname: hasNickname(),
      isDevSession: isDevSession(),
      activeDevProfileId: sessionRuntime.sanitizeDevProfileId(getActiveDevProfileId()),
      ...getUiState(),
    });
  }

  function setWalletAuthState(nextState, { persist = true } = {}) {
    const activeProfileId = sessionRuntime.applyAuthState({
      auth, profile, nextState, activeDevProfileId: getActiveDevProfileId(), getDevProfileDisplayName,
    });
    setActiveDevProfileId(activeProfileId);
    if (persist) saveWalletSession();
    updateWalletUi();
  }

  function clearWalletSession() {
    setWalletAuthState({
      authenticated: false, address: "", signature: "", nonce: "", issuedAt: "", chainId: "", token: "", sessionType: "",
    });
    profile.nickname = "";
    saveCoordinator.setSyncPaused(false);
    saveCoordinator.resetProtectionState();
    saveCoordinator.clearStatusTimer();
    onSessionCleared();
    updateWalletUi();
  }

  function restoreWalletSession() {
    const raw = storage.getItem(walletSessionKey);
    const { session: saved, invalid } = sessionRuntime.parseRestorableSession(raw, parseStoredSession);
    if (!saved) {
      if (invalid) storage.removeItem(walletSessionKey);
      return;
    }
    try {
      setWalletAuthState(saved, { persist: false });
      if (saved.sessionType === "wallet") {
        saveCoordinator.beginHydration();
        applyFreshPlayerStartState();
      } else if (saved.sessionType === "guest" || saved.address === "guest-local") {
        applyFreshPlayerStartState();
      }
    } catch {
      storage.removeItem(walletSessionKey);
    }
  }

  async function hydrateWalletSessionFromServer() {
    if (!auth.authenticated || !auth.token || isDevSession() || isGuestSession()) return;
    setLoginStatus("로그인 세션을 확인하는 중입니다...");
    saveCoordinator.beginHydration();
    const result = await sessionController.hydrateWalletSession({ auth, apiFetchJson: getApiFetchJson(), headers: getAuthHeaders() });
    if (!result.ok) {
      saveCoordinator.blockBaseline("저장된 세션을 확인하지 못했습니다. 다시 로그인해주세요.");
      clearWalletSession();
      setLoginStatus("저장된 세션이 만료되었습니다. 다시 로그인해주세요.");
      return;
    }
    setWalletAuthState(result.state);
    applyFreshPlayerStartState();
    await saveCoordinator.hydrateFromServer({ apiFetchJson: getApiFetchJson(), getAuthHeaders });
    saveCoordinator.setSyncPaused(!saveCoordinator.hasConfirmedBaseline());
  }

  function bindWalletProviderEvents(provider) {
    sessionController.bindWalletProviderEvents({
      provider, auth,
      onDisconnect: () => { clearWalletSession(); setLoginStatus("지갑 연결이 해제되었습니다. 다시 로그인해주세요."); },
      onAccountChanged: () => { clearWalletSession(); setLoginStatus("지갑 주소가 변경되었습니다. 새 주소로 다시 로그인해주세요."); },
      onChainChanged: (chainId) => { auth.chainId = chainId ?? ""; saveWalletSession(); updateWalletUi(); },
    });
  }

  async function connectWalletLogin(provider) {
    setLoginBusy(true);
    setLoginStatus("지갑 연결과 서명을 요청하는 중입니다...");
    const result = await sessionController.connectWallet({ provider, apiFetchJson: getApiFetchJson(), getLoginMessage });
    if (result.ok) {
      setWalletAuthState(result.state);
      saveCoordinator.beginHydration();
      applyFreshPlayerStartState();
      await saveCoordinator.hydrateFromServer({ apiFetchJson: getApiFetchJson(), getAuthHeaders });
      saveCoordinator.setSyncPaused(!saveCoordinator.hasConfirmedBaseline());
      setLoginStatus(`${getAddressLabel(result.address)} 주소로 서명이 완료되었습니다.`);
    } else {
      if (!result.missingProvider) {
        saveCoordinator.blockBaseline();
        saveCoordinator.setSyncPaused(false);
      }
      setLoginStatus(result.error);
    }
    setLoginBusy(false);
  }

  function startGuestSession() {
    setWalletAuthState(sessionController.createGuestSessionState(now()));
    applyFreshPlayerStartState();
    setLoginStatus("게스트 계정으로 입장했습니다. 닉네임을 설정해주세요.");
  }

  async function commitNickname(scheduleSave) {
    const nickname = getNicknameInput().trim();
    const error = sessionRuntime.validateNickname(nickname);
    if (error) { setNicknameStatus(error); return; }
    const local = isDevSession() || isGuestSession();
    if (!local) { setNicknameBusy(true); setNicknameStatus("닉네임을 서버에 저장하는 중입니다..."); }
    const result = await sessionController.saveNickname({ nickname, local, apiFetchJson: getApiFetchJson(), headers: getAuthHeaders() });
    if (!local) setNicknameBusy(false);
    if (!result.ok) { setNicknameStatus(result.error); return; }
    profile.nickname = result.nickname;
    setNicknameStatus("");
    saveWalletSession();
    updateWalletUi();
    if (!local) scheduleSave(true);
    notify(`닉네임 설정 완료: ${profile.nickname}`, 1000);
  }

  async function handleWalletLogout() {
    if (isServerBackedWalletSession()) {
      try { await saveCoordinator.pushToServer({ apiFetchJson: getApiFetchJson(), getAuthHeaders }); } catch {}
    }
    clearWalletSession();
    setLoginStatus("로그아웃되었습니다. 다시 메타마스크로 로그인해주세요.");
  }

  return {
    bindWalletProviderEvents, canPlayGame, clearWalletSession, commitNickname, connectWalletLogin,
    handleWalletLogout, hasNickname, hydrateWalletSessionFromServer, isDevSession, isGuestSession,
    isServerBackedWalletSession, isWalletAuthenticated, restoreWalletSession, saveWalletSession,
    setWalletAuthState, startGuestSession, updateWalletUi,
  };
}
