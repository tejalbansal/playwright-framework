import { type APIRequestContext, type APIResponse, expect } from '@playwright/test';

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  headers: Record<string, string>;
  durationMs: number;
}

export interface CreateUserPayload {
  firstName: string;
  lastName:  string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?:  string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

/**
 * ApiClient — typed wrapper over Playwright's APIRequestContext.
 * All tests call e.g. `api.users.list()` rather than raw `request.get(...)`.
 * Base URL is resolved from the 'api' project config in playwright.config.ts.
 */
export class ApiClient {
  readonly users: UsersApi;
  readonly auth: AuthApi;

  constructor(private readonly request: APIRequestContext) {
    this.users = new UsersApi(request);
    this.auth  = new AuthApi(request);
  }
}

// ─── Shared request helper ─────────────────────────────────────────────────

async function send<T>(
  fn: () => Promise<APIResponse>
): Promise<ApiResponse<T>> {
  const start    = Date.now();
  const response = await fn();
  const durationMs = Date.now() - start;

  let body: T;
  try {
    body = await response.json() as T;
  } catch {
    body = (await response.text()) as unknown as T;
  }

  return {
    status: response.status(),
    body,
    headers: response.headers() as Record<string, string>,
    durationMs,
  };
}

// ─── Users resource ────────────────────────────────────────────────────────

export interface DummyUser {
  id:        number;
  firstName: string;
  lastName:  string;
  email:     string;
  username:  string;
  image?:    string;
}

export interface ListUsersResponse {
  users: DummyUser[];
  total: number;
  skip:  number;
  limit: number;
}

class UsersApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(page = 1, limit = 10): Promise<ApiResponse<ListUsersResponse>> {
    const skip = (page - 1) * limit;
    return send(() => this.request.get('/users', { params: { limit, skip } }));
  }

  async get(id: number): Promise<ApiResponse<DummyUser>> {
    return send(() => this.request.get(`/users/${id}`));
  }

  async create(payload: CreateUserPayload): Promise<ApiResponse<DummyUser>> {
    return send(() => this.request.post('/users/add', { data: payload }));
  }

  async update(id: number, payload: UpdateUserPayload): Promise<ApiResponse<DummyUser>> {
    return send(() => this.request.put(`/users/${id}`, { data: payload }));
  }

  async patch(id: number, payload: UpdateUserPayload): Promise<ApiResponse<DummyUser>> {
    return send(() => this.request.patch(`/users/${id}`, { data: payload }));
  }

  async remove(id: number): Promise<ApiResponse<DummyUser & { isDeleted: boolean; deletedOn: string }>> {
    return send(() => this.request.delete(`/users/${id}`));
  }
}

// ─── Auth resource ─────────────────────────────────────────────────────────

export interface LoginResponse {
  id:           number;
  username:     string;
  email:        string;
  firstName:    string;
  lastName:     string;
  accessToken:  string;
  refreshToken: string;
}

class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  async login(payload: LoginPayload): Promise<ApiResponse<LoginResponse | { message: string }>> {
    return send(() => this.request.post('/auth/login', { data: payload }));
  }
}

// ─── Custom API assertion helpers ─────────────────────────────────────────

export function assertStatus(response: ApiResponse<unknown>, expected: number): void {
  expect(response.status, `Expected HTTP ${expected} but got ${response.status}`).toBe(expected);
}

export function assertResponseTime(response: ApiResponse<unknown>, maxMs = 2000): void {
  expect(
    response.durationMs,
    `Response time ${response.durationMs}ms exceeded limit of ${maxMs}ms`
  ).toBeLessThan(maxMs);
}

export function assertHasFields(body: unknown, fields: string[]): void {
  for (const field of fields) {
    expect(body, `Expected field '${field}' in response body`).toHaveProperty(field);
  }
}
