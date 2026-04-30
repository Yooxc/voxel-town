import { verifyMessage } from "ethers";

export function normalizeAddress(address) {
  return String(address || "").trim().toLowerCase();
}

export function isValidWalletAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(address || "").trim());
}

export function recoverSignerAddress(message, signature) {
  try {
    return normalizeAddress(verifyMessage(message, signature));
  } catch {
    return "";
  }
}
