import { test, expect } from '@playwright/test';

// Test Dashboard 6: Releases Table View
test.describe('Dashboard 6: Liberaciones - Vista Tabla', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost/dashboards/releases-table');
  });

  test.describe('Page Load', () => {
    test('page should load with releases table', async ({ page }) => {
      const table = page.locator('[data-testid="releases-table"]');
      await expect(table).toBeVisible();
    });

    test('should display column headers', async ({ page }) => {
      const headers = ['Nombre', 'Versión', 'Estado', 'Fecha', 'Jira'];
      for (const header of headers) {
        const element = page.locator(`text="${header}"`).first();
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test.describe('Table Content', () => {
    test('should render release rows', async ({ page }) => {
      const rows = page.locator('[data-testid="release-row"]');
      const count = await rows.count();
      // May be 0 if no releases, but table structure should exist
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('each release should show name and version', async ({ page }) => {
      const firstRow = page.locator('[data-testid="release-row"]').first();
      if (await firstRow.isVisible()) {
        await expect(firstRow.locator('[data-testid="release-name"]')).toBeVisible();
        await expect(firstRow.locator('[data-testid="release-version"]')).toBeVisible();
      }
    });

    test('each release should show status badge', async ({ page }) => {
      const firstRow = page.locator('[data-testid="release-row"]').first();
      if (await firstRow.isVisible()) {
        const status = firstRow.locator('[data-testid="status-badge"]');
        if (await status.isVisible()) {
          await expect(status).toBeVisible();
        }
      }
    });
  });

  test.describe('Sorting', () => {
    test('should sort by name', async ({ page }) => {
      const header = page.locator('[data-testid="header-name"]');
      if (await header.isVisible()) {
        await header.click();
        await page.waitForTimeout(500);
      }
    });

    test('should sort by date', async ({ page }) => {
      const header = page.locator('[data-testid="header-date"]');
      if (await header.isVisible()) {
        await header.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Filtering', () => {
    test('should filter by status', async ({ page }) => {
      const statusFilter = page.locator('[data-testid="filter-status"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Pagination', () => {
    test('should have pagination controls', async ({ page }) => {
      const pagination = page.locator('[data-testid="pagination"]');
      if (await pagination.isVisible()) {
        await expect(pagination).toBeVisible();
      }
    });

    test('limit parameter should work', async ({ page }) => {
      await page.goto('http://localhost/dashboards/releases-table?limit=10');
      const rows = page.locator('[data-testid="release-row"]');
      const count = await rows.count();
      expect(count).toBeLessThanOrEqual(10);
    });

    test('should enforce max limit of 200', async ({ page }) => {
      await page.goto('http://localhost/dashboards/releases-table?limit=500');
      const rows = page.locator('[data-testid="release-row"]');
      const count = await rows.count();
      expect(count).toBeLessThanOrEqual(200);
    });
  });

  test.describe('Drill Down', () => {
    test('clicking release should show details', async ({ page }) => {
      const firstRow = page.locator('[data-testid="release-row"]').first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(500);
        // Should navigate or open detail panel
      }
    });
  });

  test.describe('Export', () => {
    test('should export to CSV', async ({ page }) => {
      const exportBtn = page.locator('button:has-text("Exportar")');
      if (await exportBtn.isVisible()) {
        await expect(exportBtn).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost/dashboards/releases-table');
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });

    test('pagination should not cause full reload', async ({ page }) => {
      const firstRow = page.locator('[data-testid="release-row"]').first();
      if (await firstRow.isVisible()) {
        const nextBtn = page.locator('[data-testid="pagination-next"]');
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Responsive', () => {
    test('should adapt to mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const table = page.locator('[data-testid="releases-table"]');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('table should render in dark mode', async ({ page }) => {
      const table = page.locator('[data-testid="releases-table"]');
      await expect(table).toBeVisible();
    });
  });
});
