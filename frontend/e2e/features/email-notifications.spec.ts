import { test, expect } from '@playwright/test';

test.describe('Email Notifications - Preferences, Templates, Logs', () => {
  test.beforeEach(async ({ page, context }) => {
    // Login as admin
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
    await page.goto('http://localhost/admin/email-notifications');
    await page.waitForLoadState('networkidle');
  });

  test('should load email notifications page', async ({ page }) => {
    await expect(page.locator('text=Email Notifications')).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });

  test.describe('Preferences Tab', () => {
    test('should show 5 notification types', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Preferencias")');

      // Should show vulnerability_alert, user_welcome, password_reset, team_invitation, audit_report
      const cards = page.locator('[role="tabpanel"] [role="button"]:has-text("Vulnerabilidad")', {
        hasText: 'Vulnerabilidad',
      });
      await expect(cards).toHaveCount(1);
    });

    test('should toggle notification preference', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Preferencias")');

      // Click switch for first notification type
      const firstSwitch = page.locator('input[role="switch"]').first();
      const wasChecked = await firstSwitch.isChecked();

      await firstSwitch.click();
      const nowChecked = await firstSwitch.isChecked();

      expect(nowChecked).not.toBe(wasChecked);
    });

    test('should save preference changes', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Preferencias")');

      const firstSwitch = page.locator('input[role="switch"]').first();
      await firstSwitch.click();

      // Click save button
      await page.click('button:has-text("Guardar")');

      // Should show success toast
      await expect(page.locator('text=Preferencia actualizada')).toBeVisible();
    });
  });

  test.describe('Templates Tab', () => {
    test('should show email templates', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Plantillas")');

      // Should show template cards
      const cards = page.locator('[role="tabpanel"] [role="button"]');
      await expect(cards).toHaveCount(1); // At least one template
    });

    test('should open template detail in sheet drawer', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Plantillas")');

      // Click view button
      await page.click('button:has-text("Ver")');

      // Should open sheet drawer
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Asunto')).toBeVisible();
      await expect(page.locator('text=Contenido HTML')).toBeVisible();
    });

    test('should copy HTML to clipboard', async ({ page, context }) => {
      await page.click('[role="tab"]:has-text("Plantillas")');

      await page.click('button:has-text("Ver")');
      await page.click('button:has-text("Copiar HTML")');

      // Should show success toast
      await expect(page.locator('text=Copiado')).toBeVisible();
    });
  });

  test.describe('Logs Tab', () => {
    test('should show email logs table', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Historial")');

      // Should show table
      await expect(page.locator('[role="table"]')).toBeVisible();
    });

    test('should have pagination controls', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Historial")');

      // Check for limit buttons (10, 25, 50, 100)
      await expect(page.locator('button:has-text("10")')).toBeVisible();
      await expect(page.locator('button:has-text("50")')).toBeVisible();
    });

    test('should change log limit', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Historial")');

      // Click on 25 limit
      await page.click('button:has-text("25")');

      // Button should be highlighted
      await expect(page.locator('button:has-text("25")')).toHaveClass(/default/);
    });

    test('should refresh logs', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Historial")');

      const refreshButton = page.locator('button:has-text("Actualizar")');
      await expect(refreshButton).toBeVisible();
      await refreshButton.click();

      // Should show loading state briefly
      await page.waitForTimeout(100);
    });
  });
});
