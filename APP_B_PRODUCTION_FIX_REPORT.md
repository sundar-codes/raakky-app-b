# The Raakky Chicken App B — Production Fix & QA Report

**Date:** 2026-11-26  
**Project:** `D:/sundar/Sd/app b` (branch `phase-3-integration`)  
**Production URL:** https://raakky-app-b.pages.dev (`main` @ `098cf79`)  
**Preview URL:** https://phase-3-integration.raakky-app-b.pages.dev (`phase-3-integration` @ `818f02d`)  
**Shared D1 Database:** `raakky-db` (`1e7c05c7-608d-4aee-8977-20dedb4fc005`)

---

## 1. Exact Original Root Causes

Browser inspection and network response auditing uncovered **two distinct blockers** affecting production (`main`) and remote preview (`phase-3-integration`):

### A. Production Crash on `https://raakky-app-b.pages.dev` (`"Something went wrong"`)
1. **Unmerged Production Branch (`main` @ `098cf79`) + Unnormalized Raw D1 Snake-Case Payloads**:
   - Production `https://raakky-app-b.pages.dev` is still running commit `098cf79`, whose `functions/api/[[route]].ts` returned raw SQLite/D1 snake_case rows (`category_id`, `name_en`, `supported_cuts`, `search_aliases_json`, `weight_grams`, `is_available: 1`, `order_acceptance_paused: 0`, etc.) and whose `src/services/api.ts` passed `await res.json()` directly into React state without DTO normalization.
   - Before D1 migrations were applied on `raakky-db`, `/api/categories`, `/api/products`, and `/api/shop/settings` returned HTTP `500`, triggering `api.ts`'s hardcoded camelCase fallback arrays (`INITIAL_PRODUCTS`, `INITIAL_CATEGORIES`, `DEFAULT_SHOP_SETTINGS`), which masked the mismatch.
   - Once the 5 D1 migrations were applied to `raakky-db`, `/api/categories`, `/api/products`, and `/api/shop/settings` returned HTTP `200` with raw snake_case fields (`supported_cuts: "standard_cut,boneless_cubes"` CSV string instead of `supportedCuts: string[]`).
   - On initial `/` render, `Home` renders `ProductCard` -> `CuttingPreferencesModal`. Even while closed (`isOpen === false`), its `useEffect` ran:
     ```ts
     setSelectedCut(product.supportedCuts[0] || 'curry_medium');
     ```
     Because `product.supportedCuts` was `undefined`, it immediately threw:
     - `TypeError: Cannot read properties of undefined (reading '0')` (at `assets/index-CtiwK1rb.js:40`)
     - `Raakky App Boundary caught error: TypeError: Cannot read properties of undefined (reading '0')`
     causing `ErrorBoundary` to lock the UI on `"Something went wrong"`.

### B. Preview Crash on `https://phase-3-integration.raakky-app-b.pages.dev` (Blank Screen)
1. **Missing Build-Time `VITE_FIREBASE_*` Environment Variables in Cloudflare Pages + Uncaught Module-Load Initialization**:
   - On `phase-3-integration`, `functions/api/[[route]].ts` already maps D1 rows to camelCase cleanly (`/api/health`, `/api/categories`, `/api/products`, `/api/shop/settings` all return HTTP `200` with expected shapes from `raakky-db`).
   - However, Cloudflare Pages Preview had no `VITE_FIREBASE_*` build environment variables configured (compiled as `void 0`), and `src/services/firebase.ts` invoked `initializeApp()` + `getAuth(app)` synchronously at top-level module import time before `<ErrorBoundary>` mounted.
   - That threw `Uncaught FirebaseError: Firebase: Error (auth/invalid-api-key).` at startup, rendering an empty blank page (`body.innerText` length `0`) across `/`, `/shop`, `/cart`, `/checkout`, and `/profile`.

---

## 2. Files Modified & Added

