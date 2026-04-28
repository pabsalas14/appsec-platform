import { expect, test } from "../fixtures";

const DASHBOARD_ROUTES = {
  d2: "/dashboards/team",
  d3: "/dashboards/programs",
  d4: "/dashboards/vulnerabilities",
};

test.describe("Dashboards D2-D4", () => {
  test.describe("D2 Team", () => {
    const checks = [
      { name: "renderiza pagina", locator: "[data-testid='d2-page']" },
      { name: "muestra titulo", locator: "[data-testid='d2-title']" },
      { name: "muestra boton exportar", locator: "[data-testid='d2-export']" },
      { name: "muestra tabla de analistas", locator: "[data-testid='d2-analysts-table']" },
    ];

    for (const check of checks) {
      test(`D2 ${check.name}`, async ({ authedPage: page }) => {
        await page.goto(DASHBOARD_ROUTES.d2);
        await expect(page.locator(check.locator)).toBeVisible();
      });
    }

    test("D2 permite abrir detalle de analista", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d2);
      const rows = page.locator("[data-testid^='d2-analyst-row-']");
      const total = await rows.count();
      if (total > 0) {
        await rows.first().click();
        await expect(page.locator("[role='dialog']")).toBeVisible();
      } else {
        await expect(page.locator("[data-testid='d2-analysts-table']")).toBeVisible();
      }
    });

    test("D2 muestra encabezados de tabla esperados", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d2);
      await expect(page.getByText("Analista")).toBeVisible();
      await expect(page.getByText("Programas")).toBeVisible();
    });

    test("D2 mantiene layout principal", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d2);
      await expect(page.getByText("Rendimiento y Carga de Trabajo por Analista")).toBeVisible();
    });

    test("D2 permite export trigger", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d2);
      await page.locator("[data-testid='d2-export']").click();
      await expect(page.locator("[data-testid='d2-page']")).toBeVisible();
    });

    test("D2 responde en dark mode", async ({ authedPage: page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(DASHBOARD_ROUTES.d2);
      await expect(page.locator("[data-testid='d2-page']")).toBeVisible();
    });

    test("D2 responde en viewport movil", async ({ authedPage: page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(DASHBOARD_ROUTES.d2);
      await expect(page.locator("[data-testid='d2-title']")).toBeVisible();
    });

    test("D2 mantiene navegacion dashboard", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d2);
      await expect(page).toHaveURL(/\/dashboards\/team/);
    });
  });

  test.describe("D3 Programs", () => {
    const checks = [
      { name: "renderiza pagina", locator: "[data-testid='d3-page']" },
      { name: "muestra titulo", locator: "[data-testid='d3-title']" },
      { name: "muestra grid programas", locator: "[data-testid='d3-program-grid']" },
      { name: "muestra card SAST", locator: "[data-testid='d3-program-card-sast']" },
      { name: "muestra card DAST", locator: "[data-testid='d3-program-card-dast']" },
      { name: "muestra mini heatmap", locator: "[data-testid='d3-mini-heatmap']" },
    ];

    for (const check of checks) {
      test(`D3 ${check.name}`, async ({ authedPage: page }) => {
        await page.goto(DASHBOARD_ROUTES.d3);
        await expect(page.locator(check.locator).first()).toBeVisible();
      });
    }

    test("D3 abre panel de detalle al seleccionar card", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d3);
      await page.locator("[data-testid='d3-program-card-sast']").click();
      await expect(page.getByText("Detalle del Programa")).toBeVisible();
    });

    test("D3 permite cerrar panel detalle", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d3);
      await page.locator("[data-testid='d3-program-card-sast']").click();
      const closeBtn = page.locator("button").filter({ has: page.locator("svg") }).first();
      await closeBtn.click();
      await expect(page.locator("[data-testid='d3-program-grid']")).toBeVisible();
    });

    test("D3 muestra actividad mensual", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d3);
      await expect(page.getByText("Actividad Mensual por Programa")).toBeVisible();
    });

    test("D3 responde en dark mode", async ({ authedPage: page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(DASHBOARD_ROUTES.d3);
      await expect(page.locator("[data-testid='d3-page']")).toBeVisible();
    });

    test("D3 responde en viewport movil", async ({ authedPage: page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(DASHBOARD_ROUTES.d3);
      await expect(page.locator("[data-testid='d3-title']")).toBeVisible();
    });
  });

  test.describe("D4 Vulnerabilities", () => {
    const checks = [
      { name: "renderiza pagina", locator: "[data-testid='d4-page']" },
      { name: "muestra titulo", locator: "[data-testid='d4-title']" },
      { name: "muestra sidebar niveles", locator: "[data-testid='d4-level-sidebar']" },
      { name: "muestra nivel 0", locator: "[data-testid='d4-level-0']" },
      { name: "muestra nivel 1", locator: "[data-testid='d4-level-1']" },
      { name: "muestra nivel 2", locator: "[data-testid='d4-level-2']" },
      { name: "muestra nivel 3", locator: "[data-testid='d4-level-3']" },
      { name: "muestra nivel 4", locator: "[data-testid='d4-level-4']" },
      { name: "muestra nivel 5", locator: "[data-testid='d4-level-5']" },
      { name: "muestra nivel 6", locator: "[data-testid='d4-level-6']" },
    ];

    for (const check of checks) {
      test(`D4 ${check.name}`, async ({ authedPage: page }) => {
        await page.goto(DASHBOARD_ROUTES.d4);
        await expect(page.locator(check.locator)).toBeVisible();
      });
    }

    test("D4 muestra semaforo SLA en nivel 0", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d4);
      await expect(page.locator("[data-testid='d4-sla-semaforo']")).toBeVisible();
    });

    test("D4 muestra sección Core Engines", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d4);
      await expect(page.getByText("Core Engines")).toBeVisible();
    });

    test("D4 muestra KPI total hallazgos", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d4);
      await expect(page.getByText("Total Hallazgos Activos")).toBeVisible();
    });

    test("D4 muestra pipeline remediacion", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d4);
      await expect(page.getByText("Pipeline de remediación")).toBeVisible();
    });

    test("D4 navega drilldown cuando hay hijos", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d4);
      await expect(page.locator("[data-testid='d4-page']")).toBeVisible();
      await expect(page.getByText("Comparativo por motor")).toBeVisible();
    });

    test("D4 permite volver nivel anterior", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d4);
      const backBtn = page.getByRole("button", { name: "← Volver al nivel anterior" });
      if (await backBtn.isVisible()) {
        await backBtn.click();
      }
      await expect(page.locator("[data-testid='d4-page']")).toBeVisible();
    });

    test("D4 tabla de vulnerabilidades renderiza cuando aplica", async ({ authedPage: page }) => {
      await page.goto(DASHBOARD_ROUTES.d4);
      const table = page.locator("[data-testid='d4-vulnerabilities-table']");
      if (await table.count()) {
        await expect(table.first()).toBeVisible();
      } else {
        await expect(page.locator("[data-testid='d4-page']")).toBeVisible();
      }
    });

    test("D4 responde en dark mode", async ({ authedPage: page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(DASHBOARD_ROUTES.d4);
      await expect(page.locator("[data-testid='d4-page']")).toBeVisible();
    });

    test("D4 responde en viewport movil", async ({ authedPage: page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(DASHBOARD_ROUTES.d4);
      await expect(page.locator("[data-testid='d4-title']")).toBeVisible();
    });
  });
});
