# Ghost MCP Server

A Model Context Protocol (MCP) server for interacting with Ghost CMS through LLM interfaces like Claude, Microsoft Copilot, etc. This server provides secure and comprehensive access to your Ghost blog, leveraging JWT auth[...]

![demo](./assets/ghost-mcp-demo.gif)

## Features

- Secure Ghost Admin API requests with `@tryghost/admin-api`
- Comprehensive entity access including posts, users, members, tiers, offers, and newsletters
- Advanced search functionality with both fuzzy and exact matching options
- Detailed, human-readable output for Ghost entities
- Robust error handling using custom `GhostError` exceptions
- Integrated logging support via MCP context for enhanced troubleshooting

---

## Usage
Copy [docker-compose.yml](docker-compose.yml) to your laptop or server, edit `GHOST_API_URL`, then start it:

```bash
docker compose pull
docker compose up -d
```

If you want to test a local build before pushing an image, use [docker-compose.local.yml](docker-compose.local.yml) instead:

```bash
docker compose -f docker-compose.local.yml up --build
```

HTTP endpoint (default): `http://<your-host>:3000/`

Health check: `http://<your-host>:3000/health`

Example compose file:

```yaml
services:
  ghost-mcp:
    image: ghcr.io/laul0/ghost-mcp:latest
    environment:
      - GHOST_API_URL=https://your-ghost-site.example
      - MCP_TRANSPORT=http
      - MCP_PORT=3000
      - MCP_HTTP_PATH=/
    ports:
      - "3000:3000"
    stdin_open: true
    tty: false
    restart: unless-stopped
```

> [!NOTE]
> In HTTP mode, keep `GHOST_API_URL` on the server/container.
> Each MCP client should provide its own Ghost key so access remains user-scoped.

## MCP Configuration (Who Sets What)

Use this model to avoid shared permissions across users.

| Item | Set by | Where |
|---|---|---|
| `GHOST_API_URL` | Server operator | Docker/container env (`docker-compose.yml`) |
| `GHOST_ADMIN_API_KEY` for HTTP | Each MCP client user | MCP client config as `Authorization: Bearer <ghost-admin-key>` |
| `GHOST_API_VERSION` for HTTP | Each MCP client user (optional) | MCP client config as HTTP header `x-ghost-api-version` |
| `GHOST_ADMIN_API_KEY` for stdio/npx | Each MCP client user | MCP client env in local/stdio config |
| `GHOST_API_URL` for stdio/npx | Each MCP client user | MCP client env in local/stdio config |

### Recommended for multi-user deployments

- Run the MCP server in HTTP mode behind Docker/reverse proxy.
- Keep only `GHOST_API_URL` in server/container config.
- Require every MCP client to send its own Ghost admin key via headers.
- Do not set a shared `GHOST_ADMIN_API_KEY` in compose for HTTP multi-user setups.

### Remote HTTPS (no SSH)

This image supports HTTP MCP on `/` by default.

> [!NOTE]
> For remote HTTPS usage, put a reverse proxy (Nginx/Caddy/Traefik) in front and terminate TLS there (`https://...`).

Quick rule:

- Local machine: use HTTP (`http://localhost:3000/`) or stdio (`MCP_TRANSPORT=stdio`).
- Remote HTTPS: same MCP endpoint, but served behind TLS by your reverse proxy.

For local development, you can build your own image instead:

```bash
docker build -t ghost-mcp:local .
```

### Original npx usage (still supported, stdio/local)

To use this with MCP clients (for example Claude Desktop), add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ghost-mcp": {
      "command": "npx",
      "args": ["-y", "@fanyangmeng/ghost-mcp"],
      "env": {
        "GHOST_API_URL": "https://yourblog.com",
        "GHOST_ADMIN_API_KEY": "your_admin_api_key",
        "GHOST_API_VERSION": "v5.0"
      }
    }
  }
}
```

### Using HTTP Docker MCP clients

When running this server over HTTP (`MCP_TRANSPORT=http`), configure your client to connect to:

- Local machine: `http://localhost:3000/`
- Remote with reverse proxy/TLS: `https://your-domain.example/`

> [!IMPORTANT]
> For HTTP mode, keep only `GHOST_API_URL` on the server/container.
> Each MCP client should pass these headers in its MCP server config:
> - `Authorization: Bearer <user-id:user-secret>`
> - `x-ghost-api-version: v5.0` (optional; defaults to `v5.0`)
>
> Legacy compatibility: `x-ghost-admin-api-key` is also accepted.

#### Claude (Claude Code / Claude Desktop)

Claude Code (CLI):

Add the server:

```bash
claude mcp add --transport http ghost-mcp http://localhost:3000/ \
  --header "Authorization: Bearer your-id:your-secret" \
  --header "x-ghost-api-version: v5.0"
```

Verify:

```bash
claude mcp list
claude mcp get ghost-mcp
```

Claude Desktop (HTTP-capable versions):

```json
{
  "mcpServers": {
    "ghost-mcp": {
      "type": "http",
      "url": "http://localhost:3000/",
      "headers": {
        "Authorization": "Bearer your-id:your-secret",
        "x-ghost-api-version": "v5.0"
      }
    }
  }
}
```

If your Claude Desktop version only supports stdio/local MCP entries, use the `npx` configuration shown above.

#### GitHub Copilot CLI

Option A (interactive in Copilot CLI):

```text
/mcp add
```

