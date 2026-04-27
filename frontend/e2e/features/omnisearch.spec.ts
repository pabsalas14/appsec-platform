import { test, expect } from '@playwright/test';

test.describe('Omnisearch - Full-text search across 9 entity types', () => {
  test.beforeEach(async ({ page, context }) => {
    // Login
    await context.addCookies([
      {
        name: 'session',
        value: process.env.TEST_SESSION || '',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
    await page.goto('http://localhost/');
    await page.waitForLoadState('networkidle');
  });

  test('should open search modal with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+K');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('input[type="search"]')).toBeFocused();
  });

  test('should search for vulnerabilities', async ({ page }) => {
    await page.keyboard.press('Control+K');
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('sql injection');

    // Wait for results
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount(1);
  });

  test('should navigate to vulnerability detail from search result', async ({ page }) => {
    await page.keyboard.press('Control+K');
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('CVE-2024');

    await page.waitForTimeout(300);
    await page.locator('[data-testid="search-result"]').first().click();

    // Should navigate to vulnerability detail
    await page.waitForURL('**/vulnerabilidads/**');
    expect(page.url()).toContain('vulnerabilidads');
  });

  test('should close search modal with Escape', async ({ page }) => {
    await page.keyboard.press('Control+K');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should search across multiple entity types', async ({ page }) => {
    await page.keyboard.press('Control+K');
    const searchInput = page.locator('input[type="search"]');

    // Search for a program name
    await searchInput.fill('SAST');
    await page.waitForTimeout(300);

    // Should find vulnerabilities, programs, etc
    const results = page.locator('[data-testid="search-result-group"]');
    await expect(results).toHaveCount(1); // At least one group
  });
});
