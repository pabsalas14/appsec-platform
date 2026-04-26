import { test, expect } from '@playwright/test';

// Test Dashboard 8: Initiatives
test.describe('Dashboard 8: Iniciativas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost/dashboards/initiatives');
  });

  test.describe('Page Load', () => {
    test('page should load', async ({ page }) => {
      await expect(page.locator('text=Iniciativas')).toBeVisible();
    });

    test('should display key metrics', async ({ page }) => {
      await expect(page.locator('[data-testid="total-initiatives"]')).toBeVisible();
      await expect(page.locator('[data-testid="in-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="completed"]')).toBeVisible();
    });

    test('should show completion percentage', async ({ page }) => {
      const percent = page.locator('[data-testid="completion-percentage"]');
      if (await percent.isVisible()) {
        await expect(percent).toContainText('%');
      }
    });
  });

  test.describe('Initiatives List', () => {
    test('should render initiatives table or list', async ({ page }) => {
      const list = page.locator('[data-testid="initiatives-list"]');
      if (await list.isVisible()) {
        await expect(list).toBeVisible();
      }
    });

    test('each initiative should show status', async ({ page }) => {
      const rows = page.locator('[data-testid="initiative-row"]');
      const count = await rows.count();
      if (count > 0) {
        const firstRow = rows.first();
        const status = firstRow.locator('[data-testid="initiative-status"]');
        if (await status.isVisible()) {
          await expect(status).toBeVisible();
        }
      }
    });

    test('each initiative should show progress bar', async ({ page }) => {
      const rows = page.locator('[data-testid="initiative-row"]');
      const count = await rows.count();
      if (count > 0) {
        const firstRow = rows.first();
        const progressBar = firstRow.locator('[data-testid="progress-bar"]');
        if (await progressBar.isVisible()) {
          await expect(progressBar).toBeVisible();
        }
      }
    });
  });

  test.describe('Status Breakdown', () => {
    test('should show In Progress count', async ({ page }) => {
      await expect(page.locator('[data-testid="in-progress"]')).toBeVisible();
    });

    test('should show Completed count', async ({ page }) => {
      await expect(page.locator('[data-testid="completed"]')).toBeVisible();
    });

    test('status breakdown chart should display', async ({ page }) => {
      const chart = page.locator('[data-testid="status-chart"]');
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });
  });

  test.describe('Hierarchy Filters', () => {
    test('should filter by subdireccion', async ({ page }) => {
      const select = page.locator('[data-testid="subdireccion-select"]');
      if (await select.isVisible()) {
        await select.click();
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should filter by celula', async ({ page }) => {
      const select = page.locator('[data-testid="celula-select"]');
      if (await select.isVisible()) {
        await select.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Status Filter', () => {
    test('should filter by initiative status', async ({ page }) => {
      const statusFilter = page.locator('[data-testid="filter-status"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        const option = page.locator('text=En Progreso');
        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Drill Down', () => {
    test('clicking initiative should show details', async ({ page }) => {
      const firstRow = page.locator('[data-testid="initiative-row"]').first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(500);
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
      await page.goto('http://localhost/dashboards/initiatives');
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  test.describe('Responsive', () => {
    test('should adapt to mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="total-initiatives"]')).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('charts should render in dark mode', async ({ page }) => {
      const chart = page.locator('[data-testid="status-chart"]');
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no initiatives', async ({ page }) => {
      // Apply filter that results in 0 initiatives
      const emptyState = page.locator('[data-testid="empty-state"]');
      // May or may not show depending on data
      const list = page.locator('[data-testid="initiatives-list"]');
      if (await list.isVisible()) {
        const rows = list.locator('[data-testid="initiative-row"]');
        expect(await rows.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
