import test from "node:test";
import assert from "node:assert/strict";
import {
  NFT_EXHIBIT_TARGET,
  createNftBoardClearedSelection,
  createNftBoardDefaultSelection,
  createNftOwnedTokensCache,
  decodeAbiAddress,
  decodeAbiString,
  decodeAbiUint256,
  encodeAddressCall,
  encodeAddressUintCall,
  encodeSupportsInterfaceCall,
  encodeUint256Call,
  fetchErc721Balance,
  fetchErc721Owner,
  fetchErc721TokenOfOwnerByIndex,
  fetchErc721TokenUri,
  fetchNftMetadata,
  fetchSupportsInterface,
  fetchWalletOwnedExhibitTokens,
  isValidChainId,
  isValidHexAddress,
  isValidNftImageRef,
  isValidTokenId,
  isSameNftBoardSelection,
  normalizeNftBoardSelection,
  normalizeIpfsUrl,
  stripHexPrefix,
} from "../src/systems/nftExhibit.js";

test("IPFS URLs are normalized without changing regular URLs", () => {
  assert.equal(normalizeIpfsUrl("ipfs://ipfs/QmAsset"), "https://ipfs.io/ipfs/QmAsset");
  assert.equal(normalizeIpfsUrl("ipfs://QmAsset"), "https://ipfs.io/ipfs/QmAsset");
  assert.equal(normalizeIpfsUrl("https://example.com/nft.png"), "https://example.com/nft.png");
  assert.equal(normalizeIpfsUrl(""), "");
});

test("NFT identifiers and image references use the existing validation rules", () => {
  assert.equal(isValidHexAddress(`0x${"a".repeat(40)}`), true);
  assert.equal(isValidHexAddress("0x1234"), false);
  assert.equal(isValidChainId("0x1"), true);
  assert.equal(isValidChainId("1"), false);
  assert.equal(isValidTokenId("0"), true);
  assert.equal(isValidTokenId("1.5"), false);
  assert.equal(isValidNftImageRef("ipfs://QmAsset"), true);
  assert.equal(isValidNftImageRef("data:image/png;base64,AAAA"), true);
  assert.equal(isValidNftImageRef("ftp://example.com/nft.png"), false);
});

test("NFT board selections normalize defaults, clearing, and display metadata", () => {
  assert.deepEqual(createNftBoardDefaultSelection(), {
    chainId: NFT_EXHIBIT_TARGET.chainId,
    contractAddress: NFT_EXHIBIT_TARGET.contractAddress.toLowerCase(),
    tokenId: NFT_EXHIBIT_TARGET.tokenId,
    name: NFT_EXHIBIT_TARGET.title,
    image: "",
    subtitle: "",
  });
  assert.deepEqual(createNftBoardClearedSelection(), { mode: "none" });
  assert.deepEqual(normalizeNftBoardSelection({ mode: "none" }), { mode: "none" });

  const normalized = normalizeNftBoardSelection({
    contractAddress: `  0x${"AB".repeat(20)}  `,
    tokenId: 7,
    name: "  Voxel Token  ",
    image: "ipfs://QmImage",
    subtitle: "  First exhibit  ",
  });
  assert.deepEqual(normalized, {
    chainId: NFT_EXHIBIT_TARGET.chainId,
    contractAddress: `0x${"ab".repeat(20)}`,
    tokenId: "7",
    name: "Voxel Token",
    image: "ipfs://QmImage",
    subtitle: "First exhibit",
  });
  assert.equal(normalizeNftBoardSelection({ contractAddress: "0x1234", tokenId: "7" }), null);
});

test("NFT board selection equality uses chain, contract, and token identity", () => {
  const first = {
    chainId: "0x1",
    contractAddress: `0x${"ab".repeat(20)}`,
    tokenId: "7",
    name: "First name",
  };
  const sameToken = {
    ...first,
    contractAddress: first.contractAddress.toUpperCase().replace("0X", "0x"),
    name: "Different name",
    image: "https://example.com/new.png",
  };
  assert.equal(isSameNftBoardSelection(first, sameToken), true);
  assert.equal(isSameNftBoardSelection(first, { ...first, tokenId: "8" }), false);
  assert.equal(isSameNftBoardSelection({ mode: "none" }, { mode: "none" }), true);
  assert.equal(isSameNftBoardSelection(first, { mode: "none" }), false);
  assert.equal(isSameNftBoardSelection(null, undefined), true);
});

