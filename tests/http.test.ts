import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { checkOrigin, handleError } from '../src/lib/http';
import { ApiError } from '../src/lib/matching/service';

afterEach(() => vi.restoreAllMocks());

describe('HTTP privacy and mutation boundary', () => {
  it('hides unexpected database details behind an uncached 503 response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = handleError(
      new Error('private SQL and connection details'),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({
      error:
        'We could not connect to the database. Please check the server setup and try again.',
    });
  });

  it('retains intentional API errors without treating them as database failures', async () => {
    const response = handleError(
      new ApiError(409, 'This profile has already been swiped.'),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'This profile has already been swiped.',
    });
  });

  it('rejects cross-site mutations and accepts same-origin or headerless clients', () => {
    const url = 'https://demo.example/swipe';
    expect(() => checkOrigin(new Request(url))).not.toThrow();
    expect(() =>
      checkOrigin(
        new Request(url, { headers: { origin: 'https://demo.example' } }),
      ),
    ).not.toThrow();

    const crossSiteHeaders: HeadersInit[] = [
      { origin: 'https://other.example' },
      { 'sec-fetch-site': 'cross-site' },
    ];
    for (const headers of crossSiteHeaders) {
      expect(() => checkOrigin(new Request(url, { headers }))).toThrow(
        'Cross-site requests are not allowed.',
      );
    }
  });
});
