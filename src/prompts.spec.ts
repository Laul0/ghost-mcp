import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const postsMock = { read: vi.fn() };

vi.mock('./ghostApi', () => ({
    ghostApiClient: { posts: postsMock },
}));

const { registerPrompts } = await import('./prompts');

async function createConnectedClient() {
    const server = new McpServer({ name: 'test-server', version: '0.0.0' });
    registerPrompts(server);

    const client = new Client({ name: 'test-client', version: '0.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
    ]);

    return { client };
}

describe('summarize-post prompt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches the post and composes a summary prompt message', async () => {
        const { client } = await createConnectedClient();
        postsMock.read.mockResolvedValue({
            title: 'Hello world',
            excerpt: 'A short excerpt',
            html: '<p>Full content</p>',
        });

        const result = await client.getPrompt({ name: 'summarize-post', arguments: { postId: 'post-1' } });

        expect(postsMock.read).toHaveBeenCalledWith({ id: 'post-1' });
        const text = result.messages[0].content.text as string;
        expect(text).toContain('Title: Hello world');
        expect(text).toContain('Excerpt: A short excerpt');
        expect(text).toContain('<p>Full content</p>');
    });

    it('rejects when the required postId argument is missing', async () => {
        const { client } = await createConnectedClient();

        await expect(client.getPrompt({ name: 'summarize-post', arguments: {} })).rejects.toThrow();
        expect(postsMock.read).not.toHaveBeenCalled();
    });
});
