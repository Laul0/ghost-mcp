import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnectedClient } from './testUtils';

const tiersMock = {
    browse: vi.fn(),
    read: vi.fn(),
    add: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { tiers: tiersMock },
}));

const { registerTierTools } = await import('./tiers');

describe('tiers tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects tiers_add when the required name field is missing', async () => {
        const { client } = await createConnectedClient(registerTierTools);

        await expect(client.callTool({ name: 'tiers_add', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(tiersMock.add).not.toHaveBeenCalled();
    });

    it('forwards valid tiers_add input to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerTierTools);
        tiersMock.add.mockResolvedValue({ id: '1', name: 'Gold' });

        await client.callTool({ name: 'tiers_add', arguments: { name: 'Gold' } });

        expect(tiersMock.add).toHaveBeenCalledWith({ name: 'Gold' });
    });

    it('rejects tiers_edit when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerTierTools);

        await expect(client.callTool({ name: 'tiers_edit', arguments: { name: 'x' } })).rejects.toThrow(/Invalid arguments/);
        expect(tiersMock.edit).not.toHaveBeenCalled();
    });

    it('rejects tiers_delete when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerTierTools);

        await expect(client.callTool({ name: 'tiers_delete', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(tiersMock.delete).not.toHaveBeenCalled();
    });
});
