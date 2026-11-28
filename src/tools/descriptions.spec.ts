import { beforeEach, describe, expect, it, vi } from "vitest";
import GhostAdminAPI from "@tryghost/admin-api";
import { createConnectedClient } from "./testUtils";

const mocks = vi.hoisted(() => Object.fromEntries(
    ["posts", "pages", "members", "users", "tags", "newsletters"]
        .map(name => [name, { browse: vi.fn() }]),
));

vi.mock("../ghostApi", () => ({ ghostApiClient: mocks }));

import { registerPostTools } from "./posts";
import { registerPageTools } from "./pages";
import { registerMemberTools } from "./members";
import { registerUserTools } from "./users";
import { registerTagTools } from "./tags";
import { registerNewsletterTools } from "./newsletters";
import { registerTierTools } from "./tiers";
import { registerOfferTools } from "./offers";
import { registerInviteTools } from "./invites";
import { registerRoleTools } from "./roles";

describe("tool descriptions", () => {
    beforeEach(() => vi.clearAllMocks());

    it.each([
        ["posts", registerPostTools],
        ["pages", registerPageTools],
        ["members", registerMemberTools],
        ["users", registerUserTools],
        ["tags", registerTagTools],
        ["newsletters", registerNewsletterTools],
    ] as const)("%s browse describes the serialized pagination limitation", async (name, register) => {
        const { client, server } = await createConnectedClient(register);
        mocks[name].browse.mockResolvedValue(Object.assign([{ id: "target-1" }], {
            meta: { pagination: { page: 1, pages: 2 } },
        }));

        const { tools } = await client.listTools();
        expect(tools.find(tool => tool.name === `${name}_browse`)?.description)
            .toContain("does not include pagination metadata");
        const result = await client.callTool({ name: `${name}_browse`, arguments: { page: 1, limit: 1 } });
        expect(result).toMatchObject({
            content: [{ type: "text", text: JSON.stringify([{ id: "target-1" }], null, 2) }],
        });
        expect(mocks[name].browse).toHaveBeenCalledWith({ page: 1, limit: 1 });
        await client.close();
        await server.close();
    });

    it.each([
        ["tiers", registerTierTools, 5],
        ["offers", registerOfferTools, 5],
        ["invites", registerInviteTools, 3],
        ["roles", registerRoleTools, 2],
    ] as const)("%s tools disclose that the SDK resource is unavailable", async (name, register, count) => {
        const sdk = new GhostAdminAPI({
            url: "https://example.invalid",
            key: `${"0".repeat(24)}:${"0".repeat(64)}`,
            version: "v5.0",
        });
        expect(sdk[name]).toBeUndefined();
        const { client, server } = await createConnectedClient(register);
        const { tools } = await client.listTools();
        expect(tools).toHaveLength(count);
        for (const tool of tools) {
            expect(tool.description).toContain("Currently unavailable");
        }
        await client.close();
        await server.close();
    });
});
