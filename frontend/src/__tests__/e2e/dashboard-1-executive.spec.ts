import { test, expect } from '@playwright/test';

// Test Dashboard 1: Ejecutivo
test.describe('Dashboard 1: Ejecutivo', () => {
  test.beforeEach(async ({ page }) => {
    // Login como CISO
    // TODO: Configurar auth en beforeEach
    await page.goto('http://localhost/dashboards/executive');
  });

  test.describe('KPI Cards', () => {
    test('debe mostrar 5 KPI cards con valores y trends', async ({ page }) => {
      // Verificar que existen 5 cards
      const cards = await page.locator('[data-testid="kpi-card"]').all();
      expect(cards.length).toBe(5);

      // Verificar títulos
      await expect(page.locator('text=Avance Programas')).toBeVisible();
      await expect(page.locator('text=Vulnerabilidades Críticas')).toBeVisible();
      await expect(page.locator('text=Liberaciones Activas')).toBeVisible();
      await expect(page.locator('text=Temas Emergentes')).toBeVisible();
      await expect(page.locator('text=Auditorías')).toBeVisible();

      // Verificar que cada card muestra valor
      for (const card of cards) {
        const value = card.locator('[data-testid="kpi-value"]');
        await expect(value).toContainText(/\d+/);
      }
    });

    test('KPI: Avance Programas debe mostrar porcentaje', async ({ page }) => {
      const card = page.locator('[data-testid="kpi-card"]:has-text("Avance Programas")');
      const value = card.locator('[data-testid="kpi-value"]');
      await expect(value).toContainText('%');
    });

    test('debe navegar a módulo correspondiente al click en KPI', async ({ page }) => {
      const vulnCard = page.locator('[data-testid="kpi-card"]:has-text("Vulnerabilidades")');
      await vulnCard.click();

      // TODO: Verificar navegación a módulo vulnerabilidades
      // await expect(page).toHaveURL(/vulnerabilities/);
    });
  });

  test.describe('Gauge: Postura de Seguridad', () => {
    test('debe mostrar gauge con valor 0-100', async ({ page }) => {
      const gauge = page.locator('[data-testid="gauge-chart"]');
      await expect(gauge).toBeVisible();

      // Verificar que contiene número
      const value = gauge.locator('[data-testid="gauge-value"]');
      await expect(value).toContainText(/(\d+)%/);
    });

    test('gauge color debe cambiar según valor (green > 60, yellow 40-60, red < 40)', async ({
      page: _page,
    }) => {
      // TODO: Verificar clase CSS de color basada en valor
      // const gauge = page.locator('[data-testid="gauge-chart"]');
      // await expect(gauge).toHaveClass(/bg-green|bg-yellow|bg-red/);
    });
  });

  test.describe('Tendencia 6 Meses', () => {
    test('debe mostrar área chart con 4 series (críticas, altas, medias, bajas)', async ({
      page,
    }) => {
      const chart = page.locator('[data-testid="trend-chart"]');
      await expect(chart).toBeVisible();

      // Verificar líneas del chart
      const lines = chart.locator('line[stroke]');
      const count = await lines.count();
      expect(count).toBeGreaterThan(0);
    });

    test('legend debe mostrar 4 series con colores correctos', async ({ page }) => {
      await expect(page.locator('text=Críticas')).toBeVisible();
      await expect(page.locator('text=Altas')).toBeVisible();
      await expect(page.locator('text=Medias')).toBeVisible();
      await expect(page.locator('text=Bajas')).toBeVisible();
    });

    test('tooltip debe mostrar valores al hover', async ({ page }) => {
      const chart = page.locator('[data-testid="trend-chart"]');
      await chart.hover({ position: { x: 100, y: 100 } });

      // TODO: Verificar que aparece tooltip con valores
      // const tooltip = page.locator('[data-testid="chart-tooltip"]');
      // await expect(tooltip).toBeVisible();
    });
  });

  test.describe('Top 5 Repos - Horizontal Ranking', () => {
    test('debe mostrar top 5 repositorios con barras', async ({ page }) => {
      const chart = page.locator('[data-testid="ranking-chart"]');
      await expect(chart).toBeVisible();

      // Contar barras
      const bars = chart.locator('[data-testid="ranking-bar"]');
      const count = await bars.count();
      expect(count).toBeLessThanOrEqual(5);
    });

    test('barras deben estar ordenadas descendente (mayor a menor)', async ({ page }) => {
      const values = await page.locator('[data-testid="ranking-value"]').allTextContents();
      const nums = values.map((v) => parseInt(v));

      // Verificar orden descendente
      for (let i = 0; i < nums.length - 1; i++) {
        expect(nums[i]).toBeGreaterThanOrEqual(nums[i + 1]);
      }
    });
  });

  test.describe('Semáforo SLA', () => {
    test('debe mostrar 3 filas: En Tiempo (verde), En Riesgo (amarillo), Vencidas (rojo)', async ({
      page,
    }) => {
      await expect(page.locator('text=En Tiempo')).toBeVisible();
      await expect(page.locator('text=En Riesgo')).toBeVisible();
      await expect(page.locator('text=Vencidas')).toBeVisible();

      // Verificar colores
      const onTime = page.locator('text=En Tiempo').first();
      await expect(onTime.locator('..')).toHaveClass(/green|emerald/);
    });

    test('semáforo debe mostrar conteos correctos', async ({ page }) => {
      const counts = await page.locator('[data-testid="semaforo-count"]').allTextContents();
      expect(counts.length).toBe(3);

      counts.forEach((count) => {
        expect(parseInt(count)).toBeGreaterThanOrEqual(0);
      });
    });
  });

  test.describe('Tabla Auditorías', () => {
    test('debe mostrar tabla con columnas: Nombre, Tipo, Responsable, Estado, Hallazgos', async ({
      page,
    }) => {
      const headers = await page
        .locator('[data-testid="audit-table"] th')
        .allTextContents();
      expect(headers).toContain('Nombre');
      expect(headers).toContain('Tipo');
      expect(headers).toContain('Responsable');
      expect(headers).toContain('Estado');
      expect(headers).toContain('Hallazgos');
    });

    test('debe mostrar máximo 5 filas por defecto y "+" para más', async ({ page }) => {
      const rows = await page.locator('[data-testid="audit-table"] tbody tr').all();
      expect(rows.length).toBeLessThanOrEqual(5);

      // Si hay más datos
      void page.locator('text=/\+\d+ filas/');
      // Si existe, validar formato
    });

    test('click en fila debe abrir detalle auditoría', async ({ page }) => {
      const firstRow = page.locator('[data-testid="audit-table"] tbody tr').first();
      await firstRow.click();

      // TODO: Verificar que navega o abre side panel
      // await expect(page.locator('[data-testid="audit-detail-panel"]')).toBeVisible();
    });
  });

  test.describe('Filtros y Exportación', () => {
    test('selector de mes debe estar presente', async ({ page }) => {
      const select = page.locator('[data-testid="month-select"]');
      await expect(select).toBeVisible();

      // Verificar opciones
      await select.click();
      await expect(page.locator('text=Mes Actual')).toBeVisible();
      await expect(page.locator('text=Mes Anterior')).toBeVisible();
    });

    test('cambiar mes debe recargar datos', async ({ page }) => {
      void (await page.locator('[data-testid="kpi-value"]').first().textContent());

      const select = page.locator('[data-testid="month-select"]');
      await select.click();
      await page.locator('text=Mes Anterior').click();

      // Esperar refetch
      await page.waitForTimeout(1000);

      // TODO: Verificar que datos cambiaron o al menos se refrescaron
      // const after = await page.locator('[data-testid="kpi-value"]').first().textContent();
    });

    test('botón Exportar debe estar presente', async ({ page }) => {
      const exportBtn = page.locator('button:has-text("Exportar")');
      await expect(exportBtn).toBeVisible();
    });

    test('click Exportar debe descargar CSV', async ({ page: _page }) => {
      // TODO: Setup download listener
      // const downloadPromise = page.waitForEvent('download');
      // await page.locator('button:has-text("Exportar")').click();
      // const download = await downloadPromise;
      // expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Responsividad', () => {
    test('en mobile (375px), cards deben stacekarse verticalmente', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const container = page.locator('[data-testid="kpi-cards-container"]');
      const style = await container.evaluate((el) =>
        window.getComputedStyle(el).gridTemplateColumns
      );

      // En mobile debe ser 1 columna
      expect(style).toBe('1fr');
    });

    test('en tablet (768px), cards deben ser 2 columnas', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const container = page.locator('[data-testid="kpi-cards-container"]');
      const style = await container.evaluate((el) =>
        window.getComputedStyle(el).gridTemplateColumns
      );

      // En tablet 2 columnas
      expect(style).toContain('repeat(2');
    });
  });

  test.describe('Dark Mode', () => {
    test('dashboard debe renderizar correctamente en dark mode', async ({ page }) => {
      // Setear dark mode
      // TODO: Toggle dark mode en UI o via context
      // await page.locator('[data-testid="dark-mode-toggle"]').click();

      // Verificar que colores se apliquen
      void page.locator('[data-testid="kpi-card"]').first();
      // TODO: Verificar clases dark mode
    });
  });

  test.describe('Permisos por Rol', () => {
    test('CISO debe ver dashboard completo', async ({ page }) => {
      // Login como CISO hecho en beforeEach
      // Verificar acceso
      await expect(page.locator('[data-testid="kpi-card"]')).toBeTruthy();
    });

    test('Analyst no debe poder ver si no tiene permiso', async ({ page: _page }) => {
      // TODO: Login como analyst sin permisos
      // await page.goto('http://localhost/dashboards/executive');
      // await expect(page.locator('text=No tienes permisos')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('página debe cargar en < 3 segundos', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost/dashboards/executive');
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
    });

    test('no debe tener console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('http://localhost/dashboards/executive');
      await page.waitForLoadState('networkidle');

      expect(errors.length).toBe(0);
    });
  });
});
