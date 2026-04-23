import { test as base, expect, Page } from '@playwright/test';

export const E2E_USERNAME = process.env.E2E_USERNAME ?? 'admin';
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'Changeme123!';

/**
 * Perform a UI login and wait until the dashboard is reachable.
 * Auth cookies are HttpOnly, so we log in through the form and let
 * Playwright's storage state carry the session.
 */
export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/username/i).fill(E2E_USERNAME);
  await page.getByLabel(/password/i).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/tasks/);
}

type Fixtures = {
  authedPage: Page;
};

export const test = base.extend<Fixtures>({
  authedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect };
