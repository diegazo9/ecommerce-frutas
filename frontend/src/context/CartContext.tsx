import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../services/api';

export interface CartItem extends Product {
  cartQuantity: number;
  formatLabel?: string;
  purchaseMode?: 'kg' | 'unit';
  unitCount?: number;
  unitFactor?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (
    product: Product, 
    quantity?: number, 
    formatLabel?: string, 
    purchaseMode?: 'kg' | 'unit',
    unitCount?: number,
    unitFactor?: number
  ) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  increaseItem: (productId: number) => void;
  decreaseItem: (productId: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('vibranfrut_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vibranfrut_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (
    product: Product, 
    quantity: number = 1, 
    formatLabel?: string,
    purchaseMode?: 'kg' | 'unit',
    unitCount?: number,
    unitFactor?: number
  ) => {
    const mode = purchaseMode || (formatLabel?.toLowerCase().includes('unid') || product.unit === 'und' ? 'unit' : 'kg');
    const factor = unitFactor || (mode === 'unit' ? (product.unit === 'kg' ? 0.25 : 1.0) : 0.5);
    const count = unitCount || (mode === 'unit' ? Math.max(1, Math.round(quantity / factor)) : 1);

    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (mode === 'unit') {
          const currentCount = existing.unitCount || Math.max(1, Math.round(existing.cartQuantity / factor));
          const newCount = currentCount + count;
          const newQty = Number((newCount * factor).toFixed(2));
          const newLabel = `${newCount} ${newCount === 1 ? 'Unidad' : 'Unidades'}${product.unit === 'kg' ? ` (aprox. ${newCount * 250 >= 1000 ? `${(newCount * 250) / 1000} kg` : `${newCount * 250}g`})` : ''}`;
          return prev.map(item => 
            item.id === product.id ? { 
              ...item, 
              cartQuantity: newQty,
              formatLabel: newLabel,
              purchaseMode: 'unit',
              unitCount: newCount,
              unitFactor: factor 
            } : item
          );
        } else {
          const newQty = Number((existing.cartQuantity + quantity).toFixed(2));
          return prev.map(item => 
            item.id === product.id ? { 
              ...item, 
              cartQuantity: newQty,
              formatLabel: formatLabel || item.formatLabel,
              purchaseMode: 'kg'
            } : item
          );
        }
      }
      return [...prev, { 
        ...product, 
        cartQuantity: Number(quantity.toFixed(2)),
        formatLabel,
        purchaseMode: mode,
        unitCount: count,
        unitFactor: factor
      }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const increaseItem = (productId: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id !== productId) return item;
      const isUnit = item.purchaseMode === 'unit' || item.formatLabel?.toLowerCase().includes('unid') || item.unit === 'und';
      if (isUnit) {
        const factor = item.unitFactor || (item.unit === 'kg' ? 0.25 : 1.0);
        const currentCount = item.unitCount || Math.max(1, Math.round(item.cartQuantity / factor));
        const newCount = currentCount + 1;
        const newQty = Number((newCount * factor).toFixed(2));
        const newLabel = `${newCount} ${newCount === 1 ? 'Unidad' : 'Unidades'}${item.unit === 'kg' ? ` (aprox. ${newCount * 250 >= 1000 ? `${(newCount * 250) / 1000} kg` : `${newCount * 250}g`})` : ''}`;
        return {
          ...item,
          purchaseMode: 'unit',
          unitCount: newCount,
          unitFactor: factor,
          cartQuantity: newQty,
          formatLabel: newLabel
        };
      } else {
        const newQty = Number((item.cartQuantity + 0.5).toFixed(2));
        return {
          ...item,
          purchaseMode: 'kg',
          cartQuantity: newQty
        };
      }
    }));
  };

  const decreaseItem = (productId: number) => {
    setCartItems(prev => {
      const item = prev.find(i => i.id === productId);
      if (!item) return prev;
      const isUnit = item.purchaseMode === 'unit' || item.formatLabel?.toLowerCase().includes('unid') || item.unit === 'und';
      if (isUnit) {
        const factor = item.unitFactor || (item.unit === 'kg' ? 0.25 : 1.0);
        const currentCount = item.unitCount || Math.max(1, Math.round(item.cartQuantity / factor));
        if (currentCount <= 1) {
          return prev.filter(i => i.id !== productId);
        }
        const newCount = currentCount - 1;
        const newQty = Number((newCount * factor).toFixed(2));
        const newLabel = `${newCount} ${newCount === 1 ? 'Unidad' : 'Unidades'}${item.unit === 'kg' ? ` (aprox. ${newCount * 250 >= 1000 ? `${(newCount * 250) / 1000} kg` : `${newCount * 250}g`})` : ''}`;
        return prev.map(i => i.id === productId ? {
          ...i,
          purchaseMode: 'unit',
          unitCount: newCount,
          unitFactor: factor,
          cartQuantity: newQty,
          formatLabel: newLabel
        } : i);
      } else {
        if (item.cartQuantity <= 0.5) {
          return prev.filter(i => i.id !== productId);
        }
        const newQty = Number((item.cartQuantity - 0.5).toFixed(2));
        return prev.map(i => i.id === productId ? {
          ...i,
          purchaseMode: 'kg',
          cartQuantity: newQty
        } : i);
      }
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0.05) return removeFromCart(productId);
    const rounded = Number(quantity.toFixed(2));
    setCartItems(prev => prev.map(item => 
      item.id === productId ? { ...item, cartQuantity: rounded } : item
    ));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((total, item) => total + (Number(item.price) * item.cartQuantity), 0);
  const cartCount = cartItems.length;

  return (
    <CartContext.Provider value={{ 
      cartItems, addToCart, removeFromCart, updateQuantity, increaseItem, decreaseItem, clearCart, cartTotal, cartCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
