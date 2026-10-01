// src/tools/invites.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

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
    "List pending Ghost staff user invitations. Returns an array of invite objects (empty array if none are pending), each including id, email, and role_id. Use this to check whether someone has already been invited before sending a new invite, e.g. limit: 20.",
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
    "Invite a new staff user to Ghost by email with a given role. Returns the created invite object; the recipient must accept the emailed invitation before becoming an active user. Fails if the email already belongs to an active user or already has a pending invite. Look up role_id via roles_browse first, e.g. email: \"jane@example.com\", role_id: \"64f1a2b3c4d5e6f7a8b9c0d1\".",
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
    "Revoke/delete a pending Ghost staff user invitation by ID. Returns a plain-text confirmation message; this action cannot be undone and the invite link stops working immediately. Use this only after confirming the correct invite via invites_browse, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\".",
    deleteParams,
    async (args, _extra) => {
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