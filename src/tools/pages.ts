import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

const browseParams = {
  filter: z.string().optional().describe("Ghost NQL filter expression to narrow the list of pages, e.g. \"status:published\"."),
  limit: z.number().optional().describe("Maximum number of pages to return per page."),
  page: z.number().optional().describe("Page number to retrieve, starting at 1."),
  order: z.string().optional().describe("Sort order expression, e.g. \"title ASC\"."),
};
const readParams = {
  id: z.string().optional().describe("Ghost page ID to look up (24-character hexadecimal object ID). Provide either id or slug."),
  slug: z.string().optional().describe("Ghost page slug to look up. Provide either id or slug."),
};
const tagRef = z.union([
  z.string(),
  z.object({
    id: z.string().optional().describe("Existing tag ID to attach."),
    slug: z.string().optional().describe("Existing tag slug to attach."),
    name: z.string().optional().describe("Tag name to create or attach."),
  }),
]);
const authorRef = z.union([
  z.string(),
  z.object({
    id: z.string().optional().describe("Existing author (user) ID to attach."),
    slug: z.string().optional().describe("Existing author (user) slug to attach."),
    email: z.string().optional().describe("Existing author (user) email to attach."),
  }),
]);
const pageMutableFields = {
  html: z.string().optional().describe("Page body content as raw HTML. When set, the page is saved using the html content source."),
  lexical: z.string().optional().describe("Page body content as a Ghost Lexical editor JSON document."),
  status: z.string().optional().describe("Publish state of the page, e.g. \"draft\", \"published\", or \"scheduled\"."),
  slug: z.string().optional().describe("URL slug for the page. Auto-generated from the title when omitted."),
  visibility: z.string().optional().describe("Who can view the page, e.g. \"public\", \"members\", \"paid\", or \"tiers\"."),
  featured: z.boolean().optional().describe("Whether the page is marked as featured."),
  published_at: z.string().optional().describe("ISO 8601 timestamp for when the page was or should be published."),
  custom_excerpt: z.string().optional().describe("Short custom excerpt or summary for the page."),
  feature_image: z.string().optional().describe("URL of the page's feature image."),
  feature_image_alt: z.string().optional().describe("Alt text for the feature image."),
  feature_image_caption: z.string().optional().describe("Caption displayed under the feature image."),
  meta_title: z.string().optional().describe("SEO meta title override for search engines."),
  meta_description: z.string().optional().describe("SEO meta description override for search engines."),
  og_title: z.string().optional().describe("Open Graph title override used for social link previews."),
  og_description: z.string().optional().describe("Open Graph description override used for social link previews."),
  og_image: z.string().optional().describe("Open Graph image URL used for social link previews."),
  twitter_title: z.string().optional().describe("Twitter card title override used for Twitter/X link previews."),
  twitter_description: z.string().optional().describe("Twitter card description override used for Twitter/X link previews."),
  twitter_image: z.string().optional().describe("Twitter card image URL used for Twitter/X link previews."),
  codeinjection_head: z.string().optional().describe("Raw HTML/JS/CSS injected into the page <head>."),
  codeinjection_foot: z.string().optional().describe("Raw HTML/JS/CSS injected before the closing </body> tag."),
  canonical_url: z.string().optional().describe("Canonical URL to use if this page is republished elsewhere."),
  tags: z.array(tagRef).optional().describe("Tags to attach to the page, as strings or tag reference objects."),
  authors: z.array(authorRef).optional().describe("Authors to attach to the page, as strings or author reference objects."),
};
const addParams = {
  title: z.string().describe("Title of the new page."),
  ...pageMutableFields,
};
const editParams = {
  id: z.string().describe("Ghost page ID to edit (24-character hexadecimal object ID)."),
  updated_at: z.string().describe("The page's current updated_at timestamp, required by Ghost to detect edit conflicts."),
  title: z.string().optional().describe("New title for the page."),
  ...pageMutableFields,
};
const deleteParams = {
  id: z.string().describe("Ghost page ID to delete (24-character hexadecimal object ID)."),
};

export function registerPageTools(server: McpServer) {
  server.tool(
    "pages_browse",
    "List Ghost static pages with optional filtering, pagination, and ordering. Returns an array of page objects, empty if none match. Use this before reading, editing, or deleting a specific page, e.g. filter: \"status:published\". Pages exclude routes created through dynamic routing.",
    browseParams,
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await ghostApiClient.pages.browse(args), null, 2) }],
    })
  );

  server.tool(
    "pages_read",
    "Retrieve a single Ghost static page by ID or slug. Returns the full page object including html/lexical content, or an error if no page matches. Use this after pages_browse when complete content is needed, e.g. slug: \"about\". Dynamic routes are not pages and cannot be returned.",
    readParams,
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await ghostApiClient.pages.read(args), null, 2) }],
    })
  );

  server.tool(
    "pages_add",
    "Create a new Ghost static page. Returns the created page object including its generated ID and slug. Only title is required; the page defaults to draft unless status is set. Use this for standalone content outside post channels, e.g. title: \"About\", status: \"draft\".",
    addParams,
    async (args) => {
      const options = args.html ? { source: "html" } : undefined;
      const page = await ghostApiClient.pages.add(args, options);
      return { content: [{ type: "text", text: JSON.stringify(page, null, 2) }] };
    }
  );

  server.tool(
    "pages_edit",
    "Update an existing Ghost static page by ID. Returns the updated page object. Requires the current updated_at timestamp; the edit fails if it is stale. Use pages_read first, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\", status: \"published\".",
    editParams,
    async (args) => {
      const options = args.html ? { source: "html" } : undefined;
      const page = await ghostApiClient.pages.edit(args, options);
      return { content: [{ type: "text", text: JSON.stringify(page, null, 2) }] };
    }
  );

  server.tool(
    "pages_delete",
    "Permanently delete a Ghost static page by ID. Returns a plain-text confirmation; this action cannot be undone. Confirm the page with pages_browse or pages_read first, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\".",
    deleteParams,
    async (args) => {
      await ghostApiClient.pages.delete(args);
      return { content: [{ type: "text", text: `Page with id ${args.id} deleted.` }] };
    }
  );
}
