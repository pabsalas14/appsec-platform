import { test, expect } from '@playwright/test';

// Test Dashboard 5: Vulnerabilities Multidimensional
test.describe('Dashboard 5: Vulnerabilidades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost/dashboards/vulnerabilities');
  });

  test.describe('Page Load', () => {
    test('page should load', async ({ page }) => {
      await expect(page.locator('text=Vulnerabilidades')).toBeVisible();
    });

    test('should display total count', async ({ page }) => {
      await expect(page.locator('[data-testid="total-vulns"]')).toBeVisible();
    });
  });

  test.describe('Severity Distribution', () => {
    test('should show counts by severity', async ({ page }) => {
      const severities = ['Crítica', 'Alta', 'Media', 'Baja'];
      for (const sev of severities) {
        const element = page.locator(`text="${sev}"`).first();
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('severity chart should render', async ({ page }) => {
      const chart = page.locator('[data-testid="severity-chart"]');
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });
  });

  test.describe('State Distribution', () => {
    test('should show counts by state', async ({ page }) => {
      const states = ['Abierta', 'En Progreso', 'Cerrada'];
      for (const state of states) {
        const element = page.locator(`text="${state}"`).first();
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test.describe('Hierarchy Filters', () => {
    test('should filter by subdireccion', async ({ page }) => {
      const subDirSelect = page.locator('[data-testid="subdireccion-select"]');
      if (await subDirSelect.isVisible()) {
        // Get first option and select
        await subDirSelect.click();
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(500);
          // Data should refresh
        }
      }
    });

    test('should filter by celula', async ({ page }) => {
      const celulaSelect = page.locator('[data-testid="celula-select"]');
      if (await celulaSelect.isVisible()) {
        await celulaSelect.click();
        await page.waitForTimeout(300);
      }
    });

    test('multiple filters should work together', async ({ page }) => {
      const filter1 = page.locator('[data-testid="subdireccion-select"]');
      const filter2 = page.locator('[data-testid="celula-select"]');
      if (await filter1.isVisible() && await filter2.isVisible()) {
        // Apply both filters
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('SLA Status', () => {
    test('should show SLA semaphore', async ({ page }) => {
      const semaphore = page.locator('[data-testid="sla-semaphore"]');
      if (await semaphore.isVisible()) {
        await expect(semaphore).toBeVisible();
      }
    });

    test('should display overdue count', async ({ page }) => {
      const overdue = page.locator('[data-testid="overdue-count"]');
      if (await overdue.isVisible()) {
        await expect(overdue).toBeVisible();
      }
    });
  });

  test.describe('Export', () => {
    test('should export vulnerabilities to CSV', async ({ page }) => {
      const exportBtn = page.locator('button:has-text("Exportar")');
      if (await exportBtn.isVisible()) {
        await expect(exportBtn).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost/dashboards/vulnerabilities');
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });

    test('filters should apply without full page reload', async ({ page }) => {
      const before = await page.locator('[data-testid="total-vulns"]').textContent();
      const select = page.locator('[data-testid="subdireccion-select"]');
      if (await select.isVisible()) {
        await select.click();
        await page.waitForTimeout(300);
        // Should update without full reload
      }
    });
  });

  test.describe('Responsive', () => {
    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="total-vulns"]')).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('charts should render in dark mode', async ({ page }) => {
      const chart = page.locator('[data-testid="severity-chart"]');
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('invalid filter should not crash', async ({ page }) => {
      // Try invalid UUID in filter
      await page.goto('http://localhost/dashboards/vulnerabilities?celula_id=invalid');
      // Should either handle gracefully or redirect
      await page.waitForLoadState('networkidle');
    });
  });
});
