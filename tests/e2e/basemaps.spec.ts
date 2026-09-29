import { openManualVisit } from './fixtures';
import { expect, test } from './fixtures';
test('local vector basemap follows saved appearance', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', r => requests.push(r.url()));
  await page.goto('/');
  const appearance = page.locator('#appearance-trigger');
  await expect(page.locator('.airport-map-hit')).toHaveCount(115);
  await page.getByRole('button',{name:'Switch to dark appearance',exact:true}).click();
  await expect.poll(() => requests.some(url => url.endsWith('/dark.json'))).toBe(true);
  await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('OpenStreetMap');
  await page.reload();
  await expect(appearance).toHaveAttribute('title','Switch to light appearance');
  await page.evaluate(() => localStorage.removeItem('passport:fly-washington:theme'));
  await page.reload();
  await page.emulateMedia({colorScheme:'light'});
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.emulateMedia({colorScheme:'dark'});
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  expect(requests.some(url => /cartocdn|tile.openstreetmap/.test(url))).toBe(false);
});

test('changing appearance preserves map position, airport selection, and an unfinished visit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Mobile details cover the map controls.');
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search airports' }).fill('Skagit');
  await page.getByRole('button', { name: 'Show all matches' }).click();
  await page.locator('[data-airport="KBVS"]').click();
  await openManualVisit(page); await page.locator('#gps-form [type=submit]').click();
  if (!await page.locator('#visit-history').getAttribute('open')) await page.locator('#history-heading').click();
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  await page.locator('#checkin').getByLabel('Notes',{exact:false}).fill('Still writing this visit');

  const marker = page.locator('.airport-map-hit[title^="BVS "]');
  const position = await marker.boundingBox();
  await page.getByRole('button', {name:'Switch to dark appearance',exact:true}).click();
  await expect(marker).toHaveClass(/is-selected/);
  await expect(page.locator('form:visible').getByLabel('Notes', { exact: false })).toHaveValue('Still writing this visit');
  expect(await marker.boundingBox()).toEqual(position);
  await openManualVisit(page); await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(marker).toHaveClass(/is-visited/);
  await page.getByRole('button', {name:'Switch to light appearance',exact:true}).click();
  await expect(marker).toHaveClass(/is-selected.*is-visited/);
  await expect(page.locator('.history')).toContainText('Still writing this visit');
});

test('appearance remains usable without preference storage', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw Error('Unavailable'); };
    Storage.prototype.setItem = () => { throw Error('Unavailable'); };
  });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
  await page.locator('#offline-close').click();
  await page.getByRole('button', {name:'Switch to dark appearance',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('.airport-map-hit')).toHaveCount(115);
});
