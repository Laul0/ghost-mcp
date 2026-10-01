import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createConnectedClient } from './testUtils';

const pagesMock = {
    browse: vi.fn(),
    read: vi.fn(),
    add: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { pages: pagesMock },
}));

const { registerPageTools } = await import('./pages');

describe('pages tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forwards pages_browse arguments to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerPageTools);
        pagesMock.browse.mockResolvedValue([]);

        const result = await client.callTool({
            name: 'pages_browse',
            arguments: { filter: 'status:published', limit: 10 },
        });

        expect(pagesMock.browse).toHaveBeenCalledWith({ filter: 'status:published', limit: 10 });
        expect(result.isError).toBeFalsy();
    });

    it('rejects pages_add when title is missing', async () => {
        const { client } = await createConnectedClient(registerPageTools);

        await expect(client.callTool({ name: 'pages_add', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(pagesMock.add).not.toHaveBeenCalled();
    });

    it('passes source: "html" when creating a page with html', async () => {
        const { client } = await createConnectedClient(registerPageTools);
        pagesMock.add.mockResolvedValue({ id: '1', title: 'About' });

        await client.callTool({
            name: 'pages_add',
            arguments: { title: 'About', html: '<p>About us</p>' },
        });

        expect(pagesMock.add).toHaveBeenCalledWith(
            { title: 'About', html: '<p>About us</p>' },
            { source: 'html' }
        );
    });

    it('requires id and updated_at when editing a page', async () => {
        const { client } = await createConnectedClient(registerPageTools);

        await expect(client.callTool({ name: 'pages_edit', arguments: { title: 'About' } })).rejects.toThrow(/Invalid arguments/);
        expect(pagesMock.edit).not.toHaveBeenCalled();
    });

    it('surfaces Ghost API errors as tool errors', async () => {
        const { client } = await createConnectedClient(registerPageTools);
        pagesMock.read.mockRejectedValue(new Error('Page not found'));

        const result = await client.callTool({ name: 'pages_read', arguments: { slug: 'missing' } });

        expect(result.isError).toBe(true);
    });

    it('deletes a page by id and returns confirmation', async () => {
        const { client } = await createConnectedClient(registerPageTools);
        pagesMock.delete.mockResolvedValue(undefined);

        const result = await client.callTool({ name: 'pages_delete', arguments: { id: 'page-1' } });

        expect(pagesMock.delete).toHaveBeenCalledWith({ id: 'page-1' });
        expect(result.content).toEqual([{ type: 'text', text: 'Page with id page-1 deleted.' }]);
    });
});
