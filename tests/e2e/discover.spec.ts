import { test, expect } from '@playwright/test';
import type { Profile } from '../../src/lib/types';

test('malformed and unknown session cookies are replaced with isolated server-owned sessions', async ({
  context,
  page,
}) => {
  for (const suppliedCookie of [
    'invalid-session',
    '00000000-0000-4000-8000-999999999998',
  ]) {
    await context.clearCookies();
    await context.addCookies([
      {
        name: 'coy_session',
        value: suppliedCookie,
        url: 'http://localhost:3100',
      },
    ]);
    await page.goto('/discover');
    await expect(
      page.getByRole('heading', { name: 'Aarohi, 23' }),
    ).toBeVisible();

    const sessionCookie = (await context.cookies()).find(
      (cookie) => cookie.name === 'coy_session',
    );
    expect(sessionCookie?.value).not.toBe(suppliedCookie);
    expect(sessionCookie?.value).toMatch(/^[0-9a-f-]{36}$/);
    expect(sessionCookie).toMatchObject({
      httpOnly: true,
      sameSite: 'Lax',
      secure: true,
    });
    expect(
      (await (await page.request.get('/feed')).json()).profiles,
    ).toHaveLength(36);
    expect((await (await page.request.get('/matches')).json()).matches).toEqual(
      [],
    );
  }
});

