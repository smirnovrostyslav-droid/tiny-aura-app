import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWishlist } from '../../services/wishlistContext';
import { ShopifyProduct } from '../../types/shopify';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { ProductCard } from '../../components/ProductCard';
import { getCollectionProducts } from '../../services/shopify';

export default function WishlistScreen() {
  const router = useRouter();
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlistProducts();
  }, [wishlist]);

  async function loadWishlistProducts() {
    if (wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      // Load products from new-arrivals collection as a demo
      // In production, you'd fetch products by IDs
      const allProducts = await getCollectionProducts('new-arrivals').catch(() => []);
      const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));
      setProducts(wishlistProducts);
    } catch (error) {
      console.error('Error loading wishlist products:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>❤️</Text>
        <Text style={styles.emptyText}>Your wishlist is empty</Text>
        <Text style={styles.emptySubtext}>
          Save your favorite fragrances here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.handle}`)}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.heading,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.body,
    textAlign: 'center',
  },
  listContent: {
    padding: Spacing.xs,
  },
  productItem: {
    width: '50%',
  },
});