### Modified Tracked Files (10)
- `wrangler.toml` — Aligned `name = "raakky-app-b"` with the live Cloudflare Pages project name (`raakky-db` UUID `1e7c05c7-608d-4aee-8977-20dedb4fc005` preserved).
- `src/services/firebase.ts` — Replaced unconditional top-level `getAuth(app)` with safe config validation (`isFirebaseConfigured`, `firebaseConfigError`, nullable `auth: Auth | null`) so missing build env vars never blank-screen the storefront before React mounts.
- `src/services/firebaseAuth.ts` — Added `requireFirebaseAuth()` and null-safe handling in `onCustomerAuthStateChanged`, `resolveGoogleRedirectResult`, `signOutCustomer`, and `parseAuthError` (`auth/configuration-missing`).
- `src/contexts/AuthContext.tsx` — Added `isFirebaseConfigured` / `firebaseConfigError` guards in `signInWithGoogle` and `initiateCheckoutAuth`.
- `src/services/api.ts` — Wired `dtoNormalizers` (`normalizeShopSettingsDto`, `normalizeCategoryDto`, `normalizeProductDto`, `unwrapArrayPayload`, `unwrapObjectPayload`) into `getShopSettings`, `getCategories`, `getProducts`, and `getProductById`, added `auth?.currentUser` optional-chaining guards, and added empty/zero division guards to `isBestValueVariant`.
- `src/components/products/CuttingPreferencesModal.tsx` — Guarded `product.variants` & `product.supportedCuts` arrays and updated the Chicken 65 plain-meat notice to match `'prod-chicken-65-fry'` alongside legacy `'prod_65_fry_cut'`.
- `src/components/products/ProductCard.tsx` — Guarded `variants` array & optional `selectedVariant` dereferences.
- `src/pages/Home.tsx` — Added safe `(p.searchAliases || [])` and `(p.nameEn || '')` filtering guards.
- `src/pages/Shop.tsx` — Added safe `(p.searchAliases || [])`, `(p.variants || [])`, and empty-variant `getMinPrice` guards.
- `src/pages/ProductDetail.tsx` — Guarded `prod.variants` default fallback when variant list is empty.

### Added Files (2)
- `src/services/dtoNormalizers.ts` — Standalone snake_case & camelCase DTO normalization and payload unwrapping helpers (handles both SQLite D1 snake_case rows and Phase 3 camelCase JSON, JSON/CSV string arrays, `0/1` SQLite booleans, wrapped `{ products / categories / settings / data }` envelopes, and error envelopes).
- `tests/frontend-normalization.test.ts` — Unit tests covering raw D1 snake_case normalization, sparse/empty payloads, error/wrapped envelopes, and safe unconfigured Firebase module import behavior.

*(App A in `D:/sundar/Sd/raakky-app-a` was NOT modified.)*

---

## 3. Fix Implemented

1. **Defensive API Response Normalization (`dtoNormalizers.ts` + `api.ts`)**:
   - Both camelCase (Phase 3 Worker) and raw D1 snake_case (legacy `098cf79` Worker) responses now normalize cleanly into the typed `ShopSettings`, `Category`, and `Product` interfaces expected by React components, guaranteeing valid `supportedCuts`, `variants`, `searchAliases`, boolean flags, and `openingHours`.
   - Error payloads (`{ error: ... }`) and non-array/HTML responses are cleanly rejected by `unwrapArrayPayload` / `unwrapObjectPayload` rather than crashing `.map()`.
2. **Resilient Firebase Initialization (`firebase.ts` + `firebaseAuth.ts` + `AuthContext.tsx`)**:
   - Missing `VITE_FIREBASE_*` keys no longer throw uncaught top-level errors outside React's `ErrorBoundary`; public storefront browsing/cart works cleanly while auth actions display a clear configuration notice if keys are missing, and function normally once `VITE_FIREBASE_*` variables are supplied.