test('Discover, mutual match, detail, navigation and reload persistence', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/discover');
  await expect(page.getByRole('heading', { name: 'Aarohi, 23' })).toBeVisible();
  await expect(
    page.getByTestId('profile-card').locator('img'),
  ).toHaveJSProperty('complete', true);
  if (info.project.name === 'mobile') {
    const like = (await page
      .getByRole('button', { name: 'Like', exact: true })
      .boundingBox())!;
    const nav = (await page
      .getByRole('navigation', { name: 'Main navigation' })
      .boundingBox())!;
    expect(like.y + like.height).toBeLessThan(nav.y);
  }
  await page.screenshot({
    path: `docs/screenshots/discover-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Like', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'It’s a match!' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Close dialog' }),
  ).toBeFocused();
  await page.screenshot({
    path: `docs/screenshots/match-${info.project.name}.png`,
  });
  await page.getByRole('link', { name: 'View Matches', exact: true }).click();
  await expect(
    page.getByRole('button', { name: "View Aarohi's profile" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: "View Aarohi's profile" }),
  ).toBeVisible();
  await page.screenshot({
    path: `docs/screenshots/matches-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: "View Aarohi's profile" }).click();
  await expect(page.getByRole('dialog')).toContainText('Photography');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to Discover' }).click();
  await expect(page.getByRole('heading', { name: 'Kabir, 24' })).toBeVisible();
  await page.getByRole('button', { name: 'Like', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Meera, 22' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Pass', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ishaan, 25' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ishaan, 25' })).toBeVisible();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('main')).toContainText('Home placeholder');
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('real drag gestures, sub-threshold recovery and keyboard controls', async ({
  page,
}, info) => {
  await page.goto('/discover');
  const card = page.getByTestId('profile-card');
  await expect(page.getByRole('heading', { name: 'Aarohi, 23' })).toBeVisible();
  const box = (await card.boundingBox())!;
  const startX = box.x + box.width / 2,
    startY = box.y + 140;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 35, startY, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Aarohi, 23' })).toBeVisible();
  if (info.project.name === 'mobile') {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y: startY }],
    });
    for (let i = 1; i <= 12; i++)
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + (140 * i) / 12, y: startY }],
      });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Keep Discovering' }).click();
  } else {
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 150, startY, { steps: 12 });
    await page.mouse.up();
  }
  await expect(page.getByRole('heading', { name: 'Kabir, 24' })).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('heading', { name: 'Meera, 22' })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('empty states and safe reset', async ({ page }) => {
  await page.goto('/discover/matches');
  await expect(
    page.getByRole('heading', { name: /No matches yet/ }),
  ).toBeVisible();
  const feed = (await (await page.request.get('/feed')).json())
    .profiles as Profile[];
  for (const p of feed)
    expect(
      (
        await page.request.post('/swipe', {
          data: { profileId: p.id, direction: 'pass' },
        })
      ).ok(),
    ).toBe(true);
  await page.goto('/discover');
  await expect(
    page.getByRole('heading', { name: 'You’ve seen everyone for now.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Replay the demo' }).click();
  await expect(page.getByRole('heading', { name: 'Aarohi, 23' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'only resets your browser',
  );
  await page.getByRole('button', { name: 'Reset my demo' }).click();
  await expect(page.getByRole('heading', { name: 'Aarohi, 23' })).toBeVisible();
});

test('API validation, privacy, concurrency and session isolation', async ({
  request,
  playwright,
}) => {
  const feedResponse = await request.get('/feed');
  expect(feedResponse.headers()['cache-control']).toContain('no-store');
  const cookies = await request.storageState();
  expect(cookies.cookies.find((c) => c.name === 'coy_session')).toMatchObject({
    httpOnly: true,
    sameSite: 'Lax',
  });
  const roster = (await feedResponse.json()).profiles as Profile[];
  expect(roster).toHaveLength(36);
  expect(Object.keys(roster[0]).sort()).toEqual([
    'age',
    'bio',
    'city',
    'id',
    'interests',
    'name',
    'photoUrl',
  ]);
  const invalid = await request.post('/swipe', {
    data: { profileId: 'bad', direction: 'up' },
  });
  expect(invalid.status()).toBe(400);
  expect(
    (
      await request.post('/swipe', {
        data: '{',
        headers: { 'Content-Type': 'application/json' },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post('/swipe', {
        data: {
          profileId: '00000000-0000-4000-8000-999999999999',
          direction: 'like',
        },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post('/api/demo/reset', {
        headers: { origin: 'https://example.com' },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const responses = await Promise.all(
    Array.from({ length: 5 }, () =>
      request.post('/swipe', {
        data: { profileId: roster[0].id, direction: 'like' },
      }),
    ),
  );
  const results = await Promise.all(responses.map((r) => r.json()));
  expect(results.filter((r) => r.isMatch)).toHaveLength(1);
  expect(
    (
      await request.post('/swipe', {
        data: { profileId: roster[0].id, direction: 'pass' },
      })
    ).status(),
  ).toBe(409);
  expect((await (await request.get('/matches')).json()).matches).toHaveLength(
    1,
  );
  const other = await playwright.request.newContext({
    baseURL: 'http://localhost:3100',
  });
  expect((await (await other.get('/feed')).json()).profiles).toHaveLength(36);
  expect((await (await other.get('/matches')).json()).matches).toHaveLength(0);
  await other.post('/swipe', {
    data: { profileId: roster[0].id, direction: 'like' },
  });
  await request.post('/api/demo/reset', { data: {} });
  expect((await (await other.get('/matches')).json()).matches).toHaveLength(1);
  await other.dispose();
});

test('failed requests preserve the current card and allow retry', async ({
  page,
}) => {
  await page.goto('/discover');
  await expect(page.getByRole('heading', { name: 'Aarohi, 23' })).toBeVisible();
  await page.route('**/swipe', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Connection interrupted. Try again.' }),
    }),
  );
  await page.getByRole('button', { name: 'Like', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Discover profiles' }).getByRole('alert'),
  ).toContainText('Connection interrupted');
  await expect(page.getByRole('heading', { name: 'Aarohi, 23' })).toBeVisible();
  await page.unroute('**/swipe');
  await page.getByRole('button', { name: 'Like', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('all local profile assets load successfully', async ({
  page,
  request,
}) => {
  await page.goto('/discover');
  await expect(page.getByTestId('profile-card')).toBeVisible();
  const roster = (await (await page.request.get('/feed')).json())
    .profiles as Profile[];
  for (const p of roster) {
    const image = await request.get(p.photoUrl);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toContain('image/svg+xml');
  }
});
