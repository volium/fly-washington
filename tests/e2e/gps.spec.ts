import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';

test('packaged check-in finds a Washington airport and saves a timed visit', async ({ page, context, browserName }, testInfo) => {
  const airports = JSON.parse(readFileSync('src/program/airports.generated.json','utf8')) as {id:string;location:{latitude:number;longitude:number}}[];
  const airport = airports.find(a => a.id === 'KBVS')!;
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({...airport.location,accuracy:20});
  if (browserName === 'webkit') await page.addInitScript(() => {
    // Windows WebKit 2359's injected positions report epoch microseconds. The web
    // API requires milliseconds. Correct only that simulator result in this test;
    // production must continue rejecting future/stale timestamps.
    const watch = navigator.geolocation.watchPosition.bind(navigator.geolocation);
    navigator.geolocation.watchPosition = (success, error, options) => watch(position => {
      if (position.timestamp > Date.now() * 100) {
        success({ coords: position.coords, timestamp: position.timestamp / 1000 } as GeolocationPosition);
      } else success(position);
    }, error, options);
  });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
  await page.locator('#quick-checkin').click();
  await page.getByRole('button',{name:'Use my location',exact:true}).click();
  await page.locator('[data-match]').filter({hasText:'Skagit Regional'}).click();
  await expect(page.locator('.gps-checkin')).toContainText('Location confirmed nearby');
  expect(await page.locator('.gps-checkin').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('location-checkin.png')});
  await page.locator('#gps-form textarea').fill('Washington GPS check-in');
  await page.locator('#gps-form [type=submit]').click();
  await expect(page.locator('.gps-checkin')).not.toBeVisible();
  await expect(page.locator('#overall')).toContainText('1 / 115');
  await page.reload();
  await expect(page.locator('#overall')).toContainText('1 / 115');
  await page.locator('#quick-checkin').click();
  await page.locator('[data-match]').filter({hasText:'Skagit Regional'}).click();
  await expect(page.locator('.gps-checkin')).toContainText('Stamp already recorded');
  await page.locator('#gps-form [type=submit]').click();
  await expect(page.getByRole('dialog',{name:'Another visit on the same day?'})).toBeVisible();
  await page.getByRole('dialog',{name:'Another visit on the same day?'}).getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.locator('#gps-form')).toBeVisible();
});
