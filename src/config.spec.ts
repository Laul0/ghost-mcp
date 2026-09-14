import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

describe('config', () => {
    beforeEach(() => {
        vi.resetModules();
        process.env = { ...ORIGINAL_ENV };
    });

    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
        vi.restoreAllMocks();
    });

    it('exits the process when GHOST_API_URL is not set', async () => {
        delete process.env.GHOST_API_URL;
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit called');
        });
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(import('./config')).rejects.toThrow('process.exit called');

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('GHOST_API_URL is not set'));
    });

    it('defaults GHOST_API_VERSION to v5.0 and warns when no admin key is set', async () => {
        process.env.GHOST_API_URL = 'https://example.ghost.io';
        delete process.env.GHOST_ADMIN_API_KEY;
        delete process.env.GHOST_API_VERSION;
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const config = await import('./config');

        expect(config.GHOST_API_URL).toBe('https://example.ghost.io');
        expect(config.GHOST_API_VERSION).toBe('v5.0');
        expect(config.GHOST_ADMIN_API_KEY).toBe('');
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('GHOST_ADMIN_API_KEY fallback is not set'));
    });

    it('reads GHOST_ADMIN_API_KEY and GHOST_API_VERSION overrides from env', async () => {
        process.env.GHOST_API_URL = 'https://example.ghost.io';
        process.env.GHOST_ADMIN_API_KEY = 'id:secret';
        process.env.GHOST_API_VERSION = 'v6.0';

        const config = await import('./config');

        expect(config.GHOST_ADMIN_API_KEY).toBe('id:secret');
        expect(config.GHOST_API_VERSION).toBe('v6.0');
    });
});
