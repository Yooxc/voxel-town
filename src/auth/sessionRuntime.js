export function createSessionRuntime({ devProfileIds, fallbackProfileId, devProfileSavePrefix, guestSaveKey }) {
  const sanitizeDevProfileId = (id) => devProfileIds.includes(id) ? id : fallbackProfileId;
  function shortenWalletAddress(address, shortenAddress) {
    if (!address) return "";
    if (address === "dev_user_1") return "DEV-1";
    if (address === "dev_user_2") return "DEV-2";
    if (address === "dev-mode-local") return "DEV MODE";
    if (address === "guest-local") return "GUEST";
    return shortenAddress(address);
  }
  function applyAuthState({ auth, profile, nextState, activeDevProfileId, getDevProfileDisplayName }) {
    auth.authenticated = Boolean(nextState.authenticated);
    auth.address = nextState.address ?? "";
    auth.signature = nextState.signature ?? "";
    auth.nonce = nextState.nonce ?? "";
    auth.issuedAt = nextState.issuedAt ?? "";
    auth.chainId = nextState.chainId ?? "";
    auth.token = nextState.token ?? "";
    auth.sessionType = nextState.sessionType ?? "";
    let nextActiveDevProfileId = activeDevProfileId;
    if (auth.sessionType === "dev") {
      nextActiveDevProfileId = sanitizeDevProfileId(
        nextState.devProfileId ?? auth.address ?? activeDevProfileId
      );
      auth.address = nextActiveDevProfileId;
      profile.nickname = nextState.nickname ?? getDevProfileDisplayName(nextActiveDevProfileId);
    } else {
      profile.nickname = nextState.nickname ?? "";
    }
    return nextActiveDevProfileId;
  }
  function parseRestorableSession(raw, parseSession) {
    if (!raw) return { session: null, invalid: false };
    const session = parseSession(raw);
    return { session, invalid: !session };
  }
  function validateNickname(raw) {
    const name = String(raw ?? "").trim();
    if (name.length < 2 || name.length > 12) return "닉네임은 2자 이상 12자 이하로 입력해주세요.";
    return /^[A-Za-z0-9가-힣_]+$/.test(name) ? "" : "닉네임은 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.";
  }
  function getPlayerSaveKey(auth, profileId) {
    if (auth?.sessionType === "dev") return `${devProfileSavePrefix}${sanitizeDevProfileId(profileId)}`;
    if (auth?.sessionType === "guest" || auth?.address === "guest-local") return guestSaveKey;
    return "";
  }
  return {
    applyAuthState,
    getPlayerSaveKey,
    parseRestorableSession,
    sanitizeDevProfileId,
    shortenWalletAddress,
    validateNickname,
  };
}
