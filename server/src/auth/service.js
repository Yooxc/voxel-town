import crypto from "node:crypto";

import { config } from "../config.js";
import { store } from "../db/store.js";
import { buildWalletLoginMessage } from "./message.js";
import { isValidWalletAddress, normalizeAddress, recoverSignerAddress } from "./wallet.js";

function nowIso() {
  return new Date().toISOString();
}

function expiresAtFromSeconds(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function issueToken() {
  return crypto.randomUUID();
}

function cleanupExpiredRecords(state) {
  const now = Date.now();
  state.nonces = state.nonces.filter((entry) => Date.parse(entry.expiresAt) > now && !entry.used);
  state.sessions = state.sessions.filter((entry) => Date.parse(entry.expiresAt) > now);
}

export function createNonce(address) {
  if (!isValidWalletAddress(address)) {
    return {
      ok: false,
      status: 400,
      error: "유효한 지갑 주소가 아닙니다.",
    };
  }

  const normalizedAddress = normalizeAddress(address);
  const nonce = crypto.randomUUID();
  const issuedAt = nowIso();
  const message = buildWalletLoginMessage(address, nonce, issuedAt);
  const expiresAt = expiresAtFromSeconds(config.nonceTtlSeconds);

  store.mutate((state) => {
    cleanupExpiredRecords(state);
    state.nonces = state.nonces.filter((entry) => entry.walletAddress !== normalizedAddress);
    state.nonces.push({
      walletAddress: normalizedAddress,
      nonce,
      issuedAt,
      expiresAt,
      message,
      used: false,
      createdAt: issuedAt,
    });
    return state;
  });

  return {
    ok: true,
    payload: {
      address,
      nonce,
      issuedAt,
      expiresAt,
      message,
    },
  };
}

export function verifyWalletLogin({ address, nonce, signature }) {
  if (!isValidWalletAddress(address)) {
    return { ok: false, status: 400, error: "유효한 지갑 주소가 아닙니다." };
  }
  if (!nonce || !signature) {
    return { ok: false, status: 400, error: "nonce와 signature가 필요합니다." };
  }

  const normalizedAddress = normalizeAddress(address);
  let sessionToken = "";
  let user = null;
  let chainSafeMessage = "";

  const resultState = store.mutate((state) => {
    cleanupExpiredRecords(state);
    const nonceEntry = state.nonces.find(
      (entry) => entry.walletAddress === normalizedAddress && entry.nonce === nonce
    );

    if (!nonceEntry) {
      state.__error = { status: 401, error: "nonce가 없거나 만료되었습니다." };
      return state;
    }

    if (nonceEntry.used) {
      state.__error = { status: 401, error: "이미 사용된 nonce입니다." };
      return state;
    }

    if (Date.parse(nonceEntry.expiresAt) <= Date.now()) {
      state.__error = { status: 401, error: "nonce가 만료되었습니다." };
      return state;
    }

    const recoveredAddress = recoverSignerAddress(nonceEntry.message, signature);
    if (!recoveredAddress || recoveredAddress !== normalizedAddress) {
      state.__error = { status: 401, error: "서명 검증에 실패했습니다." };
      return state;
    }

    nonceEntry.used = true;
    nonceEntry.usedAt = nowIso();
    chainSafeMessage = nonceEntry.message;

    const loginAt = nowIso();
    user = state.users.find((entry) => entry.walletAddress === normalizedAddress) ?? null;
    if (!user) {
      user = {
        walletAddress: normalizedAddress,
        nickname: "",
        createdAt: loginAt,
        lastLoginAt: loginAt,
      };
      state.users.push(user);
    } else {
      user.lastLoginAt = loginAt;
    }

    sessionToken = issueToken();
    state.sessions.push({
      token: sessionToken,
      walletAddress: normalizedAddress,
      createdAt: loginAt,
      expiresAt: expiresAtFromSeconds(config.sessionTtlSeconds),
    });

    return state;
  });

  if (resultState.__error) {
    return {
      ok: false,
      status: resultState.__error.status,
      error: resultState.__error.error,
    };
  }

  return {
    ok: true,
    payload: {
      token: sessionToken,
      message: chainSafeMessage,
      user,
    },
  };
}

export function getSessionUser(token) {
  if (!token) return null;
  const state = store.read();
  const session = state.sessions.find((entry) => entry.token === token);
  if (!session) return null;
  if (Date.parse(session.expiresAt) <= Date.now()) return null;
  return state.users.find((entry) => entry.walletAddress === session.walletAddress) ?? null;
}

export function updateNickname(token, nickname) {
  const trimmedNickname = String(nickname || "").trim();
  if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
    return { ok: false, status: 400, error: "닉네임은 2자 이상 12자 이하로 입력해주세요." };
  }
  if (!/^[A-Za-z0-9가-힣_]+$/.test(trimmedNickname)) {
    return { ok: false, status: 400, error: "닉네임은 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다." };
  }

  let updatedUser = null;
  const state = store.mutate((draft) => {
    cleanupExpiredRecords(draft);
    const session = draft.sessions.find((entry) => entry.token === token);
    if (!session) {
      draft.__error = { status: 401, error: "세션이 유효하지 않습니다." };
      return draft;
    }
    const user = draft.users.find((entry) => entry.walletAddress === session.walletAddress);
    if (!user) {
      draft.__error = { status: 404, error: "유저 정보를 찾을 수 없습니다." };
      return draft;
    }
    user.nickname = trimmedNickname;
    updatedUser = { ...user };
    return draft;
  });

  if (state.__error) {
    return {
      ok: false,
      status: state.__error.status,
      error: state.__error.error,
    };
  }

  return {
    ok: true,
    payload: {
      user: updatedUser,
    },
  };
}
