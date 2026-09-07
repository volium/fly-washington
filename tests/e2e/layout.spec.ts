import { expect, test } from './fixtures';

test('initial map fits every airport to the available viewport', async ({ page }, testInfo) => {
  const sizes = testInfo.project.name === 'desktop-chromium'
    ? [{ width: 1440, height: 900 }, { width: 1000, height: 600 }]
    : [page.viewportSize()!];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto('/');
    await expect(page.locator('.passport-marker')).toHaveCount(115);
    await expect.poll(() => page.locator('#map').evaluate(map => {
      const bounds = map.getBoundingClientRect();
      const markers = Array.from(map.querySelectorAll('.passport-marker')).map(marker => marker.getBoundingClientRect());
      return markers.every(marker => marker.left >= bounds.left && marker.right <= bounds.right
        && marker.top >= bounds.top && marker.bottom <= bounds.bottom);
    })).toBe(true);
    // The roster should occupy most of at least one axis, rather than remain zoomed out.
    const coverage = await page.locator('#map').evaluate(map => {
      const bounds = map.getBoundingClientRect();
      const markers = Array.from(map.querySelectorAll('.passport-marker')).map(marker => marker.getBoundingClientRect());
      return Math.max(
        (Math.max(...markers.map(m => m.right)) - Math.min(...markers.map(m => m.left))) / bounds.width,
        (Math.max(...markers.map(m => m.bottom)) - Math.min(...markers.map(m => m.top))) / bounds.height,
      );
    });
    expect(coverage).toBeGreaterThan(0.5);
    await page.screenshot({ path: testInfo.outputPath(`initial-map-${size.width}.png`) });
  }
});

test('persistent tabs expose progress and backups and restore the explorer', async ({ page }, testInfo) => {
  await page.goto('/');
  const mobile = testInfo.project.name.startsWith('mobile');
  const map = page.locator('.map-section');
  await expect(page.locator('.passport-marker')).toHaveCount(115);
  const bounds = (await map.boundingBox())!;
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  await page.getByRole('tab', { name: 'My passport', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: 'My passport', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'My passport', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#regions .region-card')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Export passport', exact: true })).toBeVisible();
  await expect(page.getByText('Import passport', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'My passport', exact: true })).toBeFocused();
  await expect(page.locator('#passport-panel')).not.toHaveAttribute('aria-modal');
  await expect(page.locator('.app-header')).not.toHaveAttribute('inert');
  if (mobile) {
    await expect(map).toBeHidden();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Export passport', exact: true })).toBeFocused();
    await page.getByRole('tab', { name: 'My passport', exact: true }).focus();
  } else {
    expect(await map.boundingBox()).toEqual(bounds);
  }
  await page.locator('.passport-content').evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(page.getByRole('tab', { name: 'Explore', exact: true })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('passport-panel.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.locator('#passport-panel')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#passport-panel')).toBeHidden();
  await expect(page.getByRole('tab', { name: 'Explore', exact: true })).toBeFocused();
  expect(await map.boundingBox()).toEqual(bounds);
  if (mobile) {
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search airports' }).fill('Skagit');
    await page.getByRole('tab', { name: 'My passport', exact: true }).click();
    await page.getByRole('tab', { name: 'Explore', exact: true }).click();
    await expect(page.locator('.workspace')).toHaveAttribute('data-view', 'list');
    await expect(page.getByRole('searchbox', { name: 'Search airports' })).toHaveValue('Skagit');
    await expect(page.locator('.airport-card')).toHaveCount(1);
  }
});

test('desktop map stays fully visible while details scroll and passport preserves drafts', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop anchored layout.');
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/');
  const map = page.locator('.map-section');
  const bounds = (await map.boundingBox())!;
  await page.locator('[data-airport="KBVS"]').click();
  await page.getByLabel('Notes', { exact: false }).fill('Keep my unfinished visit');
  await page.locator('#detail').evaluate(element => { element.scrollTop = element.scrollHeight; });
  expect(await map.boundingBox()).toEqual(bounds);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const marker = page.locator('.leaflet-marker-icon[title^="BVS "]');
  await expect(page.locator('.leaflet-pan-anim')).toHaveCount(0);
  const position = await marker.boundingBox();
  await page.getByRole('tab', { name: 'My passport', exact: true }).click();
  await page.locator('.passport-content').evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(page.getByRole('tab', { name: 'Explore', exact: true })).toBeInViewport();
  expect(await map.boundingBox()).toEqual(bounds);
  await page.getByRole('tab', { name: 'Explore', exact: true }).click();
  await expect(page.getByLabel('Notes', { exact: false })).toHaveValue('Keep my unfinished visit');
  await expect(marker.locator('.is-selected')).toHaveCount(1);
  expect(await marker.boundingBox()).toEqual(position);
  await page.screenshot({ path: testInfo.outputPath('anchored-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 1000, height: 450 });
  await expect.poll(async () => { const box = (await map.boundingBox())!; return box.y + box.height; }).toBeLessThanOrEqual(450);
});
