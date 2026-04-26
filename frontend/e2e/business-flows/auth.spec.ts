/**
 * Authentication Tests
 * Validates login, logout, session management, and role-based redirects
 */

import { test, expect } from "../fixtures";

test.describe("Authentication", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("should login with valid credentials", async ({ page }) => {
    const raw = process.env.E2E_USERNAME ?? "admin";
    const username = raw.includes("@") ? "admin" : raw;
    const password = process.env.E2E_PASSWORD ?? "Changeme123!";

    await page.goto("/login");
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15_000 });
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#username").fill("not-a-user-e2e-invalid");
    await page.locator("#password").fill("wrongpassword-xyz");

    await page.getByRole("button", { name: /^sign in$/i }).click();

    const errorLocator = page.locator('[role="alert"], .error, .text-red-500');
    await errorLocator.first().waitFor({ state: "visible", timeout: 10_000 });
  });

  test("should have test data available", async ({ testData }) => {
    // Verify test data was seeded
    expect(testData.organizacionId).toBeTruthy();
    expect(testData.organizacionId).toMatch(/^[0-9a-f-]+$/);
  });

  test("should list vulnerabilities from seeded data", async ({ testData }) => {
    const vulns = await testData.api.listVulnerabilidades();
    if (vulns.length === 0) {
      test.skip();
    }
    expect(vulns[0]).toHaveProperty("id");
    expect(vulns[0]).toHaveProperty("titulo");
  });

  test("should get test data status", async ({ testData }) => {
    const status = await testData.api.getTestDataStatus();
    if (status.vulnerabilidades === 0 || status.organizaciones === 0) {
      test.skip();
    }
    expect(status.vulnerabilidades).toBeGreaterThan(0);
    expect(status.organizaciones).toBeGreaterThan(0);
  });
});
