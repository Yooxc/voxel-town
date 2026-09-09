import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { createServerConfig } from "../server/src/config.js";

const rootDir = path.resolve("server");

test("legacy server environment preserves its port, origin, and data file", () => {
  const config = createServerConfig({ argv: [], env: {}, rootDir });

  assert.equal(config.mode, "legacy");
  assert.equal(config.port, 8787);
  assert.deepEqual(config.clientOrigins, [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
  assert.equal(config.dataFile, path.join(rootDir, "data", "app.json"));
});

test("rebuild server environment uses an isolated port, origin, and data file", () => {
  const config = createServerConfig({ argv: ["--mode=rebuild"], env: {}, rootDir });

  assert.equal(config.mode, "rebuild");
  assert.equal(config.port, 8788);
  assert.deepEqual(config.clientOrigins, [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ]);
  assert.equal(config.dataFile, path.join(rootDir, "data", "rebuild", "app.json"));
});

test("explicit server settings override rebuild defaults", () => {
  const config = createServerConfig({
    argv: ["--mode", "rebuild"],
    env: {
      PORT: "9000",
      CLIENT_ORIGINS: "http://localhost:6000,http://127.0.0.1:6000",
      DATA_FILE: "data/custom/app.json",
    },
    rootDir,
  });

  assert.equal(config.port, 9000);
  assert.deepEqual(config.clientOrigins, [
    "http://localhost:6000",
    "http://127.0.0.1:6000",
  ]);
  assert.equal(config.dataFile, path.join(rootDir, "data", "custom", "app.json"));
});
