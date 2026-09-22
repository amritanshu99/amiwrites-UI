const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");
const { Client, StreamableHTTPClientTransport } = require("@modelcontextprotocol/client");
const { getConfig } = require("../config");
const { createHttpHandler } = require("../http");
const { createServices, score } = require("../services/search");
const { createArticles } = require("../services/articles");
const { outputs } = require("../schemas");
const config = { ...getConfig({}), timeoutMs: 100, rateLimit: 1000 };
// Test-only API fixtures. Production reads the existing public API.
const blogs = [
  { _id: "a".repeat(24), slug: "ai-agents", title: "Building AI agents with React", content: "<h1>Agents</h1><p>RAG and transformers in practice.</p>", category: "AI", date: "2025-01-02T00:00:00Z" },
  { _id: "b".repeat(24), slug: "react-patterns", title: "React patterns", content: "<p>React content</p>", category: "Frontend", publishedAt: "2025-02-03T00:00:00Z", date: "2024-01-01T00:00:00Z" },
  { _id: "c".repeat(24), slug: "future", title: "Unpublished secret", content: "private", publishedAt: "2099-01-01T00:00:00Z" },
];
function fakeFetch(url) {
  const path = new URL(url).pathname;
  if (path === "/api/blogs/seo-index") return Promise.resolve(Response.json({ blogs }));
  const blog = blogs.find((b) => path === "/api/blogs/" + b._id);
  return Promise.resolve(Response.json(blog || {}, { status: blog ? 200 : 404 }));
}
const services = () => createServices(config, { fetchImpl: fakeFetch });
async function setup(t, options = {}) {
  const logs = [];
  const handler = createHttpHandler({ config, services: services(), logger: (log) => logs.push(log), ...options });
  const server = http.createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const endpoint = "http://127.0.0.1:" + server.address().port;
  const client = new Client({ name: "test", version: "1.0.0" });
  t.after(async () => { await client.close(); await handler.close(); server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });
  return { handler, endpoint, client, logs };
}
async function call(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  assert.ok(!result.isError, JSON.stringify(result));
  return outputs[name].parse(result.structuredContent);
}

test("official SDK client discovers and exercises all seven tools over HTTP", async (t) => {
  const { client, endpoint, logs } = await setup(t);
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint + "/mcp")));
  const { tools } = await client.listTools();
  assert.equal(tools.length, 7);
  for (const tool of tools) {
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
    assert.ok(tool.outputSchema);
    assert.deepEqual(tool._meta.securitySchemes, [{ type: "noauth" }]);
  }
  const search = await call(client, "search_amiverse", { query: "AI agents" });
  assert.equal(search.results[0].slug, "ai-agents");
  assert.equal(search.partial, false);
  const react = await call(client, "list_projects", { technology: "React" });
  assert.ok(react.results.some((p) => p.slug === "amibot"));
  const mern = await call(client, "list_projects", { topic: "MERN" });
  assert.ok(mern.results.some((p) => p.slug === "task-manager"));
  assert.equal((await call(client, "get_project", { slug: "amibot" })).project.title, "AmiBot");
  assert.equal((await client.callTool({ name: "get_project", arguments: { slug: "missing" } })).isError, true);
  const article = (await call(client, "get_article", { slug: "ai-agents" })).article;
  assert.ok(article.excerpt.includes("transformers"));
  assert.ok(!article.excerpt.includes("<p>"));
  assert.ok(article.url.endsWith(blogs[0]._id));
  assert.equal((await call(client, "get_article", { slug: blogs[0]._id })).article.slug, "ai-agents");
  const profile = (await call(client, "get_profile", {})).profile;
  assert.equal(profile.name, "Amritanshu Mishra");
  assert.ok(!("email" in profile));
  assert.ok(!("phone" in profile));
  assert.equal((await call(client, "get_skills", { category: "ai" })).skills.length, 2);
  assert.equal((await call(client, "get_skills", { category: "Cloud" })).skills.length, 0);
  const latest = await call(client, "get_latest_content", { limit: 5 });
  assert.equal(latest.results[0].slug, "react-patterns");
  assert.ok(!latest.results.some((a) => a.slug === "future"));
  assert.equal((await call(client, "get_latest_content", { type: "project" })).results.length, 0);
  assert.ok(logs.some((log) => log.tool === "search_amiverse" && log.success && log.resultCount > 0));
  for (const log of logs) { assert.ok(log.requestId); assert.equal(typeof log.durationMs, "number"); }
  assert.ok(!JSON.stringify(logs).includes("AI agents"));
});

