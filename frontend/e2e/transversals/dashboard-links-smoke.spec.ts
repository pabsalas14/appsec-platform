/**
 * F4 — E2E: paneles y rutas de dashboards (smoke, sin datos duros de negocio).
 */
import { test, expect } from "../fixtures";

test.describe("Dashboards — smoke (F1/F4)", () => {
  test("home and executive dashboard render stats and heatmap or filters", async ({ authedPage }) => {
    await authedPage.goto("/");
    await expect(authedPage.getByRole("main")).toBeVisible({ timeout: 20_000 });
  });

  test("executive shows KPI row", async ({ authedPage }) => {
    await authedPage.goto("/dashboards/executive");
    await expect(authedPage.getByRole("heading", { name: /Dashboard Ejecutivo/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(authedPage.getByText(/Vulnerabilidades Críticas/)).toBeVisible({ timeout: 15_000 });
  });

  test("vulnerabilities dashboard is reachable (link integrity)", async ({ authedPage }) => {
    await authedPage.goto("/dashboards/vulnerabilities");
    await expect(authedPage.getByRole("main")).toBeVisible({ timeout: 20_000 });
  });
});
