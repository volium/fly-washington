import { test, expect } from './fixtures';

test('both export actions download a backup and show brief local feedback', async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator.storage, 'persisted', { value: async () => false });
    Object.defineProperty(navigator.storage, 'persist', { value: async () => false });
  });
  await page.goto('/');
  await page.locator('#passport-tab').click();
  const first = page.waitForEvent('download');
  await page.locator('#export').click();
  expect((await first).suggestedFilename()).toBe('fly-washington-passport.json');
  await expect(page.locator('#export-status')).toContainText('Passport exported.');
  await page.locator('#explore-tab').click();
  await page.locator('#storage-protection').click();
  const second = page.waitForEvent('download');
  await page.locator('#offline-export').click();
  expect((await second).suggestedFilename()).toBe('fly-washington-passport.json');
  await expect(page.locator('#offline-export-status')).toContainText('Passport exported.');
  await expect(page.locator('#notice')).not.toContainText('Passport exported.');
  await expect(page.locator('#passport-notice')).not.toContainText('Passport exported.');
  await expect(page.locator('#offline-export-status')).toHaveText('', { timeout: 7000 });
  await expect(page.locator('#export-status')).toHaveText('');
});
