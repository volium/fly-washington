import { expect, test } from './fixtures';

test('packaged Passport expands Washington regions and restores a chosen collection order', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('tab', { name: 'My passport', exact: true }).click();
  await expect(page.locator('.region-card')).toHaveCount(7);
  await page.locator('[data-key="region:northwest"] > summary').click();
  await expect(page.locator('[data-stamp="KBVS"]')).toContainText('Not visited');
  const now = new Date().toISOString();
  await page.locator('#import').setInputFiles({ name: 'test-passport.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'aviation-passport', schemaVersion: 1, programId: 'fly-washington', exportedAt: now, attachments: [], checkIns: ['KBVS', 'KBLI', 'KORS'].map(airportId => ({ id: airportId, airportId, programId: 'fly-washington', visitedAt: '2026-09-10', timeKnown: false, createdAt: now, updatedAt: now, notes: 'Synthetic test visit', verification: { status: 'unverified' } })) })) });
  await expect(page.locator('#passport-notice')).toContainText('Imported 3 visits');
  await page.getByRole('button', { name: 'My stamps', exact: true }).click();
  await page.getByLabel('Sort stamps').selectOption('date');
  await page.locator('[data-reorder]').click();
  const first = page.locator('[data-handle]').first();
  const id = await first.getAttribute('data-handle');
  await first.press('Space');
  const handle = page.locator(`[data-handle="${id}"]`);
  await handle.press('ArrowDown'); await handle.press('ArrowDown'); await handle.press('Space');
  await page.locator('[data-save-order]').click();
  await expect(page.locator('.collection-status')).toContainText('Collection order saved');
  await page.screenshot({ path: testInfo.outputPath('passport-collection.png') });
  await page.reload(); await page.getByRole('tab', { name: 'My passport', exact: true }).click();
  await page.getByRole('button', { name: 'My stamps', exact: true }).click(); await page.getByLabel('Sort stamps').selectOption('date');
  await expect(page.locator('[data-stamp]').last()).toHaveAttribute('data-stamp', id!);
  await expect(page.locator('#overall strong')).toHaveText('3 / 115');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
