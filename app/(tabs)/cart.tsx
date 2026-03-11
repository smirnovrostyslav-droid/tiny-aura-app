import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useCart } from '../../services/cartContext';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function CartScreen() {
  const { cart, loading, updateQuantity, removeFromCart } = useCart();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  const cartLines = cart?.lines.edges || [];
  const isEmpty = cartLines.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Text style={styles.emptySubtext}>
          Add some fragrances to get started
        </Text>
      </View>
    );
  }

  async function handleCheckout() {
    if (cart?.checkoutUrl) {
      await Linking.openURL(cart.checkoutUrl);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartLines}
        keyExtractor={(item) => item.node.id}
        renderItem={({ item }) => {
          const line = item.node;
          const product = line.merchandise.product;
          const image = product?.images?.edges?.[0]?.node;

          return (
            <View style={styles.cartItem}>
              <Image
                source={{ uri: image?.url || 'https://via.placeholder.com/100' }}
                style={styles.cartImage}
                resizeMode="contain"
              />
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
                  onPress={() => removeFromCart(line.id)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
                
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      if (line.quantity > 1) {
                        updateQuantity(line.id, line.quantity - 1);
                      }
                    }}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{line.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(line.id, line.quantity + 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
      
      {cart && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalAmount}>
              ${parseFloat(cart.cost.totalAmount.amount).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
          </TouchableOpacity>
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
    padding: Spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  cartImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  cartInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  productTitle: {
    ...Typography.subheading,
    marginBottom: Spacing.xs,
  },
  variantTitle: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  price: {
    ...Typography.price,
    fontSize: 16,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  removeButton: {
    padding: Spacing.xs,
  },
  removeButtonText: {
    fontSize: 20,
    color: Colors.mediumGray,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: Colors.lightGray,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  quantity: {
    ...Typography.body,
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '600',
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalLabel: {
    ...Typography.heading,
  },
  totalAmount: {
    ...Typography.price,
    fontSize: 24,
    fontWeight: '700',
  },
  checkoutButton: {
    backgroundColor: Colors.black,
    borderRadius: 25,
    padding: Spacing.md,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
