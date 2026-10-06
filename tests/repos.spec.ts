import { test, expect, type Page } from '@playwright/test';

// SPEC.md:6 - #repos: when the GitHub API returns repos, each repo's name appears in #repos
// as a link to its page on github.com. When the API returns an empty list or an error,
// #repos shows a visible text message and no repo links.
//
// Every request to api.github.com is mocked, so these tests never touch the real API.

const OWNER = 'fake-owner';
const FAKE_REPOS = ['zz-mock-repo-alpha', 'zz-mock-repo-bravo', 'zz-mock-repo-charlie'].map((name, i) => ({
  id: 900000 + i,
  name,
  full_name: `${OWNER}/${name}`,
  html_url: `https://github.com/${OWNER}/${name}`,
  description: `Mock repository ${name}`,
  private: false,
  fork: false,
  language: 'TypeScript',
  stargazers_count: i,
  forks_count: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  pushed_at: '2026-01-01T00:00:00Z',
  owner: { login: OWNER, html_url: `https://github.com/${OWNER}` },
}));

type Mock = { status: number; body: unknown };

// Answers every api.github.com request with the given mock and records how many were made.
async function mockGitHubApi(page: Page, mock: Mock) {
  const calls: string[] = [];
  await page.route('https://api.github.com/**', (route) => {
    calls.push(route.request().url());
    return route.fulfill({ status: mock.status, contentType: 'application/json', body: JSON.stringify(mock.body) });
  });
  return calls;
}

// A "repo link" is an <a> in #repos pointing at github.com/<owner>/<repo>.
// A link to a GitHub profile (github.com/<owner>) is not a repo link.
async function repoLinkHrefs(page: Page): Promise<string[]> {
  return page.locator('#repos a[href]').evaluateAll((links) =>
    links
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((href) => {
        const url = new URL(href);
        return url.hostname === 'github.com' && url.pathname.split('/').filter(Boolean).length >= 2;
      }),
  );
}

// Visible text in #repos that is not part of a heading, i.e. the text a message would add.
async function nonHeadingText(page: Page): Promise<string> {
  return page.locator('#repos').evaluate((section) => {
    let text = (section as HTMLElement).innerText;
    for (const h of section.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')) {
      text = text.replace(h.innerText, '');
    }
    return text.trim();
  });
}

test('SPEC.md:6 - each repo returned by the API appears in #repos as a link to its github.com page', async ({ page }) => {
  const calls = await mockGitHubApi(page, { status: 200, body: FAKE_REPOS });
  await page.goto('/');

  const repos = page.locator('#repos');
  for (const repo of FAKE_REPOS) {
    const link = repos.getByRole('link', { name: repo.name });
    await expect(link.first(), `${repo.name} should be a link in #repos`).toBeVisible();
    const href = await link.first().evaluate((a) => (a as HTMLAnchorElement).href);
    const url = new URL(href);
    expect(url.hostname, `${repo.name} link host`).toBe('github.com');
    expect(url.pathname.replace(/\/$/, '').split('/').pop(), `${repo.name} link path`).toBe(repo.name);
  }
  expect(calls.length, 'the site should request api.github.com').toBeGreaterThan(0);
});

for (const [label, mock] of [
  ['an empty list', { status: 200, body: [] }],
  ['a 500 error', { status: 500, body: { message: 'Server Error' } }],
] as const) {
  test(`SPEC.md:6 - when the API returns ${label}, #repos shows a text message and no repo links`, async ({ page }) => {
    const calls = await mockGitHubApi(page, mock);
    await page.goto('/');
    await expect.poll(() => calls.length, { message: 'the site should request api.github.com' }).toBeGreaterThan(0);
    await page.waitForLoadState('networkidle');

    await expect.poll(() => nonHeadingText(page), { message: '#repos should show a visible text message' }).not.toBe('');
    expect(await repoLinkHrefs(page), '#repos should contain no repo links').toEqual([]);
  });
}
