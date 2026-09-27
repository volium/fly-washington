import { expect, test } from './fixtures';

test('successful saves close the editor, expire feedback, and preserve later drafts during deletion', async ({ page }, testInfo) => {
  await page.goto('/');
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.locator('[data-airport="KBVS"]').click();
  if (await page.locator('#open-visit-editor').isVisible()) await page.locator('#open-visit-editor').click(); await page.getByLabel('Notes', { exact: false }).fill('Retain this visit during confirmation');
  const button = page.locator('#checkin button[type="submit"]');
  await button.click();
  await expect(page.locator('#checkin')).toBeHidden();
  await expect(page.locator('#visit-save-confirmation')).toHaveText('Visit saved on this device.');
  await expect(page.locator('#open-visit-editor')).toBeFocused();
  await page.locator('#checkin').evaluate(form => (form as HTMLFormElement).requestSubmit());
  await expect(page.locator('.history article')).toHaveCount(1);
  await expect(page.locator('#visit-save-confirmation')).toBeEmpty({ timeout: 7000 });
  if (await page.locator('#open-visit-editor').isVisible()) await page.locator('#open-visit-editor').click(); await page.getByLabel('Notes', { exact: false }).fill('Keep my unfinished draft');
  const form = await page.locator('#checkin').elementHandle();
  if (await page.locator('#visit-history').getAttribute('open') === null) await page.locator('#history-heading').click(); await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete visit', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Visit deleted', exact: true })).toBeDisabled();
  await expect(page.locator('.history')).toContainText('Retain this visit during confirmation');
  await expect(page.locator('#visit-count')).toHaveText('0');
  expect(await form!.evaluate(node => node.isConnected)).toBe(true);
  await expect(page.getByLabel('Notes', { exact: false })).toHaveValue('Keep my unfinished draft');
  await page.screenshot({ path: testInfo.outputPath('deleted-visit.png') });
  await expect(page.locator('.history article')).toHaveCount(0, { timeout: 6000 });
  await expect(page.locator('.history')).toContainText('Your first visit is still ahead of you.');
  await expect(page.locator('#notice')).toBeEmpty();
});
