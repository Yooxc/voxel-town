const DEFAULT_PORT = 8787;
const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
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

export const config = {
  port: parseNumber(process.env.PORT, DEFAULT_PORT),
  host: process.env.HOST || DEFAULT_HOST,
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN || process.env.CLIENT_ORIGINS || ""),
  nonceTtlSeconds: parseNumber(process.env.NONCE_TTL_SECONDS, DEFAULT_NONCE_TTL_SECONDS),
  sessionTtlSeconds: parseNumber(process.env.SESSION_TTL_SECONDS, DEFAULT_SESSION_TTL_SECONDS),
};
