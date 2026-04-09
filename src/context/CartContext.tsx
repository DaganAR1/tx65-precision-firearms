import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

interface CartItem extends Product {
  quantity: number;
  selectedOptions?: Record<string, string>;
  finalPrice: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, options?: Record<string, string>, finalPrice?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number, options?: Record<string, string>, finalPrice?: number) => {
    setCartItems(prev => {
      const itemPrice = finalPrice || product.price;
      const optionsKey = options ? JSON.stringify(options) : '';
      
      const existingItem = prev.find(item => 
        item.id === product.id && JSON.stringify(item.selectedOptions || {}) === optionsKey
      );

      if (existingItem) {
        return prev.map(item => 
          (item.id === product.id && JSON.stringify(item.selectedOptions || {}) === optionsKey)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // Generate a unique ID for the cart item to allow multiple versions of same product
      const cartItemId = `${product.id}-${Date.now()}`;
      return [...prev, { ...product, cartItemId, quantity, selectedOptions: options, finalPrice: itemPrice } as any];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => (item as any).cartItemId !== cartItemId || item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    setCartItems(prev => 
      prev.map(item => 
        ((item as any).cartItemId === cartItemId || item.id === cartItemId) ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.finalPrice || item.price) * item.quantity, 0);
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      subtotal,
      itemCount
    }}>
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
