import { type Page, type Locator, expect } from '@playwright/test';

/**
 * BasePage — all page objects extend this class.
 * Encapsulates common navigation, waiting, and assertion helpers so
 * individual page objects stay lean.
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async navigate(path = ''): Promise<void> {
    await this.page.goto(path);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  // ─── URL helpers ───────────────────────────────────────────────────────────

  getURL(): string {
    return this.page.url();
  }

  async waitForURL(urlPattern: string | RegExp, timeout = 10_000): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  // ─── Element interaction ───────────────────────────────────────────────────

  async clickElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  async fillInput(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
  }

  async selectOption(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption(value);
  }

  async getTextContent(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent()) ?? '';
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async isEnabled(locator: Locator): Promise<boolean> {
    return locator.isEnabled();
  }

  // ─── Wait helpers ──────────────────────────────────────────────────────────

  async waitForElement(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async waitForElementHidden(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Screenshot helpers ────────────────────────────────────────────────────

  async takeScreenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  // ─── Assertion helpers ─────────────────────────────────────────────────────

  async assertTitle(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  async assertURL(expected: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expected);
  }

  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async assertHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  async assertText(locator: Locator, expected: string): Promise<void> {
    await expect(locator).toHaveText(expected);
  }

  async assertContainsText(locator: Locator, expected: string): Promise<void> {
    await expect(locator).toContainText(expected);
  }

  async assertCount(locator: Locator, count: number): Promise<void> {
    await expect(locator).toHaveCount(count);
  }

  async assertEnabled(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled();
  }

  async assertDisabled(locator: Locator): Promise<void> {
    await expect(locator).toBeDisabled();
  }
}