Then choose:
- Server Name: `ghost-mcp`
- Server Type: `HTTP`
- URL: `http://localhost:3000/`
- HTTP Headers: `{ "Authorization": "Bearer your-id:your-secret", "x-ghost-api-version": "v5.0" }`
- Tools: `*` (or restrict to specific tool names)

Option B (command line):

```bash
copilot mcp add ghost-mcp \
  --type http \
  --url http://localhost:3000/ \
  --header "Authorization=Bearer your-id:your-secret" \
  --header "x-ghost-api-version=v5.0" \
  --tools "*"
```

#### VS Code (Copilot Chat Agent mode)

Create or edit `.vscode/mcp.json`:

```json
{
  "servers": {
    "ghost-mcp": {
      "type": "http",
      "url": "http://localhost:3000/",
      "requestInit": {
        "headers": {
          "Authorization": "Bearer your-id:your-secret",
          "x-ghost-api-version": "v5.0"
        }
      }
    }
  }
}
```

Then in Copilot Chat, switch to Agent mode and enable tools for `ghost-mcp`.

### Troubleshooting HTTP MCP sessions

#### Streamable HTTP handshake requirements

This server uses MCP Streamable HTTP. Clients must implement the MCP lifecycle for HTTP:

1. `POST initialize` (server responds with `mcp-session-id` header)
2. `POST notifications/initialized` (with the same `mcp-session-id`)
3. `POST tools/list` and `POST tools/call` (with the same `mcp-session-id`)

HTTP expectations:

- Request header must include `Accept: application/json, text/event-stream`
- Authentication should use `Authorization: Bearer <ghost-admin-key>`
- Response may be SSE (`Content-Type: text/event-stream`) with `data: {...}` events
- Subsequent requests must send `mcp-session-id` from the initialize response

If a client skips this handshake, HTTP requests can fail with `400` errors.
In that case, use a client with full Streamable HTTP MCP support, or use stdio/npx mode.

If you see this error from a client:

```text
Bad Request: Server not initialized
```

Most commonly, the client is reusing an old MCP session after the server/container was restarted.

Fix steps:

1. Restart the MCP container.
2. Reconnect the MCP server entry in your client (disable/enable, or remove/add).
3. Confirm your MCP URL exactly matches `MCP_HTTP_PATH` (default is `/`, so use `http://host:3000/`).
4. Verify the server health endpoint returns `ok` at `/health`.

---

## Available Resources

The following Ghost CMS resources are available through this MCP server:

- **Posts**: Articles and content published on your Ghost site.
- **Members**: Registered users and subscribers of your site.
- **Newsletters**: Email newsletters managed and sent via Ghost.
- **Offers**: Promotional offers and discounts for members.
- **Invites**: Invitations for new users or staff to join your Ghost site.
- **Roles**: User roles and permissions within the Ghost admin.
- **Tags**: Organizational tags for posts and content.
- **Tiers**: Subscription tiers and plans for members.
- **Users**: Admin users and staff accounts.
- **Webhooks**: Automated event notifications to external services.

## Available Tools

This MCP server exposes a comprehensive set of tools for managing your Ghost CMS via the Model Context Protocol. Each resource provides a set of operations, typically including browsing, reading, adding, editing, and deleting entities.

### Posts
- **Browse Posts**: List posts with optional filters, pagination, and ordering.
- **Read Post**: Retrieve a post by ID or slug.
- **Add Post**: Create a new post with title, content, and status.
- **Edit Post**: Update an existing post by ID.
- **Delete Post**: Remove a post by ID.

### Members
- **Browse Members**: List members with filters and pagination.
- **Read Member**: Retrieve a member by ID or email.
- **Add Member**: Create a new member.
- **Edit Member**: Update member details.
- **Delete Member**: Remove a member.

### Newsletters
- **Browse Newsletters**: List newsletters.
- **Read Newsletter**: Retrieve a newsletter by ID.
- **Add Newsletter**: Create a new newsletter.
- **Edit Newsletter**: Update newsletter details.
- **Delete Newsletter**: Remove a newsletter.

### Offers
- **Browse Offers**: List offers.
- **Read Offer**: Retrieve an offer by ID.
- **Add Offer**: Create a new offer.
- **Edit Offer**: Update offer details.
- **Delete Offer**: Remove an offer.

### Invites
- **Browse Invites**: List invites.
- **Add Invite**: Create a new invite.
- **Delete Invite**: Remove an invite.

### Roles
- **Browse Roles**: List roles.
- **Read Role**: Retrieve a role by ID.

### Tags
- **Browse Tags**: List tags.
- **Read Tag**: Retrieve a tag by ID or slug.
- **Add Tag**: Create a new tag.
- **Edit Tag**: Update tag details.
- **Delete Tag**: Remove a tag.

### Tiers
- **Browse Tiers**: List tiers.
- **Read Tier**: Retrieve a tier by ID.
- **Add Tier**: Create a new tier.
- **Edit Tier**: Update tier details.
- **Delete Tier**: Remove a tier.

### Users
- **Browse Users**: List users.
- **Read User**: Retrieve a user by ID or slug.
- **Edit User**: Update user details.
- **Delete User**: Remove a user.

### Webhooks
- **Browse Webhooks**: List webhooks.
- **Add Webhook**: Create a new webhook.
- **Delete Webhook**: Remove a webhook.

> Each tool is accessible via the MCP protocol and can be invoked from compatible clients. For detailed parameter schemas and usage, see the source code in `src/tools/`.


## Error Handling

Ghost MCP Server employs a custom `GhostError` exception to handle API communication errors and processing issues. This ensures clear and descriptive error messages to assist with troubleshooting.

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Create pull request

## License

MIT
