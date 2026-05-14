export function createInitialWalletAuthState() {
  return {
    authenticated: false,
    address: "",
    signature: "",
    nonce: "",
    issuedAt: "",
    chainId: "",
    token: "",
    sessionType: "",
    providerBound: false,
  };
}

export function createInitialWalletProfile() {
  return {
    nickname: "",
  };
}

export function shortenWalletAddress(address) {
  const value = String(address || "");
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function sanitizeDevProfileId(profileId, devProfileIds, fallbackProfileId) {
  return devProfileIds.includes(profileId) ? profileId : fallbackProfileId;
}

export function getDevProfileDisplayName(profileId, devProfileIds, fallbackProfileId) {
  const normalized = sanitizeDevProfileId(profileId, devProfileIds, fallbackProfileId);
  return normalized === "dev_user_2" ? "개발자2" : "개발자1";
}

export function serializeWalletSession(walletAuth) {
  if (!walletAuth?.authenticated || !walletAuth?.address) return null;
  return {
    authenticated: walletAuth.authenticated,
    address: walletAuth.address,
    signature: walletAuth.signature,
    nonce: walletAuth.nonce,
    issuedAt: walletAuth.issuedAt,
    chainId: walletAuth.chainId,
    token: walletAuth.token,
    sessionType: walletAuth.sessionType,
  };
}

export function parseStoredWalletSession(raw) {
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw);
    const isGuestSaved = saved?.sessionType === "guest" || saved?.address === "guest-local";
    if (!saved?.authenticated || !saved?.address || (!saved?.token && !isGuestSaved)) return null;
    return saved;
  } catch {
    return null;
  }
}

export function isGuestSessionState(walletAuth) {
  return walletAuth.sessionType === "guest" || walletAuth.address === "guest-local";
}

export function isDevSessionState(walletAuth) {
  return walletAuth.sessionType === "dev";
}

export function isWalletAuthenticatedState(walletAuth) {
  return Boolean(walletAuth?.authenticated);
}

export function isServerBackedWalletSessionState(walletAuth) {
  return (
    walletAuth.authenticated &&
    walletAuth.sessionType === "wallet" &&
    Boolean(walletAuth.token)
  );
}

export function getChainDisplayName(chainId) {
  const normalized = typeof chainId === "string" ? chainId.toLowerCase() : "";
  switch (normalized) {
    case "0x1":
      return "Ethereum Mainnet";
    case "0x89":
      return "Polygon Mainnet";
    case "0x2105":
      return "Base";
    case "0x38":
      return "BNB Smart Chain";
    case "0xa":
      return "Optimism";
    case "0xa4b1":
      return "Arbitrum One";
    default:
      return null;
  }
}

export function formatWalletChainLabel(chainId) {
  if (!chainId) return "체인: 확인 전";
  const displayName = getChainDisplayName(chainId);
  return displayName ? `체인: ${displayName} (${chainId})` : `체인: ${chainId}`;
}
