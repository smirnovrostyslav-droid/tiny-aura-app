import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShopifyCart } from '../types/shopify';
import {
  createCart,
  addToCart as apiAddToCart,
  updateCartLine,
  removeFromCart as apiRemoveFromCart,
  getCart,
} from './shopify';

interface CartContextType {
  cart: ShopifyCart | null;
  loading: boolean;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_ID_KEY = '@tiny-aura-cart-id';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [loading, setLoading] = useState(true);

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      const cartId = await AsyncStorage.getItem(CART_ID_KEY);
      
      if (cartId) {
        try {
          const existingCart = await getCart(cartId);
          setCart(existingCart);
        } catch (error) {
          console.error('Error loading cart:', error);
          // Cart might be invalid, create a new one
          await initializeNewCart();
        }
      } else {
        await initializeNewCart();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  }

  async function initializeNewCart() {
    const newCart = await createCart();
    setCart(newCart);
    await AsyncStorage.setItem(CART_ID_KEY, newCart.id);
  }

  async function addToCart(variantId: string, quantity: number) {
    try {
      if (!cart) {
        await initializeNewCart();
        // Re-fetch cart to ensure we have the latest state
        const cartId = await AsyncStorage.getItem(CART_ID_KEY);
        if (!cartId) throw new Error('Failed to create cart');
        const updatedCart = await apiAddToCart(cartId, variantId, quantity);
        setCart(updatedCart);
      } else {
        const updatedCart = await apiAddToCart(cart.id, variantId, quantity);
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async function updateQuantity(lineId: string, quantity: number) {
    if (!cart) return;

    try {
      const updatedCart = await updateCartLine(cart.id, lineId, quantity);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  }

  async function removeFromCart(lineId: string) {
    if (!cart) return;

    try {
      const updatedCart = await apiRemoveFromCart(cart.id, lineId);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  function getCartItemCount(): number {
    if (!cart) return 0;
    return cart.lines.edges.reduce((total, edge) => total + edge.node.quantity, 0);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
