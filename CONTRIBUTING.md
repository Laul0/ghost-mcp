# Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Create pull request

## Development

Install dependencies and build:

```bash
npm install
npm run build
```

### Copilot MCP guidance

This repository includes workspace-scoped Copilot customizations derived from the MCP specification, Microsoft MCP security guidance, and supporting community best-practice guides:

- [MCP tool design policy](.github/instructions/mcp-tool-design.instructions.md) is applied automatically when editing TypeScript source. It covers task-oriented tools, schemas, outputs, side effects, errors, and layered testing.
- [MCP security and operations policy](.github/instructions/mcp-security.instructions.md) is applied to source, dependencies, containers, compose files, and workflows. It covers identity isolation, least privilege, transport security, validation, secrets, privacy, resource bounds, logging, and resilience.
- Run `/add-or-update-mcp-tool` in Copilot Chat to implement a Ghost MCP capability using the repository workflow and required validation.
- Select the **MCP Reviewer** custom agent for a read-only, findings-first review of tool quality, MCP protocol behavior, OWASP-style risks, HTTP/stdio parity, tests, and deployment posture.
- Run `/score-mcp-eval-checklist` after deterministic Agent 365 discovery to score remaining semantic checks and produce the evaluation report.

These files guide contributors and coding agents; they are not runtime security controls. Authentication, authorization, validation, quotas, audit logging, network policy, tests, and deployment controls must still be enforced by the server and its infrastructure.

## Unit tests

