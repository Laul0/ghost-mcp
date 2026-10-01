---
description: "Add or update a Ghost MCP tool using repository patterns, MCP security/design best practices, focused tests, and HTTP plus stdio compatibility checks"
agent: agent
argument-hint: "Describe the Ghost workflow/tool to add or change"
---

Implement the requested Ghost MCP tool or schema change end to end.

1. Read the relevant Ghost Admin API documentation and installed `@tryghost/admin-api` implementation/types. Do not invent unsupported fields or methods.
2. Read the nearest existing tool module, its matching spec, `src/ghostApi.ts`, and shared registration in `src/server.ts`.
3. Apply [MCP tool design policy](../instructions/mcp-tool-design.instructions.md) and [MCP security policy](../instructions/mcp-security.instructions.md).
4. Before editing, state:
   - the user task the tool enables;
   - why an existing tool cannot already satisfy it;
   - whether it reads, mutates, or destructively changes Ghost;
   - the validation, permission, privacy, and compatibility risks.
5. Implement the smallest compatible tool surface. Use strict Zod schemas and descriptions covering purpose, constraints, prerequisites, side effects, return value, limitations, and an example.
6. Register the tool through the shared server factory so HTTP and stdio/npx remain identical.
7. Add/update the matching `*.spec.ts` file. Mock Ghost and cover validation, forwarding, output, errors, and side effects.
8. Run the focused spec, `npm test`, `npm run build`, and a stdio `tools/list` smoke check when registration changed.
9. If tool metadata changed, explain how to force fresh Agent 365 discovery and rerun the MCP evaluation.
10. Summarize changed behavior, security decisions, compatibility impact, and validation results. Do not claim compliance solely from an evaluation score.
