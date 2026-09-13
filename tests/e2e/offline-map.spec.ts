import { expect, test } from './fixtures';

test('complete downloaded map survives a cold offline tab and deletion preserves visits', async ({ page, context, browserName }, testInfo) => {
  test.setTimeout(180000);
  await page.goto('/');
  await expect(page.locator('.airport-map-hit')).toHaveCount(115);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect(page.locator('.airport-map-hit')).toHaveCount(115);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button',{name:'List',exact:true}).click();
  await page.locator('[data-airport="KBVS"]').click();
  await page.getByLabel('Notes',{exact:false}).fill('Offline package does not own visits');
  await page.getByRole('button',{name:'Save check-in'}).click();
  await page.getByRole('button',{name:'All airports'}).click();
  await page.getByRole('tab',{name:'My passport',exact:true}).click();
  await expect(page.locator('#map-status')).toContainText('Map not available offline');
  const before = await page.evaluate(() => navigator.storage.estimate());
  const downloadStarted = Date.now();
  await page.locator('#map-download').click();
  await expect(page.locator('#map-status')).toContainText('Map available on this device',{timeout:120000});
  const after = await page.evaluate(() => navigator.storage.estimate());
  await testInfo.attach('installation-measurement.json', {body:JSON.stringify({downloadMs:Date.now()-downloadStarted,before,after}),contentType:'application/json'});
  await expect(page.locator('#map')).toHaveAttribute('data-basemap-mode','offline',{timeout:30000});
  await page.getByRole('tab',{name:'Explore',exact:true}).click();
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button',{name:'Map',exact:true}).click();
  await expect(page.locator('#map')).toHaveAttribute('data-basemap-state','ready',{timeout:30000});
  await context.setOffline(true);
  await page.getByRole('tab',{name:'Explore',exact:true}).click();
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button',{name:'Map',exact:true}).click();
  const openRequests: string[] = [];
  page.on('request', r => { if (/\/maps\//.test(r.url())) openRequests.push(r.url()); });
  await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');
  await expect(page.locator('#map')).toHaveAttribute('data-basemap-theme','dark');
  await expect(page.locator('#map')).toHaveAttribute('data-basemap-state','ready');
  expect(openRequests).toEqual([]);
  const cold = await context.newPage();
  await page.close();
  const unexpected: string[] = [];
  cold.on('request', r => { if (/\/maps\//.test(r.url())) unexpected.push(r.url()); });
  try { await cold.goto('/'); }
  catch (error) {
    // Same narrowly identified automated WebKit navigation failure as passport.spec.ts.
    // Installation and open-app offline rendering above must pass before this exception.
    if (browserName === 'webkit' && error instanceof Error && /^page\.goto: WebKit encountered an internal error(?:\r?\n|$)/.test(error.message)) {
      test.skip(true, 'Automated WebKit cold offline navigation failed internally; physical Safari acceptance remains required.');
    }
    throw error;
  }
  await expect(cold.locator('.airport-map-hit')).toHaveCount(115);
  await expect(cold.locator('#map-status')).toContainText('Map available on this device',{timeout:60000});
  await expect(cold.locator('#map')).toHaveAttribute('data-basemap-state','ready',{timeout:30000});
  await cold.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');
  await expect(cold.locator('#map')).toHaveAttribute('data-basemap-theme','dark');
  await expect(cold.locator('#map')).toHaveAttribute('data-basemap-state','ready');
  await cold.screenshot({path:testInfo.outputPath('cold-offline-map.png')});
  await cold.getByRole('tab',{name:'My passport',exact:true}).click();
  await expect(cold.locator('#map-status')).toContainText('Map available on this device');
  expect(unexpected).toEqual([]);
  const cacheUrls = await cold.evaluate(async () => (await Promise.all((await caches.keys()).map(async name => (await (await caches.open(name)).keys()).map(r=>r.url)))).flat());
  expect(cacheUrls.some(url=>/\/maps\//.test(url))).toBe(false);
  await cold.locator('#map-delete').click();
  await expect(cold.locator('#map-status')).toContainText('Map not available offline');
  await cold.getByRole('tab',{name:'Explore',exact:true}).click();
  if (testInfo.project.name.startsWith('mobile')) await cold.getByRole('button',{name:'List',exact:true}).click();
  await cold.locator('[data-airport="KBVS"]').click();
  await expect(cold.locator('.history')).toContainText('Offline package does not own visits');
  await cold.close();
});
