// src/tools/users.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

// Parameter schemas as ZodRawShape (object literals)
const browseParams = {
  filter: z.string().optional().describe("Ghost NQL filter expression to narrow the list of users."),
  limit: z.number().optional().describe("Maximum number of users to return per page."),
  page: z.number().optional().describe("Page number to retrieve, starting at 1."),
  order: z.string().optional().describe("Sort order expression, e.g. \"name ASC\"."),
};
const readParams = {
  id: z.string().optional().describe("Ghost user ID to look up. Provide id, email, or slug."),
  email: z.string().optional().describe("User email to look up. Provide id, email, or slug."),
  slug: z.string().optional().describe("User slug to look up. Provide id, email, or slug."),
};
const editParams = {
  id: z.string().describe("Ghost user ID to edit."),
  name: z.string().optional().describe("New display name for the user."),
  email: z.string().optional().describe("New email address for the user."),
  slug: z.string().optional().describe("New URL slug for the user's author page."),
  bio: z.string().optional().describe("New biography text for the user."),
  website: z.string().optional().describe("New personal website URL for the user."),
  location: z.string().optional().describe("New location text for the user."),
  facebook: z.string().optional().describe("New Facebook profile URL or username for the user."),
  twitter: z.string().optional().describe("New Twitter/X profile URL or username for the user."),
  // Add more fields as needed
};
const deleteParams = {
  id: z.string().describe("Ghost user ID to delete."),
};

export function registerUserTools(server: McpServer) {
  // Browse users
  server.tool(
    "users_browse",
    "List Ghost staff users with optional filtering, pagination, and ordering.",
    browseParams,
    async (args, _extra) => {
      const users = await ghostApiClient.users.browse(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(users, null, 2),
          },
        ],
      };
    }
  );

  // Read user
  server.tool(
    "users_read",
    "Retrieve a single Ghost staff user by ID, email, or slug.",
    readParams,
    async (args, _extra) => {
      const user = await ghostApiClient.users.read(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(user, null, 2),
          },
        ],
      };
    }
  );

  // Edit user
  server.tool(
    "users_edit",
    "Update an existing Ghost staff user's profile by ID.",
    editParams,
    async (args, _extra) => {
      const user = await ghostApiClient.users.edit(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(user, null, 2),
          },
        ],
      };
    }
  );

  // Delete user
  server.tool(
    "users_delete",
    "Permanently delete a Ghost staff user by ID.",
    deleteParams,
    async (args, _extra) => {
      await ghostApiClient.users.delete(args);
      return {
        content: [
          {
            type: "text",
            text: `User with id ${args.id} deleted.`,
          },
        ],
      };
    }
  );
}