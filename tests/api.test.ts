import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../src/lib/api';

afterEach(() => vi.unstubAllGlobals());

describe('browser API helper', () => {
  it('loads JSON with an uncached GET', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ profiles: [] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await api('/feed')).toEqual({ profiles: [] });
    expect(fetchMock).toHaveBeenCalledWith('/feed', {
      method: 'GET',
      cache: 'no-store',
    });
  });

  it('sends mutation data as JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    await api('/swipe', { direction: 'pass' });
    expect(fetchMock).toHaveBeenCalledWith('/swipe', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: 'pass' }),
    });
  });

  it('preserves a useful JSON error from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: 'Profile not found.' }, { status: 404 }),
        ),
    );

    await expect(api('/swipe', {})).rejects.toThrow('Profile not found.');
  });

  it('shows a retry message when an upstream failure returns HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<html>Unavailable</html>', { status: 503 }),
        ),
    );

    await expect(api('/feed')).rejects.toThrow(
      'The server returned an unreadable response. Please try again.',
    );
  });

  it('rejects an unreadable successful response instead of using it as profile data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('not JSON', { status: 200 })),
    );

    await expect(api('/feed')).rejects.toThrow(
      'The server returned an unreadable response. Please try again.',
    );
  });
});
