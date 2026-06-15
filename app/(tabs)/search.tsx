import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShopifyProduct, ShopifyCollection } from '../../types/shopify';
import { searchProducts, getCollections } from '../../services/shopify';
import { ProductCard } from '../../components/ProductCard';
import { Ionicons } from '@expo/vector-icons';

const BURGUNDY = '#780b0c';

const POPULAR_SEARCHES = [
  'Creed', 'Tom Ford', 'Dior', 'YSL', 'Versace',
  'Men\'s Cologne', 'Women\'s Perfume', 'Gift Sets',
  'Baccarat Rouge', 'Aventus',
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShopifyProduct[]>([]);
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    try {
      const data = await getCollections();
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const products = await searchProducts(query);
      setResults(products);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handlePopularSearch(term: string) {
    setQuery(term);
    // Search directly with the term to avoid stale state from setQuery batching
    searchDirectly(term);
  }

  async function searchDirectly(term: string) {
    if (!term.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const products = await searchProducts(term);
      setResults(products);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function onRefreshResults() {
    if (!query.trim()) return;
    setRefreshing(true);
    try {
      const products = await searchProducts(query);
      setResults(products);
    } catch (error) {
      console.error('Search refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search fragrances..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color="#999" style={styles.clearIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BURGUNDY} />
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>{'🔍'}</Text>
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      ) : !searched ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Popular Searches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Searches</Text>
            <View style={styles.tagsContainer}>
              {POPULAR_SEARCHES.map((term, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  onPress={() => handlePopularSearch(term)}
                >
                  <Text style={styles.tagText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Browse Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            {collections.filter((c) => c.handle !== 'frontpage' && c.handle !== 'new').map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={styles.categoryItem}
                onPress={() => router.push(`/collection/${collection.handle}`)}
              >
                <Text style={styles.categoryTitle}>{collection.title}</Text>
                <Text style={styles.categoryArrow}>{'>'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {results.length} {results.length === 1 ? 'result' : 'results'} found
          </Text>
          <FlatList
            data={results}
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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefreshResults} tintColor="#780b0c" colors={['#780b0c']} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    fontFamily: Platform.OS === 'web' ? 'Cormorant, serif' : 'serif',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  clearIcon: {
    fontSize: 16,
    color: '#999',
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: Platform.OS === 'web' ? 'Cormorant, serif' : 'serif',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: Platform.OS === 'web' ? 'Cormorant, serif' : 'serif',
    marginBottom: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#303030',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  categoryArrow: {
    fontSize: 16,
    color: '#999',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#303030',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 4,
  },
  productItem: {
    flex: 1 / 2,
  },
});