test("2025 Streamable HTTP initialization and stateless tool calls remain supported", async (t) => {
  const { endpoint } = await setup(t);
  const post = (body) => fetch(endpoint + "/api/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25" }, body: JSON.stringify(body) });
  const init = await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "legacy", version: "1" } } });
  assert.equal(init.status, 200);
  assert.match(await init.text(), /amiverse/);
  const result = await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_profile", arguments: {} } });
  assert.match(await result.text(), /Amritanshu Mishra/);
});

test("invalid, empty, extra, oversized, and malicious arguments are rejected", async (t) => {
  const { client, endpoint } = await setup(t);
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint + "/mcp")));
  for (const [name, args] of [
    ["search_amiverse", {}], ["search_amiverse", { query: " " }], ["search_amiverse", { query: "x".repeat(201) }],
    ["search_amiverse", { query: {} }], ["search_amiverse", { query: "!!!" }], ["get_profile", { admin: true }],
    ["list_projects", { topic: "!!!" }], ["list_projects", { technology: "---" }],
    ["list_projects", { limit: 21 }], ["list_projects", { limit: 0 }], ["list_projects", { limit: "5" }],
    ["get_project", { slug: "../../.env" }], ["get_article", { slug: "https://evil.example" }],
    ["get_latest_content", { type: "private" }],
  ]) {
    const result = await client.callTool({ name, arguments: args });
    assert.equal(result.isError, true, name + JSON.stringify(args));
  }
  assert.equal((await call(client, "list_projects", {})).results.length, 7);
  assert.equal((await call(client, "search_amiverse", { query: "no-such-technology-zzzz" })).results.length, 0);
  for (const slug of ["missing", "future", blogs[2]._id]) assert.equal((await client.callTool({ name: "get_article", arguments: { slug } })).isError, true);
});

test("upstream errors are sanitized; search declares partial results; static tools work", async (t) => {
  const broken = createServices(config, { fetchImpl: async () => { throw new Error("mongodb://private:password@db.internal"); } });
  const { client, endpoint } = await setup(t, { services: broken });
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint + "/mcp")));
  const search = await call(client, "search_amiverse", { query: "React" });
  assert.equal(search.partial, true);
  assert.ok(search.warnings.length);
  assert.ok(search.results.length);
  const failed = await client.callTool({ name: "get_latest_content", arguments: {} });
  assert.equal(failed.isError, true);
  assert.ok(!JSON.stringify(failed).includes("password"));
  await call(client, "get_profile", {});
});

test("unexpected service failure returns a generic tool error", async (t) => {
  const broken = { ...services(), getProfile: () => { throw new Error("secret-token"); } };
  const { client, endpoint } = await setup(t, { services: broken });
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint + "/mcp")));
  const failed = await client.callTool({ name: "get_profile", arguments: {} });
  assert.equal(failed.isError, true);
  assert.ok(!JSON.stringify(failed).includes("secret-token"));
});

