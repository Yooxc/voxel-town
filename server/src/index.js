import express from "express";
import cors from "cors";

import { config } from "./config.js";
import { store } from "./db/store.js";
import { authRouter } from "./routes/authRoutes.js";
import { worldRouter } from "./routes/worldRoutes.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (config.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "voxel-town-server",
    storage: store.filePath,
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRouter);
app.use("/world", worldRouter);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: `알 수 없는 경로입니다: ${req.method} ${req.originalUrl}`,
  });
});

app.listen(config.port, config.host, () => {
  console.log(`voxel-town auth server listening on http://${config.host}:${config.port}`);
  console.log(`allowed client origins: ${config.clientOrigins.join(", ")}`);
  console.log(`storage file: ${store.filePath}`);
});
