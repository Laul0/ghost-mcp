import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnectedClient } from './testUtils';

const rolesMock = {
    browse: vi.fn(),
    read: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { roles: rolesMock },
}));

const { registerRoleTools } = await import('./roles');

describe('roles tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forwards roles_browse args to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerRoleTools);
        rolesMock.browse.mockResolvedValue([]);

        await client.callTool({ name: 'roles_browse', arguments: { limit: 10 } });

        expect(rolesMock.browse).toHaveBeenCalledWith({ limit: 10 });
    });

    it('forwards roles_read args to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerRoleTools);
        rolesMock.read.mockResolvedValue({ id: '1', name: 'Author' });

        await client.callTool({ name: 'roles_read', arguments: { id: '1' } });

        expect(rolesMock.read).toHaveBeenCalledWith({ id: '1' });
    });

    it('surfaces Ghost API errors as tool errors instead of throwing', async () => {
        const { client } = await createConnectedClient(registerRoleTools);
        rolesMock.read.mockRejectedValue(new Error('Ghost API unreachable'));

        const result = await client.callTool({ name: 'roles_read', arguments: { id: '1' } });

        expect(result.isError).toBe(true);
    });
});
