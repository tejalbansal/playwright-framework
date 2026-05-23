import { test, expect } from '../../fixtures/fixtures';
import { assertStatus, assertResponseTime, assertHasFields } from '../../utils/api-client';
import apiData from '../../test-data/api-test-data.json';

test.describe('Auth API — login', () => {
  test('POST /auth/login with valid credentials returns tokens @smoke', async ({ apiClient }) => {
    const response = await apiClient.auth.login(apiData.validLogin);

    assertStatus(response, 200);
    assertResponseTime(response, apiData.responseTimeLimitMs);
    assertHasFields(response.body, ['accessToken', 'refreshToken', 'username']);
    const body = response.body as { accessToken: string; refreshToken: string };
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);
  });

  test('POST /auth/login with invalid credentials returns 400 @regression', async ({ apiClient }) => {
    const response = await apiClient.auth.login({
      username: apiData.invalidLogin.username,
      password: apiData.invalidLogin.password,
    });

    assertStatus(response, 400);
    assertHasFields(response.body, ['message']);
    const body = response.body as { message: string };
    expect(body.message).toBeTruthy();
  });

  test('POST /auth/login without password returns 400 @regression', async ({ apiClient }) => {
    const response = await apiClient.auth.login({
      username: apiData.validLogin.username,
      password: '',
    });

    assertStatus(response, 400);
    assertHasFields(response.body, ['message']);
  });
});
