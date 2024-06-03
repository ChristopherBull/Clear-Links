import { expect, test } from './fixtures/fixtures.js';

test.describe('Extension loads', () => {
  test('extension loads and activates on webpage', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('/');
    const elementExists = await page.waitForSelector('#cl-container');
    await expect(elementExists).toBeTruthy();
  });
});

test.describe('Tooltip shows', () => {
  // Tooltip container which is set on each test (each page load)
  let tooltip;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for extension to load and activate on webpage
    tooltip = await page.waitForSelector('#cl-container');
  });

  test('tooltip shown on link hover', async ({ page }) => {
    // Hover over link to show tooltip
    await page.hover('a#link-https');
    // Check if tooltip is visible
    await expect(await tooltip.getAttribute('style')).toContain('opacity: 1');
  });
});