test("ERC-721 call data encoding preserves selectors and 32-byte arguments", () => {
  const address = `0x${"12".repeat(20)}`;
  assert.equal(stripHexPrefix(address), "12".repeat(20));
  assert.equal(
    encodeUint256Call("0x6352211e", 42),
    `0x6352211e${"0".repeat(62)}2a`
  );
  assert.equal(
    encodeAddressCall("0x70a08231", address),
    `0x70a08231${"0".repeat(24)}${"12".repeat(20)}`
  );
  assert.equal(
    encodeAddressUintCall("0x2f745c59", address, 7),
    `0x2f745c59${"0".repeat(24)}${"12".repeat(20)}${"0".repeat(63)}7`
  );
  assert.equal(
    encodeSupportsInterfaceCall("0x80ac58cd"),
    `0x01ffc9a7${"0".repeat(56)}80ac58cd`
  );
});

test("ABI address and uint256 values decode from 32-byte words", () => {
  const address = "34".repeat(20);
  assert.equal(decodeAbiAddress(`0x${"0".repeat(24)}${address}`), `0x${address}`);
  assert.equal(decodeAbiUint256(`0x${"0".repeat(62)}2a`), 42n);
  assert.equal(decodeAbiAddress("0x1234"), "");
  assert.equal(decodeAbiUint256("0x1234"), 0n);
});

