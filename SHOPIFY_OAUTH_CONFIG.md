# Shopify Customer Account API — OAuth Config (WORKING)

## ACTIVE Credentials (Shopify Admin → Headless channel → Customer Account API)
- **Client ID:** 07a6317e-9599-4f39-98bd-f50f86ada2a2
- **Shop ID:** 71650345091
- **Store:** 0uaabs-ta.myshopify.com / kissofaroma.shop
- **NOTE:** This is the Headless storefront's Customer Account API client — NOT the
  Dev Dashboard Admin OAuth client (d283faa96a1edce9b3010bcb8a5af652, unused for login).
  Find it at: Shopify Admin → Headless → Kiss Of Aroma Headless → Customer Account API.

## OAuth Endpoints (account.kissofaroma.shop)
- Authorization: https://account.kissofaroma.shop/authentication/oauth/authorize
- Token:         https://account.kissofaroma.shop/authentication/oauth/token
- Logout:        https://account.kissofaroma.shop/authentication/logout
- GraphQL API:   https://shopify.com/71650345091/account/customer/api/2026-04/graphql
  (⚠️ GraphQL is on shopify.com/{shop_id}/..., NOT account.kissofaroma.shop — that 404s)

## OAuth request params (what actually works)
- scope: `openid email customer-account-api:full`
  (⚠️ NOT the full URI `https://api.customer.shopify.com/...` — that returns "scope invalid")
- redirect_uri: `https://kissofaroma.shop/pages/mobile-auth-callback` (the HTTPS bridge, below)
- PKCE: S256, code_challenge + code_verifier (manual, via expo-crypto)
- Query string: encode spaces as %20 (URLSearchParams default "+" breaks the scope param)

## HTTPS Bridge (workaround for "Redirect uri is not secured")
Shopify Customer Account API ("Public web app" client) rejects custom URL schemes in the
callback registration. Native mobile needs a custom scheme to intercept the redirect. Fix:
- Bridge page: https://kissofaroma.shop/pages/mobile-auth-callback
  Body JS: `window.location.replace("shop.71650345091://callback?" + window.location.search.substring(1))`
- Registered as Callback URI + Logout URI in the Headless Customer Account API config.
- Flow: app → authorize (redirect_uri=HTTPS bridge) → Shopify → bridge page →
  custom-scheme redirect → ASWebAuthenticationSession intercepts → app gets code.
- Page created via Shopify Admin REST API (pageCreate + PUT body_html — REST keeps the
  <script>; GraphQL pageCreate strips it).

## Status (2026-05-28) — PUBLISHED
- 🍎 iOS 1.1.0 (build 8): LIVE in App Store (READY_FOR_SALE)
- 🍎 iOS 1.1.1 (build 9): submitted, WAITING_FOR_REVIEW (auto-publishes on approval)
- 🤖 Android 1.1.1 (versionCode 7): submitted to Google Play, under review
  (managed publishing OFF → auto-publishes to 100% on approval)
- ⚠️ Old package Tiny Aura (us.tinyaura.app) is BLOCKED by Google — that's why
  Kiss of Aroma uses a fresh package (shop.kissofaroma.app).

## Key Files
- services/shopifyCustomerAccount.ts — OAuth (manual WebBrowser + PKCE) + GraphQL helper
- app/(tabs)/account.tsx — UI (one-button "Sign in with Shop" + profile/orders)
- app/_layout.tsx — WebBrowser.maybeCompleteAuthSession()
- app.json — scheme ["kissofaroma","shop.71650345091"], version 1.1.1
- .npmrc — legacy-peer-deps=true (required for EAS Build `npm ci`)
- scripts/asc.py — App Store Connect API automation (create version, attach build,
  set release notes, submit for review). Reads creds from eas.json.

## How to ship the next update
- iOS:     `eas build -p ios --auto-submit` → then `python3 scripts/asc.py` flow, OR
           bump app.json version, build, `eas submit -p ios --latest`, then create/submit
           App Store version via scripts/asc.py.
- Android: bump versionCode, `eas build -p android`, download AAB, upload in Play Console
           production track (no Google Service Account configured yet — see below).

## TODO (optional)
- Google Service Account for `eas submit -p android` automation (one-time setup in
  Google Cloud Console → JSON key → grant access in Play Console → eas.json
  submit.production.android.serviceAccountKeyPath). Until then, Android AAB upload is manual.
