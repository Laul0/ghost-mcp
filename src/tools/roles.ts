// src/tools/roles.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

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
    "List available Ghost staff user roles. Returns an array of role objects (e.g. Administrator, Editor, Author, Contributor); this list is fixed by Ghost and cannot be created, edited, or deleted via the API. Use this to look up a role_id before inviting a new staff user with invites_add, e.g. limit: 10.",
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
    "Retrieve a single Ghost staff user role by ID or name. Returns the full role object, or an error if no role matches. Use this to confirm a role's exact ID before using it with invites_add, e.g. name: \"Editor\".",
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