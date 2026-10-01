import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnectedClient } from './testUtils';

const webhooksMock = {
    add: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { webhooks: webhooksMock },
}));

const { registerWebhookTools } = await import('./webhooks');

describe('webhooks tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects webhooks_add when required event/target_url fields are missing', async () => {
        const { client } = await createConnectedClient(registerWebhookTools);

        await expect(client.callTool({ name: 'webhooks_add', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(webhooksMock.add).not.toHaveBeenCalled();
    });

    it('forwards valid webhooks_add input to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerWebhookTools);
        webhooksMock.add.mockResolvedValue({ id: '1' });

        await client.callTool({
            name: 'webhooks_add',
            arguments: { event: 'post.published', target_url: 'https://example.com/hook' },
        });

        expect(webhooksMock.add).toHaveBeenCalledWith({ event: 'post.published', target_url: 'https://example.com/hook' });
    });

    it('rejects webhooks_edit when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerWebhookTools);

        await expect(client.callTool({ name: 'webhooks_edit', arguments: { event: 'post.published' } })).rejects.toThrow(/Invalid arguments/);
        expect(webhooksMock.edit).not.toHaveBeenCalled();
    });

    it('rejects webhooks_delete when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerWebhookTools);

        await expect(client.callTool({ name: 'webhooks_delete', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(webhooksMock.delete).not.toHaveBeenCalled();
    });
});
