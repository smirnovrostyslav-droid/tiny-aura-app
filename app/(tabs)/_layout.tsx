import { Tabs } from 'expo-router';
import { useCart } from '../../services/cartContext';
import { useWishlist } from '../../services/wishlistContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BURGUNDY = '#780b0c';

function TabIcon({ name, activeName, focused }: { name: string; activeName: string; focused: boolean }) {
  return (
    <Ionicons
      name={(focused ? activeName : name) as any}
      size={24}
      color={focused ? '#000' : '#999'}
    />
  );
}

export default function TabLayout() {
  const { getCartItemCount } = useCart();
  const { wishlist } = useWishlist();
  const cartCount = getCartItemCount();
  const wishlistCount = wishlist.length;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#999999',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#e6e6e6',
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
        tabBarBadgeStyle: {
          backgroundColor: BURGUNDY,
          fontSize: 10,
          minWidth: 18,
          height: 18,
          lineHeight: 18,
          borderRadius: 9,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home-outline" activeName="home" focused={focused} />,
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon name="search-outline" activeName="search" focused={focused} />,
          tabBarAccessibilityLabel: 'Search',
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ focused }) => <TabIcon name="heart-outline" activeName="heart" focused={focused} />,
          tabBarBadge: wishlistCount > 0 ? wishlistCount : undefined,
          tabBarAccessibilityLabel: wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => <TabIcon name="bag-outline" activeName="bag" focused={focused} />,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarAccessibilityLabel: cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon name="person-outline" activeName="person" focused={focused} />,
          tabBarAccessibilityLabel: 'Account',
        }}
      />
    </Tabs>
  );
}

