// src/tools/posts.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

// Parameter schemas as ZodRawShape (object literals)
const browseParams = {
  filter: z.string().optional().describe("Ghost NQL filter expression to narrow the list of posts, e.g. \"status:published\"."),
  limit: z.number().optional().describe("Maximum number of posts to return per page."),
  page: z.number().optional().describe("Page number to retrieve, starting at 1."),
  order: z.string().optional().describe("Sort order expression, e.g. \"published_at DESC\"."),
};
const readParams = {
  id: z.string().optional().describe("Ghost post ID to look up. Provide either id or slug."),
  slug: z.string().optional().describe("Ghost post slug to look up. Provide either id or slug."),
};
// Shared mutable post fields — accepted by both posts_add and posts_edit.
// Mirrors the Ghost Admin API post resource:
// https://ghost.org/docs/admin-api/#the-post-object
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
const postMutableFields = {
  html: z.string().optional().describe("Post body content as raw HTML. When set, the post is saved using the html content source."),
  lexical: z.string().optional().describe("Post body content as a Ghost Lexical editor JSON document."),
  status: z.string().optional().describe("Publish state of the post, e.g. \"draft\", \"published\", or \"scheduled\"."),
  slug: z.string().optional().describe("URL slug for the post. Auto-generated from the title when omitted."),
  visibility: z.string().optional().describe("Who can view the post, e.g. \"public\", \"members\", \"paid\", or \"tiers\"."),
  featured: z.boolean().optional().describe("Whether the post is marked as featured."),
  email_only: z.boolean().optional().describe("Whether the post is delivered only as an email newsletter, not published on the site."),
  published_at: z.string().optional().describe("ISO 8601 timestamp for when the post was or should be published."),
  custom_excerpt: z.string().optional().describe("Short custom excerpt/summary shown in post listings."),
  feature_image: z.string().optional().describe("URL of the post's feature image."),
  feature_image_alt: z.string().optional().describe("Alt text for the feature image."),
  feature_image_caption: z.string().optional().describe("Caption displayed under the feature image."),
  meta_title: z.string().optional().describe("SEO meta title override for search engines."),
  meta_description: z.string().optional().describe("SEO meta description override for search engines."),
  og_title: z.string().optional().describe("Open Graph title override used for Facebook/LinkedIn link previews."),
  og_description: z.string().optional().describe("Open Graph description override used for Facebook/LinkedIn link previews."),
  og_image: z.string().optional().describe("Open Graph image URL used for Facebook/LinkedIn link previews."),
  twitter_title: z.string().optional().describe("Twitter card title override used for Twitter/X link previews."),
  twitter_description: z.string().optional().describe("Twitter card description override used for Twitter/X link previews."),
  twitter_image: z.string().optional().describe("Twitter card image URL used for Twitter/X link previews."),
  codeinjection_head: z.string().optional().describe("Raw HTML/JS/CSS injected into the page <head> for this post."),
  codeinjection_foot: z.string().optional().describe("Raw HTML/JS/CSS injected before the closing </body> tag for this post."),
  canonical_url: z.string().optional().describe("Canonical URL to use if this content is republished elsewhere."),
  tags: z.array(tagRef).optional().describe("Tags to attach to the post, as strings (names) or tag reference objects."),
  authors: z.array(authorRef).optional().describe("Authors to attach to the post, as strings (emails) or author reference objects."),
};
const addParams = {
  title: z.string().describe("Title of the new post."),
  ...postMutableFields,
};
const editParams = {
  id: z.string().describe("Ghost post ID to edit."),
  updated_at: z.string().describe("The post's current updated_at timestamp, required by Ghost to detect edit conflicts."),
  title: z.string().optional().describe("New title for the post."),
  ...postMutableFields,
};
const deleteParams = {
  id: z.string().describe("Ghost post ID to delete."),
};

export function registerPostTools(server: McpServer) {
  // Browse posts
  server.tool(
    "posts_browse",
    "List Ghost blog posts with optional filtering, pagination, and ordering.",
    browseParams,
    async (args, _extra) => {
      const posts = await ghostApiClient.posts.browse(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(posts, null, 2),
          },
        ],
      };
    }
  );

  // Read post
  server.tool(
    "posts_read",
    "Retrieve a single Ghost blog post by ID or slug.",
    readParams,
    async (args, _extra) => {
      const post = await ghostApiClient.posts.read(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(post, null, 2),
          },
        ],
      };
    }
  );

  // Add post
  server.tool(
    "posts_add",
    "Create a new Ghost blog post with a title, optional HTML/Lexical content, and metadata.",
    addParams,
    async (args, _extra) => {
      // If html is present, use source: "html" to ensure Ghost uses the html content
      const options = args.html ? { source: "html" } : undefined;
      const post = await ghostApiClient.posts.add(args, options);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(post, null, 2),
          },
        ],
      };
    }
  );

  // Edit post
  server.tool(
    "posts_edit",
    "Update an existing Ghost blog post by ID.",
    editParams,
    async (args, _extra) => {
      // If html is present, use source: "html" to ensure Ghost uses the html content for updates
      const options = args.html ? { source: "html" } : undefined;
      const post = await ghostApiClient.posts.edit(args, options);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(post, null, 2),
          },
        ],
      };
    }
  );

  // Delete post
  server.tool(
    "posts_delete",
    "Permanently delete a Ghost blog post by ID.",
    deleteParams,
    async (args, _extra) => {
      await ghostApiClient.posts.delete(args);
      return {
        content: [
          {
            type: "text",
            text: `Post with id ${args.id} deleted.`,
          },
        ],
      };
    }
  );
}