Unit tests use [Vitest](https://vitest.dev) and mock the Ghost Admin API client, so they run fully offline against no real Ghost server:

```bash
npm test
```

Each source file has one matching spec file (`src/**/*.spec.ts`), for example [`src/ghostApi.spec.ts`](src/ghostApi.spec.ts) and [`src/tools/posts.spec.ts`](src/tools/posts.spec.ts). Tool tests share the `createConnectedClient` helper in [`src/tools/testUtils.ts`](src/tools/testUtils.ts), which wires a real `McpServer`/`Client` pair over an in-memory transport.

## Evaluating MCP tool quality

This repo can be scored against Microsoft's [MCP server evaluation guidance](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/manage-tools-for-agent?view=o365-worldwide#evaluate-mcp-servers) using the [Agent 365 CLI](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/reference/cli/develop-mcp#develop-mcp-evaluate).

1. Install the CLI: `dotnet tool install --global microsoft.agents.a365.devtools.cli`
2. Start the server locally with any placeholder Ghost credentials — the evaluator only calls `tools/list` and never invokes a tool, so no real Ghost site is contacted:

   ```bash
   GHOST_API_URL="https://example.ghost.io" GHOST_ADMIN_API_KEY="dummy:dummy" MCP_TRANSPORT=http MCP_PORT=3000 node build/server.js
   ```

3. Run the evaluation against the local endpoint. The CLI derives the artifact name from the URL host and port; for `http://localhost:3000/`, it uses `localhost-3000`. There is no `--server-name` option. The npm aliases below use this endpoint by default; set `MCP_EVAL_URL` to override it.

   - **Offline / deterministic only** (fast, seconds, no network calls beyond `tools/list` on your own local server):

     ```bash
     npm run eval:offline
     ```

      This runs `--eval-engine none`, which performs deterministic checks (tool/parameter naming, description presence, schema shape, parameter count, etc.) without invoking an LLM. It generates `eval/<server>_checklist.json`; semantic checks remain unscored, so the report is not generated yet.

   - **With semantic (AI) scoring** (slower, requires network + a local coding agent CLI):

     ```bash
     npm run eval:llm
     ```

     This requires a locally installed and authenticated coding agent CLI ([GitHub Copilot CLI](https://github.com/github/copilot-cli) or [Claude Code](https://docs.claude.com/claude-code)). It sends the tool names/descriptions/schemas — never Ghost data — to that CLI's model backend over the network, so it can take several minutes depending on how many checks each tool has.

     To select an engine explicitly, run the CLI directly, for example:

     ```bash
     a365 develop-mcp evaluate --server-url "http://localhost:3000/" --output-dir "./eval" --eval-engine github-copilot
     ```

   - **Bring-your-own-LLM** (if you're already in an editor chat session): after running `npm run eval:offline`, use the [`/score-mcp-eval-checklist`](.github/prompts/score-mcp-eval-checklist.prompt.md) prompt in VS Code/Copilot Chat. It has the assistant read `eval/semantic_eval_prompt.txt` and fill in the checklist's unscored semantic checks. Re-run `npm run eval:offline` afterward; once every check is scored, the CLI analyzes the results and writes the HTML/JSON report.

   Both scripts accept a custom server URL via `MCP_EVAL_URL` (defaults to `http://localhost:3000/` — match whatever `MCP_HTTP_PATH` your local server is using). The equivalent direct command for deterministic-only discovery is `a365 develop-mcp evaluate --server-url "http://localhost:3000/" --output-dir "./eval" --eval-engine none`.
4. Open `eval/localhost-3000_eval_report.html` after all checks have scores. The report includes the overall score, maturity level, and prioritized action items. Re-run the evaluation after changing tool names, descriptions, or schemas; delete the checklist first if you need the CLI to rediscover the tools rather than resume the existing checklist.

### Score target

The goal is 100/100: use the report's action items to guide changes, then regenerate and review the report after each iteration. Treat the score as a quality signal, not a guarantee of compliance: semantic checks involve judgment, and some deterministic recommendations (such as fewer tools or parameters, or different tool names) can conflict with API compatibility or Ghost Admin API coverage. Document and deliberately resolve those tradeoffs rather than changing public tool names or splitting tools solely to chase the score. Keep HTTP and stdio/npx behavior covered by tests when changing shared tool schemas; the evaluation itself inspects `tools/list` and does not invoke Ghost API operations.

## Working with the Ghost Admin API

This server is a thin MCP wrapper around [`@tryghost/admin-api`](https://ghost.org/docs/admin-api/). Understanding how the wrapper is structured makes it easier to add tools or react to upstream API changes.

### Client setup ([`src/ghostApi.ts`](src/ghostApi.ts))

- `GHOST_API_URL` is fixed by the server operator ([`src/config.ts`](src/config.ts)) and cannot be overridden per request.
- `GHOST_ADMIN_API_KEY` and `GHOST_API_VERSION` can be supplied per request (HTTP `Authorization`/`x-ghost-api-version` headers, see [`src/requestContext.ts`](src/requestContext.ts)) or fall back to server env vars.
- `ghostApiClient` is a `Proxy` that lazily builds and caches one `GhostAdminAPI` instance per `version::key` pair, so each MCP client can use its own Ghost credentials without restarting the server.
- Every request goes through `makeRequestWithTimeout`, which overrides the SDK's default `makeRequest` to add a bounded timeout (`REQUEST_TIMEOUT_MS`). The stock SDK uses axios with no timeout, so a slow/unreachable Ghost instance would otherwise hang a tool call indefinitely.

### Adding or updating a resource

Each Ghost resource (posts, members, tags, etc.) has a matching file under [`src/tools/`](src/tools/) that:

1. Declares zod schemas for the resource's browse/read/add/edit/delete parameters, mirroring the [Ghost Admin API resource docs](https://ghost.org/docs/admin-api/).
2. Registers one `server.tool(name, paramsShape, handler)` call per operation, where the handler calls the matching method on `ghostApiClient` (e.g. `ghostApiClient.posts.add(...)`) and returns the result as MCP `content`.

If Ghost changes or adds fields on a resource:

- Update the zod schema in the resource's `src/tools/*.ts` file to add/remove/rename fields.
- Update the corresponding interface in [`src/models.ts`](src/models.ts) if it's used for typed responses.
- Bump the default in `GHOST_API_VERSION` (`src/config.ts`) only if the new behavior requires a new Admin API version; otherwise prefer leaving the default and letting clients opt in via `x-ghost-api-version`.
- Add or update tests in the resource's `*.spec.ts` file (mocking `ghostApiClient`, see [`src/tools/posts.spec.ts`](src/tools/posts.spec.ts)) to cover new required/optional fields and validation errors.
- Re-run `npm run build && npm test`, then re-run the MCP evaluation if tool descriptions or parameter schemas changed, since those are what the evaluator scores.
