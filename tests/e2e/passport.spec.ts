import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

test('map background clears selection while markers and map navigation preserve it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Mobile details cover the map.');
  await page.goto('/');
  const map = page.locator('#map');
  const skagit = page.locator('.leaflet-marker-icon[title^="KBVS "]');
  const bellingham = page.locator('.leaflet-marker-icon[title^="KBLI "]');
  await page.getByRole('combobox', { name: 'Region', exact: true }).selectOption('northwest');
  await page.getByRole('button', { name: 'Show all matches' }).click();
  await page.locator('[data-airport="KBVS"]').click();
  await expect(skagit.locator('.is-selected')).toHaveCount(1);
  await bellingham.locator('.passport-marker').click();
  await expect(bellingham.locator('.is-selected')).toHaveCount(1);
  await expect(skagit.locator('.is-selected')).toHaveCount(0);
  await expect(page.locator('#detail')).toBeVisible();
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(bellingham.locator('.is-visited')).toHaveCount(1);

  await map.scrollIntoViewIfNeeded();
  const bounds = (await map.boundingBox())!;
  await page.mouse.move(bounds.x + 60, bounds.y + 100);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 120, bounds.y + 160, { steps: 10 });
  await page.mouse.up();
  await expect(bellingham.locator('.is-selected')).toHaveCount(1);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(bellingham.locator('.is-selected')).toHaveCount(1);
  // Wait for Leaflet's pan/zoom animation before comparing the map position.
  await expect(page.locator('.leaflet-zoom-anim, .leaflet-pan-anim')).toHaveCount(0);
  const position = await bellingham.boundingBox();
  const region = await bellingham.locator('.passport-marker').getAttribute('style');
  await map.click({ position: { x: 30, y: 100 } });
  await expect(page.locator('#detail')).toBeHidden();
  await expect(page.locator('.passport-marker.is-selected')).toHaveCount(0);
  await expect(page.locator('.airport-card[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('.browse')).toBeVisible();
  await expect(bellingham.locator('.is-visited')).toHaveCount(1);
  await expect(bellingham.locator('.passport-marker')).toHaveAttribute('style', region!);
  expect(await bellingham.boundingBox()).toEqual(position);
  await expect(map).toBeFocused();
  await map.click({ position: { x: 30, y: 100 } });
  await expect(page.locator('#detail')).toBeHidden();
});

test('map, themes, filters, visits, persistence, and backup work on desktop and mobile', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Fly Washington', exact: true })).toBeVisible();
  await expect(page.locator('.passport-marker')).toHaveCount(115);
  const skagitMarker = page.locator('.leaflet-marker-icon[title^="KBVS "]');
  await expect(skagitMarker).toHaveAttribute('aria-label', /not visited$/);
  expect(await skagitMarker.locator('.passport-marker').evaluate(marker => {
    const style = getComputedStyle(marker);
    return style.backgroundColor !== style.borderTopColor && marker.textContent === '';
  })).toBe(true);
  await expect(page.locator('#map')).toHaveClass(/compact-markers/);
  await expect(page.locator('.region-card')).toHaveCount(7);
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Appearance', { exact: true }).selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('searchbox', { name: 'Search airports' }).fill('skagit');
  await page.getByRole('button', { name: 'Show all matches' }).click();
  await expect(page.locator('#map')).not.toHaveClass(/compact-markers/);
  await page.locator('.leaflet-marker-icon').filter({ has: page.locator('.passport-marker') }).first().click();
  await expect(page.getByRole('heading', { name: 'Skagit Regional', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'All airports' }).click();
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search airports' }).fill('skagit');
  await expect(page.locator('.airport-card')).toHaveCount(1);
  await expect(page.locator('.passport-marker')).toHaveCount(1);
  await page.locator('.airport-card').click();
  await expect(page.getByRole('heading', { name: 'Skagit Regional', exact: true })).toBeVisible();
  await expect(page.locator('.stamp')).toHaveCount(1);
  await expect(page.locator('.stamp')).toContainText('Port of Skagit');
  await page.getByLabel('Visit date').fill('2026-08-10');
  await page.getByLabel('Notes', { exact: false }).fill('First flight <script>safe text</script>');
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.locator('.history article')).toHaveCount(1);
  await expect(page.locator('.passport-marker.is-visited')).toHaveCount(1);
  await expect(skagitMarker).toHaveAttribute('aria-label', /, visited$/);
  expect(await skagitMarker.locator('.passport-marker').evaluate(marker => {
    const style = getComputedStyle(marker);
    return style.backgroundColor === style.borderTopColor && marker.textContent === '';
  })).toBe(true);
  await page.reload();
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.locator('#airport-list').getByRole('button', { name: /KBVS.*Skagit Regional/ }).click();
  await expect(page.locator('.history')).toContainText('First flight <script>safe text</script>');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Notes', { exact: false }).fill('Updated visit');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.history')).toContainText('Updated visit');
  await page.getByRole('button', { name: 'All airports' }).click();
  await page.getByRole('tab', { name: 'My passport', exact: true }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export passport' }).click();
  const download = await downloadEvent;
  const path = testInfo.outputPath('passport.json'); await download.saveAs(path);
  await page.getByRole('tab', { name: 'Explore', exact: true }).click();
  await page.locator('#airport-list').getByRole('button', { name: /KBVS.*Skagit Regional/ }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.history article')).toHaveCount(0);
  await page.getByRole('button', { name: 'All airports' }).click();
  await page.getByRole('tab', { name: 'My passport', exact: true }).click();
  await page.locator('#import').setInputFiles(path);
  await expect(page.locator('#notice')).toContainText('Imported 1 visits');
  await page.locator('#import').setInputFiles(path);
  await expect(page.locator('#notice')).toContainText('Imported 0 visits');
  await page.getByRole('tab', { name: 'Explore', exact: true }).click();
  await page.getByRole('combobox', { name: 'Passport', exact: true }).selectOption('visited');
  await expect(page.locator('.airport-card')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('passport-light.png'), fullPage: true });
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await page.screenshot({ path: testInfo.outputPath('passport-dark.png'), fullPage: true });
});

