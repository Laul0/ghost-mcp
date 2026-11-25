import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ElicitRequest, ElicitResult } from "@modelcontextprotocol/sdk/types.js";
import { createConnectedClient } from "./testUtils";

const mocks = vi.hoisted(() => Object.fromEntries(
    ["posts", "pages", "members", "users", "tags", "tiers", "offers", "newsletters", "invites", "webhooks"]
        .map(name => [name, { delete: vi.fn() }]),
));

vi.mock("../ghostApi", () => ({ ghostApiClient: mocks }));

import { registerPostTools } from "./posts";
import { registerPageTools } from "./pages";
import { registerMemberTools } from "./members";
import { registerUserTools } from "./users";
import { registerTagTools } from "./tags";
import { registerTierTools } from "./tiers";
import { registerOfferTools } from "./offers";
import { registerNewsletterTools } from "./newsletters";
import { registerInviteTools } from "./invites";
import { registerWebhookTools } from "./webhooks";

const tools = [
    ["posts", "post", registerPostTools],
    ["pages", "page", registerPageTools],
    ["members", "member", registerMemberTools],
    ["users", "user", registerUserTools],
    ["tags", "tag", registerTagTools],
    ["tiers", "tier", registerTierTools],
    ["offers", "offer", registerOfferTools],
    ["newsletters", "newsletter", registerNewsletterTools],
    ["invites", "invite", registerInviteTools],
    ["webhooks", "webhook", registerWebhookTools],
] as const;

describe("delete confirmation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv("GHOST_ALLOW_UNCONFIRMED_DELETES", "");
    });
    afterEach(() => vi.unstubAllEnvs());

    it.each(tools)("requires confirmation before %s deletion", async (name, entity, register) => {
        const confirm = vi.fn(async (_request: ElicitRequest) => ({ action: "accept" as const, content: { confirm: true } }));
        const { client, server } = await createConnectedClient(register, confirm);
        const { tools: discovered } = await client.listTools();
        expect(discovered.find(tool => tool.name === `${name}_delete`)?.annotations?.destructiveHint).toBe(true);
        const result = await client.callTool({ name: `${name}_delete`, arguments: { id: "target-1" } });

        expect(result.isError).toBeFalsy();
        expect(confirm).toHaveBeenCalledOnce();
        expect(confirm.mock.calls[0][0].params.message).toContain(`${entity} with ID "target-1"`);
        expect(mocks[name].delete).toHaveBeenCalledWith({ id: "target-1" });
        await client.close();
        await server.close();
    });

    it.each([
        { action: "decline" },
        { action: "cancel" },
        { action: "accept", content: { confirm: false } },
        { action: "accept" },
    ] as ElicitResult[])("blocks deletion when confirmation is not granted: %j", async response => {
        const { client, server } = await createConnectedClient(registerPostTools, async () => response);
        const result = await client.callTool({ name: "posts_delete", arguments: { id: "target-1" } });
        expect(result.isError).toBe(true);
        expect(mocks.posts.delete).not.toHaveBeenCalled();
        await client.close();
        await server.close();
    });

    it("blocks unsupported clients and ignores model-supplied force", async () => {
        const { client, server } = await createConnectedClient(registerPostTools);
        const result = await client.callTool({ name: "posts_delete", arguments: { id: "target-1", force: true } });
        expect(result.isError).toBe(true);
        expect(mocks.posts.delete).not.toHaveBeenCalled();
        await client.close();
        await server.close();
    });

    it("permits unsupported clients only with the operator override", async () => {
        vi.stubEnv("GHOST_ALLOW_UNCONFIRMED_DELETES", "true");
        const { client, server } = await createConnectedClient(registerPostTools);
        const result = await client.callTool({ name: "posts_delete", arguments: { id: "target-1" } });
        expect(result.isError).toBeFalsy();
        expect(mocks.posts.delete).toHaveBeenCalledWith({ id: "target-1" });
        await client.close();
        await server.close();
    });

    it("does not bypass declined or failed prompts when the override is enabled", async () => {
        vi.stubEnv("GHOST_ALLOW_UNCONFIRMED_DELETES", "true");
        const { client, server } = await createConnectedClient(registerPostTools, async () => { throw new Error("failed"); });
        const result = await client.callTool({ name: "posts_delete", arguments: { id: "target-1" } });
        expect(result.isError).toBe(true);
        expect(mocks.posts.delete).not.toHaveBeenCalled();
        await client.close();
        await server.close();
    });
});
