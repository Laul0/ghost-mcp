// src/tools/roles.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";
import { UNSUPPORTED_RESOURCE_DESCRIPTION } from "./descriptions";

// Parameter schemas as ZodRawShape (object literals)
const browseParams = {
  filter: z.string().optional().describe("Ghost NQL filter expression to narrow the list of roles."),
  limit: z.number().optional().describe("Maximum number of roles to return per page."),
  page: z.number().optional().describe("Page number to retrieve, starting at 1."),
  order: z.string().optional().describe("Sort order expression, e.g. \"name ASC\"."),
};
const readParams = {
  id: z.string().optional().describe("Ghost role ID to look up (24-character hexadecimal object ID). Provide either id or name."),
  name: z.string().optional().describe("Role name to look up, e.g. \"Administrator\". Provide either id or name."),
};

export function registerRoleTools(server: McpServer) {
  // Browse roles
  server.tool(
    "roles_browse",
    "List Ghost staff roles to find a role_id before inviting a user, e.g. limit: 10. Returns a role array; Ghost's roles are fixed." + UNSUPPORTED_RESOURCE_DESCRIPTION,
    browseParams,
    async (args, _extra) => {
      const roles = await ghostApiClient.roles.browse(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(roles, null, 2),
          },
        ],
      };
    }
  );

  // Read role
  server.tool(
    "roles_read",
    "Retrieve a staff role by ID or name to confirm its ID for an invitation, e.g. name: \"Editor\". Returns the role or an error." + UNSUPPORTED_RESOURCE_DESCRIPTION,
    readParams,
    async (args, _extra) => {
      const role = await ghostApiClient.roles.read(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(role, null, 2),
          },
        ],
      };
    }
  );
}