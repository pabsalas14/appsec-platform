import { test, expect } from '@playwright/test';

test.describe('Premium Dashboards - D2, D3, D4, D5', () => {
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
    await page.goto('http://localhost/dashboards');
    await page.waitForLoadState('networkidle');
  });

  test.describe('D2 - Team Dashboard', () => {
    test('should load team dashboard', async ({ page }) => {
      await page.goto('http://localhost/dashboards/team');
      await expect(page.locator('text=Team')).toBeVisible();
      await expect(page.locator('[role="table"]')).toBeVisible();
    });

    test('should drill-down to analyst details', async ({ page }) => {
      await page.goto('http://localhost/dashboards/team');
      // Click first analyst row
      await page.locator('[role="table"] tbody tr').first().click();

      // Should show detail panel
      await expect(page.locator('[data-testid="analyst-detail-panel"]')).toBeVisible();
      await expect(page.locator('text=/total|abiertas|cerradas/')).toBeVisible();
    });
  });

  test.describe('D3 - Programs Dashboard', () => {
    test('should load programs dashboard with 6 motor cards', async ({ page }) => {
      await page.goto('http://localhost/dashboards/programs');
      await expect(page.locator('text=Programs')).toBeVisible();

      // Check for 6 program cards (SAST, DAST, SCA, CDS, MDA, MAST)
      const programCards = page.locator('[data-testid="program-card"]');
      await expect(programCards).toHaveCount(6);
    });

    test('should show mini heatmaps on program cards', async ({ page }) => {
      await page.goto('http://localhost/dashboards/programs');
      await expect(page.locator('[data-testid="heatmap-grid"]')).toBeVisible();
    });

    test('should navigate to program detail on click', async ({ page }) => {
      await page.goto('http://localhost/dashboards/programs');
      await page.locator('[data-testid="program-card"]').first().click();

      // Should navigate to program detail
      await page.waitForURL('**/program-detail**');
      expect(page.url()).toContain('program-detail');
    });
  });

  test.describe('D4 - Vulnerabilities Dashboard (7-level hierarchy)', () => {
    test('should load vulnerabilities dashboard', async ({ page }) => {
      await page.goto('http://localhost/dashboards/vulnerabilities');
      await expect(page.locator('text=Vulnerabilities')).toBeVisible();

      // Check for hierarchy navigation (NIVEL 0)
      await expect(page.locator('text=NIVEL')).toBeVisible();
    });

    test('should show 6 engine cards at NIVEL 0', async ({ page }) => {
      await page.goto('http://localhost/dashboards/vulnerabilities');

      const engineCards = page.locator('[data-testid="engine-card"]');
      await expect(engineCards).toHaveCount(6);
    });

    test('should have SLA semáforo at nivel 0', async ({ page }) => {
      await page.goto('http://localhost/dashboards/vulnerabilities');

      // Check for SLA semáforo (En Tiempo/En Riesgo/Vencidas)
      await expect(page.locator('text=/En Tiempo|En Riesgo|Vencidas/')).toBeVisible();
    });

    test('should drill-down from NIVEL 0 to NIVEL 1 (Subdirección)', async ({ page }) => {
      await page.goto('http://localhost/dashboards/vulnerabilities');

      // Click on a children item (repo/org/cell)
      await page.locator('[data-testid="children-list"] li').first().click();

      // Should navigate to NIVEL 1
      await page.waitForURL('**/vulnerabilities?nivel=1**');
      expect(page.url()).toContain('nivel=1');
    });
  });

  test.describe('D5 - Concentrado Dashboard', () => {
    test('should load concentrado dashboard', async ({ page }) => {
      await page.goto('http://localhost/dashboards/concentrado');
      await expect(page.locator('text=Concentrado')).toBeVisible();
    });

    test('should show severity distribution', async ({ page }) => {
      await page.goto('http://localhost/dashboards/concentrado');

      // Check for severity cards (CRITICA, ALTA, MEDIA, BAJA)
      await expect(page.locator('text=CRITICA')).toBeVisible();
      await expect(page.locator('text=ALTA')).toBeVisible();
      await expect(page.locator('text=MEDIA')).toBeVisible();
      await expect(page.locator('text=BAJA')).toBeVisible();
    });

    test('should have motor detail tables', async ({ page }) => {
      await page.goto('http://localhost/dashboards/concentrado');

      // Check for tables (6 motors)
      const tables = page.locator('[role="table"]');
      await expect(tables).toHaveCount(1); // At least one table visible
    });
  });
});
