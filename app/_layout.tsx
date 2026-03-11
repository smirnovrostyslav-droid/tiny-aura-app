import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CartProvider } from '../services/cartContext';
import { WishlistProvider } from '../services/wishlistContext';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <CartProvider>
      <WishlistProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.white,
            },
            headerTintColor: Colors.black,
            headerTitleStyle: {
              fontWeight: '700',
            },
            contentStyle: {
              backgroundColor: Colors.white,
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="product/[handle]"
            options={{
              title: 'Product Details',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="collection/[handle]"
            options={{
              title: 'Collection',
              presentation: 'card',
            }}
          />
        </Stack>
      </WishlistProvider>
    </CartProvider>
  );
}
