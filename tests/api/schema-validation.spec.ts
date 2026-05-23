import Ajv, { type JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { test } from '../../fixtures/fixtures';
import { assertStatus } from '../../utils/api-client';
import apiData from '../../test-data/api-test-data.json';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// ─── Schemas ──────────────────────────────────────────────────────────────

interface UserObject {
  id:        number;
  firstName: string;
  lastName:  string;
  email:     string;
  username:  string;
}

const userObjectSchema: JSONSchemaType<UserObject> = {
  type: 'object',
  properties: {
    id:        { type: 'integer' },
    firstName: { type: 'string' },
    lastName:  { type: 'string' },
    email:     { type: 'string', format: 'email' },
    username:  { type: 'string' },
  },
  required: ['id', 'firstName', 'lastName', 'email', 'username'],
  additionalProperties: true,
};

interface ListUsersBody {
  users: UserObject[];
  total: number;
  skip:  number;
  limit: number;
}

const listUsersSchema: JSONSchemaType<ListUsersBody> = {
  type: 'object',
  properties: {
    users: {
      type:  'array',
      items: userObjectSchema,
    },
    total: { type: 'integer' },
    skip:  { type: 'integer' },
    limit: { type: 'integer' },
  },
  required: ['users', 'total', 'skip', 'limit'],
  additionalProperties: true,
};

interface CreateUserBody {
  id:        number;
  firstName: string;
  lastName:  string;
}

const createUserSchema: JSONSchemaType<CreateUserBody> = {
  type: 'object',
  properties: {
    id:        { type: 'integer' },
    firstName: { type: 'string' },
    lastName:  { type: 'string' },
  },
  required: ['id', 'firstName', 'lastName'],
  additionalProperties: true,
};

interface LoginBody {
  accessToken:  string;
  refreshToken: string;
}

const loginResponseSchema: JSONSchemaType<LoginBody> = {
  type: 'object',
  properties: {
    accessToken:  { type: 'string' },
    refreshToken: { type: 'string' },
  },
  required: ['accessToken', 'refreshToken'],
  additionalProperties: true,
};

// ─── Helper ───────────────────────────────────────────────────────────────

function validate<T>(schema: JSONSchemaType<T>, data: unknown, label: string): void {
  const valid = ajv.validate(schema, data);
  if (!valid) {
    throw new Error(`Schema validation failed for "${label}":\n${ajv.errorsText()}`);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────

test.describe('Schema validation — list users', () => {
  test('GET /users response matches list schema @regression', async ({ apiClient }) => {
    const response = await apiClient.users.list(1);
    assertStatus(response, 200);
    validate(listUsersSchema, response.body, 'GET /users');
  });

  test('each user object in list has all required fields @regression', async ({ apiClient }) => {
    const response = await apiClient.users.list(1);
    assertStatus(response, 200);
    const listBody = response.body as ListUsersBody;
    for (const user of listBody.users) {
      validate(userObjectSchema, user, `user id=${user.id}`);
    }
  });
});

test.describe('Schema validation — create user', () => {
  test('POST /users/add response matches create schema @regression', async ({ apiClient }) => {
    const [first] = apiData.createUser;
    const response = await apiClient.users.create({
      firstName: first.firstName,
      lastName:  first.lastName,
    });
    assertStatus(response, 201);
    validate(createUserSchema, response.body, 'POST /users/add');
  });
});

test.describe('Schema validation — auth', () => {
  test('POST /auth/login response matches login schema @regression', async ({ apiClient }) => {
    const response = await apiClient.auth.login(apiData.validLogin);
    assertStatus(response, 200);
    validate(loginResponseSchema, response.body, 'POST /auth/login');
  });
});

test.describe('Response time — all endpoints @regression', () => {
  const limit = apiData.responseTimeLimitMs;

  test(`GET /users responds within ${limit}ms`, async ({ apiClient }) => {
    const r = await apiClient.users.list(1);
    test.expect(r.durationMs).toBeLessThan(limit);
  });

  test(`GET /users/2 responds within ${limit}ms`, async ({ apiClient }) => {
    const r = await apiClient.users.get(2);
    test.expect(r.durationMs).toBeLessThan(limit);
  });

  test(`POST /auth/login responds within ${limit}ms`, async ({ apiClient }) => {
    const r = await apiClient.auth.login(apiData.validLogin);
    test.expect(r.durationMs).toBeLessThan(limit);
  });
});
