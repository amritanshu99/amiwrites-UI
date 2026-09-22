# Amiverse MCP release status

Updated 2026-09-22. Implementation and local verification are complete. The release branch is pushed and Vercel preview deployment succeeded. Authenticated endpoint verification, production deployment and OpenAI publication remain incomplete.

## Release target

- Source repository: https://github.com/amritanshu99/amiwrites-UI
- Existing Vercel team/project: amritanshu-mishras-projects/amiwrites-ui
- Production MCP URL after deployment: https://www.amiverse.in/api/mcp
- Baseline: 359b071224c6b96aac068abecd2412c5c6d907bb, confirmed as current remote main and the most recent successful production deployment in GitHub's deployment records.
- Release branch: codex/amiverse-mcp-release; implementation commit: 3b48f9e6c6e03ff696dc9a5c6163798befc1ed70.
- Successful preview code/config commit: f3a9eb398ee9802eb7b6d837fc0f1b9a2094f667. Deployment: https://vercel.com/amritanshu-mishras-projects/amiwrites-ui/6KuwKw7JMqeLCx376XsTvFHffi5k.
- Preview URL: https://amiwrites-c9vb9ah22-amritanshu-mishras-projects.vercel.app. GitHub deployment record 6590201560 reports success.
- Do not change production aliases until the preview MCP endpoint and existing website pass deployment checks.

## Completed

- Seven read-only MCP tools, strict runtime schemas, bounded public-data services, protocol/security regression tests, deployment routes and domain-challenge handler.
- 22 MCP tests and MCP lint passed. The website's 224 tests, 9 SEO/loader tests, Inspector and real-data local smoke test passed during implementation.
- Production build passed with CI=true, including 17 static SEO routes and 11 blog routes.
- Exact trusted Vercel deployment/branch host support; arbitrary vercel.app hosts remain rejected.
- Deployment upload exclusions for credentials, caches, logs and unrelated notes; local Vercel configuration is ignored by Git. The tracked .env.production is explicitly retained because it contains existing public frontend configuration and CRA build flags. The subsequent Git preview succeeded after this fix; unavailable build logs prevent confirming the initial failure cause.
- Public privacy-policy text describes MCP arguments, public data, application logs, hosting logs and public-index caching.
- ChatGPT developer mode was enabled. A New Plugin form was prepared with Amiverse's name, description, production URL and No Auth. It was not submitted because the endpoint is not live.
- Listing text, starter prompts, eight positive cases and four negative cases are in amiverse-plugin-review.json.

## Observed access and endpoint state

- Vercel's connected app returns no teams. Its project lookup also has mismatched connector/server parameter schemas. No local Vercel authentication is available.
- GitHub CLI reports an invalid token, but normal Git Credential Manager authentication works: the release branch was successfully pushed. Main remains unchanged.
- OpenAI Platform is signed in to AmiVerse. Creating an MCP plugin is blocked by the portal until Individual or Business identity verification is complete. The verification page is open at https://platform.openai.com/settings/organization/general. No plugin draft has been created.
- The first preview dpl_89WWKSripHks4pCHeuBNyXxfkfeV failed; the subsequent preview above succeeded. Build-logs connector returns Tool not found.
- Successful preview GET /api/mcp-health redirects to Vercel SSO (302). The Vercel protected-URL fetch connector also fails with 403. Obtain authenticated access before endpoint smoke tests; preserve preview protection.
- Chrome fallback authorization has been requested because the browser skill requires explicit approval when connector/CLI authentication is unavailable. No Vercel browser fallback has been used.
- Production GET /api/mcp-health still returned HTML rather than MCP health JSON on 2026-09-22. The new functions are not serving production.
- Automatic approval review rejected an unspecified deployment action because no exact Vercel team/project or environment was provided. The exact target above was subsequently established from public GitHub deployment metadata. Any deployment retry must explicitly target a preview of that project.

## Remaining work

1. Authenticate Vercel locally with npx vercel@59.23.2 login, or reconnect the Vercel app to the owning team. Do not paste tokens into chat. If the normal configuration directory is unavailable, the CLI supports --global-config .codex-tmp/vercel-config; use the same flag for subsequent commands.
2. Link only amiwrites-ui in amritanshu-mishras-projects if CLI access is restored. Inspect current variables and build configuration before changing them. The source preview already built successfully; inspect the earlier failure logs if available.
3. Verify the successful preview above using authorized Vercel access. Preserve preview protection. Verify health, discovery, all tool responses and existing website pages. The public endpoint smoke command is npm run mcp:smoke -- https://<deployment-host>/api/mcp.
4. Verify production environment values before promotion. Prefer a staged production build with --prod --skip-domain, validate that deployment, then promote the same artifact. Configure the narrowly scoped edge rate limit described in AMIVERSE_MCP.md.
5. Complete the prepared ChatGPT connection after production smoke passes. Run the supplied conversational evaluation cases and record actual tool selections and source links.
6. The owner must complete publisher identity verification for AmiVerse. Then create the MCP plugin at https://platform.openai.com/plugins, complete domain challenge, listing and tool scan, and submit for review. Publish after approval.

OpenAI approval and identity verification are external steps; local tests cannot establish publication or conversational tool selection. See AMIVERSE_MCP.md and MCP_VERIFICATION.md for implementation and validation details.