test('real regions filter both views and actual multiple stamp locations are available', async ({page},testInfo) => {
  await page.goto('/');
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button',{name:'List',exact:true}).click();
  await page.getByRole('combobox',{name:'Region',exact:true}).selectOption('seaplane-bases');
  await expect(page.locator('.airport-card')).toHaveCount(4);
  await expect(page.locator('.passport-marker')).toHaveCount(4);
  await page.getByRole('combobox',{name:'Region',exact:true}).selectOption('olympic');
  await expect(page.locator('.airport-card')).toHaveCount(19);
  await page.getByRole('searchbox',{name:'Search airports'}).fill('Bremerton');
  await page.locator('.airport-card').click();
  await expect(page.locator('.stamp')).toHaveCount(2);
  await expect(page.locator('#detail')).toContainText('Avian Flight Center');
  await expect(page.locator('#detail')).toContainText('Pilot lounge');
});

async function prepareOfflinePage(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  expect(await page.evaluate(async () => {
    const shell = await caches.match(new URL('index.html', location.href).href, { ignoreSearch: true });
    return shell?.ok && (await shell.text()).includes('id="app"');
  })).toBe(true);
  await expectNoCachedMapTiles(page);
}

async function expectNoCachedMapTiles(page: Page) {
  const urls = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async key => (await (await caches.open(key)).keys()).map(request => request.url)))).flat());
  expect(urls.some(url => url.includes('tile.openstreetmap.org') || url.includes('basemaps.cartocdn.com'))).toBe(false);
}

test('an open app saves visits offline without caching map tiles', async ({ page, context }, testInfo) => {
  await prepareOfflinePage(page);
  await context.setOffline(true);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
  await expect(page.getByRole('heading', { name: 'Fly Washington', exact: true })).toBeVisible();
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.locator('#airport-list').getByRole('button', { name: /KORS.*Orcas Island/ }).click();
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.locator('.history article')).toHaveCount(1);
  await expectNoCachedMapTiles(page);
  await context.setOffline(false);
  await page.reload();
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.locator('#airport-list').getByRole('button', { name: /KORS.*Orcas Island/ }).click();
  await expect(page.locator('.history article')).toHaveCount(1);
});

test('installed app shell reloads and saves visits offline', async ({ page, context, browserName }, testInfo) => {
  await prepareOfflinePage(page);
  await context.setOffline(true);
  try {
    await page.reload();
  } catch (error) {
    // Observed locally on Windows and reported in Linux CI. Only quarantine
    // this exact navigation error; all other failures must still fail the test.
    if (browserName === 'webkit' && error instanceof Error && /^page\.reload: WebKit encountered an internal error(?:\r?\n|$)/.test(error.message)) {
      test.skip(true, `WebKit offline reload failed internally on ${process.platform}; physical iPhone offline startup remains unverified. Open-app offline saving is tested separately.`);
    }
    throw error;
  }
  await expect(page.getByRole('heading', { name: 'Fly Washington', exact: true })).toBeVisible();
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.locator('#airport-list').getByRole('button', { name: /KORS.*Orcas Island/ }).click();
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.locator('.history article')).toHaveCount(1);
  await expectNoCachedMapTiles(page);
});
