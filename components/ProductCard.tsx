import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Text, View } from 'react-native';
import { ShopifyProduct } from '../types/shopify';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useWishlist } from '../services/wishlistContext';

interface ProductCardProps {
  product: ShopifyProduct;
  onPress: () => void;
  showNewBadge?: boolean;
}

export function ProductCard({ product, onPress, showNewBadge = false }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const image = product.images.edges[0]?.node;
  const price = product.priceRange.minVariantPrice;
  const comparePrice = product.compareAtPriceRange?.minVariantPrice;
  const inWishlist = isInWishlist(product.id);
  const hasDiscount = comparePrice && parseFloat(comparePrice.amount) > parseFloat(price.amount);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image
            source={{ uri: image.url }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        
        {/* BESTSELLER badge */}
        {showNewBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>BESTSELLER</Text>
          </View>
        )}
        
        {/* Wishlist heart */}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          activeOpacity={0.7}
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
          {hasDiscount && (
            <Text style={styles.priceOriginal}>
              ${parseFloat(comparePrice.amount).toFixed(2)}
            </Text>
          )}
          <Text style={styles.price}>
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
    margin: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageContainer: {
    aspectRatio: 0.85,
    backgroundColor: '#FAF5F0',
    position: 'relative',
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
    backgroundColor: Colors.lightGray,
  },
  placeholderText: {
    ...Typography.caption,
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.badgeRed,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 24,
  },
  info: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 2,
  },
  vendor: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.mediumGray,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  priceOriginal: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
  },
});
