import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnectedClient } from './testUtils';

const usersMock = {
    browse: vi.fn(),
    read: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { users: usersMock },
}));

const { registerUserTools } = await import('./users');

describe('users tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forwards users_browse args to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerUserTools);
        usersMock.browse.mockResolvedValue([]);

        await client.callTool({ name: 'users_browse', arguments: { limit: 10 } });

        expect(usersMock.browse).toHaveBeenCalledWith({ limit: 10 });
    });

    it('rejects users_edit when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerUserTools);

        await expect(client.callTool({ name: 'users_edit', arguments: { name: 'x' } })).rejects.toThrow(/Invalid arguments/);
        expect(usersMock.edit).not.toHaveBeenCalled();
    });

    it('forwards valid users_edit input to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerUserTools);
        usersMock.edit.mockResolvedValue({ id: '1', name: 'Jane Doe' });

        await client.callTool({ name: 'users_edit', arguments: { id: '1', name: 'Jane Doe' } });

        expect(usersMock.edit).toHaveBeenCalledWith({ id: '1', name: 'Jane Doe' });
    });

    it('rejects users_delete when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerUserTools);

        await expect(client.callTool({ name: 'users_delete', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(usersMock.delete).not.toHaveBeenCalled();
    });
});
