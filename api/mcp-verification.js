// The token is supplied by the OpenAI submission portal, not generated here.
module.exports = (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  if (request.method !== "GET") { response.statusCode = 405; response.setHeader("Allow", "GET"); return response.end(); }
  const token = process.env.OPENAI_APPS_CHALLENGE_TOKEN;
  if (!token || token.length > 4096 || /[\r\n]/.test(token)) { response.statusCode = 404; return response.end(); }
  response.statusCode = 200;
  response.end(token);
};
