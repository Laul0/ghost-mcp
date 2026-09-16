// src/tools/members.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

// Parameter schemas as ZodRawShape (object literals)
const browseParams = {
  filter: z.string().optional().describe("Ghost NQL filter expression to narrow the list of members, e.g. \"status:paid\"."),
  limit: z.number().optional().describe("Maximum number of members to return per page."),
  page: z.number().optional().describe("Page number to retrieve, starting at 1."),
  order: z.string().optional().describe("Sort order expression, e.g. \"created_at DESC\"."),
};
const readParams = {
  id: z.string().optional().describe("Ghost member ID to look up (24-character hexadecimal object ID). Provide either id or email."),
  email: z.string().optional().describe("Member email address to look up. Provide either id or email."),
};
const addParams = {
  email: z.string().describe("Email address of the new member. Must be unique."),
  name: z.string().optional().describe("Display name of the member."),
  note: z.string().optional().describe("Internal staff note about the member."),
  labels: z.array(z.object({ name: z.string().describe("Label name."), slug: z.string().optional().describe("Label slug.") })).optional().describe("Labels to attach to the member for segmentation."),
  newsletters: z.array(z.object({ id: z.string().describe("Newsletter ID to subscribe the member to.") })).optional().describe("Newsletters the member should be subscribed to."),
};
const editParams = {
  id: z.string().describe("Ghost member ID to edit (24-character hexadecimal object ID)."),
  email: z.string().optional().describe("New email address for the member."),
  name: z.string().optional().describe("New display name for the member."),
  note: z.string().optional().describe("New internal staff note about the member."),
  labels: z.array(z.object({ name: z.string().describe("Label name."), slug: z.string().optional().describe("Label slug.") })).optional().describe("Labels to attach to the member for segmentation."),
  newsletters: z.array(z.object({ id: z.string().describe("Newsletter ID to subscribe the member to.") })).optional().describe("Newsletters the member should be subscribed to."),
};
const deleteParams = {
  id: z.string().describe("Ghost member ID to delete (24-character hexadecimal object ID)."),
};

export function registerMemberTools(server: McpServer) {
  // Browse members
  server.tool(
    "members_browse",
    "List Ghost members with optional filtering, pagination, and ordering. Returns an array of member objects (empty array if none match), each including id, email, name, and status. Use this to search or page through members before reading, editing, or deleting a specific one, e.g. filter: \"status:paid\", limit: 15.",
    browseParams,
    async (args, _extra) => {
      const members = await ghostApiClient.members.browse(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(members, null, 2),
          },
        ],
      };
    }
  );

  // Read member
  server.tool(
    "members_read",
    "Retrieve a single Ghost member by ID or email. Returns the full member object including labels and newsletter subscriptions, or an error if no member matches. Use this once you know the ID or email (e.g. from members_browse) and need full details, e.g. email: \"jane@example.com\".",
    readParams,
    async (args, _extra) => {
      const member = await ghostApiClient.members.read(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(member, null, 2),
          },
        ],
      };
    }
  );

  // Add member
  server.tool(
    "members_add",
    "Create a new Ghost member/subscriber. Returns the created member object including its generated ID. Only email is required and must be unique; fails if a member with that email already exists. Use this to manually add a subscriber outside of the normal signup flow, e.g. email: \"jane@example.com\", name: \"Jane Doe\".",
    addParams,
    async (args, _extra) => {
      const member = await ghostApiClient.members.add(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(member, null, 2),
          },
        ],
      };
    }
  );

  // Edit member
  server.tool(
    "members_edit",
    "Update an existing Ghost member by ID. Returns the updated member object. Only the fields you provide are changed; omitted fields are left as-is. Use this to update contact info, notes, labels, or newsletter subscriptions for a member you already have the ID for, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\", note: \"VIP customer\".",
    editParams,
    async (args, _extra) => {
      const member = await ghostApiClient.members.edit(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(member, null, 2),
          },
        ],
      };
    }
  );

  // Delete member
  server.tool(
    "members_delete",
    "Permanently delete a Ghost member by ID. Returns a plain-text confirmation message; this action cannot be undone and cancels any active subscriptions. Use this only after confirming the correct member via members_browse or members_read, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\".",
    deleteParams,
    async (args, _extra) => {
      await ghostApiClient.members.delete(args);
      return {
        content: [
          {
            type: "text",
            text: `Member with id ${args.id} deleted.`,
          },
        ],
      };
    }
  );
}