import { test, expect } from '@playwright/test';

// Requirements from SPEC.md, section "Conventions".

test('SPEC.md:4 - all six sections exist: #hero #about #skills #projects #repos #contact', async ({ page }) => {
  await page.goto('/');
  for (const id of ['hero', 'about', 'skills', 'projects', 'repos', 'contact']) {
    await expect(page.locator(`#${id}`), `#${id} should exist`).toHaveCount(1);
  }
});

test('SPEC.md:5 - no horizontal scroll at a viewport width of 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

// SPEC.md:6 (#repos) is tested in repos.spec.ts.

// "Links to email, GitHub and LinkedIn" is read as: an <a> with a mailto: href,
// an <a> whose href is on github.com, and an <a> whose href is on linkedin.com.
test('SPEC.md:7 - #hero and #contact contain links to email, GitHub and LinkedIn', async ({ page }) => {
  await page.goto('/');
  for (const id of ['hero', 'contact']) {
    const section = page.locator(`#${id}`);
    await expect(section.locator('a[href^="mailto:"]'), `#${id} email link`).not.toHaveCount(0);
    await expect(section.locator('a[href*="github.com"]'), `#${id} GitHub link`).not.toHaveCount(0);
    await expect(section.locator('a[href*="linkedin.com"]'), `#${id} LinkedIn link`).not.toHaveCount(0);
  }
});