3. **Component Array & Variant Guards**:
   - Eliminated unguarded `[0]`, `.some()`, and `.map()` calls across `CuttingPreferencesModal`, `ProductCard`, `Home`, `Shop`, and `ProductDetail`.
4. **Cloudflare Pages Project Alignment (`wrangler.toml`)**:
   - Updated `name = "raakky-app-b"` to match `https://raakky-app-b.pages.dev` while retaining `DB` -> `raakky-db` (`1e7c05c7-608d-4aee-8977-20dedb4fc005`).

---

## 4. Tests & Build Verification Completed

All checks below ran cleanly after the final edit:

- **Automated Unit & Integration Tests** (`node --test "tests/frontend-normalization.test.ts" "tests/phase3-integration.test.ts"`):
  - **8 / 8 passed (0 failed, 0 skipped)** in `916.90ms`:
    - 4 tests in `tests/frontend-normalization.test.ts` (live snake_case normalization, sparse product fallbacks, wrapped/error envelope unwrapping, safe unconfigured Firebase startup).
    - 4 multi-step suites in `tests/phase3-integration.test.ts` (cryptographic RS256 Firebase JWT validation & key rotation, D1 customer UID integrity & anti-merge checks, server-authoritative order pricing/tamper/idempotency/ownership/CORS/rate-limiting, and shared-D1 App B -> App A E2E order acceptance, `RK-2026-XXXXXX` invoice, stock deduction, status progression, rejection, and payment recording).
- **TypeScript Verification**:
  - `npx tsc --noEmit`: Passed (`exit 0`).
  - `npx tsc -p tsconfig.functions.json --noEmit`: Passed (`exit 0`).
- **Production Build**:
  - `npm run build` (`tsc -b` + `vite build`): Passed (`1999 modules`, built in `6.46s`, `dist/assets/index-DfHUtIe3.js`).
- **Secret Hygiene Scan**:
  - Verified zero hardcoded Firebase API keys (`AIza...`), private keys, or `.env.local` exposures across all modified/untracked files (`SECRET_SCAN_CLEAN:12`).

---

## 5. Live API Verification

Verified read-only in browser network inspection:

- **Production (`https://raakky-app-b.pages.dev`, `main` @ `098cf79`)**:
  - `GET /api/health` -> `200` (`{"message":"Raakky Chicken API endpoint ready"}`)
  - `GET /api/categories` -> `200` (5 snake_case items: `name_en`, `display_order`, ...)
  - `GET /api/products` -> `200` (13 snake_case items: `category_id`, `name_en`, `supported_cuts` CSV string, `search_aliases_json`, `variants` array)
  - `GET /api/shop/settings` -> `200` (snake_case `shop_settings` row: `min_order_amount: 120`, `delivery_fee: 30`, `free_delivery_threshold: 499`, ...)
- **Preview (`https://phase-3-integration.raakky-app-b.pages.dev`, `phase-3-integration` @ `818f02d`)**:
  - `GET /api/health` -> `200` (`{"status":"ok","service":"raakky-app-b-api","databaseBound":true}`)
  - `GET /api/categories` -> `200` (5 camelCase items)
  - `GET /api/products` -> `200` (13 camelCase items with normalized `supportedCuts` array & `variants`)
  - `GET /api/shop/settings` -> `200` (16-key camelCase object including `openingHours`)

---

## 6. Customer Workflow & Cross-App Integration Verification (Local E2E + Browser QA)

Tested against the rebuilt App B production bundle (`dist/`) + `functions/api/[[route]].ts` + App A (`D:/sundar/Sd/raakky-app-a/dist` + `functions/api/[[route]].ts`) sharing a local SQLite `raakky-db` instance (`http://localhost:4174` & `http://localhost:4175`, torn down cleanly after QA):

