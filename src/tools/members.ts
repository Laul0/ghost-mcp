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
  id: z.string().optional().describe("Ghost member ID to look up. Provide either id or email."),
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
  id: z.string().describe("Ghost member ID to edit."),
  email: z.string().optional().describe("New email address for the member."),
  name: z.string().optional().describe("New display name for the member."),
  note: z.string().optional().describe("New internal staff note about the member."),
  labels: z.array(z.object({ name: z.string().describe("Label name."), slug: z.string().optional().describe("Label slug.") })).optional().describe("Labels to attach to the member for segmentation."),
  newsletters: z.array(z.object({ id: z.string().describe("Newsletter ID to subscribe the member to.") })).optional().describe("Newsletters the member should be subscribed to."),
};
const deleteParams = {
  id: z.string().describe("Ghost member ID to delete."),
};

export function registerMemberTools(server: McpServer) {
  // Browse members
  server.tool(
    "members_browse",
    "List Ghost members with optional filtering, pagination, and ordering.",
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
    "Retrieve a single Ghost member by ID or email.",
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
    "Create a new Ghost member/subscriber.",
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
    "Update an existing Ghost member by ID.",
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
    "Permanently delete a Ghost member by ID.",
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