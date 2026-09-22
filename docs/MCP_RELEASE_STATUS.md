# Amiverse MCP release status

Updated 2026-09-22. Implementation and local verification are complete; public deployment and OpenAI publication are not yet complete.

## Release target

- Source repository: https://github.com/amritanshu99/amiwrites-UI
- Existing Vercel team/project: amritanshu-mishras-projects/amiwrites-ui
- Production MCP URL after deployment: https://www.amiverse.in/api/mcp
- Baseline: 359b071224c6b96aac068abecd2412c5c6d907bb, confirmed as current remote main and the most recent successful production deployment in GitHub's deployment records.
- The release should first use a separate preview branch. Do not change production aliases until its MCP endpoint and existing website pass deployment checks.

## Completed

- Seven read-only MCP tools, strict runtime schemas, bounded public-data services, protocol/security regression tests, deployment routes and domain-challenge handler.
- 22 MCP tests and MCP lint passed. The website's 224 tests, 9 SEO/loader tests, Inspector and real-data local smoke test passed during implementation.
- Production build passed with CI=true, including 17 static SEO routes and 11 blog routes.
- Exact trusted Vercel deployment/branch host support; arbitrary vercel.app hosts remain rejected.
- Deployment upload exclusions for credentials, caches, logs and unrelated notes; local Vercel configuration is ignored by Git.
- Public privacy-policy text describes MCP arguments, public data, application logs, hosting logs and public-index caching.
- ChatGPT developer mode was enabled. A New Plugin form was prepared with Amiverse's name, description, production URL and No Auth. It was not submitted because the endpoint is not live.
- Listing text, starter prompts, eight positive cases and four negative cases are in amiverse-plugin-review.json.

## Observed access and endpoint state

- Vercel's connected app returns no teams. Its project lookup also has mismatched connector/server parameter schemas. No local Vercel authentication is available.
- GitHub CLI reports an invalid token. Public GitHub reads work; that does not establish push access.
- OpenAI Platform's plugin submission portal requires sign-in. The separate ChatGPT browser session is signed in.
- Production GET /api/mcp-health returned HTML rather than MCP health JSON; POST /api/mcp returned 405. This confirms that the new functions were not serving production during the check.
- Automatic approval review rejected an unspecified deployment action because no exact Vercel team/project or environment was provided. The exact target above was subsequently established from public GitHub deployment metadata. Any deployment retry must explicitly target a preview of that project.

## Resume after access is available

1. Authenticate Vercel locally with npx vercel@59.23.2 login, or reconnect the Vercel app to the owning team. Do not paste tokens into chat. If the normal configuration directory is unavailable, the CLI supports --global-config .codex-tmp/vercel-config; use the same flag for subsequent commands.
2. Link only the existing ami writes UI project (Vercel project name: amiwrites-ui; team: amritanshu-mishras-projects). Inspect current production variables and build configuration before setting MCP values.
3. Deploy a preview from the reviewed release branch. Preserve preview access protection. Verify health, discovery, all tool responses and existing website pages. The public endpoint smoke command is npm run mcp:smoke -- https://<deployment-host>/api/mcp.
4. Verify production environment values before promotion. Prefer a staged production build with --prod --skip-domain, validate that deployment, then promote the same artifact. Configure the narrowly scoped edge rate limit described in AMIVERSE_MCP.md.
5. Complete the prepared ChatGPT connection after production smoke passes. Run the supplied conversational evaluation cases and record actual tool selections and source links.
6. Sign in to https://platform.openai.com/plugins using the publishing organization. Complete publisher verification, domain challenge, listing, tool scan and review submission. Publish after approval.

OpenAI approval and identity verification are external steps; local tests cannot establish publication or conversational tool selection. See AMIVERSE_MCP.md and MCP_VERIFICATION.md for implementation and validation details.
