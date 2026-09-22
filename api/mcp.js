const { createHttpHandler } = require("../server/mcp/http");
let handler;
module.exports = async (request, response) => {
  try {
    handler ||= createHttpHandler();
    return await handler(request, response);
  } catch {
    response.statusCode = 503;
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ error: "MCP service configuration unavailable" }));
  }
};
