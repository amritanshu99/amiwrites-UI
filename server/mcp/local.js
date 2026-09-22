const http = require("node:http");
const { createHttpHandler } = require("./http");
const port = Number(process.env.MCP_PORT || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid MCP_PORT");
const handler = createHttpHandler();
const server = http.createServer(handler);
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(port, "127.0.0.1", () => console.log(JSON.stringify({ service: "amiverse-mcp", event: "listening", url: "http://127.0.0.1:" + port + "/mcp" })));
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
  server.close(() => handler.close().finally(() => process.exit(0)));
  setTimeout(() => { server.closeAllConnections(); process.exit(0); }, 10000).unref();
});
