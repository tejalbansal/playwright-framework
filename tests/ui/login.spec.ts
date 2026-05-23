import { test, expect } from '../../fixtures/fixtures';
import usersData from '../../test-data/users.json';

test.describe('Login — valid credentials', () => {
  for (const user of usersData.validUsers) {
    test(`should login successfully as ${user.description} @smoke @regression`, async ({ loginPage }) => {
      await test.step('Login with valid credentials', async () => {
        await loginPage.login(user.username, user.password);
      });

      await test.step('Assert redirected to inventory page', async () => {
        await expect(loginPage.page).toHaveURL(/inventory\.html/);
      });
    });
  }
});

test.describe('Login — invalid credentials', () => {
  for (const user of usersData.invalidUsers) {
    test(`should show error for ${user.description} @regression`, async ({ loginPage }) => {
      await test.step('Submit invalid credentials', async () => {
        await loginPage.login(user.username, user.password);
      });

      await test.step('Assert error message displayed', async () => {
        await loginPage.assertErrorMessage(user.expectedError);
      });

      await test.step('Assert still on login page', async () => {
        const isOnLogin = await loginPage.isOnLoginPage();
        expect(isOnLogin).toBe(true);
      });
    });
  }
});

test.describe('Login — locked out user', () => {
  test('should show locked out error @regression', async ({ loginPage }) => {
    const { lockedUser } = usersData;

    await test.step('Attempt login as locked user', async () => {
      await loginPage.login(lockedUser.username, lockedUser.password);
    });

    await test.step('Assert locked-out error', async () => {
      await loginPage.assertErrorMessage(lockedUser.expectedError);
    });
  });
});

test.describe('Login — form interactions', () => {
  test('login button should be enabled on page load @smoke', async ({ loginPage }) => {
    const isEnabled = await loginPage.isLoginButtonEnabled();
    expect(isEnabled).toBe(true);
  });

  test('should dismiss error message via × button @regression', async ({ loginPage }) => {
    await loginPage.login('bad_user', 'bad_pass');
    const isErrorShown = await loginPage.isErrorDisplayed();
    expect(isErrorShown).toBe(true);

    await loginPage.dismissError();
    const isErrorGone = await loginPage.isErrorDisplayed();
    expect(isErrorGone).toBe(false);
  });

  test('login page should have all required elements @smoke', async ({ loginPage }) => {
    await loginPage.assertLoginPageLoaded();
  });
});
