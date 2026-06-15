import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { CartProvider } from '../services/cartContext';
import { WishlistProvider } from '../services/wishlistContext';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';

// Required for expo-auth-session to dismiss the in-app browser after OAuth redirect.
WebBrowser.maybeCompleteAuthSession();

function AppContent() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1a1a1a',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[handle]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="collection/[handle]" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
    </>
  );
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{flex:1, justifyContent:'center', alignItems:'center', padding:32}}>
          <Text style={{fontSize:48, marginBottom:16}}>{'😵'}</Text>
          <Text style={{fontSize:20, fontWeight:'600', marginBottom:8}}>Something went wrong</Text>
          <Text style={{fontSize:14, color:'#666', textAlign:'center', marginBottom:24}}>Please restart the app</Text>
          <TouchableOpacity onPress={() => this.setState({hasError: false})} style={{backgroundColor:'#780b0c', paddingHorizontal:24, paddingVertical:12, borderRadius:12}}>
            <Text style={{color:'#fff', fontWeight:'700'}}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <CartProvider>
      <WishlistProvider>
        {Platform.OS === 'web' ? (
          <View style={styles.webContainer}>
            <View style={styles.mobileFrame}>
              <AppContent />
            </View>
          </View>
        ) : (
          <AppContent />
        )}
      </WishlistProvider>
    </CartProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
  },
  mobileFrame: {
    width: 390,
    maxWidth: 390,
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    // Shadow for the phone frame effect
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 30px rgba(0,0,0,0.15)',
    } : {}),
  },
});
