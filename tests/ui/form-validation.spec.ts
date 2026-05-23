import { test, expect } from '../../fixtures/fixtures';

/**
 * Form validation tests for the SauceDemo login form.
 * These focus specifically on client-side validation behaviours and
 * visual/accessibility states, complementing the broader login.spec.ts.
 */

test.describe('Form validation — empty field states @regression', () => {
  test('submitting empty form should show username-required error', async ({ loginPage }) => {
    await test.step('Submit without entering any credentials', async () => {
      await loginPage.login('', '');
    });

    await test.step('Error message should mention Username', async () => {
      const errorMsg = await loginPage.getErrorMessage();
      expect(errorMsg).toContain('Username is required');
    });
  });

  test('submitting without password should show password-required error', async ({ loginPage }) => {
    await test.step('Enter username but leave password blank', async () => {
      await loginPage.login('standard_user', '');
    });

    await test.step('Error message should mention Password', async () => {
      const errorMsg = await loginPage.getErrorMessage();
      expect(errorMsg).toContain('Password is required');
    });
  });
});

test.describe('Form validation — visual error states @regression', () => {
  test('error container becomes visible on failed login', async ({ loginPage }) => {
    await loginPage.login('bad_user', 'bad_pass');
    const isVisible = await loginPage.isErrorDisplayed();
    expect(isVisible).toBe(true);
  });

  test('error container is hidden on fresh page load', async ({ loginPage }) => {
    const isVisible = await loginPage.isErrorDisplayed();
    expect(isVisible).toBe(false);
  });

  test('dismissing error removes it from DOM visibility', async ({ loginPage }) => {
    await loginPage.login('bad_user', 'bad_pass');
    await loginPage.dismissError();
    const isVisible = await loginPage.isErrorDisplayed();
    expect(isVisible).toBe(false);
  });
});

test.describe('Form validation — field accessibility @smoke', () => {
  test('username field should be reachable by placeholder text', async ({ loginPage }) => {
    await loginPage.assertLoginPageLoaded();
  });

  test('should accept Unicode characters in username field without crashing', async ({ loginPage }) => {
    await test.step('Enter Unicode username', async () => {
      await loginPage.login('用户名çàé', 'secret_sauce');
    });

    // Expects an error — we just want to ensure no JS exception
    await test.step('Error should appear (no crash)', async () => {
      const isErrorShown = await loginPage.isErrorDisplayed();
      expect(isErrorShown).toBe(true);
    });
  });
});
