# Test Strategy

## Scope

This framework tests two independent systems as a cohesive suite:

| System | URL | Coverage |
|---|---|---|
| **SauceDemo** (UI) | `https://www.saucedemo.com` | Login, inventory, cart, sorting, form validation |
| **DummyJSON** (API) | `https://dummyjson.com` | Users CRUD, auth, schema validation, response SLAs |

---

## Test Pyramid

```
          ┌──────────────────┐
          │   Integration    │  3 tests   (API → UI cross-layer)
          ├──────────────────┤
          │  API / Contract  │  22 tests  (HTTP-only, no browser)
          ├──────────────────┤
          │    UI / E2E      │  27 tests  (browser-driven)
          └──────────────────┘
```

Total: **52 automated tests** across 3 layers.

---

## Tag Strategy

| Tag | Definition | Trigger |
|---|---|---|
| `@smoke` | Minimal critical-path — login succeeds, API returns 200 | Every PR, every commit |
| `@regression` | Full functional coverage | Nightly + release branches |

Smoke tests are also executed by the `mobile-chrome` project (Pixel 5 viewport) to catch mobile-specific regressions.

---

## Coverage by Area

### UI — Login (`tests/ui/login.spec.ts`)
- Valid credentials: `standard_user`, `problem_user`
- Invalid credentials: empty form, missing username, missing password, wrong credentials
- Locked-out user error message
- Form interactions: button enabled on load, error dismissal via × button, required elements present

### UI — Inventory / Dashboard (`tests/ui/dashboard.spec.ts`)
- Page load: 6 products displayed, "Products" heading visible, cart badge hidden
- Add/remove items: single add, multiple adds (badge count), remove decrements badge
- Sorting: Name A→Z, Name Z→A, Price low→high, Price high→low
- Logout: returns to login page

### UI — Form Validation (`tests/ui/form-validation.spec.ts`)
- Empty form submission: username-required and password-required error messages
- Error container visibility on failure / hidden on fresh load
- Error dismissal removes element from DOM visibility
- Unicode characters in username field (accessibility / crash guard)

### API — Users (`tests/api/users.spec.ts`)
- `GET /users` — list with pagination (pages 1 and 2 return different results)
- `GET /users/:id` — existing IDs 1, 2, 3; non-existent 9999 → 404
- `POST /users/add` — three payloads (standard, minimal, short names) → 201 + returned ID
- `PUT /users/:id` — full update returns 200 with updated fields
- `PATCH /users/:id` — partial update returns 200
- `DELETE /users/:id` — returns 200 + `{ isDeleted: true }`

### API — Auth (`tests/api/auth.spec.ts`)
- Valid login → 200 + `accessToken` + `refreshToken`
- Invalid credentials → 400 + `{ message }`
- Empty password → 400

### API — Schema Validation (`tests/api/schema-validation.spec.ts`)
- AJV schema assertions for: list users, individual user objects, create user, login response
- Response time SLA: all endpoints must respond within `responseTimeLimitMs` (2000 ms)

### Integration (`tests/integration/api-ui-flow.spec.ts`)
- API login → `accessToken` non-empty → UI login succeeds with same account
- API user create → GET confirms read works → UI add/remove cart flow
- API list validates structure → UI sort A→Z verified

---

## Isolation Strategy

- **Per-test login:** Every UI test that needs an authenticated state calls login directly via the `authenticatedInventoryPage` fixture — no shared `storageState`
- **No test ordering dependency:** Tests can run in any order and any shard
- **No shared mutable state:** Each API write test (create/update/delete) targets stable DummyJSON mock endpoints that always return consistent responses

---

## Cross-Browser Strategy

| Browser | Scope | Rationale |
|---|---|---|
| Chromium | Full regression + smoke | Primary coverage browser |
| Firefox | Full regression | Second most used engine |
| WebKit | Full regression | Safari / iOS parity |
| Mobile Chrome (Pixel 5) | Smoke only (`@smoke`) | Mobile viewport regression |

API tests run in the `api` project with **no browser** — pure HTTP via Playwright's `APIRequestContext`.

---

## CI Execution

GitHub Actions workflow (`.github/workflows/playwright.yml`):

1. **4 parallel shards** — each runs `--shard=N/4 --workers=2`
2. **Blob reporter** per shard — artifacts uploaded to `blob-report-N`
3. **Merge job** — downloads all blobs, runs `playwright merge-reports`, publishes final HTML + JUnit
4. **Retries:** `retries: 2` on CI to absorb flakiness from network latency

---

## Environments

| `TEST_ENV` | UI Base URL | API Base URL | Retries |
|---|---|---|---|
| `local` | `http://localhost:3000` | `https://dummyjson.com` | 0 |
| `staging` | `https://www.saucedemo.com` | `https://dummyjson.com` | 1 |
| `production` | `https://www.saucedemo.com` | `https://dummyjson.com` | 2 |

Default: `staging`.

---

## Running Tests

```bash
# Headless (default) — chromium + API
STANDARD_USER=standard_user TEST_PASSWORD=secret_sauce TEST_ENV=staging \
  node_modules/.bin/playwright test --project=chromium --project=api

# Headed mode
STANDARD_USER=standard_user TEST_PASSWORD=secret_sauce TEST_ENV=staging \
  node_modules/.bin/playwright test --project=chromium --project=api --headed

# Smoke only (all browsers)
STANDARD_USER=standard_user TEST_PASSWORD=secret_sauce TEST_ENV=staging \
  node_modules/.bin/playwright test --grep @smoke

# API only
TEST_ENV=staging node_modules/.bin/playwright test --project=api

# View HTML report
npx playwright show-report
```

---

## Out of Scope

- Performance / load testing
- Visual regression (pixel-diff)
- Accessibility (a11y) automated audit
- Mobile native apps
- Database-level assertions
