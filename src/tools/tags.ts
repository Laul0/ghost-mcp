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
  id: z.string().optional().describe("Ghost tag ID to look up. Provide either id or slug."),
  slug: z.string().optional().describe("Ghost tag slug to look up. Provide either id or slug."),
};
const addParams = {
  name: z.string().describe("Name of the new tag."),
  description: z.string().optional().describe("Longer description of what this tag represents."),
  slug: z.string().optional().describe("URL slug for the tag. Auto-generated from the name when omitted."),
  // Add more fields as needed
};
const editParams = {
  id: z.string().describe("Ghost tag ID to edit."),
  name: z.string().optional().describe("New name for the tag."),
  description: z.string().optional().describe("New description for the tag."),
  slug: z.string().optional().describe("New URL slug for the tag."),
  // Add more fields as needed
};
const deleteParams = {
  id: z.string().describe("Ghost tag ID to delete."),
};

export function registerTagTools(server: McpServer) {
  // Browse tags
  server.tool(
    "tags_browse",
    "List Ghost tags with optional filtering, pagination, and ordering.",
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
    "Retrieve a single Ghost tag by ID or slug.",
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
    "Create a new Ghost tag.",
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
    "Update an existing Ghost tag by ID.",
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
    "Permanently delete a Ghost tag by ID.",
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