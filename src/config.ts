// ---------------------------------------------------------------------------
// Server-side configuration — loaded from the container's environment.
//
// GHOST_API_URL    Set by the server operator in docker-compose.yml (or the
//                  host environment). It is baked into the running container
//                  and cannot be overridden by MCP clients. This ensures the
//                  MCP server always talks to the intended Ghost instance.
//
// GHOST_ADMIN_API_KEY  Provided by the MCP client at runtime (e.g. Claude
//                      Desktop config). Grants access to the Ghost Admin API.
//
// GHOST_API_VERSION    Optional, provided by the MCP client. Defaults to v5.0.
// ---------------------------------------------------------------------------

export const GHOST_API_URL: string = process.env.GHOST_API_URL as string;
export const GHOST_ADMIN_API_KEY: string = process.env.GHOST_ADMIN_API_KEY as string;
export const GHOST_API_VERSION: string = process.env.GHOST_API_VERSION as string || 'v5.0';

// GHOST_API_URL must be set by the server operator — it is not client-facing.
if (!GHOST_API_URL) {
    console.error("Error: GHOST_API_URL is not set. This must be configured by the server operator in docker-compose.yml (or the host environment).");
    process.exit(1);
}

// GHOST_ADMIN_API_KEY is provided by the MCP client.
if (!GHOST_ADMIN_API_KEY) {
    console.error("Error: GHOST_ADMIN_API_KEY environment variable is not set.");
    process.exit(1);
}
