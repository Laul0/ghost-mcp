// src/tools/offers.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

// Parameter schemas as ZodRawShape (object literals)
const browseParams = {
  filter: z.string().optional().describe("Ghost NQL filter expression to narrow the list of offers."),
  limit: z.number().optional().describe("Maximum number of offers to return per page."),
  page: z.number().optional().describe("Page number to retrieve, starting at 1."),
  order: z.string().optional().describe("Sort order expression, e.g. \"name ASC\"."),
};
const readParams = {
  id: z.string().optional().describe("Ghost offer ID to look up (24-character hexadecimal object ID). Provide either id or code."),
  code: z.string().optional().describe("Offer redemption code to look up. Provide either id or code."),
};
const addParams = {
  name: z.string().describe("Internal display name for the new offer."),
  code: z.string().describe("Unique redemption code members enter to apply the offer."),
  cadence: z.string().describe("Billing cadence the offer applies to, e.g. \"month\" or \"year\"."),
  duration: z.string().describe("How long the discount lasts, e.g. \"once\", \"repeating\", or \"forever\"."),
  amount: z.number().describe("Discount amount: a percentage (0-100) or a fixed amount in the smallest currency unit, depending on type."),
  tier_id: z.string().describe("Ghost tier ID this offer applies to."),
  type: z.string().describe("Discount type: \"percent\" or \"fixed\"."),
  display_title: z.string().optional().describe("Public-facing title shown to members on the checkout page."),
  display_description: z.string().optional().describe("Public-facing description shown to members on the checkout page."),
  duration_in_months: z.number().optional().describe("Number of months the discount repeats for, when duration is \"repeating\"."),
  currency: z.string().optional().describe("ISO currency code for a fixed-amount discount, e.g. \"usd\"."),
  // Add more fields as needed
};
const editParams = {
  id: z.string().describe("Ghost offer ID to edit (24-character hexadecimal object ID)."),
  name: z.string().optional().describe("New internal display name for the offer."),
  code: z.string().optional().describe("New unique redemption code for the offer."),
  display_title: z.string().optional().describe("New public-facing title shown to members."),
  display_description: z.string().optional().describe("New public-facing description shown to members."),
  // Only a subset of fields are editable per Ghost API docs
};
const deleteParams = {
  id: z.string().describe("Ghost offer ID to delete (24-character hexadecimal object ID)."),
};

export function registerOfferTools(server: McpServer) {
  // Browse offers
  server.tool(
    "offers_browse",
    "List Ghost member discount offers with optional filtering, pagination, and ordering. Returns an array of offer objects (empty array if none match), each including id, name, code, and tier_id. Use this to review existing discounts before creating a new one or editing an offer, e.g. limit: 10.",
    browseParams,
    async (args, _extra) => {
      const offers = await ghostApiClient.offers.browse(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(offers, null, 2),
          },
        ],
      };
    }
  );

  // Read offer
  server.tool(
    "offers_read",
    "Retrieve a single Ghost member discount offer by ID or code. Returns the full offer object including pricing and duration, or an error if no offer matches. Use this once you know the ID or redemption code (e.g. from offers_browse) and need full details, e.g. code: \"BF2026\".",
    readParams,
    async (args, _extra) => {
      const offer = await ghostApiClient.offers.read(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(offer, null, 2),
          },
        ],
      };
    }
  );

  // Add offer
  server.tool(
    "offers_add",
    "Create a new Ghost member discount offer for a membership tier. Returns the created offer object including its generated ID. All of name, code, cadence, duration, amount, tier_id, and type are required; look up tier_id via tiers_browse first. Cadence, duration, amount, and type cannot be changed after creation — only name, code, and display text are editable later via offers_edit. Use this to launch a promotional discount, e.g. name: \"Black Friday\", code: \"BF2026\", cadence: \"month\", duration: \"once\", amount: 20, type: \"percent\".",
    addParams,
    async (args, _extra) => {
      const offer = await ghostApiClient.offers.add(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(offer, null, 2),
          },
        ],
      };
    }
  );

  // Edit offer
  server.tool(
    "offers_edit",
    "Update an existing Ghost member discount offer by ID. Returns the updated offer object. Only name, code, display_title, and display_description can be changed; cadence, duration, amount, and type are immutable once created. Use this to rename an offer or change its public copy, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\", display_title: \"Holiday Special\".",
    editParams,
    async (args, _extra) => {
      const offer = await ghostApiClient.offers.edit(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(offer, null, 2),
          },
        ],
      };
    }
  );

  // Delete offer
  server.tool(
    "offers_delete",
    "Permanently delete a Ghost member discount offer by ID. Returns a plain-text confirmation message; this action cannot be undone and the redemption code stops working immediately. Use this only after confirming the correct offer via offers_browse or offers_read, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\".",
    deleteParams,
    async (args, _extra) => {
      await ghostApiClient.offers.delete(args);
      return {
        content: [
          {
            type: "text",
            text: `Offer with id ${args.id} deleted.`,
          },
        ],
      };
    }
  );
}