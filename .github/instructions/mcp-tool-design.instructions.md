---
description: "Use when adding or changing MCP tools, prompts, resources, schemas, handlers, or tool tests. Enforces agent-oriented design, clear contracts, structured outputs, safe errors, and layered testing."
applyTo: "src/**/*.ts"
---
# MCP Tool Design Policy

Treat MCP as an agent interface, not a mechanical REST wrapper.

## Tool Surface

- Keep this server focused on Ghost content and publishing workflows.
- Prefer task-oriented tools that complete a user intent; do not expose an endpoint merely because it exists.
- Before adding a tool, check for overlap with existing tools and justify the additional choice burden.
- Preserve public tool names and schemas unless a breaking change is explicitly accepted and documented.
- Register tools in the shared server factory so HTTP and stdio/npx expose the same capabilities.

## Names And Descriptions

- Use the repository's existing `resource_action` snake_case naming convention consistently.
- Make descriptions state purpose, when to use the tool, prerequisites, limitations, side effects, return value, and one concrete example.
- Explicitly identify destructive or irreversible operations and tell the agent what to verify first.
- Never place instructions in tool metadata that request secrets, override host policy, or direct the model to ignore prior instructions.

## Input Contracts

- Define every input with Zod; reject unknown or invalid values server-side rather than relying on the model.
- Add `.describe()` text that explains meaning, format, units, valid values, and constraints beyond the parameter name.
- Use enums, numeric bounds, string length limits, URL/email/datetime validation, and refinements when Ghost's contract supports them.
- For alternative identifiers such as `id` or `slug`, validate that at least one is provided when the SDK cannot enforce it.
- Never accept credentials, arbitrary headers, filesystem paths, shell commands, or target hosts as ordinary tool arguments.

## Outputs And Errors

- Prefer structured, decision-ready JSON and MCP `structuredContent`/`outputSchema` where the SDK version supports them.
- Keep text content concise and consistent; do not bury identifiers, status, or next steps in prose.
- Treat upstream Ghost/API failures as tool execution errors that explain what happened, why at a business level, and what the agent can do next.
- Do not return stack traces, internal paths, credentials, raw authorization headers, cross-user data, or unnecessary upstream response details.
- Avoid revealing whether inaccessible resources exist.

## Side Effects

- Reads must not mutate state.
- Mutations must be explicit in the name and description.
- Destructive actions must require specific identifiers; never infer deletion targets from broad searches.
- Preserve Ghost concurrency controls such as `updated_at`; do not silently overwrite newer content.
- Do not add automatic retries for non-idempotent mutations unless idempotency is guaranteed.

## Tests

- Add one matching `*.spec.ts` file for each tool module.
- Mock Ghost; unit/protocol tests must not contact a real Ghost site.
- Cover required inputs, validation boundaries, argument forwarding, output shape, upstream errors, side effects, and destructive-operation confirmation.
- Use the in-memory MCP client/server helper so tests exercise discovery, Zod validation, invocation, and MCP error conversion.
- Run focused tests first, then `npm test` and `npm run build`.
- When schemas or descriptions change, regenerate the Agent 365 evaluation checklist/report and inspect score regressions; do not optimize the score by weakening security or breaking compatibility.

## References

- [Microsoft MCP development best practices](https://microsoft.github.io/mcp-azure-security-guide/adoption/development-best-practices/)
- [MCP specification](https://modelcontextprotocol.io/specification/)
- [MCP architecture and implementation guide](https://modelcontextprotocol.info/docs/best-practices/)
- [Community MCP best-practice guide](https://mcp-best-practice.github.io/mcp-best-practice/)
