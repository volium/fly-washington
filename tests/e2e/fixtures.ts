import { test as base, expect } from '@playwright/test';

// Product regressions start after onboarding; the offline UX suite exercises first use separately.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => localStorage.setItem('passport:fly-washington:offline-introduction:browser', 'seen'));
    await use(context);
  },
});
export { expect };
