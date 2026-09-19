import { test, expect } from '@playwright/test';

test('first-use offline card stays independent and keeps installation help discoverable', async ({ page }, testInfo) => {
  await page.goto('/');
  const card = page.locator('#offline-card');
  await expect(card).toBeVisible();
  const help = page.locator('#offline-setup details');
  await help.locator('summary').click();
  await expect(help).toHaveAttribute('open', '');
  await expect(help).toContainText('start downloading');
  if (testInfo.project.name === 'mobile-webkit') await expect(help.locator('.share-icon')).toBeVisible();
  await help.locator('summary').click();
  await expect(help).not.toHaveAttribute('open', '');
  await page.locator('#offline-close').click();
  await expect(page.locator('#offline-access')).toBeFocused();
  await page.locator('#passport-tab').click();
  await page.locator('#offline-access').click();
  await expect(page.locator('#passport-tab')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#map-delete')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  await page.reload();
  await expect(page.locator('#offline-card')).toBeHidden();
  await page.locator('#offline-access').click();
  await expect(page.locator('#offline-setup')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
