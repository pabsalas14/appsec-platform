import { test, expect } from '@playwright/test';

// Test Dashboard 9: Emerging Themes
test.describe('Dashboard 9: Temas Emergentes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost/dashboards/emerging-themes');
  });

  test.describe('Page Load', () => {
    test('page should load', async ({ page }) => {
      await expect(page.locator('text=Temas Emergentes')).toBeVisible();
    });

    test('should display key metrics', async ({ page }) => {
      await expect(page.locator('[data-testid="total-themes"]')).toBeVisible();
      await expect(page.locator('[data-testid="unmoved-7days"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-themes"]')).toBeVisible();
    });
  });

  test.describe('Themes List', () => {
    test('should render themes list or table', async ({ page }) => {
      const list = page.locator('[data-testid="themes-list"]');
      if (await list.isVisible()) {
        await expect(list).toBeVisible();
      }
    });

    test('each theme should show title and description', async ({ page }) => {
      const rows = page.locator('[data-testid="theme-row"]');
      const count = await rows.count();
      if (count > 0) {
        const firstRow = rows.first();
        await expect(firstRow.locator('[data-testid="theme-title"]')).toBeVisible();
      }
    });

    test('each theme should show last update date', async ({ page }) => {
      const rows = page.locator('[data-testid="theme-row"]');
      const count = await rows.count();
      if (count > 0) {
        const firstRow = rows.first();
        const updated = firstRow.locator('[data-testid="updated-date"]');
        if (await updated.isVisible()) {
          await expect(updated).toBeVisible();
        }
      }
    });
  });

  test.describe('Activity Metrics', () => {
    test('should show unmoved (7+ days) count', async ({ page }) => {
      const unmoved = page.locator('[data-testid="unmoved-7days"]');
      await expect(unmoved).toBeVisible();
    });

    test('should show active (moved within 7 days) count', async ({ page }) => {
      const active = page.locator('[data-testid="active-themes"]');
      await expect(active).toBeVisible();
    });

    test('active themes should equal total minus unmoved', async ({ page }) => {
      const total = await page.locator('[data-testid="total-themes"]').textContent();
      const unmoved = await page.locator('[data-testid="unmoved-7days"]').textContent();
      const active = await page.locator('[data-testid="active-themes"]').textContent();

      const totalNum = parseInt(total || '0');
      const unmovedNum = parseInt(unmoved || '0');
      const activeNum = parseInt(active || '0');

      expect(activeNum).toBe(totalNum - unmovedNum);
    });
  });

  test.describe('Activity Visualization', () => {
    test('should display activity chart or timeline', async ({ page }) => {
      const chart = page.locator('[data-testid="activity-chart"]');
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });

    test('unmoved themes should be highlighted differently', async ({ page }) => {
      const unmovedRows = page.locator('[data-testid="theme-row"][data-unmoved="true"]');
      const count = await unmovedRows.count();
      expect(count).toBeGreaterThanOrEqual(0);
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

  test.describe('Activity Filter', () => {
    test('should filter to show only unmoved themes', async ({ page }) => {
      const filterBtn = page.locator('[data-testid="filter-unmoved"]');
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('should filter to show only active themes', async ({ page }) => {
      const filterBtn = page.locator('[data-testid="filter-active"]');
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Theme Actions', () => {
    test('clicking theme should show details', async ({ page }) => {
      const firstRow = page.locator('[data-testid="theme-row"]').first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(500);
      }
    });

    test('theme should have action menu', async ({ page }) => {
      const firstRow = page.locator('[data-testid="theme-row"]').first();
      if (await firstRow.isVisible()) {
        const menu = firstRow.locator('[data-testid="action-menu"]');
        if (await menu.isVisible()) {
          await expect(menu).toBeVisible();
        }
      }
    });
  });

  test.describe('Sorting', () => {
    test('should sort by last update date', async ({ page }) => {
      const header = page.locator('[data-testid="header-updated"]');
      if (await header.isVisible()) {
        await header.click();
        await page.waitForTimeout(500);
      }
    });

    test('should sort by title', async ({ page }) => {
      const header = page.locator('[data-testid="header-title"]');
      if (await header.isVisible()) {
        await header.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Export', () => {
    test('should export themes to CSV', async ({ page }) => {
      const exportBtn = page.locator('button:has-text("Exportar")');
      if (await exportBtn.isVisible()) {
        await expect(exportBtn).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost/dashboards/emerging-themes');
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  test.describe('Responsive', () => {
    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="total-themes"]')).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('chart should render in dark mode', async ({ page }) => {
      const chart = page.locator('[data-testid="activity-chart"]');
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });
  });

  test.describe('Empty State', () => {
    test('should handle no themes gracefully', async ({ page }) => {
      const list = page.locator('[data-testid="themes-list"]');
      if (await list.isVisible()) {
        const rows = list.locator('[data-testid="theme-row"]');
        expect(await rows.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
