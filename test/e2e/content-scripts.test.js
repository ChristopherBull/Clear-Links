import { expect, test } from './fixtures/fixtures.js';

test.describe('Extension loads', () => {
  test('extension loads and activates on webpage', async ({ page }) => {
    await page.goto('/');
    const elementExists = page.locator('#cl-container');
    await expect(elementExists).toBeAttached();
  });
});

test.describe('Tooltip shows', () => {
  // Tooltip container which is set on each test (each page load)
  let tooltip;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for extension to load and activate on webpage
    tooltip = page.locator('#cl-container');
    await tooltip.waitFor({ state: 'attached' });
  });

  test('tooltip hidden initially', async () => {
    // Check if tooltip is visible
    await expect(tooltip).toBeHidden();
  });

  test('tooltip shown on link hover', async ({ page }) => {
    // Hover over link to show tooltip
    await page.hover('a#link-https');
    // Check if tooltip is visible
    await expect(tooltip).toBeVisible();
  });

  test('tooltip hides on link mouseleave', async ({ page }) => {
    // Hover over link to show tooltip
    await page.hover('a#link-https');
    // Check if tooltip is visible
    await expect(tooltip).toBeVisible();
    // Move mouse away from link to hide tooltip
    await page.mouse.move(0, 0);
    // Check if tooltip is hidden
    await expect(tooltip).toBeHidden();
  });

  test('tooltip shows on second separate link mouseover event', async ({ page }) => {
    // Check if moving mouse cursor over multiple links hides the tooltip correctly
    // Hover over link to show tooltip
    await page.hover('a#link-https');
    // Check if tooltip is visible
    await expect(tooltip).toBeVisible();
    // Hover over another link to show tooltip
    await page.hover('a#link-http');
    // Check if tooltip is visible
    await expect(tooltip).toBeVisible();
  });

  test('tooltip hides after two separate link mouseover events', async ({ page }) => {
    // Check if moving mouse cursor over multiple links hides the tooltip correctly
    // Hover over link to show tooltip
    await page.hover('a#link-https');
    // Check if tooltip is visible
    await expect(tooltip).toBeVisible();
    // Hover over another link to show tooltip
    await page.hover('a#link-http');
    // Check if tooltip is visible
    await expect(tooltip).toBeVisible();
    // Move mouse away from link to hide tooltip
    await page.mouse.move(0, 0);
    // Check if tooltip is visible
    await expect(tooltip).toBeHidden();
  });

  test('tooltip hides once observed element is externally removed', async ({ page }) => {
    const linkSelector = 'a#link-https';
    // Hover over link to show tooltip
    await page.hover(linkSelector);
    // Check if tooltip is visible
    await expect(tooltip).toBeVisible();
    // Remove the observed element from the DOM
    await page.evaluate((linkSelectorPassed) => {
      const link = document.querySelector(linkSelectorPassed);
      link.parentNode.removeChild(link);
    }, linkSelector);
    // Check if tooltip is hidden
    await expect(tooltip).toBeHidden();
  });
});
