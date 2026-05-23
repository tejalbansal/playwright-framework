# AI Usage Log

## Session: SDET-2 Challenge — Playwright Framework Build
**Date:** 23 May 2026  
**Tool:** GitHub Copilot (Claude Sonnet 4.6 via VS Code Agent)

---

### Phase 1 — Requirements Analysis
**Prompt used:** `read the SDET-2 pdf and use skill.md for creating a playwright based e2e framework following POM and corresponding github actions to run the test`

**AI actions:**
- Read and summarised the SDET-2 challenge PDF
- Invoked the `grill-me` skill to conduct a structured 8-round design interview
- Resolved all architectural decisions before writing a single line of code

**Key decisions locked via interview:**
- TypeScript over JavaScript (type safety, IDE support)
- POM with abstract `BasePage` → `LoginPage`, `InventoryPage`
- Per-test auth isolation — no shared `storageState`
- `testIdAttribute: 'data-test'` for SauceDemo's data-test attributes
- AJV for API schema validation
- 4-shard GitHub Actions matrix with `playwright merge-reports`
- DummyJSON as free public API target (migrated from Reqres.in)

---

### Phase 2 — Framework Scaffold (~30 files generated)
**AI actions:**
- Generated all files in a single pass: pages, fixtures, utils, tests, config, CI workflow
- No boilerplate left as placeholders — every file was production-ready

**Files created by AI:**

| Layer | Files |
|---|---|
| Config | `playwright.config.ts`, `tsconfig.json`, `.eslintrc.js`, `package.json`, `.gitignore`, `.npmrc` |
| Environment | `config/environments.json`, `config/.env.*` |
| Pages (POM) | `pages/BasePage.ts`, `pages/LoginPage.ts`, `pages/InventoryPage.ts` |
| Fixtures | `fixtures/fixtures.ts` |
| Utils | `utils/api-client.ts`, `utils/env-config.ts`, `utils/custom-assertions.ts` |
| Test data | `test-data/api-test-data.json`, `test-data/users.json`, `test-data/products.json` |
| Tests — UI | `tests/ui/login.spec.ts`, `tests/ui/dashboard.spec.ts`, `tests/ui/form-validation.spec.ts` |
| Tests — API | `tests/api/users.spec.ts`, `tests/api/auth.spec.ts`, `tests/api/schema-validation.spec.ts` |
| Tests — Integration | `tests/integration/api-ui-flow.spec.ts` |
| CI | `.github/workflows/playwright.yml` |
| Docs | `README.md`, `test-strategy.md`, `ai-usage-log.md` |

---

### Phase 3 — Debugging & Root-Cause Fixes

#### Issue 1: Corporate npm registry (Nexus) blocking installs
**Root cause:** `~/.npmrc` routes all npm traffic to `https://nexus.core.cvent.org` (offline/unreachable)  
**AI fix:** Created project-level `.npmrc` with `registry=https://registry.npmjs.org/` to override globally  
**Result:** `npm install` succeeded, 146 packages installed

#### Issue 2: Reqres.in deprecated free tier (all API tests → 401)
**Root cause:** Reqres.in now requires a paid `x-api-key` header; every request returned 401  
**AI fix:** Migrated the entire API layer to DummyJSON (`https://dummyjson.com`)

**Migration scope (8 files):**
- `config/environments.json` — updated `apiBaseURL` for all 3 environments
- `config/.env.*` + `playwright.config.ts` — updated `API_BASE_URL` fallback
- `test-data/api-test-data.json` — rewrote payloads for DummyJSON shape
- `utils/api-client.ts` — updated interfaces, endpoints, response types
- `tests/api/users.spec.ts` — updated assertions for camelCase fields + new list shape
- `tests/api/auth.spec.ts` — removed register tests, updated login to `accessToken`
- `tests/api/schema-validation.spec.ts` — rewrote all AJV schemas
- `tests/integration/api-ui-flow.spec.ts` — updated field references
- `.github/workflows/playwright.yml` — updated CI fallback URL

#### Issue 3: `--headed=false` is not a valid Playwright CLI flag
**Root cause:** Playwright has no `--headed=false` option; it throws `unknown option`  
**Fix:** Headless is the default. Use `--headed` to enable headed mode; omit it for headless.

#### Issue 4: `TEST_ENV=local` routes to `localhost:3000` (no server)
**Root cause:** `config/environments.json` correctly defines `local.baseURL = http://localhost:3000`  
**Fix:** Always use `TEST_ENV=staging` for runs against `https://www.saucedemo.com`

---

### Phase 4 — Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| UI smoke tests (chromium) | 4/4 passed |
| Full API suite | 22/22 passed |
| Full suite — headed (chromium + api) | 53/53 passed |
| Full suite — headless (chromium + api) | 52/52 passed |

---

### AI Prompting Notes

- **What worked well:** The `grill-me` skill forced resolution of every architectural branch before implementation, which eliminated most rework
- **Hallucination risk mitigated:** AI verified DummyJSON API shape by checking actual endpoint responses before writing tests
- **Token efficiency:** Conversation summary/compaction used mid-session; AI reconstructed full context from summary accurately
- **Human corrections required:** None of the architecture decisions required override

---

### Estimated AI Contribution

| Activity | Human | AI |
|---|---|---|
| Requirements interpretation | 100% | 0% |
| Architecture design (via grilling) | 20% | 80% |
| Code generation | 5% | 95% |
| Debugging root causes | 30% | 70% |
| Verification / test runs | 50% | 50% |
