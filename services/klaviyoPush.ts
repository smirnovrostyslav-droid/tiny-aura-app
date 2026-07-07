// Klaviyo push notifications integration.
// Docs: https://github.com/klaviyo/klaviyo-react-native-sdk + klaviyo-expo-plugin
//
// Flow:
//   1. initKlaviyo()      — call once at app start (Klaviyo.initialize with public key)
//   2. registerForPush()  — request notification permission, get the device push token
//                           (FCM on Android / APNs on iOS), hand it to Klaviyo
//   3. useKlaviyoPushHandlers() — listens for notification taps and deep-links into the app
//   4. identify(email)    — link the device/profile to a customer (call after OAuth login)
//   5. resetProfile()     — clear the profile (call on logout)
//
// Open-tracking ("Opened Push" event) is handled NATIVELY by the klaviyo-expo-plugin
// (openTracking:true on Android, Notification Service Extension on iOS) — no JS needed.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Klaviyo, type Profile } from 'klaviyo-react-native-sdk';

// Public API key (site ID) for the Kiss of Aroma Klaviyo account. Safe to ship client-side.
const KLAVIYO_PUBLIC_API_KEY = 'XHwSUt';

let initialized = false;

export function initKlaviyo(): void {
  if (initialized) return;
  try {
    Klaviyo.initialize(KLAVIYO_PUBLIC_API_KEY);
    initialized = true;
  } catch (e) {
    console.warn('Klaviyo initialize failed', e);
  }
}

/**
 * Ask for notification permission and register the device push token with Klaviyo.
 * Safe to call on every app launch — it no-ops if permission is denied.
 * Returns true if a token was registered.
 */
export async function registerForPush(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    let granted =
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
      const req = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      granted =
        req.granted ||
        req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }

    if (!granted) {
      console.log('Notification permission not granted');
      return false;
    }

    // Device push token = raw FCM token (Android) / APNs token (iOS) — what Klaviyo needs.
    const token = await Notifications.getDevicePushTokenAsync();
    if (token?.data) {
      Klaviyo.setPushToken(String(token.data));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('registerForPush failed', e);
    return false;
  }
}

/** Link the current device/profile to a signed-in customer. Call after OAuth login. */
export function identify(email: string, firstName?: string, lastName?: string): void {
  if (!email) return;
  try {
    const profile: Profile = { email };
    if (firstName) (profile as any).firstName = firstName;
    if (lastName) (profile as any).lastName = lastName;
    Klaviyo.setProfile(profile);
  } catch (e) {
    console.warn('Klaviyo identify failed', e);
  }
}

/** Clear the tracked profile (call on logout). */
export function resetProfile(): void {
  try {
    Klaviyo.resetProfile();
  } catch (e) {
    console.warn('Klaviyo resetProfile failed', e);
  }
}

/**
 * Resolve a URL from a tapped push / tracking link into an in-app route.
 * Handles Klaviyo universal tracking links first, then normal deep links.
 * Returns a router path to navigate to, or null.
 */
export function resolvePushUrl(url: string): string | null {
  if (!url) return null;
  try {
    // Let Klaviyo track + resolve its own tracking links; it re-emits the destination URL.
    if (Klaviyo.handleUniversalTrackingLink(url)) {
      return null; // Klaviyo will redirect; the destination arrives via the linking listener.
    }
  } catch {
    // handleUniversalTrackingLink only exists on SDK >= 2.1.0; ignore if absent.
  }

  // Map a destination URL to an app route. Supports our custom scheme and https deep links.
  // Examples we understand: kissofaroma://product/<handle>, https://kissofaroma.shop/products/<handle>
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts[0] === 'product' || parts[0] === 'products') {
      return parts[1] ? `/product/${parts[1]}` : '/(tabs)';
    }
    if (parts[0] === 'collection' || parts[0] === 'collections') {
      return parts[1] ? `/collection/${parts[1]}` : '/collection/all';
    }
  } catch {
    // not a parseable URL
  }
  return '/(tabs)';
}

export { Notifications };
