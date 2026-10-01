import { describe, it, expect } from 'vitest';
import {
    handleUserResource,
    handleMemberResource,
    handleTierResource,
    handleOfferResource,
    handleNewsletterResource,
    handlePostResource,
    handleBlogInfoResource,
} from './resources';

describe('resource handlers', () => {
    it('returns placeholder content for a known user id', async () => {
        const uri = new URL('user://123');
        const result = await handleUserResource(uri, { user_id: '123' });

        expect(result.contents[0].uri).toBe(uri.href);
        expect(result.contents[0].text).toContain('123');
    });

    it('throws when user_id is missing', async () => {
        await expect(handleUserResource(new URL('user://'), {})).rejects.toThrow('Missing user_id parameter');
    });

    it('returns placeholder content for a known member id', async () => {
        const result = await handleMemberResource(new URL('member://456'), { member_id: '456' });

        expect(result.contents[0].text).toContain('456');
    });

    it('throws when member_id is missing', async () => {
        await expect(handleMemberResource(new URL('member://'), {})).rejects.toThrow('Missing member_id parameter');
    });

    it('returns placeholder content for a known tier id', async () => {
        const result = await handleTierResource(new URL('tier://gold'), { tier_id: 'gold' });

        expect(result.contents[0].text).toContain('gold');
    });

    it('throws when tier_id is missing', async () => {
        await expect(handleTierResource(new URL('tier://'), {})).rejects.toThrow('Missing tier_id parameter');
    });

    it('returns placeholder content for a known offer id', async () => {
        const result = await handleOfferResource(new URL('offer://bf'), { offer_id: 'bf' });

        expect(result.contents[0].text).toContain('bf');
    });

    it('throws when offer_id is missing', async () => {
        await expect(handleOfferResource(new URL('offer://'), {})).rejects.toThrow('Missing offer_id parameter');
    });

    it('returns placeholder content for a known newsletter id', async () => {
        const result = await handleNewsletterResource(new URL('newsletter://weekly'), { newsletter_id: 'weekly' });

        expect(result.contents[0].text).toContain('weekly');
    });

    it('throws when newsletter_id is missing', async () => {
        await expect(handleNewsletterResource(new URL('newsletter://'), {})).rejects.toThrow('Missing newsletter_id parameter');
    });

    it('returns placeholder content for a known post id', async () => {
        const result = await handlePostResource(new URL('post://789'), { post_id: '789' });

        expect(result.contents[0].text).toContain('789');
    });

    it('throws when post_id is missing', async () => {
        await expect(handlePostResource(new URL('post://'), {})).rejects.toThrow('Missing post_id parameter');
    });

    it('returns placeholder blog info content', async () => {
        const uri = new URL('blog://info');
        const result = await handleBlogInfoResource(uri);

        expect(result.contents[0].uri).toBe(uri.href);
        expect(result.contents[0].text).toContain('Blog info resource requested');
    });
});
