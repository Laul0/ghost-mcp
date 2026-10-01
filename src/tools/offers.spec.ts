import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnectedClient } from './testUtils';

const offersMock = {
    browse: vi.fn(),
    read: vi.fn(),
    add: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { offers: offersMock },
}));

const { registerOfferTools } = await import('./offers');

const validAddArgs = {
    name: 'Black Friday',
    code: 'BF2026',
    cadence: 'month',
    duration: 'once',
    amount: 20,
    tier_id: 'tier-1',
    type: 'percent',
};

describe('offers tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects offers_add when required fields are missing', async () => {
        const { client } = await createConnectedClient(registerOfferTools);

        await expect(client.callTool({ name: 'offers_add', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(offersMock.add).not.toHaveBeenCalled();
    });

    it('forwards valid offers_add input to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerOfferTools);
        offersMock.add.mockResolvedValue({ id: '1', ...validAddArgs });

        await client.callTool({ name: 'offers_add', arguments: validAddArgs });

        expect(offersMock.add).toHaveBeenCalledWith(validAddArgs);
    });

    it('rejects offers_edit when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerOfferTools);

        await expect(client.callTool({ name: 'offers_edit', arguments: { name: 'x' } })).rejects.toThrow(/Invalid arguments/);
        expect(offersMock.edit).not.toHaveBeenCalled();
    });

    it('rejects offers_delete when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerOfferTools);

        await expect(client.callTool({ name: 'offers_delete', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(offersMock.delete).not.toHaveBeenCalled();
    });
});
