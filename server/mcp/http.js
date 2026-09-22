const { randomUUID } = require("node:crypto");
const { createMcpHandler } = require("@modelcontextprotocol/server");
const { getConfig } = require("./config");
const { createServer, definitions } = require("./server");
const { createServices } = require("./services/search");
const MAX_BODY = 16 * 1024;
const toolNames = new Set(definitions.map(([name]) => name));
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" };
function json(response, status, value) {
  if (status >= 400 && response.req && !response.req.complete) response.setHeader("Connection", "close");
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(value));
}
async function readBody(request, timeoutMs) {
  // Vercel's Node runtime may already have parsed the JSON body.
  if (request.body !== undefined) {
    const raw = Buffer.isBuffer(request.body) ? request.body.toString("utf8") : typeof request.body === "string" ? request.body : JSON.stringify(request.body);
    if (Buffer.byteLength(raw) > MAX_BODY) throw Object.assign(new Error(), { status: 413 });
    return JSON.parse(raw);
  }
  // Event listeners let us reply before an unfinished upload closes its socket.
  const raw = await new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      request.off("data", onData);
      request.off("end", onEnd);
      request.off("error", onError);
      request.off("close", onClose);
      if (error) { request.pause(); reject(error); }
      else resolve(Buffer.concat(chunks).toString("utf8"));
    };
    const onData = (chunk) => {
      length += Buffer.byteLength(chunk);
      if (length > MAX_BODY) return finish(Object.assign(new Error(), { status: 413 }));
      chunks.push(Buffer.from(chunk));
    };
    const onEnd = () => finish();
    const onError = () => finish(Object.assign(new Error(), { status: 400 }));
    const onClose = () => { if (!request.complete) onError(); };
    const timer = setTimeout(() => finish(Object.assign(new Error(), { status: 408 })), timeoutMs);
    timer.unref();
    request.on("data", onData);
    request.once("end", onEnd);
    request.once("error", onError);
    request.once("close", onClose);
  });
  return JSON.parse(raw);
}
function resultFromWire(text, contentType) {
  try {
    if (contentType.includes("text/event-stream")) {
      const data = text.split("\n").filter((line) => line.startsWith("data: ")).map((line) => JSON.parse(line.slice(6)));
      return data.findLast((message) => message.result || message.error);
    }
    return JSON.parse(text);
  } catch { return undefined; }
}
function createHttpHandler({ config = getConfig(), services = createServices(config), logger = (event) => console.log(JSON.stringify(event)), now = Date.now } = {}) {
  const mcp = createMcpHandler(() => createServer(services), { responseMode: "auto", legacy: "stateless", maxSubscriptions: 0 });
  // Coarse per-instance ceiling; Vercel Firewall supplies fleet-wide limits.
  let windowStart = now();
  let count = 0;
  const handler = async (request, response) => {
    const requestId = randomUUID();
    const started = now();
    for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
    response.setHeader("X-Request-Id", requestId);
    const log = (event) => { try { logger({ service: "amiverse-mcp", requestId, durationMs: now() - started, ...event }); } catch { /* logging must not break requests */ } };
    let tool;
    try {
      const rawHost = request.headers.host || "";
      if (!/^(?:[a-z\d.-]+|\[[a-f\d:]+\])(?::\d{1,5})?$/i.test(rawHost)) return json(response, 403, { error: "Host not allowed" });
      const host = new URL("http://" + rawHost).hostname;
      if (!config.allowedHosts.includes(host)) return json(response, 403, { error: "Host not allowed" });
      const origin = request.headers.origin;
      if (origin && !config.allowedOrigins.includes(origin)) return json(response, 403, { error: "Origin not allowed" });
      if (origin) { response.setHeader("Access-Control-Allow-Origin", origin); response.setHeader("Vary", "Origin"); }
      response.setHeader("Access-Control-Expose-Headers", "X-Request-Id,MCP-Protocol-Version");
      const path = new URL(request.url, "http://localhost").pathname;
      if (["/health", "/api/mcp-health"].includes(path)) {
        if (request.method !== "GET") return json(response, 405, { error: "Method not allowed" });
        return json(response, 200, { status: "ok", service: "amiverse-mcp" });
      }
      if (!["/mcp", "/api/mcp"].includes(path)) return json(response, 404, { error: "Not found" });
      if (request.method === "OPTIONS") {
        response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,MCP-Protocol-Version,MCP-Session-Id");
        response.statusCode = 204; return response.end();
      }
      if (request.method !== "POST") {
        response.setHeader("Allow", "POST,OPTIONS");
        return json(response, 405, { error: "Use Streamable HTTP POST; this server has no persistent sessions." });
      }
      if (now() - windowStart >= 60000) { count = 0; windowStart = now(); }
      if (++count > config.rateLimit) {
        response.setHeader("Retry-After", String(Math.max(1, Math.ceil((windowStart + 60000 - now()) / 1000))));
        log({ event: "rate_limit", success: false });
        return json(response, 429, { error: "Too many requests" });
      }
      if (!/^application\/json(?:;|$)/i.test(request.headers["content-type"] || "")) return json(response, 415, { error: "Content-Type must be application/json" });
      if (Number(request.headers["content-length"]) > MAX_BODY) return json(response, 413, { error: "Request too large" });
      const body = await readBody(request, config.bodyTimeoutMs);
      if (!body || Array.isArray(body) || typeof body !== "object") return json(response, 400, { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Expected one JSON-RPC object" } });
      tool = body.method === "tools/call" ? (toolNames.has(body.params?.name) ? body.params.name : "unknown") : undefined;
      const requestHeaders = new Headers();
      for (const key of ["content-type", "accept", "mcp-protocol-version", "mcp-session-id"]) {
        if (typeof request.headers[key] === "string") requestHeaders.set(key, request.headers[key]);
      }
      const webResponse = await mcp.fetch(new Request("https://www.amiverse.in/api/mcp", { method: "POST", headers: requestHeaders, body: JSON.stringify(body) }));
      const text = await webResponse.text();
      const wire = resultFromWire(text, webResponse.headers.get("content-type") || "");
      const result = wire?.result;
      const data = result?.structuredContent;
      log({ event: tool ? "tool_call" : "protocol_request", ...(tool ? { tool } : {}), success: webResponse.ok && !wire?.error && !result?.isError, resultCount: data?.results?.length ?? data?.skills?.length ?? (data ? 1 : 0), partial: data?.partial === true });
      response.statusCode = webResponse.status;
      for (const [key, value] of webResponse.headers) response.setHeader(key, value);
      response.end(text);
    } catch (error) {
      log({ event: tool ? "tool_call" : "request_error", ...(tool ? { tool } : {}), success: false, resultCount: 0 });
      if (response.destroyed) return;
      if (!response.headersSent) {
        if (!request.complete) response.setHeader("Connection", "close");
        json(response, error.status || (error instanceof SyntaxError ? 400 : 500), { error: error.status === 413 ? "Request too large" : error.status === 408 ? "Request body timed out" : error instanceof SyntaxError ? "Invalid JSON" : "Unable to process MCP request" });
      } else response.end();
    }
  };
  handler.close = () => mcp.close();
  return handler;
}
module.exports = { createHttpHandler };
