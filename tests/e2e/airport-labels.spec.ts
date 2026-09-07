import { expect, test } from './fixtures';

test('FAA labels are consistent while internal and ICAO identifiers remain searchable', async ({ page }, testInfo) => {
  await page.goto('/');
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'List', exact: true }).click();
  for (const [id, label] of [['KPAE', 'PAE'], ['KTIW', 'TIW'], ['KEAT', 'EAT'], ['KS10', 'S10'], ['K80T', '80T'], ['2S5', '2S5'], ['8S2', '8S2']]) {
    await page.getByRole('searchbox', { name: 'Search airports' }).fill(id);
    const card = page.locator(`[data-airport="${id}"]`);
    await expect(card.locator('.airport-code')).toHaveText(label);
    await expect(page.locator(`.leaflet-marker-icon[title^="${label} "]`)).toHaveAttribute('aria-label', new RegExp(`^${label} `));
    await card.click();
    await expect(page.locator('#detail > .eyebrow')).toContainText(label);
    await expect(page.locator('.leaflet-selectedAirportLabel-pane .airport-tooltip')).toHaveText([label]);
    await page.getByRole('button', { name: 'All airports' }).click();
  }
});

test('selection raises both the marker and label above neighboring airports', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Mobile airport details cover the map.');
  await page.goto('/');
  for (const [id, label] of [['KRNT', 'RNT'], ['W36', 'W36']]) {
    await page.locator(`[data-airport="${id}"]`).click();
    const selected = page.locator('.leaflet-selectedAirport-pane .leaflet-marker-icon');
    await expect(selected).toHaveCount(1);
    await expect(selected).toHaveAttribute('title', new RegExp(`^${label} `));
    await expect(page.locator('.leaflet-selectedAirportLabel-pane .airport-tooltip')).toHaveText([label]);
    expect(await page.locator('#map').evaluate(map => {
      const z = (selector: string) => Number(getComputedStyle(map.querySelector(selector)!).zIndex);
      return z('.leaflet-selectedAirportLabel-pane') > z('.leaflet-selectedAirport-pane')
        && z('.leaflet-selectedAirport-pane') > z('.leaflet-tooltip-pane')
        && z('.leaflet-selectedAirport-pane') > z('.leaflet-marker-pane');
    })).toBe(true);
    await page.getByRole('button', { name: 'All airports' }).click();
    await expect(page.locator('.leaflet-selectedAirport-pane .leaflet-marker-icon')).toHaveCount(0);
  }
});
