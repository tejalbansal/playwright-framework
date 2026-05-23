import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage — encapsulates all selectors and actions for the SauceDemo login page.
 * Uses Playwright built-in locator functions (getByRole, getByPlaceholder, getByTestId)
 * so no raw CSS/XPath selectors leak into tests.
 */
export class LoginPage extends BasePage {
  // ─── Locators defined with Playwright's semantic/built-in selector APIs ─────
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;
  private readonly errorDismissButton: Locator;
  private readonly loginLogo: Locator;

  constructor(page: Page) {
    super(page);
    // getByPlaceholder — matches the visible placeholder text in the input
    this.usernameInput      = page.getByPlaceholder('Username');
    this.passwordInput      = page.getByPlaceholder('Password');
    // getByRole — matches accessible role + name; survives class/id refactors
    this.loginButton        = page.getByRole('button', { name: 'Login' });
    // getByTestId reads the configured testIdAttribute ('data-test')
    this.errorMessage       = page.getByTestId('error');
    this.errorDismissButton = page.getByTestId('error-button');
    // getByText — the logo is unique enough to use text content
    this.loginLogo          = page.getByText('Swag Labs', { exact: true });
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/');
    await this.waitForElement(this.loginButton);
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  async enterUsername(username: string): Promise<void> {
    await this.fillInput(this.usernameInput, username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.fillInput(this.passwordInput, password);
  }

  async clickLogin(): Promise<void> {
    await this.clickElement(this.loginButton);
  }

  /**
   * High-level action: fills credentials and submits the login form.
   */
  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  async dismissError(): Promise<void> {
    await this.clickElement(this.errorDismissButton);
  }

  // ─── Getters / Assertions ────────────────────────────────────────────────────

  async getErrorMessage(): Promise<string> {
    return this.getTextContent(this.errorMessage);
  }

  async isErrorDisplayed(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }

  async isLoginButtonEnabled(): Promise<boolean> {
    return this.isEnabled(this.loginButton);
  }

  async isOnLoginPage(): Promise<boolean> {
    return this.isVisible(this.loginLogo);
  }

  async assertErrorMessage(expectedText: string): Promise<void> {
    await this.assertVisible(this.errorMessage);
    await this.assertContainsText(this.errorMessage, expectedText);
  }

  async assertLoginPageLoaded(): Promise<void> {
    await this.assertVisible(this.usernameInput);
    await this.assertVisible(this.passwordInput);
    await this.assertVisible(this.loginButton);
  }
}
