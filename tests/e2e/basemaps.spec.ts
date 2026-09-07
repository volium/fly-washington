import { expect, test } from './fixtures';

test('CARTO is the only basemap and follows saved appearance', async ({ page }) => {
  await page.goto('/');
  const style = page.locator('#map-style-control');
  const appearance = page.getByRole('combobox', { name: 'Appearance', exact: true });
  const tiles = page.locator('.leaflet-tile-pane img');
  const cartoAttribution = page.locator('.leaflet-control-attribution a', { hasText: 'CARTO' });
  await appearance.selectOption('light');
  await expect(style).toBeHidden();
  await expect(tiles.first()).toHaveAttribute('src', /cartocdn\.com\/light_all\//);
  await expect(cartoAttribution).toBeVisible();
  await expect(tiles.first()).toHaveAttribute('src', /[?&]key=playwright-basemap-key/);
  await expect(page.locator('.leaflet-control-attribution')).toContainText('OpenStreetMap');
  await expect(page.locator('.passport-marker')).toHaveCount(115);
  await appearance.selectOption('dark');
  await expect(tiles.first()).toHaveAttribute('src', /cartocdn\.com\/dark_all\//);
  await expect(page.locator('.leaflet-tile-pane')).toHaveCSS('filter', 'none');
  await page.reload();
  await expect(style).toBeHidden();
  await expect(tiles.first()).toHaveAttribute('src', /cartocdn\.com\/dark_all\//);
  await appearance.selectOption('system');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(tiles.first()).toHaveAttribute('src', /cartocdn\.com\/light_all\//);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(tiles.first()).toHaveAttribute('src', /cartocdn\.com\/dark_all\//);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('changing appearance preserves map position, airport selection, and an unfinished visit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Mobile details cover the map controls.');
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search airports' }).fill('Skagit');
  await page.getByRole('button', { name: 'Show all matches' }).click();
  await page.locator('[data-airport="KBVS"]').click();
  await page.getByLabel('Notes', { exact: false }).fill('Still writing this visit');
  await expect(page.locator('.leaflet-zoom-anim, .leaflet-pan-anim')).toHaveCount(0);
  const marker = page.locator('.leaflet-marker-icon[title^="BVS "]');
  const position = await marker.boundingBox();
  await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark');
  await expect(marker.locator('.is-selected')).toHaveCount(1);
  await expect(page.getByLabel('Notes', { exact: false })).toHaveValue('Still writing this visit');
  expect(await marker.boundingBox()).toEqual(position);
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(marker.locator('.is-visited')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('light');
  await expect(marker.locator('.is-visited.is-selected')).toHaveCount(1);
  await expect(page.locator('.history')).toContainText('Still writing this visit');
});

test('previous OpenStreetMap preference falls back to CARTO', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('passport:fly-washington:map-style', 'openstreetmap'));
  await page.goto('/');
  await expect(page.locator('#map-style-control')).toBeHidden();
  await expect(page.locator('.leaflet-tile-pane img').first()).toHaveAttribute('src', /cartocdn\.com/);
});

test('CARTO appearance still switches when preference storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage unavailable'); };
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
  });
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark');
  await expect(page.locator('.leaflet-tile-pane img').first()).toHaveAttribute('src', /cartocdn\.com\/dark_all\//);
  await expect(page.locator('.passport-marker')).toHaveCount(115);
});
