import { expect, test } from './fixtures';

test('map outlines match the legend and zoom controls adapt to the screen', async ({ page }, testInfo) => {
  await page.goto('/');
  const mobile = testInfo.project.name.startsWith('mobile');
  await expect(page.locator('.passport-marker')).toHaveCount(115);
  // Browsers round fractional borders differently; compare the current elements together.
  await expect.poll(() => page.evaluate(isMobile => {
    const border = getComputedStyle(document.querySelector('.passport-marker')!).borderTopWidth;
    const legend = getComputedStyle(document.querySelector('.map-legend-marker')!).borderTopWidth;
    const width = parseFloat(border);
    return border === legend && (isMobile ? width >= 1 && width <= 1.5 : width === 3);
  }, mobile)).toBe(true);
  if (mobile) await expect(page.locator('.leaflet-control-zoom')).toBeHidden();
  else await expect(page.locator('.leaflet-control-zoom')).toBeVisible();
});

test('mobile map selection previews the airport before opening details', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile preview flow.');
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search airports' }).fill('Skagit');
  await page.getByRole('button', { name: 'Show all matches' }).click();
  const marker = page.locator('.leaflet-marker-icon[title^="BVS "]');
  await marker.click();
  await expect(page.locator('#airport-preview')).toBeVisible();
  await expect(page.locator('#preview-name')).toHaveText('BVS · Skagit Regional');
  await expect(page.locator('#preview-meta')).toContainText('Not visited');
  await expect(page.locator('#detail')).toBeHidden();
  await expect(page.locator('.map-section')).not.toHaveAttribute('inert');
  await expect(page.locator('.leaflet-pan-anim')).toHaveCount(0);
  const circle = (await marker.locator('.passport-marker').boundingBox())!;
  const preview = (await page.locator('#airport-preview').boundingBox())!;
  expect(circle.y + circle.height).toBeLessThan(preview.y);
  await page.screenshot({ path: testInfo.outputPath('mobile-preview.png') });
  await page.getByRole('button', { name: 'Dismiss airport preview' }).click();
  await expect(page.locator('#airport-preview')).toBeHidden();
  await expect(page.locator('.is-selected')).toHaveCount(0);
  await marker.click();
  await page.getByRole('button', { name: 'View details', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Airport details' })).toBeVisible();
  await expect(page.locator('#airport-preview')).toBeHidden();
});

test('a sparse filtered view shows all its labels together', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search airports' }).fill('Skagit');
  await page.getByRole('button', { name: 'Show all matches' }).click();
  await expect(page.locator('.leaflet-tooltip-pane .airport-tooltip')).toHaveText(['BVS']);
  await page.getByRole('searchbox', { name: 'Search airports' }).fill('');
  await page.getByRole('button', { name: 'Show all matches' }).click();
  await expect(page.locator('.leaflet-tooltip-pane .airport-tooltip')).toHaveCount(0);
});
