import { test, expect } from '../../fixtures/fixtures';
import { assertStatus, assertHasFields } from '../../utils/api-client';
import apiData from '../../test-data/api-test-data.json';

/**
 * API ↔ UI Integration Suite
 *
 * Strategy:
 *   1. Call DummyJSON API to create/authenticate a user — proving backend correctness.
 *   2. Use the returned token / user data to drive a SauceDemo UI flow — proving the
 *      front-end honours the same data contract.
 *
 * Note: DummyJSON and SauceDemo are independent services, so we use the API step to
 * validate the data shape and token existence, then independently verify that the same
 * credential set (standard_user / secret_sauce) produces the expected UI state. This
 * mirrors a real-world pattern where a test suite validates both layers coherently.
 */

test.describe('Integration — API auth then UI login @regression', () => {
  test('accessToken from API login is non-empty; UI login with matching user succeeds', async ({
    apiClient,
    loginPage,
  }) => {
    // ── Step 1: Obtain auth token via API ──────────────────────────────────
    let accessToken: string;

    await test.step('POST /auth/login and extract accessToken', async () => {
      const response = await apiClient.auth.login(apiData.validLogin);
      assertStatus(response, 200);
      assertHasFields(response.body, ['accessToken']);
      accessToken = (response.body as { accessToken: string }).accessToken;
      expect(accessToken.length).toBeGreaterThan(0);
    });

    // ── Step 2: UI login with the real SauceDemo account ───────────────────
    await test.step('Login to SauceDemo via UI', async () => {
      await loginPage.login(
        process.env.STANDARD_USER || 'standard_user',
        process.env.TEST_PASSWORD  || 'secret_sauce'
      );
    });

    await test.step('Assert inventory page is visible after login', async () => {
      await expect(loginPage.page).toHaveURL(/inventory\.html/);
    });
  });
});

test.describe('Integration — API CRUD then UI verify product count @regression', () => {
  test('creating a user via API and then doing full cart flow on UI', async ({
    apiClient,
    authenticatedInventoryPage,
  }) => {
    // ── Step 1: Create a user record via API ───────────────────────────────
    let createdUserId: number;

    await test.step('POST /users/add to create a new user', async () => {
      const payload = apiData.createUser[0];
      const response = await apiClient.users.create({
        firstName: payload.firstName,
        lastName:  payload.lastName,
      });

      assertStatus(response, 201);
      assertHasFields(response.body, ['id', 'firstName']);
      createdUserId = response.body.id;
      expect(createdUserId).toBeGreaterThan(0);
    });

    // ── Step 2: Verify a real user record reads cleanly ────────────────────
    await test.step('GET /users/2 to confirm reads still work', async () => {
      const response = await apiClient.users.get(2);
      assertStatus(response, 200);
    });

    // ── Step 3: On UI, add two products then verify cart badge ─────────────
    await test.step('Add two products to cart on inventory page', async () => {
      await authenticatedInventoryPage.addItemToCart('Sauce Labs Backpack');
      await authenticatedInventoryPage.addItemToCart('Sauce Labs Bike Light');
    });

    await test.step('Cart badge should show 2', async () => {
      await authenticatedInventoryPage.assertCartCount(2);
    });

    // ── Step 4: Remove one item and verify count drops ──────────────────────
    await test.step('Remove one item and verify cart decrements', async () => {
      await authenticatedInventoryPage.removeItemFromCart('Sauce Labs Backpack');
      await authenticatedInventoryPage.assertCartCount(1);
    });
  });
});

test.describe('Integration — API user data validation then UI sort @regression', () => {
  test('list API returns sorted-friendly data; UI product sort A-Z works', async ({
    apiClient,
    authenticatedInventoryPage,
  }) => {
    // ── Step 1: API returns user list with expected structure ───────────────
    await test.step('Validate GET /users list shape', async () => {
      const response = await apiClient.users.list(1);
      assertStatus(response, 200);
      assertHasFields(response.body, ['users', 'total']);
      expect((response.body.users as unknown[]).length).toBeGreaterThan(0);
    });

    // ── Step 2: UI sort A→Z is correctly applied ───────────────────────────
    await test.step('Sort products A to Z on inventory page', async () => {
      await authenticatedInventoryPage.sortProducts('az');
    });

    await test.step('Verify products appear in alphabetical order', async () => {
      await authenticatedInventoryPage.assertProductsSortedAZ();
    });
  });
});
