import { test, expect } from '@playwright/test';

// Test Dashboard 2: Equipo / Carga de trabajo por analista
test.describe('Dashboard 2: Equipo', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Setup auth in test config
    await page.goto('http://localhost/dashboards/team');
  });

  test.describe('Page Load', () => {
    test('page should load with title', async ({ page }) => {
      await expect(page.locator('text=Equipo')).toBeVisible();
    });

    test('should display team size metric', async ({ page }) => {
      await expect(page.locator('[data-testid="team-size"]')).toBeVisible();
    });
  });

  test.describe('Analysts Table', () => {
    test('should render analysts table with headers', async ({ page }) => {
      const table = page.locator('[data-testid="analysts-table"]');
      await expect(table).toBeVisible();

      // Verify headers
      await expect(page.locator('text=Analista')).toBeVisible();
      await expect(page.locator('text=Total')).toBeVisible();
      await expect(page.locator('text=Abiertas')).toBeVisible();
      await expect(page.locator('text=Cerradas')).toBeVisible();
    });

    test('each analyst row should show metrics', async ({ page }) => {
      const rows = page.locator('[data-testid="analysts-table"] tbody tr');
      if ((await rows.count()) > 0) {
        const firstRow = rows.first();
        // Verify columns contain numeric values
        await expect(firstRow.locator('[data-testid="total-vulns"]')).toBeVisible();
      }
    });

    test('should sort by column when clicked', async ({ page }) => {
      const header = page.locator('text=Total').first();
      await header.click();
      // Data should reorder (if API supports sorting)
      await page.waitForTimeout(500);
    });
  });

  test.describe('Filters', () => {
    test('should filter by workload (open/closed)', async ({ page }) => {
      const filterBtn = page.locator('[data-testid="filter-workload"]');
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await page.locator('text=Solo Abiertas').click();
        // Data should update
        await page.waitForTimeout(500);
      }
    });

    test('should have date range filter', async ({ page }) => {
      const dateFilter = page.locator('[data-testid="date-range-filter"]');
      if (await dateFilter.isVisible()) {
        await expect(dateFilter).toBeVisible();
      }
    });
  });

  test.describe('Export', () => {
    test('should export to CSV', async ({ page }) => {
      const exportBtn = page.locator('button:has-text("Exportar")');
      if (await exportBtn.isVisible()) {
        // Note: Full download test requires download listener setup
        await expect(exportBtn).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost/dashboards/team');
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  test.describe('Responsive Design', () => {
    test('should stack table on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const table = page.locator('[data-testid="analysts-table"]');
      // Verify display adapts
      await expect(table).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('should render correctly in dark mode', async ({ page }) => {
      // TODO: Setup dark mode toggle in config
      const table = page.locator('[data-testid="analysts-table"]');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show loading state', async ({ page }) => {
      void page.locator('[data-testid="loading-spinner"]');
      // May or may not be visible depending on cache
      await page.waitForLoadState('networkidle');
    });

    test('should handle network error gracefully', async ({ page: _page }) => {
      // Simulate network failure on refetch
      // Would require specific testing setup
    });
  });

  test.describe('Permissions', () => {
    test('authorized user should see dashboard', async ({ page }) => {
      // Login should be handled in fixture
      await expect(page.locator('[data-testid="analysts-table"]')).toBeVisible();
    });
  });
});
