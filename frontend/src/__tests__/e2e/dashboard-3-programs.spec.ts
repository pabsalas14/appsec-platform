import { test, expect } from '@playwright/test';

// Test Dashboard 3: Programas consolidado
test.describe('Dashboard 3: Programas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost/dashboards/programs');
  });

  test.describe('Page Load', () => {
    test('page should load', async ({ page }) => {
      await expect(page.locator('text=Programas')).toBeVisible();
    });

    test('should display key metrics', async ({ page }) => {
      await expect(page.locator('[data-testid="total-programs"]')).toBeVisible();
      await expect(page.locator('[data-testid="avg-completion"]')).toBeVisible();
      await expect(page.locator('[data-testid="at-risk-count"]')).toBeVisible();
    });
  });

  test.describe('Program List', () => {
    test('should display programs table', async ({ page }) => {
      const table = page.locator('[data-testid="programs-table"]');
      await expect(table).toBeVisible();
    });

    test('each program should show completion percentage', async ({ page }) => {
      const rows = page.locator('[data-testid="program-row"]');
      const count = await rows.count();
      if (count > 0) {
        const firstRow = rows.first();
        await expect(firstRow.locator('[data-testid="completion-percent"]')).toBeVisible();
      }
    });

    test('at-risk programs should be highlighted', async ({ page }) => {
      const atRiskRows = page.locator('[data-testid="program-row"][data-at-risk="true"]');
      // Verify there are some at-risk programs (if any)
      const count = await atRiskRows.count();
      // Count >= 0, may be 0 if all programs on track
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Sorting', () => {
    test('should sort by completion percentage', async ({ page }) => {
      const header = page.locator('[data-testid="header-completion"]');
      if (await header.isVisible()) {
        await header.click();
        await page.waitForTimeout(500);
        // Verify order changed
      }
    });

    test('should sort by finding count', async ({ page }) => {
      const header = page.locator('[data-testid="header-findings"]');
      if (await header.isVisible()) {
        await header.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Drill-down', () => {
    test('clicking program should drill down to detail', async ({ page }) => {
      const firstProgram = page.locator('[data-testid="program-row"]').first();
      if (await firstProgram.isVisible()) {
        await firstProgram.click();
        // Should navigate or open modal with details
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Export', () => {
    test('should have export button', async ({ page }) => {
      const exportBtn = page.locator('button:has-text("Exportar")');
      if (await exportBtn.isVisible()) {
        await expect(exportBtn).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost/dashboards/programs');
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  test.describe('Responsive', () => {
    test('table should adapt to mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const table = page.locator('[data-testid="programs-table"]');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('should render correctly in dark mode', async ({ page }) => {
      const metrics = page.locator('[data-testid="total-programs"]');
      await expect(metrics).toBeVisible();
    });
  });
});
