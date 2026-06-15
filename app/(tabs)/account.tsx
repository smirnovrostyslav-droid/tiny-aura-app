import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import {
  login as shopifyLogin,
  logout as shopifyLogout,
  isLoggedIn,
  fetchCustomer,
  Customer,
} from '../../services/shopifyCustomerAccount';

const BURGUNDY = '#780b0c';
const HEADING_FONT = Platform.OS === 'web' ? 'Cormorant, serif' : 'serif';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!customer) loadSession();
    }, [customer])
  );

  async function loadSession() {
    try {
      if (await isLoggedIn()) {
        const c = await fetchCustomer();
        setCustomer(c);
      }
    } catch (e: any) {
      // Only logout on auth errors. Network/server errors leave tokens intact
      // so the user isn't kicked out by a transient offline state.
      const msg = String(e?.message || '');
      if (msg.includes('401') || msg.includes('Not authenticated') || msg.includes('invalid_grant')) {
        try { await shopifyLogout(); } catch (_) {}
      } else {
        console.warn('Session load failed (keeping tokens):', e);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    setAuthLoading(true);
    try {
      await shopifyLogin();
      const c = await fetchCustomer();
      setCustomer(c);
    } catch (e: any) {
      if (e?.message !== 'Sign in cancelled') {
        Alert.alert('Sign in failed', e?.message || 'Unknown error');
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try { await shopifyLogout(); } catch (_) {}
    setCustomer(null);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'Your local data (cart, wishlist, login) will be cleared from this device. To fully delete your account and personal data from our servers, please email support@kissofaroma.shop with the subject "Account Deletion Request".',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Local Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await shopifyLogout();
              await AsyncStorage.removeItem('@koa_wishlist');
              await AsyncStorage.removeItem('@koa-cart-id');
              setCustomer(null);
              router.replace('/(tabs)');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear local data. Please try again or contact support@kissofaroma.shop');
            }
          },
        },
      ]
    );
  }

  function handleRequestDataDeletion() {
    const subject = encodeURIComponent('Account Deletion Request');
    const body = encodeURIComponent('Hello,\n\nI would like to request the deletion of my account and all associated personal data.\n\nThank you.');
    Linking.openURL(`mailto:support@kissofaroma.shop?subject=${subject}&body=${body}`).catch((error) => {
      console.error('Error opening mail client:', error);
    });
  }

  async function openPolicy(url: string) {
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: '#780b0c',
        toolbarColor: '#ffffff',
      });
    } catch (error) {
      console.error('Error opening policy page:', error);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={BURGUNDY} />
      </View>
    );
  }

  // ── Logged In ──
  if (customer) {
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    const email = customer.emailAddress?.emailAddress || '';
    const orders = customer.orders?.edges || [];

    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{(firstName || email || 'K')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{firstName} {lastName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Orders</Text>
          {orders.length === 0 ? (
            <Text style={styles.noOrdersText}>No orders yet</Text>
          ) : (
            orders.map(({ node: order }) => (
              <View key={order.id} style={styles.orderRow}>
                <View>
                  <Text style={styles.orderNum}>Order #{order.number}</Text>
                  <Text style={styles.orderDate}>{new Date(order.processedAt).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.orderPrice}>
                    {order.totalPrice.currencyCode} {order.totalPrice.amount}
                  </Text>
                  <Text style={[styles.orderStatus, order.fulfillmentStatus === 'FULFILLED' && { color: '#22863a' }]}>
                    {order.fulfillmentStatus === 'FULFILLED' ? 'Delivered' :
                     order.fulfillmentStatus === 'IN_PROGRESS' ? 'Shipping' : 'Processing'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dataDeletionBtn} onPress={handleRequestDataDeletion}>
          <Text style={styles.dataDeletionText}>Request Data Deletion</Text>
        </TouchableOpacity>

        <View style={styles.policySection}>
          <TouchableOpacity style={styles.policyRow} onPress={() => openPolicy('https://kissofaroma.shop/policies/privacy-policy')}>
            <Text style={styles.policyText}>Privacy Policy</Text>
            <Text style={styles.policyArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.policyRow} onPress={() => openPolicy('https://kissofaroma.shop/policies/terms-of-service')}>
            <Text style={styles.policyText}>Terms of Service</Text>
            <Text style={styles.policyArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.policyRow, { borderBottomWidth: 0 }]} onPress={() => openPolicy('https://kissofaroma.shop/policies/shipping-policy')}>
            <Text style={styles.policyText}>Shipping Policy</Text>
            <Text style={styles.policyArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>Version 1.1.0</Text>
          <Text style={styles.footerText}>{'©'} 2026 Kiss of Aroma</Text>
        </View>
      </ScrollView>
    );
  }

  // ── Not Logged In ──
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarIcon}>{'👤'}</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome to Kiss of Aroma</Text>
        <Text style={styles.welcomeSub}>Sign in to track orders, save favorites, and more</Text>

        <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn} disabled={authLoading}>
          {authLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInBtnText}>SIGN IN WITH SHOP</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Sign in or create an account on kissofaroma.shop in one secure step
        </Text>
      </View>

      <View style={styles.section}>
        {[
          { icon: '🔒', title: '100% Authentic', sub: 'Guaranteed genuine fragrances' },
          { icon: '🚚', title: 'Free Shipping', sub: 'On US orders over $59' },
          { icon: '🎧', title: 'Expert Support', sub: 'We are here to help' },
        ].map((item, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={{ fontSize: 26 }}>{item.icon}</Text>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureSub}>{item.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.policySection}>
        <TouchableOpacity style={styles.policyRow} onPress={() => openPolicy('https://kissofaroma.shop/policies/privacy-policy')}>
          <Text style={styles.policyText}>Privacy Policy</Text>
          <Text style={styles.policyArrow}>{'>'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.policyRow} onPress={() => openPolicy('https://kissofaroma.shop/policies/terms-of-service')}>
          <Text style={styles.policyText}>Terms of Service</Text>
          <Text style={styles.policyArrow}>{'>'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.policyRow, { borderBottomWidth: 0 }]} onPress={() => openPolicy('https://kissofaroma.shop/policies/shipping-policy')}>
          <Text style={styles.policyText}>Shipping Policy</Text>
          <Text style={styles.policyArrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerInfo}>
        <Text style={styles.footerText}>Version 1.1.0</Text>
        <Text style={styles.footerText}>{'©'} 2026 Kiss of Aroma</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#f9f7f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: BURGUNDY,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: { color: '#fff', fontSize: 28, fontWeight: '700' },
  avatarIcon: { fontSize: 36 },
  welcomeText: {
    fontSize: 22, fontWeight: '600', color: '#000',
    fontFamily: HEADING_FONT,
    marginBottom: 6,
  },
  welcomeSub: { fontSize: 13, color: '#666', marginBottom: 20, textAlign: 'center' },
  helperText: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
  userName: { fontSize: 20, fontWeight: '700', color: '#000', fontFamily: HEADING_FONT },
  userEmail: { fontSize: 13, color: '#666', marginTop: 4 },

  signInBtn: {
    backgroundColor: BURGUNDY,
    paddingHorizontal: 40, paddingVertical: 13,
    borderRadius: 4, marginBottom: 10, width: '100%', alignItems: 'center',
  },
  signInBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  section: { padding: 16 },
  sectionTitle: {
    fontSize: 18, fontWeight: '600', color: '#000',
    fontFamily: HEADING_FONT,
    marginBottom: 12,
  },
  noOrdersText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 20 },

  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e6e6e6',
  },
  orderNum: { fontSize: 14, fontWeight: '600', color: '#000' },
  orderDate: { fontSize: 12, color: '#999', marginTop: 2 },
  orderPrice: { fontSize: 14, fontWeight: '700', color: '#000' },
  orderStatus: { fontSize: 12, color: '#d4a017', marginTop: 2 },

  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e6e6e6',
  },
  featureTitle: { fontSize: 15, fontWeight: '600', color: '#000' },
  featureSub: { fontSize: 12, color: '#888', marginTop: 2 },

  logoutBtn: {
    marginHorizontal: 16, marginTop: 10,
    paddingVertical: 14, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#cc0000', alignItems: 'center',
  },
  logoutText: { color: '#cc0000', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

  deleteBtn: { marginHorizontal: 16, marginTop: 14, paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
  deleteText: { color: '#999', fontSize: 13, textDecorationLine: 'underline' },

  dataDeletionBtn: { marginHorizontal: 16, marginTop: 8, paddingVertical: 10, borderRadius: 4, alignItems: 'center' },
  dataDeletionText: { color: BURGUNDY, fontSize: 13, textDecorationLine: 'underline' },

  policySection: {
    marginHorizontal: 16, marginTop: 20,
    borderTopWidth: 1, borderTopColor: '#e6e6e6',
    paddingTop: 8,
  },
  policyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e6e6e6',
  },
  policyText: { fontSize: 14, color: '#333' },
  policyArrow: { fontSize: 16, color: '#999' },

  footerInfo: { alignItems: 'center', padding: 24 },
  footerText: { fontSize: 12, color: '#bbb', marginBottom: 4 },
});
