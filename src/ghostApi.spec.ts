import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({
    default: vi.fn(),
}));

vi.mock('./config', () => ({
    GHOST_API_URL: 'https://example.ghost.io',
    GHOST_ADMIN_API_KEY: 'fallback-id:fallback-secret',
    GHOST_API_VERSION: 'v5.0',
}));

describe('ghostApi', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('bounds every request with a timeout', async () => {
        const axios = (await import('axios')).default as unknown as ReturnType<typeof vi.fn>;
        (axios as any).mockResolvedValue({ data: { ok: true } });

        const { makeRequestWithTimeout, REQUEST_TIMEOUT_MS } = await import('./ghostApi');
        await makeRequestWithTimeout({ url: 'https://example.ghost.io/ghost/api/admin/posts/', method: 'GET' });

        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({ timeout: REQUEST_TIMEOUT_MS })
        );
    });

    it('falls back to the server-configured admin key when no per-request context is set', async () => {
        const { getRuntimeCredentials } = await import('./ghostApi');
        expect(getRuntimeCredentials()).toEqual({ key: 'fallback-id:fallback-secret', version: 'v5.0' });
    });

    it('prefers per-request credentials from the request context over the fallback key', async () => {
        const { getRuntimeCredentials } = await import('./ghostApi');
        const { runWithGhostRequestContext } = await import('./requestContext');

        const result = await runWithGhostRequestContext(
            { adminApiKey: 'client-id:client-secret', apiVersion: 'v6.0' },
            async () => getRuntimeCredentials()
        );

        expect(result).toEqual({ key: 'client-id:client-secret', version: 'v6.0' });
    });

    it('throws a clear error when no admin key is available from any source', async () => {
        vi.doMock('./config', () => ({
            GHOST_API_URL: 'https://example.ghost.io',
            GHOST_ADMIN_API_KEY: '',
            GHOST_API_VERSION: 'v5.0',
        }));

        const { getRuntimeCredentials } = await import('./ghostApi');
        expect(() => getRuntimeCredentials()).toThrow(/GHOST_ADMIN_API_KEY is missing/);
    });
});
