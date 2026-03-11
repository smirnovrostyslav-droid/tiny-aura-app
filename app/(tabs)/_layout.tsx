import { Tabs } from 'expo-router';
import { useCart } from '../../services/cartContext';
import { useWishlist } from '../../services/wishlistContext';
import { Text, View, Image, StyleSheet } from 'react-native';

// Navigation icons — line style, from the design screenshot
const NAV = {
  home: require('../../assets/icons/nav_home.png'),
  search: require('../../assets/icons/nav_search.png'),
  heart: require('../../assets/icons/nav_heart.png'),
  cart: require('../../assets/icons/nav_cart.png'),
  account: require('../../assets/icons/nav_account.png'),
};

function TabIcon({ source, focused }: { source: any; focused: boolean }) {
  return (
    <Image
      source={source}
      style={[styles.icon, { opacity: focused ? 1 : 0.4 }]}
      resizeMode="contain"
    />
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
          height: 56,
          paddingBottom: 4,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon source={NAV.home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon source={NAV.search} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ focused }) => <TabIcon source={NAV.heart} focused={focused} />,
          tabBarBadge: wishlistCount > 0 ? wishlistCount : undefined,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => <TabIcon source={NAV.cart} focused={focused} />,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon source={NAV.account} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
    tintColor: '#1a1a1a',
  },
});
