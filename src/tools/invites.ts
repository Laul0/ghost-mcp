// src/tools/invites.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";
import { confirmDelete, DELETE_CONFIRMATION_DESCRIPTION, DELETE_ANNOTATIONS } from "./confirmDelete";
import { UNSUPPORTED_RESOURCE_DESCRIPTION } from "./descriptions";

// Parameter schemas as ZodRawShape (object literals)
const browseParams = {
  filter: z.string().optional().describe("Ghost NQL filter expression to narrow the list of invites."),
  limit: z.number().optional().describe("Maximum number of invites to return per page."),
  page: z.number().optional().describe("Page number to retrieve, starting at 1."),
  order: z.string().optional().describe("Sort order expression, e.g. \"created_at DESC\"."),
};
const addParams = {
  role_id: z.string().describe("Ghost role ID to assign to the invited staff user."),
  email: z.string().describe("Email address to send the staff invitation to."),
};
const deleteParams = {
  id: z.string().describe("Ghost invite ID to revoke/delete (24-character hexadecimal object ID)."),
};

export function registerInviteTools(server: McpServer) {
  // Browse invites
  server.tool(
    "invites_browse",
    "List pending staff invitations to check for an existing invite, e.g. limit: 20. Returns an invite array with IDs, emails and roles." + UNSUPPORTED_RESOURCE_DESCRIPTION,
    browseParams,
    async (args, _extra) => {
      const invites = await ghostApiClient.invites.browse(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(invites, null, 2),
          },
        ],
      };
    }
  );

  // Add invite
  server.tool(
    "invites_add",
    "Email a staff invitation with a role; returns the invite. The recipient must accept it, and an existing user or pending invite causes an error. Example: email: \"jane@example.com\", role_id: \"64f1a2b3c4d5e6f7a8b9c0d1\"." + UNSUPPORTED_RESOURCE_DESCRIPTION,
    addParams,
    async (args, _extra) => {
      const invite = await ghostApiClient.invites.add(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(invite, null, 2),
          },
        ],
      };
    }
  );

  // Delete invite
  server.tool(
    "invites_delete",
    "Revoke a pending staff invitation by ID, disabling its link. Verify it via invites_browse, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\". Returns a text confirmation; revocation cannot be undone." + DELETE_CONFIRMATION_DESCRIPTION + UNSUPPORTED_RESOURCE_DESCRIPTION,
    deleteParams,
    DELETE_ANNOTATIONS,
    async (args, _extra) => {
      await confirmDelete(server, "invite", args.id, _extra);
      await ghostApiClient.invites.delete(args);
      return {
        content: [
          {
            type: "text",
            text: `Invite with id ${args.id} deleted.`,
          },
        ],
      };
    }
  );
}