test("HTTP guardrails, health, CORS, malformed JSON and payload bounds", async (t) => {
  const { endpoint } = await setup(t);
  assert.deepEqual(await (await fetch(endpoint + "/health")).json(), { status: "ok", service: "amiverse-mcp" });
  assert.equal((await fetch(endpoint + "/mcp")).status, 405);
  assert.equal((await fetch(endpoint + "/mcp", { method: "DELETE" })).status, 405);
  assert.equal((await fetch(endpoint + "/mcp", { headers: { Origin: "https://evil.example" } })).status, 403);
  const badHostStatus = await new Promise((resolve, reject) => { const req = http.get(endpoint + "/health", { headers: { Host: "evil.example" } }, (res) => { res.resume(); resolve(res.statusCode); }); req.on("error", reject); });
  assert.equal(badHostStatus, 403);
  const cors = await fetch(endpoint + "/mcp", { method: "OPTIONS", headers: { Origin: "https://chatgpt.com" } });
  assert.equal(cors.status, 204);
  assert.equal(cors.headers.get("access-control-allow-origin"), "https://chatgpt.com");
  assert.equal(cors.headers.get("x-content-type-options"), "nosniff");
  const post = (body, headers = {}) => fetch(endpoint + "/mcp", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body });
  assert.equal((await post("{" )).status, 400);
  assert.equal((await post("[]")).status, 400);
  assert.equal((await post("{}", { "Content-Type": "text/plain" })).status, 415);
  assert.equal((await post("x".repeat(17000))).status, 413);
  assert.equal((await fetch(endpoint + "/unknown")).status, 404);
});

test("rate limiting resets after a minute and health stays reachable", async (t) => {
  let clock = 0;
  const { endpoint } = await setup(t, { config: { ...config, rateLimit: 1 }, now: () => clock });
  const post = () => fetch(endpoint + "/mcp", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  await post();
  const limited = await post();
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.get("retry-after"));
  assert.equal((await fetch(endpoint + "/health")).status, 200);
  clock = 60001;
  assert.notEqual((await post()).status, 429);
});

test("article index coalesces concurrent reads and expires without caching failures", async () => {
  let count = 0;
  let clock = 0;
  const article = createArticles(config, { now: () => clock, fetchImpl: async (url) => { count++; return fakeFetch(url); } });
  await Promise.all([article.list(), article.list(), article.list()]);
  assert.equal(count, 1);
  clock = config.cacheSeconds * 1000 + 1;
  await article.list();
  assert.equal(count, 2);
});

test("bounded fallback handles an older deployed API and excludes future content", async () => {
  const calls = [];
  const article = createArticles(config, { fetchImpl: async (url) => {
    calls.push(url);
    if (url.endsWith("seo-index")) return Response.json({}, { status: 404 });
    return Response.json({ blogs, hasMore: false });
  } });
  const index = await article.list();
  assert.equal(index.results.length, 2);
  assert.equal(calls.length, 2);
  assert.equal(index.truncated, false);
});

test("upstream validation, DB 500, body size and timeout failures fail safely", async () => {
  for (const fetchImpl of [
    async () => Response.json({ error: "db credentials" }, { status: 500 }),
    async () => Response.json({ blogs: [{ _id: "bad" }] }),
    async () => new Response("x".repeat(4 * 1024 * 1024 + 1), { headers: { "Content-Type": "application/json" } }),
    async (_url, { signal }) => new Promise((_resolve, reject) => { const timer = setTimeout(() => reject(new Error("timeout")), 300); signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true }); }),
  ]) await assert.rejects(createArticles(config, { fetchImpl }).list(), { code: "CONTENT_UNAVAILABLE" });
});

test("article details recheck publication and truncate lengthy bodies", async () => {
  const fetchImpl = async (url) => url.endsWith("seo-index") ? fakeFetch(url) : Response.json({ ...blogs[0], content: "<p>" + "word ".repeat(2000) + "</p>", email: "not-public" });
  const article = await createArticles(config, { fetchImpl }).get("ai-agents");
  assert.equal(article.excerpt.length, 6000);
  assert.equal(article.truncated, true);
  assert.ok(!JSON.stringify(article).includes("not-public"));
  const unpublished = createArticles(config, { fetchImpl: async (url) => url.endsWith("seo-index") ? fakeFetch(url) : Response.json({ ...blogs[0], publishedAt: "2099-01-01" }) });
  await assert.rejects(unpublished.get("ai-agents"), { code: "NOT_FOUND" });
});

test("title and technology matches outrank summary-only matches", () => {
  const base = { title: "Other", tags: [], summary: "React" };
  assert.ok(score({ ...base, title: "React" }, "React") > score(base, "React"));
  assert.ok(score({ ...base, tags: ["React"] }, "React") > score(base, "React"));
});

