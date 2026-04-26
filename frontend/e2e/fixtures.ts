/**
 * Extended Playwright Test Fixtures
 * Provides test data setup, authentication, and cleanup
 */

import { test as base, expect, type Page } from "@playwright/test";
import { TestDataAPI } from "./helpers/api-helpers";

interface TestFixtures {
  /** Page after cookie login (E2E_USERNAME / E2E_PASSWORD); navigated to /tasks. */
  authedPage: Page;
  testData: {
    api: TestDataAPI;
    organizacionId: string;
    vulnerabilityIds: string[];
    userIds: {
      superAdmin: string;
      chiefAppsec: string;
      analista1: string;
      analista2: string;
      auditor: string;
      readonly: string;
    };
  };
  authHeaders: Record<string, string>;
}

export const test = base.extend<TestFixtures>({
  authedPage: async ({ page }, use) => {
    const rawUser = process.env.E2E_USERNAME ?? "admin";
    // Seed admin username is `admin`; CI historically passed admin email — accept both.
    const username = rawUser.includes("@") ? "admin" : rawUser;
    const password = process.env.E2E_PASSWORD ?? "Changeme123!";

    await page.goto("/login");
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });

    await page.goto("/tasks");
    await page.waitForURL(/\/tasks/, { timeout: 15_000 });

    await use(page);
  },

  testData: async ({ request }, use) => {
    const baseURL = process.env.TEST_BASE_URL || "http://localhost:8000";
    const api = new TestDataAPI(request, baseURL);

    // SETUP: Seed test data
    let organizacionId = "";
    let vulnerabilityIds: string[] = [];
    let userIds: TestFixtures["testData"]["userIds"] = {
      superAdmin: "",
      chiefAppsec: "",
      analista1: "",
      analista2: "",
      auditor: "",
      readonly: "",
    };

    try {
      console.log("[TEST] Seeding test data...");

      // Seed test data
      const seedResult = await api.seedTestData();
      organizacionId = seedResult.organizacion_id;
      console.log(`[TEST] Created organization: ${organizacionId}`);
      console.log(`[TEST] Created ${seedResult.vulnerabilities_created} vulnerabilities`);

      // Fetch vulnerabilities to get IDs
      try {
        const vulns = await api.listVulnerabilidades();
        vulnerabilityIds = (vulns as Array<Record<string, string>>).slice(0, 20).map((v) => v.id);
      } catch (error) {
        console.warn("[TEST] Could not fetch vulnerability IDs:", error);
      }

      // Provide to test
      await use({
        api,
        organizacionId,
        vulnerabilityIds,
        userIds,
      });

      // TEARDOWN: Reset test data after test completes
      console.log("[TEST] Cleaning up test data...");
      await api.resetTestData();
    } catch (error) {
      console.error("[TEST] Error in test data fixture:", error);

      // Still try to cleanup
      try {
        await api.resetTestData();
      } catch (cleanupError) {
        console.error("[TEST] Error during cleanup:", cleanupError);
      }

      throw error;
    }
  },

  authHeaders: async ({ request }, use) => {
    const baseURL = process.env.TEST_BASE_URL || "http://localhost:8000";

    // Default test auth headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    await use(headers);
  },
});

export { expect };

/**
 * Login helper function for tests
 */
export async function login(
  page: any,
  username: string,
  password: string,
  baseURL: string = "http://localhost:3000"
) {
  await page.goto(`${baseURL}/login`);
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForURL(
    (url: URL) => url.pathname !== "/login",
    { timeout: 5000 }
  );
}

/**
 * Login as specific role
 */
export async function loginAsRole(
  page: any,
  role: "super_admin" | "chief_appsec" | "analyst" | "auditor" | "readonly",
  baseURL: string = "http://localhost:3000"
) {
  const credentials = {
    super_admin: { username: "admin", password: "admin123" },
    chief_appsec: { username: "chief", password: "chief123" },
    analyst: { username: "analyst", password: "analyst123" },
    auditor: { username: "auditor", password: "auditor123" },
    readonly: { username: "readonly", password: "readonly123" },
  };

  const creds = credentials[role];
  await login(page, creds.username, creds.password, baseURL);
}

/**
 * Logout helper
 */
export async function logout(page: any) {
  const logoutButton = await page.$('button[data-testid="logout-button"]');
  if (logoutButton) {
    await logoutButton.click();
    await page.waitForURL("**/login");
  }
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(page: any, urlPattern: string | RegExp) {
  return page.waitForResponse((response: any) => {
    if (typeof urlPattern === "string") {
      return response.url().includes(urlPattern);
    }
    return urlPattern.test(response.url());
  });
}