1. **Homepage (`/`)**: Rendered 13 fresh cuts & categories cleanly (`HTTP 200`), zero `"Something went wrong"` errors, zero uncaught exceptions.
2. **Product Catalogue & Filtering (`/shop`)**: Verified `All (13)`, `Boneless (3)`, `Curry Cut (3)`, search `"Breast"` `(2)`, and filter reset `(13)`.
3. **Product Detail & Customisation**: Verified `/product/prod-breast` (`250g ₹85`, `500g ₹165`, `1 kg ₹320`, `Standard Butcher Cut`, `Boneless Cubes`) and `/product/prod-leg` (`1 kg ₹295`), plus `ProductCard` `Customise Your Cut` modal.
4. **Cart & Threshold Math (`/cart` + Cart Drawer)**: Verified add, increment/decrement, remove confirmation, `₹30` delivery fee under `₹499` (`₹285 + ₹30 = ₹315`, `₹405 + ₹30 = ₹435`), and `FREE DELIVERY` at/above `₹499` (`₹525`).
5. **Checkout UI & Firebase Auth (`/checkout`)**: Verified Firebase initialized cleanly with `.env.local` (zero `auth/invalid-api-key`), preserved cart on checkout (`4 items, ₹525`), and triggered Google Sign-In UI cleanly. *(Full interactive OAuth against `accounts.google.com` in headless Chromium stopped cleanly at the external Google login gate as expected.)*
6. **Responsive Mobile & Desktop Layout**: Verified `/`, `/shop`, `/product/prod-breast`, and `/cart` at **`360x800`**, **`390x844`**, **`430x932`**, and **`1280x800`** with zero unintended horizontal overflow (`scrollWidth <= innerWidth`) and zero failed image loads. *(Minor note: 1 non-visible placeholder `<img>` with `visible=false` exists on `/product/prod-breast` mobile layout.)*
7. **App B -> Shared D1 -> App A Integration**: Submitted verified RS256 test order `RK-ORD-2026-0043` (`QA Test Customer`, `qa.customer@raakky.test`, `+919843599031`, `Chicken Breast 500g × 2`, `Boneless Cubes`, `Skinless`, `Press Colony`, `₹360`, `PENDING` payment) via App B API -> logged into App A (`http://localhost:4175/orders`) -> verified all order/customer details rendered cleanly -> accepted order in App A UI -> verified `ACCEPTED` status and invoice `RK-2026-000001` creation with zero console or network errors.

---

## 7. Remaining Blockers & Exact Deployment Steps

### Remaining Blockers Before Live Production Works
1. **Cloudflare Pages Build Environment Variables (`CRITICAL`)**: Configure all 6 `VITE_FIREBASE_*` keys (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`) in **Cloudflare Pages -> `raakky-app-b` -> Settings -> Environment variables** for **both Production and Preview** environments.
2. **Firebase Console Settings**: Confirm `raakky-app-b.pages.dev` (and `phase-3-integration.raakky-app-b.pages.dev` if testing preview OTP/Google login) is listed under **Firebase Authentication -> Settings -> Authorized domains**, and Blaze billing / test phone numbers are enabled for `+91` Phone OTP.
3. **Commit & Promote Fix to Production (`main`)**: The fixes above are local in `D:/sundar/Sd/app b` on `phase-3-integration` and have not yet been committed, pushed, or merged into `main`.

### Exact Recommended Next Steps
1. Add the 6 `VITE_FIREBASE_*` environment variables in Cloudflare Pages (`raakky-app-b` Production & Preview).
2. Commit and push the local fixes on `phase-3-integration`, test https://phase-3-integration.raakky-app-b.pages.dev with live Google Sign-In & Phone OTP verification.
3. Merge `phase-3-integration` into `main` (via Pull Request on GitHub or `git merge`), triggering Cloudflare Pages to build and deploy both the fixed frontend and the Phase 3 `/functions/api/[[route]].ts` backend onto https://raakky-app-b.pages.dev.
4. Perform final live smoke checks on https://raakky-app-b.pages.dev (homepage catalog, `/shop`, `/product/prod-breast`, `/cart`, zero console errors).
