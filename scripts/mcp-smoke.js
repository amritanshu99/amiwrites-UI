const assert = require("node:assert/strict");
const { Client, StreamableHTTPClientTransport } = require("@modelcontextprotocol/client");
const { outputs } = require("../server/mcp/schemas");
async function main() {
  const endpoint = process.argv[2] || "http://127.0.0.1:8787/mcp";
  const client = new Client({ name: "amiverse-smoke", version: "1.0.0" });
  try {
    const health = await fetch(new URL("/api/mcp-health", endpoint), { signal: AbortSignal.timeout(10000) });
    assert.equal(health.status, 200, "Health endpoint failed");
    assert.ok(health.headers.get("content-type")?.includes("application/json"), "Health endpoint returned non-JSON (possibly the SPA fallback). Deploy the MCP functions and verify Vercel routing.");
    assert.equal((await health.json()).status, "ok");
    console.log("PASS health");
    await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
    const { tools } = await client.listTools();
    assert.equal(tools.length, 7);
    assert.deepEqual(tools.map((tool) => tool.name).sort(), Object.keys(outputs).sort());
    for (const tool of tools) {
      assert.equal(tool.annotations?.readOnlyHint, true);
      assert.equal(tool.annotations?.destructiveHint, false);
      assert.deepEqual(tool._meta?.securitySchemes, [{ type: "noauth" }]);
      assert.ok(tool.inputSchema && tool.outputSchema);
    }
    console.log("PASS discovery: seven tools");
    async function call(name, args) {
      const result = await client.callTool({ name, arguments: args });
      assert.ok(!result.isError, name + " failed: " + JSON.stringify(result.content));
      assert.ok(result.structuredContent, name + " omitted structured content");
      console.log("PASS " + name);
      return outputs[name].parse(result.structuredContent);
    }
    const search = await call("search_amiverse", { query: "AI agents" });
    assert.equal(search.partial, false, "Article source unavailable: " + search.warnings.join(" "));
    const projects = await call("list_projects", { technology: "React" });
    assert.ok(projects.results.length > 0);
    assert.ok((await call("list_projects", { topic: "MERN" })).results.length > 0);
    await call("get_project", { slug: projects.results[0].slug });
    const missing = await client.callTool({ name: "get_project", arguments: { slug: "nonexistent-project" } });
    assert.equal(missing.isError, true);
    console.log("PASS missing project error");
    await call("get_profile", {});
    assert.ok((await call("get_skills", { category: "AI" })).skills.length > 0);
    const latest = await call("get_latest_content", { limit: 5 });
    assert.ok(latest.results.length > 0, "No dated public articles available for live article test");
    const article = await call("get_article", { slug: latest.results[0].slug });
    assert.equal(article.article.id, latest.results[0].id);
    assert.equal(article.article.url, latest.results[0].url);
    console.log("PASS live content smoke test");
  } finally { await client.close(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
