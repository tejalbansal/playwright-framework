# Framework Architecture

## Overview

This is a TypeScript-based end-to-end test framework built on **Playwright v1.44** covering:
- **UI testing** — SauceDemo (`https://www.saucedemo.com`)
- **API testing** — DummyJSON (`https://dummyjson.com`)
- **Integration testing** — API-to-UI cross-layer flows

---

## Directory Structure

```
playwright-framework/
├── .github/
│   └── workflows/
│       └── playwright.yml          # CI: 4-shard matrix + merge reports
├── config/
│   ├── environments.json           # Per-env baseURL / apiBaseURL / timeouts
│   ├── .env.local                  # Local overrides (localhost:3000)
│   ├── .env.staging                # Staging (saucedemo.com / dummyjson.com)
│   └── .env.production             # Production
├── fixtures/
│   └── fixtures.ts                 # Custom fixtures: loginPage, apiClient,
│                                   #   authenticatedInventoryPage
├── pages/                          # Page Object Model classes
│   ├── BasePage.ts                 # Abstract base: goto(), waitForLoad()
│   ├── LoginPage.ts                # login(), assertError()
│   └── InventoryPage.ts            # addItemToCart(), sortProducts(), assertCartCount()
├── test-data/
│   ├── api-test-data.json          # API payloads and expected values
│   ├── users.json                  # UI user credentials
│   └── products.json               # Product names / prices
├── tests/
│   ├── ui/                         # Browser-based tests (chromium project)
│   │   ├── login.spec.ts
│   │   ├── dashboard.spec.ts
│   │   └── form-validation.spec.ts
│   ├── api/                        # HTTP-only tests (api project)
│   │   ├── users.spec.ts
│   │   ├── auth.spec.ts
│   │   └── schema-validation.spec.ts
│   └── integration/
│       └── api-ui-flow.spec.ts     # Cross-layer: API call → UI verification
├── utils/
│   ├── api-client.ts               # Typed ApiClient (UsersApi + AuthApi)
│   ├── custom-assertions.ts        # assertStatus(), assertHasFields(), etc.
│   └── env-config.ts               # EnvConfig loader (environments.json + .env)
├── playwright.config.ts
├── tsconfig.json
├── .npmrc                          # Forces public npm registry (overrides corporate Nexus)
└── package.json
```

---

## Core Patterns

### Page Object Model (POM)

```
BasePage (abstract)
  ├── LoginPage
  └── InventoryPage
```

- All locators use **Playwright built-ins only** (`getByRole`, `getByTestId`, `getByLabel`) — no raw CSS or XPath
- `testIdAttribute: 'data-test'` in `playwright.config.ts` maps `getByTestId()` to SauceDemo's `data-test` attributes
- Page classes expose named action methods; tests never call raw Playwright APIs directly

### Fixtures

Three custom fixtures compose the test context:

| Fixture | What it provides |
|---|---|
| `loginPage` | Fresh `LoginPage` instance, navigated to `/` |
| `apiClient` | `ApiClient` bound to the `api` project's `APIRequestContext` |
| `authenticatedInventoryPage` | `InventoryPage` after a programmatic login — no UI login overhead |

Authentication is **per-test isolated** — no shared `storageState`, no `setup` project dependency.

### API Client

`utils/api-client.ts` wraps Playwright's `APIRequestContext` into typed resource classes:

```
ApiClient
  ├── UsersApi   — list(), get(), create(), update(), patch(), remove()
  └── AuthApi    — login()
```

All methods return `APIResponse` from Playwright.
Helper exports: `assertStatus()`, `assertResponseTime()`, `assertHasFields()`.

### AJV Schema Validation

`tests/api/schema-validation.spec.ts` uses **AJV** (`ajv` + `ajv-formats`) to validate response shapes:
- `ListUsersBody` — `{ users[], total, skip, limit }`
- `CreateUserBody` — `{ id, firstName, lastName }`
- `LoginBody` — `{ accessToken, refreshToken }`

---

## Test Projects

Defined in `playwright.config.ts`:

| Project | Runner | Target |
|---|---|---|
| `chromium` | Chromium browser | `https://www.saucedemo.com` |
| `firefox` | Firefox browser | `https://www.saucedemo.com` |
| `webkit` | WebKit/Safari | `https://www.saucedemo.com` |
| `mobile-chrome` | Pixel 5 device | `@smoke` tests only |
| `api` | No browser (HTTP only) | `https://dummyjson.com` |

---

## Environment Configuration

Resolved at runtime in priority order:

1. `process.env.BASE_URL` / `process.env.API_BASE_URL` (CI secrets / shell exports)
2. `config/.env.${TEST_ENV}` (loaded via `dotenv`)
3. `config/environments.json` defaults

```bash
# Staging (default — hits saucedemo.com)
TEST_ENV=staging npx playwright test

# With credentials
STANDARD_USER=standard_user TEST_PASSWORD=secret_sauce TEST_ENV=staging npx playwright test
```

---

## CI Pipeline

`.github/workflows/playwright.yml` runs a **4-shard matrix**:

```
shard 1/4 (--workers=2) ─┐
shard 2/4 (--workers=2) ─┤  blob reports → merge-reports job → HTML + JUnit upload
shard 3/4 (--workers=2) ─┤
shard 4/4 (--workers=2) ─┘
```

- Shards run in parallel via `matrix.shardIndex: [1,2,3,4]`
- Blob reporter per shard → artifacts uploaded → `playwright merge-reports` in final job
- Artifacts: `playwright-report/` (HTML) + `test-results/junit-results.xml`

---

## Reports (Local)

After a test run, three report formats are written:

| Format | Path | Open with |
|---|---|---|
| HTML (interactive) | `playwright-report/index.html` | `npx playwright show-report` |
| JUnit XML | `test-results/junit-results.xml` | Any CI / IDE JUnit viewer |
| JSON | `test-results/test-results.json` | Custom tooling / dashboards |

On failure: screenshots saved in `test-results/<test-name>/`, traces captured on first retry.

---

## Tag Convention

| Tag | Meaning |
|---|---|
| `@smoke` | Critical path, minimal must-pass |
| `@regression` | Full functional coverage |

```bash
# Run only smoke tests
npx playwright test --grep @smoke

# Run full regression
npx playwright test --grep @regression
```
