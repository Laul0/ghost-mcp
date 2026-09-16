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
  id: z.string().optional().describe("Ghost user ID to look up (24-character hexadecimal object ID). Provide id, email, or slug."),
  email: z.string().optional().describe("User email to look up. Provide id, email, or slug."),
  slug: z.string().optional().describe("User slug to look up. Provide id, email, or slug."),
};
const editParams = {
  id: z.string().describe("Ghost user ID to edit (24-character hexadecimal object ID)."),
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
  id: z.string().describe("Ghost user ID to delete (24-character hexadecimal object ID)."),
};

export function registerUserTools(server: McpServer) {
  // Browse users
  server.tool(
    "users_browse",
    "List Ghost staff users with optional filtering, pagination, and ordering. Returns an array of user objects (empty array if none match), each including id, name, email, and roles. Use this to find a staff user before reading or editing their profile, e.g. limit: 20.",
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
    "Retrieve a single Ghost staff user by ID, email, or slug. Returns the full user profile including bio and social links, or an error if no user matches. Use this once you know an identifier (e.g. from users_browse) and need full details, e.g. email: \"jane@example.com\".",
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
    "Update an existing Ghost staff user's profile by ID. Returns the updated user object. Only the fields you provide are changed; this tool cannot change a user's role or password. Use this to update contact info or bio once you have the user's ID, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\", bio: \"Editor-in-chief\".",
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
    "Permanently delete a Ghost staff user by ID. Returns a plain-text confirmation message; this action cannot be undone and revokes the user's admin access. Use this only after confirming the correct user via users_browse or users_read, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\".",
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