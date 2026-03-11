import { Tabs } from 'expo-router';
import { useCart } from '../../services/cartContext';
import { useWishlist } from '../../services/wishlistContext';
import { Text, View, StyleSheet } from 'react-native';

// Tab icons as simple Unicode — works perfectly on web
const TAB_ICONS = {
  home: { active: '🏠', inactive: '🏠' },
  search: { active: '🔍', inactive: '🔍' },
  heart: { active: '❤️', inactive: '🤍' },
  cart: { active: '🛍️', inactive: '🛍️' },
  account: { active: '👤', inactive: '👤' },
};

function TabEmoji({ icon, focused }: { icon: { active: string; inactive: string }; focused: boolean }) {
  return (
    <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.45 }]}>
      {focused ? icon.active : icon.inactive}
    </Text>
  );
}

export default function TabLayout() {
  const { getCartItemCount } = useCart();
  const { wishlist } = useWishlist();
  const cartCount = getCartItemCount();
  const wishlistCount = wishlist.length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1a1a1a',
        tabBarInactiveTintColor: '#999999',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EEEEEE',
          borderTopWidth: 1,
          height: 52,
          paddingBottom: 4,
          paddingTop: 6,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabEmoji icon={TAB_ICONS.home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabEmoji icon={TAB_ICONS.search} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ focused }) => <TabEmoji icon={TAB_ICONS.heart} focused={focused} />,
          tabBarBadge: wishlistCount > 0 ? wishlistCount : undefined,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => <TabEmoji icon={TAB_ICONS.cart} focused={focused} />,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabEmoji icon={TAB_ICONS.account} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabEmoji: {
    fontSize: 22,
  },
});
