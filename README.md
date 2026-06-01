# Ghost MCP Server

A Model Context Protocol (MCP) server for interacting with Ghost CMS through LLM interfaces like Claude. This server provides secure and comprehensive access to your Ghost blog, leveraging JWT auth[...]

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

There are two ways to use this MCP server: via **Docker** (recommended for production) or via **npx** (quick local usage).

---

### Option 1 — Docker (Recommended)

The Docker approach splits responsibilities cleanly:

| Variable | Set by | Where |
|---|---|---|
| `GHOST_API_URL` | Server operator | `docker-compose.yml` — locks the container to your Ghost instance |
| `GHOST_ADMIN_API_KEY` | MCP client | Provided at connection time — never stored server-side |
| `GHOST_API_VERSION` | MCP client | Optional, defaults to `v5.0` |

#### 1. Deploy the server

Create a `.env` file alongside your `docker-compose.yml`:

```env
GHOST_API_URL=https://yourblog.com
```

Then start the container:

```bash
docker compose up -d
```

Or pull the pre-built image from GHCR without cloning the repo:

```bash
GHOST_API_URL=https://yourblog.com docker run -d \
  -e GHOST_API_URL=https://yourblog.com \
  ghcr.io/laul0/ghost-mcp:latest
```

#### 2. Configure your MCP client

Add the following to your MCP client config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ghost-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GHOST_ADMIN_API_KEY",
        "-e", "GHOST_API_VERSION",
        "ghcr.io/laul0/ghost-mcp:latest"
      ],
      "env": {
        "GHOST_ADMIN_API_KEY": "your-id:your-secret"
      }
    }
  }
}
```

> `GHOST_API_VERSION` can be omitted from `env` if you are happy with the default `v5.0`.  
> `GHOST_API_URL` is **not** set here — it is already baked into the running container by the server operator.

---

#### Multiple Ghost instances

If you manage multiple Ghost blogs, deploy one container per instance (each with its own `GHOST_API_URL`), then register each as a separate named MCP server in your client config:

**docker-compose.yml**
```yaml
services:
  ghost-mcp-blog1:
    image: ghcr.io/laul0/ghost-mcp:latest
    environment:
      GHOST_API_URL: https://blog1.com
    stdin_open: true
    tty: false
    restart: unless-stopped

  ghost-mcp-blog2:
    image: ghcr.io/laul0/ghost-mcp:latest
    environment:
      GHOST_API_URL: https://blog2.com
    stdin_open: true
    tty: false
    restart: unless-stopped
```

**MCP client config**
```json
{
  "mcpServers": {
    "ghost-blog1": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GHOST_ADMIN_API_KEY",
        "-e", "GHOST_API_VERSION",
        "ghcr.io/laul0/ghost-mcp:latest"
      ],
      "env": {
        "GHOST_ADMIN_API_KEY": "blog1-id:blog1-secret"
      }
    },
    "ghost-blog2": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GHOST_ADMIN_API_KEY",
        "-e", "GHOST_API_VERSION",
        "ghcr.io/laul0/ghost-mcp:latest"
      ],
      "env": {
        "GHOST_ADMIN_API_KEY": "blog2-id:blog2-secret"
      }
    }
  }
}
```

Each MCP server is isolated — its URL is locked in the container, and only its own API key grants access.

---

### Option 2 — npx (Quick local usage)

No server deployment needed. The MCP client downloads and runs the package on the fly.

Add the following to your MCP client config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ghost-mcp": {
      "command": "npx",
      "args": ["-y", "@fanyangmeng/ghost-mcp"],
      "env": {
        "GHOST_API_URL": "https://yourblog.com",
        "GHOST_ADMIN_API_KEY": "your-id:your-secret",
        "GHOST_API_VERSION": "v5.0"
      }
    }
  }
}
```

> Note: with `npx`, all three variables are client-side. The Docker approach is recommended for production as it locks `GHOST_API_URL` server-side.

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
