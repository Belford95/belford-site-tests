import { test, expect, type Page, type Locator } from '@playwright/test';

// Requirements from SPEC.md, section "Issue #1: dark-mode toggle".

const bodyIsDark = (page: Page) => page.evaluate(() => document.body.classList.contains('dark'));

// The spec says only "a button in the nav", so find whichever nav button
// adds or removes the 'dark' class on <body> when clicked.
async function findToggle(page: Page): Promise<Locator> {
  const buttons = page.locator('nav button');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    if (!(await button.isVisible())) continue;
    const before = await bodyIsDark(page);
    await button.click();
    if ((await bodyIsDark(page)) !== before) {
      await button.click(); // restore the starting state
      return button;
    }
  }
  throw new Error(`None of the ${count} button(s) in <nav> toggles the 'dark' class on <body>`);
}

test("SPEC.md:10 - a button in the nav toggles a 'dark' class on <body>", async ({ page }) => {
  await page.goto('/');
  const toggle = await findToggle(page);
  const start = await bodyIsDark(page);

  await toggle.click();
  expect(await bodyIsDark(page)).toBe(!start);

  await toggle.click();
  expect(await bodyIsDark(page)).toBe(start);
});

// "Kept for the session" is read only as: the choice survives a reload in the same tab.
// Whether it should survive a new tab, or be cleared when the browser closes, is not specified.
test('SPEC.md:11 - the dark-mode choice is kept after a reload', async ({ page }) => {
  await page.goto('/');
  const toggle = await findToggle(page);
  const start = await bodyIsDark(page);

  await toggle.click();
  const chosen = !start;
  expect(await bodyIsDark(page)).toBe(chosen);

  await page.reload();
  await expect.poll(() => bodyIsDark(page)).toBe(chosen);
});
