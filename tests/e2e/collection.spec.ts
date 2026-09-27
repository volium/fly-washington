import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';

test('native visit date fields fit narrow Passport and Explore editors', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
  await page.locator('#passport-tab').click();
  await page.locator('[data-key="region:northwest"] > summary').click();
  const row = page.locator('[data-stamp="KBVS"]');
  await row.locator('summary').click();
  await row.getByRole('button', { name: 'Add a visit', exact: true }).click();
  const date = row.getByLabel('Visit date');
  await date.fill('2026-09-10');
  await expect(date).toHaveValue('2026-09-10');
  const fits = (element: HTMLElement) => {
    const field = element.getBoundingClientRect();
    const label = element.closest('label')!.getBoundingClientRect();
    const form = element.closest('form')!.getBoundingClientRect();
    return field.left >= label.left - 1 && field.right <= label.right + 1 && field.right <= form.right + 1;
  };
  expect(await date.evaluate(fits)).toBe(true);
  await row.getByRole('button', { name: 'Show on map', exact: true }).click();
  expect(await page.locator('#checkin input[type="date"]').evaluate(fits)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

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

test('earlier visit can retain its stamp date in the packaged mobile and desktop app', async ({ page }, testInfo) => {
  await page.goto('/'); await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
  await page.locator('#passport-tab').click();
  await page.locator('[data-key="region:northwest"] > summary').click();
  const row = page.locator('[data-stamp="KBVS"]'); await row.locator('summary').click();
  await row.getByRole('button', { name: 'Add a visit', exact: true }).click();
  await row.getByLabel('Visit date').fill('2026-09-10'); await row.getByRole('button', { name: 'Save check-in' }).click();
  await expect(row.locator('summary')).toContainText('Stamp 2026-09-10');
  await row.getByRole('button', { name: 'Add another visit' }).click();
  await row.getByLabel('Visit date').fill('2026-09-08'); await row.getByLabel('Notes').fill('Before stamp collection');
  await row.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByRole('dialog')).toContainText('2026-09-10');
  await expect(page.getByRole('dialog')).toContainText('2026-09-08');
  await page.screenshot({ path: testInfo.outputPath('earlier-visit-choice.png') });
  expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Save visit only', exact: true }).click();
  await expect(row.locator('summary')).toContainText('Stamp 2026-09-10');
  await expect(row).toContainText('Visit only - excluded from stamp collection');
  await page.reload(); await page.locator('#passport-tab').click();
  await page.locator('[data-key="region:northwest"] > summary').click();
  await expect(row.locator('summary')).toContainText('Stamp 2026-09-10');
  await expect(row).toContainText('2 visits');
});


test('Explore uses official region order and alphabetical airport names', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  const regions: { id: string; name: string }[] = JSON.parse(readFileSync('src/program/regions.json', 'utf8'));
  const airports: { id: string; name: string; regionId: string; participation: { participating: boolean } }[] = JSON.parse(readFileSync('src/program/airports.generated.json', 'utf8'));
  await expect(page.locator('#region option')).toHaveText(['All regions', ...regions.map(r => r.name)]);
  const expected = regions.flatMap(r => airports.filter(a => a.regionId === r.id && a.participation.participating).sort((a,b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }) || a.id.localeCompare(b.id)));
  const ids = () => page.locator('#airport-list [data-airport]').evaluateAll(rows => rows.map(r => r.getAttribute('data-airport')));
  expect(await ids()).toEqual(expected.map(a => a.id));
  for (const region of regions) {
    await page.locator('#region').selectOption(region.id);
    expect(await ids()).toEqual(expected.filter(a => a.regionId === region.id).map(a => a.id));
  }
  await page.locator('#region').selectOption('');
  expect(await ids()).toEqual(expected.map(a => a.id));
});
