import express from "express";

import { config } from "../config.js";
import { getSessionUser } from "../auth/service.js";
import { createPresenceService } from "../world/presenceService.js";

const LOCAL_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,96}$/;
const presenceService = createPresenceService();

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
}

function resolveIdentity(req) {
  const user = getSessionUser(getBearerToken(req));
  if (user) {
    return { id: `wallet:${user.walletAddress}`, name: user.nickname || "방문자" };
  }
  const clientId = String(req.body?.clientId ?? "");
  if (!config.isRebuild || !LOCAL_ID_PATTERN.test(clientId)) return null;
  return { id: `local:${clientId}`, name: String(req.body?.displayName ?? "방문자").slice(0, 20) };
}

export const presenceRouter = express.Router();

presenceRouter.post("/sync", (req, res) => {
  const identity = resolveIdentity(req);
  if (!identity) {
    res.status(401).json({ ok: false, error: "리빌딩 접속 정보가 필요합니다." });
    return;
  }
  const result = presenceService.sync({
    identity: identity.id,
    displayName: identity.name,
    player: req.body?.player,
    command: req.body?.command,
  });
  res.status(result.ok ? 200 : 409).json(result);
});

presenceRouter.post("/leave", (req, res) => {
  const identity = resolveIdentity(req);
  if (!identity) {
    res.status(401).json({ ok: false, error: "리빌딩 접속 정보가 필요합니다." });
    return;
  }
  res.json(presenceService.leave(identity.id));
});
