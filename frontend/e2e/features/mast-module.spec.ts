import { expect, test } from "../fixtures";

test.describe("MAST — dashboard móvil", () => {
  test("carga encabezado y métricas", async ({ authedPage: page }) => {
    await page.goto("/dashboards/mast");
    await expect(page.getByRole("heading", { name: "MAST" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Mobile Application Security Testing")).toBeVisible();
    await expect(page.getByText("Aplicaciones")).toBeVisible();
  });

  test("grid vacío o detalle en sheet si hay aplicaciones", async ({ authedPage: page }) => {
    await page.goto("/dashboards/mast");
    await expect(page.getByRole("heading", { name: "MAST" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Aplicaciones Móviles|Sin aplicaciones/i)).toBeVisible({ timeout: 30_000 });

    const sinApps = page.getByText("Sin aplicaciones registradas");
    if (await sinApps.isVisible()) {
      return;
    }

    const primeraTarjeta = page
      .locator(".cursor-pointer")
      .filter({ has: page.getByText("Score", { exact: true }) })
      .first();
    await primeraTarjeta.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
  });
});
