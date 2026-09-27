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
  await page.locator('#open-visit-editor').click();
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

test('compact airport details preserve drafts and use consistent disclosure and cancel controls', async ({ page }, testInfo) => {
  await page.goto('/'); await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.locator('[data-airport="KBVS"]').click();
  await expect(page.locator('#checkin')).toBeHidden();
  await expect(page.locator('#visit-history')).not.toHaveAttribute('open', '');
  await expect(page.locator('.airport-information')).not.toHaveAttribute('open', '');
  await expect(page.locator('.airport-stamps')).not.toHaveAttribute('open', '');
  expect(await page.locator('#detail > [data-detail-section], #detail > #open-visit-editor').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-detail-section') ?? n.id))).toEqual(['information', 'stamps', 'history', 'open-visit-editor']);
  await page.locator('.airport-stamps > summary').click();
  await expect(page.locator('.airport-stamps')).toHaveAttribute('open', '');
  const title = (await page.locator('#detail h2').boundingBox())!;
  const identity = (await page.locator('.airport-identity').boundingBox())!;
  expect(identity.y).toBeGreaterThan(title.y);
  await page.screenshot({ path: testInfo.outputPath('compact-airport.png') });
  await page.locator('#open-visit-editor').click();
  await page.locator('#checkin [name="notes"]').fill('Keep my airport draft');
  const save = (await page.locator('#checkin [type="submit"]').boundingBox())!;
  const cancel = (await page.locator('#cancel-visit-draft').boundingBox())!;
  expect(Math.max(cancel.x - save.x - save.width, cancel.y - save.y - save.height)).toBeGreaterThanOrEqual(11);
  await page.locator('#cancel-visit-draft').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('#checkin [name="notes"]')).toHaveValue('Keep my airport draft');
  await page.locator('#close-detail').click(); await page.locator('[data-airport="KBVS"]').click();
  await expect(page.locator('#checkin')).toBeVisible();
  await expect(page.locator('.airport-stamps')).toHaveAttribute('open', '');
  await expect(page.locator('#checkin [name="notes"]')).toHaveValue('Keep my airport draft');
  await page.locator('#cancel-visit-draft').click(); await page.getByRole('button', { name: 'Discard draft', exact: true }).click();
  await expect(page.locator('#checkin')).toBeHidden(); await expect(page.locator('#open-visit-editor')).toBeFocused();
  await page.locator('#open-visit-editor').click(); await page.locator('#checkin [type="submit"]').click();
  await expect(page.locator('#airport-visit-summary')).toContainText('Stamp collected');
  await expect(page.locator('#checkin')).toBeHidden();
  await expect(page.locator('#visit-save-confirmation')).toHaveText('Visit saved on this device.');
  await page.locator('#close-detail').click(); await page.locator('[data-airport="KBVS"]').click();
  await expect(page.locator('#checkin')).toBeHidden();
  await page.locator('#visit-history').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('#checkin [name="notes"]').fill('Edited saved visit');
  await page.locator('#checkin [type="submit"]').click();
  await expect(page.locator('#checkin')).toBeHidden();
  await expect(page.locator('#visit-history')).toContainText('Edited saved visit');
  await expect(page.locator('#visit-history')).toHaveAttribute('open', '');
  await page.locator('#theme').selectOption('dark');
  await page.screenshot({ path: testInfo.outputPath('compact-airport-editor-dark.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('long stamp instructions expand without losing source text', async ({ page }, testInfo) => {
  const airports: { id: string; stampLocations: { description: string }[] }[] = JSON.parse(readFileSync('src/program/airports.generated.json', 'utf8'));
  const airport = airports.find(a => a.stampLocations.some(s => s.description.length > 360))!;
  const index = airport.stampLocations.findIndex(s => s.description.length > 360);
  await page.goto('/'); await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.locator('[data-airport="' + airport.id + '"]').click();
  await page.locator('.airport-stamps > summary').click();
  const stamp = page.locator('.stamp').nth(index);
  await expect(stamp.locator('small')).toBeVisible();
  await expect(stamp.locator('.stamp-instructions')).not.toHaveAttribute('open', '');
  await stamp.getByText('Show full instructions', { exact: true }).click();
  await expect(stamp.locator('.stamp-instructions p')).toHaveText(airport.stampLocations[index].description);
  await expect(stamp.locator('.stamp-instructions p')).toBeVisible();
});
