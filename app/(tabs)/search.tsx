import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShopifyProduct, ShopifyCollection } from '../../types/shopify';
import { searchProducts, getCollections } from '../../services/shopify';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { ProductCard } from '../../components/ProductCard';

const POPULAR_SEARCHES = [
  'Creed', 'Tom Ford', 'Dior', 'YSL', 'Versace',
  'Men\'s Cologne', 'Women\'s Perfume', 'Gift Sets',
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShopifyProduct[]>([]);
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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
    setTimeout(() => {
      handleSearch();
    }, 100);
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search fragrances..."
            placeholderTextColor={Colors.mediumGray}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.black} />
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      ) : !searched ? (
        <ScrollView>
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

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            {collections.map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={styles.categoryItem}
                onPress={() => router.push(`/collection/${collection.handle}`)}
              >
                <Text style={styles.categoryTitle}>{collection.title}</Text>
                <Text style={styles.categoryArrow}>→</Text>
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
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  searchContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 25,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 16,
  },
  clearIcon: {
    fontSize: 18,
    color: Colors.mediumGray,
    padding: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading,
    marginBottom: Spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  tagText: {
    ...Typography.body,
    fontWeight: '500',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  categoryTitle: {
    ...Typography.subheading,
  },
  categoryArrow: {
    fontSize: 18,
    color: Colors.mediumGray,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    ...Typography.body,
    padding: Spacing.md,
    backgroundColor: Colors.lightGray,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.xs,
  },
  productItem: {
    flex: 1 / 2,
  },
});
