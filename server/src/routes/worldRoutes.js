import express from "express";

import { applyWastelandWorldAction, getWastelandWorld } from "../world/wastelandService.js";

export const worldRouter = express.Router();

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
}

worldRouter.get("/wasteland", (req, res) => {
  const result = getWastelandWorld(getBearerToken(req));
  if (!result.ok) {
    res.status(result.status).json({ ok: false, error: result.error, ...(result.payload ?? {}) });
    return;
  }
  res.json({ ok: true, ...result.payload });
});

worldRouter.post("/wasteland/actions", (req, res) => {
  const result = applyWastelandWorldAction(getBearerToken(req), req.body ?? {});
  if (!result.ok) {
    res.status(result.status).json({ ok: false, error: result.error, ...(result.payload ?? {}) });
    return;
  }
  res.json({ ok: true, ...result.payload });
});
