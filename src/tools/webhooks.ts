// src/tools/webhooks.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ghostApiClient } from "../ghostApi";

// Parameter schemas as ZodRawShape (object literals)
const addParams = {
  event: z.string().describe("Ghost event name to subscribe to, e.g. \"post.published\"."),
  target_url: z.string().describe("URL Ghost will POST the event payload to."),
  name: z.string().optional().describe("Display name for the webhook."),
  secret: z.string().optional().describe("Shared secret used to sign the webhook payload for verification."),
  api_version: z.string().optional().describe("Ghost API version the payload should be formatted for."),
  integration_id: z.string().optional().describe("Integration ID that owns this webhook. Required for user-authenticated requests."), // Required for user-authenticated requests
};
const editParams = {
  id: z.string().describe("Ghost webhook ID to edit (24-character hexadecimal object ID)."),
  event: z.string().optional().describe("New Ghost event name to subscribe to."),
  target_url: z.string().optional().describe("New URL Ghost will POST the event payload to."),
  name: z.string().optional().describe("New display name for the webhook."),
  api_version: z.string().optional().describe("New Ghost API version the payload should be formatted for."),
};
const deleteParams = {
  id: z.string().describe("Ghost webhook ID to delete (24-character hexadecimal object ID)."),
};

export function registerWebhookTools(server: McpServer) {
  // Add webhook
  server.tool(
    "webhooks_add",
    "Create a new Ghost webhook that notifies a target URL when a given event occurs. Returns the created webhook object including its generated ID. Ghost sends an HTTP POST with the event payload to target_url every time the event fires; there is no built-in retry visibility from this tool. Use this to integrate external automations, e.g. event: \"post.published\", target_url: \"https://example.com/hook\".",
    addParams,
    async (args, _extra) => {
      const webhook = await ghostApiClient.webhooks.add(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(webhook, null, 2),
          },
        ],
      };
    }
  );

  // Edit webhook
  server.tool(
    "webhooks_edit",
    "Update an existing Ghost webhook by ID. Returns the updated webhook object. Only the fields you provide are changed; there is no webhooks_browse/read tool, so keep track of IDs when you create them. Use this to change the target URL or subscribed event, e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\", target_url: \"https://example.com/new-hook\".",
    editParams,
    async (args, _extra) => {
      const webhook = await ghostApiClient.webhooks.edit(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(webhook, null, 2),
          },
        ],
      };
    }
  );

  // Delete webhook
  server.tool(
    "webhooks_delete",
    "Permanently delete a Ghost webhook by ID. Returns a plain-text confirmation message; this action cannot be undone and stops all future notifications for that webhook. Use this once you have the ID from when the webhook was created (there is no browse/read endpoint), e.g. id: \"64f1a2b3c4d5e6f7a8b9c0d1\".",
    deleteParams,
    async (args, _extra) => {
      await ghostApiClient.webhooks.delete(args);
      return {
        content: [
          {
            type: "text",
            text: `Webhook with id ${args.id} deleted.`,
          },
        ],
      };
    }
  );
}