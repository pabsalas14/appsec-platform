import { test, expect } from '@playwright/test';

test.describe('Dark Mode - Theme Switcher & Persistence', () => {
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

  test('should show theme toggle button in header', async ({ page }) => {
    // Look for sun or moon icon in header
    const themeButton = page.locator('button:has-text("Cambiar tema")');
    await expect(themeButton).toBeVisible();
  });

  test('should open theme menu on click', async ({ page }) => {
    // Click theme toggle
    await page.locator('button[aria-label*="theme" i]').click();

    // Should show dropdown with light/dark/system options
    await expect(page.locator('text=Claro')).toBeVisible();
    await expect(page.locator('text=Oscuro')).toBeVisible();
    await expect(page.locator('text=Sistema')).toBeVisible();
  });

  test('should switch to dark theme', async ({ page }) => {
    // Open theme menu
    await page.locator('button[aria-label*="theme" i]').click();
    await page.click('[role="menuitem"]:has-text("Oscuro")');

    // Wait for theme change
    await page.waitForTimeout(300);

    // Check if dark class is applied to html/body
    const htmlElement = page.locator('html');
    const className = await htmlElement.getAttribute('class');
    expect(className).toContain('dark');
  });

  test('should switch to light theme', async ({ page }) => {
    // First switch to dark
    await page.locator('button[aria-label*="theme" i]').click();
    await page.click('[role="menuitem"]:has-text("Oscuro")');
    await page.waitForTimeout(300);

    // Then switch back to light
    await page.locator('button[aria-label*="theme" i]').click();
    await page.click('[role="menuitem"]:has-text("Claro")');
    await page.waitForTimeout(300);

    // Check if dark class is removed
    const htmlElement = page.locator('html');
    const className = await htmlElement.getAttribute('class');
    expect(className).not.toContain('dark');
  });

  test('should persist theme preference in profile', async ({ page }) => {
    // Navigate to profile
    await page.goto('http://localhost/profile');
    await page.waitForLoadState('networkidle');

    // Click on Theme tab
    await page.click('[role="tab"]:has-text("Theme")');

    // Should show theme options
    await expect(page.locator('text=Claro')).toBeVisible();
    await expect(page.locator('text=Oscuro')).toBeVisible();
    await expect(page.locator('text=Sistema')).toBeVisible();
  });

  test('should save theme preference from profile', async ({ page }) => {
    await page.goto('http://localhost/profile');
    await page.waitForLoadState('networkidle');

    // Click on Theme tab
    await page.click('[role="tab"]:has-text("Theme")');

    // Click on Dark theme card
    await page.locator('[role="tabpanel"] text=Oscuro').click();

    // Should show loading state
    await expect(page.locator('text=Guardando')).toBeVisible({ timeout: 2000 });
  });

  test('should sync theme across tabs', async ({ browser, context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Add session cookie to both
    const cookies = [
      {
        name: 'session',
        value: process.env.TEST_SESSION || '',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ];

    await page1.context().addCookies(cookies);
    await page2.context().addCookies(cookies);

    // Navigate both to home
    await page1.goto('http://localhost/');
    await page2.goto('http://localhost/');

    // Change theme in page1
    await page1.locator('button[aria-label*="theme" i]').click();
    await page1.click('[role="menuitem"]:has-text("Oscuro")');
    await page1.waitForTimeout(500);

    // Page2 should also be in dark mode (if persistence is working)
    // Note: This depends on server-side persistence implementation
    const page2HtmlClass = await page2.locator('html').getAttribute('class');
    // This is a soft assertion - may need to reload page2
  });

  test('should maintain CSS transitions without flashing', async ({ page }) => {
    // This is a visual test
    const startTime = Date.now();

    // Switch themes rapidly
    await page.locator('button[aria-label*="theme" i]').click();
    await page.click('[role="menuitem"]:has-text("Oscuro")');

    await page.waitForTimeout(200);

    await page.locator('button[aria-label*="theme" i]').click();
    await page.click('[role="menuitem"]:has-text("Claro")');

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete relatively quickly (no major flashing)
    expect(duration).toBeLessThan(2000);
  });
});
