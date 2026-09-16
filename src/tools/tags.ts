// src/tools/tags.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

// Parameter schemas as ZodRawShape (object literals)
const browseParams = {
  filter: z.string().optional().describe("Ghost NQL filter expression to narrow the list of tags."),
  limit: z.number().optional().describe("Maximum number of tags to return per page."),
  page: z.number().optional().describe("Page number to retrieve, starting at 1."),
  order: z.string().optional().describe("Sort order expression, e.g. \"name ASC\"."),
};
const readParams = {
  id: z.string().optional().describe("Ghost tag ID to look up (24-character hexadecimal object ID). Provide either id or slug."),
  slug: z.string().optional().describe("Ghost tag slug to look up. Provide either id or slug."),
};
const addParams = {
  name: z.string().describe("Name of the new tag."),
  description: z.string().optional().describe("Longer description of what this tag represents."),
  slug: z.string().optional().describe("URL slug for the tag. Auto-generated from the name when omitted."),
  // Add more fields as needed
};
const editParams = {
  id: z.string().describe("Ghost tag ID to edit (24-character hexadecimal object ID)."),
  name: z.string().optional().describe("New name for the tag."),
  description: z.string().optional().describe("New description for the tag."),
  slug: z.string().optional().describe("New URL slug for the tag."),
  // Add more fields as needed
};
const deleteParams = {
  id: z.string().describe("Ghost tag ID to delete (24-character hexadecimal object ID)."),
};

export function registerTagTools(server: McpServer) {
  // Browse tags
  server.tool(
    "tags_browse",
    "List Ghost tags with optional filtering, pagination, and ordering. Returns an array of tag objects (empty array if none match), each including id, name, and slug. Use this to search or page through tags before reading, editing, or deleting a specific one, e.g. limit: 20.",
    browseParams,
    async (args, _extra) => {
      const tags = await ghostApiClient.tags.browse(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tags, null, 2),
          },
        ],
      };
    }
  );

  // Read tag
  server.tool(
    "tags_read",
    "Retrieve a single Ghost tag by ID or slug. Returns the full tag object, or an error if no tag matches. Use this once you know the ID or slug (e.g. from tags_browse) and need full details, e.g. slug: \"news\".",
    readParams,
    async (args, _extra) => {
      const tag = await ghostApiClient.tags.read(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tag, null, 2),
          },
        ],
      };
    }
  );

  // Add tag
  server.tool(
    "tags_add",
    "Create a new Ghost tag. Returns the created tag object including its generated ID and slug. Only name is required; slug is auto-generated if omitted. Use this to introduce a new content category before attaching it to posts, e.g. name: \"News\".",
    addParams,
    async (args, _extra) => {
      const tag = await ghostApiClient.tags.add(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tag, null, 2),
          },
        ],
      };
    }
  );

  // Edit tag
  server.tool(
    "tags_edit",
    "Update an existing Ghost tag by ID. Returns the updated tag object. Only the fields you provide are changed; omitted fields are left as-is. Use this to rename a tag or update its description once you have its ID, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\", name: \"Announcements\".",
    editParams,
    async (args, _extra) => {
      const tag = await ghostApiClient.tags.edit(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tag, null, 2),
          },
        ],
      };
    }
  );

  // Delete tag
  server.tool(
    "tags_delete",
    "Permanently delete a Ghost tag by ID. Returns a plain-text confirmation message; this action cannot be undone and removes the tag from any posts using it. Use this only after confirming the correct tag via tags_browse or tags_read, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\".",
    deleteParams,
    async (args, _extra) => {
      await ghostApiClient.tags.delete(args);
      return {
        content: [
          {
            type: "text",
            text: `Tag with id ${args.id} deleted.`,
          },
        ],
      };
    }
  );
}