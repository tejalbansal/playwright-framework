import { test, expect } from '../../fixtures/fixtures';
import productsData from '../../test-data/products.json';
import type { SortOption } from '../../pages/InventoryPage';
import { assertSortedAscending, assertSortedNumericAscending } from '../../utils/custom-assertions';

test.describe('Inventory — page load @smoke', () => {
  test('should display all 6 products after login', async ({ authenticatedInventoryPage }) => {
    const count = await authenticatedInventoryPage.getProductCount();
    expect(count).toBe(6);
  });

  test('should show "Products" heading', async ({ authenticatedInventoryPage }) => {
    const title = await authenticatedInventoryPage.getPageTitle();
    expect(title).toBe('Products');
  });

  test('cart badge should be hidden on fresh load', async ({ authenticatedInventoryPage }) => {
    await authenticatedInventoryPage.assertCartCount(0);
  });
});

test.describe('Inventory — add/remove items @regression', () => {
  test('should add a single item to cart', async ({ authenticatedInventoryPage }) => {
    const product = productsData.products[0].name;

    await test.step(`Add "${product}" to cart`, async () => {
      await authenticatedInventoryPage.addItemToCart(product);
    });

    await test.step('Cart badge shows 1', async () => {
      await authenticatedInventoryPage.assertCartCount(1);
    });
  });

  test('should add multiple items and reflect correct badge count', async ({ authenticatedInventoryPage }) => {
    const [p1, p2, p3] = productsData.products.map(p => p.name);

    await authenticatedInventoryPage.addItemToCart(p1);
    await authenticatedInventoryPage.addItemToCart(p2);
    await authenticatedInventoryPage.addItemToCart(p3);

    await authenticatedInventoryPage.assertCartCount(3);
  });

  test('should remove an item from cart', async ({ authenticatedInventoryPage }) => {
    const product = productsData.products[1].name;

    await authenticatedInventoryPage.addItemToCart(product);
    await authenticatedInventoryPage.assertCartCount(1);

    await authenticatedInventoryPage.removeItemFromCart(product);
    await authenticatedInventoryPage.assertCartCount(0);
  });
});

test.describe('Inventory — sorting @regression', () => {
  for (const sortOption of productsData.sortOptions) {
    test(`should sort products: ${sortOption.label}`, async ({ authenticatedInventoryPage }) => {
      await test.step(`Apply sort: ${sortOption.label}`, async () => {
        await authenticatedInventoryPage.sortProducts(sortOption.value as SortOption);
      });

      await test.step('Assert sort order is correct', async () => {
        if (sortOption.type === 'alpha-asc') {
          await authenticatedInventoryPage.assertProductsSortedAZ();
        } else if (sortOption.type === 'price-asc') {
          await authenticatedInventoryPage.assertProductsSortedByPriceLowToHigh();
        } else if (sortOption.type === 'alpha-desc') {
          const names  = await authenticatedInventoryPage.getProductNames();
          const sorted = [...names].sort((a, b) => b.localeCompare(a));
          expect(names).toEqual(sorted);
        } else if (sortOption.type === 'price-desc') {
          const prices = await authenticatedInventoryPage.getProductPrices();
          for (let i = 1; i < prices.length; i++) {
            expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
          }
        }
      });
    });
  }
});

test.describe('Inventory — logout @regression', () => {
  test('should logout and return to login page', async ({ authenticatedInventoryPage, page }) => {
    await test.step('Click logout from burger menu', async () => {
      await authenticatedInventoryPage.logout();
    });

    await test.step('Assert redirected to login page', async () => {
      await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
    });
  });
});
