import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useCart } from '../../services/cartContext';
import { useWishlist } from '../../services/wishlistContext';
import { Text, View, Image, StyleSheet } from 'react-native';

// Navigation icons generated via Nano Banana (Gemini)
const NAV_ICONS = {
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
      style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
      resizeMode="contain"
    />
  );
}

function TabBarBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
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
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.mediumGray,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.lightGray,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTintColor: Colors.black,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon source={NAV_ICONS.home} focused={focused} />,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Categories',
          tabBarIcon: ({ focused }) => <TabIcon source={NAV_ICONS.search} focused={focused} />,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ focused }) => <TabIcon source={NAV_ICONS.heart} focused={focused} />,
          tabBarBadge: wishlistCount > 0 ? wishlistCount : undefined,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => <TabIcon source={NAV_ICONS.cart} focused={focused} />,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon source={NAV_ICONS.account} focused={focused} />,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
  },
  badge: {
    position: 'absolute',
    right: -10,
    top: -5,
    backgroundColor: Colors.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
