import { test, expect } from '../../fixtures/fixtures';
import { assertStatus, assertResponseTime, assertHasFields } from '../../utils/api-client';
import apiData from '../../test-data/api-test-data.json';

test.describe('Users API — list', () => {
  test('GET /users returns 200 with user array @smoke', async ({ apiClient }) => {
    const response = await apiClient.users.list(1);

    assertStatus(response, 200);
    assertResponseTime(response, apiData.responseTimeLimitMs);
    assertHasFields(response.body, ['users', 'total', 'skip', 'limit']);
    expect(Array.isArray(response.body.users)).toBe(true);
    expect(response.body.users.length).toBeGreaterThan(0);
  });

  test('GET /users page 2 returns different results @regression', async ({ apiClient }) => {
    const [page1, page2] = await Promise.all([
      apiClient.users.list(1),
      apiClient.users.list(2),
    ]);

    assertStatus(page1, 200);
    assertStatus(page2, 200);
    expect(page1.body.users).not.toEqual(page2.body.users);
  });
});

test.describe('Users API — get single user', () => {
  for (const userId of apiData.existingUserIds) {
    test(`GET /users/${userId} returns 200 @regression`, async ({ apiClient }) => {
      const response = await apiClient.users.get(userId);

      assertStatus(response, 200);
      assertResponseTime(response, apiData.responseTimeLimitMs);
      assertHasFields(response.body, ['id', 'firstName', 'lastName', 'email']);
      expect(response.body.id).toBe(userId);
    });
  }

  test('GET /users/9999 returns 404 for non-existent user @regression', async ({ apiClient }) => {
    const response = await apiClient.users.get(apiData.nonExistentUserId);
    assertStatus(response, 404);
  });
});

test.describe('Users API — create', () => {
  for (const payload of apiData.createUser) {
    test(`POST /users/add — ${payload.description} @regression`, async ({ apiClient }) => {
      const response = await apiClient.users.create({
        firstName: payload.firstName,
        lastName:  payload.lastName,
      });

      assertStatus(response, 201);
      assertResponseTime(response, apiData.responseTimeLimitMs);
      assertHasFields(response.body, ['id', 'firstName', 'lastName']);
      expect(response.body).toMatchObject({
        firstName: payload.firstName,
        lastName:  payload.lastName,
      });
    });
  }
});

test.describe('Users API — update', () => {
  test('PUT /users/:id returns 200 with updated fields @regression', async ({ apiClient }) => {
    const { id, firstName, lastName } = apiData.updateUser;
    const response = await apiClient.users.update(id, { firstName, lastName });

    assertStatus(response, 200);
    assertResponseTime(response, apiData.responseTimeLimitMs);
    assertHasFields(response.body, ['id', 'firstName', 'lastName']);
    expect(response.body).toMatchObject({ firstName, lastName });
  });

  test('PATCH /users/:id returns 200 @regression', async ({ apiClient }) => {
    const { id, firstName } = apiData.updateUser;
    const response = await apiClient.users.patch(id, { firstName });

    assertStatus(response, 200);
    assertHasFields(response.body, ['id', 'firstName']);
    expect(response.body.firstName).toBe(firstName);
  });
});

test.describe('Users API — delete', () => {
  test('DELETE /users/:id returns 200 with isDeleted flag @regression', async ({ apiClient }) => {
    const response = await apiClient.users.remove(2);
    assertStatus(response, 200);
    expect(response.body.isDeleted).toBe(true);
  });
});
