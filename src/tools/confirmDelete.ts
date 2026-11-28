import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RequestId } from "@modelcontextprotocol/sdk/types.js";

export const DELETE_CONFIRMATION_DESCRIPTION =
  " Requests user confirmation through MCP form elicitation before deleting. Declining, cancelling, or failing the confirmation blocks deletion. If the client cannot show the confirmation, deletion is blocked unless the server operator has enabled unconfirmed deletions.";

export const DELETE_ANNOTATIONS = { destructiveHint: true, readOnlyHint: false };

const effects = {
  post: "The post and its content will be permanently deleted.",
  page: "The page and its content will be permanently deleted.",
  member: "The member will be permanently deleted and active subscriptions will be cancelled.",
  user: "The staff user will be permanently deleted and their admin access revoked.",
  tag: "The tag will be permanently deleted and removed from posts.",
  tier: "The tier will be permanently deleted, potentially affecting subscribed members.",
  offer: "The offer will be permanently deleted and its redemption code will stop working.",
  newsletter: "The newsletter will be permanently deleted and all members unsubscribed.",
  invite: "The invitation will be revoked and its link will stop working.",
  webhook: "The webhook will be permanently deleted and future notifications will stop.",
} as const;

export async function confirmDelete(
  server: McpServer,
  entity: keyof typeof effects,
  id: string,
  extra: { signal: AbortSignal; requestId: RequestId },
): Promise<void> {
  const elicitation = server.server.getClientCapabilities()?.elicitation;
  const supportsForm = elicitation && (elicitation.form || Object.keys(elicitation).length === 0);
  if (!supportsForm) {
    if (process.env.GHOST_ALLOW_UNCONFIRMED_DELETES === "true" && !extra.signal.aborted) {
      return;
    }
    throw new Error("Deletion blocked: the MCP client does not support confirmation. Use a client with form elicitation support.");
  }

  let result;
  try {
    result = await server.server.elicitInput({
      mode: "form",
      message: `Confirm deletion of Ghost ${entity} with ID ${JSON.stringify(id)}. ${effects[entity]} This cannot be undone.`,
      requestedSchema: {
        type: "object",
        properties: {
          confirm: { type: "boolean", title: "Confirm permanent deletion" },
        },
        required: ["confirm"],
      },
    }, { signal: extra.signal, relatedRequestId: extra.requestId, timeout: 120000 });
  } catch {
    throw new Error("Deletion blocked: confirmation could not be completed.");
  }

  if (extra.signal.aborted || result.action !== "accept" || result.content?.confirm !== true) {
    throw new Error("Deletion blocked: confirmation was not granted.");
  }
}
