import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Toast } from '../../components/Toast';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWishlist } from '../../services/wishlistContext';
import { useCart } from '../../services/cartContext';
import { ShopifyProduct } from '../../types/shopify';
import { ProductCard } from '../../components/ProductCard';
import { getProductsByIds } from '../../services/shopify';

const BURGUNDY = '#780b0c';
const HEADING_FONT = Platform.OS === 'web' ? 'Cormorant, serif' : 'serif';

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wishlist } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  // Only start in loading state if there's actually something to fetch.
  // Otherwise an empty wishlist sits on the spinner forever (useEffect bails
  // early when the key hasn't changed from "").
  const [loading, setLoading] = useState(wishlist.length > 0);
  const [refreshing, setRefreshing] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState({ visible: false, message: '' });
  const prevWishlistKey = useRef('');

  useEffect(() => {
    const key = wishlist.slice().sort().join(',');
    if (key === prevWishlistKey.current) return;
    prevWishlistKey.current = key;
    loadWishlistProducts();
  }, [wishlist]);

  async function loadWishlistProducts() {
    if (wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const wishlistProducts = await getProductsByIds(wishlist);
      setProducts(wishlistProducts);
    } catch (error) {
      console.error('Error loading wishlist products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadWishlistProducts();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={BURGUNDY} />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.emptyEmoji}>{'🤍'}</Text>
        <Text style={styles.emptyText}>No favorites yet</Text>
        <Text style={styles.emptySubtext}>
          Tap the heart on any fragrance you love and we'll save it here for later.
        </Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.85}
        >
          <Text style={styles.browseBtnText}>BROWSE FRAGRANCES</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <Text style={styles.headerCount}>{products.length} {products.length === 1 ? 'item' : 'items'}</Text>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        actionLabel="View Cart"
        actionRoute="/(tabs)/cart"
        onHide={() => setToast({ visible: false, message: '' })}
      />

      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const firstVariantId = item.variants?.edges?.[0]?.node?.id;
          const isAdding = addingIds.has(item.id);
          return (
            <View style={styles.productItem}>
              <ProductCard
                product={item}
                onPress={() => router.push(`/product/${item.handle}`)}
              />
              {firstVariantId && (
                <TouchableOpacity
                  style={[styles.addToCartBtn, isAdding && { opacity: 0.7 }]}
                  onPress={async () => {
                    if (isAdding) return;
                    setAddingIds((prev) => new Set(prev).add(item.id));
                    try {
                      await addToCart(firstVariantId, 1);
                      setToast({ visible: true, message: `${item.title} added to cart` });
                    } catch {
                      setToast({ visible: true, message: 'Could not add to cart' });
                    } finally {
                      setAddingIds((prev) => {
                        const next = new Set(prev);
                        next.delete(item.id);
                        return next;
                      });
                    }
                  }}
                  disabled={isAdding}
                  activeOpacity={0.7}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addToCartText}>+ Add to Cart</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#780b0c" colors={['#780b0c']} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    fontFamily: HEADING_FONT,
  },
  headerCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: HEADING_FONT,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 28,
  },
  browseBtn: {
    backgroundColor: BURGUNDY,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 4,
    minWidth: 240,
    alignItems: 'center',
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  listContent: {
    padding: 4,
  },
  productItem: {
    width: '50%',
  },
  addToCartBtn: {
    backgroundColor: '#780b0c',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
