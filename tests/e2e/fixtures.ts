import { test as base, expect } from '@playwright/test';

// Product regressions start after onboarding; the offline UX suite exercises first use separately.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => localStorage.setItem('passport:fly-washington:offline-introduction:browser', 'seen'));
    await use(context);
  },
});
export { expect };

export async function openManualVisit(page: import('@playwright/test').Page) {
  if (await page.locator('#gps-form').isVisible() || !await page.locator('#open-visit-editor').isVisible()) return;
  await page.locator('#open-visit-editor').click();
  await page.getByRole('button', {name:'Add a manual visit',exact:true}).click();
}
