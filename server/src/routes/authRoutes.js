import express from "express";

import { createNonce, getSessionUser, updateNickname, verifyWalletLogin } from "../auth/service.js";

export const authRouter = express.Router();

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

authRouter.post("/nonce", (req, res) => {
  const result = createNonce(req.body?.address);
  if (!result.ok) {
    res.status(result.status).json({ ok: false, error: result.error });
    return;
  }
  res.json({ ok: true, ...result.payload });
});

authRouter.post("/verify", (req, res) => {
  const result = verifyWalletLogin(req.body ?? {});
  if (!result.ok) {
    res.status(result.status).json({ ok: false, error: result.error });
    return;
  }
  res.json({ ok: true, ...result.payload });
});

authRouter.get("/me", (req, res) => {
  const token = getBearerToken(req);
  const user = getSessionUser(token);
  if (!user) {
    res.status(401).json({ ok: false, error: "세션이 유효하지 않습니다." });
    return;
  }
  res.json({ ok: true, user });
});

authRouter.patch("/nickname", (req, res) => {
  const token = getBearerToken(req);
  const result = updateNickname(token, req.body?.nickname);
  if (!result.ok) {
    res.status(result.status).json({ ok: false, error: result.error });
    return;
  }
  res.json({ ok: true, ...result.payload });
});
