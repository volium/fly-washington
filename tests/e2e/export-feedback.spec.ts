import { test, expect } from './fixtures';

test('both export actions download a backup and show brief local feedback', async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator.storage, 'persisted', { value: async () => false });
    Object.defineProperty(navigator.storage, 'persist', { value: async () => false });
  });
  await page.goto('/');
  await page.locator('#passport-tab').click();
  const first = page.waitForEvent('download');
  await page.locator('#export').click();
  expect((await first).suggestedFilename()).toBe('fly-washington-passport.json');
  await expect(page.locator('#export-status')).toContainText('Backup prepared.');
  const row = await page.locator('#passport-panel .backup-actions').boundingBox();
  expect((await page.locator('#export-status').boundingBox())!.width).toBeCloseTo(row!.width, 0);
  await page.locator('#explore-tab').click();
  await page.locator('#storage-protection').click();
  const second = page.waitForEvent('download');
  await page.locator('#offline-export').click();
  expect((await second).suggestedFilename()).toBe('fly-washington-passport.json');
  await expect(page.locator('#offline-export-status')).toContainText('Backup prepared.');
  await expect(page.locator('#notice')).not.toContainText('Backup prepared.');
  await expect(page.locator('#passport-notice')).not.toContainText('Backup prepared.');
  await expect(page.locator('#offline-export-status')).toHaveText('', { timeout: 7000 });
  await expect(page.locator('#export-status')).toHaveText('');
});


test('import opens the native chooser and shows brief completion and cancellation feedback', async ({ page }) => {
  await page.goto('/');
  await page.locator('#passport-tab').click();
  const chooser = page.waitForEvent('filechooser');
  await page.locator('#import-button').click();
  const picker = await chooser;
  await expect(page.locator('#passport-notice')).toContainText('Choose a passport JSON backup');
  await picker.setFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'aviation-passport',schemaVersion:1,programId:'fly-washington',exportedAt:new Date().toISOString(),checkIns:[],attachments:[]}))});
  await expect(page.locator('#passport-notice')).toContainText('Imported 0 visits');
  await expect(page.locator('#passport-notice')).toHaveText('',{timeout:7000});
  await page.locator('#import').dispatchEvent('cancel');
  await expect(page.locator('#passport-notice')).toContainText('Import cancelled');
  await expect(page.locator('#passport-notice')).toHaveText('',{timeout:7000});
});