test("configuration rejects unsafe origins and invalid limits", () => {
  for (const origin of ["file:///etc", "http://evil.example", "https://user:pass@example.com", "https://example.com/path"]) assert.throws(() => getConfig({ MCP_CONTENT_API_ORIGIN: origin }));
  assert.throws(() => getConfig({ MCP_RATE_LIMIT: "no" }));
  assert.throws(() => getConfig({ MCP_UPSTREAM_TIMEOUT_MS: "10001" }));
  assert.throws(() => getConfig({ MCP_BODY_TIMEOUT_MS: "5001" }));
});


test("Vercel pre-parsed body works through the production entrypoint", async (t) => {
  const productionHandler = require("../../../api/mcp");
  const server = http.createServer((request, response) => {
    request.body = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_profile", arguments: {} } };
    return productionHandler(request, response);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => { server.closeAllConnections(); server.close(); });
  const response = await fetch("http://127.0.0.1:" + server.address().port + "/api/mcp", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25" }, body: "{}",
  });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Amritanshu Mishra/);
});

test("OpenAI domain challenge returns only the configured token and otherwise fails closed", () => {
  const verification = require("../../../api/mcp-verification");
  const original = process.env.OPENAI_APPS_CHALLENGE_TOKEN;
  const response = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(value) { this.body = value; } });
  try {
    delete process.env.OPENAI_APPS_CHALLENGE_TOKEN;
    let res = response(); verification({ method: "GET" }, res); assert.equal(res.statusCode, 404);
    process.env.OPENAI_APPS_CHALLENGE_TOKEN = "test-verification-token";
    res = response(); verification({ method: "GET" }, res);
    assert.equal(res.statusCode, 200); assert.equal(res.body, "test-verification-token");
    assert.equal(res.headers["Cache-Control"], "no-store");
    res = response(); verification({ method: "POST" }, res); assert.equal(res.statusCode, 405);
  } finally {
    if (original === undefined) delete process.env.OPENAI_APPS_CHALLENGE_TOKEN;
    else process.env.OPENAI_APPS_CHALLENGE_TOKEN = original;
  }
});

test("deployment routes reach MCP before the existing SPA fallback", () => {
  const deployment = require("../../../vercel.json");
  const fallback = deployment.rewrites.findIndex((route) => route.source === "/(.*)");
  for (const path of ["/api/mcp", "/api/mcp-health", "/health", "/.well-known/openai-apps-challenge"]) {
    const index = deployment.rewrites.findIndex((route) => route.source === path);
    assert.ok(index >= 0 && index < fallback, path);
  }
});


