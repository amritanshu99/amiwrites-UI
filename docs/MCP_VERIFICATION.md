# Verification record

Implementation rechecked 2026-09-21 on Windows PowerShell, Node 24.19.0, npm 11.17.0.

| Check | Observed result |
| --- | --- |
| npm install (initial implementation, 2026-09-20) | Passed; lockfile retains the original React/React DOM 19.1.0 and unrelated dependency versions |
| npm run lint | Passed for production JS/JSX, with 17 pre-existing warnings |
| npm run lint:mcp | Passed, including MCP tests and deployment entrypoints |
| npm run lint:all (initial implementation) | Existing website test files fail Testing Library rules; not an MCP regression |
| Static TypeScript typecheck | Not applicable: JavaScript repository with no TS application configuration; no TypeScript check claimed |
| npm run test:mcp | 22/22 passed: all seven tools over real HTTP, 2025 and current SDK compatibility, validation, missing content, API/DB-error simulation, timeouts, response limits, publication filtering, caching, security, Vercel parsed bodies, domain challenge, route ordering, stalled/chunked uploads, protocol validation order, raw authentication metadata, article identifier collisions and exact Vercel deployment hostname validation |
| npm test -- --watchAll=false --runInBand | 41 suites / 224 tests passed |
| npm run test:seo | 5/5 passed |
| npm run test:loader | 4/4 passed |
| npm run build | Passed; 17 static SEO routes and 11 blog routes generated |
| MCP Inspector 2.7.0 strict tools/list | Passed with exit code 0 in strict mode; no diagnostics reported |
| MCP Inspector list_projects(technology=React) (initial implementation) | Passed |
| npm run mcp:smoke | Passed against the local HTTP server using real public Amiverse data, including health, discovery, safety metadata, structured output contracts, all seven tools, nonempty MERN/React filters and AI skills, matching article ID/URL, and missing-project error |
| git diff --check | Passed |

The server fetched real content from the existing public Render API. No fixture results are used in production. Automated fixtures live only under server/mcp/tests. The smoke run returned five recent articles, read one by its returned slug, returned React/MERN projects, and produced non-partial search results.

Inspector is intentionally outside the application dependency tree. Its React/TUI dependencies initially caused a React version mismatch during implementation; that was corrected, unrelated upgrades were reverted, and website tests/build were rerun successfully.

The initial implementation dependency audit (2026-09-20) reported 91 findings in the existing application dependency tree (14 low, 41 moderate, 33 high, 3 critical). None is reported against @modelcontextprotocol/server, @modelcontextprotocol/core, @modelcontextprotocol/client or zod. No broad dependency upgrades were applied. Address the existing dependency findings in a separate maintenance review; a passing feature test does not resolve them.

## Follow-up fixes

The review reproduced five gaps before fixing them: missing top-level noauth metadata, no application deadline for stalled request bodies, early argument validation bypassing SDK envelope/Accept checks, punctuation-only project filters matching everything, and duplicate/colliding article aliases resolving ambiguously. The new regression tests pass after the fixes. Unfinished oversized uploads are also checked over real HTTP.

The maximum upstream timeout is now 10 seconds (default remains 8), and the body deadline is at most 5 seconds. This leaves headroom for an uncached index-plus-detail request within the configured 30-second Vercel function. Set the new optional MCP_BODY_TIMEOUT_MS only if a lower deadline is needed. No extra dependencies or unrelated website changes were introduced by this review.

## Remaining release steps

1. Commit the MCP implementation, deploy a Vercel preview with the documented server variables and exact allowed hostname, then run the smoke command against its /api/mcp endpoint. Verify real Vercel routing and function packaging there; local tests do not prove platform deployment behavior.
2. Promote the verified deployment and configure the documented edge rate limit. Keep the existing Render content API responsive.
3. Connect the production HTTPS endpoint in ChatGPT developer mode and record actual conversational tests from amiverse-plugin-review.json.
4. Complete OpenAI publisher/domain verification, review listing and privacy/support material, scan tools and submit. Publish after approval.

See [AMIVERSE_MCP.md](./AMIVERSE_MCP.md) for exact commands, configuration and official links.

Not performed: deployment/promotion to Vercel, a real ChatGPT conversation/tool-selection evaluation, OpenAI identity/domain verification, submission, approval or publication. These require the deployed endpoint and the owner's publishing/account context. The current access checks and prepared ChatGPT form are recorded in MCP_RELEASE_STATUS.md. Health is liveness only; use the smoke command to test content readiness.