test("dynamic ABI strings decode as UTF-8 text", () => {
  const text = "Voxel Town";
  const dataHex = Array.from(new TextEncoder().encode(text), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const encoded = [
    "0".repeat(62) + "20",
    text.length.toString(16).padStart(64, "0"),
    dataHex.padEnd(64, "0"),
  ].join("");
  assert.equal(decodeAbiString(`0x${encoded}`), text);
  assert.equal(decodeAbiString("0x1234"), "");
});

test("ERC-721 reads use eth_call and decode provider responses", async () => {
  const contractAddress = `0x${"ab".repeat(20)}`;
  const ownerAddress = `0x${"cd".repeat(20)}`;
  const tokenUri = "ipfs://QmMetadata";
  const tokenUriHex = Array.from(
    new TextEncoder().encode(tokenUri),
    (byte) => byte.toString(16).padStart(2, "0")
  ).join("");
  const encodedTokenUri = `0x${"0".repeat(62)}20${tokenUri.length
    .toString(16)
    .padStart(64, "0")}${tokenUriHex.padEnd(64, "0")}`;
  const responses = new Map([
    ["0x6352211e", `0x${"0".repeat(24)}${ownerAddress.slice(2)}`],
    ["0x70a08231", `0x${"0".repeat(62)}2a`],
    ["0x2f745c59", `0x${"0".repeat(63)}7`],
    ["0x01ffc9a7", `0x${"0".repeat(63)}1`],
    ["0xc87b56dd", encodedTokenUri],
  ]);
  const calls = [];
  const originalWindow = globalThis.window;
  globalThis.window = {
    ethereum: {
      async request(request) {
        calls.push(request);
        return responses.get(request.params[0].data.slice(0, 10));
      },
    },
  };

  try {
    assert.equal(await fetchErc721Owner(contractAddress, 1), ownerAddress);
    assert.equal(await fetchErc721Balance(contractAddress, ownerAddress), 42n);
    assert.equal(await fetchErc721TokenOfOwnerByIndex(contractAddress, ownerAddress, 0), "7");
    assert.equal(await fetchSupportsInterface(contractAddress, "0x780e9d63"), true);
    assert.equal(await fetchErc721TokenUri(contractAddress, 1), tokenUri);
    assert.equal(calls.length, 5);
    assert.equal(calls.every((call) => call.method === "eth_call"), true);
    assert.equal(calls.every((call) => call.params[0].to === contractAddress), true);
    assert.equal(calls.every((call) => call.params[1] === "latest"), true);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});

test("NFT metadata loads from JSON data URIs", async () => {
  const metadata = { name: "Voxel Token", image: "ipfs://QmImage" };
  const encodedJson = encodeURIComponent(JSON.stringify(metadata));
  const base64Json = btoa(JSON.stringify(metadata));

  assert.deepEqual(
    await fetchNftMetadata(`data:application/json,${encodedJson}`),
    metadata
  );
  assert.deepEqual(
    await fetchNftMetadata(`data:application/json;base64,${base64Json}`),
    metadata
  );
});

test("owned NFT lookup enumerates wallet tokens and returns a reusable cache", async () => {
  const contractAddress = NFT_EXHIBIT_TARGET.contractAddress.toLowerCase();
  const walletAddress = `0x${"cd".repeat(20)}`;
  const calls = [];
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  globalThis.window = {
    ethereum: {
      async request(request) {
        const data = request.params[0].data;
        calls.push(data.slice(0, 10));
        if (data.startsWith("0x01ffc9a7")) return `0x${"0".repeat(63)}1`;
        if (data.startsWith("0x70a08231")) return `0x${"0".repeat(63)}2`;
        if (data.startsWith("0x2f745c59")) {
          const index = BigInt(`0x${data.slice(-64)}`);
          return `0x${index.toString(16).padStart(64, "0")}`;
        }
        if (data.startsWith("0xc87b56dd")) {
          const tokenId = BigInt(`0x${data.slice(-64)}`).toString();
          const uri = `https://example.com/${tokenId}.json`;
          const uriHex = Array.from(new TextEncoder().encode(uri), (byte) => byte.toString(16).padStart(2, "0")).join("");
          return `0x${"0".repeat(62)}20${uri.length.toString(16).padStart(64, "0")}${uriHex.padEnd(128, "0")}`;
        }
        throw new Error(`Unexpected call: ${data}`);
      },
    },
  };
  globalThis.fetch = async (url) => ({
    ok: true,
    async json() {
      const tokenId = String(url).match(/\/(\d+)\.json$/)?.[1] ?? "";
      return { name: `Token ${tokenId}`, image: `ipfs://image-${tokenId}`, description: `Item ${tokenId}` };
    },
  });

  try {
    const first = await fetchWalletOwnedExhibitTokens({
      walletAuth: { address: walletAddress, chainId: "0x1" },
      cache: createNftOwnedTokensCache(),
      now: 100_000,
    });
    assert.deepEqual(first.items, [
      { chainId: "0x1", contractAddress, tokenId: "0", name: "Token 0", image: "ipfs://image-0", subtitle: "Item 0" },
      { chainId: "0x1", contractAddress, tokenId: "1", name: "Token 1", image: "ipfs://image-1", subtitle: "Item 1" },
    ]);
    const callCountAfterFirst = calls.length;
    const cached = await fetchWalletOwnedExhibitTokens({
      walletAuth: { address: walletAddress, chainId: "0x1" },
      cache: first.cache,
      now: 110_000,
    });
    assert.deepEqual(cached.items, first.items);
    assert.notEqual(cached.items, first.cache.items);
    assert.equal(calls.length, callCountAfterFirst);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});

test("owned NFT lookup falls back to the configured token when enumeration is unavailable", async () => {
  const walletAddress = `0x${"ef".repeat(20)}`;
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  globalThis.window = {
    ethereum: {
      async request(request) {
        const data = request.params[0].data;
        if (data.startsWith("0x01ffc9a7")) throw new Error("Unsupported");
        if (data.startsWith("0x6352211e")) return `0x${"0".repeat(24)}${walletAddress.slice(2)}`;
        if (data.startsWith("0xc87b56dd")) {
          const uri = "https://example.com/fallback.json";
          const uriHex = Array.from(new TextEncoder().encode(uri), (byte) => byte.toString(16).padStart(2, "0")).join("");
          return `0x${"0".repeat(62)}20${uri.length.toString(16).padStart(64, "0")}${uriHex.padEnd(128, "0")}`;
        }
        throw new Error(`Unexpected call: ${data}`);
      },
    },
  };
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return { name: "Fallback Token", image_url: "https://example.com/image.png" };
    },
  });

  try {
    const result = await fetchWalletOwnedExhibitTokens({
      walletAuth: { address: walletAddress, chainId: "0x1" },
      cache: createNftOwnedTokensCache(),
      now: 200_000,
    });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].tokenId, NFT_EXHIBIT_TARGET.tokenId);
    assert.equal(result.items[0].name, "Fallback Token");
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});
