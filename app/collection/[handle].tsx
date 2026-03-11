import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShopifyProduct } from '../../types/shopify';
import { getCollectionProducts } from '../../services/shopify';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { ProductCard } from '../../components/ProductCard';

export default function CollectionScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (handle) {
      loadProducts();
    }
  }, [handle]);

  async function loadProducts() {
    try {
      const data = await getCollectionProducts(handle);
      setProducts(data);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyText}>No products found</Text>
        <Text style={styles.emptySubtext}>Check back later for new arrivals</Text>
      </View>
    );
  }

  const collectionTitle = handle
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <View style={styles.container}>
      {/* Shop All Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.shopAllButton}>
          <Text style={styles.shopAllButtonText}>
            SHOP ALL {collectionTitle.toUpperCase()}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.filterRow}>
          <Text style={styles.productCount}>
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Sort & Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.handle}`)}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  emptyContainer: {
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
  headerContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  shopAllButton: {
    backgroundColor: Colors.black,
    margin: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: 25,
    alignItems: 'center',
  },
  shopAllButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  productCount: {
    ...Typography.body,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.black,
  },
  listContent: {
    padding: Spacing.xs,
  },
  productItem: {
    flex: 1 / 2,
  },
});
