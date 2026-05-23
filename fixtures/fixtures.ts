import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ApiClient } from '../utils/api-client';
import { getCredentials } from '../utils/env-config';

// ─── Fixture type declarations ─────────────────────────────────────────────

type PageFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  authenticatedInventoryPage: InventoryPage;
};

type ApiFixtures = {
  apiClient: ApiClient;
};

export type TestFixtures = PageFixtures & ApiFixtures;

// ─── Extended test object ──────────────────────────────────────────────────

/**
 * Custom `test` that exposes:
 *   - loginPage              → LoginPage POM (not yet logged in)
 *   - inventoryPage          → InventoryPage POM (not yet logged in)
 *   - authenticatedInventoryPage → LoginPage + login + InventoryPage in one fixture
 *   - apiClient              → typed ApiClient wrapper
 *
 * Tests are fully isolated — every fixture creates a fresh browser context.
 */
export const test = base.extend<TestFixtures>({
  // Raw page objects — tests that need to test the login flow itself
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  // Pre-authenticated page — for tests that just need to start on the dashboard
  authenticatedInventoryPage: async ({ page }, use) => {
    const { username, password } = getCredentials();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, password);
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.assertOnInventoryPage();
    await use(inventoryPage);
  },

  // API client backed by Playwright's request context
  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request));
  },
});

export { expect } from '@playwright/test';
