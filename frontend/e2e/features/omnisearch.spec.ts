import { expect, test } from "../fixtures";

test.describe("Búsqueda global (modal)", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 20_000 });
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("Ctrl+K abre un campo de búsqueda (palette o comandos)", async ({ authedPage: page }) => {
    await page.keyboard.press("Control+K");
    const busquedaHallazgos = page.getByPlaceholder(/Search vulnerabilities/i);
    const busquedaNavegacion = page.getByPlaceholder(/Search pages/i);
    await expect(busquedaHallazgos.or(busquedaNavegacion)).toBeVisible({ timeout: 10_000 });
  });

  test("Escape cierra el modal visible", async ({ authedPage: page }) => {
    await page.keyboard.press("Control+K");
    const busquedaHallazgos = page.getByPlaceholder(/Search vulnerabilities/i);
    const busquedaNavegacion = page.getByPlaceholder(/Search pages/i);
    await expect(busquedaHallazgos.or(busquedaNavegacion)).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
