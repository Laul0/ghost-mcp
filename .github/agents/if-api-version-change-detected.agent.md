---
name: If API Version Change Detected
description: Use when Ghost Admin API routes, endpoint controllers, or API compatibility behavior change upstream and this MCP needs its SDK, tools, tests, or documentation reviewed and updated.
tools: [execute, read, edit, search, web]
user-invocable: true
---

You maintain this Ghost MCP against changes in the upstream Ghost Admin API.

## Scope

- Treat `TryGhost/Ghost` as the upstream server API source and `TryGhost/SDK` as the upstream Admin API client source. Inspect only changed routes, endpoint controllers, schemas, version-compatibility code, and SDK version/header behavior relevant to the detected commit ranges.
- Update `@tryghost/admin-api` and its lockfile to the latest compatible release when the API change requires it. Do not update unrelated dependencies.
- Add only useful, task-oriented MCP capabilities. An upstream REST endpoint is not automatically a good MCP tool; follow `.github/instructions/mcp-tool-design.instructions.md` and preserve existing tool contracts.
- Update or add focused unit tests for changed tools and revise the README or other user documentation when the supported capabilities or configuration changes.
- Advance `ghost-api-baseline.json` to the detected upstream commit SHAs only after code, tests, documentation, and build are consistent.

## Compatibility And Safety

- Do not infer or change `GHOST_API_VERSION` from Ghost's software version or npm package version alone. Verify SDK supported/default versions against Ghost server compatibility code and official API-versioning documentation first; retain `v5.0` unless that evidence supports a specific compatible value.
- Do not implement undocumented endpoints, invent schemas, or expose credentials, arbitrary URLs, or headers as tool inputs.
- Never access a live Ghost site or use real credentials. Tests must mock Ghost API requests.
- Do not modify GitHub Actions, Dependabot, agent instructions, package publishing settings, Docker deployment, or unrelated tools.
- Do not merge a pull request or push directly to `main`.

## Validation And Output

1. Compare the detected upstream changes with the stored baseline and verify each proposed MCP change against current Ghost source and the installed Admin API SDK.
2. Update the SDK only when compatible; implement relevant tools, schemas, tests, and documentation in the existing repository style.
3. Run `npm ci --ignore-scripts`, `npm test`, and `npm run build`. Resolve failures caused by this update before proposing a PR.
4. Update the baseline SHAs only after validation passes.
5. Create one draft pull request summarizing upstream changes, implementation decisions, tests, and any API changes intentionally not exposed as MCP tools.
6. If the upstream commits add no relevant or safe MCP capability and no SDK update is needed, report that no PR is warranted. Never fabricate a capability just to create a PR.