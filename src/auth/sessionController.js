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
    createDevSessionState,
    getDevProfileInitializationPlan,
    getDevProfileStartPosition,
    sanitizeDevProfileId,
  };
}
