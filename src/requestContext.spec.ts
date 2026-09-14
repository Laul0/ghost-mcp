import { describe, it, expect } from 'vitest';
import { runWithGhostRequestContext, getGhostRequestContext } from './requestContext';

describe('requestContext', () => {
    it('returns undefined when called outside any request context', () => {
        expect(getGhostRequestContext()).toBeUndefined();
    });

    it('exposes the context set by runWithGhostRequestContext inside the callback', async () => {
        const result = await runWithGhostRequestContext({ adminApiKey: 'k', apiVersion: 'v5.0' }, async () => {
            return getGhostRequestContext();
        });

        expect(result).toEqual({ adminApiKey: 'k', apiVersion: 'v5.0' });
    });

    it('isolates concurrent contexts from each other', async () => {
        const [a, b] = await Promise.all([
            runWithGhostRequestContext({ adminApiKey: 'a' }, async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                return getGhostRequestContext()?.adminApiKey;
            }),
            runWithGhostRequestContext({ adminApiKey: 'b' }, async () => {
                return getGhostRequestContext()?.adminApiKey;
            }),
        ]);

        expect(a).toBe('a');
        expect(b).toBe('b');
    });

    it('does not leak the context after the callback resolves', async () => {
        await runWithGhostRequestContext({ adminApiKey: 'k' }, async () => undefined);

        expect(getGhostRequestContext()).toBeUndefined();
    });
});
