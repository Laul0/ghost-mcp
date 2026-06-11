import GhostAdminAPI from '@tryghost/admin-api';
import { GHOST_API_URL, GHOST_ADMIN_API_KEY, GHOST_API_VERSION } from './config';
import { getGhostRequestContext } from './requestContext';

const clientsByCredential = new Map<string, any>();
const MAX_CACHED_CLIENTS = 100;

function getRuntimeCredentials(): { key: string; version: string } {
    const context = getGhostRequestContext();

    const key = context?.adminApiKey || GHOST_ADMIN_API_KEY;
    const version = context?.apiVersion || GHOST_API_VERSION;

    if (!key) {
        throw new Error(
            'GHOST_ADMIN_API_KEY is missing. For HTTP transport, send an Authorization bearer token (or legacy x-ghost-admin-api-key) in MCP client headers. For stdio transport, set GHOST_ADMIN_API_KEY in the client env.'
        );
    }

    return { key, version };
}

function getGhostApiClient(): any {
    const { key, version } = getRuntimeCredentials();
    const cacheKey = `${version}::${key}`;

    if (!clientsByCredential.has(cacheKey)) {
        if (clientsByCredential.size >= MAX_CACHED_CLIENTS) {
            const oldestKey = clientsByCredential.keys().next().value;
            if (oldestKey) {
                clientsByCredential.delete(oldestKey);
            }
        }

        // Initialize lazily so the MCP server can boot even when no key is set yet.
        clientsByCredential.set(cacheKey, new GhostAdminAPI({
            url: GHOST_API_URL,
            key,
            version
        }));
    }

    return clientsByCredential.get(cacheKey);
}

export const ghostApiClient = new Proxy({} as any, {
    get(_target, prop) {
        const client = getGhostApiClient() as unknown as Record<PropertyKey, unknown>;
        const value = Reflect.get(client, prop, client);
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
