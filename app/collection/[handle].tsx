import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShopifyProduct } from '../../types/shopify';
import { getCollectionProducts } from '../../services/shopify';
import { ProductCard } from '../../components/ProductCard';
import { Ionicons } from '@expo/vector-icons';

const BURGUNDY = '#780b0c';
const HEADING_FONT = Platform.OS === 'web' ? 'Cormorant, serif' : 'serif';

export default function CollectionScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (handle) {
      setLoading(true);
      setProducts([]);
      loadProducts();
    }
  }, [handle]);

  async function loadProducts() {
    if (!handle) return;
    try {
      const data = await getCollectionProducts(handle);
      setProducts(data);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    if (!handle) return;
    setRefreshing(true);
    try {
      const data = await getCollectionProducts(handle);
      setProducts(data);
    } catch (error) {
      console.error('Error refreshing collection:', error);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={BURGUNDY} />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>{'📦'}</Text>
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
      {/* Navigation Header */}
      <View style={[styles.navHeader, { paddingTop: Platform.OS === 'web' ? 8 : insets.top + 8 }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => {
          if (Platform.OS === 'web' && window.history.length > 1) {
            window.history.back();
          } else {
            router.back();
          }
        }}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{collectionTitle}</Text>
        <View style={styles.navBtn} />
      </View>

      {/* Info bar */}
      <View style={styles.infoBar}>
        <Text style={styles.productCount}>
          {products.length} {products.length === 1 ? 'Product' : 'Products'}
        </Text>
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
              showBestSeller={handle === 'best-sellers'}
            />
          </View>
        )}
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
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
    zIndex: 9999,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  navBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  navBtnIcon: {
    fontSize: 28,
    color: '#000',
    fontWeight: '300',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: HEADING_FONT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  emptyIcon: {
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
  },
  infoBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  productCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#303030',
  },
  listContent: {
    padding: 4,
  },
  productItem: {
    flex: 1 / 2,
  },
});
