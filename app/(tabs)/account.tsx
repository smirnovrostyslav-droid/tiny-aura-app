import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { customerLogin, customerRegister, getCustomer } from '../../services/shopify';

const TOKEN_KEY = '@tiny_aura_customer_token';

type AuthMode = 'login' | 'register';
type CustomerData = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  orders: Array<{
    id: string;
    orderNumber: number;
    totalPrice: string;
    processedAt: string;
    fulfillmentStatus: string;
  }>;
};

export default function AccountScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showAuth, setShowAuth] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        const data = await getCustomer(savedToken);
        setToken(savedToken);
        setCustomer(data);
      }
    } catch (e) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setAuthError('');
    setAuthLoading(true);
    try {
      const { token: newToken } = await customerLogin(email, password);
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      const data = await getCustomer(newToken);
      setToken(newToken);
      setCustomer(data);
      setShowAuth(false);
      setEmail('');
      setPassword('');
    } catch (e: any) {
      setAuthError(e.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister() {
    setAuthError('');
    if (!firstName.trim() || !lastName.trim()) {
      setAuthError('Please fill in all fields');
      return;
    }
    setAuthLoading(true);
    try {
      await customerRegister(email, password, firstName, lastName);
      // Auto-login after registration
      const { token: newToken } = await customerLogin(email, password);
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      const data = await getCustomer(newToken);
      setToken(newToken);
      setCustomer(data);
      setShowAuth(false);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
    } catch (e: any) {
      setAuthError(e.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCustomer(null);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#770a0c" />
      </View>
    );
  }

  // ── Auth Form ──
  if (showAuth) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.authContainer}>
        <Text style={styles.authTitle}>{authMode === 'login' ? 'Sign In' : 'Create Account'}</Text>
        <Text style={styles.authSub}>
          {authMode === 'login' ? 'Sign in to your Tiny Aura account' : 'Join Tiny Aura for the best fragrance experience'}
        </Text>

        {authMode === 'register' && (
          <>
            <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
            <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
          </>
        )}
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

        <TouchableOpacity style={styles.authBtn} onPress={authMode === 'login' ? handleLogin : handleRegister} disabled={authLoading}>
          {authLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authBtnText}>{authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>
          <Text style={styles.switchText}>
            {authMode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowAuth(false)} style={{ marginTop: 20 }}>
          <Text style={styles.switchText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Logged In ──
  if (customer) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{(customer.firstName || 'T')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{customer.firstName} {customer.lastName}</Text>
          <Text style={styles.userEmail}>{customer.email}</Text>
        </View>

        {/* Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Orders</Text>
          {customer.orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet</Text>
          ) : (
            customer.orders.map((order) => (
              <View key={order.id} style={styles.orderRow}>
                <View>
                  <Text style={styles.orderNum}>Order #{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{new Date(order.processedAt).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.orderPrice}>{order.totalPrice}</Text>
                  <Text style={[styles.orderStatus, order.fulfillmentStatus === 'FULFILLED' && { color: 'green' }]}>
                    {order.fulfillmentStatus === 'FULFILLED' ? 'Delivered' : order.fulfillmentStatus === 'IN_PROGRESS' ? 'Shipping' : 'Processing'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Tiny Aura</Text>
        </View>
      </ScrollView>
    );
  }

  // ── Not Logged In ──
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarIcon}>👤</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome to Tiny Aura</Text>
        <Text style={styles.welcomeSub}>Sign in to track orders, save favorites, and more</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => { setShowAuth(true); setAuthMode('login'); }}>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createBtn} onPress={() => { setShowAuth(true); setAuthMode('register'); }}>
          <Text style={styles.createBtnText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {[
          { icon: '🔒', title: '100% Authentic', sub: 'Guaranteed genuine fragrances' },
          { icon: '🚚', title: 'Fast Shipping', sub: 'Free over $50' },
          { icon: '🎧', title: 'Expert Support', sub: 'We are here to help' },
        ].map((item, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={{ fontSize: 28 }}>{item.icon}</Text>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureSub}>{item.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>© 2025 Tiny Aura</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  // Header
  header: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, backgroundColor: '#f9f5f0' },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarLetter: { color: '#fff', fontSize: 28, fontWeight: '700' },
  avatarIcon: { fontSize: 36 },
  welcomeText: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  welcomeSub: { fontSize: 13, color: '#666', marginBottom: 18, textAlign: 'center' },
  userName: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  userEmail: { fontSize: 13, color: '#666', marginTop: 4 },

  // Buttons
  signInBtn: { backgroundColor: '#770a0c', paddingHorizontal: 40, paddingVertical: 13, borderRadius: 8, marginBottom: 10, width: '100%', alignItems: 'center' },
  signInBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  createBtn: { backgroundColor: '#fff', paddingHorizontal: 40, paddingVertical: 13, borderRadius: 8, borderWidth: 1.5, borderColor: '#1a1a1a', width: '100%', alignItems: 'center' },
  createBtnText: { color: '#1a1a1a', fontSize: 14, fontWeight: '700' },

  // Section
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 20 },

  // Orders
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  orderNum: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  orderDate: { fontSize: 12, color: '#999', marginTop: 2 },
  orderPrice: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  orderStatus: { fontSize: 12, color: '#e89b00', marginTop: 2 },

  // Features
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  featureTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  featureSub: { fontSize: 12, color: '#888', marginTop: 2 },

  // Auth form
  authContainer: { padding: 24, paddingTop: 40 },
  authTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  authSub: { fontSize: 14, color: '#666', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'web' ? 14 : 12, fontSize: 15, marginBottom: 12, backgroundColor: '#fafafa',
  },
  errorText: { color: '#cc0000', fontSize: 13, marginBottom: 10 },
  authBtn: { backgroundColor: '#770a0c', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  authBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  switchText: { color: '#770a0c', fontSize: 14, textAlign: 'center' },

  // Logout
  logoutBtn: { marginHorizontal: 16, marginTop: 10, paddingVertical: 14, borderRadius: 8, borderWidth: 1.5, borderColor: '#cc0000', alignItems: 'center' },
  logoutText: { color: '#cc0000', fontSize: 14, fontWeight: '700' },

  // Footer
  footer: { alignItems: 'center', padding: 24 },
  footerText: { fontSize: 12, color: '#bbb', marginBottom: 4 },
});
