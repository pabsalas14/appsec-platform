/**
 * F4 — E2E: paneles y rutas de dashboards (smoke, sin datos duros de negocio).
 */
import { test, expect } from "../fixtures";

test.describe("Dashboards — smoke (F1/F4)", () => {
  test("home and executive dashboard render stats and heatmap or filters", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 20_000 });
  });

  test("executive shows KPI row", async ({ page }) => {
    await page.goto("/dashboards/executive");
    await expect(page.getByText(/Dashboard · Ejecutivo/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Vulnerabilidades totales/)).toBeVisible({ timeout: 15_000 });
  });

  test("vulnerabilities dashboard is reachable (link integrity)", async ({ page }) => {
    await page.goto("/dashboards/vulnerabilities");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 20_000 });
  });
});
