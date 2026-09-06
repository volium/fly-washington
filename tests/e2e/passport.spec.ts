import { expect, test } from '@playwright/test';

test('map, themes, filters, visits, persistence, and backup work on desktop and mobile', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Fly Washington', exact: true })).toBeVisible();
  await expect(page.locator('.passport-marker')).toHaveCount(5);
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Appearance', { exact: true }).selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('.leaflet-marker-icon').filter({ has: page.locator('.passport-marker') }).first().click();
  await expect(page.getByRole('heading', { name: 'Skagit Regional', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'All airports' }).click();
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search airports' }).fill('skagit');
  await expect(page.locator('.airport-card')).toHaveCount(1);
  await expect(page.locator('.passport-marker')).toHaveCount(1);
  await page.locator('.airport-card').click();
  await expect(page.getByRole('heading', { name: 'Skagit Regional', exact: true })).toBeVisible();
  await expect(page.locator('.stamp')).toHaveCount(2);
  await page.getByLabel('Visit date').fill('2026-08-10');
  await page.getByLabel('Notes', { exact: false }).fill('First flight <script>safe text</script>');
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.locator('.history article')).toHaveCount(1);
  await expect(page.locator('.passport-marker.is-visited')).toHaveCount(1);
  await page.reload();
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.locator('#airport-list').getByRole('button', { name: /KBVS.*Skagit Regional/ }).click();
  await expect(page.locator('.history')).toContainText('First flight <script>safe text</script>');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Notes', { exact: false }).fill('Updated visit');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.history')).toContainText('Updated visit');
  await page.getByRole('button', { name: 'All airports' }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export passport' }).click();
  const download = await downloadEvent;
  const path = testInfo.outputPath('passport.json'); await download.saveAs(path);
  await page.locator('#airport-list').getByRole('button', { name: /KBVS.*Skagit Regional/ }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.history article')).toHaveCount(0);
  await page.getByRole('button', { name: 'All airports' }).click();
  await page.locator('#import').setInputFiles(path);
  await expect(page.locator('#notice')).toContainText('Imported 1 visits');
  await page.locator('#import').setInputFiles(path);
  await expect(page.locator('#notice')).toContainText('Imported 0 visits');
  await page.getByRole('combobox', { name: 'Passport', exact: true }).selectOption('visited');
  await expect(page.locator('.airport-card')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('passport-light.png'), fullPage: true });
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await page.screenshot({ path: testInfo.outputPath('passport-dark.png'), fullPage: true });
});

test('installed app shell opens and saves visits offline without caching map tiles', async ({ page, context, browserName }, testInfo) => {
  // Reproduced on Windows/WebKit 2359: CacheStorage is readable and online
  // navigation is served by the worker, but setOffline makes navigation fail
  // inside WebKit. Keep this visible; Linux CI must still pass this scenario.
  test.fail(process.platform === 'win32' && browserName === 'webkit', 'Windows WebKit offline navigation fails internally; physical iPhone verification remains open.');
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Fly Washington', exact: true })).toBeVisible();
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.locator('#airport-list').getByRole('button', { name: /KORS.*Orcas Island/ }).click();
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.locator('.history article')).toHaveCount(1);
  const urls = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async key => (await (await caches.open(key)).keys()).map(request => request.url)))).flat());
  expect(urls.some(url => url.includes('tile.openstreetmap.org'))).toBe(false);
});
