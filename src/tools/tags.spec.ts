import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnectedClient } from './testUtils';

const tagsMock = {
    browse: vi.fn(),
    read: vi.fn(),
    add: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { tags: tagsMock },
}));

const { registerTagTools } = await import('./tags');

describe('tags tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects tags_add when the required name field is missing', async () => {
        const { client } = await createConnectedClient(registerTagTools);

        await expect(client.callTool({ name: 'tags_add', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(tagsMock.add).not.toHaveBeenCalled();
    });

    it('forwards valid tags_add input to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerTagTools);
        tagsMock.add.mockResolvedValue({ id: '1', name: 'News' });

        await client.callTool({ name: 'tags_add', arguments: { name: 'News' } });

        expect(tagsMock.add).toHaveBeenCalledWith({ name: 'News' });
    });

    it('rejects tags_edit when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerTagTools);

        await expect(client.callTool({ name: 'tags_edit', arguments: { name: 'x' } })).rejects.toThrow(/Invalid arguments/);
        expect(tagsMock.edit).not.toHaveBeenCalled();
    });

    it('rejects tags_delete when the required id field is missing', async () => {
        const { client } = await createConnectedClient(registerTagTools);

        await expect(client.callTool({ name: 'tags_delete', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(tagsMock.delete).not.toHaveBeenCalled();
    });
});
