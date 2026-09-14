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

3. Run the evaluation. There are two modes, and both write a checklist/report to `./eval`:

   - **Offline / deterministic only** (fast, seconds, no network calls beyond `tools/list` on your own local server):

     ```bash
     npm run eval:offline
     ```

     This runs `--eval-engine none`, which scores every rule-based check (tool/parameter naming, description presence, schema shape, parameter count, etc.) instantly and skips AI scoring. It stops after generating `eval/<server>_checklist.json` with semantic checks left `null`, since those require an LLM.

   - **With semantic (AI) scoring** (slower, requires network + a local coding agent CLI):

     ```bash
     npm run eval:llm
     ```

     This requires a locally installed and authenticated coding agent CLI ([GitHub Copilot CLI](https://github.com/github/copilot-cli) or [Claude Code](https://docs.claude.com/claude-code)). It sends the tool names/descriptions/schemas — never Ghost data — to that CLI's model backend over the network, so it can take several minutes depending on how many checks each tool has.

   - **Bring-your-own-LLM** (fastest of the AI-scored options if you're already in an editor chat session): after running `npm run eval:offline`, use the [`/score-mcp-eval-checklist`](.github/prompts/score-mcp-eval-checklist.prompt.md) prompt in VS Code/Copilot Chat. It has the assistant read `eval/semantic_eval_prompt.txt` and fill in the checklist's unscored semantic checks directly, without shelling out to a separate CLI. Re-run `npm run eval:offline` afterward to generate the report from the now fully-scored checklist.

   Both scripts accept a custom server URL via `MCP_EVAL_URL` (defaults to `http://localhost:3000/` — match whatever `MCP_HTTP_PATH` your local server is using).
4. Open `eval/localhost-3000_eval_report.html` for the overall score, maturity level, and prioritized action items (only generated once every check is scored — deterministic-only runs stop after step 3 with instructions to finish scoring).

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
