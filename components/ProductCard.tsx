import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ShopifyProduct } from '../types/shopify';
import { useWishlist } from '../services/wishlistContext';
import { optimizeImageUrl } from '../services/shopify';

const BADGE_GREEN = '#2E7D32';
const BADGE_RED = '#C41E3A';

interface ProductCardProps {
  product: ShopifyProduct;
  onPress: () => void;
  showBestSeller?: boolean;
}

export function ProductCard({ product, onPress, showBestSeller = false }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const image = product.images.edges[0]?.node;
  const price = product.priceRange.minVariantPrice;
  const comparePrice = product.compareAtPriceRange?.minVariantPrice;
  const inWishlist = isInWishlist(product.id);
  const hasDiscount = comparePrice && parseFloat(comparePrice.amount) > parseFloat(price.amount);

  // Calculate discount percentage
  const discountPercent = hasDiscount && comparePrice
    ? Math.round((1 - parseFloat(price.amount) / parseFloat(comparePrice.amount)) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8} accessibilityLabel={`${product.title}, from $${parseFloat(price.amount).toFixed(2)}`} accessibilityRole="button">
      <View style={styles.imageContainer}>
        {image ? (
          <Image
            source={{ uri: optimizeImageUrl(image.url, 400) }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Badges */}
        <View style={styles.badgeContainer}>
          {showBestSeller && (
            <View style={[styles.badge, { backgroundColor: BADGE_GREEN }]}>
              <Text style={styles.badgeText}>Best Seller</Text>
            </View>
          )}
          {discountPercent > 0 && (
            <View style={[styles.badge, { backgroundColor: BADGE_RED }]}>
              <Text style={styles.badgeText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Wishlist heart */}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => {
            toggleWishlist(product.id);
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          accessibilityRole="button"
        >
          <Text style={styles.heartIcon}>{inWishlist ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        {product.vendor ? (
          <Text style={styles.vendor} numberOfLines={1}>{product.vendor}</Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.priceFrom}>From </Text>
          {hasDiscount && comparePrice && (
            <Text style={styles.priceOriginal}>
              ${parseFloat(comparePrice.amount).toFixed(2)}
            </Text>
          )}
          <Text style={[styles.price, hasDiscount && styles.priceOnSale]}>
            ${parseFloat(price.amount).toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    aspectRatio: 1 / 1.3,
    backgroundColor: '#f8f8f8',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 22,
  },
  heartIcon: {
    fontSize: 18,
  },
  info: {
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
    lineHeight: 20,
    marginBottom: 2,
  },
  vendor: {
    fontSize: 13,
    fontWeight: '400',
    color: '#555',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  priceFrom: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
  },
  priceOriginal: {
    fontSize: 14,
    color: '#000',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
  },
  priceOnSale: {
    color: BADGE_RED,
    fontWeight: '600',
  },
});
