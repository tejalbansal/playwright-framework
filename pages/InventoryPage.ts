import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * InventoryPage — product catalogue page after successful login.
 * All locators use Playwright built-in selector APIs.
 */
export class InventoryPage extends BasePage {
  // ─── Stable, semantic locators ───────────────────────────────────────────────
  private readonly pageTitle: Locator;
  private readonly productList: Locator;
  private readonly productItems: Locator;
  private readonly shoppingCartBadge: Locator;
  private readonly shoppingCartLink: Locator;
  private readonly sortDropdown: Locator;
  private readonly burgerMenuButton: Locator;
  private readonly logoutLink: Locator;

  constructor(page: Page) {
    super(page);
    // getByRole — matches accessible heading role
    this.pageTitle         = page.getByRole('heading', { name: 'Products' });
    // getByTestId reads configured testIdAttribute ('data-test')
    this.productList       = page.getByTestId('inventory-list');
    this.productItems      = page.getByTestId('inventory-item');
    this.shoppingCartBadge = page.getByTestId('shopping-cart-badge');
    // getByRole — cart link is a navigation landmark link
    this.shoppingCartLink  = page.getByRole('link', { name: /shopping cart/i });
    // getByRole — sort control is a combobox (select element)
    this.sortDropdown      = page.getByRole('combobox');
    // getByRole — burger menu is an accessible button
    this.burgerMenuButton  = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink        = page.getByRole('link', { name: 'Logout' });
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/inventory.html');
    await this.waitForElement(this.productList);
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  /**
   * Locates the inventory item row by product name, then clicks its
   * 'Add to cart' button — no brittle composite selectors needed.
   */
  async addItemToCart(itemName: string): Promise<void> {
    const item = this.page
      .getByTestId('inventory-item')
      .filter({ has: this.page.getByText(itemName, { exact: true }) });
    await item.getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeItemFromCart(itemName: string): Promise<void> {
    const item = this.page
      .getByTestId('inventory-item')
      .filter({ has: this.page.getByText(itemName, { exact: true }) });
    await item.getByRole('button', { name: 'Remove' }).click();
  }

  async sortProducts(option: SortOption): Promise<void> {
    await this.selectOption(this.sortDropdown, option);
  }

  async openCart(): Promise<void> {
    await this.clickElement(this.shoppingCartLink);
  }

  async logout(): Promise<void> {
    await this.clickElement(this.burgerMenuButton);
    await this.waitForElement(this.logoutLink);
    await this.clickElement(this.logoutLink);
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  async getProductCount(): Promise<number> {
    return this.productItems.count();
  }

  async getCartItemCount(): Promise<number> {
    const isVisible = await this.isVisible(this.shoppingCartBadge);
    if (!isVisible) return 0;
    const text = await this.getTextContent(this.shoppingCartBadge);
    return parseInt(text, 10);
  }

  async getProductNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents();
  }

  async getProductPrices(): Promise<number[]> {
    const texts = await this.page.getByTestId('inventory-item-price').allTextContents();
    return texts.map(t => parseFloat(t.replace('$', '')));
  }

  async getPageTitle(): Promise<string> {
    return this.getTextContent(this.pageTitle);
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async assertOnInventoryPage(): Promise<void> {
    await this.assertURL(/inventory\.html/);
    await this.assertVisible(this.productList);
  }

  async assertCartCount(expectedCount: number): Promise<void> {
    if (expectedCount === 0) {
      await this.assertHidden(this.shoppingCartBadge);
    } else {
      await expect(this.shoppingCartBadge).toHaveText(String(expectedCount));
    }
  }

  async assertProductsSortedAZ(): Promise<void> {
    const names = await this.getProductNames();
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  }

  async assertProductsSortedByPriceLowToHigh(): Promise<void> {
    const prices = await this.getProductPrices();
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  }
}
