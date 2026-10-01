---
description: "Use when changing MCP authentication, HTTP/stdio transport, request context, Ghost API calls, configuration, logging, dependencies, containers, workflows, or deployment. Enforces least privilege and defense in depth."
applyTo: "src/**/*.ts, package*.json, Dockerfile, docker-compose*.yml, .github/workflows/**"
---
# MCP Security And Operations Policy

Apply defense in depth; no single control is sufficient.

## Identity And Authorization

- Use the Ghost Admin API because writing workflows require it, but minimize credential exposure and capability scope.
- In multi-user HTTP mode, keep `GHOST_API_URL` server-owned and use per-client Ghost credentials; do not add a shared privileged key as the normal path.
- Authenticate every protected HTTP request and bind credentials to request-scoped context; never reuse one client's identity for another session.
- Do not trust tool descriptions, model output, resource content, or upstream Ghost text as authorization decisions.
- Enforce permissions and business rules server-side. The model may request an action but cannot authorize it.
- Avoid token passthrough to unrelated downstream services and never log or persist bearer tokens/Admin API keys.

## Transport And Network

- Require HTTPS for remote HTTP deployments; plain HTTP is local-development only.
- Preserve MCP session lifecycle validation and reject unknown/missing session IDs where stateful transport requires them.
- Keep CORS allowlists narrow in production; do not combine wildcard origins with ambient browser credentials.
- Validate configured origins, hosts, ports, paths, body limits, and session limits.
- Protect against DNS rebinding and Host-header abuse when exposing the server outside a trusted reverse proxy/network.
- Do not add arbitrary URL-fetch, proxy, redirect, or webhook-test behavior without explicit SSRF controls and destination allowlists.
- Stdio must write protocol messages only to stdout; diagnostics belong on stderr.

## Validation And Resource Bounds

- Treat all client input and upstream content as untrusted.
- Use strict schemas, payload-size limits, bounded pagination, request timeouts, and bounded caches/session maps.
- Add rate limiting or gateway quotas before Internet-facing production use.
- Abort work when clients disconnect where practical; do not leave unbounded background operations.
- Fail closed on missing credentials, invalid configuration, authorization uncertainty, or malformed protocol state.

## Secrets And Supply Chain

- Never commit real credentials, tokens, `.env` files, private keys, or generated logs containing secrets.
- Use environment/secret stores for runtime secrets; examples must use unmistakably fake values.
- Minimize dependencies, pin through the lockfile, review advisories, and avoid packages that duplicate standard/installed capabilities.
- Keep production images minimal and non-root where feasible; exclude tests, eval artifacts, VCS data, and local secrets from build contexts.
- Treat dependency, workflow, Docker, and publishing changes as security-sensitive and review their provenance/permissions.

## Logging, Privacy, And Errors

- Log request metadata needed for operations (method, tool, status, duration, correlation/session ID), not request bodies or credentials by default.
- Sanitize headers and Ghost content before logging; assume posts, members, emails, notes, and labels may contain personal data.
- Return actionable but sanitized errors to agents; keep stack traces and internal diagnostics server-side.
- Do not expose cross-tenant/session data, cache keys containing secrets, or sensitive values in health checks.
- Health checks should report service health without calling privileged Ghost operations or leaking configuration.

## Resilience And Verification

- Distinguish client/validation errors, authorization failures, upstream Ghost failures, timeouts, and internal faults.
- Retry only safe/idempotent reads by default; use bounded exponential backoff and respect rate limits.
- Test authentication failures, request-context isolation, oversized/invalid payloads, session limits, timeout behavior, and sanitized errors.
- Verify both HTTP and stdio/npx after shared server/tool changes.
- Use unit, protocol, and agent/evaluation layers; never run mutation tests against a production Ghost instance.

## References

- [Microsoft MCP development best practices](https://microsoft.github.io/mcp-azure-security-guide/adoption/development-best-practices/)
- [Microsoft OWASP MCP security guide](https://microsoft.github.io/mcp-azure-security-guide/)
- [MCP specification](https://modelcontextprotocol.io/specification/)
- [MCP architecture and implementation guide](https://modelcontextprotocol.info/docs/best-practices/)
- [Community MCP best-practice guide](https://mcp-best-practice.github.io/mcp-best-practice/)
