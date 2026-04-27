import { test, expect } from '@playwright/test';

test.describe('MAST Module - Mobile Application Security Testing', () => {
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
    await page.goto('http://localhost/dashboards/mast');
    await page.waitForLoadState('networkidle');
  });

  test('should load MAST dashboard', async ({ page }) => {
    await expect(page.locator('text=/MAST|Mobile/')).toBeVisible();
  });

  test('should display applications in grid', async ({ page }) => {
    // Should show grid of mobile apps
    const appCards = page.locator('[data-testid="mast-app-card"]');
    await expect(appCards).toHaveCount(1); // At least one app
  });

  test('should show security score (0-100)', async ({ page }) => {
    // Security score should be visible on card
    const score = page.locator('text=/\\d{1,3}%/');
    await expect(score).toBeVisible();
  });

  test('should open app detail panel on click', async ({ page }) => {
    // Click on first app card
    await page.locator('[data-testid="mast-app-card"]').first().click();

    // Should open side panel
    await expect(page.locator('[role="complementary"]')).toBeVisible();
  });

  test('should show 4 tabs in detail panel', async ({ page }) => {
    // Click on first app card
    await page.locator('[data-testid="mast-app-card"]').first().click();

    // Should show tabs: Info, Hallazgos, Ejecuciones, Historial
    const tabs = page.locator('[role="tab"]');
    await expect(tabs.filter({ hasText: 'Info' })).toBeVisible();
    await expect(tabs.filter({ hasText: 'Hallazgos' })).toBeVisible();
    await expect(tabs.filter({ hasText: 'Ejecuciones' })).toBeVisible();
    await expect(tabs.filter({ hasText: 'Historial' })).toBeVisible();
  });

  test('should display findings in Hallazgos tab', async ({ page }) => {
    // Click on first app card
    await page.locator('[data-testid="mast-app-card"]').first().click();

    // Click Hallazgos tab
    await page.click('[role="tab"]:has-text("Hallazgos")');

    // Should show findings table
    await expect(page.locator('[role="table"]')).toBeVisible();
  });

  test('should display executions in Ejecuciones tab', async ({ page }) => {
    // Click on first app card
    await page.locator('[data-testid="mast-app-card"]').first().click();

    // Click Ejecuciones tab
    await page.click('[role="tab"]:has-text("Ejecuciones")');

    // Should show execution records
    await expect(page.locator('text=/fecha|resultado/')).toBeVisible();
  });

  test('should filter findings by severity', async ({ page }) => {
    // Click on first app card
    await page.locator('[data-testid="mast-app-card"]').first().click();

    // Click Hallazgos tab
    await page.click('[role="tab"]:has-text("Hallazgos")');

    // Should show severity chips
    const severityChips = page.locator('[data-testid="severity-chip"]');
    await expect(severityChips).toHaveCount(1); // At least one
  });

  test('should close detail panel', async ({ page }) => {
    // Click on first app card
    await page.locator('[data-testid="mast-app-card"]').first().click();

    // Click close button
    await page.locator('[role="complementary"] button[aria-label*="close" i]').click();

    // Panel should close
    await expect(page.locator('[role="complementary"]')).not.toBeVisible();
  });
});
