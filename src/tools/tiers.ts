// src/tools/tiers.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

// Parameter schemas as ZodRawShape (object literals)
const browseParams = {
  filter: z.string().optional().describe("Ghost NQL filter expression to narrow the list of tiers."),
  limit: z.number().optional().describe("Maximum number of tiers to return per page."),
  page: z.number().optional().describe("Page number to retrieve, starting at 1."),
  order: z.string().optional().describe("Sort order expression, e.g. \"name ASC\"."),
  include: z.string().optional().describe("Comma-separated related data to include, e.g. \"monthly_price,yearly_price\"."),
};
const readParams = {
  id: z.string().optional().describe("Ghost tier ID to look up (24-character hexadecimal object ID). Provide either id or slug."),
  slug: z.string().optional().describe("Ghost tier slug to look up. Provide either id or slug."),
  include: z.string().optional().describe("Comma-separated related data to include, e.g. \"monthly_price,yearly_price\"."),
};
const addParams = {
  name: z.string().describe("Name of the new membership tier."),
  description: z.string().optional().describe("Description of the tier shown to members."),
  welcome_page_url: z.string().optional().describe("URL members are redirected to after signing up for this tier."),
  visibility: z.string().optional().describe("Whether the tier is \"public\" or \"none\" (hidden)."),
  monthly_price: z.number().optional().describe("Monthly price for the tier, in the smallest currency unit (e.g. cents)."),
  yearly_price: z.number().optional().describe("Yearly price for the tier, in the smallest currency unit (e.g. cents)."),
  currency: z.string().optional().describe("ISO currency code for the tier's prices, e.g. \"usd\"."),
  benefits: z.array(z.string()).optional().describe("List of benefit descriptions shown to members for this tier."),
  // Add more fields as needed
};
const editParams = {
  id: z.string().describe("Ghost tier ID to edit (24-character hexadecimal object ID)."),
  name: z.string().optional().describe("New name for the tier."),
  description: z.string().optional().describe("New description for the tier."),
  welcome_page_url: z.string().optional().describe("New welcome page URL for the tier."),
  visibility: z.string().optional().describe("New visibility for the tier: \"public\" or \"none\"."),
  monthly_price: z.number().optional().describe("New monthly price for the tier, in the smallest currency unit."),
  yearly_price: z.number().optional().describe("New yearly price for the tier, in the smallest currency unit."),
  currency: z.string().optional().describe("New ISO currency code for the tier's prices."),
  benefits: z.array(z.string()).optional().describe("New list of benefit descriptions for the tier."),
  // Add more fields as needed
};
const deleteParams = {
  id: z.string().describe("Ghost tier ID to delete (24-character hexadecimal object ID)."),
};

export function registerTierTools(server: McpServer) {
  // Browse tiers
  server.tool(
    "tiers_browse",
    "List Ghost membership tiers with optional filtering, pagination, and ordering. Returns an array of tier objects (empty array if none match), each including id, name, and pricing. Use this to review existing tiers before creating an offer or editing a specific tier, e.g. limit: 10.",
    browseParams,
    async (args, _extra) => {
      const tiers = await ghostApiClient.tiers.browse(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tiers, null, 2),
          },
        ],
      };
    }
  );

  // Read tier
  server.tool(
    "tiers_read",
    "Retrieve a single Ghost membership tier by ID or slug. Returns the full tier object including pricing and benefits, or an error if no tier matches. Use this once you know the ID or slug (e.g. from tiers_browse) and need full details, e.g. slug: \"gold\".",
    readParams,
    async (args, _extra) => {
      const tier = await ghostApiClient.tiers.read(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tier, null, 2),
          },
        ],
      };
    }
  );

  // Add tier
  server.tool(
    "tiers_add",
    "Create a new Ghost membership tier. Returns the created tier object including its generated ID. Only name is required; pricing and benefits are optional. Use this to introduce a new paid membership level before attaching offers to it, e.g. name: \"Gold\", monthly_price: 500, currency: \"usd\".",
    addParams,
    async (args, _extra) => {
      const tier = await ghostApiClient.tiers.add(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tier, null, 2),
          },
        ],
      };
    }
  );

  // Edit tier
  server.tool(
    "tiers_edit",
    "Update an existing Ghost membership tier by ID. Returns the updated tier object. Only the fields you provide are changed; omitted fields are left as-is. Use this to adjust pricing, visibility, or benefits once you have the tier's ID, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\", monthly_price: 700.",
    editParams,
    async (args, _extra) => {
      const tier = await ghostApiClient.tiers.edit(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tier, null, 2),
          },
        ],
      };
    }
  );

  // Delete tier
  server.tool(
    "tiers_delete",
    "Permanently delete a Ghost membership tier by ID. Returns a plain-text confirmation message; this action cannot be undone and may affect members currently subscribed to it. Use this only after confirming the correct tier via tiers_browse or tiers_read, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\".",
    deleteParams,
    async (args, _extra) => {
      await ghostApiClient.tiers.delete(args);
      return {
        content: [
          {
            type: "text",
            text: `Tier with id ${args.id} deleted.`,
          },
        ],
      };
    }
  );
}