test("chunked oversized bodies get a 413 response without a socket reset", async (t) => {
  const { endpoint } = await setup(t);
  const status = await new Promise((resolve, reject) => {
    const request = http.request(endpoint + "/mcp", { method: "POST", headers: { "Content-Type": "application/json" } }, (response) => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on("error", reject);
    request.setTimeout(2000, () => request.destroy(new Error("Request hung")));
    t.after(() => request.destroy());
    request.write("x".repeat(17000)); // Do not end: reject before the upload finishes.
  });
  assert.equal(status, 413);
});

test("stalled bodies time out while health remains available", async (t) => {
  const { endpoint } = await setup(t, { config: { ...config, bodyTimeoutMs: 100 } });
  const status = await new Promise((resolve, reject) => {
    const request = http.request(endpoint + "/mcp", { method: "POST", headers: { "Content-Type": "application/json" } }, (response) => {
      response.resume();
      resolve(response.statusCode);
    });
    t.after(() => request.destroy());
    request.on("error", reject);
    request.setTimeout(2000, () => request.destroy(new Error("Body deadline was not enforced")));
    request.write("{");
  });
  assert.equal(status, 408);
  assert.equal((await fetch(endpoint + "/health")).status, 200);
});

test("invalid tool arguments cannot bypass JSON-RPC envelope or transport validation", async (t) => {
  const { endpoint, logs } = await setup(t);
  const params = { name: "search_amiverse", arguments: { query: "" } };
  const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25" };
  for (const body of [
    { id: 1, method: "tools/call", params },
    { jsonrpc: "wrong", id: 1, method: "tools/call", params },
    { jsonrpc: "2.0", id: {}, method: "tools/call", params },
  ]) {
    const response = await fetch(endpoint + "/mcp", { method: "POST", headers, body: JSON.stringify(body) });
    assert.equal(response.status, 400);
    assert.ok(!(await response.text()).includes("Invalid tool arguments"));
  }
  const wrongAccept = await fetch(endpoint + "/mcp", { method: "POST", headers: { ...headers, Accept: "text/html" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params }) });
  assert.equal(wrongAccept.status, 406);
  const invalid = await fetch(endpoint + "/mcp", { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_profile", arguments: { "secret-marker": true } } }) });
  const errorText = await invalid.text();
  assert.match(errorText, /Invalid tool arguments/);
  assert.ok(!errorText.includes("secret-marker"));
  assert.ok(!JSON.stringify(logs).includes("secret-marker"));
});

test("article aliases stay unambiguous and an ID cannot be shadowed by another slug", async () => {
  const records = [
    { ...blogs[0], slug: blogs[1]._id },
    blogs[1],
    { ...blogs[0], _id: "d".repeat(24), slug: "duplicate" },
    { ...blogs[1], _id: "e".repeat(24), slug: "duplicate" },
  ];
  const article = createArticles(config, { fetchImpl: async (url) => url.endsWith("seo-index") ? Response.json({ blogs: records }) : Response.json(records.find((blog) => url.endsWith(blog._id))) });
  const index = await article.list();
  assert.equal(index.results[0].slug, records[0]._id);
  assert.equal(new Set(index.results.map((record) => record.slug)).size, records.length);
  assert.equal((await article.get(blogs[1]._id)).id, blogs[1]._id);
  await assert.rejects(article.get("duplicate"), { code: "NOT_FOUND" });
  for (const record of index.results) {
    const detail = await article.get(record.slug);
    assert.equal(detail.id, record.id);
    assert.equal(detail.slug, record.slug);
  }
});


test("raw discovery advertises both OpenAI authentication metadata locations", async (t) => {
  const { endpoint } = await setup(t);
  // The generic SDK client strips extension fields. Inspect the actual wire data.
  const response = await fetch(endpoint + "/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) });
  assert.equal(response.status, 200);
  const raw = await response.text();
  const wire = response.headers.get("content-type").includes("text/event-stream") ? JSON.parse(raw.split("\n").find((line) => line.startsWith("data: ")).slice(6)) : JSON.parse(raw);
  assert.equal(wire.result.tools.length, 7);
  for (const tool of wire.result.tools) {
    assert.deepEqual(tool.securitySchemes, [{ type: "noauth" }]);
    assert.deepEqual(tool._meta.securitySchemes, tool.securitySchemes);
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(tool.outputSchema.type, "object");
  }
});


test("Vercel discovery allows only exact deployment hosts supplied by the platform", async (t) => {
  const preview = getConfig({ VERCEL: "1", VERCEL_URL: "amiverse-preview-123.vercel.app", VERCEL_BRANCH_URL: "amiverse-git-mcp.vercel.app" });
  assert.ok(preview.allowedHosts.includes("amiverse-preview-123.vercel.app"));
  assert.ok(preview.allowedHosts.includes("amiverse-git-mcp.vercel.app"));
  assert.ok(!getConfig({ VERCEL_URL: "amiverse-preview-123.vercel.app" }).allowedHosts.includes("amiverse-preview-123.vercel.app"));
  for (const host of ["*.vercel.app", "vercel.app.evil.example", "https://amiverse.vercel.app", "evil.vercel.app/path", "evil.example"]) {
    assert.ok(!getConfig({ VERCEL: "1", VERCEL_URL: host }).allowedHosts.includes(host));
  }
  const { endpoint } = await setup(t, { config: { ...preview, rateLimit: 1000 } });
  async function status(host) {
    return new Promise((resolve, reject) => { const request = http.get(endpoint + "/health", { headers: { Host: host } }, (response) => { response.resume(); resolve(response.statusCode); }); request.on("error", reject); });
  }
  assert.equal(await status("amiverse-preview-123.vercel.app"), 200);
  assert.equal(await status("different-project.vercel.app"), 403);
});
