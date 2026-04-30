const DEFAULT_PORT = 8787;
const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";
const DEFAULT_NONCE_TTL_SECONDS = 60 * 5;
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: parseNumber(process.env.PORT, DEFAULT_PORT),
  clientOrigin: process.env.CLIENT_ORIGIN || DEFAULT_CLIENT_ORIGIN,
  nonceTtlSeconds: parseNumber(process.env.NONCE_TTL_SECONDS, DEFAULT_NONCE_TTL_SECONDS),
  sessionTtlSeconds: parseNumber(process.env.SESSION_TTL_SECONDS, DEFAULT_SESSION_TTL_SECONDS),
};
