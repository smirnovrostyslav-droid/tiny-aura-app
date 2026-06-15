// Shopify Customer Account API — OAuth 2.0 + PKCE (manual flow via WebBrowser)
// Docs: https://shopify.dev/docs/api/customer
//
// Why manual flow instead of AuthRequest.promptAsync:
//   Shopify's Headless channel Customer Account API rejects custom URL schemes
//   in callback registration ("Redirect uri is not secured"). We must register
//   an HTTPS callback. But for native mobile OAuth, the system needs a custom
//   scheme to intercept the redirect and return control to the app.
//
// Solution: HTTPS bridge page
//   1. App opens authUrl with redirect_uri=https://kissofaroma.shop/pages/mobile-auth-callback
//   2. Shopify completes OAuth and redirects to that HTTPS page
//   3. Bridge page (HTML+JS hosted in Shopify) does window.location.replace("shop.71650345091://callback?...")
//   4. iOS ASWebAuthenticationSession / Android Custom Tab intercepts the custom scheme and closes
//   5. We get the code in app and exchange for tokens
//
// Token exchange uses HTTPS_REDIRECT_URI (must exactly match what Shopify saw).

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

// ── Config ────────────────────────────────────────────────────────────────────
export const SHOP_ID = '71650345091';
// Customer Account API client ID from Shopify Admin → Headless channel → Customer Account API
export const CLIENT_ID = '07a6317e-9599-4f39-98bd-f50f86ada2a2';

// Endpoints — kissofaroma.shop's customer-account subdomain (shown in Headless config)
const AUTH_BASE = 'https://account.kissofaroma.shop/authentication';
const AUTHORIZE_URL = `${AUTH_BASE}/oauth/authorize`;
const TOKEN_URL = `${AUTH_BASE}/oauth/token`;
const LOGOUT_URL = `${AUTH_BASE}/logout`;
// GraphQL endpoint is on shopify.com (not the customer-account subdomain).
// account.kissofaroma.shop is only for OAuth (authorize/token/logout).
const GRAPHQL_URL = `https://shopify.com/${SHOP_ID}/account/customer/api/2026-04/graphql`;

// HTTPS bridge — registered in Shopify Headless Customer Account API config.
// Page at /pages/mobile-auth-callback redirects to APP_SCHEME_REDIRECT.
const HTTPS_REDIRECT_URI = 'https://kissofaroma.shop/pages/mobile-auth-callback';
const APP_SCHEME_REDIRECT = `shop.${SHOP_ID}://callback`;

// SecureStore keys
const K_ACCESS = 'koa_cust_access_token';
const K_REFRESH = 'koa_cust_refresh_token';
const K_EXPIRES_AT = 'koa_cust_expires_at';
const K_ID_TOKEN = 'koa_cust_id_token';

// ── PKCE helpers ──────────────────────────────────────────────────────────────
function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa !== 'undefined' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeVerifier(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return base64UrlEncode(bytes);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return base64UrlEncode(bytes);
}

async function randomString(byteLen = 16): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLen);
  return base64UrlEncode(bytes);
}

// ── Token storage ─────────────────────────────────────────────────────────────
type TokenSet = {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_at: number; // unix seconds
};

async function saveTokens(t: TokenSet) {
  await SecureStore.setItemAsync(K_ACCESS, t.access_token);
  await SecureStore.setItemAsync(K_REFRESH, t.refresh_token);
  await SecureStore.setItemAsync(K_EXPIRES_AT, String(t.expires_at));
  if (t.id_token) await SecureStore.setItemAsync(K_ID_TOKEN, t.id_token);
}

async function loadTokens(): Promise<TokenSet | null> {
  const access_token = await SecureStore.getItemAsync(K_ACCESS);
  const refresh_token = await SecureStore.getItemAsync(K_REFRESH);
  const expires = await SecureStore.getItemAsync(K_EXPIRES_AT);
  if (!access_token || !refresh_token || !expires) return null;
  const id_token = (await SecureStore.getItemAsync(K_ID_TOKEN)) || undefined;
  return { access_token, refresh_token, id_token, expires_at: parseInt(expires, 10) };
}

async function clearTokens() {
  await SecureStore.deleteItemAsync(K_ACCESS);
  await SecureStore.deleteItemAsync(K_REFRESH);
  await SecureStore.deleteItemAsync(K_EXPIRES_AT);
  await SecureStore.deleteItemAsync(K_ID_TOKEN);
}

