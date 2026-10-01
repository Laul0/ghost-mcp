// src/tools/newsletters.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

// Parameter schemas as ZodRawShape (object literals)
const browseParams = {
  filter: z.string().optional().describe("Ghost NQL filter expression to narrow the list of newsletters."),
  limit: z.number().optional().describe("Maximum number of newsletters to return per page."),
  page: z.number().optional().describe("Page number to retrieve, starting at 1."),
  order: z.string().optional().describe("Sort order expression, e.g. \"name ASC\"."),
};
const readParams = {
  id: z.string().optional().describe("Ghost newsletter ID to look up (24-character hexadecimal object ID). Provide either id or slug."),
  slug: z.string().optional().describe("Ghost newsletter slug to look up. Provide either id or slug."),
};
const addParams = {
  name: z.string().describe("Name of the new newsletter."),
  description: z.string().optional().describe("Description of the newsletter shown to subscribers."),
  sender_reply_to: z.string().optional().describe("Reply-to email address used for outgoing newsletter emails."),
  status: z.string().optional().describe("Newsletter status, e.g. \"active\" or \"archived\"."),
  subscribe_on_signup: z.boolean().optional().describe("Whether new members are subscribed to this newsletter by default."),
  show_header_icon: z.boolean().optional().describe("Whether to display the site icon in the newsletter header."),
  show_header_title: z.boolean().optional().describe("Whether to display the site title in the newsletter header."),
  show_header_name: z.boolean().optional().describe("Whether to display the newsletter's own name in the header."),
  title_font_category: z.string().optional().describe("Font category used for post titles, e.g. \"sans_serif\" or \"serif\"."),
  title_alignment: z.string().optional().describe("Alignment for post titles, e.g. \"left\" or \"center\"."),
  show_feature_image: z.boolean().optional().describe("Whether to include each post's feature image in the newsletter."),
  body_font_category: z.string().optional().describe("Font category used for the newsletter body, e.g. \"sans_serif\" or \"serif\"."),
  show_badge: z.boolean().optional().describe("Whether to show the \"Published with Ghost\" badge in the footer."),
  // Add more fields as needed
};
const editParams = {
  id: z.string().describe("Ghost newsletter ID to edit."),
  name: z.string().optional().describe("New name for the newsletter."),
  description: z.string().optional().describe("New description for the newsletter."),
  sender_name: z.string().optional().describe("New sender display name shown to email recipients."),
  sender_email: z.string().optional().describe("New sender email address (must be verified with Ghost)."),
  sender_reply_to: z.string().optional().describe("New reply-to email address used for outgoing newsletter emails."),
  status: z.string().optional().describe("New newsletter status, e.g. \"active\" or \"archived\"."),
  subscribe_on_signup: z.boolean().optional().describe("Whether new members are subscribed to this newsletter by default."),
  sort_order: z.number().optional().describe("Display order of this newsletter relative to others."),
  header_image: z.string().optional().describe("URL of the image shown in the newsletter header."),
  show_header_icon: z.boolean().optional().describe("Whether to display the site icon in the newsletter header."),
  show_header_title: z.boolean().optional().describe("Whether to display the site title in the newsletter header."),
  title_font_category: z.string().optional().describe("Font category used for post titles."),
  title_alignment: z.string().optional().describe("Alignment for post titles, e.g. \"left\" or \"center\"."),
  show_feature_image: z.boolean().optional().describe("Whether to include each post's feature image in the newsletter."),
  body_font_category: z.string().optional().describe("Font category used for the newsletter body."),
  footer_content: z.string().optional().describe("Custom HTML content shown in the newsletter footer."),
  show_badge: z.boolean().optional().describe("Whether to show the \"Published with Ghost\" badge in the footer."),
  show_header_name: z.boolean().optional().describe("Whether to display the newsletter's own name in the header."),
  // Add more fields as needed
};
const deleteParams = {
  id: z.string().describe("Ghost newsletter ID to delete (24-character hexadecimal object ID)."),
};

export function registerNewsletterTools(server: McpServer) {
  // Browse newsletters
  server.tool(
    "newsletters_browse",
    "List Ghost newsletters with optional filtering, pagination, and ordering. Returns an array of newsletter objects (empty array if none match), each including id, name, and status. Use this to find a newsletter's ID before editing it or subscribing a member to it, e.g. limit: 10.",
    browseParams,
    async (args, _extra) => {
      const newsletters = await ghostApiClient.newsletters.browse(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(newsletters, null, 2),
          },
        ],
      };
    }
  );

  // Read newsletter
  server.tool(
    "newsletters_read",
    "Retrieve a single Ghost newsletter by ID or slug. Returns the full newsletter object including its design/sender settings, or an error if no newsletter matches. Use this once you know the ID or slug (e.g. from newsletters_browse) and need full details, e.g. slug: \"weekly-digest\".",
    readParams,
    async (args, _extra) => {
      const newsletter = await ghostApiClient.newsletters.read(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(newsletter, null, 2),
          },
        ],
      };
    }
  );

  // Add newsletter
  server.tool(
    "newsletters_add",
    "Create a new Ghost newsletter. Returns the created newsletter object including its generated ID. Only name is required; sender and design fields default to Ghost's standard newsletter settings. Use this to set up a new email list separate from the default newsletter, e.g. name: \"Weekly Digest\".",
    addParams,
    async (args, _extra) => {
      const newsletter = await ghostApiClient.newsletters.add(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(newsletter, null, 2),
          },
        ],
      };
    }
  );

  // Edit newsletter
  server.tool(
    "newsletters_edit",
    "Update an existing Ghost newsletter by ID. Returns the updated newsletter object. Only the fields you provide are changed; sender_email changes may require Ghost's email verification step. Use this to adjust sender info or design once you have the newsletter's ID, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\", sender_name: \"Jane Doe\".",
    editParams,
    async (args, _extra) => {
      const newsletter = await ghostApiClient.newsletters.edit(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(newsletter, null, 2),
          },
        ],
      };
    }
  );

  // Delete newsletter
  server.tool(
    "newsletters_delete",
    "Permanently delete a Ghost newsletter by ID. Returns a plain-text confirmation message; this action cannot be undone and unsubscribes all members from it. Use this only after confirming the correct newsletter via newsletters_browse or newsletters_read, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\".",
    deleteParams,
    async (args, _extra) => {
      await ghostApiClient.newsletters.delete(args);
      return {
        content: [
          {
            type: "text",
            text: `Newsletter with id ${args.id} deleted.`,
          },
        ],
      };
    }
  );
}