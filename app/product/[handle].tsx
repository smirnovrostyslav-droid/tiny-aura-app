import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShopifyProduct, ShopifyProductVariant } from '../../types/shopify';
import { getProductByHandle } from '../../services/shopify';
import { useCart } from '../../services/cartContext';
import { useWishlist } from '../../services/wishlistContext';
import { Colors, Spacing, Typography } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (handle) {
      loadProduct();
    }
  }, [handle]);

  async function loadProduct() {
    try {
      const data = await getProductByHandle(handle);
      setProduct(data);
      
      // Set default variant
      if (data.variants.edges.length > 0) {
        setSelectedVariant(data.variants.edges[0].node);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!product) return;
    const url = `https://tinyaura.us/products/${handle}`;
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: product.title, url });
        } else {
          await navigator.clipboard.writeText(url);
          Alert.alert('Link Copied', 'Product link copied to clipboard');
        }
      } else {
        await Share.share({ message: `${product.title}\n${url}`, url });
      }
    } catch (_) {}
  }

  async function handleAddToCart() {
    if (!selectedVariant) {
      Alert.alert('Error', 'Please select a variant');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(selectedVariant.id, 1);
      Alert.alert(
        'Added to Cart',
        'Product successfully added to your cart',
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart');
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const images = product.images.edges.map((edge) => edge.node);
  const variants = product.variants.edges.map((edge) => edge.node);
  const inWishlist = isInWishlist(product.id);

  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => {
          if (Platform.OS === 'web' && window.history.length > 1) {
            window.history.back();
          } else {
            router.back();
          }
        }}>
          <Text style={styles.headerBtnIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => toggleWishlist(product.id)}>
            <Text style={styles.headerBtnIcon}>{inWishlist ? '♥' : '♡'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
            <Text style={styles.headerShareIcon}>⬆</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {images.length > 0 ? (
              images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image.url }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ))
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </ScrollView>

          {/* Image Dots */}
          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentImageIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{product.title}</Text>
              <Text style={styles.price}>
                ${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Variants */}
          {variants.length > 1 && (
            <>
              <Text style={styles.sectionTitle}>Select Size</Text>
              <View style={styles.variantsContainer}>
                {variants.map((variant) => (
                  <TouchableOpacity
                    key={variant.id}
                    style={[
                      styles.variantPill,
                      selectedVariant?.id === variant.id &&
                        styles.variantPillActive,
                      !variant.availableForSale && styles.variantPillDisabled,
                    ]}
                    onPress={() => setSelectedVariant(variant)}
                    disabled={!variant.availableForSale}
                  >
                    <Text
                      style={[
                        styles.variantText,
                        selectedVariant?.id === variant.id &&
                          styles.variantTextActive,
                        !variant.availableForSale &&
                          styles.variantTextDisabled,
                      ]}
                    >
                      {variant.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (!selectedVariant?.availableForSale || addingToCart) &&
              styles.addToCartButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={!selectedVariant?.availableForSale || addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.addToCartButtonText}>
              {selectedVariant?.availableForSale
                ? 'ADD TO CART'
                : 'OUT OF STOCK'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  floatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'web' ? 8 : 50,
    paddingBottom: 8,
    backgroundColor: '#fff',
    zIndex: 9999,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    ...(Platform.OS === 'web' ? { position: 'relative' as any } : {}),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  headerBtnIcon: {
    fontSize: 28,
    color: '#1a1a1a',
    fontWeight: '300',
  },
  headerShareIcon: {
    fontSize: 22,
    color: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.heading,
  },
  imageGallery: {
    height: width,
    backgroundColor: Colors.white,
  },
  productImage: {
    width,
    height: width,
    backgroundColor: Colors.white,
  },
  placeholderImage: {
    width,
    height: width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
  },
  placeholderText: {
    ...Typography.body,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mediumGray,
    opacity: 0.5,
  },
  dotActive: {
    backgroundColor: Colors.black,
    opacity: 1,
  },
  infoContainer: {
    padding: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  price: {
    ...Typography.price,
    fontSize: 28,
    fontWeight: '700',
  },
  wishlistButton: {
    padding: Spacing.sm,
  },
  wishlistIcon: {
    fontSize: 32,
  },
  sectionTitle: {
    ...Typography.heading,
    fontSize: 18,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  description: {
    ...Typography.body,
    lineHeight: 22,
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  variantPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  variantPillActive: {
    borderColor: Colors.black,
    backgroundColor: Colors.black,
  },
  variantPillDisabled: {
    opacity: 0.5,
  },
  variantText: {
    ...Typography.subheading,
    fontSize: 14,
    fontWeight: '600',
  },
  variantTextActive: {
    color: Colors.white,
  },
  variantTextDisabled: {
    color: Colors.mediumGray,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  addToCartButton: {
    backgroundColor: Colors.black,
    borderRadius: 25,
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  addToCartButtonDisabled: {
    backgroundColor: Colors.mediumGray,
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
