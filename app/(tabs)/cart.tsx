import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Toast } from '../../components/Toast';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { useCart } from '../../services/cartContext';
import { getCollectionProducts, optimizeImageUrl } from '../../services/shopify';
import { Ionicons } from '@expo/vector-icons';
import { ShopifyProduct } from '../../types/shopify';

const BURGUNDY = '#780b0c';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart, loading, updateQuantity, removeFromCart, refreshCart, addToCart } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingLines, setUpdatingLines] = useState<Set<string>>(new Set());
  const [upsellProducts, setUpsellProducts] = useState<ShopifyProduct[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '' });

  useEffect(() => {
    loadUpsellProducts();
  }, []);

  async function loadUpsellProducts() {
    try {
      const products = await getCollectionProducts('best-sellers');
      setUpsellProducts(products.slice(0, 6));
    } catch {
      // Silently fail - upsell is optional
    }
  }

  const safeUpdateQuantity = useCallback(async (lineId: string, quantity: number) => {
    if (updatingLines.has(lineId)) return;
    setUpdatingLines(prev => new Set(prev).add(lineId));
    try {
      await updateQuantity(lineId, quantity);
    } finally {
      setUpdatingLines(prev => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
    }
  }, [updateQuantity, updatingLines]);

  const safeRemoveFromCart = useCallback(async (lineId: string) => {
    if (updatingLines.has(lineId)) return;
    setUpdatingLines(prev => new Set(prev).add(lineId));
    try {
      await removeFromCart(lineId);
    } finally {
      setUpdatingLines(prev => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
    }
  }, [removeFromCart, updatingLines]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={BURGUNDY} />
      </View>
    );
  }

  const cartLines = cart?.lines.edges || [];
  const isEmpty = cartLines.length === 0;

  if (isEmpty) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.emptyEmoji}>{'🛒'}</Text>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Text style={styles.emptySubtext}>Add some fragrances to get started</Text>
      </View>
    );
  }

  async function handleCheckout() {
    if (cart?.checkoutUrl) {
      setCheckoutLoading(true);
      try {
        await WebBrowser.openBrowserAsync(cart.checkoutUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: '#780b0c',
          toolbarColor: '#ffffff',
        });
      } catch (error) {
        console.error('Error opening checkout:', error);
      } finally {
        setCheckoutLoading(false);
      }
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refreshCart();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <Text style={styles.headerCount}>{cartLines.length} {cartLines.length === 1 ? 'item' : 'items'}</Text>
      </View>

      <FlatList
        data={cartLines}
        keyExtractor={(item) => item.node.id}
        renderItem={({ item }) => {
          const line = item.node;
          const product = line.merchandise.product;
          const image = product?.images?.edges?.[0]?.node;

          return (
            <View style={styles.cartItem}>
              {image?.url ? (
                <Image
                  source={{ uri: image.url }}
                  style={styles.cartImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.cartImage, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#999', fontSize: 10 }}>No Image</Text>
                </View>
              )}
              <View style={styles.cartInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {product?.title || 'Product'}
                </Text>
                <Text style={styles.variantTitle}>{line.merchandise.title}</Text>
                <Text style={styles.price}>
                  ${parseFloat(line.merchandise.price.amount).toFixed(2)}
                </Text>
              </View>

              <View style={styles.rightSection}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => safeRemoveFromCart(line.id)}
                  disabled={updatingLines.has(line.id)}
                  accessibilityLabel="Remove from cart"
                  accessibilityRole="button"
                >
                  {updatingLines.has(line.id) ? (
                    <ActivityIndicator size="small" color="#999" />
                  ) : (
                    <Ionicons name="close" size={18} color="#999" />
                  )}
                </TouchableOpacity>

                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={[styles.quantityButton, line.quantity <= 1 && { opacity: 0.4 }]}
                    onPress={() => {
                      if (line.quantity > 1) {
                        safeUpdateQuantity(line.id, line.quantity - 1);
                      }
                    }}
                    disabled={line.quantity <= 1 || updatingLines.has(line.id)}
                    accessibilityLabel="Decrease quantity"
                    accessibilityRole="button"
                  >
                    <Text style={styles.quantityButtonText}>{'−'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity} accessibilityLabel={`Quantity ${line.quantity}`}>{line.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => safeUpdateQuantity(line.id, line.quantity + 1)}
                    disabled={updatingLines.has(line.id)}
                    accessibilityLabel="Increase quantity"
                    accessibilityRole="button"
                  >
                    <Text style={styles.quantityButtonText}>{'+'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <>
            {upsellProducts.length > 0 && (
              <View style={styles.upsellSection}>
                <Text style={styles.upsellTitle}>You May Also Like</Text>
                <FlatList
                  data={upsellProducts}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingHorizontal: 4 }}
                  renderItem={({ item: product }) => {
                    const img = product.images?.edges?.[0]?.node;
                    const price = product.priceRange?.minVariantPrice;
                    const firstVariant = product.variants?.edges?.[0]?.node;
                    return (
                      <View style={styles.upsellCard}>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/product/${product.handle}`)}>
                          {img ? (
                            <ExpoImage source={{ uri: optimizeImageUrl(img.url, 300) }} style={styles.upsellImg} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                          ) : (
                            <View style={[styles.upsellImg, { backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: '#999' }}>No Image</Text></View>
                          )}
                        </TouchableOpacity>
                        <Text style={styles.upsellName} numberOfLines={2}>{product.title}</Text>
                        <Text style={styles.upsellPrice}>From ${parseFloat(price?.amount || '0').toFixed(2)}</Text>
                        <TouchableOpacity
                          style={styles.upsellAddBtn}
                          onPress={async () => {
                            if (!firstVariant) return;
                            try {
                              await addToCart(firstVariant.id, 1);
                              setToast({ visible: true, message: `${product.title} added to cart` });
                            } catch {
                              setToast({ visible: true, message: 'Could not add to cart' });
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.upsellAddBtnText}>+ Add</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
              </View>
            )}
            <View style={{ height: 200 }} />
          </>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#780b0c" colors={['#780b0c']} />}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        onHide={() => setToast({ visible: false, message: '' })}
      />

      {cart && (() => {
        const subtotal = parseFloat(cart.cost.totalAmount.amount);
        const FREE_SHIP = 59;
        const remaining = FREE_SHIP - subtotal;
        const progress = Math.min(subtotal / FREE_SHIP, 1);
        return (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            {/* Free shipping progress */}
            {remaining > 0 ? (
              <View style={styles.shippingProgress}>
                <Text style={styles.shippingProgressText}>
                  You're <Text style={{ fontWeight: '700' }}>${remaining.toFixed(2)}</Text> away from free shipping! (Free on orders $59+)
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
                </View>
              </View>
            ) : (
              <View style={styles.shippingProgress}>
                <Text style={[styles.shippingProgressText, { color: '#2E7D32' }]}>
                  🎉 Free shipping on your order!
                </Text>
              </View>
            )}

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalAmount}>
                ${subtotal.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.shippingNote}>Shipping & taxes calculated at checkout</Text>
            <TouchableOpacity style={[styles.checkoutButton, checkoutLoading && { opacity: 0.7 }]} onPress={handleCheckout} disabled={checkoutLoading} accessibilityLabel="Checkout" accessibilityRole="button">
              {checkoutLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })()}
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
    fontFamily: Platform.OS === 'web' ? 'Cormorant, serif' : 'serif',
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
    fontFamily: Platform.OS === 'web' ? 'Cormorant, serif' : 'serif',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  cartImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  cartInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 3,
  },
  variantTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#999',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    minWidth: 44,
    minHeight: 44,
    backgroundColor: '#f5f5f5',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
    color: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  shippingNote: {
    fontSize: 11,
    color: '#999',
    marginBottom: 10,
  },
  checkoutButton: {
    backgroundColor: BURGUNDY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  shippingProgress: {
    marginBottom: 6,
    backgroundColor: '#f0faf0',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#d4edda',
  },
  shippingProgressText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e6e6e6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },
  // Upsell section
  upsellSection: {
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
    paddingTop: 20,
    marginTop: 8,
  },
  upsellTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    fontFamily: Platform.OS === 'web' ? 'Cormorant, serif' : 'serif',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  upsellCard: {
    width: 150,
    marginHorizontal: 6,
  },
  upsellImg: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
  },
  upsellName: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000',
    marginTop: 8,
    lineHeight: 16,
  },
  upsellPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
  },
  upsellAddBtn: {
    backgroundColor: BURGUNDY,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  upsellAddBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
