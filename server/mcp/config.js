const { z } = require("zod");

const DEFAULT_API_ORIGIN = "https://amiwrites-backend-app-2lp5.onrender.com";
const SITE_URL = "https://www.amiverse.in";

function getConfig(env = process.env) {
  const origin = new URL(env.MCP_CONTENT_API_ORIGIN || DEFAULT_API_ORIGIN);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/" ||
      (origin.protocol !== "https:" && !(local && origin.protocol === "http:" && env.NODE_ENV !== "production"))) {
    throw new Error("MCP_CONTENT_API_ORIGIN must be an HTTPS origin (HTTP loopback is allowed in development).");
  }
  const number = (value, fallback, min, max) => z.coerce.number().int().min(min).max(max).parse(value || fallback);
  const allowedHosts = (env.MCP_ALLOWED_HOSTS || "www.amiverse.in,amiverse.in,mcp.amiverse.in,localhost,127.0.0.1,[::1]").split(",").map((s) => s.trim());
  // Trust exact platform-provided deployment hosts, never request headers or a wildcard.
  if (env.VERCEL === "1") {
    for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) {
      if (host && /^[a-z\d](?:[a-z\d-]*[a-z\d])?\.vercel\.app$/i.test(host)) allowedHosts.push(host.toLowerCase());
    }
  }
  return {
    apiOrigin: origin.origin,
    timeoutMs: number(env.MCP_UPSTREAM_TIMEOUT_MS, 8000, 100, 10000),
    bodyTimeoutMs: number(env.MCP_BODY_TIMEOUT_MS, 5000, 100, 5000),
    cacheSeconds: number(env.MCP_CACHE_SECONDS, 60, 1, 300),
    rateLimit: number(env.MCP_RATE_LIMIT, 120, 1, 10000),
    allowedHosts: [...new Set(allowedHosts)],
    allowedOrigins: (env.MCP_ALLOWED_ORIGINS || "https://chatgpt.com,https://www.amiverse.in,https://amiverse.in,http://localhost:6274,http://127.0.0.1:6274").split(",").map((s) => s.trim()),
  };
}

module.exports = { getConfig, SITE_URL };
