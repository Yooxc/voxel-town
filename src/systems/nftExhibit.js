export const NFT_EXHIBIT_TARGET = {
  chainId: "0x1",
  contractAddress: "0x3aAA87FBe562AC659F9e657a8EFe00b411a56273",
  tokenId: "1",
  title: "지갑 NFT 전시",
};

const NFT_OWNED_TOKENS_CACHE_MS = 30_000;
const NFT_OWNED_TOKENS_LIMIT = 24;

export function createNftOwnedTokensCache() {
  return {
    walletAddress: "",
    chainId: "",
    contractAddress: "",
    items: [],
    fetchedAt: 0,
  };
}

export function stripHexPrefix(hex) {
  return String(hex || "").replace(/^0x/i, "");
}

export function normalizeIpfsUrl(rawUrl) {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("ipfs://ipfs/")) {
    return `https://ipfs.io/ipfs/${rawUrl.slice("ipfs://ipfs/".length)}`;
  }
  if (rawUrl.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${rawUrl.slice("ipfs://".length)}`;
  }
  return rawUrl;
}

export function isValidHexAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || "").trim());
}

export function isValidChainId(value) {
  return /^0x[a-fA-F0-9]+$/.test(String(value || "").trim());
}

export function isValidTokenId(value) {
  return /^[0-9]+$/.test(String(value || "").trim());
}

export function isValidNftImageRef(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("ipfs://") ||
    raw.startsWith("data:image/")
  );
}

export function createNftBoardDefaultSelection() {
  return {
    chainId: NFT_EXHIBIT_TARGET.chainId,
    contractAddress: NFT_EXHIBIT_TARGET.contractAddress.toLowerCase(),
    tokenId: NFT_EXHIBIT_TARGET.tokenId,
    name: NFT_EXHIBIT_TARGET.title,
    image: "",
    subtitle: "",
  };
}

export function createNftBoardClearedSelection() {
  return {
    mode: "none",
  };
}

export function normalizeNftBoardSelection(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.mode === "none") {
    return { mode: "none" };
  }
  const contractAddress = String(raw.contractAddress || "").trim().toLowerCase();
  const tokenId = raw.tokenId == null ? "" : String(raw.tokenId).trim();
  const chainId = String(raw.chainId || NFT_EXHIBIT_TARGET.chainId || "").trim() || NFT_EXHIBIT_TARGET.chainId;
  if (!isValidHexAddress(contractAddress) || !isValidTokenId(tokenId) || !isValidChainId(chainId)) {
    return null;
  }
  const image = String(raw.image || "").trim();
  return {
    chainId,
    contractAddress,
    tokenId,
    name: String(raw.name || "NFT 작품").trim() || "NFT 작품",
    image: isValidNftImageRef(image) ? image : "",
    subtitle: String(raw.subtitle || "").trim(),
  };
}

export function isSameNftBoardSelection(a, b) {
  const left = normalizeNftBoardSelection(a);
  const right = normalizeNftBoardSelection(b);
  if (!left && !right) return true;
  if (!left || !right) return false;
  if (left.mode === "none" || right.mode === "none") {
    return left.mode === right.mode;
  }
  return (
    left.chainId === right.chainId &&
    left.contractAddress === right.contractAddress &&
    left.tokenId === right.tokenId
  );
}

export function encodeUint256Call(selector, value) {
  const encodedValue = BigInt(value).toString(16).padStart(64, "0");
  return `${selector}${encodedValue}`;
}

export function encodeAddressCall(selector, address) {
  const encodedAddress = stripHexPrefix(String(address || "")).padStart(64, "0");
  return `${selector}${encodedAddress}`;
}

export function encodeAddressUintCall(selector, address, value) {
  const encodedAddress = stripHexPrefix(String(address || "")).padStart(64, "0");
  const encodedValue = BigInt(value).toString(16).padStart(64, "0");
  return `${selector}${encodedAddress}${encodedValue}`;
}

export function encodeSupportsInterfaceCall(interfaceIdHex) {
  const encodedInterface = stripHexPrefix(interfaceIdHex).padStart(64, "0");
  return `0x01ffc9a7${encodedInterface}`;
}

export function decodeAbiAddress(resultHex) {
  const clean = stripHexPrefix(resultHex);
  if (clean.length < 64) return "";
  return `0x${clean.slice(clean.length - 40)}`.toLowerCase();
}

export function decodeAbiUint256(resultHex) {
  const clean = stripHexPrefix(resultHex);
  if (clean.length < 64) return 0n;
  return BigInt(`0x${clean.slice(clean.length - 64)}`);
}

export function decodeAbiString(resultHex) {
  const clean = stripHexPrefix(resultHex);
  if (clean.length < 128) return "";
  const offset = Number.parseInt(clean.slice(0, 64), 16) * 2;
  if (!Number.isFinite(offset) || offset < 0 || clean.length < offset + 64) return "";
  const length = Number.parseInt(clean.slice(offset, offset + 64), 16);
  if (!Number.isFinite(length) || length < 0) return "";
  const dataHex = clean.slice(offset + 64, offset + 64 + length * 2);
  const bytes = new Uint8Array(dataHex.match(/.{1,2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
  return new TextDecoder().decode(bytes);
}

export async function fetchErc721Owner(contractAddress, tokenId) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: contractAddress,
        data: encodeUint256Call("0x6352211e", tokenId),
      },
      "latest",
    ],
  });
  return decodeAbiAddress(result);
}

export async function fetchErc721Balance(contractAddress, ownerAddress) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: contractAddress,
        data: encodeAddressCall("0x70a08231", ownerAddress),
      },
      "latest",
    ],
  });
  return decodeAbiUint256(result);
}

export async function fetchErc721TokenOfOwnerByIndex(contractAddress, ownerAddress, index) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: contractAddress,
        data: encodeAddressUintCall("0x2f745c59", ownerAddress, index),
      },
      "latest",
    ],
  });
  return decodeAbiUint256(result).toString();
}

export async function fetchSupportsInterface(contractAddress, interfaceIdHex) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: contractAddress,
        data: encodeSupportsInterfaceCall(interfaceIdHex),
      },
      "latest",
    ],
  });
  return decodeAbiUint256(result) !== 0n;
}

export async function fetchErc721TokenUri(contractAddress, tokenId) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: contractAddress,
        data: encodeUint256Call("0xc87b56dd", tokenId),
      },
      "latest",
    ],
  });
  return decodeAbiString(result);
}

export async function fetchNftMetadata(tokenUri) {
  const normalizedUri = normalizeIpfsUrl(tokenUri);
  if (normalizedUri.startsWith("data:application/json;base64,")) {
    const encoded = normalizedUri.slice("data:application/json;base64,".length);
    return JSON.parse(atob(encoded));
  }
  if (normalizedUri.startsWith("data:application/json,")) {
    return JSON.parse(decodeURIComponent(normalizedUri.slice("data:application/json,".length)));
  }
  const response = await fetch(normalizedUri);
  if (!response.ok) {
    throw new Error("NFT 메타데이터를 불러오지 못했습니다.");
  }
  return response.json();
}

export async function fetchWalletOwnedExhibitTokens({
  walletAuth,
  cache = createNftOwnedTokensCache(),
  now = Date.now(),
} = {}) {
  if (!walletAuth?.address) {
    return { items: [], cache };
  }

  const walletAddress = walletAuth.address.toLowerCase();
  const chainId = walletAuth.chainId || "";
  const contractAddress = NFT_EXHIBIT_TARGET.contractAddress.toLowerCase();
  const cacheIsValid =
    cache.walletAddress === walletAddress &&
    cache.chainId === chainId &&
    cache.contractAddress === contractAddress &&
    now - cache.fetchedAt < NFT_OWNED_TOKENS_CACHE_MS;
  if (cacheIsValid) {
    return {
      items: cache.items.map((item) => ({ ...item })),
      cache,
    };
  }

  const ownedTokens = [];
  const enumerableSupported = await fetchSupportsInterface(contractAddress, "0x780e9d63").catch(() => false);

  if (enumerableSupported) {
    const balance = Number(await fetchErc721Balance(contractAddress, walletAuth.address));
    const cappedBalance = Math.min(balance, NFT_OWNED_TOKENS_LIMIT);
    for (let index = 0; index < cappedBalance; index++) {
      const tokenId = await fetchErc721TokenOfOwnerByIndex(contractAddress, walletAuth.address, index);
      const tokenUri = await fetchErc721TokenUri(contractAddress, tokenId);
      const metadata = await fetchNftMetadata(tokenUri);
      ownedTokens.push({
        chainId: NFT_EXHIBIT_TARGET.chainId,
        contractAddress,
        tokenId,
        name: String(metadata?.name || `NFT #${tokenId}`),
        image: String(metadata?.image || metadata?.image_url || metadata?.imageUrl || ""),
        subtitle: String(metadata?.description || ""),
      });
    }
  } else {
    const owner = await fetchErc721Owner(contractAddress, NFT_EXHIBIT_TARGET.tokenId);
    if (owner.toLowerCase() === walletAddress) {
      const tokenUri = await fetchErc721TokenUri(contractAddress, NFT_EXHIBIT_TARGET.tokenId);
      const metadata = await fetchNftMetadata(tokenUri);
      ownedTokens.push({
        chainId: NFT_EXHIBIT_TARGET.chainId,
        contractAddress,
        tokenId: NFT_EXHIBIT_TARGET.tokenId,
        name: String(metadata?.name || NFT_EXHIBIT_TARGET.title),
        image: String(metadata?.image || metadata?.image_url || metadata?.imageUrl || ""),
        subtitle: String(metadata?.description || ""),
      });
    }
  }

  const nextCache = {
    walletAddress,
    chainId,
    contractAddress,
    items: ownedTokens.map((item) => ({ ...item })),
    fetchedAt: now,
  };
  return {
    items: ownedTokens,
    cache: nextCache,
  };
}
