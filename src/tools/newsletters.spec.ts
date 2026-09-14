import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnectedClient } from './testUtils';

const newslettersMock = {
    browse: vi.fn(),
    read: vi.fn(),
    add: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { newsletters: newslettersMock },
}));

const { registerNewsletterTools } = await import('./newsletters');

describe('newsletters tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects newsletters_add when the required name field is missing', async () => {
        const { client } = await createConnectedClient(registerNewsletterTools);

        await expect(client.callTool({ name: 'newsletters_add', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(newslettersMock.add).not.toHaveBeenCalled();
    });

    it('forwards valid newsletters_add input to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerNewsletterTools);
        newslettersMock.add.mockResolvedValue({ id: '1', name: 'Weekly Digest' });

        await client.callTool({ name: 'newsletters_add', arguments: { name: 'Weekly Digest' } });

        expect(newslettersMock.add).toHaveBeenCalledWith({ name: 'Weekly Digest' });
    });

    it('rejects newsletters_edit when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerNewsletterTools);

        await expect(client.callTool({ name: 'newsletters_edit', arguments: { name: 'x' } })).rejects.toThrow(/Invalid arguments/);
        expect(newslettersMock.edit).not.toHaveBeenCalled();
    });

    it('rejects newsletters_delete when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerNewsletterTools);

        await expect(client.callTool({ name: 'newsletters_delete', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(newslettersMock.delete).not.toHaveBeenCalled();
    });
});
