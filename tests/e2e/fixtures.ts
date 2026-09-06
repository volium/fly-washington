import { test as base, expect } from '@playwright/test';

// Exercise provider URLs without consuming tiles or requiring a developer's key.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://basemaps.cartocdn.com/**', route => route.fulfill({
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'),
    }));
    await use(page);
  },
});
export { expect };
