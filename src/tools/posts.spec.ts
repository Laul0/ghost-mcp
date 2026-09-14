import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createConnectedClient } from './testUtils';

const postsMock = {
    browse: vi.fn(),
    read: vi.fn(),
    add: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../ghostApi', () => ({
    ghostApiClient: { posts: postsMock },
}));

// Imported after the mock so registerPostTools uses the mocked client.
const { registerPostTools } = await import('./posts');

describe('posts tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('rejects posts_add when the required title field is missing', async () => {
        const { client } = await createConnectedClient(registerPostTools);

        await expect(client.callTool({ name: 'posts_add', arguments: {} })).rejects.toThrow(/Invalid arguments/);
        expect(postsMock.add).not.toHaveBeenCalled();
    });

    it('forwards valid posts_add input to the Ghost API client', async () => {
        const { client } = await createConnectedClient(registerPostTools);
        postsMock.add.mockResolvedValue({ id: '1', title: 'Hello world' });

        const result = await client.callTool({
            name: 'posts_add',
            arguments: { title: 'Hello world' },
        });

        expect(postsMock.add).toHaveBeenCalledWith({ title: 'Hello world' }, undefined);
        expect(result.isError).toBeFalsy();
    });

    it('passes source: "html" when html content is provided', async () => {
        const { client } = await createConnectedClient(registerPostTools);
        postsMock.add.mockResolvedValue({ id: '1', title: 'Hello world' });

        await client.callTool({
            name: 'posts_add',
            arguments: { title: 'Hello world', html: '<p>hi</p>' },
        });

        expect(postsMock.add).toHaveBeenCalledWith(
            { title: 'Hello world', html: '<p>hi</p>' },
            { source: 'html' }
        );
    });

    it('surfaces Ghost API errors as tool errors instead of throwing', async () => {
        const { client } = await createConnectedClient(registerPostTools);
        postsMock.add.mockRejectedValue(new Error('Ghost API unreachable'));

        const result = await client.callTool({
            name: 'posts_add',
            arguments: { title: 'Hello world' },
        });

        expect(result.isError).toBe(true);
    });

    it('rejects posts_edit when required id/updated_at fields are missing', async () => {
        const { client } = await createConnectedClient(registerPostTools);

        await expect(client.callTool({ name: 'posts_edit', arguments: { title: 'x' } })).rejects.toThrow(/Invalid arguments/);
        expect(postsMock.edit).not.toHaveBeenCalled();
    });
});

