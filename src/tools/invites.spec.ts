import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnectedClient } from './testUtils';

const invitesMock = {
    browse: vi.fn(),
    add: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { invites: invitesMock },
}));

const { registerInviteTools } = await import('./invites');

describe('invites tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forwards invites_browse args to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerInviteTools);
        invitesMock.browse.mockResolvedValue([]);

        await client.callTool({ name: 'invites_browse', arguments: { limit: 5 } });

        expect(invitesMock.browse).toHaveBeenCalledWith({ limit: 5 });
    });

    it('rejects invites_add when required role_id/email fields are missing', async () => {
        const { client } = await createConnectedClient(registerInviteTools);

        await expect(client.callTool({ name: 'invites_add', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(invitesMock.add).not.toHaveBeenCalled();
    });

    it('forwards valid invites_add input to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerInviteTools);
        invitesMock.add.mockResolvedValue({ id: '1' });

        await client.callTool({
            name: 'invites_add',
            arguments: { role_id: 'role-1', email: 'user@example.com' },
        });

        expect(invitesMock.add).toHaveBeenCalledWith({ role_id: 'role-1', email: 'user@example.com' });
    });

    it('rejects invites_delete when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerInviteTools);

        await expect(client.callTool({ name: 'invites_delete', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(invitesMock.delete).not.toHaveBeenCalled();
    });
});