// ── OAuth: login ──────────────────────────────────────────────────────────────
export async function login(): Promise<TokenSet> {
  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = await randomString(16);
  const nonce = await randomString(16);

  // Scope must match what's enabled in Shopify Admin → Headless → Customer Account API → Permissions.
  // Using individual scope names rather than ".../customer-account-api/full" because the
  // Headless config has only specific scopes enabled, not the catch-all "full" scope.
  const scope = [
    'openid',
    'email',
    'customer-account-api:full',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope,
    redirect_uri: HTTPS_REDIRECT_URI,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  // URLSearchParams encodes spaces as "+", but Shopify's OAuth requires "%20" for the scope param.
  // Replace "+" with "%20" in the entire query string (safe because real "+" chars would be "%2B").
  const authUrl = `${AUTHORIZE_URL}?${params.toString().replace(/\+/g, '%20')}`;

  // Open in-app browser. Listen for the custom scheme that the bridge page redirects to.
  const result = await WebBrowser.openAuthSessionAsync(authUrl, APP_SCHEME_REDIRECT);

  if (result.type !== 'success' || !result.url) {
    throw new Error(
      result.type === 'cancel' || result.type === 'dismiss'
        ? 'Sign in cancelled'
        : `Sign in failed: ${result.type}`
    );
  }

  // Parse query params from the custom-scheme callback URL.
  // `new URL(...)` handles custom schemes in Hermes/JSC.
  const callbackUrl = new URL(result.url);
  const code = callbackUrl.searchParams.get('code');
  const returnedState = callbackUrl.searchParams.get('state');
  const error = callbackUrl.searchParams.get('error');

  if (error) {
    const desc = callbackUrl.searchParams.get('error_description');
    throw new Error(`Shopify auth error: ${desc || error}`);
  }
  if (!code) throw new Error('No authorization code returned');
  if (returnedState !== state) throw new Error('State mismatch — possible CSRF');

  const tokens = await exchangeCodeForToken(code, verifier);
  await saveTokens(tokens);
  return tokens;
}

async function exchangeCodeForToken(code: string, verifier: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    redirect_uri: HTTPS_REDIRECT_URI,
    code,
    code_verifier: verifier,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    id_token: json.id_token,
    expires_at: Math.floor(Date.now() / 1000) + (json.expires_in || 3600) - 60,
  };
}

async function refreshAccessToken(refresh_token: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const tokens: TokenSet = {
    access_token: json.access_token,
    refresh_token: json.refresh_token || refresh_token,
    id_token: json.id_token,
    expires_at: Math.floor(Date.now() / 1000) + (json.expires_in || 3600) - 60,
  };
  await saveTokens(tokens);
  return tokens;
}

export async function getValidAccessToken(): Promise<string | null> {
  const t = await loadTokens();
  if (!t) return null;
  if (Date.now() / 1000 < t.expires_at) return t.access_token;
  try {
    const refreshed = await refreshAccessToken(t.refresh_token);
    return refreshed.access_token;
  } catch {
    await clearTokens();
    return null;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const t = await loadTokens();
  return !!t;
}

export async function logout(): Promise<void> {
  const t = await loadTokens();
  await clearTokens();
  if (t?.id_token) {
    const url =
      `${LOGOUT_URL}?` +
      new URLSearchParams({
        id_token_hint: t.id_token,
        post_logout_redirect_uri: HTTPS_REDIRECT_URI,
      }).toString();
    try {
      await fetch(url);
    } catch {
      // best-effort — local tokens already cleared
    }
  }
}

// ── GraphQL ───────────────────────────────────────────────────────────────────
export async function graphql<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphQL ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors.map((e: any) => e.message).join('; ')}`);
  }
  return json.data;
}

// ── Customer queries ──────────────────────────────────────────────────────────
export type Customer = {
  id: string;
  emailAddress: { emailAddress: string } | null;
  firstName: string | null;
  lastName: string | null;
  orders: {
    edges: Array<{
      node: {
        id: string;
        number: number;
        processedAt: string;
        financialStatus: string | null;
        fulfillmentStatus: string | null;
        totalPrice: { amount: string; currencyCode: string };
      };
    }>;
  };
};

export async function fetchCustomer(): Promise<Customer> {
  const data = await graphql<{ customer: Customer }>(`
    query CustomerProfile {
      customer {
        id
        firstName
        lastName
        emailAddress { emailAddress }
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              number
              processedAt
              financialStatus
              fulfillmentStatus
              totalPrice { amount currencyCode }
            }
          }
        }
      }
    }
  `);
  return data.customer;
}
