/**
 * Tema: header (next-themes, etiquetas en inglés) vs perfil (ThemeSettingsTab en español).
 */
import { expect, test } from "../fixtures";

test.describe("Dark mode — header y perfil", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 20_000 });
  });

  test("muestra el botón de tema en el header", async ({ authedPage: page }) => {
    await expect(page.getByRole("button", { name: /toggle theme/i })).toBeVisible();
  });

  test("abre el menú de tema y lista Light / Dark / System", async ({ authedPage: page }) => {
    await page.getByRole("button", { name: /toggle theme/i }).click();
    await expect(page.getByRole("menuitem", { name: /^light$/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /^dark$/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /^system$/i })).toBeVisible();
  });

  test("aplica dark al elegir Dark en el header", async ({ authedPage: page }) => {
    await page.getByRole("button", { name: /toggle theme/i }).click();
    await page.getByRole("menuitem", { name: /^dark$/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 10_000 });
  });

  test("restaura light al elegir Light", async ({ authedPage: page }) => {
    await page.getByRole("button", { name: /toggle theme/i }).click();
    await page.getByRole("menuitem", { name: /^dark$/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: /toggle theme/i }).click();
    await page.getByRole("menuitem", { name: /^light$/i }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("perfil — pestaña Theme muestra Claro / Oscuro / Sistema", async ({ authedPage: page }) => {
    await page.goto("/profile");
    await page.getByRole("tab", { name: /^theme$/i }).click();
    await expect(page.getByText("Claro")).toBeVisible();
    await expect(page.getByText("Oscuro")).toBeVisible();
    await expect(page.getByText("Sistema")).toBeVisible();
  });

  test("perfil — elegir tema dispara toast de éxito", async ({ authedPage: page }) => {
    await page.goto("/profile");
    await page.getByRole("tab", { name: /^theme$/i }).click();
    await page.locator('[class*="cursor-pointer"]').filter({ hasText: /^Oscuro$/ }).first().click();
    await expect(page.getByText("Tema actualizado")).toBeVisible({ timeout: 15_000 });
  });

  test("dos pestañas con la misma sesión cargan la app", async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const username = process.env.E2E_USERNAME ?? "admin";
    const user = username.includes("@") ? "admin" : username;
    const password = process.env.E2E_PASSWORD ?? "Changeme123!";

    for (const p of [page1, page2]) {
      await p.goto("/login");
      await p.locator("#username").fill(user);
      await p.locator("#password").fill(password);
      await p.getByRole("button", { name: /^sign in$/i }).click();
      await p.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
      await p.goto("/");
      await expect(p.getByRole("main")).toBeVisible({ timeout: 20_000 });
    }
    await context.close();
  });
});
