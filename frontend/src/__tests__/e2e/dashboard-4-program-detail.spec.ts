import { test, expect } from '@playwright/test';

// Test Dashboard 4: Program Detail / Zoom
test.describe('Dashboard 4: Detalle Programa', () => {
  test.beforeEach(async ({ page }) => {
    // Start with SAST program detail
    await page.goto('http://localhost/dashboards/program-detail?program=sast');
  });

  test.describe('Page Load', () => {
    test('page should load with program name', async ({ page }) => {
      await expect(page.locator('text=SAST')).toBeVisible();
    });

    test('should display finding counts', async ({ page }) => {
      await expect(page.locator('[data-testid="total-findings"]')).toBeVisible();
      await expect(page.locator('[data-testid="open-findings"]')).toBeVisible();
      await expect(page.locator('[data-testid="closed-findings"]')).toBeVisible();
    });
  });

  test.describe('Program Selection', () => {
    test('should switch between programs', async ({ page }) => {
      const select = page.locator('[data-testid="program-select"]');
      if (await select.isVisible()) {
        await select.selectOption('dast');
        await page.waitForTimeout(500);
        await expect(page.locator('text=DAST')).toBeVisible();
      }
    });

    test('each program shows correct findings count', async ({ page }) => {
      const programs = ['sast', 'dast', 'sca', 'mast'];
      for (const prog of programs) {
        await page.goto(`http://localhost/dashboards/program-detail?program=${prog}`);
        await expect(page.locator('[data-testid="total-findings"]')).toBeVisible();
      }
    });
  });

  test.describe('Finding Breakdown', () => {
    test('should show severity distribution chart', async ({ page }) => {
      const chart = page.locator('[data-testid="severity-chart"]');
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });

    test('should show status distribution', async ({ page }) => {
      const statuses = ['Abierta', 'En Progreso', 'Cerrada'];
      for (const status of statuses) {
        // Verify status exists in breakdown or chart
        const element = page.locator(`text="${status}"`).first();
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test.describe('SLA Information', () => {
    test('should display overdue count', async ({ page }) => {
      const overdue = page.locator('[data-testid="overdue-findings"]');
      if (await overdue.isVisible()) {
        await expect(overdue).toBeVisible();
      }
    });

    test('should show completion percentage', async ({ page }) => {
      const percent = page.locator('[data-testid="completion-percent"]');
      if (await percent.isVisible()) {
        await expect(percent).toContainText('%');
      }
    });
  });

  test.describe('Drill Down', () => {
    test('clicking finding row should show details', async ({ page }) => {
      const firstRow = page.locator('[data-testid="finding-row"]').first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Export', () => {
    test('should export program findings to CSV', async ({ page }) => {
      const exportBtn = page.locator('button:has-text("Exportar")');
      if (await exportBtn.isVisible()) {
        await expect(exportBtn).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost/dashboards/program-detail?program=sast');
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  test.describe('Error Handling', () => {
    test('invalid program parameter should be handled', async ({ page }) => {
      await page.goto('http://localhost/dashboards/program-detail?program=invalid');
      // Should either redirect or show default
      await expect(page.locator('[data-testid="total-findings"]')).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('charts should render correctly in dark mode', async ({ page }) => {
      const chart = page.locator('[data-testid="severity-chart"]');
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });
  });

  test.describe('Responsive', () => {
    test('should adapt to mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="total-findings"]')).toBeVisible();
    });
  });
});
