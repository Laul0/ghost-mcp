import GhostAdminAPI from '@tryghost/admin-api';
import { GHOST_API_URL, GHOST_ADMIN_API_KEY, GHOST_API_VERSION } from './config';

let cachedClient: any = null;

function getGhostApiClient(): any {
    if (!cachedClient) {
        if (!GHOST_ADMIN_API_KEY) {
            throw new Error('GHOST_ADMIN_API_KEY is not set. Configure it in the server/container environment before using Ghost tools.');
        }

        // Initialize lazily so the MCP server can boot even when no key is set yet.
        cachedClient = new GhostAdminAPI({
            url: GHOST_API_URL,
            key: GHOST_ADMIN_API_KEY,
            version: GHOST_API_VERSION
        });
    }

    return cachedClient;
}

export const ghostApiClient = new Proxy({} as any, {
    get(_target, prop, receiver) {
        const client = getGhostApiClient() as unknown as Record<PropertyKey, unknown>;
        const value = Reflect.get(client, prop, receiver);
        if (typeof value === 'function') {
            return (value as Function).bind(client);
        }
        return value;
    }
});

// You can add helper functions here to wrap API calls and handle errors
// For example:
/*
export async function getPostById(postId: string): Promise<any> {
    try {
        const post = await ghostApiClient.posts.read({ id: postId });
        return post;
    } catch (error) {
        console.error(`Error fetching post ${postId}:`, error);
        throw new Error(`Failed to fetch post ${postId}`);
    }
}
*/