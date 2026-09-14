import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnectedClient } from './testUtils';

const membersMock = {
    browse: vi.fn(),
    read: vi.fn(),
    add: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { members: membersMock },
}));

const { registerMemberTools } = await import('./members');

describe('members tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects members_add when the required email field is missing', async () => {
        const { client } = await createConnectedClient(registerMemberTools);

        await expect(client.callTool({ name: 'members_add', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(membersMock.add).not.toHaveBeenCalled();
    });

    it('forwards valid members_add input to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerMemberTools);
        membersMock.add.mockResolvedValue({ id: '1', email: 'user@example.com' });

        await client.callTool({
            name: 'members_add',
            arguments: { email: 'user@example.com', name: 'Jane Doe' },
        });

        expect(membersMock.add).toHaveBeenCalledWith({ email: 'user@example.com', name: 'Jane Doe' });
    });

    it('rejects members_edit when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerMemberTools);

        await expect(client.callTool({ name: 'members_edit', arguments: { name: 'x' } })).rejects.toThrow(/Invalid arguments/);
        expect(membersMock.edit).not.toHaveBeenCalled();
    });

    it('rejects members_delete when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerMemberTools);

        await expect(client.callTool({ name: 'members_delete', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(membersMock.delete).not.toHaveBeenCalled();
    });

    it('surfaces Ghost API errors as tool errors instead of throwing', async () => {
        const { client } = await createConnectedClient(registerMemberTools);
        membersMock.read.mockRejectedValue(new Error('Ghost API unreachable'));

        const result = await client.callTool({ name: 'members_read', arguments: { id: '1' } });

        expect(result.isError).toBe(true);
    });
});
