import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 8787;
const DEFAULT_REBUILD_PORT = 8788;
const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const DEFAULT_REBUILD_CLIENT_ORIGINS = [
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];
const DEFAULT_HOST = "localhost";
const DEFAULT_NONCE_TTL_SECONDS = 60 * 5;
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOrigins(value) {
  if (!value) return [...DEFAULT_CLIENT_ORIGINS];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseMode(argv) {
  const inlineMode = argv.find((entry) => entry.startsWith("--mode="));
  if (inlineMode) return inlineMode.slice("--mode=".length);
  const modeIndex = argv.indexOf("--mode");
  return modeIndex >= 0 ? argv[modeIndex + 1] : "development";
}

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function createServerConfig({
  argv = process.argv.slice(2),
  env = process.env,
  rootDir = serverRoot,
} = {}) {
  const isRebuild = parseMode(argv) === "rebuild";
  const defaultOrigins = isRebuild ? DEFAULT_REBUILD_CLIENT_ORIGINS : DEFAULT_CLIENT_ORIGINS;
  const configuredOrigins = env.CLIENT_ORIGIN || env.CLIENT_ORIGINS || "";
  const defaultDataFile = path.join(rootDir, "data", isRebuild ? "rebuild/app.json" : "app.json");

  return Object.freeze({
    mode: isRebuild ? "rebuild" : "legacy",
    isRebuild,
    port: parseNumber(env.PORT, isRebuild ? DEFAULT_REBUILD_PORT : DEFAULT_PORT),
    host: env.HOST || DEFAULT_HOST,
    clientOrigins: configuredOrigins ? parseOrigins(configuredOrigins) : [...defaultOrigins],
    nonceTtlSeconds: parseNumber(env.NONCE_TTL_SECONDS, DEFAULT_NONCE_TTL_SECONDS),
    sessionTtlSeconds: parseNumber(env.SESSION_TTL_SECONDS, DEFAULT_SESSION_TTL_SECONDS),
    dataFile: env.DATA_FILE ? path.resolve(rootDir, env.DATA_FILE) : defaultDataFile,
  });
}

export const config = createServerConfig();
