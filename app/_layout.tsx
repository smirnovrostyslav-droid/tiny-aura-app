import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CartProvider } from '../services/cartContext';
import { WishlistProvider } from '../services/wishlistContext';
import { View, Platform, StyleSheet } from 'react-native';

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
        <Stack.Screen name="product/[handle]" options={{ title: 'Product Details', presentation: 'card' }} />
        <Stack.Screen name="collection/[handle]" options={{ title: 'Collection', presentation: 'card' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
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
