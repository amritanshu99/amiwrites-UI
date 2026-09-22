# Amiverse MCP / ChatGPT integration

Implementation and follow-up review checked on 2026-09-21. This repository contains a working read-only MCP server, not an already published OpenAI integration.

## Architecture

```text
ChatGPT / Codex + Amiverse connection
                |
                | MCP Streamable HTTP
                v
https://www.amiverse.in/api/mcp   (Vercel Node Function)
                |
        schemas + read-only tools
                |
        Amiverse service layer
           /             \
Shared public JSON       Existing Render API
projects/profile/skills  /api/blogs/seo-index + /api/blogs/:id
                         |
                         MongoDB Blog collection
                |
     structuredContent + text + canonical URLs
```

Inspection found React 19.1 / Create React App 5, JavaScript/JSX, npm with a v2 package lock, Vercel configuration and existing Node functions for SEO feeds. The sibling backend is Express 5 / Mongoose 8 on Render. Local Node is 24.19.0; the project now specifies Node 24.x. No TypeScript application configuration existed. The integration follows the existing CommonJS Node convention and uses Zod runtime input/output contracts instead of introducing a separate TypeScript build system.

The current official SDK release is v2: `@modelcontextprotocol/server@2.0.0` (production), `@modelcontextprotocol/client@2.0.0` (tests). OpenAI examples still show the supported v1 package `@modelcontextprotocol/sdk`; the MCP maintainers' v2 documentation and installed exports were checked directly. The SDK's per-request factory supports current protocol discovery and stateless 2025 Streamable HTTP clients. No sessions, Redis, SSE persistence, vector store, frontend MCP bundle, or OpenAI API key are required. See the [official SDK release](https://github.com/modelcontextprotocol/typescript-sdk) and [HTTP handler documentation](https://ts.sdk.modelcontextprotocol.io/v2/serving/http.html).

### Existing content reused

| Content | Source | Boundary |
| --- | --- | --- |
| Featured projects | `src/data/featuredProjects.json`, extracted unchanged from PortfolioDetails | Same cards rendered by the website |
| AI tools and learning demo | `src/config/seoRoutes.json` | Explicit allowlist of four public demo routes |
| Profile and skills | `src/data/publicPortfolio.json`, extracted from portfolioFallback | The profile actually rendered by the portfolio; no email, phone, photos, or private user records returned |
| Articles | Existing `/api/blogs/seo-index` and `/api/blogs/:id` | Only allowlisted fields and published records |
| Legacy article API | `/api/blogs?page=...&limit=50&sort=latest` | Used only when seo-index returns 400/404, matching the SEO service's compatibility approach |

The backend portfolio endpoint exists but its career data differs from the public page: PortfolioDetails explicitly uses the frontend source for title, description, experience and education. The MCP profile shares that source to match the website. Backend files are unchanged. HTML is never scraped. Existing `stripHtml` and canonical article path helpers are reused. The two MERN project tags describe the inspected React / Express / Node / MongoDB implementations of AmiBot and Task Manager. Other project descriptions and tags come from the existing cards and route metadata.

Private tasks, account data, chat history, uploaded AmiBot knowledge, admin APIs and third-party Tech Byte news are outside V1.

## Available MCP Tools

| Tool | Purpose | Example arguments |
| --- | --- | --- |
| search_amiverse | Ranked project, article-excerpt and public-profile search | `{"query":"AI agents"}` |
| list_projects | Browse projects; topic and technology filters combine with AND | `{"technology":"React","limit":5}`, `{"topic":"MERN"}` |
| get_project | Read one known project | `{"slug":"amibot"}` |
| get_article | Read one published article excerpt | Use a slug or ID returned by search/latest |
| get_profile | Read Amritanshu Mishra's public professional information | `{}` |
| get_skills | Filter the published skill list | `{"category":"AI"}` |
| get_latest_content | Sort published, dated content newest first | `{"type":"article","limit":5}` |

Search gives title matches more weight than tags and summaries, with publication date and slug as deterministic tie breakers. Queries match any useful token; a result need not satisfy every search word. Project filters require all tokens. Common AI/ML/Node/React aliases are normalized. Search covers article titles, categories and excerpts, not full article bodies. Queries such as RAG or transformers can legitimately return no articles.

Queries are limited to 200 characters, filters to 100, skill categories to 50, slugs to 160, and lists to 20 results. Unknown input properties and punctuation-only search/project filters are rejected. Detail responses include an article excerpt up to 6,000 characters and a truncation flag. Public article links retain the existing `/blogs/<MongoDB ID>` routes; stored slugs are lookup aliases. Duplicate slugs and aliases that collide with another article ID are returned as their unique IDs; IDs always take precedence. Use the identifier returned by discovery. `get_article` only resolves records in the bounded public index. Projects have no source publication dates: they have `publishedAt: null` and are excluded from latest-content results with a warning. No dates or projects are invented.

The article index is capped at 1,000 items (legacy fallback: ten pages of fifty). A cap is disclosed through `truncated` / warnings. Future or invalid explicit publication dates are excluded. A failed article source produces explicit partial search results; article/latest requests return an MCP tool error. Empty content is a successful empty collection, not a fabricated result.

## Local Development

From this frontend repository on Node 24:

```powershell
npm.cmd install
npm.cmd run mcp:dev
```

The endpoint is `http://127.0.0.1:8787/mcp` (`/api/mcp` is also accepted locally). Health: `http://127.0.0.1:8787/health`. The server binds only to loopback. It reads existing `.env` and optional `.env.local`; MCP defaults use the public production content API and do not read frontend API URL variables. To use a local backend, set `MCP_CONTENT_API_ORIGIN=http://127.0.0.1:5000` in `.env.local` and run the backend normally. No database credentials are needed by MCP.

In a second terminal:

```powershell
npm.cmd run mcp:smoke
npm.cmd run mcp:inspect
```

Inspector is pinned to 2.7.0 and launched through npx's separate cache so its React dependencies do not change the website. First launch needs npm registry access. In its web UI, select HTTP / Streamable HTTP, enter `http://127.0.0.1:8787/mcp`, connect, list tools and call them. Keep Inspector's local authentication enabled. On Windows use `npm.cmd` / `npx.cmd` if PowerShell blocks npm.ps1. On macOS/Linux use `npm` / `npx`.

CLI inspection:

```powershell
npx.cmd --yes @modelcontextprotocol/inspector@2.7.0 --cli http://127.0.0.1:8787/mcp --method tools/list --strict
npx.cmd --yes @modelcontextprotocol/inspector@2.7.0 --cli http://127.0.0.1:8787/mcp --method tools/call --tool-name list_projects --tool-arg technology=React
```

## Testing

```powershell
npm.cmd run lint
npm.cmd run lint:mcp
npm.cmd run test:mcp
npm.cmd test -- --watchAll=false --runInBand
npm.cmd run test:seo
npm.cmd run test:loader
npm.cmd run build
```

`lint` checks production JavaScript/JSX. `lint:mcp` includes the MCP tests. `lint:all` additionally checks the older website tests, which currently have existing Testing Library rule violations. No TypeScript typecheck command exists: this is a JavaScript repository; input/output schemas are validated on every call and in protocol tests. Do not interpret that as a passed static TypeScript check.

Tests use fixture APIs only inside `server/mcp/tests`. The separate `mcp:smoke` command checks health, tool names and safety metadata, validates every structured response, and exercises all tools against real content, including an article lookup whose ID and canonical URL must match discovery. It fails if articles are unavailable or no published articles exist. It can test a deployed URL as well:

```powershell
npm.cmd run mcp:smoke -- https://www.amiverse.in/api/mcp
```

Local tests cannot establish ChatGPT's actual tool selection. Record ChatGPT evaluation results using the prompts in `docs/amiverse-plugin-review.json` after deployment. Do not claim publication or conversational verification solely from Inspector success.

The existing website build regenerates `public/feed.xml` and `public/sitemap.xml`; inspect generated diffs before committing. These files are not MCP content stores.

## Environment Variables

| Variable | Default / purpose |
| --- | --- |
| MCP_CONTENT_API_ORIGIN | Existing public Render API origin; HTTPS required in production; URL paths, credentials, redirects and user-selected hosts are rejected |
| MCP_PORT | 8787; local process only |
| MCP_UPSTREAM_TIMEOUT_MS | 8000; 100-10000 allowed; covers the response body and the entire index pagination attempt |
| MCP_BODY_TIMEOUT_MS | 5000; 100-5000 allowed; absolute deadline for reading an unparsed request body, including stalled uploads |
| MCP_CACHE_SECONDS | 60; 1-300 allowed; public index only, per warm instance |
| MCP_RATE_LIMIT | 120 HTTP POST requests/minute/process; 1-10000 allowed |
| MCP_ALLOWED_HOSTS | Explicit production and loopback hostnames; platform-provided Vercel deployment/branch hosts are added exactly when VERCEL=1; add other exact preview/tunnel hosts when needed |
| MCP_ALLOWED_ORIGINS | Exact ChatGPT, website and local Inspector browser origins; requests without Origin are supported |
| OPENAI_APPS_CHALLENGE_TOKEN | Exact domain-verification token supplied by OpenAI; absent means the challenge endpoint returns 404 |

See `.env.example`. These are server-side names, never `REACT_APP_*`. No auth credentials are required. Do not commit secret environment files.

## Deployment

1. Use the existing Amiverse Vercel project and repository root. Keep its CRA framework/build configuration and `build` output directory. Use Node 24.x; install with `npm ci`; build with `npm run build`. The root `api/*.js` files are Node functions. [Vercel Node runtime](https://vercel.com/docs/functions/runtimes/node-js)
2. Set the MCP variables from `.env.example` in Vercel's deployment environment. No new MongoDB access is required. Keep the Render API publicly reachable and provision it for consistent response time; a sleeping backend can exceed the MCP timeout.
3. Deploy a preview through the project's normal Git/Vercel workflow. With Vercel system variables enabled, the handler automatically adds the exact `VERCEL_URL` and `VERCEL_BRANCH_URL` hostnames. It never accepts arbitrary `*.vercel.app` hosts. Otherwise add the exact hostname to `MCP_ALLOWED_HOSTS`. Preserve preview protection; use authenticated Vercel requests for preview checks, and connect ChatGPT to the public production endpoint after promotion.
4. Verify `/api/mcp-health`, `/health`, and `npm run mcp:smoke -- https://<preview-host>/api/mcp`. Health is liveness only: the smoke test checks upstream content readiness. Verify the portfolio and blog pages too.
5. Verify production environment values before promotion: promoting a preview retains its build-time environment. Prefer a staged production deployment (`vercel deploy --prod --skip-domain`), verify its deployment URL, then promote that exact artifact. Register the canonical, non-redirecting URL `https://www.amiverse.in/api/mcp` with OpenAI. The repository's existing canonical website origin includes `www`.
6. Configure a Vercel Firewall rate-limit rule for POST requests to `/api/mcp`, initially 120/minute/client IP, then tune to observed traffic. In-memory rate limiting is only per instance and is not fleet-wide abuse prevention. Avoid browser challenges on the machine endpoint. Monitor 429s, tool failures and partial search results in Function logs.

`.vercelignore` excludes local credentials, caches, logs and working notes from uploads. `.gitignore` also excludes local Vercel configuration and release caches. The exact platform hostname behavior uses [Vercel system variables](https://vercel.com/docs/environment-variables/system-environment-variables).

`vercel.json` puts explicit MCP, health and verification rewrites before the SPA fallback. Function duration is 30 seconds for MCP and 10 for health. Static tools work during article outages. A fresh index attempt takes at most the configured timeout; a detail request may need an index plus a detail fetch. The maximum body deadline (5 seconds) plus two maximum upstream operations (10 seconds each) leaves headroom within the 30-second function duration.

No new subdomain is needed. If you later prefer `mcp.amiverse.in/mcp`, attach that domain to an MCP deployment and route `/mcp` to the same handler, retain the hostname allowlist and update the OpenAI connection. The current production configuration intentionally targets `www.amiverse.in/api/mcp`.

## Connect to ChatGPT

Current official instructions use Plugins; custom UI is optional. V1 is a remote MCP-only integration, with anonymous tools. There is no legacy ai-plugin.json/OpenAPI plugin manifest. [OpenAI MCP server guide](https://developers.openai.com/plugins/build/mcp-server)

1. Deploy the HTTPS endpoint and run the live smoke test.
2. In ChatGPT, open Settings > Security and login > Developer mode (account/workspace policy may restrict this).
3. Open ChatGPT Plugins, select plus, enter Amiverse's name/description and the public MCP URL under Connection. Choose no authentication if prompted.
4. Create the connection and inspect all seven tools. Add it through the tools menu in a new conversation.
5. Try the supplied direct, indirect, follow-up and unsupported prompts; record selected tools, arguments, source links and errors. After metadata changes, redeploy and use Refresh on the developer connection, then start a new conversation.

For local testing before deployment, use the official Secure MCP Tunnel or an HTTPS forwarding service and allow its exact host. A tunnel alone does not satisfy public submission. [Official connection instructions](https://developers.openai.com/plugins/deploy/connect-chatgpt)

## Public Plugin/App Publishing

Use the OpenAI Platform plugin submission portal linked from the [current submission guide](https://developers.openai.com/plugins/deploy/submission):

1. Select the publishing organization, verify its individual/business identity, and obtain Apps Management Write permission.
2. Create plugin > With MCP. Choose Universal URL and enter the production endpoint; configure anonymous access.
3. Complete the listing using `docs/amiverse-plugin-review.json`: Amiverse branding, existing logo, website, support, privacy and terms URLs. Review that the policies cover actual MCP and hosting logs.
4. When challenged, set `OPENAI_APPS_CHALLENGE_TOKEN` in Vercel and redeploy. The portal's challenge URL must return that exact token as plain text.
5. Scan Tools and resolve validation findings. Supply starter prompts, at least five positive and three negative test cases, availability regions, release notes and accurate attestations.
6. Submit for Review. After approval, select Publish in the portal. Publication makes it available in the shared ChatGPT/Codex Plugins Directory; developer-mode connection alone does not.

The JSON file is prepared listing/review material, not an uploadable official manifest or a claim of approval. No reviewer login is required for V1. Recheck the [remote MCP review requirements](https://developers.openai.com/plugins/deploy/app-review) before submitting. No app UI resources, CSP domains for widgets, or skills bundle are needed for this MCP-only V1. Add UI later using the optional Apps SDK/MCP App component support.

## Security Model

All tools are read-only and anonymous. Runtime strict schemas reject unknown fields and enforce lengths and limits. Article payloads are schema-checked and reduced to a public-field allowlist. Slugs are validated and resolved to index IDs before a fixed-path fetch. No arbitrary URLs, files, database queries or admin actions are exposed. Upstream redirects are blocked, origin configuration is validated, responses are limited to 4 MiB and detail text to 6,000 characters. Index refreshes coalesce and cache for a bounded TTL; errors are never cached as empty success.

HTTP requests have a 16 KiB body limit (including unfinished chunked uploads), an absolute body-read deadline, exact Host/Origin validation, explicit CORS responses, no-store caching, security headers and coarse process rate limiting. Batch JSON-RPC is rejected. The SDK validates envelopes and transport headers before tool input validation; safe Standard Schema errors do not echo invalid arguments. Operational logs contain only generated request ID, known tool name, elapsed time, success/failure, partial status and result count; no arguments, article bodies, IP addresses, authorization headers or upstream exception messages. Hosting platforms may separately record access logs. Article content is treated as untrusted source data, not model instructions.

Discovery declares noauth both in top-level `securitySchemes` and in its `_meta.securitySchemes` compatibility mirror, as shown in the [OpenAI tool reference](https://developers.openai.com/plugins/reference). The SDK 2.0 registration helper omits top-level extension fields, so a supported `tools/list` handler supplies descriptors from the same schema/metadata definitions while SDK dispatch still validates and executes calls. A raw HTTP test checks the extension because the generic SDK client strips it. Safety hints remain on every tool. Public API-backed tools set openWorldHint; static portfolio tools do not. Authentication hints are descriptive and are not access control.

For future private/write tools, add OAuth 2.1 protected-resource discovery, token validation (issuer, audience, expiry, scopes), and per-user authorization before constructing request-scoped services. Keep public services separate and do not share user data in public caches. Never forward the website's session tokens or reuse an OpenAI bearer token against the content API. [OpenAI authentication guide](https://developers.openai.com/plugins/build/auth)

## Adding New Tools

Add the business operation to a service, its strict input and output contracts to `schemas.js`, and a name/title/description/handler to `server.js`. Set safety and authentication metadata for its actual behavior, add HTTP contract and failure tests, then update the smoke test and review inventory. `createServer` is a factory so future validated per-request OAuth context can be passed to it. Search can later use a backend index without changing the tool contract. Accounts, subscriptions, RAG/vector storage and interactive UI are intentionally future work.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| GET /api/mcp returns 405 | Expected: use an MCP HTTP client. GET /health is the liveness endpoint. |
| 403 Host not allowed | Add the exact preview/tunnel hostname to MCP_ALLOWED_HOSTS and redeploy. |
| 403 Origin not allowed | Add only the trusted browser origin; server-to-server clients can omit Origin. |
| 408 | The request body did not finish within MCP_BODY_TIMEOUT_MS; send a complete bounded JSON request. |
| 429 | Observe Retry-After; tune process and Vercel Firewall limits. |
| CONTENT_UNAVAILABLE / partial search | Check Render availability, API JSON shape and timeout; do not increase limits blindly. |
| Article NOT_FOUND | Use a slug/ID from search/latest; future, deleted and out-of-index articles are excluded. |
| Empty latest projects | Projects lack publication dates; use list_projects. |
| Wrong tool list in ChatGPT | Refresh developer metadata and start a new conversation. |
| SPA HTML returned for /api/mcp | Check that the MCP rewrites precede the catch-all and Node functions were deployed. |
| Challenge returns 404 | Set the exact portal token, redeploy, and check the portal's exact host/path. |
| Inspector dependency/permissions problem | Use the pinned npx command and a writable npm cache; it is separate from website dependencies. |
| Build/lint warnings | Existing React hooks/accessibility warnings are unrelated to MCP; lint:all also exposes existing website test-rule violations. |

## Verification record

See `docs/MCP_VERIFICATION.md` for test results and `docs/MCP_RELEASE_STATUS.md` for the latest deployment/account status.
